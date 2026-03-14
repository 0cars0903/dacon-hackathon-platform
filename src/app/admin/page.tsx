"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/features/AuthProvider";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { EmptyState } from "@/components/common/EmptyState";
import type { UserProfile } from "@/types";

interface HackathonForm {
  slug: string;
  title: string;
  status: "upcoming" | "ongoing" | "ended";
  tags: string;
  submissionDeadlineAt: string;
  endAt: string;
  summary: string;
  maxTeamSize: number;
  allowSolo: boolean;
  metricName: string;
}

const defaultForm: HackathonForm = {
  slug: "",
  title: "",
  status: "upcoming",
  tags: "",
  submissionDeadlineAt: "",
  endAt: "",
  summary: "",
  maxTeamSize: 5,
  allowSolo: true,
  metricName: "Accuracy",
};

export default function AdminPage() {
  const { user, isAdmin, getAllUsers, getAllProfiles, deleteUser, updateUserRole } = useAuth();
  const [activeTab, setActiveTab] = useState<"hackathons" | "users" | "stats">("hackathons");
  const [form, setForm] = useState<HackathonForm>(defaultForm);
  const [createdHackathons, setCreatedHackathons] = useState<HackathonForm[]>([]);
  const [users, setUsers] = useState<Array<{ id: string; name: string; email: string; role: string }>>([]);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [toast, setToast] = useState("");
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    if (isAdmin) {
      setUsers(getAllUsers());
      setProfiles(getAllProfiles());
      // localStorage에서 생성된 해커톤 로드
      const stored = localStorage.getItem("dacon_admin_hackathons");
      if (stored) setCreatedHackathons(JSON.parse(stored));
    }
  }, [isAdmin, getAllUsers, getAllProfiles]);

  if (!user) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16">
        <EmptyState emoji="🔐" title="로그인이 필요합니다" description="관리자 페이지에 접근하려면 로그인해주세요." actionLabel="로그인" onAction={() => window.location.href = "/login"} />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16">
        <EmptyState emoji="🚫" title="접근 권한이 없습니다" description="관리자 권한이 필요합니다." />
      </div>
    );
  }

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const handleCreateHackathon = () => {
    if (!form.title.trim() || !form.slug.trim()) {
      showToast("제목과 슬러그는 필수입니다.");
      return;
    }
    if (createdHackathons.some((h) => h.slug === form.slug)) {
      showToast("이미 존재하는 슬러그입니다.");
      return;
    }

    const updated = [...createdHackathons, { ...form }];
    setCreatedHackathons(updated);
    localStorage.setItem("dacon_admin_hackathons", JSON.stringify(updated));

    // hackathons.json에는 추가할 수 없으므로 localStorage에 별도 저장
    const existingRaw = localStorage.getItem("dacon_hackathons_extra");
    const existing = existingRaw ? JSON.parse(existingRaw) : [];
    existing.push({
      slug: form.slug,
      title: form.title,
      status: form.status,
      tags: form.tags.split(",").map((t: string) => t.trim()).filter(Boolean),
      thumbnailUrl: "",
      period: {
        timezone: "Asia/Seoul",
        submissionDeadlineAt: form.submissionDeadlineAt ? new Date(form.submissionDeadlineAt).toISOString() : "",
        endAt: form.endAt ? new Date(form.endAt).toISOString() : "",
      },
      links: {
        detail: `/hackathons/${form.slug}`,
        rules: "",
        faq: "",
      },
    });
    localStorage.setItem("dacon_hackathons_extra", JSON.stringify(existing));

    setForm(defaultForm);
    showToast("해커톤이 생성되었습니다!");
  };

  const handleDeleteUser = (userId: string) => {
    const success = deleteUser(userId);
    if (success) {
      setUsers(getAllUsers());
      setProfiles(getAllProfiles());
      showToast("사용자가 삭제되었습니다.");
    }
    setConfirmDelete(null);
  };

  const handleRoleChange = (userId: string, newRole: "user" | "admin") => {
    const success = updateUserRole(userId, newRole);
    if (success) {
      setUsers(getAllUsers());
      showToast("권한이 변경되었습니다.");
    }
    setEditingUser(null);
  };

  const tabs = [
    { key: "hackathons" as const, label: "해커톤 관리" },
    { key: "users" as const, label: "사용자 관리" },
    { key: "stats" as const, label: "플랫폼 통계" },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* 토스트 */}
      {toast && (
        <div className="fixed right-4 top-20 z-50 animate-fade-in rounded-lg bg-gray-900 px-4 py-3 text-sm text-white shadow-lg dark:bg-gray-100 dark:text-gray-900">
          {toast}
        </div>
      )}

      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">관리자 대시보드</h1>
        <Badge variant="info" size="sm">Admin</Badge>
      </div>

      {/* 탭 */}
      <div className="mb-6 flex border-b border-gray-200 dark:border-gray-800">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "border-b-2 border-blue-600 text-blue-600 dark:text-blue-400"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 해커톤 관리 */}
      {activeTab === "hackathons" && (
        <div className="space-y-6">
          {/* 생성 폼 */}
          <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">새 해커톤 생성</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">제목 *</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white" placeholder="해커톤 제목" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">슬러그 (URL) *</label>
                <input type="text" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white" placeholder="my-hackathon-2026" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">상태</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as HackathonForm["status"] })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                  <option value="upcoming">예정</option>
                  <option value="ongoing">진행중</option>
                  <option value="ended">종료</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">태그 (쉼표 구분)</label>
                <input type="text" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white" placeholder="AI, Web, Data" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">제출 마감일</label>
                <input type="datetime-local" value={form.submissionDeadlineAt} onChange={(e) => setForm({ ...form, submissionDeadlineAt: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">종료일</label>
                <input type="datetime-local" value={form.endAt} onChange={(e) => setForm({ ...form, endAt: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-gray-500">설명</label>
                <textarea value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white" rows={3} placeholder="해커톤 설명" />
              </div>
              <div className="flex items-center gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">최대 팀 인원</label>
                  <input type="number" min={1} max={10} value={form.maxTeamSize} onChange={(e) => setForm({ ...form, maxTeamSize: Number(e.target.value) })} className="w-24 rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
                </div>
                <div className="pt-4">
                  <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <input type="checkbox" checked={form.allowSolo} onChange={(e) => setForm({ ...form, allowSolo: e.target.checked })} className="rounded" />
                    개인 참가 허용
                  </label>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">평가 지표명</label>
                <input type="text" value={form.metricName} onChange={(e) => setForm({ ...form, metricName: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white" placeholder="Accuracy" />
              </div>
            </div>
            <div className="mt-4">
              <Button onClick={handleCreateHackathon}>해커톤 생성</Button>
            </div>
          </section>

          {/* 생성된 해커톤 목록 */}
          <section>
            <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">생성된 해커톤 ({createdHackathons.length})</h3>
            {createdHackathons.length === 0 ? (
              <p className="text-sm text-gray-400">아직 생성된 해커톤이 없습니다.</p>
            ) : (
              <div className="space-y-2">
                {createdHackathons.map((h) => (
                  <div key={h.slug} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{h.title}</p>
                      <p className="text-xs text-gray-400">/{h.slug}</p>
                    </div>
                    <Badge variant={h.status === "ongoing" ? "success" : h.status === "upcoming" ? "info" : "muted"} size="sm">
                      {h.status === "ongoing" ? "진행중" : h.status === "upcoming" ? "예정" : "종료"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* 사용자 관리 */}
      {activeTab === "users" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">전체 사용자 ({users.length})</h3>
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
                  <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">이름</th>
                  <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">이메일</th>
                  <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">역할</th>
                  <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">통계</th>
                  <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-800 dark:bg-gray-950">
                {users.map((u) => {
                  const profile = profiles.find((p) => p.id === u.id);
                  return (
                    <tr key={u.id} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-900">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600 dark:bg-blue-900 dark:text-blue-400">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{profile?.nickname || u.name}</p>
                            {profile?.nickname && profile.nickname !== u.name && (
                              <p className="text-[10px] text-gray-400">({u.name})</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{u.email}</td>
                      <td className="px-4 py-3">
                        {editingUser === u.id ? (
                          <div className="flex items-center gap-1">
                            <select
                              defaultValue={u.role}
                              onChange={(e) => handleRoleChange(u.id, e.target.value as "user" | "admin")}
                              className="rounded border border-gray-200 px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                            >
                              <option value="user">User</option>
                              <option value="admin">Admin</option>
                            </select>
                            <button onClick={() => setEditingUser(null)} className="text-xs text-gray-400 hover:text-gray-600">취소</button>
                          </div>
                        ) : (
                          <Badge variant={u.role === "admin" ? "info" : "muted"} size="sm">{u.role}</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {profile && (
                          <div className="flex gap-3 text-[10px] text-gray-400">
                            <span>해커톤 {profile.stats.hackathonsJoined}</span>
                            <span>팀 {profile.stats.teamsCreated}</span>
                            <span>배지 {profile.badges.length}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {u.id !== user?.id ? (
                          <div className="flex items-center gap-2">
                            <button onClick={() => setEditingUser(u.id)} className="text-xs text-blue-600 hover:underline dark:text-blue-400">권한</button>
                            {confirmDelete === u.id ? (
                              <div className="flex items-center gap-1">
                                <button onClick={() => handleDeleteUser(u.id)} className="text-xs font-medium text-red-600 hover:underline">확인</button>
                                <button onClick={() => setConfirmDelete(null)} className="text-xs text-gray-400 hover:text-gray-600">취소</button>
                              </div>
                            ) : (
                              <button onClick={() => setConfirmDelete(u.id)} className="text-xs text-red-500 hover:underline">삭제</button>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">현재 계정</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 플랫폼 통계 */}
      {activeTab === "stats" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "총 사용자", value: users.length, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/30" },
              { label: "관리자", value: users.filter((u) => u.role === "admin").length, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-900/30" },
              { label: "생성 해커톤", value: createdHackathons.length, color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-900/30" },
              { label: "총 배지 발급", value: profiles.reduce((sum, p) => sum + p.badges.length, 0), color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-900/30" },
            ].map((stat) => (
              <div key={stat.label} className={`rounded-xl ${stat.bg} p-5 text-center`}>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* 사용자별 활동 요약 */}
          <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">사용자 활동 순위</h3>
            <div className="space-y-3">
              {profiles
                .sort((a, b) => (b.stats.hackathonsJoined + b.stats.submissions) - (a.stats.hackathonsJoined + a.stats.submissions))
                .slice(0, 10)
                .map((p, i) => (
                  <div key={p.id} className="flex items-center gap-3">
                    <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                      i === 0 ? "bg-yellow-100 text-yellow-700" :
                      i === 1 ? "bg-gray-200 text-gray-600" :
                      i === 2 ? "bg-orange-100 text-orange-600" :
                      "bg-gray-100 text-gray-400"
                    }`}>{i + 1}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{p.nickname || p.name}</p>
                    </div>
                    <div className="flex gap-3 text-xs text-gray-400">
                      <span>해커톤 {p.stats.hackathonsJoined}</span>
                      <span>제출 {p.stats.submissions}</span>
                      <span>점수 {p.stats.totalScore}</span>
                    </div>
                  </div>
                ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
