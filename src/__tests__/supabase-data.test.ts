/**
 * Supabase Data Layer 단위 테스트
 *
 * data.ts의 핵심 함수들이 올바른 Supabase 쿼리를 수행하고
 * 결과를 올바른 타입으로 매핑하는지 검증합니다.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  TEST_HACKATHON_ROW,
  TEST_TEAM_ROW,
  TEST_PROFILE_ROW,
} from "./helpers/supabase-mock";

// ─── Supabase 클라이언트 모킹 ─────────────────────────────────
// 체이닝 가능한 쿼리 빌더를 생성하는 헬퍼
function chainable(finalData: unknown = null, finalError: unknown = null) {
  const result = { data: finalData, error: finalError };
  const self: Record<string, unknown> = {};
  const methods = [
    "select", "insert", "update", "upsert", "delete",
    "eq", "neq", "in", "or", "not",
    "order", "limit", "range", "single", "maybeSingle",
    "is", "gt", "lt", "gte", "lte",
  ];
  for (const m of methods) {
    self[m] = vi.fn().mockReturnValue(self);
  }
  // 최종적으로 await 시 result 반환
  self.then = (resolve: (v: unknown) => void) => resolve(result);
  self.single = vi.fn().mockResolvedValue(result);
  self.maybeSingle = vi.fn().mockResolvedValue(result);
  return self;
}

// 테이블별 모킹 저장소
let tableBuilders: Record<string, ReturnType<typeof chainable>> = {};

function setTable(table: string, data: unknown, error: unknown = null) {
  tableBuilders[table] = chainable(data, error);
}

const mockFrom = vi.fn().mockImplementation((table: string) => {
  if (!tableBuilders[table]) {
    tableBuilders[table] = chainable(null, null);
  }
  return tableBuilders[table];
});

const mockClient = { from: mockFrom };

// createDataClient를 모킹
vi.mock("@/lib/supabase/client", () => ({
  createDataClient: () => mockClient,
  createClient: () => ({
    ...mockClient,
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    },
  }),
}));

// ─── 테스트 대상 모듈 임포트 ───────────────────────────────────
import {
  getHackathons,
  getAllHackathonsUnfiltered,
  getHackathonBySlug,
  getHackathonDetail,
  getPlatformStats,
  getRecommendedHackathons,
  getTeams,
  getTeamsByHackathon,
  getRecommendedTeams,
  getProfile,
  updateProfile,
  getBookmarks,
  addBookmark,
  removeBookmark,
  isBookmarked,
  getUserPreferences,
  saveUserPreferences,
  getNotificationPrefs,
  saveNotificationPrefs,
} from "@/lib/supabase/data";

// ─── 테스트 ────────────────────────────────────────────────────
beforeEach(() => {
  vi.clearAllMocks();
  tableBuilders = {};
});

// ============================================================
// HACKATHONS
// ============================================================
describe("Hackathons", () => {
  it("getHackathons — ongoing/upcoming 필터링 및 매핑", async () => {
    setTable("hackathons", [TEST_HACKATHON_ROW]);

    const result = await getHackathons();

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      slug: "test-hack-2026",
      title: "테스트 해커톤 2026",
      status: "ongoing",
      tags: ["AI", "ML"],
      thumbnailUrl: "https://example.com/thumb.png",
      period: {
        timezone: "Asia/Seoul",
        submissionDeadlineAt: "2026-04-01T00:00:00+09:00",
        endAt: "2026-04-15T00:00:00+09:00",
      },
      links: {
        detail: "/hackathons/test-hack-2026",
        rules: "/rules",
        faq: "/faq",
      },
    });
  });

  it("getHackathons — 빈 결과 시 빈 배열 반환", async () => {
    setTable("hackathons", []);
    const result = await getHackathons();
    expect(result).toEqual([]);
  });

  it("getHackathons — 에러 시 빈 배열 반환", async () => {
    setTable("hackathons", null, { message: "DB error" });
    const result = await getHackathons();
    expect(result).toEqual([]);
  });

  it("getAllHackathonsUnfiltered — 모든 해커톤 조회", async () => {
    setTable("hackathons", [TEST_HACKATHON_ROW, { ...TEST_HACKATHON_ROW, slug: "hack-2", status: "ended" }]);
    const result = await getAllHackathonsUnfiltered();
    expect(result).toHaveLength(2);
  });

  it("getHackathonBySlug — 단일 해커톤 조회", async () => {
    setTable("hackathons", TEST_HACKATHON_ROW);
    const result = await getHackathonBySlug("test-hack-2026");
    expect(result).toBeDefined();
    expect(result!.slug).toBe("test-hack-2026");
  });

  it("getHackathonBySlug — 없는 slug → undefined", async () => {
    setTable("hackathons", null);
    const result = await getHackathonBySlug("nonexistent");
    expect(result).toBeUndefined();
  });

  it("getRecommendedHackathons — 관심 태그 기반 추천", async () => {
    const hacks = [
      { ...TEST_HACKATHON_ROW, slug: "ai-hack", tags: ["AI", "DL"] },
      { ...TEST_HACKATHON_ROW, slug: "web-hack", tags: ["Web", "React"] },
      { ...TEST_HACKATHON_ROW, slug: "ml-hack", tags: ["AI", "ML"] },
    ];
    setTable("hackathons", hacks);

    const result = await getRecommendedHackathons(["AI"]);
    expect(result.length).toBeLessThanOrEqual(5);
    // AI 태그가 있는 것이 먼저 와야 함
    expect(result[0].tags).toContain("AI");
  });

  it("getRecommendedHackathons — 빈 태그 시 최대 5개 반환", async () => {
    setTable("hackathons", Array.from({ length: 10 }, (_, i) => ({
      ...TEST_HACKATHON_ROW, slug: `hack-${i}`,
    })));
    const result = await getRecommendedHackathons([]);
    expect(result).toHaveLength(5);
  });

  it("getPlatformStats — 각 테이블에서 count 조회", async () => {
    // 여러 테이블을 from()으로 호출하므로 hackathons 테이블 하나에 모든 결과 세팅
    setTable("hackathons", [{ slug: "h1" }]);
    setTable("profiles", [{ id: "u1" }, { id: "u2" }]);
    setTable("teams", [{ team_code: "t1" }]);
    setTable("team_members", [{ id: "m1" }]);
    setTable("submissions", [{ id: "s1" }]);

    const result = await getPlatformStats();
    expect(result).toHaveProperty("totalUsers");
    expect(result).toHaveProperty("totalTeams");
    expect(result).toHaveProperty("totalSubmissions");
    expect(typeof result.totalUsers).toBe("number");
  });
});

// ============================================================
// TEAMS
// ============================================================
describe("Teams", () => {
  it("getTeams — 팀 목록 조회 및 멤버 포함", async () => {
    setTable("teams", [TEST_TEAM_ROW]);

    const result = await getTeams();
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      teamCode: "TEAM001",
      hackathonSlug: "test-hack-2026",
      name: "테스트팀",
      isOpen: true,
      joinPolicy: "auto",
      memberCount: 1,
      lookingFor: ["ML", "Backend"],
      intro: "열심히 하겠습니다",
      creatorId: "user-001",
    });
    expect(result[0].members).toHaveLength(1);
    expect(result[0].members![0].role).toBe("팀장");
  });

  it("getTeamsByHackathon — 특정 해커톤 팀 필터", async () => {
    setTable("teams", [TEST_TEAM_ROW]);
    const result = await getTeamsByHackathon("test-hack-2026");
    expect(result).toHaveLength(1);
  });

  it("getTeams — 빈 결과 시 빈 배열", async () => {
    setTable("teams", []);
    const result = await getTeams();
    expect(result).toEqual([]);
  });

  it("getRecommendedTeams — isOpen 팀만 반환", async () => {
    const openTeam = { ...TEST_TEAM_ROW, is_open: true };
    const closedTeam = { ...TEST_TEAM_ROW, team_code: "CLOSED01", is_open: false };
    setTable("teams", [openTeam, closedTeam]);

    const result = await getRecommendedTeams(["ML"]);
    // 모든 결과는 isOpen: true
    result.forEach(t => expect(t.isOpen).toBe(true));
  });
});

// ============================================================
// PROFILES
// ============================================================
describe("Profiles", () => {
  it("getProfile — 프로필 + 배지 + 참가해커톤 + 팀멤버십 조합", async () => {
    setTable("profiles", TEST_PROFILE_ROW);
    setTable("badges", [
      { id: "b1", name: "첫참가", emoji: "🎉", description: "첫 해커톤", earned_at: "2026-01-01", user_id: "user-001" },
    ]);
    setTable("hackathon_participants", [{ hackathon_slug: "test-hack-2026" }]);
    setTable("team_members", [{ team_code: "TEAM001" }]);

    const result = await getProfile("user-001");
    expect(result).toBeDefined();
    expect(result!.name).toBe("테스트유저");
    expect(result!.nickname).toBe("테스터");
    expect(result!.skills).toEqual(["Python", "React"]);
    expect(result!.stats.hackathonsJoined).toBe(2);
    expect(result!.stats.totalScore).toBe(85.5);
    expect(result!.badges).toHaveLength(1);
    expect(result!.badges[0].emoji).toBe("🎉");
    expect(result!.joinedHackathons).toContain("test-hack-2026");
    expect(result!.teamMemberships).toContain("TEAM001");
  });

  it("getProfile — 존재하지 않는 유저 → undefined", async () => {
    setTable("profiles", null);
    const result = await getProfile("nonexistent");
    expect(result).toBeUndefined();
  });

  it("updateProfile — 이름/닉네임/바이오 업데이트", async () => {
    setTable("profiles", null, null); // update 성공 시 error=null
    const result = await updateProfile("user-001", {
      name: "새이름",
      nickname: "새닉네임",
      bio: "새 자기소개",
    });
    expect(result).toBe(true);
    expect(mockFrom).toHaveBeenCalledWith("profiles");
  });
});

// ============================================================
// BOOKMARKS
// ============================================================
describe("Bookmarks", () => {
  it("getBookmarks — 유저별 북마크 목록 조회", async () => {
    setTable("bookmarks", [
      { hackathon_slug: "hack-1" },
      { hackathon_slug: "hack-2" },
    ]);
    const result = await getBookmarks("user-001");
    expect(result).toEqual(["hack-1", "hack-2"]);
  });

  it("getBookmarks — 빈 목록", async () => {
    setTable("bookmarks", []);
    const result = await getBookmarks("user-001");
    expect(result).toEqual([]);
  });

  it("addBookmark — 성공 시 true", async () => {
    setTable("bookmarks", null, null);
    const result = await addBookmark("user-001", "test-hack");
    expect(result).toBe(true);
  });

  it("removeBookmark — 성공 시 true", async () => {
    setTable("bookmarks", null, null);
    const result = await removeBookmark("user-001", "test-hack");
    expect(result).toBe(true);
  });

  it("isBookmarked — 존재 시 true", async () => {
    setTable("bookmarks", { id: "bk-1" });
    const result = await isBookmarked("user-001", "test-hack");
    expect(result).toBe(true);
  });

  it("isBookmarked — 없을 시 false", async () => {
    setTable("bookmarks", null);
    const result = await isBookmarked("user-001", "nonexistent");
    expect(result).toBe(false);
  });
});

// ============================================================
// USER PREFERENCES
// ============================================================
describe("User Preferences", () => {
  it("getUserPreferences — 저장된 값 반환", async () => {
    setTable("user_preferences", {
      theme: "dark",
      color_theme: "purple",
      interest_tags: ["AI", "ML"],
    });
    const result = await getUserPreferences("user-001");
    expect(result).toEqual({
      theme: "dark",
      colorTheme: "purple",
      interestTags: ["AI", "ML"],
    });
  });

  it("getUserPreferences — 없을 때 기본값 반환", async () => {
    setTable("user_preferences", null);
    const result = await getUserPreferences("user-001");
    expect(result.theme).toBe("light");
    expect(result.colorTheme).toBe("blue");
    expect(result.interestTags).toEqual([]);
  });

  it("saveUserPreferences — 성공 시 true", async () => {
    setTable("user_preferences", null, null);
    const result = await saveUserPreferences("user-001", {
      theme: "dark",
      colorTheme: "green",
      interestTags: ["Web"],
    });
    expect(result).toBe(true);
  });
});

// ============================================================
// NOTIFICATION PREFERENCES
// ============================================================
describe("Notification Preferences", () => {
  it("getNotificationPrefs — 저장된 값 + 기본값 병합", async () => {
    setTable("user_preferences", {
      notification_prefs: {
        hackathonDeadline: false,
        teamActivity: true,
      },
    });
    const result = await getNotificationPrefs("user-001");
    expect(result.hackathonDeadline).toBe(false);
    expect(result.teamActivity).toBe(true);
    // 기본값 적용
    expect(result.leaderboardUpdate).toBe(true);
    expect(result.forumReply).toBe(true);
    expect(result.systemNotice).toBe(true);
  });

  it("getNotificationPrefs — null 시 모두 true 기본값", async () => {
    setTable("user_preferences", null);
    const result = await getNotificationPrefs("user-001");
    expect(result.hackathonDeadline).toBe(true);
    expect(result.teamActivity).toBe(true);
    expect(result.leaderboardUpdate).toBe(true);
    expect(result.forumReply).toBe(true);
    expect(result.systemNotice).toBe(true);
  });

  it("saveNotificationPrefs — 성공 시 true", async () => {
    setTable("user_preferences", null, null);
    const result = await saveNotificationPrefs("user-001", {
      hackathonDeadline: false,
      teamActivity: false,
      leaderboardUpdate: true,
      forumReply: true,
      systemNotice: false,
    });
    expect(result).toBe(true);
  });
});
