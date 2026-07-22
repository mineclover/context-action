---
document_id: concept--tool-calling-editor-architecture
category: concept
source_path: ko/concept/tool-calling-editor-architecture.md
character_limit: 5000
last_update: '2026-07-20T18:03:43.583Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Tool Calling Editor 아키텍처

Tool Calling Editor 아키텍처 브라우저 기반 실시간 editor는 iframe이 도구 실행기를 소유하지 않고, 부모 문서가 표준 Tool Registry·정책·호출 추적을 소유하는 구조로 구성한다. 이 데모에서 재사용할 Context-Action 규칙과 use-case recipe는 Tool Calling Web Studio 컨벤션에서 확인할 수 있다. 실행 경계 ToolCallResult.content는 text와 JSON content block을 모두 허용한다. structuredContent가 있으면 provider가 이를 사용할 수 있지만, structured output이 없을 때는 content block을 유지해야 한다. canonical runtime guard도 model에 결과를 전달하기 전에 두 형식을 모두 검증한다. 사람이 읽는 provider/UI 텍스트를 만들 때는 core의 stringifyToolContent helper를 사용해 JSON block이 text-only mapper에서 조용히 누락되지 않도록 한다. Orca는 여러 coding agent를 worktree, 터미널, embedded browser와 연결하는 ADE다. 이번 구현에서는 전체 데스크톱 구조가 아니라 다음 경계만 참고한다. - Design Mode의 선택 결과 수집: 선택자, HTML/CSS 요약, 화면 상태를 입력 context로 전달 - browser bridge: 브라우저 화면과 호스트 상태를 분리 - agent lifecycle: 시작·대기·승인·완료·실패 상태를 이벤트로 관찰 - CLI command bridge: 화면 동작을 임의 script가 아닌 명시적 command로 제한 참고 clone: architecture-references/orca (MIT, 조사 기준 commit 9a23792) 실시간 웹 코딩 showcase 집중 showcase 경로는 /integrations/live-web-coding이다. 첫 slice는 범위를 작게 유지하기 위해 HTML/CSS/JS 3개 파일 workspace, bounded web.applyPatch를 포함한 화면에 보이는 web. tool palette, 선택적인 OpenRouter model loop, sandbox iframe preview로 구성한다. API 키가 없어도 동일한 tools/list → model/local agent → tools/call → tool result 흐름을 결정적인 local fallback으로 실행하므로 tool 계약과 preview 동기화를 오프라인에서 검증할 수 있다. bolt.diy는 provider 선택, 파일 기반 편집, preview, MCP 통합을 포함한 더 큰 browser coding-agent 형태를 참고하기 위한 레퍼런스다. 이 showcase의 의존성이나 목표 아키텍처로 가져오지 않으며, 현재 경계는 browser-local persistence와 부모 문서가 소유하는 ToolContext로 유지한다. Bolt 스타일 standalone studio는 demos/bolt-style-editor workspace package에서 빌드해 /web-coding/으로 배포한다. example 애플리케이션의 route와 분리된 독립 정적 페이지이며, framework package와 자체 editor surface만 사용한다. 첫 slice는 API 키 없이도 전체 tools/list → model/local agent → tools/call → tool result → preview 흐름을 확인할 수 있도록 Dexie 기반 browser workspace, Blob file record와 결정적 local agent를 사용한다. IndexedDB를 사용할 수 없으면 memory workspace로 fallback한다. Open folder는 package가 소유하는 browser filesystem adapter를 사용하며 File System Access API를 우선하고, 지원하지 않는 브라우저에서는 directory-upload input으로 fallback한 뒤 가져온 text 파일로 Dexie workspace를 교체한다. 사용자가 read/write 권한을 허용하면 Save to folder로 dirty 파일을 선택한 directory에 다시 쓴다. structured-clone을 지원하는 브라우저에서는 다음 load를 위해 handle을 workspace metadata와 함께 저장할 수 있다. upload fallback은 browser workspace에만 저장한다. writable folder 연결이 남아 있으면 Reload가 directory를 다시 읽어 browser workspace를 교체하며, dirty 변경은 버리기 전에 명시적인 확인을 요구한다. 다른 folder를 여는 경우에도 같은 확인 경계를 사용하며, 취소하면 현재 workspace를 유지한다. 지원 가능한 파일이 없는 folder는 open과 reload 모두에서 거부되어 현재 workspace를 교체하거나 잘못된 folder 연결 상태를 남기지 않는다. adapter는 복원된 write permission을 granted, prompt, denied, unknown, disconnected 상태로 노출한다. header와 workspace.getStatus는 같은 상태를 표시하며, Grant access는 browser workspace를 교체하지 않고 권한만 다시 요청한다. hydration 중이거나 이후 workspace 쓰기에서 IndexedDB가 실패하면 현재 메모리 파

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
• `ToolCallEvent`: `started`, `completed`, `failed`
• 각 `ToolCallEvent`는 canonical `tools/call` request를 함께 전달하므로 audit
• action에 선택한 `outputSchema`가 있으면 structured handler result를 반환 전에
• `allowedToolNames`: discovery와 execution에 모두 적용되는 allowlist
• `toolPolicy`: `allow`, `ask`, `deny` 결정
• `onToolCall`: trace와 audit UI를 위한 lifecycle observer
• `ToolCallEvent.provenance`: `context-action-tool-execution-provenance.v1`로
• preview 렌더링
• 문서 revision 수신과 적용 결과 보고
• 제한된 bridge message 처리
• context-action 외 여러 제품에서 재사용한다.
• editor가 독립 배포·버전 주기를 가져야 한다.
• Monaco/Codemirror, bundler, worker, sandbox service 등 editor 전용 의존성이 커진다.
• framework 팀과 editor 팀의 개발 경계 또는 보안 운영 경계가 분리된다.
• Dexie가 workspace metadata와 파일 Blob의 브라우저 로컬 canonical store다.
• `Open folder`는 범용 filesystem adapter를 사용한다. 현재 browser adapter는
• 선택한 folder에 지원 파일이 하나도 없으면 import를 실패시키되 현재 Dexie
• HTML, CSS, JavaScript, JSON, Markdown, TypeScript, text 파일은 file 수·개별
• NUL byte나 parent traversal segment가 포함된 import path는 다른 workspace
• 다른 folder를 열 때 browser-side edit가 dirty이면 명시적으로 확인하며, 취소하면
• file 수나 전체 byte limit에 도달하면 directory traversal을 중단하며, import
• filesystem handle은 parent adapter 경계 뒤에 두고 tool payload나 iframe message에
•...