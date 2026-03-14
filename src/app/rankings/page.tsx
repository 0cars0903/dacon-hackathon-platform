"use client";

import { useState } from "react";
import { getAllLeaderboards, getHackathons } from "@/lib/data";
import { Badge } from "@/components/common/Badge";
import { EmptyState } from "@/components/common/EmptyState";
import { formatDateTime, timeAgo } from "@/lib/utils";

type SortKey = "rank" | "score";

export default function RankingsPage() {
  const hackathons = getHackathons();
  const allLeaderboards = getAllLeaderboards();
  const [selectedSlug, setSelectedSlug] = useState(
    allLeaderboards[0]?.hackathonSlug || ""
  );
  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [sortAsc, setSortAsc] = useState(true);

  const leaderboard = allLeaderboards.find(
    (lb) => lb.hackathonSlug === selectedSlug
  );
  const hackathon = hackathons.find((h) => h.slug === selectedSlug);

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

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
        랭킹
      </h1>

      {/* 해커톤 선택 */}
      <div className="mb-6 flex flex-wrap gap-2">
        {allLeaderboards.map((lb) => {
          const h = hackathons.find((h) => h.slug === lb.hackathonSlug);
          return (
            <button
              key={lb.hackathonSlug}
              onClick={() => setSelectedSlug(lb.hackathonSlug)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                selectedSlug === lb.hackathonSlug
                  ? "bg-blue-600 text-white"
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
                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400">
                  제출 시간
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((entry) => (
                <tr
                  key={entry.rank}
                  className="border-b border-gray-100 transition-colors hover:bg-gray-50 last:border-0 dark:border-gray-800 dark:hover:bg-gray-800/50"
                >
                  <td className="px-5 py-4">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
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
                          🌐 웹사이트
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
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                      {entry.score}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right text-xs text-gray-500 dark:text-gray-400">
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
