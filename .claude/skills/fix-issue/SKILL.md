---
name: fix-issue
description: 버그를 분석하고 수정하는 워크플로우
disable-model-invocation: true
---
# 버그 수정 스킬

$ARGUMENTS 에 대해 아래 순서로 처리한다:

1. 관련 파일을 읽고 버그의 원인을 분석
2. 버그를 재현할 수 있는 시나리오를 설명
3. 수정 방안을 설명한 뒤 구현
4. `npm run build`로 빌드 확인
5. 수정 내용을 요약하고 커밋 메시지 제안

근본 원인을 해결한다. 에러를 억제하거나 우회하지 않는다.
