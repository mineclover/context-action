# Context-Action v1.0 릴리스 로드맵

---
status: completed
canonical: true
roadmapRevision: v1-r3
artifactCommit: 63f790a521e3428a7a2825677747338f8f05ccf3
promotionRun: 31347327623
completedAt: 2026-08-10
releaseStatus: promoted
translation:
  en: docs/en/context-layered/v1-release-roadmap.md
---

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

## 2. Historical baseline and final outcome

이 로드맵의 실행 계획은 2026-08-10에 완료됐다. `v1.0.0` artifact cohort는
`63f790a521e3428a7a2825677747338f8f05ccf3`에서 `next`로 발행됐고, protected
promotion run `31347327623`이 Core·React·Tool Protocol `1.0.0`을 `latest`로
승격했다. 현재 default channel은 `@context-action/tool-protocol@1.0.1`과
`@context-action/webmcp@0.1.2`의 사후 patch까지 반영한다. 정확한 historical
artifact, promotion, current registry 상태는
[`release-manifest.json`](../../releases/v1.0.0/release-manifest.json)이 소유한다.

아래 기준선 표는 release planning 당시의 판단을 보존한 실행 이력이다. 현재 readiness나
차단 상태를 나타내지 않는다. 현재 상태와 post-release maintenance entrypoint는
[`status.md`](../../releases/v1.0.0/status.md)를 따른다.

- **기준 커밋:** `0d6047b99961a33ef0d09704ae39c577d3b89cd8`
  (`fix: harden execution metrics and WebMCP scope lifecycle`)
- **로드맵 리비전:** `v1-r3`
- **버전 전략:** Lerna `independent`
- **증거 상태:** source와 focused test는 검토했지만 전체 release gate를 하나의
  evidence bundle로 인증하지 않았다.
- **당시 판정:** `NOT READY` (superseded by the promoted release)

아래 상태는 기준 커밋의 현황을 설명할 뿐, CI 실행 또는 외부 consumer 인증 완료를
주장하지 않는다. 이 기준선에 연결된 CI status/workflow 결과는 release evidence로
기록되어 있지 않다.

| Gate | Historical status | 기준선 판단 |
| --- | --- | --- |
| G0 Scope/versioning | `partial` | independent versioning은 설정되어 있으나 package/subpath 분류가 열려 있다. |
| G1 Public API | `partial` | role API hardening은 존재하나 legacy retain/remove 결정이 열려 있다. |
| G2 Core execution | `implemented-unverified` | role-conflict, atomic-once, guard semantics, observer aggregation 회귀 검증이 존재한다. |
| G3 Lifecycle/metrics | `implemented-unverified` | cancellation metrics, retry cancellation, observer/lifecycle 작업이 존재한다. |
| G4 React contract | `partial` | WebMCP generic/resolver 처리와 hook test는 있으나 전체 matrix 증거가 없다. |
| G5 Tool adapters | `partial` | WebMCP hardening은 있으나 안정성 분류와 전체 boundary 증거가 열려 있다. |
| G6 Consumer packages | `partial` | 검증 script는 있으나 기준선을 인증하는 release evidence bundle이 없다. |
| G7 Docs/migration | `partial` | roadmap/API docs는 있으나 v1 release 문서 세트가 완성되지 않았다. |
| G8 Independent audit | `not-started` | fresh-context audit 증거가 없다. |
| G9 Security/supply chain | `partial` | 저장소 security audit은 있으나 release별 supply-chain 증거가 열려 있다. |

## 3. 운영 모델과 이슈 상태

이 문서는 규범적인 릴리스 계획이며 릴리스 정책이 바뀔 때만 수정한다. 실시간 delivery
board는 v1.0 GitHub Project다. Project가 만들어지기 전까지는
[`docs/releases/v1.0.0/status.md`](../../releases/v1.0.0/status.md)가 commit되는
mirror 역할을 한다. readiness 상태와 command evidence는 이 계획이 아니라 release
status 및 `release-evidence/v1.0.0-*/manifest.json`에 둔다.

