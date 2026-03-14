"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { UserProfile, UserBadge } from "@/types";
import { getHackathons } from "@/lib/data";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  avatarUrl?: string;
}

interface NicknameChangeResult {
  success: boolean;
  error?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  getProfile: (userId?: string) => UserProfile | null;
  getAllProfiles: () => UserProfile[];
  updateProfile: (updates: Partial<UserProfile>) => void;
  changeNickname: (newNickname: string) => NicknameChangeResult;
  addBadge: (badge: UserBadge) => void;
  joinHackathon: (hackathonSlug: string) => void;
  // 관리자 기능
  isAdmin: boolean;
  deleteUser: (userId: string) => boolean;
  updateUserRole: (userId: string, role: "user" | "admin") => boolean;
  adminUpdateProfile: (userId: string, updates: Partial<UserProfile>) => boolean;
  getAllUsers: () => Array<{ id: string; name: string; email: string; role: string }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = "dacon_auth";
const USERS_KEY = "dacon_users";
const PROFILES_KEY = "dacon_profiles";

// MVP 검증용 기본 계정
const MVP_ACCOUNT = {
  id: "mvp-user-kuma",
  name: "Admin",
  email: "kuma@dacon.io",
  password: "kuma1234",
  role: "admin" as const,
};

const DEMO_ACCOUNT = {
  id: "demo-user",
  name: "User_1",
  email: "demo@dacon.io",
  password: "demo1234",
  role: "user" as const,
};

const MVP_PROFILE: UserProfile = {
  id: "mvp-user-kuma",
  name: "Admin",
  nickname: "Admin",
  nicknameChangedAt: "2026-03-01T10:00:00+09:00",
  email: "kuma@dacon.io",
  role: "admin",
  bio: "DACON Platform 관리자 계정입니다. 해커톤 운영 및 플랫폼 관리를 담당합니다.",
  skills: ["TypeScript", "React", "Next.js", "Python", "Data Analysis"],
  joinedAt: "2026-03-01T10:00:00+09:00",
  stats: {
    hackathonsJoined: 2,
    teamsCreated: 1,
    submissions: 3,
    totalScore: 156.8,
  },
  badges: [
    { id: "b-first-join", name: "첫 참가", emoji: "🎉", description: "첫 해커톤에 참가했습니다", earnedAt: "2026-03-04T10:00:00+09:00" },
    { id: "b-team-leader", name: "팀 리더", emoji: "👑", description: "팀을 처음 생성했습니다", earnedAt: "2026-03-05T11:00:00+09:00" },
    { id: "b-first-submit", name: "첫 제출", emoji: "📤", description: "첫 결과물을 제출했습니다", earnedAt: "2026-03-06T14:00:00+09:00" },
  ],
  joinedHackathons: ["daker-handover-2026-03", "data-viz-hackathon-2026"],
  teamMemberships: ["T-KUMA-TEAM"],
};

const DEMO_PROFILE: UserProfile = {
  id: "demo-user",
  name: "User_1",
  nickname: "User_1",
  email: "demo@dacon.io",
  role: "user",
  bio: "",
  skills: [],
  joinedAt: "2026-03-10T10:00:00+09:00",
  stats: { hackathonsJoined: 0, teamsCreated: 0, submissions: 0, totalScore: 0 },
  badges: [
    { id: "b-welcome-demo", name: "환영합니다", emoji: "👋", description: "DACON Platform에 가입했습니다", earnedAt: "2026-03-10T10:00:00+09:00" },
  ],
  joinedHackathons: [],
  teamMemberships: [],
};

function ensureMVPData() {
  // --- 유저 계정 확보 (기존 데이터가 있으면 이름/역할도 갱신) ---
  const usersRaw = localStorage.getItem(USERS_KEY);
  const users: Array<{ id: string; name: string; email: string; password: string; role?: string }> =
    usersRaw ? JSON.parse(usersRaw) : [];

  // MVP 계정
  const mvpIdx = users.findIndex((u) => u.email === MVP_ACCOUNT.email);
  if (mvpIdx < 0) {
    users.push(MVP_ACCOUNT);
  } else {
    // 기존 계정 이름/역할 동기화
    users[mvpIdx].name = MVP_ACCOUNT.name;
    users[mvpIdx].role = MVP_ACCOUNT.role;
  }

  // Demo 계정
  const demoIdx = users.findIndex((u) => u.email === DEMO_ACCOUNT.email);
  if (demoIdx < 0) {
    users.push(DEMO_ACCOUNT);
  } else {
    users[demoIdx].name = DEMO_ACCOUNT.name;
    users[demoIdx].role = DEMO_ACCOUNT.role;
  }
  localStorage.setItem(USERS_KEY, JSON.stringify(users));

  // --- 프로필 확보 (기존 데이터가 있으면 이름/닉네임/역할 동기화) ---
  const profilesRaw = localStorage.getItem(PROFILES_KEY);
  const profiles: UserProfile[] = profilesRaw ? JSON.parse(profilesRaw) : [];

  // MVP 프로필
  const mvpPIdx = profiles.findIndex((p) => p.id === MVP_PROFILE.id);
  if (mvpPIdx < 0) {
    profiles.push(MVP_PROFILE);
  } else {
    profiles[mvpPIdx].name = MVP_PROFILE.name;
    profiles[mvpPIdx].role = MVP_PROFILE.role;
    if (!profiles[mvpPIdx].nickname) profiles[mvpPIdx].nickname = MVP_PROFILE.nickname;
  }

  // Demo 프로필 (핵심 버그 수정: 이전에는 생성하지 않았음)
  const demoPIdx = profiles.findIndex((p) => p.id === DEMO_PROFILE.id);
  if (demoPIdx < 0) {
    profiles.push(DEMO_PROFILE);
  } else {
    profiles[demoPIdx].name = DEMO_PROFILE.name;
    profiles[demoPIdx].role = DEMO_PROFILE.role;
    if (!profiles[demoPIdx].nickname) profiles[demoPIdx].nickname = DEMO_PROFILE.nickname;
  }
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));

  // --- 팀 데이터 확보 ---
  const teamsRaw = localStorage.getItem("dacon_teams");
  const teams = teamsRaw ? JSON.parse(teamsRaw) : [];
  if (!teams.some((t: { teamCode: string }) => t.teamCode === "T-KUMA-TEAM")) {
    teams.push({
      teamCode: "T-KUMA-TEAM",
      hackathonSlug: "daker-handover-2026-03",
      name: "Team Admin",
      isOpen: true,
      memberCount: 1,
      lookingFor: ["Frontend", "Designer", "Backend"],
      intro: "긴급 인수인계 해커톤에서 명세서 기반 웹서비스를 구현하는 팀입니다. 바이브 코딩으로 빠르게 프로토타입을 만들고 있습니다!",
      contact: { type: "link", url: "https://open.kakao.com/o/gKumaTeam" },
      createdAt: "2026-03-05T11:00:00+09:00",
      creatorId: "mvp-user-kuma",
      members: [
        { userId: "mvp-user-kuma", name: "Admin", role: "팀장", joinedAt: "2026-03-05T11:00:00+09:00" },
      ],
    });
    localStorage.setItem("dacon_teams", JSON.stringify(teams));
  }
}

