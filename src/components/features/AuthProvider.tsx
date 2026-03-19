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
import { createClient, createDataClient, syncAuthToDataClient } from "@/lib/supabase/client";
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
  signup: (name: string, email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
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

/** Auth client — ONLY for auth operations (login, signup, getSession) */
function authClient() {
  return createClient();
}

/** Data client — for ALL .from() queries. Never blocks on auth init. */
function db() {
  return createDataClient();
}

/** Race a promise against a timeout. Returns null if timeout wins. */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 세션 복구 — Supabase Auth 세션 체크
  useEffect(() => {
    const loadProfile = async (userId: string) => {
      const { data: profile } = await db()
        .from("profiles")
        .select("id, name, email, role, avatar_url")
        .eq("id", userId)
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
    };

    const initSession = async () => {
      try {
        // 1차: localStorage에서 직접 토큰 확인 (GoTrueClient 초기화 우회)
        // authClient의 getSession/setSession은 내부 초기화에 블로킹되므로
        // data client(persistSession:false)를 통해 즉시 세션을 복원한다.
        const stored = localStorage.getItem("dacon-auth-token");
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            const accessToken = parsed?.access_token;
            const refreshToken = parsed?.refresh_token;
            const userId = parsed?.user?.id;
            const expiresAt = parsed?.expires_at;

            if (accessToken && refreshToken && userId && expiresAt && expiresAt * 1000 > Date.now()) {
              // data client에 세션 설정 — 즉시 완료, 초기화 차단 없음
              await db().auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });
              await loadProfile(userId);

              // auth client에도 세션 설정 (백그라운드, 실패 무시)
              authClient().auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              }).catch(() => {});

              setIsLoading(false);
              return;
            }
          } catch {
            // 파싱 실패 — 다음 방법으로
          }
        }

        // 2차: localStorage 없으면 authClient getSession 시도 (타임아웃 4초)
        const result = await withTimeout(
          authClient().auth.getSession(),
          4000
        );
        if (result && result.data?.session?.user) {
          await syncAuthToDataClient();
          await loadProfile(result.data.session.user.id);
          setIsLoading(false);
          return;
        }
      } catch {
        // ignore — proceed as logged out
      }
      setIsLoading(false);
    };

    initSession();

    // Auth 상태 변경 리스너
    const { data: { subscription } } = authClient().auth.onAuthStateChange(
      async (_event: string, session: { user?: { id: string } } | null) => {
        if (session?.user) {
          await syncAuthToDataClient();
          await loadProfile(session.user.id);
        } else {
          setUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    const { error } = await authClient().auth.signInWithPassword({ email, password });
    if (!error) {
      await syncAuthToDataClient();
    }
    return !error;
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
    const { data, error } = await authClient().auth.signUp({
      email,
      password,
      options: { data: { name, role: "user" } },
    });

    if (error) {
      // Map Supabase error messages to Korean
      const msg = error.message?.toLowerCase() ?? "";
      if (msg.includes("already registered") || msg.includes("already been registered")) {
        return { ok: false, error: "이미 가입된 이메일입니다." };
      }
      if (msg.includes("password") && msg.includes("6")) {
        return { ok: false, error: "비밀번호는 최소 6자 이상이어야 합니다." };
      }
      if (msg.includes("valid email")) {
        return { ok: false, error: "유효한 이메일 주소를 입력해주세요." };
      }
      return { ok: false, error: error.message || "회원가입에 실패했습니다." };
    }

    if (!data.user) return { ok: false, error: "회원가입에 실패했습니다." };

    // Supabase may return a user with identities=[] if email already exists
    if (data.user.identities && data.user.identities.length === 0) {
      return { ok: false, error: "이미 가입된 이메일입니다." };
    }

    await syncAuthToDataClient();

    // 활동 로그 + 환영 알림 (trigger가 profiles를 생성)
    try {
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
    } catch {
      // Non-critical — ignore errors in post-signup logging
    }

    return { ok: true };
  }, []);

  const logout = useCallback(async () => {
    // 1. Supabase Auth 세션 종료
    await authClient().auth.signOut();
    // 2. Data client 세션도 제거
    await db().auth.signOut();
    // 3. localStorage에서 인증 토큰 직접 제거 (세션 복원 방지)
    try { localStorage.removeItem("dacon-auth-token"); } catch {}
    // 4. 상태 초기화
    setUser(null);
    // 5. 홈으로 리다이렉트
    window.location.href = "/";
  }, []);

  const getProfileCb = useCallback(async (userId?: string): Promise<UserProfile | null> => {
    const targetId = userId || user?.id;
    if (!targetId) return null;
    return (await fetchProfile(targetId)) ?? null;
  }, [user]);

  const getAllProfilesCb = useCallback(async (): Promise<UserProfile[]> => {
    const { data } = await db()
      .from("profiles")
      .select("*")
      .order("joined_at", { ascending: false });
    if (!data) return [];

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
    const { data: dup } = await db()
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

    const { error } = await db()
      .from("profiles")
      .update({ nickname: trimmed, nickname_changed_at: new Date().toISOString() })
      .eq("id", user.id);

    return error ? { success: false, error: error.message } : { success: true };
  }, [user]);

  const addBadgeCb = useCallback(async (badge: UserBadge) => {
    if (!user) return;
    const { data: existing } = await db()
      .from("badges")
      .select("id")
      .eq("user_id", user.id)
      .eq("name", badge.name)
      .maybeSingle();
    if (existing) return;

    await db().from("badges").insert({
      user_id: user.id,
      name: badge.name,
      emoji: badge.emoji,
      description: badge.description,
    });
  }, [user]);

  const joinHackathonCb = useCallback(async (hackathonSlug: string) => {
    if (!user) return;

    const { data: existing } = await db()
      .from("hackathon_participants")
      .select("id")
      .eq("hackathon_slug", hackathonSlug)
      .eq("user_id", user.id)
      .maybeSingle();
    if (existing) return;

    await db().from("hackathon_participants").insert({
      hackathon_slug: hackathonSlug,
      user_id: user.id,
    });

    const { data: profile } = await db()
      .from("profiles")
      .select("hackathons_joined")
      .eq("id", user.id)
      .single();
    if (profile) {
      const newCount = (profile.hackathons_joined ?? 0) + 1;
      await db()
        .from("profiles")
        .update({ hackathons_joined: newCount })
        .eq("id", user.id);

      if (newCount === 1) {
        await db().from("badges").insert({
          user_id: user.id,
          name: "첫 참가",
          emoji: "🎉",
          description: "첫 해커톤에 참가했습니다",
        });
      }
    }

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
    const { data } = await db()
      .from("profiles")
      .select("id, name, email, role")
      .order("joined_at", { ascending: false });
    return (data ?? []).map((u: any) => ({ id: u.id, name: u.name, email: u.email, role: u.role }));
  }, []);

  const deleteUserCb = useCallback(async (userId: string): Promise<boolean> => {
    if (!user || user.role !== "admin" || userId === user.id) return false;
    const { error } = await db().from("profiles").delete().eq("id", userId);
    return !error;
  }, [user]);

  const updateUserRoleCb = useCallback(async (userId: string, role: "user" | "admin"): Promise<boolean> => {
    if (!user || user.role !== "admin") return false;
    const { error } = await db()
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
