---
document_id: context-layered--convention-alignment-plan
category: context-layered
source_path: ko/context-layered/convention-alignment-plan.md
character_limit: 2000
last_update: '2026-07-24T05:15:02.494Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Context-Layered 컨벤션 정합성 계획

Context-Layered 컨벤션 정합성 계획 상태: 직접 등록 인벤토리 종료, 잔여 구조 게이트 추적 중 최근 검토: 2026-07-16 이 문서는 기존 예제와 문서를 Context-Layered 구조에 맞추기 위한 저장소 단위 결정을 기록합니다. 구현 표준 문서와 같은 위치에서 현재 상태 분류, Provider 중첩 순서, 컨벤션을 강제하기 위한 완료 조건을 관리합니다. 확정 사항 1. 신규 구현의 단일 표준은 Context-Layered 새 시나리오는 다음 레이어를 사용합니다. strict MVVM 자료는 마이그레이션 참고 자료로 유지하지만, 신규 implementation-playbook의 두 번째 표준으로 취급하지 않습니다. 2. 모든 handler는 Handler Registry에서 등록 기능 규모에 따른 예외를 두지 않습니다. - Context 파일은 경계와 Provider를 정의·조합하며 handler를 등록하지 않습니다. - 모든 도메인은 HandlerRegistry 또는 동등한 Registry 컴포넌트를 제공합니다. - 모든 useActionHandler 호출은 Registry 또는 그 하위 handler 모듈에 둡니다. - Page와 View는 Registry를 마운트만 하며 handler를 직접 등록하지 않습니다. 단일 handler 예제도 이 규칙을 따릅니다. 등록, 정리, priority, 의존성 주입을 한 곳에서 검토할 수 있게 하는 것이 목적입니다. 3. Provider 중첩 순서 고정 canonical 중첩 순서는 다음과 같습니다. 이는 런타임의 필수 순서라는 뜻이 아니라 저장소 컨벤션입니다. 도메인이 ref 경계를 정의할 때만 Ref Provider를 포함하며, 그렇지 않으면 Registry가 Store Provider 바로 아래에 옵니다. 모든 Registry가 필요한 경계 아래에 위치하도록 보장합니다. 린트와 컨벤션 검사 저장소는 2026-07-14 기준 npm latest인 Biome 2

Key points:
• Context 파일은 경계와 Provider를 정의·조합하며 handler를 등록하지 않습니다.
• 모든 도메인은 `*HandlerRegistry` 또는 동등한 Registry 컴포넌트를 제공합니다.
• 모든 `use*ActionHandler` 호출은 Registry 또는 그 하위 handler 모듈에 둡니다.
• Page와 View는 Registry를 마운트만 하며 handler를 직접 등록하지 않습니다.
• `CanonicalOrderHandlers.tsx`는 이미 Action Provider, Store Provider, Ref Provider, Handler Registry를 조합합니다.
• `LogMonitor`를 첫 마이그레이션 대상으로 처리했습니다. 경계는 `contexts/`로 분리했고, 5개 handler는 `handlers/LogMonitorHandlerRegistry.tsx`에서 등록하며 Provider 순서도 canonical 기준으로 맞췄습니다.
• `ChatUI`, context-store 마우스 이벤트 컨테이너, conditional 권한 실행, foundations/react Child A/B 도메인도 전용 Registry 모듈에서만...