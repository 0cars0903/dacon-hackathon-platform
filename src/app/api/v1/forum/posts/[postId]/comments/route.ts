import { NextRequest } from "next/server";
import { ForumService } from "@/services/forum.service";
import { createCommentSchema } from "@/validations/forum";
import { errorResponse, successResponse, ValidationError } from "@/lib/errors/api-error";

type Params = { params: Promise<{ postId: string }> };

/** GET /api/v1/forum/posts/:postId/comments — 댓글 목록 */
export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { postId } = await params;
    const comments = await ForumService.getComments(postId);
    return successResponse(comments);
  } catch (error) {
    return errorResponse(error);
  }
}

/** POST /api/v1/forum/posts/:postId/comments — 댓글 작성 */
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { postId } = await params;
    const body = await request.json();
    const parsed = createCommentSchema.safeParse(body);
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
    const result = await ForumService.createComment({
      postId,
      content: parsed.data.content,
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
