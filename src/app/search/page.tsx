import { Suspense } from "react";
import { SearchContent } from "./SearchContent";

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Suspense fallback={<div className="py-12 text-center text-gray-500">로딩 중...</div>}>
        <SearchContent />
      </Suspense>
    </div>
  );
}
