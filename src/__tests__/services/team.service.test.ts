import { describe, it, expect, vi, beforeEach } from "vitest";
import { TeamService } from "@/services/team.service";
import { NotFoundError, ValidationError } from "@/lib/errors/api-error";
import type { Team, TeamJoinRequest } from "@/types";

// Mock the data layer
vi.mock("@/lib/supabase/data", () => ({
  getTeams: vi.fn(),
  getTeamsByHackathon: vi.fn(),
  getRecommendedTeams: vi.fn(),
  createTeam: vi.fn(),
  updateTeam: vi.fn(),
  deleteTeam: vi.fn(),
  updateTeamJoinPolicy: vi.fn(),
  requestJoinTeam: vi.fn(),
  getJoinRequests: vi.fn(),
  handleJoinRequest: vi.fn(),
  leaveTeam: vi.fn(),
  sendTeamMessage: vi.fn(),
  getTeamMessages: vi.fn(),
  createTeamInvitation: vi.fn(),
  getInvitationByCode: vi.fn(),
  getInvitationsForUser: vi.fn(),
  getInvitationsByTeam: vi.fn(),
  acceptInvitation: vi.fn(),
  rejectInvitation: vi.fn(),
  joinByInviteCode: vi.fn(),
}));

import * as data from "@/lib/supabase/data";

// Test data
const mockTeam: Team = {
  teamCode: "TEAM001",
  hackathonSlug: "test-hackathon-2026",
  name: "우수팀",
  isOpen: true,
  joinPolicy: "auto",
  lookingFor: ["Backend", "Frontend"],
  intro: "우리는 최고의 팀입니다",
  contact: { type: "discord", url: "https://discord.gg/team123" },
  memberCount: 3,
  members: [
    { userId: "user-001", name: "김코더", role: "팀장", joinedAt: "2026-01-15T00:00:00Z" },
  ],
  createdAt: "2026-01-15T00:00:00Z",
};

const mockJoinRequest: TeamJoinRequest = {
  id: "req-001",
  teamCode: "TEAM001",
  userId: "user-002",
  userName: "이개발",
  message: "팀에 들어가고 싶습니다",
  status: "pending",
  createdAt: "2026-02-01T00:00:00Z",
};

