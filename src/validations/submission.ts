import { z } from "zod";

// 제출 저장 스키마
export const saveSubmissionSchema = z.object({
  hackathonSlug: z.string().min(1),
  items: z.array(
    z.object({
      key: z.string().min(1),
      value: z.string(),
    })
  ),
  status: z.enum(["draft", "submitted"]).default("draft"),
});

export type SaveSubmissionInput = z.infer<typeof saveSubmissionSchema>;

// 제출 점수 저장 스키마 (관리자용)
export const saveScoreSchema = z.object({
  score: z.number().min(0),
  metrics: z.record(z.string(), z.number()).optional(),
});
