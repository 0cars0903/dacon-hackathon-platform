"use client";

import { SettingsPanel } from "@/components/features/SettingsPanel";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-900 dark:text-white">
        설정
      </h1>
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <SettingsPanel />
      </div>
    </div>
  );
}
