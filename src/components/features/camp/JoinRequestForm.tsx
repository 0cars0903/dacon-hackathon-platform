"use client";

import { useState } from "react";
import { useAuth } from "@/components/features/AuthProvider";
import { Button } from "@/components/common/Button";
import { createDataClient } from "@/lib/supabase/client";
import type { Team } from "@/types";

export function JoinRequestForm({
  team,
  onDone,
}: {
  team: Team;
  onDone: () => void;
}) {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || submitting) return;
    setSubmitting(true);

    try {
      const db = createDataClient();
      await db.from("team_join_requests").insert({
        team_code: team.teamCode,
        user_id: user.id,
        user_name: user.name,
        message: message.trim() || null,
        status: "pending",
      });
      setSubmitted(true);
      setTimeout(() => onDone(), 1500);
    } catch (err) {
      console.error("[JoinRequestForm] Failed to submit:", err);
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="space-y-4 text-center">
        <div className="text-5xl">✅</div>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          "{team.name}" 팀에 참가 신청했습니다!
        </p>
        <p className="text-xs text-gray-500">팀장의 승인을 기다리고 있습니다.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          팀명
        </label>
        <input
          type="text"
          disabled
          value={team.name}
          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          신청 메시지 (선택)
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          rows={4}
          placeholder="팀에 참가하고 싶은 이유나 본인 소개를 작성해주세요."
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onDone}>
          취소
        </Button>
        <Button type="submit">신청하기</Button>
      </div>
    </form>
  );
}
