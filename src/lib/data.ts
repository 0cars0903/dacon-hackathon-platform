import type {
  Hackathon,
  HackathonDetail,
  Team,
  Leaderboard,
  ActivityFeedItem,
} from "@/types";
import { isWithinTwoWeeks } from "@/lib/utils";

import hackathonsData from "@/data/hackathons.json";
import hackathonDetailsData from "@/data/hackathon-details.json";
import teamsData from "@/data/teams.json";
import leaderboardData from "@/data/leaderboard.json";

// =============================================
// 해커톤 상태 동적 판별
// =============================================

/** JSON의 하드코딩된 status 대신 날짜 기반으로 동적 계산 */
function computeStatus(h: Hackathon): Hackathon["status"] {
  const now = new Date();
  const endAt = new Date(h.period.endAt);
  const submissionDeadline = new Date(h.period.submissionDeadlineAt);

  // endAt가 지났으면 → ended
  if (now > endAt) return "ended";

  // submissionDeadline 이전이면서 status가 upcoming이면 → upcoming
  // (시작 시간이 없으므로 submissionDeadline 기준으로 판단)
  if (h.status === "upcoming" && now < submissionDeadline) return "upcoming";

  // 그 외 (deadline 전후 ~ endAt 이전) → ongoing
  return "ongoing";
}

/** 날짜 기반 상태가 적용된 전체 해커톤 목록 */
function getAllWithDynamicStatus(): Hackathon[] {
  const raw = hackathonsData as Hackathon[];
  return raw.map((h) => ({ ...h, status: computeStatus(h) }));
}

// === 해커톤 ===

/** 종료 후 2주 이내 해커톤만 포함 (일반 사용자용) */
export function getHackathons(): Hackathon[] {
  const all = getAllWithDynamicStatus();
  // localStorage에 저장된 admin 생성 해커톤도 병합
  const extra = getAdminHackathons();
  const merged = [...all, ...extra];

  return merged.filter((h) => {
    if (h.status !== "ended") return true;
    return isWithinTwoWeeks(h.period.endAt);
  });
}

/** 전체 해커톤 (관리자용, 필터 없음) */
export function getAllHackathonsUnfiltered(): Hackathon[] {
  const all = getAllWithDynamicStatus();
  const extra = getAdminHackathons();
  return [...all, ...extra];
}

export function getHackathonBySlug(slug: string): Hackathon | undefined {
  return getAllHackathonsUnfiltered().find((h) => h.slug === slug);
}

/** admin이 생성한 해커톤 (localStorage) */
function getAdminHackathons(): Hackathon[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("dacon_admin_hackathons");
    if (!raw) return [];
    const items = JSON.parse(raw);
    return items.map((h: Hackathon) => ({ ...h, status: computeStatus(h) }));
  } catch {
    return [];
  }
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

// =============================================
// 활동 피드 (실제 이벤트 기반)
// =============================================

const ACTIVITY_KEY = "dacon_activity_feed";