function createDefaultProfile(user: { id: string; name: string; email: string; role?: string }): UserProfile {
  return {
    id: user.id,
    name: user.name,
    nickname: user.name,
    email: user.email,
    role: (user.role as "user" | "admin") || "user",
    bio: "",
    skills: [],
    joinedAt: new Date().toISOString(),
    stats: { hackathonsJoined: 0, teamsCreated: 0, submissions: 0, totalScore: 0 },
    badges: [
      { id: `b-welcome-${Date.now()}`, name: "환영합니다", emoji: "👋", description: "DACON Platform에 가입했습니다", earnedAt: new Date().toISOString() },
    ],
    joinedHackathons: [],
    teamMemberships: [],
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    ensureMVPData();
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setUser(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    const usersRaw = localStorage.getItem(USERS_KEY);
    const users: Array<{ id: string; name: string; email: string; password: string; role?: string }> =
      usersRaw ? JSON.parse(usersRaw) : [];

    const found = users.find((u) => u.email === email && u.password === password);
    if (found) {
      const role = (found.role as "user" | "admin") || "user";
      const userData: User = { id: found.id, name: found.name, email: found.email, role };
      setUser(userData);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));

      // 안전장치: 프로필이 없으면 자동 생성
      const profilesRaw = localStorage.getItem(PROFILES_KEY);
      const profiles: UserProfile[] = profilesRaw ? JSON.parse(profilesRaw) : [];
      if (!profiles.some((p) => p.id === found.id)) {
        profiles.push(createDefaultProfile({ id: found.id, name: found.name, email: found.email, role: found.role }));
        localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
      }

      return true;
    }
    return false;
  }, []);

  const signup = useCallback(
    async (name: string, email: string, password: string): Promise<boolean> => {
      const usersRaw = localStorage.getItem(USERS_KEY);
      const users: Array<{ id: string; name: string; email: string; password: string }> =
        usersRaw ? JSON.parse(usersRaw) : [];

      if (users.some((u) => u.email === email)) return false;

      const newUser = { id: `user-${Date.now()}`, name, email, password, role: "user" as const };
      users.push(newUser);
      localStorage.setItem(USERS_KEY, JSON.stringify(users));

      // 프로필 자동 생성
      const profilesRaw = localStorage.getItem(PROFILES_KEY);
      const profiles: UserProfile[] = profilesRaw ? JSON.parse(profilesRaw) : [];
      profiles.push(createDefaultProfile(newUser));
      localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));

      const userData: User = { id: newUser.id, name: newUser.name, email: newUser.email, role: "user" };
      setUser(userData);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
      return true;
    },
    []
  );

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const getProfile = useCallback((userId?: string): UserProfile | null => {
    const targetId = userId || user?.id;
    if (!targetId) return null;
    const profilesRaw = localStorage.getItem(PROFILES_KEY);
    const profiles: UserProfile[] = profilesRaw ? JSON.parse(profilesRaw) : [];
    return profiles.find((p) => p.id === targetId) || null;
  }, [user]);

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    if (!user) return;
    const profilesRaw = localStorage.getItem(PROFILES_KEY);
    const profiles: UserProfile[] = profilesRaw ? JSON.parse(profilesRaw) : [];
    const idx = profiles.findIndex((p) => p.id === user.id);
    if (idx >= 0) {
      profiles[idx] = { ...profiles[idx], ...updates };
      localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
    }
    // 이름이 변경되면 auth도 업데이트
    if (updates.name) {
      const updatedUser = { ...user, name: updates.name };
      setUser(updatedUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
    }
  }, [user]);

  const addBadge = useCallback((badge: UserBadge) => {
    if (!user) return;
    const profilesRaw = localStorage.getItem(PROFILES_KEY);
    const profiles: UserProfile[] = profilesRaw ? JSON.parse(profilesRaw) : [];
    const idx = profiles.findIndex((p) => p.id === user.id);
    if (idx >= 0 && !profiles[idx].badges.some((b) => b.id === badge.id)) {
      profiles[idx].badges.push(badge);
      localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
    }
  }, [user]);

  const getAllProfiles = useCallback((): UserProfile[] => {
    const profilesRaw = localStorage.getItem(PROFILES_KEY);
    return profilesRaw ? JSON.parse(profilesRaw) : [];
  }, []);

  const changeNickname = useCallback((newNickname: string): NicknameChangeResult => {
    if (!user) return { success: false, error: "로그인이 필요합니다." };
    const trimmed = newNickname.trim();
    if (!trimmed || trimmed.length < 2 || trimmed.length > 20) {
      return { success: false, error: "닉네임은 2~20자로 입력해주세요." };
    }

    const profilesRaw = localStorage.getItem(PROFILES_KEY);
    const profiles: UserProfile[] = profilesRaw ? JSON.parse(profilesRaw) : [];
    const idx = profiles.findIndex((p) => p.id === user.id);
    if (idx < 0) return { success: false, error: "프로필을 찾을 수 없습니다." };

    const profile = profiles[idx];

    // 닉네임 중복 체크
    if (profiles.some((p) => p.id !== user.id && p.nickname === trimmed)) {
      return { success: false, error: "이미 사용 중인 닉네임입니다." };
    }

    // 1달 제한 체크
    if (profile.nicknameChangedAt) {
      const lastChanged = new Date(profile.nicknameChangedAt);
      const oneMonthLater = new Date(lastChanged);
      oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
      if (new Date() < oneMonthLater) {
        const remainDays = Math.ceil((oneMonthLater.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return { success: false, error: `닉네임 변경은 월 1회만 가능합니다. (${remainDays}일 후 변경 가능)` };
      }
    }

    // 해커톤 참여 중 제한 체크 — ongoing 해커톤에 참가 중이면 변경 불가
    const hackathons = getHackathons();
    const participatingOngoing = profile.joinedHackathons.some((slug: string) => {
      const h = hackathons.find((hh) => hh.slug === slug);
      return h && h.status === "ongoing";
    });
    if (participatingOngoing) {
      return { success: false, error: "진행 중인 해커톤에 참가하고 있어 닉네임을 변경할 수 없습니다." };
    }

    // 변경 적용
    profiles[idx].nickname = trimmed;
    profiles[idx].nicknameChangedAt = new Date().toISOString();
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));

    return { success: true };
  }, [user]);

  // === 관리자 기능 ===
  const isAdmin = user?.role === "admin";

  const getAllUsers = useCallback((): Array<{ id: string; name: string; email: string; role: string }> => {
    const usersRaw = localStorage.getItem(USERS_KEY);
    const users: Array<{ id: string; name: string; email: string; role?: string }> = usersRaw ? JSON.parse(usersRaw) : [];
    return users.map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role || "user" }));
  }, []);

  const deleteUser = useCallback((userId: string): boolean => {
    if (!user || user.role !== "admin") return false;
    if (userId === user.id) return false; // 자기 자신 삭제 방지

    // 유저 목록에서 제거
    const usersRaw = localStorage.getItem(USERS_KEY);
    const users: Array<{ id: string; name: string; email: string; password: string; role?: string }> = usersRaw ? JSON.parse(usersRaw) : [];
    const filtered = users.filter((u) => u.id !== userId);
    if (filtered.length === users.length) return false;
    localStorage.setItem(USERS_KEY, JSON.stringify(filtered));

    // 프로필에서 제거
    const profilesRaw = localStorage.getItem(PROFILES_KEY);
    const profiles: UserProfile[] = profilesRaw ? JSON.parse(profilesRaw) : [];
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles.filter((p) => p.id !== userId)));

    return true;
  }, [user]);

  const updateUserRole = useCallback((userId: string, role: "user" | "admin"): boolean => {
    if (!user || user.role !== "admin") return false;

    const usersRaw = localStorage.getItem(USERS_KEY);
    const users: Array<{ id: string; name: string; email: string; password: string; role?: string }> = usersRaw ? JSON.parse(usersRaw) : [];
    const idx = users.findIndex((u) => u.id === userId);
    if (idx < 0) return false;
    users[idx].role = role;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));

    // 프로필 role도 업데이트
    const profilesRaw = localStorage.getItem(PROFILES_KEY);
    const profiles: UserProfile[] = profilesRaw ? JSON.parse(profilesRaw) : [];
    const pIdx = profiles.findIndex((p) => p.id === userId);
    if (pIdx >= 0) {
      profiles[pIdx].role = role;
      localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
    }

    return true;
  }, [user]);

  const adminUpdateProfile = useCallback((userId: string, updates: Partial<UserProfile>): boolean => {
    if (!user || user.role !== "admin") return false;

    const profilesRaw = localStorage.getItem(PROFILES_KEY);
    const profiles: UserProfile[] = profilesRaw ? JSON.parse(profilesRaw) : [];
    const idx = profiles.findIndex((p) => p.id === userId);
    if (idx < 0) return false;

    profiles[idx] = { ...profiles[idx], ...updates };
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));

    // users 테이블의 name도 동기화
    if (updates.name) {
      const usersRaw = localStorage.getItem(USERS_KEY);
      const allUsers: Array<{ id: string; name: string; email: string; password: string; role?: string }> = usersRaw ? JSON.parse(usersRaw) : [];
      const uIdx = allUsers.findIndex((u) => u.id === userId);
      if (uIdx >= 0) {
        allUsers[uIdx].name = updates.name;
        localStorage.setItem(USERS_KEY, JSON.stringify(allUsers));
      }
    }

    return true;
  }, [user]);

  const joinHackathon = useCallback((hackathonSlug: string) => {
    if (!user) return;
    const profilesRaw = localStorage.getItem(PROFILES_KEY);
    const profiles: UserProfile[] = profilesRaw ? JSON.parse(profilesRaw) : [];
    const idx = profiles.findIndex((p) => p.id === user.id);
    if (idx >= 0 && !profiles[idx].joinedHackathons.includes(hackathonSlug)) {
      profiles[idx].joinedHackathons.push(hackathonSlug);
      profiles[idx].stats.hackathonsJoined += 1;
      // 첫 참가 배지
      if (profiles[idx].stats.hackathonsJoined === 1) {
        profiles[idx].badges.push({
          id: `b-first-join-${Date.now()}`, name: "첫 참가", emoji: "🎉",
          description: "첫 해커톤에 참가했습니다", earnedAt: new Date().toISOString(),
        });
      }
      localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout, getProfile, getAllProfiles, updateProfile, changeNickname, addBadge, joinHackathon, isAdmin, deleteUser, updateUserRole, adminUpdateProfile, getAllUsers }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
