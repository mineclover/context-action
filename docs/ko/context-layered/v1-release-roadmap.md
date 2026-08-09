# Context-Action v1.0 릴리스 로드맵

**상태:** Draft — 지속 운영형 릴리스 계획<br>
**릴리스 원칙:** v1.0.0은 버전 번호 변경이 아니라 공개 계약의 동결이다.

## 1. 목표와 계획 원칙

v1.0.0은 Context-Action이 1.x 전체에서 아래 약속을 지킬 수 있을 때만 준비된
것으로 판단한다.

> 공개 API, 런타임 의미론, 수명주기 동작, 패키지 호환성이 문서화되어 있고 서로
> 일치하며, 소비자 관점에서 재현 가능한 증거로 검증되어 있다.

이 문서는 그 상태에 도달하기 위해 필요한 단일 개발 계획이다. 레거시 제거, 계약
결정, 구현 안정화, 패키지 검증, 문서화, 릴리스 운영을 하나의 로드맵으로 관리한다.
코드가 merge되었다는 사실만으로 작업이 끝나지 않는다. 계약, 테스트, 소비자 영향,
문서가 함께 정렬될 때 완료된다.

### 변경 불가 순서

호환성을 깨는 정리는 반드시 **v1.0 공개 API 동결 전**에 끝낸다. Deprecated 또는
legacy 표면은 0.9.x 안정화 라인에서 아래 셋 중 하나만 선택할 수 있다.

1. 동결 전에 제거하고 migration 경로를 제공한다.
2. 1.x에서 지원할 공개 계약으로 유지한다.
3. 명시적인 experimental package 또는 subpath로 격리한다.

일시적인 compatibility shim을 v1.0에 남긴다면 1.x 유지보수 의무로 취급한다.
릴리스 게이트를 통과하는 데 필요하지 않은 신규 기능, 신규 adapter, 대규모 리팩터링,
검증되지 않은 성능 작업은 이 계획의 범위가 아니다.

## 2. 로드맵 운영 방식

이 문서를 릴리스 보드로 사용한다. 독립적으로 검증 가능한 이슈 하나를 하나의 작업
단위로 만들고 아래 milestone에 배정한다. 릴리스 상태는 merge된 PR 수가 아니라 증거의
상태로 판단한다.

| 작업 상태 | 의미 | 완료에 필요한 증거 |
| --- | --- | --- |
| `inventory` | 표면을 발견했지만 결정하지 않음 | owner, 영향 package와 public surface |
| `decision-needed` | 계약 또는 제거 결정이 열려 있음 | ADR 또는 승인된 contract 항목 |
| `in-progress` | 코드 또는 테스트를 변경 중 | 재현 절차와 목표 acceptance test |
| `verified` | 구현이 완료됨 | focused test/type/package 증거 |
| `accepted-limitation` | 설계상 이번에 수정하지 않음 | 영향, 우회법, owner, 재검토 버전 |
| `blocked` | 안전하게 진행할 수 없음 | 명시된 의존성 및 해소 조건 |

모든 이슈는 다음 형식을 사용한다.

```md
## CA-1X-<area>-<number>

- Severity: P0 | P1 | P2
- Milestone:
- Affected public contract:
- Current behavior and reproduction:
- Expected 1.0 contract:
- Chosen resolution:
- Compatibility and migration impact:
- Test / package / documentation evidence:
- Owner and status:
```

P0와 P1은 릴리스 차단 이슈다. P2는 `accepted-limitation`으로만 남길 수 있으며
owner와 재검토 버전을 반드시 기록한다. “나중에 처리”는 상태가 아니다.

## 3. 범위 결정 체크포인트

공개 API를 동결하기 전에 publish 대상 workspace package를 모두 분류한다. 저장소는
현재 Lerna independent versioning을 사용하므로, 이 전략을 유지하려면 참여하는 모든
package의 target version과 dependency range를 명시해야 한다.

