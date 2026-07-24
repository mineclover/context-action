---
document_id: context-layered--usecase-tool-calling-web-studio
category: context-layered
source_path: ko/context-layered/usecase-tool-calling-web-studio.md
character_limit: 2000
last_update: '2026-07-24T05:15:02.484Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Tool Calling Web Studio 컨벤션

Tool Calling Web Studio 컨벤션 이 문서는 standalone web-coding 데모에서 검증한 구조를 재사용 가능한 Context-Action 컨벤션과 use case recipe로 정리합니다. 모델/provider, typed tool registry, workspace 도메인 로직, 브라우저 persistence, React view 사이의 경계를 고정하는 것이 목적입니다. 모든 Context-Action 애플리케이션이 MCP나 iframe preview를 사용해야 한다는 뜻은 아니며, tool-calling web studio 형태에 적용하는 데모 컨벤션입니다. 이 recipe를 사용하는 경우 다음 요구가 하나 이상 있을 때 사용합니다. - model 또는 local agent가 document-like workspace를 읽고 변경해야 할 때 - MCP/function-calling tool을 list, approval, execute, structured result로 처리해야 할 때 - IndexedDB, Blob asset, local folder adapter 같은 browser persistence가 필요할 때 - revision을 반영한 live preview와 ready/error acknowledgement가 필요할 때 - tool catalog와 실행 trace를 UI에서 관찰·디버깅해야 할 때 일반 form state만 있고 command boundary가 없다면 표준 Action Only 또는 Store Only 패턴을 사용합니다. 표준 흐름 model에는 workspace 객체를 직접 전달하지 않고, view가 tool 허용 여부를 결정하지 않습니다. 각 경계에는 하나의 source of truth를 둡니다. | 경계 | 소유자 | 책임 | | --- | --- | --- | | Tool identity와 input/output schema | Tool Contex

Key points:
• model 또는 local agent가 document-like workspace를 읽고 변경해야 할 때
• MCP/function-calling tool을 list, approval, execute, structured result로
• IndexedDB, Blob asset, local folder adapter 같은 browser persistence가
• revision을 반영한 live preview와 ready/error acknowledgement가 필요할 때
• tool catalog와 실행 trace를 UI에서 관찰·디버깅해야 할 때
• `executeModelToolCall`을 거치는 model call
• 같은 boundary를 거치는 deterministic local-agent call
• 직접 action hook을 거치는 palette command
• view가 workspace, Dexie, `fetch`를 직접 호출한다.
• OpenRouter와 local fallback이 각각 다른 mutation path를 구현한다.
• catalog가 registry 대신 tool definition을 재구성한다.
• 편의를 위해...