"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/features/AuthProvider";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { EmptyState } from "@/components/common/EmptyState";
import { getPlatformStats, getAllHackathonsUnfiltered, getAllLeaderboards, getActivityFeed, getTeams } from "@/lib/data";
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
  createdAt?: string;
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
  const { user, isAdmin, getAllUsers, getAllProfiles, deleteUser, updateUserRole, adminUpdateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<"hackathons" | "users" | "stats">("hackathons");
  const [form, setForm] = useState<HackathonForm>(defaultForm);
  const [createdHackathons, setCreatedHackathons] = useState<HackathonForm[]>([]);
  const [users, setUsers] = useState<Array<{ id: string; name: string; email: string; role: string }>>([]);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [toast, setToast] = useState("");
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [editProfileModal, setEditProfileModal] = useState<string | null>(null);
  const [editProfileForm, setEditProfileForm] = useState({ name: "", nickname: "", bio: "", skills: "" });
  const [editingHackathon, setEditingHackathon] = useState<string | null>(null);
  const [confirmDeleteHackathon, setConfirmDeleteHackathon] = useState<string | null>(null);

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

  const handleSaveHackathon = () => {
    if (!form.title.trim() || !form.slug.trim()) {
      showToast("제목과 슬러그는 필수입니다.");
      return;
    }

    const isEditing = editingHackathon !== null;

    if (!isEditing && createdHackathons.some((h) => h.slug === form.slug)) {
      showToast("이미 존재하는 슬러그입니다.");
      return;
    }

    let updated: HackathonForm[];
    if (isEditing) {
      updated = createdHackathons.map((h) =>
        h.slug === editingHackathon
          ? { ...form, createdAt: h.createdAt || new Date().toISOString() }
          : h
      );
    } else {
      updated = [...createdHackathons, { ...form, createdAt: new Date().toISOString() }];
    }

    setCreatedHackathons(updated);
    localStorage.setItem("dacon_admin_hackathons", JSON.stringify(updated));

    // Update dacon_hackathons_extra for consistency
    const existingRaw = localStorage.getItem("dacon_hackathons_extra");
    const existing = existingRaw ? JSON.parse(existingRaw) : [];
    const index = existing.findIndex((h: any) => h.slug === form.slug);
    const newEntry = {
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
    };

    if (index >= 0) {
      existing[index] = newEntry;
    } else {
      existing.push(newEntry);
    }
    localStorage.setItem("dacon_hackathons_extra", JSON.stringify(existing));

    setForm(defaultForm);
    setEditingHackathon(null);
    showToast(isEditing ? "해커톤이 수정되었습니다!" : "해커톤이 생성되었습니다!");
  };

  const handleEditHackathon = (slug: string) => {
    const hackathon = createdHackathons.find((h) => h.slug === slug);
    if (hackathon) {
      setForm(hackathon);
      setEditingHackathon(slug);
    }
  };

  const handleDeleteHackathon = (slug: string) => {
    const updated = createdHackathons.filter((h) => h.slug !== slug);
    setCreatedHackathons(updated);
    localStorage.setItem("dacon_admin_hackathons", JSON.stringify(updated));

    // Also remove from dacon_hackathons_extra
    const existingRaw = localStorage.getItem("dacon_hackathons_extra");
    if (existingRaw) {
      const existing = JSON.parse(existingRaw).filter((h: any) => h.slug !== slug);
      localStorage.setItem("dacon_hackathons_extra", JSON.stringify(existing));
    }

    setConfirmDeleteHackathon(null);
    showToast("해커톤이 삭제되었습니다.");
  };

  const handleCancelEdit = () => {
    setForm(defaultForm);
    setEditingHackathon(null);
  };

  const handleChangeHackathonStatus = (slug: string, newStatus: "upcoming" | "ongoing" | "ended") => {
    const updated = createdHackathons.map((h) =>
      h.slug === slug ? { ...h, status: newStatus } : h
    );
    setCreatedHackathons(updated);
    localStorage.setItem("dacon_admin_hackathons", JSON.stringify(updated));

    // Update dacon_hackathons_extra
    const existingRaw = localStorage.getItem("dacon_hackathons_extra");
    if (existingRaw) {
      const existing = JSON.parse(existingRaw).map((h: any) =>
        h.slug === slug ? { ...h, status: newStatus } : h
      );
      localStorage.setItem("dacon_hackathons_extra", JSON.stringify(existing));
    }

    showToast("상태가 변경되었습니다.");
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

  const openEditProfile = (userId: string) => {
    const profile = profiles.find((p) => p.id === userId);
    if (profile) {
      setEditProfileForm({
        name: profile.name,
        nickname: profile.nickname || profile.name,
        bio: profile.bio || "",
        skills: profile.skills.join(", "),
      });
      setEditProfileModal(userId);
    }
  };

  const handleSaveProfile = () => {
    if (!editProfileModal) return;
    const success = adminUpdateProfile(editProfileModal, {
      name: editProfileForm.name,
      nickname: editProfileForm.nickname,
      bio: editProfileForm.bio,
      skills: editProfileForm.skills.split(",").map((s) => s.trim()).filter(Boolean),
    });
    if (success) {
      setUsers(getAllUsers());
      setProfiles(getAllProfiles());
      showToast("프로필이 수정되었습니다.");
    }
    setEditProfileModal(null);
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
          {/* 생성/수정 폼 */}
          <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              {editingHackathon ? "해커톤 수정" : "새 해커톤 생성"}
            </h2>
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
            <div className="mt-4 flex gap-2">
              <Button onClick={handleSaveHackathon}>
                {editingHackathon ? "수정 완료" : "해커톤 생성"}
              </Button>
              {editingHackathon && (
                <Button variant="secondary" onClick={handleCancelEdit}>
                  취소
                </Button>
              )}
            </div>
          </section>

          {/* 생성된 해커톤 목록 */}
          <section>
            <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">생성된 해커톤 ({createdHackathons.length})</h3>
            {createdHackathons.length === 0 ? (
              <p className="text-sm text-gray-400">아직 생성된 해커톤이 없습니다.</p>
            ) : (
              <div className="space-y-2">
                {[...createdHackathons]
                  .sort((a, b) => {
                    const dateA = new Date(a.createdAt || 0).getTime();
                    const dateB = new Date(b.createdAt || 0).getTime();
                    return dateB - dateA;
                  })
                  .map((h) => (
                    <div key={h.slug} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{h.title}</p>
                          <Badge variant={h.status === "ongoing" ? "success" : h.status === "upcoming" ? "info" : "muted"} size="sm">
                            {h.status === "ongoing" ? "진행중" : h.status === "upcoming" ? "예정" : "종료"}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-400">/{h.slug}</p>
                        {h.submissionDeadlineAt && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            마감일: {new Date(h.submissionDeadlineAt).toLocaleDateString("ko-KR")}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={h.status}
                          onChange={(e) =>
                            handleChangeHackathonStatus(
                              h.slug,
                              e.target.value as "upcoming" | "ongoing" | "ended"
                            )
                          }
                          className="rounded border border-gray-200 px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                          title="직접 상태 변경"
                        >
                          <option value="upcoming">예정</option>
                          <option value="ongoing">진행중</option>
                          <option value="ended">종료</option>
                        </select>
                        <button
                          onClick={() => handleEditHackathon(h.slug)}
                          className="text-xs text-blue-600 hover:underline dark:text-blue-400 font-medium"
                        >
                          수정
                        </button>
                        {confirmDeleteHackathon === h.slug ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDeleteHackathon(h.slug)}
                              className="text-xs font-medium text-red-600 hover:underline dark:text-red-400"
                            >
                              확인
                            </button>
                            <button
                              onClick={() => setConfirmDeleteHackathon(null)}
                              className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                              취소
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteHackathon(h.slug)}
                            className="text-xs text-red-500 hover:underline dark:text-red-400"
                          >
                            삭제
                          </button>
                        )}
                      </div>
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
                            <button onClick={() => openEditProfile(u.id)} className="text-xs text-green-600 hover:underline dark:text-green-400">수정</button>
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
      {activeTab === "stats" && <AdminAnalytics users={users} profiles={profiles} createdHackathons={createdHackathons} />}

      {/* 프로필 수정 모달 */}
      {editProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-900">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">사용자 프로필 수정</h3>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">이름</label>
                <input type="text" value={editProfileForm.name} onChange={(e) => setEditProfileForm({ ...editProfileForm, name: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">닉네임</label>
                <input type="text" value={editProfileForm.nickname} onChange={(e) => setEditProfileForm({ ...editProfileForm, nickname: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">자기소개</label>
                <textarea value={editProfileForm.bio} onChange={(e) => setEditProfileForm({ ...editProfileForm, bio: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white" rows={2} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">기술 스택 (쉼표 구분)</label>
                <input type="text" value={editProfileForm.skills} onChange={(e) => setEditProfileForm({ ...editProfileForm, skills: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setEditProfileModal(null)}>취소</Button>
              <Button size="sm" onClick={handleSaveProfile}>저장</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================
   관리자 분석 대시보드 컴포넌트
   ============================ */

function AdminAnalytics({
  users,
  profiles,
  createdHackathons,
}: {
  users: Array<{ id: string; name: string; email: string; role: string }>;
  profiles: UserProfile[];
  createdHackathons: HackathonForm[];
}) {
  const platformStats = getPlatformStats();
  const allHackathons = getAllHackathonsUnfiltered();
  const allLeaderboards = getAllLeaderboards();
  const allTeams = getTeams();
  const recentActivity = getActivityFeed();

  // 해커톤별 제출 통계
  const hackathonSubmissionData = allHackathons.map((h) => {
    const lb = allLeaderboards.find((l) => l.hackathonSlug === h.slug);
    const teams = allTeams.filter((t) => t.hackathonSlug === h.slug);
    return {
      title: h.title.length > 15 ? h.title.slice(0, 15) + "…" : h.title,
      slug: h.slug,
      submissions: lb?.entries.length || 0,
      teams: teams.length,
      status: h.status,
    };
  }).sort((a, b) => b.submissions - a.submissions);

  const maxSubmissions = Math.max(...hackathonSubmissionData.map((d) => d.submissions), 1);

  // 해커톤 상태 분포
  const statusDistribution = {
    ongoing: allHackathons.filter((h) => h.status === "ongoing").length,
    upcoming: allHackathons.filter((h) => h.status === "upcoming").length,
    ended: allHackathons.filter((h) => h.status === "ended").length,
  };
  const totalHackathons = statusDistribution.ongoing + statusDistribution.upcoming + statusDistribution.ended;

  // 스킬 분포 (상위 10개)
  const skillCount: Record<string, number> = {};
  profiles.forEach((p) => p.skills.forEach((s) => { skillCount[s] = (skillCount[s] || 0) + 1; }));
  const topSkills = Object.entries(skillCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  const maxSkillCount = topSkills[0]?.[1] || 1;

  // 최근 활동 타입별 집계
  const activityByType: Record<string, number> = {};
  recentActivity.forEach((a) => { activityByType[a.type] = (activityByType[a.type] || 0) + 1; });
  const activityTypeLabels: Record<string, string> = {
    team_created: "팀 생성/참가",
    submission: "결과물 제출",
    ranking_update: "랭킹 변동",
    hackathon_created: "해커톤 생성",
    forum_post: "토론 게시",
    user_signup: "신규 가입",
  };

  return (
    <div className="space-y-6">
      {/* 핵심 지표 카드 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "총 사용자", value: users.length, sub: `관리자 ${users.filter((u) => u.role === "admin").length}명`, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20", icon: "👤" },
          { label: "전체 해커톤", value: platformStats.totalHackathons + createdHackathons.length, sub: `진행중 ${statusDistribution.ongoing}개`, color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-900/20", icon: "🏆" },
          { label: "등록 팀", value: platformStats.totalTeams, sub: `${platformStats.totalMembers}명 참여`, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-900/20", icon: "👥" },
          { label: "총 제출", value: platformStats.totalSubmissions, sub: `${allLeaderboards.length}개 리더보드`, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-900/20", icon: "📤" },
        ].map((stat) => (
          <div key={stat.label} className={`rounded-xl ${stat.bg} p-5`}>
            <div className="flex items-center justify-between">
              <span className="text-2xl">{stat.icon}</span>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
            <p className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">{stat.label}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 해커톤별 제출 차트 */}
        <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">해커톤별 제출 현황</h3>
          <div className="space-y-3">
            {hackathonSubmissionData.map((d) => (
              <div key={d.slug}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-400">{d.title}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant={d.status === "ongoing" ? "success" : d.status === "upcoming" ? "info" : "muted"} size="sm">
                      {d.status === "ongoing" ? "진행중" : d.status === "upcoming" ? "예정" : "종료"}
                    </Badge>
                    <span className="font-medium text-gray-900 dark:text-white">{d.submissions}</span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800">
                  <div
                    className="h-2 rounded-full bg-blue-500 transition-all duration-700"
                    style={{ width: `${(d.submissions / maxSubmissions) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 해커톤 상태 분포 (도넛형) */}
        <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">해커톤 상태 분포</h3>
          <div className="flex items-center justify-center gap-8">
            {/* CSS 도넛 차트 */}
            <div className="relative h-36 w-36">
              <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                <circle cx="18" cy="18" r="15.91549430918954" fill="transparent" stroke="#e5e7eb" strokeWidth="3" className="dark:stroke-gray-700" />
                {totalHackathons > 0 && (
                  <>
                    <circle cx="18" cy="18" r="15.91549430918954" fill="transparent" stroke="#22c55e" strokeWidth="3"
                      strokeDasharray={`${(statusDistribution.ongoing / totalHackathons) * 100} ${100 - (statusDistribution.ongoing / totalHackathons) * 100}`}
                      strokeDashoffset="0" />
                    <circle cx="18" cy="18" r="15.91549430918954" fill="transparent" stroke="#3b82f6" strokeWidth="3"
                      strokeDasharray={`${(statusDistribution.upcoming / totalHackathons) * 100} ${100 - (statusDistribution.upcoming / totalHackathons) * 100}`}
                      strokeDashoffset={`${-(statusDistribution.ongoing / totalHackathons) * 100}`} />
                    <circle cx="18" cy="18" r="15.91549430918954" fill="transparent" stroke="#9ca3af" strokeWidth="3"
                      strokeDasharray={`${(statusDistribution.ended / totalHackathons) * 100} ${100 - (statusDistribution.ended / totalHackathons) * 100}`}
                      strokeDashoffset={`${-((statusDistribution.ongoing + statusDistribution.upcoming) / totalHackathons) * 100}`} />
                  </>
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{totalHackathons}</span>
                <span className="text-[10px] text-gray-400">전체</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-green-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">진행중</span>
                <span className="ml-auto font-semibold text-gray-900 dark:text-white">{statusDistribution.ongoing}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-blue-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">예정</span>
                <span className="ml-auto font-semibold text-gray-900 dark:text-white">{statusDistribution.upcoming}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">종료</span>
                <span className="ml-auto font-semibold text-gray-900 dark:text-white">{statusDistribution.ended}</span>
              </div>
            </div>
          </div>
        </section>

        {/* 기술 스택 분포 */}
        <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">인기 기술 스택 TOP 10</h3>
          <div className="space-y-2">
            {topSkills.map(([skill, count], i) => (
              <div key={skill} className="flex items-center gap-3">
                <span className="w-5 text-right text-xs font-medium text-gray-400">{i + 1}</span>
                <span className="w-24 text-xs text-gray-700 dark:text-gray-300 truncate">{skill}</span>
                <div className="flex-1">
                  <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800">
                    <div
                      className="h-2 rounded-full bg-purple-500 transition-all duration-500"
                      style={{ width: `${(count / maxSkillCount) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="w-8 text-right text-xs font-medium text-gray-600 dark:text-gray-400">{count}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 활동 유형 분포 */}
        <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">최근 활동 유형 분포</h3>
          <div className="space-y-3">
            {Object.entries(activityByType)
              .sort((a, b) => b[1] - a[1])
              .map(([type, count]) => {
                const maxCount = Math.max(...Object.values(activityByType));
                return (
                  <div key={type} className="flex items-center gap-3">
                    <span className="w-28 text-xs text-gray-600 dark:text-gray-400">
                      {activityTypeLabels[type] || type}
                    </span>
                    <div className="flex-1">
                      <div className="h-4 rounded bg-gray-100 dark:bg-gray-800">
                        <div
                          className="flex h-4 items-center justify-end rounded bg-green-500 px-1 text-[10px] font-bold text-white transition-all duration-500"
                          style={{ width: `${Math.max((count / maxCount) * 100, 10)}%` }}
                        >
                          {count}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            {Object.keys(activityByType).length === 0 && (
              <p className="text-sm text-gray-400">기록된 활동이 없습니다.</p>
            )}
          </div>
        </section>
      </div>

      {/* 사용자 활동 순위 */}
      <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">사용자 활동 순위 TOP 10</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-3 py-2 text-xs font-medium text-gray-500">#</th>
                <th className="px-3 py-2 text-xs font-medium text-gray-500">사용자</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">해커톤</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">제출</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">팀</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">배지</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">총점</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {profiles
                .sort((a, b) => (b.stats.hackathonsJoined + b.stats.submissions * 2 + b.stats.totalScore) - (a.stats.hackathonsJoined + a.stats.submissions * 2 + a.stats.totalScore))
                .slice(0, 10)
                .map((p, i) => (
                  <tr key={p.id} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                        i === 0 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400" :
                        i === 1 ? "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300" :
                        i === 2 ? "bg-orange-100 text-orange-600 dark:bg-orange-900/50 dark:text-orange-400" :
                        "text-gray-400"
                      }`}>{i + 1}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <p className="font-medium text-gray-900 dark:text-white">{p.nickname || p.name}</p>
                      <p className="text-[10px] text-gray-400">{p.email}</p>
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium text-gray-700 dark:text-gray-300">{p.stats.hackathonsJoined}</td>
                    <td className="px-3 py-2.5 text-right font-medium text-gray-700 dark:text-gray-300">{p.stats.submissions}</td>
                    <td className="px-3 py-2.5 text-right font-medium text-gray-700 dark:text-gray-300">{p.stats.teamsCreated}</td>
                    <td className="px-3 py-2.5 text-right font-medium text-gray-700 dark:text-gray-300">{p.badges.length}</td>
                    <td className="px-3 py-2.5 text-right font-bold text-blue-600 dark:text-blue-400">{p.stats.totalScore}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 최근 활동 타임라인 */}
      <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">최근 활동 타임라인</h3>
        <div className="relative space-y-0 pl-4">
          {recentActivity.slice(0, 15).map((a, i) => (
            <div key={a.id} className="relative pb-4 last:pb-0">
              {i < Math.min(recentActivity.length, 15) - 1 && (
                <div className="absolute bottom-0 left-[-12px] top-3 w-0.5 bg-gray-200 dark:bg-gray-700" />
              )}
              <div className="absolute left-[-16px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-blue-500 bg-white dark:bg-gray-900" />
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs text-gray-600 dark:text-gray-400">{a.message}</p>
                <span className="shrink-0 text-[10px] text-gray-400">
                  {new Date(a.timestamp).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
