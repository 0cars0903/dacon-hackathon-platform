import { z } from "zod";

// 포럼 글 작성 스키마
export const createPostSchema = z.object({
  hackathonSlug: z.string().min(1),
  title: z.string().min(1, "제목은 필수입니다").max(200),
  content: z.string().min(1, "내용은 필수입니다").max(10000),
  category: z.enum(["question", "discussion", "announcement", "bug"]),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;

// 포럼 댓글 작성 스키마
export const createCommentSchema = z.object({
  content: z.string().min(1, "댓글 내용은 필수입니다").max(2000),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
