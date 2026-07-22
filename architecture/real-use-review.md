# sem 기반 PoC 실사용 리뷰

현재 구현 기능별 판단과 문서 정보구조는 [`implementation-review.md`](./implementation-review.md)에서
관리한다. 이 문서는 그중에서도 왜 SEM을 선택했는지, 실제 repository에서 어떤 결과를 얻었는지,
어떤 경계를 의도적으로 남겼는지에 집중한다.

현재 대상은 Context-Action convention을 규칙형 architecture/document evidence 관리로 시험하는
실험적 `architecture-governance` PoC다. 따라서 아래 결과는 범용 architecture analyzer의 성능 약속이
아니며, repository-local authored registry와 policy를 검증하기 위한 운영 근거로 해석한다. 작업 전
심볼 컨텍스트와 document binding은 별도 `sem-doc`이 소유한다.

## 선택

`@ttsc/graph`와 `@samchon/graph` 공급자 계층을 제거하고 `sem 0.21.0` 하나로 구조 분석을
단순화했다. Architecture Governance의 목적은 내부 함수 호출을 세는 compiler/LSP graph가 아니라, 명시적으로
관리하는 symbol의 canonical 정의 위치를 수집하는 것이다. 따라서 외부 `sem` entity 모델은 symbol
location provider로 충분하고, impact dependency는 catalog를 보호하는 선택적 extension으로 둔다.
provider 의미 변화가 symbol location 결과를 조용히 바꾸지 않도록 이 버전을 package dependency와
runtime compatibility gate 양쪽에 고정한다.

## 사용하지 않는 provider와 도구

현재 `architecture-governance`와 `sem-doc`의 runtime에는 다음을 추가하지 않았다.

| 후보 | 현재 상태 | 정리 |
| --- | --- | --- |
| `@ttsc/graph`, `ttsc-graph-router` | 미사용 | compiler-resolved graph가 필요한 별도 provider 후보 |
| `@samchon/graph` | 미사용 | 현재 SEM symbol/location 범위에서는 채택하지 않음 |
| LSP / `vscode-languageserver` | 미사용 | exact reference, unsaved overlay, CodeAction 요구가 생길 때 별도 검토 |
| TypeDoc / `typedoc-vitepress-sync` | 분석에는 미사용, API 문서에는 사용 | 문서 생성 pipeline과 symbol 분석기를 분리 |
| `@microsoft/tsdoc` parser | 미사용 | sem-doc은 Markdown/frontmatter와 `[[Symbol]]` convention을 자체 색인 |
| tree-sitter | 직접 dependency 없음 | 외부 `sem` 내부 구현을 consumer 계약으로 노출하지 않음 |

published `@context-action/sem-doc`과 Architecture Governance는 각자의 package boundary와
release workflow로 이 경계를 보호한다. 후보 provider를 다시 도입하려면 기존 `sem-doc` 또는 governance package에 바로 넣지 않고,
별도 provider contract와 provenance/비용 검토를 먼저 추가한다.

## 실제 결과

`pnpm arch:check`를 전체 monorepo에 실행한 결과 5개 capability가 오류와 경고 없이 통과했다.
entity 수는 source 변경에 따라 달라지는 분석 규모 참고값이며, 정확한 현재 값은 각 실행의 report를
권위값으로 사용한다.

| project | entities | impact queries |
| --- | ---: | ---: |
| core | 2,563 | 1 |
| react | 2,926 | 2 |
| example | 6,523 | 10 |
| architecture-governance | 753 | 1 |

impact query는 명시적으로 관리하는 registry anchor와 policy의 `from` 패턴에 일치하는 top-level entity에만 수행한다. 전체
entity마다 내부 호출을 계산하지 않으므로 cold 실행은 약 9초, cache가 준비된 실행은 대체로
1~3초에 완료됐다.
수집된 graph의 policy 적용은 rule, analysis, impact source, dependency relation을 합산한 16,384
operation budget을 공유한다. query가 하나여도 relation이 과도하거나 여러 policy가 같은 graph를
반복 평가하면 `SEM_IMPACT_EVALUATION_LIMIT_EXCEEDED`로 fail-closed 종료한다.
authored registry/policy 배열은 일반 collection당 4,096개, registry 또는 policy set의 aggregate
reference는 16,384개로 제한한다. direct verifier의 여러 policy set도 같은 aggregate budget을
공유하므로 file byte limit을 거치지 않는 호출에서도 policy/evidence fan-out이 유한하다.
경량 glob은 `*`, `**`만 지원하며 `**/`를 0개 이상의 directory segment로 처리한다. 따라서
`src/**/*.ts`가 direct file과 nested file을 모두 포함하고, brace/class/`?`/negation은 명시적으로
범위 밖이다. backtracking 정규식 대신 bounded NFA로 평가하고 pattern과 match value별 4,096
Unicode 문자 상한을 둔다. pattern 상한은 runtime loader, direct verifier, JSON Schema에 함께 둔다.
set은 schema에서 최대 16,384개, runtime에서 전체 Unicode 문자 complexity 16,384로 제한해 개별
pattern 상한을 지키는 대량 입력도 tokenization 전에 차단한다.

