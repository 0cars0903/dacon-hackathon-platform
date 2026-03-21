import { NextRequest } from "next/server";
import { TeamService } from "@/services/team.service";
import { teamQuerySchema, createTeamSchema } from "@/validations/team";
import { errorResponse, paginatedResponse, successResponse, ValidationError } from "@/lib/errors/api-error";

/** GET /api/v1/teams — 팀 목록 조회 */
export async function GET(request: NextRequest) {
  try {
    const params = Object.fromEntries(request.nextUrl.searchParams);
    const query = teamQuerySchema.parse(params);
    const { items, total } = await TeamService.list(query);
    return paginatedResponse(items, total, query.page, query.size);
  } catch (error) {
    return errorResponse(error);
  }
}

/** POST /api/v1/teams — 팀 생성 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createTeamSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("입력 데이터가 올바르지 않습니다", {
        issues: parsed.error.issues,
      });
    }
    const result = await TeamService.create(parsed.data);
    return successResponse({ created: result }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
