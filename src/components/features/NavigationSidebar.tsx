"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getHackathons } from "@/lib/supabase/data";
import { getStatusLabel } from "@/lib/utils";
import type { Hackathon } from "@/types";

const quickLinks = [
  { href: "/", label: "홈", emoji: "🏠" },
  { href: "/hackathons", label: "해커톤", emoji: "🏆" },
  { href: "/camp", label: "팀 모집", emoji: "👥" },
  { href: "/users", label: "참가자", emoji: "👤" },
  { href: "/rankings", label: "랭킹", emoji: "📊" },
  { href: "/bookmarks", label: "북마크", emoji: "🔖" },
  { href: "/profile", label: "내 프로필", emoji: "👤" },
];

export function NavigationSidebar() {
  const pathname = usePathname();
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);

  useEffect(() => {
    const load = async () => {
      const data = await getHackathons();
      setHackathons(data);
    };
    load();
  }, []);

  return (
    <aside className="hidden shrink-0 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 lg:block lg:w-16 xl:w-64">
      <div className="sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto p-2 xl:p-4">
        {/* 바로가기 */}
        <h3 className="mb-3 hidden text-sm font-semibold text-slate-900 xl:block dark:text-white">
          바로가기
        </h3>
        <nav className="mb-6 space-y-1">
          {quickLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                title={link.label}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  isActive
                    ? "bg-indigo-50 font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                } lg:justify-center xl:justify-start`}
              >
                <span className="text-base">{link.emoji}</span>
                <span className="hidden xl:inline">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* 진행중 해커톤 — 태블릿(lg)에서 숨김, xl 이상에서 표시 */}
        <div className="hidden xl:block">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            해커톤 현황
          </h3>
          <div className="space-y-2">
            {hackathons.map((h) => {
              const isActive = pathname.startsWith(`/hackathons/${h.slug}`);
              return (
                <Link
                  key={h.slug}
                  href={`/hackathons/${h.slug}`}
                  className={`group block rounded-lg px-3 py-2 transition-colors ${
                    isActive
                      ? "bg-indigo-50 dark:bg-indigo-900/30"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block h-2 w-2 rounded-full ${
                        h.status === "ongoing"
                          ? "bg-emerald-500"
                          : h.status === "upcoming"
                            ? "bg-indigo-500"
                            : "bg-slate-400"
                      }`}
                    />
                    <span
                      className={`line-clamp-1 text-xs ${
                        isActive
                          ? "font-medium text-indigo-700 dark:text-indigo-400"
                          : "text-slate-700 group-hover:text-slate-900 dark:text-slate-300 dark:group-hover:text-white"
                      }`}
                    >
                      {h.title}
                    </span>
                  </div>
                  <span
                    className={`ml-4 text-[10px] ${
                      h.status === "ongoing"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : h.status === "upcoming"
                          ? "text-indigo-500 dark:text-indigo-400"
                          : "text-slate-400"
                    }`}
                  >
                    {getStatusLabel(h.status)}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* 유용한 링크 */}
          <div className="mt-6 rounded-lg bg-slate-50 p-3 dark:bg-slate-900">
            <h4 className="mb-2 text-xs font-semibold text-slate-400 dark:text-slate-500">
              유용한 링크
            </h4>
            <div className="space-y-1.5">
              <a
                href="https://dacon.io"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-xs text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
              >
                🔗 DACON 공식 사이트
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-xs text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
              >
                🔗 GitHub
              </a>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
