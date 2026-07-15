---
document_id: concept--tool-calling-editor-architecture
category: concept
source_path: ko/concept/tool-calling-editor-architecture.md
character_limit: 5000
last_update: '2026-07-15T14:31:24.337Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Tool Calling Editor 아키텍처

Tool Calling Editor 아키텍처 브라우저 기반 실시간 editor는 iframe이 도구 실행기를 소유하지 않고, 부모 문서가 표준 Tool Registry·정책·호출 추적을 소유하는 구조로 구성한다. 실행 경계 Orca는 여러 coding agent를 worktree, 터미널, embedded browser와 연결하는 ADE다. 이번 구현에서는 전체 데스크톱 구조가 아니라 다음 경계만 참고한다. - Design Mode의 선택 결과 수집: 선택자, HTML/CSS 요약, 화면 상태를 입력 context로 전달 - browser bridge: 브라우저 화면과 호스트 상태를 분리 - agent lifecycle: 시작·대기·승인·완료·실패 상태를 이벤트로 관찰 - CLI command bridge: 화면 동작을 임의 script가 아닌 명시적 command로 제한 참고 clone: architecture-references/orca (MIT, 조사 기준 commit 9a23792) 실시간 웹 코딩 showcase 집중 showcase 경로는 /integrations/live-web-coding이다. 첫 slice는 범위를 작게 유지하기 위해 HTML/CSS/JS 3개 파일 workspace, bounded web.applyPatch를 포함한 화면에 보이는 web. tool palette, 선택적인 OpenRouter model loop, sandbox iframe preview로 구성한다. API 키가 없어도 동일한 tools/list → model/local agent → tools/call → tool result 흐름을 결정적인 local fallback으로 실행하므로 tool 계약과 preview 동기화를 오프라인에서 검증할 수 있다. bolt.diy는 provider 선택, 파일 기반 편집, preview, MCP 통합을 포함한 더 큰 browser coding-agent 형태를 참고하기 위한 레퍼런스다. 이 showcase의 의존성이나 목표 아키텍처로 가져오지 않으며, 현재 경계는 browser-local persistence와 부모 문서가 소유하는 ToolContext로 유지한다. Bolt 스타일 standalone studio는 demos/bolt-style-editor workspace package에서 빌드해 /web-coding/으로 배포한다. example 애플리케이션의 route와 분리된 독립 정적 페이지이며, framework package와 자체 editor surface만 사용한다. 첫 slice는 API 키 없이도 전체 tools/list → model/local agent → tools/call → tool result → preview 흐름을 확인할 수 있도록 Dexie 기반 browser workspace, Blob file record와 결정적 local agent를 사용한다. IndexedDB를 사용할 수 없으면 memory workspace로 fallback한다. Open folder는 부모가 소유하는 browser adapter를 사용하며 File System Access API를 우선하고, 지원하지 않는 브라우저에서는 directory-upload input으로 fallback한 뒤 가져온 text 파일로 Dexie workspace를 교체한다. 사용자가 read/write 권한을 허용하면 Save to folder로 dirty 파일을 선택한 directory에 다시 쓴다. structured-clone을 지원하는 브라우저에서는 다음 load를 위해 handle을 workspace metadata와 함께 저장할 수 있다. upload fallback은 browser workspace에만 저장한다. writable folder 연결이 남아 있으면 Reload가 directory를 다시 읽어 browser workspace를 교체하며, dirty 변경은 버리기 전에 명시적인 확인을 요구한다. standalone Vite config는 workspace의 core, react, mutative package를 source에서 resolve하므로, 페이지를 띄우기 전에 오래된 packages//dist 중간 산출물을 별도로 준비하지 않아도 dev server가 시작된다. standalone 상단의 설정 창에서는 사용자 소유 OpenRouter API key·model ID·chat completions endpoint를 관리한다. API key는 example 데모와 공유하는 context-action.openrouter.api-key browser key에 저장하므로 같은 origin의 다른 OpenRouter 위치에서 재사용할 수 있다. 키가 있으면 chat이 OpenRouter native tool-call loop를 사용하고, 없으면 동일한 화면에서 결정적인 local agent fallback을 사용한다. 키는 브라우저에서 설정된 endpoint로 직접 전송되며 Context-Action 서버로 전달하거나 번들에 포함하지 않는다. agent 실행 중에는 Cancel이 provider request, registry 실행, preview acknowledgement 대기를 함께 abort한다. 취소 결과는 tool 성공으로 오인되지 않도록 사용자에게 assistant message로 표시한다. 결정적인 local fallback도 mutation 전에 같은 inspection 경계를 따른다. 먼저 workspace.getStatus를 호출하고, file target을 알고 있으면 workspace.listFiles를 호출한다. text mut

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
• `toolPolicy`: `allow`, `ask`, `deny` 결정
• `onToolCall`: trace와 audit UI를 위한 lifecycle observer
• preview 렌더링
• 문서 revision 수신과 적용 결과 보고
• 제한된 bridge message 처리
• context-action 외 여러 제품에서 재사용한다.
• editor가 독립 배포·버전 주기를 가져야 한다.
• Monaco/Codemirror, bundler, worker, sandbox service 등 editor 전용 의존성이 커진다.
• framework 팀과 editor 팀의 개발 경계 또는 보안 운영 경계가 분리된다.
• Dexie가 workspace metadata와 파일 Blob의 브라우저 로컬 canonical store다.
• `Open folder`는 범용 filesystem adapter를 사용한다. 현재 browser adapter는
• HTML, CSS, JavaScript, JSON, Markdown, TypeScript, text 파일은 file 수·개별
• filesystem handle은 parent adapter 경계 뒤에 두고 tool payload나 iframe message에
• Explorer의 `Reload` action은 같은 adapter로 연결된 directory를 다시 읽어 Dexie
• text 편집은 Dexie에 즉시 저장한다. read/write directory handle이 있으면
• standalone registry는 `workspace.createFile`, `workspace.writeFile`,
• `workspace.revertFile`은 active file을 마지막 saved browser workspace
• 에디터의 active-file Delete action도 palette와 model loop가 사용하는
• `workspace.applyPatch`는 text file에 literal search/replace를 수행한다. `first`와
• `workspace.saveAll`은 standalone demo의 명시적인 filesystem 경계다. Explorer의
• `workspace.getStatus`는 standalone catalog의 read-only 상태 경계다. 현재
• `workspace.readFile`은 현재...