"use client";

import { useState, useEffect } from "react";
import { getActivityFeed, getPlatformStats } from "@/lib/data";
import { timeAgo } from "@/lib/utils";
import type { ActivityFeedItem } from "@/types";

export function ActivitySidebar() {
  const [activities, setActivities] = useState<ActivityFeedItem[]>([]);
  const [stats, setStats] = useState({ ongoingHackathons: 0, totalTeams: 0, totalSubmissions: 0 });
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setActivities(getActivityFeed());
    const s = getPlatformStats();
    setStats({
      ongoingHackathons: s.ongoingHackathons,
      totalTeams: s.totalTeams,
      totalSubmissions: s.totalSubmissions,
    });
  }, [refreshKey]);

  // 10초마다 새로고침
  useEffect(() => {
    const interval = setInterval(() => setRefreshKey((k) => k + 1), 10000);
    return () => clearInterval(interval);
  }, []);

  const typeEmoji = (type: string) => {
    switch (type) {
      case "team_created": return "👥";
      case "submission": return "📤";
      case "ranking_update": return "📊";
      case "hackathon_created": return "🎯";
      case "forum_post": return "💬";
      case "user_signup": return "🎉";
      default: return "📌";
    }
  };

  return (
    <aside className="hidden w-72 shrink-0 border-l border-gray-200 bg-white xl:block dark:border-gray-800 dark:bg-gray-950">
      <div className="sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto p-4">
        <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">
          최근 활동
        </h3>

        <div className="space-y-3">
          {activities.slice(0, 10).map((a, i) => (
            <div
              key={a.id}
              className="animate-slide-in-right rounded-lg border border-gray-100 p-3 transition-all hover:border-gray-200 dark:border-gray-800 dark:hover:border-gray-700"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="mb-1 flex items-center gap-2">
                <span className="text-xs">{typeEmoji(a.type)}</span>
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

        {/* 플랫폼 현황 — 실제 데이터 기반 */}
        <div className="mt-6 rounded-lg bg-gray-50 p-3 dark:bg-gray-900">
          <h4 className="mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
            플랫폼 현황
          </h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500 dark:text-gray-400">진행중 해커톤</span>
              <span className="font-medium text-gray-900 dark:text-white">{stats.ongoingHackathons}개</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500 dark:text-gray-400">등록된 팀</span>
              <span className="font-medium text-gray-900 dark:text-white">{stats.totalTeams}팀</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500 dark:text-gray-400">총 제출</span>
              <span className="font-medium text-gray-900 dark:text-white">{stats.totalSubmissions}건</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
