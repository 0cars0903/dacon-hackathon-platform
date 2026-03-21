import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/v1/hackathons/route";
import type { Hackathon } from "@/types";

// Mock the HackathonService
vi.mock("@/services/hackathon.service", () => ({
  HackathonService: {
    list: vi.fn(),
    create: vi.fn(),
  },
}));

import { HackathonService } from "@/services/hackathon.service";

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

describe("Hackathon API Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/v1/hackathons", () => {
    it("해커톤 목록을 반환해야 함", async () => {
      const mockHackathons: Hackathon[] = [
        {
          slug: "test-hack-1",
          title: "Test Hackathon 1",
          status: "ongoing" as const,
          tags: ["AI"],
          thumbnailUrl: "https://example.com/thumb1.png",
          period: {
            timezone: "Asia/Seoul",
            submissionDeadlineAt: "2026-04-01T00:00:00+09:00",
            endAt: "2026-04-15T00:00:00+09:00",
          },
          links: {
            detail: "/hackathons/test-hack-1",
            rules: "/rules",
            faq: "/faq",
          },
        },
        {
          slug: "test-hack-2",
          title: "Test Hackathon 2",
          status: "upcoming" as const,
          tags: ["ML"],
          thumbnailUrl: "https://example.com/thumb2.png",
          period: {
            timezone: "Asia/Seoul",
            submissionDeadlineAt: "2026-05-01T00:00:00+09:00",
            endAt: "2026-05-15T00:00:00+09:00",
          },
          links: {
            detail: "/hackathons/test-hack-2",
            rules: "/rules",
            faq: "/faq",
          },
        },
      ];

      vi.mocked(HackathonService.list).mockResolvedValue({
        items: mockHackathons,
        total: 2,
      });

      const request = createRequest("/api/v1/hackathons");
      const response = await GET(request);

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.items).toHaveLength(2);
      expect(data.total).toBe(2);
      expect(data.page).toBe(1);
      expect(data.size).toBe(20);
    });

    it("status 필터를 적용해야 함", async () => {
      const mockHackathons: Hackathon[] = [
        {
          slug: "test-hack-1",
          title: "Test Hackathon 1",
          status: "ongoing" as const,
          tags: ["AI"],
          thumbnailUrl: "https://example.com/thumb1.png",
          period: {
            timezone: "Asia/Seoul",
            submissionDeadlineAt: "2026-04-01T00:00:00+09:00",
            endAt: "2026-04-15T00:00:00+09:00",
          },
          links: {
            detail: "/hackathons/test-hack-1",
            rules: "/rules",
            faq: "/faq",
          },
        },
      ];

      vi.mocked(HackathonService.list).mockResolvedValue({
        items: mockHackathons,
        total: 1,
      });

      const request = createRequest("/api/v1/hackathons", {
        searchParams: { status: "ongoing" },
      });
      const response = await GET(request);

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.items).toHaveLength(1);
      expect(data.items[0].status).toBe("ongoing");
    });

    it("페이지 파라미터를 처리해야 함", async () => {
      vi.mocked(HackathonService.list).mockResolvedValue({
        items: [],
        total: 100,
      });

      const request = createRequest("/api/v1/hackathons", {
        searchParams: { page: "2", size: "10" },
      });
      const response = await GET(request);

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.page).toBe(2);
      expect(data.size).toBe(10);
    });

    it("기본 페이지 크기를 적용해야 함", async () => {
      vi.mocked(HackathonService.list).mockResolvedValue({
        items: [],
        total: 0,
      });

      const request = createRequest("/api/v1/hackathons");
      const response = await GET(request);

      const data = await response.json();

      expect(data.page).toBe(1);
      expect(data.size).toBe(20);
    });

    it("빈 목록을 반환할 수 있음", async () => {
      vi.mocked(HackathonService.list).mockResolvedValue({
        items: [],
        total: 0,
      });

      const request = createRequest("/api/v1/hackathons");
      const response = await GET(request);

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.items).toHaveLength(0);
      expect(data.total).toBe(0);
    });

    it("유효하지 않은 페이지 파라미터에 대해 400을 반환해야 함", async () => {
      const request = createRequest("/api/v1/hackathons", {
        searchParams: { page: "invalid" },
      });
      const response = await GET(request);

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe("VALIDATION_ERROR");
    });

    it("유효하지 않은 status에 대해 400을 반환해야 함", async () => {
      const request = createRequest("/api/v1/hackathons", {
        searchParams: { status: "invalid-status" },
      });
      const response = await GET(request);

      expect(response.status).toBe(400);
      expect((await response.json()).error.code).toBe("VALIDATION_ERROR");
    });

    it("tags 필터를 처리해야 함", async () => {
      vi.mocked(HackathonService.list).mockResolvedValue({
        items: [],
        total: 0,
      });

      const request = createRequest("/api/v1/hackathons", {
        searchParams: { tags: "AI,ML" },
      });
      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it("sort 파라미터를 처리해야 함", async () => {
      vi.mocked(HackathonService.list).mockResolvedValue({
        items: [],
        total: 0,
      });

      const request = createRequest("/api/v1/hackathons", {
        searchParams: { sort: "deadline" },
      });
      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it("올바른 응답 형식을 가져야 함", async () => {
      vi.mocked(HackathonService.list).mockResolvedValue({
        items: [],
        total: 0,
      });

      const request = createRequest("/api/v1/hackathons");
      const response = await GET(request);

      const data = await response.json();

      expect(data).toHaveProperty("items");
      expect(data).toHaveProperty("total");
      expect(data).toHaveProperty("page");
      expect(data).toHaveProperty("size");
      expect(data).toHaveProperty("pages");
    });
  });

  describe("POST /api/v1/hackathons", () => {
    it("새 해커톤을 생성해야 함", async () => {
      vi.mocked(HackathonService.create).mockResolvedValue(true);

      const request = createRequest("/api/v1/hackathons", {
        method: "POST",
        body: JSON.stringify({
          slug: "new-hackathon",
          title: "New Hackathon",
          status: "upcoming",
          tags: ["AI", "ML"],
          submissionDeadlineAt: "2026-05-01T00:00:00+09:00",
          endAt: "2026-05-15T00:00:00+09:00",
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data.data).toBeDefined();
      expect(data.data.created).toBe(true);
    });

    it("필수 필드 누락 시 400을 반환해야 함", async () => {
      const request = createRequest("/api/v1/hackathons", {
        method: "POST",
        body: JSON.stringify({
          title: "New Hackathon",
          status: "upcoming",
          // slug 누락
          // tags 누락
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error.code).toBe("VALIDATION_ERROR");
    });

    it("유효하지 않은 slug를 거부해야 함", async () => {
      const request = createRequest("/api/v1/hackathons", {
        method: "POST",
        body: JSON.stringify({
          slug: "New Hackathon", // 대문자와 공백 포함
          title: "New Hackathon",
          status: "upcoming",
          tags: ["AI"],
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      expect((await response.json()).error.code).toBe("VALIDATION_ERROR");
    });

    it("빈 tags 배열을 거부해야 함", async () => {
      const request = createRequest("/api/v1/hackathons", {
        method: "POST",
        body: JSON.stringify({
          slug: "new-hackathon",
          title: "New Hackathon",
          status: "upcoming",
          tags: [], // 빈 배열
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      expect((await response.json()).error.code).toBe("VALIDATION_ERROR");
    });

    it("유효하지 않은 status를 거부해야 함", async () => {
      const request = createRequest("/api/v1/hackathons", {
        method: "POST",
        body: JSON.stringify({
          slug: "new-hackathon",
          title: "New Hackathon",
          status: "invalid-status",
          tags: ["AI"],
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it("유효한 선택사항 필드를 수용해야 함", async () => {
      vi.mocked(HackathonService.create).mockResolvedValue(true);

      const request = createRequest("/api/v1/hackathons", {
        method: "POST",
        body: JSON.stringify({
          slug: "new-hackathon",
          title: "New Hackathon",
          status: "upcoming",
          tags: ["AI"],
          timezone: "America/New_York",
          thumbnailUrl: "https://example.com/thumb.png",
          detailLink: "https://example.com/details",
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
    });

    it("올바른 응답 형식을 가져야 함", async () => {
      vi.mocked(HackathonService.create).mockResolvedValue(true);

      const request = createRequest("/api/v1/hackathons", {
        method: "POST",
        body: JSON.stringify({
          slug: "new-hackathon",
          title: "New Hackathon",
          status: "upcoming",
          tags: ["AI"],
        }),
      });

      const response = await POST(request);

      const data = await response.json();

      expect(data).toHaveProperty("data");
      expect(data.data).toHaveProperty("created");
    });

    it("유효하지 않은 JSON에 대해 400을 반환해야 함", async () => {
      const request = createRequest("/api/v1/hackathons", {
        method: "POST",
        body: "invalid json",
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it("null 값을 포함할 수 있음", async () => {
      vi.mocked(HackathonService.create).mockResolvedValue(true);

      const request = createRequest("/api/v1/hackathons", {
        method: "POST",
        body: JSON.stringify({
          slug: "new-hackathon",
          title: "New Hackathon",
          status: "upcoming",
          tags: ["AI"],
          thumbnailUrl: null,
          detailLink: null,
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
    });

    it("validation 에러가 발생할 때 상세 정보를 포함해야 함", async () => {
      const request = createRequest("/api/v1/hackathons", {
        method: "POST",
        body: JSON.stringify({
          slug: "Invalid Slug",
          title: "New Hackathon",
          status: "upcoming",
          tags: ["AI"],
        }),
      });

      const response = await POST(request);

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe("VALIDATION_ERROR");
      expect(data.error.details).toBeDefined();
      expect(data.error.details.issues).toBeDefined();
    });
  });
});
