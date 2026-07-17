# Samdocs Symbol Registry

이 디렉터리는 Samdocs가 관리하는 명시적 심볼과 역할 설명의 authored source다. 현재
`@context-action/architecture-governance` package는 심볼 정의 위치·사용 파일과 evidence를 검증하고,
package/impact policy는 이를 보호하는 보조 extension으로 제공한다.

- `registry.json`: stable symbol/capability와 SEM entity anchor, test, public docs 관계
- `governance-guide.md`: symbol lifecycle, role comment, evidence, policy, 예외와 PR 운영 규칙
- 공개 읽기 경로: `docs/en/context-layered/architecture/architecture-governance.md`, `docs/ko/context-layered/architecture/architecture-governance.md`
- `rules/package-boundaries.json`: `package.json` 선언 기반 boundary policy set
- `rules/impact-boundaries.json`: sem dependency 기반 impact policy set
- `real-use-review.md`: 실제 저장소 실행 결과와 의도적으로 남긴 경계
- `implementation-review.md`: 구현 기능 review, 현재 한계, 문서 정보구조와 다음 변경 기준
- `arch-verify history`: Git first-parent, SEM diff, 커밋별 완전 심볼 snapshot을 결합한 이력 report
- `arch-verify snapshot`: 현재 worktree 또는 특정 commit의 완전 심볼 snapshot 생성
- `arch-verify snapshot-diff`: 두 완전 snapshot을 `projectId/filePath/entityId` 기준으로 비교
- `@sem-foundation/contracts`: sem-doc와 공유하는 publish-ready entity/path/provenance 최소 계약
- `@sem-foundation/repository`: Git revision/history/worktree와 historical `analysisProjects` traversal runtime

## 문서 읽기 순서

문서의 목적을 섞지 않는다.

1. 공개 개념과 최소 실행은 [`docs/en/context-layered/architecture/architecture-governance.md`](../docs/en/context-layered/architecture/architecture-governance.md) 또는 한국어 문서에서 시작한다.
2. capability를 추가·승격할 때는 [`governance-guide.md`](./governance-guide.md)의 lifecycle과 evidence 규칙을 따른다.
3. package/impact rule을 작성할 때는 [`rules/README.md`](./rules/README.md)를 확인한다.
4. 구현 범위와 한계를 리뷰할 때는 [`implementation-review.md`](./implementation-review.md)를 사용한다.
5. SEM 선택과 실제 실행 결과의 decision은 [`real-use-review.md`](./real-use-review.md)에 남긴다.
6. CLI/API와 artifact 계약은 [`packages/architecture-governance/README.md`](../packages/architecture-governance/README.md)에서 확인한다.

이 파일은 registry와 policy를 사용하는 contributor를 위한 운영 인덱스다. 입력·subprocess·report의
방어 세부는 구현 review와 package README에 연결하고, capability lifecycle이나 policy authoring을
이곳에서 다시 정의하지 않는다.

## 기본 흐름

```text
role comment + stable symbol id
  + sem entities (definition location)
  + sem impact dependents (usage files)
  + registry evidence
  → symbol catalog / duplicate check
  → optional architecture verification report
```

`analysisProjects`는 monorepo의 심볼 수집 범위를 선언한다. 구현 anchor는 SEM의
`path::type::name` 형식으로 정의 위치를 식별한다. 현재는 내부 함수 호출 횟수·호출 순서·runtime
data flow를 분석하지 않는다. 그런 분석은 LSP 수준의 별도 provider가 필요한 영역이다.
프로젝트에 `fileExtensions`를 지정하면 SEM entity 수집을 해당 dot-prefixed 확장자 집합으로
제한할 수 있다. 값은 1~32개(각 최대 64자)이며 중복·잘못된 확장자는 registry와 direct API 모두에서 거부된다.
package 및 impact policy의 `project`는 심볼 catalog를 CI에서 보호하기 위한 선택적 architecture
boundary 범위다.
`architecture-governance` project와 `CA-ARCH-GOVERNANCE` capability는 verifier 자체의 구현,
회귀 테스트, 공개 계약 문서와 SEM runtime dependency를 같은 registry로 검증한다.

