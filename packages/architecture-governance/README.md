# Context-Action Architecture Governance PoC

이 패키지는 **Context-Action repository convention을 규칙과 구조 evidence로 실행해보는 실험적 PoC**다.
작성자가 선언한 capability, owner, role, implementation anchor와 policy를 SEM/Git evidence에 연결해
검증하고, revision별 complete symbol snapshot과 review report를 만든다. 범용 architecture inference
engine이나 문서 편집·생성기라기보다 이 repository의 architecture/document evidence 관리 규칙을
시험하는 control-plane 도구다.

Authored symbol registry와 `sem` entity/impact 결과를 연결해 심볼의 정의 위치와 사용 파일을 수집·검증하는
Architecture Governance 도구다. 심볼의 역할은 registry `role` declaration과 source comment/JSDoc로 관리하며, 컴파일러 graph
provider나 LSP 수준의 내부 함수 호출 분석·문서 생성 기능은 포함하지 않는다.

공통 SEM identity/path/provenance와 `AnalysisProject` 계약은 [`@context-action/sem-foundation-contracts`](https://github.com/mineclover/context-action-documentation-tooling/tree/main/packages/sem-foundation-contracts)
에서 관리하고, Git revision/history/worktree lifecycle은 [`@context-action/sem-foundation-repository`](https://github.com/mineclover/context-action-documentation-tooling/tree/main/packages/sem-foundation-repository)에서
관리한다. 외부 SEM subprocess의 실행 adapter와 architecture policy의 loader/evaluator/report
contract는 이 패키지가 소유하지만, 실제 authored registry와 policy source는 repository의
`architecture/` 디렉터리가 소유한다.
`@context-action/sem-doc`도 같은 Foundation contracts/repository runtime을 필수 dependency로
소비하지만, 이 패키지와 서로 독립된 계약과 목적을 가진다.

`@context-action/sem-doc`은 작업 전 문서·Git 컨텍스트를 만드는 별도 도구다. 이 패키지는
`architecture/registry.json`, policy, complete snapshot과 CI/reviewer용 verification을 소유한다.
두 패키지는 같은 SEM/Foundation primitive을 사용할 수 있으나 runtime 의존성이나 report 계약을
공유하지 않는다. 자세한 비교는 [sem-doc과 Architecture Governance 경계](../../docs/en/context-layered/architecture/sem-doc-architecture-governance-boundary.md)를 따른다.

`@context-action/sem-doc`은 `context-action-documentation-tooling`이 소유하는 별도 published
패키지다. Architecture Governance는 sem-doc report를 소비하지 않으며, Foundation primitive만
versioned runtime dependency로 사용한다.

Architecture Governance의 Foundation dependency 준비 단계는 설치된 published package를
검증한다. 이 consumer repository에는 Foundation/sem-doc migration copy가 없다.

## 검증 범위

- stable symbol/capability의 spec, owner, authored `role`, 구현 anchor, test evidence, public docs 경로
- `package.json` 선언 기반 package dependency boundary
- `sem entities` 기반 `path::type::name` 구현 anchor 및 정의 위치
- 명시적 anchor별 `sem impact` dependents의 중복 제거 `usageFiles`
- policy source entity의 `sem impact` dependencies 기반 선택적 architecture boundary

`sem`은 심볼의 구조적 정의 위치와 top-level 사용 entity 파일 증거를 제공한다. complete snapshot entry 변환은
`@context-action/sem-foundation-contracts`의 `createSymbolSnapshotEntry`를 사용하므로 sem-doc과 symbol identity/range
직렬화 규칙을 중복 소유하지 않는다. 테스트 성공 여부는 기존 test runner가,
역할 설명과 symbol identity는 authored registry/comment가 소유한다. 내부 함수 호출을 세거나
호출 순서를 추론하지 않는 것이 의도된 범위다. symbol 생성·상태 승격·예외 처리와 PR review 절차는
[`architecture/governance-guide.md`](https://github.com/mineclover/context-action/blob/main/architecture/governance-guide.md)를 따른다.

JSON/Markdown report의 `symbolUsages`는 각 명시적 anchor에 대한 `definition`과 중복 제거된
`usageFiles`를 제공한다. `usageFiles`는 SEM `dependents`의 파일 목록이며 identifier별 정확한
reference나 runtime call graph가 아니다.

## 문서 구조

- 이 README의 `실행`은 package consumer가 바로 따라 할 CLI와 change scope를 설명한다.
- 처음 사용하는 순서와 대표 명령 조합은 [Architecture Governance Usage](../../docs/en/context-layered/architecture/architecture-governance-usage.md)와 [한국어 사용 방법](../../docs/ko/context-layered/architecture/architecture-governance-usage.md)을 따른다.
- 아래 `Advanced` 섹션은 maintainer가 필요한 경우에만 읽는 SEM budget, filesystem 신뢰 경계, preflight 세부사항이다.
- `공개 계약`은 SEM entity/impact 의미, report 2.4, JSON Schema와 package export 계약을 설명한다.
- capability authoring과 lifecycle은 repository의 [`architecture/governance-guide.md`](https://github.com/mineclover/context-action/blob/main/architecture/governance-guide.md),
  구현 범위와 현재 한계는 [`architecture/implementation-review.md`](https://github.com/mineclover/context-action/blob/main/architecture/implementation-review.md)에서 관리한다.
- capability ID(`CA-*`), symbol identity(`SymbolRef`), context ID(`contextId`)는 서로 다른 계층이며,
  ContextScope와 Context-Action layer mapping은 공개 [ContextScope 설계](../../docs/en/context-layered/architecture/context-scope-graph.md)에서 관리한다.
- revision-bound manifest와 complete snapshot을 조합하는 `context-scope` command는 별도 derived view이며,
  manifest는 `arch:check` capability 입력이 아니다.

이 도구는 Context-Action convention으로 작성한 authored intent를 SEM evidence로 검증하는 gate다.
따라서 runtime data flow, business correctness, owner 승인, 문서 편집·생성 자체를 자동 증명하지
않는다. 이 범위를 generic architecture standard로 해석하거나 sem-doc의 work-context report로
대체해서도 안 된다. shared SEM contract와 sem-doc은
`context-action-documentation-tooling`에서 versioned published package로 관리하며, 이 패키지는
설치된 Foundation version을 명시적으로 고정한다.

## Position and non-goals

- **Position**: Context-Action convention 기반의 실험적 규칙형 architecture/document evidence governance
- **Authored source**: repository-local `architecture/registry.json`, `architecture/rules/*.json`, guide와 decision 문서
- **Runtime role**: authored source를 읽고 SEM/Git evidence를 결합해 gate, snapshot, history, scope artifact를 생성
- **Not a document editor**: Markdown/API 문서를 작성·동기화하거나 TypeDoc을 대체하지 않음
- **Not a language graph**: 내부 함수 호출, 정확한 reference 위치, runtime flow는 LSP/compiler graph의 별도 책임
- **Not a generic policy**: 다른 저장소에 그대로 적용되는 표준을 자동 추론하지 않으며, convention 변경은 authored source와 decision으로 관리

## 실행

```bash
pnpm arch:check
pnpm arch:check:changed
pnpm arch:check:staged
pnpm arch:check:registry
pnpm arch:type-check
pnpm arch:test
```

### ContextScope 실행

먼저 `snapshot`으로 complete inventory를 만들고, 같은 revision을 선언한 context manifest를 준비한다.
그 다음 `context-scope`가 anchor와 declared edge를 검증해 JSON/Markdown/console scope artifact를 만든다.
SEM `depends-on` 투영은 `createContextScope({ semAnalyses })` library API에서 추가할 수 있다.

```bash
node packages/architecture-governance/dist/cli.js context-scope \
  --root . \
  --snapshot reports/symbol-snapshot.json \
  --manifest architecture/contexts.json \
  --context dashboard \
  --format json \
  --output reports/dashboard-context-scope.json
```

package build의 `postbuild`는 `npm pack --dry-run` 결과에서 root ESM/type export, 여섯 JSON Schema,
실행 가능한 `arch-verify` bin이 실제 artifact에 포함되는지 확인한다. 이어 root module import,
schema JSON parse, CLI help smoke test까지 수행하므로 workspace에서만 우연히 해석되는 누락을
CI build 단계에서 차단한다.
`@ataraxy-labs/sem`은 CLI의 runtime dependency로 고정한다. 기본 command resolution은 package-local
`node_modules/.bin`부터 상위 install root까지 최대 32단계를 탐색하므로 pnpm의 isolated layout과
npm의 hoisted layout을 모두 지원하며, 어떤 위치에서도 실행 version은 `sem 0.21.0` gate를 통과해야 한다.

`arch:check`는 workspace에 고정된 `@ataraxy-labs/sem` CLI를 실행한다.
`arch:check:changed`는 `sem diff`에서 변경 entity와 binary file에 직접 연결된 capability 범위를
보고서에 추가한다. `sem diff`가 제외하는 untracked 파일은 Git 목록으로 보완하며 registry 또는 policy
변경은 모든 capability에 영향을 준 것으로 처리한다. 전체 검증 자체는 유지하므로 변경 감지가
validation gate를 우회하지 않는다. 보고서는 영향 capability뿐 아니라 검토할 spec/public docs와
실행할 test evidence를 함께 출력한다. Git 보완 subprocess도 SEM과 같은 timeout/output limit을
적용하며 실패하면 완료된 project 분석을 보존한 구조화 report를 생성한다.
authored evidence와 registry/policy control path는 slash와 `.`/`..` segment를 정규화한 의미로
변경 파일과 비교하므로 서로 동등한 경로 표기가 영향 범위를 누락하지 않는다.
직접 전달한 `semChanges`도 source mode/range shape, entity ID/file identity, normalized
repository-relative current/old/binary/untracked path를 adapter와 같은 규칙으로 검증한다. 무효 change
evidence는 `SEM_CHANGE_EVIDENCE_INVALID` 오류를 남기고 report의 change scope에서 제외한다.
semantic changes, binary changes, untracked files는 합산 최대 65,536개만 허용한다. direct input과
provider diff, Git untracked 보완 모두 같은 aggregate budget을 사용하며 중복·경로 순회 전에 초과를
차단한다.

`analysisProjects.fileExtensions`를 지정하면 해당 project의 SEM entity 수집만 지정 확장자로
제한할 수 있다. 예를 들어 governance package처럼 JSON Schema와 소스가 함께 있는 경우에는
`.ts`, `.tsx`, `.js`, `.mjs`, `.cjs`를 지정해 설정 파일의 비정의 항목을 심볼 목록에 섞지 않는다.
확장자는 1~32개의 dot-prefixed 값(각 최대 64자)만 허용하며, 대소문자와 입력 순서는 정규화된다. 직접 API에
잘못된 값이 들어오면 subprocess를 실행하기 전에 `InputContractError`로 거부한다.

PR이나 CI처럼 clean checkout에서 재현 가능한 범위를 사용하려면 commit range를 명시한다.

```bash
node packages/architecture-governance/dist/cli.js check \
  --root . \
  --registry architecture/registry.json \
  --sem \
  --from <base-sha> \
  --to <head-sha> \
  --format markdown
```

`--staged`는 index에 올라간 변경만 분석한다. `--staged`와 range는 함께 사용할 수 없고,
`--from`과 `--to`는 항상 쌍으로 제공해야 한다.
PR CI의 report 생성과 artifact 업로드 단계는 `always()`로 실행한다. 따라서 선행 repository
검증이 실패해도 아키텍처 분석을 시도하며, build 또는 정책 검증의 원래 exit code를 보존한다.
생성된 Markdown report는 job summary에 기록하고 7일 보존 artifact로도 업로드한다. build가
실패해 report를 만들 수 없는 경우에는 그 사실과 종료 코드를 job summary에 남긴다.
모든 CI event가 실행하는 root `verify:all`에는 전체 `arch:check`가 포함된다. PR range report는
전체 gate를 대체하지 않고 변경 영향 capability와 검토할 문서·테스트 evidence를 추가한다.
`arch:check:registry`는 sem command와 impact policy 평가를 모두 생략하고 registry, 경로,
package policy만 빠르게 검사한다. impact rule의 `missingEvidenceSeverity: "error"`도 이 명령을
실패시키지 않으며, 전체 `arch:check`에서는 동일 rule을 계속 fail-closed로 평가한다.

### CLI 직접 실행과 입력 계약

직접 CLI를 실행할 수도 있다.

```bash
node packages/architecture-governance/dist/cli.js check \
  --root . \
  --registry architecture/registry.json \
  --sem
```

외부 binary를 사용하려면 `SEM_COMMAND` 또는 `--sem-command`로 지정한다. 현재 지원 버전은
workspace dependency와 동일한 `0.21.0` 하나이며 다른 버전은 entity 분석 전에 구조화된
`invalid-output` 실패로 거부한다. `--project core`처럼 특정 analysis project만 선택할 수 있다.
direct verifier는 `semVersion`을 생략한 기존 in-memory 호출은 허용하지만, 값을 명시하면 정확히
`sem 0.21.0`이어야 한다. 불일치 version과 함께 주입된 analyses/changes는 summary, policy evidence,
change scope에서 모두 제외하고 `SEM_VERSION_EVIDENCE_INVALID`로 실패한다.
빈 `SEM_COMMAND` 환경 변수는 미설정으로 취급해 pinned workspace binary를 사용한다. 직접 API의
명시적 빈 command와 command/range ref의 NUL byte는 subprocess 호출 전에 입력 오류로 거부한다.
`--sem`을 사용하지 않는 검사는 `SEM_COMMAND`를 읽거나 검증하지 않으므로 비활성 semantic provider
설정이 문서·경로·package policy 검사에 영향을 주지 않는다.
`--project`는 서로 다른 ID에 한해 반복할 수 있다. `--root`, `--registry`, range ref, limit, format,
output 등 단일 값 옵션을 반복하면 마지막 값으로 덮어쓰지 않고 입력 오류(exit 2)로 거부한다.

커밋별 심볼 이력은 Git first-parent history와 SEM을 결합해 추출한다.

```bash
node packages/architecture-governance/dist/cli.js history \
  --root . \
  --from HEAD~20 \
  --to HEAD \
  --format json \
  --output reports/symbol-history.json
```

history report의 각 commit에는 `added`, `modified`, `deleted`, `moved`, `renamed`, `reordered`
중 하나의 `changeType`과 `filePath`, canonical `symbol`(`kind::name` suffix)이 기록된다. 동시에
해당 commit을 임시 Git worktree에서 checkout하고 SEM entities를 다시 실행해 `snapshot.symbols`에
그 시점의 완전한 심볼 목록을 materialize한다. 따라서 delta는 변경 이력·요약에 사용하고,
snapshot은 `projectId`, 파일 경로, canonical symbol, kind, line 범위를 가지므로 이후 컨텍스트
boundary와 심볼 교집합 계산의 기준으로 사용할 수 있다. merge commit은 first-parent 기준으로
처리한다. 내부 함수 호출 횟수나 runtime graph는 포함하지 않는다.

이력 report contract는 `context-action/symbol-history-report@1.3`이며, 각 commit의 snapshot은
`context-action/symbol-snapshot@1.1` 전체 문서를 포함한다. snapshot에는 선언된 각
`analysisProjects`가 해당 revision에서 분석되었는지(`analyzed`) 또는 경로가 없어 건너뛰었는지
(`skipped`, `missing-at-revision`)가 함께 기록된다.
`--registry`를 사용한 history/snapshot은 해당 registry가 각 historical revision에 있어야 하며,
없으면 현재 project 목록으로 대체하지 않고 오류로 중단한다. `fileExtensions`가 지정된 경우
SEM 출력도 해당 확장자를 벗어나지 않는지 검증한다. 중첩 entity가 같은 parent-scoped name을
공유하더라도 kind가 다르면 `parent::type::Scene`, `parent::variable::Scene`처럼 kind-qualified
ID로 정규화해 두 정의를 모두 보존한다. 정규화 이후 정확히 같은
`projectId/filePath/entityId`가 충돌할 때만 완전한 snapshot을 보장할 수 없으므로 오류를 반환한다.

기본 cardinality는 Foundation 계약을 따르지만, 신뢰할 수 있는 대규모 분석 호출자는 API의
`contractLimits`로 `maxAnalysisProjects`, `maxAnalysisProjectFileExtensions`,
`maxAnalysisProjectFileExtensionChars`, `maxSymbolSnapshotEntries`를 명시적으로 높일 수 있다.
`parseArchitectureRegistry`/`loadArchitectureRegistry`에도 같은 제한 객체를 전달할 수 있으므로,
CLI가 registry를 먼저 읽는 단계에서도 override가 적용된다.
CLI에서는 `--max-analysis-projects`, `--max-project-file-extensions`,
`--max-project-file-extension-chars`, `--max-snapshot-symbols`를 사용한다. history의 commit/change
상한은 각각 `--max-history-commits`, `--max-history-changes` 또는 `maxCommits`/`maxChanges`로
조정한다. CLI의 `unbounded` 값은 JavaScript safe-integer ceiling으로 매핑된다. 이 값들은 운영자가 선택한 resource budget과 함께 사용해야 하며, 기본 상한을 넘기면
분석 비용과 report 크기도 함께 증가한다.

history는 commit별 snapshot을 완전한 목록으로 materialize하며 초과 결과를 부분 목록으로
반환하지 않는다. 단일 snapshot은 65,536개 심볼까지 허용하고, history 전체의 SEM subprocess
payload는 기존 aggregate output budget(기본 64 MiB, SEM limit으로 조정 가능)이 담당한다.
따라서 별도의 aggregate snapshot-symbol count cap은 두지 않는다. 512개 commit과 65,536개
change 상한은 독립적인 history 안전 상한이다.

단일 revision만 저장할 때는 `snapshot`을 사용한다.

```bash
node packages/architecture-governance/dist/cli.js snapshot \
  --root . --registry architecture/registry.json \
  --format json --output reports/symbol-snapshot.json

node packages/architecture-governance/dist/cli.js snapshot \
  --root . --registry architecture/registry.json \
  --commit HEAD~1 --format json --output reports/symbol-snapshot-head-1.json
```

`snapshot` 결과는 `context-action/symbol-snapshot@1.1` 계약이다. `revision`,
`analysisProjects`, 프로젝트 분석 상태, 전체 `symbols`가 함께 저장되며 `intersect` 입력으로
재사용할 수 있다. 두 snapshot의 정의 집합을 비교하려면 다음 명령을 사용한다.

```bash
node packages/architecture-governance/dist/cli.js snapshot-diff \
  --root . --left reports/snapshot-before.json --right reports/snapshot-after.json \
  --format json
```

`snapshot-diff`는 LSP 호출 그래프가 아니라 `projectId/filePath/entityId` 안정 키를 기준으로
추가·삭제·변경을 분리하며 `context-action/symbol-snapshot-diff@1.0` report를 반환한다.

서로 다른 문서·컨텍스트에서 만든 직렬화 심볼 목록은 project/file/entity identity를 기준으로
교집합을 계산할 수 있다.

```bash
node packages/architecture-governance/dist/cli.js intersect \
  --root . \
  --left reports/design-symbols.json \
  --right reports/architecture-symbols.json \
  --format markdown \
  --output reports/symbol-context-comparison.md
```

입력은 `{ "id": "context", "symbols": [...] }` 또는 history snapshot을 감싼
`{ "snapshot": { ... } }` 형태다. 각 symbol은 `projectId`, repository-relative `filePath`,
canonical `entityId`, 표시용 `symbol`, `kind`를 갖고, 결과는 `intersection`, `onlyLeft`,
`onlyRight`를 deterministic order로 반환한다. 이 비교는 정의된 심볼의 구조적 경계만 다루며
호출 횟수·runtime data flow를 해석하지 않는다. `history`가 생성하는 완전한 commit snapshot을
이 입력으로 재사용할 수 있다.

### Advanced: SEM 실행 budget과 실패 report

각 SEM command는 기본적으로 120초와 64MiB 출력 한도를 가진다. 출력 한도는 성공한 command의
stdout과 stderr를 합친 byte 수에 적용하며, subprocess runtime이 스트림별로만 제한하는 경우에도
adapter가 합산값을 다시 검사한다. 한 project에서 여러 impact
command를 실행할 때는 전체 실행에도 같은 120초 deadline을, 응답의 누적 byte에도 같은 64MiB
한도를 적용한다. 따라서 최대 256개 query가 각각 개별 한도 이하더라도 전체 시간과 보존되는
impact evidence가 무제한 커질 수 없다. 큰 repository에서는 CLI나 환경 변수로 command와 project
impact 한도를 함께 명시적으로 조정한다.

```bash
arch-verify check --sem \
  --sem-timeout-ms 300000 \
  --sem-max-output-bytes 134217728

# 같은 설정의 환경 변수
SEM_TIMEOUT_MS=300000 SEM_MAX_OUTPUT_BYTES=134217728 pnpm arch:check
```

direct `resolveSemExecutionLimits` options의 `timeoutMs`와 `maxOutputBytes`는 실제 number만 허용한다.
문자열 숫자는 `SEM_TIMEOUT_MS`와 `SEM_MAX_OUTPUT_BYTES` 환경 변수에서만 허용해 설정 출처를
혼동하지 않는다. CLI와 환경 변수 값은 leading zero, 부호, 지수, 16진 표기 없이 `[1-9][0-9]*`
형태의 canonical base-10 safe integer여야 한다.

timeout은 read-only 분석 subprocess를 `SIGKILL`로 종료한다. 공통 JSON adapter가 subprocess,
output budget 반영, JSON parsing과 provider별 검증 전체를 단일 command deadline으로 묶는다.
version도 정상 응답의 trim과 지원 버전 확인이 끝난 뒤 deadline을 재검사한다.
`sem --version` stdout은 generic subprocess 한도와 별도로 4,096자로 제한하고 trim·정규식·실패
provenance 생성 전에 초과를 거부한다.
impact pattern은 entities subprocess 전에 검증하고 target 선택은 entities parser 안에서 수행한다.
impact query는 project deadline에서
이미 사용한 시간을 빼고 남은 시간만 다음 subprocess timeout으로 받는다. 누적 시간이 끝나면
다음 query를 실행하지 않거나 실행 중 query를 종료하고 `operation: impact`, `reason: timeout`과
전체 budget 진단을 남긴다. 마지막 query도 JSON parsing, evidence budget 계산, 파일 identity 검증이
끝난 뒤 deadline을 다시 확인하며 초과 결과를 반환하지 않는다. CLI의 `sem --version`, 모든 analysis project, `sem diff`, working-tree의
Git untracked scan도 하나의 timeout을 공유해 앞 단계가 사용한 시간을 다음 subprocess에서 차감하며,
초과 결과는 report에 채택하지 않는다. timeout, output limit, spawn,
non-zero exit, invalid JSON/output은 모두 `SEM_EXECUTION_FAILED` finding과 `semFailure`
provenance로 report에 기록한다. 여러 project를 순서대로 분석하다 실패하면 이미 완료된
`semAnalyses`는 보존하고 `requestedProjects`, `completedProjects`, `skippedProjects`로 진행 상태를
남긴다. 실패한 project는 `projectId`에 기록되며 이후 project는 실행하지 않는다. stderr는 Unicode
최악 크기를 고려한 bounded byte prefix만 디코딩한 뒤 최대 4,096자로 제한한다. command, args, project 진행 정보, version, detail 등 나머지 문자열 provenance도
항목당 4,096자와 truncation marker로 제한한다. working-tree의 Git untracked scan 실패도 `operation: diff`, `command: git`으로
같은 실패 계약을 사용한다.
Node가 `spawnSync` 호출 자체에서 동기 예외를 던지는 경우도 구조화된 `spawn` 실패로 변환한다.

impact boundary pattern이 선택할 수 있는 top-level entity는 project당 최대 256개다. entities
응답을 검증한 뒤 전체 target 수를 먼저 계산하고, 한도를 넘으면 impact subprocess를 하나도
실행하지 않는다. 이 경우 `operation: impact`, `reason: query-limit`의 구조화된 실패와
`impactTargets`/`maxImpactQueries` 수치를 남긴다. 광범위한 `**`가 우발적으로 수천 개의 subprocess를 만드는 대신 `from` pattern을
더 작은 architecture boundary로 좁히도록 강제하는 고정 안전 한도다.
각 impact의 stdout+stderr byte는 개별 `maxOutputBytes` 경계 안에서 project 누적 byte budget에도
반영한다.
누적값이 같은 한도를 넘으면 해당 query를 JSON parsing과 evidence 보존 전에 중단하고
`operation: impact`, `reason: output-limit` 및 누적 byte 진단을 남긴다. entities와 impact를 포함한
version, 모든 analysis project, diff, Git untracked scan의 stdout+stderr도 같은 global byte budget을 공유하며
한도를 넘긴 단계의 결과는 보존하지 않는다. direct `runSemDiff()`도 SEM diff와 Git scan에 하나의
시간·출력 budget을 적용한다.
`history`도 version, commit별 diff, worktree의 analysisProjects snapshot 전체에 하나의 aggregate
timeout/output budget을 적용하므로 commit 수가 늘어날수록 subprocess 한도가 누적되지 않는다.
수집된 evidence를 policy에 적용하는 단계도 verifier 전체에서 16,384 operation budget을 공유한다.
rule, analysis, impact source, dependency relation 평가가 이 한도를 넘으면 남은 impact policy 평가를
중단하고 error `SEM_IMPACT_EVALUATION_LIMIT_EXCEEDED`를 남긴다. 따라서 query 수가 적더라도 하나의
impact 응답에 대량 relation이 있거나 여러 policy가 같은 graph를 반복 탐색해 CPU와 finding을
증폭시키는 경로가 fail-closed로 종료된다.

### Advanced: Filesystem·evidence 신뢰 경계

registry, policy, analysis project, report output은 모두 `--root` 내부 경로여야 한다. project
경로는 `sem` 실행 전에 검증하므로 잘못된 registry가 repository 밖을 분석하지 않는다.
검사는 lexical `..`뿐 아니라 `realpath` 기준 symbolic link 대상까지 확인한다. capability evidence와
package policy 입력도 repository 밖으로 연결된 symlink를 유효한 경로로 인정하지 않는다.
이 경계는 CLI 전용 사전검사가 아니다. `runSemVersion`, `runSemDiff`,
`runSemProjectAnalysis`를 직접 호출해도 repository root를 실제 directory로 고정하고 project root를
SEM 실행 전에 검증한다. SEM에는 선언된 symlink 문자열이 아니라 검증된 project의 canonical
repository-relative 경로를 전달한다. entities/impact가 반환한 file은 실제 regular file이어야 하며
symlink의 최종 대상도 repository와 선택 project 경계 안에 있어야 한다.
직접 `runSemDiff`를 호출할 때도 `from`/`to`는 함께 제공해야 하며 staged와 range를 결합할 수
없다. 빈 ref, NUL, malformed Unicode, invisible text, 4,096자 초과 ref와 boolean이 아닌 staged 값은
subprocess 실행 전에 입력 오류로 거부한다. CLI도 같은 ref 계약을 argument parsing 시점에 적용해
registry load나 SEM version/project 분석 전에 중단한다.
직접 `verifyArchitecture`를 호출하는 경우에도 analysis project root는 실제 directory여야 한다.
capability와 package/impact policy의 project scope는 canonical repository-relative project root로
비교하므로 내부 symlink project도 SEM adapter와 동일한 identity를 사용한다. 비교 전에 slash와
`.`/`..` segment를 정규화해 `packages/core/../react`가 문자열 prefix만으로 core scope를
통과하지 못하게 한다.
직접 전달한 `semAnalyses`도 entity shape/line/path/ID, top-level uniqueness, impact target과 관련
entity identity, non-negative duration을 adapter와 같은 규칙으로 재검증한다. malformed 또는
fabricated analysis는 report의 SEM summary와 capability/policy evidence에서 제외하고
`SEM_ANALYSIS_EVIDENCE_INVALID`로 남겨 missing-evidence gate가 fail-closed로 동작하게 한다.
한 project의 normalized SEM evidence는 entities, impacts, dependencies, dependents, tests를 합산해
최대 65,536개 항목만 허용하고 impact collection은 기존 query fan-out 계약과 같은 256개로
제한한다. `parseSemEntities`, `parseSemImpact`, direct integrity assertion과 subprocess adapter가
같은 cardinality 계약을 사용한다. 초과 provider output은 `invalid-output`, direct verifier 입력은
`SEM_ANALYSIS_EVIDENCE_INVALID`로 분류하며 model/file 순회 전에 차단한다.
여러 project의 normalized evidence도 같은 65,536개 global budget을 공유한다. direct collection은
개별 model 순회 전에 `SEM_ANALYSES_EVIDENCE_LIMIT_EXCEEDED`로 격리하고, CLI는 한도를 넘기는 다음
project를 report에 채택하기 전에 구조화된 `invalid-output`으로 중단해 완료 project만 보존한다.
정규화되어 report에 보존되는 SEM evidence 문자열은 항목당 4,096자, analysis collection 전체는
8,388,608자로 제한한다.
provider parser와 project impact adapter, direct integrity/verifier, CLI project adoption이 같은
text budget을 적용하므로
작은 개수의 비정상적으로 긴 문자열이나 여러 project의 문자열 누적도 report 구성 전에 차단한다.
text budget은 정규화 model의 알려진 evidence field만 스키마 기반으로 순회한다. 따라서 provider가
반환하지만 report에 보존하지 않는 source content나 임의 확장 field는 subprocess output byte budget으로
관리하고, direct input의 임의 object graph를 예산 계산 과정에서 확장하지 않는다. 보존 field는 길이와
함께 NUL, well-formed Unicode를 검사하며 project ID와 range ref는 visible text도 요구한다.
유효 analysis의 top-level entity ID는 project별 count와 전체 count로 한 번 index한다. 따라서 구현
anchor 검증은 anchor마다 entity 전체를 다시 순회하지 않고 entity+anchor 수에 선형으로 동작하며,
project 미지정 capability에서 같은 ID가 여러 project에 존재하는 ambiguity도 count로 보존한다.
report의 capability별 finding 수 역시 capability마다 전체 finding을 재검색하지 않는다. direct
capability count, rule count, capability+rule overlap을 한 번 index한 뒤 capability rule reference만
합산하므로 집계 비용은 finding+rule reference 수에 선형이고, capability와 rule이 함께 붙은 finding도
중복 계산하지 않는다.
change scope도 각 변경 file의 repository-relative ancestor prefix를 한 번 index한다. capability마다
전체 changed file을 다시 비교하지 않고 evidence path를 index에서 조회하므로 scope 계산은 changed
path segment+capability evidence path 수에 선형이며, directory evidence와 repository root evidence의
기존 포함 의미를 유지한다.
direct verifier의 `registryPath`는 in-memory registry의 provenance로 존재하지 않는 file도 표현할 수
있지만 repository 경계 밖을 가리킬 수는 없다. repository root 자체는 report에서 빈 문자열이 아닌
`.`으로 canonicalize하여 verification-report schema의 non-empty path 계약을 유지한다.
`verifyArchitecture`의 options와 `root`/`registryPath`는 report를 구성하기 위한 선행 provenance이므로
object와 visible text가 있는 non-empty string을 요구한다. 공백·제어·format 문자만 있는 값이나 잘못된
runtime 타입을 현재 directory로 암묵 변환하지 않고 `InputContractError`로 조기 거부한다. exported path helper도 root/candidate/label, boolean
`allowAbsolute`, file/directory `expectedType`에 같은 계약을 적용해 Node path API의 raw `TypeError`를
노출하지 않는다. path 문자열은 well-formed Unicode여야 하고 NUL을 포함할 수 없다.
options 최상위도 exact field shape를 요구한다. `failOnn` 같은 오타를 무시하고 기본 `error` gate로
완화하지 않으며, 미지원 field는 filesystem/SEM 실행 전에 `InputContractError`로 거부한다.
existing/input/output을 다루는 async path helper는 repository root를 먼저 canonicalize한다. 따라서
root가 내부 symlink나 OS alias(`/var`/`/private/var`)로 표현되어도 상대 경로는 같은 canonical
repository identity로 해석한다. authored root와 canonical root 중 어느 표기의 absolute path든
realpath containment를 통과해야 하며, 실제 외부 symlink는 계속 거부한다.
`requireExistingRepositoryPath`는 검증한 `realpath` target 자체를 반환하고 CLI의 registry/policy
loader도 그 경로를 열기 때문에,
containment 검사 후 authored symlink를 다시 따라가며 다른 파일을 읽지 않는다.
`readBoundedJsonFile`, `resolveSemExecutionLimits`, SEM integrity assertion과 direct SEM runner도
options object, 알려진 field, path/project/change source 타입을 subprocess 또는 filesystem 호출 전에
검증한다. `parseSemDiff`의 source 역시 working/staged/range exact shape만 허용하므로 TypeScript 타입을
우회한 direct API 입력이 raw property `TypeError`나 schema-invalid evidence를 만들지 않는다.
가벼운 직접 parser는 summary가 없는 최소 diff도 허용하지만, subprocess provider 경로는 SEM 0.21의
전체 `summary`, `changes`, `binaryChanges` envelope를 요구한다. `changes` 길이는 `summary.total`과,
`modified`를 제외한 실제 change type 개수는 대응 summary와 일치해야 한다. SEM 0.21의
`summary.modified`와 `summary.fileCount`는 structural change를 포함하거나 current path를 덜 세는
표시용 집계여서 entity evidence의 lossless projection이 아니다. 두 값은 non-negative provider
metadata로만 검증하고, 변경 근거와 집계는 typed `changes`/`binaryChanges` 배열에서 계산한다. 그 밖의
count 불일치는 `invalid-output`이다. binary 개수도 `summary.binary`와 일치해야 한다. `summary.orphan`은
필수 `entityType`이 `orphan`인 change 개수와 일치해야 한다. entity ID, binary path, untracked path의
중복과 semantic/binary/untracked 집합 간 충돌도 거부한다. 따라서 잘린 JSON이나 내부적으로 모순된
provider 출력은 change evidence로 채택되지 않는다. 세 change evidence collection의 합계도
65,536개로 제한하며, working mode에서 Git으로 추가한 raw untracked 항목까지 이 합계에 포함한다.
change set 문자열도 항목당 4,096자와 전체 8,388,608자 제한을 공유한다.
working mode에서 Git untracked evidence를 합친 뒤 전체 text budget을 다시 검사하므로 SEM diff와 Git
출력이 각각 한도 이하여도 결합 결과가 한도를 넘으면 `command: git`의 `invalid-output`으로 중단한다.
direct verifier가 runtime에서 받은 `failOn`이 error/warning/info가 아니면 report 2.4를 깨는 값을
그대로 내보내지 않고 `error`로 정규화해 `FAIL_THRESHOLD_INVALID`로 실패한다. registry와 policy의
`schemaVersion`도 각각 1만 허용하며 incompatible policy set은 평가하지 않는다. 따라서 TypeScript
타입을 우회한 discriminator가 pass-open 동작이나 schema-invalid report를 만들 수 없다.
capability `status`가 planned/implemented/verified/deprecated 밖이면
`CAPABILITY_STATUS_INVALID`로 실패하고 report 표현은 `planned`로 정규화한다. package/impact policy의
`severity`와 impact `missingEvidenceSeverity`가 error/warning/info 밖이면 오류를 남긴 뒤 해당 규칙을
평가에서 격리하므로 finding enum과 gate count도 report 2.4 계약을 유지한다.
file loader와 direct verifier는 각각 `parseArchitectureRegistry`, `parseArchitecturePolicySet`이라는
동일한 in-memory parser를 사용한다. 두 public parser는 arbitrary getter나 Proxy trap이 던진 값을
강제로 문자열화하지 않고 bounded `InputContractError`로 정규화한다. TypeScript 타입을 우회해
capability evidence, policy rule,
collection shape가 깨져도 `REGISTRY_INPUT_INVALID`, `POLICY_INPUT_INVALID`,
`POLICIES_INPUT_INVALID`, `SEM_ANALYSES_INPUT_INVALID` finding으로 변환하고 안전한 입력만 평가한다.
`evaluateImpactPolicies`가 boolean이 아니면 `IMPACT_POLICY_EVALUATION_INVALID`로 실패하면서 impact
평가는 계속 수행해 잘못된 discriminator가 정책 검사를 끄지 못하게 한다. 이 오류 report도 2.4
schema를 만족하며 verifier는 raw `TypeError`로 종료하지 않는다.
spec, implementation anchor, test evidence, public docs, decision은 실제 file이어야 하며 directory
존재만으로는 추적 evidence로 인정하지 않는다. owner는 package directory와 단일 file을 모두
표현할 수 있어 두 형식을 허용한다.
registry와 각 policy JSON은 파일당 최대 4MiB, package manifest는 1MiB까지만 읽고 fatal UTF-8
decoding을 통과해야 한다. bounded JSON reader는 open 전에 path target이 regular file인지 확인하고,
descriptor를 non-blocking으로 연 뒤 `fstat`으로 다시 확인한다. 따라서 FIFO/device는 열기 전에
거부하고 검사 직후 FIFO로 교체되어도 writer를 기다리지 않으며, non-regular stream을 읽지 않는다.
JSON decode 뒤의 모든 registry/policy 문자열도 well-formed Unicode여야
하고 NUL을 포함할 수 없다. 따라서 byte stream이 유효해도 `"\ud800"`이나 `"\u0000"` escape로
문자열 계약을 우회할 수 없다. authored 문자열은 항목당 4,096자, registry 또는 policy set 전체
합산 4,194,304자로 제한한다. 같은 제한을 direct parser에도 적용해 file byte 경계를 우회한 긴 ID나
path가 최종 report 계약을 깨지 않고 `REGISTRY_INPUT_INVALID`/policy input finding으로 격리된다.
package manifest root와 검사 대상 dependency field는 object여야 하며
dependency version은 비어 있지 않은 string이어야 한다. 이 계약을 어기거나 한도를 넘으면 verifier
중단 대신 `PACKAGE_POLICY_INPUT_ERROR` finding으로 남긴다.
여러 policy file은 하나씩 검증하고 읽어 파일 수만큼 제한 버퍼가 동시에 누적되지 않게 한다.
registry와 policy의 authored array는 glob pattern set을 제외하고 각각 최대 4,096개 항목을
허용한다. registry 또는 한 policy set의 capability/evidence/rule/list reference 합계는
16,384개로 제한하며 여러 direct policy input도 같은 16,384개 전역 reference budget을 공유한다.
direct verifier의 `policies`와 `semAnalyses` 최상위 배열도 4,096개를 넘으면 각각
`POLICY_SET_LIMIT_EXCEEDED`, `SEM_ANALYSES_LIMIT_EXCEEDED`로 fail-closed 처리한다. 따라서 4MiB
file 한도를 우회하는 in-memory 호출이나 수천 개 policy file/reference가 filesystem·parser 작업을
무제한 fan-out하지 않는다. glob pattern은 별도의 16,384 character complexity budget을 유지한다.
`analysisProjects` 생략은 repository root의 `default` project로 해석하지만 명시적인 빈 배열은
SEM 분석을 0회로 만드는 구성 오류로 거부한다. 참조된 policy set도 package 또는 impact rule을
최소 하나 포함해야 하며, focused project 검사에서 다른 project 규칙만 제외되어 비게 된 set은
검사 대상에서 제거한다. capability evidence path도 순차 검사해 대량 path가 동시에 filesystem
operation을 열지 않게 한다.

### Advanced: Semantic preflight와 report 무결성

`--sem` 실행은 두 단계다. 먼저 registry, capability path, project ownership, policy identity,
package boundary를 semantic preflight로 검사한다. 현재 `--fail-on` 기준을 넘는 finding이 있으면
report를 출력하고 sem binary는 실행하지 않는다. preflight를 통과한 경우에만 sem version,
entities, policy-scoped impact와 선택적인 diff를 계산한다. report output 경로도 분석 전에
검사하며 registry 또는 policy 파일 자체를 덮어쓸 수 없다. 파일 report는 동일 디렉터리의 고유한
임시 파일에 기록하고 file data를 flush한 다음 원자적으로 교체한다. POSIX에서는 임시 파일을
`0600`으로 생성하고 교체 후 parent directory metadata도 flush한다. 기존 output은 symlink가 아닌
regular file이어야 하며 POSIX 접근 권한을 새 report에 보존한다. 새 output은 process umask를 적용한
`0666` 권한을 사용한다. 가장 가까운 기존
parent는 directory여야 한다. 임시 경로도 file open 전에 repository containment와 parent type을
검사하므로 `--output .` 같은 directory 입력이 repository 밖에 임시 artifact를 먼저 만들 수 없다.
따라서 중단된 writer가 기존 report를 부분 JSON/Markdown으로 절단하거나 최종 output symlink를
조용히 교체하지 않으며 교체 실패 시 임시 파일을 정리한다.
`assertVerificationReport`는 report 2.4의 top-level, capability/finding, SEM summary/failure/change
shape와 enum뿐 아니라 canonical UTC timestamp, summary count, `passed`/`failOn`, change category
합집합, capability 참조와 SEM failure project progress의 교차 필드 불변식도 runtime에서 검증한다. console/Markdown/JSON
renderer, `reportFailsAt`, `appendSemExecutionFailure`가 이 validator를 공유하므로 모순된 report가
PASS로 표시되거나 조용히 serialize되지 않는다. gate helper에 지원하지 않는 threshold를 직접
전달해도 `error`로 암묵 보정하지 않고 `InputContractError`로 거부한다. 별도 AJV runtime 의존성은
추가하지 않는다.

## 공개 계약

구현 anchor는 sem entity ID 형식을 그대로 사용한다.

```text
packages/core/src/ActionRegister.ts::class::ActionRegister
```

impact policy는 `from`에 일치하는 top-level entity만 질의하고, `dependents`가 아닌
`dependencies`를 `disallowDependencies`와 비교한다. 따라서 상위 handler가 business 함수를
호출하는 정상적인 역방향 관계는 위반으로 판단하지 않는다. impact lookup은 이름 검색이 아닌
canonical `--entity-id`를 사용하고, 중복 top-level ID는 입력 모호성으로 거부한다.
경로 pattern은 의도적으로 작은 glob subset만 지원한다. `*`는 slash 없는 한 segment 안의 임의
문자열, `**`는 slash를 포함한 임의 문자열이며 `**/`는 0개 이상의 directory segment다. 따라서
`src/**/*.ts`는 `src/index.ts`와 `src/nested/index.ts`를 모두 포함한다. brace expansion,
character class, `?`, negation은 지원하지 않는다. matcher는 backtracking 정규식이 아닌 bounded
NFA로 실행하며 pattern과 match value는 각각 최대 4,096 Unicode 문자다. pattern 상한은 runtime
loader, direct verifier, policy JSON Schema에 모두 적용된다. 한 pattern set의 전체 Unicode 문자
complexity는 16,384로 제한하고 빈 pattern도 최소 비용 1로 계산한다. Schema도 set을 최대 16,384개로
제한하며, 합산 complexity는 loader와 direct matcher가 subprocess 또는 NFA token 생성 전에 강제한다.
exported `globPatternIssue`, `compileGlobPatterns`, `matchesAny`도 runtime에서 pattern collection,
string item, match value를 검증한다. value 상한으로 public NFA 비용도 입력 길이에 따라 무제한으로
커지지 않고 pattern set budget 초과도 tokenization 전에 거부한다. direct verifier는 초과 정책을
`SEM_POLICY_GLOB_INVALID`로 격리한다. 타입을 우회한 값은 raw iteration `TypeError` 대신 `InputContractError`로 거부하며,
`globPatternIssue`는 non-string 입력도 명시적인 issue로 반환한다.

SEM output도 신뢰된 입력으로 가정하지 않는다. entity file은 실제 regular file이고
`realpath` 기준 repository 및 선택한 analysis project 내부여야 하며 top-level ID는 project 안에서
유일하고 `file::kind::name` canonical identity와 정확히 일치해야 한다. source line은
1-based이고 `endLine`이 실제 source file line count를 넘지 않아야 한다. canonical file별 가장 큰
요구 `endLine`만 검증한다. source 전체를 메모리에 적재하지 않고 하나의 64KiB 버퍼를 재사용하며
요구 line에 도달하면 남은 file을 읽지 않는다. CRLF가 buffer 경계에 걸린 경우도 하나의 line
break로 처리한다. SEM 0.21의 JSON parser가 nested `property`, `array`, `object`에 반환하는
`end_line = start_line - 1`은 provider adapter에서 해당 한 줄 nested entity로 정규화한다. top-level
entity, 더 큰 역전 범위와 직접 주입 normalized evidence는 계속 거부한다. 같은 parent 아래 같은
이름의 서로 다른 kind가 하나의 provider ID를 공유하면 `parent::kind::name`으로 명시적으로
구분하고, 그 뒤에도 충돌하는 ID는 거부한다.
diff `changeType`은 SEM 0.21.0의 `added`, `modified`, `deleted`, `moved`,
`renamed`, `reordered` 중 하나여야 한다. rename의 `oldFilePath`는 null 또는 non-empty string이어야 한다.
동일 kind의 nested entity ID 중복은 SEM 모델 특성상 입력 검증에서 보존할 수 있지만, 서로 다른
kind의 충돌은 위의 kind-qualified ID로 분리한다. impact response의 entity ID/file/name/kind는
요청 target과
일치해야 하며 관련 dependency/dependent/test의 ID file과 file 필드도 일치해야 한다. 각 관계
목록에서 entity ID는 유일해야 하며 중복 관계는 finding을 증폭시키지 않고 provider
`invalid-output`으로 거부한다. diff와 Git
untracked path 역시 repository 밖으로 나갈 수 없고 diff entity ID는 현재 또는 rename 이전 file과
일치해야 한다. 위반은 해당 operation의 `invalid-output`으로 보고한다. 삭제되거나 rename된 경로도
표현해야 하는 diff만은 repository-relative lexical containment와 ID/file 일관성을 검사하되 file
존재를 강제하지 않는다.
성공한 SEM stdout과 Git untracked-file 목록은 strict UTF-8로 decode한다. 잘못된 byte sequence를
대체문자로 묵인하지 않고 해당 operation의 `invalid-output`으로 중단한다. 실패 stderr는 진단
provenance를 잃지 않도록 replacement decoding 후 기존 4,096자 제한을 적용한다.
JSON 문자열의 NUL byte도 subprocess argument로 전파하지 않고 provider `invalid-output`으로
거부한다.

보고서 계약은 `context-action/architecture-verification-report@2.4`이며 console, JSON,
Markdown 출력을 지원한다. 통과는 exit code 0, 정책 실패는 1, 입력 또는 SEM 실행 실패는 2다.
2.1은 `semFailure`를 추가하여 operation, project, reason, command arguments, cwd, duration,
timeout/output limit, exit code/signal, project 진행 상태와 제한된 stderr/detail을 기계 판독
가능하게 제공한다. version mismatch는 `expectedVersion`과 `observedVersion`을 별도 필드로 남긴다.
2.2는 report의 optional `semVersion`을 지원 provider identity인 `sem 0.21.0`으로 고정한다.
2.3은 change scope에 `semanticFiles`와 `binaryFiles`를 추가한다. `files`는 두 tracked category와
`untrackedFiles`의 정확한 합집합이다. 세 category는 서로 배타적이며 모든 change path는 반복·후행
slash나 dot segment가 없는 normalized repository-relative file이다.
2.4는 impact subprocess fan-out을 project당 256개로 제한하고 `query-limit` 실패에
`impactTargets`와 `maxImpactQueries`를 추가한다. 두 수치는 positive safe integer이며 target 수가
limit보다 커야 하고 다른 failure reason에는 나타날 수 없다.
affected document/test path도 authored evidence에서 같은 형태로 canonicalize한다. report capability
ID는 유일해야 하며 duplicate registry entry는 하나의 traceability row와 오류로 정규화한다.
affected/finding capability 참조는 report capability 집합 안에 있어야 하고 failure의
`completedProjects`는 보존된 `semAnalyses` project 집합과 정확히 일치해야 한다.
외부 report collection도 runtime contract와 JSON Schema가 같은 한계를 적용한다. 일반
capability/finding/change-path collection은 최대 65,536개, SEM analysis와 failure command/project
progress collection은 최대 4,096개이며 item 순회 전에 거부한다.
authored registry/policy, 외부 report, normalized SEM model, direct verifier options의 exact-field
검사는 하나의 bounded 진단 계약을 사용한다. unknown field는 최대 8개 이름만 노출하고 각 이름은
최대 128 UTF-16 code unit prefix에서 well-formed·한 줄 text로 정규화한다. 나머지는 omission marker로
표시하므로 큰 object나 긴/제어문자 field name이 오류 메시지 크기와 terminal 구조를 지배하지 않는다.
public `assertKnownFields`는 allowed iterable 4,096회와 field scan 8,192회의 상한을 적용하고,
Proxy/iterator trap 예외를 coercion 없이 bounded `InputContractError`로 정규화한다.
public `boundedDiagnosticList`도 iterable에서 최대 9회만 값을 요청해 8개만 렌더링하고 omission marker를
붙인다. non-string 값과 iterator trap은 사용자 `toString`을 실행하지 않고 contract error로 거부한다.
filesystem, JSON, SEM adapter, verifier, CLI catch 경로도 공통 error diagnostic을 사용한다. 일반 object를
`String()`으로 변환하지 않아 사용자 `toString`을 실행하지 않으며, 실제 `Error.message`는 제어문자를
단일행으로 정규화하고 최대 4,096자로 제한한다. system error code도 getter 예외를 격리하고 string인
경우에만 분류에 사용한다. public `toInputContractError`의 label도 최대 128 code unit 단일행 text로
제한하며 non-string·비가시 label은 고정 fallback을 사용한다. 기존 contract error는 같은 참조로 보존한다.
일반 report 문자열은 항목당 16,384자, 전체 합산 8,388,608자로 제한한다. console/Markdown/JSON
renderer는 검증된 text budget에 더해 최종 UTF-8 출력 67,108,864-byte 상한도 적용한다.
report graph의 root와 nested container에서 own/inherited `toJSON` descriptor를 prototype당 최대 32단계
안에서 getter 실행 없이 검사한다. hook이 있으면 JSON renderer 전에 거부하므로 검증된 report가
직렬화 시점에 사용자 코드로 대체되지 않는다. report property getter가 임의 값을 throw해도 public
validator는 bounded `InputContractError`로 정규화한다.
`verifyArchitecture()`는 반환 직전에 이 공통 runtime contract를 적용하므로 내부 조합 경로에서도
schema-invalid report가 public API 밖으로 나갈 수 없다.
`SemExecutionError`, `boundSemExecutionFailure`, `appendSemExecutionFailure`는 같은 runtime validator를
통과한다. 따라서 직접 helper를 호출해도 지원하지 않는 operation/reason, 빈 command/args/cwd,
음수·비정수 duration, 0 이하 timeout/output limit, 비정수 exit code로 schema-invalid report를
만들 수 없다. failure object도 exact-field shape를 요구하며 args와 각 project-progress 배열은
report schema와 같은 최대 4,096개를 item 순회 전에 적용한다. direct helper에 들어오는 truncation 전
원문은 항목당 65,536자, 합계 16,777,216자로 제한하며 길이와 합계 preflight를 well-formed/visible
검사보다 먼저 수행한다. 4,096자 truncation 뒤 보존될 failure 문자열 전체도 8,388,608자로 제한한다.
project progress를 제공할 때는 requested/completed/skipped 세 배열을 함께 제공하고,
completed와 skipped는 requested의 서로 겹치지 않는 부분집합이어야 한다. 실패 project가 있으면
유일한 unresolved project와 `projectId`가 일치해야 한다. 이 관계는 문자열 truncation 전후에 모두
검증하므로 서로 다른 긴 project ID가 같은 bounded 값으로 충돌해도 provenance로 반환하지 않는다.
불완전 progress 진단은 최대 8개 ID를 이름당 128 code unit으로 표시하고 나머지는 생략한다.
report 2.4의 모든 count, duration, limit, exit code는 JSON round-trip 정밀도를 보장하는 JavaScript
safe integer 범위로 제한하며 runtime validator와 JSON Schema가 같은 상한을 사용한다.
console finding은 whitespace를 한 줄로 만들고 ANSI/Unicode 제어문자를 제거한다. Markdown의
비신뢰 문자열은 길이가 자동 조정되는 code span으로 렌더링하고 table pipe를 escape하므로
link/image/HTML/backtick이 report 구조나 동작을 바꾸지 못한다. report의 필수 문자열 provenance와
SEM command/range/project ID는 정규화 후 visible text가 남아야 한다. malformed direct registry의
선택적 finding scope(`capabilityId`, `ruleId`, `path`)가 보이지 않는 값이면 finding 자체는 유지하되
scope만 생략해 유효한 fail-closed report를 반환한다. 모든 report 문자열은 well-formed Unicode여야
하며 4,096자 SEM provenance truncation은 surrogate pair를 분리하지 않는다. provider 진단에서 발견한
lone surrogate는 U+FFFD로 복구해 구조화 실패를 보존하고, public report/failure helper에 직접 주입된
malformed Unicode는 계약 오류로 거부한다. 허용된 JSON report 값은 원본을 변경하지 않는다.

### 배포되는 schema와 package export

배포되는 기계 판독 계약은 다음 package subpath에서 제공한다.

- `@context-action/architecture-governance/schemas/architecture-registry`
- `@context-action/architecture-governance/schemas/policy-set`
- `@context-action/architecture-governance/schemas/verification-report`
- `@context-action/architecture-governance/schemas/symbol-snapshot`
- `@context-action/architecture-governance/schemas/symbol-history`
- `@context-action/architecture-governance/schemas/symbol-snapshot-diff`
- `@context-action/architecture-governance/schemas/context-manifest`
- `@context-action/architecture-governance/schemas/context-scope`

여덟 파일은 JSON Schema Draft 2020-12를 사용한다. registry와 policy loader도 동일한 필드 및
well-formed/NUL-free 문자열 집합을 runtime에 강제하여 알 수 없는 필드와 중복 문자열 배열을
거부한다. astral Unicode 문자의 정상 surrogate pair는 허용한다. package boundary는
`disallow` 또는 `require` 중 하나 이상, impact boundary는 비어 있지 않은 `from`과
`disallowDependencies`를 가져야 한다. report contract 변경은 schema와
`contractVersion`을 함께 올려야 한다.
schema 회귀 테스트는 repository 계약뿐 아니라 direct verifier가 root provenance를 사용하는
경계값 report와 malformed direct failure provenance 거부도 검증한다. report의 `semVersion`은
존재하는 경우 지원 provider identity인 `sem 0.21.0`으로 제한하며, 이 schema 강화와 함께 contract를
2.4로 유지한다.
