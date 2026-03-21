import { NextRequest } from "next/server";
import { HackathonService } from "@/services/hackathon.service";
import { updateHackathonSchema, changeStatusSchema } from "@/validations/hackathon";
import { errorResponse, successResponse, ValidationError } from "@/lib/errors/api-error";

type Params = { params: Promise<{ slug: string }> };

/** GET /api/v1/hackathons/:slug — 해커톤 상세 조회 */
export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { slug } = await params;
    const detail = await HackathonService.getDetail(slug);
    return successResponse(detail);
  } catch (error) {
    return errorResponse(error);
  }
}

/** PUT /api/v1/hackathons/:slug — 해커톤 수정 */
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const parsed = updateHackathonSchema.safeParse(body);
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
    const result = await HackathonService.update(slug, cleanedData);
    return successResponse({ updated: result });
  } catch (error) {
    return errorResponse(error);
  }
}

/** DELETE /api/v1/hackathons/:slug — 해커톤 삭제 */
export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { slug } = await params;
    const result = await HackathonService.delete(slug);
    return successResponse({ deleted: result });
  } catch (error) {
    return errorResponse(error);
  }
}

/** PATCH /api/v1/hackathons/:slug — 해커톤 상태 변경 */
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const parsed = changeStatusSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("상태 값이 올바르지 않습니다", {
        issues: parsed.error.issues,
      });
    }
    const result = await HackathonService.changeStatus(slug, parsed.data.status);
    return successResponse({ updated: result });
  } catch (error) {
    return errorResponse(error);
  }
}
