import type {
  Hackathon,
  HackathonDetail,
  Team,
  Leaderboard,
  LeaderboardEntry,
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
  const main = hackathonDetailsData as Record<string, unknown>;

  if (main.slug === slug) {
    return main as unknown as HackathonDetail;
  }

  const extras = (main as Record<string, unknown>)
    .extraDetails as Array<Record<string, unknown>> | undefined;
  if (extras) {
    const found = extras.find(
      (d: Record<string, unknown>) => d.slug === slug
    );
    if (found) return found as unknown as HackathonDetail;
  }

  return undefined;
}

export function getAllHackathonDetails(): HackathonDetail[] {
  const main = hackathonDetailsData as Record<string, unknown>;
  const result: HackathonDetail[] = [main as unknown as HackathonDetail];

  const extras = main.extraDetails as Array<Record<string, unknown>> | undefined;
  if (extras) {
    extras.forEach((d) => result.push(d as unknown as HackathonDetail));
  }

  return result;
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
  const main = leaderboardData as Record<string, unknown>;

  if (main.hackathonSlug === hackathonSlug) {
    return {
      hackathonSlug: main.hackathonSlug as string,
      updatedAt: main.updatedAt as string,
      entries: main.entries as LeaderboardEntry[],
    };
  }

  const extras = main.extraLeaderboards as Array<Record<string, unknown>> | undefined;
  if (extras) {
    const found = extras.find(
      (lb: Record<string, unknown>) => lb.hackathonSlug === hackathonSlug
    );
    if (found) {
      return found as unknown as Leaderboard;
    }
  }

  return undefined;
}

export function getAllLeaderboards(): Leaderboard[] {
  const main = leaderboardData as Record<string, unknown>;
  const result: Leaderboard[] = [
    {
      hackathonSlug: main.hackathonSlug as string,
      updatedAt: main.updatedAt as string,
      entries: main.entries as LeaderboardEntry[],
    },
  ];

  const extras = main.extraLeaderboards as Array<Record<string, unknown>> | undefined;
  if (extras) {
    extras.forEach((lb) => result.push(lb as unknown as Leaderboard));
  }

  return result;
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
      type: "team_created" as const,
      message: "LGTM 팀이 긴급 인수인계 해커톤에 참가했습니다.",
      timestamp: "2026-03-05T09:20:00+09:00",
      hackathonSlug: "daker-handover-2026-03",
    },
  ];
}
