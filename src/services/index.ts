// ============================================================
// Service Layer Exports
// ============================================================

export { HackathonService } from "./hackathon.service";
export type { HackathonQuery, CreateHackathonInput, UpdateHackathonInput } from "./hackathon.service";

export { TeamService } from "./team.service";
export type {
  CreateTeamInput,
  UpdateTeamInput,
  SendTeamMessageInput,
  CreateTeamInvitationInput,
} from "./team.service";

export { UserService } from "./user.service";
export type { UpdateProfileInput, SendDirectMessageInput } from "./user.service";

export { SubmissionService } from "./submission.service";
export type { UpdateSubmissionInput, SubmissionScoreInput } from "./submission.service";
export type { ScoredSubmission } from "@/lib/supabase/data";

export { ForumService } from "./forum.service";
export type { CreateForumPostInput, CreateForumCommentInput } from "./forum.service";

export { NotificationService } from "./notification.service";
export type {
  ActivityLogInput,
  AddNotificationInput,
  ActivityFeedFilter,
} from "./notification.service";
