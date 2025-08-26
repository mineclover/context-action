---
document_id: guide--context-splitting
category: guide
source_path: ko/guide/patterns/architecture/context-splitting.md
character_limit: 200
last_update: '2025-08-26T00:34:27.351Z'
update_status: auto_generated
priority_score: 95
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
컨텍스트 분할 패턴

애플리케이션이 복잡해지고 컨텍스트 프로바이더가 관리하기 어려워질 때 대규모 컨텍스트를 분할하고 관리하는 전략. 컨텍스트를 분할해야 하는 시점

컨텍스트 분할이 필요한 신호

1. 프로바이더 계층 깊이 - 5-7개 이상의 중첩된 프로바이더
2. 스토어 복잡성 - 단일 컨텍스트에서 10개 이상의 다른 스토어 타입 관리
3.
