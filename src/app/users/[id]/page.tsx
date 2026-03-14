"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/features/AuthProvider";
import { Badge } from "@/components/common/Badge";
import { EmptyState } from "@/components/common/EmptyState";
import { FollowButton, FollowStats } from "@/components/features/FollowButton";
import { getHackathonBySlug } from "@/lib/data";
import { formatDate, timeAgo } from "@/lib/utils";
import type { UserProfile, Team } from "@/types";

export default function PublicUserProfilePage({ params }: { params: { id: string } }) {
  const { user, getProfile, isLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userTeams, setUserTeams] = useState<Team[]>([]);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    // AuthProvider 초기화(ensureMVPData) 완료 후에만 프로필 조회
    if (isLoading) return;
    const p = getProfile(params.id);
    if (p) {
      setProfile(p);
      // 해당 유저의 팀 로드
      const stored = localStorage.getItem("dacon_teams");
      if (stored) {
        const teams = JSON.parse(stored);
        const userTeamList = teams.filter((t: { members?: { userId: string }[]; creatorId?: string }) =>
          t.members?.some((m: { userId: string }) => m.userId === params.id) || t.creatorId === params.id
        );
        setUserTeams(userTeamList);
      }
    } else {
      setNotFound(true);
    }
  }, [params.id, getProfile, isLoading]);

  if (notFound) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16">
        <EmptyState
          emoji="👤"
          title="사용자를 찾을 수 없습니다"
          description="요청한 프로필이 존재하지 않습니다."
          actionLabel="사용자 목록 보기"
          onAction={() => window.location.href = "/users"}
        />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400">로드 중...</p>
        </div>
      </div>
    );
  }

  const isOwnProfile = user?.id === profile.id;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* 프로필 헤더 */}
      <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          {/* 아바타 */}
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-3xl font-bold text-white">
            {profile.name.charAt(0).toUpperCase()}
          </div>

          <div className="flex-1">
            <div className="mb-1 flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{profile.nickname || profile.name}</h1>
              {profile.role === "admin" && <Badge variant="info" size="sm">Admin</Badge>}
              {profile.badges.length >= 3 && <Badge variant="warning" size="sm">Top Contributor</Badge>}
            </div>
            <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">{profile.email}</p>

            <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
              {profile.bio || "아직 자기소개가 없습니다."}
            </p>
            {profile.skills.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-1.5">
                {profile.skills.map((skill) => (
                  <span key={skill} className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                    {skill}
                  </span>
                ))}
              </div>
            )}
            <div className="mb-3 flex items-center gap-4">
              <FollowStats userId={profile.id} />
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span>가입일: {formatDate(profile.joinedAt)}</span>
              {isOwnProfile ? (
                <Link href="/profile" className="text-blue-600 hover:underline dark:text-blue-400">
                  이것은 나의 프로필입니다
                </Link>
              ) : (
                <div className="flex items-center gap-2">
                  <FollowButton targetUserId={profile.id} targetUserName={profile.name} size="sm" />
                  <Link
                    href={`/messages?partner=${profile.id}`}
                    className="rounded-lg border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    메시지
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* 통계 미니카드 */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
            {[
              { label: "참가 해커톤", value: profile.stats.hackathonsJoined, color: "text-blue-600 dark:text-blue-400" },
              { label: "생성 팀", value: profile.stats.teamsCreated, color: "text-green-600 dark:text-green-400" },
              { label: "제출물", value: profile.stats.submissions, color: "text-purple-600 dark:text-purple-400" },
              { label: "총 점수", value: profile.stats.totalScore, color: "text-orange-600 dark:text-orange-400" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-lg bg-gray-50 px-4 py-3 text-center dark:bg-gray-800">
                <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 배지 섹션 */}
      <section className="mb-8">
        <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">배지 ({profile.badges.length})</h3>
        {profile.badges.length === 0 ? (
          <p className="text-sm text-gray-400">아직 배지를 획득하지 않았습니다.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            {profile.badges.map((badge) => (
              <div key={badge.id} className="rounded-lg border border-gray-200 bg-white p-4 text-center dark:border-gray-800 dark:bg-gray-900">
                <span className="mb-2 block text-2xl">{badge.emoji}</span>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{badge.name}</p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{badge.description}</p>
                <p className="mt-2 text-[10px] text-gray-400">{formatDate(badge.earnedAt)}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 참가 해커톤 섹션 */}
      <section className="mb-8">
        <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">참가 해커톤</h3>
        {profile.joinedHackathons.length === 0 ? (
          <p className="text-sm text-gray-400">아직 참가한 해커톤이 없습니다.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {profile.joinedHackathons.map((slug) => {
              const h = getHackathonBySlug(slug);
              if (!h) return null;
              return (
                <Link key={slug} href={`/hackathons/${slug}`} className="group rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-blue-300 hover:shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:hover:border-blue-700">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">{h.title.length > 30 ? h.title.slice(0, 30) + "…" : h.title}</span>
                    <Badge variant={h.status === "ongoing" ? "success" : h.status === "upcoming" ? "info" : "muted"} size="sm">
                      {h.status === "ongoing" ? "진행중" : h.status === "upcoming" ? "예정" : "종료"}
                    </Badge>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* 팀 멤버십 섹션 */}
      <section className="mb-8">
        <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">팀 멤버십</h3>
        {userTeams.length === 0 ? (
          <p className="text-sm text-gray-400">아직 참가한 팀이 없습니다.</p>
        ) : (
          <div className="space-y-2">
            {userTeams.map((team: Team) => (
              <div key={team.teamCode} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{team.name}</span>
                  <span className="ml-2 text-xs text-gray-400">{team.memberCount}명</span>
                </div>
                <Badge variant={team.isOpen ? "success" : "muted"} size="sm">{team.isOpen ? "모집중" : "마감"}</Badge>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
