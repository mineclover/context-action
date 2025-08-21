---
document_id: guide--conditional-await
category: guide
source_path: ko/guide/patterns/conditional-await.md
character_limit: 1000
last_update: '2025-08-21T02:13:42.401Z'
update_status: auto_generated
priority_score: 95
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
조건부 대기 패턴

useWaitForRefs의 핵심 동작으로 조건부로 대기하거나 즉시 반환하는 패턴입니다. 기본 패턴

사용 사례

단순 대기

조건부 로직

주요 이점

- 자동 감지: 수동 확인 불필요
- 성능: 요소가 이미 마운트된 경우 지연 없음
- 안정성: await 후 요소 가용성 보장.
