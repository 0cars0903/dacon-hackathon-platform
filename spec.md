# spec.md — 긴급 인수인계 해커톤 기능 명세서

> **팀:** 뚠뚠상어
> **기술 스택:** Next.js 14 (App Router) + TypeScript + Tailwind CSS
> **데이터:** 더미 JSON + localStorage
> **배포:** Vercel
> **디자인:** 모던 미니말 (CodeArena 스타일 참고, 깨끗한 카드 UI, 충분한 여백)

---

## 1. 서비스 개요

CodeArena 유사 해커톤 플랫폼 웹사이트. 사용자는 해커톤을 탐색하고, 상세 정보를 확인하고, 팀을 모집하고, 결과물을 제출하고, 랭킹을 확인할 수 있다.

### 핵심 차별화 (확장 기능)
1. **다크모드 + 커스텀 테마** — 라이트/다크 토글 + 3가지 컬러 테마
2. **실시간 활동 피드 + 알림** — D-day 카운트다운, 새 팀 모집 알림, 활동 히스토리
3. **AI 기반 추천** — 관심 태그 기반 해커톤 추천, 팀원 매칭 제안 (외부 API 없이 로컬 로직)

---

## 2. 라우팅 구조

| 경로 | 페이지 | 설명 |
|------|--------|------|
| `/` | 메인페이지 | 배너, 진행중 해커톤 하이라이트, 활동 피드 |
| `/hackathons` | 해커톤 목록 | 카드 그리드, 상태 필터, 태그 필터, 정렬 |
| `/hackathons/[slug]` | 해커톤 상세 | 8개 탭 (개요/팀/평가/상금/안내/일정/제출/리더보드) |
| `/camp` | 팀원 모집 | 팀 목록, 팀 생성 폼, 해커톤별 필터 |
| `/rankings` | 랭킹 | 종합 랭킹 테이블, rank/점수/포인트 정렬 |

---

## 3. 페이지별 기능 명세

### 3-1. 메인페이지 (`/`)

**필수 요소:**
- 헤더: 로고, 네비게이션 (해커톤 목록, 팀원 모집, 랭킹)
- 히어로 배너: 현재 진행중/예정 해커톤 하이라이트
- 해커톤 카드 미리보기: 최신 3~4개
- 푸터: 링크, 저작권

**확장 요소:**
- 활동 피드 위젯: 최근 팀 생성, 제출, 랭킹 변동 타임라인
- D-day 카운트다운 배지: 가장 가까운 마감일 표시
- 다크모드 토글 (헤더에 위치)

**빈 상태:** 해커톤이 없을 때 "등록된 해커톤이 없습니다" 안내

### 3-2. 해커톤 목록 (`/hackathons`)

**필수 요소:**
- 카드 그리드 렌더링 (썸네일, 제목, 상태 배지, 태그, 기간)
- 상태 필터: 전체 / 진행중(ongoing) / 종료(ended) / 예정(upcoming)
- 태그 필터: LLM, Web, VibeCoding 등 (복수 선택)
- 정렬: 최신순, 마감임박순
- 카드 클릭 → `/hackathons/[slug]`으로 이동

**빈 상태:** 필터 결과가 0건일 때 "조건에 맞는 해커톤이 없습니다" + 필터 초기화 버튼

**데이터:** `public_hackathons.json` 기반

### 3-3. 해커톤 상세 (`/hackathons/[slug]`)

공통 헤더: 해커톤 제목, 상태 배지, 기간

**탭 구성 (8개):**

| 탭 | 내용 | 데이터 소스 |
|----|------|------------|
| 개요 (Overview) | summary, teamPolicy | `sections.overview` |
| 팀 (Camp) | 이 해커톤의 팀 목록 보기/생성 링크 | `sections.teams` → `/camp?hackathon=slug` |
| 평가 (Eval) | metricName, description, limits | `sections.eval` |
| 상금 (Prize) | 순위별 상금 테이블 | `sections.prize` |
| 안내 (Info) | notice 리스트, 규정/FAQ 링크 | `sections.info` |
| 일정 (Schedule) | 마일스톤 타임라인 UI | `sections.schedule` |
| 제출 (Submit) | 제출 가이드, 제출 폼 (localStorage 저장) | `sections.submit` |
| 리더보드 (Leaderboard) | 순위 테이블 (rank, 팀명, 점수, 제출시간) | `public_leaderboard.json` |

**제출 탭 상세:**
- `submissionItems` 배열에 따라 동적 폼 생성
- text, url, pdf 형식 지원
- 저장 시 localStorage에 `submission_[slug]` 키로 저장
- 저장/제출 버튼 분리 (임시저장 vs 최종제출)