현재 snapshot/history PoC는 `context-action/symbol-snapshot@1.1`,
`context-action/symbol-history-report@1.3`, `context-action/symbol-snapshot-diff@1.0`을 사용한다.
`history`는 commit별 전체 심볼 목록을 임시 worktree에서 재수집하고, revision에 없는
`analysisProjects`는 `skipped/missing-at-revision`으로 보존한다. `snapshot-diff`는
`projectId/filePath/entityId`를 안정 키로 삼아 added/removed/modified를 산출한다.
governance project는 `.cjs`, `.js`, `.mjs`, `.ts`, `.tsx`만 수집하도록 `fileExtensions`를 지정해
SEM 0.21의 설정 파일 출력이 심볼 목록에 섞이지 않게 한다.

2026-07-15 반복 측정에서는 도구 build까지 포함한 `pnpm arch:check`가 3.29초와 2.37초였고,
두 번째 실행의 project 분석 시간은 core 64ms, react 67ms, example 1.00초였다. 이 정도 비용에서는
검증기 자체 cache가 얻는 이점보다 source, policy, SEM version을 함께 무효화해야 하는 복잡성이 더
크므로 별도 cache를 추가하지 않는다.

## 검증 의미

- 구현 anchor는 sem이 실제로 추출한 `path::type::name`과 일치해야 한다.
- 선택적인 `sem diff` 결과는 변경 파일과 owner/spec/anchor/test/docs 경로를 비교해 직접 영향
  capability, 검토할 문서, 실행할 테스트 목록을 만든다. 이 목록은 작업 범위이며 전체
  validation을 생략하지 않는다.
- `sem diff`가 의도적으로 제외하는 untracked 파일은 `git ls-files --others
  --exclude-standard`로 보완한다. registry나 policy 변경은 모든 capability를 영향 대상으로
  승격한다. 이 Git subprocess가 실패해도 완료된 SEM 분석을 버리지 않고 `operation: diff`,
  `command: git` provenance를 가진 실패 report를 남긴다.
- working tree, staged, base/head commit range를 구분해 report provenance에 기록한다. PR CI는
  shallow working-tree diff가 아니라 base/head SHA 범위를 사용한다.
- 직접 `runSemDiff` adapter도 incomplete range, staged/range 충돌, 빈 ref, NUL, malformed Unicode,
  invisible/4,096자 초과 ref와 잘못된 staged 타입을 subprocess 전에 거부한다. CLI는 같은 ref 계약을
  argument parsing 시점에 적용한다.
- PR CI의 report 생성과 upload는 `always()`로 실행해 선행 검증 실패에도 증거 수집을 시도한다.
  생성된 Markdown은 job summary와 7일 artifact에 보존하고 build/검증의 원래 exit code를
  반환한다. report 생성 전 build 실패도 job summary의 명시적 실패 메시지로 남긴다.
- CLI 단일 값 옵션은 한 번만 허용하고, 서로 다른 `--project`만 반복 가능하다. 중복 range ref나
  output/limit이 last-write-wins로 분석 범위를 바꾸지 않는다.
