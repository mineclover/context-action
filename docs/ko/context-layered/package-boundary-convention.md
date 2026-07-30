# 패키지 경계 및 코드베이스 관리 컨벤션

**상태:** 신규 작업과 경계 변경에 적용
**범위:** workspace package, example, demo, 아키텍처 근거, 문서 ownership

Context-Action 저장소에서 패키지 경계는 폴더 구분만이 아니라 ownership과 의존성 경계다. 각 패키지는 하나의
주 책임, 하나의 public contract, 하나의 명확한 검증 경로를 가져야 한다.

## 1. 경계 규칙

1. 패키지는 하나의 응집된 책임을 소유한다. 서로 다른 책임이 필요하면 작업을 나누거나 아키텍처 decision을
   먼저 기록한다.
2. 다른 패키지는 선언된 package export를 통해서만 사용한다. 상대 경로, `src/`, `dist/`, test 전용 alias로
   다른 패키지를 import하지 않는다.
3. `package.json`이 runtime, peer, optional, development dependency의 source of truth다. 소스 import와
   dependency 선언이 불일치하면 경계 결함이다.
4. `exports`가 public surface다. export되지 않은 파일은 implementation detail이며 패키지 간 연동 지점으로
   사용하지 않는다.
5. package README는 discovery 문서다. 정식 동작·아키텍처 계약은 `docs/` 아래 한 개의 authoritative guide가
   소유하며 README에 두 번째 사양을 복제하지 않는다.
6. `dist/`, API reference, LLMS artifact, coverage, generated report는 파생 결과다. 원본과 generator를
   수정하고 다시 생성하며 generated 파일을 canonical implementation으로 취급하지 않는다.
7. 패키지 경계 변경은 dependency review, focused proof, 문서 ownership 갱신을 같은 변경에 포함한다. 파일을
   옮기는 것만으로 migration이 끝난 것으로 보지 않는다.

## 2. 현재 패키지 맵

새 패키지는 기존 패키지가 dependency 방향이나 release 요구를 위반하지 않고 책임을 소유할 수 없을 때만
추가한다.

| 패키지 | 경계 역할 | 소유하는 것 | 소유하지 않는 것 |
| --- | --- | --- | --- |
| `@context-action/core` | runtime foundation | action pipeline, handler execution, validation contract, core error | React, tool transport, Zod, browser UI, store |
| `@context-action/tool-protocol` | transport contract foundation | JSON Schema, Zod action schema, MCP/provider adapter, tool call, approval queue, 호출 idempotency/provenance/observability 계약 | React rendering, action registry internals, durable persistence, architecture policy |
| `@context-action/tool-durable-operations` | mutation safety foundation | durable operation record, side-effect runner, HTTP/queue adapter, IndexedDB/Redis/PostgreSQL reference backend | provider-neutral tool schema, React rendering, domain별 idempotency/outbox 정책 |
| `@context-action/mutative-core` | immutable runtime foundation | 유지보수되는 Mutative 호환 draft·patch·array engine | Context-Action adapter, React, time-travel policy |
| `@context-action/mutative` | runtime adapter | React가 사용하는 immutable update/patch utility | action orchestration, React context |
| `@context-action/react` | framework adapter | React context, store, hook, ref, tool integration | core policy, 문서 생성, Git 분석 |
| `@context-action/llms-generator` | documentation generator | LLMS summary, priority, derived artifact | runtime behavior, architecture policy |
| `@context-action/typedoc-vitepress-sync` | API documentation adapter | TypeDoc-to-VitePress 동기화 | handwritten guide, runtime code |
| `@context-action/style-testing` | UI verification tool | style/browser 분석과 CLI | core state contract |
| `@context-action/live-code-editor` | private integration | live editor 실험 | promotion 전 stable runtime contract |
| `@context-action/openrouter-browser-storage` | private integration | OpenRouter example browser persistence | core/react용 generic storage abstraction |

`example/`과 `demos/`는 library가 아니라 integration host다. public package를 조합하고 아키텍처를 보여줄 수
있지만 재사용 구현은 다른 패키지가 import하기 전에 package로 승격한다.

