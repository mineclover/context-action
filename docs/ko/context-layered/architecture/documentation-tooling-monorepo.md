# 문서 도구 모노레포 경계

재사용 가능한 문서 관리 구현은
`context-action-documentation-tooling`이 소유하는 정본 저장소에서 관리합니다. 원격 저장소와
release workflow가 설정되어 있고, consumer는 published package를 사용합니다. 기계적으로 검증할 수 있는
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

## Published consumer 검증

tooling 저장소의 release workflow는 Foundation/sem-doc 테스트, type check, export/tarball,
published metadata, clean-consumer smoke를 검증합니다. 이 consumer는 published version을 사용하며
자체 `source-of-truth:check`, Architecture Governance build/type/test, package boundary policy를
검증합니다. Architecture Governance의 통합 검증은 consumer 소유
`architecture/registry.json`, policy 파일, `core` analysis project를 읽으므로 이 저장소에 남습니다.

consumer 전환은 완료되었습니다. 현재 입력은
`@context-action/sem-foundation-contracts@0.1.1`, `@context-action/sem-foundation-repository@0.1.1`,
`@context-action/sem-doc@0.2.0`이며 Foundation/sem-doc migration copy와 임시 parity/cutover
스크립트는 제거되었습니다. 생성 문서, API 페이지, LLMS 출력, authored registry는 각 consumer
저장소에 남고 `architecture-governance`, TypeDoc, LLMS는 consumer 소유 runtime 계약으로 유지합니다.
