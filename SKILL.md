# DACON 긴급 인수인계 해커톤 플랫폼 — 구현 현황 SKILL.md

> **프로젝트**: DACON Hackathon Platform
> **라이브 URL**: https://dacon-hackathon-platform.vercel.app
> **GitHub**: https://github.com/0cars0903/dacon-hackathon-platform
> **최종 커밋**: `1ffc459` (2026-03-14 19:05 KST)
> **마지막 갱신일**: 2026-03-14

---

## 기술 스택

| 구분 | 기술 |
|------|------|
| 프레임워크 | Next.js 16.1.6 (App Router, Turbopack) |
| 언어 | TypeScript (strict mode) |
| UI | React 19.2.3, Tailwind CSS v4 |
| 다크모드 | `@custom-variant dark (&:where(.dark, .dark *))` |
| 테스트 | Vitest 4.1.0 + @testing-library/react (81개 테스트 통과) |
| 백엔드 시뮬레이션 | localStorage 기반 (실제 서버 없음) |
| 배포 | Vercel (GitHub push → 자동 배포) |

---

## 커밋 히스토리 (시간순)

| # | 커밋 | 설명 | Phase |
|---|------|------|-------|
| 1 | `e0ab2e6` | Initial commit: DACON Hackathon Platform | Phase 1 |
| 2 | `9f6e1fd` | chore: exclude tmp/ from git tracking | Phase 1 |
| 3 | `4b738ec` | feat: major UI/UX upgrade (알림, 북마크, 애니메이션, 데이터 확장) | Phase 2 |
| 4 | `4dd5327` | feat: 로그인, 서브페이지, 활동 사이드바, 리브랜딩 | Phase 3 |
| 5 | `4b77b7e` | fix: 데이터/기능 이슈 6건 수정, 데이터 레이어 재구조화 | Phase 4 |
| 6 | `69ff45f` | perf: UI/UX 리서치 기반 성능 최적화 | Phase 4 |
| 7 | `7227a16` | feat: sticky nav, 폰트 복원, 연락 모달 개선, 평가 기반 리더보드 | Phase 5 |
| 8 | `4e552c6` | feat: 유저 시스템 (MVP 계정, 팀 참가, 프로필 대시보드) | Phase 6 |
| 9 | `bff8b70` | feat: 닉네임 시스템, 관리자 대시보드, 종료 해커톤 2주 필터 | Phase 6 |
| 10 | `ddacdbc` | fix: 계정 이름 변경, 데모 프로필 버그 수정, 관리자 기능 강화 | Phase 6 |
| 11 | `900fee8` | feat: 시드 유저 25명, 버그 수정, 테스트 스위트 (81개) | Phase 7 |
| 12 | `6ece3b8` | feat: 검색, 포럼, 공개 프로필, 제출/팀 관리 개선 | Phase 8 |
| 13 | `9c8a6ba` | feat: 알림 시스템, 활동 로깅, 북마크 페이지 통합 | Phase 8 |
| 14 | `8bccffe` | feat: 해커톤 개요 강화 + 등록 플로우 + 관리자 분석 대시보드 | Phase 9 |
| 15 | `e3bac2b` | feat: 404/error 페이지, 알림 설정, 아바타 업로드, 팀원 상세 | Phase 9 |
| 16 | `6aa028b` | feat: 팀 초대, DM, 팔로우/팔로잉 시스템 | Phase 10 |
| 17 | `1ffc459` | feat: ML/DL 자동채점 시스템 (CSV → 평가 → 리더보드) | Phase 11 |

---

## 구현 완료 기능 상세

### Phase 1 — 초기 셋업 & 데이터 구조
- [x] Next.js 16.1.6 + TypeScript + Tailwind v4 프로젝트 생성
- [x] 정적 JSON 데이터 설계: `hackathons.json`, `hackathon-details.json`, `teams.json`, `leaderboard.json`
- [x] 해커톤 목록 페이지 (`/hackathons`)
- [x] 해커톤 상세 레이아웃 + 탭 네비게이션 (`/hackathons/[slug]`)
- [x] 리더보드 페이지 (`/hackathons/[slug]/leaderboard`)
- [x] 팀 페이지 (`/hackathons/[slug]/teams`)
- [x] 메인 홈페이지 (`/`)

