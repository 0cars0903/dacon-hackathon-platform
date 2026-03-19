"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { getHackathons } from "@/lib/supabase/data";
import { Badge } from "@/components/common/Badge";
import { Tag } from "@/components/common/Tag";
import { EmptyState } from "@/components/common/EmptyState";
import { BookmarkButton } from "@/components/features/BookmarkButton";
import { getDday, getStatusLabel } from "@/lib/utils";
import type { Hackathon } from "@/types";

type StatusFilter = "all" | "ongoing" | "ended" | "upcoming";
type SortOption = "latest" | "deadline";

const STATUS_OPTIONS: { key: StatusFilter; label: string; emoji: string }[] = [
  { key: "all", label: "전체", emoji: "📋" },
  { key: "ongoing", label: "진행중", emoji: "🟢" },
  { key: "upcoming", label: "예정", emoji: "🔵" },
  { key: "ended", label: "종료", emoji: "⚪" },
];

export default function HackathonsPage() {
  const [allHackathons, setAllHackathons] = useState<Hackathon[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sort, setSort] = useState<SortOption>("latest");

  useEffect(() => {
    const load = async () => {
      const data = await getHackathons();
      setAllHackathons(data);
    };
    load();
  }, []);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    allHackathons.forEach((h) => h.tags.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet);
  }, [allHackathons]);

  const filtered = useMemo(() => {
    let result = allHackathons;

    if (statusFilter !== "all") {
      result = result.filter((h) => h.status === statusFilter);
    }

    if (selectedTags.length > 0) {
      result = result.filter((h) =>
        selectedTags.some((tag) => h.tags.includes(tag))
      );
    }

    result = [...result].sort((a, b) => {
      if (sort === "deadline") {
        return (
          new Date(a.period.submissionDeadlineAt).getTime() -
          new Date(b.period.submissionDeadlineAt).getTime()
        );
      }
      return (
        new Date(b.period.submissionDeadlineAt).getTime() -
        new Date(a.period.submissionDeadlineAt).getTime()
      );
    });

    return result;
  }, [allHackathons, statusFilter, selectedTags, sort]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const resetFilters = () => {
    setStatusFilter("all");
    setSelectedTags([]);
  };

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: allHackathons.length };
    allHackathons.forEach((h) => {
      map[h.status] = (map[h.status] || 0) + 1;
    });
    return map;
  }, [allHackathons]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          해커톤 목록
        </h1>
        <span className="text-sm text-slate-400">
          총 {allHackathons.length}개
        </span>
      </div>

      {/* 필터 영역 */}
      <div className="mb-6 space-y-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        {/* 상태 필터 */}
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setStatusFilter(opt.key)}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                statusFilter === opt.key
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
              }`}
            >
              <span className="text-xs">{opt.emoji}</span>
              {opt.label}
              <span className={`ml-1 rounded-full px-1.5 text-xs ${
                statusFilter === opt.key
                  ? "bg-white/20"
                  : "bg-slate-200 dark:bg-slate-700"
              }`}>
                {counts[opt.key] || 0}
              </span>
            </button>
          ))}
        </div>

        {/* 태그 필터 */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-slate-500 dark:text-slate-400">
            태그:
          </span>
          {allTags.map((tag) => (
            <Tag
              key={tag}
              label={tag}
              selected={selectedTags.includes(tag)}
              onClick={() => toggleTag(tag)}
            />
          ))}
        </div>

        {/* 정렬 + 필터 리셋 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500 dark:text-slate-400">
              정렬:
            </span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              <option value="latest">최신순</option>
              <option value="deadline">마감임박순</option>
            </select>
          </div>
          {(statusFilter !== "all" || selectedTags.length > 0) && (
            <button
              onClick={resetFilters}
              className="text-xs text-indigo-600 hover:underline dark:text-indigo-400"
            >
              필터 초기화
            </button>
          )}
        </div>
      </div>

      {/* 해커톤 카드 그리드 — Swipeable on mobile, Grid on desktop */}
      {filtered.length === 0 ? (
        <EmptyState
          emoji="🔍"
          title="조건에 맞는 해커톤이 없습니다"
          description="필터를 변경하거나 초기화해보세요."
          actionLabel="필터 초기화"
          onAction={resetFilters}
        />
      ) : (
        <div className="swipe-cards-container lg:grid lg:grid-cols-2 lg:gap-4 xl:grid-cols-3">
          {filtered.map((h, i) => (
            <HackathonCard key={h.slug} hackathon={h} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

function HackathonCard({ hackathon: h, index }: { hackathon: Hackathon; index: number }) {
  return (
    <Link
      href={`/hackathons/${h.slug}`}
      className="swipe-card card-interactive animate-fade-in-up group relative rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* 북마크 */}
      <div className="absolute right-3 top-3">
        <BookmarkButton hackathonSlug={h.slug} />
      </div>

      {/* 썸네일 placeholder */}
      <div className="mb-4 flex h-32 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950 dark:to-indigo-900">
        <span className="text-4xl opacity-50 transition-transform group-hover:scale-110">🏆</span>
      </div>

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
        <span className="text-xs font-medium text-slate-400">
          {getDday(h.period.submissionDeadlineAt)}
        </span>
      </div>

      <h3 className="mb-3 line-clamp-2 text-sm font-semibold text-slate-900 group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400">
        {h.title}
      </h3>

      <div className="flex flex-wrap gap-1.5">
        {h.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400"
          >
            {tag}
          </span>
        ))}
      </div>
    </Link>
  );
}
