# DACON Hackathon Platform

AI/ML 해커톤 대회 운영을 위한 풀스택 웹 플랫폼입니다.
해커톤 관리, 팀 빌딩, CSV 기반 자동 채점, 리더보드, 커뮤니티 기능을 제공합니다.

**Live Demo**: [dacon-hackathon-platform.vercel.app](https://dacon-hackathon-platform.vercel.app)

---

## 주요 기능

**해커톤 관리** — 대회 목록/상세, 참가 신청, 관리자 CRUD, 상태 관리(upcoming/ongoing/ended)

**팀 빌딩** — 팀 생성/가입, 초대 코드, 가입 승인, 팀 채팅, 멤버 관리

**제출 & 채점** — CSV 파일 제출, Classification/Regression 자동 채점, Accuracy·Macro F1·RMSE·R² 등 메트릭 산출, Confusion Matrix

**리더보드** — 실시간 순위표, 다중 평가 방식 지원(metric/judge/multi-round/vote)

**커뮤니티** — 토론 게시판(질문/토론/공지/버그), 댓글, 좋아요, DM, 팔로우/팔로워, 활동 피드

**사용자** — 프로필 관리, 배지 시스템, 북마크, 알림, 테마/관심 태그 설정

**관리자 대시보드** — 해커톤 생성/수정/삭제, 사용자 관리, 플랫폼 통계

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| Framework | [Next.js](https://nextjs.org/) 16.1.6 (App Router) |
| Language | TypeScript 5 |
| UI | React 19 + Tailwind CSS 4 |
| Database | [Supabase](https://supabase.com/) (PostgreSQL) |
| Auth | Supabase Auth |
| Realtime | Supabase Realtime (WebSocket) |
| Deploy | [Vercel](https://vercel.com/) |
| Testing | Vitest 4.1 |

---

## 프로젝트 구조

```
src/
├── app/                          # Next.js App Router 페이지
│   ├── page.tsx                  # 메인 대시보드
│   ├── hackathons/               # 해커톤 목록 & 상세
│   │   └── [slug]/               # 동적 라우트
│   │       ├── overview/         #   개요
│   │       ├── leaderboard/      #   리더보드
│   │       ├── discussion/       #   토론
│   │       ├── submit/           #   제출
│   │       └── teams/            #   팀 목록
│   ├── camp/                     # 팀 빌딩
│   ├── rankings/                 # 전체 랭킹
│   ├── messages/                 # DM
│   ├── profile/                  # 내 프로필
│   ├── settings/                 # 설정
│   ├── admin/                    # 관리자 대시보드
│   ├── users/                    # 사용자 목록 & 상세
│   ├── bookmarks/                # 북마크
│   ├── search/                   # 검색
│   └── login/                    # 로그인
├── components/
│   ├── layout/                   # Header, Footer, ThemeProvider
│   └── features/                 # 기능별 컴포넌트
│       ├── admin/                #   관리자 탭 (HackathonTab, UserTab, Analytics)
│       └── camp/                 #   팀 관련 (CreateTeamForm, EditTeamForm, ...)
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # 듀얼 클라이언트 (Auth + Data)
│   │   ├── data.ts               # 데이터 CRUD 함수 (50+ 함수)
│   │   ├── realtime.ts           # 실시간 구독
│   │   ├── server.ts             # SSR 클라이언트
│   │   └── types.ts              # DB 스키마 타입 (18 테이블)
│   ├── scoring.ts                # CSV 채점 엔진
│   └── utils.ts                  # 유틸리티
├── types/
│   └── index.ts                  # 프론트엔드 도메인 타입
└── __tests__/                    # 단위 테스트 (134개)
    ├── helpers/
    │   └── supabase-mock.ts      # 공유 모킹 인프라
    ├── supabase-data.test.ts
    ├── supabase-crud.test.ts
    ├── supabase-submissions.test.ts
    └── scoring.test.ts
```

---

## 시작하기

### 사전 요구 사항

- Node.js 18+
- npm 또는 yarn
- Supabase 프로젝트 ([supabase.com](https://supabase.com)에서 무료 생성)

### 설치

```bash
git clone https://github.com/0cars0903/dacon-hackathon-platform.git
cd dacon-hackathon-platform
npm install
```

### 환경 변수

프로젝트 루트에 `.env.local` 파일을 생성합니다.

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 개발 서버 실행

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000)에서 확인할 수 있습니다.

### 빌드

```bash
npm run build
npm start
```

### 테스트 실행

```bash
npx vitest
```

```
✓ src/__tests__/supabase-data.test.ts (24 tests)
✓ src/__tests__/supabase-crud.test.ts (33 tests)
✓ src/__tests__/supabase-submissions.test.ts (27 tests)
✓ src/__tests__/scoring.test.ts (24 tests)
...
Test Files  7 passed (7)
Tests       134 passed (134)
```

---

## 데이터베이스 스키마

Supabase(PostgreSQL) 기반으로 18개 테이블을 사용합니다.

```
profiles              사용자 프로필
badges                배지/업적
hackathons            해커톤 기본 정보
hackathon_details     해커톤 상세 섹션 (JSONB)
hackathon_participants 참가자 기록
teams                 팀 정보
team_members          팀 멤버
team_join_requests    가입 요청
team_invitations      초대 코드
team_chat_messages    팀 채팅
direct_messages       1:1 DM
follows               팔로우 관계
activity_feed         활동 피드
notifications         알림
forum_posts           게시판 글
forum_comments        댓글
leaderboards          리더보드
submissions           제출물
user_preferences      사용자 설정 (테마, 관심 태그, 알림)
```

---

## 아키텍처

### 듀얼 Supabase 클라이언트

인증과 데이터 쿼리를 별도 클라이언트로 분리하여, 인증 초기화 지연으로 인한 쿼리 blocking 문제를 해결했습니다.

- **Auth Client** (`createClient`): `persistSession: true` — 로그인/세션 관리 전용
- **Data Client** (`createDataClient`): `persistSession: false` — DB 쿼리 전용, 즉시 초기화

### 자동 채점 엔진

`lib/scoring.ts`에서 CSV 파일을 파싱하여 Ground Truth와 비교합니다.

- **Classification**: Accuracy, Macro F1, Confusion Matrix, Per-class Precision/Recall/F1
- **Regression**: RMSE, MAE, R²

---

## 라이선스

이 프로젝트는 학습 및 포트폴리오 목적으로 제작되었습니다.