| 분류 | 릴리스 의미 | 필수 증거 |
| --- | --- | --- |
| `stable-1x` | 1.x 전체에서 지원하는 공개 계약 | API snapshot, SemVer 정책, packed consumer 검증 |
| `supporting-stable` | 주 entry point가 아니어도 stable package 호환성에 영향을 줌 | dependency 및 consumer matrix 검증 |
| `experimental` | 공개하지만 1.x 안정성 약속에서는 제외 | 명시적 표기, 격리된 import path, 호환 범위 |
| `internal` | 외부 공개 계약 없음 | package 및 public docs 약속에서 제외 |

최소한 `@context-action/core`, `@context-action/react`,
`@context-action/tool-protocol`, `@context-action/ai-sdk`,
`@context-action/webmcp`, `@context-action/tool-durable-operations`,
`@context-action/mutative`와 기타 모든 publish 대상 package를 포함한다. 기존 npm
package이거나 문서 예제에 등장한다는 이유만으로 stable로 추론하지 않는다.

## 4. 릴리스 트레인과 milestone

milestone은 날짜가 아니라 순서로 관리한다. 앞 milestone의 종료 조건이 충족된 뒤에만
다음 단계로 진행한다. 날짜와 owner는 추측하여 문서에 적지 않고 이슈 트래커에서
관리한다.

### M0 — 기준선과 릴리스 인벤토리

**목표:** 동작을 바꾸기 전에 사실 기반 출발점을 확정한다.

- HEAD SHA, Node, pnpm, TypeScript, React, package version, 마지막 publish
  version을 기록한다.
- publish 대상 package마다 export와 package metadata snapshot을 만들고, 마지막
  artifact 대비 차이를 breaking/additive/deprecated/accidental로 분류한다.
- export, alias, deprecated type, runtime branch, compatibility subpath, example,
  test, docs, script, package metadata를 포괄하는 legacy inventory를 만든다.
- Core, React, tool adapter, lifecycle, consumer risk를 바탕으로 P0/P1 risk
  register를 만든다.
- 실제 검증 명령과 baseline 결과를 기록한다. `pnpm release:check`, package
  export/tarball, React compatibility, tool consumer 검증 스크립트는 증거의 입력일
  뿐이며 통과를 가정하지 않는다.

**종료 조건:** scope inventory와 legacy inventory를 검토할 수 있으며, migration 또는
유지 결정이 기록되기 전에는 legacy 표면을 제거하지 않는다.

### M1 — 계약 결정과 제거 설계

**목표:** 구현하거나 삭제하기 전에 목표 계약을 결정한다.

- stable/experimental package 분류, 지원 runtime matrix, ESM/CJS/SSR/browser
  범위, package version topology, 1.x deprecation 정책을 결정한다.
- Core 의미론을 동결한다. role identity, cross-role ID 충돌, `once`, guard
  admission, result aggregation, observer 격리, sequential/parallel/race 순서,
  retry barrier, outcome, 불변 `ExecutionResult` invariant가 대상이다.
- abort, timeout, queued work, debounce, retry, detached observer,
  `destroyAsync()`, React unmount, Strict Mode replay의 lifecycle ownership을
  결정한다.
- canonical Tool Protocol 순서와 지원할 AI SDK/WebMCP profile을 결정한다.
  experimental adapter는 default stable entry point에서 제외한다.
- legacy 항목마다 **제거**, **1.x 계약으로 유지**, **experimental로 격리** 중 하나를
  선택한다. 제거 전 replacement import와 migration 예제를 정의한다.

**종료 조건:** 미결 public semantic이나 암묵적인 호환성 약속에 의존하는 구현이 없다.

### M2 — Legacy closure (0.9.x breaking-cleanup 기간)

**목표:** 호환성이 깨지는 변경이 허용되는 동안 낡은 public/internal 경로를 닫는다.

M0 inventory를 다음 분류로 처리한다.

| 분류 | API freeze 전 필수 작업 |
| --- | --- |
| Export와 alias | 낡은 export/subpath를 제거하고 compile-time negative test와 replacement import를 추가한다. |
| 등록 API | 포괄적인 legacy registration/effect API를 role별 guard, result, observer API로 이전한다. |
| Runtime compatibility branch | 조용한 fallback 대신 dead behavior를 삭제하고, 남길 1.x 경로만 문서화한다. |
| Type | runtime보다 강한 보장을 하는 alias, optionality, cast, generic을 제거한다. |
| Tool adapter | legacy/current profile을 분리하고 adapter-local policy 또는 execution state machine을 제거한다. |
| 문서와 example | 과거 자료는 migration/reference로 옮기고 삭제 API의 활성 예제를 없앤다. |
| Build와 release graph | old script, workspace dependency, generated artifact, package reference를 제거한다. |

