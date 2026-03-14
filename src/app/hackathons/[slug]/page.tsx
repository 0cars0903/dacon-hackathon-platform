"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  getHackathonBySlug,
  getHackathonDetail,
  getTeamsByHackathon,
  getLeaderboard,
} from "@/lib/data";
import { Badge } from "@/components/common/Badge";
import { Tabs } from "@/components/common/Tabs";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/common/Button";
import {
  getDday,
  getStatusLabel,
  formatDate,
  formatDateTime,
  formatKRW,
  timeAgo,
} from "@/lib/utils";

const TAB_LIST = [
  { key: "overview", label: "개요", emoji: "📋" },
  { key: "camp", label: "팀", emoji: "👥" },
  { key: "eval", label: "평가", emoji: "📏" },
  { key: "prize", label: "상금", emoji: "🏅" },
  { key: "info", label: "안내", emoji: "ℹ️" },
  { key: "schedule", label: "일정", emoji: "📅" },
  { key: "submit", label: "제출", emoji: "📤" },
  { key: "leaderboard", label: "리더보드", emoji: "🏆" },
];

export default function HackathonDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [activeTab, setActiveTab] = useState("overview");

  const hackathon = getHackathonBySlug(slug);
  const detail = getHackathonDetail(slug);

  if (!hackathon || !detail) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <EmptyState
          emoji="❓"
          title="해커톤을 찾을 수 없습니다"
          description="존재하지 않는 해커톤이거나 삭제된 페이지입니다."
          actionLabel="목록으로 돌아가기"
          onAction={() => (window.location.href = "/hackathons")}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* 헤더 */}
      <div className="mb-6">
        <Link
          href="/hackathons"
          className="mb-4 inline-flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          ← 해커톤 목록
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {hackathon.title}
          </h1>
          <Badge
            variant={
              hackathon.status === "ongoing"
                ? "success"
                : hackathon.status === "upcoming"
                  ? "info"
                  : "muted"
            }
          >
            {getStatusLabel(hackathon.status)}
          </Badge>
          <span className="text-sm text-gray-400">
            {getDday(hackathon.period.submissionDeadlineAt)}
          </span>
        </div>
      </div>

      {/* 탭 */}
      <Tabs
        tabs={TAB_LIST}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        className="mb-6"
      />

      {/* 탭 내용 */}
      <div className="min-h-[300px]">
        {activeTab === "overview" && (
          <OverviewTab sections={detail.sections} />
        )}
        {activeTab === "camp" && <CampTab slug={slug} sections={detail.sections} />}
        {activeTab === "eval" && <EvalTab sections={detail.sections} />}
        {activeTab === "prize" && <PrizeTab sections={detail.sections} />}
        {activeTab === "info" && <InfoTab sections={detail.sections} />}
        {activeTab === "schedule" && (
          <ScheduleTab sections={detail.sections} />
        )}
        {activeTab === "submit" && <SubmitTab sections={detail.sections} />}
        {activeTab === "leaderboard" && <LeaderboardTab slug={slug} />}
      </div>
    </div>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */

