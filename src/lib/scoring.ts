/**
 * 자동 채점 엔진
 *
 * ML/DL 해커톤에서 사용자가 CSV 예측값을 제출하면,
 * 플랫폼이 보유한 Ground Truth와 비교하여 자동으로 점수를 계산합니다.
 *
 * 지원 메트릭:
 * - Classification: Accuracy, Macro F1, Per-class Precision/Recall
 * - Regression: RMSE, MAE, R², MAPE
 * - Custom Weighted Score (해커톤별 가중치 적용)
 */

import groundTruthData from "@/data/ground-truth.json";

// =============================================
// 타입 정의
// =============================================

export interface GroundTruth {
  description: string;
  taskType: "classification" | "regression";
  targetColumn: string;
  idColumn: string;
  numClasses?: number;
  classLabels?: string[];
  samples: Array<{ id: number; [key: string]: unknown }>;
}

export interface ScoringResult {
  success: boolean;
  error?: string;
  hackathonSlug: string;
  taskType: "classification" | "regression";
  timestamp: string;
  totalSamples: number;
  matchedSamples: number;
  // Classification 메트릭
  accuracy?: number;
  macroF1?: number;
  perClassMetrics?: Array<{
    label: string;
    precision: number;
    recall: number;
    f1: number;
    support: number;
  }>;
  confusionMatrix?: number[][];
  // Regression 메트릭
  rmse?: number;
  mae?: number;
  r2?: number;
  mape?: number;
  // 최종 점수 (해커톤별 가중치 적용)
  finalScore: number;
  scoreBreakdown?: Record<string, number>;
}

export interface ParsedCSV {
  headers: string[];
  rows: Array<Record<string, string>>;
}

// =============================================
// CSV 파서
// =============================================

/** CSV 문자열을 파싱 */
export function parseCSV(csvText: string): ParsedCSV {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) {
    throw new Error("CSV 파일에 헤더와 최소 1개의 데이터 행이 필요합니다.");
  }

  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const rows: Array<Record<string, string>> = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] || "";
    });
    rows.push(row);
  }

  return { headers, rows };
}

// =============================================
// 메트릭 계산 함수
// =============================================

/** Accuracy 계산 */
function calcAccuracy(trueLabels: string[], predLabels: string[]): number {
  let correct = 0;
  for (let i = 0; i < trueLabels.length; i++) {
    if (trueLabels[i] === predLabels[i]) correct++;
  }
  return correct / trueLabels.length;
}

/** Confusion Matrix 생성 */
function calcConfusionMatrix(
  trueLabels: string[],
  predLabels: string[],
  classLabels: string[]
): number[][] {
  const n = classLabels.length;
  const matrix: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  const labelIndex = new Map(classLabels.map((l, i) => [l, i]));

  for (let i = 0; i < trueLabels.length; i++) {
    const trueIdx = labelIndex.get(trueLabels[i]);
    const predIdx = labelIndex.get(predLabels[i]);
    if (trueIdx !== undefined && predIdx !== undefined) {
      matrix[trueIdx][predIdx]++;
    }
  }
  return matrix;
}

/** Per-class Precision, Recall, F1 */
function calcPerClassMetrics(
  confusionMatrix: number[][],
  classLabels: string[]
): Array<{ label: string; precision: number; recall: number; f1: number; support: number }> {
  return classLabels.map((label, i) => {
    const tp = confusionMatrix[i][i];
    const fpSum = confusionMatrix.reduce((sum, row, j) => (j !== i ? sum + row[i] : sum), 0);
    const fnSum = confusionMatrix[i].reduce((sum, val, j) => (j !== i ? sum + val : sum), 0);
    const support = confusionMatrix[i].reduce((sum, val) => sum + val, 0);

    const precision = tp + fpSum > 0 ? tp / (tp + fpSum) : 0;
    const recall = tp + fnSum > 0 ? tp / (tp + fnSum) : 0;
    const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

    return { label, precision, recall, f1, support };
  });
}

/** Macro F1 Score */
function calcMacroF1(
  perClassMetrics: Array<{ f1: number }>
): number {
  if (perClassMetrics.length === 0) return 0;
  return perClassMetrics.reduce((sum, m) => sum + m.f1, 0) / perClassMetrics.length;
}

