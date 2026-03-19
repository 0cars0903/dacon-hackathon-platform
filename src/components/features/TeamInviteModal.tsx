"use client";

import { useState, useEffect } from "react";
import { useAuth } from "./AuthProvider";
import {
  createTeamInvitation,
  getInvitationsByTeam,
  joinByInviteCode,
  addNotification,
  logActivity,
} from "@/lib/supabase/data";
import type { TeamInvitation, UserProfile } from "@/types";

interface TeamInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamCode: string;
  teamName: string;
  hackathonSlug: string;
}

export function TeamInviteModal({ isOpen, onClose, teamCode, teamName, hackathonSlug }: TeamInviteModalProps) {
  const { user, getAllProfiles } = useAuth();
  const [tab, setTab] = useState<"create" | "list" | "join">("create");
  const [searchQuery, setSearchQuery] = useState("");
  const [generatedInvite, setGeneratedInvite] = useState<TeamInvitation | null>(null);
  const [inviteCode, setInviteCode] = useState("");
  const [joinResult, setJoinResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [allProfiles, setAllProfiles] = useState<UserProfile[]>([]);

  useEffect(() => {
    const load = async () => {
      const profs = await getAllProfiles();
      setAllProfiles(profs);
    };
    load();
  }, [getAllProfiles]);

  if (!isOpen || !user) return null;

  const profiles = allProfiles.filter((p) => p.id !== user.id);
  const filteredProfiles = searchQuery
    ? profiles.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.nickname.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  const [teamInvites, setTeamInvites] = useState<TeamInvitation[]>([]);

  useEffect(() => {
    const load = async () => {
      const invs = await getInvitationsByTeam(teamCode);
      setTeamInvites(invs);
    };
    load();
  }, [teamCode]);

  const handleCreateOpenInvite = async () => {
    const inv = await createTeamInvitation(teamCode, teamName, hackathonSlug, user.id, user.name);
    if (inv) {
      setGeneratedInvite(inv);
      await logActivity({
        type: "team_created",
        message: `${user.name}님이 ${teamName} 팀의 초대 코드를 생성했습니다.`,
        timestamp: new Date().toISOString(),
        hackathonSlug,
      });
    }
  };

  const handleInviteUser = async (targetId: string, targetName: string) => {
    const inv = await createTeamInvitation(teamCode, teamName, hackathonSlug, user.id, user.name, targetId);
    if (inv) {
      await addNotification(targetId, {
        message: `${user.name}님이 ${teamName} 팀에 초대했습니다.`,
        type: "info",
        link: `/messages`,
      });
      setSearchQuery("");
    }
  };

  const handleJoinByCode = async () => {
    if (!inviteCode.trim()) return;
    const result = await joinByInviteCode(inviteCode.trim().toUpperCase(), user.id, user.name);
    if (result.success) {
      setJoinResult({ success: true, message: "팀에 성공적으로 참가했습니다!" });
      await logActivity({
        type: "team_created",
        message: `${user.name}님이 초대 코드로 팀에 참가했습니다.`,
        timestamp: new Date().toISOString(),
        hackathonSlug,
      });
    } else {
      setJoinResult({ success: false, message: result.error || "참가에 실패했습니다." });
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl bg-white shadow-2xl dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-700">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">팀 초대 관리</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 px-6 dark:border-slate-700">
          {[
            { key: "create" as const, label: "초대 생성" },
            { key: "list" as const, label: "초대 현황" },
            { key: "join" as const, label: "코드로 참가" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                tab === t.key
                  ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                  : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="max-h-96 overflow-y-auto p-6">
          {tab === "create" && (
            <div className="space-y-4">
              {/* 공개 초대 코드 생성 */}
              <div>
                <h3 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">공개 초대 코드</h3>
                <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
                  코드를 공유하면 누구나 참가할 수 있습니다. (48시간 유효)
                </p>
                {generatedInvite ? (
                  <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-2xl font-bold tracking-wider text-green-700 dark:text-green-400">
                        {generatedInvite.inviteCode}
                      </span>
                      <button
                        onClick={() => handleCopyCode(generatedInvite.inviteCode)}
                        className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
                      >
                        {copiedCode ? "복사됨!" : "복사"}
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-green-600 dark:text-green-400">
                      만료: {new Date(generatedInvite.expiresAt).toLocaleString("ko-KR")}
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={handleCreateOpenInvite}
                    className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
                  >
                    초대 코드 생성
                  </button>
                )}
              </div>

              {/* 사용자 검색 및 직접 초대 */}
              <div className="border-t border-slate-200 pt-4 dark:border-slate-700">
                <h3 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">사용자 직접 초대</h3>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="이름, 닉네임 또는 스킬로 검색..."
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                />
                {filteredProfiles.length > 0 && (
                  <div className="mt-2 max-h-40 space-y-1 overflow-y-auto">
                    {filteredProfiles.slice(0, 10).map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600 dark:bg-indigo-900 dark:text-indigo-400">
                            {p.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900 dark:text-white">{p.name}</p>
                            <p className="text-xs text-slate-500">{p.skills.slice(0, 3).join(", ")}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleInviteUser(p.id, p.name)}
                          className="rounded-lg bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400"
                        >
                          초대
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === "list" && (
            <div className="space-y-2">
              {teamInvites.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500">보낸 초대가 없습니다.</p>
              ) : (
                teamInvites.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3 dark:border-slate-700"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {inv.inviteeName || "공개 초대"}{" "}
                        <span className="font-mono text-xs text-slate-400">({inv.inviteCode})</span>
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(inv.createdAt).toLocaleString("ko-KR")}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        inv.status === "pending"
                          ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                          : inv.status === "accepted"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : inv.status === "rejected"
                              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                              : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
                      }`}
                    >
                      {inv.status === "pending"
                        ? "대기중"
                        : inv.status === "accepted"
                          ? "수락됨"
                          : inv.status === "rejected"
                            ? "거절됨"
                            : "만료됨"}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === "join" && (
            <div className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                팀 리더에게 받은 초대 코드를 입력하여 팀에 참가하세요.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => {
                    setInviteCode(e.target.value.toUpperCase());
                    setJoinResult(null);
                  }}
                  placeholder="초대 코드 입력 (예: ABC123)"
                  maxLength={6}
                  className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2.5 font-mono text-lg tracking-widest outline-none focus:border-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                />
                <button
                  onClick={handleJoinByCode}
                  disabled={inviteCode.length < 6}
                  className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  참가
                </button>
              </div>
              {joinResult && (
                <div
                  className={`rounded-lg p-3 text-sm ${
                    joinResult.success
                      ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                      : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                  }`}
                >
                  {joinResult.message}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