기존 test-driven documentation package와 repository-owned example은 0.8/0.9 안정화 과정에서 제거했다. 공개
API 문서는 exported source와 JSDoc → TypeDoc → `typedoc-vitepress-sync` → VitePress라는 단일 경로를 사용한다.
LLMS summary는 canonical `docs/`에서 파생하며 별도의 API SSOT가 아니다.

## 3. 의존성 방향

기본 방향은 다음과 같다.

```text
@context-action/core          ──→ @context-action/react
@context-action/tool-protocol ──→ @context-action/react
@context-action/tool-durable-operations ──→ @context-action/react
@context-action/mutative-core ──→ @context-action/mutative ──→ @context-action/react

```

- `core`는 `react`에 의존하지 않는다.
- `tool-protocol`은 framework-neutral이며 `core`나 `react`에 의존하지 않는다. provider/tool 경계를 소유한다.
- `tool-durable-operations`도 framework-neutral이며 `core`, `react`, `tool-protocol`에 의존하지 않는다. durable mutation recovery와 provider side-effect adapter를 소유한다.
- `react`는 `core`, `mutative`를 사용하며 `mutative`는 하위 `mutative-core` runtime만 사용하고 React type을 import하지 않는다.
- `mutative-core`는 upstream 호환성을 유지하며 Context-Action adapter나 React에 의존하지 않는다.
- 문서 generator는 소스·문서를 읽을 수 있지만 runtime package가 generator에 의존하지 않는다.
- example과 demo는 그래프의 leaf다. 패키지가 example/demo를 import하지 않는다.

새로운 안정된 방향이 생기면 reviewer 기억에 의존하지 말고 named policy rule로 추가한다.

protocol/durable 분리는 runtime/peer/optional dependency 검토와 focused package-boundary test로 유지한다.
test 전용 도구가 `devDependencies`에 있는 것은 publish boundary를 바꾸지 않는다.

### Mutative 계약 전파

immutable runtime 계약은 `@context-action/mutative-core`가 소유하며
`@context-action/mutative`는 이를 그대로 전달해야 한다.

- adapter의 `freeze`는 core `enableAutoFreeze`로 전달하고 `strict`와
  분리한다.
- patch consumer는 Set의 `replace` patch를 보존하고, 문자열이 아닌 Map key나
  Symbol 속성에는 array path를 사용해야 한다.
- core 변경 후 adapter와 time-travel 테스트에서 이 동작을 회귀 검증한다.

정식 동작 및 동기화 기록은
[Mutative Core 히스토리 및 원본 참조](./mutative-core-history.md)를 따른다.

## 4. 패키지 contract

각 package README와 manifest는 다음을 답해야 한다.

```text
Package ID와 안정성: public | private | transitional | experimental
주 책임:
Public entry point와 exports:
Runtime dependency:
Peer/optional dependency:
소유 source directory:
Test/verification command:
Authoritative guide:
Architecture capability 또는 decision:
Migration/deprecation 계획:
```

기본 디렉터리 구조는 다음과 같다.

```text
packages/<package>/
├── package.json          # dependency/export contract
├── README.md             # discovery/consumer quickstart
├── src/                  # canonical implementation
├── test/ 또는 __tests__/ # executable proof
├── docs/                 # 필요한 경우 package 상세
├── schemas/              # versioned public schema
└── dist/                 # generated output; 직접 수정하지 않음
```

`architecture/registry.json`은 stable capability identity와 evidence를 기록한다. package manifest, README,
public guide를 대체하지 않는다. capability anchor는 owner package 내부를 가리켜야 하며 package 경계 변경 시
관련 capability 또는 decision도 갱신한다.

## 5. 패키지 단위 개발 라이프사이클

### 1단계 — 변경 분류

