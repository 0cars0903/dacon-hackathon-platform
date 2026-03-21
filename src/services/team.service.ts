// ============================================================
// Team Service — Business logic for team operations
// ============================================================
import * as data from "@/lib/supabase/data";
import { NotFoundError, ValidationError } from "@/lib/errors/api-error";
import type {
  Team,
  TeamMember,
  TeamChatMessage,
  TeamInvitation,
  TeamJoinRequest,
} from "@/types";

export interface CreateTeamInput {
  name: string;
  hackathonSlug: string;
  leaderUserId: string;
  leaderUserName: string;
  isOpen?: boolean;
  lookingFor?: string[];
  joinPolicy?: "auto" | "approval";
  intro?: string | null;
  contactType?: string | null;
  contactUrl?: string | null;
}

export interface UpdateTeamInput {
  name?: string;
  description?: string;
  isOpen?: boolean;
  lookingFor?: string[];
}

export interface SendTeamMessageInput {
  teamCode: string;
  userId: string;
  userName: string;
  message: string;
}

export interface CreateTeamInvitationInput {
  teamCode: string;
  teamName: string;
  hackathonSlug: string;
  invitedUserId?: string;
  invitedUserName?: string;
  invitedBy: string;
  message?: string;
}

export class TeamService {
  /**
   * Get all teams with pagination
   */
  static async list(query?: { hackathonSlug?: string; page?: number; size?: number }): Promise<{ items: Team[]; total: number }> {
    const teams = query?.hackathonSlug
      ? await data.getTeamsByHackathon(query.hackathonSlug)
      : await data.getTeams();

    const total = teams.length;
    const page = query?.page ?? 1;
    const size = query?.size ?? 20;
    const start = Math.max(0, (page - 1) * size);
    const items = teams.slice(start, start + size);

    return { items, total };
  }

  /**
   * Get teams by hackathon
   */
  static async getByHackathon(hackathonSlug: string): Promise<Team[]> {
    if (!hackathonSlug || hackathonSlug.trim() === "") {
      throw new ValidationError("Hackathon slug cannot be empty");
    }
    return data.getTeamsByHackathon(hackathonSlug);
  }

  /**
   * Get recommended teams based on interest tags
   */
  static async getRecommended(interestTags: string[]): Promise<Team[]> {
    return data.getRecommendedTeams(interestTags ?? []);
  }

