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
작게 유지하기 위해 HTML/CSS/JS 3개 파일 workspace, bounded `web.applyPatch`를 포함한 화면에 보이는 `web.*`
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
read/write 권한을 허용하면 `Save to folder`로 dirty 파일을 선택한 directory에
다시 쓴다. structured-clone을 지원하는 브라우저에서는 다음 load를 위해 handle을
workspace metadata와 함께 저장할 수 있다. upload fallback은 browser workspace에만
저장한다. writable folder 연결이 남아 있으면 `Reload`가 directory를 다시 읽어
browser workspace를 교체하며, dirty 변경은 버리기 전에 명시적인 확인을 요구한다.
다른 folder를 여는 경우에도 같은 확인 경계를 사용하며, 취소하면 현재
workspace를 유지한다. 지원 가능한 파일이 없는 folder는 open과 reload 모두에서
거부되어 현재 workspace를 교체하거나 잘못된 folder 연결 상태를 남기지 않는다.
adapter는 복원된 write permission을 `granted`, `prompt`, `denied`, `unknown`,
`disconnected` 상태로 노출한다. header와 `workspace.getStatus`는 같은 상태를
표시하며, `Grant access`는 browser workspace를 교체하지 않고 권한만 다시 요청한다.
standalone Vite config는 workspace의 `core`, `react`, `mutative` package를 source에서
resolve하므로, 페이지를 띄우기 전에 오래된 `packages/*/dist` 중간 산출물을 별도로
준비하지 않아도 dev server가 시작된다.

standalone 상단의 설정 창에서는 사용자 소유 OpenRouter API key·model ID·chat
completions endpoint를 관리한다. API key는 example 데모와 공유하는
`context-action.openrouter.api-key` browser key에 저장하므로 같은 origin의 다른
OpenRouter 위치에서 재사용할 수 있다. 같은 origin의 tab과 위치는 storage
subscription으로 provider control을 실시간 갱신한다. 반면 local development
server가 서로 다른 port를 사용하면 브라우저 storage도 분리되므로 각 origin에서
별도로 입력해야 한다. 키가 있으면 chat이 OpenRouter native tool-call loop를
사용하고, 없으면 동일한 화면에서 결정적인 local agent fallback을 사용한다. 키는
브라우저에서 설정된 endpoint로 직접 전송되며 Context-Action 서버로 전달하거나
번들에 포함하지 않는다.
agent 실행 중에는 `Cancel`이 provider request, registry 실행, preview
acknowledgement 대기를 함께 abort한다. 취소 결과는 tool 성공으로 오인되지 않도록
사용자에게 assistant message로 표시한다.
결정적인 local fallback도 mutation 전에 같은 inspection 경계를 따른다. 먼저
`workspace.getStatus`를 호출하고, file target을 알고 있으면
`workspace.listFiles`를 호출한다. text mutation이면 `workspace.readFile`도 호출한
뒤 mutation을 실행한다.
다운로드 요청에 path가 없으면 현재 `activePath`를 `workspace.downloadFile`의
대상으로 사용하며, active workspace file 자체가 없을 때만 path를 다시 요청한다.
example live editor도 동일한 경계를 사용한다. 브라우저 OpenRouter request가 실행 중이면
`Run editor toolchain`이 `Cancel editor toolchain`으로 바뀌고, provider-neutral
runner contract를 통해 abort signal을 전달한다. realtime web-coding showcase도
local agent·model request·palette tool 경로에 같은 signal을 사용하며, 두 route를
이동할 때 진행 중인 실행을 함께 abort한다.

standalone chat은 실패와 취소를 typed UI 상태로 보존한다. 재시도 가능한 provider 또는
local tool 오류와 재시도 가능한 palette 샘플 실패에는 원래 prompt 또는 tool arguments를
재사용하는 `Retry` 동작을 표시한다. 재시도할 수 없는 execution·policy 오류에는 오해를
만드는 Retry를 표시하지 않으며, 취소는 failed가 아닌 cancelled 상태로 구분한다.
composer에는 visual 변경·workspace status·파일 생성·명시적인 folder save와
reload 경계·folder disconnect를 위한 prompt recipe도 제공한다. 각 recipe는
자유 입력과 동일한 local-agent planning 및 approval 경로로 들어간다.
example의 ToolContext AI 데모는 provider 오류를 alert로 채팅 영역에 유지하고,
실패한 prompt를 composer에 복원하며, 저장된 key와 model control을 그대로
사용할 수 있게 한다. 따라서 설정을 수정한 뒤 같은 요청을 다시 제출할 수 있다.

