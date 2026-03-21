import { describe, it, expect, vi, beforeEach } from "vitest";
import { HackathonService } from "@/services/hackathon.service";
import { NotFoundError, ValidationError } from "@/lib/errors/api-error";
import type { Hackathon, HackathonDetail, PlatformStats } from "@/types";

// Mock the data layer
vi.mock("@/lib/supabase/data", () => ({
  getAllHackathonsUnfiltered: vi.fn(),
  getHackathonBySlug: vi.fn(),
  getHackathonDetail: vi.fn(),
  getAllHackathonDetails: vi.fn(),
  getPlatformStats: vi.fn(),
  getRecommendedHackathons: vi.fn(),
  createHackathon: vi.fn(),
  updateHackathon: vi.fn(),
  deleteHackathon: vi.fn(),
  changeHackathonStatus: vi.fn(),
}));

import * as data from "@/lib/supabase/data";

// Test data
const mockHackathon: Hackathon = {
  slug: "test-hackathon-2026",
  title: "Test Hackathon 2026",
  status: "ongoing",
  tags: ["AI", "ML"],
  thumbnailUrl: "https://example.com/thumb.png",
  period: {
    timezone: "Asia/Seoul",
    submissionDeadlineAt: "2026-04-01T00:00:00+09:00",
    endAt: "2026-04-15T00:00:00+09:00",
  },
  links: {
    detail: "/hackathons/test-hackathon-2026",
    rules: "/rules",
    faq: "/faq",
  },
};

const mockHackathonDetail: HackathonDetail = {
  slug: "test-hackathon-2026",
  title: "Test Hackathon 2026",
  sections: {
    overview: {
      summary: "자세한 설명",
      teamPolicy: { allowSolo: true, maxTeamSize: 10 },
    },
    info: {
      notice: ["공지사항"],
      links: { rules: "/rules", faq: "/faq" },
    },
    eval: {
      metricName: "점수",
      description: "평가 방식",
    },
    schedule: {
      timezone: "Asia/Seoul",
      milestones: [{ name: "시작", at: "2026-03-21T00:00:00+09:00" }],
    },
    teams: {
      campEnabled: false,
      listUrl: "/teams",
    },
    submit: {
      allowedArtifactTypes: ["pdf"],
      submissionUrl: "/submit",
      guide: ["가이드"],
    },
    leaderboard: {
      publicLeaderboardUrl: "/leaderboard",
      note: "노트",
    },
  },
};

const mockPlatformStats: PlatformStats = {
  ongoingHackathons: 5,
  upcomingHackathons: 3,
  totalUsers: 100,
  totalTeams: 50,
  totalHackathons: 10,
  totalMembers: 200,
  totalSubmissions: 500,
};

