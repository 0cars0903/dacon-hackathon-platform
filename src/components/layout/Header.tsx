"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useThemeContext } from "./ThemeProvider";
import { useAuth } from "@/components/features/AuthProvider";
import { NotificationBell } from "@/components/features/NotificationBell";
import { SearchModal } from "@/components/features/SearchModal";

const NAV_ITEMS = [
  { href: "/hackathons", label: "해커톤" },
  { href: "/camp", label: "팀 모집" },
  { href: "/rankings", label: "랭킹" },
  { href: "/settings", label: "설정" },
];

export function Header() {
  const { theme, toggleTheme } = useThemeContext();
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-md dark:border-gray-800 dark:bg-gray-950/80" style={{ contain: "layout style" }}>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link
          href="/"
          className="flex items-center gap-1 text-xl font-bold text-gray-900 transition-transform hover:scale-105 dark:text-white"
        >
          <span className="font-display text-blue-600 dark:text-blue-400" style={{ fontWeight: 800, letterSpacing: '-0.5px' }}>DACON</span>
          <span className="text-sm font-normal text-gray-500">Platform</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.href} href={item.href} active={pathname === item.href || pathname.startsWith(item.href + "/")}>
              {item.label}
            </NavLink>
          ))}

          <button
            onClick={() => setSearchModalOpen(true)}
            className="ml-2 rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            aria-label="검색 (⌘K)"
            title="검색 (⌘K)"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>

          <NotificationBell />

          <button
            onClick={toggleTheme}
            className="rounded-lg p-2 text-gray-500 transition-all hover:bg-gray-100 hover:rotate-12 dark:text-gray-400 dark:hover:bg-gray-800"
            aria-label={theme === "light" ? "다크모드로 전환" : "라이트모드로 전환"}
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

          {user ? (
            <div ref={userMenuRef} className="relative ml-2">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600 dark:bg-blue-900 dark:text-blue-400">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="hidden lg:inline">{user.name}</span>
                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {userMenuOpen && (
                <div className="animate-fade-in absolute right-0 top-full z-50 mt-1 w-48 rounded-xl border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-900">
                  <div className="border-b border-gray-100 px-4 py-2 dark:border-gray-800">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <Link
                    href="/profile"
                    onClick={() => setUserMenuOpen(false)}
                    className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800"
                  >
                    내 프로필
                  </Link>
                  <Link
                    href="/bookmarks"
                    onClick={() => setUserMenuOpen(false)}
                    className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800"
                  >
                    북마크
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setUserMenuOpen(false)}
                    className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800"
                  >
                    설정
                  </Link>
                  {user.role === "admin" && (
                    <Link
                      href="/admin"
                      onClick={() => setUserMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-900/20"
                    >
                      관리자
                    </Link>
                  )}
                  <button
                    onClick={() => { logout(); setUserMenuOpen(false); }}
                    className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    로그아웃
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="ml-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              로그인
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-1 md:hidden">
          {user ? (
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">
              {user.name.charAt(0).toUpperCase()}
            </div>
          ) : (
            <Link href="/login" className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white">
              로그인
            </Link>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-2 text-gray-600 dark:text-gray-400"
            aria-label="메뉴"
          >
            {mobileMenuOpen ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {searchOpen && (
        <div className="animate-fade-in border-t border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-950">
          <div className="mx-auto max-w-6xl">
            <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-900">
              <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="해커톤, 팀, 태그 검색..."
                className="flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400 dark:text-white"
                autoFocus
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="text-gray-400 hover:text-gray-600">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {mobileMenuOpen && (
        <nav className="animate-fade-in border-t border-gray-200 bg-white px-4 py-3 md:hidden dark:border-gray-800 dark:bg-gray-950">
          <div className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block rounded-lg px-4 py-3 text-sm font-medium transition-colors min-h-[44px] ${
                  pathname === item.href || pathname.startsWith(item.href + "/")
                    ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                }`}
              >
                {item.label}
              </Link>
            ))}
            {user && (
              <>
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block rounded-lg px-4 py-3 text-sm font-medium transition-colors min-h-[44px] ${
                    pathname === "/profile"
                      ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                      : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                  }`}
                >
                  내 프로필
                </Link>
                <button
                  onClick={() => { logout(); setMobileMenuOpen(false); }}
                  className="block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400"
                >
                  로그아웃
                </button>
              </>
            )}
            <div className="flex items-center justify-between border-t border-gray-200 pt-2 dark:border-gray-800">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {theme === "dark" ? "다크 모드" : "라이트 모드"}
              </span>
              <button
                onClick={toggleTheme}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                {theme === "light" ? "🌙" : "☀️"}
              </button>
            </div>
          </div>
        </nav>
      )}

      {/* Search Modal - Cmd+K / Ctrl+K */}
      <SearchModal isOpen={searchModalOpen} onClose={() => setSearchModalOpen(false)} />
    </header>
  );
}

function NavLink({
  href,
  children,
  active,
}: {
  href: string;
  children: React.ReactNode;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
      }`}
    >
      {children}
    </Link>
  );
}
