"use client";

import { useState } from "react";
import { Button } from "@/components/common/Button";
import type { Team } from "@/types";

export function EditTeamForm({
  team,
  onDone,
  hackathons,
}: {
  team: Team;
  onDone: () => void;
  hackathons: { slug: string; title: string }[];
}) {
  const [formData, setFormData] = useState({
    name: team.name,
    hackathonSlug: team.hackathonSlug,
    intro: team.intro,
    lookingFor: team.lookingFor.join(", "),
    contactUrl: team.contact.url,
    isOpen: team.isOpen,
    joinPolicy: (team as Team).joinPolicy || ("auto" as "auto" | "approval"),
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
      teams[idx].lookingFor = formData.lookingFor
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
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
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          팀 이름
        </label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        />
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
              name="editJoinPolicy"
              value="auto"
              checked={formData.joinPolicy === "auto"}
              onChange={() => setFormData({ ...formData, joinPolicy: "auto" })}
              className="text-blue-600"
            />
            자동 허용
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <input
              type="radio"
              name="editJoinPolicy"
              value="approval"
              checked={formData.joinPolicy === "approval"}
              onChange={() =>
                setFormData({ ...formData, joinPolicy: "approval" })
              }
              className="text-blue-600"
            />
            확인 후 허용
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
          팀 내부 채팅은 자동 제공됩니다. 외부 연락처가 있으면 추가로
          입력하세요.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isOpen"
          checked={formData.isOpen}
          onChange={(e) => setFormData({ ...formData, isOpen: e.target.checked })}
          className="rounded border-gray-300"
        />
        <label
          htmlFor="isOpen"
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          모집 중
        </label>
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
        <Button type="submit">저장하기</Button>
      </div>
    </form>
  );
}
