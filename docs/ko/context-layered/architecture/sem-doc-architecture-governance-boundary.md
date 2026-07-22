# sem-doc과 Architecture Governance의 경계

`@context-action/sem-doc`과 `@context-action/architecture-governance`는 서로 관련된 저장소 도구지만,
같은 라이브러리의 다른 이름이 아니며 서로를 대체하지도 않습니다. 두 도구는 같은 외부 `sem`
실행 파일과 정책 중립적인 Foundation 패키지를 사용할 수 있지만, 입력·출력·사용자·실패 의미와
release 계약은 독립적으로 유지합니다.

포지션은 의도적으로 비대칭입니다. `sem-doc`은 운영용 심볼 컨텍스트 plane이고, Architecture
Governance는 Context-Action convention을 실험하는 규칙형 control plane입니다. 후자는 repository-local
authored rule과 evidence 관리 방식을 시험하는 도구이지, 범용 architecture 표준이나 문서 편집기가 아닙니다.

## 한눈에 보는 결정

| 패키지 | 기본 질문 | 주요 입력 | 주요 출력 | 사용자 | gate 여부 |
| --- | --- | --- | --- | --- | --- |
| `@context-action/sem-doc` | 이 코드를 바꾸기 전에 어떤 컨텍스트·문서·운영 scope를 알아야 하는가? | target entity/path, TSDoc binding, Git working-tree/staged 상태 | `sem-doc-work-context.v5`, canonical `sem-doc-context-scope.v3`, `sem-documents.v3`, `sem-doc-git-diff.v1`, binding·benchmark report | 구현자, reviewer, agent | advisory context; architecture gate 아님 |
| `@context-action/architecture-governance` | Context-Action-authored architecture 계약에 구현·경계 증거가 유효한가? | `architecture/registry.json`, policy set, analysis project, SEM 증거, 선택적 revision/context manifest | verification report, complete symbol snapshot/history, snapshot diff, `ContextScope` | CI, maintainer, architecture reviewer | 예; 선택한 finding이 threshold에 도달하면 검증 실패 |

핵심 차이는 구현 규모가 아니라 책임입니다. `sem-doc`은 작업 컨텍스트와 문서 binding report의
심볼 컨텍스트 SSOT이고, Architecture Governance는 authored registry·evidence·policy·snapshot
계약의 SSOT입니다.

## 계약과 의존성 분리

```text
                       external sem executable
                         /                 \
                        /                   \
         @context-action/sem-doc    @context-action/architecture-governance
            work context, docs,          registry, policy, snapshot,
            scope, Git diff, advisory      history, ContextScope, gate
                        \                   /
                         \                 /
          @context-action/sem-foundation-contracts + @context-action/sem-foundation-repository
                    공통 identity와 Git primitive만 공유
```

한 consumer 패키지가 다른 consumer 패키지에 runtime 의존해서는 안 됩니다. 의미가 정책 중립적인
경우에만 Foundation 계약을 공유합니다. 한 패키지의 report를 다른 패키지의 입력 계약으로
자동 승격하지 않습니다.

`sem-doc`은 `@context-action/sem-foundation-contracts`와 `@context-action/sem-foundation-repository`를 runtime 필수 dependency로
사용합니다. 이는 공유 Foundation에 대한 의존성이지 Architecture Governance에 대한 의존성이 아니며,
sem-doc은 해당 계약의 local fallback 구현을 더 이상 갖지 않습니다.

공유 `@context-action/sem-foundation-contracts`는 SEM entity를 complete snapshot entry로 변환하는 정책 중립적인
`createSymbolSnapshotEntry`도 소유합니다. 각 consumer는 이 entry를 자체 report로 변환할 수 있지만,
symbol identity와 range 직렬화기를 두 패키지가 각각 다시 소유하지 않습니다.

## 이 패키지들에서 선택하지 않은 기술

다음 기술은 두 패키지의 runtime 분석 경계에 포함되지 않습니다.

| 기술 | 저장소 상태 | 제외 이유 |
| --- | --- | --- |
| `@ttsc/graph`, `ttsc-graph-router` | package dependency와 source import 없음 | compiler-resolved graph는 별도 provider 계약이기 때문 |
| `@samchon/graph` | package dependency와 source import 없음 | 현재 SEM 기반 symbol/location 범위에 필요하지 않음 |
| LSP / `vscode-languageserver` | package dependency와 runtime import 없음 | 정확한 reference 위치, unsaved overlay, CodeAction은 후속 범위 |
| TypeDoc / `@context-action/typedoc-vitepress-sync` | 저장소 API 문서 pipeline에서는 사용 중 | symbol identity·impact·architecture verification engine이 아님 |
| `@microsoft/tsdoc` parser | package dependency 없음 | sem-doc은 자체 Markdown/frontmatter와 `[[Symbol]]` binding convention을 사용 |
| tree-sitter | 이 workspace에 직접 dependency 없음 | engine 내부 구현은 외부 `sem` process 경계 뒤에 있음 |

앞의 세 항목은 현재 패키지에서 실제로 사용하지 않습니다. TypeDoc은 API 문서 생성에는 여전히
사용되지만 `sem-doc`이나 Architecture Governance의 분석기로 설명해서는 안 됩니다. 후속 provider를
추가할 때는 별도 contract, provenance 모델, package-boundary review가 필요합니다.

## 어디에 무엇을 맡기는가

### 작업 컨텍스트는 `sem-doc`

다음처럼 변경을 준비하거나 문서 경계를 설명할 때 `sem-doc`을 사용합니다.

