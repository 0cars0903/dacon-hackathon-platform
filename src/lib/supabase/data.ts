// ============================================================
// Supabase Data Layer — localStorage 함수 1:1 대체
// ============================================================
import { createClient } from "./client";
import type {
  Hackathon, HackathonDetail, Team, TeamMember, TeamChatMessage,
  Leaderboard, ActivityFeedItem, DirectMessage, Conversation,
  FollowRelation, TeamInvitation, ForumPost, ForumComment,
  UserProfile, UserBadge, UserPreferences, Submission,
  TeamJoinRequest,
} from "@/types";

function supabase() {
  return createClient();
}

/** 공통 에러 로깅 헬퍼 */
function logSupabaseError(fn: string, error: unknown) {
  console.error(`[Supabase:${fn}]`, error);
}

// ============================================================
// HACKATHONS
// ============================================================
export async function getHackathons(): Promise<Hackathon[]> {
  const { data, error } = await supabase()
    .from("hackathons")
    .select("*")
    .in("status", ["ongoing", "upcoming"])
    .order("created_at", { ascending: false });
  if (error) logSupabaseError("getHackathons", error);
  return (data ?? []).map(mapHackathon);
}

export async function getAllHackathonsUnfiltered(): Promise<Hackathon[]> {
  const { data, error } = await supabase()
    .from("hackathons")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) logSupabaseError("getAllHackathonsUnfiltered", error);
  return (data ?? []).map(mapHackathon);
}

export async function getHackathonBySlug(slug: string): Promise<Hackathon | undefined> {
  const { data } = await supabase()
    .from("hackathons")
    .select("*")
    .eq("slug", slug)
    .single();
  return data ? mapHackathon(data) : undefined;
}

export async function getHackathonDetail(slug: string): Promise<HackathonDetail | undefined> {
  const { data: h } = await supabase()
    .from("hackathons")
    .select("slug, title")
    .eq("slug", slug)
    .single();
  const { data: d } = await supabase()
    .from("hackathon_details")
    .select("sections")
    .eq("slug", slug)
    .single();
  if (!h || !d) return undefined;
  return { slug: h.slug, title: h.title, sections: d.sections as HackathonDetail["sections"] };
}

export async function getAllHackathonDetails(): Promise<HackathonDetail[]> {
  const { data } = await supabase()
    .from("hackathon_details")
    .select("slug, sections");
  if (!data) return [];
  const { data: hacks } = await supabase().from("hackathons").select("slug, title");
  const titleMap = Object.fromEntries((hacks ?? []).map((h: any) => [h.slug, h.title]));
  return data.map((d: any) => ({
    slug: d.slug,
    title: titleMap[d.slug] ?? d.slug,
    sections: d.sections as HackathonDetail["sections"],
  }));
}

export async function getPlatformStats() {
  const { data: ongoingData, error: e1 } = await supabase()
    .from("hackathons").select("slug").eq("status", "ongoing");
  const { data: upcomingData, error: e2 } = await supabase()
    .from("hackathons").select("slug").eq("status", "upcoming");
  const { data: usersData, error: e3 } = await supabase()
    .from("profiles").select("id");
  const { data: teamsData, error: e4 } = await supabase()
    .from("teams").select("team_code");
  if (e1 || e2 || e3 || e4) logSupabaseError("getPlatformStats", { e1, e2, e3, e4 });
  return {
    ongoingHackathons: ongoingData?.length ?? 0,
    upcomingHackathons: upcomingData?.length ?? 0,
    totalUsers: usersData?.length ?? 0,
    totalTeams: teamsData?.length ?? 0,
  };
}

