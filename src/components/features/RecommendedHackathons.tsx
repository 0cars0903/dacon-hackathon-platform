"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useThemeContext } from "@/components/layout/ThemeProvider";
import { getRecommendedHackathons } from "@/lib/supabase/data";
import { Badge } from "@/components/common/Badge";
import { getDday, getStatusLabel } from "@/lib/utils";
import type { Hackathon } from "@/types";

export function RecommendedHackathons() {
  const { interestTags } = useThemeContext();
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);

  useEffect(() => {
    const load = async () => {
      const data = await getRecommendedHackathons(interestTags);
      setHackathons(data);
    };
    load();
  }, [interestTags]);

  if (hackathons.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="mb-4 flex items-center gap-2">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          추천 해커톤
        </h2>
        {interestTags.length > 0 && (
          <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
            AI 추천
          </span>
        )}
      </div>
      {interestTags.length === 0 && (
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          설정에서 관심 태그를 추가하면 맞춤 추천을 받을 수 있어요!
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {hackathons.slice(0, 3).map((h) => (
          <Link
            key={h.slug}
            href={`/hackathons/${h.slug}`}
            className="group rounded-xl border border-slate-200 p-4 transition-all hover:border-indigo-300 hover:shadow-sm dark:border-slate-800 dark:hover:border-indigo-700"
          >
            <div className="mb-2 flex items-center justify-between">
              <Badge
                variant={
                  h.status === "ongoing"
                    ? "success"
                    : h.status === "upcoming"
                      ? "info"
                      : "muted"
                }
                size="sm"
              >
                {getStatusLabel(h.status)}
              </Badge>
              <span className="text-xs text-slate-400">
                {getDday(h.period.submissionDeadlineAt)}
              </span>
            </div>
            <h3 className="mb-1 text-sm font-semibold text-slate-900 group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400">
              {h.title}
            </h3>
            <div className="flex flex-wrap gap-1">
              {h.tags.map((tag) => (
                <span
                  key={tag}
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    interestTags.some(
                      (t) => t.toLowerCase() === tag.toLowerCase()
                    )
                      ? "bg-indigo-100 font-medium text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300"
                      : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                  }`}
                >
                  {tag}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
