"use client";

import { cn } from "@/lib/utils";

interface Tab {
  key: string;
  label: string;
  emoji?: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (key: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onTabChange, className }: TabsProps) {
  return (
    <div
      className={cn(
        "flex gap-1 overflow-x-auto border-b border-gray-200 dark:border-gray-800",
        className
      )}
    >
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          className={cn(
            "shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
            activeTab === tab.key
              ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
              : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          )}
        >
          {tab.emoji && <span className="mr-1.5">{tab.emoji}</span>}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