- business isolation은 business entity의 `dependencies`만 검사한다.
- impact 대상은 이름이 아닌 canonical entity ID로 조회하며 중복 top-level ID는 거부한다.
- entity path는 선택한 project scope 안에 있어야 하며 impact response의 ID/file/name/kind는 요청
  target과 일치해야 한다. dependency/dependent/test와 diff/untracked path도 repository-relative 및
  ID/file 일관성을 검사한다. 각 impact 관계 목록에서 entity ID는 유일해야 하며 중복 관계로 동일
  policy finding을 증폭시키는 provider 출력은 거부한다. entity source line은 1-based이고 `endLine`이 실제 canonical file의
  line count를 넘을 수 없다. file별 최대 요구 line까지만 하나의 64KiB buffer로 읽고 즉시
  중단하므로 큰 source 전체를 메모리에 적재하지 않으며 CRLF buffer 경계도 정확히 처리한다. top-level ID는
  `file::kind::name`과 정확히 일치해야 한다. diff type은 SEM 0.21.0의 added/modified/deleted/moved/
  renamed/reordered로 제한하고 rename old path의 타입도 검증한다. nested same-name entities가
  서로 다른 kind로 충돌하면 provider adapter가 `parent::kind::name`으로 구분하고, unresolved
  충돌은 거부한다. 동일 kind의 nested 중복은 top-level과 달리 허용 범위로 남긴다.
- handler가 business를 호출하여 생기는 `dependents`는 정상 관계이므로 위반이 아니다.
- package boundary는 계속 `package.json` 선언을 검사한다.
- registry, policy, project root, report output은 repository root 밖으로 나갈 수 없으며 project
  scope는 sem 실행 전에 검증한다.
- containment는 `realpath` 기준이므로 repository 내부 symlink를 통해 외부 project, evidence,
  package manifest 또는 report destination으로 우회할 수 없다.
- 직접 SEM adapter API도 repository/project를 canonical directory로 고정하고 project 검증을
  subprocess보다 먼저 수행한다. 실행 인자도 canonical repository-relative project path를 사용한다.
  entities/impact file은 실제 file과 최종 symlink 대상까지 검증한다. 삭제/rename을 표현하는 diff
  path만 존재 여부를 강제하지 않는다.
- 직접 verifier API도 project root를 directory로 강제하고 capability/package/impact scope를 같은
  canonical project identity로 판정한다. slash와 `.`/`..` segment를 정규화해 lexical prefix
  traversal을 차단하고, change-scope evidence/control path 매핑에도 같은 identity를 사용한다.
- 직접 주입된 `semAnalyses`도 entity shape/line/path/ID, impact target/related identity와 duration을
  검증한다. malformed/fabricated evidence는 SEM summary와 policy 평가에서 제외하고
  `SEM_ANALYSIS_EVIDENCE_INVALID` 및 missing-evidence finding으로 fail-closed 처리한다.
- normalized project evidence는 entity, impact와 세 relation 목록을 합산해 최대 65,536개, impact는
  최대 256개로 제한한다. 최근 example 실측은 약 6.2k entities와 9 impacts 규모이며, 정확한
  entity·relation 수는 해당 실행 report를 권위값으로 사용한다.
  direct input과 provider output 모두 같은 budget을 사용해 대형 in-memory graph 주입을 차단한다.
- 전체 project evidence도 합산 65,536개로 제한한다. 최근
  core/react/example/architecture-governance 합계는 약 12.8k entities이며,
  direct collection은 model 순회 전에 격리하고 CLI는 초과 project를 채택하지 않은 채 이전 완료
  project만 failure report에 보존한다.
- 정규화되어 report에 보존되는 SEM evidence 문자열은 항목당 4,096자, analysis collection 전체
  8,388,608자로 제한한다. provider와 project impact adapter, direct verifier, CLI adoption이 같은
  예산을 사용해 긴 단일 값과 impact/project 간 누적을 report 전에
  fail-closed 처리한다.
- text budget은 알려진 normalized evidence field만 순회한다. report에 보존하지 않는 provider source
  content와 임의 확장 field는 순회하지 않으며, 보존 문자열의 NUL·malformed Unicode와 identity의
  invisible text를 report 구성 전에 거부한다.
- 유효 top-level entity ID는 project별·전체 count index로 한 번 구성해 anchor×entity 교차 스캔을
  제거하며, project 미지정 capability의 cross-project duplicate ambiguity는 count로 유지한다.
- capability별 finding summary는 direct capability, rule, capability+rule overlap count를 한 번
  index해 capability×finding 교차 스캔을 제거하고 overlap finding의 중복 집계를 방지한다.
- change scope는 changed file ancestor prefix를 한 번 index해 capability×changed-file 교차 비교를
  제거하고 directory/root evidence의 포함 의미를 유지한다.
