// ============================================================
// Submission Service — Business logic for submission operations
// ============================================================
import * as data from "@/lib/supabase/data";
import { NotFoundError, ValidationError } from "@/lib/errors/api-error";
import type { Submission, Leaderboard } from "@/types";
import type { ScoredSubmission } from "@/lib/supabase/data";

export interface UpdateSubmissionInput {
  title?: string;
  description?: string;
  teamCode?: string;
  projectLink?: string;
  videoLink?: string;
  documentLink?: string;
  demonstrationLink?: string;
  ideaRating?: number;
  implementationRating?: number;
  creativityRating?: number;
  totalScore?: number;
}

export interface SubmissionScoreInput {
  ideaRating: number;
  implementationRating: number;
  creativityRating: number;
  totalScore: number;
  feedback?: string;
}

export class SubmissionService {
  /**
   * Get submission for a hackathon and user
   */
  static async get(
    hackathonSlug: string,
    userId: string
  ): Promise<Submission> {
    if (!hackathonSlug || !userId) {
      throw new ValidationError(
        "Hackathon slug and user ID are required"
      );
    }
    const submission = await data.getSubmission(hackathonSlug, userId);
    if (!submission) {
      throw new NotFoundError("Submission", `${hackathonSlug}/${userId}`);
    }
    return submission;
  }

  /**
   * Save or update submission
   */
  static async save(
    hackathonSlug: string,
    userId: string,
    submission: Partial<Submission>
  ): Promise<boolean> {
    if (!hackathonSlug || !userId) {
      throw new ValidationError(
        "Hackathon slug and user ID are required"
      );
    }
    return data.saveSubmission(hackathonSlug, userId, submission);
  }

  /**
   * Get all submissions for a hackathon
   */
  static async getByHackathon(hackathonSlug: string): Promise<ScoredSubmission[]> {
    if (!hackathonSlug || hackathonSlug.trim() === "") {
      throw new ValidationError("Hackathon slug cannot be empty");
    }
    return data.getSubmissionsByHackathon(hackathonSlug);
  }

  /**
   * Get all submissions by a user
   */
  static async getByUser(userId: string): Promise<ScoredSubmission[]> {
    if (!userId || userId.trim() === "") {
      throw new ValidationError("User ID cannot be empty");
    }
    return data.getUserSubmissions(userId);
  }

  /**
   * Get submission for a user in a specific hackathon
   */
  static async getUserSubmission(
    hackathonSlug: string,
    userId: string
  ): Promise<ScoredSubmission | undefined> {
    if (!hackathonSlug || !userId) {
      throw new ValidationError(
        "Hackathon slug and user ID are required"
      );
    }
    return data.getUserSubmission(hackathonSlug, userId);
  }

  /**
   * Save complete submission with details
   */
  static async saveFull(
    hackathonSlug: string,
    userId: string,
    userName: string,
    submission: {
      items: Submission["items"];
      files?: Array<{ name: string; size: number; type: string }>;
      status: "draft" | "submitted";
      version?: number;
    }
  ): Promise<boolean> {
    if (!hackathonSlug || !userId || !userName) {
      throw new ValidationError(
        "Hackathon slug, user ID, and user name are required"
      );
    }
    return data.saveFullSubmission(hackathonSlug, userId, userName, submission);
  }

  /**
   * Save submission score
   */
  static async saveScore(
    submissionId: string,
    scoreData: SubmissionScoreInput
  ): Promise<boolean> {
    if (!submissionId) {
      throw new ValidationError("Submission ID is required");
    }
    if (
      scoreData.ideaRating === undefined ||
      scoreData.implementationRating === undefined ||
      scoreData.creativityRating === undefined ||
      scoreData.totalScore === undefined
    ) {
      throw new ValidationError(
        "All rating scores (idea, implementation, creativity, total) are required"
      );
    }
    const scoreDetails = {
      ideaRating: scoreData.ideaRating,
      implementationRating: scoreData.implementationRating,
      creativityRating: scoreData.creativityRating,
      feedback: scoreData.feedback,
    };
    return data.saveSubmissionScore(submissionId, scoreData.totalScore, scoreDetails);
  }

  /**
   * Get leaderboard for a hackathon
   */
  static async getLeaderboard(hackathonSlug: string): Promise<Leaderboard> {
    if (!hackathonSlug || hackathonSlug.trim() === "") {
      throw new ValidationError("Hackathon slug cannot be empty");
    }
    const leaderboard = await data.getLeaderboard(hackathonSlug);
    if (!leaderboard) {
      throw new NotFoundError("Leaderboard", hackathonSlug);
    }
    return leaderboard;
  }

  /**
   * Get all leaderboards
   */
  static async getAllLeaderboards(): Promise<Leaderboard[]> {
    return data.getAllLeaderboards();
  }

  /**
   * Update leaderboard
   */
  static async updateLeaderboard(
    hackathonSlug: string,
    entries: Leaderboard["entries"]
  ): Promise<boolean> {
    if (!hackathonSlug || hackathonSlug.trim() === "") {
      throw new ValidationError("Hackathon slug cannot be empty");
    }
    if (!entries || entries.length === 0) {
      throw new ValidationError("Entries cannot be empty");
    }
    return data.updateLeaderboard(hackathonSlug, entries);
  }
}