### Phase 2 — UI/UX 확장
- [x] 알림 벨 컴포넌트 (`NotificationBell`)
- [x] 북마크 기능 (`BookmarkButton`)
- [x] 카드 애니메이션, hover 효과
- [x] 반응형 레이아웃 강화
- [x] 추천 해커톤 컴포넌트 (`RecommendedHackathons`)
- [x] 공통 컴포넌트 라이브러리: Button, Card, Badge, Tag, Tabs, Modal, Toast, EmptyState, Skeleton

### Phase 3 — 로그인 & 서브페이지
- [x] 로그인 페이지 (`/login`) — localStorage 기반 세션
- [x] 활동 사이드바 (`ActivitySidebar`)
- [x] 해커톤 개요 페이지 (`/hackathons/[slug]/overview`)
- [x] 제출 페이지 (`/hackathons/[slug]/submit`)
- [x] 토론 게시판 페이지 (`/hackathons/[slug]/discussion`)
- [x] 전체 헤더/푸터 리브랜딩

### Phase 4 — 데이터 레이어 & 성능
- [x] 데이터 레이어 재구조화 (`src/lib/data.ts` — 799줄)
- [x] `computeStatus()` — 날짜 기반 동적 해커톤 상태 계산
- [x] 6건 데이터/기능 이슈 수정
- [x] 성능 최적화 (UI/UX 리서치 기반)

### Phase 5 — 내비게이션 & 리더보드 강화
- [x] Sticky 사이드바 네비게이션 (`NavigationSidebar`)
- [x] Pretendard 폰트 복원
- [x] 연락 모달 개선 (`ContactModal`)
- [x] 평가 지표 기반 리더보드 (다중 라운드, 점수 breakdown 지원)
- [x] 점수 차트 (`ScoreChart`)

### Phase 6 — 유저 시스템
- [x] 유저 인증 (`AuthProvider`) — localStorage 기반 세션 관리
- [x] MVP 계정 시스템 (Admin, User_1~User_25)
- [x] 프로필 대시보드 (`/profile`) — 통계, 배지, 참가 해커톤
- [x] 닉네임 시스템 (30일 변경 제한)
- [x] 관리자 대시보드 (`/admin`) — 838줄, 통계/차트/사용자 관리
- [x] 팀 참가 요청 (TeamJoinRequest)
- [x] 종료 해커톤 2주 필터 (자동 숨김)
- [x] 시드 유저 25명 생성 (다양한 스킬, 배지, 활동 통계)

### Phase 7 — 테스트 스위트
- [x] Vitest + jsdom 환경 설정
- [x] `auth.test.ts` — 인증 유틸 테스트
- [x] `data.test.ts` — 데이터 레이어 테스트
- [x] `utils.test.ts` — 유틸리티 함수 테스트
- [x] **81개 테스트 전체 통과**

### Phase 8 — 소셜 & 커뮤니티 기능
- [x] 통합 검색 (`/search`, `SearchModal`) — 해커톤, 유저, 팀 검색
- [x] 토론 포럼 — 게시글 CRUD, 댓글, 좋아요, 카테고리 (질문/토론/공지/버그)
- [x] 공개 유저 프로필 (`/users/[id]`)
- [x] 유저 목록 (`/users`) — 스킬 기반 필터링
- [x] 제출 관리 개선 (다중 아이템 제출)
- [x] 팀 관리 개선 (멤버 목록, 참가 요청 승인/거절)
- [x] 알림 시스템 통합 — 활동 기반 자동 알림 생성
- [x] 활동 로깅 — 팀 생성, 제출, 가입 등 피드 자동 기록
- [x] 북마크 페이지 (`/bookmarks`)

### Phase 9 — 해커톤 개요 & 관리자 기능 강화
- [x] 해커톤 등록 플로우 (참가 신청 → 팀 배정)
- [x] 관리자 분석 대시보드 (참가율, 제출률, 일별 통계 차트)
- [x] 404 Not Found 페이지 (`not-found.tsx`)
- [x] Error 페이지 (`error.tsx`)
- [x] 알림 설정 (종류별 ON/OFF)
- [x] 아바타 업로드 (Base64 localStorage 저장)
- [x] 팀원 상세 정보 표시

