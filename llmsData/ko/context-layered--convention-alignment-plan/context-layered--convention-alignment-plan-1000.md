---
document_id: context-layered--convention-alignment-plan
category: context-layered
source_path: ko/context-layered/convention-alignment-plan.md
character_limit: 1000
last_update: '2026-07-24T05:15:02.493Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Context-Layered 컨벤션 정합성 계획

Context-Layered 컨벤션 정합성 계획 상태: 직접 등록 인벤토리 종료, 잔여 구조 게이트 추적 중 최근 검토: 2026-07-16 이 문서는 기존 예제와 문서를 Context-Layered 구조에 맞추기 위한 저장소 단위 결정을 기록합니다. 구현 표준 문서와 같은 위치에서 현재 상태 분류, Provider 중첩 순서, 컨벤션을 강제하기 위한 완료 조건을 관리합니다. 확정 사항 1. 신규 구현의 단일 표준은 Context-Layered 새 시나리오는 다음 레이어를 사용합니다. strict MVVM 자료는 마이그레이션 참고 자료로 유지하지만, 신규 implementation-playbook의 두 번째 표준으로 취급하지 않습니다. 2. 모든 handler는 Handle

Key points:
• Context 파일은 경계와 Provider를 정의·조합하며 handler를 등록하지 않습니다.
• 모든 도메인은 `*HandlerRegistry` 또는 동등한 Registry 컴포넌트를 제공합니다.
• 모든 `use*ActionHandler` 호출은 Registry 또는 그 하위 handler 모듈에 둡니다.
• Page와 View는 Registry를 마운트만 하며...