import { NextRequest } from "next/server";
import { UserService } from "@/services/user.service";
import { updateProfileSchema } from "@/validations/user";
import { errorResponse, successResponse, ValidationError, NotFoundError } from "@/lib/errors/api-error";

type Params = { params: Promise<{ userId: string }> };

/** GET /api/v1/users/:userId — 사용자 프로필 조회 */
export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { userId } = await params;
    const profile = await UserService.getProfile(userId);
    if (!profile) throw new NotFoundError("User", userId);
    return successResponse(profile);
  } catch (error) {
    return errorResponse(error);
  }
}

/** PUT /api/v1/users/:userId — 프로필 수정 */
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { userId } = await params;
    const body = await request.json();
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("입력 데이터가 올바르지 않습니다", {
        issues: parsed.error.issues,
      });
    }
    // Convert null to undefined for updateProfile
    const cleanedData = {
      ...parsed.data,
      bio: parsed.data.bio ?? undefined,
      avatarUrl: parsed.data.avatarUrl ?? undefined,
    };
    const result = await UserService.updateProfile(userId, cleanedData);
    return successResponse({ updated: result });
  } catch (error) {
    return errorResponse(error);
  }
}