## 계약과 policy set 구성

registry와 policy 파일은 각각 배포 패키지의 JSON Schema를 `$schema`로 참조한다.

- `packages/architecture-governance/schemas/architecture-registry.schema.json`
- `packages/architecture-governance/schemas/policy-set.schema.json`
- `packages/architecture-governance/schemas/verification-report.schema.json`
- `packages/architecture-governance/schemas/symbol-snapshot.schema.json`
- `packages/architecture-governance/schemas/symbol-history.schema.json`
- `packages/architecture-governance/schemas/symbol-snapshot-diff.schema.json`

`policyFiles` 순서대로 여러 policy set을 합성한다. 현재는 증거 원천이 다른 package boundary와
sem impact boundary를 별도 파일로 유지한다. 별도 상속 DSL은 두지 않으며, 재사용할 규칙 묶음도
동일한 policy set 계약으로 파일을 추가하면 된다. loader는 알 수 없는 필드, 중복 배열 값,
비어 있는 boundary 정의를 입력 오류(exit 2)로 거부한다.
impact 경로는 경량 glob subset을 사용한다. `*`는 단일 segment, `**`는 segment 경계를 포함하며
`**/`는 directory가 0개인 direct file도 포함한다. brace, character class, `?`, negation은
지원하지 않는다. backtracking 정규식 대신 bounded NFA matcher를 사용하고 pattern과 match
value별 4,096 Unicode 문자 상한을 적용한다. pattern 상한은 loader, direct verifier, JSON Schema가
동일하게 강제한다. pattern set은 최대 16,384개이며 runtime은 전체 Unicode 문자 complexity도
16,384로 제한해 작은 pattern을 대량으로 조합하거나 최대 길이 pattern을 누적해 token state를
무제한 생성하지 못하게 한다. 초과 direct policy는 `SEM_POLICY_GLOB_INVALID`로 fail-closed 처리한다.

## 명령

```bash
pnpm arch:check           # registry + sem entity/impact + package policy
pnpm arch:check:changed   # 전체 검증 + sem diff 기반 직접 영향 capability
pnpm arch:check:staged    # 전체 검증 + staged change scope
pnpm arch:check:registry  # registry + 경로 + package policy
pnpm arch:test
```

PR CI는 checkout된 base/head SHA를 `--from`, `--to`로 전달해 working tree 상태와 무관한
변경 범위를 만든다. report 생성과 artifact 업로드는 선행 검증의 성공 여부와 무관하게
`always()`로 실행한다. 영향 capability·문서·테스트는 job summary와 7일 보존 Markdown
artifact에 남기며, build 또는 정책 위반이 발생해도 원래 종료 코드를 보존한다. report 생성
전 build가 실패한 경우에는 생성 불가 사유와 종료 코드를 job summary에 기록한다.
CI의 기본 `verify:all`은 모든 event에서 전체 `arch:check`를 실행한다. PR의 commit-range report는
이 전체 gate를 대신하지 않고 변경 영향과 후속 검토 evidence를 추가로 남기는 단계다.

집중 검사는 다음과 같이 실행한다.

```bash
node packages/architecture-governance/dist/cli.js check \
  --root . \
  --registry architecture/registry.json \
  --project core \
  --sem
```

완전한 revision snapshot과 두 snapshot의 증감은 다음 명령으로 별도 생성한다.

```bash
node packages/architecture-governance/dist/cli.js snapshot \
  --root . --registry architecture/registry.json --format json \
  --output reports/symbol-snapshot.json

node packages/architecture-governance/dist/cli.js snapshot-diff \
  --root . --left reports/snapshot-before.json \
  --right reports/snapshot-after.json --format markdown \
  --output reports/symbol-snapshot-diff.md
```

`context-action/symbol-snapshot@1.1`, `context-action/symbol-history-report@1.3`,
`context-action/symbol-snapshot-diff@1.0`은 각각 revision 전체 목록, commit별 snapshot, 두
snapshot의 added/removed/modified 결과를 표현한다. historical snapshot에서 revision에 없는
project는 `skipped`와 `missing-at-revision` 상태로 보존한다.