독립적으로 검증 가능한 이슈 하나를 하나의 작업 단위로 만들고 아래 milestone에
배정한다. 릴리스 상태는 merge된 PR 수가 아니라 증거의 상태로 판단한다.

| 작업 상태 | 의미 | 완료에 필요한 증거 |
| --- | --- | --- |
| `inventory` | 표면을 발견했지만 결정하지 않음 | owner, 영향 package와 public surface |
| `decision-needed` | 계약 또는 제거 결정이 열려 있음 | ADR 또는 승인된 contract 항목 |
| `in-progress` | 코드 또는 테스트를 변경 중 | 재현 절차와 목표 acceptance test |
| `implemented-unverified` | 코드와 focused test는 있으나 release-gate evidence가 연결되지 않음 | source/test 참조와 누락된 evidence 작업 |
| `contract-approved` | 공개 의미론이 승인됨 | ADR 또는 public-contract 항목과 영향 surface |
| `verified` | contract, 구현, type, consumer, 문서 증거가 모두 연결됨 | 변경 불가 evidence-manifest 항목 |
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

## 4. 범위 결정 체크포인트

공개 API를 동결하기 전에 publish 대상 workspace package, exported subpath, 그리고
혼합 안정성 subpath의 named public surface를 모두 분류한다. 저장소는
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

### 시작 후보이며 확정 범위가 아님

| Surface | 후보 분류 | 필요한 결정 |
| --- | --- | --- |
| `@context-action/core` | `stable-1x` | target `1.0.0` contract |
| `@context-action/react` | `stable-1x` | target `1.0.0` contract |
| `@context-action/tool-protocol` | `supporting-stable` | v1 train 포함 여부 |
| `@context-action/react/tools`의 ToolContext API | `supporting-stable` | stable ToolContext surface |
| `@context-action/webmcp` | `experimental` | 0.x support profile과 한계 |
| React WebMCP hook | `experimental` | `@context-action/react/webmcp` 또는 동등 subpath로 격리 |
| `@context-action/ai-sdk` | `experimental` 또는 `supporting-stable` | 지원 의지와 peer matrix |
| `@context-action/tool-durable-operations` | `decision-needed` | stable ToolContext contract 포함 여부 |
| `@context-action/mutative*` | `decision-needed` | stable React dependency 지원 약속 |
| generator와 TypeDoc tooling | `internal` | npm publish 유지 필요성 |

현재 혼합된 `@context-action/react/tools` entry는 experimental WebMCP hook이 연관성만으로
stable처럼 보이게 해서는 안 된다. stable ToolContext-only entry를 유지하면서 별도
experimental subpath를 두는 방식을 우선한다.

## 5. Contract registry와 freeze ladder

M1은 새로운 Core 작업을 시작하기 전에 이미 구현된 결정을 contract candidate로
역기록한다. 기준선에는 일반 filter보다 우선하는 guard, cross-role ID 거부,
invocation 전 `once` claim, abort-and-drain retry barrier, result 이후 observer 순서,
current/legacy WebMCP profile 분리가 후보로 포함된다. 적절한 gate에서 승인·검증되기
전에는 어느 항목도 1.x 약속이 아니다.

| Freeze | 시점 | 의미 |
| --- | --- | --- |
| F0 Scope freeze | M1 종료 | stable/experimental package, subpath, runtime, version-train 범위를 결정한다. |
| F1 Contract candidate | M2 종료 | legacy 처리와 target v1 API 후보를 결정하고 migration fixture를 만든다. |
| F2 Public API freeze | M3 및 M4 종료 | Core, React, adapter hardening으로 candidate contract를 검증한다. |
| F3 Artifact freeze | M5 종료 | tarball과 dependency/peer matrix를 인증한다. |
| F4 RC code freeze | M6 시작 | P0/P1 및 직접 영향 test/docs만 변경할 수 있다. |

