-- ============================================================
-- DACON Hackathon Platform — Supabase Migration
-- localStorage → PostgreSQL (Supabase Free Plan)
-- ============================================================

-- 0. Extensions
create extension if not exists "uuid-ossp";

-- ============================================================
-- 1. PROFILES (extends Supabase auth.users)
-- ============================================================
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  name         text not null,
  nickname     text not null,
  nickname_changed_at timestamptz,
  email        text not null unique,
  role         text not null default 'user' check (role in ('user', 'admin')),
  avatar_url   text,
  bio          text,
  skills       text[] default '{}',
  joined_at    timestamptz not null default now(),
  -- stats (denormalized for quick reads)
  hackathons_joined  int not null default 0,
  teams_created      int not null default 0,
  submissions_count  int not null default 0,
  total_score        numeric(10,2) not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ============================================================
-- 2. BADGES
-- ============================================================
create table public.badges (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  name         text not null,
  emoji        text not null,
  description  text not null,
  earned_at    timestamptz not null default now()
);
create index idx_badges_user on public.badges(user_id);

-- ============================================================
-- 3. HACKATHONS
-- ============================================================
create table public.hackathons (
  slug              text primary key,
  title             text not null,
  status            text not null default 'upcoming' check (status in ('ongoing','ended','upcoming')),
  tags              text[] default '{}',
  thumbnail_url     text,
  timezone          text default 'Asia/Seoul',
  submission_deadline_at timestamptz,
  end_at            timestamptz,
  detail_link       text,
  rules_link        text,
  faq_link          text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ============================================================
-- 4. HACKATHON DETAILS (1:1 with hackathons, JSON sections)
-- ============================================================
create table public.hackathon_details (
  slug       text primary key references public.hackathons(slug) on delete cascade,
  sections   jsonb not null default '{}'
);

-- ============================================================
-- 5. HACKATHON PARTICIPANTS (join table)
-- ============================================================
create table public.hackathon_participants (
  id              uuid primary key default uuid_generate_v4(),
  hackathon_slug  text not null references public.hackathons(slug) on delete cascade,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  joined_at       timestamptz not null default now(),
  unique(hackathon_slug, user_id)
);
create index idx_hp_user on public.hackathon_participants(user_id);
create index idx_hp_hackathon on public.hackathon_participants(hackathon_slug);

-- ============================================================
-- 6. TEAMS
-- ============================================================
create table public.teams (
  team_code       text primary key,
  hackathon_slug  text not null references public.hackathons(slug) on delete cascade,
  name            text not null,
  is_open         boolean not null default true,
  join_policy     text not null default 'auto' check (join_policy in ('auto', 'approval')),
  looking_for     text[] default '{}',
  intro           text,
  contact_type    text,
  contact_url     text,
  creator_id      uuid references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now()
);
create index idx_teams_hackathon on public.teams(hackathon_slug);

-- ============================================================
-- 7. TEAM MEMBERS (join table)
-- ============================================================
create table public.team_members (
  id         uuid primary key default uuid_generate_v4(),
  team_code  text not null references public.teams(team_code) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  name       text not null,
  role       text not null default '팀원',
  joined_at  timestamptz not null default now(),
  unique(team_code, user_id)
);
create index idx_tm_team on public.team_members(team_code);
create index idx_tm_user on public.team_members(user_id);

-- ============================================================
-- 8. TEAM JOIN REQUESTS
-- ============================================================
create table public.team_join_requests (
  id         uuid primary key default uuid_generate_v4(),
  team_code  text not null references public.teams(team_code) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  user_name  text not null,
  message    text,
  status     text not null default 'pending' check (status in ('pending','accepted','rejected')),
  created_at timestamptz not null default now()
);
create index idx_tjr_team on public.team_join_requests(team_code);

-- ============================================================
-- 9. TEAM INVITATIONS
-- ============================================================
create table public.team_invitations (
  id              uuid primary key default uuid_generate_v4(),
  team_code       text not null references public.teams(team_code) on delete cascade,
  team_name       text not null,
  hackathon_slug  text not null,
  invite_code     text not null unique,
  inviter_id      uuid not null references public.profiles(id) on delete cascade,
  inviter_name    text not null,
  invitee_id      uuid references public.profiles(id) on delete set null,
  invitee_name    text,
  status          text not null default 'pending' check (status in ('pending','accepted','rejected','expired')),
  created_at      timestamptz not null default now(),
  expires_at      timestamptz not null default (now() + interval '48 hours')
);
create index idx_ti_code on public.team_invitations(invite_code);
create index idx_ti_invitee on public.team_invitations(invitee_id);

-- ============================================================
-- 10. TEAM CHAT MESSAGES
-- ============================================================
create table public.team_chat_messages (
  id         uuid primary key default uuid_generate_v4(),
  team_code  text not null references public.teams(team_code) on delete cascade,
  sender_id  uuid not null references public.profiles(id) on delete cascade,
  sender_name text not null,
  content    text not null,
  created_at timestamptz not null default now()
);
create index idx_tcm_team on public.team_chat_messages(team_code, created_at);

-- ============================================================
-- 11. DIRECT MESSAGES
-- ============================================================
create table public.direct_messages (
  id            uuid primary key default uuid_generate_v4(),
  sender_id     uuid not null references public.profiles(id) on delete cascade,
  sender_name   text not null,
  receiver_id   uuid not null references public.profiles(id) on delete cascade,
  receiver_name text not null,
  content       text not null,
  read          boolean not null default false,
  created_at    timestamptz not null default now()
);
create index idx_dm_sender on public.direct_messages(sender_id, created_at);
create index idx_dm_receiver on public.direct_messages(receiver_id, created_at);
create index idx_dm_conversation on public.direct_messages(
  least(sender_id, receiver_id),
  greatest(sender_id, receiver_id),
  created_at
);

-- ============================================================
-- 12. FOLLOWS
-- ============================================================
create table public.follows (
  id           uuid primary key default uuid_generate_v4(),
  follower_id  uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at   timestamptz not null default now(),
  unique(follower_id, following_id),
  check(follower_id != following_id)
);
create index idx_follows_follower on public.follows(follower_id);
create index idx_follows_following on public.follows(following_id);

-- ============================================================
-- 13. ACTIVITY FEED
-- ============================================================
create table public.activity_feed (
  id              uuid primary key default uuid_generate_v4(),
  type            text not null check (type in ('team_created','submission','ranking_update','hackathon_created','forum_post','user_signup')),
  message         text not null,
  hackathon_slug  text references public.hackathons(slug) on delete set null,
  actor_id        uuid references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now()
);
create index idx_af_created on public.activity_feed(created_at desc);
create index idx_af_hackathon on public.activity_feed(hackathon_slug);

-- ============================================================
-- 14. NOTIFICATIONS
-- ============================================================
create table public.notifications (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  message    text not null,
  read       boolean not null default false,
  link       text,
  type       text default 'info' check (type in ('info','success','warning')),
  created_at timestamptz not null default now()
);
create index idx_notif_user on public.notifications(user_id, created_at desc);

-- ============================================================
-- 15. FORUM POSTS
-- ============================================================
create table public.forum_posts (
  id              uuid primary key default uuid_generate_v4(),
  hackathon_slug  text not null references public.hackathons(slug) on delete cascade,
  author_id       uuid not null references public.profiles(id) on delete cascade,
  author_name     text not null,
  author_nickname text,
  title           text not null,
  content         text not null,
  category        text not null default 'discussion' check (category in ('question','discussion','announcement','bug')),
  likes           uuid[] default '{}',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz
);
create index idx_fp_hackathon on public.forum_posts(hackathon_slug, created_at desc);

-- ============================================================
-- 16. FORUM COMMENTS
-- ============================================================
create table public.forum_comments (
  id              uuid primary key default uuid_generate_v4(),
  post_id         uuid not null references public.forum_posts(id) on delete cascade,
  author_id       uuid not null references public.profiles(id) on delete cascade,
  author_name     text not null,
  author_nickname text,
  content         text not null,
  likes           uuid[] default '{}',
  created_at      timestamptz not null default now()
);
create index idx_fc_post on public.forum_comments(post_id, created_at);

-- ============================================================
-- 17. LEADERBOARDS
-- ============================================================
create table public.leaderboards (
  hackathon_slug  text primary key references public.hackathons(slug) on delete cascade,
  eval_type       text not null default 'metric' check (eval_type in ('metric','judge','multi-round','vote')),
  metric_name     text,
  metric_formula  text,
  metric_columns  jsonb default '[]',
  rounds          jsonb default '[]',
  entries         jsonb not null default '[]',
  updated_at      timestamptz not null default now()
);

-- ============================================================
-- 18. SUBMISSIONS
-- ============================================================
create table public.submissions (
  id              uuid primary key default uuid_generate_v4(),
  hackathon_slug  text not null references public.hackathons(slug) on delete cascade,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  items           jsonb not null default '[]',
  status          text not null default 'draft' check (status in ('draft','submitted')),
  saved_at        timestamptz not null default now(),
  unique(hackathon_slug, user_id)
);

-- ============================================================
-- 19. USER PREFERENCES
-- ============================================================
create table public.user_preferences (
  user_id       uuid primary key references public.profiles(id) on delete cascade,
  theme         text not null default 'light' check (theme in ('light','dark')),
  color_theme   text not null default 'blue' check (color_theme in ('blue','purple','green')),
  interest_tags text[] default '{}'
);

-- ============================================================
-- RLS (Row Level Security) Policies
-- ============================================================

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.badges enable row level security;
alter table public.hackathons enable row level security;
alter table public.hackathon_details enable row level security;
alter table public.hackathon_participants enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.team_join_requests enable row level security;
alter table public.team_invitations enable row level security;
alter table public.team_chat_messages enable row level security;
alter table public.direct_messages enable row level security;
alter table public.follows enable row level security;
alter table public.activity_feed enable row level security;
alter table public.notifications enable row level security;
alter table public.forum_posts enable row level security;
alter table public.forum_comments enable row level security;
alter table public.leaderboards enable row level security;
alter table public.submissions enable row level security;
alter table public.user_preferences enable row level security;

-- PROFILES: public read, own write
create policy "profiles_select" on public.profiles for select using (true);
create policy "profiles_insert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on public.profiles for update using (
  auth.uid() = id or
  exists(select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- BADGES: public read, system insert
create policy "badges_select" on public.badges for select using (true);
create policy "badges_insert" on public.badges for insert with check (auth.uid() = user_id);

-- HACKATHONS: public read, admin write
create policy "hackathons_select" on public.hackathons for select using (true);
create policy "hackathons_insert" on public.hackathons for insert with check (
  exists(select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "hackathons_update" on public.hackathons for update using (
  exists(select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- HACKATHON DETAILS: public read, admin write
create policy "hd_select" on public.hackathon_details for select using (true);
create policy "hd_insert" on public.hackathon_details for insert with check (
  exists(select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "hd_update" on public.hackathon_details for update using (
  exists(select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- HACKATHON PARTICIPANTS: public read, own insert
create policy "hp_select" on public.hackathon_participants for select using (true);
create policy "hp_insert" on public.hackathon_participants for insert with check (auth.uid() = user_id);

-- TEAMS: public read, authenticated insert
create policy "teams_select" on public.teams for select using (true);
create policy "teams_insert" on public.teams for insert with check (auth.uid() = creator_id);
create policy "teams_update" on public.teams for update using (
  auth.uid() = creator_id or
  exists(select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- TEAM MEMBERS: public read, team operations
create policy "tm_select" on public.team_members for select using (true);
create policy "tm_insert" on public.team_members for insert with check (auth.uid() is not null);
create policy "tm_delete" on public.team_members for delete using (
  auth.uid() = user_id or
  exists(select 1 from public.teams where team_code = team_members.team_code and creator_id = auth.uid())
);

-- JOIN REQUESTS: team leader + requester can see
create policy "tjr_select" on public.team_join_requests for select using (
  auth.uid() = user_id or
  exists(select 1 from public.teams where team_code = team_join_requests.team_code and creator_id = auth.uid())
);
create policy "tjr_insert" on public.team_join_requests for insert with check (auth.uid() = user_id);
create policy "tjr_update" on public.team_join_requests for update using (
  exists(select 1 from public.teams where team_code = team_join_requests.team_code and creator_id = auth.uid())
);

-- INVITATIONS: public read for code lookup, own invitations
create policy "ti_select" on public.team_invitations for select using (true);
create policy "ti_insert" on public.team_invitations for insert with check (auth.uid() = inviter_id);
create policy "ti_update" on public.team_invitations for update using (
  auth.uid() = inviter_id or auth.uid() = invitee_id
);

-- TEAM CHAT: team members can read/write
create policy "tcm_select" on public.team_chat_messages for select using (
  exists(select 1 from public.team_members where team_code = team_chat_messages.team_code and user_id = auth.uid())
);
create policy "tcm_insert" on public.team_chat_messages for insert with check (
  auth.uid() = sender_id and
  exists(select 1 from public.team_members where team_code = team_chat_messages.team_code and user_id = auth.uid())
);

-- DIRECT MESSAGES: sender/receiver can see
create policy "dm_select" on public.direct_messages for select using (
  auth.uid() = sender_id or auth.uid() = receiver_id
);
create policy "dm_insert" on public.direct_messages for insert with check (auth.uid() = sender_id);
create policy "dm_update" on public.direct_messages for update using (auth.uid() = receiver_id);

-- FOLLOWS: public read, own manage
create policy "follows_select" on public.follows for select using (true);
create policy "follows_insert" on public.follows for insert with check (auth.uid() = follower_id);
create policy "follows_delete" on public.follows for delete using (auth.uid() = follower_id);

-- ACTIVITY FEED: public read, authenticated insert
create policy "af_select" on public.activity_feed for select using (true);
create policy "af_insert" on public.activity_feed for insert with check (auth.uid() is not null);

-- NOTIFICATIONS: own only
create policy "notif_select" on public.notifications for select using (auth.uid() = user_id);
create policy "notif_insert" on public.notifications for insert with check (auth.uid() is not null);
create policy "notif_update" on public.notifications for update using (auth.uid() = user_id);

-- FORUM POSTS: public read, authenticated write
create policy "fp_select" on public.forum_posts for select using (true);
create policy "fp_insert" on public.forum_posts for insert with check (auth.uid() = author_id);
create policy "fp_update" on public.forum_posts for update using (auth.uid() = author_id);

-- FORUM COMMENTS: public read, authenticated write
create policy "fc_select" on public.forum_comments for select using (true);
create policy "fc_insert" on public.forum_comments for insert with check (auth.uid() = author_id);

-- LEADERBOARDS: public read, admin write
create policy "lb_select" on public.leaderboards for select using (true);
create policy "lb_upsert" on public.leaderboards for insert with check (
  exists(select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "lb_update" on public.leaderboards for update using (
  exists(select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- SUBMISSIONS: own read/write
create policy "sub_select" on public.submissions for select using (auth.uid() = user_id);
create policy "sub_insert" on public.submissions for insert with check (auth.uid() = user_id);
create policy "sub_update" on public.submissions for update using (auth.uid() = user_id);

-- USER PREFERENCES: own only
create policy "pref_select" on public.user_preferences for select using (auth.uid() = user_id);
create policy "pref_upsert" on public.user_preferences for insert with check (auth.uid() = user_id);
create policy "pref_update" on public.user_preferences for update using (auth.uid() = user_id);

-- ============================================================
-- REALTIME: Enable for chat & messaging tables
-- ============================================================
alter publication supabase_realtime add table public.team_chat_messages;
alter publication supabase_realtime add table public.direct_messages;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.activity_feed;

-- ============================================================
-- FUNCTIONS: Auto-create profile on signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, nickname, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'user')
  );
  insert into public.user_preferences (user_id) values (new.id);
  insert into public.badges (user_id, name, emoji, description)
  values (new.id, '환영합니다', '👋', '플랫폼에 가입하신 것을 환영합니다!');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- FUNCTIONS: Auto-expire invitations
-- ============================================================
create or replace function public.expire_old_invitations()
returns void as $$
begin
  update public.team_invitations
  set status = 'expired'
  where status = 'pending' and expires_at < now();
end;
$$ language plpgsql security definer;

-- ============================================================
-- FUNCTIONS: updated_at trigger
-- ============================================================
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at();

create trigger hackathons_updated_at
  before update on public.hackathons
  for each row execute function public.update_updated_at();
