"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { getTeams, getHackathons, getJoinRequests } from "@/lib/supabase/data";
import { createDataClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/features/AuthProvider";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { EmptyState } from "@/components/common/EmptyState";
import { Modal } from "@/components/common/Modal";
import { Tag } from "@/components/common/Tag";
import { ContactModal } from "@/components/features/ContactModal";
import { TeamInviteModal } from "@/components/features/TeamInviteModal";
import { CreateTeamForm } from "@/components/features/camp/CreateTeamForm";
import { EditTeamForm } from "@/components/features/camp/EditTeamForm";
import { JoinRequestForm } from "@/components/features/camp/JoinRequestForm";
import { RequestsModal } from "@/components/features/camp/RequestsModal";
import { MembersModal } from "@/components/features/camp/MembersModal";
import { timeAgo } from "@/lib/utils";
import type { Team, TeamJoinRequest, TeamMember, Hackathon } from "@/types";

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

  const [staticTeams, setStaticTeams] = useState<Team[]>([]);
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [teams, hacks] = await Promise.all([
          getTeams(),
          getHackathons(),
        ]);
        setStaticTeams(teams);
        setHackathons(hacks);
      } catch (err) {
        console.error("[CampPage] Failed to load data:", err);
      }
    };
    load();
  }, []);
  const [selectedHackathon, setSelectedHackathon] = useState(hackathonFilter);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [localTeams, setLocalTeams] = useState<Team[]>([]);
  const [contactTeam, setContactTeam] = useState<{ name: string; url: string; creatorId?: string; creatorName?: string; teamCode?: string } | null>(null);
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

  // Supabase에서 팀 데이터 다시 불러오기
  const refreshTeams = async () => {
    try {
      const teams = await getTeams();
      setStaticTeams(teams);
    } catch (err) {
      console.error("[CampPage] Failed to refresh teams:", err);
    }
  };

  const handleTeamCreated = () => {
    setShowCreateModal(false);
    refreshTeams();
  };

  const handleJoinTeam = async (team: Team) => {
    if (!user) return;
    try {
      const db = createDataClient();
      // 중복 체크
      const { data: existing } = await db
        .from("team_members")
        .select("id")
        .eq("team_code", team.teamCode)
        .eq("user_id", user.id)
        .maybeSingle();
      if (!existing) {
        await db.from("team_members").insert({
          team_code: team.teamCode,
          user_id: user.id,
          name: user.name,
          role: "팀원",
        });
      }
      await refreshTeams();
      setJoinSuccess(team.name);
      setTimeout(() => setJoinSuccess(null), 2000);
    } catch (err) {
      console.error("[CampPage] Failed to join team:", err);
    }
  };

  const isTeamMember = (team: Team): boolean => {
    if (!user) return false;
    // Use Supabase team data directly (members come from team_members join)
    if (team.creatorId === user.id) return true;
    if (team.members) return team.members.some((m) => m.userId === user.id);
    return false;
  };

  const isTeamCreator = (team: Team): boolean => {
    if (!user) return false;
    return team.creatorId === user.id;
  };

  // Pending request counts/status loaded from Supabase
  const [pendingRequests, setPendingRequests] = useState<TeamJoinRequest[]>([]);
  useEffect(() => {
    if (!user) return;
    // Load all pending join requests for teams user created or for user's own requests
    const loadRequests = async () => {
      try {
        const { data } = await createDataClient()
          .from("team_join_requests")
          .select("*")
          .eq("status", "pending");
        if (data) {
          setPendingRequests(data.map((r: any) => ({
            id: r.id, teamCode: r.team_code, userId: r.user_id,
            userName: r.user_name, message: r.message ?? "",
            status: r.status, createdAt: r.created_at,
          })));
        }
      } catch { /* ignore */ }
    };
    loadRequests();
  }, [user, staticTeams]);

  const getPendingRequestCount = (team: Team): number => {
    return pendingRequests.filter((r) => r.teamCode === team.teamCode).length;
  };

  const hasPendingRequest = (team: Team): boolean => {
    if (!user) return false;
    return pendingRequests.some((r) => r.teamCode === team.teamCode && r.userId === user.id);
  };

  const handleDeleteTeam = async (team: Team) => {
    if (!isTeamCreator(team)) return;
    if (!window.confirm(`"${team.name}" 팀을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) return;

    try {
      const db = createDataClient();
      // 멤버 먼저 삭제 (FK 제약)
      await db.from("team_members").delete().eq("team_code", team.teamCode);
      await db.from("team_join_requests").delete().eq("team_code", team.teamCode);
      await db.from("teams").delete().eq("team_code", team.teamCode);
      await refreshTeams();
      setJoinSuccess(`"${team.name}" 팀이 삭제되었습니다.`);
      setTimeout(() => setJoinSuccess(null), 2000);
    } catch (err) {
      console.error("[CampPage] Failed to delete team:", err);
    }
  };

  const handleLeaveTeam = async (team: Team) => {
    if (!user || isTeamCreator(team)) return;
    if (!window.confirm(`"${team.name}" 팀에서 탈퇴하시겠습니까?`)) return;

    try {
      const db = createDataClient();
      await db.from("team_members").delete().eq("team_code", team.teamCode).eq("user_id", user.id);
      await refreshTeams();
      setJoinSuccess(`"${team.name}" 팀에서 탈퇴했습니다.`);
      setTimeout(() => setJoinSuccess(null), 2000);
    } catch (err) {
      console.error("[CampPage] Failed to leave team:", err);
    }
  };

  const handleTeamEdited = () => {
    setEditingTeam(null);
    refreshTeams();
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
                        ) : team.joinPolicy === "auto" ? (
                          <button onClick={() => handleJoinTeam(team)} className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-green-700">바로 참가</button>
                        ) : (
                          <button onClick={() => setShowJoinRequestModal(team)} className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-green-700">참가 신청</button>
                        )}
                        <button onClick={() => {
                          // creatorName 을 팀 멤버에서 찾기
                          const leader = team.members?.find((m) => m.role === "팀장");
                          setContactTeam({
                            name: team.name,
                            url: team.contact.url,
                            creatorId: team.creatorId,
                            creatorName: leader?.name || "팀장",
                            teamCode: team.teamCode,
                          });
                        }} className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700">연락하기</button>
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
        {showRequestsModal && <RequestsModal team={showRequestsModal} onClose={() => setShowRequestsModal(null)} onTeamsRefresh={refreshTeams} />}
      </Modal>

      <Modal isOpen={!!showMembersModal} onClose={() => setShowMembersModal(null)} title="팀원 목록">
        {showMembersModal && <MembersModal team={showMembersModal} isCreator={isTeamCreator(showMembersModal)} onMemberRemoved={refreshTeams} />}
      </Modal>

      {contactTeam && (
        <ContactModal
          isOpen={true}
          onClose={() => setContactTeam(null)}
          teamName={contactTeam.name}
          contactUrl={contactTeam.url}
          creatorId={contactTeam.creatorId}
          creatorName={contactTeam.creatorName}
          teamCode={contactTeam.teamCode}
        />
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
