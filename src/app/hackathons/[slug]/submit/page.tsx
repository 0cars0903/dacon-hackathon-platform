"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getHackathonDetail, getHackathonBySlug } from "@/lib/data";
import { useAuth } from "@/components/features/AuthProvider";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { EmptyState } from "@/components/common/EmptyState";
import { formatDateTime, timeAgo } from "@/lib/utils";

interface SubmissionFile {
  name: string;
  size: number;
  type: string;
  data: string;
}

interface StoredSubmission {
  hackathonSlug: string;
  userId: string;
  userName: string;
  version: number;
  items: { key: string; title: string; value: string }[];
  files?: Record<string, SubmissionFile>;
  status: "draft" | "submitted";
  savedAt: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_FILE_TYPES = [
  "text/csv",
  "application/json",
  "text/plain",
  "application/zip",
  "application/x-zip-compressed",
];

export default function HackathonSubmitPage() {
  const params = useParams();
  const slug = params.slug as string;
  const detail = getHackathonDetail(slug);
  const hackathon = getHackathonBySlug(slug);
  const { user } = useAuth();

  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<Record<string, SubmissionFile>>({});
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [draftExists, setDraftExists] = useState(false);
  const [expandedHistory, setExpandedHistory] = useState<number | null>(null);
  const [submissions, setSubmissions] = useState<StoredSubmission[]>([]);
  const [submissionCount, setSubmissionCount] = useState(0);

  const maxSubmissionsPerDay = detail?.sections.eval.limits?.maxSubmissionsPerDay || 10;

  // 페이지 로드 시 draft 불러오기
  useEffect(() => {
    if (!user) return;

    try {
      const stored = localStorage.getItem("dacon_submissions");
      const allSubmissions = stored ? JSON.parse(stored) : [];

      // 현재 사용자 + 해커톤의 모든 제출 가져오기
      const userSubmissions = allSubmissions.filter(
        (s: StoredSubmission) => s.hackathonSlug === slug && s.userId === user.id
      );

      setSubmissions(userSubmissions);

      // 오늘 제출 수 계산
      const today = new Date().toDateString();
      const todaySubmissions = userSubmissions.filter((s: StoredSubmission) => {
        const submittedDate = new Date(s.savedAt).toDateString();
        return s.status === "submitted" && submittedDate === today;
      });
      setSubmissionCount(todaySubmissions.length);

      // 최신 draft 찾기
      const latestDraft = userSubmissions.find((s: StoredSubmission) => s.status === "draft");
      if (latestDraft) {
        setDraftExists(true);
        const draftValues: Record<string, string> = {};
        latestDraft.items.forEach((item: { key: string; value: string }) => {
          draftValues[item.key] = item.value;
        });
        setFormValues(draftValues);
        if (latestDraft.files) {
          setFiles(latestDraft.files);
        }
      }
    } catch {
      console.error("Failed to load submissions from localStorage");
    }
  }, [user, slug]);

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
  const isLimitReached = submissionCount >= maxSubmissionsPerDay;

  const handleInputChange = (key: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
    setError("");
  };

  const handleFileChange = (key: string, file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      setError("파일 크기는 5MB 이하여야 합니다.");
      return;
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setError("CSV, JSON, TXT, ZIP 파일만 업로드할 수 있습니다.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result as string;
      setFiles((prev) => ({
        ...prev,
        [key]: {
          name: file.name,
          size: file.size,
          type: file.type,
          data,
        },
      }));
      setError("");
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = (key: string) => {
    setFiles((prev) => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
  };

  const handleDraftSave = () => {
    if (!user || !submit.submissionItems) return;

    const existingSubmissions = localStorage.getItem("dacon_submissions");
    const allSubmissions: StoredSubmission[] = existingSubmissions
      ? JSON.parse(existingSubmissions)
      : [];

    const userHackathonSubmissions = allSubmissions.filter(
      (s) => s.hackathonSlug === slug && s.userId === user.id
    );

    const nextVersion = userHackathonSubmissions.length > 0
      ? Math.max(...userHackathonSubmissions.map((s) => s.version)) + 1
      : 1;

    const draft: StoredSubmission = {
      hackathonSlug: slug,
      userId: user.id,
      userName: user.name,
      version: nextVersion,
      items: submit.submissionItems.map((item: { key: string; title: string }) => ({
        key: item.key,
        title: item.title,
        value: formValues[item.key] || "",
      })),
      files: Object.keys(files).length > 0 ? files : undefined,
      status: "draft",
      savedAt: new Date().toISOString(),
    };

    try {
      // 기존 draft 제거
      const filtered = allSubmissions.filter(
        (s: StoredSubmission) =>
          !(
            s.hackathonSlug === slug &&
            s.userId === user.id &&
            s.status === "draft"
          )
      );

      filtered.push(draft);
      localStorage.setItem("dacon_submissions", JSON.stringify(filtered));

      setDraftExists(true);
      setError("");

      // 잠깐 성공 표시 후 복구
      setTimeout(() => {
        setError("");
      }, 2000);
    } catch {
      setError("임시저장 중 오류가 발생했습니다.");
    }
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

    // 제출 횟수 제한 확인
    if (isLimitReached) {
      setError(`하루 제출 횟수 제한(${maxSubmissionsPerDay}회)에 도달했습니다.`);
      return;
    }

    const existingSubmissions = localStorage.getItem("dacon_submissions");
    const allSubmissions: StoredSubmission[] = existingSubmissions
      ? JSON.parse(existingSubmissions)
      : [];

    const userHackathonSubmissions = allSubmissions.filter(
      (s) => s.hackathonSlug === slug && s.userId === user.id
    );

    const nextVersion = userHackathonSubmissions.length > 0
      ? Math.max(...userHackathonSubmissions.map((s) => s.version)) + 1
      : 1;

    const submission: StoredSubmission = {
      hackathonSlug: slug,
      userId: user.id,
      userName: user.name,
      version: nextVersion,
      items: submit.submissionItems.map((item: { key: string; title: string }) => ({
        key: item.key,
        title: item.title,
        value: formValues[item.key],
      })),
      files: Object.keys(files).length > 0 ? files : undefined,
      status: "submitted",
      savedAt: new Date().toISOString(),
    };

    try {
      // 기존 draft 제거
      const filtered = allSubmissions.filter(
        (s: StoredSubmission) =>
          !(
            s.hackathonSlug === slug &&
            s.userId === user.id &&
            s.status === "draft"
          )
      );

      filtered.push(submission);
      localStorage.setItem("dacon_submissions", JSON.stringify(filtered));

      setSubmitted(true);
      setSubmissions(filtered.filter((s) => s.hackathonSlug === slug && s.userId === user.id));
    } catch {
      setError("제출 중 오류가 발생했습니다. 다시 시도해주세요.");
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
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
              setFiles({});
            }}
          >
            다시 제출하기
          </Button>
        </div>
      ) : (
        /* 로그인 상태 + 진행 중 → 제출 폼 */
        submit.submissionItems && (
          <div className="space-y-6">
            {/* 제출 항목 폼 */}
            <div className="rounded-xl border border-gray-200 p-6 dark:border-gray-800">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    제출 항목
                  </h3>
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    {user.name}님으로 로그인됨
                  </span>
                </div>
                <div className="text-right text-sm text-gray-600 dark:text-gray-400">
                  <p className="font-medium">오늘 제출: {submissionCount} / {maxSubmissionsPerDay}회</p>
                  {draftExists && (
                    <p className="mt-1 text-yellow-600 dark:text-yellow-400">
                      ⚠️ 임시저장된 내용이 있습니다
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-5">
                {submit.submissionItems.map(
                  (item: { key: string; title: string; format: string }) => (
                    <div
                      key={item.key}
                      className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800"
                    >
                      <div className="mb-3">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {item.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          형식: {item.format}
                        </p>
                      </div>

                      {/* 텍스트 입력 */}
                      <input
                        type="text"
                        value={formValues[item.key] || ""}
                        onChange={(e) => handleInputChange(item.key, e.target.value)}
                        placeholder="URL 또는 내용 입력"
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm mb-3 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                      />

                      {/* 파일 업로드 */}
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg border border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                          <span>📎 파일 업로드</span>
                          <input
                            type="file"
                            accept=".csv,.json,.txt,.zip"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                handleFileChange(item.key, e.target.files[0]);
                              }
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {/* 업로드된 파일 정보 */}
                      {files[item.key] && (
                        <div className="mt-3 flex items-center justify-between rounded-lg bg-blue-50 px-3 py-2 dark:bg-blue-900/20">
                          <div className="text-sm">
                            <p className="font-medium text-blue-900 dark:text-blue-300">
                              {files[item.key].name}
                            </p>
                            <p className="text-xs text-blue-700 dark:text-blue-400">
                              {formatFileSize(files[item.key].size)}
                            </p>
                          </div>
                          <button
                            onClick={() => handleRemoveFile(item.key)}
                            className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
                          >
                            제거
                          </button>
                        </div>
                      )}
                    </div>
                  )
                )}
              </div>

              {error && (
                <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                  {error}
                </div>
              )}

              <div className="mt-6 flex gap-3">
                <Button
                  onClick={handleSubmit}
                  disabled={isLimitReached}
                  className={isLimitReached ? "opacity-50 cursor-not-allowed" : ""}
                >
                  제출하기
                </Button>
                <Button variant="secondary" onClick={handleDraftSave}>
                  임시저장
                </Button>
              </div>
            </div>

            {/* 제출 이력 */}
            {submissions.length > 0 && (
              <div className="rounded-xl border border-gray-200 p-6 dark:border-gray-800">
                <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                  제출 이력
                </h3>
                <div className="space-y-3">
                  {submissions
                    .sort((a, b) => b.version - a.version)
                    .map((sub) => (
                      <div
                        key={sub.version}
                        className="rounded-lg border border-gray-200 dark:border-gray-700"
                      >
                        <button
                          onClick={() =>
                            setExpandedHistory(
                              expandedHistory === sub.version ? null : sub.version
                            )
                          }
                          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
                        >
                          <div className="flex items-center gap-3 flex-1 text-left">
                            <span className="text-lg">
                              {sub.status === "draft" ? "📝" : "✓"}
                            </span>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900 dark:text-white">
                                버전 {sub.version}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {timeAgo(sub.savedAt)}
                              </p>
                            </div>
                            <Badge
                              variant={sub.status === "draft" ? "warning" : "success"}
                            >
                              {sub.status === "draft" ? "임시저장" : "제출됨"}
                            </Badge>
                          </div>
                          <span className="ml-2 text-gray-400">
                            {expandedHistory === sub.version ? "▼" : "▶"}
                          </span>
                        </button>

                        {/* 상세 정보 */}
                        {expandedHistory === sub.version && (
                          <div className="border-t border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800/50">
                            <div className="text-sm space-y-2">
                              <div>
                                <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  제출 시간
                                </p>
                                <p className="text-gray-600 dark:text-gray-400">
                                  {formatDateTime(sub.savedAt)}
                                </p>
                              </div>
                              <div>
                                <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  제출 내용
                                </p>
                                <div className="space-y-1">
                                  {sub.items.map((item) => (
                                    <div
                                      key={item.key}
                                      className="text-xs text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900 rounded px-2 py-1"
                                    >
                                      <span className="font-medium">{item.title}:</span>{" "}
                                      <span className="break-words">{item.value}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              {sub.files && Object.keys(sub.files).length > 0 && (
                                <div>
                                  <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    업로드된 파일
                                  </p>
                                  <div className="space-y-1">
                                    {Object.entries(sub.files).map(([key, file]) => (
                                      <div
                                        key={key}
                                        className="text-xs text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900 rounded px-2 py-1"
                                      >
                                        <span className="font-medium">{file.name}</span> (
                                        {formatFileSize(file.size)})
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
}