standalone OpenRouter bridge는 response body를 먼저 text로 읽은 뒤 JSON을 해석하므로,
endpoint 설정이 잘못되어도 브라우저의 `Response.json()` 내부 예외가 chat에 그대로
노출되지 않는다. 401/403은 재시도할 수 없는 인증·접근 오류로, 429와 5xx는 재시도 가능한
provider 오류로, network failure는 재시도 가능한 오류로 분류한다. 각 provider 실패는
사용자에게 `OPENROUTER_*` 명시 code와 함께 표시한다. model이
`function.arguments`에 잘못된 JSON이나 object가 아닌 JSON을 반환하면 registry
실행 전에 거부하고 재시도 가능한 `OPENROUTER_INVALID_TOOL_CALL`로 표시한다.
따라서 payload를 조용히 `{}`로 바꿔 인자가 없는 tool이 실행되는 경로가 없다.

## 표준 계약

Core의 `tool-protocol.ts`는 provider와 무관한 다음 정보를 유지한다.

- `ToolCallId`: 모델 호출과 결과를 연결하는 ID
- `ToolCallContext`: `source`, `sessionId`, `revision`
- `ToolCallError`: 안정적인 `code`, `message`, `retryable`, `details`
- `ToolCallEvent`: `started`, `completed`, `failed`
- 각 `ToolCallEvent`는 canonical `tools/call` request를 함께 전달하므로 audit
  observer가 arguments와 최종 result를 연결할 수 있다.
- action에 선택한 `outputSchema`가 있으면 structured handler result를 반환 전에
  검증하며, 실패 시 `TOOL_OUTPUT_VALIDATION_FAILED` 결과를 반환한다.

Core는 표준 managed-call code를 재사용할 수 있도록
`TOOL_CALL_ERROR_CODES`와 `ToolCallErrorCode`를 export한다. handler가 workspace나
제품 도메인의 구체적인 실패를 보고해야 하는 경우에는 custom code도 추가할 수 있다.

대규모 catalog는 `createToolContext`의 `toolListPageSize`로 discovery page 크기를
지정할 수 있다. 이때 canonical `listTools({ method: 'tools/list' })` 요청은 opaque
`nextCursor`를 반환하며, 인자가 없는 `listTools()`와 provider batch export는 전체
catalog를 유지한다.

standalone workspace, realtime web-coding, Live Code Editor catalog도 같은 output
계약을 사용한다. 파일 조회·변경, preview acknowledgement, save 결과까지 모델이
보낼 입력과 다음 단계가 안전하게 소비할 결과를 함께 정의한다.

React ToolContext는 여기에 실행 범위를 추가한다.

- `allowedToolNames`: discovery와 execution에 모두 적용되는 allowlist
- `toolPolicy`: `allow`, `ask`, `deny` 결정
- `onToolCall`: trace와 audit UI를 위한 lifecycle observer

strict 모드에서는 `tools/call` arguments를 `toolPolicy` 실행 전에 검증한다.
잘못된 model 입력은 schema issue를 포함한 `TOOL_VALIDATION_FAILED` 결과로
돌아가며 approval prompt나 handler까지 도달하지 않는다. `warn`과 `silent` 모드는
기존의 permissive dispatch 동작을 유지한다.

`toolPolicy`에도 call의 `AbortSignal`을 전달하므로 provider request가 취소된 뒤
approval·policy 대기가 남지 않는다. 같은 signal은 registry handler와 preview
대기까지 전달되며, 어느 경계에서 취소되어도 재시도 가능한
`TOOL_CANCELLED` 표준 오류 결과를 반환한다.

provider별 filtered export(`toMCPFiltered`, `toOpenAIFiltered`,
`toAnthropicFiltered`)도 같은 allowlist 경계를 사용한다. `tools/list`에서
숨겨진 도구는 이름을 직접 선택해 provider payload에 다시 넣을 수 없다.

blocking handler가 실패하면 ToolContext는 handler의 오류 메시지와 handler ID를
`tools/call`의 structured error message/details에 보존한다. 따라서 UI와 model이
`Tool call failed` 같은 일반 오류만 받지 않고 실제 validation·workspace 원인을
확인할 수 있다.

standalone OpenRouter bridge는 canonical error의 `code`, `retryable`, `details`를
다음 model message로 전달한다. local fallback 실행에서는 같은 code와 details를
assistant transcript에 표시하므로 provider 사용 여부와 관계없이 오류 원인을
확인할 수 있다.

annotation의 `destructiveHint`는 모델과 UI를 위한 힌트다. 이 데모에서는 파일 삭제와
revert 샘플에 표시하여 palette가 명시적 확인을 요청하게 한다. 실제 권한 차단은
반드시 `toolPolicy`에서 수행한다.

