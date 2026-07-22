# 문서 도구 모노레포 경계

재사용 가능한 문서 관리 구현은
`context-action-documentation-tooling`을 정본 후보로 두고 분리하는 중입니다. 현재는 별도 원격
저장소가 아직 설정되지 않은 local scaffold이며, consumer에서 패키지 artifact로 전환하기 전의
단계입니다. 기계적으로 검증할 수 있는
소유권 선언은 저장소 루트의 [`source-of-truth.json`](../../../../source-of-truth.json)에 있습니다.

## 소유권

| 경계 | `context-action`에 유지 | 추출된 도구 저장소 |
| --- | --- | --- |
| 제품 런타임 | `core`, `react`, `tool-protocol`, durable operations, 예제 | — |
| 심볼 컨텍스트 | consumer 설정과 생성 artifact | Foundation contracts/repository, `sem-doc` |
| 아키텍처 규칙 | `architecture-governance` 구현, `architecture/registry.json`, 프로젝트 정책, 제품별 evidence | — (아직 추출하지 않음) |
| API 문서 | TypeDoc/VitePress 설정과 생성 사이트 출력, `typedoc-vitepress-sync` 구현 | — (아직 추출하지 않음) |
| LLM 문서 | 원본 문서와 생성된 `llmsData` artifact, `llms-generator` 구현 | — (아직 추출하지 않음) |

`sem-doc`은 운영용 Symbol Context SSOT입니다. `architecture-governance`는 실험적인 규칙 기반
control-plane 패키지로 유지합니다. 구현을 별도 저장소로 추출한다고 해서 report나 gate 계약을
sem-doc에 합치지 않습니다.

## SEM이 소유하는 핵심 기능

SEM의 안정적인 경계는 runtime 호출 그래프나 LSP가 아니라, revision을 기준으로 한 심볼 evidence
수집·직렬화 계층입니다.

1. `sem`은 저장소 revision의 외부 entity evidence를 제공합니다.
2. Foundation contracts는 심볼·파일·revision·완전한 snapshot·diff identity를 결정적으로 정의합니다.
3. Foundation repository는 Git commit/worktree와 제한된 `analysisProjects` 입력을 구체화합니다.
4. `sem-doc`은 bounded work context, 문서 binding, 운영용 ContextScope,
   bounded history/intersection artifact를 검증·직렬화합니다.
5. consumer 소유 Architecture Governance는 같은 Foundation primitive으로 저장소 전체 snapshot/history와
   architecture ContextScope를 구체화합니다.

직렬화된 artifact가 SSOT이므로 commit `A..Z` 또는 두 branch history를 암묵적인 메모리 그래프를
다시 계산하지 않고 비교할 수 있습니다. 1-hop projection은 표시·수집 경계일 뿐이며, 이후 context
그룹화와 교집합의 기준은 revision 전체 snapshot입니다. SEM은 정확한 호출 횟수, runtime 동작,
아키텍처 정책 소유권을 주장하지 않습니다.

## 제거 전 검증 게이트

복사된 workspace는 Foundation 테스트, sem-doc 테스트, type check, sem-doc boundary/binding/pack
검증, published-consumer smoke test를 통과해야 합니다. consumer에서는 추가로
`pnpm verify:tooling-consumer`를 실행해 local canonical Foundation artifact를 격리 fixture에
pack/install하고 consumer 소유 Architecture Governance가 이를 실제로 사용할 수 있는지 확인합니다.
이 저장소와 consumer의
`source-of-truth:check`는 패키지 이름·경로·owner·repository URL의 정합성도 확인합니다.
Architecture Governance의 현재 통합
테스트는 consumer가 소유한 `architecture/registry.json`, policy 파일, `core` analysis project를
읽으므로, 패키지 전용 fixture 저장소가 생기기 전까지는 consumer checkout에서 실행합니다.

두 worktree를 local에서 함께 사용할 수 있을 때는 `pnpm source-of-truth:parity`가 canonical package의
두 manifest의 SEM contract와 canonical package 경로를 비교한 뒤 tooling manifest를 검증하고, 모든
파일을 hash해 tooling source와 consumer migration copy 사이의 code/spec/test drift를 찾습니다.
root `README.md`와 `package.json`은 repository ownership과 migration metadata가 의도적으로 다르므로
제외하며, sibling tooling checkout이 없으면 명시적인 skip 메시지를 출력합니다.

두 저장소의 전환 상태는 `node scripts/verify-tooling-cutover.mjs --json`으로 확인합니다.
`--local-only`를 사용하면 registry에 접근하지 않고 두 manifest, package parity, 양쪽 local
tarball consumer smoke만 검증합니다. 옵션 없이 실행하면 tooling remote, published metadata,
published consumer smoke, 미사용 release version까지 확인하며, 외부 cutover 검증이 통과하기 전에는
Architecture Governance가 published Foundation version으로 설치되는지도 확인합니다. 외부
cutover 검증이 통과하기 전에는 ready가 되지 않습니다.

tooling 저장소에는 이제 이 계약을 검증하고 Foundation contracts를 sem-doc보다 먼저 배포한 뒤
published metadata와 clean-consumer 검증을 실행하는 release workflow를 준비했습니다. tooling remote,
npm Trusted Publisher 또는 token 설정, corrected package version을 의도적으로 확정하기 전에는
실행하지 않습니다.

현재 published `@context-action/sem-doc@0.1.2` artifact는 `sem-doc-work-context.v4`를 내보내지만
local 구현은 v5를 내보냅니다. 이는 consumer 코드 오류가 아니라 legacy artifact와 현재 계약의
관찰 가능한 불일치입니다. 별도 원격 저장소와 새 artifact metadata를 확정하고 published-consumer
smoke까지 통과한 뒤에만 `context-action`을 released 또는 local-tarball dependency로 전환하고
중복된 패키지 디렉터리를 제거합니다. 생성 문서, API 페이지, LLMS 출력, 작성된 registry는 각
consumer 저장소에 남깁니다. 현재 단계에서 별도 tooling 저장소가 소유하지 않는
`architecture-governance`, TypeDoc, LLMS 구현을 “추출된 도구”로 기술하지 않습니다.
