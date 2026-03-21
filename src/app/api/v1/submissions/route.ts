import { NextRequest } from "next/server";
import { SubmissionService } from "@/services/submission.service";
import { saveSubmissionSchema } from "@/validations/submission";
import { errorResponse, successResponse, ValidationError } from "@/lib/errors/api-error";

/** GET /api/v1/submissions?hackathonSlug=xxx&userId=yyy */
export async function GET(request: NextRequest) {
  try {
    const hackathonSlug = request.nextUrl.searchParams.get("hackathonSlug");
    const userId = request.nextUrl.searchParams.get("userId");

    if (hackathonSlug && userId) {
      const submission = await SubmissionService.getUserSubmission(hackathonSlug, userId);
      return successResponse(submission ?? null);
    }
    if (hackathonSlug) {
      const submissions = await SubmissionService.getByHackathon(hackathonSlug);
      return successResponse(submissions);
    }
    if (userId) {
      const submissions = await SubmissionService.getByUser(userId);
      return successResponse(submissions);
    }

    throw new ValidationError("hackathonSlug 또는 userId 파라미터가 필요합니다");
  } catch (error) {
    return errorResponse(error);
  }
}

/** POST /api/v1/submissions — 제출 저장 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = saveSubmissionSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("입력 데이터가 올바르지 않습니다", {
        issues: parsed.error.issues,
      });
    }
    // userId는 인증에서 가져와야 하지만 현재는 body에서 받음
    const userId = body.userId;
    if (!userId) {
      throw new ValidationError("userId가 필요합니다");
    }
    const result = await SubmissionService.save(parsed.data.hackathonSlug, userId, parsed.data);
    return successResponse({ saved: result }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
