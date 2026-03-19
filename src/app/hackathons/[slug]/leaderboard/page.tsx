"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { getLeaderboard, getHackathonBySlug, getHackathonDetail } from "@/lib/supabase/data";
import { getDynamicLeaderboard } from "@/lib/scoring";
import { Badge } from "@/components/common/Badge";
import { EmptyState } from "@/components/common/EmptyState";
import { formatDateTime, timeAgo } from "@/lib/utils";
import type { LeaderboardEntry, MetricColumn, LeaderboardRound, Hackathon, HackathonDetail, Leaderboard } from "@/types";

export default function HackathonLeaderboardPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [hackathon, setHackathon] = useState<Hackathon | null>(null);
  const [staticLeaderboard, setStaticLeaderboard] = useState<Leaderboard | null>(null);
  const [leaderboard, setLeaderboard] = useState<Leaderboard | null>(null);
  const [detail, setDetail] = useState<HackathonDetail | null>(null);
  const [activeRound, setActiveRound] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const h = await getHackathonBySlug(slug);
      setHackathon(h ?? null);

      const staticLb = await getLeaderboard(slug);
      setStaticLeaderboard(staticLb ?? null);

      const dynamicLb = await getDynamicLeaderboard(slug);
      const d = await getHackathonDetail(slug);
      setDetail(d ?? null);

      // 동적 리더보드가 있으면 정적 데이터와 병합
      if (!staticLb && !dynamicLb) {
        setLeaderboard(null);
      } else if (!dynamicLb) {
        setLeaderboard(staticLb ?? null);
      } else if (!staticLb) {
        setLeaderboard(dynamicLb ?? null);
      } else {
        // 병합: 동적 엔트리의 teamName이 정적에도 있으면 높은 점수 우선
        const mergedMap = new Map<string, LeaderboardEntry>();
        staticLb.entries.forEach((e: LeaderboardEntry) => mergedMap.set(e.teamName, e));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (dynamicLb.entries || []).forEach((e: any) => {
          const existing = mergedMap.get(e.teamName);
          if (!existing || e.score > existing.score) {
            mergedMap.set(e.teamName, { ...e, rank: 0 });
          }
        });

        const sorted = [...mergedMap.values()]
          .sort((a, b) => b.score - a.score)
          .map((e, i) => ({ ...e, rank: i + 1 }));

        setLeaderboard({
          ...staticLb,
          entries: sorted,
          updatedAt: dynamicLb.updatedAt || staticLb.updatedAt,
        });
      }
    };
    load();
  }, [slug]);

  // 예정 중인 해커톤은 리더보드 비공개
  if (hackathon?.status === "upcoming") {
    return (
      <EmptyState
        emoji="⏳"
        title="리더보드가 아직 공개되지 않았습니다"
        description="해커톤이 시작되면 리더보드가 공개됩니다."
      />
    );
  }

  if (!leaderboard) {
    return (
      <EmptyState
        emoji="🏆"
        title="리더보드 데이터가 없습니다"
        description="아직 제출된 결과가 없습니다."
      />
    );
  }

  // 평가 비중 표시
  const evalBreakdown = detail?.sections.eval.scoreDisplay?.breakdown;

  return (
    <div className="space-y-6">
      {/* 헤더: 평가 방식 + 상태 배지 */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            {leaderboard.metricName}
          </h3>
          <Badge
            variant={
              leaderboard.evalType === "metric" ? "info"
                : leaderboard.evalType === "judge" ? "warning"
                : leaderboard.evalType === "multi-round" ? "success"
                : "muted"
            }
            size="sm"
          >
            {leaderboard.evalType === "metric" ? "모델 성능 평가"
              : leaderboard.evalType === "judge" ? "심사위원 평가"
              : leaderboard.evalType === "multi-round" ? "다단계 평가"
              : "투표 평가"}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-xs text-slate-400">
            업데이트: {formatDateTime(leaderboard.updatedAt)}
          </p>
          {hackathon?.status === "ended" && (
            <Badge variant="muted" size="sm">최종 결과</Badge>
          )}
          {hackathon?.status === "ongoing" && (
            <Badge variant="success" size="sm">실시간</Badge>
          )}
        </div>
      </div>

      {/* 평가 비중 표시 */}
      {evalBreakdown && evalBreakdown.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="mb-3 text-xs font-semibold text-slate-500 dark:text-slate-400">평가 비중</p>
          <div className="flex gap-2">
            {evalBreakdown.map((item: any) => (
              <div key={item.key} className="flex-1 rounded-lg bg-white p-3 text-center dark:bg-slate-800">
                <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{item.weightPercent}%</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">{item.label}</p>
              </div>
            ))}
          </div>
          {leaderboard.metricFormula && (
            <p className="mt-2 font-code text-xs text-slate-400 dark:text-slate-500">
              {leaderboard.metricFormula}
            </p>
          )}
        </div>
      )}

      {/* 다단계 평가일 때: 라운드 탭 */}
      {leaderboard.evalType === "multi-round" && leaderboard.rounds && (
        <MultiRoundLeaderboard
          rounds={leaderboard.rounds}
          finalEntries={leaderboard.entries}
          activeRound={activeRound}
          onRoundChange={setActiveRound}
        />
      )}

      {/* 일반 리더보드 (metric, judge, vote) */}
      {leaderboard.evalType !== "multi-round" && (
        <LeaderboardTable
          entries={leaderboard.entries}
          metricColumns={leaderboard.metricColumns}
          evalType={leaderboard.evalType}
        />
      )}
    </div>
  );
}

