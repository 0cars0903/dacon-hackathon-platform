"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getTeamsByHackathon } from "@/lib/data";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { EmptyState } from "@/components/common/EmptyState";
import { ContactModal } from "@/components/features/ContactModal";
import { timeAgo } from "@/lib/utils";

export default function HackathonTeamsPage() {
  const params = useParams();
  const slug = params.slug as string;
  const teams = getTeamsByHackathon(slug);
  const [contactTeam, setContactTeam] = useState<{
    name: string;
    url: string;
  } | null>(null);

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
        <EmptyState
          emoji="👥"
          title="등록된 팀이 없습니다"
          description="첫 번째 팀을 만들어보세요!"
        />
      ) : (
        <div className="space-y-3">
          {teams.map((team, i) => (
            <div
              key={team.teamCode}
              className="animate-fade-in-up rounded-xl border border-gray-200 bg-white p-5 transition-all hover:border-blue-200 dark:border-gray-800 dark:bg-gray-900"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {team.name}
                  </span>
                  <Badge variant={team.isOpen ? "success" : "muted"} size="sm">
                    {team.isOpen ? "모집중" : "마감"}
                  </Badge>
                </div>
                <span className="text-xs text-gray-400">{team.memberCount}명 · {timeAgo(team.createdAt)}</span>
              </div>
              <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
                {team.intro}
              </p>
              <div className="flex items-center justify-between">
                {team.lookingFor.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {team.lookingFor.map((role) => (
                      <span
                        key={role}
                        className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                )}
                {team.isOpen && (
                  <button
                    onClick={() =>
                      setContactTeam({
                        name: team.name,
                        url: team.contact.url,
                      })
                    }
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                  >
                    연락하기
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {contactTeam && (
        <ContactModal
          isOpen={true}
          onClose={() => setContactTeam(null)}
          teamName={contactTeam.name}
          contactUrl={contactTeam.url}
        />
      )}
    </div>
  );
}
