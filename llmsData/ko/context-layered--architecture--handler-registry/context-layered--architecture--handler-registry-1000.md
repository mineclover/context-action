---
document_id: context-layered--architecture--handler-registry
category: context-layered
source_path: ko/context-layered/architecture/handler-registry.md
character_limit: 1000
last_update: '2026-07-24T05:15:02.480Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
핸들러 레지스트리 패턴

핸들러 레지스트리 패턴 핸들러 레지스트리 패턴은 handler의 ID, priority, dispatch 이름을 중앙에서 관리하는 방식입니다. 이 패턴을 도입하면 이름 충돌을 줄이고, 실행 순서를 문서화하기 쉬워지며, 테스트와 디버깅도 훨씬 단순해집니다. 왜 필요한가 규모가 커질수록 다음 문제가 자주 생깁니다. - 동일한 액션 이름을 서로 다른 의미로 사용 - handler 등록 위치가 흩어져 우선순위 파악이 어려움 - module별 handler를 동적으로 붙일 때 naming 규칙이 깨짐 레지스트리는 이런 문제를 “하나의 명명 규칙”과 “하나의 우선순위 규칙”으로 정리합니다. 기본 구조 이 패턴에서 중요한 것은 dispatchName과 id를 분리하는 점입니다.

Key points:
• 동일한 액션 이름을 서로 다른 의미로 사용
• handler 등록 위치가 흩어져 우선순위 파악이 어려움
• module별 handler를 동적으로 붙일 때 naming 규칙이 깨짐
• `dispatchName`은 view/action 레이어가 쓰는 공개 이름
• `id`는 내부 등록과 추적용 식별자
• `actions/`에서는...