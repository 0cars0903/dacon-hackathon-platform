"use client";

import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import type { UserProfile } from "@/types";

interface EditProfileForm {
  name: string;
  nickname: string;
  bio: string;
  skills: string;
}

interface UserTabProps {
  users: Array<{ id: string; name: string; email: string; role: string }>;
  profiles: UserProfile[];
  user: { id: string } | null;
  userSearchQuery: string;
  setUserSearchQuery: (query: string) => void;
  userRoleFilter: "all" | "admin" | "user";
  setUserRoleFilter: (filter: "all" | "admin" | "user") => void;
  userSortField: "name" | "email" | "role" | "joinedAt";
  setUserSortField: (field: "name" | "email" | "role" | "joinedAt") => void;
  userSortDir: "asc" | "desc";
  setUserSortDir: (dir: "asc" | "desc" | ((prev: "asc" | "desc") => "asc" | "desc")) => void;
  editingUser: string | null;
  setEditingUser: (id: string | null) => void;
  confirmDelete: string | null;
  setConfirmDelete: (id: string | null) => void;
  editProfileModal: string | null;
  setEditProfileModal: (id: string | null) => void;
  editProfileForm: EditProfileForm;
  setEditProfileForm: (form: EditProfileForm) => void;
  handleDeleteUser: (id: string) => void;
  handleRoleChange: (id: string, role: "user" | "admin") => void;
  openEditProfile: (id: string) => void;
  handleSaveProfile: () => void;
}

export function UserTab({
  users,
  profiles,
  user,
  userSearchQuery,
  setUserSearchQuery,
  userRoleFilter,
  setUserRoleFilter,
  userSortField,
  setUserSortField,
  userSortDir,
  setUserSortDir,
  editingUser,
  setEditingUser,
  confirmDelete,
  setConfirmDelete,
  editProfileModal,
  setEditProfileModal,
  editProfileForm,
  setEditProfileForm,
  handleDeleteUser,
  handleRoleChange,
  openEditProfile,
  handleSaveProfile,
}: UserTabProps) {
  // 필터링
  let filteredUsers = users.filter((u) => {
    if (userRoleFilter !== "all" && u.role !== userRoleFilter) return false;
    if (userSearchQuery.trim()) {
      const q = userSearchQuery.toLowerCase();
      const profile = profiles.find((p) => p.id === u.id);
      const nickname = profile?.nickname || "";
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || nickname.toLowerCase().includes(q);
    }
    return true;
  });

  // 정렬
  filteredUsers = [...filteredUsers].sort((a, b) => {
    let cmp = 0;
    if (userSortField === "name") {
      cmp = a.name.localeCompare(b.name, "ko");
    } else if (userSortField === "email") {
      cmp = a.email.localeCompare(b.email);
    } else if (userSortField === "role") {
      cmp = a.role.localeCompare(b.role);
    } else if (userSortField === "joinedAt") {
      const pa = profiles.find((p) => p.id === a.id);
      const pb = profiles.find((p) => p.id === b.id);
      cmp = new Date(pa?.joinedAt || 0).getTime() - new Date(pb?.joinedAt || 0).getTime();
    }
    return userSortDir === "asc" ? cmp : -cmp;
  });

  const sortIcon = (field: typeof userSortField) =>
    userSortField === field ? (userSortDir === "asc" ? " ▲" : " ▼") : "";

  const handleSort = (field: typeof userSortField) => {
    if (userSortField === field) {
      setUserSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setUserSortField(field);
      setUserSortDir("asc");
    }
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            전체 사용자 ({filteredUsers.length}{filteredUsers.length !== users.length ? ` / ${users.length}` : ""})
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            {/* 검색 */}
            <input
              type="text"
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
              placeholder="이름, 이메일 검색..."
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs outline-none transition-colors focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            {/* 역할 필터 */}
            <select
              value={userRoleFilter}
              onChange={(e) => setUserRoleFilter(e.target.value as "all" | "admin" | "user")}
              className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="all">전체 역할</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
                <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400 cursor-pointer select-none hover:text-indigo-600 dark:hover:text-indigo-400" onClick={() => handleSort("name")}>이름{sortIcon("name")}</th>
                <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400 cursor-pointer select-none hover:text-indigo-600 dark:hover:text-indigo-400" onClick={() => handleSort("email")}>이메일{sortIcon("email")}</th>
                <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400 cursor-pointer select-none hover:text-indigo-600 dark:hover:text-indigo-400" onClick={() => handleSort("role")}>역할{sortIcon("role")}</th>
                <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">통계</th>
                <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400 cursor-pointer select-none hover:text-indigo-600 dark:hover:text-indigo-400" onClick={() => handleSort("joinedAt")}>관리{sortIcon("joinedAt")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-800 dark:bg-slate-950">
              {filteredUsers.map((u) => {
                const profile = profiles.find((p) => p.id === u.id);
                return (
                  <tr key={u.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-900">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600 dark:bg-indigo-900 dark:text-indigo-400">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">{profile?.nickname || u.name}</p>
                          {profile?.nickname && profile.nickname !== u.name && (
                            <p className="text-[10px] text-slate-400">({u.name})</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{u.email}</td>
                    <td className="px-4 py-3">
                      {editingUser === u.id ? (
                        <div className="flex items-center gap-1">
                          <select
                            defaultValue={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value as "user" | "admin")}
                            className="rounded border border-slate-200 px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                          <button onClick={() => setEditingUser(null)} className="text-xs text-slate-400 hover:text-slate-600">취소</button>
                        </div>
                      ) : (
                        <Badge variant={u.role === "admin" ? "info" : "muted"} size="sm">{u.role}</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {profile && (
                        <div className="flex gap-3 text-[10px] text-slate-400">
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
                          <button onClick={() => setEditingUser(u.id)} className="text-xs text-indigo-600 hover:underline dark:text-indigo-400">권한</button>
                          {confirmDelete === u.id ? (
                            <div className="flex items-center gap-1">
                              <button onClick={() => handleDeleteUser(u.id)} className="text-xs font-medium text-red-600 hover:underline">확인</button>
                              <button onClick={() => setConfirmDelete(null)} className="text-xs text-slate-400 hover:text-slate-600">취소</button>
                            </div>
                          ) : (
                            <button onClick={() => setConfirmDelete(u.id)} className="text-xs text-red-500 hover:underline">삭제</button>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">현재 계정</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 프로필 수정 모달 */}
      {editProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">사용자 프로필 수정</h3>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">이름</label>
                <input type="text" value={editProfileForm.name} onChange={(e) => setEditProfileForm({ ...editProfileForm, name: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">닉네임</label>
                <input type="text" value={editProfileForm.nickname} onChange={(e) => setEditProfileForm({ ...editProfileForm, nickname: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">자기소개</label>
                <textarea value={editProfileForm.bio} onChange={(e) => setEditProfileForm({ ...editProfileForm, bio: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" rows={2} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">기술 스택 (쉼표 구분)</label>
                <input type="text" value={editProfileForm.skills} onChange={(e) => setEditProfileForm({ ...editProfileForm, skills: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setEditProfileModal(null)}>취소</Button>
              <Button size="sm" onClick={handleSaveProfile}>저장</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
