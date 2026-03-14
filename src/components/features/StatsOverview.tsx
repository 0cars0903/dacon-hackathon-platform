"use client";

import { useEffect, useState } from "react";

const STATS = [
  { label: "진행중 해커톤", value: 2, suffix: "개", color: "text-blue-600 dark:text-blue-400" },
  { label: "참가 팀", value: 47, suffix: "팀", color: "text-green-600 dark:text-green-400" },
  { label: "총 참가자", value: 156, suffix: "명", color: "text-purple-600 dark:text-purple-400" },
  { label: "제출물", value: 89, suffix: "건", color: "text-orange-600 dark:text-orange-400" },
];

function AnimatedNumber({ target, duration = 1200 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const startTime = performance.now();

    function animate(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = Math.round(eased * target);

      if (current !== start) {
        setCount(current);
        start = current;
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }

    requestAnimationFrame(animate);
  }, [target, duration]);

  return <>{count}</>;
}

export function StatsOverview() {
  return (
    <section className="mb-8">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {STATS.map((stat, i) => (
          <div
            key={stat.label}
            className={`animate-fade-in-up rounded-xl border border-gray-200 bg-white p-4 text-center dark:border-gray-800 dark:bg-gray-900 delay-${(i + 1) * 75}`}
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className={`mb-1 text-2xl font-bold ${stat.color}`}>
              <AnimatedNumber target={stat.value} />
              <span className="ml-0.5 text-sm font-medium">{stat.suffix}</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
