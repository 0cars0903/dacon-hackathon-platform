import type {
  Hackathon,
  HackathonDetail,
  Team,
  Leaderboard,
  ActivityFeedItem,
  TeamInvitation,
  DirectMessage,
  Conversation,
  FollowRelation,
  TeamChatMessage,
  TeamMember,
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
      id: "activity-seed-1",
      type: "team_created",
      message: "LangChain Wizards 팀이 GenAI 앱 개발 챌린지에 등록했습니다.",
      timestamp: "2026-03-10T14:00:00+09:00",
      hackathonSlug: "genai-app-challenge-2026",
    },
    {
      id: "activity-seed-2",
      type: "team_created",
      message: "ChartMasters 팀이 데이터 시각화 해커톤에 참가했습니다.",
      timestamp: "2026-03-08T10:00:00+09:00",
      hackathonSlug: "data-viz-hackathon-2026",
    },
    {
      id: "activity-seed-3",
      type: "team_created",
      message: "404found 팀이 긴급 인수인계 해커톤에 새로 등록했습니다.",
      timestamp: "2026-03-04T11:00:00+09:00",
      hackathonSlug: "daker-handover-2026-03",
    },
    {
      id: "activity-seed-4",
      type: "submission",
      message: "Team Alpha가 모델 경량화 해커톤에 결과물을 제출했습니다.",
      timestamp: "2026-02-24T21:05:00+09:00",
      hackathonSlug: "aimers-8-model-lite",
    },
    {
      id: "activity-seed-5",
      type: "ranking_update",
      message: "모델 경량화 해커톤 리더보드가 업데이트 되었습니다.",
      timestamp: "2026-02-26T10:00:00+09:00",
      hackathonSlug: "aimers-8-model-lite",
    },
    {
      id: "activity-seed-6",
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

// =============================================
// 팀 초대 시스템
// =============================================

const INVITATIONS_KEY = "dacon_invitations";

/** 6자리 초대 코드 생성 */
function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/** 팀 초대 생성 (특정 사용자 대상 또는 공개 초대) */
export function createTeamInvitation(
  teamCode: string,
  teamName: string,
  hackathonSlug: string,
  inviterId: string,
  inviterName: string,
  invitee?: { id: string; name: string }
): TeamInvitation | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(INVITATIONS_KEY);
    const all: TeamInvitation[] = raw ? JSON.parse(raw) : [];

    // 같은 팀에 같은 사용자 대상 pending 초대가 있으면 중복 방지
    if (invitee) {
      const existing = all.find(
        (inv) => inv.teamCode === teamCode && inv.inviteeId === invitee.id && inv.status === "pending"
      );
      if (existing) return null;
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48시간

    const invitation: TeamInvitation = {
      id: `inv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      teamCode,
      teamName,
      hackathonSlug,
      inviteCode: generateInviteCode(),
      inviterId,
      inviterName,
      inviteeId: invitee?.id,
      inviteeName: invitee?.name,
      status: "pending",
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    all.unshift(invitation);
    localStorage.setItem(INVITATIONS_KEY, JSON.stringify(all));
    return invitation;
  } catch {
    return null;
  }
}

/** 초대 코드로 초대 조회 */
export function getInvitationByCode(inviteCode: string): TeamInvitation | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(INVITATIONS_KEY);
    const all: TeamInvitation[] = raw ? JSON.parse(raw) : [];
    const inv = all.find((i) => i.inviteCode === inviteCode);
    if (!inv) return null;

    // 만료 체크
    if (new Date() > new Date(inv.expiresAt) && inv.status === "pending") {
      inv.status = "expired";
      localStorage.setItem(INVITATIONS_KEY, JSON.stringify(all));
    }
    return inv;
  } catch {
    return null;
  }
}

/** 사용자에게 온 초대 목록 */
export function getInvitationsForUser(userId: string): TeamInvitation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(INVITATIONS_KEY);
    const all: TeamInvitation[] = raw ? JSON.parse(raw) : [];
    const now = new Date();

    return all
      .filter((inv) => inv.inviteeId === userId || (!inv.inviteeId && inv.inviterId !== userId))
      .map((inv) => {
        if (inv.status === "pending" && now > new Date(inv.expiresAt)) {
          inv.status = "expired";
        }
        return inv;
      })
      .filter((inv) => inv.inviteeId === userId); // 공개 초대는 코드로만 접근
  } catch {
    return [];
  }
}

/** 팀에서 보낸 초대 목록 */
export function getInvitationsByTeam(teamCode: string): TeamInvitation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(INVITATIONS_KEY);
    const all: TeamInvitation[] = raw ? JSON.parse(raw) : [];
    return all.filter((inv) => inv.teamCode === teamCode);
  } catch {
    return [];
  }
}

/** 초대 수락 */
export function acceptInvitation(invitationId: string, userId: string, userName: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(INVITATIONS_KEY);
    const all: TeamInvitation[] = raw ? JSON.parse(raw) : [];
    const idx = all.findIndex((i) => i.id === invitationId);
    if (idx < 0 || all[idx].status !== "pending") return false;

    // 만료 체크
    if (new Date() > new Date(all[idx].expiresAt)) {
      all[idx].status = "expired";
      localStorage.setItem(INVITATIONS_KEY, JSON.stringify(all));
      return false;
    }

    all[idx].status = "accepted";
    localStorage.setItem(INVITATIONS_KEY, JSON.stringify(all));

    // 팀에 멤버 추가
    const teamsRaw = localStorage.getItem("dacon_teams");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const teams: any[] = teamsRaw ? JSON.parse(teamsRaw) : [];
    const teamIdx = teams.findIndex((t) => t.teamCode === all[idx].teamCode);
    if (teamIdx >= 0) {
      if (!teams[teamIdx].members) teams[teamIdx].members = [];
      const alreadyMember = teams[teamIdx].members.some((m: { userId: string }) => m.userId === userId);
      if (!alreadyMember) {
        teams[teamIdx].members.push({
          userId,
          name: userName,
          role: "팀원",
          joinedAt: new Date().toISOString(),
        });
        teams[teamIdx].memberCount = teams[teamIdx].members.length;
        localStorage.setItem("dacon_teams", JSON.stringify(teams));
      }
    }

    return true;
  } catch {
    return false;
  }
}

/** 초대 거절 */
export function rejectInvitation(invitationId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(INVITATIONS_KEY);
    const all: TeamInvitation[] = raw ? JSON.parse(raw) : [];
    const idx = all.findIndex((i) => i.id === invitationId);
    if (idx < 0 || all[idx].status !== "pending") return false;

    all[idx].status = "rejected";
    localStorage.setItem(INVITATIONS_KEY, JSON.stringify(all));
    return true;
  } catch {
    return false;
  }
}

/** 초대 코드로 참가 (공개 초대) */
export function joinByInviteCode(inviteCode: string, userId: string, userName: string): { success: boolean; error?: string } {
  if (typeof window === "undefined") return { success: false, error: "서버 오류" };
  try {
    const raw = localStorage.getItem(INVITATIONS_KEY);
    const all: TeamInvitation[] = raw ? JSON.parse(raw) : [];
    const inv = all.find((i) => i.inviteCode === inviteCode && i.status === "pending");

    if (!inv) return { success: false, error: "유효하지 않은 초대 코드입니다." };
    if (new Date() > new Date(inv.expiresAt)) {
      inv.status = "expired";
      localStorage.setItem(INVITATIONS_KEY, JSON.stringify(all));
      return { success: false, error: "만료된 초대 코드입니다." };
    }
    if (inv.inviterId === userId) return { success: false, error: "자신의 초대에 참가할 수 없습니다." };

    // 팀에 멤버 추가
    const teamsRaw = localStorage.getItem("dacon_teams");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const teams: any[] = teamsRaw ? JSON.parse(teamsRaw) : [];
    const teamIdx = teams.findIndex((t) => t.teamCode === inv.teamCode);
    if (teamIdx < 0) return { success: false, error: "팀을 찾을 수 없습니다." };

    if (!teams[teamIdx].members) teams[teamIdx].members = [];
    const alreadyMember = teams[teamIdx].members.some((m: { userId: string }) => m.userId === userId);
    if (alreadyMember) return { success: false, error: "이미 팀 멤버입니다." };

    teams[teamIdx].members.push({
      userId,
      name: userName,
      role: "팀원",
      joinedAt: new Date().toISOString(),
    });
    teams[teamIdx].memberCount = teams[teamIdx].members.length;
    localStorage.setItem("dacon_teams", JSON.stringify(teams));

    // 공개 초대는 여러 명이 사용 가능하므로 status는 변경하지 않음
    // 단, 특정 사용자 대상이면 수락 처리
    if (inv.inviteeId === userId) {
      inv.status = "accepted";
      localStorage.setItem(INVITATIONS_KEY, JSON.stringify(all));
    }

    return { success: true };
  } catch {
    return { success: false, error: "오류가 발생했습니다." };
  }
}

// =============================================
// 다이렉트 메시지 (DM) 시스템
// =============================================

const MESSAGES_KEY = "dacon_messages";

/** 메시지 전송 */
export function sendMessage(
  senderId: string,
  senderName: string,
  receiverId: string,
  receiverName: string,
  content: string
): DirectMessage | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(MESSAGES_KEY);
    const all: DirectMessage[] = raw ? JSON.parse(raw) : [];

    const msg: DirectMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      senderId,
      senderName,
      receiverId,
      receiverName,
      content,
      read: false,
      createdAt: new Date().toISOString(),
    };

    all.push(msg);
    // 최대 1000개 유지
    if (all.length > 1000) all.splice(0, all.length - 1000);
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(all));
    return msg;
  } catch {
    return null;
  }
}

/** 두 사용자 간 대화 내역 조회 */
export function getConversation(userId: string, partnerId: string): DirectMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(MESSAGES_KEY);
    const all: DirectMessage[] = raw ? JSON.parse(raw) : [];
    return all
      .filter(
        (m) =>
          (m.senderId === userId && m.receiverId === partnerId) ||
          (m.senderId === partnerId && m.receiverId === userId)
      )
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  } catch {
    return [];
  }
}

/** 사용자의 대화 목록 (최근 메시지 기준 정렬) */
export function getConversationList(userId: string): Conversation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(MESSAGES_KEY);
    const all: DirectMessage[] = raw ? JSON.parse(raw) : [];

    const myMessages = all.filter((m) => m.senderId === userId || m.receiverId === userId);
    const partnerMap = new Map<string, { partnerName: string; messages: DirectMessage[] }>();

    myMessages.forEach((m) => {
      const partnerId = m.senderId === userId ? m.receiverId : m.senderId;
      const partnerName = m.senderId === userId ? m.receiverName : m.senderName;
      if (!partnerMap.has(partnerId)) {
        partnerMap.set(partnerId, { partnerName, messages: [] });
      }
      partnerMap.get(partnerId)!.messages.push(m);
    });

    const conversations: Conversation[] = [];
    partnerMap.forEach((data, partnerId) => {
      const sorted = data.messages.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      const lastMsg = sorted[0];
      const unreadCount = data.messages.filter((m) => m.receiverId === userId && !m.read).length;
      conversations.push({
        partnerId,
        partnerName: data.partnerName,
        lastMessage: lastMsg.content,
        lastMessageAt: lastMsg.createdAt,
        unreadCount,
      });
    });

    return conversations.sort(
      (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    );
  } catch {
    return [];
  }
}

/** 특정 대화의 메시지를 읽음 처리 */
export function markMessagesRead(userId: string, partnerId: string) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(MESSAGES_KEY);
    const all: DirectMessage[] = raw ? JSON.parse(raw) : [];
    let changed = false;
    all.forEach((m) => {
      if (m.senderId === partnerId && m.receiverId === userId && !m.read) {
        m.read = true;
        changed = true;
      }
    });
    if (changed) localStorage.setItem(MESSAGES_KEY, JSON.stringify(all));
  } catch {
    // ignore
  }
}

/** 전체 읽지 않은 메시지 수 */
export function getUnreadMessageCount(userId: string): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(MESSAGES_KEY);
    const all: DirectMessage[] = raw ? JSON.parse(raw) : [];
    return all.filter((m) => m.receiverId === userId && !m.read).length;
  } catch {
    return 0;
  }
}

// =============================================
// 팔로우/팔로잉 시스템
// =============================================

const FOLLOWS_KEY = "dacon_follows";

/** 팔로우 */
export function followUser(followerId: string, followingId: string): boolean {
  if (typeof window === "undefined") return false;
  if (followerId === followingId) return false;
  try {
    const raw = localStorage.getItem(FOLLOWS_KEY);
    const all: FollowRelation[] = raw ? JSON.parse(raw) : [];

    // 이미 팔로우 중이면 무시
    if (all.some((f) => f.followerId === followerId && f.followingId === followingId)) return false;

    all.push({ followerId, followingId, createdAt: new Date().toISOString() });
    localStorage.setItem(FOLLOWS_KEY, JSON.stringify(all));
    return true;
  } catch {
    return false;
  }
}

/** 언팔로우 */
export function unfollowUser(followerId: string, followingId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(FOLLOWS_KEY);
    const all: FollowRelation[] = raw ? JSON.parse(raw) : [];
    const filtered = all.filter(
      (f) => !(f.followerId === followerId && f.followingId === followingId)
    );
    if (filtered.length === all.length) return false;
    localStorage.setItem(FOLLOWS_KEY, JSON.stringify(filtered));
    return true;
  } catch {
    return false;
  }
}

/** 팔로우 여부 확인 */
export function isFollowing(followerId: string, followingId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(FOLLOWS_KEY);
    const all: FollowRelation[] = raw ? JSON.parse(raw) : [];
    return all.some((f) => f.followerId === followerId && f.followingId === followingId);
  } catch {
    return false;
  }
}

/** 팔로워 목록 (나를 팔로우하는 사람들) */
export function getFollowers(userId: string): FollowRelation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FOLLOWS_KEY);
    const all: FollowRelation[] = raw ? JSON.parse(raw) : [];
    return all.filter((f) => f.followingId === userId);
  } catch {
    return [];
  }
}

/** 팔로잉 목록 (내가 팔로우하는 사람들) */
export function getFollowing(userId: string): FollowRelation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FOLLOWS_KEY);
    const all: FollowRelation[] = raw ? JSON.parse(raw) : [];
    return all.filter((f) => f.followerId === userId);
  } catch {
    return [];
  }
}

/** 팔로워/팔로잉 수 */
export function getFollowCounts(userId: string): { followers: number; following: number } {
  return {
    followers: getFollowers(userId).length,
    following: getFollowing(userId).length,
  };
}

// =============================================
// 팀 참가 정책 (자동 허용 / 확인 후 허용)
// =============================================

/** 팀 joinPolicy 변경 */
export function updateTeamJoinPolicy(teamCode: string, policy: "auto" | "approval"): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem("dacon_teams");
    const teams: Team[] = raw ? JSON.parse(raw) : [];
    const idx = teams.findIndex((t) => t.teamCode === teamCode);
    if (idx < 0) return false;
    teams[idx].joinPolicy = policy;
    localStorage.setItem("dacon_teams", JSON.stringify(teams));
    return true;
  } catch {
    return false;
  }
}

/** 팀 참가 요청 (joinPolicy에 따라 즉시 참가 또는 승인 대기) */
export function requestJoinTeam(
  teamCode: string,
  userId: string,
  userName: string,
  message: string = ""
): { status: "joined" | "pending" | "error"; error?: string } {
  if (typeof window === "undefined") return { status: "error", error: "SSR" };
  try {
    const raw = localStorage.getItem("dacon_teams");
    const teams: Team[] = raw ? JSON.parse(raw) : [];
    const idx = teams.findIndex((t) => t.teamCode === teamCode);
    if (idx < 0) return { status: "error", error: "팀을 찾을 수 없습니다." };

    const team = teams[idx];
    // 이미 멤버인지 확인
    if (team.members?.some((m: TeamMember) => m.userId === userId)) {
      return { status: "error", error: "이미 팀에 소속되어 있습니다." };
    }

    if (team.joinPolicy === "auto" || !team.joinPolicy) {
      // 자동 허용: 즉시 참가
      if (!team.members) team.members = [];
      team.members.push({ userId, name: userName, role: "팀원", joinedAt: new Date().toISOString() });
      team.memberCount = team.members.length;
      teams[idx] = team;
      localStorage.setItem("dacon_teams", JSON.stringify(teams));
      return { status: "joined" };
    } else {
      // 확인 후 허용: 참가 요청 생성
      const REQUESTS_KEY = "dacon_join_requests";
      const reqRaw = localStorage.getItem(REQUESTS_KEY);
      const requests: Array<{ id: string; teamCode: string; userId: string; userName: string; message: string; status: string; createdAt: string }> = reqRaw ? JSON.parse(reqRaw) : [];
      // 중복 요청 확인
      if (requests.some((r) => r.teamCode === teamCode && r.userId === userId && r.status === "pending")) {
        return { status: "error", error: "이미 참가 요청을 보냈습니다." };
      }
      requests.push({
        id: `req-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        teamCode,
        userId,
        userName,
        message,
        status: "pending",
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));
      return { status: "pending" };
    }
  } catch {
    return { status: "error", error: "처리 중 오류가 발생했습니다." };
  }
}

