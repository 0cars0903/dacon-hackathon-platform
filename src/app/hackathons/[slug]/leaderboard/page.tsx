"use client";

import { useParams } from "next/navigation";
import { getLeaderboard } from "@/lib/data";
import { Badge } from "@/components/common/Badge";
import { EmptyState } from "@/components/common/EmptyState";
import { formatDateTime, timeAgo } from "@/lib/utils";

export default function HackathonLeaderboardPage() {
  const params = useParams();
  const slug = params.slug as string;
  const leaderboard = getLeaderboard(slug);

  if (!leaderboard || leaderboard.entries.length === 0) {
    return (
      <EmptyState
        emoji="🏆"
        title="리더보드 데이터가 없습니다"
        description="아직 제출된 결과가 없습니다."
      />
    );
  }

  return (
    <div>
      <p className="mb-4 text-xs text-gray-400">
        업데이트: {formatDateTime(leaderboard.updatedAt)}
      </p>
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                순위
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                팀
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400">
                점수
              </th>
              <th className="hidden px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 sm:table-cell">
                제출 시간
              </th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.entries.map((entry, i) => (
              <tr
                key={entry.rank}
                className="animate-fade-in border-b border-gray-100 transition-colors hover:bg-gray-50 last:border-0 dark:border-gray-800 dark:hover:bg-gray-800/50"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <td className="px-4 py-4">
                  <span className={`text-sm font-medium ${entry.rank <= 3 ? "text-lg" : "text-gray-900 dark:text-white"}`}>
                    {entry.rank <= 3
                      ? ["🥇", "🥈", "🥉"][entry.rank - 1]
                      : `#${entry.rank}`}
                  </span>
                </td>
                <td className="px-4 py-4">
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
                      <a href={entry.artifacts.webUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline">
                        🌐 웹
                      </a>
                      <a href={entry.artifacts.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline">
                        📄 PDF
                      </a>
                    </div>
                  )}
                </td>
                <td className="px-4 py-4 text-right">
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
                <td className="hidden px-4 py-4 text-right text-xs text-gray-500 dark:text-gray-400 sm:table-cell">
                  {timeAgo(entry.submittedAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