따라서 M2는 **public API candidate**를 만들며 binding public API freeze는 아니다. M3나
M4에서 발견한 결함은 여전히 계약 변경을 요구할 수 있다.

## 6. Workstream과 milestone 의존성 그래프

milestone은 waterfall queue가 아니라 의존성 gate다. 날짜와 owner는 live delivery
board에서 관리하며, 입력이 준비된 독립 작업은 즉시 시작한다.

```text
M0 Baseline → M1 Contract decisions → M2 Legacy closure candidate
                                      ├→ M3 Core and lifecycle ─┐
                                      └→ M4 React and adapters ─┼→ M5 Distribution certification
                                                                → M6 RC → M7 Audit → M8 Publish
```

다음 track은 M5/M6까지 기다리지 않고 지속 실행한다.

- M1부터 및 public export/declaration 변경마다 API-surface diff
- M0부터 및 관련 package/build/dependency 변경마다 packed-consumer smoke와 dependency check
- M1부터 및 public change마다 documentation과 migration fixture
- release train 전체의 security와 supply-chain check

### M0 — 기준선과 릴리스 인벤토리

**목표:** 동작을 바꾸기 전에 사실 기반 출발점을 확정한다.

**기준선 상태:** `partial`. 현재 SHA와 independent versioning은 확인했지만 published
version inventory, package/subpath 분류, legacy inventory, formal risk register,
localization governance, 저장된 baseline command 결과는 아직 열려 있다.

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

**기준선 상태:** `partial`. 여러 결정이 구현·테스트되어 있으나 public contract 또는
ADR 승인으로 아직 기록되지 않았다.

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

**종료 조건:** 미결 public semantic이나 암묵적인 호환성 약속에 의존하는 구현이 없고
F0 scope freeze가 기록된다.

### M2 — Legacy closure와 contract candidate

**목표:** 낡은 경로의 처리를 결정·실행하고 v1 public API candidate를 만든다.

**기준선 상태:** `not-complete`. 최소한 `registerEffect`, `blocking`, generic legacy
`register`, WebMCP `beforeExecute`, WebMCP `errorMode: "result"` alias,
compatibility docs/example, legacy internal void executor, 역할이 모호한
compatibility subpath의 처리 방식을 결정해야 한다.

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
1.x support list다. F1 contract candidate와 실제 migration fixture를 기록한다. 이는
아직 public API freeze가 아니다.

### M3 — Core와 lifecycle 안정화

**목표:** 동결한 Core 동작이 실패와 동시성 상황에서도 결정론적이고 안전함을 보장한다.

**기준선 상태:** `implemented-unverified`. role conflict, guard filter/fail-closed,
atomic-once guard/result, void-dispatch observer aggregation, cancellation metrics,
retry/race semantics에는 이미 regression coverage가 있다. 전체 stress coverage와
release-gate evidence는 여전히 필요하다.

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
해결되며, `ExecutionResult` 필드끼리 모순될 수 없다. M4와 함께 F2 public API freeze의
전제조건이다.

### M4 — React와 adapter 안정화

**목표:** integration이 동결된 Core 계약을 재구현하지 않고 위임함을 증명한다.

**기준선 상태:** `partial`. WebMCP profile generic 전파, caller execution resolver 보존,
registration cancellation, post-execution snapshot, React hook coverage는 존재한다.
React 18/19 release evidence, SSR consumer evidence, Tool Protocol ordering, AI SDK
coverage, subpath 격리는 아직 열려 있다.

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

**목표:** M0부터 지속 실행한 검증을 바탕으로 workspace resolution 밖의 실제 릴리스
artifact를 최종 인증한다.

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
  release status와 independent-version release manifest도 포함한다.
  `docs/releases/v1.0.0/` 또는 저장소에서 승인한 동등 위치에 둔다. 한국어는 canonical,
  영어는 M0부터 관리되는 번역본이다.
- API 문서를 재생성하고 packed package에서 핵심 TS/TSX snippet을 compile하며 stale API
  example과 compatibility 문구를 제거한다.
