# Tool Calling Editor 아키텍처

> **개발 트랙 상태:** ToolContext와 Durable Operations는
> `@context-action/core@1.1.0` / `@context-action/react@3.0.0` 상태 관리
> 릴리즈에 포함되지 않습니다. 이 protocol·persistence·provider recovery 표면이
> 별도 릴리즈 결정을 받을 때까지 React 3 패키지는
> `@context-action/react/tools`를 의도적으로 제외합니다.

브라우저 기반 실시간 editor는 iframe이 도구 실행기를 소유하지 않고, 부모 문서가 표준 Tool Registry·정책·호출 추적을 소유하는 구조로 구성한다.

이 데모에서 재사용할 Context-Action 규칙과 use-case recipe는
[Tool Calling Web Studio 컨벤션](/ko/context-layered/usecase-tool-calling-web-studio)에서 확인할 수 있다.

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

`ToolCallResult.content`는 text와 JSON content block을 모두 허용한다.
`structuredContent`가 있으면 provider가 이를 사용할 수 있지만, structured
output이 없을 때는 content block을 유지해야 한다. canonical runtime guard도
model에 결과를 전달하기 전에 두 형식을 모두 검증한다. 사람이 읽는
provider/UI 텍스트를 만들 때는 core의 `stringifyToolContent` helper를 사용해
JSON block이 text-only mapper에서 조용히 누락되지 않도록 한다.

Orca는 여러 coding agent를 worktree, 터미널, embedded browser와 연결하는 ADE다. 이번 구현에서는 전체 데스크톱 구조가 아니라 다음 경계만 참고한다.

- Design Mode의 선택 결과 수집: 선택자, HTML/CSS 요약, 화면 상태를 입력 context로 전달
- browser bridge: 브라우저 화면과 호스트 상태를 분리
- agent lifecycle: 시작·대기·승인·완료·실패 상태를 이벤트로 관찰
- CLI command bridge: 화면 동작을 임의 script가 아닌 명시적 command로 제한

참고 clone: `architecture-references/orca` (MIT, 조사 기준 commit `9a23792`)

## 실시간 웹 코딩 showcase

배포되는 showcase 경로는 `/web-coding/`이다. 첫 slice는 범위를
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
fallback한다. `Open folder`는 package가 소유하는 browser filesystem adapter를 사용하며 File
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
hydration 중이거나 이후 workspace 쓰기에서 IndexedDB가 실패하면 현재 메모리
파일은 유지하되, 제한된 오류 메시지를 `workspace.getStatus`와 상태바에 노출한다.
UI는 세션이 메모리 전용임을 표시하므로 브라우저 저장 실패가 영속 저장 성공처럼
보이지 않는다.
초기 hydration은 Dexie workspace를 먼저 읽은 뒤 persisted folder link를 복원한다.
짧은 복원 구간에는 editor와 tool control을 비활성화하며, handle 복원에 실패해도
browser workspace는 유지한다. header에는 folder link unavailable 상태를 명시해
사용자가 folder를 다시 열어 연결을 복구할 수 있다.
결정적 prompt planner와 revision-aware preflight는 React editor orchestration과
분리해 `demos/bolt-style-editor/src/local-agent-plan.ts`에 둔다. 따라서 local
fallback 계약을 독립적으로 검증할 수 있고, 재사용 가능한 workspace runtime은
`packages/live-code-editor`에 둔다.
preview browser chrome의 `Full screen`은 presentation-only 상태다. `Esc`로
editor layout으로 돌아와도 workspace state는 바뀌지 않는다. `Export`는 현재
draft snapshot을 기준으로 standalone HTML을 다운로드하며 CSS와 JavaScript를
inline하고 Blob asset은 data URL로 변환해 브라우저 session 밖에서도 결과를
이동할 수 있게 한다.
preview document compiler와 local asset/script rewriting은
`packages/live-code-editor/src/preview-document.ts`로 분리한다. Demo 경로는
호환성 re-export만 제공한다. `WorkspaceDocumentManager`가 state, history,
revision persistence orchestration을 소유하고 compiler는 iframe document
경계를 소유한다. Demo의 `BrowserWorkspace`는 seed file과 Dexie repository만
주입한다.
OpenRouter response/error transport 계약은
`demos/bolt-style-editor/src/openrouter-protocol.ts`로 분리한다. `openrouter.ts`는
provider tool loop를 소유하고 protocol 모듈은 status 분류, body decoding,
cancellation, structured tool-result serialization을 소유한다.
standalone provider payload는 `tools/list`에 사용한 동일한
`listAllTools(registry)` 결과를 core의 `toOpenAIToolDefinitions()` adapter로
변환해 만든다. 두 번째 registry export를 조회하지 않으므로 discovery에서
노출한 이름과 schema가 그대로 model 요청에 전달된다.
AI SDK 연동은 example이나 protocol이 아니라 `@context-action/ai-sdk`가
소유한다. 이 adapter는 `ToolManagementInterface`를 dynamic AI SDK ToolSet으로
바꾸고 `toolCallId`를 기본 replay key로 유지하며 ContextScope에서 나온 turn별
scope를 필수로 받는다. tool이 없는 turn은 전체 registry fallback 대신 `[]`를
사용한다. 같은 선택 이름을 `activeTools`로도 반환하므로 model에 전달되는
catalog가 canonical 실행 경계보다 넓어지지 않는다. ToolContext는 validation,
policy, provenance, durable operation의 최종 경계로 유지하며 AI SDK approval은
실행 전에만 동작하는 UI gate다.
example AI runner는 provider의 완전한 `responseMessages`도 반환하며,
ToolContext AI와 realtime web-coding showcase는 assistant tool-call와 tool-result를
다음 model turn에 추가한다. 화면에 표시하는 chat transcript는 별도의
presentation projection으로 유지한다.
registry provider 경계는
`demos/bolt-style-editor/src/bolt-style-tool-context.ts`에 유지한다. workspace와
preview mutation handler는 `src/tool-handlers.tsx`로 분리한다. React
orchestration은 focused hook으로 나눈다. `use-tool-execution`은 provider 중립
실행을, `use-workspace-folder-actions`는 folder 경계를,
`use-workspace-editor-actions`는 draft와 file mutation을,
`use-tool-catalog-model`은 canonical `tools/list`, definition과 catalog filter를,
`use-tool-catalog-actions`는 tool argument sample과 palette command를,
로컬 `src/tool-catalog-contract.ts`는 view/action boundary에서 사용할
framework의 `MCPToolDefinition`과 `ToolAnnotations` alias를 제공하므로 별도
catalog definition shape을 선언하지 않는다.
`use-workspace-keyboard-shortcuts`는 전역 명령을,
`use-studio-export-actions`는 copy/download export를 소유한다. 공통
`use-confirmation-request` hook은 Promise 기반 destructive confirmation
boundary를 소유한다. revision guard, text patch, escaping, cancellation 같은
browser 전용 runtime helper는
`src/tool-runtime-utils.ts`에 남기고, `src/views/` 아래 view는 workspace
mutation policy를 소유하지 않고 data와 callback만 받는다. 따라서 React editor
orchestration, tool 등록, workspace mutation 계약을 별도 public package를
성급하게 만들지 않고 독립적으로 검토할 수 있다.
example의 Live Code Editor도 같은 경계를 따른다. `actions/` hook이 direct
registry call, provider 설정, trace export, provider-facing agent loop를
소유하고, `hooks/useLiveEditorObservables.ts`가 trace subscription을,
`hooks/useLiveEditorWorkspaceObservables.ts`가 workspace/document subscription과
filesystem capability 상태를 맡는다. `actions/useLiveEditorWorkspaceActions.ts`는 IndexedDB hydrate, editor
persistence, folder import/save, 파일 선택, reset command를 소유한다.
`actions/useLiveEditorDocumentActions.ts`는 document source/scenario mutation과
preview acknowledgement를 소유한다. `LiveEditorAIToolbar.tsx`는 catalog, result,
trace, callback을 표현한다.
standalone Vite config는 workspace의 `core`, `react`, `mutative` package를 source에서
resolve하므로, 페이지를 띄우기 전에 오래된 `packages/*/dist` 중간 산출물을 별도로
준비하지 않아도 dev server가 시작된다.
production build는 `scripts/verify-web-coding-build.mjs`로 build 직후와 GitHub Pages의
`/web-coding/` directory로 복사한 직후 두 번 검증한다. 이 검사는 base path, 컴파일된
entry asset, compiled JavaScript transitive chunk reference, CSS asset reference,
build directory 밖으로 벗어나지 않는 파일 존재 여부를 확인한다.
standalone verification command는 build 결과를 Vite preview로 제공한 뒤
`/context-action/web-coding/`을 browser에서 열어 base path, lazy editor chunk,
tool catalog, preview가 production build 후 함께 동작하는지도 확인한다.

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
browser가 `localStorage`를 차단하거나 기록할 수 없는 경우에도 두 provider
surface는 현재 tab에서 session-only in-memory fallback을 사용한다. 다만 다른
page와의 key 재사용은 browser storage가 가능해야 한다.
설정 창에서는 OpenRouter의 `tools` 지원 model catalog를 조회하고 무료 model만
보도록 필터링할 수 있다. data policy도 명시적으로 선택한다. `allow`는 기본
routing을 유지하고, `deny`는 요청에 `provider.data_collection: "deny"`를 보내
data를 수집하거나 학습에 사용할 수 있는 provider를 제외한다. `zdr`은
`provider.zdr: true`와 함께 zero-data-retention catalog를 요청한다. catalog
adapter는 `demos/bolt-style-editor/src/openrouter-models.ts`에 분리해
chat/tool 실행 loop와 model discovery를 구분한다.
agent 실행 중에는 `Cancel`이 provider request, registry 실행, preview
acknowledgement 대기를 함께 abort한다. 취소 결과는 tool 성공으로 오인되지 않도록
사용자에게 assistant message로 표시한다.
결정적인 local fallback도 mutation 전에 같은 inspection 경계를 따른다. 먼저
`workspace.getStatus`를 호출하고, file target을 알고 있으면
`workspace.listFiles`를 호출한다. text mutation이면 `workspace.readFile`도 호출한
뒤 mutation을 실행한다.
mutation tool 결과는 preview acknowledgement 이후 Dexie write queue가 끝날
때까지 기다린다. 따라서 rename, source write, undo, redo 직후 browser를
새로고침해도 오래된 workspace 상태가 복원되는 race를 피할 수 있다.
다운로드 요청에 path가 없으면 현재 `activePath`를 `workspace.downloadFile`의
대상으로 사용하며, active workspace file 자체가 없을 때만 path를 다시 요청한다.
example live editor도 동일한 경계를 사용한다. 브라우저 OpenRouter request가 실행 중이면
`Run editor toolchain`이 `Cancel editor toolchain`으로 바뀌고, provider-neutral
runner contract를 통해 abort signal을 전달한다. realtime web-coding showcase도
local agent·model request·palette tool 경로에 같은 signal을 사용하며, 두 route를
이동할 때 진행 중인 실행을 함께 abort한다.
example workspace reset도 standalone studio와 같은 명시적 approval 원칙을 따른다.
접근 가능한 in-app dialog가 destructive intent를 먼저 resolve한 뒤에만
IndexedDB showcase 파일을 교체한다.

