---
document_id: concept--tool-calling-editor-architecture
category: concept
source_path: ko/concept/tool-calling-editor-architecture.md
character_limit: 2000
last_update: '2026-07-15T14:31:24.337Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Tool Calling Editor 아키텍처

Tool Calling Editor 아키텍처 브라우저 기반 실시간 editor는 iframe이 도구 실행기를 소유하지 않고, 부모 문서가 표준 Tool Registry·정책·호출 추적을 소유하는 구조로 구성한다. 실행 경계 Orca는 여러 coding agent를 worktree, 터미널, embedded browser와 연결하는 ADE다. 이번 구현에서는 전체 데스크톱 구조가 아니라 다음 경계만 참고한다. - Design Mode의 선택 결과 수집: 선택자, HTML/CSS 요약, 화면 상태를 입력 context로 전달 - browser bridge: 브라우저 화면과 호스트 상태를 분리 - agent lifecycle: 시작·대기·승인·완료·실패 상태를 이벤트로 관찰 - CLI command bridge: 화면 동작을 임의 script가 아닌 명시적 command로 제한 참고 clone: architecture-references/orca (MIT, 조사 기준 commit 9a23792) 실시간 웹 코딩 showcase 집중 showcase 경로는 /integrations/live-web-coding이다. 첫 slice는 범위를 작게 유지하기 위해 HTML/CSS/JS 3개 파일 workspace, bounded web.applyPatch를 포함한 화면에 보이는 web. tool palette, 선택적인 OpenRouter model loop, sandbox iframe preview로 구성한다. API 키가 없어도 동일한 tools/list → model/local agent → tools/call → tool result 흐름을 결정적인 local fallback으로 실행하므로 tool 계약과 preview 동기화를 오프라인에서 검증할 수 있다. bolt.diy는 provider 선택, 파일 기반 편집, preview, MCP 통합을 포함한 더 큰 browser coding-agent 형태를 참고하기 위한 레퍼런스다. 이 showc

Key points:
• Design Mode의 선택 결과 수집: 선택자, HTML/CSS 요약, 화면 상태를 입력 context로 전달
• browser bridge: 브라우저 화면과 호스트 상태를 분리
• agent lifecycle: 시작·대기·승인·완료·실패 상태를 이벤트로 관찰
• CLI command bridge: 화면 동작을 임의 script가 아닌 명시적 command로 제한
• `ToolCallId`: 모델 호출과 결과를 연결하는 ID
• `ToolCallContext`: `source`, `sessionId`, `revision`
• `ToolCallError`: 안정적인 `code`, `message`, `retryable`, `details`
• `ToolCallEvent`: `started`, `completed`, `failed`
• 각 `ToolCallEvent`는 canonical `tools/call` request를 함께 전달하므로 audit
• action에 선택한 `outputSchema`가 있으면 structured handler result를 반환 전에
• `allowedToolNames`: discovery와 execution에 모두 적용되는 allowlist
•...