import { NextRequest } from "next/server";
import { SubmissionService } from "@/services/submission.service";
import { errorResponse, successResponse } from "@/lib/errors/api-error";

type Params = { params: Promise<{ slug: string }> };

/** GET /api/v1/leaderboards/:slug — 리더보드 조회 */
export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { slug } = await params;
    const leaderboard = await SubmissionService.getLeaderboard(slug);
    return successResponse(leaderboard ?? null);
  } catch (error) {
    return errorResponse(error);
  }
}