standalone studio와 realtime web-coding route는 같은 경계를 execution trace로 표시한다.
local과 OpenRouter 요청은 provider별 tool serialization 전에 `registry.listTools({ method:
'tools/list' })`를 호출한다. 이후 ToolContext의 `onToolCall` observer가
`started`, `completed`, `failed` 이벤트와 source·duration·result 상태를 기록한다.
trace는 UI state일 뿐이며 파일 내용이나 filesystem handle을 모델로 보내지 않는다.
`Clear`는 workspace 파일·tool registry·provider history를 바꾸지 않고 이 local
trace view만 초기화한다. call row를 펼치면 canonical `tools/call` arguments와
result를 제한된 길이로 확인할 수 있다. 파일성 `source`, `search`, `replace`
값은 문자 수만 남기고 redact하므로 파일 내용을 trace UI에 복사하지 않으면서
호출 구조를 확인할 수 있다. 접힌 row에는 파일 수·path·theme·revision 같은
안전한 result summary만 표시한다.
standalone의 `agent.request` row는 같은 실행을 감싸며 running·completed·failed·cancelled
상태를 기록한다. 따라서 `tools/call`까지 도달하지 못한 provider 오류도 trace에서
확인할 수 있다.
각 agent 실행은 하나의 `sessionId`를 만들고 `tools/list`와 모든
`executeModelToolCall()` context에 전달한다. 따라서 trace에서는 개별 호출의
`toolCallId`와 실행 단위의 session correlation을 구분할 수 있으며, 축약 row의
tooltip과 복사한 trace JSON에서도 session 식별자를 확인할 수 있다. local fallback과
OpenRouter는 같은 correlation 계약을 사용한다.
승인 대기 항목도 같은 session marker를 표시하며, 직접 실행하는 palette call도
자체 session을 생성한다. 따라서 agent row가 없는 수동 실행도 trace에서 감사할 수 있다.
call row에는 축약된 `toolCallId`를 표시하고 full value는 row tooltip에서 확인할 수
있다. trace panel의 `Copy` action은 같은 bounded·redacted entry를 JSON으로 내보내므로,
workspace source를 노출하지 않고도 `tools/list` → call → result 예시를 문서나 외부
테스트에서 재사용할 수 있다.

realtime web-coding workspace는 `web.getWorkspace`와 `web.readFile`에서
monotonic workspace revision을 노출한다. 모든 mutation `web.*` tool은 선택적인
`expectedRevision`을 받아 source를 바꾸기 전에 오래된 edit를 거부하고, preview
acknowledgement 후 새 workspace revision을 반환한다. 따라서 full-file write,
visual helper, bounded `web.applyPatch`가 하나의 optimistic-concurrency 계약을
공유한다.
직접 실행하는 palette action은 canonical `registry.callTool()` bridge를 사용해
`local` source를 보존한다. 결정적인 local agent는 계획한 call을
`local-fallback` provider marker와 함께 `executeModelToolCall()`로 전달하므로,
API key가 없어도 offline demo가 provider model과 같은 `model → tools/call` 경계와
approval policy를 사용한다. 직접 실행하는 palette sample만 명시적인 local action으로
처리한다.

sidebar tool catalog는 canonical `getToolDefinition()` 결과를 직접 읽는다. 따라서
화면에 표시되는 description·기본 model/MCP policy summary·annotation·JSON input
schema와 선택적인 structured `outputSchema`는 MCP로 export되는 canonical contract와
동일하며 result boundary에서도 같은 계약을 강제한다. OpenAI-compatible/OpenRouter
payload는 provider가 허용하는
input function projection을 사용하지만, provider 호출 뒤 structured result 검증은
registry가 계속 수행한다. catalog 행 선택은 정의를 살펴보는
데만 사용하고, 샘플 인자를 실행하려면 별도의 `Run sample` 버튼을 누르게 한다.
따라서 파괴적인 tool을 살펴보는 것만으로 workspace가 변경되지 않는다. catalog
검색과 scope filter는 동일한 canonical list만 좁혀 보며 discovery나 execution
policy를 바꾸지 않는다. scope count는 canonical annotation과 namespace에서
계산하며 all·read-only·workspace·preview 범위를 제공한다.
`Copy list`는 `registry.listTools({ method: 'tools/list' })`가 반환한 전체 `tools`
array를 serialize하므로 definition을 수동으로 다시 만들지 않고 MCP/provider
테스트에 붙여 넣을 수 있다. `Download list`, `Download definition`,
`Download tools/call`은 Clipboard 권한이 없는 환경에서도 같은 계약을 JSON 파일로
가져가게 한다. sample argument editor는 selection이나 workspace
revision 변경 시 수정하지 않은 generated sample만 갱신하며, 사용자가 JSON을
직접 편집한 뒤에는 custom arguments를 보존한다. 따라서 stale revision과
validation case도 의도적으로 테스트할 수 있다.