/** 활동 이벤트 기록 */
export function logActivity(item: Omit<ActivityFeedItem, "id">) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(ACTIVITY_KEY);
    const feed: ActivityFeedItem[] = raw ? JSON.parse(raw) : [];
    feed.unshift({ ...item, id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` });
    // 최대 100개 유지
    if (feed.length > 100) feed.length = 100;
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(feed));
  } catch {
    // ignore
  }
}

/** 활동 피드 가져오기 (실제 이벤트 + 시드 데이터 병합) */
export function getActivityFeed(): ActivityFeedItem[] {
  const seed: ActivityFeedItem[] = [
    {
      id: "seed-1",
      type: "team_created",
      message: "LangChain Wizards 팀이 GenAI 앱 개발 챌린지에 등록했습니다.",
      timestamp: "2026-03-10T14:00:00+09:00",
      hackathonSlug: "genai-app-challenge-2026",
    },
    {
      id: "seed-2",
      type: "team_created",
      message: "ChartMasters 팀이 데이터 시각화 해커톤에 참가했습니다.",
      timestamp: "2026-03-08T10:00:00+09:00",
      hackathonSlug: "data-viz-hackathon-2026",
    },
    {
      id: "seed-3",
      type: "team_created",
      message: "404found 팀이 긴급 인수인계 해커톤에 새로 등록했습니다.",
      timestamp: "2026-03-04T11:00:00+09:00",
      hackathonSlug: "daker-handover-2026-03",
    },
    {
      id: "seed-4",
      type: "submission",
      message: "Team Alpha가 모델 경량화 해커톤에 결과물을 제출했습니다.",
      timestamp: "2026-02-24T21:05:00+09:00",
      hackathonSlug: "aimers-8-model-lite",
    },
    {
      id: "seed-5",
      type: "ranking_update",
      message: "모델 경량화 해커톤 리더보드가 업데이트 되었습니다.",
      timestamp: "2026-02-26T10:00:00+09:00",
      hackathonSlug: "aimers-8-model-lite",
    },
    {
      id: "seed-6",
      type: "submission",
      message: "ChartMasters가 데이터 시각화 해커톤에 대시보드를 제출했습니다.",
      timestamp: "2026-03-12T15:00:00+09:00",
      hackathonSlug: "data-viz-hackathon-2026",
    },
  ];

  if (typeof window === "undefined") return seed;

  try {
    const raw = localStorage.getItem(ACTIVITY_KEY);
    const live: ActivityFeedItem[] = raw ? JSON.parse(raw) : [];
    // 실제 이벤트를 앞에, 시드를 뒤에 병합 (중복 ID 제거)
    const ids = new Set(live.map((a) => a.id));
    const merged = [...live, ...seed.filter((s) => !ids.has(s.id))];
    // 시간순 정렬 (최신 먼저)
    merged.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return merged.slice(0, 30);
  } catch {
    return seed;
  }
}

// =============================================
// 알림 시스템
// =============================================

const NOTIFICATIONS_KEY = "dacon_notifications";

export interface StoredNotification {
  id: string;
  userId: string;
  message: string;
  read: boolean;
  timestamp: string;
  link?: string;
  type: "info" | "success" | "warning";
}

/** 알림 추가 */
export function addNotification(userId: string, notification: Omit<StoredNotification, "id" | "userId" | "read">) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_KEY);
    const all: StoredNotification[] = raw ? JSON.parse(raw) : [];
    all.unshift({
      ...notification,
      id: `noti-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId,
      read: false,
    });
    // 유저당 최대 50개
    const userNotis = all.filter((n) => n.userId === userId);
    if (userNotis.length > 50) {
      const excessIds = new Set(userNotis.slice(50).map((n) => n.id));
      const filtered = all.filter((n) => !excessIds.has(n.id));
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(filtered));
    } else {
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(all));
    }
  } catch {
    // ignore
  }
}

/** 사용자 알림 가져오기 */
export function getNotifications(userId: string): StoredNotification[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_KEY);
    const all: StoredNotification[] = raw ? JSON.parse(raw) : [];
    return all.filter((n) => n.userId === userId);
  } catch {
    return [];
  }
}

/** 알림 읽음 처리 */
export function markNotificationRead(notificationId: string) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_KEY);
    const all: StoredNotification[] = raw ? JSON.parse(raw) : [];
    const idx = all.findIndex((n) => n.id === notificationId);
    if (idx >= 0) {
      all[idx].read = true;
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(all));
    }
  } catch {
    // ignore
  }
}

/** 모든 알림 읽음 처리 */
export function markAllNotificationsRead(userId: string) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_KEY);
    const all: StoredNotification[] = raw ? JSON.parse(raw) : [];
    all.forEach((n) => {
      if (n.userId === userId) n.read = true;
    });
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(all));
  } catch {
    // ignore
  }
}
