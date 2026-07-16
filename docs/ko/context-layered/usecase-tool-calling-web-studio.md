# Tool Calling Web Studio 컨벤션

이 문서는 standalone web-coding 데모에서 검증한 구조를 재사용 가능한
Context-Action 컨벤션과 use case recipe로 정리합니다. 모델/provider, typed tool
registry, workspace 도메인 로직, 브라우저 persistence, React view 사이의
경계를 고정하는 것이 목적입니다.

모든 Context-Action 애플리케이션이 MCP나 iframe preview를 사용해야 한다는
뜻은 아니며, tool-calling web studio 형태에 적용하는 데모 컨벤션입니다.

## 이 recipe를 사용하는 경우

다음 요구가 하나 이상 있을 때 사용합니다.

- model 또는 local agent가 document-like workspace를 읽고 변경해야 할 때
- MCP/function-calling tool을 list, approval, execute, structured result로
  처리해야 할 때
- IndexedDB, Blob asset, local folder adapter 같은 browser persistence가
  필요할 때
- revision을 반영한 live preview와 ready/error acknowledgement가 필요할 때
- tool catalog와 실행 trace를 UI에서 관찰·디버깅해야 할 때

일반 form state만 있고 command boundary가 없다면 표준 Action Only 또는 Store
Only 패턴을 사용합니다.

## 표준 흐름

```text
tools/list
  -> model/local-agent tool call
  -> ToolContext policy + schema validation
  -> tools/call handler
  -> domain manager / repository
  -> preview bridge acknowledgement
  -> structured tool result + trace
  -> view subscription
```

model에는 workspace 객체를 직접 전달하지 않고, view가 tool 허용 여부를
결정하지 않습니다. 각 경계에는 하나의 source of truth를 둡니다.

| 경계 | 소유자 | 책임 |
| --- | --- | --- |
| Tool identity와 input/output schema | Tool Context | 이름, 설명, annotation, validation 정의 |
| Provider transport | action hook | model message를 canonical call로 변환 |
| Approval과 policy | ToolContext policy | allow, deny, confirmation 결정 |
| Workspace 변경 | tool handler + manager | revision/type/path invariant 검사와 도메인 변경 |
| Persistence | repository/filesystem adapter | browser data 저장 또는 명시적 folder sync |
| Preview | preview compiler/bridge | revision 렌더링과 ready/error acknowledgement |
| 관찰 | observable hook | 외부 workspace/trace 상태를 React에 구독 |
| 표현 | view | 데이터 렌더링과 callback 발생 |

## Context-Action 배치

권장 구조는 다음과 같습니다.

```text
contexts/
  tool-context.ts              # createToolContext와 schema
actions/
  run-agent.ts                 # provider-neutral orchestration
handlers/
  tool-handlers.tsx            # useToolHandler 등록
hooks/
  use-tool-execution.ts        # provider/model 실행
  use-editor-observables.ts    # 외부 구독
  use-workspace-*.ts           # workspace action과 keyboard command
views/
  tool-catalog-panel.tsx
  tool-trace-panel.tsx
  workspace-editor-toolbar.tsx
  workspace-source-panel.tsx
  ...
domain/
  workspace-manager.ts         # framework-neutral state transition
  workspace-repository.ts      # persistence port
```

standalone 데모에서는 각각 `bolt-style-tool-context.ts`,
`actions/run-local-agent.ts`, `tool-handlers.tsx`, `hooks/`, `views/`, private
`@context-action/live-code-editor` package가 같은 역할을 합니다.

## 규칙

### 1. Schema를 single source of truth로 둔다

ToolContext schema에 tool을 한 번만 정의합니다. `tools/list`, OpenAI function
definition, MCP definition, catalog inspector, validation은 registry에서
파생시킵니다. view나 transport adapter에서 provider별 schema를 다시 만들지
않습니다.

### 2. Model transport는 provider-neutral로 유지한다

OpenRouter, local fallback 등 provider별 conversation format은 달라도
최종적으로 같은 canonical call boundary를 사용해야 합니다.

```ts
await registry.executeModelToolCall(
  { id, name, arguments: parsedArguments },
  { context: { source, mode: 'agent', sessionId }, signal }
);
```

`source`를 생략하면 registry는 call을 `model`로 기록하고, `local`이나 `mcp`처럼
명시한 source는 approval·trace·audit consumer를 위해 그대로 보존합니다.

`source`는 transport origin, `mode`는 실행 의도로 구분합니다. agent/model loop는
`mode: 'agent'`, 명시적인 palette 또는 command action은 `mode: 'direct'`를 사용합니다.
provider 전용 값은 `metadata`에만 두고, mutation approval 여부를 결정하는 값으로
재사용하지 않습니다.

retry, cancellation, message history, provider error는 action hook이 소유하고
workspace를 직접 변경하지 않습니다.

