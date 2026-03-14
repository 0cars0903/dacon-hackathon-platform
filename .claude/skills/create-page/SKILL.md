---
name: create-page
description: 새 페이지를 프로젝트 규칙에 맞게 생성. 새 라우트나 페이지 구현 시 사용.
---
# 페이지 생성 스킬

$ARGUMENTS 페이지를 아래 순서에 따라 생성한다:

1. `src/app/[경로]/page.tsx`에 페이지 컴포넌트 생성
2. `src/app/[경로]/loading.tsx`에 로딩 스켈레톤 생성
3. `src/app/[경로]/error.tsx`에 에러 바운더리 생성
4. TypeScript로 Props/데이터 interface를 `src/types/`에 정의
5. 반드시 포함할 요소:
   - 빈 상태(empty state) UI — "데이터가 없습니다" 류의 안내
   - 로딩 스켈레톤 — Tailwind animate-pulse 사용
   - 에러 바운더리 — 사용자 친화적 에러 메시지
6. Tailwind CSS로 반응형 스타일링 (sm/md/lg 브레이크포인트)
7. 더미 데이터는 `src/data/`에서 import
8. localStorage 연동이 필요하면 `src/hooks/`에 커스텀 Hook 분리
9. 기존 페이지 패턴을 먼저 확인하고 일관된 구조 유지
10. 구현 후 `npm run build`로 빌드 확인
