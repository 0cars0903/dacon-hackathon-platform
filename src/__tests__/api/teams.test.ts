import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/v1/teams/route";
import type { Team } from "@/types";

// Mock the TeamService
vi.mock("@/services/team.service", () => ({
  TeamService: {
    list: vi.fn(),
    getByHackathon: vi.fn(),
    create: vi.fn(),
  },
}));

import { TeamService } from "@/services/team.service";

// Helper to create mock NextRequest
function createRequest(
  url: string,
  options?: (Omit<RequestInit, "signal"> & { searchParams?: Record<string, string> }) | undefined
) {
  const baseUrl = new URL(url, "http://localhost:3000");
  const { searchParams, ...requestInit } = options || {};

  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      baseUrl.searchParams.append(key, value);
    });
  }

  return new NextRequest(baseUrl, requestInit);
}

describe("Team API Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/v1/teams", () => {
    it("팀 목록을 반환해야 함", async () => {
      const mockTeams: Team[] = [
        {
          teamCode: "TEAM001",
          hackathonSlug: "test-hack-1",
          name: "우수팀",
          isOpen: true,
          joinPolicy: "auto" as const,
          lookingFor: ["Backend"],
          memberCount: 3,
          intro: "우리는 최고의 팀입니다",
          contact: { type: "discord", url: "https://discord.gg/team123" },
          createdAt: "2026-01-15T00:00:00Z",
        },
        {
          teamCode: "TEAM002",
          hackathonSlug: "test-hack-1",
          name: "멋진팀",
          isOpen: true,
          joinPolicy: "approval" as const,
          lookingFor: ["Frontend"],
          memberCount: 2,
          intro: "좋은 팀입니다",
          contact: { type: "slack", url: "https://slack.com/team456" },
          createdAt: "2026-01-20T00:00:00Z",
        },
      ];

      vi.mocked(TeamService.list).mockResolvedValue({ items: mockTeams, total: 2 } as any);

      const request = createRequest("/api/v1/teams");
      const response = await GET(request);

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.items).toHaveLength(2);
    });

    it("hackathonSlug로 필터링해야 함", async () => {
      const mockTeams: Team[] = [
        {
          teamCode: "TEAM001",
          hackathonSlug: "test-hack-1",
          name: "우수팀",
          isOpen: true,
          joinPolicy: "auto" as const,
          memberCount: 3,
          lookingFor: ["Backend"],
          intro: "우리는 최고의 팀입니다",
          contact: { type: "discord", url: "https://discord.gg/team123" },
          createdAt: "2026-01-15T00:00:00Z",
        },
      ];

      vi.mocked(TeamService.list).mockResolvedValue({ items: mockTeams, total: 1 } as any);

      const request = createRequest("/api/v1/teams", {
        searchParams: { hackathonSlug: "test-hack-1" },
      });
      const response = await GET(request);

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.items).toHaveLength(1);
      expect(data.items[0].hackathonSlug).toBe("test-hack-1");
    });

    it("페이지 파라미터를 처리해야 함", async () => {
      vi.mocked(TeamService.list).mockResolvedValue({ items: [], total: 0 } as any);

      const request = createRequest("/api/v1/teams", {
        searchParams: { page: "2", size: "10" },
      });
      const response = await GET(request);

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.page).toBe(2);
      expect(data.size).toBe(10);
    });

    it("기본 페이지 크기를 적용해야 함", async () => {
      vi.mocked(TeamService.list).mockResolvedValue({ items: [], total: 0 } as any);

      const request = createRequest("/api/v1/teams");
      const response = await GET(request);

      const data = await response.json();

      expect(data.page).toBe(1);
      expect(data.size).toBe(20);
    });

    it("유효하지 않은 페이지 파라미터에 대해 400을 반환해야 함", async () => {
      const request = createRequest("/api/v1/teams", {
        searchParams: { page: "invalid" },
      });
      const response = await GET(request);

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error.code).toBe("VALIDATION_ERROR");
    });

    it("크기가 100을 초과하면 거부해야 함", async () => {
      const request = createRequest("/api/v1/teams", {
        searchParams: { size: "150" },
      });
      const response = await GET(request);

      expect(response.status).toBe(400);
    });

    it("빈 팀 목록을 반환할 수 있음", async () => {
      vi.mocked(TeamService.list).mockResolvedValue({ items: [], total: 0 } as any);

      const request = createRequest("/api/v1/teams");
      const response = await GET(request);

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.items).toHaveLength(0);
    });

    it("올바른 응답 형식을 가져야 함", async () => {
      vi.mocked(TeamService.list).mockResolvedValue({ items: [], total: 0 } as any);

      const request = createRequest("/api/v1/teams");
      const response = await GET(request);

      const data = await response.json();

      expect(data).toHaveProperty("items");
      expect(data).toHaveProperty("total");
      expect(data).toHaveProperty("page");
      expect(data).toHaveProperty("size");
      expect(data).toHaveProperty("pages");
    });
  });

  describe("POST /api/v1/teams", () => {
    it("새 팀을 생성해야 함", async () => {
      vi.mocked(TeamService.create).mockResolvedValue(true);

      const request = createRequest("/api/v1/teams", {
        method: "POST",
        body: JSON.stringify({
          hackathonSlug: "test-hack-1",
          name: "새로운팀",
          leaderUserId: "user-001",
          leaderUserName: "김코더",
          isOpen: true,
          joinPolicy: "auto",
          lookingFor: ["Backend", "Frontend"],
          intro: "우리는 최고의 팀입니다",
          contactType: "discord",
          contactUrl: "https://discord.gg/team123",
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data.data).toBeDefined();
      expect(data.data.created).toBe(true);
    });

    it("필수 필드 누락 시 400을 반환해야 함", async () => {
      const request = createRequest("/api/v1/teams", {
        method: "POST",
        body: JSON.stringify({
          hackathonSlug: "test-hack-1",
          // name 누락
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error.code).toBe("VALIDATION_ERROR");
    });

    it("hackathonSlug 누락 시 400을 반환해야 함", async () => {
      const request = createRequest("/api/v1/teams", {
        method: "POST",
        body: JSON.stringify({
          name: "새로운팀",
          // hackathonSlug 누락
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it("유효하지 않은 joinPolicy를 거부해야 함", async () => {
      const request = createRequest("/api/v1/teams", {
        method: "POST",
        body: JSON.stringify({
          hackathonSlug: "test-hack-1",
          name: "새로운팀",
          joinPolicy: "invalid", // 유효하지 않은 정책
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      expect((await response.json()).error.code).toBe("VALIDATION_ERROR");
    });

    it("기본값을 적용해야 함", async () => {
      vi.mocked(TeamService.create).mockResolvedValue(true);

      const request = createRequest("/api/v1/teams", {
        method: "POST",
        body: JSON.stringify({
          hackathonSlug: "test-hack-1",
          name: "새로운팀",
          leaderUserId: "user-001",
          leaderUserName: "김코더",
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
    });

    it("팀 이름 최대 길이를 초과하면 거부해야 함", async () => {
      const request = createRequest("/api/v1/teams", {
        method: "POST",
        body: JSON.stringify({
          hackathonSlug: "test-hack-1",
          name: "a".repeat(101), // 최대 100자 초과
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it("intro 필드가 2000자 이하여야 함", async () => {
      const request = createRequest("/api/v1/teams", {
        method: "POST",
        body: JSON.stringify({
          hackathonSlug: "test-hack-1",
          name: "새로운팀",
          intro: "a".repeat(2001), // 최대 2000자 초과
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it("null 값을 포함할 수 있음", async () => {
      vi.mocked(TeamService.create).mockResolvedValue(true);

      const request = createRequest("/api/v1/teams", {
        method: "POST",
        body: JSON.stringify({
          hackathonSlug: "test-hack-1",
          name: "새로운팀",
          leaderUserId: "user-001",
          leaderUserName: "김코더",
          intro: null,
          contactUrl: null,
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
    });

    it("빈 lookingFor 배열을 허용해야 함", async () => {
      vi.mocked(TeamService.create).mockResolvedValue(true);

      const request = createRequest("/api/v1/teams", {
        method: "POST",
        body: JSON.stringify({
          hackathonSlug: "test-hack-1",
          name: "새로운팀",
          leaderUserId: "user-001",
          leaderUserName: "김코더",
          lookingFor: [],
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
    });

    it("올바른 응답 형식을 가져야 함", async () => {
      vi.mocked(TeamService.create).mockResolvedValue(true);

      const request = createRequest("/api/v1/teams", {
        method: "POST",
        body: JSON.stringify({
          hackathonSlug: "test-hack-1",
          name: "새로운팀",
          leaderUserId: "user-001",
          leaderUserName: "김코더",
        }),
      });

      const response = await POST(request);

      const data = await response.json();

      expect(data).toHaveProperty("data");
      expect(data.data).toHaveProperty("created");
    });

    it("validation 에러가 발생할 때 상세 정보를 포함해야 함", async () => {
      const request = createRequest("/api/v1/teams", {
        method: "POST",
        body: JSON.stringify({
          hackathonSlug: "test-hack-1",
          name: "a".repeat(101),
        }),
      });

      const response = await POST(request);

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe("VALIDATION_ERROR");
      expect(data.error.details).toBeDefined();
      expect(data.error.details.issues).toBeDefined();
    });

    it("유효하지 않은 JSON에 대해 400을 반환해야 함", async () => {
      const request = createRequest("/api/v1/teams", {
        method: "POST",
        body: "invalid json",
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it("여러 선택사항 필드를 포함할 수 있음", async () => {
      vi.mocked(TeamService.create).mockResolvedValue(true);

      const request = createRequest("/api/v1/teams", {
        method: "POST",
        body: JSON.stringify({
          hackathonSlug: "test-hack-1",
          name: "새로운팀",
          leaderUserId: "user-001",
          leaderUserName: "김코더",
          isOpen: false,
          joinPolicy: "approval",
          lookingFor: ["Backend", "Designer"],
          intro: "우리의 소개",
          contactType: "slack",
          contactUrl: "https://slack.com/team123",
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
    });
  });
});