standalone chat은 실패와 취소를 typed UI 상태로 보존한다. 재시도 가능한 provider 또는
local tool 오류와 재시도 가능한 palette 샘플 실패에는 원래 prompt 또는 tool arguments를
재사용하는 `Retry` 동작을 표시한다. 재시도할 수 없는 execution·policy 오류에는 오해를
만드는 Retry를 표시하지 않으며, 취소는 failed가 아닌 cancelled 상태로 구분한다.
composer에는 visual 변경·workspace status·preview status/refresh·undo recovery·
파일 생성·명시적인 folder save와 reload 경계·folder disconnect를 위한 prompt
recipe도 제공한다. 각 recipe는
자유 입력과 동일한 local-agent planning 및 approval 경로로 들어간다.
standalone package에서는 `src/tool-command-catalog.ts`가 prompt·참여 tool 이름·
approval/preview 예상 chain을 typed catalog로 소유하고, chat view는 두 번째
문자열 목록을 직접 가지지 않고 이 catalog를 data로 주입받는다. Save recipe도
연결된 folder에서는 `workspace.saveAll`과 approval을 사용하고, browser-only
workspace에서는 `workspace.saveCheckpoint`로 분기되는 두 결과를 명시한다.
example catalog의 `Studio에서 실행`도 encoded prompt를 standalone page로 전달하지만,
standalone shell은 이를 composer 입력으로만 채우고 browser history에서 제거한다.
따라서 deep link가 tool을 자동 실행하지 않는다.
example의 ToolContext AI 데모는 provider 오류를 alert로 채팅 영역에 유지하고,
실패한 prompt를 composer에 복원하며, 저장된 key와 model control을 그대로
사용할 수 있게 한다. 따라서 설정을 수정한 뒤 같은 요청을 다시 제출할 수 있다.
standalone studio에서 설정된 key로 configuration·authentication·access 또는
invalid-response 오류가 발생하면 공유 key를 지우지 않고 같은 prompt에 대해
`Use local agent & retry`를 제공한다. 이 동작은 해당 요청만 provider에서
우회하는 one-request fallback으로, OpenRouter에 두 번째 요청을 보내지 않고
canonical local-agent tool boundary를 실행한다. 실행 중 chat badge에는 현재
사용 중인 local mode가 표시된다.

standalone OpenRouter bridge는 response body를 먼저 text로 읽은 뒤 JSON을 해석하므로,
endpoint 설정이 잘못되어도 브라우저의 `Response.json()` 내부 예외가 chat에 그대로
노출되지 않는다. 401/403은 재시도할 수 없는 인증·접근 오류로, 429와 5xx는 재시도 가능한
provider 오류로, network failure는 재시도 가능한 오류로 분류한다. 각 provider 실패는
사용자에게 `OPENROUTER_*` 명시 code와 함께 표시한다. model이
`function.arguments`에 잘못된 JSON이나 object가 아닌 JSON을 반환하면 registry
실행 전에 거부하고 재시도 가능한 `OPENROUTER_INVALID_TOOL_CALL`로 표시한다.
따라서 payload를 조용히 `{}`로 바꿔 인자가 없는 tool이 실행되는 경로가 없다.
bridge는 transient 429/5xx 응답과 network failure를 bounded abort 가능한 backoff와
함께 최대 두 번 자동 재시도한다. 인증·접근 오류, 성공 응답의 malformed JSON,
tool 실행 오류는 즉시 노출해 사용자가 명시적으로 복구하도록 한다. backoff 중에는
현재 retry 시도를 실행 상태에 표시한다. 각 provider request에도 bounded timeout을
적용하며, timeout 실패는 `OPENROUTER_TIMEOUT` code와 제한 retry 경로를 유지한다.
따라서 사용자가 직접 취소한 상태와 혼동되지 않는다. 성공한 response도 model loop에
진입하기 전에 검사하며, tool call은 function type, 비어 있지 않고 서로 다른 ID,
function name, string JSON arguments를 모두 가져야 한다. ID 누락·중복이나 malformed
function record는 모호한 correlation으로 `tools/call`에 도달하지 않고 재시도하지 않는
`OPENROUTER_INVALID_RESPONSE`로 정규화한다.
provider loop는 한 run에서 최대 5개 turn, 총 12개 tool call로 제한한다. 한
응답의 호출 수가 남은 총량을 초과하면 그 응답의 tool을 하나도 실행하기
전에 재시도하지 않는 `OPENROUTER_TOOL_CALL_LIMIT`으로 거부한다. 따라서
malformed하거나 과도하게 적극적인 model이 workspace mutation을 무제한으로
연속 실행할 수 없다. response decoder도 구조가 비슷한 provider message를
그대로 신뢰하지 않고 assistant role과 string 또는 null content를 확인한다.
이 경계에서 tool result도 JSON 문자열로 직렬화한다. handler가 실수로
JSON으로 표현할 수 없는 값을 반환하면 raw `JSON.stringify` 예외로 model
loop를 중단하지 않고 다음 provider message 안에
`TOOL_RESULT_SERIALIZATION_FAILED` 구조화 오류를 전달한다. bridge는 먼저
`isToolCallResult()`를 실행하며 result shape이 잘못되면 serialization 전에
`TOOL_RESULT_VALIDATION_FAILED`를 반환한다.

