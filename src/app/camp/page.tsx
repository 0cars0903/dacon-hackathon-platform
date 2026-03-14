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
import { TeamInviteModal } from "@/components/features/TeamInviteModal";
import { timeAgo } from "@/lib/utils";
import type { Team, TeamJoinRequest, TeamMember } from "@/types";

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
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [showJoinRequestModal, setShowJoinRequestModal] = useState<Team | null>(null);
  const [showRequestsModal, setShowRequestsModal] = useState<Team | null>(null);
  const [showMembersModal, setShowMembersModal] = useState<Team | null>(null);
  const [showInviteModal, setShowInviteModal] = useState<Team | null>(null);

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

  const isTeamCreator = (team: Team): boolean => {
    if (!user) return false;
    const stored = localStorage.getItem("dacon_teams");
    const teams = stored ? JSON.parse(stored) : [];
    const t = teams.find((tm: { teamCode: string }) => tm.teamCode === team.teamCode);
    return t?.creatorId === user.id;
  };

  const getPendingRequestCount = (team: Team): number => {
    const requestsRaw = localStorage.getItem("dacon_join_requests");
    const requests = requestsRaw ? JSON.parse(requestsRaw) : [];
    return requests.filter((r: TeamJoinRequest) => r.teamCode === team.teamCode && r.status === "pending").length;
  };

  const hasPendingRequest = (team: Team): boolean => {
    if (!user) return false;
    const requestsRaw = localStorage.getItem("dacon_join_requests");
    const requests = requestsRaw ? JSON.parse(requestsRaw) : [];
    return requests.some((r: TeamJoinRequest) => r.teamCode === team.teamCode && r.userId === user.id && r.status === "pending");
  };

  const handleDeleteTeam = (team: Team) => {
    if (!isTeamCreator(team)) return;
    if (!window.confirm(`"${team.name}" 팀을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) return;

    const stored = localStorage.getItem("dacon_teams");
    const teams = stored ? JSON.parse(stored) : [];
    const filtered = teams.filter((t: Team) => t.teamCode !== team.teamCode);
    localStorage.setItem("dacon_teams", JSON.stringify(filtered));
    setLocalTeams([...filtered]);

    // 모든 멤버의 프로필에서 팀 제거
    const profilesRaw = localStorage.getItem("dacon_profiles");
    const profiles = profilesRaw ? JSON.parse(profilesRaw) : [];
    profiles.forEach((p: any) => {
      p.teamMemberships = p.teamMemberships.filter((tc: string) => tc !== team.teamCode);
    });
    localStorage.setItem("dacon_profiles", JSON.stringify(profiles));

    setJoinSuccess(`"${team.name}" 팀이 삭제되었습니다.`);
    setTimeout(() => setJoinSuccess(null), 2000);
  };

  const handleLeaveTeam = (team: Team) => {
    if (!user || isTeamCreator(team)) return;
    if (!window.confirm(`"${team.name}" 팀에서 탈퇴하시겠습니까?`)) return;

    const stored = localStorage.getItem("dacon_teams");
    const teams = stored ? JSON.parse(stored) : [];
    const idx = teams.findIndex((t: Team) => t.teamCode === team.teamCode);
    if (idx >= 0) {
      const t = teams[idx];
      if (t.members) {
        t.members = t.members.filter((m: { userId: string }) => m.userId !== user.id);
        t.memberCount = Math.max(0, (t.memberCount || 1) - 1);
        teams[idx] = t;
        localStorage.setItem("dacon_teams", JSON.stringify(teams));
        setLocalTeams([...teams]);
      }
    }

    const profilesRaw = localStorage.getItem("dacon_profiles");
    const profiles = profilesRaw ? JSON.parse(profilesRaw) : [];
    const pIdx = profiles.findIndex((p: { id: string }) => p.id === user.id);
    if (pIdx >= 0) {
      profiles[pIdx].teamMemberships = profiles[pIdx].teamMemberships.filter((tc: string) => tc !== team.teamCode);
      localStorage.setItem("dacon_profiles", JSON.stringify(profiles));
    }

    setJoinSuccess(`"${team.name}" 팀에서 탈퇴했습니다.`);
    setTimeout(() => setJoinSuccess(null), 2000);
  };

  const handleTeamEdited = () => {
    setEditingTeam(null);
    const stored = localStorage.getItem("dacon_teams");
    if (stored) setLocalTeams(JSON.parse(stored));
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
            const isCreator = isTeamCreator(team);
            const pendingCount = getPendingRequestCount(team);
            const hasPending = hasPendingRequest(team);
            return (
              <div key={team.teamCode} className="animate-fade-in-up rounded-xl border border-gray-200 bg-white p-5 transition-all hover:shadow-sm dark:border-gray-800 dark:bg-gray-900" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{team.name}</h3>
                    <Badge variant={team.isOpen ? "success" : "muted"} size="sm">{team.isOpen ? "모집중" : "모집마감"}</Badge>
                    {isMember && <Badge variant="info" size="sm">내 팀</Badge>}
                    {isCreator && <Badge variant="warning" size="sm">팀장</Badge>}
                  </div>
                  <span className="text-xs text-gray-400">{timeAgo(team.createdAt)}</span>
                </div>
                <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">{team.intro}</p>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400">👤 {team.memberCount}명</span>
                      {team.lookingFor.length > 0 && (
                        <div className="flex flex-wrap gap-1">{team.lookingFor.map((role) => <Tag key={role} label={role} size="sm" />)}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {isCreator && (
                      <>
                        <button onClick={() => setShowInviteModal(team)} className="rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-teal-700">초대</button>
                        <button onClick={() => setShowRequestsModal(team)} className="relative rounded-lg bg-purple-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-purple-700">
                          참가 요청 {pendingCount > 0 && <span className="absolute -right-2 -top-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-600 rounded-full">{pendingCount}</span>}
                        </button>
                        <button onClick={() => setShowMembersModal(team)} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700">팀원 보기</button>
                        <button onClick={() => setEditingTeam(team)} className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700">수정</button>
                        <button onClick={() => handleDeleteTeam(team)} className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-700">삭제</button>
                      </>
                    )}
                    {isMember && !isCreator && (
                      <>
                        <button onClick={() => setShowMembersModal(team)} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700">팀원 보기</button>
                        <Link href={`/hackathons/${team.hackathonSlug}/teams`} className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-green-700">팀 채팅</Link>
                        <button onClick={() => handleLeaveTeam(team)} className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20">팀 탈퇴</button>
                      </>
                    )}
                    {!isMember && team.isOpen && (
                      <>
                        {hasPending ? (
                          <button disabled className="rounded-lg bg-gray-400 px-3 py-1.5 text-sm font-medium text-white cursor-not-allowed">신청 중</button>
                        ) : (
                          <button onClick={() => setShowJoinRequestModal(team)} className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-green-700">참가 신청</button>
                        )}
                        <button onClick={() => setContactTeam({ name: team.name, url: team.contact.url })} className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700">연락하기</button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="새 팀 만들기">
        <CreateTeamForm onDone={handleTeamCreated} hackathons={hackathons} />
      </Modal>

      <Modal isOpen={!!editingTeam} onClose={() => setEditingTeam(null)} title="팀 수정">
        {editingTeam && <EditTeamForm team={editingTeam} onDone={handleTeamEdited} hackathons={hackathons} />}
      </Modal>

      <Modal isOpen={!!showJoinRequestModal} onClose={() => setShowJoinRequestModal(null)} title="참가 신청">
        {showJoinRequestModal && <JoinRequestForm team={showJoinRequestModal} onDone={() => setShowJoinRequestModal(null)} />}
      </Modal>

      <Modal isOpen={!!showRequestsModal} onClose={() => setShowRequestsModal(null)} title="참가 요청 관리">
        {showRequestsModal && <RequestsManagementModal team={showRequestsModal} onClose={() => setShowRequestsModal(null)} />}
      </Modal>

      <Modal isOpen={!!showMembersModal} onClose={() => setShowMembersModal(null)} title="팀원 목록">
        {showMembersModal && <MembersListModal team={showMembersModal} isCreator={isTeamCreator(showMembersModal)} onMemberRemoved={() => { const stored = localStorage.getItem("dacon_teams"); if (stored) setLocalTeams(JSON.parse(stored)); }} />}
      </Modal>

      {contactTeam && (
        <ContactModal isOpen={true} onClose={() => setContactTeam(null)} teamName={contactTeam.name} contactUrl={contactTeam.url} />
      )}

      {showInviteModal && (
        <TeamInviteModal
          isOpen={true}
          onClose={() => setShowInviteModal(null)}
          teamCode={showInviteModal.teamCode}
          teamName={showInviteModal.name}
          hackathonSlug={showInviteModal.hackathonSlug}
        />
      )}
    </div>
  );
}

function CreateTeamForm({ onDone, hackathons }: { onDone: () => void; hackathons: { slug: string; title: string }[] }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({ name: "", hackathonSlug: hackathons[0]?.slug || "", intro: "", lookingFor: "", contactUrl: "", joinPolicy: "auto" as "auto" | "approval" });
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const existing = JSON.parse(localStorage.getItem("dacon_teams") || "[]");
    const newTeam = {
      teamCode: `T-${Date.now()}`,
      hackathonSlug: formData.hackathonSlug,
      name: formData.name,
      isOpen: true,
      joinPolicy: formData.joinPolicy,
      memberCount: 1,
      lookingFor: formData.lookingFor.split(",").map((s) => s.trim()).filter(Boolean),
      intro: formData.intro,
      contact: { type: "link", url: formData.contactUrl || "" },
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

    // 활동 로그
    const { logActivity } = await import("@/lib/data");
    const h = hackathons.find((hk) => hk.slug === formData.hackathonSlug);
    logActivity({
      type: "team_created",
      message: `${newTeam.name} 팀이 ${h?.title || formData.hackathonSlug}에 등록했습니다.`,
      timestamp: new Date().toISOString(),
      hackathonSlug: formData.hackathonSlug,
    });

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
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">참가 허용 방식</label>
        <div className="flex gap-4 mt-1">
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <input type="radio" name="joinPolicy" value="auto" checked={formData.joinPolicy === "auto"} onChange={() => setFormData({ ...formData, joinPolicy: "auto" })} className="text-blue-600" />
            자동 허용
            <span className="text-xs text-gray-400">(누구나 바로 참가)</span>
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <input type="radio" name="joinPolicy" value="approval" checked={formData.joinPolicy === "approval"} onChange={() => setFormData({ ...formData, joinPolicy: "approval" })} className="text-blue-600" />
            확인 후 허용
            <span className="text-xs text-gray-400">(팀장 승인 필요)</span>
          </label>
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">연락처 링크 (선택)</label>
        <input type="url" value={formData.contactUrl} onChange={(e) => setFormData({ ...formData, contactUrl: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white" placeholder="https://..." />
        <p className="mt-1 text-xs text-gray-400">팀 내부 채팅은 팀 참가 후 자동으로 이용할 수 있습니다. 외부 연락처가 있으면 추가로 입력하세요.</p>
      </div>
      {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">{error}</div>}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onDone}>취소</Button>
        <Button type="submit">생성하기</Button>
      </div>
    </form>
  );
}

function EditTeamForm({ team, onDone, hackathons }: { team: Team; onDone: () => void; hackathons: { slug: string; title: string }[] }) {
  const [formData, setFormData] = useState({
    name: team.name,
    hackathonSlug: team.hackathonSlug,
    intro: team.intro,
    lookingFor: team.lookingFor.join(", "),
    contactUrl: team.contact.url,
    isOpen: team.isOpen,
    joinPolicy: (team as Team).joinPolicy || "auto" as "auto" | "approval",
  });
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const stored = localStorage.getItem("dacon_teams");
    const teams = stored ? JSON.parse(stored) : [];
    const idx = teams.findIndex((t: Team) => t.teamCode === team.teamCode);
    if (idx >= 0) {
      teams[idx].name = formData.name;
      teams[idx].intro = formData.intro;
      teams[idx].lookingFor = formData.lookingFor.split(",").map((s) => s.trim()).filter(Boolean);
      teams[idx].contact.url = formData.contactUrl;
      teams[idx].isOpen = formData.isOpen;
      teams[idx].joinPolicy = formData.joinPolicy;
      localStorage.setItem("dacon_teams", JSON.stringify(teams));
    }
    onDone();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">팀 이름</label>
        <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">소개</label>
        <textarea value={formData.intro} onChange={(e) => setFormData({ ...formData, intro: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white" rows={3} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">구하는 역할 (쉼표로 구분)</label>
        <input type="text" value={formData.lookingFor} onChange={(e) => setFormData({ ...formData, lookingFor: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">참가 허용 방식</label>
        <div className="flex gap-4 mt-1">
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <input type="radio" name="editJoinPolicy" value="auto" checked={formData.joinPolicy === "auto"} onChange={() => setFormData({ ...formData, joinPolicy: "auto" })} className="text-blue-600" />
            자동 허용
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <input type="radio" name="editJoinPolicy" value="approval" checked={formData.joinPolicy === "approval"} onChange={() => setFormData({ ...formData, joinPolicy: "approval" })} className="text-blue-600" />
            확인 후 허용
          </label>
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">연락처 링크 (선택)</label>
        <input type="url" value={formData.contactUrl} onChange={(e) => setFormData({ ...formData, contactUrl: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white" placeholder="https://..." />
        <p className="mt-1 text-xs text-gray-400">팀 내부 채팅은 자동 제공됩니다. 외부 연락처가 있으면 추가로 입력하세요.</p>
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="isOpen" checked={formData.isOpen} onChange={(e) => setFormData({ ...formData, isOpen: e.target.checked })} className="rounded border-gray-300" />
        <label htmlFor="isOpen" className="text-sm font-medium text-gray-700 dark:text-gray-300">모집 중</label>
      </div>
      {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">{error}</div>}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onDone}>취소</Button>
        <Button type="submit">저장하기</Button>
      </div>
    </form>
  );
}

function JoinRequestForm({ team, onDone }: { team: Team; onDone: () => void }) {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const requestsRaw = localStorage.getItem("dacon_join_requests");
    const requests = requestsRaw ? JSON.parse(requestsRaw) : [];
    const newRequest: TeamJoinRequest = {
      id: `req-${Date.now()}`,
      teamCode: team.teamCode,
      userId: user.id,
      userName: user.name,
      message: message.trim(),
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    requests.push(newRequest);
    localStorage.setItem("dacon_join_requests", JSON.stringify(requests));
    setSubmitted(true);
    setTimeout(() => onDone(), 1500);
  };

  if (submitted) {
    return (
      <div className="space-y-4 text-center">
        <div className="text-5xl">✅</div>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">"{ team.name}" 팀에 참가 신청했습니다!</p>
        <p className="text-xs text-gray-500">팀장의 승인을 기다리고 있습니다.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">팀명</label>
        <input type="text" disabled value={team.name} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">신청 메시지 (선택)</label>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white" rows={4} placeholder="팀에 참가하고 싶은 이유나 본인 소개를 작성해주세요." />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onDone}>취소</Button>
        <Button type="submit">신청하기</Button>
      </div>
    </form>
  );
}

function RequestsManagementModal({ team, onClose }: { team: Team; onClose: () => void }) {
  const [requests, setRequests] = useState<TeamJoinRequest[]>([]);

  useEffect(() => {
    const requestsRaw = localStorage.getItem("dacon_join_requests");
    const allRequests = requestsRaw ? JSON.parse(requestsRaw) : [];
    setRequests(allRequests.filter((r: TeamJoinRequest) => r.teamCode === team.teamCode));
  }, [team.teamCode]);

  const handleAccept = (request: TeamJoinRequest) => {
    const requestsRaw = localStorage.getItem("dacon_join_requests");
    const allRequests = requestsRaw ? JSON.parse(requestsRaw) : [];
    const idx = allRequests.findIndex((r: TeamJoinRequest) => r.id === request.id);
    if (idx >= 0) {
      allRequests[idx].status = "accepted";
      localStorage.setItem("dacon_join_requests", JSON.stringify(allRequests));
    }

    // 팀에 멤버 추가
    const teamsRaw = localStorage.getItem("dacon_teams");
    const teams = teamsRaw ? JSON.parse(teamsRaw) : [];
    const teamIdx = teams.findIndex((t: Team) => t.teamCode === team.teamCode);
    if (teamIdx >= 0) {
      if (!teams[teamIdx].members) teams[teamIdx].members = [];
      if (!teams[teamIdx].members.some((m: { userId: string }) => m.userId === request.userId)) {
        teams[teamIdx].members.push({ userId: request.userId, name: request.userName, role: "팀원", joinedAt: new Date().toISOString() });
        teams[teamIdx].memberCount = (teams[teamIdx].memberCount || 1) + 1;
      }
      localStorage.setItem("dacon_teams", JSON.stringify(teams));
    }

    // 유저 프로필 업데이트
    const profilesRaw = localStorage.getItem("dacon_profiles");
    const profiles = profilesRaw ? JSON.parse(profilesRaw) : [];
    const pIdx = profiles.findIndex((p: { id: string }) => p.id === request.userId);
    if (pIdx >= 0) {
      if (!profiles[pIdx].teamMemberships.includes(team.teamCode)) {
        profiles[pIdx].teamMemberships.push(team.teamCode);
      }
      localStorage.setItem("dacon_profiles", JSON.stringify(profiles));
    }

    setRequests(allRequests.filter((r: TeamJoinRequest) => r.teamCode === team.teamCode));
  };

  const handleReject = (request: TeamJoinRequest) => {
    const requestsRaw = localStorage.getItem("dacon_join_requests");
    const allRequests = requestsRaw ? JSON.parse(requestsRaw) : [];
    const idx = allRequests.findIndex((r: TeamJoinRequest) => r.id === request.id);
    if (idx >= 0) {
      allRequests[idx].status = "rejected";
      localStorage.setItem("dacon_join_requests", JSON.stringify(allRequests));
    }
    setRequests(allRequests.filter((r: TeamJoinRequest) => r.teamCode === team.teamCode));
  };

  const pendingRequests = requests.filter((r) => r.status === "pending");

  return (
    <div className="space-y-4">
      {pendingRequests.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-gray-500 dark:text-gray-400">대기 중인 참가 요청이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {pendingRequests.map((request) => (
            <div key={request.id} className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{request.userName}</p>
                  <p className="text-xs text-gray-400">{timeAgo(request.createdAt)}</p>
                </div>
              </div>
              {request.message && <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">{request.message}</p>}
              <div className="flex gap-2">
                <button onClick={() => handleAccept(request)} className="flex-1 rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-green-700">승인</button>
                <button onClick={() => handleReject(request)} className="flex-1 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-700">거절</button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="flex justify-end pt-4">
        <Button variant="secondary" onClick={onClose}>닫기</Button>
      </div>
    </div>
  );
}

function MembersListModal({ team, isCreator, onMemberRemoved }: { team: Team; isCreator: boolean; onMemberRemoved: () => void }) {
  const stored = localStorage.getItem("dacon_teams");
  const teams = stored ? JSON.parse(stored) : [];
  const currentTeam = teams.find((t: Team) => t.teamCode === team.teamCode);
  const members: TeamMember[] = currentTeam?.members || [];

  const handleRemoveMember = (member: TeamMember) => {
    if (!isCreator || member.role === "팀장") return;
    if (!window.confirm(`${member.name} 팀원을 제거하시겠습니까?`)) return;

    const stored = localStorage.getItem("dacon_teams");
    const teams = stored ? JSON.parse(stored) : [];
    const idx = teams.findIndex((t: Team) => t.teamCode === team.teamCode);
    if (idx >= 0) {
      teams[idx].members = teams[idx].members.filter((m: TeamMember) => m.userId !== member.userId);
      teams[idx].memberCount = Math.max(0, (teams[idx].memberCount || 1) - 1);
      localStorage.setItem("dacon_teams", JSON.stringify(teams));
    }

    const profilesRaw = localStorage.getItem("dacon_profiles");
    const profiles = profilesRaw ? JSON.parse(profilesRaw) : [];
    const pIdx = profiles.findIndex((p: { id: string }) => p.id === member.userId);
    if (pIdx >= 0) {
      profiles[pIdx].teamMemberships = profiles[pIdx].teamMemberships.filter((tc: string) => tc !== team.teamCode);
      localStorage.setItem("dacon_profiles", JSON.stringify(profiles));
    }

    onMemberRemoved();
  };

  return (
    <div className="space-y-3 max-h-96 overflow-y-auto">
      {members.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-gray-500 dark:text-gray-400">팀원이 없습니다.</p>
        </div>
      ) : (
        members.map((member) => (
          <div key={member.userId} className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex-1">
              <p className="font-medium text-gray-900 dark:text-white">{member.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={member.role === "팀장" ? "warning" : "muted"} size="sm">{member.role}</Badge>
                <p className="text-xs text-gray-400">{timeAgo(member.joinedAt)}</p>
              </div>
            </div>
            {isCreator && member.role !== "팀장" && (
              <button onClick={() => handleRemoveMember(member)} className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-700">제거</button>
            )}
          </div>
        ))
      )}
    </div>
  );
}