각 제거에서 old import가 의도적으로 실패하게 하고, 가능한 경우 packed package로
replacement를 compile하며, migration 항목을 추가하고 저장소 전체의 stale reference를
검색한다. 문서화되지 않은 re-export로 제거 사실을 숨기지 않는다.

**종료 조건:** active source, test, example, docs, generated-doc, release graph에
분류되지 않은 legacy path가 없다. 남은 deprecated API는 backlog가 아니라 명시적인
1.x support list다.

### M3 — Core와 lifecycle 안정화

**목표:** 동결한 Core 동작이 실패와 동시성 상황에서도 결정론적이고 안전함을 보장한다.

- role replacement, guard filter, fail-closed guard, 두 dispatch API의 parity,
  handler result-map typing, 불변 return snapshot을 direct regression 및 negative
  type test로 검증한다.
- sequential, parallel, race의 결정론적 ordering과 diagnostics를 검증한다. result
  aggregation 오류로 handler가 재실행되지 않게 한다.
- 모든 execution mode와 concurrent dispatch에서 invocation 전 atomic `once` claim을
  강제한다.
- 다음 race attempt 전 retry abort-and-drain을 강제하고 queue wait, debounce,
  execution, backoff, observer drain에서 cancellation을 검증한다.
- 정확히 한 번 cleanup과 일관된 telemetry 정의를 가진 하나의
  `active → closing → destroyed` lifecycle model을 확정한다.

**종료 조건:** P0/P1 Core·lifecycle 이슈가 모두 focused regression test와 함께
해결되며, `ExecutionResult` 필드끼리 모순될 수 없다.

### M4 — React와 adapter 안정화

**목표:** integration이 동결된 Core 계약을 재구현하지 않고 위임함을 증명한다.

- unsafe generic escape hatch 없이 Core config와 result-map type이 React hook까지
  전달되는지 검증한다.
- handler replacement, 최신 callback ref, unmount cancellation, cleanup drain,
  Strict Mode replay, SSR import/snapshot, 실제 React 18/19 consumer를 검증한다.
- Tool Protocol canonical boundary를 검증한다. 순서는 validation, policy,
  interaction/approval, idempotency, durable claim, execution, output validation,
  canonical result다.
- AI SDK의 capability, approval, idempotency, output schema, runtime integration을
  검증한다.
- WebMCP의 profile typing, 불변 notification snapshot, cancellation, correlation ID,
  SSR/unsupported-browser 동작, experimental 상태를 검증한다.

**종료 조건:** P0/P1 integration 이슈가 닫히거나, adapter가 experimental로 명시적으로
격리되어 stable default import에 노출되지 않는다.

### M5 — Consumer와 distribution 인증

**목표:** workspace resolution 밖에서 실제 릴리스 artifact를 증명한다.

모든 stable-1x 및 supporting-stable package에 대해 다음을 실행한다.

```text
pack tarball
→ empty consumer install
→ ESM import 및 CJS require
→ tsc --noEmit
→ 대표 runtime smoke
→ minimum/exact dependency 및 peer matrix
```

`exports`, `main`, `module`, declaration, subpath, `sideEffects`, Node engine,
peer range, browser-safe import, 목표 React/adapter matrix를 검증한다.
Workspace의 `workspace:*` resolution은 이 증거를 대체할 수 없다.

**종료 조건:** 모든 stable package가 선언한 최소 dependency 조합으로 tarball test를
통과하고, package metadata가 scope 결정과 일치한다.

### M6 — 문서, migration, release candidate

**목표:** 소비자가 읽을 수 있는 계약을 발행하고 feature churn을 멈춘다.

- scope, public contract, SemVer/deprecation policy, 0.x-to-1.x migration, known
  limitations, issue ledger, readiness report를 canonical v1 release 문서로 만든다.
  `docs/releases/v1.0.0/` 또는 저장소에서 승인한 동등 위치에 두고, 영어/한국어
  ownership을 결정한다.
