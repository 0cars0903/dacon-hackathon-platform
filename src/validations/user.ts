import { z } from "zod";

// 프로필 수정 스키마
export const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  nickname: z.string().min(2).max(30).optional(),
  bio: z.string().max(500).optional().nullish(),
  skills: z.array(z.string().min(1).max(50)).max(20).optional(),
  avatarUrl: z.string().url().optional().nullish(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// 사용자 환경설정 스키마
export const userPreferencesSchema = z.object({
  theme: z.enum(["light", "dark"]).optional(),
  colorTheme: z.enum(["blue", "purple", "green"]).optional(),
  interestTags: z.array(z.string().min(1).max(50)).optional(),
});

export type UserPreferencesInput = z.infer<typeof userPreferencesSchema>;
