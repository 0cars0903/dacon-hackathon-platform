"use client";

import { useState, useEffect } from "react";

export function BookmarkButton({ hackathonSlug }: { hackathonSlug: string }) {
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    const saved = JSON.parse(
      localStorage.getItem("dacon_bookmarks") || "[]"
    ) as string[];
    setBookmarked(saved.includes(hackathonSlug));
  }, [hackathonSlug]);

  const toggle = () => {
    const saved = JSON.parse(
      localStorage.getItem("dacon_bookmarks") || "[]"
    ) as string[];
    let updated: string[];
    if (saved.includes(hackathonSlug)) {
      updated = saved.filter((s) => s !== hackathonSlug);
    } else {
      updated = [...saved, hackathonSlug];
    }
    localStorage.setItem("dacon_bookmarks", JSON.stringify(updated));
    setBookmarked(!bookmarked);
  };

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle();
      }}
      className={`rounded-lg p-1.5 transition-all ${
        bookmarked
          ? "text-yellow-500 hover:text-yellow-600"
          : "text-gray-300 hover:text-gray-400 dark:text-gray-600 dark:hover:text-gray-500"
      }`}
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
