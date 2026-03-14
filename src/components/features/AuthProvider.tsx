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
import { createClient } from "@/lib/supabase/client";
import {
  getProfile as fetchProfile,
  updateProfile as patchProfile,
  logActivity,
  addNotification,
  getHackathons,
} from "@/lib/supabase/data";

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
  getProfile: (userId?: string) => Promise<UserProfile | null>;
  getAllProfiles: () => Promise<UserProfile[]>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  changeNickname: (newNickname: string) => Promise<NicknameChangeResult>;
  addBadge: (badge: UserBadge) => Promise<void>;
  joinHackathon: (hackathonSlug: string) => Promise<void>;
  // 관리자 기능
  isAdmin: boolean;
  deleteUser: (userId: string) => Promise<boolean>;
  updateUserRole: (userId: string, role: "user" | "admin") => Promise<boolean>;
  adminUpdateProfile: (userId: string, updates: Partial<UserProfile>) => Promise<boolean>;
  getAllUsers: () => Promise<Array<{ id: string; name: string; email: string; role: string }>>;
}

const AuthContext = createContext<AuthContextType | null>(null);

function supabase() {
  return createClient();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 세션 복구 — Supabase Auth 세션 체크
  useEffect(() => {
    const initSession = async () => {
      try {
        const { data: { session } } = await supabase().auth.getSession();
        if (session?.user) {
          const { data: profile } = await supabase()
            .from("profiles")
            .select("id, name, email, role, avatar_url")
            .eq("id", session.user.id)
            .single();

          if (profile) {
            setUser({
              id: profile.id,
              name: profile.name,
              email: profile.email,
              role: profile.role as "user" | "admin",
              avatarUrl: profile.avatar_url ?? undefined,
            });
          }
        }
      } catch {
        // ignore
      }
      setIsLoading(false);
    };

    initSession();

    // Auth 상태 변경 리스너
    const { data: { subscription } } = supabase().auth.onAuthStateChange(
      async (_event: string, session: any) => {
        if (session?.user) {
          const { data: profile } = await supabase()
            .from("profiles")
            .select("id, name, email, role, avatar_url")
            .eq("id", session.user.id)
            .single();

          if (profile) {
            setUser({
              id: profile.id,
              name: profile.name,
              email: profile.email,
              role: profile.role as "user" | "admin",
              avatarUrl: profile.avatar_url ?? undefined,
            });
          }
        } else {
          setUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    const { error } = await supabase().auth.signInWithPassword({ email, password });
    return !error;
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string): Promise<boolean> => {
    const { data, error } = await supabase().auth.signUp({
      email,
      password,
      options: { data: { name, role: "user" } },
    });
    if (error || !data.user) return false;

    // 활동 로그 + 환영 알림 (trigger가 profiles를 생성)
    await logActivity({
      type: "user_signup",
      message: `${name}님이 DACON 플랫폼에 가입했습니다.`,
      timestamp: new Date().toISOString(),
    });
    await addNotification(data.user.id, {
      message: "DACON 플랫폼에 오신 것을 환영합니다! 프로필을 완성하고 해커톤에 참여해보세요.",
      type: "info",
      link: "/profile",
    });

    return true;
  }, []);

  const logout = useCallback(async () => {
    await supabase().auth.signOut();
    setUser(null);
  }, []);

  const getProfileCb = useCallback(async (userId?: string): Promise<UserProfile | null> => {
    const targetId = userId || user?.id;
    if (!targetId) return null;
    return (await fetchProfile(targetId)) ?? null;
  }, [user]);

  const getAllProfilesCb = useCallback(async (): Promise<UserProfile[]> => {
    const { data } = await supabase()
      .from("profiles")
      .select("*")
      .order("joined_at", { ascending: false });
    if (!data) return [];

    // 간소화된 프로필 리스트 (배지/멤버십 없이)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.map((p: any) => ({
      id: p.id,
      name: p.name,
      nickname: p.nickname,
      nicknameChangedAt: p.nickname_changed_at ?? undefined,
      email: p.email,
      role: p.role as "user" | "admin",
      avatarUrl: p.avatar_url ?? undefined,
      bio: p.bio ?? undefined,
      skills: p.skills ?? [],
      joinedAt: p.joined_at,
      stats: {
        hackathonsJoined: p.hackathons_joined,
        teamsCreated: p.teams_created,
        submissions: p.submissions_count,
        totalScore: p.total_score,
      },
      badges: [],
      joinedHackathons: [],
      teamMemberships: [],
    }));
  }, []);

  const updateProfileCb = useCallback(async (updates: Partial<UserProfile>) => {
    if (!user) return;
    await patchProfile(user.id, updates);

    // 이름이 변경되면 local state도 업데이트
    if (updates.name) {
      setUser(prev => prev ? { ...prev, name: updates.name! } : prev);
    }
  }, [user]);

  const changeNicknameCb = useCallback(async (newNickname: string): Promise<NicknameChangeResult> => {
    if (!user) return { success: false, error: "로그인이 필요합니다." };
    const trimmed = newNickname.trim();
    if (!trimmed || trimmed.length < 2 || trimmed.length > 20) {
      return { success: false, error: "닉네임은 2~20자로 입력해주세요." };
    }

    const profile = await fetchProfile(user.id);
    if (!profile) return { success: false, error: "프로필을 찾을 수 없습니다." };

    // 닉네임 중복 체크
    const { data: dup } = await supabase()
      .from("profiles")
      .select("id")
      .eq("nickname", trimmed)
      .neq("id", user.id)
      .maybeSingle();
    if (dup) return { success: false, error: "이미 사용 중인 닉네임입니다." };

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

    // 해커톤 참여 중 제한 체크
    const hackathons = await getHackathons();
    const participatingOngoing = profile.joinedHackathons.some((slug: string) => {
      const h = hackathons.find(hh => hh.slug === slug);
      return h && h.status === "ongoing";
    });
    if (participatingOngoing) {
      return { success: false, error: "진행 중인 해커톤에 참가하고 있어 닉네임을 변경할 수 없습니다." };
    }

    const { error } = await supabase()
      .from("profiles")
      .update({ nickname: trimmed, nickname_changed_at: new Date().toISOString() })
      .eq("id", user.id);

    return error ? { success: false, error: error.message } : { success: true };
  }, [user]);

  const addBadgeCb = useCallback(async (badge: UserBadge) => {
    if (!user) return;
    // 중복 방지
    const { data: existing } = await supabase()
      .from("badges")
      .select("id")
      .eq("user_id", user.id)
      .eq("name", badge.name)
      .maybeSingle();
    if (existing) return;

    await supabase().from("badges").insert({
      user_id: user.id,
      name: badge.name,
      emoji: badge.emoji,
      description: badge.description,
    });
  }, [user]);

  const joinHackathonCb = useCallback(async (hackathonSlug: string) => {
    if (!user) return;

    // 이미 참여 중인지 확인
    const { data: existing } = await supabase()
      .from("hackathon_participants")
      .select("id")
      .eq("hackathon_slug", hackathonSlug)
      .eq("user_id", user.id)
      .maybeSingle();
    if (existing) return;

    await supabase().from("hackathon_participants").insert({
      hackathon_slug: hackathonSlug,
      user_id: user.id,
    });

    // stats 업데이트 시도 (RPC 함수 없으면 스킵)
    const { data: profile } = await supabase()
      .from("profiles")
      .select("hackathons_joined")
      .eq("id", user.id)
      .single();
    if (profile) {
      const newCount = (profile.hackathons_joined ?? 0) + 1;
      await supabase()
        .from("profiles")
        .update({ hackathons_joined: newCount })
        .eq("id", user.id);

      // 첫 참가 배지
      if (newCount === 1) {
        await supabase().from("badges").insert({
          user_id: user.id,
          name: "첫 참가",
          emoji: "🎉",
          description: "첫 해커톤에 참가했습니다",
        });
      }
    }

    // 활동 로그
    const hackathons = await getHackathons();
    const h = hackathons.find(hk => hk.slug === hackathonSlug);
    await logActivity({
      type: "team_created",
      message: `${user.name}님이 ${h?.title || hackathonSlug} 해커톤에 참가했습니다.`,
      timestamp: new Date().toISOString(),
      hackathonSlug,
    });
  }, [user]);

  // === 관리자 기능 ===
  const isAdmin = user?.role === "admin";

  const getAllUsersCb = useCallback(async (): Promise<Array<{ id: string; name: string; email: string; role: string }>> => {
    const { data } = await supabase()
      .from("profiles")
      .select("id, name, email, role")
      .order("joined_at", { ascending: false });
    return (data ?? []).map((u: any) => ({ id: u.id, name: u.name, email: u.email, role: u.role }));
  }, []);

  const deleteUserCb = useCallback(async (userId: string): Promise<boolean> => {
    if (!user || user.role !== "admin" || userId === user.id) return false;
    // Supabase에서 프로필 삭제 (CASCADE로 관련 데이터 모두 삭제)
    const { error } = await supabase().from("profiles").delete().eq("id", userId);
    return !error;
  }, [user]);

  const updateUserRoleCb = useCallback(async (userId: string, role: "user" | "admin"): Promise<boolean> => {
    if (!user || user.role !== "admin") return false;
    const { error } = await supabase()
      .from("profiles")
      .update({ role })
      .eq("id", userId);
    return !error;
  }, [user]);

  const adminUpdateProfileCb = useCallback(async (userId: string, updates: Partial<UserProfile>): Promise<boolean> => {
    if (!user || user.role !== "admin") return false;
    return patchProfile(userId, updates);
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        signup,
        logout,
        getProfile: getProfileCb,
        getAllProfiles: getAllProfilesCb,
        updateProfile: updateProfileCb,
        changeNickname: changeNicknameCb,
        addBadge: addBadgeCb,
        joinHackathon: joinHackathonCb,
        isAdmin,
        deleteUser: deleteUserCb,
        updateUserRole: updateUserRoleCb,
        adminUpdateProfile: adminUpdateProfileCb,
        getAllUsers: getAllUsersCb,
      }}
    >
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
