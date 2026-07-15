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
fallback한다. File System Access 폴더 adapter는 persistence와 adapter 계약이
안정될 때까지 기존 example에 유지한다.

standalone 상단의 설정 창에서는 사용자 소유 OpenRouter API key·model ID·chat
completions endpoint를 관리한다. API key는 example 데모와 공유하는
`context-action.openrouter.api-key` browser key에 저장하므로 같은 origin의 다른
OpenRouter 위치에서 재사용할 수 있다. 키가 있으면 chat이 OpenRouter native
tool-call loop를 사용하고, 없으면 동일한 화면에서 결정적인 local agent fallback을
사용한다. 키는 브라우저에서 설정된 endpoint로 직접 전송되며 Context-Action 서버로
전달하거나 번들에 포함하지 않는다.

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

annotation의 `destructiveHint`는 모델과 UI를 위한 힌트다. 실제 권한 차단은 반드시 `toolPolicy`에서 수행한다.

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
  에디터의 text source는 저장된 Blob에서 파생되는 projection이다.
- `Open folder`는 범용 filesystem adapter를 사용한다. 현재 browser adapter는
  사용자 제스처의 File System Access API로 폴더를 읽은 뒤 Dexie로 import하며,
  directory handle이 workspace의 소유자가 되지 않는다.
- text와 binary 파일을 file 수·개별 크기·전체 크기 제한과 함께 가져온다.
  binary 파일은 파일 트리에 남기고 preview용 단기 Blob URL을 만들 수 있지만,
  편집 대상은 text 파일로 제한한다.
- filesystem handle은 부모 adapter 안에만 두고 tool payload나 iframe message에
  넣지 않는다.
- text 편집은 Dexie에 즉시 저장하고, `Save file`은 열린 directory가 있을 때
  generic filesystem adapter를 통해 현재 dirty text 파일을 반영한다.
- Object URL은 파생된 임시 연결값일 뿐이므로 workspace나 preview 교체 시 revoke한다.
- 실행 가능한 workspace에서는 `index.html`을 우선 진입점으로 사용하고, 없으면
  첫 `.html` 파일을 사용한다. 상대 경로의 로컬 `.css`와 `.js`는 sandbox iframe
  안에 주입해 실행한다.
- 외부 CSS/JS URL과 임의의 `runScript` 요청은 preview 경계에서 차단한다. 아직
  binary asset은 가져오지 않으므로 이미지와 폰트는 data URL 또는 후속 asset
  adapter가 필요하다.
- 미지원 브라우저에서는 파일을 서버로 몰래 전송하지 않고 memory workspace를
  유지한다.

## 빌드 순서

1. Tool ID·오류 코드·source context를 유지한다.
2. allowlist와 policy를 discovery/execution 양쪽에 적용한다.
3. lifecycle observer로 병렬 호출과 실패 결과를 기록한다.
4. DocumentManager를 부모에 구현한다.
5. Dexie workspace repository와 Blob/filesystem adapter 경계를 추가한다.
6. iframe에는 revision-aware preview bridge를 추가한다.
7. 실제 모델 호출에서 `toolCallId`와 abort signal을 Registry까지 전달한다.
8. `tools/list → call → result`와 workspace reload의 브라우저 검증을 추가한다.

## 검증 기준

- prototype 이름(`toString`, `constructor`)이 도구로 실행되지 않는다.
- 병렬 호출 결과가 `toolCallId`별로 섞이지 않는다.
- validation/policy 오류는 모델이 읽을 수 있는 structured error로 돌아간다.
- iframe revision이 오래된 patch를 거부한다.
- destructive tool은 policy 승인 없이 실행되지 않는다.