### Phase 10 — 팀 초대 + DM + 팔로우 (localStorage 백엔드)
- [x] **팀 초대 시스템** (`TeamInviteModal`)
  - 6자리 초대 코드 생성 (`ABCDEFGHJKLMNPQRSTUVWXYZ23456789`)
  - 48시간 만료 정책
  - 공개 초대 (코드 공유) / 특정 유저 직접 초대
  - 초대 상태 관리 (pending → accepted / rejected / expired)
- [x] **다이렉트 메시지** (`/messages`)
  - 대화 목록 사이드바 (읽지 않은 메시지 배지)
  - 채팅 영역 (발신: 파란 말풍선, 수신: 회색 말풍선)
  - 유저 검색으로 새 채팅 시작
  - 5초 폴링 자동 새로고침
  - 팀 초대 탭 (pending 초대 수락/거절)
- [x] **팔로우/팔로잉 시스템** (`FollowButton`, `FollowStats`)
  - 팔로우/언팔로우 토글
  - 팔로우 시 알림 생성
  - 프로필 페이지 팔로워/팔로잉 수 표시
- [x] localStorage 키: `dacon_invitations`, `dacon_messages`, `dacon_follows`

### Phase 11 — ML/DL 자동채점 시스템
- [x] **Ground Truth 데이터** (`src/data/ground-truth.json`)
  - 분류: `aimers-8-model-lite` — 100샘플, 5클래스
  - 회귀: `data-viz-hackathon-2026` — 80샘플
- [x] **채점 엔진** (`src/lib/scoring.ts` — 526줄)
  - CSV 파싱 (`parseCSV`)
  - 분류 지표: Accuracy, Macro F1, Per-class Precision/Recall/F1, Confusion Matrix
  - 회귀 지표: RMSE, MAE, R², MAPE
  - 최종 점수: 분류 `0.6×Accuracy + 0.4×SpeedScore`, 회귀 `R²×100`
  - 시뮬레이션 추론 지연 시간 (speed score 반영)
- [x] **제출 페이지 이중 모드** (`/hackathons/[slug]/submit` — 686줄)
  - 자동채점 모드: CSV 업로드 → 점수 즉시 산출 → 상세 지표 표시
  - 일반 모드: 텍스트/URL/파일 제출
  - 채점 애니메이션 (스피너)
  - 채점 이력 탭 (확장/축소 가능한 상세 정보)
- [x] **리더보드 동적 병합** (`/hackathons/[slug]/leaderboard`)
  - 정적 JSON + localStorage 채점 결과 병합
  - 동일 팀: 최고 점수 우선
  - 병합 후 점수 기준 재정렬

---

## 프로젝트 구조

```
src/
├── __tests__/           # 테스트 (81개)
│   ├── auth.test.ts
│   ├── data.test.ts
│   ├── utils.test.ts
│   └── setup.ts
├── app/                 # Next.js App Router 페이지 (15개 라우트)
│   ├── page.tsx                         # 홈
│   ├── login/page.tsx                   # 로그인
│   ├── hackathons/page.tsx              # 해커톤 목록
│   ├── hackathons/[slug]/
│   │   ├── page.tsx                     # 해커톤 상세 (리다이렉트)
│   │   ├── layout.tsx                   # 탭 네비게이션 레이아웃
│   │   ├── overview/page.tsx            # 개요
│   │   ├── submit/page.tsx              # 제출 (자동채점 포함)
│   │   ├── leaderboard/page.tsx         # 리더보드
│   │   ├── teams/page.tsx               # 팀
│   │   └── discussion/page.tsx          # 토론
│   ├── messages/page.tsx                # DM
│   ├── profile/page.tsx                 # 내 프로필
│   ├── settings/page.tsx                # 설정
│   ├── admin/page.tsx                   # 관리자 대시보드
│   ├── bookmarks/page.tsx               # 북마크
│   ├── camp/page.tsx                    # 캠프 (팀 매칭)
│   ├── rankings/page.tsx                # 랭킹
│   ├── search/page.tsx                  # 검색
│   ├── users/page.tsx                   # 유저 목록
│   ├── users/[id]/page.tsx              # 공개 프로필
│   ├── not-found.tsx                    # 404
│   └── error.tsx                        # 에러 바운더리
├── components/
│   ├── common/          # 공통 UI (10개)
│   │   ├── Badge, Button, Card, EmptyState, Modal
│   │   ├── Skeleton, Tabs, Tag, Toast, index.ts
│   └── features/        # 기능 컴포넌트 (14개)
│       ├── AuthProvider, ActivitySidebar, BookmarkButton
│       ├── ContactModal, FollowButton, NavigationSidebar
│       ├── NotificationBell, RecommendedHackathons
│       ├── ScoreChart, SearchModal, SettingsPanel
│       ├── ServiceWorkerRegistrar, StatsOverview
│       └── TeamInviteModal
├── data/                # 정적 JSON 데이터
│   ├── hackathons.json
│   ├── hackathon-details.json
│   ├── teams.json
│   ├── leaderboard.json
│   └── ground-truth.json
├── hooks/               # React Hooks
│   ├── useLocalStorage.ts
│   └── useTheme.ts
├── lib/                 # 핵심 로직
│   ├── data.ts          # 데이터 접근 + localStorage 백엔드 (799줄)
│   ├── scoring.ts       # 자동채점 엔진 (526줄)
│   └── utils.ts         # 유틸리티 (110줄)
└── types/
    └── index.ts         # TypeScript 타입 정의 (280줄, 20+ 인터페이스)
```

