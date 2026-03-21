"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/features/AuthProvider";
import { Button } from "@/components/common/Button";

export default function LoginPage() {
  const { login, signup } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "login") {
        const ok = await login(email, password);
        if (!ok) {
          setError("이메일 또는 비밀번호가 일치하지 않습니다.");
          return;
        }
      } else {
        if (!name.trim()) {
          setError("이름을 입력해주세요.");
          return;
        }
        const result = await signup(name, email, password);
        if (!result.ok) {
          setError(result.error || "회원가입에 실패했습니다.");
          return;
        }
      }
      router.push("/");
      // Fallback: router.push 간헐적 실패 대비
      setTimeout(() => {
        if (window.location.pathname === "/login") {
          router.replace("/");
        }
      }, 1500);
    } catch {
      setError("오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* 로고 */}
        <div className="mb-8 text-center">
          <Link href="/" className="font-display inline-block text-2xl font-bold text-slate-900 dark:text-white" style={{ fontWeight: 800 }}>
            <span className="text-indigo-600 dark:text-indigo-400">CodeArena</span>{" "}
            <span className="text-slate-500">Platform</span>
          </Link>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {mode === "login"
              ? "계정에 로그인하세요"
              : "새 계정을 만들어 시작하세요"}
          </p>
        </div>

        {/* 탭 */}
        <div className="mb-6 flex rounded-lg border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => { setMode("login"); setError(""); }}
            className={`flex-1 rounded-l-lg py-2.5 text-sm font-medium transition-colors ${
              mode === "login"
                ? "bg-indigo-600 text-white"
                : "bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-400"
            }`}
          >
            로그인
          </button>
          <button
            onClick={() => { setMode("signup"); setError(""); }}
            className={`flex-1 rounded-r-lg py-2.5 text-sm font-medium transition-colors ${
              mode === "signup"
                ? "bg-indigo-600 text-white"
                : "bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-400"
            }`}
          >
            회원가입
          </button>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                이름
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                placeholder="이름을 입력하세요"
                required={mode === "signup"}
              />
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              이메일
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              placeholder="email@example.com"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              placeholder="비밀번호를 입력하세요"
              required
              minLength={6}
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full justify-center py-2.5" disabled={loading}>
            {loading
              ? "처리 중..."
              : mode === "login"
                ? "로그인"
                : "회원가입"}
          </Button>
        </form>

        {/* 데모 계정 안내 */}
        <div className="mt-6 space-y-3">
          <div className="rounded-lg bg-indigo-50 p-4 dark:bg-indigo-900/20">
            <p className="mb-2 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
              Admin 관리자 계정
            </p>
            <button
              onClick={async () => {
                setError("");
                setLoading(true);
                try {
                  const ok = await login("kuma@codearena.io", "kuma1234");
                  if (ok) {
                    router.push("/");
                    // Fallback: router.push가 간헐적으로 실패하는 경우 대비
                    setTimeout(() => {
                      if (window.location.pathname === "/login") {
                        router.replace("/");
                      }
                    }, 1500);
                    return;
                  }
                  setError("관리자 로그인에 실패했습니다. 다시 시도해주세요.");
                } catch {
                  setError("오류가 발생했습니다.");
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
              className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400 disabled:opacity-50"
            >
              {loading ? "로그인 중..." : "Admin 계정으로 바로 로그인"}
            </button>
            <p className="mt-1 text-[10px] text-indigo-500 dark:text-indigo-400">관리자 권한 + 팀 생성 및 프로필이 구성된 계정입니다</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800/50">
            <p className="mb-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              User_1 일반 사용자 계정
            </p>
            <button
              onClick={async () => {
                setError("");
                setLoading(true);
                try {
                  const ok = await login("demo@codearena.io", "demo1234");
                  if (ok) {
                    router.push("/");
                    setTimeout(() => {
                      if (window.location.pathname === "/login") {
                        router.replace("/");
                      }
                    }, 1500);
                    return;
                  }
                  setError("데모 로그인에 실패했습니다. 다시 시도해주세요.");
                } catch {
                  setError("오류가 발생했습니다.");
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
              className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400 disabled:opacity-50"
            >
              {loading ? "로그인 중..." : "Demo 계정으로 바로 로그인"}
            </button>
            <p className="mt-1 text-[10px] text-slate-400">일반 사용자 기능 체험용 계정입니다</p>
          </div>
        </div>
      </div>
    </div>
  );
}
