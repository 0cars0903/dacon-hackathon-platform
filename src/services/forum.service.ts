// ============================================================
// Forum Service — Business logic for forum operations
// ============================================================
import * as data from "@/lib/supabase/data";
import { NotFoundError, ValidationError } from "@/lib/errors/api-error";
import type { ForumPost, ForumComment } from "@/types";

export interface CreateForumPostInput {
  hackathonSlug: string;
  userId: string;
  userName: string;
  authorId: string;
  authorName: string;
  title: string;
  content: string;
  category?: string;
}

export interface CreateForumCommentInput {
  postId: string;
  userId: string;
  userName: string;
  authorId: string;
  authorName: string;
  content: string;
}

export class ForumService {
  /**
   * Get forum posts for a hackathon
   */
  static async getPosts(hackathonSlug: string): Promise<ForumPost[]> {
    if (!hackathonSlug || hackathonSlug.trim() === "") {
      throw new ValidationError("Hackathon slug cannot be empty");
    }
    return data.getForumPosts(hackathonSlug);
  }

  /**
   * Get comments on a forum post
   */
  static async getComments(postId: string): Promise<ForumComment[]> {
    if (!postId || postId.trim() === "") {
      throw new ValidationError("Post ID cannot be empty");
    }
    return data.getForumComments(postId);
  }

  /**
   * Create a new forum post
   */
  static async createPost(input: CreateForumPostInput): Promise<ForumPost | null> {
    if (
      !input.hackathonSlug ||
      !input.authorId ||
      !input.authorName ||
      !input.title ||
      !input.content
    ) {
      throw new ValidationError(
        "Hackathon slug, author ID, author name, title, and content are required"
      );
    }
    return data.createForumPost({
      hackathonSlug: input.hackathonSlug,
      authorId: input.authorId,
      authorName: input.authorName,
      title: input.title,
      content: input.content,
      category: input.category,
    });
  }

  /**
   * Create a forum comment
   */
  static async createComment(input: CreateForumCommentInput): Promise<ForumComment | null> {
    if (
      !input.postId ||
      !input.authorId ||
      !input.authorName ||
      !input.content
    ) {
      throw new ValidationError(
        "Post ID, author ID, author name, and content are required"
      );
    }
    return data.createForumComment({
      postId: input.postId,
      authorId: input.authorId,
      authorName: input.authorName,
      content: input.content,
    });
  }

  /**
   * Toggle like on forum post
   */
  static async togglePostLike(postId: string, userId: string): Promise<boolean> {
    if (!postId || !userId) {
      throw new ValidationError("Post ID and user ID are required");
    }
    return data.toggleForumPostLike(postId, userId);
  }

  /**
   * Toggle like on forum comment
   */
  static async toggleCommentLike(
    commentId: string,
    userId: string
  ): Promise<boolean> {
    if (!commentId || !userId) {
      throw new ValidationError("Comment ID and user ID are required");
    }
    return data.toggleForumCommentLike(commentId, userId);
  }
}
