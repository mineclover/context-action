---
document_id: context-layered--architecture--handler-registry
category: context-layered
source_path: ko/context-layered/architecture/handler-registry.md
character_limit: 200
last_update: '2026-11-20T08:50:10.718Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
핸들러 레지스트리 패턴

핸들러 레지스트리 패턴 핸들러 레지스트리 패턴은 handler의 ID, priority, dispatch 이름을 중앙에서 관리하는 방식입니다. 이 패턴을 도입하면 이름 충돌을 줄이고, 실행 순서를 문서화하기 쉬워지며, 테스트와 디버깅도 훨씬 단순해집니다. 왜 필요한가

Key points:
• 동일한 액션 이름을 서로 다른...