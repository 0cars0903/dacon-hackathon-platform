"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { getHackathonDetail } from "@/lib/supabase/data";
import { EmptyState } from "@/components/common/EmptyState";
import { formatKRW, formatDateTime } from "@/lib/utils";

/* eslint-disable @typescript-eslint/no-explicit-any */

export default function HackathonInfoPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [detail, setDetail] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      const d = await getHackathonDetail(slug);
      setDetail(d);
    };
    load();
  }, [slug]);

  if (!detail) {
    return <EmptyState emoji="📏" title="상세 정보를 불러올 수 없습니다" />;
  }

  const { sections } = detail;

  return (
    <div className="space-y-8">
      {/* 평가 */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">📏 평가 기준</h2>
        <div className="rounded-xl bg-gray-50 p-6 dark:bg-gray-900">
          <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">
            {sections.eval.metricName}
          </h3>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {sections.eval.description}
          </p>
        </div>

        {sections.eval.scoreDisplay && (
          <div className="rounded-xl border border-gray-200 p-6 dark:border-gray-800">
            <h4 className="mb-3 font-semibold text-gray-900 dark:text-white">
              {sections.eval.scoreDisplay.label}
            </h4>
            <div className="space-y-3">
              {sections.eval.scoreDisplay.breakdown.map(
                (item: { key: string; label: string; weightPercent: number }) => (
                  <div key={item.key} className="flex items-center gap-3">
                    <span className="w-20 text-sm text-gray-600 dark:text-gray-400">{item.label}</span>
                    <div className="flex-1">
                      <div className="h-2.5 rounded-full bg-gray-200 dark:bg-gray-700">
                        <div className="h-2.5 rounded-full bg-blue-500 transition-all duration-500" style={{ width: `${item.weightPercent}%` }} />
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{item.weightPercent}%</span>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {sections.eval.limits && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
              <p className="text-xs text-gray-500 dark:text-gray-400">최대 실행 시간</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{sections.eval.limits.maxRuntimeSec}초</p>
            </div>
            <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
              <p className="text-xs text-gray-500 dark:text-gray-400">일일 최대 제출</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{sections.eval.limits.maxSubmissionsPerDay}회</p>
            </div>
          </div>
        )}
      </section>

      {/* 상금 */}
      {sections.prize && (
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">🏅 상금</h2>
          <div className="rounded-xl border border-gray-200 dark:border-gray-800">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">순위</th>
                  <th className="px-6 py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-400">상금</th>
                </tr>
              </thead>
              <tbody>
                {sections.prize.items.map((item: { place: string; amountKRW: number }, i: number) => (
                  <tr key={item.place} className="border-b border-gray-100 last:border-0 dark:border-gray-800">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"} {item.place}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-semibold text-blue-600 dark:text-blue-400">
                      {formatKRW(item.amountKRW)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 일정 */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">📅 일정</h2>
        <p className="text-xs text-gray-400">타임존: {sections.schedule.timezone}</p>
        <div className="relative pl-6">
          {sections.schedule.milestones.map((m: { name: string; at: string }, i: number) => {
            const isPast = new Date(m.at).getTime() < Date.now();
            return (
              <div key={i} className="relative mb-6 last:mb-0">
                {i < sections.schedule.milestones.length - 1 && (
                  <div className="absolute -bottom-6 left-[-18px] top-3 w-0.5 bg-gray-200 dark:bg-gray-700" />
                )}
                <div
                  className={`absolute left-[-22px] top-1.5 h-3 w-3 rounded-full border-2 ${
                    isPast
                      ? "border-green-500 bg-green-500"
                      : "border-blue-500 bg-white dark:bg-gray-950"
                  }`}
                />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{m.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{formatDateTime(m.at)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 안내사항 */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">ℹ️ 안내</h2>
        <div className="rounded-xl bg-yellow-50 p-6 dark:bg-yellow-900/20">
          <h3 className="mb-3 font-semibold text-gray-900 dark:text-white">유의사항</h3>
          <ul className="space-y-2">
            {sections.info.notice.map((note: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                <span className="mt-0.5 text-yellow-500">•</span>
                {note}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
