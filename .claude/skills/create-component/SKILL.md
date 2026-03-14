---
name: create-component
description: 재사용 가능한 UI 컴포넌트를 프로젝트 규칙에 맞게 생성. 새 컴포넌트가 필요할 때 사용.
---
# 컴포넌트 생성 스킬

$ARGUMENTS 컴포넌트를 아래 순서에 따라 생성한다:

1. 기존 src/components/ 의 패턴을 먼저 확인
2. 적절한 디렉토리에 생성:
   - `src/components/common/` : Button, Input, Modal, Card, Badge 등 범용
   - `src/components/features/` : HackathonCard, TeamForm 등 도메인별
3. TypeScript interface로 Props 정의 (export)
4. 포함할 상태 처리:
   - 빈 상태(empty) — Props로 제어
   - 로딩 상태(loading) — 스켈레톤 UI
   - 에러 상태(error) — 에러 메시지 표시
5. Tailwind CSS 유틸리티 클래스 사용
6. 파일이 200줄을 넘으면 하위 컴포넌트로 분리
7. 기존 컴포넌트와 일관된 패턴 유지