- 전체 release 명령을 실행하고 readiness report에 정확한 명령, 환경, exit code, 날짜,
  artifact 위치를 기록한다.
- RC freeze에 들어간다. P0/P1 수정, 해당 regression test, 직접 영향 문서만 merge할 수
  있다. RC 코드가 바뀔 때마다 M5를 다시 실행한다.

**종료 조건:** 문서와 generated API output에 uncommitted drift가 없고 RC가 완전한
evidence bundle을 가지며 F4 code freeze에 진입한다.

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

### M8 — Publish와 post-release verification

**목표:** 인증한 artifact만 publish하고 public registry를 검증하며 책임 있는 복구 기간을
운영한다.

1. final artifact checksum이 인증된 RC artifact와 일치하는지 확인한다.
2. `next`/`rc`에 publish한 뒤 clean external-consumer smoke를 실행한다.
3. 승인 후에만 `latest`로 승격하고 Git tag/release manifest를 발행하며 docs site를 배포한다.
4. npm package name/version, dist-tag, provenance 결과, tarball checksum, release commit,
   post-publish ESM/CJS/type smoke 결과를 기록한다.
5. rollback/deprecate 절차를 확인하고 24–72시간 release issue를 triage한다.

**종료 조건:** public artifact와 registry metadata가 승인된 manifest와 일치하고,
post-release owner 및 rollback 경로가 문서화된다.

## 7. Gate와 evidence 매트릭스

각 evidence-manifest 항목은 command, environment, start/end time, exit code, log,
content hash를 기록한다. 관련 변경이 있으면 이전 command가 통과했더라도 해당 gate를
다시 연다.

| Gate | Command 또는 검증 | 필수 artifact | 다시 여는 조건 |
| --- | --- | --- | --- |
| G0 Scope/versioning | version/dependency inventory | `release-manifest.json`, scope matrix | package, subpath, version, peer, runtime-scope 변경 |
| G1 Public API | API snapshot/declaration diff | `api-surface/*.json`, removal ledger | public export 또는 declaration 변경 |
| G2 Core execution | Core focused suite와 negative type test | `test-results/core-contract.*` | Core source/type 변경 |
| G3 Lifecycle/metrics | lifecycle stress와 invariant suite | `test-results/lifecycle-report.json` | queue, retry, abort, observer, lifecycle 변경 |
| G4 React contract | `pnpm verify:react-compatibility`와 SSR consumer test | `test-results/react-18.json`, `react-19.json` | React source, peer, hook type 변경 |
| G5 Tool adapters | adapter runtime/profile suite | `test-results/adapters/*.json` | adapter 또는 Tool Protocol 변경 |
| G6 Package consumers | `pnpm verify:package-tarballs`, export check, consumer matrix | `consumer-results/matrix.json`, tarball hash | package, dependency, export, build 변경 |
| G7 Docs/migration | docs API generation, sync, build, packed snippet | generated-doc clean diff, migration fixture output | public API/docs 변경 |
| G8 Independent audit | fresh-context adversarial replay | `audit-report.md` | 모든 RC code 변경 |
| G9 Security/supply chain | `pnpm security:audit`, workflow/dependency/provenance review | `security-report.json`, integrity hash | dependency, workflow, publish, tool-policy 변경 |

### G9 — Security와 supply chain

G9은 stable surface의 release blocker다. vulnerability/license 검토, package
integrity/hash 검증, npm provenance, immutable GitHub Actions pinning, secret scan,
`SECURITY.md`와 supported-version policy, tool authorization/approval threat model,
WebMCP origin/Permissions Policy review를 포함한다. stable package에 미해결 high/critical
dependency finding이 있거나, destructive tool example이 policy/approval을 우회하거나,
release workflow에 책임 있는 provenance 경로가 없으면 gate는 실패한다.

## 8. Release train과 manifest

0.9 patch line에서 breaking removal을 반복하는 대신 아래 train을 사용한다.