function OverviewTab({ sections }: { sections: any }) {
  const { overview } = sections;
  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-gray-50 p-6 dark:bg-gray-900">
        <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
          개요
        </h3>
        <p className="text-gray-700 dark:text-gray-300">
          {overview.summary}
        </p>
      </div>
      <div className="rounded-xl border border-gray-200 p-6 dark:border-gray-800">
        <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
          팀 구성
        </h3>
        <div className="flex gap-6 text-sm">
          <div>
            <span className="text-gray-500 dark:text-gray-400">개인 참가: </span>
            <span className="font-medium text-gray-900 dark:text-white">
              {overview.teamPolicy.allowSolo ? "가능" : "불가"}
            </span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">최대 팀원: </span>
            <span className="font-medium text-gray-900 dark:text-white">
              {overview.teamPolicy.maxTeamSize}명
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function CampTab({ slug, sections }: { slug: string; sections: any }) {
  const teams = getTeamsByHackathon(slug);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {teams.length}개 팀이 등록되어 있습니다.
        </p>
        <Link href={`/camp?hackathon=${slug}`}>
          <Button size="sm">팀 모집 보기</Button>
        </Link>
      </div>
      {teams.length === 0 ? (
        <EmptyState
          emoji="👥"
          title="등록된 팀이 없습니다"
          description="첫 번째 팀을 만들어보세요!"
        />
      ) : (
        <div className="space-y-3">
          {teams.map((team) => (
            <div
              key={team.teamCode}
              className="rounded-xl border border-gray-200 p-4 dark:border-gray-800"
            >
              <div className="mb-2 flex items-center gap-2">
                <span className="font-semibold text-gray-900 dark:text-white">
                  {team.name}
                </span>
                <Badge variant={team.isOpen ? "success" : "muted"}>
                  {team.isOpen ? "모집중" : "마감"}
                </Badge>
                <span className="text-xs text-gray-400">
                  {team.memberCount}명
                </span>
              </div>
              <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                {team.intro}
              </p>
              {team.lookingFor.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {team.lookingFor.map((role) => (
                    <span
                      key={role}
                      className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EvalTab({ sections }: { sections: any }) {
  const { eval: evalData } = sections;

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-gray-50 p-6 dark:bg-gray-900">
        <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
          {evalData.metricName}
        </h3>
        <p className="text-gray-700 dark:text-gray-300">
          {evalData.description}
        </p>
      </div>

      {evalData.scoreDisplay && (
        <div className="rounded-xl border border-gray-200 p-6 dark:border-gray-800">
          <h4 className="mb-3 font-semibold text-gray-900 dark:text-white">
            {evalData.scoreDisplay.label}
          </h4>
          <div className="space-y-2">
            {evalData.scoreDisplay.breakdown.map(
              (item: { key: string; label: string; weightPercent: number }) => (
                <div key={item.key} className="flex items-center gap-3">
                  <span className="w-20 text-sm text-gray-600 dark:text-gray-400">
                    {item.label}
                  </span>
                  <div className="flex-1">
                    <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700">
                      <div
                        className="h-2 rounded-full bg-blue-500"
                        style={{ width: `${item.weightPercent}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {item.weightPercent}%
                  </span>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {evalData.limits && (
        <div className="rounded-xl border border-gray-200 p-6 dark:border-gray-800">
          <h4 className="mb-3 font-semibold text-gray-900 dark:text-white">
            제출 제한
          </h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="text-sm">
              <span className="text-gray-500 dark:text-gray-400">
                최대 실행 시간:{" "}
              </span>
              <span className="font-medium text-gray-900 dark:text-white">
                {evalData.limits.maxRuntimeSec}초
              </span>
            </div>
            <div className="text-sm">
              <span className="text-gray-500 dark:text-gray-400">
                일일 최대 제출:{" "}
              </span>
              <span className="font-medium text-gray-900 dark:text-white">
                {evalData.limits.maxSubmissionsPerDay}회
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PrizeTab({ sections }: { sections: any }) {
  const prize = sections.prize;

  if (!prize) {
    return (
      <EmptyState emoji="🏅" title="상금 정보가 없습니다" />
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-800">
            <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
              순위
            </th>
            <th className="px-6 py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-400">
              상금
            </th>
          </tr>
        </thead>
        <tbody>
          {prize.items.map(
            (item: { place: string; amountKRW: number }, i: number) => (
              <tr
                key={item.place}
                className="border-b border-gray-100 last:border-0 dark:border-gray-800"
              >
                <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"} {item.place}
                </td>
                <td className="px-6 py-4 text-right text-sm font-semibold text-blue-600 dark:text-blue-400">
                  {formatKRW(item.amountKRW)}
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>
  );
}

function InfoTab({ sections }: { sections: any }) {
  const { info } = sections;

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-yellow-50 p-6 dark:bg-yellow-900/20">
        <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
          유의사항
        </h3>
        <ul className="space-y-2">
          {info.notice.map((note: string, i: number) => (
            <li
              key={i}
              className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
            >
              <span className="mt-0.5 text-yellow-500">•</span>
              {note}
            </li>
          ))}
        </ul>
      </div>
      <div className="flex gap-3">
        <a
          href={info.links.rules}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          📄 대회 규정
        </a>
        <a
          href={info.links.faq}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          ❓ FAQ
        </a>
      </div>
    </div>
  );
}

function ScheduleTab({ sections }: { sections: any }) {
  const { schedule } = sections;

  return (
    <div className="space-y-1">
      <p className="mb-4 text-xs text-gray-400">
        타임존: {schedule.timezone}
      </p>
      <div className="relative pl-6">
        {schedule.milestones.map(
          (m: { name: string; at: string }, i: number) => {
            const isPast = new Date(m.at).getTime() < Date.now();
            return (
              <div key={i} className="relative mb-6 last:mb-0">
                {/* Timeline line */}
                {i < schedule.milestones.length - 1 && (
                  <div className="absolute -bottom-6 left-[-18px] top-3 w-0.5 bg-gray-200 dark:bg-gray-700" />
                )}
                {/* Dot */}
                <div
                  className={`absolute left-[-22px] top-1.5 h-3 w-3 rounded-full border-2 ${
                    isPast
                      ? "border-green-500 bg-green-500"
                      : "border-blue-500 bg-white dark:bg-gray-950"
                  }`}
                />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {m.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDateTime(m.at)}
                  </p>
                </div>
              </div>
            );
          }
        )}
      </div>
    </div>
  );
}

function SubmitTab({ sections }: { sections: any }) {
  const { submit } = sections;

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
                  className="flex items-center justify-between rounded-lg bg-gray-50 p-4 dark:bg-gray-800"
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
                    className="w-64 rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
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

function LeaderboardTab({ slug }: { slug: string }) {
  const leaderboard = getLeaderboard(slug);

  if (!leaderboard || leaderboard.entries.length === 0) {
    return (
      <EmptyState
        emoji="🏆"
        title="리더보드 데이터가 없습니다"
        description="아직 제출된 결과가 없습니다."
      />
    );
  }

  return (
    <div>
      <p className="mb-4 text-xs text-gray-400">
        업데이트: {formatDateTime(leaderboard.updatedAt)}
      </p>
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                순위
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                팀
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400">
                점수
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400">
                제출 시간
              </th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.entries.map((entry) => (
              <tr
                key={entry.rank}
                className="border-b border-gray-100 last:border-0 dark:border-gray-800"
              >
                <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                  {entry.rank <= 3
                    ? ["🥇", "🥈", "🥉"][entry.rank - 1]
                    : `#${entry.rank}`}
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {entry.teamName}
                  </span>
                  {entry.artifacts && (
                    <div className="mt-1 flex gap-2">
                      <a
                        href={entry.artifacts.webUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-500 hover:underline"
                      >
                        웹사이트
                      </a>
                      <a
                        href={entry.artifacts.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-500 hover:underline"
                      >
                        PDF
                      </a>
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-right text-sm font-semibold text-blue-600 dark:text-blue-400">
                  {entry.score}
                </td>
                <td className="px-4 py-3 text-right text-xs text-gray-500 dark:text-gray-400">
                  {timeAgo(entry.submittedAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
