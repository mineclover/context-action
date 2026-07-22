# sem-doc 사용 방법

`@context-action/sem-doc`은 운영용 Symbol Context plane입니다. 구현자나 리뷰어가 변경 전에 어떤
심볼·의존 파일·문서·테스트·Git 변경을 확인해야 하는지 파악할 때 사용합니다. 결과는 버전이 있는
advisory artifact이며 Architecture Governance registry, CI 정책 gate, 완전한 architecture snapshot,
TypeDoc 대체재가 아닙니다.

## 1. 공개 패키지 설치

`sem-doc`은 Node.js 24가 필요합니다. 공개 패키지는 `@ataraxy-labs/sem@0.21.0` runtime wrapper와
두 Foundation 패키지를 함께 설치하므로, 깨끗한 환경에서도 기본 `sem` 실행 파일을 제공합니다.

기존 0.1.x artifact는 호환성 테스트에 사용할 수 있습니다. 새 release는 canonical
`context-action-documentation-tooling` 저장소가 소유하며, 이 consumer 저장소의 sem-doc과 Foundation
디렉터리는 private migration copy입니다.

```bash
npm install --save-dev @context-action/sem-doc@^0.1.2
npx sem-doc version
```

workspace checkout에서 개발할 때는 로컬 빌드를 사용합니다.

```bash
pnpm install
pnpm --filter @context-action/sem-doc build
node packages/sem-doc/dist/cli.js version
```

다른 sem 실행 파일을 명시할 때만 `SEM_BIN`을 설정합니다.

```bash
SEM_BIN=/opt/tools/sem npx sem-doc version
```

## 2. 구현자 컨텍스트 만들기

먼저 대상 심볼과 정의 파일을 지정합니다. 결과인 `sem-doc-work-context.v5`가 이후 ContextScope
projection의 SSOT입니다.

```bash
npx sem-doc work-context SemClient \
  --file src/sem-client.ts \
  --docs-root spec \
  --depth 1 \
  --json > managed/sem-client.context.json
```

변경이 한 단계 더 이어지는 경우에만 `--depth 2`를 사용합니다. 결과에는 심볼 identity, 정의 파일,
사용 파일, affected test, 문서 binding, Git revision, sem provenance가 포함됩니다. `execution`에는
phase, owner, 최종 상태, timeout, 출력 한도, 실제 출력 사용량, 경과 시간이 기록됩니다. `usageFiles`는
파일 단위 의존 신호이며 정확한 참조 위치나 runtime call graph가 아닙니다.

화면·API·transaction·workflow가 여러 entry point로 구성되면
`sem-doc-context-manifest.v1`을 만들고 하나의 ContextScope로 투영합니다.

```bash
npx sem-doc context-scope \
  --manifest managed/dashboard.manifest.json \
  --project-id example \
  --json > managed/dashboard.scope.json
```

단일 entry point는 다음처럼 실행할 수 있습니다.

```bash
npx sem-doc context-scope Dashboard \
  --file src/Dashboard.tsx \
  --context-id dashboard \
  --kind screen \
  --project-id example \
  --json > managed/dashboard.scope.json
```

이 scope는 하나의 work-context report(또는 manifest의 여러 report)에서 만든 결정적 그룹 projection이며,
시각적 bubble/group view의 입력으로 사용할 수 있습니다. 호출 순서·render flow·read/write 의미·runtime
동작을 추론하지는 않습니다.

## 3. 문서를 정확한 심볼에 바인딩

Markdown checkpoint를 색인하고 리뷰 전에 code 문서 binding을 검증합니다.

```bash
npx sem-doc docs index spec --json > managed/documents.json
npx sem-doc docs validate-bindings spec --strict --json > managed/binding-validation.json
```

코드 문서는 `semDocumentKind: code`와 정확한 `semEntityId`, `semEntityName`, `semEntityType`,
`semEntityFile` frontmatter를 선언해야 합니다. 개념·architecture·process·tooling 문서는 document-only로
둘 수 있습니다. checkpoint나 표시 이름만으로 심볼을 바인딩하지 않습니다.

## 4. 변경과 히스토리 비교

직렬화된 operational scope 두 개를 비교합니다.

```bash
npx sem-doc context-scope-diff managed/before.json managed/after.json --json
```

Git 범위의 각 커밋에 대해 scope를 생성할 수 있습니다. aggregate budget은 전체 범위에 공유되고,
commit budget은 각 커밋에 적용되며 둘 다 만족해야 합니다.

```bash
npx sem-doc context-scope-history HEAD~10 HEAD Dashboard \
  --project-id example \
  --file src/Dashboard.tsx \
  --aggregate-timeout-ms 3600000 \
  --aggregate-max-output-bytes 268435456 \
  --commit-timeout-ms 30000 \
  --commit-max-output-bytes 33554432 \
  --output managed/dashboard-history.ndjson \
  --json
```

두 브랜치의 변경 심볼 교집합은 다음처럼 추출합니다.

```bash
npx sem-doc context-scope-compare \
  managed/left-history.ndjson managed/right-history.ndjson --json
```

긴 범위는 NDJSON으로 출력해 모든 snapshot을 메모리에 유지하지 않도록 합니다. 각 커밋 분석이 끝나면
historical worktree는 제거됩니다.

## 5. 의존성 표면은 명시적으로 선택

기본 scanner는 `node_modules`를 제외합니다. 직접 참조한 패키지 표면을 확인할 때만 opt-in합니다.

```bash
npx sem-doc work-context SemClient \
  --file src/sem-client.ts \
  --include-node-modules-surface \
  --json
```

이 옵션은 provenance에 기록됩니다. sem-doc은 graph가 참조한 직접 one-hop 패키지 표면만 유지하고,
패키지 내부를 재귀적으로 수집하지 않습니다. underlying sem 옵션이 넓기 때문에 generated/vendor/fixture/
build output이 보일 수 있으므로 검토 목적에서만 명시적으로 사용합니다.

## 6. 패키지 선택 기준

| 목적 | 패키지 |
| --- | --- |
| 심볼 중심 작업 컨텍스트, 문서 binding, Git diff, operational ContextScope | `@context-action/sem-doc` |
| authored capability/role registry, policy 검증, 완전한 revision snapshot, CI/reviewer gate | `@context-action/architecture-governance` |
| 공통 identity·revision·snapshot·비교 contract | `@context-action/sem-foundation-contracts` |
| 공통 Git history/worktree와 `analysisProjects` traversal | `@context-action/sem-foundation-repository` |

두 consumer 패키지는 Foundation primitive를 공유하지만 서로의 report contract에는 의존하지 않습니다.
둘 다 필요한 workflow라면 [경계 가이드](./sem-doc-architecture-governance-boundary)를 따라 sem-doc으로
구현자 컨텍스트를 만든 다음 Architecture Governance의 독립 architecture gate를 실행합니다.

## 7. CI 사용 예

직렬화 결과는 review artifact로 보관하고 advisory evidence를 곧바로 lint 결과로 취급하지 않습니다.

```bash
npx sem-doc docs validate-bindings spec --strict --json
npx sem-doc work-context SemClient --file src/sem-client.ts --docs-root spec --json
npx sem-doc context-scope-history HEAD~10 HEAD Dashboard \
  --project-id example --file src/Dashboard.tsx --output managed/history.ndjson --json
```

현재 consumer workflow는 migration copy의 package boundary, workspace build, export/tarball, type/test/docs
gate를 확인하지만 sem-doc과 Foundation을 배포하지 않습니다. canonical tooling 저장소가 자체 release
workflow와 published-metadata 검증을 통과한 뒤에만 consumer가 migration copy에서 전환합니다.