export async function getRecommendedHackathons(interestTags: string[]): Promise<Hackathon[]> {
  const all = await getHackathons();
  if (!interestTags.length) return all.slice(0, 5);
  return all
    .map(h => ({ h, score: h.tags.filter(t => interestTags.includes(t)).length }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(x => x.h);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapHackathon(row: any): Hackathon {
  return {
    slug: row.slug,
    title: row.title,
    status: row.status,
    tags: row.tags ?? [],
    thumbnailUrl: row.thumbnail_url ?? "",
    period: {
      timezone: row.timezone ?? "Asia/Seoul",
      submissionDeadlineAt: row.submission_deadline_at ?? "",
      endAt: row.end_at ?? "",
    },
    links: {
      detail: row.detail_link ?? `/hackathons/${row.slug}`,
      rules: row.rules_link ?? "",
      faq: row.faq_link ?? "",
    },
  };
}

// ============================================================
// TEAMS
// ============================================================
export async function getTeams(): Promise<Team[]> {
  const { data, error } = await supabase()
    .from("teams")
    .select("*, team_members(*)")
    .order("created_at", { ascending: false });
  if (error) logSupabaseError("getTeams", error);
  return (data ?? []).map(mapTeam);
}

export async function getTeamsByHackathon(hackathonSlug: string): Promise<Team[]> {
  const { data, error } = await supabase()
    .from("teams")
    .select("*, team_members(*)")
    .eq("hackathon_slug", hackathonSlug)
    .order("created_at", { ascending: false });
  if (error) logSupabaseError("getTeamsByHackathon", error);
  return (data ?? []).map(mapTeam);
}

export async function getRecommendedTeams(interestTags: string[]): Promise<Team[]> {
  const all = await getTeams();
  if (!interestTags.length) return all.filter(t => t.isOpen).slice(0, 5);
  return all
    .filter(t => t.isOpen)
    .map(t => ({ t, score: t.lookingFor.filter(l => interestTags.includes(l)).length }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(x => x.t);
}

export async function updateTeamJoinPolicy(teamCode: string, policy: "auto" | "approval"): Promise<boolean> {
  const { error } = await supabase()
    .from("teams")
    .update({ join_policy: policy })
    .eq("team_code", teamCode);
  return !error;
}

export async function requestJoinTeam(
  teamCode: string, userId: string, userName: string, message?: string
): Promise<{ status: "joined" | "pending" | "error"; error?: string }> {
  const { data: team } = await supabase()
    .from("teams")
    .select("join_policy, is_open")
    .eq("team_code", teamCode)
    .single();
  if (!team) return { status: "error", error: "팀을 찾을 수 없습니다." };
  if (!team.is_open) return { status: "error", error: "팀이 모집을 마감했습니다." };

  // 이미 멤버인지 확인
  const { data: existing } = await supabase()
    .from("team_members")
    .select("id")
    .eq("team_code", teamCode)
    .eq("user_id", userId)
    .maybeSingle();
  if (existing) return { status: "error", error: "이미 팀에 참여 중입니다." };

  if (team.join_policy === "auto") {
    const { error } = await supabase()
      .from("team_members")
      .insert({ team_code: teamCode, user_id: userId, name: userName, role: "팀원" });
    if (error) return { status: "error", error: error.message };
    return { status: "joined" };
  } else {
    const { error } = await supabase()
      .from("team_join_requests")
      .insert({ team_code: teamCode, user_id: userId, user_name: userName, message: message ?? "" });
    if (error) return { status: "error", error: error.message };
    return { status: "pending" };
  }
}

export async function getJoinRequests(teamCode: string): Promise<TeamJoinRequest[]> {
  const { data } = await supabase()
    .from("team_join_requests")
    .select("*")
    .eq("team_code", teamCode)
    .eq("status", "pending")
    .order("created_at", { ascending: true });
  return (data ?? []).map((r: any) => ({
    id: r.id, teamCode: r.team_code, userId: r.user_id,
    userName: r.user_name, message: r.message ?? "",
    status: r.status as TeamJoinRequest["status"], createdAt: r.created_at,
  }));
}

export async function handleJoinRequest(requestId: string, action: "accepted" | "rejected"): Promise<boolean> {
  const { data: req } = await supabase()
    .from("team_join_requests")
    .select("*")
    .eq("id", requestId)
    .single();
  if (!req) return false;

  const { error } = await supabase()
    .from("team_join_requests")
    .update({ status: action })
    .eq("id", requestId);
  if (error) return false;

  if (action === "accepted") {
    await supabase().from("team_members").insert({
      team_code: req.team_code, user_id: req.user_id, name: req.user_name, role: "팀원",
    });
  }
  return true;
}

export async function leaveTeam(teamCode: string, userId: string): Promise<{ success: boolean; error?: string }> {
  const { data: team } = await supabase()
    .from("teams")
    .select("creator_id")
    .eq("team_code", teamCode)
    .single();
  if (!team) return { success: false, error: "팀을 찾을 수 없습니다." };
  if (team.creator_id === userId) return { success: false, error: "팀장은 팀을 떠날 수 없습니다. 팀장을 위임해주세요." };

  const { error } = await supabase()
    .from("team_members")
    .delete()
    .eq("team_code", teamCode)
    .eq("user_id", userId);
  return error ? { success: false, error: error.message } : { success: true };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapTeam(row: any): Team {
  const members: TeamMember[] = (row.team_members ?? []).map((m: any) => ({
    userId: m.user_id, name: m.name, role: m.role, joinedAt: m.joined_at,
  }));
  return {
    teamCode: row.team_code,
    hackathonSlug: row.hackathon_slug,
    name: row.name,
    isOpen: row.is_open,
    joinPolicy: row.join_policy,
    memberCount: members.length,
    lookingFor: row.looking_for ?? [],
    intro: row.intro ?? "",
    contact: { type: row.contact_type ?? "", url: row.contact_url ?? "" },
    createdAt: row.created_at,
    creatorId: row.creator_id,
    members,
  };
}

// ============================================================
// TEAM CHAT (Realtime-ready)
// ============================================================
export async function sendTeamMessage(
  teamCode: string, senderId: string, senderName: string, content: string
): Promise<boolean> {
  const { error } = await supabase()
    .from("team_chat_messages")
    .insert({ team_code: teamCode, sender_id: senderId, sender_name: senderName, content });
  return !error;
}

export async function getTeamMessages(teamCode: string): Promise<TeamChatMessage[]> {
  const { data } = await supabase()
    .from("team_chat_messages")
    .select("*")
    .eq("team_code", teamCode)
    .order("created_at", { ascending: true })
    .limit(200);
  return (data ?? []).map((m: any) => ({
    id: m.id, teamCode: m.team_code, senderId: m.sender_id,
    senderName: m.sender_name, content: m.content, createdAt: m.created_at,
  }));
}

// ============================================================
// TEAM INVITATIONS
// ============================================================
function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function createTeamInvitation(
  teamCode: string, teamName: string, hackathonSlug: string,
  inviterId: string, inviterName: string, inviteeId?: string, inviteeName?: string
): Promise<TeamInvitation | null> {
  const inviteCode = generateInviteCode();
  const { data, error } = await supabase()
    .from("team_invitations")
    .insert({
      team_code: teamCode, team_name: teamName, hackathon_slug: hackathonSlug,
      invite_code: inviteCode, inviter_id: inviterId, inviter_name: inviterName,
      invitee_id: inviteeId ?? null, invitee_name: inviteeName ?? null,
    })
    .select()
    .single();
  if (error || !data) return null;
  return mapInvitation(data);
}

export async function getInvitationByCode(inviteCode: string): Promise<TeamInvitation | null> {
  const { data } = await supabase()
    .from("team_invitations")
    .select("*")
    .eq("invite_code", inviteCode)
    .single();
  return data ? mapInvitation(data) : null;
}

export async function getInvitationsForUser(userId: string): Promise<TeamInvitation[]> {
  const { data } = await supabase()
    .from("team_invitations")
    .select("*")
    .eq("invitee_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  return (data ?? []).map(mapInvitation);
}

export async function getInvitationsByTeam(teamCode: string): Promise<TeamInvitation[]> {
  const { data } = await supabase()
    .from("team_invitations")
    .select("*")
    .eq("team_code", teamCode)
    .order("created_at", { ascending: false });
  return (data ?? []).map(mapInvitation);
}

export async function acceptInvitation(invitationId: string, userId: string, userName: string): Promise<boolean> {
  const { data: inv } = await supabase()
    .from("team_invitations")
    .select("*")
    .eq("id", invitationId)
    .single();
  if (!inv || inv.status !== "pending") return false;

  const { error } = await supabase()
    .from("team_invitations")
    .update({ status: "accepted" })
    .eq("id", invitationId);
  if (error) return false;

  await supabase().from("team_members").insert({
    team_code: inv.team_code, user_id: userId, name: userName, role: "팀원",
  });
  return true;
}

export async function rejectInvitation(invitationId: string): Promise<boolean> {
  const { error } = await supabase()
    .from("team_invitations")
    .update({ status: "rejected" })
    .eq("id", invitationId);
  return !error;
}

export async function joinByInviteCode(
  inviteCode: string, userId: string, userName: string
): Promise<{ success: boolean; error?: string }> {
  const inv = await getInvitationByCode(inviteCode);
  if (!inv) return { success: false, error: "유효하지 않은 초대 코드입니다." };
  if (inv.status !== "pending") return { success: false, error: "이미 사용되었거나 만료된 초대입니다." };
  if (new Date(inv.expiresAt) < new Date()) return { success: false, error: "초대가 만료되었습니다." };

  const ok = await acceptInvitation(inv.id, userId, userName);
  return ok ? { success: true } : { success: false, error: "참가에 실패했습니다." };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapInvitation(row: any): TeamInvitation {
  return {
    id: row.id, teamCode: row.team_code, teamName: row.team_name,
    hackathonSlug: row.hackathon_slug, inviteCode: row.invite_code,
    inviterId: row.inviter_id, inviterName: row.inviter_name,
    inviteeId: row.invitee_id, inviteeName: row.invitee_name,
    status: row.status, createdAt: row.created_at, expiresAt: row.expires_at,
  };
}

// ============================================================
// DIRECT MESSAGES (Realtime-ready)
// ============================================================
export async function sendMessage(
  senderId: string, senderName: string, receiverId: string, receiverName: string, content: string
): Promise<DirectMessage | null> {
  const { data, error } = await supabase()
    .from("direct_messages")
    .insert({ sender_id: senderId, sender_name: senderName, receiver_id: receiverId, receiver_name: receiverName, content })
    .select()
    .single();
  if (error || !data) return null;
  return mapDM(data);
}

export async function getConversation(userId: string, partnerId: string): Promise<DirectMessage[]> {
  const { data } = await supabase()
    .from("direct_messages")
    .select("*")
    .or(`and(sender_id.eq.${userId},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${userId})`)
    .order("created_at", { ascending: true })
    .limit(200);
  return (data ?? []).map(mapDM);
}

export async function getConversationList(userId: string): Promise<Conversation[]> {
  // DM의 모든 메시지 중 사용자가 관련된 것을 가져와 파트너별 그룹핑
  const { data } = await supabase()
    .from("direct_messages")
    .select("*")
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order("created_at", { ascending: false })
    .limit(500);

  if (!data?.length) return [];

  const convMap = new Map<string, Conversation>();
  for (const m of data) {
    const partnerId = m.sender_id === userId ? m.receiver_id : m.sender_id;
    const partnerName = m.sender_id === userId ? m.receiver_name : m.sender_name;
    if (!convMap.has(partnerId)) {
      const unread = data.filter(
        (d: any) => d.sender_id === partnerId && d.receiver_id === userId && !d.read
      ).length;
      convMap.set(partnerId, {
        partnerId, partnerName, lastMessage: m.content,
        lastMessageAt: m.created_at, unreadCount: unread,
      });
    }
  }
  return Array.from(convMap.values()).sort(
    (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
  );
}

export async function markMessagesRead(userId: string, partnerId: string): Promise<void> {
  await supabase()
    .from("direct_messages")
    .update({ read: true })
    .eq("sender_id", partnerId)
    .eq("receiver_id", userId)
    .eq("read", false);
}

export async function getUnreadMessageCount(userId: string): Promise<number> {
  const { data } = await supabase()
    .from("direct_messages")
    .select("id")
    .eq("receiver_id", userId)
    .eq("read", false);
  return data?.length ?? 0;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapDM(row: any): DirectMessage {
  return {
    id: row.id, senderId: row.sender_id, senderName: row.sender_name,
    receiverId: row.receiver_id, receiverName: row.receiver_name,
    content: row.content, read: row.read, createdAt: row.created_at,
  };
}

// ============================================================
// FOLLOWS
// ============================================================
export async function followUser(followerId: string, followingId: string): Promise<boolean> {
  const { error } = await supabase()
    .from("follows")
    .insert({ follower_id: followerId, following_id: followingId });
  return !error;
}

export async function unfollowUser(followerId: string, followingId: string): Promise<boolean> {
  const { error } = await supabase()
    .from("follows")
    .delete()
    .eq("follower_id", followerId)
    .eq("following_id", followingId);
  return !error;
}

export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  const { data } = await supabase()
    .from("follows")
    .select("id")
    .eq("follower_id", followerId)
    .eq("following_id", followingId)
    .maybeSingle();
  return !!data;
}

export async function getFollowers(userId: string): Promise<FollowRelation[]> {
  const { data } = await supabase()
    .from("follows")
    .select("*")
    .eq("following_id", userId);
  return (data ?? []).map((f: any) => ({
    followerId: f.follower_id, followingId: f.following_id, createdAt: f.created_at,
  }));
}

export async function getFollowing(userId: string): Promise<FollowRelation[]> {
  const { data } = await supabase()
    .from("follows")
    .select("*")
    .eq("follower_id", userId);
  return (data ?? []).map((f: any) => ({
    followerId: f.follower_id, followingId: f.following_id, createdAt: f.created_at,
  }));
}

export async function getFollowCounts(userId: string): Promise<{ followers: number; following: number }> {
  const { data: followersData } = await supabase()
    .from("follows").select("id").eq("following_id", userId);
  const { data: followingData } = await supabase()
    .from("follows").select("id").eq("follower_id", userId);
  return { followers: followersData?.length ?? 0, following: followingData?.length ?? 0 };
}

// ============================================================
// ACTIVITY FEED
// ============================================================
export async function logActivity(item: Omit<ActivityFeedItem, "id">): Promise<void> {
  const { data: { user } } = await supabase().auth.getUser();
  await supabase().from("activity_feed").insert({
    type: item.type, message: item.message,
    hackathon_slug: item.hackathonSlug ?? null,
    actor_id: user?.id ?? null,
  });
}

export async function getActivityFeed(): Promise<ActivityFeedItem[]> {
  const { data } = await supabase()
    .from("activity_feed")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  return (data ?? []).map((a: any) => ({
    id: a.id, type: a.type as ActivityFeedItem["type"], message: a.message,
    timestamp: a.created_at, hackathonSlug: a.hackathon_slug ?? undefined,
  }));
}

export async function getFilteredActivityFeed(
  userId: string, role: string, joinedHackathons?: string[]
): Promise<ActivityFeedItem[]> {
  if (role === "admin") return getActivityFeed();

  let query = supabase()
    .from("activity_feed")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (joinedHackathons?.length) {
    // ranking_update + hackathon_created + 참여 해커톤 관련
    query = query.or(
      `type.in.(ranking_update,hackathon_created),hackathon_slug.in.(${joinedHackathons.join(",")})`
    );
  } else {
    query = query.in("type", ["ranking_update", "hackathon_created"]);
  }

  const { data } = await query;
  return (data ?? []).map((a: any) => ({
    id: a.id, type: a.type as ActivityFeedItem["type"], message: a.message,
    timestamp: a.created_at, hackathonSlug: a.hackathon_slug ?? undefined,
  }));
}

// ============================================================
// NOTIFICATIONS
// ============================================================
export async function addNotification(
  userId: string, notification: { message: string; link?: string; type?: "info" | "success" | "warning" }
): Promise<void> {
  await supabase().from("notifications").insert({
    user_id: userId, message: notification.message,
    link: notification.link ?? null, type: notification.type ?? "info",
  });
}

export async function getNotifications(userId: string) {
  const { data } = await supabase()
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  return (data ?? []).map((n: any) => ({
    id: n.id, message: n.message, read: n.read,
    timestamp: n.created_at, link: n.link, type: n.type,
  }));
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  await supabase().from("notifications").update({ read: true }).eq("id", notificationId);
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  await supabase().from("notifications").update({ read: true }).eq("user_id", userId).eq("read", false);
}

// ============================================================
// FORUM
// ============================================================
export async function getForumPosts(hackathonSlug: string): Promise<ForumPost[]> {
  const { data } = await supabase()
    .from("forum_posts")
    .select("*")
    .eq("hackathon_slug", hackathonSlug)
    .order("created_at", { ascending: false });
  return (data ?? []).map(mapForumPost);
}

export async function getForumComments(postId: string): Promise<ForumComment[]> {
  const { data } = await supabase()
    .from("forum_comments")
    .select("*")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });
  return (data ?? []).map((c: any) => ({
    id: c.id, postId: c.post_id, authorId: c.author_id,
    authorName: c.author_name, authorNickname: c.author_nickname,
    content: c.content, likes: c.likes ?? [], createdAt: c.created_at,
  }));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapForumPost(row: any): ForumPost {
  return {
    id: row.id, hackathonSlug: row.hackathon_slug, authorId: row.author_id,
    authorName: row.author_name, authorNickname: row.author_nickname,
    title: row.title, content: row.content, category: row.category,
    likes: row.likes ?? [], createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

// ============================================================
// LEADERBOARD
// ============================================================
export async function getLeaderboard(hackathonSlug: string): Promise<Leaderboard | undefined> {
  const { data } = await supabase()
    .from("leaderboards")
    .select("*")
    .eq("hackathon_slug", hackathonSlug)
    .single();
  if (!data) return undefined;
  return {
    hackathonSlug: data.hackathon_slug,
    evalType: data.eval_type as Leaderboard["evalType"],
    metricName: data.metric_name ?? "", metricFormula: data.metric_formula ?? undefined,
    metricColumns: (data.metric_columns ?? []) as Leaderboard["metricColumns"],
    rounds: (data.rounds ?? []) as Leaderboard["rounds"],
    entries: (data.entries ?? []) as Leaderboard["entries"],
    updatedAt: data.updated_at,
  };
}

export async function getAllLeaderboards(): Promise<Leaderboard[]> {
  const { data } = await supabase().from("leaderboards").select("*");
  return (data ?? []).map((d: any) => ({
    hackathonSlug: d.hackathon_slug,
    evalType: d.eval_type as Leaderboard["evalType"],
    metricName: d.metric_name ?? "", metricFormula: d.metric_formula ?? undefined,
    metricColumns: (d.metric_columns ?? []) as Leaderboard["metricColumns"],
    rounds: (d.rounds ?? []) as Leaderboard["rounds"],
    entries: (d.entries ?? []) as Leaderboard["entries"],
    updatedAt: d.updated_at,
  }));
}

// ============================================================
// SUBMISSIONS
// ============================================================
export async function getSubmission(hackathonSlug: string, userId: string): Promise<Submission | undefined> {
  const { data } = await supabase()
    .from("submissions")
    .select("*")
    .eq("hackathon_slug", hackathonSlug)
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) return undefined;
  return {
    hackathonSlug: data.hackathon_slug,
    items: (data.items ?? []) as Submission["items"],
    status: data.status as Submission["status"],
    savedAt: data.saved_at,
  };
}

export async function saveSubmission(hackathonSlug: string, userId: string, submission: Partial<Submission>): Promise<boolean> {
  const { error } = await supabase()
    .from("submissions")
    .upsert({
      hackathon_slug: hackathonSlug, user_id: userId,
      items: submission.items ?? [], status: submission.status ?? "draft",
      saved_at: new Date().toISOString(),
    }, { onConflict: "hackathon_slug,user_id" });
  return !error;
}

// ============================================================
// PROFILES
// ============================================================
export async function getProfile(userId: string): Promise<UserProfile | undefined> {
  const { data: p } = await supabase()
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (!p) return undefined;

  const { data: badges } = await supabase()
    .from("badges").select("*").eq("user_id", userId);
  const { data: hp } = await supabase()
    .from("hackathon_participants").select("hackathon_slug").eq("user_id", userId);
  const { data: tm } = await supabase()
    .from("team_members").select("team_code").eq("user_id", userId);

  return {
    id: p.id, name: p.name, nickname: p.nickname,
    nicknameChangedAt: p.nickname_changed_at ?? undefined,
    email: p.email, role: p.role as "user" | "admin",
    avatarUrl: p.avatar_url ?? undefined, bio: p.bio ?? undefined,
    skills: p.skills ?? [],
    joinedAt: p.joined_at,
    stats: {
      hackathonsJoined: p.hackathons_joined,
      teamsCreated: p.teams_created,
      submissions: p.submissions_count,
      totalScore: p.total_score,
    },
    badges: (badges ?? []).map((b: any) => ({
      id: b.id, name: b.name, emoji: b.emoji,
      description: b.description, earnedAt: b.earned_at,
    })),
    joinedHackathons: (hp ?? []).map((h: any) => h.hackathon_slug),
    teamMemberships: (tm ?? []).map((t: any) => t.team_code),
  };
}

export async function updateProfile(userId: string, updates: Partial<UserProfile>): Promise<boolean> {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.nickname !== undefined) dbUpdates.nickname = updates.nickname;
  if (updates.nicknameChangedAt !== undefined) dbUpdates.nickname_changed_at = updates.nicknameChangedAt;
  if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
  if (updates.skills !== undefined) dbUpdates.skills = updates.skills;
  if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;
  if (updates.stats) {
    dbUpdates.hackathons_joined = updates.stats.hackathonsJoined;
    dbUpdates.teams_created = updates.stats.teamsCreated;
    dbUpdates.submissions_count = updates.stats.submissions;
    dbUpdates.total_score = updates.stats.totalScore;
  }

  const { error } = await supabase().from("profiles").update(dbUpdates).eq("id", userId);
  return !error;
}

// ============================================================
// USER PREFERENCES
// ============================================================
export async function getUserPreferences(userId: string): Promise<UserPreferences> {
  const { data } = await supabase()
    .from("user_preferences")
    .select("*")
    .eq("user_id", userId)
    .single();
  return {
    theme: (data?.theme ?? "light") as UserPreferences["theme"],
    colorTheme: (data?.color_theme ?? "blue") as UserPreferences["colorTheme"],
    interestTags: data?.interest_tags ?? [],
  };
}

export async function saveUserPreferences(userId: string, prefs: Partial<UserPreferences>): Promise<boolean> {
  const { error } = await supabase()
    .from("user_preferences")
    .upsert({
      user_id: userId,
      theme: prefs.theme ?? "light",
      color_theme: prefs.colorTheme ?? "blue",
      interest_tags: prefs.interestTags ?? [],
    }, { onConflict: "user_id" });
  return !error;
}
