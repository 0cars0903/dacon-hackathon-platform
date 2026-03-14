"use client";

import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import { getHackathonBySlug } from "@/lib/data";
import { Badge } from "@/components/common/Badge";
import { EmptyState } from "@/components/common/EmptyState";
import { BookmarkButton } from "@/components/features/BookmarkButton";
import { getDday, getStatusLabel } from "@/lib/utils";

const SUB_PAGES = [
  { key: "", label: "개요", emoji: "📋" },
  { key: "/teams", label: "팀", emoji: "👥" },
  { key: "/leaderboard", label: "리더보드", emoji: "🏆" },
  { key: "/submit", label: "제출", emoji: "📤" },
  { key: "/overview", label: "평가·상금·일정", emoji: "📏" },
  { key: "/discussion", label: "토론", emoji: "💬" },
];

export default function HackathonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const slug = params.slug as string;
  const hackathon = getHackathonBySlug(slug);

  if (!hackathon) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <EmptyState
          emoji="❓"
          title="해커톤을 찾을 수 없습니다"
          description="존재하지 않는 해커톤이거나 삭제된 페이지입니다."
          actionLabel="목록으로 돌아가기"
          onAction={() => (window.location.href = "/hackathons")}
        />
      </div>
    );
  }

  const basePath = `/hackathons/${slug}`;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* 뒤로가기 + 헤더 */}
      <div className="mb-6">
        <Link
          href="/hackathons"
          className="mb-4 inline-flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          ← 해커톤 목록
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white" style={{ fontWeight: 700 }}>
            {hackathon.title}
          </h1>
          <Badge
            variant={
              hackathon.status === "ongoing"
                ? "success"
                : hackathon.status === "upcoming"
                  ? "info"
                  : "muted"
            }
          >
            {getStatusLabel(hackathon.status)}
          </Badge>
          <span className="text-sm text-gray-400">
            {getDday(hackathon.period.submissionDeadlineAt)}
          </span>
          <BookmarkButton hackathonSlug={slug} />
        </div>
      </div>

      {/* 서브 페이지 네비게이션 */}
      <nav className="mb-6 flex gap-1 overflow-x-auto border-b border-gray-200 dark:border-gray-800">
        {SUB_PAGES.map((page) => {
          const href = basePath + page.key;
          const isActive =
            page.key === ""
              ? pathname === basePath
              : pathname === href || pathname.startsWith(href + "/");

          return (
            <Link
              key={page.key}
              href={href}
              className={`flex shrink-0 items-center gap-1.5 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              <span className="text-xs">{page.emoji}</span>
              {page.label}
            </Link>
          );
        })}
      </nav>

      {/* 페이지 컨텐츠 */}
      <div className="min-h-[300px]">{children}</div>
    </div>
  );
}
