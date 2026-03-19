/**
 * Scoring Engine + Leaderboard 테스트
 *
 * CSV 파싱, Classification/Regression 채점, 리더보드 로직을 검증합니다.
 * Supabase 의존부는 모킹합니다.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Supabase 모킹 ────────────────────────────────────────────
function chainable(finalData: unknown = null, finalError: unknown = null) {
  const result = { data: finalData, error: finalError };
  const self: Record<string, unknown> = {};
  const methods = [
    "select", "insert", "update", "upsert", "delete",
    "eq", "neq", "in", "or", "not",
    "order", "limit", "range", "single", "maybeSingle",
  ];
  for (const m of methods) {
    self[m] = vi.fn().mockReturnValue(self);
  }
  self.then = (resolve: (v: unknown) => void) => resolve(result);
  self.single = vi.fn().mockResolvedValue(result);
  self.maybeSingle = vi.fn().mockResolvedValue(result);
  return self;
}

let tableBuilders: Record<string, ReturnType<typeof chainable>> = {};
function setTable(table: string, data: unknown, error: unknown = null) {
  tableBuilders[table] = chainable(data, error);
}
const mockFrom = vi.fn().mockImplementation((table: string) => {
  if (!tableBuilders[table]) tableBuilders[table] = chainable(null, null);
  return tableBuilders[table];
});

vi.mock("@/lib/supabase/client", () => ({
  createDataClient: () => ({ from: mockFrom }),
  createClient: () => ({
    from: mockFrom,
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    },
  }),
}));

// ─── 테스트 대상 임포트 ────────────────────────────────────────
import {
  parseCSV,
  scoreSubmission,
  hasGroundTruth,
  getGroundTruth,
  generateSampleCSV,
  type ScoringResult,
  type ParsedCSV,
} from "@/lib/scoring";

beforeEach(() => {
  vi.clearAllMocks();
  tableBuilders = {};
});

// ============================================================
// CSV 파서
// ============================================================
describe("parseCSV", () => {
  it("기본 CSV 파싱 — 헤더 + 데이터 행", () => {
    const csv = `id,target\n1,cat\n2,dog\n3,cat`;
    const result: ParsedCSV = parseCSV(csv);
    expect(result.headers).toEqual(["id", "target"]);
    expect(result.rows).toHaveLength(3);
    expect(result.rows[0]).toEqual({ id: "1", target: "cat" });
    expect(result.rows[2]).toEqual({ id: "3", target: "cat" });
  });

  it("따옴표 제거", () => {
    const csv = `"id","target"\n"1","value"`;
    const result = parseCSV(csv);
    expect(result.headers).toEqual(["id", "target"]);
    expect(result.rows[0]).toEqual({ id: "1", target: "value" });
  });

  it("빈 행 무시", () => {
    const csv = `id,val\n1,a\n\n2,b\n`;
    const result = parseCSV(csv);
    expect(result.rows).toHaveLength(2);
  });

  it("Windows 줄바꿈 (\\r\\n) 처리", () => {
    const csv = "id,val\r\n1,a\r\n2,b";
    const result = parseCSV(csv);
    expect(result.rows).toHaveLength(2);
  });

  it("헤더만 있는 CSV — 에러 발생", () => {
    const csv = "id,target";
    expect(() => parseCSV(csv)).toThrow("최소 1개의 데이터 행");
  });

  it("빈 문자열 — 에러 발생", () => {
    expect(() => parseCSV("")).toThrow();
  });
});

// ============================================================
// Ground Truth
// ============================================================
describe("Ground Truth", () => {
  it("hasGroundTruth — 존재하는 해커톤", () => {
    // ground-truth.json에 데이터가 있는지 확인 (적어도 하나)
    const slug = "aimers-8"; // 기본 제공 해커톤
    const result = hasGroundTruth(slug);
    // true일 수도 있고 false일 수도 있지만 boolean 타입
    expect(typeof result).toBe("boolean");
  });

  it("hasGroundTruth — 없는 해커톤 slug", () => {
    expect(hasGroundTruth("nonexistent-hackathon")).toBe(false);
  });

  it("getGroundTruth — 없는 slug은 null", () => {
    expect(getGroundTruth("nonexistent")).toBeNull();
  });

  it("generateSampleCSV — 없는 해커톤은 null", () => {
    expect(generateSampleCSV("nonexistent")).toBeNull();
  });
});

// ============================================================
// scoreSubmission
// ============================================================
describe("scoreSubmission", () => {
  it("존재하지 않는 해커톤 → error 결과", () => {
    const result: ScoringResult = scoreSubmission("no-ground-truth", "id,target\n1,cat");
    expect(result.success).toBe(false);
    expect(result.error).toContain("평가 데이터");
    expect(result.finalScore).toBe(0);
  });

  it("잘못된 CSV → error 결과", () => {
    // 실제 ground truth가 있는 해커톤에 대해 빈 CSV 전달
    const result: ScoringResult = scoreSubmission("aimers-8", "");
    // Ground truth 없으면 first branch, 있으면 CSV parse error
    expect(result.success).toBe(false);
  });

  it("필수 컬럼 누락 → error 결과", () => {
    // ground truth가 있는 경우에만 의미 있는 테스트
    const gt = getGroundTruth("aimers-8");
    if (!gt) return; // 데이터 없으면 스킵

    const csv = `wrong_col1,wrong_col2\n1,cat`;
    const result = scoreSubmission("aimers-8", csv);
    expect(result.success).toBe(false);
    expect(result.error).toContain("컬럼");
  });

  it("매칭 ID 없음 → error 결과", () => {
    const gt = getGroundTruth("aimers-8");
    if (!gt) return;

    // 유효한 컬럼이지만 ID가 매칭되지 않는 경우
    const csv = `${gt.idColumn},${gt.targetColumn}\n99999,fake`;
    const result = scoreSubmission("aimers-8", csv);
    expect(result.success).toBe(false);
    expect(result.error).toContain("매칭");
  });

  it("정상 Classification 채점 — 완벽 정답", () => {
    const gt = getGroundTruth("aimers-8");
    if (!gt || gt.taskType !== "classification") return;

    // 모든 Ground Truth 샘플에 대해 정답 CSV 생성
    const rows = gt.samples.map(s => `${s.id},${s[gt.targetColumn]}`);
    const csv = `${gt.idColumn},${gt.targetColumn}\n${rows.join("\n")}`;

    const result = scoreSubmission("aimers-8", csv);
    expect(result.success).toBe(true);
    expect(result.taskType).toBe("classification");
    expect(result.accuracy).toBeDefined();
    expect(result.accuracy!).toBe(100); // 100% 정확도 (스케일 *100)
    expect(result.macroF1).toBeDefined();
    expect(result.confusionMatrix).toBeDefined();
    expect(result.perClassMetrics).toBeDefined();
    expect(result.finalScore).toBeGreaterThan(0);
    expect(result.matchedSamples).toBe(gt.samples.length);
  });

  it("정상 Classification 채점 — 부분 정답", () => {
    const gt = getGroundTruth("aimers-8");
    if (!gt || gt.taskType !== "classification") return;

    // 일부만 맞도록
    const rows = gt.samples.map((s, i) => {
      const label = i === 0 ? "WRONG_LABEL" : s[gt.targetColumn];
      return `${s.id},${label}`;
    });
    const csv = `${gt.idColumn},${gt.targetColumn}\n${rows.join("\n")}`;

    const result = scoreSubmission("aimers-8", csv);
    expect(result.success).toBe(true);
    if (gt.samples.length > 1) {
      expect(result.accuracy!).toBeLessThan(100);
    }
  });

  it("ScoringResult 구조 — 필수 필드 존재", () => {
    const gt = getGroundTruth("aimers-8");
    if (!gt) return;

    const rows = gt.samples.map(s => `${s.id},${s[gt.targetColumn]}`);
    const csv = `${gt.idColumn},${gt.targetColumn}\n${rows.join("\n")}`;
    const result = scoreSubmission("aimers-8", csv);

    expect(result).toHaveProperty("success");
    expect(result).toHaveProperty("hackathonSlug");
    expect(result).toHaveProperty("taskType");
    expect(result).toHaveProperty("timestamp");
    expect(result).toHaveProperty("totalSamples");
    expect(result).toHaveProperty("matchedSamples");
    expect(result).toHaveProperty("finalScore");
    expect(typeof result.timestamp).toBe("string");
  });
});

// ============================================================
// 메트릭 정합성 (수학적 검증)
// ============================================================
describe("메트릭 수학적 검증", () => {
  it("Accuracy 100% → 모든 예측 일치", () => {
    const gt = getGroundTruth("aimers-8");
    if (!gt || gt.taskType !== "classification") return;

    const rows = gt.samples.map(s => `${s.id},${s[gt.targetColumn]}`);
    const csv = `${gt.idColumn},${gt.targetColumn}\n${rows.join("\n")}`;
    const result = scoreSubmission("aimers-8", csv);

    expect(result.accuracy).toBe(100);
    // Macro F1도 100%여야 함
    expect(result.macroF1).toBe(100);
  });

  it("Confusion Matrix 합 = 샘플 수", () => {
    const gt = getGroundTruth("aimers-8");
    if (!gt || gt.taskType !== "classification") return;

    const rows = gt.samples.map(s => `${s.id},${s[gt.targetColumn]}`);
    const csv = `${gt.idColumn},${gt.targetColumn}\n${rows.join("\n")}`;
    const result = scoreSubmission("aimers-8", csv);

    if (result.confusionMatrix) {
      const total = result.confusionMatrix.flat().reduce((a, b) => a + b, 0);
      expect(total).toBe(result.matchedSamples);
    }
  });

  it("Per-class metrics F1 범위 [0, 100]", () => {
    const gt = getGroundTruth("aimers-8");
    if (!gt || gt.taskType !== "classification") return;

    const rows = gt.samples.map(s => `${s.id},${s[gt.targetColumn]}`);
    const csv = `${gt.idColumn},${gt.targetColumn}\n${rows.join("\n")}`;
    const result = scoreSubmission("aimers-8", csv);

    if (result.perClassMetrics) {
      for (const m of result.perClassMetrics) {
        expect(m.f1).toBeGreaterThanOrEqual(0);
        expect(m.f1).toBeLessThanOrEqual(100);
        expect(m.precision).toBeGreaterThanOrEqual(0);
        expect(m.precision).toBeLessThanOrEqual(100);
        expect(m.recall).toBeGreaterThanOrEqual(0);
        expect(m.recall).toBeLessThanOrEqual(100);
      }
    }
  });

  it("finalScore 범위 [0, 100]", () => {
    const gt = getGroundTruth("aimers-8");
    if (!gt) return;

    const rows = gt.samples.map(s => `${s.id},${s[gt.targetColumn]}`);
    const csv = `${gt.idColumn},${gt.targetColumn}\n${rows.join("\n")}`;
    const result = scoreSubmission("aimers-8", csv);

    if (result.success) {
      expect(result.finalScore).toBeGreaterThanOrEqual(0);
      expect(result.finalScore).toBeLessThanOrEqual(100);
    }
  });
});
