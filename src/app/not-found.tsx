import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <span className="mb-4 text-6xl">🔍</span>
      <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
        404
      </h1>
      <p className="mb-1 text-lg text-gray-600 dark:text-gray-400">
        페이지를 찾을 수 없습니다
      </p>
      <p className="mb-6 text-sm text-gray-400">
        요청하신 페이지가 삭제되었거나 주소가 변경되었을 수 있습니다.
      </p>
      <div className="flex gap-3">
        <Link
          href="/"
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          홈으로 이동
        </Link>
        <Link
          href="/hackathons"
          className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          해커톤 목록
        </Link>
      </div>
    </div>
  );
}
