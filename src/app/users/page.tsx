"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/features/AuthProvider";
import { Badge } from "@/components/common/Badge";
import { EmptyState } from "@/components/common/EmptyState";
import type { UserProfile } from "@/types";

export default function UsersDirectoryPage() {
  const { getAllProfiles } = useAuth();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "active">("recent");

  useEffect(() => {
    const load = async () => {
      const allProfiles = await getAllProfiles();
      setProfiles(allProfiles);
    };
    load();
  }, [getAllProfiles]);

  // 검색 필터링
  const filtered = profiles.filter((p) => {
    const query = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(query) ||
      (p.nickname || "").toLowerCase().includes(query) ||
      p.skills.some((s) => s.toLowerCase().includes(query))
    );
  });

  // 정렬
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "recent") {
      return new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime();
    } else {
      // 활동도: hackathonsJoined + submissions
      const aActivity = a.stats.hackathonsJoined + a.stats.submissions;
      const bActivity = b.stats.hackathonsJoined + b.stats.submissions;
      return bActivity - aActivity;
    }
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">참가자</h1>
        <p className="text-gray-600 dark:text-gray-400">DACON 해커톤 플랫폼의 모든 참가자를 확인해보세요.</p>
      </div>

      {/* 검색 & 필터 */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <input
            type="text"
            placeholder="이름, 닉네임, 기술 스택으로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm placeholder-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as "recent" | "active")}
          className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        >
          <option value="recent">최근 가입순</option>
          <option value="active">활동순</option>
        </select>
      </div>

      {/* 사용자 목록 */}
      {sorted.length === 0 ? (
        <EmptyState
          emoji="🔍"
          title="검색 결과가 없습니다"
          description="다른 검색어를 시도해보세요."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((profile) => {
            const activityScore = profile.stats.hackathonsJoined + profile.stats.submissions;
            return (
              <Link
                key={profile.id}
                href={`/users/${profile.id}`}
                className="group rounded-xl border border-gray-200 bg-white p-5 transition-all hover:border-blue-300 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-blue-700"
              >
                {/* 아바타 & 헤더 */}
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-lg font-bold text-white">
                    {profile.name.charAt(0).toUpperCase()}
                  </div>
                  {profile.role === "admin" && (
                    <Badge variant="info" size="sm">
                      Admin
                    </Badge>
                  )}
                </div>

                {/* 이름 & 닉네임 */}
                <h3 className="mb-1 text-sm font-semibold text-gray-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                  {profile.nickname || profile.name}
                </h3>
                <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">{profile.name}</p>

                {/* 스킬 태그 (상위 3개) */}
                {profile.skills.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-1">
                    {profile.skills.slice(0, 3).map((skill) => (
                      <span key={skill} className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-medium text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                        {skill}
                      </span>
                    ))}
                    {profile.skills.length > 3 && (
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-[10px] font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                        +{profile.skills.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* 통계 */}
                <div className="border-t border-gray-100 pt-3 dark:border-gray-800">
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{profile.stats.hackathonsJoined}</p>
                      <p className="text-gray-500 dark:text-gray-400">해커톤</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{profile.stats.submissions}</p>
                      <p className="text-gray-500 dark:text-gray-400">제출</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{profile.badges.length}</p>
                      <p className="text-gray-500 dark:text-gray-400">배지</p>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* 결과 수 */}
      <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
        {sorted.length > 0 && (
          <p>
            총 <span className="font-semibold text-gray-900 dark:text-white">{sorted.length}</span>명의 참가자가 있습니다.
          </p>
        )}
      </div>
    </div>
  );
}