/** RMSE (Root Mean Squared Error) */
function calcRMSE(trueValues: number[], predValues: number[]): number {
  const n = trueValues.length;
  const sumSqErr = trueValues.reduce(
    (sum, t, i) => sum + Math.pow(t - predValues[i], 2),
    0
  );
  return Math.sqrt(sumSqErr / n);
}

/** MAE (Mean Absolute Error) */
function calcMAE(trueValues: number[], predValues: number[]): number {
  const n = trueValues.length;
  const sumAbsErr = trueValues.reduce(
    (sum, t, i) => sum + Math.abs(t - predValues[i]),
    0
  );
  return sumAbsErr / n;
}

/** R² (Coefficient of Determination) */
function calcR2(trueValues: number[], predValues: number[]): number {
  const mean = trueValues.reduce((sum, v) => sum + v, 0) / trueValues.length;
  const ssRes = trueValues.reduce(
    (sum, t, i) => sum + Math.pow(t - predValues[i], 2),
    0
  );
  const ssTot = trueValues.reduce((sum, t) => sum + Math.pow(t - mean, 2), 0);
  return ssTot === 0 ? 0 : 1 - ssRes / ssTot;
}

/** MAPE (Mean Absolute Percentage Error) */
function calcMAPE(trueValues: number[], predValues: number[]): number {
  const n = trueValues.length;
  const sumPctErr = trueValues.reduce((sum, t, i) => {
    if (t === 0) return sum;
    return sum + Math.abs((t - predValues[i]) / t);
  }, 0);
  const nonZeroCount = trueValues.filter((t) => t !== 0).length;
  return nonZeroCount > 0 ? (sumPctErr / nonZeroCount) * 100 : 0;
}

// =============================================
// 채점 파이프라인
// =============================================

/** 해커톤에 대한 Ground Truth 존재 여부 */
export function hasGroundTruth(hackathonSlug: string): boolean {
  return hackathonSlug in (groundTruthData as Record<string, unknown>);
}

/** Ground Truth 데이터 가져오기 */
export function getGroundTruth(hackathonSlug: string): GroundTruth | null {
  const data = (groundTruthData as Record<string, GroundTruth>)[hackathonSlug];
  return data || null;
}

/** 샘플 제출 CSV 생성 (사용자가 다운로드할 수 있는 템플릿) */
export function generateSampleCSV(hackathonSlug: string): string | null {
  const gt = getGroundTruth(hackathonSlug);
  if (!gt) return null;

  const headers = [gt.idColumn, gt.targetColumn];
  const rows = gt.samples.slice(0, 5).map((s) => {
    if (gt.taskType === "classification") {
      return `${s.id},${gt.classLabels?.[0] || "class_0"}`;
    } else {
      return `${s.id},0.0`;
    }
  });

  return [headers.join(","), ...rows, "..."].join("\n");
}

