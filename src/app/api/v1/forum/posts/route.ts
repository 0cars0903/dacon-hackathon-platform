import { NextRequest } from "next/server";
import { ForumService } from "@/services/forum.service";
import { createPostSchema } from "@/validations/forum";
import { errorResponse, successResponse, ValidationError } from "@/lib/errors/api-error";

/** GET /api/v1/forum/posts?hackathonSlug=xxx — 포럼 글 목록 */
export async function GET(request: NextRequest) {
  try {
    const hackathonSlug = request.nextUrl.searchParams.get("hackathonSlug");
    if (!hackathonSlug) {
      throw new ValidationError("hackathonSlug 파라미터가 필요합니다");
    }
    const posts = await ForumService.getPosts(hackathonSlug);
    return successResponse(posts);
  } catch (error) {
    return errorResponse(error);
  }
}

/** POST /api/v1/forum/posts — 포럼 글 작성 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createPostSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("입력 데이터가 올바르지 않습니다", {
        issues: parsed.error.issues,
      });
    }
    const userId = body.userId;
    const userName = body.userName;
    if (!userId || !userName) {
      throw new ValidationError("userId와 userName이 필요합니다");
    }
    const result = await ForumService.createPost({
      ...parsed.data,
      userId,
      userName,
      authorId: userId,
      authorName: userName,
    });
    return successResponse({ created: result }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
