"use client";

import { useState, useEffect, useRef } from "react";

interface Notification {
  id: string;
  message: string;
  read: boolean;
  timestamp: string;
  type: "info" | "success" | "warning";
}

const DEFAULT_NOTIFICATIONS: Notification[] = [
  {
    id: "n1",
    message: "긴급 인수인계 해커톤 제출 마감이 3일 남았습니다!",
    read: false,
    timestamp: "2026-03-14T09:00:00+09:00",
    type: "warning",
  },
  {
    id: "n2",
    message: "404found 팀이 새로운 멤버를 모집하고 있습니다.",
    read: false,
    timestamp: "2026-03-13T15:30:00+09:00",
    type: "info",
  },
  {
    id: "n3",
    message: "모델 경량화 해커톤 리더보드가 업데이트되었습니다.",
    read: true,
    timestamp: "2026-03-12T10:00:00+09:00",
    type: "success",
  },
  {
    id: "n4",
    message: "GenAI 앱 개발 해커톤이 곧 시작됩니다!",
    read: true,
    timestamp: "2026-03-11T08:00:00+09:00",
    type: "info",
  },
];

function timeAgoShort(dateStr: string): string {
  const now = Date.now();
  const past = new Date(dateStr).getTime();
  const diffSec = Math.floor((now - past) / 1000);
  if (diffSec < 60) return "방금";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}분`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}시간`;
  return `${Math.floor(diffSec / 86400)}일`;
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("dacon_notifications");
    if (saved) {
      setNotifications(JSON.parse(saved));
    } else {
      setNotifications(DEFAULT_NOTIFICATIONS);
      localStorage.setItem(
        "dacon_notifications",
        JSON.stringify(DEFAULT_NOTIFICATIONS)
      );
    }
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    const updated = notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    );
    setNotifications(updated);
    localStorage.setItem("dacon_notifications", JSON.stringify(updated));
  };

  const markAllRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(updated);
    localStorage.setItem("dacon_notifications", JSON.stringify(updated));
  };

  const typeIcon = (type: string) => {
    switch (type) {
      case "warning":
        return "⚠️";
      case "success":
        return "✅";
      default:
        return "💬";
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
        aria-label="알림"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="animate-fade-in absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              알림
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-blue-600 hover:underline dark:text-blue-400"
              >
                모두 읽음
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-gray-400">
                알림이 없습니다
              </p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => markAsRead(n.id)}
                  className={`flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
                    !n.read
                      ? "bg-blue-50/50 dark:bg-blue-900/10"
                      : ""
                  }`}
                >
                  <span className="mt-0.5 text-sm">{typeIcon(n.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm ${
                        !n.read
                          ? "font-medium text-gray-900 dark:text-white"
                          : "text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      {n.message}
                    </p>
                    <span className="text-xs text-gray-400">
                      {timeAgoShort(n.timestamp)} 전
                    </span>
                  </div>
                  {!n.read && (
                    <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