## 표준 계약

이 절은 tool-call timeout, cancellation, retry, idempotency, durable operation
동작의 의미론적 기준 문서다. 패키지 README는 API quick start와 이 문서 링크만
유지하고, changelog는 계약을 반복하지 않고 릴리스 변경점만 기록한다.

`@context-action/tool-protocol`은 provider와 무관한 다음 정보를 유지한다.

- `ToolCallId`: 모델 호출과 결과를 연결하는 ID
- `ToolCallContext`: transport `source`, execution `mode`, `sessionId`, `revision`
- `isToolListRequest()`와 `isToolCallRequest()`는 untrusted JSON이 registry
  boundary에 들어오기 전에 request shape을 검증한다.
  선택적 list request는 `undefined`만 생략으로 허용하고 `null`은 거부한다.
- `isToolListResult()`는 `listAllTools()`가 provider adapter에 definition을
  추가하기 전에 각 discovery page의 shape을 검증한다.
- `isToolCallResult()`는 adapter가 tool result를 전달하기 전에 text content,
  correlation ID, structured error metadata를 검증한다.
- `ToolCallError`: 안정적인 `code`, `message`, `retryable`, `details`
- `ToolCallEvent`: `started`, `completed`, `failed`
- 각 `ToolCallEvent`는 canonical `tools/call` request를 함께 전달하므로 audit
  observer가 arguments와 최종 result를 연결할 수 있다.
- action에 선택한 `outputSchema`가 있으면 structured handler result를 반환 전에
  검증하며, 실패 시 `TOOL_OUTPUT_VALIDATION_FAILED` 결과를 반환한다.
  `InferActionResultMap<typeof schema>`는 source-track result handler가 사용할
  같은 정적 result type도 도출한다. `InferActionInputMap<typeof schema>`는
  caller의 unparsed shape을 도출하고 handler는 Zod default·transform이 적용된
  parsed payload type을 유지한다.

`@context-action/tool-protocol`은 표준 managed-call code를 재사용할 수 있도록
`TOOL_CALL_ERROR_CODES`와 `ToolCallErrorCode`를 export한다. handler가 workspace나
제품 도메인의 구체적인 실패를 보고해야 하는 경우에는 custom code도 추가할 수 있다.

대규모 catalog는 `createToolContext`의 `toolListPageSize`로 discovery page 크기를
지정할 수 있다. 이때 `toToolListRequest({ cursor })`로 만든 request를
`listTools()`에 전달하면 canonical discovery가 opaque
`nextCursor`를 반환하며, 인자가 없는 `listTools()`와 provider batch export는 전체
catalog를 유지한다. 모든 page가 필요한 provider adapter는 공통
`listAllTools()` helper로 `nextCursor`를 순회합니다. 반복 cursor를 거부하고
기본 1,000페이지 안전 상한도 적용합니다. manager의 범위를 호출자가 별도로
보장하는 경우에만 `listAllTools(manager, { maxPages: Infinity })`로 상한을
해제할 수 있습니다.

standalone workspace, realtime web-coding, Live Code Editor catalog도 같은 output
계약을 사용한다. 파일 조회·변경, preview acknowledgement, save 결과까지 모델이
보낼 입력과 다음 단계가 안전하게 소비할 결과를 함께 정의한다.
example app에서는 `live-tool-result-contract.ts`가 preview acknowledgement
검증과 결과 metadata 조립을 담당하는 좁은 공통 경계다. 두 revision clock을
사용하는 editor는 `createLiveEditorResultContext`를, 단일 revision을 사용하는
realtime workspace는 `createLiveWorkspaceMutationResult`를 사용한다. handler는
여전히 domain state와 side effect를 소유하고, helper는 tool surface 사이에서
output schema와 반환 metadata가 어긋나지 않게 하는 역할만 한다.
standalone demo도 `src/tool-result-contract.ts`에서 같은 분리를 적용한다.
handler가 현재 snapshot을 전달하면 pure helper가 state를 직접 읽지 않고
persistence·revision metadata를 반환한다.
example의 `tool-result-format.ts`도 local palette와 agent message에 사용할
단일 pure presentation adapter를 제공한다. 이 adapter는 tool을 실행하거나
registry contract를 다시 해석하지 않는다.
전용 `mcp-function-calling-catalog.ts`는 UI, standalone workspace, Live Code
Editor, realtime web-coding surface의 prompt recipe를 하나의
`MCPCommandReference` 형태로 관리하며, `example check`가 각 recipe를 실제
ToolContext schema와 대조한다.
standalone Web Studio의 mutation·preview 결과에는 현재 `storageMode`와
bounded `storageError`도 포함된다. 따라서 모델은 별도 status 호출 없이도
성공한 preview가 IndexedDB 기반인지 session-only memory 기반인지 구분할 수 있다.

React ToolContext는 여기에 실행 범위를 추가한다.

- `allowedToolNames`: discovery와 execution에 모두 적용되는 allowlist
- `toolPolicy`: `allow`, `ask`, `deny` 결정
- `onToolCall`: trace와 audit UI를 위한 lifecycle observer
- `durableDiagnosticPolicy`: failed/unknown durable projection에 사용할 선택적
  `ToolObservabilityPolicy` override. 생략하면 공통 default를 사용한다.
- `ToolCallEvent.provenance`: `context-action-tool-execution-provenance.v1`로
  검증되는 additive lifecycle record. started는 `pending`, 최종 이벤트는
  `completed`, `failed`, `cancelled`, `unknown` 중 하나이며 논리 owner, 선택적
  timeout/output budget, UTF-8 result byte 수, 경과 시간을 담는다. raw
  arguments·credential·result payload는 보존하지 않으며 두 번째 durable
  state machine이 아니다.

strict 모드에서는 `tools/call` arguments를 `toolPolicy` 실행 전에 검증한다.
잘못된 model 입력은 schema issue를 포함한 `TOOL_VALIDATION_FAILED` 결과로
돌아가며 approval prompt나 handler까지 도달하지 않는다. `warn`과 `silent` 모드는
기존의 permissive dispatch 동작을 유지한다.

`toolPolicy`에도 call의 `AbortSignal`을 전달하므로 provider request가 취소된 뒤
approval·policy 대기가 남지 않는다. 같은 signal은 registry handler와 preview
대기까지 전달되며, 어느 경계에서 취소되어도 재시도 가능한
`TOOL_CANCELLED` 표준 오류 결과를 반환한다.

호출자는 `ToolCallOptions.timeout`으로 policy와 handler 실행 전체에 적용되는
wall-clock 예산을 지정할 수 있다. 시간이 만료되면 공유 signal을 중단하고
`timeoutMs`와 `executionState: 'detached'`를 담은 재시도 가능한 `TOOL_TIMEOUT` 결과를 반환한다. 음수 또는
유한하지 않은 값은 `TOOL_INVALID_OPTIONS`로 거절한다. timeout은 호출자
취소와 의도적으로 분리되어 runner가 재시도와 사용자 피드백을 다르게 처리할 수
있다.

호출자는 `ToolCallOptions.maxOutputBytes`로 결과 크기 경계를 선택할 수 있다.
ToolContext는 직렬화된 `content`와 `structuredContent` 표면을 UTF-8 byte로
측정하고, 한도를 넘으면 durable operation을 completed로 기록하기 전에
재시도할 수 없는 `TOOL_OUTPUT_LIMIT_EXCEEDED`를 반환한다. 시도한 byte 수는
제한된 숫자형 provenance/error metadata로만 보존한다.

