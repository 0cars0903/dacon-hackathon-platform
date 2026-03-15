"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getHackathonDetail, getHackathonBySlug, logActivity, addNotification } from "@/lib/supabase/data";
import {
  hasGroundTruth,
  getGroundTruth,
  scoreSubmission,
  saveScoredSubmission,
  getScoredSubmissions,
  generateSampleCSV,
  type ScoringResult,
  type ScoredSubmission,
} from "@/lib/scoring";
import { useAuth } from "@/components/features/AuthProvider";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { EmptyState } from "@/components/common/EmptyState";
import { formatDateTime, timeAgo } from "@/lib/utils";
import type { HackathonDetail, Hackathon } from "@/types";

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
  const slug = (params.slug as string) || "";
  const [detail, setDetail] = useState<HackathonDetail | null>(null);
  const [hackathon, setHackathon] = useState<Hackathon | null>(null);
  useEffect(() => { const load = async () => { setDetail(await getHackathonDetail(slug)); setHackathon(await getHackathonBySlug(slug)); }; load(); }, [slug]);
  const { user } = useAuth();

  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<Record<string, SubmissionFile>>({});
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [draftExists, setDraftExists] = useState(false);
  const [expandedHistory, setExpandedHistory] = useState<number | null>(null);
  const [submissions, setSubmissions] = useState<StoredSubmission[]>([]);
  const [submissionCount, setSubmissionCount] = useState(0);

  // 자동 채점 관련
  const isAutoScored = hasGroundTruth(slug);
  const gt = isAutoScored ? getGroundTruth(slug) : null;
  const [csvText, setCsvText] = useState<string>("");
  const [csvFileName, setCsvFileName] = useState<string>("");
  const [scoringResult, setScoringResult] = useState<ScoringResult | null>(null);
  const [isScoring, setIsScoring] = useState(false);
  const [scoredHistory, setScoredHistory] = useState<ScoredSubmission[]>([]);
  const [expandedScoreHistory, setExpandedScoreHistory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"submit" | "history">("submit");

  const maxSubmissionsPerDay = detail?.sections.eval.limits?.maxSubmissionsPerDay || 10;

  useEffect(() => {
    if (!user) return;

    try {
      const stored = localStorage.getItem("dacon_submissions");
      const allSubmissions = stored ? JSON.parse(stored) : [];
      const userSubmissions = allSubmissions.filter(
        (s: StoredSubmission) => s.hackathonSlug === slug && s.userId === user.id
      );
      setSubmissions(userSubmissions);

      const today = new Date().toDateString();
      const todaySubmissions = userSubmissions.filter((s: StoredSubmission) => {
        const submittedDate = new Date(s.savedAt).toDateString();
        return s.status === "submitted" && submittedDate === today;
      });
      setSubmissionCount(todaySubmissions.length);

      const latestDraft = userSubmissions.find((s: StoredSubmission) => s.status === "draft");
      if (latestDraft) {
        setDraftExists(true);
        const draftValues: Record<string, string> = {};
        latestDraft.items.forEach((item: { key: string; value: string }) => {
          draftValues[item.key] = item.value;
        });
        setFormValues(draftValues);
        if (latestDraft.files) setFiles(latestDraft.files);
      }

      // 채점 이력 로드
      if (isAutoScored) {
        setScoredHistory(getScoredSubmissions(slug, user.id));
      }
    } catch {
      console.error("Failed to load submissions from localStorage");
    }
  }, [user, slug, isAutoScored]);

  if (!detail) {
    return <EmptyState emoji="📤" title="제출 정보를 불러올 수 없습니다" />;
  }

  const { submit } = detail.sections;
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
    if (file.size > MAX_FILE_SIZE) { setError("파일 크기는 5MB 이하여야 합니다."); return; }
    if (!ALLOWED_FILE_TYPES.includes(file.type)) { setError("CSV, JSON, TXT, ZIP 파일만 업로드할 수 있습니다."); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result as string;
      setFiles((prev) => ({ ...prev, [key]: { name: file.name, size: file.size, type: file.type, data } }));
      setError("");
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = (key: string) => {
    setFiles((prev) => { const updated = { ...prev }; delete updated[key]; return updated; });
  };

  // CSV 파일 업로드 (자동 채점용)
  const handleCSVUpload = (file: File) => {
    if (file.size > MAX_FILE_SIZE) { setError("파일 크기는 5MB 이하여야 합니다."); return; }
    setCsvFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setCsvText(text);
      setScoringResult(null);
      setError("");
    };
    reader.readAsText(file);
  };

  // 자동 채점 실행
  const handleAutoScore = () => {
    if (!csvText || !user) return;
    setIsScoring(true);
    setScoringResult(null);

    // 약간의 딜레이로 채점 "처리" 느낌
    setTimeout(() => {
      const result = scoreSubmission(slug, csvText);
      setScoringResult(result);
      setIsScoring(false);

      if (result.success) {
        // 채점 결과 저장 + 리더보드 업데이트
        const version = scoredHistory.length + 1;
        const csvLines = csvText.trim().split(/\r?\n/).length - 1;

        // 팀 이름 조회
        const teamsRaw = localStorage.getItem("dacon_teams");
        const teams = teamsRaw ? JSON.parse(teamsRaw) : [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const myTeam = teams.find((t: any) =>
          t.hackathonSlug === slug &&
          t.members?.some((m: { userId: string }) => m.userId === user.id)
        );

        saveScoredSubmission(
          slug,
          user.id,
          user.name,
          myTeam?.name,
          version,
          result,
          csvLines
        );
        setScoredHistory(getScoredSubmissions(slug, user.id));

        // 활동 로그 + 알림
        logActivity({
          type: "submission",
          message: `${user.name}님이 예측 결과를 제출했습니다. (Score: ${result.finalScore})`,
          timestamp: new Date().toISOString(),
          hackathonSlug: slug,
        });
        addNotification(user.id, {
          message: `채점 완료! 점수: ${result.finalScore}점 (${slug})`,
          type: "success",
          link: `/hackathons/${slug}/leaderboard`,
        });

        setSubmissionCount((c) => c + 1);
      }
    }, 1500);
  };

  const handleDraftSave = () => {
    if (!user || !submit.submissionItems) return;
    const existing = localStorage.getItem("dacon_submissions");
    const allSubmissions: StoredSubmission[] = existing ? JSON.parse(existing) : [];
    const userHackathonSubmissions = allSubmissions.filter((s) => s.hackathonSlug === slug && s.userId === user.id);
    const nextVersion = userHackathonSubmissions.length > 0 ? Math.max(...userHackathonSubmissions.map((s) => s.version)) + 1 : 1;
    const draft: StoredSubmission = {
      hackathonSlug: slug, userId: user.id, userName: user.name, version: nextVersion,
      items: submit.submissionItems.map((item: { key: string; title: string }) => ({
        key: item.key, title: item.title, value: formValues[item.key] || "",
      })),
      files: Object.keys(files).length > 0 ? files : undefined,
      status: "draft", savedAt: new Date().toISOString(),
    };
    try {
      const filtered = allSubmissions.filter((s) => !(s.hackathonSlug === slug && s.userId === user.id && s.status === "draft"));
      filtered.push(draft);
      localStorage.setItem("dacon_submissions", JSON.stringify(filtered));
      setDraftExists(true);
      setError("");
    } catch { setError("임시저장 중 오류가 발생했습니다."); }
  };

  const handleSubmit = () => {
    if (!user || !submit.submissionItems) return;
    const emptyItems = submit.submissionItems.filter((item: { key: string }) => !formValues[item.key]?.trim());
    if (emptyItems.length > 0) { setError("모든 항목을 입력해주세요."); return; }
    if (isLimitReached) { setError(`하루 제출 횟수 제한(${maxSubmissionsPerDay}회)에 도달했습니다.`); return; }

    const existing = localStorage.getItem("dacon_submissions");
    const allSubmissions: StoredSubmission[] = existing ? JSON.parse(existing) : [];
    const userHackathonSubmissions = allSubmissions.filter((s) => s.hackathonSlug === slug && s.userId === user.id);
    const nextVersion = userHackathonSubmissions.length > 0 ? Math.max(...userHackathonSubmissions.map((s) => s.version)) + 1 : 1;
    const submission: StoredSubmission = {
      hackathonSlug: slug, userId: user.id, userName: user.name, version: nextVersion,
      items: submit.submissionItems.map((item: { key: string; title: string }) => ({
        key: item.key, title: item.title, value: formValues[item.key],
      })),
      files: Object.keys(files).length > 0 ? files : undefined,
      status: "submitted", savedAt: new Date().toISOString(),
    };
    try {
      const filtered = allSubmissions.filter((s) => !(s.hackathonSlug === slug && s.userId === user.id && s.status === "draft"));
      filtered.push(submission);
      localStorage.setItem("dacon_submissions", JSON.stringify(filtered));
      setSubmitted(true);
      setSubmissions(filtered.filter((s) => s.hackathonSlug === slug && s.userId === user.id));
      logActivity({ type: "submission", message: `${user.name}님이 결과물을 제출했습니다. (v${nextVersion})`, timestamp: new Date().toISOString(), hackathonSlug: slug });
    } catch { setError("제출 중 오류가 발생했습니다. 다시 시도해주세요."); }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const sampleCSV = isAutoScored ? generateSampleCSV(slug) : null;

  // 상태별 분기: 비로그인/예정/종료
  if (isUpcoming) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border-2 border-dashed border-yellow-300 bg-yellow-50 p-8 text-center dark:border-yellow-700 dark:bg-yellow-900/20">
          <p className="text-3xl mb-3">⏳</p>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">아직 제출 기간이 아닙니다</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">해커톤이 시작되면 이곳에서 제출할 수 있습니다.</p>
        </div>
      </div>
    );
  }
  if (isEnded || isPastDeadline) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-900">
          <p className="text-3xl mb-3">🏁</p>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">제출이 마감되었습니다</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">리더보드에서 결과를 확인하세요.</p>
        </div>
      </div>
    );
  }
  if (!user) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border-2 border-dashed border-blue-300 bg-blue-50 p-8 text-center dark:border-blue-700 dark:bg-blue-900/20">
          <p className="text-3xl mb-3">🔒</p>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">로그인이 필요합니다</h3>
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">제출하려면 먼저 로그인해주세요.</p>
          <Link href="/login"><Button>로그인하기</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 제출 가이드 */}
      <div className="rounded-xl bg-gray-50 p-6 dark:bg-gray-900">
        <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">제출 가이드</h3>
        <ul className="space-y-2">
          {submit.guide.map((g: string, i: number) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
              <span className="font-medium text-blue-500">{i + 1}.</span>{g}
            </li>
          ))}
        </ul>
      </div>

      {/* 자동 채점이 가능한 해커톤일 경우 */}
      {isAutoScored && gt ? (
        <div className="space-y-6">
          {/* 자동 채점 안내 */}
          <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-6 dark:border-blue-800 dark:bg-blue-900/20">
            <div className="flex items-start gap-3">
              <span className="text-3xl">🤖</span>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">자동 채점 지원</h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  이 해커톤은 CSV 예측 파일을 업로드하면 자동으로 채점됩니다.
                  {gt.taskType === "classification" ? " 분류(Classification) 태스크로 Accuracy, Macro F1 등이 계산됩니다." : " 회귀(Regression) 태스크로 RMSE, MAE, R² 등이 계산됩니다."}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant="info">{gt.taskType === "classification" ? "분류" : "회귀"}</Badge>
                  <Badge variant="muted">{gt.samples.length}개 샘플</Badge>
                  {gt.classLabels && <Badge variant="muted">{gt.numClasses}개 클래스</Badge>}
                  <Badge variant="success">자동 리더보드 반영</Badge>
                </div>
              </div>
            </div>
          </div>

          {/* 탭 */}
          <div className="flex gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
            <button onClick={() => setActiveTab("submit")} className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${activeTab === "submit" ? "bg-white text-gray-900 shadow dark:bg-gray-700 dark:text-white" : "text-gray-500 hover:text-gray-700 dark:text-gray-400"}`}>
              예측 제출
            </button>
            <button onClick={() => setActiveTab("history")} className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${activeTab === "history" ? "bg-white text-gray-900 shadow dark:bg-gray-700 dark:text-white" : "text-gray-500 hover:text-gray-700 dark:text-gray-400"}`}>
              채점 이력 ({scoredHistory.length})
            </button>
          </div>

          {activeTab === "submit" && (
            <div className="space-y-6">
              {/* 제출 형식 안내 */}
              <div className="rounded-xl border border-gray-200 p-6 dark:border-gray-800">
                <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">CSV 형식 안내</h3>
                <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
                  아래 형식에 맞춰 CSV 파일을 제출하세요. 첫 행은 헤더, 이후 행은 예측값입니다.
                </p>
                {sampleCSV && (
                  <pre className="rounded-lg bg-gray-900 p-4 text-xs text-green-400 overflow-x-auto">{sampleCSV}</pre>
                )}
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-xs text-gray-400">오늘 제출: {submissionCount} / {maxSubmissionsPerDay}회</p>
                </div>
              </div>

              {/* CSV 파일 업로드 */}
              <div className="rounded-xl border border-gray-200 p-6 dark:border-gray-800">
                <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">예측 CSV 업로드</h3>
                <label className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors dark:border-gray-600 dark:bg-gray-800 dark:hover:border-blue-500 dark:hover:bg-blue-900/20">
                  <span className="text-4xl">{csvFileName ? "📄" : "📁"}</span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {csvFileName ? csvFileName : "CSV 파일을 선택하세요"}
                  </span>
                  <span className="text-xs text-gray-400">최대 5MB, .csv 형식</span>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => { if (e.target.files?.[0]) handleCSVUpload(e.target.files[0]); }}
                    className="hidden"
                  />
                </label>

                {csvText && (
                  <div className="mt-4">
                    <p className="mb-2 text-xs text-gray-500">
                      미리보기 (처음 5행):
                    </p>
                    <pre className="max-h-32 overflow-auto rounded-lg bg-gray-100 p-3 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                      {csvText.split("\n").slice(0, 6).join("\n")}
                    </pre>
                  </div>
                )}

                {error && (
                  <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">{error}</div>
                )}

                <div className="mt-4 flex gap-3">
                  <Button
                    onClick={handleAutoScore}
                    disabled={!csvText || isScoring || isLimitReached}
                    className={isLimitReached || !csvText ? "opacity-50 cursor-not-allowed" : ""}
                  >
                    {isScoring ? "채점 중..." : "제출 및 채점"}
                  </Button>
                </div>
              </div>

              {/* 채점 결과 */}
              {isScoring && (
                <div className="rounded-xl border-2 border-blue-300 bg-blue-50 p-8 text-center dark:border-blue-700 dark:bg-blue-900/20">
                  <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
                  <p className="mt-4 text-sm font-medium text-gray-700 dark:text-gray-300">Ground Truth와 비교하여 채점 중...</p>
                </div>
              )}

              {scoringResult && !isScoring && (
                <div className={`rounded-xl border-2 p-6 ${scoringResult.success ? "border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/20" : "border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/20"}`}>
                  {scoringResult.success ? (
                    <div className="space-y-6">
                      {/* 최종 점수 */}
                      <div className="text-center">
                        <p className="text-sm text-green-700 dark:text-green-400">채점 완료</p>
                        <p className="mt-1 text-5xl font-bold text-green-800 dark:text-green-300">{scoringResult.finalScore}</p>
                        <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                          {scoringResult.matchedSamples} / {scoringResult.totalSamples} 샘플 매칭됨
                        </p>
                      </div>

                      {/* 메트릭 상세 */}
                      {scoringResult.taskType === "classification" && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-3">
                            <MetricCard label="Accuracy" value={`${scoringResult.accuracy}%`} />
                            <MetricCard label="Macro F1" value={`${scoringResult.macroF1}%`} />
                          </div>

                          {scoringResult.scoreBreakdown && (
                            <div className="grid grid-cols-3 gap-3">
                              <MetricCard label="정확도 점수" value={`${scoringResult.scoreBreakdown.accuracy}%`} sub="가중치 60%" />
                              <MetricCard label="속도 점수" value={`${scoringResult.scoreBreakdown.speed}%`} sub="가중치 40%" />
                              <MetricCard label="추론 시간" value={`${scoringResult.scoreBreakdown.latency}s`} sub="시뮬레이션" />
                            </div>
                          )}

                          {/* 클래스별 상세 */}
                          {scoringResult.perClassMetrics && (
                            <div>
                              <h4 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">클래스별 성능</h4>
                              <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="border-b border-gray-200 dark:border-gray-700">
                                      <th className="py-2 text-left font-medium text-gray-600 dark:text-gray-400">클래스</th>
                                      <th className="py-2 text-right font-medium text-gray-600 dark:text-gray-400">Precision</th>
                                      <th className="py-2 text-right font-medium text-gray-600 dark:text-gray-400">Recall</th>
                                      <th className="py-2 text-right font-medium text-gray-600 dark:text-gray-400">F1</th>
                                      <th className="py-2 text-right font-medium text-gray-600 dark:text-gray-400">Support</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {scoringResult.perClassMetrics.map((m) => (
                                      <tr key={m.label} className="border-b border-gray-100 dark:border-gray-800">
                                        <td className="py-2 font-mono text-xs text-gray-900 dark:text-white">{m.label}</td>
                                        <td className="py-2 text-right text-gray-700 dark:text-gray-300">{m.precision}%</td>
                                        <td className="py-2 text-right text-gray-700 dark:text-gray-300">{m.recall}%</td>
                                        <td className="py-2 text-right font-medium text-gray-900 dark:text-white">{m.f1}%</td>
                                        <td className="py-2 text-right text-gray-500 dark:text-gray-400">{m.support}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {scoringResult.taskType === "regression" && (
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                          <MetricCard label="RMSE" value={String(scoringResult.rmse)} sub="낮을수록 좋음" />
                          <MetricCard label="MAE" value={String(scoringResult.mae)} sub="낮을수록 좋음" />
                          <MetricCard label="R²" value={String(scoringResult.r2)} sub="1에 가까울수록 좋음" />
                          <MetricCard label="MAPE" value={`${scoringResult.mape}%`} sub="낮을수록 좋음" />
                        </div>
                      )}

                      <div className="text-center">
                        <Link href={`/hackathons/${slug}/leaderboard`}>
                          <Button variant="secondary">리더보드 확인</Button>
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-3xl mb-3">❌</p>
                      <h3 className="text-lg font-semibold text-red-800 dark:text-red-300">채점 실패</h3>
                      <p className="mt-2 text-sm text-red-600 dark:text-red-400">{scoringResult.error}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === "history" && (
            <div className="space-y-3">
              {scoredHistory.length === 0 ? (
                <div className="rounded-xl border border-gray-200 py-12 text-center dark:border-gray-700">
                  <p className="text-4xl">📊</p>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">아직 채점 이력이 없습니다.</p>
                </div>
              ) : (
                scoredHistory.map((s) => (
                  <div key={s.id} className="rounded-xl border border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => setExpandedScoreHistory(expandedScoreHistory === s.id ? null : s.id)}
                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{s.scoringResult.finalScore}</span>
                        <div className="text-left">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">v{s.version}</p>
                          <p className="text-xs text-gray-500">{timeAgo(s.submittedAt)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={s.scoringResult.success ? "success" : "muted"}>
                          {s.scoringResult.success ? "성공" : "실패"}
                        </Badge>
                        <span className="text-gray-400">{expandedScoreHistory === s.id ? "▼" : "▶"}</span>
                      </div>
                    </button>
                    {expandedScoreHistory === s.id && s.scoringResult.scoreBreakdown && (
                      <div className="border-t border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800/50">
                        <div className="grid grid-cols-3 gap-3 text-xs">
                          {Object.entries(s.scoringResult.scoreBreakdown).map(([key, value]) => (
                            <div key={key} className="text-center">
                              <p className="font-medium text-gray-900 dark:text-white">{String(value)}</p>
                              <p className="text-gray-500">{key}</p>
                            </div>
                          ))}
                        </div>
                        <p className="mt-2 text-xs text-gray-400">
                          {formatDateTime(s.submittedAt)} | {s.csvRowCount}행 | {s.scoringResult.matchedSamples}/{s.scoringResult.totalSamples} 매칭
                        </p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      ) : (
        /* 일반 제출 (자동 채점 없음) */
        <>
          <div className="rounded-xl border border-gray-200 p-6 dark:border-gray-800">
            <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">제출 형식</h3>
            <div className="flex flex-wrap gap-2">
              {submit.allowedArtifactTypes.map((type: string) => <Badge key={type} variant="info">{type.toUpperCase()}</Badge>)}
            </div>
          </div>

          {submitted ? (
            <div className="rounded-xl border-2 border-green-300 bg-green-50 p-8 text-center dark:border-green-700 dark:bg-green-900/20">
              <p className="text-3xl mb-3">✅</p>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">제출이 완료되었습니다!</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{user.name}님의 결과물이 성공적으로 제출되었습니다.</p>
              <Button variant="secondary" onClick={() => { setSubmitted(false); setFormValues({}); setFiles({}); }}>다시 제출하기</Button>
            </div>
          ) : submit.submissionItems && (
            <div className="space-y-6">
              <div className="rounded-xl border border-gray-200 p-6 dark:border-gray-800">
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">제출 항목</h3>
                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">{user.name}님으로 로그인됨</span>
                  </div>
                  <div className="text-right text-sm text-gray-600 dark:text-gray-400">
                    <p className="font-medium">오늘 제출: {submissionCount} / {maxSubmissionsPerDay}회</p>
                    {draftExists && <p className="mt-1 text-yellow-600 dark:text-yellow-400">⚠️ 임시저장된 내용이 있습니다</p>}
                  </div>
                </div>
                <div className="space-y-5">
                  {submit.submissionItems.map((item: { key: string; title: string; format: string }) => (
                    <div key={item.key} className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                      <div className="mb-3">
                        <p className="font-medium text-gray-900 dark:text-white">{item.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">형식: {item.format}</p>
                      </div>
                      <input type="text" value={formValues[item.key] || ""} onChange={(e) => handleInputChange(item.key, e.target.value)} placeholder="URL 또는 내용 입력" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm mb-3 dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg border border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                          <span>📎 파일 업로드</span>
                          <input type="file" accept=".csv,.json,.txt,.zip" onChange={(e) => { if (e.target.files?.[0]) handleFileChange(item.key, e.target.files[0]); }} className="hidden" />
                        </label>
                      </div>
                      {files[item.key] && (
                        <div className="mt-3 flex items-center justify-between rounded-lg bg-blue-50 px-3 py-2 dark:bg-blue-900/20">
                          <div className="text-sm">
                            <p className="font-medium text-blue-900 dark:text-blue-300">{files[item.key].name}</p>
                            <p className="text-xs text-blue-700 dark:text-blue-400">{formatFileSize(files[item.key].size)}</p>
                          </div>
                          <button onClick={() => handleRemoveFile(item.key)} className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline">제거</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {error && <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">{error}</div>}
                <div className="mt-6 flex gap-3">
                  <Button onClick={handleSubmit} disabled={isLimitReached} className={isLimitReached ? "opacity-50 cursor-not-allowed" : ""}>제출하기</Button>
                  <Button variant="secondary" onClick={handleDraftSave}>임시저장</Button>
                </div>
              </div>

              {submissions.length > 0 && (
                <div className="rounded-xl border border-gray-200 p-6 dark:border-gray-800">
                  <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">제출 이력</h3>
                  <div className="space-y-3">
                    {submissions.sort((a, b) => b.version - a.version).map((sub) => (
                      <div key={sub.version} className="rounded-lg border border-gray-200 dark:border-gray-700">
                        <button onClick={() => setExpandedHistory(expandedHistory === sub.version ? null : sub.version)} className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                          <div className="flex items-center gap-3 flex-1 text-left">
                            <span className="text-lg">{sub.status === "draft" ? "📝" : "✓"}</span>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900 dark:text-white">버전 {sub.version}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{timeAgo(sub.savedAt)}</p>
                            </div>
                            <Badge variant={sub.status === "draft" ? "warning" : "success"}>{sub.status === "draft" ? "임시저장" : "제출됨"}</Badge>
                          </div>
                          <span className="ml-2 text-gray-400">{expandedHistory === sub.version ? "▼" : "▶"}</span>
                        </button>
                        {expandedHistory === sub.version && (
                          <div className="border-t border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800/50">
                            <div className="text-sm space-y-2">
                              <div><p className="font-medium text-gray-700 dark:text-gray-300 mb-1">제출 시간</p><p className="text-gray-600 dark:text-gray-400">{formatDateTime(sub.savedAt)}</p></div>
                              <div><p className="font-medium text-gray-700 dark:text-gray-300 mb-1">제출 내용</p>
                                <div className="space-y-1">{sub.items.map((item) => (<div key={item.key} className="text-xs text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900 rounded px-2 py-1"><span className="font-medium">{item.title}:</span> <span className="break-words">{item.value}</span></div>))}</div>
                              </div>
                              {sub.files && Object.keys(sub.files).length > 0 && (
                                <div><p className="font-medium text-gray-700 dark:text-gray-300 mb-1">업로드된 파일</p>
                                  <div className="space-y-1">{Object.entries(sub.files).map(([key, file]) => (<div key={key} className="text-xs text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900 rounded px-2 py-1"><span className="font-medium">{file.name}</span> ({formatFileSize(file.size)})</div>))}</div>
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
          )}
        </>
      )}
    </div>
  );
}

function MetricCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg bg-white p-3 text-center shadow-sm dark:bg-gray-800">
      <p className="text-lg font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-xs font-medium text-gray-600 dark:text-gray-400">{label}</p>
      {sub && <p className="text-[10px] text-gray-400">{sub}</p>}
    </div>
  );
}
