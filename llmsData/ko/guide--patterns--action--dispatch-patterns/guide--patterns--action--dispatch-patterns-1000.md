---
document_id: guide--patterns--action--dispatch-patterns
category: guide
source_path: ko/guide/patterns/action/dispatch-patterns.md
character_limit: 1000
last_update: '2026-07-24T05:15:02.405Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
디스패치 패턴

디스패치 패턴 실행 모드, 필터링, 성능 최적화를 포함한 Context-Action 프레임워크의 핵심 액션 디스패칭 패턴입니다. Import 필수 조건 타입 정의, 컨텍스트 생성, 프로바이더 구성을 포함한 완전한 설정 지침은 기본 액션 설정을 참조하세요. 이 문서는 설정 가이드의 AppActions 패턴을 사용합니다: - 타입 정의 → 확장 액션 인터페이스 - 컨텍스트 생성 → 단일 도메인 컨텍스트 - 프로바이더 설정 → 단일 프로바이더 설정 예제들은 다음과 같이 구성된 컨텍스트가 있다고 가정합니다: 기본 디스패치 결과 수집 없이 간단한 액션 디스패칭. 실행 모드 같은 액션에 대한 여러 핸들러가 실행되는 방식을 제어합니다. 순차 실행 (기본값) 핸들러들이 순서대로 실행되어 초기 핸들러가

Key points:
• 타입 정의 → [확장 액션 인터페이스](../setup/basic-action-setup.md#extended-action-interface)
• 컨텍스트 생성 → [단일 도메인 컨텍스트](../setup/basic-action-setup.md#single-domain-context)
• 프로바이더 설정 → [단일 프로바이더...