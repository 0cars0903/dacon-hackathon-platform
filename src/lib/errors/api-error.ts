// ============================================================
// 공통 API 에러 클래스 및 응답 헬퍼
// ============================================================

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string, id: string) {
    super(404, "NOT_FOUND", `${resource} with id '${id}' not found`);
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(400, "VALIDATION_ERROR", message, details);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = "Authentication required") {
    super(401, "UNAUTHORIZED", message);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = "Permission denied") {
    super(403, "FORBIDDEN", message);
  }
}

export class ConflictError extends ApiError {
  constructor(message: string) {
    super(409, "CONFLICT", message);
  }
}

/** API 에러를 NextResponse JSON 형식으로 변환 */
export function errorResponse(error: unknown) {
  if (error instanceof ApiError) {
    return Response.json(
      {
        error: {
          code: error.code,
          message: error.message,
          details: error.details ?? {},
        },
      },
      { status: error.statusCode }
    );
  }

  // Zod 검증 에러 처리
  if (error && typeof error === "object" && "issues" in error) {
    const zodError = error as { issues: unknown[] };
    return Response.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "입력 데이터가 올바르지 않습니다",
          details: { issues: zodError.issues },
        },
      },
      { status: 400 }
    );
  }

  // JSON 파싱 에러 처리
  if (error instanceof SyntaxError) {
    return Response.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "유효하지 않은 JSON 형식입니다",
          details: {},
        },
      },
      { status: 400 }
    );
  }

  console.error("[API] Unexpected error:", error);
  return Response.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
        details: {},
      },
    },
    { status: 500 }
  );
}

/** 공통 페이지네이션 응답 생성 */
export function paginatedResponse<T>(
  items: T[],
  total: number,
  page: number,
  size: number
) {
  return Response.json({
    items,
    total,
    page,
    size,
    pages: Math.ceil(total / size),
  });
}

/** 성공 응답 헬퍼 */
export function successResponse<T>(data: T, status = 200) {
  return Response.json({ data }, { status });
}