telemetry와 사용자 trace consumer는 event나 diagnostic을 보존하기 전에 공통
`createToolObservabilityPolicy()`와 `serializeToolObservabilityValue()`를 사용한다.
이 policy는 credential/source 계열 필드를 redaction하고 depth, collection, string,
직렬화 UTF-8 byte 상한을 적용하며 소유 store가 사용할 `retentionMs`와 `maxEntries`
metadata를 제공한다. durable operation record를 변경하거나 두 번째 state machine을
만드는 기능은 아니며, standalone Bolt-style trace는 화면 표시와 복사 JSON 모두에
이 policy를 사용한다.
source-only ToolContext 트랙이 ambiguous durable tool result를 저장할 때는
`sanitizeToolCallDiagnostic()`를 사용해 error code/retryability와 bounded redacted
details만 남긴다. canonical content와 structured payload는 생략하며, 성공한 terminal
result는 cross-process replay 계약을 보존하기 위해 lossless로 유지한다.
`sanitizeToolCallDiagnosticReason()`도 handler가 제공한 error text 대신 안정적인 code 기반
reason을 저장한다. known error terminal record에도 같은 projection을 적용하며, 성공한
terminal result만 replay를 위해 lossless로 보존한다.

mutation을 재시도할 때는 provider attempt마다 새 key를 만들지 말고 하나의
논리적 작업에 하나의 안정적인 `ToolCallOptions.idempotencyKey`를 사용해야
한다. ToolContext는 이 key와 인자 fingerprint가 같은 호출에 하나의 handler
실행 Promise를 공유하며, 다른 fingerprint로 같은 key를 재사용하면 재시도할 수
없는 `TOOL_IDEMPOTENCY_CONFLICT`를 반환한다. 따라서 첫 호출 timeout 뒤 재시도가
handler를 중복 실행하지 않는다.

timeout은 rollback이 아니라 호출자 경계의 분리다. handler가 abort signal을
무시하면 호출자에게 `TOOL_TIMEOUT`을 반환한 뒤 내부 Promise가 drain될 수 있다.
같은 key의 후속 호출도 성공을 추정해서는 안 되며, 내부 실행이 중단되었거나 결과가
불확실하면 `TOOL_EXECUTION_ABORTED`를 받을 수 있다. 이 경우 새 key로 무작정
재실행하지 말고 idempotency key로 도메인 작업 상태를 조회하거나 보정해야 한다.
기본 registry는 하나의 Provider 수명 안에서만 동작하는 bounded in-memory
guard다. reload·프로세스 재시작·다중 host까지 exactly-once를 보장하려면
atomic claim, fingerprint, pending/completed 상태, retention 정책을 가진
애플리케이션 소유 durable operation store를 mutation 경계에 둬야 한다.

저장소 없이 이 전이를 검증할 수 있도록
`packages/tool-durable-operations/__tests__/support/mock-durable-operation-store.ts`에
test-only shared-backend mock을 둔다. 각각의 store instance는 다른 탭 또는
프로세스이고 shared backend는 DB 역할을 하므로, durable claim·replay·unknown
전이를 Redis나 SQL 없이 테스트할 수 있다.

애플리케이션은 `createToolContext`의 `durableOperationStore`,
`durableOperationOwnerId`, `durableOperationLeaseMs` 옵션으로 이 경계를
주입한다. 다른 owner가 lease 동안 같은 작업을 요청하면 재시도 가능한
`TOOL_IDEMPOTENCY_PENDING`을 받고, lease가 만료되면 pending record를 reclaim할
수 있다. 보정이 필요한 record는 재시도 불가능한
`TOOL_IDEMPOTENCY_UNKNOWN`으로 반환된다. `registry.getOperationStatus(toolName,
key, context)`는 handler를 시작하지 않고 record만 조회한다. store 자체의 실패는
재시도 가능한 `TOOL_IDEMPOTENCY_STORE_FAILED`로 반환되며 guard를 우회한 mutation으로
fall through하지 않는다. terminal transition 저장이 실패하면 local promise entry도
지워지므로 이후 재시도는 memory에 남은 미기록 성공을 replay하지 않고 durable pending
record를 다시 확인한다.

domain query, compensation 또는 사용자 결정으로 결과가 확정된 뒤에는
`registry.reconcileOperation(toolName, idempotencyKey, resolution, context, expectedFence)`로
`unknown` record를 `completed` 또는 `failed`로 확정할 수 있다. `expectedFence`는 status
조회에서 함께 관찰한 불변 `incarnation`과 단조 증가 `revision`을 모두 담는다. 따라서
terminal record를 prune한 뒤 같은 key와 revision으로 새 record가 생성되는 ABA 상황에서도
과거 결정을 새 operation에 적용하지 않는다. 이 호출은 recovery actor와 fence 검증을
기록하지만 handler를 실행하거나 외부 side effect 발생 여부를 추측하지 않는다. 안전한
재시도가 새 논리적 operation을 만드는 경우에는 새 idempotency key를 사용해야 한다.

기존 positional type 호환을 위해 `expectedFence` 생략과 숫자 revision 입력은 남아 있지만
runtime에서는 항상 fail-closed한다. registry 내부의 공유 status cache로 caller별 관찰
provenance를 증명할 수 없기 때문이다. 새 코드는 status record의 `incarnation`과 `revision`을
다섯 번째 인자로 명시적으로 전달하거나 `recoverOperation()`을 사용해야 한다.

일반적인 status-first 흐름에는 `registry.recoverOperation(toolName,
idempotencyKey, resolver)`를 사용한다. 이 메서드는 record를 먼저 읽고 관찰한
상태가 `unknown`일 때만 `resolver`를 호출하며 pending·terminal record에서는
resolver를 실행하지 않고 그대로 반환한다. resolver가 domain query,
compensation, 사용자 확인을 소유하고, reconciliation은 첫 조회에서 관찰한 전체
fence를 사용해 stale decision과 prune/recreate ABA를 거부한다.

외부 side effect가 일부 적용됐을 수 있음을 handler가 알면
`TOOL_EXECUTION_UNKNOWN`을 반환할 수 있다. ToolContext는 durable record를
`unknown`으로 만들고 resolver가 사용할 수 있도록 정제된 tool result를 진단 정보로
보존한다. 보존 값은 크기 제한과 redaction을 적용해야 하며 mutation 재실행 권한으로
해석하면 안 된다.

전용 `@context-action/tool-durable-operations` package는
`createDurableOperationStore(backend, options)` reference adapter를 제공한다.
backend는 durable `read`, `incarnation`과 `revision`을 함께 검사하는
`compareAndSet`, 그리고 호환용 `list()` 또는 bounded `listPage()` 중 하나를
구현하면 되므로 Redis, SQL, IndexedDB 등 atomic store를 ToolContext의 persistence
로직과 분리해서 연결할 수 있다. retention window가 지난 terminal record는
`prune()`으로 정리한다.

서버 backend는 operation catalog가 커질 수 있으면 optional
`listPage({ cursor, limit })` keyset scan을 구현해야 한다. `prunePageSize`와
`maxPrunePages`로 한 번의 cleanup 범위를 제한하며, 이전 페이지의 terminal
record를 삭제해도 cursor가 유효해야 한다. `listPage()`가 없는 backend는 호환성을
위해 `list()` fallback을 사용하므로 작은 bounded store에서만 사용한다.

durable-operations package에는 `createRedisDurableOperationBackend()`도 포함된다. JSON
record를 Redis에 저장하고 lexicographic sorted-set index를 유지하며, 하나의 Lua
`EVAL`로 record/index의 full-fence CAS를 수행한다. 주입형 client bridge를 사용하므로
node-redis와 ioredis를 필수 의존성으로 만들지 않는다. 기존 client는
`createNodeRedisDurableOperationClient()` 또는
`createIoredisDurableOperationClient()`로 연결할 수 있고, custom client는
`get`, `eval`, `rangeByLex`만 제공하면 된다. repository CI는 Redis 7에 대해
integration suite를 실행하며 운영 환경에서는 별도의 retention schedule이 필요하다.

package에는 `createPostgresDurableOperationBackend()` 참조 SQL adapter도 포함된다. 이
adapter는 structural `query(text, values)` client를 주입받으며 `pg` runtime dependency를
추가하지 않는다. PostgreSQL 기본 `READ COMMITTED` isolation에서 parameterized 조건부
`INSERT ... ON CONFLICT DO NOTHING`, full-fence 검증 `UPDATE`, full-fence 검증 `DELETE`를
사용한다. `POSTGRES_DURABLE_OPERATION_SCHEMA_SQL`은 명시적인 migration 경계이며 adapter가
자동 migration을 실행하지 않는다. PostgreSQL 결정, schema 소유권, live-server 검증 경계는
[PostgreSQL durable-operation adapter 결정](../context-layered/architecture/postgres-durable-operation-adapter.md)에
기록한다.

