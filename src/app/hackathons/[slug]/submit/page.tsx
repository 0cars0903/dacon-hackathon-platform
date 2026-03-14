"use client";

import { useParams } from "next/navigation";
import { getHackathonDetail } from "@/lib/data";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { EmptyState } from "@/components/common/EmptyState";

export default function HackathonSubmitPage() {
  const params = useParams();
  const slug = params.slug as string;
  const detail = getHackathonDetail(slug);

  if (!detail) {
    return <EmptyState emoji="📤" title="제출 정보를 불러올 수 없습니다" />;
  }

  const { submit } = detail.sections;

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-gray-50 p-6 dark:bg-gray-900">
        <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
          제출 가이드
        </h3>
        <ul className="space-y-2">
          {submit.guide.map((g: string, i: number) => (
            <li
              key={i}
              className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
            >
              <span className="font-medium text-blue-500">{i + 1}.</span>
              {g}
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border border-gray-200 p-6 dark:border-gray-800">
        <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
          제출 형식
        </h3>
        <div className="flex flex-wrap gap-2">
          {submit.allowedArtifactTypes.map((type: string) => (
            <Badge key={type} variant="info">
              {type.toUpperCase()}
            </Badge>
          ))}
        </div>
      </div>

      {submit.submissionItems && (
        <div className="rounded-xl border border-gray-200 p-6 dark:border-gray-800">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            제출 항목
          </h3>
          <div className="space-y-4">
            {submit.submissionItems.map(
              (item: { key: string; title: string; format: string }) => (
                <div
                  key={item.key}
                  className="flex flex-col gap-2 rounded-lg bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between dark:bg-gray-800"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {item.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      형식: {item.format}
                    </p>
                  </div>
                  <input
                    type="text"
                    placeholder="URL 또는 내용 입력"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm sm:w-64 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  />
                </div>
              )
            )}
          </div>
          <Button className="mt-4">제출하기</Button>
        </div>
      )}
    </div>
  );
}
