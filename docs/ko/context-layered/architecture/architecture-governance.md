# 아키텍처 거버넌스와 증거

Samdocs는 명시적으로 이름을 붙인 심볼, 역할 설명, 정의 위치를 관리합니다. Context-Action은 이
관계를 작은 repository-local registry로 유지하고, SEM 구조 증거로 한 번에 수집·검증합니다.

## 기준 산출물

| 산출물 | 책임 |
| --- | --- |
| `architecture/registry.json` | capability identity(`CA-*`), owner, 정의 anchor, evidence, policy 연결 |
| `architecture/rules/*.json` | package 선언과 SEM impact 경계 |
| `architecture/contexts.json` *(planned)* | revision에 묶인 context 의도, 완전한 anchor identity, 명시적으로 선언한 의미론 edge |
| `packages/architecture-governance` | registry loader, SEM adapter, verifier, report 계약, CLI |
| Verification report | working tree, staged set, commit range별 evidence와 finding |

Registry는 파일 목록이 아닙니다. capability는 사용자가 식별하는 동작, 독립적으로 변경되는 설계 책임, 또는 지속적으로 지켜야 하는 아키텍처 경계를 나타냅니다. `verified` capability에는 spec, SEM top-level 구현 anchor, 대표 동작 테스트, 공개 문서가 현재 구현을 증명하도록 연결되어야 합니다.

### Identity vocabulary

catalog에서는 다음 세 가지 식별자를 의도적으로 분리합니다.

- `capabilityId`(`CA-*`)는 `registry.json`의 아키텍처 책임을 식별합니다.
- `SymbolRef`(`projectId`, repository-relative `filePath`, `entityId`)는 snapshot 안의 실제 코드 심볼을 식별합니다.
- `contextId`는 화면, API, transaction, workflow, document 범위의 파생 컨텍스트를 식별합니다.

`implementationAnchors`는 capability와 하나 이상의 `SymbolRef`를 연결합니다. context manifest도
동일한 `SymbolRef` 조합을 재사용하며 별도의 심볼 ID를 만들지 않습니다. 따라서 하나의 capability가
여러 구현 심볼을 가질 수 있고, 하나의 심볼이 여러 context scope에 참여할 수 있습니다.

이 도구는 architecture를 자동 추론하는 엔진이 아니라 symbol catalog gate입니다. 작성자가 symbol과
역할 주석을 선언하고, SEM은 정의 위치를 제공하며, test runner는 동작을 검증하고, 문서 시스템은
공개 설명을 소유합니다.

명령을 순서대로 실행하는 방법은 [아키텍처 거버넌스 사용 방법](./architecture-governance-usage)을
참고하세요.

## Capability lifecycle

| 상태 | 의미 | 최소 evidence |
| --- | --- | --- |
| `planned` | 의도와 owner는 정해졌지만 구현 전 | spec, owner |
| `implemented` | 대표 구현 anchor가 존재함 | spec, owner, implementation anchor |
| `verified` | 구현·동작 테스트·공개 계약이 모두 현재 상태와 일치함 | spec, owner, anchor, test, public docs |
| `deprecated` | 대체 또는 제거를 추적하는 중 | spec, owner, decision 또는 replacement |

증거보다 먼저 상태를 승격하지 않습니다. 이름만 바뀌면 capability ID를 유지하고, capability를 합치거나 나눌 때는 decision 문서에 이전·새 관계를 남깁니다.

## 검증 workflow

작업 중에는 필요한 범위만 확인하고, review 전에 전체 gate를 실행합니다.

```bash
pnpm arch:check:registry  # JSON, 경로, package 선언
pnpm arch:check:changed   # 전체 검증 + working-tree SEM diff
pnpm arch:check:staged    # 전체 검증 + staged SEM diff
pnpm arch:check           # 전체 SEM entity, impact, evidence gate
pnpm arch:type-check      # shared Foundation과 governance package type check
```

changed/staged report는 검토해야 할 문서와 테스트를 알려주는 자료이며 전체 아키텍처 gate를 대신하지 않습니다. Pull request에서는 local working tree와 무관하도록 base/head commit range report도 생성합니다. `arch:test`는 Foundation contract, repository history/worktree runtime, governance CLI test를 함께 검증합니다.

