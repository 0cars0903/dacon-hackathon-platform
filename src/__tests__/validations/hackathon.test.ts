import { describe, it, expect } from "vitest";
import {
  createHackathonSchema,
  updateHackathonSchema,
  changeStatusSchema,
  hackathonQuerySchema,
} from "@/validations/hackathon";
import type { CreateHackathonInput } from "@/validations/hackathon";

describe("Hackathon Validations", () => {
  describe("createHackathonSchema", () => {
    it("유효한 해커톤 입력을 통과해야 함", () => {
      const validInput: CreateHackathonInput = {
        slug: "test-hackathon-2026",
        title: "Test Hackathon 2026",
        status: "ongoing",
        tags: ["AI", "ML"],
        timezone: "Asia/Seoul",
        submissionDeadlineAt: "2026-04-01T00:00:00+09:00",
        endAt: "2026-04-15T00:00:00+09:00",
        thumbnailUrl: "https://example.com/thumb.png",
        detailLink: "https://example.com/details",
        rulesLink: "https://example.com/rules",
        faqLink: "https://example.com/faq",
      };

      const result = createHackathonSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.slug).toBe("test-hackathon-2026");
        expect(result.data.title).toBe("Test Hackathon 2026");
        expect(result.data.status).toBe("ongoing");
      }
    });

    it("필수 필드가 없으면 실패해야 함", () => {
      const invalidInput = {
        title: "Test Hackathon",
        // slug 누락
        status: "ongoing",
        tags: ["AI"],
      };

      const result = createHackathonSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it("잘못된 slug 형식을 거부해야 함 (대문자 포함)", () => {
      const invalidInput = {
        slug: "Test-Hackathon-2026", // 대문자 포함
        title: "Test Hackathon",
        status: "ongoing",
        tags: ["AI"],
      };

      const result = createHackathonSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.path.includes("slug"))).toBe(
          true
        );
      }
    });

    it("잘못된 slug 형식을 거부해야 함 (특수문자 포함)", () => {
      const invalidInput = {
        slug: "test@hackathon#2026", // 특수문자 포함
        title: "Test Hackathon",
        status: "ongoing",
        tags: ["AI"],
      };

      const result = createHackathonSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it("잘못된 status 값을 거부해야 함", () => {
      const invalidInput = {
        slug: "test-hackathon-2026",
        title: "Test Hackathon",
        status: "invalid-status", // 유효하지 않은 상태
        tags: ["AI"],
      };

      const result = createHackathonSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it("tags 배열은 최소 1개의 아이템이 필요함", () => {
      const invalidInput = {
        slug: "test-hackathon-2026",
        title: "Test Hackathon",
        status: "ongoing",
        tags: [], // 빈 배열
      };

      const result = createHackathonSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it("기본값들이 적용되어야 함", () => {
      const minimalInput = {
        slug: "test-hackathon-2026",
        title: "Test Hackathon",
        status: "ongoing" as const,
        tags: ["AI"],
      };

      const result = createHackathonSchema.safeParse(minimalInput);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.timezone).toBe("Asia/Seoul"); // default 값
      }
    });

    it("URL은 유효한 형식이어야 함", () => {
      const invalidInput = {
        slug: "test-hackathon-2026",
        title: "Test Hackathon",
        status: "ongoing" as const,
        tags: ["AI"],
        thumbnailUrl: "not-a-url", // 유효하지 않은 URL
      };

      const result = createHackathonSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it("NULL 값은 nullable 필드에 허용됨", () => {
      const inputWithNull = {
        slug: "test-hackathon-2026",
        title: "Test Hackathon",
        status: "ongoing" as const,
        tags: ["AI"],
        thumbnailUrl: null,
        submissionDeadlineAt: null,
      };

      const result = createHackathonSchema.safeParse(inputWithNull);
      expect(result.success).toBe(true);
    });
  });

  describe("updateHackathonSchema", () => {
    it("모든 필드가 선택사항이어야 함 (partial)", () => {
      const partialUpdate = {
        title: "Updated Title",
      };

      const result = updateHackathonSchema.safeParse(partialUpdate);
      expect(result.success).toBe(true);
    });

    it("slug 필드를 제외해야 함", () => {
      const updateWithSlug = {
        slug: "new-slug",
        title: "Updated Title",
      };

      const result = updateHackathonSchema.safeParse(updateWithSlug);
      // Zod의 omit은 unknown key를 무시(strip)하므로 parse는 성공하지만 slug가 결과에 없어야 함
      expect(result.success).toBe(true);
      if (result.success) {
        expect("slug" in result.data).toBe(false);
      }
    });
  });

  describe("changeStatusSchema", () => {
    it("유효한 status로 통과해야 함", () => {
      const validInput = {
        status: "ended" as const,
      };

      const result = changeStatusSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it("유효하지 않은 status를 거부해야 함", () => {
      const invalidInput = {
        status: "paused",
      };

      const result = changeStatusSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });
  });

  describe("hackathonQuerySchema", () => {
    it("유효한 쿼리 파라미터를 통과해야 함", () => {
      const validQuery = {
        status: "ongoing",
        tags: "AI,ML",
        sort: "deadline",
        page: "1",
        size: "20",
      };

      const result = hackathonQuerySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1); // coerced to number
        expect(result.data.size).toBe(20); // coerced to number
      }
    });

    it("기본값들이 적용되어야 함", () => {
      const emptyQuery = {};

      const result = hackathonQuerySchema.safeParse(emptyQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe("all");
        expect(result.data.sort).toBe("latest");
        expect(result.data.page).toBe(1);
        expect(result.data.size).toBe(20);
      }
    });

    it("page/size 문자열을 숫자로 강제 변환해야 함", () => {
      const stringQuery = {
        page: "5",
        size: "50",
      };

      const result = hackathonQuerySchema.safeParse(stringQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(5);
        expect(result.data.size).toBe(50);
      }
    });

    it("0 이하의 page를 거부해야 함", () => {
      const invalidQuery = {
        page: "0",
      };

      const result = hackathonQuerySchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("크기가 100을 초과하면 거부해야 함", () => {
      const invalidQuery = {
        size: "150",
      };

      const result = hackathonQuerySchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("유효하지 않은 status를 거부해야 함", () => {
      const invalidQuery = {
        status: "invalid",
      };

      const result = hackathonQuerySchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("정수가 아닌 page를 거부해야 함", () => {
      const invalidQuery = {
        page: "1.5",
      };

      const result = hackathonQuerySchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("태그 필터링은 선택사항임", () => {
      const queryWithoutTags = {
        status: "ongoing",
      };

      const result = hackathonQuerySchema.safeParse(queryWithoutTags);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tags).toBeUndefined();
      }
    });
  });
});
