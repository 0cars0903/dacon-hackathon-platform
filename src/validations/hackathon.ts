import { z } from "zod";

// 해커톤 생성 스키마
export const createHackathonSchema = z.object({
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, "slug는 영문 소문자, 숫자, 하이픈만 가능합니다"),
  title: z.string().min(1, "제목은 필수입니다").max(200),
  status: z.enum(["ongoing", "ended", "upcoming"]),
  tags: z.array(z.string().min(1).max(50)).min(1, "태그는 최소 1개 필요합니다"),
  thumbnailUrl: z.string().url().optional().nullish(),
  timezone: z.string().default("Asia/Seoul"),
  submissionDeadlineAt: z.string().datetime({ offset: true }).optional().nullish(),
  endAt: z.string().datetime({ offset: true }).optional().nullish(),
  detailLink: z.string().url().optional().nullish(),
  rulesLink: z.string().url().optional().nullish(),
  faqLink: z.string().url().optional().nullish(),
});

export type CreateHackathonInput = z.infer<typeof createHackathonSchema>;

// 해커톤 수정 스키마
export const updateHackathonSchema = createHackathonSchema.partial().omit({ slug: true });
export type UpdateHackathonInput = z.infer<typeof updateHackathonSchema>;

// 해커톤 상태 변경 스키마
export const changeStatusSchema = z.object({
  status: z.enum(["ongoing", "ended", "upcoming"]),
});

// 쿼리 파라미터 스키마 (목록 조회)
export const hackathonQuerySchema = z.object({
  status: z.enum(["all", "ongoing", "ended", "upcoming"]).default("all"),
  tags: z.string().optional(), // comma-separated
  sort: z.enum(["latest", "deadline"]).default("latest"),
  page: z.coerce.number().int().positive().default(1),
  size: z.coerce.number().int().positive().max(100).default(20),
});

export type HackathonQuery = z.infer<typeof hackathonQuerySchema>;
