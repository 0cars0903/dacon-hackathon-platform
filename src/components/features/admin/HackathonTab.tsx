"use client";

import { type Dispatch, type SetStateAction } from "react";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import type { HackathonForm } from "@/app/admin/page";

interface HackathonTabProps {
  form: HackathonForm;
  setForm: Dispatch<SetStateAction<HackathonForm>>;
  editingHackathon: string | null;
  setEditingHackathon: (slug: string | null) => void;
  createdHackathons: HackathonForm[];
  confirmDeleteHackathon: string | null;
  setConfirmDeleteHackathon: (slug: string | null) => void;
  aiGenerating: "banner" | "overview" | null;
  setAiGenerating: (state: "banner" | "overview" | null) => void;
  generatedBannerUrl: string | null;
  setGeneratedBannerUrl: (url: string | null) => void;
  handleSaveHackathon: () => void;
  handleCancelEdit: () => void;
  handleEditHackathon: (slug: string) => void;
  handleDeleteHackathon: (slug: string) => void;
  handleChangeHackathonStatus: (slug: string, status: "upcoming" | "ongoing" | "ended") => void;
  showToast: (message: string) => void;
}

export function HackathonTab({
  form,
  setForm,
  editingHackathon,
  setEditingHackathon,
  createdHackathons,
  confirmDeleteHackathon,
  setConfirmDeleteHackathon,
  aiGenerating,
  setAiGenerating,
  generatedBannerUrl,
  setGeneratedBannerUrl,
  handleSaveHackathon,
  handleCancelEdit,
  handleEditHackathon,
  handleDeleteHackathon,
  handleChangeHackathonStatus,
  showToast,
}: HackathonTabProps) {
  return (
    <div className="space-y-6">
      {/* 생성/수정 폼 */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          {editingHackathon ? "해커톤 수정" : "새 해커톤 생성"}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">제목 *</label>
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white" placeholder="해커톤 제목" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">슬러그 (URL) *</label>
            <input type="text" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white" placeholder="my-hackathon-2026" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">상태</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as HackathonForm["status"] })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white">
              <option value="upcoming">예정</option>
              <option value="ongoing">진행중</option>
              <option value="ended">종료</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">태그 (쉼표 구분)</label>
            <input type="text" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white" placeholder="AI, Web, Data" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">제출 마감일</label>
            <input type="datetime-local" value={form.submissionDeadlineAt} onChange={(e) => setForm({ ...form, submissionDeadlineAt: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">종료일</label>
            <input type="datetime-local" value={form.endAt} onChange={(e) => setForm({ ...form, endAt: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-gray-500">설명</label>
            <textarea value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white" rows={3} placeholder="해커톤 설명" />
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                onClick={async () => {
                  if (!form.title.trim()) { showToast("제목을 먼저 입력해주세요."); return; }
                  setAiGenerating("overview");
                  // Claude Sonnet 4.6 API를 통한 개요 자동 생성 (시뮬레이션)
                  await new Promise((r) => setTimeout(r, 1500));
                  const generated = `${form.title}은(는) 참가자들이 혁신적인 솔루션을 개발하고 실력을 겨루는 해커톤입니다.\n\n주요 목표:\n- 실무 데이터를 활용한 문제 해결 능력 향상\n- 팀 협업을 통한 프로젝트 완성도 제고\n- 최신 AI/ML 기술 적용 경험\n\n참가자들은 주어진 기간 내에 데이터 분석, 모델 개발, 결과 시각화까지 전 과정을 수행하게 됩니다.${form.tags ? `\n\n관련 기술: ${form.tags}` : ""}`;
                  setForm((prev) => ({ ...prev, summary: generated }));
                  setAiGenerating(null);
                  showToast("AI가 개요를 생성했습니다. (Claude Sonnet 4.6)");
                }}
                disabled={aiGenerating !== null}
                className="flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-600 hover:bg-purple-100 disabled:opacity-50 dark:border-purple-800 dark:bg-purple-900/20 dark:text-purple-400"
              >
                {aiGenerating === "overview" ? (
                  <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
                ) : (
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                )}
                AI 개요 생성 (Claude Sonnet 4.6)
              </button>
              <button
                onClick={async () => {
                  if (!form.title.trim()) { showToast("제목을 먼저 입력해주세요."); return; }
                  setAiGenerating("banner");
                  // Gemini Nano Banna API를 통한 배너 이미지 생성 (시뮬레이션)
                  await new Promise((r) => setTimeout(r, 2000));
                  // 생성된 배너를 시뮬레이션 (그라디언트 기반 SVG 이미지)
                  const colors = ["#3B82F6", "#8B5CF6", "#EC4899", "#10B981", "#F59E0B"];
                  const c1 = colors[Math.floor(Math.random() * colors.length)];
                  const c2 = colors[Math.floor(Math.random() * colors.length)];
                  const svgBanner = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:${c1}"/><stop offset="100%" style="stop-color:${c2}"/></linearGradient></defs><rect width="800" height="400" fill="url(#g)"/><text x="400" y="180" text-anchor="middle" fill="white" font-size="36" font-weight="bold" font-family="sans-serif">${form.title.slice(0, 30)}</text><text x="400" y="230" text-anchor="middle" fill="rgba(255,255,255,0.8)" font-size="18" font-family="sans-serif">DACON Hackathon Platform</text></svg>`)}`;
                  setGeneratedBannerUrl(svgBanner);
                  setAiGenerating(null);
                  showToast("AI가 배너를 생성했습니다. (Gemini Nano Banna)");
                }}
                disabled={aiGenerating !== null}
                className="flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-600 hover:bg-green-100 disabled:opacity-50 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400"
              >
                {aiGenerating === "banner" ? (
                  <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
                ) : (
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                )}
                AI 배너 생성 (Gemini Nano Banna)
              </button>
            </div>
            {generatedBannerUrl && (
              <div className="mt-3">
                <p className="mb-1 text-xs text-gray-500">생성된 배너 미리보기:</p>
                <img src={generatedBannerUrl} alt="Generated Banner" className="w-full max-w-md rounded-lg border border-gray-200 dark:border-gray-700" />
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">최대 팀 인원</label>
              <input type="number" min={1} max={10} value={form.maxTeamSize} onChange={(e) => setForm({ ...form, maxTeamSize: Number(e.target.value) })} className="w-24 rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
            </div>
            <div className="pt-4">
              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <input type="checkbox" checked={form.allowSolo} onChange={(e) => setForm({ ...form, allowSolo: e.target.checked })} className="rounded" />
                개인 참가 허용
              </label>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">평가 지표명</label>
            <input type="text" value={form.metricName} onChange={(e) => setForm({ ...form, metricName: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white" placeholder="Accuracy" />
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <Button onClick={handleSaveHackathon}>
            {editingHackathon ? "수정 완료" : "해커톤 생성"}
          </Button>
          {editingHackathon && (
            <Button variant="secondary" onClick={handleCancelEdit}>
              취소
            </Button>
          )}
        </div>
      </section>

      {/* 생성된 해커톤 목록 */}
      <section>
        <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">생성된 해커톤 ({createdHackathons.length})</h3>
        {createdHackathons.length === 0 ? (
          <p className="text-sm text-gray-400">아직 생성된 해커톤이 없습니다.</p>
        ) : (
          <div className="space-y-2">
            {[...createdHackathons]
              .sort((a, b) => {
                const dateA = new Date(a.createdAt || 0).getTime();
                const dateB = new Date(b.createdAt || 0).getTime();
                return dateB - dateA;
              })
              .map((h) => (
                <div key={h.slug} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{h.title}</p>
                      <Badge variant={h.status === "ongoing" ? "success" : h.status === "upcoming" ? "info" : "muted"} size="sm">
                        {h.status === "ongoing" ? "진행중" : h.status === "upcoming" ? "예정" : "종료"}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-400">/{h.slug}</p>
                    {h.submissionDeadlineAt && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        마감일: {new Date(h.submissionDeadlineAt).toLocaleDateString("ko-KR")}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={h.status}
                      onChange={(e) =>
                        handleChangeHackathonStatus(
                          h.slug,
                          e.target.value as "upcoming" | "ongoing" | "ended"
                        )
                      }
                      className="rounded border border-gray-200 px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                      title="직접 상태 변경"
                    >
                      <option value="upcoming">예정</option>
                      <option value="ongoing">진행중</option>
                      <option value="ended">종료</option>
                    </select>
                    <button
                      onClick={() => handleEditHackathon(h.slug)}
                      className="text-xs text-blue-600 hover:underline dark:text-blue-400 font-medium"
                    >
                      수정
                    </button>
                    {confirmDeleteHackathon === h.slug ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDeleteHackathon(h.slug)}
                          className="text-xs font-medium text-red-600 hover:underline dark:text-red-400"
                        >
                          확인
                        </button>
                        <button
                          onClick={() => setConfirmDeleteHackathon(null)}
                          className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          취소
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteHackathon(h.slug)}
                        className="text-xs text-red-500 hover:underline dark:text-red-400"
                      >
                        삭제
                      </button>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}
      </section>
    </div>
  );
}
