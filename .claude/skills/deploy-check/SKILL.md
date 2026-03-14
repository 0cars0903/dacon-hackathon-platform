---
name: deploy-check
description: Vercel 배포 전 최종 점검 체크리스트 실행
disable-model-invocation: true
---
# 배포 전 점검 스킬

$ARGUMENTS 에 대해 아래 체크리스트를 순서대로 실행한다:

1. `npm run build` — 빌드 에러 확인
2. `npm run lint` — 린트 경고/에러 확인
3. `npx tsc --noEmit` — 타입 에러 확인
4. `grep -rn 'console\.log' src/ --include='*.ts' --include='*.tsx'` — 프로덕션 console.log 검색
5. `grep -rn 'localhost' src/ --include='*.ts' --include='*.tsx'` — 하드코딩된 localhost URL 검색
6. 모든 페이지의 빈 상태(empty state) 처리 확인
7. 에러 바운더리 적용 확인
8. 로딩 스켈레톤 적용 확인
9. localStorage 키 충돌 여부 확인

결과를 ✅/❌ 체크리스트로 보고한다.
