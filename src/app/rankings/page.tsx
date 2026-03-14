"use client";

import { useState, useEffect } from "react";
import { getAllLeaderboards, getHackathons, getAllHackathonsUnfiltered } from "@/lib/supabase/data";
import { Badge } from "@/components/common/Badge";
import { EmptyState } from "@/components/common/EmptyState";
import { ScoreChart } from "@/components/features/ScoreChart";
import { formatDateTime, timeAgo } from "@/lib/utils";
import type { Hackathon, Leaderboard } from "@/types";

type SortKey = "rank" | "score";

export default function RankingsPage() {
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [allHackathons, setAllHackathons] = useState<Hackathon[]>([]);
  const [allLeaderboards, setAllLeaderboards] = useState<Leaderboard[]>([]);

  useEffect(() => {
    const load = async () => {
      const [hacks, all_hacks, lbs] = await Promise.all([
        getHackathons(),
        getAllHackathonsUnfiltered(),
        getAllLeaderboards(),
      ]);
      setHackathons(hacks);
      setAllHackathons(all_hacks);
      setAllLeaderboards(lbs);
    };
    load();
  }, []);

  // 현재 표시되는 해커톤 + 리더보드 엔트리가 있는 것만 필터
  const visibleSlugs = new Set(hackathons.map((h) => h.slug));
  const visibleLeaderboards = allLeaderboards.filter(
    (lb) => visibleSlugs.has(lb.hackathonSlug) || lb.entries.length > 0
  );

  const [selectedSlug, setSelectedSlug] = useState(
    visibleLeaderboards[0]?.hackathonSlug || ""
  );
  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [sortAsc, setSortAsc] = useState(true);

  const leaderboard = allLeaderboards.find(
    (lb) => lb.hackathonSlug === selectedSlug
  );

  const sorted = leaderboard
    ? [...leaderboard.entries].sort((a, b) => {
        const mul = sortAsc ? 1 : -1;
        if (sortKey === "rank") return (a.rank - b.rank) * mul;
        return (b.score - a.score) * mul;
      })
    : [];

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const avgScore = sorted.length > 0
    ? Math.round(sorted.reduce((sum, e) => sum + e.score, 0) / sorted.length)
    : 0;
  const maxScore = sorted.length > 0 ? Math.max(...sorted.map((e) => e.score)) : 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="font-display mb-6 text-2xl font-bold text-gray-900 dark:text-white" style={{ fontWeight: 700 }}>
        랭킹
      </h1>

      {/* 해커톤 선택 */}
      <div className="mb-6 flex flex-wrap gap-2">
        {visibleLeaderboards.map((lb) => {
          const h = allHackathons.find((h) => h.slug === lb.hackathonSlug);
          return (
            <button
              key={lb.hackathonSlug}
              onClick={() => setSelectedSlug(lb.hackathonSlug)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                selectedSlug === lb.hackathonSlug
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400"
              }`}
            >
              {h
                ? h.title.length > 20
                  ? h.title.slice(0, 20) + "…"
                  : h.title
                : lb.hackathonSlug}
            </button>
          );
        })}
      </div>

      {/* 통계 카드 + 차트 */}
      {sorted.length > 0 && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <p className="text-xs text-gray-500 dark:text-gray-400">참가 팀</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{sorted.length}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <p className="text-xs text-gray-500 dark:text-gray-400">최고 점수</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{maxScore}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <p className="text-xs text-gray-500 dark:text-gray-400">평균 점수</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{avgScore}</p>
          </div>
          <ScoreChart title="점수 분포" scores={sorted.map((e) => e.score)} />
        </div>
      )}

      {leaderboard && (
        <p className="mb-4 text-xs text-gray-400">
          업데이트: {formatDateTime(leaderboard.updatedAt)}
        </p>
      )}

      {/* 리더보드 */}
      {sorted.length === 0 ? (
        <EmptyState
          emoji="🏆"
          title="리더보드 데이터가 없습니다"
          description="아직 제출된 결과가 없습니다."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
                <th
                  className="cursor-pointer px-5 py-3 text-left text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400"
                  onClick={() => handleSort("rank")}
                >
                  순위 {sortKey === "rank" && (sortAsc ? "↑" : "↓")}
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                  팀
                </th>
                <th
                  className="cursor-pointer px-5 py-3 text-right text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400"
                  onClick={() => handleSort("score")}
                >
                  점수 {sortKey === "score" && (sortAsc ? "↑" : "↓")}
                </th>
                <th className="hidden px-5 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 sm:table-cell">
                  제출 시간
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((entry, i) => (
                <tr
                  key={entry.rank}
                  className="animate-fade-in border-b border-gray-100 transition-colors hover:bg-gray-50 last:border-0 dark:border-gray-800 dark:hover:bg-gray-800/50"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <td className="px-5 py-4">
                    <span className={`text-sm font-medium ${
                      entry.rank <= 3 ? "text-lg" : "text-gray-900 dark:text-white"
                    }`}>
                      {entry.rank <= 3
                        ? ["🥇", "🥈", "🥉"][entry.rank - 1]
                        : `#${entry.rank}`}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {entry.teamName}
                    </span>
                    {entry.scoreBreakdown && (
                      <div className="mt-1 flex gap-2">
                        <Badge variant="info" size="sm">
                          참가자 {entry.scoreBreakdown.participant}
                        </Badge>
                        <Badge variant="warning" size="sm">
                          심사위원 {entry.scoreBreakdown.judge}
                        </Badge>
                      </div>
                    )}
                    {entry.artifacts && (
                      <div className="mt-1 flex gap-2">
                        <a
                          href={entry.artifacts.webUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-500 hover:underline"
                        >
                          🌐 웹
                        </a>
                        <a
                          href={entry.artifacts.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-500 hover:underline"
                        >
                          📄 PDF
                        </a>
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                        {entry.score}
                      </span>
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                        <div
                          className="h-full rounded-full bg-blue-500 transition-all duration-500"
                          style={{ width: `${Math.min(entry.score, 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-5 py-4 text-right text-xs text-gray-500 dark:text-gray-400 sm:table-cell">
                    {timeAgo(entry.submittedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
