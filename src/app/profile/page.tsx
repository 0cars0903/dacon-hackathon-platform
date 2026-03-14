"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/features/AuthProvider";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { EmptyState } from "@/components/common/EmptyState";
import { getHackathonBySlug } from "@/lib/data";
import { formatDate, timeAgo } from "@/lib/utils";
import type { UserProfile, Team } from "@/types";

export default function ProfilePage() {
  const { user, getProfile, updateProfile } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [myTeams, setMyTeams] = useState<Team[]>([]);
  const [editing, setEditing] = useState(false);
  const [editBio, setEditBio] = useState("");
  const [editSkills, setEditSkills] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "activity" | "badges">("overview");

  useEffect(() => {
    if (user) {
      const p = getProfile();
      setProfile(p);
      if (p) {
        setEditBio(p.bio || "");
        setEditSkills(p.skills.join(", "));
      }
      // 내 팀 로드
      const stored = localStorage.getItem("dacon_teams");
      if (stored) {
        const teams = JSON.parse(stored);
        const mine = teams.filter((t: { members?: { userId: string }[]; creatorId?: string }) =>
          t.members?.some((m: { userId: string }) => m.userId === user.id) || t.creatorId === user.id
        );
        setMyTeams(mine);
      }
    }
  }, [user, getProfile]);

  if (!user) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16">
        <EmptyState emoji="🔐" title="로그인이 필요합니다" description="프로필을 확인하려면 로그인해주세요." actionLabel="로그인" onAction={() => window.location.href = "/login"} />
      </div>
    );
  }

  if (!profile) {
    return <div className="mx-auto max-w-4xl px-4 py-16 text-center text-gray-400">프로필을 불러오는 중...</div>;
  }

  const handleSaveProfile = () => {
    updateProfile({
      bio: editBio,
      skills: editSkills.split(",").map((s) => s.trim()).filter(Boolean),
    });
    setProfile(getProfile());
    setEditing(false);
  };

  // 활동 히트맵 데이터 (최근 12주 시뮬레이션)
  const heatmapWeeks = 12;
  const heatmapData = Array.from({ length: heatmapWeeks * 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (heatmapWeeks * 7 - 1 - i));
    // MVP 계정은 일부 활동이 있는 것으로 시뮬레이션
    let level = 0;
    if (profile.id === "mvp-user-kuma") {
      const dayOfYear = Math.floor((date.getTime() - new Date(2026, 0, 1).getTime()) / 86400000);
      if (dayOfYear >= 60 && dayOfYear <= 73) level = Math.min(3, Math.floor(Math.random() * 4)); // 3월 초~중반
    }
    return { date: date.toISOString().split("T")[0], level };
  });

  const tabs = [
    { key: "overview" as const, label: "개요" },
    { key: "activity" as const, label: "활동 분석" },
    { key: "badges" as const, label: `배지 (${profile.badges.length})` },
  ];

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
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{profile.name}</h1>
              {profile.badges.length >= 3 && <Badge variant="warning" size="sm">Top Contributor</Badge>}
            </div>
            <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">{profile.email}</p>

            {editing ? (
              <div className="space-y-3">
                <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white" rows={2} placeholder="자기소개를 입력하세요" />
                <input type="text" value={editSkills} onChange={(e) => setEditSkills(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white" placeholder="기술 스택 (쉼표 구분)" />
                <div className="flex gap-2">
                  <Button onClick={handleSaveProfile} size="sm">저장</Button>
                  <Button variant="secondary" onClick={() => setEditing(false)} size="sm">취소</Button>
                </div>
              </div>
            ) : (
              <>
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
                <div className="flex items-center gap-4">
                  <button onClick={() => setEditing(true)} className="text-sm text-blue-600 hover:underline dark:text-blue-400">
                    프로필 수정
                  </button>
                  <span className="text-xs text-gray-400">가입일: {formatDate(profile.joinedAt)}</span>
                </div>
              </>
            )}
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

      {/* 탭 */}
      <div className="mb-6 flex border-b border-gray-200 dark:border-gray-800">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "border-b-2 border-blue-600 text-blue-600 dark:text-blue-400"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 탭 콘텐츠 */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* 참가 해커톤 */}
          <section>
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

          {/* 내 팀 */}
          <section>
            <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">내 팀</h3>
            {myTeams.length === 0 ? (
              <p className="text-sm text-gray-400">아직 참가한 팀이 없습니다.</p>
            ) : (
              <div className="space-y-2">
                {myTeams.map((team: Team) => (
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
      )}

      {activeTab === "activity" && (
        <div className="space-y-6">
          {/* 활동 히트맵 */}
          <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">활동 히트맵 (최근 12주)</h3>
            <div className="flex flex-wrap gap-[3px]">
              {heatmapData.map((d, i) => (
                <div
                  key={i}
                  className={`h-3 w-3 rounded-sm ${
                    d.level === 0 ? "bg-gray-100 dark:bg-gray-800" :
                    d.level === 1 ? "bg-green-200 dark:bg-green-900" :
                    d.level === 2 ? "bg-green-400 dark:bg-green-700" :
                    "bg-green-600 dark:bg-green-500"
                  }`}
                  title={`${d.date}: ${d.level > 0 ? d.level + "건의 활동" : "활동 없음"}`}
                />
              ))}
            </div>
            <div className="mt-2 flex items-center gap-2 text-[10px] text-gray-400">
              <span>적음</span>
              <div className="flex gap-[2px]">
                <div className="h-2.5 w-2.5 rounded-sm bg-gray-100 dark:bg-gray-800" />
                <div className="h-2.5 w-2.5 rounded-sm bg-green-200 dark:bg-green-900" />
                <div className="h-2.5 w-2.5 rounded-sm bg-green-400 dark:bg-green-700" />
                <div className="h-2.5 w-2.5 rounded-sm bg-green-600 dark:bg-green-500" />
              </div>
              <span>많음</span>
            </div>
          </section>

          {/* 통계 그래프 (텍스트 기반 바 차트) */}
          <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">참가 통계</h3>
            <div className="space-y-4">
              {[
                { label: "해커톤 참가", value: profile.stats.hackathonsJoined, max: 5, color: "bg-blue-500" },
                { label: "팀 생성", value: profile.stats.teamsCreated, max: 5, color: "bg-green-500" },
                { label: "제출물", value: profile.stats.submissions, max: 10, color: "bg-purple-500" },
                { label: "획득 배지", value: profile.badges.length, max: 10, color: "bg-orange-500" },
              ].map((item) => (
                <div key={item.label}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">{item.label}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{item.value}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                    <div className={`h-full rounded-full ${item.color} transition-all duration-700`} style={{ width: `${Math.min((item.value / item.max) * 100, 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 최근 활동 타임라인 */}
          <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">최근 활동</h3>
            <div className="space-y-3">
              {profile.badges.slice().reverse().slice(0, 5).map((badge, i) => (
                <div key={badge.id} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm dark:bg-blue-900/30">
                    {badge.emoji}
                  </div>
                  <div>
                    <p className="text-sm text-gray-900 dark:text-white">
                      <span className="font-medium">{badge.name}</span> 배지 획득
                    </p>
                    <p className="text-xs text-gray-400">{timeAgo(badge.earnedAt)}</p>
                  </div>
                </div>
              ))}
              {profile.joinedHackathons.map((slug) => {
                const h = getHackathonBySlug(slug);
                return (
                  <div key={`join-${slug}`} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-50 text-sm dark:bg-green-900/30">
                      🏆
                    </div>
                    <div>
                      <p className="text-sm text-gray-900 dark:text-white">
                        <span className="font-medium">{h?.title || slug}</span> 해커톤 참가
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {activeTab === "badges" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {profile.badges.map((badge) => (
            <div key={badge.id} className="rounded-xl border border-gray-200 bg-white p-4 text-center transition-all hover:shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <span className="mb-2 block text-3xl">{badge.emoji}</span>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{badge.name}</p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{badge.description}</p>
              <p className="mt-2 text-[10px] text-gray-400">{formatDate(badge.earnedAt)}</p>
            </div>
          ))}
          {/* 미획득 배지 */}
          {[
            { name: "연속 참가", emoji: "🔥", description: "3개 이상 해커톤 연속 참가" },
            { name: "스타 플레이어", emoji: "⭐", description: "리더보드 3위 이내 달성" },
            { name: "멘토", emoji: "🧑‍🏫", description: "5명 이상의 팀원과 협업" },
          ].filter((b) => !profile.badges.some((pb) => pb.name === b.name)).map((badge) => (
            <div key={badge.name} className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-center opacity-50 dark:border-gray-700 dark:bg-gray-900">
              <span className="mb-2 block text-3xl grayscale">{badge.emoji}</span>
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{badge.name}</p>
              <p className="mt-1 text-xs text-gray-400">{badge.description}</p>
              <p className="mt-2 text-[10px] text-gray-400">미획득</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
