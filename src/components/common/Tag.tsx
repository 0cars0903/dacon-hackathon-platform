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
          ? "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
          : "border-gray-200 bg-white text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400",
        isClickable && "cursor-pointer hover:border-blue-300 dark:hover:border-blue-600"
      )}
    >
      {label}
    </Component>
  );
}