/** 팀 참가 요청 목록 */
export function getJoinRequests(teamCode: string): Array<{ id: string; teamCode: string; userId: string; userName: string; message: string; status: string; createdAt: string }> {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("dacon_join_requests");
    const all = raw ? JSON.parse(raw) : [];
    return all.filter((r: { teamCode: string }) => r.teamCode === teamCode);
  } catch {
    return [];
  }
}

/** 팀 참가 요청 승인/거절 */
export function handleJoinRequest(requestId: string, action: "accepted" | "rejected"): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem("dacon_join_requests");
    const requests: Array<{ id: string; teamCode: string; userId: string; userName: string; status: string }> = raw ? JSON.parse(raw) : [];
    const idx = requests.findIndex((r) => r.id === requestId);
    if (idx < 0) return false;

    const req = requests[idx];
    requests[idx].status = action;
    localStorage.setItem("dacon_join_requests", JSON.stringify(requests));

    if (action === "accepted") {
      // 팀에 멤버 추가
      const teamsRaw = localStorage.getItem("dacon_teams");
      const teams: Team[] = teamsRaw ? JSON.parse(teamsRaw) : [];
      const tIdx = teams.findIndex((t) => t.teamCode === req.teamCode);
      if (tIdx >= 0) {
        if (!teams[tIdx].members) teams[tIdx].members = [];
        teams[tIdx].members!.push({ userId: req.userId, name: req.userName, role: "팀원", joinedAt: new Date().toISOString() });
        teams[tIdx].memberCount = teams[tIdx].members!.length;
        localStorage.setItem("dacon_teams", JSON.stringify(teams));
      }
    }
    return true;
  } catch {
    return false;
  }
}

