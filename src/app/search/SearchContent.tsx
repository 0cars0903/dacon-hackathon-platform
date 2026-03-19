"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getHackathons, getTeams, getProfile } from "@/lib/supabase/data";
import type { Hackathon, Team, UserProfile } from "@/types";
import { Card, CardHeader, CardContent, Badge, EmptyState } from "@/components/common";

interface SearchResult {
  type: "hackathon" | "team" | "user";
  id: string;
  name: string;
  description: string;
  icon: string;
  link: string;
  metadata?: string;
}

const DEBOUNCE_MS = 300;

type FilterType = "all" | "hackathon" | "team" | "user";

export function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [isLoading, setIsLoading] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Debounced search
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    debounceTimer.current = setTimeout(() => {
      performSearch(query);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query]);

  const performSearch = useCallback(async (searchQuery: string) => {
    const lowerQuery = searchQuery.toLowerCase().trim();
    const allResults: SearchResult[] = [];

    // Search hackathons
    const hackathons = await getHackathons();
    hackathons.forEach((h) => {
      if (
        h.title.toLowerCase().includes(lowerQuery) ||
        h.tags.some((t) => t.toLowerCase().includes(lowerQuery))
      ) {
        allResults.push({
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
    const teams = await getTeams();
    teams.forEach((t) => {
      if (
        t.name.toLowerCase().includes(lowerQuery) ||
        t.intro.toLowerCase().includes(lowerQuery) ||
        t.lookingFor.some((role) => role.toLowerCase().includes(lowerQuery))
      ) {
        allResults.push({
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

    // Search users/profiles from Supabase
    const profiles: UserProfile[] = [];
    try {
      const { createDataClient } = await import("@/lib/supabase/client");
      const { data: profileRows } = await createDataClient()
        .from("profiles")
        .select("id, name, nickname, email, skills, bio")
        .limit(200);
      if (profileRows) {
        profiles.push(...profileRows.map((p: any) => ({
          id: p.id, name: p.name, nickname: p.nickname ?? "",
          email: p.email ?? "", skills: p.skills ?? [], bio: p.bio ?? "",
        } as UserProfile)));
      }
    } catch {
      // Ignore errors
    }

    profiles.forEach((p) => {
      if (
        p.name.toLowerCase().includes(lowerQuery) ||
        p.nickname.toLowerCase().includes(lowerQuery) ||
        p.email.toLowerCase().includes(lowerQuery) ||
        p.skills.some((s) => s.toLowerCase().includes(lowerQuery))
      ) {
        allResults.push({
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

    setResults(allResults);
    setIsLoading(false);
  }, []);

  // Filter results based on selected filter
  const filteredResults = filterType === "all"
    ? results
    : results.filter(r => r.type === filterType);

  // Count by type
  const counts = {
    all: results.length,
    hackathon: results.filter(r => r.type === "hackathon").length,
    team: results.filter(r => r.type === "team").length,
    user: results.filter(r => r.type === "user").length,
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const getStatusBadgeVariant = (status: string) => {
    if (status.includes("진행중")) return "info";
    if (status.includes("예정")) return "warning";
    return "default";
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-6 text-3xl font-bold text-slate-900 dark:text-white">
          검색
        </h1>

        {/* Search Input */}
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <svg
            className="h-5 w-5 text-slate-400"
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
            onChange={handleSearchChange}
            placeholder="해커톤, 팀, 사용자 검색..."
            className="flex-1 bg-transparent text-lg text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
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

        {/* Filter Tabs */}
        {query.trim() && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {(["all", "hackathon", "team", "user"] as const).map((type) => {
              const labels = {
                all: "전체",
                hackathon: "해커톤",
                team: "팀",
                user: "사용자",
              };
              return (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    filterType === type
                      ? "bg-indigo-600 text-white dark:bg-indigo-500"
                      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                >
                  {labels[type]}
                  {counts[type] > 0 && (
                    <span className="ml-2 font-semibold">{counts[type]}</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Results */}
      <div>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-slate-500 dark:text-slate-400">검색 중...</div>
          </div>
        ) : query.trim() && filteredResults.length > 0 ? (
          <div className="space-y-4">
            {filteredResults.map((result) => (
              <Link key={`${result.type}-${result.id}`} href={result.link}>
                <Card hover className="transition-all">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="flex-shrink-0 text-3xl">{result.icon}</div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1 truncate">
                        {result.name}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2 line-clamp-2">
                        {result.description}
                      </p>
                      <div className="flex items-center gap-2">
                        {result.metadata && (
                          <Badge variant={getStatusBadgeVariant(result.metadata)}>
                            {result.metadata}
                          </Badge>
                        )}
                        <Badge variant="muted" className="text-xs">
                          {result.type === "hackathon"
                            ? "해커톤"
                            : result.type === "team"
                            ? "팀"
                            : "사용자"}
                        </Badge>
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className="flex-shrink-0 text-slate-400">
                      <svg
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : query.trim() ? (
          <EmptyState
            emoji="🔍"
            title="검색 결과가 없습니다"
            description="다른 키워드로 검색해보세요"
          />
        ) : (
          <EmptyState
            emoji="💡"
            title="무엇을 검색하시나요?"
            description="해커톤, 팀, 사용자를 찾아보세요"
          />
        )}
      </div>
    </div>
  );
}