- API 문서를 재생성하고 packed package에서 핵심 TS/TSX snippet을 compile하며 stale API
  example과 compatibility 문구를 제거한다.
- 전체 release 명령을 실행하고 readiness report에 정확한 명령, 환경, exit code, 날짜,
  artifact 위치를 기록한다.
- RC freeze에 들어간다. P0/P1 수정, 해당 regression test, 직접 영향 문서만 merge할 수
  있다. RC 코드가 바뀔 때마다 M5를 다시 실행한다.

**종료 조건:** 문서와 generated API output에 uncommitted drift가 없고 RC가 완전한
evidence bundle을 가진다.

### M7 — 독립 감사와 v1.0.0 판정

**목표:** 구현자의 낙관과 독립된 기준으로 릴리스 판정을 한다.

fresh reviewer가 source, public API diff, test, tarball, consumer project,
migration guide, evidence를 감사한다. 최소한 아래 시나리오를 재실행한다.

1. 동일 ID로 guard를 cross-role replacement하는 경우
2. 일반 handler filter로 guard를 제외하는 경우
3. 하나의 `once` handler를 concurrent dispatch하는 경우
4. 다음 retry attempt와 race loser가 겹치는 경우
5. result aggregation 실패
6. observer mutation 및 settle하지 않는 observer
7. Provider Strict Mode replay와 unmount drain
8. WebMCP scope 재생성/idempotency collision
9. packed minimal-dependency consumer

**종료 조건:** 모든 gate가 통과하고 open P0/P1이 없으며 readiness report가 `READY` 또는
`NOT READY` 중 하나만 판정한다.

## 5. Gate 책임 매트릭스

| Gate | 책임 milestone | 최소 증거 |
| --- | --- | --- |
| G0 Scope와 versioning | M0–M1 | package 분류, version, runtime matrix, dependency range |
| G1 Public API freeze | M1–M2 | export diff, removal ledger, type/runtime parity test |
| G2 Core execution | M3 | phase, ordering, retry/race, once, result-map test |
| G3 Lifecycle과 metrics | M3 | abort/timeout/destroy/telemetry invariant test |
| G4 React contract | M4 | React 18/19, SSR, Strict Mode, unmount 증거 |
| G5 Tool adapter | M4 | canonical boundary와 adapter runtime/profile test |
| G6 Package consumer | M5 | packed ESM/CJS/type/runtime/minimum-version consumer |
| G7 Docs와 migration | M6 | generated docs, snippet compilation, migration review |
| G8 Independent audit | M7 | adversarial replay와 서명된 readiness report |

## 6. 로드맵 시작 후 릴리스 운영

- 0.9.x release에서 removal notice와 migration guide를 제공하고, 호환성 정리가 가능한
  기간 안에 breaking cleanup을 끝낸다.
- M2 완료를 public API freeze로 취급한다. 이후 v1.0.0까지 관련 없는 추가와 breaking
  change를 거부한다.
- prerelease/RC는 동결된 artifact를 검증하기 위해서만 사용한다. 코드가 바뀌면 영향받은
  M3–M6 증거를 다시 수집한다.
- v1.0.0 이후에는 stable-1x 계약을 보존한다. 먼저 deprecate하고 지원 migration 기간을
  제공한 뒤, 제거는 다음 major line에서만 계획한다.

## 7. Ready 정의

다음이 모두 참일 때만 v1.0.0을 publish할 수 있다.

- open P0 또는 P1 이슈가 없다.
- 모든 public surface가 분류·문서화·package test되었다.
- 분류되지 않은 legacy implementation, export, document, release-graph reference가
  남아 있지 않다.
- type, runtime behavior, test, package artifact, docs가 같은 계약을 설명한다.
- workspace source가 아닌 consumer tarball이 지원 matrix에서 성공한다.
- 독립 감사가 기록된 evidence를 승인한다.

하나라도 거짓이면 올바른 릴리스 판정은 `NOT READY`다. 다음 작업은 버전 상승이 아니라
가장 작은 gate-clearing task여야 한다.
