"use client";

import { useState } from "react";
import { createDataClient } from "@/lib/supabase/client";
import { timeAgo } from "@/lib/utils";
import { Badge } from "@/components/common/Badge";
import type { Team, TeamMember } from "@/types";

export function MembersModal({
  team,
  isCreator,
  onMemberRemoved,
}: {
  team: Team;
  isCreator: boolean;
  onMemberRemoved: () => Promise<void>;
}) {
  const [members, setMembers] = useState<TeamMember[]>(team.members || []);

  const handleRemoveMember = async (member: TeamMember) => {
    if (!isCreator || member.role === "팀장") return;
    if (!window.confirm(`${member.name} 팀원을 제거하시겠습니까?`)) return;

    try {
      const db = createDataClient();
      await db
        .from("team_members")
        .delete()
        .eq("team_code", team.teamCode)
        .eq("user_id", member.userId);
      // 로컬 상태 즉시 업데이트
      setMembers((prev) => prev.filter((m) => m.userId !== member.userId));
      await onMemberRemoved();
    } catch (err) {
      console.error("[MembersModal] Failed to remove member:", err);
    }
  };

  return (
    <div className="space-y-3 max-h-96 overflow-y-auto">
      {members.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            팀원이 없습니다.
          </p>
        </div>
      ) : (
        members.map((member) => (
          <div
            key={member.userId}
            className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800"
          >
            <div className="flex-1">
              <p className="font-medium text-slate-900 dark:text-white">
                {member.name}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant={member.role === "팀장" ? "warning" : "muted"}
                  size="sm"
                >
                  {member.role}
                </Badge>
                <p className="text-xs text-slate-400">
                  {timeAgo(member.joinedAt)}
                </p>
              </div>
            </div>
            {isCreator && member.role !== "팀장" && (
              <button
                onClick={() => handleRemoveMember(member)}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
              >
                제거
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
}
