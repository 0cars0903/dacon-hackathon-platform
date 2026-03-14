"use client";

import { useState } from "react";
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

  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  if (!detail) {
    return <EmptyState emoji="📤" title="제출 정보를 불러올 수 없습니다" />;
  }

  const { submit } = detail.sections;

  // 날짜 기반 동적 상태 판별
  const now = new Date();
  const endAt = hackathon ? new Date(hackathon.period.endAt) : null;
  const submissionDeadline = hackathon ? new Date(hackathon.period.submissionDeadlineAt) : null;

  const isUpcoming = hackathon?.status === "upcoming";
  const isEnded = hackathon?.status === "ended" || (endAt && now > endAt);
  const isPastDeadline = submissionDeadline && now > submissionDeadline;

  const handleInputChange = (key: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
    setError("");
  };

  const handleSubmit = () => {
    if (!user || !submit.submissionItems) return;

    // 빈 항목 체크
    const emptyItems = submit.submissionItems.filter(
      (item: { key: string }) => !formValues[item.key]?.trim()
    );
    if (emptyItems.length > 0) {
      setError("모든 항목을 입력해주세요.");
      return;
    }

    // localStorage에 저장
    const submission = {
      hackathonSlug: slug,
      userId: user.id,
      userName: user.name,
      items: submit.submissionItems.map((item: { key: string; title: string }) => ({
        key: item.key,
        title: item.title,
        value: formValues[item.key],
      })),
      status: "submitted" as const,
      savedAt: new Date().toISOString(),
    };

    try {
      const existing = localStorage.getItem("dacon_submissions");
      const submissions = existing ? JSON.parse(existing) : [];

      // 같은 유저 + 같은 해커톤 기존 제출이 있으면 업데이트
      const idx = submissions.findIndex(
        (s: { hackathonSlug: string; userId: string }) =>
          s.hackathonSlug === slug && s.userId === user.id
      );
      if (idx >= 0) {
        submissions[idx] = submission;
      } else {
        submissions.push(submission);
      }

      localStorage.setItem("dacon_submissions", JSON.stringify(submissions));
      setSubmitted(true);
    } catch {
      setError("제출 중 오류가 발생했습니다. 다시 시도해주세요.");
    }
  };

  return (
    <div className="space-y-6">
      {/* 제출 가이드 */}
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

      {/* 제출 형식 */}
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

      {/* 상태별 분기 */}
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
      ) : isEnded || isPastDeadline ? (
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
      ) : submitted ? (
        <div className="rounded-xl border-2 border-green-300 bg-green-50 p-8 text-center dark:border-green-700 dark:bg-green-900/20">
          <p className="text-3xl mb-3">✅</p>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            제출이 완료되었습니다!
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {user.name}님의 결과물이 성공적으로 제출되었습니다.
          </p>
          <Button
            variant="secondary"
            onClick={() => {
              setSubmitted(false);
              setFormValues({});
            }}
          >
            다시 제출하기
          </Button>
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
                      value={formValues[item.key] || ""}
                      onChange={(e) => handleInputChange(item.key, e.target.value)}
                      placeholder="URL 또는 내용 입력"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm sm:w-64 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    />
                  </div>
                )
              )}
            </div>

            {error && (
              <div className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                {error}
              </div>
            )}

            <Button className="mt-4" onClick={handleSubmit}>
              제출하기
            </Button>
          </div>
        )
      )}
    </div>
  );
}