---

## localStorage 키 맵

| 키 | 용도 | Phase |
|----|------|-------|
| `dacon_user` | 현재 로그인 사용자 | 6 |
| `dacon_bookmarks` | 북마크된 해커톤 slug 목록 | 2 |
| `dacon_notifications` | 알림 목록 | 2 |
| `dacon_preferences` | 테마, 색상, 관심 태그 | 3 |
| `dacon_submissions_{slug}` | 해커톤별 제출 데이터 | 3 |
| `dacon_forum_{slug}` | 해커톤별 포럼 게시글/댓글 | 8 |
| `dacon_activity_feed` | 활동 피드 | 8 |
| `dacon_registrations` | 해커톤 참가 등록 | 9 |
| `dacon_notification_prefs` | 알림 종류별 설정 | 9 |
| `dacon_invitations` | 팀 초대 | 10 |
| `dacon_messages` | DM 메시지 | 10 |
| `dacon_follows` | 팔로우 관계 | 10 |
| `dacon_scored_{slug}` | 채점 결과 | 11 |
| `dacon_lb_{slug}` | 동적 리더보드 | 11 |

---

## 타입 시스템 요약 (src/types/index.ts)

핵심 인터페이스 20개+:

- `Hackathon`, `HackathonDetail` — 해커톤 목록/상세
- `Team`, `TeamMember`, `TeamJoinRequest` — 팀
- `LeaderboardEntry`, `Leaderboard`, `LeaderboardRound`, `MetricColumn` — 리더보드
- `Submission` — 제출
- `UserProfile`, `UserBadge`, `UserPreferences` — 유저
- `Notification` — 알림
- `ActivityFeedItem` — 활동 피드
- `TeamInvitation` — 팀 초대
- `DirectMessage`, `Conversation` — DM
- `FollowRelation` — 팔로우
- `ForumPost`, `ForumComment` — 포럼

---

## 코드 규모 요약

| 구분 | 파일 수 | 총 라인 |
|------|---------|---------|
| 페이지 (app/) | 19 | ~5,804 |
| 컴포넌트 | 24 | ~3,260 |
| 라이브러리 (lib/) | 3 | ~1,435 |
| 타입 (types/) | 1 | 280 |
| 테스트 | 3 | 81개 테스트 |
| **전체** | **~50+** | **~10,800+** |

---

## 빌드 & 배포 상태

- **빌드**: `npx next build` ✅ 성공 (Turbopack, 2.1s 컴파일)
- **테스트**: `npx vitest run` ✅ 81/81 통과 (2.62s)
- **배포**: Vercel 자동 배포 (GitHub main push 트리거)
- **라우트**: 정적 15개 + 동적 6개 = 총 21개

---

## 데모 계정

| 계정 | ID | 역할 | 비밀번호 |
|------|-----|------|----------|
| Admin | admin | 관리자 | (로그인 페이지에서 선택) |
| User_1 ~ User_25 | user_1 ~ user_25 | 일반 사용자 | (로그인 페이지에서 선택) |