커밋별 심볼 이력은 `arch-verify history --from <ref> --to <ref>`로 생성합니다. Git first-parent
히스토리를 열거한 뒤 각 `sem diff` 결과를 파일 경로와 canonical symbol(`kind::name`) 기준의
증감으로 직렬화하고, 격리된 Git worktree에서 해당 커밋의 전체 `snapshot.symbols` 목록도 materialize합니다.
각 snapshot 항목에는 registry analysis `projectId`, 파일 경로, symbol, kind, line 범위가 포함됩니다.
registry path를 지정하면 모든 historical revision에 registry가 반드시 존재해야 합니다. registry가
없는 revision에서는 현재 worktree의 project 범위를 재사용하지 않고 fail-closed로 중단합니다.
delta는 변경 이력에, snapshot은 이후 컨텍스트 boundary와 심볼 교집합 판단에 사용합니다.

단일 revision의 전체 심볼 목록은 `snapshot`으로 저장하고, 두 전체 목록의 증감은
`snapshot-diff`로 비교합니다.

```bash
node packages/architecture-governance/dist/cli.js snapshot \
  --root . --registry architecture/registry.json \
  --commit HEAD --format json --output reports/symbol-snapshot.json

node packages/architecture-governance/dist/cli.js snapshot-diff \
  --root . --left reports/snapshot-before.json \
  --right reports/snapshot-after.json --format markdown \
  --output reports/symbol-snapshot-diff.md
```

