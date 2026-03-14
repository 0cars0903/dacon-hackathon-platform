"use client";

import { useMemo } from "react";

/**
 * 점수 분포 차트 (CSS-only bar chart)
 * scores를 전달하면 실제 데이터 기반으로 분포를 계산
 */

interface ScoreChartProps {
  title?: string;
  scores?: number[];
}

function computeDistribution(scores: number[]) {
  const ranges = [
    { range: "0-20", min: 0, max: 20, count: 0 },
    { range: "21-40", min: 21, max: 40, count: 0 },
    { range: "41-60", min: 41, max: 60, count: 0 },
    { range: "61-80", min: 61, max: 80, count: 0 },
    { range: "81-100", min: 81, max: 100, count: 0 },
  ];

  scores.forEach((s) => {
    const bucket = ranges.find((r) => s >= r.min && s <= r.max);
    if (bucket) bucket.count++;
  });

  const maxCount = Math.max(...ranges.map((r) => r.count), 1);
  return ranges.map((r) => ({
    range: r.range,
    count: r.count,
    percent: Math.round((r.count / maxCount) * 100),
  }));
}

export function ScoreChart({ title = "점수 분포", scores }: ScoreChartProps) {
  const distribution = useMemo(() => {
    if (scores && scores.length > 0) {
      return computeDistribution(scores);
    }
    // 데이터가 없으면 빈 분포
    return [
      { range: "0-20", count: 0, percent: 0 },
      { range: "21-40", count: 0, percent: 0 },
      { range: "41-60", count: 0, percent: 0 },
      { range: "61-80", count: 0, percent: 0 },
      { range: "81-100", count: 0, percent: 0 },
    ];
  }, [scores]);

  const maxPercent = Math.max(...distribution.map((d) => d.percent), 1);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">
        {title}
      </h3>
      <div className="flex items-end gap-2" style={{ height: 120 }}>
        {distribution.map((d) => (
          <div key={d.range} className="flex flex-1 flex-col items-center gap-1">
            <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">
              {d.count}
            </span>
            <div
              className="w-full rounded-t bg-blue-500 transition-all duration-700 dark:bg-blue-400"
              style={{
                height: d.count > 0 ? `${(d.percent / maxPercent) * 80}px` : "4px",
                minHeight: 4,
                opacity: d.count > 0 ? 1 : 0.3,
              }}
            />
            <span className="text-[10px] text-gray-400">{d.range}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
