"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/common/Badge";
import { getPlatformStats, getAllHackathonsUnfiltered, getAllLeaderboards, getActivityFeed, getTeams } from "@/lib/supabase/data";
import type { UserProfile, Hackathon, Leaderboard, Team, ActivityFeedItem, PlatformStats } from "@/types";
import type { HackathonForm } from "@/app/admin/page";

interface AnalyticsProps {
  users: Array<{ id: string; name: string; email: string; role: string }>;
  profiles: UserProfile[];
  createdHackathons: HackathonForm[];
}

export function Analytics({ users, profiles, createdHackathons }: AnalyticsProps) {
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null);
  const [allHackathons, setAllHackathons] = useState<Hackathon[]>([]);
  const [allLeaderboards, setAllLeaderboards] = useState<Leaderboard[]>([]);
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityFeedItem[]>([]);

  useEffect(() => {
    const load = async () => {
      const [stats, hackathons, leaderboards, teams, activity] = await Promise.all([
        getPlatformStats(),
        getAllHackathonsUnfiltered(),
        getAllLeaderboards(),
        getTeams(),
        getActivityFeed(),
      ]);
      setPlatformStats(stats);
      setAllHackathons(hackathons);
      setAllLeaderboards(leaderboards);
      setAllTeams(teams);
      setRecentActivity(activity);
    };
    load();
  }, []);

  if (!platformStats) {
    return <div className="text-center text-slate-400">로딩 중...</div>;
  }

  // 해커톤별 제출 통계
  const hackathonSubmissionData = allHackathons.map((h) => {
    const lb = allLeaderboards.find((l) => l.hackathonSlug === h.slug);
    const teams = allTeams.filter((t) => t.hackathonSlug === h.slug);
    return {
      title: h.title.length > 15 ? h.title.slice(0, 15) + "…" : h.title,
      slug: h.slug,
      submissions: lb?.entries.length || 0,
      teams: teams.length,
      status: h.status,
    };
  }).sort((a, b) => b.submissions - a.submissions);

  const maxSubmissions = Math.max(...hackathonSubmissionData.map((d) => d.submissions), 1);

  // 해커톤 상태 분포
  const statusDistribution = {
    ongoing: allHackathons.filter((h) => h.status === "ongoing").length,
    upcoming: allHackathons.filter((h) => h.status === "upcoming").length,
    ended: allHackathons.filter((h) => h.status === "ended").length,
  };
  const totalHackathons = statusDistribution.ongoing + statusDistribution.upcoming + statusDistribution.ended;

  // 스킬 분포 (상위 10개)
  const skillCount: Record<string, number> = {};
  profiles.forEach((p) => p.skills.forEach((s) => { skillCount[s] = (skillCount[s] || 0) + 1; }));
  const topSkills = Object.entries(skillCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  const maxSkillCount = topSkills[0]?.[1] || 1;

  // 최근 활동 타입별 집계
  const activityByType: Record<string, number> = {};
  recentActivity.forEach((a) => { activityByType[a.type] = (activityByType[a.type] || 0) + 1; });
  const activityTypeLabels: Record<string, string> = {
    team_created: "팀 생성/참가",
    submission: "결과물 제출",
    ranking_update: "랭킹 변동",
    hackathon_created: "해커톤 생성",
    forum_post: "토론 게시",
    user_signup: "신규 가입",
    contact_message: "연락 메시지",
  };

  return (
    <div className="space-y-6">
      {/* 핵심 지표 카드 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "총 사용자", value: users.length, sub: `관리자 ${users.filter((u) => u.role === "admin").length}명`, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-900/20", icon: "👤" },
          { label: "전체 해커톤", value: platformStats.totalHackathons + createdHackathons.length, sub: `진행중 ${statusDistribution.ongoing}개`, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20", icon: "🏆" },
          { label: "등록 팀", value: platformStats.totalTeams, sub: `${platformStats.totalMembers}명 참여`, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-900/20", icon: "👥" },
          { label: "총 제출", value: platformStats.totalSubmissions, sub: `${allLeaderboards.length}개 리더보드`, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-900/20", icon: "📤" },
        ].map((stat) => (
          <div key={stat.label} className={`rounded-xl ${stat.bg} p-5`}>
            <div className="flex items-center justify-between">
              <span className="text-2xl">{stat.icon}</span>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
            <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-300">{stat.label}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 해커톤별 제출 차트 */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">해커톤별 제출 현황</h3>
          <div className="space-y-3">
            {hackathonSubmissionData.map((d) => (
              <div key={d.slug}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-400">{d.title}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant={d.status === "ongoing" ? "success" : d.status === "upcoming" ? "info" : "muted"} size="sm">
                      {d.status === "ongoing" ? "진행중" : d.status === "upcoming" ? "예정" : "종료"}
                    </Badge>
                    <span className="font-medium text-slate-900 dark:text-white">{d.submissions}</span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-2 rounded-full bg-indigo-500 transition-all duration-700"
                    style={{ width: `${(d.submissions / maxSubmissions) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 해커톤 상태 분포 (도넛형) */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">해커톤 상태 분포</h3>
          <div className="flex items-center justify-center gap-8">
            {/* CSS 도넛 차트 */}
            <div className="relative h-36 w-36">
              <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                <circle cx="18" cy="18" r="15.91549430918954" fill="transparent" stroke="#e5e7eb" strokeWidth="3" className="dark:stroke-gray-700" />
                {totalHackathons > 0 && (
                  <>
                    <circle cx="18" cy="18" r="15.91549430918954" fill="transparent" stroke="#22c55e" strokeWidth="3"
                      strokeDasharray={`${(statusDistribution.ongoing / totalHackathons) * 100} ${100 - (statusDistribution.ongoing / totalHackathons) * 100}`}
                      strokeDashoffset="0" />
                    <circle cx="18" cy="18" r="15.91549430918954" fill="transparent" stroke="#3b82f6" strokeWidth="3"
                      strokeDasharray={`${(statusDistribution.upcoming / totalHackathons) * 100} ${100 - (statusDistribution.upcoming / totalHackathons) * 100}`}
                      strokeDashoffset={`${-(statusDistribution.ongoing / totalHackathons) * 100}`} />
                    <circle cx="18" cy="18" r="15.91549430918954" fill="transparent" stroke="#9ca3af" strokeWidth="3"
                      strokeDasharray={`${(statusDistribution.ended / totalHackathons) * 100} ${100 - (statusDistribution.ended / totalHackathons) * 100}`}
                      strokeDashoffset={`${-((statusDistribution.ongoing + statusDistribution.upcoming) / totalHackathons) * 100}`} />
                  </>
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-slate-900 dark:text-white">{totalHackathons}</span>
                <span className="text-[10px] text-slate-400">전체</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-emerald-500" />
                <span className="text-sm text-slate-600 dark:text-slate-400">진행중</span>
                <span className="ml-auto font-semibold text-slate-900 dark:text-white">{statusDistribution.ongoing}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-indigo-500" />
                <span className="text-sm text-slate-600 dark:text-slate-400">예정</span>
                <span className="ml-auto font-semibold text-slate-900 dark:text-white">{statusDistribution.upcoming}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-gray-400" />
                <span className="text-sm text-slate-600 dark:text-slate-400">종료</span>
                <span className="ml-auto font-semibold text-slate-900 dark:text-white">{statusDistribution.ended}</span>
              </div>
            </div>
          </div>
        </section>

        {/* 기술 스택 분포 */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">인기 기술 스택 TOP 10</h3>
          <div className="space-y-2">
            {topSkills.map(([skill, count], i) => (
              <div key={skill} className="flex items-center gap-3">
                <span className="w-5 text-right text-xs font-medium text-slate-400">{i + 1}</span>
                <span className="w-24 text-xs text-slate-700 dark:text-slate-300 truncate">{skill}</span>
                <div className="flex-1">
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-2 rounded-full bg-purple-500 transition-all duration-500"
                      style={{ width: `${(count / maxSkillCount) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="w-8 text-right text-xs font-medium text-slate-600 dark:text-slate-400">{count}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 활동 유형 분포 */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">최근 활동 유형 분포</h3>
          <div className="space-y-3">
            {Object.entries(activityByType)
              .sort((a, b) => b[1] - a[1])
              .map(([type, count]) => {
                const maxCount = Math.max(...Object.values(activityByType));
                return (
                  <div key={type} className="flex items-center gap-3">
                    <span className="w-28 text-xs text-slate-600 dark:text-slate-400">
                      {activityTypeLabels[type] || type}
                    </span>
                    <div className="flex-1">
                      <div className="h-4 rounded bg-slate-100 dark:bg-slate-800">
                        <div
                          className="flex h-4 items-center justify-end rounded bg-emerald-500 px-1 text-[10px] font-bold text-white transition-all duration-500"
                          style={{ width: `${Math.max((count / maxCount) * 100, 10)}%` }}
                        >
                          {count}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            {Object.keys(activityByType).length === 0 && (
              <p className="text-sm text-slate-400">기록된 활동이 없습니다.</p>
            )}
          </div>
        </section>
      </div>

      {/* 사용자 활동 순위 */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">사용자 활동 순위 TOP 10</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="px-3 py-2 text-xs font-medium text-slate-500">#</th>
                <th className="px-3 py-2 text-xs font-medium text-slate-500">사용자</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-slate-500">해커톤</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-slate-500">제출</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-slate-500">팀</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-slate-500">배지</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-slate-500">총점</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {profiles
                .sort((a, b) => (b.stats.hackathonsJoined + b.stats.submissions * 2 + b.stats.totalScore) - (a.stats.hackathonsJoined + a.stats.submissions * 2 + a.stats.totalScore))
                .slice(0, 10)
                .map((p, i) => (
                  <tr key={p.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800">
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                        i === 0 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400" :
                        i === 1 ? "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300" :
                        i === 2 ? "bg-orange-100 text-orange-600 dark:bg-orange-900/50 dark:text-orange-400" :
                        "text-slate-400"
                      }`}>{i + 1}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <p className="font-medium text-slate-900 dark:text-white">{p.nickname || p.name}</p>
                      <p className="text-[10px] text-slate-400">{p.email}</p>
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium text-slate-700 dark:text-slate-300">{p.stats.hackathonsJoined}</td>
                    <td className="px-3 py-2.5 text-right font-medium text-slate-700 dark:text-slate-300">{p.stats.submissions}</td>
                    <td className="px-3 py-2.5 text-right font-medium text-slate-700 dark:text-slate-300">{p.stats.teamsCreated}</td>
                    <td className="px-3 py-2.5 text-right font-medium text-slate-700 dark:text-slate-300">{p.badges.length}</td>
                    <td className="px-3 py-2.5 text-right font-bold text-indigo-600 dark:text-indigo-400">{p.stats.totalScore}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 최근 활동 타임라인 */}
      <AdminActivityTimeline recentActivity={recentActivity} />
    </div>
  );
}

function AdminActivityTimeline({ recentActivity }: { recentActivity: ActivityFeedItem[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">최근 활동 타임라인</h3>
      <div className="relative space-y-0 pl-4">
        {recentActivity.slice(0, 15).map((a, i) => {
          const hasPreview = a.type === "contact_message" && !!a.metadata?.messageContent;
          return (
            <div key={a.id} className="relative pb-4 last:pb-0">
              {i < Math.min(recentActivity.length, 15) - 1 && (
                <div className="absolute bottom-0 left-[-12px] top-3 w-0.5 bg-slate-200 dark:bg-slate-700" />
              )}
              <div className={`absolute left-[-16px] top-1.5 h-2.5 w-2.5 rounded-full border-2 ${
                a.type === "contact_message" ? "border-purple-500" : "border-indigo-500"
              } bg-white dark:bg-slate-900`} />
              <div
                className={`flex items-start justify-between gap-2 ${hasPreview ? "cursor-pointer" : ""}`}
                onClick={() => hasPreview && setExpandedId((prev) => (prev === a.id ? null : a.id))}
              >
                <div className="flex-1">
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {a.message}
                    {hasPreview && (
                      <span className="ml-1 text-[10px] text-purple-500 dark:text-purple-400">
                        {expandedId === a.id ? "[접기]" : "[미리보기]"}
                      </span>
                    )}
                  </p>
                  {hasPreview && expandedId === a.id && (
                    <div className="mt-1.5 rounded-lg bg-purple-50 p-2 dark:bg-purple-900/20">
                      <p className="text-[10px] font-medium text-purple-600 dark:text-purple-400 mb-0.5">메시지 내용</p>
                      <p className="whitespace-pre-wrap text-xs text-slate-700 dark:text-slate-300">
                        {String(a.metadata?.messageContent || "")}
                      </p>
                    </div>
                  )}
                </div>
                <span className="shrink-0 text-[10px] text-slate-400">
                  {new Date(a.timestamp).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
