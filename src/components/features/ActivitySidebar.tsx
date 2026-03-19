"use client";

import { useState, useEffect } from "react";
import { getFilteredActivityFeed, getPlatformStats } from "@/lib/supabase/data";
import { useAuth } from "@/components/features/AuthProvider";
import { timeAgo } from "@/lib/utils";
import type { ActivityFeedItem } from "@/types";

export function ActivitySidebar() {
  const { user, getProfile } = useAuth();
  const [activities, setActivities] = useState<ActivityFeedItem[]>([]);
  const [stats, setStats] = useState({ ongoingHackathons: 0, upcomingHackathons: 0, totalUsers: 0, totalTeams: 0 });
  const [refreshKey, setRefreshKey] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const profile = user ? await getProfile(user.id) : null;
      const role = (user?.role as "admin" | "user") || "user";
      const joinedHackathons = profile?.joinedHackathons || [];
      const acts = await getFilteredActivityFeed(user?.id || "", role, joinedHackathons);
      setActivities(acts);
      const s = await getPlatformStats();
      setStats({
        ongoingHackathons: s.ongoingHackathons,
        upcomingHackathons: s.upcomingHackathons,
        totalUsers: s.totalUsers,
        totalTeams: s.totalTeams,
      });
    };
    load();
  }, [refreshKey, user, getProfile]);

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
      case "contact_message": return "✉️";
      default: return "📌";
    }
  };

  const hasMessagePreview = (a: ActivityFeedItem): boolean =>
    a.type === "contact_message" && !!a.metadata?.messageContent;

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <aside className="hidden shrink-0 border-l border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 xl:block xl:w-72">
      <div className="sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto p-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            최근 활동
          </h3>
          {user?.role === "admin" && (
            <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">전체 보기</span>
          )}
        </div>

        {!user && (
          <p className="mb-3 rounded-lg bg-yellow-50 p-2 text-xs text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400">
            로그인하면 관련 활동을 확인할 수 있습니다.
          </p>
        )}

        <div className="space-y-3">
          {activities.slice(0, 10).map((a, i) => (
            <div
              key={a.id}
              className={`animate-slide-in-right rounded-lg border p-3 transition-all ${
                hasMessagePreview(a)
                  ? "cursor-pointer border-indigo-100 hover:border-indigo-300 dark:border-indigo-900/40 dark:hover:border-indigo-700"
                  : "border-slate-100 hover:border-slate-200 dark:border-slate-800 dark:hover:border-slate-700"
              }`}
              style={{ animationDelay: `${i * 80}ms` }}
              onClick={() => hasMessagePreview(a) && toggleExpand(a.id)}
            >
              <div className="mb-1 flex items-center gap-2">
                <span className="text-xs">{typeEmoji(a.type)}</span>
                <span className="text-xs text-slate-400">
                  {timeAgo(a.timestamp)}
                </span>
                {hasMessagePreview(a) && (
                  <span className="ml-auto text-[10px] text-indigo-500 dark:text-indigo-400">
                    {expandedId === a.id ? "접기 ▲" : "미리보기 ▼"}
                  </span>
                )}
              </div>
              <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                {a.message}
              </p>

              {/* 메시지 미리보기 확장 영역 */}
              {hasMessagePreview(a) && expandedId === a.id && (
                <div className="mt-2 rounded-lg bg-indigo-50 p-2.5 dark:bg-indigo-900/20">
                  <p className="mb-1 text-[10px] font-medium text-indigo-600 dark:text-indigo-400">메시지 내용</p>
                  <p className="whitespace-pre-wrap text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                    {String(a.metadata?.messageContent || "")}
                  </p>
                </div>
              )}
            </div>
          ))}
          {activities.length === 0 && (
            <p className="text-xs text-slate-400">표시할 활동이 없습니다.</p>
          )}
        </div>

        {/* 플랫폼 현황 — 실제 데이터 기반 */}
        <div className="mt-6 rounded-lg bg-slate-50 p-3 dark:bg-slate-900">
          <h4 className="mb-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            플랫폼 현황
          </h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">진행중 해커톤</span>
              <span className="font-medium text-slate-900 dark:text-white">{stats.ongoingHackathons}개</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">등록된 팀</span>
              <span className="font-medium text-slate-900 dark:text-white">{stats.totalTeams}팀</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">총 사용자</span>
              <span className="font-medium text-slate-900 dark:text-white">{stats.totalUsers}명</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
