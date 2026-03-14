import Link from "next/link";
import { getHackathons, getActivityFeed } from "@/lib/data";
import { Badge } from "@/components/common/Badge";
import { getDday, getStatusLabel, timeAgo } from "@/lib/utils";
import { RecommendedHackathons } from "@/components/features/RecommendedHackathons";

export default function HomePage() {
  const hackathons = getHackathons();
  const activities = getActivityFeed();
  const upcoming = hackathons.find(
    (h) => h.status === "ongoing" || h.status === "upcoming"
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      {/* 히어로 배너 */}
      <section className="mb-10 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-800 p-8 text-white dark:from-blue-700 dark:to-blue-900 sm:p-12">
        <h1 className="mb-3 text-3xl font-bold sm:text-4xl">
          긴급 인수인계 해커톤
        </h1>
        <p className="mb-6 text-lg text-blue-100">
          명세서만 남기고 사라진 개발자의 문서를 기반으로
          <br className="hidden sm:block" />
          바이브 코딩으로 웹서비스를 완성하세요.
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <Link
            href="/hackathons"
            className="inline-block rounded-lg bg-white px-6 py-3 font-semibold text-blue-700 transition-colors hover:bg-blue-50"
          >
            해커톤 둘러보기
          </Link>
          {upcoming && (
            <span className="rounded-full bg-white/20 px-4 py-2 text-sm font-medium backdrop-blur-sm">
              {getDday(upcoming.period.submissionDeadlineAt)} 마감
            </span>
          )}
        </div>
      </section>

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
              hackathons.map((h) => (
                <Link
                  key={h.slug}
                  href={`/hackathons/${h.slug}`}
                  className="group rounded-xl border border-gray-200 p-5 transition-all hover:border-blue-300 hover:shadow-md dark:border-gray-800 dark:hover:border-blue-700"
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
              {activities.map((a) => (
                <div
                  key={a.id}
                  className="rounded-lg border border-gray-100 p-3 dark:border-gray-800"
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
      className="group flex items-center gap-4 rounded-xl border border-gray-200 p-4 transition-all hover:border-blue-300 hover:shadow-sm dark:border-gray-800 dark:hover:border-blue-700"
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