**리더보드 탭 상세:**
- rank, 팀명, 점수 컬럼
- scoreBreakdown이 있으면 참가자/심사위원 점수 표시
- artifacts가 있으면 웹URL/PDF 링크 표시

**빈 상태:** 각 탭별로 데이터 없음 안내 (예: "아직 제출된 결과가 없습니다")

**데이터:** `public_hackathon_detail.json` 기반 (extraDetails 포함)

### 3-4. 팀원 모집 (`/camp`)

**필수 요소:**
- 팀 카드 리스트 (팀명, 해커톤명, 멤버 수, 모집 분야, 소개)
- 모집중(isOpen=true) / 마감(isOpen=false) 필터
- 해커톤별 필터 (hackathonSlug 기반)
- "팀 만들기" 버튼 → 폼 모달

**팀 생성 폼:**
- 팀명 (필수)
- 해커톤 선택 (드롭다운, 필수)
- 소개 (필수)
- 모집 분야 (태그 선택, 복수)
- 연락처 URL (필수)
- 저장 시 localStorage에 추가, 목록에 즉시 반영

**빈 상태:** "모집 중인 팀이 없습니다. 첫 번째 팀을 만들어 보세요!"

**데이터:** `public_teams.json` 기반 + localStorage 추가분

### 3-5. 랭킹 (`/rankings`)

**필수 요소:**
- 종합 랭킹 테이블: rank, 팀명, 점수, 포인트
- 해커톤별 필터
- 정렬: rank순 (기본), 점수순, 제출시간순

**빈 상태:** "아직 랭킹 데이터가 없습니다"

**데이터:** `public_leaderboard.json` 기반

---

## 4. 데이터 스키마 (TypeScript Interface)

```typescript
// === 해커톤 목록 ===
interface Hackathon {
  slug: string;
  title: string;
  status: 'ongoing' | 'ended' | 'upcoming';
  tags: string[];
  thumbnailUrl: string;
  period: {
    timezone: string;
    submissionDeadlineAt: string; // ISO 8601
    endAt: string;
  };
  links: {
    detail: string;
    rules: string;
    faq: string;
  };
}

// === 해커톤 상세 ===
interface HackathonDetail {
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
interface Team {
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
interface LeaderboardEntry {
  rank: number;
  teamName: string;
  score: number;
  submittedAt: string;
  scoreBreakdown?: { participant: number; judge: number };
  artifacts?: { webUrl: string; pdfUrl: string; planTitle: string };
}

interface Leaderboard {
  hackathonSlug: string;
  updatedAt: string;
  entries: LeaderboardEntry[];
}

// === 제출 (localStorage) ===
interface Submission {
  hackathonSlug: string;
  items: { key: string; value: string }[];
  status: 'draft' | 'submitted';
  savedAt: string;
}

// === 활동 피드 (확장) ===
interface ActivityFeedItem {
  id: string;
  type: 'team_created' | 'submission' | 'ranking_update';
  message: string;
  timestamp: string;
  hackathonSlug?: string;
}

// === 사용자 설정 (확장) ===
interface UserPreferences {
  theme: 'light' | 'dark';
  colorTheme: 'blue' | 'purple' | 'green';
  interestTags: string[];
}
```

---

## 5. localStorage 설계

| 키 | 타입 | 용도 |
|----|------|------|
| `hackathon_teams` | `Team[]` | 사용자가 생성한 팀 (기본 더미 + 추가분) |
| `submission_[slug]` | `Submission` | 해커톤별 제출 데이터 |
| `user_preferences` | `UserPreferences` | 테마, 관심 태그 설정 |
| `activity_feed` | `ActivityFeedItem[]` | 활동 히스토리 |
| `notifications` | `{ id, message, read, timestamp }[]` | 알림 목록 |

---

## 6. 공통 컴포넌트 목록

### Layout
- `Header` — 로고, 네비게이션, 다크모드 토글, 알림 벨
- `Footer` — 링크, 저작권
- `ThemeProvider` — 다크모드 + 컬러 테마 Context

### Common UI
- `Card` — 범용 카드 컨테이너
- `Badge` — 상태 배지 (ongoing=green, ended=gray, upcoming=blue)
- `Button` — Primary / Secondary / Ghost 변형
- `Input` — 텍스트 입력 + 유효성 표시
- `Select` — 드롭다운 선택
- `Modal` — 모달 다이얼로그
- `Tabs` — 탭 네비게이션
- `Table` — 정렬 가능한 테이블
- `EmptyState` — 빈 상태 안내 (아이콘 + 메시지 + 액션 버튼)
- `Skeleton` — 로딩 스켈레톤
- `Tag` — 필터/분류 태그
- `Toast` — 알림 토스트
- `CountdownBadge` — D-day 카운트다운 배지

