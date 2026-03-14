"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getHackathons, getTeams } from "@/lib/data";
import type { Hackathon, Team, UserProfile } from "@/types";

interface SearchResult {
  type: "hackathon" | "team" | "user";
  id: string;
  name: string;
  description: string;
  icon: string;
  link: string;
  metadata?: string;
}

interface RecentSearch {
  query: string;
  timestamp: number;
}

interface SearchModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const DEBOUNCE_MS = 300;
const MAX_RECENT_SEARCHES = 5;
const RECENT_SEARCHES_KEY = "dacon_recent_searches";

export function SearchModal({ isOpen: externalIsOpen, onClose }: SearchModalProps = {}) {
  const router = useRouter();
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const handleClose = onClose || (() => setInternalIsOpen(false));
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const selectedItemRef = useRef<HTMLButtonElement>(null);

  // Load recent searches on mount
  useEffect(() => {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setInternalIsOpen(true);
      }
      if (isOpen && e.key === "Escape") {
        handleClose();
        setQuery("");
        setSelectedIndex(-1);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  // Debounced search
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (!query.trim()) {
      setResults([]);
      setSelectedIndex(-1);
      return;
    }

    setIsLoading(true);
    debounceTimer.current = setTimeout(() => {
      performSearch(query);
      setSelectedIndex(-1);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query]);

  const performSearch = useCallback((searchQuery: string) => {
    const lowerQuery = searchQuery.toLowerCase().trim();
    const results: SearchResult[] = [];

    // Search hackathons
    const hackathons = getHackathons();
    hackathons.forEach((h) => {
      if (
        h.title.toLowerCase().includes(lowerQuery) ||
        h.tags.some((t) => t.toLowerCase().includes(lowerQuery))
      ) {
        results.push({
          type: "hackathon",
          id: h.slug,
          name: h.title,
          description: h.tags.join(", "),
          icon: "🚀",
          link: `/hackathons/${h.slug}`,
          metadata: `상태: ${h.status === "ongoing" ? "진행중" : h.status === "upcoming" ? "예정" : "종료"}`,
        });
      }
    });

    // Search teams
    const teams = getTeams();
    teams.forEach((t) => {
      if (
        t.name.toLowerCase().includes(lowerQuery) ||
        t.intro.toLowerCase().includes(lowerQuery) ||
        t.lookingFor.some((role) => role.toLowerCase().includes(lowerQuery))
      ) {
        results.push({
          type: "team",
          id: t.teamCode,
          name: t.name,
          description: t.intro,
          icon: "👥",
          link: `/camp?hackathon=${t.hackathonSlug}&team=${t.teamCode}`,
          metadata: `${t.memberCount}명 · ${t.isOpen ? "모집중" : "모집완료"}`,
        });
      }
    });

    // Search users/profiles from localStorage
    const profiles: UserProfile[] = [];
    try {
      const stored = localStorage.getItem("dacon_profiles");
      if (stored) {
        profiles.push(...JSON.parse(stored));
      }
    } catch {
      // Ignore parse errors
    }

    profiles.forEach((p) => {
      if (
        p.name.toLowerCase().includes(lowerQuery) ||
        p.nickname.toLowerCase().includes(lowerQuery) ||
        p.email.toLowerCase().includes(lowerQuery) ||
        p.skills.some((s) => s.toLowerCase().includes(lowerQuery))
      ) {
        results.push({
          type: "user",
          id: p.id,
          name: p.name,
          description: p.skills.slice(0, 3).join(", ") || p.bio || "프로필 없음",
          icon: "👤",
          link: `/profile?id=${p.id}`,
          metadata: `닉네임: ${p.nickname}`,
        });
      }
    });

    setResults(results);
    setIsLoading(false);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < results.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter" && selectedIndex >= 0 && results[selectedIndex]) {
      e.preventDefault();
      handleSelectResult(results[selectedIndex]);
    }
  };

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && selectedItemRef.current) {
      selectedItemRef.current.scrollIntoView({
        block: "nearest",
      });
    }
  }, [selectedIndex]);

  const handleSelectResult = (result: SearchResult) => {
    // Add to recent searches
    const newRecent: RecentSearch = {
      query: query.trim(),
      timestamp: Date.now(),
    };
    const updated = [
      newRecent,
      ...recentSearches.filter((r) => r.query !== query.trim()),
    ].slice(0, MAX_RECENT_SEARCHES);
    setRecentSearches(updated);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));

    // Navigate
    handleClose();
    setQuery("");
    setResults([]);
    setSelectedIndex(-1);
    router.push(result.link);
  };

  const handleRecentSearch = (recentQuery: string) => {
    setQuery(recentQuery);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  };

  const handleOverlayClick = () => {
    handleClose();
    setQuery("");
    setSelectedIndex(-1);
  };

  if (!isOpen) return null;

  // Group results by type
  const groupedResults: Record<string, SearchResult[]> = {
    hackathon: [],
    team: [],
    user: [],
  };
  results.forEach((r) => {
    if (groupedResults[r.type]) {
      groupedResults[r.type].push(r);
    }
  });

  const categoryLabels = {
    hackathon: "🚀 해커톤",
    team: "👥 팀",
    user: "👤 사용자",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleOverlayClick}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl mx-4 rounded-2xl bg-white shadow-2xl dark:bg-gray-900 overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-gray-200 px-4 py-4 dark:border-gray-800">
          <svg
            className="h-5 w-5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="해커톤, 팀, 사용자 검색... (Cmd+K)"
            className="flex-1 bg-transparent text-base text-gray-900 outline-none placeholder:text-gray-400 dark:text-white"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label="검색 초기화"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Results or empty state */}
        <div
          ref={resultsRef}
          className="max-h-[400px] overflow-y-auto"
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                검색 중...
              </div>
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
              {Object.entries(groupedResults).map(([type, items]) =>
                items.length > 0 ? (
                  <div key={type}>
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
                      {categoryLabels[type as keyof typeof categoryLabels]}
                    </div>
                    {items.map((result, idx) => {
                      const globalIdx = results.indexOf(result);
                      return (
                        <button
                          key={`${result.type}-${result.id}`}
                          ref={globalIdx === selectedIndex ? selectedItemRef : null}
                          onClick={() => handleSelectResult(result)}
                          className={`w-full px-4 py-3 text-left transition-colors flex items-center gap-3 ${
                            globalIdx === selectedIndex
                              ? "bg-blue-50 dark:bg-blue-900/20"
                              : "hover:bg-gray-50 dark:hover:bg-gray-800"
                          }`}
                        >
                          <span className="text-lg">{result.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {result.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {result.description}
                            </p>
                            {result.metadata && (
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                {result.metadata}
                              </p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : null
              )}
            </div>
          ) : query.trim() ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <span className="text-4xl mb-3">🔍</span>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                검색 결과가 없습니다
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center max-w-xs">
                다른 키워드로 검색해보세요
              </p>
            </div>
          ) : recentSearches.length > 0 ? (
            <div className="py-3">
              <div className="flex items-center justify-between px-4 py-2">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                  최근 검색
                </span>
                <button
                  onClick={clearRecentSearches}
                  className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  모두 삭제
                </button>
              </div>
              {recentSearches.map((recent, idx) => (
                <button
                  key={`recent-${idx}`}
                  onClick={() => handleRecentSearch(recent.query)}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2"
                >
                  <svg
                    className="h-4 w-4 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {recent.query}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <span className="text-4xl mb-3">💡</span>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                어떤 것을 찾으세요?
              </h3>
              <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <li>• 해커톤 제목 또는 태그로 검색</li>
                <li>• 팀 이름 또는 모집 분야로 검색</li>
                <li>• 사용자 이름 또는 스킬로 검색</li>
              </ul>
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="border-t border-gray-200 px-4 py-2 text-xs text-gray-400 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <span>↑↓ 이동</span>
            <span>Enter 선택</span>
            <span>Esc 닫기</span>
          </div>
        </div>
      </div>
    </div>
  );
}
