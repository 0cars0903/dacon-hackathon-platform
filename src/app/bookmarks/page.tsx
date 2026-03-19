"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getAllHackathonsUnfiltered, getBookmarks, removeBookmark } from "@/lib/supabase/data";
import { useAuth } from "@/components/features/AuthProvider";
import { Badge } from "@/components/common/Badge";
import { EmptyState } from "@/components/common/EmptyState";
import { BookmarkButton } from "@/components/features/BookmarkButton";
import { formatDate } from "@/lib/utils";
import type { Hackathon } from "@/types";

export default function BookmarksPage() {
  const { user } = useAuth();
  const [bookmarkedSlugs, setBookmarkedSlugs] = useState<string[]>([]);
  const [allHackathons, setAllHackathons] = useState<Hackathon[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!user) {
      setBookmarkedSlugs([]);
      return;
    }

    const loadBookmarks = async () => {
      try {
        const bookmarks = await getBookmarks(user.id);
        setBookmarkedSlugs(bookmarks);
      } catch (error) {
        console.error("Error loading bookmarks:", error);
        setBookmarkedSlugs([]);
      }
    };

    loadBookmarks();
  }, [user, refreshKey]);

  useEffect(() => {
    const load = async () => {
      const h = await getAllHackathonsUnfiltered();
      setAllHackathons(h);
    };
    load();
  }, []);

  const bookmarkedHackathons = bookmarkedSlugs
    .map((slug) => allHackathons.find((h) => h.slug === slug))
    .filter((h): h is Hackathon => h !== undefined);

  const statusLabel = (status: string) => {
    switch (status) {
      case "ongoing": return { text: "진행중", variant: "success" as const };
      case "upcoming": return { text: "예정", variant: "info" as const };
      case "ended": return { text: "종료", variant: "default" as const };
      default: return { text: status, variant: "default" as const };
    }
  };

  const handleRemoveAll = async () => {
    if (!user) return;

    try {
      await Promise.all(
        bookmarkedSlugs.map((slug) => removeBookmark(user.id, slug))
      );
      setRefreshKey((k) => k + 1);
    } catch (error) {
      console.error("Error removing all bookmarks:", error);
    }
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <EmptyState
          emoji="🔖"
          title="로그인이 필요합니다"
          description="북마크 기능을 사용하려면 로그인해주세요."
          actionLabel="로그인"
          actionHref="/login"
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white" style={{ fontWeight: 700 }}>
          북마크
        </h1>
        {bookmarkedHackathons.length > 0 && (
          <button
            onClick={handleRemoveAll}
            className="text-sm text-red-500 hover:text-red-600 hover:underline"
          >
            전체 삭제
          </button>
        )}
      </div>

      {bookmarkedHackathons.length === 0 ? (
        <EmptyState
          emoji="🔖"
          title="북마크한 해커톤이 없습니다"
          description="관심있는 해커톤에서 북마크 버튼을 눌러 저장해보세요."
          actionLabel="해커톤 둘러보기"
          actionHref="/hackathons"
        />
      ) : (
        <div className="space-y-4">
          {bookmarkedHackathons.map((h, i) => {
            const s = statusLabel(h.status);
            return (
              <div
                key={h.slug}
                className="animate-fade-in group rounded-xl border border-slate-200 bg-white p-5 transition-all hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex items-start justify-between gap-4">
                  <Link href={h.links.detail} className="flex-1 min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <Badge variant={s.variant} size="sm">{s.text}</Badge>
                      {h.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="text-xs text-slate-400">#{tag}</span>
                      ))}
                    </div>
                    <h2 className="mb-1 text-lg font-semibold text-slate-900 group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400">
                      {h.title}
                    </h2>
                    <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-400">
                      <span>제출 마감: {formatDate(h.period.submissionDeadlineAt)}</span>
                      <span>종료: {formatDate(h.period.endAt)}</span>
                    </div>
                  </Link>
                  <BookmarkButton hackathonSlug={h.slug} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