// =============================================
// 팀 탈퇴
// =============================================

/** 팀 탈퇴 */
export function leaveTeam(teamCode: string, userId: string): { success: boolean; error?: string } {
  if (typeof window === "undefined") return { success: false, error: "SSR" };
  try {
    const raw = localStorage.getItem("dacon_teams");
    const teams: Team[] = raw ? JSON.parse(raw) : [];
    const idx = teams.findIndex((t) => t.teamCode === teamCode);
    if (idx < 0) return { success: false, error: "팀을 찾을 수 없습니다." };

    const team = teams[idx];
    if (team.creatorId === userId) {
      return { success: false, error: "팀장은 탈퇴할 수 없습니다. 먼저 팀장을 위임해주세요." };
    }
    if (!team.members?.some((m: TeamMember) => m.userId === userId)) {
      return { success: false, error: "팀에 소속되어 있지 않습니다." };
    }

    team.members = team.members!.filter((m: TeamMember) => m.userId !== userId);
    team.memberCount = team.members.length;
    teams[idx] = team;
    localStorage.setItem("dacon_teams", JSON.stringify(teams));
    return { success: true };
  } catch {
    return { success: false, error: "처리 중 오류가 발생했습니다." };
  }
}

// =============================================
// 팀 내부 채팅 (오픈채팅방)
// =============================================

