"use client";

import { cn } from "@/lib/utils";

interface TagProps {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  size?: "sm" | "md";
}

export function Tag({ label, selected = false, onClick, size = "sm" }: TagProps) {
  const isClickable = !!onClick;
  const Component = isClickable ? "button" : "span";

  return (
    <Component
      onClick={onClick}
      className={cn(
        "inline-flex items-center rounded-full border font-medium transition-colors",
        size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm",
        selected
          ? "border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
          : "border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400",
        isClickable && "cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-600"
      )}
    >
      {label}
    </Component>
  );
}
