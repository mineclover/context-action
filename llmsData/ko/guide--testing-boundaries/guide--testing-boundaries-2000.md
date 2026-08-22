---
document_id: guide--testing-boundaries
category: guide
source_path: ko/guide/testing-boundaries.md
character_limit: 2000
last_update: '2026-08-22T11:38:56.597Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
경계별 Context-Action 테스트

경계별 Context-Action 테스트 Context-Action의 runtime primitive 수는 많지 않지만 action 등록, dispatch, store notification, React Provider mount, 사용자에게 보이는 렌더링처럼 여러 라이프사이클을 지난다. 같은 사례를 모든 예제에서 반복하지 말고 책임을 가진 경계에서 검증한다. 세 가지 테스트 계층 | 계층 | 소유자 | 검증 대상 | 피할 것 | | --- | --- | --- | --- | | Core 계약 | @context-action/core | handler 순서, abort, cancellation, queueing, result collection, disposal, compile-time payload 제약 | React 렌더링, DOM event, 애플리케이션 페이지 | | React adapter 계약 | @context-action/react | Provider mount/unmount, handler registration cleanup, subscription 전달, hook identity, React에 보이는 update | 예제의 업무 workflow 복사 | | 예제 행위 | example/ 및 standalone demo | 공개 route 로드, 사용자 상호작용의 UI 변화, 비동기 성공 또는 실패 상태 | 모든 core 실행 모드 재검증 | 이 구조에서는 실패 원인이 명확하다. Core 계약 실패는 primitive를, React 계약 실패는 adapter lifecycle을, 예제 실패는 공개 composition 또는 presentation 경계를 가리킨다. Core 계약: 결정적이고 직접적으로 Core 테스트는 Node에서 실행한다. ActionRegister와 controller를 직접 사용한다. registration/unregistration, priority 순서, abort, timeout/cancellation, disposal은 각각 기

Key points:
• React 없이 표현할 수 있으면 core 테스트를 추가하거나 수정한다.
• Provider, hook, subscription lifetime에 의존하면 `act`를 사용하는 React
• route 조합 뒤에만 보이는 경우 co-located 예제 테스트를 추가하고 impact
• 공유 runtime module이 바뀌면 모든 공개 예제가 그 계약에 의존하므로 더 넓은