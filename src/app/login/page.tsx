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
          setLoading(false);
          return;
        }
      } else {
        if (!name.trim()) {
          setError("이름을 입력해주세요.");
          setLoading(false);
          return;
        }
        const ok = await signup(name, email, password);
        if (!ok) {
          setError("이미 가입된 이메일입니다.");
          setLoading(false);
          return;
        }
      }
      router.push("/");
    } catch {
      setError("오류가 발생했습니다. 다시 시도해주세요.");
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* 로고 */}
        <div className="mb-8 text-center">
          <Link href="/" className="font-display inline-block text-2xl font-bold text-gray-900 dark:text-white" style={{ fontWeight: 800 }}>
            <span className="text-blue-600 dark:text-blue-400">DACON</span>{" "}
            <span className="text-gray-500">Platform</span>
          </Link>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {mode === "login"
              ? "계정에 로그인하세요"
              : "새 계정을 만들어 시작하세요"}
          </p>
        </div>

        {/* 탭 */}
        <div className="mb-6 flex rounded-lg border border-gray-200 dark:border-gray-700">
          <button
            onClick={() => { setMode("login"); setError(""); }}
            className={`flex-1 rounded-l-lg py-2.5 text-sm font-medium transition-colors ${
              mode === "login"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-400"
            }`}
          >
            로그인
          </button>
          <button
            onClick={() => { setMode("signup"); setError(""); }}
            className={`flex-1 rounded-r-lg py-2.5 text-sm font-medium transition-colors ${
              mode === "signup"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-400"
            }`}
          >
            회원가입
          </button>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                이름
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                placeholder="이름을 입력하세요"
                required={mode === "signup"}
              />
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              이메일
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              placeholder="email@example.com"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              placeholder="비밀번호를 입력하세요"
              required
              minLength={4}
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
          <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
            <p className="mb-2 text-xs font-semibold text-blue-700 dark:text-blue-300">
              Admin 관리자 계정
            </p>
            <button
              onClick={async () => {
                setEmail("kuma@dacon.io");
                setPassword("kuma1234");
                setMode("login");
                const ok = await login("kuma@dacon.io", "kuma1234");
                if (ok) router.push("/");
              }}
              className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              kuma@dacon.io / kuma1234 로 바로 로그인
            </button>
            <p className="mt-1 text-[10px] text-blue-500 dark:text-blue-400">관리자 권한 + 팀 생성 및 프로필이 구성된 계정입니다</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50">
            <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
              User_1 일반 사용자 계정
            </p>
            <button
              onClick={async () => {
                const ok = await login("demo@dacon.io", "demo1234");
                if (ok) router.push("/");
              }}
              className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              demo@dacon.io / demo1234 로 바로 로그인
            </button>
            <p className="mt-1 text-[10px] text-gray-400">일반 사용자 기능 체험용 계정입니다</p>
          </div>
        </div>
      </div>
    </div>
  );
}