describe("HackathonService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("list()", () => {
    it("모든 해커톤을 반환해야 함", async () => {
      const mockList = [mockHackathon, { ...mockHackathon, slug: "other-hackathon" }];
      vi.mocked(data.getAllHackathonsUnfiltered).mockResolvedValue(mockList as any);

      const result = await HackathonService.list({
        page: 1,
        size: 20,
        status: "all",
      });

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it("status로 필터링해야 함", async () => {
      const ongoingHackathon = { ...mockHackathon, status: "ongoing" as const };
      const upcomingHackathon = { ...mockHackathon, slug: "upcoming-hack", status: "upcoming" as const };
      const mockList = [ongoingHackathon, upcomingHackathon];

      vi.mocked(data.getAllHackathonsUnfiltered).mockResolvedValue(mockList as any);

      const result = await HackathonService.list({
        page: 1,
        size: 20,
        status: "ongoing",
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].status).toBe("ongoing");
    });

    it("tags로 필터링해야 함", async () => {
      const hackWithAI = { ...mockHackathon, tags: ["AI", "ML"] };
      const hackWithWebDev = { ...mockHackathon, slug: "web-hack", tags: ["Web", "Frontend"] };
      const mockList = [hackWithAI, hackWithWebDev];

      vi.mocked(data.getAllHackathonsUnfiltered).mockResolvedValue(mockList as any);

      const result = await HackathonService.list({
        page: 1,
        size: 20,
        status: "all",
        tags: "AI",
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].tags).toContain("AI");
    });

    it("여러 tags로 필터링할 수 있음 (OR 조건)", async () => {
      const hackAI = { ...mockHackathon, tags: ["AI"] };
      const hackML = { ...mockHackathon, slug: "ml-hack", tags: ["ML"] };
      const hackWeb = { ...mockHackathon, slug: "web-hack", tags: ["Web"] };
      const mockList = [hackAI, hackML, hackWeb];

      vi.mocked(data.getAllHackathonsUnfiltered).mockResolvedValue(mockList as any);

      const result = await HackathonService.list({
        page: 1,
        size: 20,
        status: "all",
        tags: "AI,ML",
      });

      expect(result.items).toHaveLength(2); // AI와 ML 둘 다 포함
    });

    it("올바르게 페이지네이션해야 함", async () => {
      const mockList = Array.from({ length: 100 }, (_, i) => ({
        ...mockHackathon,
        slug: `hack-${i}`,
      }));

      vi.mocked(data.getAllHackathonsUnfiltered).mockResolvedValue(mockList as any);

      const result = await HackathonService.list({
        page: 2,
        size: 20,
        status: "all",
      });

      expect(result.items).toHaveLength(20);
      expect(result.total).toBe(100);
      expect(result.items[0].slug).toBe("hack-20"); // 두 번째 페이지의 첫 번째 항목
    });

    it("deadline으로 오름차순 정렬해야 함", async () => {
      const hack1 = {
        ...mockHackathon,
        slug: "hack-1",
        period: { submissionDeadlineAt: "2026-05-01T00:00:00+09:00", endAt: "" },
      };
      const hack2 = {
        ...mockHackathon,
        slug: "hack-2",
        period: { submissionDeadlineAt: "2026-03-01T00:00:00+09:00", endAt: "" },
      };
      const mockList = [hack1, hack2];

      vi.mocked(data.getAllHackathonsUnfiltered).mockResolvedValue(mockList as any);

      const result = await HackathonService.list({
        page: 1,
        size: 20,
        status: "all",
        sort: "deadline",
      });

      expect(result.items[0].slug).toBe("hack-2"); // 더 빠른 deadline이 먼저
      expect(result.items[1].slug).toBe("hack-1");
    });

    it("newest로 내림차순 정렬해야 함 (기본값)", async () => {
      const hack1 = {
        ...mockHackathon,
        slug: "hack-1",
        period: { submissionDeadlineAt: "2026-05-01T00:00:00+09:00", endAt: "" },
      };
      const hack2 = {
        ...mockHackathon,
        slug: "hack-2",
        period: { submissionDeadlineAt: "2026-03-01T00:00:00+09:00", endAt: "" },
      };
      const mockList = [hack1, hack2];

      vi.mocked(data.getAllHackathonsUnfiltered).mockResolvedValue(mockList as any);

      const result = await HackathonService.list({
        page: 1,
        size: 20,
        status: "all",
        sort: "latest",
      });

      expect(result.items[0].slug).toBe("hack-1"); // 더 늦은 deadline이 먼저
      expect(result.items[1].slug).toBe("hack-2");
    });
  });

  describe("getBySlug()", () => {
    it("존재하는 해커톤을 반환해야 함", async () => {
      vi.mocked(data.getHackathonBySlug).mockResolvedValue(mockHackathon as any);

      const result = await HackathonService.getBySlug("test-hackathon-2026");

      expect(result).toEqual(mockHackathon);
      expect(data.getHackathonBySlug).toHaveBeenCalledWith("test-hackathon-2026");
    });

    it("존재하지 않는 해커톤에 대해 NotFoundError를 던져야 함", async () => {
      vi.mocked(data.getHackathonBySlug).mockResolvedValue(undefined);

      await expect(
        HackathonService.getBySlug("non-existent-hackathon")
      ).rejects.toThrow(NotFoundError);
    });

    it("빈 slug에 대해 ValidationError를 던져야 함", async () => {
      await expect(HackathonService.getBySlug("")).rejects.toThrow(
        ValidationError
      );
    });

    it("공백만 있는 slug에 대해 ValidationError를 던져야 함", async () => {
      await expect(HackathonService.getBySlug("   ")).rejects.toThrow(
        ValidationError
      );
    });
  });

  describe("getDetail()", () => {
    it("해커톤 상세 정보를 반환해야 함", async () => {
      vi.mocked(data.getHackathonDetail).mockResolvedValue(
        mockHackathonDetail as any
      );

      const result = await HackathonService.getDetail("test-hackathon-2026");

      expect(result).toEqual(mockHackathonDetail);
      expect(data.getHackathonDetail).toHaveBeenCalledWith(
        "test-hackathon-2026"
      );
    });

    it("존재하지 않는 상세 정보에 대해 NotFoundError를 던져야 함", async () => {
      vi.mocked(data.getHackathonDetail).mockResolvedValue(undefined);

      await expect(
        HackathonService.getDetail("non-existent-hackathon")
      ).rejects.toThrow(NotFoundError);
    });

    it("빈 slug에 대해 ValidationError를 던져야 함", async () => {
      await expect(HackathonService.getDetail("")).rejects.toThrow(
        ValidationError
      );
    });
  });

  describe("getAllDetails()", () => {
    it("모든 해커톤 상세 정보를 반환해야 함", async () => {
      const mockDetails = [mockHackathonDetail];
      vi.mocked(data.getAllHackathonDetails).mockResolvedValue(
        mockDetails as any
      );

      const result = await HackathonService.getAllDetails();

      expect(result).toEqual(mockDetails);
    });
  });

  describe("getStats()", () => {
    it("플랫폼 통계를 반환해야 함", async () => {
      vi.mocked(data.getPlatformStats).mockResolvedValue(mockPlatformStats as any);

      const result = await HackathonService.getStats();

      expect(result).toEqual(mockPlatformStats);
    });
  });

  describe("getRecommended()", () => {
    it("관심 태그 기반 추천 해커톤을 반환해야 함", async () => {
      const mockRecommended = [mockHackathon];
      vi.mocked(data.getRecommendedHackathons).mockResolvedValue(
        mockRecommended as any
      );

      const result = await HackathonService.getRecommended(["AI", "ML"]);

      expect(result).toEqual(mockRecommended);
      expect(data.getRecommendedHackathons).toHaveBeenCalledWith(["AI", "ML"]);
    });

    it("빈 배열일 때 처리해야 함", async () => {
      const mockRecommended = [mockHackathon];
      vi.mocked(data.getRecommendedHackathons).mockResolvedValue(
        mockRecommended as any
      );

      const result = await HackathonService.getRecommended([]);

      expect(result).toEqual(mockRecommended);
      expect(data.getRecommendedHackathons).toHaveBeenCalledWith([]);
    });
  });

  describe("create()", () => {
    it("새 해커톤을 생성해야 함", async () => {
      vi.mocked(data.createHackathon).mockResolvedValue(true);

      const input = {
        title: "New Hackathon",
        slug: "new-hackathon",
        status: "upcoming" as const,
        tags: ["Web"],
        submissionDeadlineAt: "2026-05-01T00:00:00+09:00",
        endAt: "2026-05-15T00:00:00+09:00",
      };

      const result = await HackathonService.create(input);

      expect(result).toBe(true);
      expect(data.createHackathon).toHaveBeenCalledWith(input);
    });

    it("title 없이 ValidationError를 던져야 함", async () => {
      const input = {
        slug: "new-hackathon",
        status: "upcoming" as const,
        tags: ["Web"],
      };

      await expect(HackathonService.create(input as any)).rejects.toThrow(
        ValidationError
      );
    });

    it("slug 없이 ValidationError를 던져야 함", async () => {
      const input = {
        title: "New Hackathon",
        status: "upcoming" as const,
        tags: ["Web"],
      };

      await expect(HackathonService.create(input as any)).rejects.toThrow(
        ValidationError
      );
    });
  });

  describe("update()", () => {
    it("해커톤을 업데이트해야 함", async () => {
      vi.mocked(data.getHackathonBySlug).mockResolvedValue(mockHackathon as any);
      vi.mocked(data.updateHackathon).mockResolvedValue(true);

      const input = {
        title: "Updated Title",
      };

      const result = await HackathonService.update("test-hackathon-2026", input);

      expect(result).toBe(true);
      expect(data.updateHackathon).toHaveBeenCalledWith(
        "test-hackathon-2026",
        input
      );
    });

    it("존재하지 않는 해커톤을 업데이트하려면 NotFoundError를 던져야 함", async () => {
      vi.mocked(data.getHackathonBySlug).mockResolvedValue(undefined);

      await expect(
        HackathonService.update("non-existent", { title: "Updated" })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("delete()", () => {
    it("해커톤을 삭제해야 함", async () => {
      vi.mocked(data.getHackathonBySlug).mockResolvedValue(mockHackathon as any);
      vi.mocked(data.deleteHackathon).mockResolvedValue(true);

      const result = await HackathonService.delete("test-hackathon-2026");

      expect(result).toBe(true);
      expect(data.deleteHackathon).toHaveBeenCalledWith("test-hackathon-2026");
    });

    it("존재하지 않는 해커톤을 삭제하려면 NotFoundError를 던져야 함", async () => {
      vi.mocked(data.getHackathonBySlug).mockResolvedValue(undefined);

      await expect(HackathonService.delete("non-existent")).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe("changeStatus()", () => {
    it("해커톤 상태를 변경해야 함", async () => {
      vi.mocked(data.getHackathonBySlug).mockResolvedValue(mockHackathon as any);
      vi.mocked(data.changeHackathonStatus).mockResolvedValue(true);

      const result = await HackathonService.changeStatus(
        "test-hackathon-2026",
        "ended"
      );

      expect(result).toBe(true);
      expect(data.changeHackathonStatus).toHaveBeenCalledWith(
        "test-hackathon-2026",
        "ended"
      );
    });

    it("유효하지 않은 상태에 대해 ValidationError를 던져야 함", async () => {
      await expect(
        HackathonService.changeStatus("test-hackathon-2026", "invalid" as any)
      ).rejects.toThrow(ValidationError);
    });

    it("존재하지 않는 해커톤의 상태를 변경하려면 NotFoundError를 던져야 함", async () => {
      vi.mocked(data.getHackathonBySlug).mockResolvedValue(undefined);

      await expect(
        HackathonService.changeStatus("non-existent", "ended")
      ).rejects.toThrow(NotFoundError);
    });
  });
});
