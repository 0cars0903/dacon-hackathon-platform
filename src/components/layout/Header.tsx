"use client";

import Link from "next/link";
import { useThemeContext } from "./ThemeProvider";

export function Header() {
  const { theme, toggleTheme } = useThemeContext();

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-950/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        {/* 로고 */}
        <Link
          href="/"
          className="text-xl font-bold text-gray-900 dark:text-white"
        >
          <span className="text-blue-600 dark:text-blue-400">DACON</span>
          <span className="ml-1 text-sm font-normal text-gray-500">
            Hackathon
          </span>
        </Link>

        {/* 네비게이션 */}
        <nav className="flex items-center gap-1">
          <NavLink href="/hackathons">해커톤</NavLink>
          <NavLink href="/camp">팀 모집</NavLink>
          <NavLink href="/rankings">랭킹</NavLink>
          <NavLink href="/settings">설정</NavLink>

          {/* 다크모드 토글 */}
          <button
            onClick={toggleTheme}
            className="ml-3 rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            aria-label={
              theme === "light" ? "다크모드로 전환" : "라이트모드로 전환"
            }
          >
            {theme === "light" ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            )}
          </button>
        </nav>
      </div>
    </header>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
    >
      {children}
    </Link>
  );
}
