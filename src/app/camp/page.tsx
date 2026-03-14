"use client";

import { useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getTeams, getHackathons } from "@/lib/data";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { EmptyState } from "@/components/common/EmptyState";
import { Modal } from "@/components/common/Modal";
import { Tag } from "@/components/common/Tag";
import { timeAgo } from "@/lib/utils";

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

  const allTeams = getTeams();
  const hackathons = getHackathons();
  const [selectedHackathon, setSelectedHackathon] = useState(hackathonFilter);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filtered = useMemo(() => {
    if (selectedHackathon === "all") return allTeams;
    return allTeams.filter((t) => t.hackathonSlug === selectedHackathon);
  }, [allTeams, selectedHackathon]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          팀 모집
        </h1>
        <Button onClick={() => setShowCreateModal(true)}>팀 만들기</Button>
      </div>

      {/* 해커톤 필터 */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedHackathon("all")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            selectedHackathon === "all"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400"
          }`}
        >
          전체
        </button>
        {hackathons.map((h) => (
          <button
            key={h.slug}
            onClick={() => setSelectedHackathon(h.slug)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              selectedHackathon === h.slug
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400"
            }`}
          >
            {h.title.length > 15 ? h.title.slice(0, 15) + "…" : h.title}
          </button>
        ))}
      </div>

      {/* 팀 목록 */}
      {filtered.length === 0 ? (
        <EmptyState
          emoji="👥"
          title="등록된 팀이 없습니다"
          description="첫 번째 팀을 만들어보세요!"
          actionLabel="팀 만들기"
          onAction={() => setShowCreateModal(true)}
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((team) => (
            <div
              key={team.teamCode}
              className="rounded-xl border border-gray-200 bg-white p-5 transition-all hover:shadow-sm dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {team.name}
                  </h3>
                  <Badge variant={team.isOpen ? "success" : "muted"} size="sm">
                    {team.isOpen ? "모집중" : "모집마감"}
                  </Badge>
                </div>
                <span className="text-xs text-gray-400">
                  {timeAgo(team.createdAt)}
                </span>
              </div>

              <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
                {team.intro}
              </p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">
                    👤 {team.memberCount}명
                  </span>
                  {team.lookingFor.length > 0 && (
                    <div className="flex gap-1">
                      {team.lookingFor.map((role) => (
                        <Tag key={role} label={role} size="sm" />
                      ))}
                    </div>
                  )}
                </div>
                {team.isOpen && (
                  <a
                    href={team.contact.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                  >
                    연락하기 →
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 팀 생성 모달 */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="새 팀 만들기"
      >
        <CreateTeamForm onClose={() => setShowCreateModal(false)} hackathons={hackathons} />
      </Modal>
    </div>
  );
}

function CreateTeamForm({
  onClose,
  hackathons,
}: {
  onClose: () => void;
  hackathons: { slug: string; title: string }[];
}) {
  const [formData, setFormData] = useState({
    name: "",
    hackathonSlug: hackathons[0]?.slug || "",
    intro: "",
    lookingFor: "",
    contactUrl: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // localStorage에 저장 (데모용)
    const existing = JSON.parse(localStorage.getItem("dacon_teams") || "[]");
    const newTeam = {
      teamCode: `T-${Date.now()}`,
      hackathonSlug: formData.hackathonSlug,
      name: formData.name,
      isOpen: true,
      memberCount: 1,
      lookingFor: formData.lookingFor
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      intro: formData.intro,
      contact: { type: "link", url: formData.contactUrl },
      createdAt: new Date().toISOString(),
    };
    existing.push(newTeam);
    localStorage.setItem("dacon_teams", JSON.stringify(existing));
    onClose();
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
          onChange={(e) =>
            setFormData({ ...formData, name: e.target.value })
          }
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
          onChange={(e) =>
            setFormData({ ...formData, intro: e.target.value })
          }
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
          연락처 URL
        </label>
        <input
          type="url"
          value={formData.contactUrl}
          onChange={(e) =>
            setFormData({ ...formData, contactUrl: e.target.value })
          }
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          placeholder="https://open.kakao.com/..."
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onClose}>
          취소
        </Button>
        <Button type="submit">생성하기</Button>
      </div>
    </form>
  );
}
