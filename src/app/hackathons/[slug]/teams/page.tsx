"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getTeamsByHackathon } from "@/lib/data";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { EmptyState } from "@/components/common/EmptyState";
import { ContactModal } from "@/components/features/ContactModal";
import { timeAgo } from "@/lib/utils";

interface TeamMember {
  userId: string;
  name: string;
  role: string;
  joinedAt: string;
}

export default function HackathonTeamsPage() {
  const params = useParams();
  const slug = params.slug as string;
  const teams = getTeamsByHackathon(slug);
  const [contactTeam, setContactTeam] = useState<{ name: string; url: string } | null>(null);
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);
  const [localTeamMembers, setLocalTeamMembers] = useState<Record<string, TeamMember[]>>({});

  // localStorage에서 팀 멤버 데이터 로드
  useEffect(() => {
    const stored = localStorage.getItem("dacon_teams");
    if (stored) {
      const allTeams = JSON.parse(stored);
      const memberMap: Record<string, TeamMember[]> = {};
      allTeams.forEach((t: { teamCode: string; members?: TeamMember[] }) => {
        if (t.members) memberMap[t.teamCode] = t.members;
      });
      setLocalTeamMembers(memberMap);
    }
  }, []);

  const toggleExpand = (teamCode: string) => {
    setExpandedTeam(expandedTeam === teamCode ? null : teamCode);
  };

  // 아바타 로드
  const getAvatar = (userId: string): string | null => {
    try { return localStorage.getItem(`dacon_avatar_${userId}`); } catch { return null; }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {teams.length}개 팀이 등록되어 있습니다.
        </p>
        <Link href={`/camp?hackathon=${slug}`}>
          <Button size="sm">팀 모집 보기</Button>
        </Link>
      </div>

      {teams.length === 0 ? (
        <EmptyState emoji="👥" title="등록된 팀이 없습니다" description="첫 번째 팀을 만들어보세요!" />
      ) : (
        <div className="space-y-3">
          {teams.map((team, i) => {
            const isExpanded = expandedTeam === team.teamCode;
            const members = localTeamMembers[team.teamCode] || [];

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
                    {team.lookingFor.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {team.lookingFor.map((role) => (
                          <span key={role} className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                            {role}
                          </span>
                        ))}
                      </div>
                    )}
                    {team.isOpen && (
                      <button
                        onClick={() => setContactTeam({ name: team.name, url: team.contact.url })}
                        className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                      >
                        연락하기
                      </button>
                    )}
                  </div>
                </div>

                {/* 멤버 상세 확장 패널 */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-4 dark:border-gray-800 dark:bg-gray-800/30">
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
    </div>
  );
}
