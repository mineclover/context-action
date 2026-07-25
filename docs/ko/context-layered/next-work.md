# 다음 작업과 문서 소유권

이 페이지는 Context-Action 아키텍처와 tool-calling 작업의 유지되는 짧은
backlog다. 의미 계약 문서, 운영 runbook, package README, 생성 API 문서가
서로 다른 TODO 목록을 갖지 않도록 한 곳에서 다음 작업을 관리한다.

## 문서 소유권

| 관심사 | 기준 문서 | 이 문서에 넣지 않는 것 |
| --- | --- | --- |
| tool 실행 의미, timeout, abort-drain, idempotency, durable recovery | [Tool-calling Editor Architecture](../concept/tool-calling-editor-architecture) | 배포 명령과 장애 대응 |
| Redis 배포, retention, rollback, 운영 절차 | [Durable Operation Runbook](./architecture/durable-operation-operations) | 새로운 protocol 의미 |
| package API와 consumer quickstart | package `README.md` | 두 번째 state-machine 명세 |
| Durable mutation 실행, side-effect adapter, backend 운영 | [`@context-action/tool-durable-operations`](../../../packages/tool-durable-operations/README.md)와 [Durable Operation Runbook](./architecture/durable-operation-operations) | provider-neutral tool schema 또는 domain outbox 정책 |
| 공개 TypeScript signature | TypeDoc 출력과 `typedoc-vitepress-sync` | 손으로 작성한 동작 주장 |
| 심볼/문서 work context | `@context-action/sem-doc` report와 [경계 가이드](./architecture/sem-doc-architecture-governance-boundary) | architecture gate 정책 |
| architecture evidence, snapshot, history, `ContextScope` | [Architecture Governance](./architecture/architecture-governance) | 운영 work-context binding |
| 짧은 요약 | `llmsData/`와 `llms-generator` | 수동 backlog 결정 |

계약이 바뀌면 먼저 소유 문서를 수정하고, 그 다음 영문/국문 문서와 생성
artifact를 갱신한다. Package README는 전체 계약을 복사하지 말고 소유 문서로
링크한다.

## mutation 대상 인벤토리

다음 side-effect 도입 후보를 저장소 안에서 다시 분류한 결과는 다음과 같다.

| 표면 | 분류 | durable mutation 판단 |
| --- | --- | --- |
| OpenRouter `/models`와 chat-completions 호출 | provider discovery/model inference이며 Context-Action domain mutation이 아님 | durable side-effect runner로 감싸지 않는다. provider retry/timeout은 provider adapter가 소유한다. |
| Live Code Editor 연결 폴더 save/delete | 로컬 filesystem mutation | standalone Bolt-style editor와 example editor의 reference runner 경계가 이미 적용되어 있다. |
| Performance `useApiRequest` demo | idempotency 또는 inbox/outbox 계약이 없는 일반 GET/POST playground | request cache/timeout 예제로 유지하고 production mutation 대상으로 취급하지 않는다. |
| Queue publisher | 이 저장소가 소유한 queue SDK/publisher가 없음 | 가짜 adapter를 추가하지 않는다. 실제 provider를 선택하고 acknowledgement/idempotency 계약을 먼저 문서화한다. |

이 인벤토리는 provider read, model inference, demo 요청을 production mutation으로
잘못 분류해 중복 구현하는 일을 막는다. 따라서 다음 외부 adapter 작업은 애플리케이션
담당자, 실제 endpoint 또는 queue, provider 소유 idempotency/inbox-outbox 계약이
확정된 뒤에만 이 저장소에 코드를 추가한다.

## 완료된 기반

- durable operation record에 lease 기반 claim/replay/complete/fail/unknown 전이와
  revision 검증 reconciliation이 구현되어 있다.
- IndexedDB·Redis·PostgreSQL reference backend, 선택적 Redis client bridge,
  bounded keyset cleanup, Redis 7 integration 검증과 PostgreSQL 16 CI smoke가 있다.
  Deployment preflight는 credential을 노출하지 않고 endpoint scheme을 검증한다.