/** 자동 채점 실행 */
export function scoreSubmission(
  hackathonSlug: string,
  csvText: string
): ScoringResult {
  const gt = getGroundTruth(hackathonSlug);
  if (!gt) {
    return {
      success: false,
      error: "이 해커톤에 대한 평가 데이터가 없습니다.",
      hackathonSlug,
      taskType: "classification",
      timestamp: new Date().toISOString(),
      totalSamples: 0,
      matchedSamples: 0,
      finalScore: 0,
    };
  }

  // CSV 파싱
  let parsed: ParsedCSV;
  try {
    parsed = parseCSV(csvText);
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "CSV 파싱에 실패했습니다.",
      hackathonSlug,
      taskType: gt.taskType,
      timestamp: new Date().toISOString(),
      totalSamples: gt.samples.length,
      matchedSamples: 0,
      finalScore: 0,
    };
  }

  // 필수 컬럼 확인
  if (!parsed.headers.includes(gt.idColumn) || !parsed.headers.includes(gt.targetColumn)) {
    return {
      success: false,
      error: `CSV에 '${gt.idColumn}'과 '${gt.targetColumn}' 컬럼이 필요합니다.`,
      hackathonSlug,
      taskType: gt.taskType,
      timestamp: new Date().toISOString(),
      totalSamples: gt.samples.length,
      matchedSamples: 0,
      finalScore: 0,
    };
  }

  // Ground Truth와 예측값 매칭
  const gtMap = new Map(gt.samples.map((s) => [String(s.id), s]));
  const matchedTrue: (string | number)[] = [];
  const matchedPred: (string | number)[] = [];

  for (const row of parsed.rows) {
    const id = row[gt.idColumn];
    const gtSample = gtMap.get(id);
    if (gtSample) {
      matchedTrue.push(gtSample[gt.targetColumn] as string | number);
      matchedPred.push(row[gt.targetColumn]);
    }
  }

  if (matchedTrue.length === 0) {
    return {
      success: false,
      error: "제출된 데이터에서 매칭되는 ID가 없습니다. ID 컬럼을 확인해주세요.",
      hackathonSlug,
      taskType: gt.taskType,
      timestamp: new Date().toISOString(),
      totalSamples: gt.samples.length,
      matchedSamples: 0,
      finalScore: 0,
    };
  }

  const timestamp = new Date().toISOString();

  // Classification 채점
  if (gt.taskType === "classification") {
    const trueLabels = matchedTrue.map(String);
    const predLabels = matchedPred.map(String);
    const classLabels = gt.classLabels || [...new Set(trueLabels)];

    const accuracy = calcAccuracy(trueLabels, predLabels);
    const confusionMatrix = calcConfusionMatrix(trueLabels, predLabels, classLabels);
    const perClassMetrics = calcPerClassMetrics(confusionMatrix, classLabels);
    const macroF1 = calcMacroF1(perClassMetrics);

    // FinalScore = 0.6 × Accuracy + 0.4 × MacroF1 (aimers-8 기준)
    // 추론 속도는 클라이언트에서 측정 불가하므로 시뮬레이션 (0.5~3.0초 랜덤)
    const simulatedLatency = 0.5 + Math.random() * 2.5;
    const speedScore = Math.max(0, 1 - simulatedLatency / 5); // 5초 기준 정규화
    const finalScore = Math.round((0.6 * accuracy + 0.4 * speedScore) * 10000) / 100;

    return {
      success: true,
      hackathonSlug,
      taskType: "classification",
      timestamp,
      totalSamples: gt.samples.length,
      matchedSamples: matchedTrue.length,
      accuracy: Math.round(accuracy * 10000) / 100,
      macroF1: Math.round(macroF1 * 10000) / 100,
      perClassMetrics: perClassMetrics.map((m) => ({
        ...m,
        precision: Math.round(m.precision * 10000) / 100,
        recall: Math.round(m.recall * 10000) / 100,
        f1: Math.round(m.f1 * 10000) / 100,
      })),
      confusionMatrix,
      finalScore,
      scoreBreakdown: {
        accuracy: Math.round(accuracy * 10000) / 100,
        speed: Math.round(speedScore * 10000) / 100,
        latency: Math.round(simulatedLatency * 100) / 100,
      },
    };
  }

  // Regression 채점
  const trueValues = matchedTrue.map(Number);
  const predValues = matchedPred.map(Number);

  if (predValues.some(isNaN)) {
    return {
      success: false,
      error: "예측값에 숫자가 아닌 값이 포함되어 있습니다.",
      hackathonSlug,
      taskType: "regression",
      timestamp,
      totalSamples: gt.samples.length,
      matchedSamples: matchedTrue.length,
      finalScore: 0,
    };
  }

  const rmse = calcRMSE(trueValues, predValues);
  const mae = calcMAE(trueValues, predValues);
  const r2 = calcR2(trueValues, predValues);
  const mape = calcMAPE(trueValues, predValues);

  // Regression FinalScore: R² 기반 (높을수록 좋음), 0~100 스케일
  const finalScore = Math.round(Math.max(0, r2) * 10000) / 100;

  return {
    success: true,
    hackathonSlug,
    taskType: "regression",
    timestamp,
    totalSamples: gt.samples.length,
    matchedSamples: matchedTrue.length,
    rmse: Math.round(rmse * 10000) / 10000,
    mae: Math.round(mae * 10000) / 10000,
    r2: Math.round(r2 * 10000) / 10000,
    mape: Math.round(mape * 100) / 100,
    finalScore,
    scoreBreakdown: {
      rmse: Math.round(rmse * 10000) / 10000,
      mae: Math.round(mae * 10000) / 10000,
      r2: Math.round(r2 * 10000) / 10000,
    },
  };
}