- 직접 주입된 `semChanges`도 source mode/range shape와 entity ID/file, current/old/binary/untracked path를
  검증한다. malformed change evidence는 `SEM_CHANGE_EVIDENCE_INVALID`로 남기고 change scope에서
  제외해 report schema와 영향 목록을 보호한다.
- semantic, binary, untracked change evidence는 합산 최대 65,536개다. direct input, provider parser,
  Git untracked 보완이 같은 budget을 중복·경로 순회 전에 적용해 대형 in-memory change set을
  fail-closed 처리한다. change set 문자열도 항목당 4,096자와 전체 8,388,608자로 제한한다.
  Git untracked를 결합한 뒤 전체 text budget을 다시 검사해 개별 정상 크기 출력의 합성 우회도 막는다.
- 실제 SEM diff adapter는 provider의 `summary`, `changes`, `binaryChanges`를 함께 받아 semantic bucket,
  total, binary, unique file, orphan count가 실제 목록과 일치하는지 검증한다. entity ID 및
  binary/untracked path 중복과 semantic·binary·untracked 집합 충돌도 거부한다. binary current/old
  path는 capability 영향 범위에 포함하므로 비텍스트 artifact 변경이 문서·테스트 검토 목록에서
  누락되지 않는다.
  SEM 0.21이 structural moved/renamed/reordered를 `modified`에도 중복 집계하는 출력은 정확 modified
  count 또는 structural subtype 포함 count인 경우만 좁게 호환하고 다른 count 불일치는 거부한다.
- direct verifier에서 `semVersion`은 생략 가능하지만 명시하면 `sem 0.21.0`만 허용한다. incompatible
  version의 analyses/changes는 `SEM_VERSION_EVIDENCE_INVALID`와 함께 summary, policy evidence,
  change scope에서 격리하고 report schema도 같은 provider identity만 허용한다.
- direct `failOn`이 error/warning/info가 아니면 error gate로 정규화하고
  `FAIL_THRESHOLD_INVALID`를 남긴다. registry/policy `schemaVersion`은 1만 허용하고 incompatible
  policy set은 평가에서 제외해 runtime discriminator가 PASS나 schema-invalid report를 만들지 못한다.
- direct capability status가 planned/implemented/verified/deprecated 밖이면 오류를 남기고 report에는
  `planned`로 정규화한다. package/impact severity와 impact missing-evidence severity가
  error/warning/info 밖이면 해당 규칙을 격리해 invalid enum이 finding, summary, gate를 우회하지 못한다.
- file loader와 direct verifier가 같은 in-memory registry/policy parser를 사용한다. public parser는
  getter/Proxy trap이 던진 임의 값을 coercion하지 않고 bounded `InputContractError`로 정규화한다.
  malformed capability evidence, policy rule/collection, SEM analysis collection은 raw `TypeError` 대신 구조화
  finding으로 격리한다. 잘못된 `evaluateImpactPolicies`는 오류와 함께 fail-closed로 impact 평가를
  계속 수행하며 생성 report는 2.4 schema를 유지한다.
- direct verifier의 registry provenance는 repository 내부로 제한하고 root identity는 `.`으로
  정규화하여 생성 report가 non-empty `registryPath` schema를 항상 만족하게 한다.
- direct verifier options와 `root`/`registryPath`는 필수 provenance로 object와 visible text가 있는 non-empty string을
  요구한다. exported path helper도 같은 계약을 적용해 빈 path의 current-directory 암묵 변환과 raw
  Node `TypeError` 대신 일관된 `InputContractError`를 반환한다. path의 lone surrogate와 NUL도
  filesystem API 호출 전에 거부한다.
- direct verifier options의 unknown field도 조기 거부해 threshold/evaluation 설정 오타가 기본값으로
  조용히 대체되지 않게 한다.
- exported glob matcher는 collection/item/value의 runtime 타입과 pattern set 전체 complexity를 검사한다. console/Markdown/JSON
  renderer, gate helper, SEM failure append는 공통 `assertVerificationReport`로 report 2.4 구조와
  summary/passed/timestamp/SEM progress 불변식을 먼저 검증해 malformed 또는 모순된 public API 입력을
  raw `TypeError` 대신 contract error로 거부한다. 지원하지 않는 gate threshold도 암묵 보정하지 않는다.
