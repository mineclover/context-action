---
document_id: ko_concept_selective-subscription-patterns
category: concept
source_path: ko/concept/selective-subscription-patterns.md
character_limit: 1000
last_update: '2025-08-30T10:57:35.528Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
선택적 구독 패턴

선택적 구독 패턴 사전 메모화 최적화: 메모화가 필요하기 전에 불필요한 반응형 구독을 제거하는 전략적 구독 관리. 개요 선택적 구독 패턴은 반응형 구독이 발생하기 전에 불필요한 구독을 제거하여 성능을 최적화하는 사전 메모화 최적화 전략을 나타냅니다. 비싼 메모화 체인을 관리하는 대신, 이 접근법은 반응형과 비반응형 데이터 접근 패턴 사이에서 전략적으로 선택하여, 시각적 업데이트가 React 리렌더링을 필요로 하지 않을 때 스토어를 반응형 상태 관리자에서 순수한 데이터 저장소로 변환합니다. 철학: 구독 최적화 우선 사실 후 메모화 기술로 최적화하는 대신, 선택적 구독 패턴은 성능 병목 현상을 그 근원에서 방지합니다: 핵심 개념 1. 스토어를 데이터 저장소 패턴으로 스토어를 반응형 상태 

Key points:
• [RefContext 가이드](./react-refs-guide.md) - 직접 DOM 조작 패턴
• [스토어 패턴](./pattern-guide.md#store-patterns) - 전통적 반응형 패턴
• [성능 최적화](../guide/best-practices.md#performance-optimization) - 일반 성능 가이드라인
• [MVVM...