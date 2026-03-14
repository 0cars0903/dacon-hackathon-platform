"use client";

import { getActivityFeed } from "@/lib/data";
import { timeAgo } from "@/lib/utils";

export function ActivitySidebar() {
  const activities = getActivityFeed();

  return (
    <aside className="hidden w-72 shrink-0 border-l border-gray-200 bg-white xl:block dark:border-gray-800 dark:bg-gray-950">
      <div className="sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto p-4">
        <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">
          최근 활동
        </h3>

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
              <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-400">
                {a.message}
              </p>
            </div>
          ))}
        </div>

        {/* 온라인 현황 */}
        <div className="mt-6 rounded-lg bg-gray-50 p-3 dark:bg-gray-900">
          <h4 className="mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
            플랫폼 현황
          </h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500 dark:text-gray-400">진행중 해커톤</span>
              <span className="font-medium text-gray-900 dark:text-white">2개</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500 dark:text-gray-400">모집중 팀</span>
              <span className="font-medium text-gray-900 dark:text-white">5팀</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500 dark:text-gray-400">최근 제출</span>
              <span className="font-medium text-gray-900 dark:text-white">89건</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