- report 2.4는 semantic/binary/untracked file provenance를 별도 배열로 보존하고 전체 `files`가 세
  category의 서로 배타적인 정확한 합집합인지 검증한다. 모든 change path는 반복·후행 slash가 없는
  normalized repository-relative file이며, 중복 capability ID와 category 간 path 중복도 거부한다.
  affected/finding capability와 completed analysis project의 교차 참조도 artifact 내부에서 완결된다.
- report runtime contract와 JSON Schema는 일반 capability/finding/change-path collection을 65,536개,
  SEM analysis와 failure args/project-progress collection을 4,096개로 제한해 외부 artifact가 내부
  생성·SEM 예산을 우회하지 못하게 한다.
- 일반 report 문자열은 항목당 16,384자, 전체 8,388,608자로 제한하며 console/Markdown/JSON 출력도
  UTF-8 67,108,864-byte 상한을 적용해 renderer 메모리와 artifact 크기를 제한한다.
- report graph의 root/nested container는 own/inherited `toJSON` descriptor와 32단계 prototype 상한을
  getter 실행 없이 검사한다. JSON 직렬화 hook은 renderer 전에 거부하고 hostile report getter 예외는
  bounded `InputContractError`로 정규화한다.
- bounded JSON reader와 direct SEM public API는 options/exact field/project/change-source 경계를
  filesystem 또는 subprocess 호출 전에 검증한다. TypeScript 타입을 우회한 `null`/wrong-shape 입력도
  Node `TypeError` 대신 `InputContractError`로 통일한다. 정규화된 analysis/change 내부의 nested
  entity, impact, binary change model에도 exact field shape를 적용한다. file과 entity ID의 file
  prefix는 forward slash만 허용해 `packages\\react`가 `packages/react/**` policy를 우회하지 못한다.
- registry/policy, report, SEM model, verifier option의 unknown-field 진단은 최대 8개 이름과 이름당
  128 UTF-16 code unit으로 제한한다. field name의 제어문자·malformed Unicode를 단일행 well-formed
  text로 정규화하고 추가 이름은 omission marker로 대체해 대형 object 오류가 증폭되지 않게 한다.
  public exact-field helper는 allowed iterable 4,096회와 field scan 8,192회로 제한하고 hostile
  Proxy/iterator trap을 coercion 없이 contract error로 격리한다.
- bounded diagnostic-list helper는 iterable 값을 최대 9회만 요청해 8개를 렌더링하고 omission marker를
  붙인다. non-string 값과 iterator trap은 사용자 coercion 없이 contract error로 거부한다.
- filesystem/JSON/SEM/verifier/CLI catch는 공통 error diagnostic을 사용한다. 임의 thrown object를
  `String()`으로 coercion하지 않고 `Error.message`만 단일행 4,096자로 제한하며, hostile message/code
  getter는 fallback으로 격리해 오류 처리 중 두 번째 예외나 사용자 `toString` 실행을 막는다.
  contract-error 변환 label도 128 code unit 단일행 text로 제한하고 non-string·비가시 값은 고정 fallback을
  사용하며 기존 contract error 객체는 그대로 반환한다.
- authored dot segment가 있는 document/test evidence는 report review path에서 canonicalize한다.
  duplicate capability는 finding을 유지하면서 단일 traceability row로 축약하고, public verifier는
  모든 결과를 반환 전에 공통 report validator로 검사한다.
- 성공한 SEM/Git stdout은 strict UTF-8로 decode하며 invalid sequence를 replacement character로
  묵인하지 않는다. 실패 stderr만 bounded diagnostic을 위해 replacement decoding을 허용한다.
- registry와 policy는 파일당 4MiB, package manifest는 1MiB와 strict UTF-8 경계를 적용한다. bounded
  reader는 open 전 path target과 non-blocking open 후 descriptor를 `stat`/`fstat`해 regular file인지
  확인한다. FIFO/device를 열기 전에 거부하고 검사 직후 FIFO 교체도 block 없이 거부한다.
  registry/policy의 decoded string은 runtime parser와 JSON Schema 양쪽에서 well-formed Unicode와
  NUL-free를 요구한다. 유효한 UTF-8 JSON 안의 escaped lone surrogate/NUL도 거부하고 정상 astral
  pair는 허용한다. authored 문자열은 항목당 4,096자, registry/policy set별 전체 4,194,304자로
  제한해 direct in-memory 입력도 final report 문자열 계약을 깨지 못하게 한다.
  package root/dependency field가 object가 아니거나 version이 비어 있지 않은 string이 아닌 경우를
  포함해 malformed 또는 oversized manifest는 verifier를 예외 종료시키지 않고 policy input finding으로
  변환한다.
