"use client";

import { useState } from "react";
import { useAuth } from "@/components/features/AuthProvider";
import { createTeam } from "@/lib/supabase/data";
import { Button } from "@/components/common/Button";

export function CreateTeamForm({
  onDone,
  hackathons,
}: {
  onDone: () => void;
  hackathons: { slug: string; title: string }[];
}) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    hackathonSlug: hackathons[0]?.slug || "",
    intro: "",
    lookingFor: "",
    contactUrl: "",
    joinPolicy: "auto" as "auto" | "approval",
  });
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const teamCode = `T-${Date.now()}`;
    const success = await createTeam({
      teamCode,
      hackathonSlug: formData.hackathonSlug,
      name: formData.name,
      isOpen: true,
      joinPolicy: formData.joinPolicy,
      lookingFor: formData.lookingFor
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      intro: formData.intro,
      contactType: "link",
      contactUrl: formData.contactUrl || "",
      creatorId: user.id,
      creatorName: user.name,
    });

    if (!success) {
      setError("팀 생성에 실패했습니다. 다시 시도해주세요.");
      return;
    }

    // 활동 로그
    const { logActivity } = await import("@/lib/supabase/data");
    const h = hackathons.find((hk) => hk.slug === formData.hackathonSlug);
    logActivity({
      type: "team_created",
      message: `${formData.name} 팀이 ${h?.title || formData.hackathonSlug}에 등록했습니다.`,
      timestamp: new Date().toISOString(),
      hackathonSlug: formData.hackathonSlug,
    });

    onDone();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          팀 이름
        </label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          placeholder="팀 이름을 입력하세요"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          해커톤
        </label>
        <select
          value={formData.hackathonSlug}
          onChange={(e) =>
            setFormData({ ...formData, hackathonSlug: e.target.value })
          }
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        >
          {hackathons.map((h) => (
            <option key={h.slug} value={h.slug}>
              {h.title}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          소개
        </label>
        <textarea
          value={formData.intro}
          onChange={(e) => setFormData({ ...formData, intro: e.target.value })}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          rows={3}
          placeholder="팀을 소개해주세요"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          구하는 역할 (쉼표로 구분)
        </label>
        <input
          type="text"
          value={formData.lookingFor}
          onChange={(e) =>
            setFormData({ ...formData, lookingFor: e.target.value })
          }
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          placeholder="Frontend, Designer, ML Engineer"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          참가 허용 방식
        </label>
        <div className="flex gap-4 mt-1">
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <input
              type="radio"
              name="joinPolicy"
              value="auto"
              checked={formData.joinPolicy === "auto"}
              onChange={() => setFormData({ ...formData, joinPolicy: "auto" })}
              className="text-blue-600"
            />
            자동 허용
            <span className="text-xs text-gray-400">(누구나 바로 참가)</span>
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <input
              type="radio"
              name="joinPolicy"
              value="approval"
              checked={formData.joinPolicy === "approval"}
              onChange={() =>
                setFormData({ ...formData, joinPolicy: "approval" })
              }
              className="text-blue-600"
            />
            확인 후 허용
            <span className="text-xs text-gray-400">(팀장 승인 필요)</span>
          </label>
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          연락처 링크 (선택)
        </label>
        <input
          type="url"
          value={formData.contactUrl}
          onChange={(e) =>
            setFormData({ ...formData, contactUrl: e.target.value })
          }
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          placeholder="https://..."
        />
        <p className="mt-1 text-xs text-gray-400">
          팀 내부 채팅은 팀 참가 후 자동으로 이용할 수 있습니다. 외부 연락처가
          있으면 추가로 입력하세요.
        </p>
      </div>
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onDone}>
          취소
        </Button>
        <Button type="submit">생성하기</Button>
      </div>
    </form>
  );
}
