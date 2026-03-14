"use client";

import { useParams } from "next/navigation";
import { getHackathonBySlug, getHackathonDetail } from "@/lib/data";
import { Badge } from "@/components/common/Badge";
import { formatDate, getDday } from "@/lib/utils";

export default function HackathonOverviewPage() {
  const params = useParams();
  const slug = params.slug as string;
  const hackathon = getHackathonBySlug(slug);
  const detail = getHackathonDetail(slug);

  if (!hackathon || !detail) return null;

  const { overview } = detail.sections;

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-gray-50 p-6 dark:bg-gray-900">
        <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
          개요
        </h3>
        <p className="leading-relaxed text-gray-700 dark:text-gray-300">
          {overview.summary}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
          <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">개인 참가</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {overview.teamPolicy.allowSolo ? "가능" : "불가"}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
          <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">최대 팀원</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {overview.teamPolicy.maxTeamSize}명
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
          <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">마감일</p>
          <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
            {getDday(hackathon.period.submissionDeadlineAt)}
          </p>
          <p className="text-xs text-gray-400">{formatDate(hackathon.period.submissionDeadlineAt)}</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
        <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">태그</h4>
        <div className="flex flex-wrap gap-2">
          {hackathon.tags.map((tag) => (
            <Badge key={tag} variant="info">{tag}</Badge>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
        <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">기간</h4>
        <div className="grid gap-4 sm:grid-cols-2 text-sm">
          <div>
            <span className="text-gray-500 dark:text-gray-400">제출 마감: </span>
            <span className="font-medium text-gray-900 dark:text-white">{formatDate(hackathon.period.submissionDeadlineAt)}</span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">종료일: </span>
            <span className="font-medium text-gray-900 dark:text-white">{formatDate(hackathon.period.endAt)}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <a
          href={hackathon.links.rules}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          📄 대회 규정
        </a>
        <a
          href={hackathon.links.faq}
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
