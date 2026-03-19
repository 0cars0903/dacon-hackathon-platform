import { Suspense } from "react";
import { SearchContent } from "./SearchContent";

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Suspense fallback={<div className="py-12 text-center text-slate-500">로딩 중...</div>}>
        <SearchContent />
      </Suspense>
    </div>
  );
}