서로 다른 `--project`는 반복 선택할 수 있지만 동일 project ID 또는 단일 값 옵션의 반복은
입력 오류로 거부한다. 따라서 중복 `--from`, `--registry`, limit 등이 마지막 값으로 조용히
덮어써져 CI 분석 범위를 바꾸지 않는다.

`sem` 결과는 구조적 증거다. registry가 symbol identity를, `usageFiles`가 top-level 사용 파일을,
test runner가 실제 동작
성공을, TypeDoc/VitePress/LLMS가 파생 문서를 소유한다.

공개 `runSemDiff` adapter도 CLI와 동일한 change-mode 계약을 적용한다. commit range는
`from`/`to`를 함께 요구하고 staged와 결합하지 않으며, 잘못된 선택은 subprocess 실행 전에
입력 오류로 반환한다.

## 실행 신뢰 경계

CLI와 직접 SEM adapter API는 repository root를 `realpath`로 고정한다. CLI는 registry, policy,
analysis project, capability evidence, package manifest, report output의 실제 symlink 대상이 그 안에
있는지 확인한다.
adapter는 project root를 subprocess 실행 전에 같은 방식으로 확인하고 SEM entities/impact의 file이
실제 file이며 repository와 project의 canonical 경계 안에 있는지 출력 파싱 직후 다시 검증한다.
subprocess에는 선언된 symlink 경로 대신 검증된 project의 canonical repository-relative 경로를
전달하여 검사 시점과 실행 시점의 대상 해석을 일치시킨다.
직접 verifier API도 project root가 실제 directory인지 확인하고 capability 및 policy scope를 같은
canonical project identity로 비교한다. slash와 dot segment를 먼저 정규화하므로 다른 project를
가리키는 `project/../other` 경로가 문자열 prefix로 scope 검사를 우회하지 못한다. change scope의
evidence와 registry/policy control path 비교에도 같은 정규화를 적용한다.
직접 주입된 SEM analysis는 entity line/path/ID와 impact target 관계, duration까지 다시 검증한다.
무효 analysis는 report summary 및 architecture evidence에서 제외하고 명시적 오류로 남기므로
fabricated evidence가 anchor나 impact policy를 통과시키지 못한다.
유효 top-level entity ID는 project별·전체 count index를 한 번 구성해 anchor마다 전체 entity를
재검색하지 않는다. 검증 비용은 entity+anchor 수에 선형이며 cross-project duplicate ambiguity는
동일하게 유지한다.
capability별 finding summary도 direct capability, rule, capability+rule overlap count를 한 번
index한다. capability마다 전체 finding을 다시 훑지 않아 집계 비용은 finding+capability rule reference
수에 선형이며, 두 경로가 겹치는 finding은 한 번만 센다.
change scope는 changed file의 ancestor prefix index를 한 번 구성한 뒤 capability evidence path를
조회한다. capability×changed-file 교차 비교를 제거하면서 directory/root evidence의 포함 의미는
유지한다.
직접 주입된 change set도 working/staged/range source shape와 entity ID/file, current/old/untracked
repository-relative path를 검증한다. 무효 change evidence는 명시적 오류만 남기고 change scope를
생성하지 않아 외부 경로나 malformed source가 문서·테스트 영향 목록을 오염시키지 못한다.
semantic, binary, untracked change evidence는 합산 최대 65,536개로 제한하며, direct verifier와
provider parser 및 Git untracked 보완이 같은 budget을 경로 순회 전에 적용한다.
provider parser가 정규화한 analysis/change 내부 모델은 각 계층에서 exact field shape를 다시
검증하므로 알려지지 않은 metadata가 신뢰된 evidence로 조용히 전달되지 않는다. 내부 file과 entity
ID의 file prefix도 forward-slash canonical path만 허용해 separator 차이로 impact glob을 우회할 수 없다.
direct verifier의 `semVersion`은 생략할 수 있지만 명시된 값은 `sem 0.21.0`과 정확히 일치해야 한다.
불일치 version이 붙은 analyses와 changes는 모두 격리하며 report schema도 다른 version 문자열을
허용하지 않는다.
runtime `failOn` discriminator가 error/warning/info가 아니면 보수적인 error gate로 정규화하고,
registry/policy `schemaVersion`은 1만 허용한다. incompatible policy set은 평가하지 않으며 모든
경우 생성 report 자체는 2.4 schema를 유지한다.
capability status가 planned/implemented/verified/deprecated 밖이면 오류와 함께 report에서는
`planned`로 정규화한다. package/impact severity와 impact missing-evidence severity가
error/warning/info 밖이면 해당 규칙을 격리해 invalid finding severity나 누락된 gate count가 report에
들어오지 않게 한다.
file loader와 direct verifier는 같은 in-memory registry/policy parser를 사용한다. public parser는
arbitrary getter와 Proxy trap이 던진 값을 coercion하지 않고 bounded `InputContractError`로 정규화한다.
malformed capability evidence, policy rule/collection, SEM analysis collection은 구조화 finding으로 격리하고
report 2.4를 유지한다. `evaluateImpactPolicies`가 boolean이 아니면 오류를 남기되 impact 평가는
계속 수행해 runtime 입력으로 검사를 비활성화할 수 없게 한다.
registry provenance는 repository 내부로 제한하며 root 자체는 report에서 `.`으로 표현해 non-empty
report schema 계약과 일치시킨다.
direct verifier의 options와 `root`/`registryPath`는 검증 report 이전의 필수 provenance라서 object와
visible text가 있는 non-empty string만 허용한다. exported path helper도 동일한 runtime 타입 계약을 적용하므로 빈 경로가
현재 directory로 암묵 변환되거나 Node `TypeError`가 외부로 새지 않는다. path 문자열은
well-formed Unicode이며 NUL이 없어야 한다.
async path helper는 root symlink나 OS path alias를 canonical repository identity로 정규화한다.
상대 경로와 authored/canonical absolute path가 동일한 실제 repository를 가리키면 내부로 판정하고,
realpath가 repository 밖을 가리키는 symlink는 계속 거부한다. `requireExistingRepositoryPath`는
검증된 canonical target을 반환하고 registry/policy loader가 그 경로를 그대로 열어, 검사 뒤 authored
symlink를 재해석하는 경로 불일치를 줄인다.
bounded JSON reader와 exported SEM limit/integrity/runner도 options와 exact field shape를 먼저
검증한다. 정규화된 SEM analysis/change의 내부 entity, impact, change model도 unknown field를
거부하며, direct diff source는 working/staged/range 계약을 parser 단계에서 고정한다.
registry/policy, report, SEM model, direct verifier option의 unknown-field 진단은 최대 8개 이름만
각각 128 UTF-16 code unit 이내의 well-formed 단일행 text로 노출한다. 추가 항목은 omission marker로
대체하므로 exact-field 거부 자체가 대형 오류 문자열을 만들지 않는다. public exact-field helper는
allowed iterable 4,096회와 field scan 8,192회로 제한하며 Proxy/iterator trap도 bounded contract
error로 변환한다.
bounded diagnostic-list helper는 iterable에서 최대 9회만 요청해 8개 항목을 표시하고, non-string 값과
iterator trap을 coercion 없이 contract error로 변환한다.
filesystem/JSON/SEM/verifier/CLI에서 잡힌 오류는 공통 진단기로 정규화한다. 임의 object의 `toString`은
호출하지 않고 `Error.message`만 최대 4,096자의 well-formed 단일행 text로 보존하며, 예외를 던지는
message/code getter도 안정적인 fallback으로 격리한다. contract-error 변환 label은 최대 128 code unit
단일행 text로 제한하고 non-string·비가시 값은 고정 fallback을 사용하며 기존 contract error 참조는 보존한다.
direct `verifyArchitecture` options도 exact field shape를 요구해 `failOnn` 같은 설정 오타가 기본
`error` threshold로 조용히 완화되지 않게 한다.
report는 registry나 policy 입력 파일을 덮어쓸 수 없다. 파일 출력은 같은 디렉터리의 임시 파일을
flush한 뒤 원자적으로 교체하므로 프로세스 중단이나 교체 실패가 부분 report를 남기지 않는다.
POSIX에서는 임시 파일을 `0600`으로 만들고 parent directory metadata도 flush한다. 기존 output은
symlink가 아닌 regular file이어야 하며 POSIX 접근 권한을 새 report에 보존한다. 새 output은
process umask를 적용한 `0666` 권한을 사용한다.
가장 가까운 기존 parent는 directory여야 하며 임시 경로의 repository containment도 file open 전에
검사한다. 따라서 directory output이 repository 밖 임시 쓰기를 선행하거나 최종 output symlink가
원자적 교체 과정에서 조용히 대체될 수 없다.
exported glob matcher는 collection/item/value runtime 타입을 검사하며, report renderer·gate·SEM
failure append는 공통 `assertVerificationReport`로 report 2.4 구조와 summary/passed/timestamp/SEM
progress 교차 필드 불변식을 먼저 검증한다. 잘못된 gate threshold를 포함한 public helper 입력은
raw iteration/property `TypeError`나 암묵 fallback 대신 `InputContractError`로 일관되게 거부한다.
report 2.4의 change scope는 `semanticFiles`, `binaryFiles`, `untrackedFiles`를 분리하고 `files`를
서로 배타적인 세 category의 정확한 합집합으로 강제한다. change path는 반복·후행 slash나 dot
segment가 없는 normalized repository-relative file이어야 하며, report capability ID도 중복될 수
없고 affected/finding capability ID는 그 집합을 벗어날 수 없다. SEM failure의
completed project도 보존된 analysis project 집합과 일치해야 한다.
외부 report는 capability/finding/change-path collection을 최대 65,536개, SEM analysis와 failure
args/project-progress collection을 최대 4,096개로 제한한다. runtime assertion과 published JSON
Schema가 같은 `maxItems`를 사용해 renderer나 gate가 비정상 배열을 순회하기 전에 거부한다.
일반 문자열은 항목당 16,384자, 전체 8,388,608자로 제한하고 최종 renderer 출력은 UTF-8 기준
67,108,864 bytes를 넘을 수 없다. 긴 외부 provenance가 JSON Schema를 통과하거나 출력 메모리를
무제한 증폭시키지 못한다.
JSON report는 root와 nested container의 own/inherited `toJSON` descriptor를 getter 실행 없이
검사하고 prototype chain을 32단계로 제한한다. hook은 `JSON.stringify` 전에 거부하며, report getter가
임의 객체를 throw하는 경우도 bounded `InputContractError`로 변환한다.
affected document/test path는 authored dot segment를 canonicalize하고 repository 밖의 invalid
evidence는 기존 finding만 남긴 채 review 목록에서 제외한다. duplicate capability는 오류를 유지하되
첫 정의 하나만 traceability row로 출력한다. 모든 `verifyArchitecture()` 결과는 반환 전에 동일한
report validator를 통과한다.
spec/anchor/test/docs/decision evidence는 실제 file이어야 하며 directory 존재만으로는 검증을
통과하지 않는다. owner는 package directory 또는 단일 file을 모두 허용한다.
architecture registry와 policy JSON은 각각 4MiB, package manifest는 1MiB로 제한하고 유효한
UTF-8만 허용한다. bounded reader는 open 전 path target과 non-blocking open 후 descriptor를 각각
`stat`/`fstat`해 regular file인지 확인한다. FIFO·device는 open 전에 거부하고 검사 직후 FIFO 교체도
writer 대기나 stream read로 이어지지 않게 한다. JSON decode 뒤
registry/policy 문자열도 well-formed Unicode와 NUL-free 계약을
runtime parser와 JSON Schema가 함께 강제한다. 따라서 `"\ud800"`/`"\u0000"` escape는 거부하고
정상 astral Unicode pair는 허용한다. authored 문자열은 항목당 4,096자, registry/policy set별
전체 4,194,304자로 제한하며 direct parser도 같은 예산을 적용한다. 열린 file descriptor에서 최대
`limit + 1` byte만 읽으므로 검사와 read 사이
파일 증가도 무제한 메모리 사용으로 이어지지 않는다. 검사 대상 dependency field는 object이고
각 version은 비어 있지 않은 string이어야 하며, 위반은 package policy input finding으로 반환한다.
여러 policy file은 순차 로드해 per-file 제한 버퍼가 동시에 누적되지 않게 한다.
authored registry/policy collection은 glob pattern set을 제외하고 배열당 4,096개, registry 또는
policy set 전체 reference는 16,384개로 제한한다. 여러 direct policy set도 16,384개 reference
budget을 공유하고 `policies`/`semAnalyses` 최상위 입력은 각각 4,096개를 넘을 수 없다. file byte
한도 밖의 direct API에서도 policy file 로드, evidence path 검사, policy preflight가 무제한
fan-out하지 않으며 초과 입력은 구조화된 limit finding으로 fail-closed 처리한다.
`analysisProjects`를 생략하면 repository root를 default project로 사용하고 명시적인 빈 배열은
거부한다. policy set도 최소 하나의 package/impact rule을 가져야 한다. evidence path는 순차
검사하여 한 capability의 대량 path가 동시에 filesystem operation을 열지 않게 한다.