브라우저 애플리케이션은 `createIndexedDbDurableOperationBackend()`를 기본
브라우저 backend로 사용할 수 있다. 이 backend는 object store를 지연 생성하고
IndexedDB read-write transaction과 full-fence CAS로 탭 간 record를 조정한다.
각 탭에서 같은 `databaseName`과 `storeName`을 사용해야 하며, `close()`는 해당
탭의 연결만 닫는다. 이 기능이 보장하는 것은 durable operation record의 조정까지이며,
공통 side-effect runner가 standalone Bolt filesystem reference를 담당하고,
`runHttpSideEffect()`는 얇은 HTTP bridge를, `runQueueSideEffect()`는 같은 runner
위의 enqueue/acknowledgement bridge를 제공한다. Ambiguous record는 runner의 기존
`recover()`를 사용한다. Queue/provider 완료 판단은 application 소유이며
adapter별 idempotency·inbox·outbox 경계가 여전히 필요하다.

### 외부 side-effect adapter 경계

`@context-action/tool-durable-operations`는 기존 `DurableOperationStore`를 재사용하는
작은 공통 adapter인 `createDurableSideEffectRunner()`를 제공한다. 두 번째
persistence state machine이나 provider별 retry 정책은 만들지 않는다. 각
논리 작업은 안정적인 `key`와 `fingerprint` 하나를 사용하고
`completed`/`failed`/`unknown` tagged outcome 중 하나를 반환한다.

HTTP adapter는 response가 authoritative한 뒤에만 `completed`를 반환하고,
요청이 전송되지 않았다는 사실이 확인될 때만 `failed`를 반환한다. 전송 후
응답이 유실된 transport 오류는 `unknown`으로 남겨야 한다. Queue와 provider
adapter도 같은 규칙을 사용하며 acknowledgement와 domain status query는
애플리케이션이 소유한다.

caller timeout이나 abort signal을 무시한 handler가 drain되는 경우 runner는
즉시 `unknown`을 반환하고 같은 key의 두 번째 호출을 막는다. 애플리케이션은
provider/domain 상태를 확인한 뒤 `sideEffects.recover()`를 호출해야 한다.
runner는 애플리케이션이 제공한 제한된 diagnostic만 저장하며 credential이나
raw source를 직렬화하지 않는다.

HTTP mutation은 주입한 request와 명시적인 response classifier를 bridge에 넘긴다. 상태
코드만으로 mutation 거부를 추측하지 않는다. Provider별 classifier가 authoritative한
acknowledgement일 때만 `completed`, 전송 전 거부가 확인될 때만 `failed`, 전송 여부나
provider 결과가 모호할 때 `unknown`을 반환해야 한다. Runner의 `recover()`가 상태를
먼저 확인해 reconciliation하며 HTTP request를 다시 보내지 않는다.

저장소의 `pnpm tool-durable:verify:http` smoke fixture는 ephemeral local provider와
실제 `fetch` transport를 사용해 `Idempotency-Key` 경계, 두 번째 mutation 없는 replay,
ambiguous acknowledgement 보존, status query reconciliation을 검증한다. 함께 제공하는
`pnpm tool-durable:verify:queue` fixture는 ephemeral in-process publisher로
authoritative acknowledgement, 두 번째 publish 없는 replay, publish 후 acknowledgement
유실, provider status reconciliation을 검증한다. 둘 다 bridge 계약 증거이며
production provider 증거를 대체하지 않는다. Queue fixture는 production broker SDK를
선택하거나 흉내 내지 않는다.

Queue mutation은 주입한 `enqueue` 함수와 `onAcknowledgement` classifier를 가진
`runQueueSideEffect()`를 사용한다. 권위 있는 broker receipt는 `completed`, enqueue
이전의 확인된 거절은 `failed`, publish 이후 acknowledgement 유실은 `unknown`으로
분류한다. 이 bridge는 queue SDK 응답에서 완료를 추측하거나 재시도하지 않으며,
provider 소유 idempotency 또는 inbox/outbox reconciliation이 필요하다.

예제 Live Code Editor는 이 backend를 browser `ToolContext`에 주입한다. 명시적인
`editor.saveFile`과 `editor.saveAll`은 session과 path 범위의 안정적인
idempotency key를 사용하므로 같은 session의 retry는 durable record를 replay하고
folder를 두 번 쓰지 않는다. 사용자가 새 save를 의도한 경우에는 새 session/key를
만들어야 한다. browser filesystem write가 `unknown`이 되면 folder 상태를 조회하거나
명시적으로 operator가 결정한 뒤 `registry.recoverOperation()`을 호출해야 하며,
caller timeout만을 이유로 save handler를 다시 실행해서는 안 된다. 직접 save 복구
action은
`example/src/pages/integrations/live-code-editor/actions/useLiveEditorToolActions.ts`에서
package의 `readFile()` port로 외부 파일을 읽고 시도한 source와 byte 단위로 비교한 뒤,
읽기 전용 `editor.getStatus` 결과를 사용해 완료 recovery를 기록한다. 파일이 없거나
내용이 다르면 record는 `unknown`으로 남는다. 여러 파일을 다루는 `saveAll`은 이제
ambiguous durable result에 파일별 source digest/길이 manifest만 보존하고 모든 외부
파일을 확인한 뒤에만 recovery를 완료한다. 이것은 reconciliation evidence이며
browser filesystem의 exactly-once 또는 production outbox를 보장하지 않는다.

standalone Bolt-style editor는 같은 runner를 더 작은 경계에 적용한다.
`workspace.saveAll`의 각 write/delete에 destination scope, revision, path key와
source digest fingerprint를 만들고 전용 IndexedDB operation store에 기록한다. 같은 save를
반복하면 완료된 파일은 replay되고, adapter 오류나 caller timeout은
`WORKSPACE_SIDE_EFFECT_UNKNOWN`이 되어 folder를 확인하기 전에는 남은 mutation을
진행하지 않는다. File System Access API 자체의 exactly-once를 주장하지 않으면서
부분 저장 상태를 명시적으로 다루는 방식이다.

provider별 filtered export(`toMCPFiltered`, `toOpenAIFiltered`,
`toAnthropicFiltered`)도 같은 allowlist 경계를 사용한다. `tools/list`에서
숨겨진 도구는 이름을 직접 선택해 provider payload에 다시 넣을 수 없다.

blocking handler가 실패하면 ToolContext는 현재 호출자의 `tools/call` structured
error message/details에 handler 오류 메시지와 handler ID를 보존한다. 따라서 UI와
model이 `Tool call failed` 같은 일반 오류만 받지 않고 실제 validation·workspace
원인을 확인할 수 있다. Durable failed/unknown record는 위에서 설명한 redacted
projection을 사용하므로 현재 호출 진단과 persistence evidence의 저장 계약은 분리된다.
handler가 throw하는 Error에 `code`, `retryable`, `details` metadata를 추가하면
ToolContext가 이를 canonical result까지 보존하므로 `TOOL_EXECUTION_FAILED`로
평준화되지 않는다. standalone workspace는 이를 retry 가능한 revision conflict와
terminal source-limit 오류, stale local-folder handle 오류에 사용한다. reload·save·delete
중 reload 또는 delete 과정에서 연결된 폴더가 사라지면 persistence의 File System
Access handle을 해제하고 `WORKSPACE_FOLDER_STALE`, `retryable: true` 결과를 반환한다.
반면 durable `saveAll`은 filesystem write가 부분 완료되었을 수 있어 adapter 오류나
caller timeout을 확정된 저장으로 보고하지 않고 `WORKSPACE_SIDE_EFFECT_UNKNOWN`으로
변환한다. 두 결과 모두 chat 오류에 `Reconnect folder` action을 표시하며, ambiguous
save는 재시도 전에 reconciliation이 필요하다. browser-only workspace의 save는
`WORKSPACE_FOLDER_NOT_CONNECTED`, 쓰기 권한 거부는
`WORKSPACE_FOLDER_PERMISSION_DENIED`로 반환한다. 둘 다 operation을 `details`에
담은 retryable 오류이며 chat은 각각 폴더 재연결 또는 권한 승인 action을 선택한다.

