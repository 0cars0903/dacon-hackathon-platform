"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "홈", icon: "🏠" },
  { href: "/hackathons", label: "해커톤", icon: "🏆" },
  { href: "/camp", label: "팀", icon: "👥" },
  { href: "/messages", label: "메시지", icon: "💬" },
  { href: "/profile", label: "프로필", icon: "👤" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav fixed bottom-0 left-0 right-0 z-40 hidden w-full flex-row items-center justify-around bg-white/95 px-0 py-2 backdrop-blur-md dark:bg-slate-950/95 md:hidden">
      {NAV_ITEMS.map((item) => {
        const isActive =
          item.href === "/"
            ? pathname === "/"
            : pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`touch-target flex flex-col items-center justify-center rounded-lg px-3 py-2 text-xs font-medium transition-all duration-200 ${
              isActive
                ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"
                : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
            }`}
          >
            <span className="mb-1 text-base transition-transform duration-200" style={{
              transform: isActive ? "scale(1.1)" : "scale(1)"
            }}>
              {item.icon}
            </span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