standalone demo에서는 model·MCP source의 non-read-only call이 `toolPolicy` 경계에서
사용자 승인 또는 거부를 기다린다. 명시적인 non-prompt local palette action만 이
경계를 우회한다. approval card에는 tool name·description·source·
argument key를 표시하고 파일 source 자체는 다시 보여주지 않는다. 필요하면 대상
`path`나 `theme` 같은 안전한 argument preview만 표시한다. prompt-originated local
mutation은 approval 왕복을 거치고, 직접 실행하는 palette call은 결정적인 local
action으로 실행된다.

## iframe 규칙

iframe은 다음 역할만 담당한다.

- preview 렌더링
- 문서 revision 수신과 적용 결과 보고
- 제한된 bridge message 처리

iframe에 ToolRegistry나 모델 API 키를 넣지 않는다. 현재 showcase는 browser
workspace를 위한 `editor.getStatus`, `editor.listFiles`, `editor.openFile`, `editor.saveFile`,
`editor.saveAll`과 함께
`editor.getDocument`, `editor.setDocument`, `editor.setScenario`,
`editor.resetDocument`, `editor.getPreviewStatus`를 노출한다. `editor.getStatus`는
read-only 도구로 workspace/document revision을 구분해 반환하고 preview·persistence·
dirty path·local-folder 연결 상태를 포함한다. `editor.listFiles`는 active path,
workspace revision, storage mode, dirty paths, 파일 metadata를 반환한다.
`editor.openFile`은 text file을 선택하고 일치하는 preview revision이 렌더링될
때까지 기다리며 binary file은 거부한다. mutation handler는 부모
DocumentManager를 먼저 변경하고 iframe의 해당 revision acknowledgement를 받은
뒤 tool result를 반환한다. preview-aware editor mutation 결과는
`activePath`, `workspaceRevision`, `documentRevision`, acknowledgement된
`preview`를 함께 반환한다. 파일 저장 결과도 같은 두 revision context와
`dirtyPaths`를 반환해 두 clock을 tool-result 경계에서 명시한다. 임의
`runScript` 도구는 제공하지 않는다.

`editor.saveFile`은 별도의 destructive 경계다. 부모가 소유한 filesystem adapter를
통해 선택한 text file을 기록하며, 사용자가 열어 둔 writable folder가 있어야 한다.
쓰기 성공 이후에만 해당 경로의 filesystem-dirty 상태를 해제한다. Live Editor
handler는 blocking pipeline step으로 등록되므로 validation·filesystem·preview에서
throw된 오류가 성공한 no-op 호출이 아니라 실패한 `tools/call` 결과로 전달된다.
`editor.saveAll`은 같은 경계를 모든 dirty text path에 순서대로 적용한다. 뒤의
파일에서 실패해도 이미 기록된 파일은 clean으로 유지하고 남은 path는 dirty로
남겨 재시도할 수 있다.

standalone editor도 같은 경계를 작은 injected bridge로 구현한다. sandbox는
문서 revision을 포함한 `context-action.preview.ready` 또는
`context-action.preview.error` message를 부모로 보낸다. 부모는 현재 iframe
window에서 온 message만 허용하고 오래된 revision은 무시하며, visual mutation
tool은 일치하는 acknowledgement를 받은 뒤에만 성공한 tool result를 반환한다.
해당 revision에서 runtime error나 unhandled rejection이 한 번 발생하면
bridge는 ready message를 억제하므로, 이후 `DOMContentLoaded` event가 오류 난
문서를 synchronized 상태로 덮어쓸 수 없다.

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
| `editor.getStatus` | allow | workspace/document revision·preview·persistence·folder 연결 상태 조회 |
| `editor.listFiles` | allow | workspace 파일·active path·storage mode·dirty paths 조회 |
| `editor.openFile` | local demo allow | text file을 선택하고 일치하는 preview revision 대기 |
| `editor.saveFile` | approval required | 사용자가 연 local folder에 text file 저장 |
| `editor.saveAll` | approval required | 사용자가 연 local folder에 모든 dirty text file 저장 |
| `editor.getDocument` | allow | 현재 문서와 revision 조회 |
| `editor.getPreviewStatus` | allow | 최신 iframe acknowledgement 조회 |
| `editor.setDocument` | local demo allow | controlled source 교체, 실행하지 않음 |
| `editor.applyPatch` | local demo allow | 제한된 literal text patch 적용 후 해당 preview revision 대기 |
| `editor.setScenario` | local demo allow | 안전한 runner 시나리오 변경 |
| `editor.resetDocument` | local demo allow | 선택한 예제의 source로 초기화 |

## Standalone Web Studio workspace catalog

