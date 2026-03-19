/**
 * Submissions + Leaderboard + Admin CRUD 테스트
 *
 * 제출 저장/조회, 리더보드 업데이트, 관리자 해커톤 CRUD를 검증합니다.
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

import {
  getSubmission,
  saveSubmission,
  getSubmissionsByHackathon,
  getUserSubmissions,
  getUserSubmission,
  saveFullSubmission,
  saveSubmissionScore,
  getLeaderboard,
  getAllLeaderboards,
  updateLeaderboard,
  createHackathon,
  updateHackathon,
  deleteHackathon,
  changeHackathonStatus,
  createTeamInvitation,
  getInvitationByCode,
  acceptInvitation,
  rejectInvitation,
  joinByInviteCode,
} from "@/lib/supabase/data";

beforeEach(() => {
  vi.clearAllMocks();
  tableBuilders = {};
});

// ============================================================
// SUBMISSIONS
// ============================================================
describe("Submissions", () => {
  it("getSubmission — 특정 유저의 특정 해커톤 제출물", async () => {
    setTable("submissions", {
      hackathon_slug: "hack-1",
      user_id: "user-001",
      items: [{ key: "model", value: "v1.py" }],
      status: "submitted",
      saved_at: "2026-03-01",
    });

    const result = await getSubmission("hack-1", "user-001");
    expect(result).toBeDefined();
    expect(result!.hackathonSlug).toBe("hack-1");
    expect(result!.status).toBe("submitted");
    expect(result!.items).toHaveLength(1);
  });

  it("getSubmission — 없으면 undefined", async () => {
    setTable("submissions", null);
    const result = await getSubmission("hack-1", "user-999");
    expect(result).toBeUndefined();
  });

  it("saveSubmission — 드래프트 저장 (upsert)", async () => {
    setTable("submissions", null, null);
    const result = await saveSubmission("hack-1", "user-001", {
      items: [{ key: "model", value: "v2.py" }],
      status: "draft",
    });
    expect(result).toBe(true);
  });

  it("getSubmissionsByHackathon — 해커톤별 전체 제출물", async () => {
    setTable("submissions", [
      {
        id: "sub-1", hackathon_slug: "hack-1", user_id: "user-001", user_name: "유저1",
        version: 1, items: [], files: [], status: "submitted",
        score: 85, score_details: { scoringResult: { success: true } }, saved_at: "2026-03-01",
      },
      {
        id: "sub-2", hackathon_slug: "hack-1", user_id: "user-002", user_name: "유저2",
        version: 2, items: [], files: [], status: "submitted",
        score: 90, score_details: null, saved_at: "2026-03-02",
      },
    ]);

    const result = await getSubmissionsByHackathon("hack-1");
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("sub-1");
    expect(result[0].score).toBe(85);
    expect(result[1].scoreDetails).toBeNull();
  });

  it("getUserSubmissions — 유저별 전체 제출물", async () => {
    setTable("submissions", [
      { id: "s1", hackathon_slug: "h1", user_id: "u1", user_name: "유저", version: 1, items: [], files: [], status: "submitted", score: null, score_details: null, saved_at: "2026-03-01" },
    ]);
    const result = await getUserSubmissions("u1");
    expect(result).toHaveLength(1);
  });

  it("getUserSubmission — 특정 해커톤의 최신 버전", async () => {
    setTable("submissions", {
      id: "s1", hackathon_slug: "h1", user_id: "u1", user_name: "유저",
      version: 3, items: [], files: [], status: "submitted",
      score: 92, score_details: null, saved_at: "2026-03-01",
    });
    const result = await getUserSubmission("h1", "u1");
    expect(result).toBeDefined();
    expect(result!.version).toBe(3);
  });

  it("saveFullSubmission — 버전 자동 증가 + 저장", async () => {
    setTable("submissions", { version: 2 }); // 현재 최대 버전

    const result = await saveFullSubmission("hack-1", "user-001", "유저1", {
      items: [{ key: "model", value: "v3.py" }],
      files: [{ name: "model.h5", size: 1024, type: "application/octet-stream" }],
      status: "submitted",
    });
    expect(result).toBe(true);
  });

  it("saveSubmissionScore — 점수 저장", async () => {
    setTable("submissions", null, null);
    const result = await saveSubmissionScore("sub-1", 85.5, {
      accuracy: 85.5, macroF1: 80.2,
    });
    expect(result).toBe(true);
  });
});

// ============================================================
// LEADERBOARD
// ============================================================
describe("Leaderboard", () => {
  it("getLeaderboard — 해커톤별 리더보드", async () => {
    setTable("leaderboards", {
      hackathon_slug: "hack-1",
      eval_type: "metric",
      metric_name: "Accuracy",
      metric_formula: null,
      metric_columns: [],
      rounds: [],
      entries: [
        { rank: 1, teamName: "TeamA", score: 95.5, submittedAt: "2026-03-01" },
        { rank: 2, teamName: "TeamB", score: 90.2, submittedAt: "2026-03-02" },
      ],
      updated_at: "2026-03-02",
    });

    const result = await getLeaderboard("hack-1");
    expect(result).toBeDefined();
    expect(result!.hackathonSlug).toBe("hack-1");
    expect(result!.evalType).toBe("metric");
    expect(result!.entries).toHaveLength(2);
    expect(result!.entries[0].score).toBe(95.5);
  });

  it("getLeaderboard — 없으면 undefined", async () => {
    setTable("leaderboards", null);
    const result = await getLeaderboard("nonexistent");
    expect(result).toBeUndefined();
  });

  it("getAllLeaderboards — 전체 리더보드", async () => {
    setTable("leaderboards", [
      { hackathon_slug: "h1", eval_type: "metric", metric_name: "F1", metric_formula: null, metric_columns: [], rounds: [], entries: [], updated_at: "2026-03-01" },
      { hackathon_slug: "h2", eval_type: "judge", metric_name: "Score", metric_formula: null, metric_columns: [], rounds: [], entries: [], updated_at: "2026-03-02" },
    ]);
    const result = await getAllLeaderboards();
    expect(result).toHaveLength(2);
  });

  it("updateLeaderboard — 엔트리 업데이트", async () => {
    setTable("leaderboards", null, null);
    const result = await updateLeaderboard("hack-1", [
      { rank: 1, teamName: "팀A", score: 98, submittedAt: "2026-03-15" },
    ]);
    expect(result).toBe(true);
  });
});

// ============================================================
// ADMIN HACKATHON CRUD
// ============================================================
describe("Admin Hackathon CRUD", () => {
  it("createHackathon — 새 해커톤 생성", async () => {
    setTable("hackathons", null, null);
    const result = await createHackathon({
      slug: "new-hack-2026",
      title: "새 해커톤",
      status: "upcoming",
      tags: ["AI", "Vision"],
    });
    expect(result).toBe(true);
  });

  it("createHackathon — 중복 slug 에러", async () => {
    setTable("hackathons", null, { message: "duplicate key" });
    const result = await createHackathon({
      slug: "existing-hack",
      title: "중복",
    });
    expect(result).toBe(false);
  });

  it("updateHackathon — 부분 업데이트", async () => {
    setTable("hackathons", null, null);
    const result = await updateHackathon("hack-1", {
      title: "수정된 제목",
      status: "ongoing",
    });
    expect(result).toBe(true);
  });

  it("deleteHackathon — 관련 데이터 함께 삭제", async () => {
    setTable("hackathon_details", null, null);
    setTable("leaderboards", null, null);
    setTable("hackathons", null, null);

    const result = await deleteHackathon("hack-1");
    expect(result).toBe(true);
    expect(mockFrom).toHaveBeenCalledWith("hackathon_details");
    expect(mockFrom).toHaveBeenCalledWith("leaderboards");
    expect(mockFrom).toHaveBeenCalledWith("hackathons");
  });

  it("changeHackathonStatus — 상태 변경", async () => {
    setTable("hackathons", null, null);
    const result = await changeHackathonStatus("hack-1", "ended");
    expect(result).toBe(true);
  });
});

// ============================================================
// TEAM INVITATIONS
// ============================================================
describe("Team Invitations", () => {
  it("createTeamInvitation — 초대 생성", async () => {
    setTable("team_invitations", {
      id: "inv-1", team_code: "TEAM001", team_name: "테스트팀",
      hackathon_slug: "hack-1", invite_code: "ABC123",
      inviter_id: "user-001", inviter_name: "유저1",
      invitee_id: "user-002", invitee_name: "유저2",
      status: "pending", created_at: "2026-03-01",
      expires_at: "2026-03-03",
    });

    const result = await createTeamInvitation(
      "TEAM001", "테스트팀", "hack-1",
      "user-001", "유저1", "user-002", "유저2"
    );
    expect(result).toBeDefined();
    expect(result!.teamCode).toBe("TEAM001");
    expect(result!.status).toBe("pending");
    expect(result!.inviteCode).toBeTruthy();
  });

  it("getInvitationByCode — 초대 코드로 조회", async () => {
    setTable("team_invitations", {
      id: "inv-1", team_code: "TEAM001", team_name: "팀",
      hackathon_slug: "h1", invite_code: "XYZ789",
      inviter_id: "u1", inviter_name: "유저",
      invitee_id: null, invitee_name: null,
      status: "pending", created_at: "2026-03-01", expires_at: "2026-03-03",
    });

    const result = await getInvitationByCode("XYZ789");
    expect(result).toBeDefined();
    expect(result!.inviteCode).toBe("XYZ789");
  });

  it("acceptInvitation — 초대 수락 + 멤버 추가", async () => {
    setTable("team_invitations", {
      id: "inv-1", team_code: "TEAM001", status: "pending",
    });
    setTable("team_members", null, null);

    const result = await acceptInvitation("inv-1", "user-002", "유저2");
    expect(result).toBe(true);
  });

  it("acceptInvitation — 이미 수락된 초대 거부", async () => {
    setTable("team_invitations", {
      id: "inv-1", team_code: "TEAM001", status: "accepted",
    });

    const result = await acceptInvitation("inv-1", "user-002", "유저2");
    expect(result).toBe(false);
  });

  it("rejectInvitation — 초대 거절", async () => {
    setTable("team_invitations", null, null);
    const result = await rejectInvitation("inv-1");
    expect(result).toBe(true);
  });

  it("joinByInviteCode — 유효하지 않은 코드", async () => {
    setTable("team_invitations", null); // .single() → null
    const result = await joinByInviteCode("INVALID", "user-001", "유저");
    expect(result.success).toBe(false);
    expect(result.error).toContain("유효하지 않은");
  });
});
