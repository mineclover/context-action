---
document_id: ko_guide_multi-context
category: guide
source_path: ko/guide/patterns/ref/multi-context.md
character_limit: 2000
last_update: '2025-08-30T10:45:54.897Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
멀티 컨텍스트 RefContext 아키텍처

멀티 컨텍스트 RefContext 아키텍처 분리된 관심사를 가진 복잡한 애플리케이션을 위한 다중 RefContext 구성입니다. 선행 요건 RefContext 설정 패턴과 멀티 도메인 구성은 RefContext 설정을 참조하세요. 프로바이더 구성 패턴은 프로바이더 구성 설정을 참조하세요. 개요 멀티 RefContext 아키텍처를 사용하면 다양한 유형의 DOM 조작을 격리된 컨텍스트로 분리하여 복잡한 애플리케이션에서 더 나은 구성과 성능을 제공할 수 있습니다. 기본 멀티 컨텍스트 설정 도메인 분리 패턴 컨텍스트 간 통신 계층적 컨텍스트 패턴 컨텍스트 격리 이점 모범 사례 1. 도메인 분리: 다양한 UI 관심사를 위해 별도의 RefContext 생성 2. 컨텍스트 격리: 각 컨텍스트를 특정 기능에 집중 3. 컨텍스트 간 통신: 조정된 작업을 위해 커스텀 훅 사용 4. 프로바이더 계층: 논리적 계층으로 프로바이더 구성 5. 성능 격리: 전용 컨텍스트에서 비용이 많이 드는 작업 격리 6. 타입 안전성: 각 컨텍스트 도메인을 위해 명확한 ref 타입 정의 7. 메모리 관리: 각 컨텍스트가 자체 라이프사이클 및 정리 관리

Key points:
• **도메인 분리**: 다양한 UI 관심사를 위해 별도의 RefContext 생성
• **컨텍스트 격리**: 각 컨텍스트를 특정 기능에 집중
• **컨텍스트 간 통신**: 조정된 작업을 위해 커스텀 훅 사용
• **프로바이더 계층**: 논리적 계층으로 프로바이더 구성
• **성능 격리**: 전용 컨텍스트에서 비용이 많이 드는 작업 격리
• **타입 안전성**: 각 컨텍스트 도메인을 위해 명확한 ref 타입 정의
• **메모리 관리**: 각 컨텍스트가 자체 라이프사이클 및 정리 관리