describe("TeamService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("list()", () => {
    it("모든 팀을 반환해야 함", async () => {
      const mockTeams = [mockTeam, { ...mockTeam, teamCode: "TEAM002" }];
      vi.mocked(data.getTeams).mockResolvedValue(mockTeams as any);

      const result = await TeamService.list();

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(data.getTeams).toHaveBeenCalled();
    });

    it("빈 팀 목록을 반환할 수 있음", async () => {
      vi.mocked(data.getTeams).mockResolvedValue([]);

      const result = await TeamService.list();

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe("getByHackathon()", () => {
    it("해커톤별 팀을 반환해야 함", async () => {
      const mockTeams = [mockTeam];
      vi.mocked(data.getTeamsByHackathon).mockResolvedValue(mockTeams as any);

      const result = await TeamService.getByHackathon("test-hackathon-2026");

      expect(result).toHaveLength(1);
      expect(result[0].hackathonSlug).toBe("test-hackathon-2026");
      expect(data.getTeamsByHackathon).toHaveBeenCalledWith(
        "test-hackathon-2026"
      );
    });

    it("여러 팀을 반환할 수 있음", async () => {
      const team2 = { ...mockTeam, teamCode: "TEAM002" };
      const team3 = { ...mockTeam, teamCode: "TEAM003" };
      vi.mocked(data.getTeamsByHackathon).mockResolvedValue(
        [mockTeam, team2, team3] as any
      );

      const result = await TeamService.getByHackathon("test-hackathon-2026");

      expect(result).toHaveLength(3);
    });

    it("해커톤에 팀이 없으면 빈 배열을 반환해야 함", async () => {
      vi.mocked(data.getTeamsByHackathon).mockResolvedValue([]);

      const result = await TeamService.getByHackathon(
        "non-existent-hackathon"
      );

      expect(result).toHaveLength(0);
    });

    it("빈 hackathonSlug에 대해 ValidationError를 던져야 함", async () => {
      await expect(TeamService.getByHackathon("")).rejects.toThrow(
        ValidationError
      );
    });

    it("공백만 있는 hackathonSlug에 대해 ValidationError를 던져야 함", async () => {
      await expect(TeamService.getByHackathon("   ")).rejects.toThrow(
        ValidationError
      );
    });
  });

  describe("getRecommended()", () => {
    it("관심 태그 기반 추천 팀을 반환해야 함", async () => {
      const mockTeams = [mockTeam];
      vi.mocked(data.getRecommendedTeams).mockResolvedValue(mockTeams as any);

      const result = await TeamService.getRecommended(["Backend", "AI"]);

      expect(result).toEqual(mockTeams);
      expect(data.getRecommendedTeams).toHaveBeenCalledWith(["Backend", "AI"]);
    });

    it("빈 배열을 처리해야 함", async () => {
      const mockTeams = [mockTeam];
      vi.mocked(data.getRecommendedTeams).mockResolvedValue(mockTeams as any);

      const result = await TeamService.getRecommended([]);

      expect(result).toEqual(mockTeams);
      expect(data.getRecommendedTeams).toHaveBeenCalledWith([]);
    });
  });

  describe("create()", () => {
    it("새 팀을 생성해야 함", async () => {
      vi.mocked(data.createTeam).mockResolvedValue(true);

      const input = {
        name: "새로운팀",
        hackathonSlug: "test-hackathon-2026",
        leaderUserId: "user-001",
        leaderUserName: "김코더",
        isOpen: true,
        joinPolicy: "auto" as const,
        lookingFor: ["Backend"],
      };

      const result = await TeamService.create(input);

      expect(result).toBe(true);
      expect(data.createTeam).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "새로운팀",
          hackathonSlug: "test-hackathon-2026",
          creatorId: "user-001",
          isOpen: true,
          joinPolicy: "auto",
          lookingFor: ["Backend"],
        })
      );
    });

    it("팀 이름 없이 ValidationError를 던져야 함", async () => {
      const input = {
        hackathonSlug: "test-hackathon-2026",
        leaderUserId: "user-001",
        leaderUserName: "김코더",
      };

      await expect(TeamService.create(input as any)).rejects.toThrow(
        ValidationError
      );
    });

    it("hackathonSlug 없이 ValidationError를 던져야 함", async () => {
      const input = {
        name: "새로운팀",
        leaderUserId: "user-001",
        leaderUserName: "김코더",
      };

      await expect(TeamService.create(input as any)).rejects.toThrow(
        ValidationError
      );
    });

    it("leaderUserId 없이 ValidationError를 던져야 함", async () => {
      const input = {
        name: "새로운팀",
        hackathonSlug: "test-hackathon-2026",
        leaderUserName: "김코더",
      };

      await expect(TeamService.create(input as any)).rejects.toThrow(
        ValidationError
      );
    });
  });

  describe("update()", () => {
    it("팀을 업데이트해야 함", async () => {
      vi.mocked(data.updateTeam).mockResolvedValue(true);

      const input = {
        name: "업데이트된팀",
        isOpen: false,
      };

      const result = await TeamService.update("TEAM001", input);

      expect(result).toBe(true);
      expect(data.updateTeam).toHaveBeenCalledWith("TEAM001", input);
    });

    it("빈 teamCode에 대해 ValidationError를 던져야 함", async () => {
      const input = { name: "새이름" };

      await expect(TeamService.update("", input)).rejects.toThrow(
        ValidationError
      );
    });

    it("공백만 있는 teamCode에 대해 ValidationError를 던져야 함", async () => {
      const input = { name: "새이름" };

      await expect(TeamService.update("   ", input)).rejects.toThrow(
        ValidationError
      );
    });
  });

  describe("delete()", () => {
    it("팀을 삭제해야 함", async () => {
      vi.mocked(data.deleteTeam).mockResolvedValue(true);

      const result = await TeamService.delete("TEAM001");

      expect(result).toBe(true);
      expect(data.deleteTeam).toHaveBeenCalledWith("TEAM001");
    });

    it("빈 teamCode에 대해 ValidationError를 던져야 함", async () => {
      await expect(TeamService.delete("")).rejects.toThrow(ValidationError);
    });

    it("공백만 있는 teamCode에 대해 ValidationError를 던져야 함", async () => {
      await expect(TeamService.delete("   ")).rejects.toThrow(
        ValidationError
      );
    });
  });

  describe("updateJoinPolicy()", () => {
    it("팀 참가 정책을 업데이트해야 함", async () => {
      vi.mocked(data.updateTeamJoinPolicy).mockResolvedValue(true);

      const result = await TeamService.updateJoinPolicy("TEAM001", "approval");

      expect(result).toBe(true);
      expect(data.updateTeamJoinPolicy).toHaveBeenCalledWith(
        "TEAM001",
        "approval"
      );
    });

    it("빈 teamCode에 대해 ValidationError를 던져야 함", async () => {
      await expect(
        TeamService.updateJoinPolicy("", "auto")
      ).rejects.toThrow(ValidationError);
    });

    it("유효하지 않은 정책에 대해 ValidationError를 던져야 함", async () => {
      await expect(
        TeamService.updateJoinPolicy("TEAM001", "invalid" as any)
      ).rejects.toThrow(ValidationError);
    });
  });

  describe("requestJoin()", () => {
    it("팀 참가 요청을 만들어야 함", async () => {
      vi.mocked(data.requestJoinTeam).mockResolvedValue(mockJoinRequest as any);

      const result = await TeamService.requestJoin(
        "TEAM001",
        "user-002",
        "이개발",
        "팀에 들어가고 싶습니다"
      );

      expect(result.status).toBe("pending");
      expect(data.requestJoinTeam).toHaveBeenCalledWith(
        "TEAM001",
        "user-002",
        "이개발",
        "팀에 들어가고 싶습니다"
      );
    });

    it("teamCode 없이 ValidationError를 던져야 함", async () => {
      await expect(
        TeamService.requestJoin("", "user-002", "이개발")
      ).rejects.toThrow(ValidationError);
    });

    it("userId 없이 ValidationError를 던져야 함", async () => {
      await expect(
        TeamService.requestJoin("TEAM001", "", "이개발")
      ).rejects.toThrow(ValidationError);
    });

    it("userName 없이 ValidationError를 던져야 함", async () => {
      await expect(
        TeamService.requestJoin("TEAM001", "user-002", "")
      ).rejects.toThrow(ValidationError);
    });
  });

  describe("getJoinRequests()", () => {
    it("팀의 참가 요청을 반환해야 함", async () => {
      const mockRequests = [mockJoinRequest];
      vi.mocked(data.getJoinRequests).mockResolvedValue(mockRequests as any);

      const result = await TeamService.getJoinRequests("TEAM001");

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe("pending");
      expect(data.getJoinRequests).toHaveBeenCalledWith("TEAM001");
    });

    it("빈 teamCode에 대해 ValidationError를 던져야 함", async () => {
      await expect(TeamService.getJoinRequests("")).rejects.toThrow(
        ValidationError
      );
    });
  });

  describe("handleJoinRequest()", () => {
    it("참가 요청을 수락해야 함", async () => {
      vi.mocked(data.handleJoinRequest).mockResolvedValue(true);

      const result = await TeamService.handleJoinRequest(
        "req-001",
        "accepted"
      );

      expect(result).toBe(true);
      expect(data.handleJoinRequest).toHaveBeenCalledWith("req-001", "accepted");
    });

    it("참가 요청을 거부해야 함", async () => {
      vi.mocked(data.handleJoinRequest).mockResolvedValue(true);

      const result = await TeamService.handleJoinRequest("req-001", "rejected");

      expect(result).toBe(true);
      expect(data.handleJoinRequest).toHaveBeenCalledWith("req-001", "rejected");
    });

    it("빈 requestId에 대해 ValidationError를 던져야 함", async () => {
      await expect(
        TeamService.handleJoinRequest("", "accepted")
      ).rejects.toThrow(ValidationError);
    });

    it("유효하지 않은 action에 대해 ValidationError를 던져야 함", async () => {
      await expect(
        TeamService.handleJoinRequest("req-001", "invalid" as any)
      ).rejects.toThrow(ValidationError);
    });
  });

  describe("leave()", () => {
    it("팀을 떠날 수 있음", async () => {
      vi.mocked(data.leaveTeam).mockResolvedValue({ success: true } as any);

      const result = await TeamService.leave("TEAM001", "user-001");

      expect(result.success).toBe(true);
      expect(data.leaveTeam).toHaveBeenCalledWith("TEAM001", "user-001");
    });

    it("teamCode 없이 ValidationError를 던져야 함", async () => {
      await expect(TeamService.leave("", "user-001")).rejects.toThrow(
        ValidationError
      );
    });

    it("userId 없이 ValidationError를 던져야 함", async () => {
      await expect(TeamService.leave("TEAM001", "")).rejects.toThrow(
        ValidationError
      );
    });
  });

  describe("sendMessage()", () => {
    it("팀 채팅 메시지를 보내야 함", async () => {
      vi.mocked(data.sendTeamMessage).mockResolvedValue(true);

      const result = await TeamService.sendMessage({
        teamCode: "TEAM001",
        userId: "user-001",
        userName: "김코더",
        message: "안녕하세요!",
      });

      expect(result).toBe(true);
      expect(data.sendTeamMessage).toHaveBeenCalledWith(
        "TEAM001",
        "user-001",
        "김코더",
        "안녕하세요!"
      );
    });

    it("필수 필드가 없으면 ValidationError를 던져야 함", async () => {
      await expect(
        TeamService.sendMessage({
          teamCode: "TEAM001",
          userId: "user-001",
          userName: "김코더",
          message: "", // message 빈 문자열
        })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe("getMessages()", () => {
    it("팀 채팅 메시지를 반환해야 함", async () => {
      const mockMessages = [
        {
          id: "msg-001",
          teamCode: "TEAM001",
          userId: "user-001",
          userName: "김코더",
          content: "안녕하세요!",
          createdAt: "2026-02-01T00:00:00Z",
        },
      ];
      vi.mocked(data.getTeamMessages).mockResolvedValue(mockMessages as any);

      const result = await TeamService.getMessages("TEAM001");

      expect(result).toHaveLength(1);
      expect(data.getTeamMessages).toHaveBeenCalledWith("TEAM001");
    });

    it("빈 teamCode에 대해 ValidationError를 던져야 함", async () => {
      await expect(TeamService.getMessages("")).rejects.toThrow(
        ValidationError
      );
    });
  });

  describe("createInvitation()", () => {
    it("팀 초대를 생성해야 함", async () => {
      const mockInvitation = {
        id: "inv-001",
        teamCode: "TEAM001",
        teamName: "우수팀",
        hackathonSlug: "test-hackathon-2026",
        inviteCode: "INVITE-ABC123",
        inviterId: "user-001",
        inviterName: "김코더",
        status: "pending" as const,
        createdAt: "2026-02-01T00:00:00Z",
        expiresAt: "2026-02-03T00:00:00Z",
      };
      vi.mocked(data.createTeamInvitation).mockResolvedValue(mockInvitation as any);

      const input = {
        teamCode: "TEAM001",
        teamName: "우수팀",
        hackathonSlug: "test-hackathon-2026",
        invitedUserId: "user-002",
        invitedUserName: "이개발",
        invitedBy: "user-001",
        message: "우리 팀에 들어가세요!",
      };

      const result = await TeamService.createInvitation(input);

      expect(result).toEqual(mockInvitation);
      expect(data.createTeamInvitation).toHaveBeenCalledWith(
        "TEAM001",
        "우수팀",
        "test-hackathon-2026",
        "user-001",
        "user-001",
        "user-002",
        "이개발"
      );
    });

    it("필수 필드가 없으면 ValidationError를 던져야 함", async () => {
      const input = {
        // teamCode 누락
        invitedUserId: "user-002",
        invitedUserName: "이개발",
        // invitedBy 누락
      };

      await expect(
        TeamService.createInvitation(input as any)
      ).rejects.toThrow(ValidationError);
    });
  });

  describe("getInvitation()", () => {
    it("초대 코드로 초대를 반환해야 함", async () => {
      const mockInvitation = {
        id: "inv-001",
        teamCode: "TEAM001",
        invitedUserId: "user-002",
        inviteCode: "INVITE-ABC123",
        status: "pending",
        createdAt: "2026-02-01T00:00:00Z",
      };
      vi.mocked(data.getInvitationByCode).mockResolvedValue(
        mockInvitation as any
      );

      const result = await TeamService.getInvitation("INVITE-ABC123");

      expect(result).toEqual(mockInvitation);
      expect(data.getInvitationByCode).toHaveBeenCalledWith("INVITE-ABC123");
    });

    it("빈 inviteCode에 대해 ValidationError를 던져야 함", async () => {
      await expect(TeamService.getInvitation("")).rejects.toThrow(
        ValidationError
      );
    });
  });

  describe("getInvitationsForUser()", () => {
    it("사용자의 초대를 반환해야 함", async () => {
      const mockInvitations = [
        {
          id: "inv-001",
          teamCode: "TEAM001",
          teamName: "우수팀",
          inviteCode: "INVITE-ABC123",
        },
      ];
      vi.mocked(data.getInvitationsForUser).mockResolvedValue(
        mockInvitations as any
      );

      const result = await TeamService.getInvitationsForUser("user-002");

      expect(result).toHaveLength(1);
      expect(data.getInvitationsForUser).toHaveBeenCalledWith("user-002");
    });

    it("빈 userId에 대해 ValidationError를 던져야 함", async () => {
      await expect(TeamService.getInvitationsForUser("")).rejects.toThrow(
        ValidationError
      );
    });
  });

  describe("getInvitationsByTeam()", () => {
    it("팀의 초대를 반환해야 함", async () => {
      const mockInvitations = [
        {
          id: "inv-001",
          teamCode: "TEAM001",
          invitedUserId: "user-002",
          inviteCode: "INVITE-ABC123",
        },
      ];
      vi.mocked(data.getInvitationsByTeam).mockResolvedValue(
        mockInvitations as any
      );

      const result = await TeamService.getInvitationsByTeam("TEAM001");

      expect(result).toHaveLength(1);
      expect(data.getInvitationsByTeam).toHaveBeenCalledWith("TEAM001");
    });

    it("빈 teamCode에 대해 ValidationError를 던져야 함", async () => {
      await expect(TeamService.getInvitationsByTeam("")).rejects.toThrow(
        ValidationError
      );
    });
  });

  describe("acceptInvitation()", () => {
    it("초대를 수락해야 함", async () => {
      vi.mocked(data.acceptInvitation).mockResolvedValue(true);

      const result = await TeamService.acceptInvitation(
        "inv-001",
        "user-002",
        "이개발"
      );

      expect(result).toBe(true);
      expect(data.acceptInvitation).toHaveBeenCalledWith(
        "inv-001",
        "user-002",
        "이개발"
      );
    });

    it("필수 필드가 없으면 ValidationError를 던져야 함", async () => {
      await expect(
        TeamService.acceptInvitation("", "user-002", "이개발")
      ).rejects.toThrow(ValidationError);
    });
  });

  describe("rejectInvitation()", () => {
    it("초대를 거부해야 함", async () => {
      vi.mocked(data.rejectInvitation).mockResolvedValue(true);

      const result = await TeamService.rejectInvitation("inv-001");

      expect(result).toBe(true);
      expect(data.rejectInvitation).toHaveBeenCalledWith("inv-001");
    });

    it("빈 invitationId에 대해 ValidationError를 던져야 함", async () => {
      await expect(TeamService.rejectInvitation("")).rejects.toThrow(
        ValidationError
      );
    });
  });

  describe("joinByInviteCode()", () => {
    it("초대 코드로 팀에 들어가야 함", async () => {
      vi.mocked(data.joinByInviteCode).mockResolvedValue({ success: true } as any);

      const result = await TeamService.joinByInviteCode(
        "INVITE-ABC123",
        "user-002",
        "이개발"
      );

      expect(result).toEqual({ success: true });
      expect(data.joinByInviteCode).toHaveBeenCalledWith(
        "INVITE-ABC123",
        "user-002",
        "이개발"
      );
    });

    it("필수 필드가 없으면 ValidationError를 던져야 함", async () => {
      await expect(
        TeamService.joinByInviteCode("", "user-002", "이개발")
      ).rejects.toThrow(ValidationError);
    });
  });
});
