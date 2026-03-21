# 긴급 인수인계 해커톤 — CodeArena 플랫폼 웹서비스

## 프로젝트 개요
해커톤 플랫폼(CodeArena 유사) 웹사이트를 바이브 코딩으로 구현하는 프로젝트.
더미 데이터와 localStorage를 활용하며, Vercel로 배포한다.

## 빌드/실행 명령어
- 개발 서버: `npm run dev`
- 빌드: `npm run build`
- 린트: `npm run lint`
- 타입 체크: `npx tsc --noEmit`
- 단일 테스트: `npx vitest run <파일경로>` (전체보다 단일 선호)

## 기술 스택
- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- localStorage 기반 데이터 영속성 (외부 DB 없음)
- Vercel 배포

## 핵심 제약 사항
- IMPORTANT: 외부 API 키가 필요한 기능을 필수 기능으로 구현하지 않는다
- IMPORTANT: 심사자가 별도 설치/키 없이 배포 URL만으로 모든 기능을 확인할 수 있어야 한다
- localStorage 변경사항은 반드시 유지되도록 구현한다
- console.log는 개발 중에만 사용, 배포 전 반드시 제거한다

## 코딩 규칙
- 함수형 컴포넌트 + React Hooks 패턴 사용
- 파일당 200줄 이하 유지, 초과 시 분리
- 컴포넌트: PascalCase / 함수·변수: camelCase / 상수: UPPER_SNAKE_CASE
- Props는 TypeScript interface로 정의
- Tailwind 유틸리티 클래스 사용 (인라인 스타일 금지)
- import 시 구조분해 할당 (예: `import { useState } from 'react'`)

## 평가 항목 체크 (YOU MUST)
- 모든 목록/리스트에 빈 상태(empty state) UI를 구현한다
- 필터/정렬 기능은 실제 동작하도록 구현한다
- 에러 바운더리(Error Boundary)를 페이지 단위로 적용한다
- 로딩 스켈레톤 UI를 적용한다
- 사용자 입력에 대한 유효성 검증을 구현한다

## 커밋 규칙
- 형식: `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`
- 하나의 커밋 = 하나의 완성된 기능/수정 (세이브 포인트)
- 코드 변경 후 반드시 빌드 확인 후 커밋

## 페이지 구조
- `/` : 메인페이지 (배너, 네비게이션)
- `/hackathons` : 해커톤 목록 (필터, 카드 클릭 → 상세)
- `/hackathons/:slug` : 해커톤 상세 (개요/팀/평가/상금/안내/일정/제출/리더보드 탭)
- `/camp` : 팀원 모집 (팀 리스트, 생성)
- `/rankings` : 랭킹 (rank, 점수, 포인트)

## 데이터
- 더미 데이터는 `src/data/` 디렉토리에 JSON으로 관리
- 사용자 변경사항(팀 생성, 제출 등)은 localStorage에 저장
- See @spec.md for detailed data schema and API contracts

## 컨텍스트 압축 시 보존 규칙
- When compacting, always preserve: 수정된 파일 목록, 현재 Sprint 번호, 빌드/테스트 명령어
