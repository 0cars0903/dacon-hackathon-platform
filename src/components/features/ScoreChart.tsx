"use client";

/**
 * 점수 분포 차트 (CSS-only bar chart)
 */

const DISTRIBUTION = [
  { range: "0-20", count: 2, percent: 8 },
  { range: "21-40", count: 5, percent: 20 },
  { range: "41-60", count: 12, percent: 48 },
  { range: "61-80", count: 8, percent: 32 },
  { range: "81-100", count: 3, percent: 12 },
];

const maxPercent = Math.max(...DISTRIBUTION.map((d) => d.percent));

export function ScoreChart({ title = "점수 분포" }: { title?: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">
        {title}
      </h3>
      <div className="flex items-end gap-2" style={{ height: 120 }}>
        {DISTRIBUTION.map((d) => (
          <div key={d.range} className="flex flex-1 flex-col items-center gap-1">
            <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">
              {d.count}
            </span>
            <div
              className="w-full rounded-t bg-blue-500 transition-all duration-700 dark:bg-blue-400"
              style={{
                height: `${(d.percent / maxPercent) * 80}px`,
                minHeight: 4,
              }}
            />
            <span className="text-[10px] text-gray-400">{d.range}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
