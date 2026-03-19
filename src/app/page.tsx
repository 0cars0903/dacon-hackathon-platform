"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getHackathons } from "@/lib/supabase/data";
import { Badge } from "@/components/common/Badge";
import { getDday, getStatusLabel } from "@/lib/utils";
import { RecommendedHackathons } from "@/components/features/RecommendedHackathons";
import { StatsOverview } from "@/components/features/StatsOverview";
import type { Hackathon } from "@/types";

export default function HomePage() {
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getHackathons();
        setHackathons(data);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const ongoingCount = hackathons.filter(
    (h) => h.status === "ongoing" || h.status === "upcoming"
  ).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 has-safe-area">
      <div className="bento-grid mx-auto max-w-6xl px-4 py-6 sm:py-8 lg:py-10">
        {/* Hero Section - Kinetic Typography */}
        <section className="bento-hero animate-fade-in-up overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-indigo-800 p-6 text-white shadow-lg sm:p-12 dark:from-indigo-700 dark:via-violet-700 dark:to-indigo-900">
          <div className="relative">
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/5 blur-3xl sm:h-48 sm:w-48" />
            <div className="absolute -bottom-12 -right-4 h-24 w-24 rounded-full bg-violet-400/10 blur-3xl sm:h-36 sm:w-36" />
            <h1 className="kinetic-hero font-display text-responsive-hero relative mb-3 font-bold">
              DACON PLATFORM
            </h1>
            <p className="relative mb-1 text-lg font-medium text-white/90 sm:text-xl">
              데이터 경진대회 플랫폼
            </p>
            <p className="text-responsive-subtitle relative mb-6 text-indigo-100">
              다양한 해커톤에 참가하고, 팀을 구성하고,
              <br className="hidden sm:block" />
              데이터 기반 솔루션으로 경쟁하세요.
            </p>
            <div className="relative flex flex-wrap items-center gap-4">
              <Link
                href="/hackathons"
                className="btn-press touch-target inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 font-semibold text-indigo-700 shadow-lg transition-all hover:shadow-xl"
              >
                해커톤 둘러보기
              </Link>
              <span className="rounded-full bg-white/20 px-4 py-2 text-sm font-medium backdrop-blur-sm">
                {ongoingCount}개 해커톤 진행중
              </span>
            </div>
          </div>
        </section>

        {/* Stats Overview - Bento Grid */}
        <section className="bento-stats">
          <StatsOverview />
        </section>

        {/* Activity Feed Card */}
        <section className="bento-activity">
          <div className="animate-fade-in-up rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">
              최근 활동
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              플랫폼의 활동을 확인하세요
            </p>
          </div>
        </section>

        {/* Recommended Hackathons */}
        <section className="bento-competitions lg:col-span-2">
          <RecommendedHackathons />
        </section>

        {/* Teams Section */}
        <section className="bento-teams">
          <div className="animate-fade-in-up rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">
              팀 모집
            </h3>
            <Link
              href="/camp"
              className="text-xs text-indigo-600 hover:underline dark:text-indigo-400"
            >
              팀 찾기 →
            </Link>
          </div>
        </section>

        {/* All Competitions - Full Width */}
        {!isLoading && (
          <section className="lg:col-span-3 xl:col-span-4">
            <h2 className="mb-4 text-xl font-bold text-slate-900 dark:text-white">
              모든 해커톤
            </h2>
            <div className="swipe-cards-container lg:grid lg:grid-cols-3 lg:gap-4">
              {hackathons.length === 0 ? (
                <p className="col-span-3 py-12 text-center text-slate-500 dark:text-slate-400">
                  등록된 해커톤이 없습니다
                </p>
              ) : (
                hackathons.map((h, i) => (
                  <Link
                    key={h.slug}
                    href={`/hackathons/${h.slug}`}
                    className="swipe-card card-interactive animate-fade-in-up rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <Badge
                        variant={
                          h.status === "ongoing"
                            ? "success"
                            : h.status === "upcoming"
                              ? "info"
                              : "muted"
                        }
                      >
                        {getStatusLabel(h.status)}
                      </Badge>
                      <span className="text-xs text-slate-400">
                        {getDday(h.period.submissionDeadlineAt)}
                      </span>
                    </div>
                    <h3 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">
                      {h.title}
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {h.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </Link>
                ))
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
