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

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  getProfile: (userId?: string) => UserProfile | null;
  updateProfile: (updates: Partial<UserProfile>) => void;
  addBadge: (badge: UserBadge) => void;
  joinHackathon: (hackathonSlug: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = "dacon_auth";
const USERS_KEY = "dacon_users";
const PROFILES_KEY = "dacon_profiles";

// MVP 검증용 기본 계정
const MVP_ACCOUNT = {
  id: "mvp-user-kuma",
  name: "Kuma",
  email: "kuma@dacon.io",
  password: "kuma1234",
};

const MVP_PROFILE: UserProfile = {
  id: "mvp-user-kuma",
  name: "Kuma",
  email: "kuma@dacon.io",
  bio: "데이터 사이언스와 웹 개발에 관심이 많은 개발자입니다. 해커톤을 통해 실력을 키우고 있습니다.",
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

function ensureMVPData() {
  // MVP 계정 확보
  const usersRaw = localStorage.getItem(USERS_KEY);
  const users: Array<{ id: string; name: string; email: string; password: string }> =
    usersRaw ? JSON.parse(usersRaw) : [];
  if (!users.some((u) => u.email === MVP_ACCOUNT.email)) {
    users.push(MVP_ACCOUNT);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }
  // Demo 계정도 확보
  if (!users.some((u) => u.email === "demo@dacon.io")) {
    users.push({ id: "demo-user", name: "Demo User", email: "demo@dacon.io", password: "demo1234" });
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  // MVP 프로필 확보
  const profilesRaw = localStorage.getItem(PROFILES_KEY);
  const profiles: UserProfile[] = profilesRaw ? JSON.parse(profilesRaw) : [];
  if (!profiles.some((p) => p.id === MVP_PROFILE.id)) {
    profiles.push(MVP_PROFILE);
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
  }

  // MVP 사용자의 팀 데이터 확보
  const teamsRaw = localStorage.getItem("dacon_teams");
  const teams = teamsRaw ? JSON.parse(teamsRaw) : [];
  if (!teams.some((t: { teamCode: string }) => t.teamCode === "T-KUMA-TEAM")) {
    teams.push({
      teamCode: "T-KUMA-TEAM",
      hackathonSlug: "daker-handover-2026-03",
      name: "Team Kuma",
      isOpen: true,
      memberCount: 1,
      lookingFor: ["Frontend", "Designer", "Backend"],
      intro: "긴급 인수인계 해커톤에서 명세서 기반 웹서비스를 구현하는 팀입니다. 바이브 코딩으로 빠르게 프로토타입을 만들고 있습니다!",
      contact: { type: "link", url: "https://open.kakao.com/o/gKumaTeam" },
      createdAt: "2026-03-05T11:00:00+09:00",
      creatorId: "mvp-user-kuma",
      members: [
        { userId: "mvp-user-kuma", name: "Kuma", role: "팀장", joinedAt: "2026-03-05T11:00:00+09:00" },
      ],
    });
    localStorage.setItem("dacon_teams", JSON.stringify(teams));
  }
}

function createDefaultProfile(user: { id: string; name: string; email: string }): UserProfile {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
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
    const users: Array<{ id: string; name: string; email: string; password: string }> =
      usersRaw ? JSON.parse(usersRaw) : [];

    const found = users.find((u) => u.email === email && u.password === password);
    if (found) {
      const userData: User = { id: found.id, name: found.name, email: found.email };
      setUser(userData);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
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

      const newUser = { id: `user-${Date.now()}`, name, email, password };
      users.push(newUser);
      localStorage.setItem(USERS_KEY, JSON.stringify(users));

      // 프로필 자동 생성
      const profilesRaw = localStorage.getItem(PROFILES_KEY);
      const profiles: UserProfile[] = profilesRaw ? JSON.parse(profilesRaw) : [];
      profiles.push(createDefaultProfile(newUser));
      localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));

      const userData: User = { id: newUser.id, name: newUser.name, email: newUser.email };
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
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout, getProfile, updateProfile, addBadge, joinHackathon }}>
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
