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
  { href: "/users", label: "참가자", emoji: "👥" },
  { href: "/rankings", label: "랭킹", emoji: "📊" },
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
    <aside className="hidden w-60 shrink-0 border-r border-gray-200 bg-white xl:block dark:border-gray-800 dark:bg-gray-950">
      <div className="sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto p-4">
        {/* 바로가기 */}
        <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
          바로가기
        </h3>
        <nav className="mb-6 space-y-1">
          {quickLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  isActive
                    ? "bg-blue-50 font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                }`}
              >
                <span className="text-base">{link.emoji}</span>
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* 진행중 해커톤 */}
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
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
                    ? "bg-blue-50 dark:bg-blue-900/30"
                    : "hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${
                      h.status === "ongoing"
                        ? "bg-green-500"
                        : h.status === "upcoming"
                          ? "bg-blue-500"
                          : "bg-gray-400"
                    }`}
                  />
                  <span
                    className={`line-clamp-1 text-xs ${
                      isActive
                        ? "font-medium text-blue-700 dark:text-blue-400"
                        : "text-gray-700 group-hover:text-gray-900 dark:text-gray-300 dark:group-hover:text-white"
                    }`}
                  >
                    {h.title}
                  </span>
                </div>
                <span
                  className={`ml-4 text-[10px] ${
                    h.status === "ongoing"
                      ? "text-green-600 dark:text-green-400"
                      : h.status === "upcoming"
                        ? "text-blue-500 dark:text-blue-400"
                        : "text-gray-400"
                  }`}
                >
                  {getStatusLabel(h.status)}
                </span>
              </Link>
            );
          })}
        </div>

        {/* 유용한 링크 */}
        <div className="mt-6 rounded-lg bg-gray-50 p-3 dark:bg-gray-900">
          <h4 className="mb-2 text-xs font-semibold text-gray-400 dark:text-gray-500">
            유용한 링크
          </h4>
          <div className="space-y-1.5">
            <a
              href="https://dacon.io"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-xs text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
            >
              🔗 DACON 공식 사이트
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-xs text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
            >
              🔗 GitHub
            </a>
          </div>
        </div>
      </div>
    </aside>
  );
}