preview mutation handler는 HTML/CSS target이 없을 때 무의미한 재호출을 막기 위해
non-retryable `PREVIEW_TARGET_NOT_FOUND`를 반환한다. iframe runtime 오류, acknowledgement
timeout, superseded revision은 각각 `PREVIEW_RUNTIME_ERROR`, `PREVIEW_ACK_TIMEOUT`,
`PREVIEW_REVISION_SUPERSEDED`로 보존하며 timeout과 superseded 결과에는 retryable
`Refresh preview` chat action을 제공한다. local agent 요청과 palette/quick tool
호출은 folder reconnect, permission grant, preview refresh, revision 재조회
action에 동일한 복구 정책을 사용한다.

workspace path/state 오류도 `WORKSPACE_PATH_INVALID`, `WORKSPACE_FILE_NOT_FOUND`,
`WORKSPACE_FILE_CONFLICT`, `WORKSPACE_FILE_TYPE_CONFLICT`,
`WORKSPACE_PATCH_NOT_FOUND`, `WORKSPACE_NO_SUPPORTED_FILES`, `WORKSPACE_EMPTY`,
`WORKSPACE_ACTIVE_FILE_NOT_FOUND`, `WORKSPACE_PREVIEW_ENTRY_REQUIRED`,
`WORKSPACE_FOLDER_STATE_CONFLICT`, `WORKSPACE_HISTORY_EMPTY`로 명시하며
operation 또는 path를 `details`에 담는다. 패치 대상이 없을 때는 path,
occurrence 모드, 검색 문자열 길이만 포함하고 source나 검색 문자열 자체는 tool
error에 복사하지 않는다. 구조적 workspace 오류도 어떤 불변식 때문에 작업이
차단됐는지 설명한다. read/open/download tool은 blocking handler로 등록해 lookup
실패가 빈 성공 결과로 간주되어 output-schema validation에 넘어가지 않도록 한다.
`saveAll` 또는 `saveCheckpoint` 중 revision이 바뀌어도 retryable
`WORKSPACE_REVISION_CONFLICT` code와 expected/current revision, operation을 유지하며,
부분 저장 요약이 추가된 결과에서도 metadata를 잃지 않는다.

standalone OpenRouter bridge는 canonical error의 `code`, `retryable`, `details`를
다음 model message로 전달한다. local fallback 실행에서는 같은 code와 details를
assistant transcript에 표시하므로 provider 사용 여부와 관계없이 오류 원인을
확인할 수 있다.

annotation의 `destructiveHint`는 모델과 UI를 위한 힌트다. 이 데모에서는 파일 삭제와
revert 샘플에 표시하여 palette가 명시적 확인을 요청하게 한다. 실제 권한 차단은
반드시 `toolPolicy`에서 수행한다.

standalone studio와 realtime web-coding route는 같은 경계를 execution trace로 표시한다.
local과 OpenRouter 요청은 provider별 tool serialization 전에 canonical
`tools/list` discovery를 사용한다. paged catalog에서는 `listAllTools()`가
`registry.listTools()`를 위임 호출한다. 이후 ToolContext의
`onToolCall` observer가
`started`, `completed`, `failed` 이벤트와 source·duration·result 상태 및 additive
execution provenance를 기록한다.
표시·복사 details는 bounded redaction policy를 통과하며 trace는 UI state일 뿐이고
파일 내용이나 filesystem handle을 모델로 보내지 않는다.
`Clear`는 workspace 파일·tool registry·provider history를 바꾸지 않고 이 local
trace view만 초기화한다. 실행 중에는 in-flight lifecycle이 화면에서 사라지지
않도록 `Clear`가 비활성화된다. call row를 펼치면 canonical `tools/call` arguments와
result를 제한된 길이로 확인할 수 있다. 파일성 `source`, `search`, `replace`
값은 문자 수만 남기고 redact하므로 파일 내용을 trace UI에 복사하지 않으면서
호출 구조를 확인할 수 있다. 접힌 row에는 파일 수·path·theme·revision 같은
안전한 result summary만 표시한다.
standalone Bolt trace는 로컬 UI 확인을 위해 bounded redacted argument/result
projection과 검증된 provenance를 보존한다. 반면 example live-editor와 realtime
web-coding trace store는 metadata와 provenance만 저장한다. 어떤 store도 canonical
`request`나 `result` 객체를 남기지 않으며, Bolt의 Copy/Download는 UI diagnostic text도
제거한 metadata-only projection을 export한다.
standalone의 `agent.request` row는 같은 실행을 감싸며 running·completed·failed·cancelled
상태를 기록한다. 따라서 `tools/call`까지 도달하지 못한 provider 오류도 trace에서
확인할 수 있다.
각 agent 실행은 하나의 `sessionId`를 만들고 `tools/list`와 모든
`executeModelToolCall()` context에 전달한다. 따라서 trace에서는 provider가 전달한
개별 호출의 `toolCallId`와 실행 단위의 session correlation을 구분할 수 있다.
call row와 approval snapshot에는 context의 `source`와 `mode`도 함께 보존하므로
transport origin과 agent/direct 의도를 같이 audit할 수 있다.
lifecycle마다 unique한 내부 `traceId`도 생성하여 canonical request object와 session
queue로 `started`/`completed`를 연결하므로, provider가 model turn 사이에서 ID를
재사용하거나 ID를 생략해도 다른 row를 덮어쓰지 않는다. 축약 row의 tooltip과 복사한
trace JSON에서 full correlation 값을 확인할 수 있으며, local fallback과 OpenRouter는
같은 correlation 계약을 사용한다. 실패한 call은 structured `retryable` flag를
보존하며, 축약 row에도 provider call ID와 `retryable` 또는 `terminal` recovery
상태를 표시한다.
승인 대기 항목도 같은 session marker를 표시하며, 직접 실행하는 palette call도
자체 session을 생성한다. 따라서 agent row가 없는 수동 실행도 trace에서 감사할 수 있다.
call row에는 provider `toolCallId`가 있으면 그것과 내부 `traceId`를 함께 표시하고 full
value는 row tooltip에서 확인할 수 있다. trace panel의 `Copy`와 `Download` action은
bounded metadata-only projection을 JSON으로 내보내므로 workspace source나 result
content를 노출하지 않고도 `tools/list` → call → result 예시를 문서나 외부 테스트에서
재사용할 수 있다.
example의 realtime web-coding과 Live Code Editor trace도 같은 최소 protocol 필드를
유지한다. catalog 또는 agent가 discovery를 수행하면 `method: 'tools/list'` row를 만들고, registry lifecycle은
`method: 'tools/call'` row로 기록한다. call row에는 `source`와 `mode`를 함께 표시하므로
`local · agent`, `model · agent`, `local · direct` 실행을 같은 UI에서 구분할 수 있다.
session이 두 개 이상이면 두 example panel 모두 같은 session selector를 노출해
화면에 보이는 row만 좁힌다. Copy·Download·Clear는 계속 bounded trace 전체를
대상으로 동작한다.
agent prompt 실행 자체도 `method: 'agent.request'` row로 감싸며
`running`, `completed`, `failed`, `cancelled` 상태를 보존한다. 따라서 model이
tool call을 만들기 전에 실패하거나 사용자가 Cancel을 눌러도 실행 단위가 trace에서
사라지지 않는다.

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
registry의 `toMCP()`, `toOpenAI()`, `toAnthropic()` batch export도 동일한 전체
`listTools().tools` definition에서 시작해 core provider adapter를 적용한다.
개별 action serializer도 같은 adapter를 위임하므로 export 경로마다 root schema
제약이 사라지지 않는다. catalog 검색과 scope filter는 동일한 canonical list만
좁혀 보며 discovery나 execution
policy를 바꾸지 않는다. scope count는 canonical annotation과 namespace에서
계산하며 all·read-only·workspace·preview 범위를 제공한다.
`Copy list`는 `registry.listTools(toToolListRequest())`가 반환한 전체 `tools`
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

이 metadata는 core의 `ToolApprovalSnapshot` shape을 사용해야 한다. 이 shape은
canonical `tools/call` method, provider call ID, session, source, 실행 mode, safe
argument summary, 생성 시각을 보존하면서 approval surface를 tool 실행과
분리한다.

