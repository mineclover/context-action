---
document_id: context-layered--usecase-tool-calling-web-studio
category: context-layered
source_path: ko/context-layered/usecase-tool-calling-web-studio.md
character_limit: 5000
last_update: '2026-07-24T05:15:02.484Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Tool Calling Web Studio 컨벤션

Tool Calling Web Studio 컨벤션 이 문서는 standalone web-coding 데모에서 검증한 구조를 재사용 가능한 Context-Action 컨벤션과 use case recipe로 정리합니다. 모델/provider, typed tool registry, workspace 도메인 로직, 브라우저 persistence, React view 사이의 경계를 고정하는 것이 목적입니다. 모든 Context-Action 애플리케이션이 MCP나 iframe preview를 사용해야 한다는 뜻은 아니며, tool-calling web studio 형태에 적용하는 데모 컨벤션입니다. 이 recipe를 사용하는 경우 다음 요구가 하나 이상 있을 때 사용합니다. - model 또는 local agent가 document-like workspace를 읽고 변경해야 할 때 - MCP/function-calling tool을 list, approval, execute, structured result로 처리해야 할 때 - IndexedDB, Blob asset, local folder adapter 같은 browser persistence가 필요할 때 - revision을 반영한 live preview와 ready/error acknowledgement가 필요할 때 - tool catalog와 실행 trace를 UI에서 관찰·디버깅해야 할 때 일반 form state만 있고 command boundary가 없다면 표준 Action Only 또는 Store Only 패턴을 사용합니다. 표준 흐름 model에는 workspace 객체를 직접 전달하지 않고, view가 tool 허용 여부를 결정하지 않습니다. 각 경계에는 하나의 source of truth를 둡니다. | 경계 | 소유자 | 책임 | | --- | --- | --- | | Tool identity와 input/output schema | Tool Context | 이름, 설명, annotation, validation 정의 | | Provider transport | action hook | model message를 canonical call로 변환 | | Approval과 policy | ToolContext policy | allow, deny, confirmation 결정 | | Workspace 변경 | tool handler + manager | revision/type/path invariant 검사와 도메인 변경 | | Persistence | repository/filesystem adapter | browser data 저장 또는 명시적 folder sync | | Preview | preview compiler/bridge | revision 렌더링과 ready/error acknowledgement | | 관찰 | observable hook | 외부 workspace/trace 상태를 React에 구독 | | 표현 | view | 데이터 렌더링과 callback 발생 | 패널 레이아웃 preference 경계 접기·펼치기와 크기 조절은 workspace mutation이 아니라 presentation preference입니다. standalone 구현은 hooks/use-panel-layout.ts 뒤에 이 상태를 두고, workbench와 views/preview-panel.tsx에는 data와 callback을 전달하며, 실제 interaction은 순수한 views/panel-resize-handle.tsx primitive가 표현합니다. 전체 상태 계약, width 범위, Dexie persistence 경계, presentation-only 소유권 결정, Store Context 승격 기준은 패널 레이아웃 Preference 컨벤션에 관리합니다. 기존 WebCodingWorkspaceRepository의 preferences table에 저장하며 localStorage side channel을 사용하지 않습니다. 패널 preference는 tools/call, revision history, approval, workspace file diff 흐름에 들어가서는 안 됩니다. Context-Action 배치 권장 구조는 다음과 같습니다. standalone 데모에서는 각각 bolt-style-tool-context.ts, actions/run-local-agent.ts, tool-handlers.tsx, hooks/, views/, private @context-action/live-code-editor package가 같은 역할을 합니다. use-tool-catalog-model.ts는 canonical tools/list, tool definition과 catalog filter를, use-tool-catalog-actions.ts는 sample arguments와 palette command를, use-studio-export-actions.ts는 catalog·trace export를 소유합니다. 로컬 src/tool-catalog-contract.ts는 framework의 MCPToolDefinition과 ToolAnnotations만 alias하므로 view와 action hook이 두 번째 catalog definition shape을 만들지 않습니다. example의 Live Code Editor도 같은 경계를 유지합니다. LiveEditorToolchain.tsx가 ToolContext와 handler 등록을 소유하고, actions/useLiveEditorToolAct

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
• 편의를 위해 model-originated write가 policy를 우회한다.
• persistence나 preview가 끝나기 전에 handler가 성공을 반환한다.
• revision conflict를 숨기고 최신 파일을 overwrite한다.
• 여러 view가 외부 ToolContext state를 제각각 구독한다.
• registry에서 `tools/list`를 호출합니다.
• user prompt로 bounded local plan을 만듭니다.
• guarded mutation에 관찰한 revision을 넣습니다.
• 모든 call을 `executeModelToolCall`로 실행합니다.
• provider 호출과 같은 structured result와 trace를 반환합니다.
• registry definition을 provider format으로 export합니다.
• assistant tool call과 JSON argument를 normalize/validate합니다.
• 각 call을 ToolContext registry로 실행합니다.
• canonical tool result를 provider message history에 추가합니다.
• assistant text가 나오거나 call budget에 도달할 때까지 반복합니다.
• browser repository를 hydrate합니다.
• permission이 허용될 때만 persisted folder handle을 복원합니다.
• browser mutation과 local-folder write를 별도 tool boundary로 둡니다.
• folder write에는 `workspace.saveAll`을 요구합니다.
• permission, disconnected, stale-folder 오류를 structured result로 노출합니다.
• 성공한 mutation 뒤 workspace revision을 증가시킵니다.
• 해당 revision의 HTML/CSS/JS graph를 compile합니다.
• sandbox iframe으로 보냅니다.
• 일치하는 `ready` 또는 `error` bridge message를 기다립니다.
• tool result에 preview status를 포함합니다.
• 공통 `toToolCallRequest()` adapter로 request를 만듭니다.
• `context.mode: 'direct'`를 지정하고 action...