- target entity와 정의 source를 찾기
- bounded 1-hop/2-hop 구조 관계 수집
- dependent file과 affected test를 advisory evidence로 나열
- 정확한 TSDoc entity binding과 backlink 색인
- 편집 전 Git working-tree/staged diff 기록
- 작업 컨텍스트를 화면·API·transaction review용 canonical operational `sem-doc-context-scope.v3` grouping으로 투영
- bounded commit snapshot/diff를 materialize하고 NDJSON으로 stream하며 두 branch의 변경 symbol 교집합을 추출

`usageFiles`는 SEM dependent에서 만든 중복 제거 파일 단위 신호입니다. 정확한 reference index,
call graph, runtime trace, architecture 승인으로 해석하지 않습니다.

고정된 sem 0.21.0 scanner는 기본 모드에서 `node_modules`를 제외합니다. sem-doc은
`work-context`, `context-scope`, `context-scope-history`에
`--include-node-modules-surface`를 명시한 경우에만 sem의 넓은
`--no-default-excludes`를 전달해 그래프에서 참조된 package 파일을 관측합니다. 그 뒤 sem-doc
collection 경계는 그래프에서 참조된 직접 표면만 허용하고 1 hop을 넘는 package 내부 row를 work-context·history·branch artifact
직렬화 전에 제거합니다. 실제 전달된 flag는 request provenance에 남습니다. Markdown 색인은
`node_modules`와 생성 output directory를 순회하지 않습니다.

`sem-doc-work-context.v5`, `sem-doc-context-scope.v3`, `sem-documents.v3`, `sem-doc-git-diff.v1`는 각 컨텍스트 view의 canonical
직렬화 artifact입니다. UI·agent·문서 script가 같은 view를 별도로 재구성하지 말고, 동일 report
provenance와 계약을 재사용해야 합니다.

### authored architecture 증거는 Architecture Governance

저장소 계약을 변경과 함께 검증해야 할 때 Architecture Governance를 사용합니다.

- 안정적인 `CA-*` capability와 `SymbolRef` implementation anchor 유지
- owner, role, test, public-doc, package/impact evidence 검증
- revision별 complete symbol snapshot materialize
- partial snapshot을 허용하지 않는 Git history/diff
- 화면·API·transaction grouping을 위한 revision-bound `ContextScope` projection
- 선택한 policy/evidence finding이 threshold에 도달하면 CI/review 실패

Registry는 authored intent입니다. SEM은 구조 evidence를 제공할 뿐 capability나 role comment의
제품 의미를 자동으로 만들지 않습니다.

Architecture Governance는 architecture-contract SSOT이지 work-context SSOT가 아닙니다. 따라서
registry·policy·snapshot/history·snapshot-backed `ContextScope`를 sem-doc work-context 또는
operational scope report로 대체하지 않습니다. 두 scope view는 provenance가 다릅니다. sem-doc은
하나 이상의 bounded work-context report에서 파생하고, Architecture Governance는 complete revision snapshot과
authored manifest에 묶습니다.

## 독립적인 workflow

일반적인 순서는 이어지지만 두 도구는 독립적으로 실행합니다.

1. 변경 준비 중 `sem-doc work-context`, `sem-doc context-scope`, `sem-doc diff`를 실행해 구현·문서·테스트·변경 파일과 운영 scope를 찾습니다.
2. 해당 spec, registry entry, 구현, 테스트, 공개 문서를 갱신합니다.
3. `arch:check:registry`와 Architecture Governance 전체 gate를 실행합니다. revision 또는
   context 증거가 필요하면 `snapshot`, `history`, `snapshot-diff`, `context-scope` artifact를 만듭니다.
4. 각 report를 자기 계약에 따라 검토합니다. sem-doc 성공이 architecture gate 성공을 의미하지
   않으며, architecture gate 성공도 document binding이나 work-context 완전성을 의미하지 않습니다.

두 명령을 orchestration script에서 연속 호출할 수는 있지만, report 이름·버전·provenance·실패
의미를 보존해야 합니다. 둘을 모호한 하나의 “Samdocs” report로 합치지 않습니다.

## 금지해야 할 혼용

- `sem-doc-work-context.v5`를 Architecture Governance verification report 입력으로 직접 사용하지 않습니다.
- `architecture/registry.json`을 TSDoc document-binding index로 사용하지 않습니다.
- `usageFiles`를 정확한 symbol reference나 runtime call graph로 해석하지 않습니다.
- `ContextScope` membership를 UI/API/transaction의 runtime 실행 증거로 사용하지 않습니다.
- 둘 다 SEM을 호출한다는 이유만으로 한 패키지가 다른 패키지에 의존하게 만들지 않습니다.
- 별도 compatibility decision 없이 schema version, CLI 이름, release 정책을 합치지 않습니다.
- 새 architecture 문서에서 두 패키지를 “Samdocs”라고 부르지 말고 실제 책임 패키지 이름을 사용합니다.

## 리뷰 체크리스트

- 필요한 결과가 작업 컨텍스트/문서 탐색(`sem-doc`)인지, authored architecture evidence와 CI/reviewer
  gate(Architecture Governance)인지 구분했는가?
- 추가하려는 field가 해당 패키지 report 계약에 속하는가?
- 공통 타입이 필요하다면 정책 중립적이며 Foundation에 둘 수 있는가?
- 두 report의 Git revision과 SEM provenance를 독립적으로 보존하는가?
- 사용자가 어느 명령을 실행하고 어떤 실패를 해결해야 하는지 이해할 수 있는가?

Normative detail은 [`sem-doc/spec/sem-doc.md`](../../../../packages/sem-doc/spec/sem-doc.md)와
[`architecture-governance README`](../../../../packages/architecture-governance/README.md)를 참고합니다.