| 도구 | 정책 | 목적 |
| --- | --- | --- |
| `workspace.getStatus` | allow | revision·persistence·preview·dirty path·folder 연결 상태 조회 |
| `workspace.listFiles` | allow | 파일과 파일별 dirty 상태 조회 |
| `workspace.readFile` | allow | 현재 revision과 함께 text file 하나 읽기 |
| `workspace.downloadFile` | approval required | browser에서 text file 또는 Blob asset 하나 다운로드 |
| `workspace.openFile` | allow | editor에서 workspace file을 선택하고 active path 저장 |
| `workspace.createFile` | local demo allow | 정규화된 text file 생성 |
| `workspace.renameFile` | local demo allow | source와 preview 계약을 유지하면서 파일 이름 변경 |
| `workspace.writeFile` | local demo allow | text file 하나 교체 후 preview 갱신 |
| `workspace.applyPatch` | local demo allow | 제한된 literal text replacement 적용 |
| `workspace.undo`, `workspace.redo` | local demo allow | revision guard와 함께 workspace edit history 이동 |
| `workspace.deleteFile` | approval required | 파일 삭제 및 pending deletion 보존 |
| `workspace.revertFile` | approval required | 저장된 browser checkpoint로 파일 복원 |
| `workspace.saveAll` | approval required | 연결된 folder에 dirty file과 pending deletion 기록 |
| `workspace.saveCheckpoint` | local demo allow | local folder에는 쓰지 않고 browser-only checkpoint를 clean으로 표시 |
| `workspace.reloadFolder` | approval required | 연결된 folder를 다시 읽어 browser workspace 교체 |
| `workspace.disconnectFolder` | approval required | browser workspace는 유지한 채 local-folder sync 해제 |
| `workspace.reset` | approval required | folder가 연결되지 않은 경우 browser-only demo workspace를 네 파일 seed로 복구 |
| `preview.setTheme` | approval required | 제어된 preview accent theme 변경 |
| `preview.addFeature` | approval required | preview 계약을 통해 feature card 추가 |
| `preview.updateHero` | approval required | 제어된 preview hero copy 변경 |
| `preview.getStatus` | allow | 최신 sandbox preview acknowledgement 조회 |
| `preview.refresh` | model/prompt 호출은 approval, palette 호출은 local direct allow | sandbox iframe을 다시 마운트하고 현재 revision acknowledgement 대기 |

`workspace.downloadFile`은 browser workspace 경계를 넘어 사용자에게 보이는
local download를 만들기 때문에 MCP `openWorldHint`도 표시한다. 실제 실행을
허용하는 최종 경계는 여전히 approval policy다.

standalone surface의 status-aware 호출 순서는 다음과 같다.

```text
tools/list → workspace.getStatus → workspace.listFiles →
workspace.openFile (tab 선택이 필요한 경우) → workspace.readFile →
workspace.reset, workspace mutation, workspace.undo/redo 또는 preview.refresh → iframe acknowledgement → workspace.saveAll/saveCheckpoint (요청된 경우)
```

사용자가 이미 연결된 folder의 새 내용을 명시적으로 요청하면
`workspace.getStatus → workspace.reloadFolder → workspace.listFiles` branch를
사용한다. reload는 browser workspace를 교체하므로 destructive approval policy
뒤에 둔다.

browser workspace의 표준 호출 순서는 다음과 같다.

```text
tools/list → editor.getStatus → editor.listFiles → editor.openFile → editor.setDocument →
iframe acknowledgement → editor.saveFile/editor.saveAll (filesystem 저장이 필요한 경우)
```

model은 먼저 사용 가능한 도구를 확인하고 workspace 파일을 조회한 뒤 경로를
선택한다. 그 다음 text file을 열고 제한된 source mutation을 실행한다.
preview-aware editor 결과는 active path, 두 revision clock, preview
acknowledgement를 함께 반환하므로 부모 workspace와 iframe이 동기화됐는지
검증할 수 있다.

standalone workspace mutation은 단일 clock 계약을 사용한다. preview-aware
결과는 `activePath`, `revision`, `preview`를 반환하고,
`workspace.saveAll`은 `activePath`, 결과 `revision`, 저장·삭제된 path 목록을
반환한다. browser-only `workspace.saveCheckpoint`는 iframe refresh를 주장하지
않고 같은 path 목록과 storage mode·checkpoint 상태를 반환한다.

realtime web-coding route는 대응하는 workspace 계약도 노출한다.

| 도구 | 기본 정책 | 목적 |
| --- | --- | --- |
| `web.getWorkspace` | allow | 파일·active entry point·workspace revision 조회 |
| `web.readFile` | allow | text file과 현재 workspace revision 조회 |
| `web.applyPatch` | local demo allow | 선택적 revision guard와 함께 제한된 literal patch 적용 |
| `web.writeFile` | local demo allow | 선택적 revision guard와 함께 text file 교체 |
| `web.setTheme`, `web.addFeature`, `web.updateHero` | local demo allow | 동일 revision guard를 사용하는 제어된 visual mutation |