lifecycle도 surface별 resolver map을 복제하지 않고 core의
`createToolApprovalQueue()`를 사용해야 한다. 이 queue는 React와 standalone host에
동일한 `request`, `resolve`, `denyAll`, `store.getSnapshot`,
`store.subscribe` 경계를 제공한다. `safeArgumentNames`와 `idPrefix`만 application
옵션이며 raw argument를 저장하거나 tool을 실행하지 않는다. 따라서 abort,
중복 ID 처리, unmount cleanup, reactive approval state가 example과 standalone에서
같은 계약으로 유지된다. React의 `ToolPolicyInput`도 같은 core request input의
alias이므로 policy callback과 queue adapter의 request·definition shape이
분리되지 않는다.

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
남겨 재시도할 수 있다. standalone workspace는 각 파일 또는 삭제 작업이
filesystem에서 성공한 직후 해당 항목을 clean으로 표시하고, 실패 메시지에
완료된 path를 포함해 남은 변경만 다시 시도할 수 있게 한다.

example Live Code Editor에서는 model·MCP origin의 `editor.saveFile`과
`editor.saveAll` 호출이 filesystem adapter에 도달하기 전에 approval queue에
들어간다. 직접 palette action은 `mode: 'direct'`를 전달하므로 명시적인 local
demo 경로로 허용된다. 화면의 approval dialog는 tool call, source/mode,
argument 이름과 제한된 path preview만 보여주며 file source는 표시하지 않는다.
거부, `Escape`, abort, unmount는 모두 `deny`로 resolve되고 pending request를
queue에서 제거한다.

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
배포한다. Tool protocol과 action schema는 `@context-action/tool-protocol`,
ToolContext와 registry는 source-only `packages/react/src/tools` 트랙이 소유한다.

첫 번째 추출 seam은 이제 private
`@context-action/live-code-editor` workspace package로 존재한다. 이 package는
standalone demo가 소비하는 framework-neutral workspace, preview,
folder-import 계약, 순수 preview document compiler, workspace model helper,
repository 경계와 stateful `WorkspaceDocumentManager`를 export한다. Demo에는
Dexie `DirectoryHandlePersistence` 구현만 남기고 browser filesystem adapter는
package가 소유하며 public `WorkspaceFileSystemAdapter` port도 제공한다.
consumer는 folder import, permission, write 동작을 주입할 때 browser adapter
class가 아니라 이 port에 의존한다. Demo에는 iframe runtime과 editor adapter도 남긴다. 이
나머지 browser-specific 구현은 독립 consumer와 test가 확보된 뒤 옮기며,
계약이 안정된 뒤 공개 package 여부를 판단한다.

브라우저가 소유하는 OpenRouter API 키에는 더 작은 별도 seam인 private
`@context-action/openrouter-browser-storage` package를 둔다. 이 package가
정식 `context-action.openrouter.api-key` 항목과 same-origin 변경 구독을
소유하고, standalone provider 설정이 이를 사용한다. 따라서 키 계약은 한
곳에서 정의된다. 이 저장소는 origin 범위의 browser storage이며, 키를
Context-Action 서버로 전송하지 않는다.

기존 example route 간 브라우저 검증은 legacy route를 제거하면서 함께
종료했다. 배포 workflow는 대신 standalone provider transport와 browser flow를
검증한다. standalone의 `prebuild` lifecycle hook은 Vite가 workspace export를
해석하기 전에 이 private storage package를 build하므로 fresh checkout이
오래된 `dist` 디렉터리에 의존하지 않는다.

example은 showcase 호환성을 위해 기존 Dexie repository와 iframe bridge를
유지하지만, `example/src/lib/live-code-editor-filesystem.ts`는 이제 package
adapter를 Blob 기반 기존 API로 변환하는 facade일 뿐이다. 폴더 순회, 경로
검증, 파일 제한, 권한 처리, 쓰기 로직을 다시 구현하지 않으므로 standalone과
example이 동일한 filesystem safety contract를 공유한다.

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
| `workspace.saveAll` | approval required | 현재 workspace revision으로 guard하며 연결된 folder에 dirty file과 pending deletion 기록 |
| `workspace.saveCheckpoint` | local demo allow | local folder에는 쓰지 않고 browser-only checkpoint를 clean으로 표시 |
| `workspace.reloadFolder` | approval required | filesystem read 전후 revision으로 guard하며 연결된 folder를 다시 읽어 browser workspace 교체 |
| `workspace.disconnectFolder` | approval required | browser workspace는 유지한 채 local-folder sync 해제 |
| `workspace.reset` | approval required | folder가 연결되지 않은 경우 browser-only demo workspace를 네 파일 seed로 복구 |
| `preview.setTheme` | approval required | 제어된 preview accent theme 변경 |
| `preview.addFeature` | approval required | preview 계약을 통해 feature card 추가 |
| `preview.updateHero` | approval required | 제어된 preview hero copy 변경 |
| `preview.getStatus` | allow | 최신 sandbox preview acknowledgement 조회 |
| `preview.refresh` | model/prompt 호출은 approval, palette 호출은 local direct allow | sandbox iframe을 다시 마운트하고 현재 revision acknowledgement 대기 |

모든 workspace mutation, preview acknowledgement, save 결과는 revision·preview
필드와 함께 `storageMode` 및 optional bounded `storageError`를 반환한다. 따라서
성공한 in-memory fallback을 durable storage 성공으로 추론하지 않는다.

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
  result에는 해당 limit을 나타내는 skipped summary 하나를 남긴다. 또한
  directory/file entry를 2,000개까지 scan하고 중복 normalized path는 건너뛰어
  비정상적인 upload가 제한 없는 diagnostic 목록을 만들지 못하게 한다.
- filesystem handle은 parent adapter 경계 뒤에 두고 tool payload나 iframe message에
  전달하지 않는다. 지원되는 브라우저에서는 reload 후 재연결을 위해 workspace
  metadata에만 handle을 저장한다.
- IndexedDB hydration은 stale active path를 우선 HTML entry(없으면 사용 가능한 첫
  파일)로 복구하고, 현재 파일에 이미 존재하는 deletion marker는 제거한다. 따라서
  일부만 저장된 workspace도 존재하지 않는 active tab이나 잘못된 pending deletion을
  노출하지 않는다.
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
  checkpoint로 복원한다. rename된 file은 origin metadata를 유지하므로 현재
  workspace를 reload한 뒤에도 원래 path와 source까지 되돌릴 수 있다. 저장되지
  않은 새 파일이면 해당 파일을 제거하며, model 호출은 destructive
  policy·approval 경계를 통과해야 한다.
- `workspace.undo`와 `workspace.redo`는 editor 버튼과 local/model call이
  공유하는 edit-history canonical boundary다. 현재 `expectedRevision`을
  확인한 뒤 browser workspace checkpoint를 이동하고, 결과 projection을
  저장하며, 일치하는 iframe acknowledgement를 기다린다. 메모리 history는
  최신 100개 checkpoint로 제한하고, source edit navigation에서는 active tab을
  유지하며 구조 변경 checkpoint는 결과 file set에 필요한 path를 복원한다.
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
- text mutation은 workspace 레벨의 80,000자 source 제한을 하나의 guard로 공유한다.
  `workspace.createFile`, `workspace.writeFile`, `workspace.applyPatch`, 직접 편집,
  history restore가 같은 검사를 통과하며, tool schema도 handler 실행 전에 동일한
  제한을 노출한다. 가져온 text file에는 별도의 filesystem import byte 예산을
  유지한다.
- standalone code editor header도 같은 예산을 live 문자 수로 표시한다. mutation
  제한을 넘는 imported text는 조용히 잘라내지 않고 그대로 읽을 수 있게 유지하며,
  다음 write 전에 줄여야 한다는 over-budget 상태를 표시한다.
- New file dialog의 initial source에도 같은 예산을 적용하고 live counter를
  표시한다. 제한을 넘는 create 요청은 registry에 도달하기 전에 차단하므로 UI,
  schema, workspace validation이 같은 계약을 사용한다.
