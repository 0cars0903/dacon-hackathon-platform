"use client";

import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "info" | "muted";
  size?: "sm" | "md";
  className?: string;
}

const variantStyles: Record<string, string> = {
  default: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  success:
    "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
  warning:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
  info: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
  muted: "bg-gray-50 text-gray-500 dark:bg-gray-900 dark:text-gray-500",
};

export function Badge({
  children,
  variant = "default",
  size = "sm",
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
