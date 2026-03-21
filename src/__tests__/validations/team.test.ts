import { describe, it, expect } from "vitest";
import {
  createTeamSchema,
  updateTeamSchema,
  joinRequestSchema,
  createInvitationSchema,
  teamQuerySchema,
} from "@/validations/team";
import type { CreateTeamInput } from "@/validations/team";

describe("Team Validations", () => {
  describe("createTeamSchema", () => {
    it("유효한 팀 생성 입력을 통과해야 함", () => {
      const validInput: CreateTeamInput = {
        hackathonSlug: "test-hackathon-2026",
        name: "우수팀",
        leaderUserId: "user-123",
        leaderUserName: "김리더",
        isOpen: true,
        joinPolicy: "auto",
        lookingFor: ["Backend", "Frontend"],
        intro: "우리는 최고의 팀입니다",
        contactType: "discord",
        contactUrl: "https://discord.gg/team123",
      };

      const result = createTeamSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("우수팀");
        expect(result.data.hackathonSlug).toBe("test-hackathon-2026");
      }
    });

    it("팀 이름 없이 실패해야 함", () => {
      const invalidInput = {
        hackathonSlug: "test-hackathon-2026",
        // name 누락
      };

      const result = createTeamSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it("해커톤 slug 없이 실패해야 함", () => {
      const invalidInput = {
        name: "우수팀",
        // hackathonSlug 누락
      };

      const result = createTeamSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it("유효하지 않은 joinPolicy를 거부해야 함", () => {
      const invalidInput = {
        hackathonSlug: "test-hackathon-2026",
        name: "우수팀",
        joinPolicy: "manual", // 유효하지 않은 정책
      };

      const result = createTeamSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it("기본값들이 적용되어야 함", () => {
      const minimalInput = {
        hackathonSlug: "test-hackathon-2026",
        name: "우수팀",
        leaderUserId: "user-001",
        leaderUserName: "김코더",
      };

      const result = createTeamSchema.safeParse(minimalInput);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isOpen).toBe(true); // default 값
        expect(result.data.joinPolicy).toBe("auto"); // default 값
        expect(result.data.lookingFor).toEqual([]); // default 값
      }
    });

    it("팀 이름 최대 길이를 초과하면 거부해야 함", () => {
      const invalidInput = {
        hackathonSlug: "test-hackathon-2026",
        name: "a".repeat(101), // 최대 100자 초과
      };

      const result = createTeamSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it("intro 필드는 2000자 이하여야 함", () => {
      const invalidInput = {
        hackathonSlug: "test-hackathon-2026",
        name: "우수팀",
        intro: "a".repeat(2001), // 최대 2000자 초과
      };

      const result = createTeamSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it("NULL 값은 선택사항 필드에 허용됨", () => {
      const inputWithNull = {
        hackathonSlug: "test-hackathon-2026",
        name: "우수팀",
        leaderUserId: "user-001",
        leaderUserName: "김코더",
        intro: null,
        contactType: null,
        contactUrl: null,
      };

      const result = createTeamSchema.safeParse(inputWithNull);
      expect(result.success).toBe(true);
    });

    it("empty lookingFor 배열은 허용됨", () => {
      const inputWithEmptyArray = {
        hackathonSlug: "test-hackathon-2026",
        name: "우수팀",
        leaderUserId: "user-001",
        leaderUserName: "김코더",
        lookingFor: [],
      };

      const result = createTeamSchema.safeParse(inputWithEmptyArray);
      expect(result.success).toBe(true);
    });

    it("contactUrl은 유효한 형식일 필요 없음 (문자열 필드)", () => {
      const input = {
        hackathonSlug: "test-hackathon-2026",
        name: "우수팀",
        leaderUserId: "user-001",
        leaderUserName: "김코더",
        contactUrl: "not-a-url",
      };

      const result = createTeamSchema.safeParse(input);
      expect(result.success).toBe(true); // contactUrl은 단순 string 필드
    });
  });

  describe("updateTeamSchema", () => {
    it("모든 필드가 선택사항이어야 함", () => {
      const partialUpdate = {
        name: "새로운 팀 이름",
      };

      const result = updateTeamSchema.safeParse(partialUpdate);
      expect(result.success).toBe(true);
    });

    it("hackathonSlug 필드를 제외해야 함", () => {
      const updateWithSlug = {
        hackathonSlug: "new-hackathon",
        name: "새로운 팀 이름",
      };

      const result = updateTeamSchema.safeParse(updateWithSlug);
      // Zod의 omit은 unknown key를 strip하므로 parse 성공하지만 hackathonSlug 없어야 함
      expect(result.success).toBe(true);
      if (result.success) {
        expect("hackathonSlug" in result.data).toBe(false);
      }
    });

    it("여러 필드를 동시에 업데이트할 수 있음", () => {
      const multiUpdate = {
        name: "새로운 이름",
        isOpen: false,
        joinPolicy: "approval",
        lookingFor: ["Designer"],
      };

      const result = updateTeamSchema.safeParse(multiUpdate);
      expect(result.success).toBe(true);
    });
  });

  describe("joinRequestSchema", () => {
    it("message 없이 유효해야 함", () => {
      const emptyRequest = {};

      const result = joinRequestSchema.safeParse(emptyRequest);
      expect(result.success).toBe(true);
    });

    it("message를 포함할 수 있음", () => {
      const requestWithMessage = {
        message: "안녕하세요, 팀에 들어갈 수 있을까요?",
      };

      const result = joinRequestSchema.safeParse(requestWithMessage);
      expect(result.success).toBe(true);
    });

    it("message는 500자 이하여야 함", () => {
      const tooLongMessage = {
        message: "a".repeat(501),
      };

      const result = joinRequestSchema.safeParse(tooLongMessage);
      expect(result.success).toBe(false);
    });
  });

  describe("createInvitationSchema", () => {
    it("유효한 초대 입력을 통과해야 함", () => {
      const validInput = {
        teamCode: "TEAM001",
        teamName: "우수팀",
        hackathonSlug: "test-hackathon-2026",
        inviteeId: "user-123",
        inviteeName: "김코더",
      };

      const result = createInvitationSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it("teamCode 없이 실패해야 함", () => {
      const invalidInput = {
        teamName: "우수팀",
        hackathonSlug: "test-hackathon-2026",
      };

      const result = createInvitationSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it("teamName 없이 실패해야 함", () => {
      const invalidInput = {
        teamCode: "TEAM001",
        hackathonSlug: "test-hackathon-2026",
      };

      const result = createInvitationSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it("inviteeId와 inviteeName은 선택사항임", () => {
      const input = {
        teamCode: "TEAM001",
        teamName: "우수팀",
        hackathonSlug: "test-hackathon-2026",
      };

      const result = createInvitationSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });

  describe("teamQuerySchema", () => {
    it("유효한 쿼리 파라미터를 통과해야 함", () => {
      const validQuery = {
        hackathonSlug: "test-hackathon-2026",
        page: "1",
        size: "20",
      };

      const result = teamQuerySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.size).toBe(20);
      }
    });

    it("기본값들이 적용되어야 함", () => {
      const emptyQuery = {};

      const result = teamQuerySchema.safeParse(emptyQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.size).toBe(20);
        expect(result.data.hackathonSlug).toBeUndefined();
      }
    });

    it("page/size 문자열을 숫자로 강제 변환해야 함", () => {
      const stringQuery = {
        page: "3",
        size: "50",
      };

      const result = teamQuerySchema.safeParse(stringQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(3);
        expect(result.data.size).toBe(50);
      }
    });

    it("0 이하의 page를 거부해야 함", () => {
      const invalidQuery = {
        page: "0",
      };

      const result = teamQuerySchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("크기가 100을 초과하면 거부해야 함", () => {
      const invalidQuery = {
        size: "150",
      };

      const result = teamQuerySchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("hackathonSlug는 선택사항임", () => {
      const queryWithoutSlug = {
        page: "1",
        size: "20",
      };

      const result = teamQuerySchema.safeParse(queryWithoutSlug);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.hackathonSlug).toBeUndefined();
      }
    });
  });
});