### Feature Components
- `HackathonCard` — 해커톤 목록 카드
- `HackathonFilter` — 상태 + 태그 필터 바
- `TeamCard` — 팀 카드
- `TeamCreateForm` — 팀 생성 폼
- `SubmissionForm` — 제출 폼 (동적 필드)
- `LeaderboardTable` — 리더보드 테이블
- `MilestoneTimeline` — 일정 타임라인
- `ActivityFeed` — 활동 피드 위젯
- `NotificationBell` — 알림 벨 + 드롭다운

---

## 7. 확장 기능 상세

### 7-1. 다크모드 + 커스텀 테마
- Tailwind의 `dark:` 클래스 + CSS 변수로 구현
- `ThemeProvider` (React Context) 로 전역 상태 관리
- localStorage `user_preferences`에 저장
- 컬러 테마 3종: Blue(기본), Purple, Green
- 시스템 테마 감지 (`prefers-color-scheme`)

### 7-2. 실시간 활동 피드 + 알림
- 사용자 액션(팀 생성, 제출 등) 시 localStorage에 피드 기록
- 메인페이지에 타임라인 위젯으로 표시
- 헤더 알림 벨: 읽지 않은 알림 카운트 배지
- 마감 D-day 카운트다운: 현재 시간 기준 실시간 갱신

### 7-3. AI 기반 추천 (외부 API 없이)
- 관심 태그 기반 해커톤 추천: 사용자 `interestTags`와 해커톤 `tags` 매칭 점수 계산
- 팀원 매칭 제안: `lookingFor` 필드와 사용자 관심 분야 교차 분석
- 로컬 로직으로 구현 (TF-IDF 유사도 또는 단순 태그 교집합 비율)
- "추천" 섹션으로 메인페이지와 해커톤 상세에 표시

---

## 8. 프로젝트 구조

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # 루트 레이아웃 (ThemeProvider 래핑)
│   ├── page.tsx                  # 메인페이지
│   ├── hackathons/
│   │   ├── page.tsx              # 해커톤 목록
│   │   └── [slug]/
│   │       └── page.tsx          # 해커톤 상세
│   ├── camp/
│   │   └── page.tsx              # 팀원 모집
│   └── rankings/
│       └── page.tsx              # 랭킹
├── components/
│   ├── common/                   # 공통 UI 컴포넌트
│   ├── features/                 # 도메인별 컴포넌트
│   └── layout/                   # Header, Footer, ThemeProvider
├── hooks/                        # 커스텀 Hooks
│   ├── useLocalStorage.ts
│   ├── useTheme.ts
│   ├── useTeams.ts
│   └── useNotifications.ts
├── data/                         # 더미 데이터 JSON
│   ├── hackathons.json
│   ├── hackathon-details.json
│   ├── teams.json
│   └── leaderboard.json
├── types/                        # TypeScript 타입 정의
│   └── index.ts
├── lib/                          # 유틸리티
│   ├── recommend.ts              # AI 추천 로직
│   └── utils.ts                  # 포맷팅, 날짜 등
└── styles/
    └── globals.css               # Tailwind + 테마 CSS 변수
```

---

## 9. Sprint 계획

| Sprint | 범위 | 예상 소요 |
|--------|------|----------|
| 1 | 프로젝트 초기화 + 타입 정의 + 더미 데이터 + 테마 시스템 | 1일 |
| 2 | 공통 레이아웃 (Header/Footer) + 공통 컴포넌트 (Card, Badge, Button 등) | 1일 |
| 3 | 메인페이지 + 해커톤 목록 (필터/정렬/빈 상태) | 1일 |
| 4 | 해커톤 상세 (탭 프레임 + 각 탭 순차 구현) | 2일 |
| 5 | 팀원 모집 (목록 + 생성 폼 + localStorage) | 1일 |
| 6 | 랭킹 + 리더보드 완성 | 0.5일 |
| 7 | 확장 기능 (다크모드, 활동 피드, AI 추천) | 1.5일 |
| 8 | QA + 버그 수정 + 배포 + 문서화 | 1일 |

---

## 10. 테스트 전략

- **빌드 테스트:** 매 Sprint 후 `npm run build` 성공 확인
- **수동 테스트:** 각 페이지의 빈 상태, 필터, 정렬, 폼 제출 동작 확인
- **반응형 테스트:** 모바일(375px), 태블릿(768px), 데스크톱(1280px)
- **크로스 브라우저:** Chrome, Safari 최소 확인
- **배포 테스트:** Vercel Preview URL에서 외부 접속 확인
