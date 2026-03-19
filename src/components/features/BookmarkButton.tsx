"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/features/AuthProvider";
import { isBookmarked, addBookmark, removeBookmark } from "@/lib/supabase/data";

export function BookmarkButton({ hackathonSlug }: { hackathonSlug: string }) {
  const { user } = useAuth();
  const [bookmarked, setBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setBookmarked(false);
      return;
    }

    const checkBookmark = async () => {
      try {
        const isCurrentlyBookmarked = await isBookmarked(user.id, hackathonSlug);
        setBookmarked(isCurrentlyBookmarked);
      } catch (error) {
        console.error("Error checking bookmark status:", error);
      }
    };

    checkBookmark();
  }, [user, hackathonSlug]);

  const toggle = async () => {
    if (!user) {
      return;
    }

    setLoading(true);
    try {
      if (bookmarked) {
        await removeBookmark(user.id, hackathonSlug);
        setBookmarked(false);
      } else {
        await addBookmark(user.id, hackathonSlug);
        setBookmarked(true);
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle();
      }}
      disabled={!user || loading}
      className={`rounded-lg p-1.5 transition-all ${
        !user
          ? "text-slate-300 cursor-not-allowed dark:text-slate-600"
          : bookmarked
          ? "text-yellow-500 hover:text-yellow-600"
          : "text-slate-300 hover:text-slate-400 dark:text-slate-600 dark:hover:text-slate-500"
      } ${loading ? "opacity-50" : ""}`}
      aria-label={bookmarked ? "북마크 해제" : "북마크"}
    >
      <svg
        className="h-5 w-5"
        fill={bookmarked ? "currentColor" : "none"}
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
        />
      </svg>
    </button>
  );
}
