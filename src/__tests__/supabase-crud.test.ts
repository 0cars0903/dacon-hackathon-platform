/**
 * 팀/포럼/메시지/팔로우 CRUD 테스트
 *
 * Supabase data layer의 쓰기(INSERT/UPDATE/DELETE) 작업과
 * 복합 조회(JOIN, 필터링) 로직을 검증합니다.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  TEST_TEAM_ROW,
  TEST_FORUM_POST_ROW,
  TEST_DM_ROW,
} from "./helpers/supabase-mock";

// ─── Supabase 체이닝 모킹 ─────────────────────────────────────
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
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-001" } }, error: null }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    },
  }),
}));

// ─── 테스트 대상 임포트 ────────────────────────────────────────
import {
  createTeam,
  updateTeam,
  deleteTeam,
  requestJoinTeam,
  leaveTeam,
  sendTeamMessage,
  getTeamMessages,
  createForumPost,
  createForumComment,
  getForumPosts,
  getForumComments,
  toggleForumPostLike,
  toggleForumCommentLike,
  sendMessage,
  getConversation,
  getConversationList,
  markMessagesRead,
  getUnreadMessageCount,
  followUser,
  unfollowUser,
  isFollowing,
  getFollowCounts,
  logActivity,
  getActivityFeed,
  addNotification,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/supabase/data";

beforeEach(() => {
  vi.clearAllMocks();
  tableBuilders = {};
});

// ============================================================
// TEAM CRUD
// ============================================================
describe("Team CRUD", () => {
  it("createTeam — 팀 + 팀장 멤버 생성", async () => {
    setTable("teams", null, null);
    setTable("team_members", null, null);

    const result = await createTeam({
      teamCode: "NEW01",
      hackathonSlug: "test-hack-2026",
      name: "새팀",
      creatorId: "user-001",
      creatorName: "테스트유저",
      lookingFor: ["ML"],
      intro: "안녕하세요",
    });

    expect(result).toBe(true);
    expect(mockFrom).toHaveBeenCalledWith("teams");
    expect(mockFrom).toHaveBeenCalledWith("team_members");
  });

  it("createTeam — DB 에러 시 false", async () => {
    setTable("teams", null, { message: "duplicate key" });
    const result = await createTeam({
      teamCode: "DUPE",
      hackathonSlug: "hack",
      name: "팀",
      creatorId: "u1",
      creatorName: "유저",
    });
    expect(result).toBe(false);
  });

  it("updateTeam — 부분 업데이트 성공", async () => {
    setTable("teams", null, null);
    const result = await updateTeam("TEAM001", { name: "변경된팀명", isOpen: false });
    expect(result).toBe(true);
  });

  it("deleteTeam — 관련 데이터 모두 삭제", async () => {
    setTable("team_members", null, null);
    setTable("team_join_requests", null, null);
    setTable("team_chat_messages", null, null);
    setTable("team_invitations", null, null);
    setTable("teams", null, null);

    const result = await deleteTeam("TEAM001");
    expect(result).toBe(true);
    // 5개 테이블 모두 호출됨
    expect(mockFrom).toHaveBeenCalledWith("team_members");
    expect(mockFrom).toHaveBeenCalledWith("team_join_requests");
    expect(mockFrom).toHaveBeenCalledWith("team_chat_messages");
    expect(mockFrom).toHaveBeenCalledWith("team_invitations");
    expect(mockFrom).toHaveBeenCalledWith("teams");
  });

  it("requestJoinTeam (auto) — 자동 가입", async () => {
    // team 조회: auto join policy
    setTable("teams", { join_policy: "auto", is_open: true });
    // 기존 멤버 확인: 없음
    setTable("team_members", null);

    const result = await requestJoinTeam("TEAM001", "user-002", "새멤버");
    // auto이므로 바로 joined
    expect(result.status).toBe("joined");
  });

  it("requestJoinTeam — 팀 없으면 error", async () => {
    setTable("teams", null);
    const result = await requestJoinTeam("INVALID", "user-001", "유저");
    expect(result.status).toBe("error");
    expect(result.error).toContain("찾을 수 없습니다");
  });

  it("requestJoinTeam — 모집 마감 팀 error", async () => {
    setTable("teams", { join_policy: "auto", is_open: false });
    const result = await requestJoinTeam("CLOSED", "user-001", "유저");
    expect(result.status).toBe("error");
    expect(result.error).toContain("마감");
  });

  it("leaveTeam — 일반 멤버 탈퇴 성공", async () => {
    setTable("teams", { creator_id: "user-001" });
    setTable("team_members", null, null);

    // user-002(팀장 아님)이 탈퇴
    const result = await leaveTeam("TEAM001", "user-002");
    expect(result.success).toBe(true);
  });

  it("leaveTeam — 팀장은 탈퇴 불가", async () => {
    setTable("teams", { creator_id: "user-001" });
    const result = await leaveTeam("TEAM001", "user-001");
    expect(result.success).toBe(false);
    expect(result.error).toContain("팀장");
  });
});

// ============================================================
// TEAM CHAT
// ============================================================
describe("Team Chat", () => {
  it("sendTeamMessage — 메시지 전송 성공", async () => {
    setTable("team_chat_messages", null, null);
    const result = await sendTeamMessage("TEAM001", "user-001", "유저", "안녕하세요");
    expect(result).toBe(true);
  });

  it("getTeamMessages — 메시지 목록 조회", async () => {
    setTable("team_chat_messages", [
      { id: "msg1", team_code: "TEAM001", sender_id: "user-001", sender_name: "유저", content: "첫 메시지", created_at: "2026-01-01" },
      { id: "msg2", team_code: "TEAM001", sender_id: "user-002", sender_name: "다른유저", content: "답장", created_at: "2026-01-02" },
    ]);

    const result = await getTeamMessages("TEAM001");
    expect(result).toHaveLength(2);
    expect(result[0].senderId).toBe("user-001");
    expect(result[1].content).toBe("답장");
  });
});

// ============================================================
// FORUM CRUD
// ============================================================
describe("Forum CRUD", () => {
  it("getForumPosts — 해커톤별 포럼글 조회", async () => {
    setTable("forum_posts", [TEST_FORUM_POST_ROW]);
    const result = await getForumPosts("test-hack-2026");
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: "post-001",
      hackathonSlug: "test-hack-2026",
      authorId: "user-001",
      title: "질문 있습니다",
      category: "question",
    });
  });

  it("getForumComments — 게시글별 댓글 조회", async () => {
    setTable("forum_comments", [
      { id: "c1", post_id: "post-001", author_id: "user-002", author_name: "답변자", author_nickname: null, content: "도움이 되었나요?", likes: [], created_at: "2026-02-02" },
    ]);
    const result = await getForumComments("post-001");
    expect(result).toHaveLength(1);
    expect(result[0].authorName).toBe("답변자");
  });

  it("createForumPost — 새 글 작성", async () => {
    setTable("forum_posts", { ...TEST_FORUM_POST_ROW, id: "new-post" });
    const result = await createForumPost({
      hackathonSlug: "test-hack-2026",
      authorId: "user-001",
      authorName: "유저",
      title: "새 질문",
      content: "내용",
      category: "question",
    });
    expect(result).toBeDefined();
    expect(result!.hackathonSlug).toBe("test-hack-2026");
  });

  it("createForumComment — 댓글 작성", async () => {
    setTable("forum_comments", {
      id: "new-comment", post_id: "post-001", author_id: "user-002",
      author_name: "답변자", author_nickname: null, content: "답변입니다",
      likes: [], created_at: "2026-03-01",
    });

    const result = await createForumComment({
      postId: "post-001",
      authorId: "user-002",
      authorName: "답변자",
      content: "답변입니다",
    });
    expect(result).toBeDefined();
    expect(result!.content).toBe("답변입니다");
  });

  it("toggleForumPostLike — 좋아요 토글 (추가)", async () => {
    setTable("forum_posts", { likes: [] }); // 현재 likes 없음
    const result = await toggleForumPostLike("post-001", "user-001");
    expect(result).toBe(true);
  });

  it("toggleForumCommentLike — 좋아요 토글", async () => {
    setTable("forum_comments", { likes: ["user-001"] }); // 이미 좋아요
    const result = await toggleForumCommentLike("c1", "user-001");
    expect(result).toBe(true);
  });
});

// ============================================================
// DIRECT MESSAGES
// ============================================================
describe("Direct Messages", () => {
  it("sendMessage — DM 전송", async () => {
    setTable("direct_messages", { ...TEST_DM_ROW, id: "new-dm" });
    const result = await sendMessage("user-001", "유저1", "user-002", "유저2", "안녕!");
    expect(result).toBeDefined();
    expect(result!.senderId).toBe("user-001");
  });

  it("getConversation — 대화 내역 조회", async () => {
    setTable("direct_messages", [
      TEST_DM_ROW,
      { ...TEST_DM_ROW, id: "dm-002", sender_id: "user-002", receiver_id: "user-001", content: "답장" },
    ]);
    const result = await getConversation("user-001", "user-002");
    expect(result).toHaveLength(2);
  });

  it("getConversationList — 대화 목록", async () => {
    setTable("direct_messages", [
      TEST_DM_ROW,
      { ...TEST_DM_ROW, id: "dm-003", sender_id: "user-003", sender_name: "세번째유저", receiver_id: "user-001", content: "다른 대화", created_at: "2026-02-16" },
    ]);
    const result = await getConversationList("user-001");
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0]).toHaveProperty("partnerId");
    expect(result[0]).toHaveProperty("lastMessage");
  });

  it("markMessagesRead — 읽음 처리 성공", async () => {
    setTable("direct_messages", null, null);
    await expect(markMessagesRead("user-001", "user-002")).resolves.toBeUndefined();
  });

  it("getUnreadMessageCount — 안읽은 메시지 수", async () => {
    setTable("direct_messages", [{ id: "dm-1" }, { id: "dm-2" }]);
    const result = await getUnreadMessageCount("user-001");
    expect(result).toBe(2);
  });

  it("getUnreadMessageCount — 0건", async () => {
    setTable("direct_messages", []);
    const result = await getUnreadMessageCount("user-001");
    expect(result).toBe(0);
  });
});

// ============================================================
// FOLLOWS
// ============================================================
describe("Follows", () => {
  it("followUser — 팔로우 성공", async () => {
    setTable("follows", null, null);
    const result = await followUser("user-001", "user-002");
    expect(result).toBe(true);
  });

  it("unfollowUser — 언팔로우 성공", async () => {
    setTable("follows", null, null);
    const result = await unfollowUser("user-001", "user-002");
    expect(result).toBe(true);
  });

  it("isFollowing — 팔로우 중이면 true", async () => {
    setTable("follows", { id: "f1" });
    const result = await isFollowing("user-001", "user-002");
    expect(result).toBe(true);
  });

  it("isFollowing — 팔로우 안 하면 false", async () => {
    setTable("follows", null);
    const result = await isFollowing("user-001", "user-999");
    expect(result).toBe(false);
  });

  it("getFollowCounts — 팔로워/팔로잉 수", async () => {
    setTable("follows", [{ id: "f1" }, { id: "f2" }]);
    const result = await getFollowCounts("user-001");
    expect(result).toHaveProperty("followers");
    expect(result).toHaveProperty("following");
    expect(typeof result.followers).toBe("number");
  });
});

// ============================================================
// ACTIVITY FEED
// ============================================================
describe("Activity Feed", () => {
  it("logActivity — 활동 로그 저장", async () => {
    setTable("activity_feed", null, null);
    await expect(
      logActivity({
        type: "team_created",
        message: "새 팀이 생성되었습니다",
        timestamp: new Date().toISOString(),
        hackathonSlug: "test-hack-2026",
      })
    ).resolves.toBeUndefined();
  });

  it("getActivityFeed — 최근 활동 조회", async () => {
    setTable("activity_feed", [
      { id: "a1", type: "team_created", message: "팀 생성", created_at: "2026-01-01", hackathon_slug: "hack1", metadata: null },
      { id: "a2", type: "submission", message: "제출 완료", created_at: "2026-01-02", hackathon_slug: null, metadata: { score: 85 } },
    ]);
    const result = await getActivityFeed();
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ id: "a1", type: "team_created" });
    expect(result[1].metadata).toEqual({ score: 85 });
  });
});

// ============================================================
// NOTIFICATIONS
// ============================================================
describe("Notifications", () => {
  it("addNotification — 알림 추가", async () => {
    setTable("notifications", null, null);
    await expect(
      addNotification("user-001", {
        message: "새로운 팀 초대가 있습니다",
        link: "/teams",
        type: "info",
      })
    ).resolves.toBeUndefined();
  });

  it("getNotifications — 알림 목록 조회", async () => {
    setTable("notifications", [
      { id: "n1", message: "알림1", read: false, created_at: "2026-03-01", link: "/test", type: "info" },
      { id: "n2", message: "알림2", read: true, created_at: "2026-03-02", link: null, type: "success" },
    ]);
    const result = await getNotifications("user-001");
    expect(result).toHaveLength(2);
    expect(result[0].read).toBe(false);
    expect(result[1].type).toBe("success");
  });

  it("markNotificationRead — 단일 읽음 처리", async () => {
    setTable("notifications", null, null);
    await expect(markNotificationRead("n1")).resolves.toBeUndefined();
  });

  it("markAllNotificationsRead — 전체 읽음 처리", async () => {
    setTable("notifications", null, null);
    await expect(markAllNotificationsRead("user-001")).resolves.toBeUndefined();
  });
});