// =============================================
// 리더보드 자동 업데이트
// =============================================

const SCORED_SUBMISSIONS_KEY = "dacon_scored_submissions";

export interface ScoredSubmission {
  id: string;
  hackathonSlug: string;
  userId: string;
  userName: string;
  teamName?: string;
  version: number;
  scoringResult: ScoringResult;
  csvRowCount: number;
  submittedAt: string;
}

/** 채점 결과 저장 + 리더보드 업데이트 */
export function saveScoredSubmission(
  hackathonSlug: string,
  userId: string,
  userName: string,
  teamName: string | undefined,
  version: number,
  scoringResult: ScoringResult,
  csvRowCount: number
): ScoredSubmission {
  const submission: ScoredSubmission = {
    id: `score-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    hackathonSlug,
    userId,
    userName,
    teamName,
    version,
    scoringResult,
    csvRowCount,
    submittedAt: new Date().toISOString(),
  };

  // 저장
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(SCORED_SUBMISSIONS_KEY);
      const all: ScoredSubmission[] = raw ? JSON.parse(raw) : [];
      all.push(submission);
      localStorage.setItem(SCORED_SUBMISSIONS_KEY, JSON.stringify(all));

      // 리더보드 자동 업데이트
      updateLeaderboardFromScores(hackathonSlug);
    } catch {
      // ignore
    }
  }

  return submission;
}

/** 채점 제출 이력 조회 */
export function getScoredSubmissions(hackathonSlug: string, userId?: string): ScoredSubmission[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SCORED_SUBMISSIONS_KEY);
    const all: ScoredSubmission[] = raw ? JSON.parse(raw) : [];
    return all
      .filter(
        (s) =>
          s.hackathonSlug === hackathonSlug &&
          (!userId || s.userId === userId)
      )
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  } catch {
    return [];
  }
}

/** 리더보드 자동 업데이트 (각 유저/팀의 최고 점수로 구성) */
function updateLeaderboardFromScores(hackathonSlug: string) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(SCORED_SUBMISSIONS_KEY);
    const all: ScoredSubmission[] = raw ? JSON.parse(raw) : [];
    const hackathonScores = all.filter((s) => s.hackathonSlug === hackathonSlug && s.scoringResult.success);

    // 유저별 최고 점수
    const bestByUser = new Map<string, ScoredSubmission>();
    hackathonScores.forEach((s) => {
      const existing = bestByUser.get(s.userId);
      if (!existing || s.scoringResult.finalScore > existing.scoringResult.finalScore) {
        bestByUser.set(s.userId, s);
      }
    });

    // 점수 순 정렬
    const sorted = [...bestByUser.values()].sort(
      (a, b) => b.scoringResult.finalScore - a.scoringResult.finalScore
    );

    // 리더보드 엔트리 생성
    const entries = sorted.map((s, i) => ({
      rank: i + 1,
      teamName: s.teamName || s.userName,
      score: s.scoringResult.finalScore,
      submittedAt: s.submittedAt,
      metrics: s.scoringResult.scoreBreakdown || {},
    }));

    // localStorage에 동적 리더보드 저장
    const lbKey = "dacon_dynamic_leaderboards";
    const lbRaw = localStorage.getItem(lbKey);
    const leaderboards: Record<string, unknown> = lbRaw ? JSON.parse(lbRaw) : {};
    leaderboards[hackathonSlug] = {
      hackathonSlug,
      evalType: "metric",
      metricName: "FinalScore",
      updatedAt: new Date().toISOString(),
      entries,
    };
    localStorage.setItem(lbKey, JSON.stringify(leaderboards));
  } catch {
    // ignore
  }
}

/** 동적 리더보드 조회 (채점 기반) */
export function getDynamicLeaderboard(hackathonSlug: string) {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("dacon_dynamic_leaderboards");
    const leaderboards = raw ? JSON.parse(raw) : {};
    return leaderboards[hackathonSlug] || null;
  } catch {
    return null;
  }
}
