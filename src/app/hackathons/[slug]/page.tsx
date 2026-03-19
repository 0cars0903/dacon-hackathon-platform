"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { getHackathonBySlug, getHackathonDetail, getTeamsByHackathon, getLeaderboard } from "@/lib/supabase/data";
import { useAuth } from "@/components/features/AuthProvider";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { formatDate, getDday, formatDateTime } from "@/lib/utils";
import type { Hackathon, HackathonDetail, Team, Leaderboard } from "@/types";

export default function HackathonOverviewPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { user, getProfile, joinHackathon } = useAuth();

  const [hackathon, setHackathon] = useState<Hackathon | null>(null);
  const [detail, setDetail] = useState<HackathonDetail | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [leaderboard, setLeaderboard] = useState<Leaderboard | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [justRegistered, setJustRegistered] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [h, d, t, l] = await Promise.all([
        getHackathonBySlug(slug),
        getHackathonDetail(slug),
        getTeamsByHackathon(slug),
        getLeaderboard(slug),
      ]);
      setHackathon(h || null);
      setDetail(d || null);
      setTeams(t);
      setLeaderboard(l || null);
    };
    load();
  }, [slug]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const profile = await getProfile(user.id);
      if (profile?.joinedHackathons.includes(slug)) {
        setIsRegistered(true);
      }
    };
    load();
  }, [user, slug, getProfile]);

  if (!hackathon || !detail) return null;

  const { overview } = detail.sections;
  const isEnded = hackathon.status === "ended";
  const submissionCount = leaderboard?.entries?.length || 0;

  const handleRegister = async () => {
    if (!user) {
      window.location.href = "/login";
      return;
    }
    await joinHackathon(slug);
    setIsRegistered(true);
    setShowConfirm(false);
    setJustRegistered(true);

    // 활동 로그
    const { logActivity, addNotification } = await import("@/lib/supabase/data");
    await logActivity({
      type: "team_created",
      message: `${user.name}님이 ${hackathon.title}에 참가 등록했습니다.`,
      timestamp: new Date().toISOString(),
      hackathonSlug: slug,
    });
    await addNotification(user.id, {
      message: `${hackathon.title} 참가 등록이 완료되었습니다! 팀을 구성하고 제출을 준비해보세요.`,
      type: "success",
      link: `/hackathons/${slug}/submit`,
    });
  };

  return (
    <div className="space-y-6">
      {/* 참가 등록 CTA */}
      {!isEnded && (
        <div className={`rounded-xl p-6 ${
          isRegistered
            ? "border-2 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
            : "border-2 border-indigo-200 bg-indigo-50 dark:border-indigo-800 dark:bg-indigo-900/20"
        }`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              {isRegistered ? (
                <>
                  <h3 className="text-lg font-semibold text-green-800 dark:text-green-300">
                    참가 등록 완료
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-400">
                    {justRegistered ? "성공적으로 등록되었습니다! " : ""}
                    팀을 구성하고 결과물을 제출해보세요.
                  </p>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-semibold text-indigo-800 dark:text-indigo-300">
                    해커톤에 참가하세요!
                  </h3>
                  <p className="text-sm text-indigo-700 dark:text-indigo-400">
                    참가 등록 후 팀 구성과 제출이 가능합니다. 마감일: {formatDate(hackathon.period.submissionDeadlineAt)}
                  </p>
                </>
              )}
            </div>
            {isRegistered ? (
              <div className="flex gap-2">
                <Link href={`/hackathons/${slug}/submit`}>
                  <Button>제출하기</Button>
                </Link>
                <Link href="/camp">
                  <Button variant="secondary">팀 찾기</Button>
                </Link>
              </div>
            ) : (
              <>
                {showConfirm ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-600 dark:text-slate-300">참가하시겠습니까?</span>
                    <Button onClick={handleRegister}>확인</Button>
                    <Button variant="secondary" onClick={() => setShowConfirm(false)}>취소</Button>
                  </div>
                ) : (
                  <Button onClick={() => user ? setShowConfirm(true) : handleRegister()}>
                    {user ? "참가 등록" : "로그인하고 참가하기"}
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* 퀵 통계 */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 p-4 text-center dark:border-slate-800">
          <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{teams.length}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">참가 팀</p>
        </div>
        <div className="rounded-xl border border-slate-200 p-4 text-center dark:border-slate-800">
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{leaderboard?.entries?.length || 0}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">리더보드 팀</p>
        </div>
        <div className="rounded-xl border border-slate-200 p-4 text-center dark:border-slate-800">
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{submissionCount}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">총 제출</p>
        </div>
        <div className="rounded-xl border border-slate-200 p-4 text-center dark:border-slate-800">
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {getDday(hackathon.period.submissionDeadlineAt)}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">마감까지</p>
        </div>
      </div>

      {/* 개요 */}
      <div className="rounded-xl bg-slate-50 p-6 dark:bg-slate-900">
        <h3 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">개요</h3>
        <p className="leading-relaxed text-slate-700 dark:text-slate-300">{overview.summary}</p>
      </div>

      {/* 팀 정책 + 기간 */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
          <p className="mb-1 text-xs text-slate-500 dark:text-slate-400">개인 참가</p>
          <p className="text-lg font-bold text-slate-900 dark:text-white">
            {overview.teamPolicy.allowSolo ? "가능" : "불가"}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
          <p className="mb-1 text-xs text-slate-500 dark:text-slate-400">최대 팀원</p>
          <p className="text-lg font-bold text-slate-900 dark:text-white">{overview.teamPolicy.maxTeamSize}명</p>
        </div>
        <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
          <p className="mb-1 text-xs text-slate-500 dark:text-slate-400">마감일</p>
          <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
            {getDday(hackathon.period.submissionDeadlineAt)}
          </p>
          <p className="text-xs text-slate-400">{formatDate(hackathon.period.submissionDeadlineAt)}</p>
        </div>
      </div>

      {/* 상금 미리보기 (있을 경우) */}
      {detail.sections.prize && (
        <div className="rounded-xl border border-slate-200 p-6 dark:border-slate-800">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">상금</h3>
            <Link href={`/hackathons/${slug}/overview`} className="text-xs text-indigo-500 hover:underline">
              상세보기 →
            </Link>
          </div>
          <div className="flex flex-wrap gap-4">
            {detail.sections.prize.items.slice(0, 3).map((item: { place: string; amountKRW: number }, i: number) => (
              <div key={item.place} className="flex items-center gap-2">
                <span className="text-lg">{i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}</span>
                <span className="text-sm font-medium text-slate-900 dark:text-white">{item.place}</span>
                <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                  {(item.amountKRW / 10000).toLocaleString()}만원
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 일정 미리보기 */}
      <div className="rounded-xl border border-slate-200 p-6 dark:border-slate-800">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">주요 일정</h3>
          <Link href={`/hackathons/${slug}/overview`} className="text-xs text-indigo-500 hover:underline">
            상세보기 →
          </Link>
        </div>
        <div className="flex flex-wrap gap-6">
          {detail.sections.schedule.milestones.map((m: { name: string; at: string }) => {
            const isPast = new Date(m.at).getTime() < Date.now();
            return (
              <div key={m.name} className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${isPast ? "bg-green-500" : "bg-indigo-500"}`} />
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{m.name}</p>
                  <p className="text-xs text-slate-400">{formatDateTime(m.at)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 태그 + 링크 */}
      <div className="flex flex-wrap gap-2">
        {hackathon.tags.map((tag) => (
          <Badge key={tag} variant="info">{tag}</Badge>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <a href={hackathon.links.rules} target="_blank" rel="noopener noreferrer"
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
          📄 대회 규정
        </a>
        <a href={hackathon.links.faq} target="_blank" rel="noopener noreferrer"
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
          ❓ FAQ
        </a>
      </div>
    </div>
  );
}