  /**
   * Create a new team
   */
  static async create(input: CreateTeamInput): Promise<boolean> {
    if (!input.name || !input.hackathonSlug || !input.leaderUserId || !input.leaderUserName) {
      throw new ValidationError(
        "Name, hackathonSlug, leaderUserId, and leaderUserName are required"
      );
    }
    // Generate a unique team code
    const teamCode = `TEAM-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    return data.createTeam({
      teamCode,
      hackathonSlug: input.hackathonSlug,
      name: input.name,
      isOpen: input.isOpen,
      joinPolicy: input.joinPolicy,
      lookingFor: input.lookingFor,
      intro: input.intro ?? undefined,
      contactType: input.contactType ?? undefined,
      contactUrl: input.contactUrl ?? undefined,
      creatorId: input.leaderUserId,
      creatorName: input.leaderUserName,
    });
  }

  /**
   * Update team details
   */
  static async update(
    teamCode: string,
    input: UpdateTeamInput
  ): Promise<boolean> {
    if (!teamCode || teamCode.trim() === "") {
      throw new ValidationError("Team code cannot be empty");
    }
    return data.updateTeam(teamCode, input);
  }

  /**
   * Delete team
   */
  static async delete(teamCode: string): Promise<boolean> {
    if (!teamCode || teamCode.trim() === "") {
      throw new ValidationError("Team code cannot be empty");
    }
    return data.deleteTeam(teamCode);
  }

  /**
   * Update team join policy
   */
  static async updateJoinPolicy(
    teamCode: string,
    policy: "auto" | "approval"
  ): Promise<boolean> {
    if (!teamCode || teamCode.trim() === "") {
      throw new ValidationError("Team code cannot be empty");
    }
    if (!["auto", "approval"].includes(policy)) {
      throw new ValidationError(
        `Invalid policy: ${policy}. Must be one of: auto, approval`
      );
    }
    return data.updateTeamJoinPolicy(teamCode, policy);
  }

  /**
   * Request to join a team
   */
  static async requestJoin(
    teamCode: string,
    userId: string,
    userName: string,
    message?: string
  ): Promise<{ status: "joined" | "pending" | "error"; error?: string }> {
    if (!teamCode || !userId || !userName) {
      throw new ValidationError(
        "Team code, user ID, and user name are required"
      );
    }
    return data.requestJoinTeam(teamCode, userId, userName, message);
  }

  /**
   * Get join requests for a team
   */
  static async getJoinRequests(teamCode: string): Promise<TeamJoinRequest[]> {
    if (!teamCode || teamCode.trim() === "") {
      throw new ValidationError("Team code cannot be empty");
    }
    return data.getJoinRequests(teamCode);
  }

  /**
   * Handle join request (accept or reject)
   */
  static async handleJoinRequest(
    requestId: string,
    action: "accepted" | "rejected"
  ): Promise<boolean> {
    if (!requestId || requestId.trim() === "") {
      throw new ValidationError("Request ID cannot be empty");
    }
    if (!["accepted", "rejected"].includes(action)) {
      throw new ValidationError(
        `Invalid action: ${action}. Must be one of: accepted, rejected`
      );
    }
    return data.handleJoinRequest(requestId, action);
  }

  /**
   * Leave team
   */
  static async leave(
    teamCode: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!teamCode || !userId) {
      throw new ValidationError("Team code and user ID are required");
    }
    return data.leaveTeam(teamCode, userId);
  }

  /**
   * Send message to team chat
   */
  static async sendMessage(input: SendTeamMessageInput): Promise<boolean> {
    if (!input.teamCode || !input.userId || !input.userName || !input.message) {
      throw new ValidationError(
        "Team code, user ID, user name, and message are required"
      );
    }
    return data.sendTeamMessage(
      input.teamCode,
      input.userId,
      input.userName,
      input.message
    );
  }

  /**
   * Get team chat messages
   */
  static async getMessages(teamCode: string): Promise<TeamChatMessage[]> {
    if (!teamCode || teamCode.trim() === "") {
      throw new ValidationError("Team code cannot be empty");
    }
    return data.getTeamMessages(teamCode);
  }

  /**
   * Create team invitation
   */
  static async createInvitation(
    input: CreateTeamInvitationInput
  ): Promise<TeamInvitation | null> {
    if (
      !input.teamCode ||
      !input.invitedBy
    ) {
      throw new ValidationError(
        "Team code and inviter ID are required"
      );
    }
    return data.createTeamInvitation(
      input.teamCode,
      input.teamName,
      input.hackathonSlug || "",
      input.invitedBy,
      input.invitedBy,
      input.invitedUserId,
      input.invitedUserName
    );
  }

  /**
   * Get invitation by code
   */
  static async getInvitation(inviteCode: string): Promise<TeamInvitation | null> {
    if (!inviteCode || inviteCode.trim() === "") {
      throw new ValidationError("Invite code cannot be empty");
    }
    return data.getInvitationByCode(inviteCode);
  }

  /**
   * Get invitations for user
   */
  static async getInvitationsForUser(userId: string): Promise<TeamInvitation[]> {
    if (!userId || userId.trim() === "") {
      throw new ValidationError("User ID cannot be empty");
    }
    return data.getInvitationsForUser(userId);
  }

  /**
   * Get invitations for team
   */
  static async getInvitationsByTeam(teamCode: string): Promise<TeamInvitation[]> {
    if (!teamCode || teamCode.trim() === "") {
      throw new ValidationError("Team code cannot be empty");
    }
    return data.getInvitationsByTeam(teamCode);
  }

  /**
   * Accept team invitation
   */
  static async acceptInvitation(
    invitationId: string,
    userId: string,
    userName: string
  ): Promise<boolean> {
    if (!invitationId || !userId || !userName) {
      throw new ValidationError(
        "Invitation ID, user ID, and user name are required"
      );
    }
    return data.acceptInvitation(invitationId, userId, userName);
  }

  /**
   * Reject team invitation
   */
  static async rejectInvitation(invitationId: string): Promise<boolean> {
    if (!invitationId || invitationId.trim() === "") {
      throw new ValidationError("Invitation ID cannot be empty");
    }
    return data.rejectInvitation(invitationId);
  }

  /**
   * Join team using invite code
   */
  static async joinByInviteCode(
    inviteCode: string,
    userId: string,
    userName: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!inviteCode || !userId || !userName) {
      throw new ValidationError(
        "Invite code, user ID, and user name are required"
      );
    }
    return data.joinByInviteCode(inviteCode, userId, userName);
  }
}