- 여러 policy file은 순차 로드해 파일당 제한 버퍼가 policy 수만큼 동시에 누적되지 않게 한다.
- spec, implementation anchor, test, public docs, decision evidence는 실제 file이어야 한다. owner만
  package directory와 단일 file을 모두 허용한다.
- `analysisProjects` 생략은 root default project이고 명시적인 빈 배열은 오류다. 참조된 policy
  set도 최소 한 규칙을 가져야 하며 직접 verifier API에서도 같은 fail-closed 의미를 유지한다.
- capability evidence path는 순차 검사해 대량 입력이 filesystem operation을 한꺼번에 열지 않는다.
- async path API는 root symlink와 OS path alias를 canonical identity로 비교해 같은 repository를
  outside로 오판하지 않으며, authored/canonical absolute 표기 모두 실제 realpath 경계를 통과해야 한다.
  `requireExistingRepositoryPath`는 검증한 canonical target을 반환해 registry/policy read가 authored
  symlink를 다시 따라가지 않는다.
- semantic preflight가 gate 실패를 먼저 반환하므로 잘못된 architecture 입력에 SEM 분석 비용을
  쓰지 않는다. report output은 registry/policy 입력과 동일한 실제 파일을 가리킬 수 없다.
- 파일 report는 동일 directory의 고유 임시 파일을 flush한 뒤 원자적으로 교체하며, 교체 실패
  경로에서도 임시 artifact를 정리한다. POSIX에서는 임시 파일을 `0600`으로 생성하고 parent
  directory metadata도 flush한다. 기존 output은 symlink가 아닌 regular file만 허용하고 POSIX 접근
  권한을 보존하며 새 output에는 process umask를 적용한 `0666`을 사용한다. output/file parent type과
  임시 경로 containment를 open 전에 검사하므로
  directory output, final output symlink, non-directory parent가 모호한 교체나 외부 임시 쓰기로
  이어지지 않는다.
- 각 SEM command는 기본 120초/64MiB로 제한하고 timeout 시 강제 종료한다. 공통 JSON adapter가
  subprocess, output budget, parsing과 provider 검증을 단일 command deadline으로 묶는다. impact
  pattern은 entities subprocess 전에 검증하며 target 선택도 entities parser deadline에 포함한다.
  version 정상 응답도 trim과 지원 버전 확인 뒤 deadline을 재검사하며 stdout은 4,096자로 별도
  제한해 실패 provenance 생성 전 차단한다. 출력 한도는
  stdout+stderr 합산 byte 기준이며 성공 반환 뒤에도 adapter가 합계를 재검증한다. project별 impact
  query 전체에도 같은 시간 deadline을 적용하고 다음 subprocess에는 남은 시간만 허용한다. 따라서
  256개 query가 각각 timeout을 모두 소비해 전체 실행이 수 시간으로 늘어날 수 없다. deadline
  초과는 `operation: impact`, `reason: timeout`과 전체 budget 진단으로 남긴다. 마지막 응답도
  JSON parsing과 filesystem identity 검증 뒤 deadline을 재확인해 post-processing 초과 결과를 버린다. 성공한 impact의
  stdout+stderr 누적 byte에도 같은 출력 한도를 적용해 메모리 누적 경로를 제한한다. 누적 출력 초과는
  해당 응답의 JSON parsing 전에 `operation: impact`, `reason: output-limit`과 누적 byte 진단으로
  중단한다. spawn, timeout, output overflow, exit, invalid JSON/output은 report 2.4의 구조화된
  `semFailure`로 보존한다.