/* ===== 다단계 평가 리더보드 ===== */
function MultiRoundLeaderboard({
  rounds,
  finalEntries,
  activeRound,
  onRoundChange,
}: {
  rounds: LeaderboardRound[];
  finalEntries: LeaderboardEntry[];
  activeRound: string | null;
  onRoundChange: (id: string | null) => void;
}) {
  const currentRound = activeRound ? rounds.find((r) => r.roundId === activeRound) : null;

  return (
    <div className="space-y-4">
      {/* 라운드 타임라인 */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <p className="mb-3 text-xs font-semibold text-slate-500 dark:text-slate-400">평가 단계</p>
        <div className="flex gap-2">
          <button
            onClick={() => onRoundChange(null)}
            className={`flex-1 rounded-lg p-3 text-center transition-all ${
              !activeRound
                ? "bg-indigo-600 text-white shadow-md"
                : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            <p className="text-sm font-semibold">종합 결과</p>
            <p className="text-[10px] opacity-80">최종 점수</p>
          </button>
          {rounds.map((round) => (
            <button
              key={round.roundId}
              onClick={() => onRoundChange(round.roundId)}
              className={`flex-1 rounded-lg p-3 text-center transition-all ${
                activeRound === round.roundId
                  ? "bg-indigo-600 text-white shadow-md"
                  : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              <div className="flex items-center justify-center gap-1.5">
                <p className="text-sm font-semibold">{round.name}</p>
                <span
                  className={`inline-block h-2 w-2 rounded-full ${
                    round.status === "completed"
                      ? "bg-green-500"
                      : round.status === "active"
                        ? "bg-yellow-500"
                        : "bg-gray-400"
                  }`}
                />
              </div>
              <p className="text-[10px] opacity-80">비중 {round.weight}%</p>
            </button>
          ))}
        </div>
      </div>

      {/* 선택된 라운드 정보 */}
      {currentRound && (
        <div className="rounded-lg bg-indigo-50 p-3 dark:bg-indigo-900/20">
          <p className="text-sm font-medium text-indigo-800 dark:text-indigo-300">{currentRound.name}</p>
          <p className="text-xs text-indigo-600 dark:text-indigo-400">{currentRound.description}</p>
          {currentRound.scoreFormula && (
            <p className="mt-1 font-code text-xs text-indigo-500">{currentRound.scoreFormula}</p>
          )}
        </div>
      )}

      {/* 리더보드 테이블 */}
      {currentRound ? (
        currentRound.entries.length > 0 ? (
          <LeaderboardTable
            entries={currentRound.entries}
            metricColumns={currentRound.scoreColumns}
            evalType="judge"
          />
        ) : (
          <EmptyState
            emoji="📋"
            title={`${currentRound.name} 결과 대기중`}
            description={
              currentRound.status === "pending"
                ? "아직 평가가 시작되지 않았습니다."
                : "평가가 진행 중입니다. 결과가 곧 공개됩니다."
            }
          />
        )
      ) : finalEntries.length > 0 ? (
        <LeaderboardTable entries={finalEntries} evalType="judge" />
      ) : (
        <EmptyState
          emoji="🏆"
          title="최종 결과 대기중"
          description="모든 라운드의 평가가 완료되면 종합 결과가 공개됩니다."
        />
      )}
    </div>
  );
}