```text
0.9.x            replacement API, deprecation notice, migration guide, warning
0.10.0/beta.1    legacy removal과 final contract candidate
1.0.0-rc.1       F2 API freeze, artifact certification, external consumer
1.0.0            artifact-equivalent final publish
```

Independent version에서는 “Context-Action v1.0.0”이 무엇인지 release manifest가
정의해야 한다. target artifact는 `docs/releases/v1.0.0/release-manifest.json`이다.

```json
{
  "release": "context-action-v1.0.0",
  "commit": "<release-sha>",
  "packages": {
    "@context-action/core": "1.0.0",
    "@context-action/react": "1.0.0",
    "@context-action/tool-protocol": "1.0.0",
    "@context-action/webmcp": "0.x"
  },
  "stableSurfaces": [
    "@context-action/core",
    "@context-action/react",
    "@context-action/tool-protocol"
  ]
}
```

예시는 schema일 뿐 승인된 version map이 아니다. manifest는 readiness report, release
note, publish automation, post-publish smoke, Git tag annotation에서 소비한다.

## 9. Evidence와 이중 언어 문서 운영

릴리스 문서는 서로 다른 책임을 가진다.

```text
v1-release-roadmap.md                    규범, milestone, gate, Ready 정의
docs/releases/v1.0.0/status.md           현재 gate 상태, blocker, 다음 작업
release-evidence/v1.0.0-*/manifest.json  재현 가능한 command, artifact, hash
```

`manifest.json`에는 release commit, Node/pnpm/TypeScript environment, command timing,
exit code/log path, artifact path/SHA-256이 포함되어야 한다. 변경 불가 artifact나 log
없이 passing command를 기록하지 않는다.

국문 roadmap이 canonical이다. 영문은 관리되는 번역본이다. CI/documentation check는
roadmap revision, artifact commit, milestone ID, gate ID, issue-template field,
Definition of Ready 항목 수를 맞춰야 하지만 문장 번역 자체를 비교할 필요는 없다.

## 10. 초기 delivery issue

| Issue ID | 작업 | Milestone |
| --- | --- | --- |
| `CA-1X-SCOPE-001` | package/subpath 안정성 분류 | M1 |
| `CA-1X-VERSION-001` | independent release manifest와 target version map | M1 |
| `CA-1X-FREEZE-001` | freeze ladder 도입 | M1 |
| `CA-1X-LEGACY-001` | `registerEffect` remove/retain/isolate 결정 | M2 |
| `CA-1X-LEGACY-002` | `blocking` compatibility 결정 | M2 |
| `CA-1X-WEBMCP-001` | experimental React WebMCP subpath 격리 | M2/M4 |
| `CA-1X-LIFECYCLE-001` | WebMCP dispose cancel/drain contract | M4 |
| `CA-1X-EVIDENCE-001` | release evidence manifest schema와 writer | M0/M5 |
| `CA-1X-SECURITY-001` | G9 security/supply-chain evidence | M0–M5 |
| `CA-1X-MIGRATION-001` | 실제 0.9 consumer migration fixture | M2/M6 |
| `CA-1X-LOCALIZE-001` | Korean-canonical/English-sync validation | M0 |
| `CA-1X-RELEASE-001` | dist-tag, provenance, rollback, post-publish 절차 | M7/M8 |

## 11. Ready 정의

다음이 모두 참일 때만 v1.0.0을 publish할 수 있다.

- open P0 또는 P1 이슈가 없다.
- 모든 public surface가 분류·문서화·package test되었다.
- 분류되지 않은 legacy implementation, export, document, release-graph reference가
  남아 있지 않다.
- type, runtime behavior, test, package artifact, docs가 같은 계약을 설명한다.
- workspace source가 아닌 consumer tarball이 지원 matrix에서 성공한다.
- G9 security/supply-chain evidence에 미해결 release blocker가 없다.
- 독립 감사가 기록된 evidence를 승인한다.

하나라도 거짓이면 올바른 릴리스 판정은 `NOT READY`다. 다음 작업은 버전 상승이 아니라
가장 작은 gate-clearing task여야 한다.
