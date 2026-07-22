---
document_id: concept--tool-calling-editor-architecture
category: concept
source_path: ko/concept/tool-calling-editor-architecture.md
character_limit: 2000
last_update: '2026-07-20T18:03:43.582Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Tool Calling Editor 아키텍처

Tool Calling Editor 아키텍처 브라우저 기반 실시간 editor는 iframe이 도구 실행기를 소유하지 않고, 부모 문서가 표준 Tool Registry·정책·호출 추적을 소유하는 구조로 구성한다. 이 데모에서 재사용할 Context-Action 규칙과 use-case recipe는 Tool Calling Web Studio 컨벤션에서 확인할 수 있다. 실행 경계 ToolCallResult.content는 text와 JSON content block을 모두 허용한다. structuredContent가 있으면 provider가 이를 사용할 수 있지만, structured output이 없을 때는 content block을 유지해야 한다. canonical runtime guard도 model에 결과를 전달하기 전에 두 형식을 모두 검증한다. 사람이 읽는 provider/UI 텍스트를 만들 때는 core의 stringifyToolContent helper를 사용해 JSON block이 text-only mapper에서 조용히 누락되지 않도록 한다. Orca는 여러 coding agent를 worktree, 터미널, embedded browser와 연결하는 ADE다. 이번 구현에서는 전체 데스크톱 구조가 아니라 다음 경계만 참고한다. - Design Mode의 선택 결과 수집: 선택자, HTML/CSS 요약, 화면 상태를 입력 context로 전달 - browser bridge: 브라우저 화면과 호스트 상태를 분리 - agent lifecycle: 시작·대기·승인·완료·실패 상태를 이벤트로 관찰 - CLI command bridge: 화면 동작을 임의 script가 아닌 명시적 command로 제한 참고 clone: architecture-references/orca (MIT, 조사 기준 commit 9a23792) 실시간 웹 코딩 showcase 집중 showcase 경로는 /integrations/live-web-coding

Key points:
• Design Mode의 선택 결과 수집: 선택자, HTML/CSS 요약, 화면 상태를 입력 context로 전달
• browser bridge: 브라우저 화면과 호스트 상태를 분리
• agent lifecycle: 시작·대기·승인·완료·실패 상태를 이벤트로 관찰
• CLI command bridge: 화면 동작을 임의 script가 아닌 명시적 command로 제한
• `ToolCallId`: 모델 호출과 결과를 연결하는 ID
• `ToolCallContext`: transport `source`, execution `mode`, `sessionId`, `revision`
• `isToolListRequest()`와 `isToolCallRequest()`는 untrusted JSON이 registry
• `isToolListResult()`는 `listAllTools()`가 provider adapter에 definition을
• `isToolCallResult()`는 adapter가 tool result를 전달하기 전에 text content,
• `ToolCallError`: 안정적인 `code`, `message`, `retryable`, `details`
•...