| 분류 | 확인 질문 | 필요한 source of truth |
| --- | --- | --- |
| public API | export type/entry point가 바뀌는가? | source/JSDoc, API docs, migration note |
| runtime behavior | state/action/store/tool behavior가 바뀌는가? | package spec, focused test, runnable example |
| boundary | ownership/dependency 방향이 바뀌는가? | 본 컨벤션, policy, decision |
| documentation/tooling | docs flow 또는 generated output만 바뀌는가? | generator source, guide, docs gate |

### 2단계 — owner package 선택

첫 helper를 넣기 편한 위치가 아니라 public responsibility가 바뀌는 패키지를 owner로 선택한다. 두 package
contract를 가로지르면 lower-level owner에 안정 contract를 두고 higher-level package에 최소 adapter를 둔다.
이 결정을 피하기 위해 임의의 `shared` package를 만들지 않는다.

### 3단계 — 확장 전 contract 작성

새 capability/boundary에는 stable ID, owner, scope/non-goal, dependency/export 변경, invariant 또는 schema
revision, focused test, 문서 경로, migration/removal 조건을 기록한다. 이슈·decision은
[스펙·이슈·문서 관리 컨벤션](./change-management-convention)을 사용한다.

### 4단계 — package 순서로 구현·검증

Context-Action runtime 변경:

```bash
pnpm build:core
pnpm build:react
pnpm --filter example type-check
pnpm --filter example check
pnpm example:build
```

public surface 변경이면 package export/tarball check도 추가한다.

### 5단계 — ownership graph 갱신

handoff 전에 package manifest/export, README/authoritative guide, test/fixture, policy 또는 decision,
영·한 public page, generated artifact를 순서대로 갱신한다.

## 6. 패키지 추가·병합·분리·폐기

- **추가:** ID, owner, stability, 주 책임, public/private 결정, dependency graph, export, focused test, README,
  authoritative guide, boundary policy를 갖춘다. private/experimental이면 승격 조건을 적는다.
- **병합:** release cadence, owner, dependency 방향, public contract가 같을 때만 병합한다. source/test를 함께
  옮기고 stable ID를 보존하며 old export와 migration decision을 정리한다.
- **분리:** independent release contract가 생기거나 upward dependency가 생기거나 runtime/analysis/docs가
  섞일 때 분리한다. stable contract는 lower-level package가 소유한다.
- **폐기:** README에 replacement와 removal condition을 남기고 새 cross-package consumer를 막으며 accidental
  import를 검증한다.

## 7. 코드베이스 정리 규칙

- 중복 구현은 canonical owner를 정하고 필요한 경우 re-export/migration path를 만든 뒤 제거한다.
- `utils`는 package 내부에 둔다. versioned·policy-neutral contract인 경우에만 shared extraction을 검토한다.
- 테스트는 증명하는 package와 함께 둔다. cross-package integration test는 integration host 또는 higher-level
  package에 둔다.
- runtime package에 architecture/documentation tooling을 넣지 않는다.
- ownership 판단에 `dist`나 generated API를 사용하지 말고 source package와 `exports`를 추적한다.
- package 경계를 넘는 파일 이동은 TypeScript가 통과해도 API/architecture change로 취급한다.

## 8. 리뷰 체크리스트

- [ ] owner package와 primary change class가 명시되어 있다.
- [ ] responsibility/non-goal이 README 또는 정식 guide에 있다.
- [ ] source import와 runtime/peer/dev dependency가 일치한다.
- [ ] package 간 import가 선언된 export만 사용한다.
- [ ] lower-level package가 adapter, example, generator를 import하지 않는다.
- [ ] test와 fixture가 contract 가까이에 있고 boundary regression이 필요한 경우 포함한다.
- [ ] policy, schema, decision evidence가 갱신되었다.
- [ ] public behavior라면 영·한 문서와 discovery link가 정합하다.
- [ ] generated file은 source에서 재생성했다.
- [ ] 비례하는 package/repository gate 결과를 기록했다.

## 관련 문서

- [개발 컨벤션 인덱스](./convention-index)
- [표준 구현 컨벤션](./implementation-convention)
- [스펙·이슈·문서 관리](./change-management-convention)
