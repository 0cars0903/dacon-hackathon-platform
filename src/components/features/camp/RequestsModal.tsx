"use client";

import { useState, useEffect } from "react";
import { createDataClient } from "@/lib/supabase/client";
import { timeAgo } from "@/lib/utils";
import { Button } from "@/components/common/Button";
import type { Team, TeamJoinRequest } from "@/types";

export function RequestsModal({
  team,
  onClose,
  onTeamsRefresh,
}: {
  team: Team;
  onClose: () => void;
  onTeamsRefresh: () => Promise<void>;
}) {
  const [requests, setRequests] = useState<TeamJoinRequest[]>([]);

  const loadRequests = async () => {
    try {
      const db = createDataClient();
      const { data } = await db
        .from("team_join_requests")
        .select("*")
        .eq("team_code", team.teamCode);
      if (data) {
        setRequests(
          data.map((r: any) => ({
            id: r.id,
            teamCode: r.team_code,
            userId: r.user_id,
            userName: r.user_name,
            message: r.message ?? "",
            status: r.status,
            createdAt: r.created_at,
          }))
        );
      }
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    loadRequests();
  }, [team.teamCode]);

  const handleAccept = async (request: TeamJoinRequest) => {
    try {
      const db = createDataClient();
      // 요청 상태 업데이트
      await db
        .from("team_join_requests")
        .update({ status: "accepted" })
        .eq("id", request.id);

      // 팀 멤버 추가 (중복 체크)
      const { data: existing } = await db
        .from("team_members")
        .select("id")
        .eq("team_code", team.teamCode)
        .eq("user_id", request.userId)
        .maybeSingle();
      if (!existing) {
        await db.from("team_members").insert({
          team_code: team.teamCode,
          user_id: request.userId,
          name: request.userName,
          role: "팀원",
        });
      }

      await loadRequests();
      await onTeamsRefresh();
    } catch (err) {
      console.error("[RequestsModal] Failed to accept:", err);
    }
  };

  const handleReject = async (request: TeamJoinRequest) => {
    try {
      const db = createDataClient();
      await db
        .from("team_join_requests")
        .update({ status: "rejected" })
        .eq("id", request.id);
      await loadRequests();
    } catch (err) {
      console.error("[RequestsModal] Failed to reject:", err);
    }
  };

  const pendingRequests = requests.filter((r) => r.status === "pending");

  return (
    <div className="space-y-4">
      {pendingRequests.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            대기 중인 참가 요청이 없습니다.
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {pendingRequests.map((request) => (
            <div
              key={request.id}
              className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800"
            >
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {request.userName}
                  </p>
                  <p className="text-xs text-slate-400">
                    {timeAgo(request.createdAt)}
                  </p>
                </div>
              </div>
              {request.message && (
                <p className="mb-3 text-sm text-slate-600 dark:text-slate-400">
                  {request.message}
                </p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => handleAccept(request)}
                  className="flex-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
                >
                  승인
                </button>
                <button
                  onClick={() => handleReject(request)}
                  className="flex-1 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
                >
                  거절
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="flex justify-end pt-4">
        <Button variant="secondary" onClick={onClose}>
          닫기
        </Button>
      </div>
    </div>
  );
}
