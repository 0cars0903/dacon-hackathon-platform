"use client";

import { useState } from "react";
import { useThemeContext } from "@/components/layout/ThemeProvider";
import { Button } from "@/components/common/Button";
import { Tag } from "@/components/common/Tag";
import type { ColorTheme } from "@/types";

const COLOR_THEMES: { key: ColorTheme; label: string; color: string }[] = [
  { key: "blue", label: "블루", color: "bg-blue-500" },
  { key: "purple", label: "퍼플", color: "bg-purple-500" },
  { key: "green", label: "그린", color: "bg-green-500" },
];

const SUGGESTED_TAGS = [
  "LLM",
  "Web",
  "VibeCoding",
  "GenAI",
  "ML Engineer",
  "Frontend",
  "Backend",
  "Designer",
  "Compression",
  "Workflow",
  "Idea",
  "Handover",
  "Vercel",
];

export function SettingsPanel() {
  const {
    theme,
    colorTheme,
    interestTags,
    toggleTheme,
    setColorTheme,
    setInterestTags,
  } = useThemeContext();

  const [customTag, setCustomTag] = useState("");

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

  return (
    <div className="space-y-8">
      {/* 테마 */}
      <div>
        <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
          테마
        </h3>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {theme === "dark" ? "다크 모드" : "라이트 모드"}
          </span>
          <button
            onClick={toggleTheme}
            className="relative h-7 w-12 rounded-full bg-gray-200 transition-colors dark:bg-blue-600"
          >
            <span
              className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                theme === "dark" ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
      </div>

      {/* 컬러 테마 */}
      <div>
        <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
          컬러 테마
        </h3>
        <div className="flex gap-3">
          {COLOR_THEMES.map((ct) => (
            <button
              key={ct.key}
              onClick={() => setColorTheme(ct.key)}
              className={`flex items-center gap-2 rounded-lg border-2 px-4 py-2 text-sm font-medium transition-colors ${
                colorTheme === ct.key
                  ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                  : "border-gray-200 text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:text-gray-400"
              }`}
            >
              <span className={`h-4 w-4 rounded-full ${ct.color}`} />
              {ct.label}
            </button>
          ))}
        </div>
      </div>

      {/* 관심 태그 */}
      <div>
        <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
          관심 태그
        </h3>
        <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">
          관심 태그를 설정하면 맞춤 해커톤과 팀을 추천받을 수 있습니다.
        </p>

        {/* 선택된 태그 */}
        {interestTags.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {interestTags.map((tag) => (
              <Tag
                key={tag}
                label={`${tag} ✕`}
                selected
                onClick={() => toggleTag(tag)}
                size="md"
              />
            ))}
          </div>
        )}

        {/* 추천 태그 */}
        <div className="mb-4 flex flex-wrap gap-2">
          {SUGGESTED_TAGS.filter((t) => !interestTags.includes(t)).map(
            (tag) => (
              <Tag
                key={tag}
                label={tag}
                onClick={() => toggleTag(tag)}
                size="sm"
              />
            )
          )}
        </div>

        {/* 커스텀 태그 입력 */}
        <div className="flex gap-2">
          <input
            type="text"
            value={customTag}
            onChange={(e) => setCustomTag(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCustomTag()}
            placeholder="직접 입력..."
            className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
          <Button size="sm" variant="secondary" onClick={addCustomTag}>
            추가
          </Button>
        </div>
      </div>
    </div>
  );
}
