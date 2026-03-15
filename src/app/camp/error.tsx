"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <span className="mb-4 text-6xl">👥</span>
      <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
        팀 모집 로딩 오류
      </h1>
      <p className="mb-6 max-w-md text-sm text-gray-500 dark:text-gray-400">
        팀 모집 데이터를 불러오는 중 문제가 발생했습니다.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          다시 시도
        </button>
        <a
          href="/"
          className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          홈으로 이동
        </a>
      </div>
    </div>
  );
}