SEM 분석 전 semantic preflight가 project/capability/rule identity, 경로 evidence와 package
boundary를 먼저 검사한다. gate를 실패하는 입력은 SEM을 실행하지 않으며 동일한 report 계약으로
원인을 반환한다. focused project 검사에서도 선언되지 않은 project ID를 가진 capability나 rule은
필터링하지 않고 오류로 남긴다.

preflight 이후의 각 SEM subprocess는 기본 120초/64MiB로 제한한다. project 안의 impact query
전체에도 같은 120초 deadline을, 응답 누적 byte에도 같은 64MiB 한도를 적용해 여러 개의 정상
크기 작업이 시간과 메모리를 무제한 사용하지 않게 한다. 다음 impact subprocess는 deadline의 남은
시간만 timeout으로 받는다. CLI에서는 version, 모든 project analysis, diff, Git untracked scan까지
하나의 전역 시간·출력 예산을 공유하고 direct diff도 SEM/Git 두 단계를 하나의 예산으로 묶는다.
실패하면 report 2.4의 `semFailure`에 operation, project,
timeout/output limit, exit/signal과 stderr provenance를 남긴다.
impact query는 project당 최대 256개로 제한하고, pattern에 매칭된 전체 target을 query 실행 전에
계산한다. 초과 시 impact subprocess를 시작하지 않고 `operation: impact`, `reason: query-limit`과
`impactTargets`/`maxImpactQueries`로 fail-closed 처리하므로 광범위한 glob이 무제한 subprocess
fan-out으로 이어지지 않는다.
SEM evidence를 impact policy에 적용할 때도 모든 rule이 16,384 operation budget을 공유한다. rule,
analysis, impact source, dependency relation 평가가 한도를 넘으면
`SEM_IMPACT_EVALUATION_LIMIT_EXCEEDED` error를 남기고 이후 policy 평가를 중단해 relation·finding
증폭을 fail-closed 처리한다.
빈 `SEM_COMMAND`는 미설정으로 처리해 pinned binary를 사용한다. 명시적인 빈/NUL command와
4,096자, NUL, well-formed Unicode, visible text 계약을 어긴 range ref는 CLI argument parsing과
direct adapter 양쪽에서 subprocess 전에 입력 오류로 거부한다. Node의 동기 spawn 예외도 구조화된 `spawn`
실패로 변환하고 SEM JSON 문자열의 NUL은 provider `invalid-output`으로 분류한다.
SEM을 활성화하지 않은 CLI 실행은 `SEM_COMMAND`를 해석하지 않아 비활성 provider 설정과 기본 검사를
분리한다.
failure stderr는 bounded byte prefix만 디코딩하며, command, args, project 진행 정보, version,
stderr, detail 문자열은 항목당 4,096자와
truncation marker로 제한한다.
직접 failure helper를 사용하는 경로도 operation/reason enum, 필수 command/args/cwd, non-negative
safe-integer duration, positive safe-integer limits와 safe-integer exit code를 먼저 검증한다. malformed provenance가
report 2.4 schema를 우회해 들어갈 수 없다. failure는 exact-field object여야 하고 args와 각 progress
배열은 최대 4,096개다. truncation 전 direct input은 항목당 65,536자·합계 16,777,216자를 먼저
검사하고, truncation 후 failure 문자열 합계는 최대 8,388,608자다. requested/completed/skipped는 all-or-none이며 완료와
미실행 집합은 요청 집합 안에서 겹칠 수 없다. 유일한 unresolved project는 `projectId`와 일치해야
하고, truncation으로 project identity가 충돌한 경우에도 bounded failure를 반환하지 않는다. 불완전
progress 오류에는 최대 8개 ID만 이름당 128 code unit으로 표시한다.
direct limit options는 number만, 환경 변수 limit은 canonical base-10 digit string만 허용해 설정
출처별 타입 계약을 분리한다. CLI도 부호·leading zero·지수·16진 표기를 거부한다.
여러 project 중간에서 실패해도 이전 project의 `semAnalyses`를 보존하고 요청·완료·미실행 project를
구분한다. 따라서 CI는 SEM이 비정상 종료되어도 생성된 Markdown 실패 보고서를 job summary에
기록할 수 있다. working-tree 변경 범위를 보완하는 Git untracked scan도 동일한 제한과 실패
report 흐름을 사용하며 실제 command는 provenance에 `git`으로 표시한다.
각 SEM subprocess의 `maxOutputBytes`는 stdout과 stderr를 합친 byte 수에 적용하며 runtime의
buffer 제한 뒤 adapter가 성공 결과의 합산값을 다시 검증한다. CLI의 version, 전체 project analysis, diff, Git untracked scan은 하나의 timeout/output budget을
공유한다. 완료 단계가 사용한 시간과 stdout+stderr byte를 다음 단계에서 차감하며, global budget을 넘긴
project는 report에 채택하지 않고 구조화된 timeout/output-limit provenance를 남긴다.
impact project deadline은 subprocess뿐 아니라 마지막 응답의 JSON parsing, evidence 계산,
filesystem identity 검증 뒤에도 재확인해 post-processing 초과 결과를 채택하지 않는다.
공통 JSON adapter는 subprocess, output budget, parsing과 provider 검증을 하나의 command deadline으로
묶는다. impact pattern은 entities subprocess 전에 검증하며 target 선택도 entities parser 안에서
deadline에 포함한다.
version 정상 응답도 trim과 지원 버전 확인 뒤 command deadline을 재검사한다.
version stdout은 4,096자로 별도 제한해 trim과 실패 provenance가 대형 문자열을 복제하지 않게 한다.

