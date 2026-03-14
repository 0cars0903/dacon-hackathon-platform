import type {
  Hackathon,
  HackathonDetail,
  Team,
  Leaderboard,
} from "@/types";

import hackathonsData from "@/data/hackathons.json";
import hackathonDetailsData from "@/data/hackathon-details.json";
import teamsData from "@/data/teams.json";
import leaderboardData from "@/data/leaderboard.json";

// === 해커톤 ===

export function getHackathons(): Hackathon[] {
  return hackathonsData as Hackathon[];
}

export function getHackathonBySlug(slug: string): Hackathon | undefined {
  return getHackathons().find((h) => h.slug === slug);
}

// === 해커톤 상세 ===

export function getHackathonDetail(
  slug: string
): HackathonDetail | undefined {
  const details = hackathonDetailsData as unknown as HackathonDetail[];
  return details.find((d) => d.slug === slug);
}

export function getAllHackathonDetails(): HackathonDetail[] {
  return hackathonDetailsData as unknown as HackathonDetail[];
}

// === 팀 ===

export function getTeams(): Team[] {
  return teamsData as Team[];
}

export function getTeamsByHackathon(hackathonSlug: string): Team[] {
  return getTeams().filter((t) => t.hackathonSlug === hackathonSlug);
}

// === 리더보드 ===

export function getLeaderboard(hackathonSlug: string): Leaderboard | undefined {
  const leaderboards = leaderboardData as unknown as Leaderboard[];
  return leaderboards.find((lb) => lb.hackathonSlug === hackathonSlug);
}

export function getAllLeaderboards(): Leaderboard[] {
  return leaderboardData as unknown as Leaderboard[];
}

// === 통계 (실제 데이터 기반) ===

export function getPlatformStats() {
  const hackathons = getHackathons();
  const teams = getTeams();
  const leaderboards = getAllLeaderboards();

  const ongoingCount = hackathons.filter((h) => h.status === "ongoing").length;
  const upcomingCount = hackathons.filter((h) => h.status === "upcoming").length;
  const totalTeams = teams.length;
  const totalMembers = teams.reduce((sum, t) => sum + t.memberCount, 0);
  const totalSubmissions = leaderboards.reduce(
    (sum, lb) => sum + lb.entries.length,
    0
  );

  return {
    ongoingHackathons: ongoingCount,
    upcomingHackathons: upcomingCount,
    totalHackathons: hackathons.length,
    totalTeams,
    totalMembers,
    totalSubmissions,
  };
}

// === 추천 로직 (확장 기능) ===

export function getRecommendedHackathons(
  interestTags: string[]
): Hackathon[] {
  if (interestTags.length === 0) return getHackathons();

  const hackathons = getHackathons();
  const lowerTags = interestTags.map((t) => t.toLowerCase());

  const scored = hackathons.map((h) => {
    const matchCount = h.tags.filter((tag) =>
      lowerTags.includes(tag.toLowerCase())
    ).length;
    return { hackathon: h, score: matchCount };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.hackathon);
}

export function getRecommendedTeams(
  interestTags: string[]
): Team[] {
  if (interestTags.length === 0) return getTeams().filter((t) => t.isOpen);

  const teams = getTeams().filter((t) => t.isOpen);
  const lowerTags = interestTags.map((t) => t.toLowerCase());

  const scored = teams.map((t) => {
    const matchCount = t.lookingFor.filter((role) =>
      lowerTags.some((tag) => role.toLowerCase().includes(tag))
    ).length;
    return { team: t, score: matchCount };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.team);
}

// === 활동 피드 (더미) ===

export function getActivityFeed() {
  return [
    {
      id: "1",
      type: "team_created" as const,
      message: "LangChain Wizards 팀이 GenAI 앱 개발 챌린지에 등록했습니다.",
      timestamp: "2026-03-10T14:00:00+09:00",
      hackathonSlug: "genai-app-challenge-2026",
    },
    {
      id: "2",
      type: "team_created" as const,
      message: "ChartMasters 팀이 데이터 시각화 해커톤에 참가했습니다.",
      timestamp: "2026-03-08T10:00:00+09:00",
      hackathonSlug: "data-viz-hackathon-2026",
    },
    {
      id: "3",
      type: "team_created" as const,
      message: "404found 팀이 긴급 인수인계 해커톤에 새로 등록했습니다.",
      timestamp: "2026-03-04T11:00:00+09:00",
      hackathonSlug: "daker-handover-2026-03",
    },
    {
      id: "4",
      type: "submission" as const,
      message: "Team Alpha가 모델 경량화 해커톤에 결과물을 제출했습니다.",
      timestamp: "2026-02-24T21:05:00+09:00",
      hackathonSlug: "aimers-8-model-lite",
    },
    {
      id: "5",
      type: "ranking_update" as const,
      message: "모델 경량화 해커톤 리더보드가 업데이트 되었습니다.",
      timestamp: "2026-02-26T10:00:00+09:00",
      hackathonSlug: "aimers-8-model-lite",
    },
    {
      id: "6",
      type: "submission" as const,
      message: "ChartMasters가 데이터 시각화 해커톤에 대시보드를 제출했습니다.",
      timestamp: "2026-03-12T15:00:00+09:00",
      hackathonSlug: "data-viz-hackathon-2026",
    },
  ];
}