example과 standalone workspace가 모두 제한된 patch 계약을 노출한다. example은
현재 부모 소유 document에 patch를 적용하고 standalone workspace는 지정된 file에
적용한다. production 연결에서는 파괴적 변경이나 광범위한 mutation을 허용하기
전에 승인 가능한 `toolPolicy`를 사용해야 한다.

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
- 선택한 folder에 지원 파일이 하나도 없으면 import를 실패시키되 현재 Dexie
  workspace와 기존에 연결된 directory handle을 교체하지 않는다.
- HTML, CSS, JavaScript, JSON, Markdown, TypeScript, text 파일은 file 수·개별
  크기·전체 크기 제한과 함께 가져온다. 지원되는 image·font·WASM 파일은
  Blob 기반 preview-only asset으로 보존하고, 지원하지 않는 파일은 chat에
  건너뛴 항목으로 표시한다.
- NUL byte나 parent traversal segment가 포함된 import path는 다른 workspace
  path로 조용히 바꾸지 않고 invalid entry로 거부한다.
- 다른 folder를 열 때 browser-side edit가 dirty이면 명시적으로 확인하며, 취소하면
  현재 workspace를 유지한다. Reload에도 같은 빈 folder guard를 적용해 지원 파일이
  없는 연결 directory가 workspace를 교체하지 못하게 한다.
- file 수나 전체 byte limit에 도달하면 directory traversal을 중단하며, import
  result에는 해당 limit을 나타내는 skipped summary 하나를 남긴다.
- filesystem handle은 parent adapter 경계 뒤에 두고 tool payload나 iframe message에
  전달하지 않는다. 지원되는 브라우저에서는 reload 후 재연결을 위해 workspace
  metadata에만 handle을 저장한다.
- Explorer의 `Reload` action은 canonical `workspace.reloadFolder` tool을 통해 같은
  adapter로 연결된 directory를 다시 읽어 Dexie workspace를 교체한다. browser-side
  edit가 dirty이면 확인을 요구하므로 외부 refresh가 변경을 조용히 버리지 않으며,
  model call은 destructive approval policy 뒤에 둔다.
- text 편집은 Dexie에 즉시 저장한다. read/write directory handle이 있으면
  `Save to folder`가 dirty text 파일을 선택한 운영체제 directory에 다시 쓰며,
  upload-only import는 browser workspace에만 저장한다. 브라우저가 directory
  handle을 structured-clone할 수 있으면 handle도 workspace metadata와 함께
  저장해 다음 load에서 복원하며, 실제 write permission은 저장 경계에서 다시
  확인한다.
- standalone registry는 `workspace.openFile`, `workspace.downloadFile`, `workspace.createFile`, `workspace.renameFile`,
  `workspace.writeFile`, `workspace.applyPatch`, `workspace.revertFile`,
  `workspace.undo`, `workspace.redo`, `workspace.deleteFile`, `workspace.saveAll`, `workspace.saveCheckpoint`, `workspace.reloadFolder`, `workspace.reset`을 분리한다. 새 text 파일은 경로를 정규화하고
  active editor tab으로 열며 Blob 기반 record로 저장한다. 삭제는 browser
  local record에서 즉시 반영하고 deleted-path checkpoint를 보존해 다음
  `Save to folder`에서 실제 파일도 삭제하며, undo/redo와 active preview
  entry가 유효하도록 유지한다. pending deletion path도 Dexie metadata에
  저장하므로 reload 후에도 운영체제 폴더 삭제 의도를 잃지 않는다.
  filesystem delete 경계는 멱등적이다. 외부 변경으로 대상 파일이나 부모
  directory가 이미 사라진 경우에도 `NotFoundError`로 save를 실패시키지 않고
  현재 browser workspace와 실제 folder 상태를 수렴시킨다.
- `workspace.renameFile`은 source와 Blob asset을 유지한 채 canonical path를
  바꾸고 active tab을 갱신한다. 저장된 source path는 `workspace.saveAll`이
  연결된 folder에 rename을 반영할 때까지 pending deletion과 새 dirty path로
  관리하며, browser-only로 만든 파일은 잘못된 pending deletion을 만들지 않는다.
  지원되는 HTML/CSS/JS와 asset 확장자는 type-safe하게 유지하고 마지막 HTML
  preview entry를 없애는 이름 변경은 거부한다.