구조 분석 의미가 provider upgrade로 조용히 바뀌지 않도록 지원 SEM 버전은 package dependency와
같은 `0.21.0`으로 고정한다. override binary도 entity 분석 전에 검사하며 mismatch report에는
`expectedVersion`과 `observedVersion`이 분리되어 기록된다.

버전이 맞더라도 provider output은 다시 검증한다. entity path와 top-level identity는 선언 project
scope를 `realpath` 기준으로 벗어날 수 없고 실제 file이어야 하며 top-level ID는
`file::kind::name`과 정확히 일치해야 한다. impact response는 질의한
canonical target과 정확히 일치해야 한다. 관련
entity와 diff/untracked file도 repository-relative 경로와 ID/file 일관성을 만족해야 한다. 각
dependency/dependent/test 목록의 entity ID는 유일해야 하며 중복 관계는 provider 입력 오류로
거부한다. project별 normalized evidence는 entity, impact, dependency, dependent, test를 합산해
65,536개 항목으로 제한하고 impact는 최대 256개다. parser, direct integrity assertion, subprocess
adapter가 같은 aggregate budget을 사용하므로 byte limit을 우회한 in-memory graph나 여러 정상
크기 impact 응답의 누적도 model/file 검증 전에 fail-closed 처리한다. 모든 project를 합친 evidence도
65,536개 global budget을 공유한다. direct collection은 개별 model 순회 전에 격리하고 CLI는 초과를
일으킨 project를 채택하지 않은 채 이전 완료 project provenance만 보존한다. 정규화되어 report에
보존되는 SEM evidence 문자열은 항목당 4,096자, analysis collection 전체 8,388,608자로 제한한다.
provider parser와 project impact adapter, direct verifier, CLI project adoption이 같은 text budget을
사용하므로 긴 단일 값과 impact/project 간 누적을 report 전에
fail-closed 처리한다. 계산은 알려진 normalized evidence field만 순회하므로 보존하지 않는 provider
source content와 임의 확장 object graph는 포함하지 않는다. 보존 문자열은 NUL과 malformed Unicode를
거부하고 project ID와 range ref에는 visible text를 요구한다. rename diff는 entity ID가 현재 file 또는 `oldFilePath` 중 하나와 일치해야
한다. entity source line은
1-based이며 `endLine`이 실제 canonical source file line count를 넘을 수 없다. file별 최대 요구
`endLine`을 모은 뒤 하나의 64KiB buffer로 필요한 지점까지만 읽으므로 큰 source file 전체가
검증기 메모리에 올라오지 않고 CRLF buffer 경계도 보존한다. diff type은 SEM 0.21.0의 added/modified/deleted/moved/renamed/reordered로
제한하며 `oldFilePath`는 null 또는 non-empty string이어야 한다. 삭제/rename을
표현하는 diff 경로는 의도적으로 실제 file 존재를 요구하지 않는다.
SEM provider diff는 `summary`, `changes`, `binaryChanges` 전체 envelope로 검증한다. `changes` 길이와
각 semantic type 개수는 실제 목록 및 `summary.total`과 같아야 한다. SEM 0.21의 알려진 출력 형태인
structural moved/renamed/reordered의 `modified` 중복 집계는 정확 count 또는 structural subtype 포함
count일 때만 허용하고 다른 불일치는 거부한다. binary 목록 길이는
`summary.binary`와 같아야 한다. 유일한 semantic+binary 현재 경로 수와 orphan `entityType` 수도 각각
`summary.fileCount`, `summary.orphan`과 같아야 한다. 중복 entity/binary/untracked 증거와
semantic·binary·untracked 집합의 충돌은 fail-closed 처리한다. binary current/old path도 영향
capability·문서·테스트 범위에 포함한다. 세 change evidence collection은 raw Git untracked 항목까지
합산해 최대 65,536개로 제한하므로 output byte limit 안의 대형 목록도 path 정규화 전에 거부한다.
change set 문자열도 항목당 4,096자와 전체 8,388,608자 제한을 공유한다.
Git untracked 결과를 결합한 뒤에도 전체 text budget을 재검사해 개별 출력 한도의 합성 우회를 막는다.
성공한 SEM stdout과 Git untracked-file 출력은 strict UTF-8이어야 한다. invalid byte sequence는
replacement character로 정규화하지 않고 구조화된 `invalid-output` 실패로 보고한다.

console finding은 한 줄로 정규화하고 ANSI/Unicode 제어문자를 제거한다. Markdown 비신뢰 값은
동적 code span과 table pipe escaping을 사용해 link/image/HTML/backtick 해석을 차단한다.
필수 report provenance와 SEM command/range/project ID는 공백·제어·format 문자 제거 후 visible text가
남아야 한다. malformed direct registry의 보이지 않는 선택적 finding scope는 finding을 유지하면서
생략해 report 계약을 보호한다. 모든 report 문자열은 well-formed Unicode여야 하고 bounded SEM
provenance는 surrogate pair 경계를 보존한다. provider 진단의 lone surrogate는 U+FFFD로 복구하지만
public helper에 직접 주입된 malformed Unicode는 거부한다. 허용된 JSON report 값은 원본을 유지한다.