모든 provider 경로는 registry boundary를 사용합니다. discovery request는
pagination이 필요하면 `toToolListRequest({ cursor })`로 만들고
`registry.listTools()`에 전달합니다. provider 직렬화는
`registry.toOpenAI()` 같은 registry export, model-originated call은
`registry.executeModelToolCall()`로 통일합니다. provider별 tool 배열을 별도로
만들거나 handler를 직접 호출하는 것은 이 컨벤션에 포함하지 않습니다. palette
command는 직접 `tools/call` boundary를 소유한 action hook 안에서만
`registry.callTool()`을 사용할 수 있으며, model call을 JSON-RPC request로
표현하거나 export할 때는 공통 `toToolCallRequest()` adapter를 사용합니다.

### 3. Domain invariant는 handler와 framework-neutral manager에 둔다

handler는 normalized path, supported file kind, expected revision conflict,
text/asset size limit, folder-linked 상태, preview acknowledgement를 검사하거나
manager에 위임합니다. workspace manager와 repository port는 React 없이도
사용할 수 있어야 합니다.

### 4. Approval은 policy boundary로 취급한다

read-only tool은 자동 허용할 수 있지만, model-originated mutation은
ToolContext policy를 지나 UI approval을 거쳐야 합니다. approval UI는 요청을
resolve할 뿐 tool을 직접 실행하지 않습니다.

policy callback이 외부 event store를 사용해야 한다면 React에는 전용
observable hook으로 노출합니다. non-React ToolContext callback과 React
subscription을 모두 안전하게 유지할 수 있습니다.

### 5. View는 data와 callback을 받는다

tool catalog, trace panel, editor toolbar, source panel은 focus나 표시 같은
ephemeral UI state만 소유합니다. Dexie, OpenRouter, revision guard,
filesystem handle을 알면 안 됩니다. mutation callback은 action hook 또는
handler-backed command를 가리켜야 합니다.

### 6. Canonical error를 반환한다

stable error code, retryable flag, structured details를 사용합니다. retry
가능 여부를 UI가 임의의 error string parsing으로 결정하게 하지 않습니다.

### 7. Revision 흐름을 명시한다

read tool은 현재 revision을 반환하고, caller가 알고 있는 경우 mutation tool은
`expectedRevision`을 받습니다. conflict는 retry 가능한 structured result이며
조용히 overwrite하지 않습니다. local agent는 성공한 mutation마다 planned
revision을 갱신해야 합니다.

### 8. 관찰 상태에서도 protocol method를 명시한다

registry와 trace는 서로 다른 관심사이지만 protocol vocabulary는 맞아야 합니다.
discovery trace에는 `method: 'tools/list'`, 모든 started/completed/failed tool
lifecycle에는 `method: 'tools/call'`, 이를 감싸는 provider 또는 local 실행에는
`method: 'agent.request'`를 기록합니다. provider의 `toolCallId`, 실행 단위의
`sessionId`, 내부 trace ID는 분리합니다. provider가 call ID를 재사용하거나 생략해도
trace는 lifecycle을 안정적으로 상관관계화해야 하기 때문입니다.

따라서 다음 세 진입점은 audit 관점에서 같은 실행 모델을 공유합니다.

- `executeModelToolCall`을 거치는 model call
- 같은 boundary를 거치는 deterministic local-agent call
- 직접 action hook을 거치는 palette command

view는 이 필드를 표시·export할 수 있지만 label을 보고 method를 추론하거나,
자유 형식 오류 문자열을 parsing해 retry 가능 여부를 결정하지 않습니다.
`source`와 `mode`에도 같은 규칙을 적용합니다. trace와 approval snapshot이 두
필드를 함께 보존하므로 call 완료 후에도 audit consumer가 transport origin과
실행 의도를 구분할 수 있습니다.

## Use-case recipe

### A. Local agent fallback

provider key가 없거나 결정론적인 browser test가 필요할 때 사용합니다.

1. registry에서 `tools/list`를 호출합니다.
2. user prompt로 bounded local plan을 만듭니다.
3. guarded mutation에 관찰한 revision을 넣습니다.
4. 모든 call을 `executeModelToolCall`로 실행합니다.
5. provider 호출과 같은 structured result와 trace를 반환합니다.

데모 근거: `src/actions/run-local-agent.ts`와 local-agent verification script.

### B. OpenRouter model loop

remote model이 같은 catalog에서 tool을 선택해야 할 때 사용합니다.

1. registry definition을 provider format으로 export합니다.
2. assistant tool call과 JSON argument를 normalize/validate합니다.
3. 각 call을 ToolContext registry로 실행합니다.
4. canonical tool result를 provider message history에 추가합니다.
5. assistant text가 나오거나 call budget에 도달할 때까지 반복합니다.

데모 근거: `src/openrouter.ts`, `src/openrouter-protocol.ts`, OpenRouter
transport verifier.

### C. Browser workspace와 connected folder

IndexedDB에서 안전하게 작업한 뒤 사용자가 명시적으로 local folder에 sync해야
할 때 사용합니다.

1. browser repository를 hydrate합니다.
2. permission이 허용될 때만 persisted folder handle을 복원합니다.
3. browser mutation과 local-folder write를 별도 tool boundary로 둡니다.
4. folder write에는 `workspace.saveAll`을 요구합니다.
5. permission, disconnected, stale-folder 오류를 structured result로 노출합니다.