- CLI의 version, 모든 analysis project, diff, Git untracked scan은 하나의 timeout/output budget을
  공유한다. 단계마다 제한을 초기화하지 않고 앞 단계의 시간과 stdout+stderr byte를 다음 단계에서 차감하며,
  한도 초과 결과는 채택하지 않는다. direct diff도 SEM diff와 Git scan에 같은 누적 예산을 적용한다.
  policy glob이 선택한 impact target도 project당 256개로 제한하며, 초과 여부를 모든 impact
  subprocess보다 먼저 확인한다. 초과는 `operation: impact`, `reason: query-limit`과
  `impactTargets`/`maxImpactQueries`로 기록해 광범위한 pattern이 무제한 process fan-out을 만들지
  못하게 한다.
  빈 `SEM_COMMAND`는 pinned binary fallback으로 처리하고 명시적 빈/NUL command와 NUL ref는
  subprocess 전에 거부한다. 동기 spawn 예외는 `spawn`, SEM JSON NUL은 `invalid-output`으로
  정규화해 Node `TypeError`가 공개 adapter 밖으로 새지 않게 한다.
  `--sem`이 없는 실행은 `SEM_COMMAND`를 읽지 않아 비활성 provider 설정이 기본 검사를 막지 않는다.
  subprocess stderr는 bounded byte prefix만 디코딩한다. subprocess와 configuration에서 유입되는
  failure 문자열은 항목당 4,096자와 truncation marker로
  제한해 실패 report 자체가 다시 무제한 출력이 되지 않게 한다.
- 직접 failure helper도 report 2.4의 enum, required text/args, safe-integer duration/limits/exit code를
  runtime에 검증해 malformed provenance가 schema-invalid report를 만들지 못하게 한다. exact-field
  failure만 허용하고 args와 각 progress 배열은 4,096개로 제한한다. direct 원문은 항목당 65,536자와
  합계 16,777,216자를 Unicode/visible 순회 전에 검사하고, truncation 후 failure text 합계는
  8,388,608자로 제한한다. project
  progress 배열은 함께 제공해야 하며 requested 안에서 completed/skipped/failed partition이 일관되어야
  한다. truncation 뒤 identity 충돌도 다시 검증한다. 불완전 progress 진단은 최대 8개 ID와 ID당
  128 code unit만 노출한다. direct limit option은 number, 환경 변수와 CLI는
  canonical base-10 digit string으로 출처별 타입과 정밀도 계약을 분리한다.
- multi-project 분석이 중간에 실패하면 완료된 `semAnalyses`를 버리지 않고 요청·완료·실패·미실행
  project를 구분해 재실행 범위를 판단할 수 있게 한다.
- override SEM의 버전이 `0.21.0`과 다르면 entity 분석 전에 중단하고 expected/observed version을
  구조화 report에 남긴다. provider upgrade는 dependency, compatibility 상수와 회귀 evidence를
  함께 갱신하는 명시적 변경이다.
- test evidence는 파일 연결을 뜻하며 테스트 성공 여부는 기존 CI가 판정한다.
- registry/policy/report 계약은 Draft 2020-12 JSON Schema로 배포하며, 실제 repository 입력과
  생성 report를 Ajv strict mode로 회귀 검증한다.
- console finding은 ANSI/Unicode 제어문자와 newline을 제거·단일화한다. Markdown 비신뢰 값은
  동적 code span과 table pipe escaping으로 link/image/HTML/backtick 해석을 막고, JSON report는
  허용된 원본 값을 유지한다. 필수 report provenance와 SEM command/range/project ID는 제어·format
  문자를 제거한 뒤 visible text가 남아야 하며, malformed direct registry의 보이지 않는 선택적
  finding scope는 finding 자체를 보존한 채 생략한다. report 문자열은 well-formed Unicode만 허용하고
  bounded SEM provenance는 surrogate pair 경계를 보존한다. provider 진단의 lone surrogate는 U+FFFD로
  복구하되 public report/failure helper에 직접 주입된 malformed Unicode는 계약 오류로 거부한다.
- package boundary와 sem impact boundary는 독립 policy set으로 합성하여 변경 책임을 분리한다.

## 의도적으로 남긴 경계

- 외부 `sem`의 내부 engine 구현을 compiler type resolution과 동일한 것으로 표현하지 않는다.
- nested method별 impact나 내부 함수 호출 카운팅은 현재 범위 밖이며 top-level entity를 symbol
  location 단위로 삼는다. 이 기능은 LSP 수준 provider가 필요한 별도 문제다.
- sem cache와 MCP, cloud 기능을 검증기 내부에 포함하지 않는다. 반복 비용은 sem 자체 cache를
  사용해 측정하고, 별도 cache는 무효화 규칙이 필요한 만큼 실측 병목이 확인될 때만 추가한다.
- 문서 생성은 범위 밖이다. registry와 report를 TypeDoc, VitePress, LLMS가 소비할 수 있다.

TypeScript compiler 수준의 false positive 또는 false negative가 실제 운영 문제로 확인될 때만
언어별 정밀 분석기를 별도 보강한다.