- Live Code Editor recovery는 `editor.saveFile`과 `editor.saveAll`을 모두 지원한다.
  다중 파일은 제한된 digest/길이 manifest만 저장하고 mismatch면 mutation을 다시
  실행하지 않고 `unknown`으로 남긴다.
- `TOOL_EXECUTION_UNKNOWN` 진단 결과는 정제 후 durable record에 보존되어
  resolver가 확인할 수 있으며 source text는 저장하지 않는다.
- `sem-doc`은 operational Symbol Context SSOT이고 Architecture Governance는
  실험적 authored-evidence/control-plane package로 분리되어 있다.
- complete symbol snapshot, commit history, context intersection, 명시적 one-hop
  `node_modules` surface 정책이 서로 다른 계약으로 문서화되어 있다.
- `tool-protocol`/`tool-durable-operations` 분리는 named Architecture Governance
  package-boundary rule로 강제하며, 두 package는 서로 runtime dependency를 추가할 수 없다.
- repository CI workflow가 Redis 7과 PostgreSQL 16 service container에서
  persistence smoke/integration을 실행하며, GitHub Environment 배포 gate는 이
  저장소의 CI/CD 범위에서 의도적으로 제외한다.
- 로컬 tarball consumer smoke가 아직 공개되지 않은 tool package를 packed
  artifact로 설치해 CJS export를 확인하며, registry consumer 검증은 publish
  workflow gate로 분리한다.

## 우선순위 backlog

### P0 — CI persistence 계약 *(완료)*

repository CI test job이 Redis 7과 PostgreSQL 16 service container를 시작하고 public API
smoke, durable-operation integration suite, HTTP/queue bridge fixture를 실행한다. 이를
통해 reference adapter와 bridge 계약을 자동화된 실제 server에서 검증한다. Production
endpoint·TLS·ACL·failover·migration·alert·rollback 증거라고 주장하지 않으며, 해당 자원을
소유한 application deployment pipeline의 책임으로 남긴다.

**완료 기준:** GitHub Environment secret 없이 CI가 검증을 실행하고 실패가 일반 test job에
표시되며, 별도 deployment workflow나 두 번째 persistence abstraction이 필요하지 않다.

### P1 — 외부 side-effect 경계 *(전용 durable-operations 패키지 구현 완료)*

`@context-action/tool-durable-operations`의 framework-neutral
`createDurableSideEffectRunner()` 계약을 구현했다. 기존 durable operation key와
fingerprint를 재사용하고 `completed`/`failed`/`unknown` outcome을 명시하며,
draining handler보다 cancellation이 먼저 오면 즉시 반환하고 domain 소유 recovery를
지원한다. standalone Bolt-style editor는 이제 전용 IndexedDB durable store를
사용해 연결된 폴더의 파일 write/delete마다 이 계약을 채택한다. 같은 runner를 감싸는
`runHttpSideEffect()`와 `runQueueSideEffect()`도 제공하며 ambiguous record는 runner의
기존 `recover()`를 사용한다. 두 bridge는 application 소유 response/acknowledgement
classifier를 요구하며 non-2xx 응답이나 queue receipt를 completed/failed mutation으로
추측하지 않는다. Production HTTP·queue·provider 통합은 provider 소유 idempotency 또는
inbox/outbox 계약과 함께 해당 bridge를 채택해야 한다. 위 인벤토리 기준으로
현재 이 저장소가 소유한 production target은 없다. 로컬
`pnpm tool-durable:verify:http` fixture는 실제 `fetch`, `Idempotency-Key`,
ambiguous response, status-query recovery까지 실행하고, 함께 제공하는
`pnpm tool-durable:verify:queue` fixture는 ephemeral in-process publisher로
authoritative acknowledgement와 publish 후 acknowledgement 유실을 재현한다.
둘 다 queue SDK나 production provider 통합이 아니라 bridge 계약 fixture이며
production 증거를 대신하지 않는다.

