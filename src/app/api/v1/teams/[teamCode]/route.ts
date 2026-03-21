import { NextRequest } from "next/server";
import { TeamService } from "@/services/team.service";
import { updateTeamSchema } from "@/validations/team";
import { errorResponse, successResponse, ValidationError } from "@/lib/errors/api-error";

type Params = { params: Promise<{ teamCode: string }> };

/** PUT /api/v1/teams/:teamCode — 팀 수정 */
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { teamCode } = await params;
    const body = await request.json();
    const parsed = updateTeamSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("입력 데이터가 올바르지 않습니다", {
        issues: parsed.error.issues,
      });
    }
    const result = await TeamService.update(teamCode, parsed.data);
    return successResponse({ updated: result });
  } catch (error) {
    return errorResponse(error);
  }
}

/** DELETE /api/v1/teams/:teamCode — 팀 삭제 */
export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { teamCode } = await params;
    const result = await TeamService.delete(teamCode);
    return successResponse({ deleted: result });
  } catch (error) {
    return errorResponse(error);
  }
}
