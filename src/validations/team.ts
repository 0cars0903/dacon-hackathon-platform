import { z } from "zod";

// 팀 생성 스키마
export const createTeamSchema = z.object({
  hackathonSlug: z.string().min(1),
  name: z.string().min(1, "팀 이름은 필수입니다").max(100),
  leaderUserId: z.string().min(1),
  leaderUserName: z.string().min(1),
  isOpen: z.boolean().default(true),
  joinPolicy: z.enum(["auto", "approval"]).default("auto"),
  lookingFor: z.array(z.string().min(1).max(50)).default([]),
  intro: z.string().max(2000).optional().nullish(),
  contactType: z.string().max(50).optional().nullish(),
  contactUrl: z.string().max(500).optional().nullish(),
});

export type CreateTeamInput = z.infer<typeof createTeamSchema>;

// 팀 수정 스키마
export const updateTeamSchema = createTeamSchema.partial().omit({ hackathonSlug: true });
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;

// 팀 참가 요청 스키마
export const joinRequestSchema = z.object({
  message: z.string().max(500).optional(),
});

// 팀 초대 스키마
export const createInvitationSchema = z.object({
  teamCode: z.string().min(1),
  teamName: z.string().min(1),
  hackathonSlug: z.string().min(1),
  inviteeId: z.string().optional(),
  inviteeName: z.string().optional(),
});

// 쿼리 파라미터 스키마
export const teamQuerySchema = z.object({
  hackathonSlug: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  size: z.coerce.number().int().positive().max(100).default(20),
});

export type TeamQuery = z.infer<typeof teamQuerySchema>;