/* ===== 공통 리더보드 테이블 ===== */
function LeaderboardTable({
  entries,
  metricColumns,
  evalType,
}: {
  entries: LeaderboardEntry[];
  metricColumns?: MetricColumn[];
  evalType: string;
}) {
  if (entries.length === 0) {
    return (
      <EmptyState
        emoji="🏆"
        title="리더보드 데이터가 없습니다"
        description="아직 제출된 결과가 없습니다."
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400">
              순위
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400">
              팀
            </th>
            {/* 세부 지표 컬럼들 */}
            {metricColumns && metricColumns.map((col) => (
              <th
                key={col.key}
                className="hidden px-4 py-3 text-right text-xs font-medium text-slate-500 md:table-cell dark:text-slate-400"
              >
                {col.label}
              </th>
            ))}
            <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400">
              종합 점수
            </th>
            <th className="hidden px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 sm:table-cell">
              제출 시간
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, i) => (
            <tr
              key={entry.rank}
              className="animate-fade-in border-b border-slate-100 transition-colors hover:bg-slate-50 last:border-0 dark:border-slate-800 dark:hover:bg-slate-800/50"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <td className="px-4 py-4">
                <span className={`text-sm font-medium ${entry.rank <= 3 ? "text-lg" : "text-slate-900 dark:text-white"}`}>
                  {entry.rank <= 3
                    ? ["🥇", "🥈", "🥉"][entry.rank - 1]
                    : `#${entry.rank}`}
                </span>
              </td>
              <td className="px-4 py-4">
                <span className="text-sm font-medium text-slate-900 dark:text-white">
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
                    <a href={entry.artifacts.webUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-500 hover:underline">
                      🌐 웹
                    </a>
                    <a href={entry.artifacts.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-500 hover:underline">
                      📄 PDF
                    </a>
                  </div>
                )}
                {/* 모바일 세부 지표 */}
                {metricColumns && entry.metrics && (
                  <div className="mt-2 flex flex-wrap gap-1.5 md:hidden">
                    {metricColumns.map((col) => (
                      <span
                        key={col.key}
                        className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                      >
                        {col.label}: {entry.metrics?.[col.key]}{col.unit === "%" ? "%" : col.unit === "ms" ? "ms" : ""}
                      </span>
                    ))}
                  </div>
                )}
              </td>
              {/* 데스크톱 세부 지표 */}
              {metricColumns && metricColumns.map((col) => (
                <td
                  key={col.key}
                  className="hidden px-4 py-4 text-right md:table-cell"
                >
                  <span className="font-code text-sm text-slate-700 dark:text-slate-300">
                    {entry.metrics?.[col.key] ?? "-"}
                    <span className="ml-0.5 text-[10px] text-slate-400">{col.unit}</span>
                  </span>
                </td>
              ))}
              <td className="px-4 py-4 text-right">
                <div className="flex flex-col items-end gap-1">
                  <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                    {entry.score}
                  </span>
                  <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                    <div
                      className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                      style={{ width: `${Math.min(entry.score, 100)}%` }}
                    />
                  </div>
                </div>
              </td>
              <td className="hidden px-4 py-4 text-right text-xs text-slate-500 dark:text-slate-400 sm:table-cell">
                {timeAgo(entry.submittedAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
