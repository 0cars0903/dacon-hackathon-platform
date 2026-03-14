"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { getHackathonDetail, getHackathonBySlug } from "@/lib/data";
import { useAuth } from "@/components/features/AuthProvider";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { EmptyState } from "@/components/common/EmptyState";

export default function HackathonSubmitPage() {
  const params = useParams();
  const slug = params.slug as string;
  const detail = getHackathonDetail(slug);
  const hackathon = getHackathonBySlug(slug);
  const { user } = useAuth();

  if (!detail) {
    return <EmptyState emoji="📤" title="제출 정보를 불러올 수 없습니다" />;
  }

  const { submit } = detail.sections;
  const isUpcoming = hackathon?.status === "upcoming";
  const isEnded = hackathon?.status === "ended";

  return (
    <div className="space-y-6">
      {/* 제출 가이드 - 항상 표시 */}
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

      {/* 제출 형식 - 항상 표시 */}
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

      {/* 상태별 분기: 예정/종료/로그인 여부 */}
      {isUpcoming ? (
        <div className="rounded-xl border-2 border-dashed border-yellow-300 bg-yellow-50 p-8 text-center dark:border-yellow-700 dark:bg-yellow-900/20">
          <p className="text-3xl mb-3">⏳</p>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            아직 제출 기간이 아닙니다
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            해커톤이 시작되면 이곳에서 제출할 수 있습니다.
          </p>
        </div>
      ) : isEnded ? (
        <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-900">
          <p className="text-3xl mb-3">🏁</p>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            제출이 마감되었습니다
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            이 해커톤의 제출 기간이 종료되었습니다. 리더보드에서 결과를 확인하세요.
          </p>
        </div>
      ) : !user ? (
        <div className="rounded-xl border-2 border-dashed border-blue-300 bg-blue-50 p-8 text-center dark:border-blue-700 dark:bg-blue-900/20">
          <p className="text-3xl mb-3">🔒</p>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            로그인이 필요합니다
          </h3>
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            제출하려면 먼저 로그인해주세요.
          </p>
          <Link href="/login">
            <Button>로그인하기</Button>
          </Link>
        </div>
      ) : (
        /* 로그인 상태 + 진행 중 → 제출 폼 */
        submit.submissionItems && (
          <div className="rounded-xl border border-gray-200 p-6 dark:border-gray-800">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                제출 항목
              </h3>
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                {user.name}님으로 로그인됨
              </span>
            </div>
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
        )
      )}
    </div>
  );
}
