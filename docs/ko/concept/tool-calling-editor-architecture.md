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

현재 Live Code Editor는 framework runtime이 아니라 `example`의 showcase
surface이므로 example 내부에 유지한다. Tool protocol은 `@context-action/core`,
ToolContext와 registry는 `@context-action/react`가 계속 소유한다.

다음 단계에서 iframe sandbox, revision protocol, `postMessage` bridge,
DocumentManager, editor adapter가 독립적인 테스트와 API를 갖게 되면
`packages/live-code-editor` workspace package로 분리하는 것을 검토한다.
처음에는 private package로 두고 계약이 안정된 뒤 공개 패키지 여부를 판단한다.

별도 repository는 다음 조건이 충족될 때만 검토한다.

- context-action 외 여러 제품에서 재사용한다.
- editor가 독립 배포·버전 주기를 가져야 한다.
- Monaco/Codemirror, bundler, worker, sandbox service 등 editor 전용 의존성이 커진다.
- framework 팀과 editor 팀의 개발 경계 또는 보안 운영 경계가 분리된다.

분리 순서는 `example 유지 → workspace package → 독립 repository`를 기본 계획으로 한다.

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

## 빌드 순서

1. Tool ID·오류 코드·source context를 유지한다.
2. allowlist와 policy를 discovery/execution 양쪽에 적용한다.
3. lifecycle observer로 병렬 호출과 실패 결과를 기록한다.
4. DocumentManager를 부모에 구현한다.
5. iframe에는 revision-aware preview bridge를 추가한다.
6. 실제 모델 호출에서 `toolCallId`와 abort signal을 Registry까지 전달한다.
7. `tools/list → call → result`의 브라우저 검증을 추가한다.

## 검증 기준

- prototype 이름(`toString`, `constructor`)이 도구로 실행되지 않는다.
- 병렬 호출 결과가 `toolCallId`별로 섞이지 않는다.
- validation/policy 오류는 모델이 읽을 수 있는 structured error로 돌아간다.
- iframe revision이 오래된 patch를 거부한다.
- destructive tool은 policy 승인 없이 실행되지 않는다.