- `workspace.revertFile`은 active file을 마지막 saved browser workspace
  checkpoint로 복원한다. 저장되지 않은 새 파일이면 해당 파일을 제거하며,
  model 호출은 destructive policy·approval 경계를 통과해야 한다.
- `workspace.undo`와 `workspace.redo`는 editor 버튼과 local/model call이
  공유하는 edit-history canonical boundary다. 현재 `expectedRevision`을
  확인한 뒤 browser workspace checkpoint를 이동하고, 결과 projection을
  저장하며, 일치하는 iframe acknowledgement를 기다린다.
- `preview.refresh`는 Refresh 버튼, tool palette, 명시적인 agent 요청이
  공유하는 preview-remount canonical boundary다. workspace revision은
  유지한 채 iframe을 초기화하고 같은 revision이 다시 acknowledged될 때까지
  기다린다.
- 에디터의 active-file Delete action도 palette와 model loop가 사용하는
  동일한 `workspace.deleteFile` registry contract를 호출하므로 별도 mutation
  경로를 만들지 않는다.
- `workspace.applyPatch`는 text file에 literal search/replace를 수행한다. `first`와
  `all` occurrence mode를 지원하고, match 실패와 결과 source 크기 초과를 거부한 뒤
  다른 workspace mutation과 같은 preview revision acknowledgement를 기다린다.
- `workspace.saveAll`은 standalone demo의 명시적인 filesystem 경계다. Explorer의
  `Save to folder` 버튼과 동일한 parent-owned adapter로 모든 dirty file과 pending
  deletion을 기록하고, 모든 작업이 성공한 뒤에만 IndexedDB checkpoint를 clean으로
  만든다. 저장 중 새 편집이 발생하면 revision guard가 stale checkpoint 처리를
  막아 새 변경을 dirty 상태로 유지한다. writable folder가 없으면 실패한 tool
  result를 반환한다.
- `workspace.saveCheckpoint`는 browser-only save 경계다. 운영체제 folder에는
  쓰지 않고 현재 IndexedDB checkpoint만 clean으로 표시하며, writable folder가
  연결된 동안에는 실패하므로 두 save 의미가 조용히 섞이지 않는다.
- `workspace.reloadFolder`는 외부 refresh의 명시적인 경계다. parent adapter로 연결된
  folder를 다시 읽고 Dexie browser workspace를 교체한 뒤 새 preview revision을
  기다리며 skipped file과 local-folder 상태를 반환한다. 연결된 writable folder가
  없으면 실패한다.
- `workspace.reset`은 반복 가능한 데모를 위한 복구 경계다. browser-only
  workspace에서만 사용할 수 있고 Dexie projection을 네 파일 seed로 교체한 뒤
  일치하는 preview acknowledgement를 기다린다. writable folder가 연결된 동안에는
  filesystem save에 seed가 실수로 반영될 수 있으므로 실행을 거부한다.
- writable folder가 연결된 경우 Explorer의 `Save to folder` 버튼과 `⌘/Ctrl+S`
  단축키도 같은 `workspace.saveAll` registry 경로를 호출한다. 따라서 UI save,
  model call, approval policy, trace, structured result가 같은 계약을 공유한다.
  browser-only `Save`는 browser checkpoint만 전진시킨다.
- `workspace.getStatus`는 standalone catalog의 read-only 상태 경계다. 현재
  revision·persistence mode·preview 상태·dirty/deleted path·undo/redo 가능
  여부와 함께 명시적인 filesystem capability(`permission`,
  `saveAllAvailable`, `reloadAvailable`)를 반환하므로, 모델이 mutation 전에
  local-folder permission과 edit-history 경계를 확인할 수 있다.
- `workspace.readFile`은 현재 workspace revision을 반환한다. 호출자는 그 값을
  workspace mutation(`reset`, `createFile`, `renameFile`, `deleteFile`, `writeFile`, `applyPatch`,
  `revertFile`, `saveCheckpoint`)의 `expectedRevision`으로 전달할 수 있으며, 오래된 revision은 source를
  변경하기 전에 거부되어 다시 읽기를 요구한다.
- 모든 workspace file lookup은 tool boundary에서 slash 방향과 불필요한 `.` segment를
  canonical path로 정규화하며, parent traversal과 빈 path는 거부한다.
- local demo agent도 교체 요청 안의 두 quoted string을 인식해
  `workspace.applyPatch`로 전달하므로 external model key 없이도 exact-text mutation
  경로를 시연할 수 있다. 승인 전에 planned workspace revision을 캡처하므로 승인
  대기 중 source가 바뀌면 덮어쓰지 않고 거부한다. standalone chat은 이 revision
  conflict만 `Re-read & retry`로 표시하며, 현재 revision을 다시 inspection한 뒤
  approval을 다시 요청한다.
