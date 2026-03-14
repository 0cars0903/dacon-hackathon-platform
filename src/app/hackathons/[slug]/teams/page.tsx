"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getTeamsByHackathon, requestJoinTeam, leaveTeam, updateTeamJoinPolicy, getJoinRequests, handleJoinRequest, sendTeamMessage, getTeamMessages, logActivity } from "@/lib/data";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { EmptyState } from "@/components/common/EmptyState";
import { ContactModal } from "@/components/features/ContactModal";
import { useAuth } from "@/components/features/AuthProvider";
import { timeAgo } from "@/lib/utils";
import type { Team, TeamChatMessage } from "@/types";

interface TeamMember {
  userId: string;
  name: string;
  role: string;
  joinedAt: string;
}

type ViewMode = "icon" | "list";

export default function HackathonTeamsPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { user } = useAuth();
  const teams = getTeamsByHackathon(slug);
  const [contactTeam, setContactTeam] = useState<{ name: string; url: string } | null>(null);
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);
  const [localTeamMembers, setLocalTeamMembers] = useState<Record<string, TeamMember[]>>({});
  const [localTeams, setLocalTeams] = useState<Team[]>([]);
  const [joinMsg, setJoinMsg] = useState<Record<string, string>>({});
  const [actionResult, setActionResult] = useState<Record<string, { type: "success" | "error"; msg: string }>>({});
  const [chatOpen, setChatOpen] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<TeamChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("icon");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // localStorage에서 팀 데이터 로드
  const loadTeams = () => {
    const stored = localStorage.getItem("dacon_teams");
    if (stored) {
      const allTeams = JSON.parse(stored);
      const memberMap: Record<string, TeamMember[]> = {};
      allTeams.forEach((t: Team & { members?: TeamMember[] }) => {
        if (t.members) memberMap[t.teamCode] = t.members;
      });
      setLocalTeamMembers(memberMap);
      setLocalTeams(allTeams.filter((t: Team) => t.hackathonSlug === slug));
    }
  };

  useEffect(() => { loadTeams(); }, [slug]);

  // 팀 채팅 자동 새로고침
  useEffect(() => {
    if (!chatOpen) return;
    const load = () => setChatMessages(getTeamMessages(chatOpen));
    load();
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, [chatOpen]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const toggleExpand = (teamCode: string) => {
    setExpandedTeam(expandedTeam === teamCode ? null : teamCode);
  };

  const getAvatar = (userId: string): string | null => {
    try { return localStorage.getItem(`dacon_avatar_${userId}`); } catch { return null; }
  };

  const handleJoin = (teamCode: string) => {
    if (!user) return;
    const result = requestJoinTeam(teamCode, user.id, user.name, joinMsg[teamCode] || "");
    if (result.status === "joined") {
      setActionResult({ ...actionResult, [teamCode]: { type: "success", msg: "팀에 참가했습니다!" } });
      logActivity({ type: "team_created", message: `${user.name}님이 팀에 참가했습니다.`, timestamp: new Date().toISOString(), hackathonSlug: slug });
    } else if (result.status === "pending") {
      setActionResult({ ...actionResult, [teamCode]: { type: "success", msg: "참가 요청을 보냈습니다. 팀장의 승인을 기다려주세요." } });
    } else {
      setActionResult({ ...actionResult, [teamCode]: { type: "error", msg: result.error || "오류" } });
    }
    loadTeams();
  };

  const handleLeave = (teamCode: string) => {
    if (!user) return;
    if (!confirm("정말 팀에서 탈퇴하시겠습니까?")) return;
    const result = leaveTeam(teamCode, user.id);
    if (result.success) {
      setActionResult({ ...actionResult, [teamCode]: { type: "success", msg: "팀에서 탈퇴했습니다." } });
    } else {
      setActionResult({ ...actionResult, [teamCode]: { type: "error", msg: result.error || "오류" } });
    }
    loadTeams();
  };

  const handlePolicyChange = (teamCode: string, policy: "auto" | "approval") => {
    updateTeamJoinPolicy(teamCode, policy);
    loadTeams();
  };

  const handleSendChat = (teamCode: string) => {
    if (!user || !chatInput.trim()) return;
    sendTeamMessage(teamCode, user.id, user.name, chatInput.trim());
    setChatInput("");
    setChatMessages(getTeamMessages(teamCode));
  };

  // 팀 목록 (localStorage 병합)
  const mergedTeams: Team[] = (() => {
    const staticCodes = new Set(teams.map((t) => t.teamCode));
    const dynamicOnly = localTeams.filter((t) => !staticCodes.has(t.teamCode));
    const merged = teams.map((t) => {
      const local = localTeams.find((lt) => lt.teamCode === t.teamCode);
      return local ? { ...t, ...local } : t;
    });
    return [...merged, ...dynamicOnly];
  })();

  const isMemberOf = (team: Team) => {
    if (!user) return false;
    const members = localTeamMembers[team.teamCode] || [];
    return members.some((m) => m.userId === user.id) || (team as Team & { creatorId?: string }).creatorId === user.id;
  };

  const isLeaderOf = (team: Team) => {
    if (!user) return false;
    return (team as Team & { creatorId?: string }).creatorId === user.id;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {mergedTeams.length}개 팀이 등록되어 있습니다.
        </p>
        <div className="flex items-center gap-2">
          {/* 보기 모드 전환 */}
          <div className="flex rounded-lg border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setViewMode("icon")}
              className={`px-2.5 py-1.5 text-xs ${viewMode === "icon" ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"}`}
              title="큰 아이콘"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-2.5 py-1.5 text-xs ${viewMode === "list" ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"}`}
              title="리스트"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
          </div>
          <Link href={`/camp?hackathon=${slug}`}>
            <Button size="sm">팀 모집 보기</Button>
          </Link>
        </div>
      </div>

      {mergedTeams.length === 0 ? (
        <EmptyState emoji="👥" title="등록된 팀이 없습니다" description="첫 번째 팀을 만들어보세요!" />
      ) : viewMode === "list" ? (
        /* 리스트 뷰 */
        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">팀명</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">인원</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">참가 방식</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">모집 분야</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">상태</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">액션</th>
              </tr>
            </thead>
            <tbody>
              {mergedTeams.map((team) => (
                <tr key={team.teamCode} className="border-b border-gray-100 bg-white hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3">
                    <button onClick={() => toggleExpand(team.teamCode)} className="font-medium text-gray-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400">
                      {team.name}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{team.memberCount}명</td>
                  <td className="px-4 py-3">
                    <Badge variant={(team as Team).joinPolicy === "approval" ? "warning" : "success"} size="sm">
                      {(team as Team).joinPolicy === "approval" ? "확인 후 허용" : "자동 허용"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {team.lookingFor.slice(0, 3).map((role) => (
                        <span key={role} className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">{role}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={team.isOpen ? "success" : "muted"} size="sm">{team.isOpen ? "모집중" : "마감"}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {isMemberOf(team) ? (
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setChatOpen(team.teamCode)} className="rounded bg-green-50 px-2 py-1 text-xs text-green-600 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400">채팅</button>
                        {!isLeaderOf(team) && (
                          <button onClick={() => handleLeave(team.teamCode)} className="rounded bg-red-50 px-2 py-1 text-xs text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400">탈퇴</button>
                        )}
                      </div>
                    ) : team.isOpen ? (
                      <button onClick={() => handleJoin(team.teamCode)} className="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700">참가하기</button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* 큰 아이콘 뷰 */
        <div className="space-y-3">
          {mergedTeams.map((team, i) => {
            const isExpanded = expandedTeam === team.teamCode;
            const members = localTeamMembers[team.teamCode] || [];
            const isMember = isMemberOf(team);
            const isLeader = isLeaderOf(team);
            const joinRequests = isLeader ? getJoinRequests(team.teamCode).filter((r) => r.status === "pending") : [];

            return (
              <div
                key={team.teamCode}
                className="animate-fade-in-up rounded-xl border border-gray-200 bg-white transition-all hover:border-blue-200 dark:border-gray-800 dark:bg-gray-900"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="p-5">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleExpand(team.teamCode)}
                        className="font-semibold text-gray-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400 transition-colors"
                      >
                        {team.name}
                      </button>
                      <Badge variant={team.isOpen ? "success" : "muted"} size="sm">
                        {team.isOpen ? "모집중" : "마감"}
                      </Badge>
                      <Badge variant={(team as Team).joinPolicy === "approval" ? "warning" : "info"} size="sm">
                        {(team as Team).joinPolicy === "approval" ? "확인 후 허용" : "자동 허용"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{team.memberCount}명 · {timeAgo(team.createdAt)}</span>
                      <button
                        onClick={() => toggleExpand(team.teamCode)}
                        className="rounded p-0.5 text-gray-400 transition-transform hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <svg className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">{team.intro}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      {team.lookingFor.map((role) => (
                        <span key={role} className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">{role}</span>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      {isMember ? (
                        <>
                          <button
                            onClick={() => setChatOpen(team.teamCode)}
                            className="rounded-lg bg-green-50 px-3 py-1.5 text-sm font-medium text-green-600 transition-colors hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400"
                          >
                            팀 채팅
                          </button>
                          {!isLeader && (
                            <button
                              onClick={() => handleLeave(team.teamCode)}
                              className="rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400"
                            >
                              탈퇴
                            </button>
                          )}
                        </>
                      ) : team.isOpen ? (
                        <button
                          onClick={() => handleJoin(team.teamCode)}
                          className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                        >
                          참가하기
                        </button>
                      ) : (
                        <button
                          onClick={() => setContactTeam({ name: team.name, url: team.contact.url })}
                          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400"
                        >
                          연락하기
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 액션 결과 메시지 */}
                  {actionResult[team.teamCode] && (
                    <p className={`mt-2 text-xs ${actionResult[team.teamCode].type === "success" ? "text-green-600" : "text-red-500"}`}>
                      {actionResult[team.teamCode].msg}
                    </p>
                  )}
                </div>

                {/* 확장 패널 */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-4 dark:border-gray-800 dark:bg-gray-800/30">
                    {/* 팀장 설정: joinPolicy 변경 */}
                    {isLeader && (
                      <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50/50 p-3 dark:border-blue-900 dark:bg-blue-900/20">
                        <h4 className="mb-2 text-xs font-semibold text-blue-700 dark:text-blue-400">팀장 설정</h4>
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-1.5 text-xs">
                            <input
                              type="radio"
                              name={`policy-${team.teamCode}`}
                              checked={(team as Team).joinPolicy === "auto" || !(team as Team).joinPolicy}
                              onChange={() => handlePolicyChange(team.teamCode, "auto")}
                              className="text-blue-600"
                            />
                            <span className="text-gray-700 dark:text-gray-300">자동 허용</span>
                          </label>
                          <label className="flex items-center gap-1.5 text-xs">
                            <input
                              type="radio"
                              name={`policy-${team.teamCode}`}
                              checked={(team as Team).joinPolicy === "approval"}
                              onChange={() => handlePolicyChange(team.teamCode, "approval")}
                              className="text-blue-600"
                            />
                            <span className="text-gray-700 dark:text-gray-300">확인 후 허용</span>
                          </label>
                        </div>

                        {/* 참가 요청 목록 */}
                        {joinRequests.length > 0 && (
                          <div className="mt-3 space-y-2">
                            <h5 className="text-xs font-medium text-gray-600 dark:text-gray-400">대기 중인 참가 요청 ({joinRequests.length})</h5>
                            {joinRequests.map((req) => (
                              <div key={req.id} className="flex items-center justify-between rounded bg-white p-2 dark:bg-gray-800">
                                <div>
                                  <span className="text-xs font-medium text-gray-900 dark:text-white">{req.userName}</span>
                                  {req.message && <p className="text-[10px] text-gray-400">{req.message}</p>}
                                </div>
                                <div className="flex gap-1">
                                  <button onClick={() => { handleJoinRequest(req.id, "accepted"); loadTeams(); }} className="rounded bg-green-500 px-2 py-0.5 text-[10px] text-white hover:bg-green-600">수락</button>
                                  <button onClick={() => { handleJoinRequest(req.id, "rejected"); loadTeams(); }} className="rounded bg-red-500 px-2 py-0.5 text-[10px] text-white hover:bg-red-600">거절</button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* 멤버 목록 */}
                    <h4 className="mb-3 text-xs font-semibold text-gray-500 dark:text-gray-400">
                      팀 멤버 ({members.length || team.memberCount}명)
                    </h4>
                    {members.length > 0 ? (
                      <div className="space-y-2">
                        {members.map((m) => {
                          const avatar = getAvatar(m.userId);
                          return (
                            <div key={m.userId} className="flex items-center justify-between rounded-lg bg-white p-3 dark:bg-gray-900">
                              <div className="flex items-center gap-3">
                                {avatar ? (
                                  <img src={avatar} alt={m.name} className="h-8 w-8 rounded-full object-cover" />
                                ) : (
                                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600 dark:bg-blue-900 dark:text-blue-400">
                                    {m.name.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <div>
                                  <Link href={`/users/${m.userId}`} className="text-sm font-medium text-gray-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400">
                                    {m.name}
                                  </Link>
                                  <p className="text-[10px] text-gray-400">{timeAgo(m.joinedAt)}</p>
                                </div>
                              </div>
                              <Badge variant={m.role === "팀장" ? "info" : "muted"} size="sm">{m.role}</Badge>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        {Array.from({ length: team.memberCount }).map((_, idx) => (
                          <div key={idx} className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                            {idx + 1}
                          </div>
                        ))}
                        <span className="text-xs text-gray-400">멤버 {team.memberCount}명</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {contactTeam && (
        <ContactModal isOpen={true} onClose={() => setContactTeam(null)} teamName={contactTeam.name} contactUrl={contactTeam.url} />
      )}

      {/* 팀 채팅 모달 */}
      {chatOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex h-[500px] w-full max-w-lg flex-col rounded-2xl bg-white shadow-xl dark:bg-gray-900">
            <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-800">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                팀 채팅 — {mergedTeams.find((t) => t.teamCode === chatOpen)?.name}
              </h3>
              <button onClick={() => setChatOpen(null)} className="rounded p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.length === 0 ? (
                <p className="text-center text-sm text-gray-400 mt-10">아직 메시지가 없습니다. 첫 메시지를 보내보세요!</p>
              ) : (
                chatMessages.map((msg) => {
                  const isMe = msg.senderId === user?.id;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${isMe ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white"}`}>
                        {!isMe && <p className="mb-0.5 text-[10px] font-medium opacity-70">{msg.senderName}</p>}
                        <p className="text-sm">{msg.content}</p>
                        <p className={`mt-0.5 text-[10px] ${isMe ? "text-blue-200" : "text-gray-400"}`}>{timeAgo(msg.createdAt)}</p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>
            <div className="border-t border-gray-200 p-4 dark:border-gray-800">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendChat(chatOpen); } }}
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  placeholder="메시지를 입력하세요..."
                />
                <button
                  onClick={() => handleSendChat(chatOpen)}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  전송
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
