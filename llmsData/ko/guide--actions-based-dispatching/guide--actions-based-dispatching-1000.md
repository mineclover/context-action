---
document_id: guide--actions-based-dispatching
category: guide
source_path: ko/guide/actions-based-dispatching.md
character_limit: 1000
last_update: '2026-07-24T05:15:02.372Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Actions 기반 디스패칭

Actions 기반 디스패칭 Actions 기반 디스패칭은 Context-Action에서 액션을 디스패치하는 더 직관적이고 함수형 접근 방식을 제공합니다. 기존의 registry.dispatch() 메서드 대신 registry.actions 속성을 통해 액션을 직접 함수로 호출할 수 있습니다. 개요 actions 속성은 각 등록된 액션이 호출 가능한 함수가 되는 함수형 인터페이스를 제공합니다. 이 접근 방식은 향상된 타입 안전성과 더 직관적인 구문으로 더 나은 개발자 경험을 제공합니다. 기본 사용법 1. 액션 타입 정의 먼저 ActionPayloadMap 인터페이스를 사용하여 액션 타입을 정의합니다: 2. ActionRegister 생성 액션 타입과 함께 ActionRegister 인스턴스를 생성합니다:

Key points:
• 실행 모드 (순차, 병렬, 경쟁)
• 필터링 (핸들러 ID, 우선순위, 사용자 정의 필터별)
• 스로틀링 및 디바운싱
• 결과 수집
• 중단 신호
• 오류 처리