데모 근거: `use-workspace-runtime.ts`, `workspace-storage.ts`, browser
filesystem adapter.

### D. Live preview acknowledgement

mutation 결과가 agent의 완료 보고 전에 화면에 반영되어야 할 때 사용합니다.

1. 성공한 mutation 뒤 workspace revision을 증가시킵니다.
2. 해당 revision의 HTML/CSS/JS graph를 compile합니다.
3. sandbox iframe으로 보냅니다.
4. 일치하는 `ready` 또는 `error` bridge message를 기다립니다.
5. tool result에 preview status를 포함합니다.

iframe message를 보냈다는 이유만으로 preview mutation을 완료 처리하지
않습니다. 요청한 revision과 acknowledgement가 일치해야 합니다.

### E. Palette command와 recovery audit

model을 거치지 않고 사용자가 tool을 직접 검사하거나 retry해야 할 때 사용합니다.

1. 공통 `toToolCallRequest()` adapter로 request를 만듭니다.
2. `context.mode: 'direct'`를 지정하고 action hook에서 registry boundary를 통해
   실행합니다.
3. model-originated call과 같은 policy, revision guard, persistence, preview
   wait를 적용합니다.
4. canonical error code와 `retryable` flag를 trace에 보존합니다.
5. structured result가 안전하다고 표시할 때만 view가 `Retry`를 제공합니다.

이렇게 하면 수동 debugging도 보호된 mutation 경계를 벗어나지 않습니다.

이 parity 계약은
`packages/react/__tests__/tools/ToolContext.test.tsx`의 React ToolContext 통합
테스트로 고정합니다. palette call은 허용되어 structured output을 반환하고,
model/prompt call은 handler가 실행되기 전에 policy에서 거절됩니다. 두 실행 모두
canonical `tools/call` lifecycle event를 발생시킵니다.

## Build와 검증 순서

private package 또는 contract를 변경한 경우 다음 순서를 사용합니다.

```bash
pnpm --filter @context-action/live-code-editor check
pnpm --filter @context-action/live-code-editor type-check
pnpm --filter @context-action/live-code-editor test
pnpm --filter @context-action/web-coding-demo check
pnpm --filter @context-action/web-coding-demo type-check
pnpm --filter @context-action/react test -- __tests__/tools/ToolContext.test.tsx
pnpm web-coding:verify
pnpm --filter example check
```

데모 `prebuild`는 package를 다시 build하기 전에 package check를 실행합니다.
최종 검증은 contract, production base-path 산출물, preview, filesystem,
provider transport, browser flow를 모두 포함해야 합니다.

standalone 경계에는 별도의 컨벤션 게이트도 둡니다.

```bash
pnpm --filter @context-action/web-coding-demo verify:conventions
```

example catalog 검사는 `example check`에 포함됩니다. UI와 standalone 명령문이
각각 대응하는 ToolContext schema에 실제 존재하는 tool만 참조하는지 확인하므로,
tool 이름을 변경하거나 삭제한 뒤 command library가 조용히 오래된 상태로 남지
않습니다.

이 검사는 ToolContext 생성과 handler 등록이 전용 모듈에 남아 있는지,
외부 subscription이 observable hook에 모여 있는지, local/provider 경로가
canonical discovery·export·model-call boundary를 사용하는지 확인합니다. example
live-coding showcase도 수동 JSON-RPC request를 만들지 않고 공통
`toToolCallRequest()` adapter를 사용합니다. presentation view가 workspace
mutation·catalog·tool execution API를 직접 호출하지 않는지도 확인합니다.

개발 진입점도 standalone 경계의 일부로 봅니다. example 앱이나 다른 로컬
도구와 동시에 실행할 수 있도록 Vite 포트를 열어 두고 package launcher 자체를
검증합니다.

```bash
pnpm --filter @context-action/web-coding-demo verify:dev-server
WEB_CODING_PORT=43144 pnpm --filter @context-action/web-coding-demo dev
```

검증기는 package의 `dev` 스크립트를 생성 포트로 실행하고 standalone entry
document가 실제로 응답하는지 확인한 뒤 프로세스를 종료합니다. 따라서 로컬
실행 방법과 release 계약이 어긋나지 않습니다.

## Anti-pattern

- view가 workspace, Dexie, `fetch`를 직접 호출한다.
- OpenRouter와 local fallback이 각각 다른 mutation path를 구현한다.
- catalog가 registry 대신 tool definition을 재구성한다.
- 편의를 위해 model-originated write가 policy를 우회한다.
- persistence나 preview가 끝나기 전에 handler가 성공을 반환한다.
- revision conflict를 숨기고 최신 파일을 overwrite한다.
- 여러 view가 외부 ToolContext state를 제각각 구독한다.

## 데모 연결

전체 reference implementation은 standalone
[`@context-action/web-coding-demo`](../../../demos/bolt-style-editor/README.md)입니다.
package 경계는 [Tool-calling editor architecture](/ko/concept/tool-calling-editor-architecture)에서
확인할 수 있습니다.
