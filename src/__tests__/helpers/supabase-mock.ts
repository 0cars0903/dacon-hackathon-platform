/**
 * Supabase Client Mock — 모든 데이터 레이어 테스트에서 사용
 *
 * createDataClient()와 createClient()를 모킹하여
 * 실제 Supabase 네트워크 요청 없이 data.ts 함수들을 단위 테스트합니다.
 */
import { vi } from "vitest";

// ─── 체이닝 빌더 (Supabase 쿼리 패턴 모킹) ────────────────────
export interface MockQueryResult {
  data: unknown;
  error: unknown;
}

export function createMockQueryBuilder(defaultResult: MockQueryResult = { data: null, error: null }) {
  let result = { ...defaultResult };

  const builder: Record<string, unknown> = {};

  // Chainable methods
  const chainMethods = [
    "select", "insert", "update", "upsert", "delete",
    "eq", "neq", "in", "or", "not",
    "order", "limit", "range",
    "is", "gt", "lt", "gte", "lte",
    "like", "ilike", "match", "filter",
    "textSearch", "contains", "containedBy",
  ];

  for (const method of chainMethods) {
    builder[method] = vi.fn().mockReturnValue(builder);
  }

  // Terminal methods
  builder.single = vi.fn().mockImplementation(() => Promise.resolve(result));
  builder.maybeSingle = vi.fn().mockImplementation(() => Promise.resolve(result));
  builder.then = undefined; // Make it thenable at the builder level

  // Override the default promise resolution
  const originalBuilder = { ...builder };

  // Make the builder itself resolve as a promise when awaited
  const thenableBuilder = new Proxy(builder, {
    get(target, prop) {
      if (prop === "then") {
        return (resolve: (value: MockQueryResult) => void) => resolve(result);
      }
      return target[prop as string];
    },
  });

  // Reassign chainable methods to return the proxy
  for (const method of chainMethods) {
    (thenableBuilder as Record<string, unknown>)[method] = vi.fn().mockReturnValue(thenableBuilder);
  }
  (thenableBuilder as Record<string, unknown>).single = vi.fn().mockImplementation(() => Promise.resolve(result));
  (thenableBuilder as Record<string, unknown>).maybeSingle = vi.fn().mockImplementation(() => Promise.resolve(result));

  return {
    builder: thenableBuilder,
    setResult: (data: unknown, error: unknown = null) => {
      result = { data, error };
    },
  };
}

// ─── Supabase Client Mock ──────────────────────────────────────
export function createMockSupabaseClient() {
  const queryBuilders = new Map<string, ReturnType<typeof createMockQueryBuilder>>();

  function getOrCreateBuilder(table: string) {
    if (!queryBuilders.has(table)) {
      queryBuilders.set(table, createMockQueryBuilder());
    }
    return queryBuilders.get(table)!;
  }

  const client = {
    from: vi.fn().mockImplementation((table: string) => {
      return getOrCreateBuilder(table).builder;
    }),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      setSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      signUp: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
  };

  return {
    client,
    /** Set the result for a specific table query */
    setTableData: (table: string, data: unknown, error: unknown = null) => {
      getOrCreateBuilder(table).setResult(data, error);
    },
    /** Get the mock query builder for assertions */
    getTableBuilder: (table: string) => getOrCreateBuilder(table).builder,
  };
}

// ─── 공통 테스트 데이터 ────────────────────────────────────────
export const TEST_USER = {
  id: "user-001",
  name: "테스트유저",
  email: "test@example.com",
  role: "user" as const,
};

export const TEST_ADMIN = {
  id: "admin-001",
  name: "관리자",
  email: "admin@example.com",
  role: "admin" as const,
};

export const TEST_HACKATHON_ROW = {
  slug: "test-hack-2026",
  title: "테스트 해커톤 2026",
  status: "ongoing",
  tags: ["AI", "ML"],
  thumbnail_url: "https://example.com/thumb.png",
  timezone: "Asia/Seoul",
  submission_deadline_at: "2026-04-01T00:00:00+09:00",
  end_at: "2026-04-15T00:00:00+09:00",
  detail_link: "/hackathons/test-hack-2026",
  rules_link: "/rules",
  faq_link: "/faq",
  created_at: "2026-01-01T00:00:00Z",
};

export const TEST_TEAM_ROW = {
  team_code: "TEAM001",
  hackathon_slug: "test-hack-2026",
  name: "테스트팀",
  is_open: true,
  join_policy: "auto",
  looking_for: ["ML", "Backend"],
  intro: "열심히 하겠습니다",
  contact_type: "discord",
  contact_url: "https://discord.gg/test",
  creator_id: "user-001",
  created_at: "2026-01-15T00:00:00Z",
  team_members: [
    { user_id: "user-001", name: "테스트유저", role: "팀장", joined_at: "2026-01-15T00:00:00Z" },
  ],
};

export const TEST_PROFILE_ROW = {
  id: "user-001",
  name: "테스트유저",
  nickname: "테스터",
  nickname_changed_at: null,
  email: "test@example.com",
  role: "user",
  avatar_url: null,
  bio: "안녕하세요",
  skills: ["Python", "React"],
  joined_at: "2026-01-01T00:00:00Z",
  hackathons_joined: 2,
  teams_created: 1,
  submissions_count: 5,
  total_score: 85.5,
};

export const TEST_FORUM_POST_ROW = {
  id: "post-001",
  hackathon_slug: "test-hack-2026",
  author_id: "user-001",
  author_name: "테스트유저",
  author_nickname: "테스터",
  title: "질문 있습니다",
  content: "어떻게 제출하나요?",
  category: "question",
  likes: [],
  created_at: "2026-02-01T00:00:00Z",
  updated_at: null,
};

export const TEST_DM_ROW = {
  id: "dm-001",
  sender_id: "user-001",
  sender_name: "테스트유저",
  receiver_id: "user-002",
  receiver_name: "다른유저",
  content: "안녕하세요!",
  read: false,
  created_at: "2026-02-15T00:00:00Z",
};
