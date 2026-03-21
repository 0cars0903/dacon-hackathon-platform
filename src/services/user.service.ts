// ============================================================
// User Service — Business logic for user operations
// ============================================================
import * as data from "@/lib/supabase/data";
import { NotFoundError, ValidationError } from "@/lib/errors/api-error";
import type { UserProfile, UserPreferences, DirectMessage, Conversation, FollowRelation } from "@/types";

export interface UpdateProfileInput {
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  websiteUrl?: string;
  location?: string;
  company?: string;
}

export interface SendDirectMessageInput {
  senderId: string;
  senderName: string;
  recipientId: string;
  recipientName: string;
  message: string;
}

export class UserService {
  /**
   * Get user profile
   */
  static async getProfile(userId: string): Promise<UserProfile> {
    if (!userId || userId.trim() === "") {
      throw new ValidationError("User ID cannot be empty");
    }
    const profile = await data.getProfile(userId);
    if (!profile) {
      throw new NotFoundError("UserProfile", userId);
    }
    return profile;
  }

  /**
   * Update user profile
   */
  static async updateProfile(
    userId: string,
    updates: UpdateProfileInput
  ): Promise<boolean> {
    if (!userId || userId.trim() === "") {
      throw new ValidationError("User ID cannot be empty");
    }
    // Verify user exists
    await UserService.getProfile(userId);
    return data.updateProfile(userId, updates);
  }

  /**
   * Get user preferences
   */
  static async getPreferences(userId: string): Promise<UserPreferences> {
    if (!userId || userId.trim() === "") {
      throw new ValidationError("User ID cannot be empty");
    }
    return data.getUserPreferences(userId);
  }

  /**
   * Save user preferences
   */
  static async savePreferences(
    userId: string,
    prefs: Partial<UserPreferences>
  ): Promise<boolean> {
    if (!userId || userId.trim() === "") {
      throw new ValidationError("User ID cannot be empty");
    }
    return data.saveUserPreferences(userId, prefs);
  }

  /**
   * Get user bookmarks
   */
  static async getBookmarks(userId: string): Promise<string[]> {
    if (!userId || userId.trim() === "") {
      throw new ValidationError("User ID cannot be empty");
    }
    return data.getBookmarks(userId);
  }

  /**
   * Add bookmark
   */
  static async addBookmark(userId: string, hackathonSlug: string): Promise<boolean> {
    if (!userId || !hackathonSlug) {
      throw new ValidationError("User ID and hackathon slug are required");
    }
    return data.addBookmark(userId, hackathonSlug);
  }

  /**
   * Remove bookmark
   */
  static async removeBookmark(userId: string, hackathonSlug: string): Promise<boolean> {
    if (!userId || !hackathonSlug) {
      throw new ValidationError("User ID and hackathon slug are required");
    }
    return data.removeBookmark(userId, hackathonSlug);
  }

  /**
   * Check if hackathon is bookmarked
   */
  static async isBookmarked(userId: string, hackathonSlug: string): Promise<boolean> {
    if (!userId || !hackathonSlug) {
      throw new ValidationError("User ID and hackathon slug are required");
    }
    return data.isBookmarked(userId, hackathonSlug);
  }

  /**
   * Follow user
   */
  static async follow(followerId: string, followingId: string): Promise<boolean> {
    if (!followerId || !followingId) {
      throw new ValidationError("Follower ID and following ID are required");
    }
    if (followerId === followingId) {
      throw new ValidationError("Cannot follow yourself");
    }
    return data.followUser(followerId, followingId);
  }

  /**
   * Unfollow user
   */
  static async unfollow(followerId: string, followingId: string): Promise<boolean> {
    if (!followerId || !followingId) {
      throw new ValidationError("Follower ID and following ID are required");
    }
    return data.unfollowUser(followerId, followingId);
  }

  /**
   * Check if following user
   */
  static async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    if (!followerId || !followingId) {
      throw new ValidationError("Follower ID and following ID are required");
    }
    return data.isFollowing(followerId, followingId);
  }

  /**
   * Get followers of user
   */
  static async getFollowers(userId: string): Promise<FollowRelation[]> {
    if (!userId || userId.trim() === "") {
      throw new ValidationError("User ID cannot be empty");
    }
    return data.getFollowers(userId);
  }

  /**
   * Get users that user is following
   */
  static async getFollowing(userId: string): Promise<FollowRelation[]> {
    if (!userId || userId.trim() === "") {
      throw new ValidationError("User ID cannot be empty");
    }
    return data.getFollowing(userId);
  }

  /**
   * Get follow counts for user
   */
  static async getFollowCounts(
    userId: string
  ): Promise<{ followers: number; following: number }> {
    if (!userId || userId.trim() === "") {
      throw new ValidationError("User ID cannot be empty");
    }
    return data.getFollowCounts(userId);
  }

  /**
   * Send direct message
   */
  static async sendMessage(input: SendDirectMessageInput): Promise<DirectMessage | null> {
    if (!input.senderId || !input.senderName || !input.recipientId || !input.recipientName || !input.message) {
      throw new ValidationError(
        "Sender ID, sender name, recipient ID, recipient name, and message are required"
      );
    }
    if (input.senderId === input.recipientId) {
      throw new ValidationError("Cannot send message to yourself");
    }
    return data.sendMessage(
      input.senderId,
      input.senderName,
      input.recipientId,
      input.recipientName,
      input.message
    );
  }

  /**
   * Get conversation between two users
   */
  static async getConversation(
    userId: string,
    partnerId: string
  ): Promise<DirectMessage[]> {
    if (!userId || !partnerId) {
      throw new ValidationError("User ID and partner ID are required");
    }
    return data.getConversation(userId, partnerId);
  }

  /**
   * Get all conversations for user
   */
  static async getConversationList(userId: string): Promise<Conversation[]> {
    if (!userId || userId.trim() === "") {
      throw new ValidationError("User ID cannot be empty");
    }
    return data.getConversationList(userId);
  }

  /**
   * Mark messages as read
   */
  static async markMessagesRead(userId: string, partnerId: string): Promise<void> {
    if (!userId || !partnerId) {
      throw new ValidationError("User ID and partner ID are required");
    }
    return data.markMessagesRead(userId, partnerId);
  }

  /**
   * Get unread message count for user
   */
  static async getUnreadMessageCount(userId: string): Promise<number> {
    if (!userId || userId.trim() === "") {
      throw new ValidationError("User ID cannot be empty");
    }
    return data.getUnreadMessageCount(userId);
  }
}
