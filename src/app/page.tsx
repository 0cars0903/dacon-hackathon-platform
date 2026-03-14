import Link from "next/link";
import { getHackathons, getActivityFeed } from "@/lib/data";
import { Badge } from "@/components/common/Badge";
import { getDday, getStatusLabel, timeAgo } from "@/lib/utils";
import { RecommendedHackathons } from "@/components/features/RecommendedHackathons";
import { StatsOverview } from "@/components/features/StatsOverview";

export default function HomePage() {
  const hackathons = getHackathons();
  const activities = getActivityFeed();
  const upcoming = hackathons.find(
    (h) => h.status === "ongoing" || h.status === "upcoming"
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      {/* 히어로 배너 */}
      <section className="animate-fade-in-up mb-10 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 p-8 text-white dark:from-blue-700 dark:via-blue-800 dark:to-blue-900 sm:p-12">
        <div className="relative">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/5 sm:h-48 sm:w-48" />
          <div className="absolute -bottom-12 -right-4 h-24 w-24 rounded-full bg-white/5 sm:h-36 sm:w-36" />
          <h1 className="relative mb-3 text-3xl font-bold sm:text-4xl">
            긴급 인수인계 해커톤
          </h1>
          <p className="relative mb-6 text-lg text-blue-100">
            명세서만 남기고 사라진 개발자의 문서를 기반으로
            <br className="hidden sm:block" />
            바이브 코딩으로 웹서비스를 완성하세요.
          </p>
          <div className="relative flex flex-wrap items-center gap-4">
            <Link
              href="/hackathons"
              className="inline-block rounded-lg bg-white px-6 py-3 font-semibold text-blue-700 shadow-lg transition-all hover:bg-blue-50 hover:shadow-xl hover:-translate-y-0.5"
            >
              해커톤 둘러보기
            </Link>
            {upcoming && (
              <span className="rounded-full bg-white/20 px-4 py-2 text-sm font-medium backdrop-blur-sm">
                {getDday(upcoming.period.submissionDeadlineAt)} 마감
              </span>
            )}
          </div>
        </div>
      </section>

      {/* 통계 카드 */}
      <StatsOverview />

      {/* AI 추천 해커톤 */}
      <RecommendedHackathons />

      <div className="grid gap-8 lg:grid-cols-3">
        {/* 해커톤 카드 미리보기 */}
        <section className="lg:col-span-2">
          <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
            해커톤
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {hackathons.length === 0 ? (
              <p className="col-span-2 py-12 text-center text-gray-500 dark:text-gray-400">
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

        {/* 활동 피드 + 퀵 네비 */}
        <aside className="space-y-6">
          <div>
            <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
              최근 활동
            </h2>
            <div className="space-y-3">
              {activities.map((a, i) => (
                <div
                  key={a.id}
                  className="animate-slide-in-right rounded-lg border border-gray-100 p-3 transition-all hover:border-gray-200 dark:border-gray-800 dark:hover:border-gray-700"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-xs">
                      {a.type === "team_created"
                        ? "👥"
                        : a.type === "submission"
                          ? "📤"
                          : "📊"}
                    </span>
                    <span className="text-xs text-gray-400">
                      {timeAgo(a.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {a.message}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <QuickCard
              href="/hackathons"
              title="해커톤"
              description="진행중인 해커톤을 확인하고 참가하세요"
              emoji="🏆"
            />
            <QuickCard
              href="/camp"
              title="팀 모집"
              description="함께할 팀원을 찾거나 팀을 만드세요"
              emoji="👥"
            />
            <QuickCard
              href="/rankings"
              title="랭킹"
              description="해커톤 순위와 점수를 확인하세요"
              emoji="📊"
            />
          </div>
        </aside>
      </div>
    </div>
  );
}

function QuickCard({
  href,
  title,
  description,
  emoji,
}: {
  href: string;
  title: string;
  description: string;
  emoji: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-blue-300 hover:shadow-sm hover:-translate-y-0.5 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-blue-700"
    >
      <span className="text-2xl">{emoji}</span>
      <div>
        <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
          {title}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {description}
        </p>
      </div>
    </Link>
  );
}
