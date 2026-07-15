# Tool Calling Editor 아키텍처

브라우저 기반 실시간 editor는 iframe이 도구 실행기를 소유하지 않고, 부모 문서가 표준 Tool Registry·정책·호출 추적을 소유하는 구조로 구성한다.

## 실행 경계

```text
tools/list
  → model tool call { id, name, arguments }
  → ToolRegistry.executeModelToolCall()
  → ToolPolicy
  → DocumentManager
  → iframe preview bridge
  → tool result { toolCallId, content, structuredContent, error? }
  → model
```

Orca는 여러 coding agent를 worktree, 터미널, embedded browser와 연결하는 ADE다. 이번 구현에서는 전체 데스크톱 구조가 아니라 다음 경계만 참고한다.

- Design Mode의 선택 결과 수집: 선택자, HTML/CSS 요약, 화면 상태를 입력 context로 전달
- browser bridge: 브라우저 화면과 호스트 상태를 분리
- agent lifecycle: 시작·대기·승인·완료·실패 상태를 이벤트로 관찰
- CLI command bridge: 화면 동작을 임의 script가 아닌 명시적 command로 제한

참고 clone: `architecture-references/orca` (MIT, 조사 기준 commit `9a23792`)

## 실시간 웹 코딩 showcase

집중 showcase 경로는 `/integrations/live-web-coding`이다. 첫 slice는 범위를
작게 유지하기 위해 HTML/CSS/JS 3개 파일 workspace, 화면에 보이는 `web.*`
tool palette, 선택적인 OpenRouter model loop, sandbox iframe preview로
구성한다. API 키가 없어도 동일한 `tools/list` → model/local agent →
`tools/call` → tool result 흐름을 결정적인 local fallback으로 실행하므로
tool 계약과 preview 동기화를 오프라인에서 검증할 수 있다.