const TEAM_CHAT_KEY = "dacon_team_chat";

/** 팀 채팅 메시지 전송 */
export function sendTeamMessage(teamCode: string, senderId: string, senderName: string, content: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(TEAM_CHAT_KEY);
    const all: TeamChatMessage[] = raw ? JSON.parse(raw) : [];
    all.push({
      id: `tcm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      teamCode,
      senderId,
      senderName,
      content,
      createdAt: new Date().toISOString(),
    });
    // 최대 2000개 유지
    if (all.length > 2000) all.splice(0, all.length - 2000);
    localStorage.setItem(TEAM_CHAT_KEY, JSON.stringify(all));
    return true;
  } catch {
    return false;
  }
}

/** 팀 채팅 메시지 가져오기 */
export function getTeamMessages(teamCode: string): TeamChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(TEAM_CHAT_KEY);
    const all: TeamChatMessage[] = raw ? JSON.parse(raw) : [];
    return all.filter((m) => m.teamCode === teamCode).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  } catch {
    return [];
  }
}

// =============================================
// 활동 피드 (권한 기반 필터링)
// =============================================

/** 유저 권한별 활동 피드 */
export function getFilteredActivityFeed(userId: string, role: "admin" | "user", joinedHackathons: string[] = []): ActivityFeedItem[] {
  const allFeed = getActivityFeed();
  if (role === "admin") {
    return allFeed; // Admin은 전체 활동 확인 가능
  }
  // 일반 유저: 자신이 참여한 대회 관련 + 리더보드 변경 + 공지사항
  return allFeed.filter((item) => {
    if (item.type === "ranking_update") return true; // 리더보드 변경
    if (item.type === "hackathon_created") return true; // 중요 공지 (새 해커톤)
    if (item.hackathonSlug && joinedHackathons.includes(item.hackathonSlug)) return true; // 참여 대회 관련
    return false;
  });
}