Snapshot 계약은 `context-action/symbol-snapshot@1.1`, history는
`context-action/symbol-history-report@1.3`, snapshot 비교는
`context-action/symbol-snapshot-diff@1.0`입니다. 각 snapshot은 선언된 `analysisProjects`와
프로젝트별 `analyzed`/`skipped` provenance를 보존합니다. identity 정규화, 확장자 filter, 충돌
처리, 직렬화 상한은 [package 계약](https://github.com/mineclover/context-action/blob/main/packages/architecture-governance/README.md)이
소유합니다.

기본 상한, `contractLimits` override, history budget, `unbounded` 의미는
[package README](https://github.com/mineclover/context-action/blob/main/packages/architecture-governance/README.md)가
소유하는 runtime 계약입니다. 이 문서에서는 complete snapshot을 조용히 잘라내지 않는다는 원칙만
유지합니다.

서로 다른 컨텍스트에서 직렬화한 심볼 집합은 다음처럼 가벼운 교집합 연산으로 비교합니다.

```bash
node packages/architecture-governance/dist/cli.js intersect \
  --root . \
  --left reports/design-symbols.json \
  --right reports/architecture-symbols.json \
  --format markdown \
  --output reports/symbol-context-comparison.md
```

입력은 `{ "id": "context", "symbols": [...] }` 또는 history snapshot을 감싼
`{ "snapshot": { ... } }` 형태입니다. 심볼은 `projectId`, repository-relative `filePath`,
canonical `entityId`로 식별하고 결과는 deterministic한 `intersection`, `onlyLeft`, `onlyRight`
집합으로 출력합니다. 이 기능은 구조적 심볼 집합 연산이며 호출 그래프나 runtime data flow를
분석하지 않습니다. `history`가 만든 완전한 snapshot을 입력으로 재사용할 수 있습니다.

다음으로 계획된 파생 뷰는 `ContextScope`입니다. 첫 slice는 같은 revision의 context manifest를
읽고 완전한 snapshot 위에 제한된 하위 그래프를 만드는 screen adapter입니다. 이 slice에서 SEM은
구조적 `depends-on` 증거만 제공하며, 의미론 edge는 명시적인 manifest 선언 또는 별도의 증거 계약을
갖춘 추후 provider가 있어야 합니다. Context group은 기존 project/file/entity identity를 감싸는 겹칠
수 있는 멤버십이므로 공유 심볼의 identity를 복제하지 않습니다. 해당 CLI가 생기기 전까지
`architecture/contexts.json`은 `arch:check`의 입력이 아닙니다. [ContextScope 심볼 그래프 설계](./context-scope-graph)에서 계약,
profile 제공 범위, edge 의미, 완전성 규칙, renderer 경계를 정의합니다.

Context-Action role mapping, manifest 소유권, 계획된 `screen`/`transaction` profile은
[ContextScope 심볼 그래프 설계](./context-scope-graph)에서 한 번만 정의합니다. 이 문서는
ContextScope가 complete snapshot 위의 파생 뷰이며 CLI가 생기기 전까지 `arch:check` 입력이 아니라는
원칙만 설명합니다.

특정 project만 집중 검사할 때는 workspace package를 먼저 빌드한 뒤 CLI를 직접 실행할 수 있습니다.

```bash
pnpm arch:test
pnpm arch:check:registry
node packages/architecture-governance/dist/cli.js check \
  --root . \
  --registry architecture/registry.json \
  --project core \
  --sem
```

지원 provider identity는 `sem 0.21.0`으로 고정되어 있습니다. provider version이 다르면 자동으로
업그레이드하지 않고 검증 실패로 처리합니다.

## Samdocs 범위

기본 단위는 class, function 또는 다른 top-level entity 같은 명시적 심볼입니다. 역할 주석은 그
심볼이 왜 존재하는지 설명하고, catalog는 `SymbolRef`, 정의 위치, 구조적으로 사용하는 파일을 기록합니다. `SymbolRef`가
중복되거나 정의 위치가 모호하면 review finding으로 처리합니다. 현재 PoC에서는 역할 주석을 심볼
옆에 작성하고 registry와 함께 review하며, 자동 `@samdocs`/`@role` comment 수집은 다음 collector
단계입니다. 이것은 LSP 호출 그래프 기능과는 별개의 범위입니다.

## Gate가 검증하는 것

- capability의 spec, owner, 구현 anchor, 대표 테스트, 공개 문서 경로;
- `package.json` 선언 기반 package dependency 경계;
- SEM top-level entity identity와 source file 정의 범위;
- 각 명시적 anchor를 구조적으로 사용하는 파일을 담은 `symbolUsages[].usageFiles`;
- symbol catalog를 보호하기 위해 선택적으로 사용하는 package/impact boundary;
- working-tree, staged, commit-range 변경 범위와 binary/untracked 경로;
- console, JSON, Markdown으로 출력되는 versioned report 계약.

## Gate가 증명하지 않는 것

Samdocs는 내부 함수 호출 횟수·호출 순서·runtime data flow를 의도적으로 세지 않습니다. 이 부분은
LSP 수준의 language analysis 영역이며 현재 lightweight catalog 범위 밖입니다. SEM impact는 심볼별
`usageFiles`를 제공하지만 구조적인 파일 단위 신호일 뿐 reflection, dynamic loading, business correctness, 또는 역할 주석이
제품 의도를 올바르게 표현했는지를 증명하지 않습니다. 동작 테스트, owner review, 공개 문서를 서로
다른 evidence source로 유지해야 합니다. shared SEM 계약은 publish-ready 상태지만 registry 배포와
외부 semver 고정은 별도 release gate로 남겨둡니다. Git revision/history/worktree lifecycle과
과거 `analysisProjects` traversal은 정책 중립적인 `@sem-foundation/repository` runtime이 제공하고,
SEM 분석과 report policy는 소비자가 소유합니다.

## Report와 실패 의미

Report 계약은 `context-action/architecture-verification-report@2.4`입니다.

| 종료 코드 | 의미 |
| ---: | --- |
| `0` | 선택한 `--fail-on` threshold를 통과함 |
| `1` | architecture finding이 선택한 threshold에 도달함 |
| `2` | 입력·filesystem·SEM 실행 오류로 유효한 결과를 만들지 못함 |

SEM이 중간 project에서 실패해도 앞서 완료된 분석은 보존하고, `semFailure`에 요청·완료·미실행
project를 기록합니다. changed report는 review 범위를 좁히는 자료이지 전체 `arch:check`를 대신하지
않습니다.

## Policy와 예외

선언된 `package.json` 의존성은 package-boundary rule로, 실제 SEM 참조 방향은 impact-boundary rule로 검사합니다. 서로 다른 evidence source를 같은 의도 하나로 중복 표현하지 않습니다.

inline waiver나 경로별 ignore는 추가하지 않습니다. 임시 예외가 필요하면 이유, owner, 영향 범위, 제거 조건을 decision 문서에 기록하고 capability에서 참조하며 가장 작은 policy 범위로 제한합니다.

## 읽는 순서

1. 이 문서에서 symbol catalog 개념, 검증 경계, 최소 명령을 확인합니다.
2. capability ID, `SymbolRef` anchor 또는 역할 주석을 추가하기 전에 [`governance-guide.md`](https://github.com/mineclover/context-action/blob/main/architecture/governance-guide.md)를 읽습니다.
3. package/impact rule을 추가하기 전에 [`architecture/rules/README.md`](https://github.com/mineclover/context-action/blob/main/architecture/rules/README.md)를 읽습니다.
4. review 중에는 changed/staged/range report를 사용합니다.
5. 심볼 한계, 의도적인 LSP 경계, roadmap 판단은 [구현 review](https://github.com/mineclover/context-action/blob/main/architecture/implementation-review.md)에서 확인합니다.

기계 판독 registry와 policy는 repository의 `architecture/` 디렉터리에 있습니다. package 단위 CLI,
API, schema, artifact 계약은
[`packages/architecture-governance/README.md`](https://github.com/mineclover/context-action/blob/main/packages/architecture-governance/README.md)에 정리되어 있습니다.