- `workspace.createFile`, `workspace.writeFile`, `workspace.applyPatch`의
  model-facing description에도 source 예산을 반복해 `tools/list` 단계에서
  provider가 `tools/call`을 만들기 전에 제약을 알 수 있게 한다.
- `workspace.saveAll`은 standalone demo의 명시적인 filesystem 경계다. Explorer의
  `Save to folder` 버튼과 동일한 parent-owned adapter로 모든 dirty file과 pending
  deletion을 기록한다. 각 작업이 성공하면 해당 항목을 즉시 clean으로 표시하고,
  모든 작업이 성공한 뒤에만 전체 IndexedDB checkpoint를 clean으로 만든다. 저장
  중 새 편집이 발생하면 revision guard가 stale checkpoint 처리를 막아 새 변경을
  dirty 상태로 유지한다. 저장 중 연결된 folder 자체가 사라지면 adapter가 저장된
  handle을 지우고 browser workspace는 보존하므로 다른 folder를 다시 열 수 있다.
  writable folder가 없으면 실패한 tool result를 반환한다.
- `workspace.saveCheckpoint`는 browser-only save 경계다. 운영체제 folder에는
  쓰지 않고 현재 IndexedDB checkpoint만 clean으로 표시하며, writable folder가
  연결된 동안에는 실패하므로 두 save 의미가 조용히 섞이지 않는다. 비동기
  persistence가 끝난 뒤에도 캡처한 revision을 다시 확인하므로, 그 사이 발생한
  편집은 dirty 상태로 남는다.
- `workspace.reloadFolder`는 외부 refresh의 명시적인 경계다. parent adapter로 연결된
  folder를 다시 읽고 Dexie browser workspace를 교체한 뒤 새 preview revision을
  기다린다. adapter read 이후 import 경계에서도 캡처한 revision을 다시 확인하며,
  skipped file과 local-folder 상태를 반환한다. 연결된 writable folder가 없으면
  실패한다.
- `workspace.reset`은 반복 가능한 데모를 위한 복구 경계다. browser-only
  workspace에서만 사용할 수 있고 Dexie projection을 네 파일 seed로 교체한 뒤
  일치하는 preview acknowledgement를 기다린다. writable folder가 연결된 동안에는
  filesystem save에 seed가 실수로 반영될 수 있으므로 실행을 거부한다. 사용자가
  discard를 확인하면 pending editor draft를 flush하지 않고 browser workspace를
  바로 교체하며, pending persistence가 끝난 뒤 import 경계에서 캡처한 revision을
  다시 확인한다.
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
  Preview reference도 resolve 전에 URL-encoded local path를 decode하므로, 공백이
  포함된 folder 파일도 실행할 수 있다.
- local demo agent도 교체 요청 안의 두 quoted string을 인식해
  `workspace.applyPatch`로 전달하므로 external model key 없이도 exact-text mutation
  경로를 시연할 수 있다. 승인 전에 planned workspace revision을 캡처하므로 승인
  대기 중 source가 바뀌면 덮어쓰지 않고 거부한다. standalone chat은 이 revision
  conflict만 `Re-read & retry`로 표시하며, 현재 revision을 다시 inspection한 뒤
  approval을 다시 요청한다.
- visual 요청에서는 같은 local fallback이 quoted hero 제목·부제목과 feature-card
  제목·설명을 인식해 typed `preview.updateHero` 또는 `preview.addFeature` call의
  argument로 전달한다. prompt가 workspace path를 명시하지 않은 경우에는 이 copy를
  exact source patch로 잘못 해석하지 않는다.
- `Save` 버튼과 `⌘/Ctrl+S` 단축키는 동일한 save 경계를 사용하며, 단축키는
  settings·New file·Rename file modal 입력 중에는 동작하지 않는다.
- OpenRouter, New file, Rename file과 destructive action 확인 dialog는
  keyboard-modal로 동작한다. `Escape`는 현재 dialog를 닫고, `Tab`은 dialog 내부
  control 사이에서 순환하며, 열린 동안 body scroll을 잠근다. 닫히면 열기
  trigger로 focus를 복귀하고 backdrop 클릭도 dialog를 닫는다. Folder 교체,
  browser reset, 파일 삭제·revert와 destructive palette sample은 native
  `window.confirm` 대신 이 앱 내부 확인 surface를 사용해 결정 상태를 화면에
  남기고 자동화 가능한 경계로 유지한다.
- source editor는 HTML, CSS, JavaScript, TypeScript, JSON, Markdown 파일의
  syntax highlighting과 편집을 하나의 overlay surface에서 유지한다. HTML 및
  CSS/JavaScript block comment 상태도 줄 사이에 전달하므로 여러 줄 source를
  편집할 때도 시각적 highlighting이 끊기지 않는다.
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
- workspace search는 debounce window 안에 editor 메모리에만 있는 draft를
  persisted snapshot 위에 덮어 검색한다. 따라서 검색 결과도 현재 editor에
  보이는 source와 일치한다.
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
  안에 주입해 실행한다. 로컬 CSS `@import` chain도 media 조건을 보존하며
  재귀적으로 inline하고, import된 stylesheet는 각자의 상대 asset 기준을
  유지한다. 순환하거나 과도한 import graph는 bounded diagnostic으로 중단한다.
  `type="module"` script의 로컬 JavaScript `import`, `export ... from`,
  동적 `import()` 경로도 stable workspace module specifier로 다시 작성한다.
  sandbox 내부 Blob module bootstrap과 import map이 이를 해석하므로 cyclic
  graph에서도 native module 실행을 유지한다. 누락된 local import와 external
  import는 bounded module error로 바꾸고, bare package specifier는 browser에
  남기되 unsupported module diagnostic으로 보고한다. 동일한 bounded module
  graph를 iframe 실행 전에 검사하며, graph-limit diagnostic으로 의도적으로
  순회하지 않은 import도 식별한다.
- 누락된 local CSS/JS/asset reference, 차단된 external stylesheet/script와
  unsupported bare module specifier는 parent Preview diagnostics panel과 structured
  `preview.getStatus` result에 함께 노출한다. 따라서 model이 불완전한
  preview를 false success로 보고하지 않고 원인을 설명할 수 있다.
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
4. framework-neutral `WorkspaceRepository` 경계 위에 부모의
   `WorkspaceDocumentManager`를 구현한다.
5. Demo 소유의 Dexie workspace repository를 추가하고 directory-handle
   persistence를 package filesystem adapter에 주입한다.
6. DocumentManager와 revision-aware preview bridge 및 acknowledgement 계약을
   계속 일치시킨다.
7. 실제 모델 호출에서 `toolCallId`와 abort signal을 Registry까지 전달하고,
   사용자가 실행을 취소할 수 있는 경로를 제공한다.
8. `scripts/verify-web-coding-browser.mjs`로 실제 browser에서 standalone의
   source 편집·syntax highlighting과 `tools/list → call → result` 및
   approval-to-preview 경로를 검증한다. 같은 검증에서 페이지를 reload한 뒤
   Dexie 기반 source와 preview 복원도 확인한다. 이미 실행 중인 서버를 검사할
   때는 `WEB_CODING_URL`을 전달한다.
9. 파괴적인 workspace tool은 model 호출에서 approval gate를 유지하고,
   실제 폴더 삭제는 사용자가 실행하는 save 경계에서만 수행한다.

## 후속 작업

유지되는 backlog와 문서 소유권 맵은
[다음 작업과 문서 소유권](../context-layered/next-work.md)에 둔다. 이 문서는
tool-execution 의미 계약에 집중하고, 배포·장애 절차는
[Durable Operation 운영 Runbook](../context-layered/architecture/durable-operation-operations.md)에
둔다. Package README와 생성 API 문서에는 두 번째 TODO 목록을 복사하지 않고
각 기준 문서로 연결한다.

## 검증 기준

- prototype 이름(`toString`, `constructor`)이 도구로 실행되지 않는다.
- 병렬 호출 결과가 `toolCallId`별로 섞이지 않는다.
- validation/policy 오류는 모델이 읽을 수 있는 structured error로 돌아간다.
- iframe revision이 오래된 patch를 거부한다.
- destructive tool은 policy 승인 없이 실행되지 않는다.
- model source의 mutation call은 명시적인 승인 또는 거부 없이는 policy 경계를
  통과하지 못한다.