[bolt.diy](https://github.com/stackblitz-labs/bolt.diy)는 provider 선택, 파일
기반 편집, preview, MCP 통합을 포함한 더 큰 browser coding-agent 형태를
참고하기 위한 레퍼런스다. 이 showcase의 의존성이나 목표 아키텍처로 가져오지
않으며, 현재 경계는 browser-local persistence와 부모 문서가 소유하는
ToolContext로 유지한다.

Bolt 스타일 standalone studio는 `demos/bolt-style-editor` workspace package에서
빌드해 `/web-coding/`으로 배포한다. example 애플리케이션의 route와 분리된 독립
정적 페이지이며, framework package와 자체 editor surface만 사용한다. 첫 slice는
API 키 없이도 전체 `tools/list` → model/local agent → `tools/call` → tool result
→ preview 흐름을 확인할 수 있도록 Dexie 기반 browser workspace, Blob file record와
결정적 local agent를 사용한다. IndexedDB를 사용할 수 없으면 memory workspace로
fallback한다. `Open folder`는 부모가 소유하는 browser adapter를 사용하며 File
System Access API를 우선하고, 지원하지 않는 브라우저에서는 directory-upload
input으로 fallback한 뒤 가져온 text 파일로 Dexie workspace를 교체한다. 사용자가
read/write 권한을 허용하면 adapter는 directory handle을 부모 안에만 유지하고
`Save to folder`로 dirty 파일을 선택한 directory에 다시 쓴다. upload fallback은
browser workspace에만 저장한다.

standalone 상단의 설정 창에서는 사용자 소유 OpenRouter API key·model ID·chat
completions endpoint를 관리한다. API key는 example 데모와 공유하는
`context-action.openrouter.api-key` browser key에 저장하므로 같은 origin의 다른
OpenRouter 위치에서 재사용할 수 있다. 키가 있으면 chat이 OpenRouter native
tool-call loop를 사용하고, 없으면 동일한 화면에서 결정적인 local agent fallback을
사용한다. 키는 브라우저에서 설정된 endpoint로 직접 전송되며 Context-Action 서버로
전달하거나 번들에 포함하지 않는다.
agent 실행 중에는 `Cancel`이 provider request, registry 실행, preview
acknowledgement 대기를 함께 abort한다. 취소 결과는 tool 성공으로 오인되지 않도록
사용자에게 assistant message로 표시한다.

## 표준 계약

Core의 `tool-protocol.ts`는 provider와 무관한 다음 정보를 유지한다.

- `ToolCallId`: 모델 호출과 결과를 연결하는 ID
- `ToolCallContext`: `source`, `sessionId`, `revision`
- `ToolCallError`: 안정적인 `code`, `message`, `retryable`, `details`
- `ToolCallEvent`: `started`, `completed`, `failed`

React ToolContext는 여기에 실행 범위를 추가한다.

- `allowedToolNames`: discovery와 execution에 모두 적용되는 allowlist
- `toolPolicy`: `allow`, `ask`, `deny` 결정
- `onToolCall`: trace와 audit UI를 위한 lifecycle observer

blocking handler가 실패하면 ToolContext는 handler의 오류 메시지와 handler ID를
`tools/call`의 structured error message/details에 보존한다. 따라서 UI와 model이
`Tool call failed` 같은 일반 오류만 받지 않고 실제 validation·workspace 원인을
확인할 수 있다.

annotation의 `destructiveHint`는 모델과 UI를 위한 힌트다. 실제 권한 차단은 반드시 `toolPolicy`에서 수행한다.

standalone studio는 같은 경계를 execution trace로 표시한다. local과 OpenRouter
요청은 provider별 tool serialization 전에 `registry.listTools({ method:
'tools/list' })`를 호출한다. 이후 ToolContext의 `onToolCall` observer가
`started`, `completed`, `failed` 이벤트와 source·duration·result 상태를 기록한다.
trace는 UI state일 뿐이며 파일 내용이나 filesystem handle을 모델로 보내지 않는다.
local agent와 palette action은 canonical `registry.callTool()` bridge를 사용해
`local` source를 보존한다. provider model call은 `executeModelToolCall()`을
사용하며 model approval policy의 대상이 된다.

sidebar tool catalog는 canonical `getToolDefinition()` 결과를 직접 읽는다. 따라서
화면에 표시되는 description·annotation·JSON input schema는 MCP와 OpenRouter에
export되는 contract와 동일하다.

standalone demo에서는 model source의 non-read-only call이 `toolPolicy` 경계에서
사용자 승인 또는 거부를 기다린다. approval card에는 tool name·description·source·
argument key만 표시하고 파일 source 자체는 다시 보여주지 않는다. local agent와
palette call은 local source를 사용하므로 승인 왕복 없이 결정적으로 실행된다.

## iframe 규칙

iframe은 다음 역할만 담당한다.

- preview 렌더링
- 문서 revision 수신과 적용 결과 보고
- 제한된 bridge message 처리

iframe에 ToolRegistry나 모델 API 키를 넣지 않는다. 현재 showcase는
`editor.getDocument`, `editor.setDocument`, `editor.setScenario`,
`editor.resetDocument`, `editor.getPreviewStatus`를 노출한다. mutation handler는
부모 DocumentManager를 먼저 변경하고 iframe의 해당 revision acknowledgement를
받은 뒤 tool result를 반환한다. 임의 `runScript` 도구는 제공하지 않는다.

standalone editor도 같은 경계를 작은 injected bridge로 구현한다. sandbox는
문서 revision을 포함한 `context-action.preview.ready` 또는
`context-action.preview.error` message를 부모로 보낸다. 부모는 현재 iframe
window에서 온 message만 허용하고 오래된 revision은 무시하며, visual mutation
tool은 일치하는 acknowledgement를 받은 뒤에만 성공한 tool result를 반환한다.

## 패키지·레포지토리 분리 계획

전체 Live Code Editor는 framework runtime이 아니라 `example`의 showcase
surface이므로 example 내부에 유지한다. Bolt 스타일 visual shell은
`demos/bolt-style-editor`로 격리해 example route와 결합하지 않고 정적 페이지로
배포한다. Tool protocol은 `@context-action/core`, ToolContext와 registry는
`@context-action/react`가 계속 소유한다.

다음 단계에서 iframe sandbox, revision protocol, `postMessage` bridge,
DocumentManager, editor adapter가 독립적인 테스트와 API를 갖게 되면
`packages/live-code-editor` workspace package로 분리하는 것을 검토한다.
처음에는 private package로 두고 계약이 안정된 뒤 공개 패키지 여부를 판단한다.

별도 repository는 다음 조건이 충족될 때만 검토한다.

- context-action 외 여러 제품에서 재사용한다.
- editor가 독립 배포·버전 주기를 가져야 한다.
- Monaco/Codemirror, bundler, worker, sandbox service 등 editor 전용 의존성이 커진다.
- framework 팀과 editor 팀의 개발 경계 또는 보안 운영 경계가 분리된다.

분리 순서는 `example 유지 → standalone demo/workspace package → 독립 repository`를
기본 계획으로 한다.

## 현재 showcase editor 도구

| 도구 | 기본 정책 | 목적 |
| --- | --- | --- |
| `editor.getDocument` | allow | 현재 문서와 revision 조회 |
| `editor.getPreviewStatus` | allow | 최신 iframe acknowledgement 조회 |
| `editor.setDocument` | local demo allow | controlled source 교체, 실행하지 않음 |
| `editor.setScenario` | local demo allow | 안전한 runner 시나리오 변경 |
| `editor.resetDocument` | local demo allow | 선택한 예제의 source로 초기화 |

`editor.applyPatch`는 다음 계약으로 남겨둔다. production 연결에서는 파괴적
변경이나 광범위한 mutation을 허용하기 전에 승인 가능한 `toolPolicy`로
교체해야 한다.

## Code workspace 경계

Live Code Editor는 document manager와 함께 부모가 소유하는 workspace
manager와 Dexie repository를 갖는다.

```text
Open folder → generic FileSystemAdapter
           → Dexie (metadata + Blob files)
           → WorkspaceManager (text projection, activePath, dirtyPaths)
           → DocumentManager (active source + revision)
           → ToolContext / iframe preview
```

- Dexie가 workspace metadata와 파일 Blob의 브라우저 로컬 canonical store다.
  에디터의 text source는 저장된 Blob에서 파생되고, binary asset은 Blob을
  직접 유지해 preview에 사용한다.
- `Open folder`는 범용 filesystem adapter를 사용한다. 현재 browser adapter는
  사용자 제스처의 File System Access API로 폴더를 읽은 뒤 Dexie로 import하며,
  directory handle이 workspace의 소유자가 되지 않는다.
- HTML, CSS, JavaScript, JSON, Markdown, TypeScript, text 파일은 file 수·개별
  크기·전체 크기 제한과 함께 가져온다. 지원되는 image·font·WASM 파일은
  Blob 기반 preview-only asset으로 보존하고, 지원하지 않는 파일은 chat에
  건너뛴 항목으로 표시한다.
- filesystem handle은 부모 adapter 안에만 두고 tool payload나 iframe message에
  넣지 않는다.
- text 편집은 Dexie에 즉시 저장한다. read/write directory handle이 있으면
  `Save to folder`가 dirty text 파일을 선택한 운영체제 directory에 다시 쓰며,
  upload-only import는 browser workspace에만 저장한다.
- standalone registry는 `workspace.createFile`, `workspace.writeFile`,
  `workspace.deleteFile`을 분리한다. 새 text 파일은 경로를 정규화하고
  active editor tab으로 열며 Blob 기반 record로 저장한다. 삭제는 browser
  local record에서 즉시 반영하고 deleted-path checkpoint를 보존해 다음
  `Save to folder`에서 실제 파일도 삭제하며, undo/redo와 active preview
  entry가 유효하도록 유지한다. pending deletion path도 Dexie metadata에
  저장하므로 reload 후에도 운영체제 폴더 삭제 의도를 잃지 않는다.
- 에디터의 active-file Delete action도 palette와 model loop가 사용하는
  동일한 `workspace.deleteFile` registry contract를 호출하므로 별도 mutation
  경로를 만들지 않는다.
- Explorer의 New file dialog도 `workspace.createFile`을 호출한다. validation
  실패는 tool result 경로에 남기고 dialog를 유지하며, 생성 성공 시 새 tab을
  선택한다. 실패 메시지는 dialog 안에도 표시하고, Explorer와 tab에는 파일별
  unsaved 표시를 보여준다.
- Explorer는 정규화된 파일 경로를 기준으로 정렬된 nested tree를 만든다.
  directory row는 접거나 펼칠 수 있지만 workspace 데이터는 바뀌지 않으며,
  파일 선택은 전체 `activePath`를 그대로 유지한다.
- 실행 가능한 workspace에서는 `index.html`을 우선 진입점으로 사용하고, 없으면
  첫 `.html` 파일을 사용한다. 상대 경로의 로컬 `.css`와 `.js`는 sandbox iframe
  안에 주입해 실행한다.
- visual tool은 workspace 경로에서 HTML entry와 우선 stylesheet를 찾으므로
  `src/index.html` 구조를 가져와도 root 파일명에 의존하지 않는다. workspace가
  필요한 target을 제공하지 않으면 false success 대신 명시적인 tool error를
  반환한다.
- 외부 CSS/JS URL과 임의의 `runScript` 요청은 preview 경계에서 차단한다. 로컬
  asset 참조는 짧은 수명의 object URL로 바꾸고 workspace preview가 바뀔 때
  URL을 revoke한다.
- folder picker를 지원하지 않는 브라우저에서는 directory-upload fallback을
  사용한다. IndexedDB 자체를 사용할 수 없을 때도 파일을 서버로 몰래 전송하지
  않고 memory workspace를 유지한다.

## 빌드 순서

1. Tool ID·오류 코드·source context를 유지한다.
2. allowlist와 policy를 discovery/execution 양쪽에 적용한다.
3. lifecycle observer로 병렬 호출과 실패 결과를 기록한다.
4. DocumentManager를 부모에 구현한다.
5. Dexie workspace repository와 Blob/filesystem adapter 경계를 추가한다.
6. DocumentManager와 revision-aware preview bridge 및 acknowledgement 계약을
   계속 일치시킨다.
7. 실제 모델 호출에서 `toolCallId`와 abort signal을 Registry까지 전달하고,
   사용자가 실행을 취소할 수 있는 경로를 제공한다.
8. `tools/list → call → result`와 workspace reload의 브라우저 검증을 추가한다.
9. 파괴적인 workspace tool은 model 호출에서 approval gate를 유지하고,
   실제 폴더 삭제는 사용자가 실행하는 save 경계에서만 수행한다.

## 검증 기준

- prototype 이름(`toString`, `constructor`)이 도구로 실행되지 않는다.
- 병렬 호출 결과가 `toolCallId`별로 섞이지 않는다.
- validation/policy 오류는 모델이 읽을 수 있는 structured error로 돌아간다.
- iframe revision이 오래된 patch를 거부한다.
- destructive tool은 policy 승인 없이 실행되지 않는다.
- model source의 mutation call은 명시적인 승인 또는 거부 없이는 policy 경계를
  통과하지 못한다.
