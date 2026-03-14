"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { getHackathons } from "@/lib/data";
import { Badge } from "@/components/common/Badge";
import { Tag } from "@/components/common/Tag";
import { EmptyState } from "@/components/common/EmptyState";
import { getDday, getStatusLabel } from "@/lib/utils";
import type { Hackathon } from "@/types";

type StatusFilter = "all" | "ongoing" | "ended" | "upcoming";
type SortOption = "latest" | "deadline";

const STATUS_OPTIONS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "ongoing", label: "진행중" },
  { key: "upcoming", label: "예정" },
  { key: "ended", label: "종료" },
];

export default function HackathonsPage() {
  const allHackathons = getHackathons();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sort, setSort] = useState<SortOption>("latest");

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

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
        해커톤 목록
      </h1>

      {/* 필터 영역 */}
      <div className="mb-6 space-y-4">
        {/* 상태 필터 */}
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setStatusFilter(opt.key)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                statusFilter === opt.key
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* 태그 필터 */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">
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

        {/* 정렬 */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            정렬:
          </span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
          >
            <option value="latest">최신순</option>
            <option value="deadline">마감임박순</option>
          </select>
        </div>
      </div>

      {/* 해커톤 카드 그리드 */}
      {filtered.length === 0 ? (
        <EmptyState
          emoji="🔍"
          title="조건에 맞는 해커톤이 없습니다"
          description="필터를 변경하거나 초기화해보세요."
          actionLabel="필터 초기화"
          onAction={resetFilters}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((h) => (
            <HackathonCard key={h.slug} hackathon={h} />
          ))}
        </div>
      )}
    </div>
  );
}

function HackathonCard({ hackathon: h }: { hackathon: Hackathon }) {
  return (
    <Link
      href={`/hackathons/${h.slug}`}
      className="group rounded-xl border border-gray-200 bg-white p-5 transition-all hover:border-blue-300 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-blue-700"
    >
      {/* 썸네일 placeholder */}
      <div className="mb-4 flex h-32 items-center justify-center rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
        <span className="text-4xl opacity-50">🏆</span>
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
        <span className="text-xs font-medium text-gray-400">
          {getDday(h.period.submissionDeadlineAt)}
        </span>
      </div>

      <h3 className="mb-3 line-clamp-2 text-sm font-semibold text-gray-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
        {h.title}
      </h3>

      <div className="flex flex-wrap gap-1.5">
        {h.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400"
          >
            {tag}
          </span>
        ))}
      </div>
    </Link>
  );
}
