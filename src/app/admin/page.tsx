"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/features/AuthProvider";
import { Badge } from "@/components/common/Badge";
import { EmptyState } from "@/components/common/EmptyState";
import { HackathonTab } from "@/components/features/admin/HackathonTab";
import { UserTab } from "@/components/features/admin/UserTab";
import { Analytics } from "@/components/features/admin/Analytics";
import type { UserProfile } from "@/types";
import { createHackathon, updateHackathon as updateHackathonInDB, deleteHackathon as deleteHackathonInDB, changeHackathonStatus, getAllHackathonsUnfiltered } from "@/lib/supabase/data";

export interface HackathonForm {
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
  const [aiGenerating, setAiGenerating] = useState<"banner" | "overview" | null>(null);
  const [generatedBannerUrl, setGeneratedBannerUrl] = useState<string | null>(null);

  // 사용자 관리 정렬/필터
  const [userSortField, setUserSortField] = useState<"name" | "email" | "role" | "joinedAt">("joinedAt");
  const [userSortDir, setUserSortDir] = useState<"asc" | "desc">("desc");
  const [userRoleFilter, setUserRoleFilter] = useState<"all" | "admin" | "user">("all");
  const [userSearchQuery, setUserSearchQuery] = useState("");

  useEffect(() => {
    if (isAdmin) {
      const load = async () => {
        const allUsers = await getAllUsers();
        setUsers(allUsers);
        const allProfiles = await getAllProfiles();
        setProfiles(allProfiles);
        const allHackathons = await getAllHackathonsUnfiltered();
        const hackathonForms: HackathonForm[] = allHackathons.map((h: any) => ({
          slug: h.slug,
          title: h.title,
          status: h.status,
          tags: Array.isArray(h.tags) ? h.tags.join(", ") : h.tags || "",
          submissionDeadlineAt: h.submissionDeadlineAt || "",
          endAt: h.endAt || "",
          summary: h.summary || "",
          maxTeamSize: h.maxTeamSize || 5,
          allowSolo: h.allowSolo !== false,
          metricName: h.metricName || "Accuracy",
          createdAt: h.createdAt,
        }));
        setCreatedHackathons(hackathonForms);
      };
      load();
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

  const handleSaveHackathon = async () => {
    if (!form.title.trim() || !form.slug.trim()) {
      showToast("제목과 슬러그는 필수입니다.");
      return;
    }

    const isEditing = editingHackathon !== null;

    if (!isEditing && createdHackathons.some((h) => h.slug === form.slug)) {
      showToast("이미 존재하는 슬러그입니다.");
      return;
    }

    try {
      const baseData = {
        slug: form.slug,
        title: form.title,
        status: form.status,
        tags: form.tags.split(",").map((t: string) => t.trim()).filter(Boolean),
        submissionDeadlineAt: form.submissionDeadlineAt ? new Date(form.submissionDeadlineAt).toISOString() : undefined,
        endAt: form.endAt ? new Date(form.endAt).toISOString() : undefined,
      };

      if (isEditing) {
        await updateHackathonInDB(form.slug, baseData);
      } else {
        await createHackathon(baseData);
      }

      const updated = await getAllHackathonsUnfiltered();
      const hackathonForms: HackathonForm[] = updated.map((h: any) => ({
        slug: h.slug,
        title: h.title,
        status: h.status,
        tags: Array.isArray(h.tags) ? h.tags.join(", ") : h.tags || "",
        submissionDeadlineAt: h.submissionDeadlineAt || "",
        endAt: h.endAt || "",
        summary: h.summary || "",
        maxTeamSize: h.maxTeamSize || 5,
        allowSolo: h.allowSolo !== false,
        metricName: h.metricName || "Accuracy",
        createdAt: h.createdAt,
      }));
      setCreatedHackathons(hackathonForms);

      setForm(defaultForm);
      setEditingHackathon(null);
      showToast(isEditing ? "해커톤이 수정되었습니다!" : "해커톤이 생성되었습니다!");
    } catch (error) {
      console.error("Failed to save hackathon:", error);
      showToast("해커톤 저장에 실패했습니다.");
    }
  };

  const handleEditHackathon = (slug: string) => {
    const hackathon = createdHackathons.find((h) => h.slug === slug);
    if (hackathon) {
      setForm(hackathon);
      setEditingHackathon(slug);
    }
  };

  const handleDeleteHackathon = async (slug: string) => {
    try {
      await deleteHackathonInDB(slug);

      const updated = await getAllHackathonsUnfiltered();
      const hackathonForms: HackathonForm[] = updated.map((h: any) => ({
        slug: h.slug,
        title: h.title,
        status: h.status,
        tags: Array.isArray(h.tags) ? h.tags.join(", ") : h.tags || "",
        submissionDeadlineAt: h.submissionDeadlineAt || "",
        endAt: h.endAt || "",
        summary: h.summary || "",
        maxTeamSize: h.maxTeamSize || 5,
        allowSolo: h.allowSolo !== false,
        metricName: h.metricName || "Accuracy",
        createdAt: h.createdAt,
      }));
      setCreatedHackathons(hackathonForms);

      setConfirmDeleteHackathon(null);
      showToast("해커톤이 삭제되었습니다.");
    } catch (error) {
      console.error("Failed to delete hackathon:", error);
      showToast("해커톤 삭제에 실패했습니다.");
    }
  };

  const handleCancelEdit = () => {
    setForm(defaultForm);
    setEditingHackathon(null);
  };

  const handleChangeHackathonStatus = async (slug: string, newStatus: "upcoming" | "ongoing" | "ended") => {
    try {
      await changeHackathonStatus(slug, newStatus);

      const updated = await getAllHackathonsUnfiltered();
      const hackathonForms: HackathonForm[] = updated.map((h: any) => ({
        slug: h.slug,
        title: h.title,
        status: h.status,
        tags: Array.isArray(h.tags) ? h.tags.join(", ") : h.tags || "",
        submissionDeadlineAt: h.submissionDeadlineAt || "",
        endAt: h.endAt || "",
        summary: h.summary || "",
        maxTeamSize: h.maxTeamSize || 5,
        allowSolo: h.allowSolo !== false,
        metricName: h.metricName || "Accuracy",
        createdAt: h.createdAt,
      }));
      setCreatedHackathons(hackathonForms);

      showToast("상태가 변경되었습니다.");
    } catch (error) {
      console.error("Failed to change hackathon status:", error);
      showToast("상태 변경에 실패했습니다.");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const success = await deleteUser(userId);
    if (success) {
      const updatedUsers = await getAllUsers();
      setUsers(updatedUsers);
      const updatedProfiles = await getAllProfiles();
      setProfiles(updatedProfiles);
      showToast("사용자가 삭제되었습니다.");
    }
    setConfirmDelete(null);
  };

  const handleRoleChange = async (userId: string, newRole: "user" | "admin") => {
    const success = await updateUserRole(userId, newRole);
    if (success) {
      const updatedUsers = await getAllUsers();
      setUsers(updatedUsers);
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

  const handleSaveProfile = async () => {
    if (!editProfileModal) return;
    const success = await adminUpdateProfile(editProfileModal, {
      name: editProfileForm.name,
      nickname: editProfileForm.nickname,
      bio: editProfileForm.bio,
      skills: editProfileForm.skills.split(",").map((s) => s.trim()).filter(Boolean),
    });
    if (success) {
      const updatedUsers = await getAllUsers();
      setUsers(updatedUsers);
      const updatedProfiles = await getAllProfiles();
      setProfiles(updatedProfiles);
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
        <div className="fixed right-4 top-20 z-50 animate-fade-in rounded-lg bg-slate-900 px-4 py-3 text-sm text-white shadow-lg dark:bg-slate-100 dark:text-slate-900">
          {toast}
        </div>
      )}

      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">관리자 대시보드</h1>
        <Badge variant="info" size="sm">Admin</Badge>
      </div>

      {/* 탭 */}
      <div className="mb-6 flex border-b border-slate-200 dark:border-slate-800">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 해커톤 관리 */}
      {activeTab === "hackathons" && (
        <HackathonTab
          form={form}
          setForm={setForm}
          editingHackathon={editingHackathon}
          setEditingHackathon={setEditingHackathon}
          createdHackathons={createdHackathons}
          confirmDeleteHackathon={confirmDeleteHackathon}
          setConfirmDeleteHackathon={setConfirmDeleteHackathon}
          aiGenerating={aiGenerating}
          setAiGenerating={setAiGenerating}
          generatedBannerUrl={generatedBannerUrl}
          setGeneratedBannerUrl={setGeneratedBannerUrl}
          handleSaveHackathon={handleSaveHackathon}
          handleCancelEdit={handleCancelEdit}
          handleEditHackathon={handleEditHackathon}
          handleDeleteHackathon={handleDeleteHackathon}
          handleChangeHackathonStatus={handleChangeHackathonStatus}
          showToast={showToast}
        />
      )}

      {/* 사용자 관리 */}
      {activeTab === "users" && (
        <UserTab
          users={users}
          profiles={profiles}
          user={user}
          userSearchQuery={userSearchQuery}
          setUserSearchQuery={setUserSearchQuery}
          userRoleFilter={userRoleFilter}
          setUserRoleFilter={setUserRoleFilter}
          userSortField={userSortField}
          setUserSortField={setUserSortField}
          userSortDir={userSortDir}
          setUserSortDir={setUserSortDir}
          editingUser={editingUser}
          setEditingUser={setEditingUser}
          confirmDelete={confirmDelete}
          setConfirmDelete={setConfirmDelete}
          editProfileModal={editProfileModal}
          setEditProfileModal={setEditProfileModal}
          editProfileForm={editProfileForm}
          setEditProfileForm={setEditProfileForm}
          handleDeleteUser={handleDeleteUser}
          handleRoleChange={handleRoleChange}
          openEditProfile={openEditProfile}
          handleSaveProfile={handleSaveProfile}
        />
      )}

      {/* 플랫폼 통계 */}
      {activeTab === "stats" && (
        <Analytics
          users={users}
          profiles={profiles}
          createdHackathons={createdHackathons}
        />
      )}
    </div>
  );
}