[Provider adapter admission checklist](./architecture/durable-operation-operations#provider-adapter-admission-checklist)를
첫 실제 HTTP·queue target 선택의 필수 handoff artifact로 사용한다. 구현 전에 owner,
stable key scope, authoritative acknowledgement, reconciliation query, provider 중복
억제와 rollback 증거를 기록한다.

**완료 기준:** generic runner와 HTTP·queue bridge 및 local HTTP·queue smoke fixture가
중복 전달, draining timeout, provider/network ambiguity, 알려진 pre-send rejection,
authoritative response/acknowledgement, reconciliation을 테스트한다. production adapter도 동일한 테스트를 추가해야 완료로
본다. 같은 논리 key의 retry가 두 번째 side effect를 조용히 실행하지 않는다. 브라우저
filesystem 통합은 File System Access API의 exactly-once를 보장하는 구현이 아니라 기준
integration boundary다. reference adapter는 이제 안정적인 대상 folder scope를 저장하고
key에 포함하며, custom production filesystem adapter도 같은 scope 계약을 노출해야 한다.

### P1 — SQL durable-operation adapter *(PostgreSQL reference 구현 완료)*

`createPostgresDurableOperationBackend()`가 기존 revision 검증
claim/complete/fail/unknown 계약을 parameterized PostgreSQL 조건부
INSERT/UPDATE/DELETE 문장으로 매핑한다. `pg`를 필수 의존성으로 만들지 않고 명시적인
schema migration string을 export하며 두 번째 state machine을 만들지 않는다. 결정과
isolation 계약은 [PostgreSQL adapter 결정](./architecture/postgres-durable-operation-adapter)에
기록했다.

**남은 완료 기준:** production PostgreSQL version과 pool wrapper에서
`pnpm tool-durable:verify:postgres`를 실행하고, 동시 claim·lease reclaim·replay·unknown
reconciliation·bounded retention·migration·isolation·rollback 증거를 기록한다. fake
query-client 테스트만으로는 live database 검증이 되지 않는다.

### P2 — 실행 provenance와 운영 정책

**sem-doc 부분 완료:** `sem-doc-work-context.v5`, `sem-doc-context-scope.v3`,
`sem-doc-context-scope-history.v2`에 phase, 논리 owner, 최종 상태, timeout/output 한도,
실제 출력 사용량, 경과 시간을 additive provenance로 기록한다. 히스토리 커밋은 하나의
aggregate budget을 공유하고 strict parser도 공통화했다.

**tool-protocol 부분 완료:** `ToolCallEvent.provenance`가 pending/final lifecycle 상태,
논리 owner, 선택적 timeout/output budget, 측정된 UTF-8 output 사용량, 경과 시간을 검증된
additive record로 전달한다. `maxOutputBytes`는 durable completion 전 적용되며 결과 payload를
보존하지 않고 `TOOL_OUTPUT_LIMIT_EXCEEDED`를 반환한다.

**공통 policy 구현:** `@context-action/tool-protocol`이
`createToolObservabilityPolicy()`, `redactToolObservabilityValue()`,
`serializeToolObservabilityValue()`를 제공한다. depth, collection, string, UTF-8 byte를
제한하고 credential/source 계열 필드를 redaction하며, durable state machine을 변경하지
않고 retention metadata를 제공한다. Bolt-style trace도 표시·복사 details에 같은 policy를
사용한다.
example live-editor와 realtime web-coding trace projection은 bounded metadata와 검증된
provenance만 보존하고 canonical `request`와 `result` payload는 의도적으로 버린다.
React durable-operation persistence도 ambiguous `ToolCallResult` diagnostic을
`sanitizeToolCallDiagnostic()`로 투영하고 안정적인 code 기반 reason만 저장하며, 성공
known error record에도 같은 projection을 적용하고 성공 terminal result는 replay를 위해
lossless로 유지한다.

**Repository sink audit 완료:** Bolt UI details, example live-editor/web-coding metadata
trace, React durable unknown diagnostic이 bounded projection을 사용한다. 공통 example
trace store도 policy의 string 상한과 retention window를 강제하며
`pnpm --filter example verify:trace`와 standalone trace verifier가 이를 검증한다.
공통 `createToolObservationSink()` adapter는 application 소유 provider/server sink에
serialized metadata-only record와 retention policy metadata만 전달하고 raw
`ToolCallEvent`는 전달하지 않는다. 이 저장소에는 external sink owner나 배포 target이
없으므로 external sink는 선택적 deferred 항목이다. durable state transition 계약은
변경하지 않는다.

**완료 기준:** sem-doc snapshot과 tool-protocol lifecycle 이벤트가 credential/raw source text
없이 검증 가능한 record를 만들고, 모든 production sink가 공통 bounded policy·owner·retention
window·삭제 경로·no-raw-request 검증을 갖춘다.

## 외부 target 범위

이 저장소는 의도적으로 production endpoint, queue, telemetry sink, production PostgreSQL
배포를 소유하지 않는다. 로컬 Redis/PostgreSQL container와 HTTP/queue fixture가 저장소의
전체 검증 범위다. 아래 항목을 닫기 위해 synthetic external target을 만들지 않는다.
application이 실제 target과 owner를 제공할 때 provider admission checklist와 strict evidence
gate부터 재개하며, 그 전까지는 repository blocker가 아닌 deferred 항목으로 둔다.

## 다음 실행 순서

backlog를 실제 작업으로 바꿀 때는 다음 순서를 사용한다. 저장소에서 바로 검증할 수 있는 일과
환경 담당자 또는 제품 결정이 필요한 일을 분리한 순서다.

| 순서 | 작업 | 종료 증거 | 현재 상태 |
| --- | --- | --- | --- |
| 1 | 첫 실제 HTTP 또는 queue mutation을 선택하고 side-effect runner 도입 | provider 소유 idempotency/inbox-outbox 계약과 duplicate·ambiguity·recovery 테스트 | Deferred: 범위에 application 소유 endpoint/queue가 없음 |
| 2 | 외부 telemetry sink 감사 완료 | sink 담당자·실제 retention/삭제 job·`createToolObservationSink()` 설정·no-raw-request 검증 | Deferred: 범위에 external sink owner/deployment target이 없음 |
| 3 | production SQL target에서 PostgreSQL adapter 검증 | versioned migration·실제 pool wrapper·동시 claim integration 결과·isolation setting·담당자·rollback 판단 | Deferred: 범위에 production SQL target이 없음 |

이 작업들에서 두 번째 durable state machine을 만들지 않는다. package 변경은
`@context-action/tool-durable-operations`, 배포·retention 증거는 runbook, 의미 계약 변경은 architecture
guide가 소유한다.

## 보류 상태인 작업

- LSP 수준의 정확한 reference 위치, unsaved overlay, CodeAction.
- `@samchon/graph`, `@ttsc/graph` 같은 compiler-resolved graph provider.
- ContextScope 시각화용 renderer/bubble editor. 먼저 직렬화 scope와 결정적 집합
  연산을 유지한다.
- provider 자체 idempotency 또는 inbox/outbox 계약 없이 provider exactly-once 보장.

## handoff 체크리스트

- [ ] 수정 전에 소유 package와 기준 문서를 정한다.
- [ ] ownership table이 요구하는 교차 링크 외에는 의미 문서 또는 runbook 한 곳만 수정한다.
- [ ] focused test와 contract/fixture version을 추가한다.
- [ ] 문서가 안정된 뒤 영문/국문과 LLMS artifact를 생성한다.
- [ ] `pnpm docs:management`, package focused check, `pnpm docs:build`를 실행한다.
