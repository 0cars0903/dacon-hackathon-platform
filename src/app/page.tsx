import Link from "next/link";
import { getHackathons } from "@/lib/data";
import { Badge } from "@/components/common/Badge";
import { getDday, getStatusLabel } from "@/lib/utils";
import { RecommendedHackathons } from "@/components/features/RecommendedHackathons";
import { StatsOverview } from "@/components/features/StatsOverview";

export default function HomePage() {
  const hackathons = getHackathons();
  const ongoingCount = hackathons.filter(
    (h) => h.status === "ongoing" || h.status === "upcoming"
  ).length;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
      {/* 히어로 배너 - min-h for CLS prevention */}
      <section className="animate-fade-in-up mb-10 min-h-[280px] overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 p-8 text-white dark:from-blue-700 dark:via-blue-800 dark:to-blue-900 sm:min-h-[320px] sm:p-12">
        <div className="relative">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/5 sm:h-48 sm:w-48" />
          <div className="absolute -bottom-12 -right-4 h-24 w-24 rounded-full bg-white/5 sm:h-36 sm:w-36" />
          <h1 className="font-display relative mb-3 text-3xl font-bold sm:text-4xl" style={{ fontWeight: 800, letterSpacing: '-1px' }}>
            DACON PLATFORM
          </h1>
          <p className="relative mb-1 text-xl font-medium text-white/90">데이터 경진대회 플랫폼</p>
          <p className="relative mb-6 text-lg text-blue-100">
            다양한 해커톤에 참가하고, 팀을 구성하고,
            <br className="hidden sm:block" />
            데이터 기반 솔루션으로 경쟁하세요.
          </p>
          <div className="relative flex flex-wrap items-center gap-4">
            <Link
              href="/hackathons"
              className="inline-block rounded-lg bg-white px-6 py-3 font-semibold text-blue-700 shadow-lg transition-all hover:bg-blue-50 hover:shadow-xl hover:-translate-y-0.5"
            >
              해커톤 둘러보기
            </Link>
            <span className="rounded-full bg-white/20 px-4 py-2 text-sm font-medium backdrop-blur-sm">
              {ongoingCount}개 해커톤 진행중
            </span>
          </div>
        </div>
      </section>

      {/* 통계 카드 */}
      <StatsOverview />

      {/* AI 추천 해커톤 */}
      <RecommendedHackathons />

      {/* 해커톤 카드 */}
      <section>
        <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
          해커톤
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {hackathons.length === 0 ? (
            <p className="col-span-3 py-12 text-center text-gray-500 dark:text-gray-400">
              등록된 해커톤이 없습니다
            </p>
          ) : (
            hackathons.map((h, i) => (
              <Link
                key={h.slug}
                href={`/hackathons/${h.slug}`}
                className="animate-fade-in-up group rounded-xl border border-gray-200 bg-white p-5 transition-all hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-blue-700"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="mb-3 flex items-center justify-between">
                  <Badge
                    variant={
                      h.status === "ongoing"
                        ? "success"
                        : h.status === "upcoming"
                          ? "info"
                          : "muted"
                    }
                  >
                    {getStatusLabel(h.status)}
                  </Badge>
                  <span className="text-xs text-gray-400">
                    {getDday(h.period.submissionDeadlineAt)}
                  </span>
                </div>
                <h3 className="mb-2 text-sm font-semibold text-gray-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                  {h.title}
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {h.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </Link>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
