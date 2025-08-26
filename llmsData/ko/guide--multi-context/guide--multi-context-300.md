---
document_id: guide--multi-context
category: guide
source_path: ko/guide/patterns/ref/multi-context.md
character_limit: 300
last_update: '2025-08-26T00:34:27.363Z'
update_status: auto_generated
priority_score: 95
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
멀티 컨텍스트 RefContext 아키텍처

분리된 관심사를 가진 복잡한 애플리케이션을 위한 다중 RefContext 구성입니다. 선행 요건

RefContext 설정 패턴과 멀티 도메인 구성은 RefContext 설정을 참조하세요. 프로바이더 구성 패턴은 프로바이더 구성 설정을 참조하세요. 개요

멀티 RefContext 아키텍처를 사용하면 다양한 유형의 DOM 조작을 격리된 컨텍스트로 분리하여 복잡한 애플리케이션에서 더 나은 구성과 성능을 제공할 수 있습니다.
