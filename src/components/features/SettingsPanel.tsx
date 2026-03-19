"use client";

import { useState, useEffect } from "react";
import { useThemeContext } from "@/components/layout/ThemeProvider";
import { useAuth } from "@/components/features/AuthProvider";
import { Button } from "@/components/common/Button";
import { Tag } from "@/components/common/Tag";
import { getNotificationPrefs, saveNotificationPrefs, type NotificationPrefs } from "@/lib/supabase/data";
import type { ColorTheme } from "@/types";

const COLOR_THEMES: { key: ColorTheme; label: string; color: string }[] = [
  { key: "blue", label: "블루", color: "bg-indigo-500" },
  { key: "purple", label: "퍼플", color: "bg-purple-500" },
  { key: "green", label: "그린", color: "bg-green-500" },
];

const SUGGESTED_TAGS = [
  "LLM", "Web", "VibeCoding", "GenAI", "ML Engineer",
  "Frontend", "Backend", "Designer", "Compression",
  "Workflow", "Idea", "Handover", "Vercel",
];

export function SettingsPanel() {
  const { theme, colorTheme, interestTags, toggleTheme, setColorTheme, setInterestTags } = useThemeContext();
  const { user } = useAuth();
  const [customTag, setCustomTag] = useState("");
  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>({
    hackathonDeadline: true,
    teamActivity: true,
    leaderboardUpdate: true,
    forumReply: true,
    systemNotice: true,
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) {
      getNotificationPrefs(user.id).then((prefs) => {
        if (prefs) setNotifPrefs(prefs);
      });
    }
  }, [user]);

  const toggleTag = (tag: string) => {
    if (interestTags.includes(tag)) {
      setInterestTags(interestTags.filter((t) => t !== tag));
    } else {
      setInterestTags([...interestTags, tag]);
    }
  };

  const addCustomTag = () => {
    const trimmed = customTag.trim();
    if (trimmed && !interestTags.includes(trimmed)) {
      setInterestTags([...interestTags, trimmed]);
      setCustomTag("");
    }
  };

  const toggleNotifPref = (key: keyof NotificationPrefs) => {
    const updated = { ...notifPrefs, [key]: !notifPrefs[key] };
    setNotifPrefs(updated);
    if (user) {
      saveNotificationPrefs(user.id, updated).then(() => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      });
    }
  };

  const notifItems: { key: keyof NotificationPrefs; label: string; description: string }[] = [
    { key: "hackathonDeadline", label: "해커톤 마감 알림", description: "참가중인 해커톤의 제출 마감이 임박할 때 알림" },
    { key: "teamActivity", label: "팀 활동 알림", description: "팀원 변경, 가입 신청, 역할 변경 시 알림" },
    { key: "leaderboardUpdate", label: "리더보드 업데이트", description: "순위 변동이나 새로운 제출이 있을 때 알림" },
    { key: "forumReply", label: "토론 답글 알림", description: "내 게시글에 댓글이 달릴 때 알림" },
    { key: "systemNotice", label: "시스템 공지", description: "플랫폼 업데이트, 새 해커톤 등록 시 알림" },
  ];

  return (
    <div className="space-y-8">
      {/* 테마 */}
      <div>
        <h3 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">테마</h3>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-600 dark:text-slate-400">
            {theme === "dark" ? "다크 모드" : "라이트 모드"}
          </span>
          <button
            onClick={toggleTheme}
            className="relative h-7 w-12 rounded-full bg-slate-200 transition-colors dark:bg-indigo-600"
          >
            <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
              theme === "dark" ? "translate-x-5" : "translate-x-0.5"
            }`} />
          </button>
        </div>
      </div>

      {/* 컬러 테마 */}
      <div>
        <h3 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">컬러 테마</h3>
        <div className="flex gap-3">
          {COLOR_THEMES.map((ct) => (
            <button
              key={ct.key}
              onClick={() => setColorTheme(ct.key)}
              className={`flex items-center gap-2 rounded-lg border-2 px-4 py-2 text-sm font-medium transition-colors ${
                colorTheme === ct.key
                  ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
                  : "border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400"
              }`}
            >
              <span className={`h-4 w-4 rounded-full ${ct.color}`} />
              {ct.label}
            </button>
          ))}
        </div>
      </div>

      {/* 알림 설정 */}
      {user && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">알림 설정</h3>
            {saved && (
              <span className="animate-fade-in text-xs text-green-600 dark:text-green-400">저장됨</span>
            )}
          </div>
          <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
            수신할 알림 유형을 선택하세요.
          </p>
          <div className="space-y-3">
            {notifItems.map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between rounded-lg border border-slate-200 p-4 dark:border-slate-700"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{item.label}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{item.description}</p>
                </div>
                <button
                  onClick={() => toggleNotifPref(item.key)}
                  className={`relative h-6 w-10 rounded-full transition-colors ${
                    notifPrefs[item.key] ? "bg-indigo-600" : "bg-slate-200 dark:bg-slate-700"
                  }`}
                >
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    notifPrefs[item.key] ? "translate-x-4" : "translate-x-0.5"
                  }`} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 관심 태그 */}
      <div>
        <h3 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">관심 태그</h3>
        <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
          관심 태그를 설정하면 맞춤 해커톤과 팀을 추천받을 수 있습니다.
        </p>

        {interestTags.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {interestTags.map((tag) => (
              <Tag key={tag} label={`${tag} ✕`} selected onClick={() => toggleTag(tag)} size="md" />
            ))}
          </div>
        )}

        <div className="mb-4 flex flex-wrap gap-2">
          {SUGGESTED_TAGS.filter((t) => !interestTags.includes(t)).map((tag) => (
            <Tag key={tag} label={tag} onClick={() => toggleTag(tag)} size="sm" />
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={customTag}
            onChange={(e) => setCustomTag(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCustomTag()}
            placeholder="직접 입력..."
            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
          <Button size="sm" variant="secondary" onClick={addCustomTag}>추가</Button>
        </div>
      </div>

      {/* 데이터 관리 */}
      <div>
        <h3 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">데이터 관리</h3>
        <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
          모든 데이터는 서버에 저장됩니다.
        </p>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            if (confirm("로컬 캐시를 초기화하시겠습니까?")) {
              const keysToRemove = ["dacon-auth-token", "dacon_recent_searches"];
              keysToRemove.forEach((k) => localStorage.removeItem(k));
              window.location.reload();
            }
          }}
        >
          로컬 캐시 초기화
        </Button>
      </div>
    </div>
  );
}
