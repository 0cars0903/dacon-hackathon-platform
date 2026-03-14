"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { getTeams, getHackathons } from "@/lib/data";
import { useAuth } from "@/components/features/AuthProvider";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { EmptyState } from "@/components/common/EmptyState";
import { Modal } from "@/components/common/Modal";
import { Tag } from "@/components/common/Tag";
import { ContactModal } from "@/components/features/ContactModal";
import { timeAgo } from "@/lib/utils";
import type { Team } from "@/types";

export default function CampPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-4xl px-4 py-8 text-center text-gray-400">로딩 중...</div>}>
      <CampContent />
    </Suspense>
  );
}

function CampContent() {
  const searchParams = useSearchParams();
  const hackathonFilter = searchParams.get("hackathon") || "all";
  const { user } = useAuth();

  const staticTeams = getTeams();
  const hackathons = getHackathons();
  const [selectedHackathon, setSelectedHackathon] = useState(hackathonFilter);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [localTeams, setLocalTeams] = useState<Team[]>([]);
  const [contactTeam, setContactTeam] = useState<{ name: string; url: string } | null>(null);
  const [joinSuccess, setJoinSuccess] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("dacon_teams");
    if (stored) setLocalTeams(JSON.parse(stored));
  }, []);

  const allTeams = useMemo(() => {
    const merged = [...staticTeams];
    for (const lt of localTeams) {
      if (!merged.some((t) => t.teamCode === lt.teamCode)) {
        merged.push(lt);
      }
    }
    return merged;
  }, [staticTeams, localTeams]);

  const filtered = useMemo(() => {
    if (selectedHackathon === "all") return allTeams;
    return allTeams.filter((t) => t.hackathonSlug === selectedHackathon);
  }, [allTeams, selectedHackathon]);

  const handleTeamCreated = () => {
    setShowCreateModal(false);
    const stored = localStorage.getItem("dacon_teams");
    if (stored) setLocalTeams(JSON.parse(stored));
  };

  const handleJoinTeam = (team: Team) => {
    if (!user) return;
    const stored = localStorage.getItem("dacon_teams");
    const teams = stored ? JSON.parse(stored) : [];
    const idx = teams.findIndex((t: Team) => t.teamCode === team.teamCode);
    if (idx >= 0) {
      const t = teams[idx];
      if (!t.members) t.members = [];
      if (!t.members.some((m: { userId: string }) => m.userId === user.id)) {
        t.members.push({ userId: user.id, name: user.name, role: "팀원", joinedAt: new Date().toISOString() });
        t.memberCount = (t.memberCount || 1) + 1;
        teams[idx] = t;
        localStorage.setItem("dacon_teams", JSON.stringify(teams));
        setLocalTeams([...teams]);
      }
    }
    const profilesRaw = localStorage.getItem("dacon_profiles");
    const profiles = profilesRaw ? JSON.parse(profilesRaw) : [];
    const pIdx = profiles.findIndex((p: { id: string }) => p.id === user.id);
    if (pIdx >= 0) {
      if (!profiles[pIdx].teamMemberships.includes(team.teamCode)) {
        profiles[pIdx].teamMemberships.push(team.teamCode);
      }
      localStorage.setItem("dacon_profiles", JSON.stringify(profiles));
    }
    setJoinSuccess(team.name);
    setTimeout(() => setJoinSuccess(null), 2000);
  };

  const isTeamMember = (team: Team): boolean => {
    if (!user) return false;
    const stored = localStorage.getItem("dacon_teams");
    const teams = stored ? JSON.parse(stored) : [];
    const t = teams.find((tm: { teamCode: string }) => tm.teamCode === team.teamCode);
    if (t?.members) return t.members.some((m: { userId: string }) => m.userId === user.id);
    if (t?.creatorId === user.id) return true;
    return false;
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">팀 모집</h1>
        {user ? (
          <Button onClick={() => setShowCreateModal(true)}>팀 만들기</Button>
        ) : (
          <Link href="/login"><Button>로그인하고 팀 만들기</Button></Link>
        )}
      </div>

      {joinSuccess && (
        <div className="animate-fade-in-up mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm font-medium text-green-700 dark:bg-green-900/20 dark:text-green-400">
          {joinSuccess} 팀에 참가했습니다!
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedHackathon("all")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            selectedHackathon === "all" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400"
          }`}
        >
          전체
        </button>
        {hackathons.map((h) => (
          <button
            key={h.slug}
            onClick={() => setSelectedHackathon(h.slug)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              selectedHackathon === h.slug ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400"
            }`}
          >
            {h.title.length > 15 ? h.title.slice(0, 15) + "…" : h.title}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState emoji="👥" title="등록된 팀이 없습니다" description="첫 번째 팀을 만들어보세요!" actionLabel="팀 만들기" onAction={() => user ? setShowCreateModal(true) : undefined} />
      ) : (
        <div className="space-y-4">
          {filtered.map((team, i) => {
            const isMember = isTeamMember(team);
            return (
              <div key={team.teamCode} className="animate-fade-in-up rounded-xl border border-gray-200 bg-white p-5 transition-all hover:shadow-sm dark:border-gray-800 dark:bg-gray-900" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{team.name}</h3>
                    <Badge variant={team.isOpen ? "success" : "muted"} size="sm">{team.isOpen ? "모집중" : "모집마감"}</Badge>
                    {isMember && <Badge variant="info" size="sm">내 팀</Badge>}
                  </div>
                  <span className="text-xs text-gray-400">{timeAgo(team.createdAt)}</span>
                </div>
                <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">{team.intro}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">👤 {team.memberCount}명</span>
                    {team.lookingFor.length > 0 && (
                      <div className="flex flex-wrap gap-1">{team.lookingFor.map((role) => <Tag key={role} label={role} size="sm" />)}</div>
                    )}
                  </div>
                  {team.isOpen && !isMember && (
                    <div className="flex gap-2">
                      {user ? (
                        <>
                          <button onClick={() => handleJoinTeam(team)} className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-green-700">참가하기</button>
                          <button onClick={() => setContactTeam({ name: team.name, url: team.contact.url })} className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700">연락하기</button>
                        </>
                      ) : (
                        <Link href="/login" className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">로그인하고 참가하기</Link>
                      )}
                    </div>
                  )}
                  {isMember && (
                    <button onClick={() => setContactTeam({ name: team.name, url: team.contact.url })} className="rounded-lg border border-blue-200 px-3 py-1.5 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/20">오픈채팅방 열기</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="새 팀 만들기">
        <CreateTeamForm onDone={handleTeamCreated} hackathons={hackathons} />
      </Modal>

      {contactTeam && (
        <ContactModal isOpen={true} onClose={() => setContactTeam(null)} teamName={contactTeam.name} contactUrl={contactTeam.url} />
      )}
    </div>
  );
}

function CreateTeamForm({ onDone, hackathons }: { onDone: () => void; hackathons: { slug: string; title: string }[] }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({ name: "", hackathonSlug: hackathons[0]?.slug || "", intro: "", lookingFor: "", contactUrl: "" });
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!formData.contactUrl.trim()) { setError("연락처 URL을 입력해주세요 (카카오톡 오픈채팅방 링크 권장)"); return; }

    const existing = JSON.parse(localStorage.getItem("dacon_teams") || "[]");
    const newTeam = {
      teamCode: `T-${Date.now()}`,
      hackathonSlug: formData.hackathonSlug,
      name: formData.name,
      isOpen: true,
      memberCount: 1,
      lookingFor: formData.lookingFor.split(",").map((s) => s.trim()).filter(Boolean),
      intro: formData.intro,
      contact: { type: "link", url: formData.contactUrl },
      createdAt: new Date().toISOString(),
      creatorId: user.id,
      members: [{ userId: user.id, name: user.name, role: "팀장", joinedAt: new Date().toISOString() }],
    };
    existing.push(newTeam);
    localStorage.setItem("dacon_teams", JSON.stringify(existing));

    // 프로필 통계 업데이트
    const profilesRaw = localStorage.getItem("dacon_profiles");
    const profiles = profilesRaw ? JSON.parse(profilesRaw) : [];
    const pIdx = profiles.findIndex((p: { id: string }) => p.id === user.id);
    if (pIdx >= 0) {
      profiles[pIdx].stats.teamsCreated += 1;
      profiles[pIdx].teamMemberships.push(newTeam.teamCode);
      if (profiles[pIdx].stats.teamsCreated === 1) {
        profiles[pIdx].badges.push({ id: `b-team-leader-${Date.now()}`, name: "팀 리더", emoji: "👑", description: "팀을 처음 생성했습니다", earnedAt: new Date().toISOString() });
      }
      localStorage.setItem("dacon_profiles", JSON.stringify(profiles));
    }
    onDone();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">팀 이름</label>
        <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white" placeholder="팀 이름을 입력하세요" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">해커톤</label>
        <select value={formData.hackathonSlug} onChange={(e) => setFormData({ ...formData, hackathonSlug: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white">
          {hackathons.map((h) => <option key={h.slug} value={h.slug}>{h.title}</option>)}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">소개</label>
        <textarea value={formData.intro} onChange={(e) => setFormData({ ...formData, intro: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white" rows={3} placeholder="팀을 소개해주세요" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">구하는 역할 (쉼표로 구분)</label>
        <input type="text" value={formData.lookingFor} onChange={(e) => setFormData({ ...formData, lookingFor: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white" placeholder="Frontend, Designer, ML Engineer" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">오픈카톡방 링크 <span className="text-red-500">*</span></label>
        <input type="url" required value={formData.contactUrl} onChange={(e) => setFormData({ ...formData, contactUrl: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white" placeholder="https://open.kakao.com/o/..." />
        <p className="mt-1 text-xs text-gray-400">카카오톡 오픈채팅방 링크를 입력하면 팀원이 바로 참여할 수 있습니다.</p>
      </div>
      {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">{error}</div>}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onDone}>취소</Button>
        <Button type="submit">생성하기</Button>
      </div>
    </form>
  );
}
