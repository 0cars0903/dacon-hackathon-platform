// === 해커톤 목록 ===
export interface Hackathon {
  slug: string;
  title: string;
  status: "ongoing" | "ended" | "upcoming";
  tags: string[];
  thumbnailUrl: string;
  period: {
    timezone: string;
    submissionDeadlineAt: string;
    endAt: string;
  };
  links: {
    detail: string;
    rules: string;
    faq: string;
  };
}

// === 해커톤 상세 ===
export interface HackathonDetail {
  slug: string;
  title: string;
  sections: {
    overview: {
      summary: string;
      teamPolicy: { allowSolo: boolean; maxTeamSize: number };
    };
    info: {
      notice: string[];
      links: { rules: string; faq: string };
    };
    eval: {
      metricName: string;
      description: string;
      scoreSource?: string;
      scoreDisplay?: {
        label: string;
        breakdown: { key: string; label: string; weightPercent: number }[];
      };
      limits?: { maxRuntimeSec: number; maxSubmissionsPerDay: number };
    };
    schedule: {
      timezone: string;
      milestones: { name: string; at: string }[];
    };
    prize?: {
      items: { place: string; amountKRW: number }[];
    };
    teams: {
      campEnabled: boolean;
      listUrl: string;
    };
    submit: {
      allowedArtifactTypes: string[];
      submissionUrl: string;
      guide: string[];
      submissionItems?: {
        key: string;
        title: string;
        format: string;
      }[];
    };
    leaderboard: {
      publicLeaderboardUrl: string;
      note: string;
    };
  };
}

// === 팀 ===
export interface Team {
  teamCode: string;
  hackathonSlug: string;
  name: string;
  isOpen: boolean;
  memberCount: number;
  lookingFor: string[];
  intro: string;
  contact: { type: string; url: string };
  createdAt: string;
}

// === 리더보드 ===
export interface LeaderboardEntry {
  rank: number;
  teamName: string;
  score: number;
  submittedAt: string;
  metrics?: Record<string, number>;
  scoreBreakdown?: { participant: number; judge: number };
  artifacts?: { webUrl: string; pdfUrl: string; planTitle: string };
}

export interface MetricColumn {
  key: string;
  label: string;
  unit: string;
}

export interface LeaderboardRound {
  roundId: string;
  name: string;
  weight: number;
  description: string;
  scoreFormula?: string;
  scoreColumns?: MetricColumn[];
  status: "pending" | "active" | "completed";
  entries: LeaderboardEntry[];
}

export interface Leaderboard {
  hackathonSlug: string;
  evalType: "metric" | "judge" | "multi-round" | "vote";
  metricName: string;
  metricFormula?: string;
  metricColumns?: MetricColumn[];
  rounds?: LeaderboardRound[];
  updatedAt: string;
  entries: LeaderboardEntry[];
}

// === 제출 (localStorage) ===
export interface Submission {
  hackathonSlug: string;
  items: { key: string; value: string }[];
  status: "draft" | "submitted";
  savedAt: string;
}

// === 활동 피드 (확장) ===
export interface ActivityFeedItem {
  id: string;
  type: "team_created" | "submission" | "ranking_update";
  message: string;
  timestamp: string;
  hackathonSlug?: string;
}

// === 사용자 설정 (확장) ===
export type ColorTheme = "blue" | "purple" | "green";

export interface UserPreferences {
  theme: "light" | "dark";
  colorTheme: ColorTheme;
  interestTags: string[];
}

// === 사용자 프로필 (확장) ===
export interface UserProfile {
  id: string;
  name: string;
  nickname: string;
  nicknameChangedAt?: string; // ISO date — 마지막 닉네임 변경일
  email: string;
  role: "user" | "admin";
  avatarUrl?: string;
  bio?: string;
  skills: string[];
  joinedAt: string;
  // 활동 통계
  stats: {
    hackathonsJoined: number;
    teamsCreated: number;
    submissions: number;
    totalScore: number;
  };
  // 배지 시스템
  badges: UserBadge[];
  // 참가 해커톤
  joinedHackathons: string[]; // hackathon slugs
  // 팀 멤버십
  teamMemberships: string[]; // team codes
}

export interface UserBadge {
  id: string;
  name: string;
  emoji: string;
  description: string;
  earnedAt: string;
}

// === 팀 멤버 ===
export interface TeamMember {
  userId: string;
  name: string;
  role: string;
  joinedAt: string;
}

// === 팀 참가 요청 ===
export interface TeamJoinRequest {
  id: string;
  teamCode: string;
  userId: string;
  userName: string;
  message: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
}

// === 알림 (확장) ===
export interface Notification {
  id: string;
  message: string;
  read: boolean;
  timestamp: string;
  link?: string;
  type?: "info" | "success" | "warning";
}
