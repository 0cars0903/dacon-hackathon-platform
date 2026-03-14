# Supabase 마이그레이션 가이드

## 개요

localStorage 기반 → Supabase (PostgreSQL + Auth + Realtime) 전환 완료.

| 항목 | Before | After |
|------|--------|-------|
| 인증 | localStorage 평문 비밀번호 | Supabase Auth (bcrypt, JWT) |
| 데이터 저장 | localStorage 15개 키 | PostgreSQL 19개 테이블 |
| 채팅/DM | 3~5초 Polling | Supabase Realtime (WebSocket) |
| 권한 검증 | 클라이언트 측 | RLS (Row Level Security) |
| 세션 관리 | localStorage 수동 | HTTP-Only 쿠키 자동 갱신 |

---

## 설정 순서

### 1. Supabase 프로젝트 생성

1. [supabase.com](https://supabase.com) 에서 프로젝트 생성
2. Project Settings > API 에서 `URL`과 `anon key` 복사
3. `.env.local` 파일 생성:

```bash
cp .env.local.example .env.local
# 값 입력
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 2. 스키마 생성

Supabase Dashboard > SQL Editor에서 순서대로 실행:

```
supabase/migrations/001_initial_schema.sql  — 테이블, RLS, 트리거
supabase/migrations/002_seed_data.sql       — 해커톤, 리더보드, 활동 피드
```

### 3. Auth 설정

Dashboard > Authentication > Settings:
- **Email Confirmations**: OFF (개발 환경)
- **Minimum password length**: 6

### 4. 사용자 시드

```bash
# service_role key 필요 (Dashboard > Settings > API)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key npx tsx supabase/seed-users.ts
```

### 5. Realtime 활성화

Dashboard > Database > Replication에서 다음 테이블 활성화 확인:
- `team_chat_messages`
- `direct_messages`
- `notifications`
- `activity_feed`

### 6. 실행

```bash
npm run dev
```

---

## 파일 구조

```
src/lib/supabase/
├── client.ts      — 브라우저 클라이언트 (createBrowserClient)
├── server.ts      — 서버 클라이언트 (createServerClient)
├── data.ts        — 전체 CRUD 함수 (localStorage data.ts 1:1 대체)
├── realtime.ts    — Realtime 훅 (useTeamChat, useDirectMessages, useNotifications)
├── types.ts       — Database 타입 정의
└── index.ts       — Barrel export

src/middleware.ts   — Supabase 세션 자동 갱신

supabase/
├── migrations/
│   ├── 001_initial_schema.sql  — 19 테이블 + RLS + 트리거
│   └── 002_seed_data.sql       — 해커톤/리더보드/활동 시드
└── seed-users.ts               — Auth 사용자 + 프로필 + 팀 시드 스크립트
```

---

## 테이블 매핑 (localStorage → PostgreSQL)

| localStorage 키 | Supabase 테이블 | 비고 |
|-----------------|----------------|------|
| `dacon_auth` | `auth.users` + `profiles` | Supabase Auth 내장 |
| `dacon_users` | `auth.users` | 비밀번호 bcrypt 해싱 |
| `dacon_profiles` | `profiles` + `badges` + `hackathon_participants` + `team_members` | 정규화 |
| `dacon_teams` | `teams` + `team_members` | FK 관계 |
| `dacon_team_chat` | `team_chat_messages` | Realtime 활성화 |
| `dacon_join_requests` | `team_join_requests` | |
| `dacon_invitations` | `team_invitations` | 48시간 자동 만료 |
| `dacon_direct_messages` | `direct_messages` | Realtime 활성화 |
| `dacon_follows` | `follows` | UNIQUE + CHECK 제약 |
| `dacon_activity_feed` | `activity_feed` | |
| `dacon_notifications` | `notifications` | Realtime 활성화 |
| `dacon_forum_posts` | `forum_posts` | |
| `dacon_forum_comments` | `forum_comments` | CASCADE 삭제 |
| `dacon_submissions` | `submissions` | UPSERT 지원 |
| `dacon_preferences` | `user_preferences` | |
| (없음) | `hackathons` | 새로 추가 |
| (없음) | `hackathon_details` | JSON sections |
| (없음) | `hackathon_participants` | M:N 관계 |
| (없음) | `leaderboards` | JSON entries |

---

## Supabase 무료 플랜 제한

| 리소스 | 무료 한도 | 현재 사용 예상 |
|--------|----------|--------------|
| DB 용량 | 500 MB | ~10 MB |
| Auth 사용자 | 50,000 MAU | ~100 |
| Realtime 연결 | 200 동시 | ~20 |
| Edge Functions | 500K 호출/월 | 미사용 |
| Storage | 1 GB | 미사용 |
| Bandwidth | 5 GB | ~1 GB |

---

## 계정 정보

| 계정 | 이메일 | 비밀번호 | 역할 |
|------|--------|---------|------|
| 관리자 | kuma@dacon.io | kuma1234 | admin |
| 데모 | demo@dacon.io | demo1234 | user |
| 시드 유저 (22명) | *@dacon.io | user1234 | user |
