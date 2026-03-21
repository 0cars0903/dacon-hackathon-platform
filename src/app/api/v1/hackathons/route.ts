import { NextRequest } from "next/server";
import { HackathonService } from "@/services/hackathon.service";
import { hackathonQuerySchema, createHackathonSchema } from "@/validations/hackathon";
import { errorResponse, paginatedResponse, successResponse, ValidationError } from "@/lib/errors/api-error";

/** GET /api/v1/hackathons — 해커톤 목록 조회 (필터, 정렬, 페이지네이션) */
export async function GET(request: NextRequest) {
  try {
    const params = Object.fromEntries(request.nextUrl.searchParams);
    const query = hackathonQuerySchema.parse(params);
    const { items, total } = await HackathonService.list(query);
    return paginatedResponse(items, total, query.page, query.size);
  } catch (error) {
    return errorResponse(error);
  }
}

/** POST /api/v1/hackathons — 해커톤 생성 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createHackathonSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("입력 데이터가 올바르지 않습니다", {
        issues: parsed.error.issues,
      });
    }
    // Convert null to undefined for HackathonService
    const cleanedData = {
      ...parsed.data,
      thumbnailUrl: parsed.data.thumbnailUrl ?? undefined,
      submissionDeadlineAt: parsed.data.submissionDeadlineAt ?? undefined,
      endAt: parsed.data.endAt ?? undefined,
      detailLink: parsed.data.detailLink ?? undefined,
      rulesLink: parsed.data.rulesLink ?? undefined,
      faqLink: parsed.data.faqLink ?? undefined,
    };
    const result = await HackathonService.create(cleanedData);
    return successResponse({ created: result }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