- `Save` 버튼과 `⌘/Ctrl+S` 단축키는 동일한 save 경계를 사용하며, 단축키는
  settings·New file·Rename file modal 입력 중에는 동작하지 않는다.
- OpenRouter, New file, Rename file dialog는 keyboard-modal로 동작한다. `Escape`는 현재
  dialog를 닫고, `Tab`은 dialog 내부 control 사이에서 순환하며, 열린 동안
  body scroll을 잠근다. 닫히면 열기 trigger로 focus를 복귀하고 backdrop 클릭도
  dialog를 닫는다.
- source editor는 HTML, CSS, JavaScript, TypeScript, JSON, Markdown 파일의
  syntax highlighting과 편집을 하나의 overlay surface에서 유지한다.
  입력 중에는 반응성 있는 local draft를 유지하고 idle·blur·tool/save 경계에서
  그 draft를 `workspace.writeFile`로 flush하므로 source mutation과 preview 갱신도
  canonical registry 경로를 사용한다.
  `⌘/Ctrl+F`로 파일 검색을 열고 `Enter`/`Shift+Enter`로
  대소문자를 구분하지 않는 match를 이동하며, `⌘/Ctrl+G`로도 다음·이전
  match를 이동할 수 있다. `Esc`는 source로 focus를 돌려주고, editor header는
  현재 line·column과 전체 line 수를 표시한다.
- `⌘/Ctrl+Shift+F`는 text file 전체를 검색하는 workspace-wide search를 연다.
  결과는 최대 80개 line으로 제한하고 `path:line`과 짧은 preview를 표시하며,
  결과를 선택하면 source를 변경하지 않고 해당 file을 active tab으로 연다.
- agent/tool chain이 실행 중일 때는 source 직접 편집을 잠시 잠근다. 승인된
  expected revision을 그동안 authoritative하게 유지해, 수동 편집과 승인된
  mutation이 서로 경합하지 않게 한다.
- chat history는 높이가 제한된 scroll region을 사용하고 최신 항목으로
  자동 이동한다. 따라서 approval·error·retry·tool result 피드백을 계속
  확인하면서 editor 영역이 끝없이 커지지 않는다.
- status bar는 browser에 보존된 변경과 연결된 local folder에 아직 기록하지
  않은 변경을 구분한다. debounce window 안에서 아직 Dexie write가 끝나지 않은
  editor draft도 guard한다. browser-only draft가 저장된 뒤에는 불필요한
  filesystem 경고를 표시하지 않으며, linked-folder 변경은 명시적인
  `Save to folder` 경계를 조용히 건너뛰지 않도록 `beforeunload` guard를 유지한다.
- editor `Download` action은 `workspace.downloadFile`을 호출하므로 text source와
  Blob asset이 같은 trace·approval·structured result contract를 공유한다. 따라서
  directory-upload fallback에서도 편집 결과를 다시 로컬 파일로 가져갈 수 있다.
- Explorer의 New file dialog도 `workspace.createFile`을 호출한다. validation
  실패는 tool result 경로에 남기고 dialog를 유지하며, 생성 성공 시 새 tab을
  선택한다. 실패 메시지는 dialog 안에도 표시하고, Explorer와 tab에는 파일별
  unsaved 표시를 보여준다.
- Explorer의 Rename action도 `workspace.renameFile`을 호출한다. source는
  유지하고 duplicate·호환되지 않는 path는 tool result로 거부하며, 경로를
  수정할 수 있도록 dialog를 유지한다.
- Explorer row, editor tab, workspace search 결과의 파일 선택도
  `workspace.openFile`을 호출한다. 따라서 active-path persistence와 표시되는
  `tools/call` trace가 별도의 직접 state mutation 경로에 의존하지 않는다.
- Explorer에서 연결된 folder를 명시적으로 disconnect할 수 있다. 이 동작은
  browser workspace를 버리지 않고 persisted directory handle만 제거하므로,
  stale하거나 잘못 연결된 folder를 browser-only mode로 전환한 뒤 다른 folder를
  열 수 있다.
- Explorer는 정규화된 파일 경로를 기준으로 정렬된 nested tree를 만든다.
  directory row는 접거나 펼칠 수 있지만 workspace 데이터는 바뀌지 않으며,
  파일 선택은 전체 `activePath`를 그대로 유지한다.
- 실행 가능한 workspace에서는 `index.html`을 우선 진입점으로 사용하고, 없으면
  첫 `.html` 파일을 사용한다. 상대 경로의 로컬 `.css`와 `.js`는 sandbox iframe
  안에 주입해 실행한다.
- 가져온 workspace에 HTML entry가 없으면 빈 iframe 대신 `index.html` 또는 다른
  `.html` 파일이 필요하다는 진단 카드를 preview에 표시한다.
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
