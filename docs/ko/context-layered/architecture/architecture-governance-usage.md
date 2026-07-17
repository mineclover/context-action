# 아키텍처 거버넌스 사용 방법

이 문서는 저장소 checkout부터 재현 가능한 Samdocs 심볼 catalog를 만드는 가장 짧은 경로를
설명합니다. 개념은 [아키텍처 거버넌스 개요](./architecture-governance)를, 전체 API와 계약은
[package README](https://github.com/mineclover/context-action/blob/main/packages/architecture-governance/README.md)를
참고하세요.

## 1. 저장소 준비

현재 PoC는 `context-action` workspace 안에서 실행되며 Node.js 24와 pnpm이 필요합니다. 의존성을
설치하고 CLI를 직접 실행하기 전에 governance package를 빌드합니다.

```bash
pnpm install
pnpm arch:build
```

workspace는 `@ataraxy-labs/sem@0.21.0`을 고정합니다. 기본 command resolution은 이 package의
`sem` 바이너리를 사용합니다. 다른 실행 파일을 테스트할 때만 `SEM_COMMAND` 또는
`--sem-command`를 지정하세요. provider가 보고하는 지원 identity는 여전히 `sem 0.21.0`이어야
합니다.

## 2. catalog 선언

다음 repository-local 파일에서 시작합니다.

```text
architecture/
├── registry.json                 # capability, owner, anchor, test, docs
└── rules/
    ├── package-boundaries.json   # 선언된 package dependency 규칙
    └── impact-boundaries.json    # SEM 구조적 impact 규칙
```

`implementationAnchors`에는
`packages/foo/src/api.ts::function::createApi`처럼 SEM top-level identity를 사용합니다. 심볼 이름이
바뀌거나 파일이 이동해도 capability ID는 유지합니다. 구현 옆에 역할 주석을 작성하고 같은
capability의 spec, 대표 테스트, 공개 문서를 연결합니다.

## 3. 검사 실행

현재 질문에 필요한 가장 좁은 검사를 사용합니다.

```bash
# JSON, 경로, package 선언, policy 구조 확인
pnpm arch:check:registry

# registry + SEM entity/impact + evidence 전체 gate
pnpm arch:check

# 전체 gate와 working-tree 또는 staged 변경 범위
pnpm arch:check:changed
pnpm arch:check:staged
```

root script가 먼저 package를 빌드합니다. 특정 project나 재현 가능한 CI 범위가 필요하면 CLI를
직접 실행합니다.

```bash
node packages/architecture-governance/dist/cli.js check \
  --root . \
  --registry architecture/registry.json \
  --project core \
  --sem \
  --from <base-sha> \
  --to <head-sha> \
  --format markdown \
  --output reports/architecture-check.md
```

`--from`과 `--to`는 항상 함께 지정합니다. `--staged`와 commit range는 함께 사용할 수 없습니다.
`--project`는 서로 다른 project ID에 한해서만 반복합니다. 단일 값 옵션을 반복하면 마지막 값으로
덮어쓰지 않고 입력 오류로 처리합니다.

## 4. 완전한 snapshot과 history 저장

한 revision의 완전한 심볼 목록이 필요하면 snapshot을 사용합니다.

```bash
node packages/architecture-governance/dist/cli.js snapshot \
  --root . --registry architecture/registry.json \
  --worktree \
  --output reports/symbol-snapshot.json

node packages/architecture-governance/dist/cli.js snapshot \
  --root . --registry architecture/registry.json \
  --commit HEAD~1 \
  --output reports/symbol-snapshot-before.json
```

두 목록은 `projectId/filePath/entityId` 기준으로 비교합니다.

```bash
node packages/architecture-governance/dist/cli.js snapshot-diff \
  --root . \
  --left reports/symbol-snapshot-before.json \
  --right reports/symbol-snapshot.json \
  --format markdown \
  --output reports/symbol-snapshot-diff.md
```

first-parent commit별 보고서는 range를 명시합니다.

```bash
node packages/architecture-governance/dist/cli.js history \
  --root . --registry architecture/registry.json \
  --from HEAD~20 \
  --to HEAD \
  --output reports/symbol-history.json
```

각 commit에는 semantic delta와 registry의 `analysisProjects`를 기준으로 만든 완전한 snapshot이
포함됩니다. 과거 revision에 project가 없으면 현재 worktree 범위를 대체하지 않고
`skipped`/`missing-at-revision`으로 기록합니다.

전체 repository snapshot에서 `symbol identity collision`이 나오면 부분 결과를 사용하지 않습니다.
provider가 하나의 canonical identity에 서로 다른 kind를 보고한 것이므로 source 또는 project
scope를 수정하거나, 원인을 조사하는 동안 유효한 project만 선택합니다.

```bash
node packages/architecture-governance/dist/cli.js snapshot \
  --root . --registry architecture/registry.json \
  --project architecture-governance \
  --worktree --format json \
  --output reports/architecture-governance-symbols.json
```

CLI는 한 kind를 임의로 선택하지 않고 fail-closed합니다. `analysisProjects.fileExtensions`로 수집
범위를 줄일 수 있지만, 해결되지 않은 identity 충돌을 숨기는 용도로 사용해서는 안 됩니다.

## 5. 컨텍스트 심볼 집합 비교

화면, API, transaction 등 컨텍스트별로 직렬화한 심볼 집합이 있다면 두 번째 graph를 만들지 않고
비교할 수 있습니다.

```bash
node packages/architecture-governance/dist/cli.js intersect \
  --root . \
  --left reports/screen-symbols.json \
  --right reports/api-symbols.json \
  --format markdown \
  --output reports/context-intersection.md
```

입력은 `{ "id": "screen", "symbols": [...] }` 또는 history snapshot을 감싼
`{ "snapshot": { ... } }` 형식입니다. 결과는 deterministic한 `intersection`, `onlyLeft`,
`onlyRight` 집합을 가집니다. 멤버십은 겹칠 수 있으며 원래 심볼 identity를 복제하지 않습니다.

## 6. 문서 컨텍스트에는 sem-doc 사용

`sem-doc`는 SEM 관계, Git, TSDoc binding을 결합하는 별도 private PoC입니다.

```bash
pnpm --filter @tsdoc-edge/sem-doc build

# 한 top-level entity와 dependents, 문서 backlink 수집
pnpm --filter @tsdoc-edge/sem-doc exec node dist/cli.js \
  work-context SemClient \
  --file src/sem-client.ts \
  --docs-root spec \
  --depth 2 \
  --json

# untracked 파일을 포함한 Git working-tree 증거
pnpm --filter @tsdoc-edge/sem-doc exec node dist/cli.js diff --json

# 정확한 문서-entity binding 색인과 검증
pnpm --filter @tsdoc-edge/sem-doc exec node dist/cli.js docs index spec --json
pnpm --filter @tsdoc-edge/sem-doc exec node dist/cli.js docs validate-bindings spec --json
```

직접 관계만 필요하면 `--depth 1`, 제한된 전이 관계가 필요하면 `--depth 2`를 사용합니다.
`usageFiles`는 SEM dependents에서 얻은 정렬된 파일 단위 구조 신호이며, 정확한 reference 위치,
runtime call graph, 함수 호출 횟수가 아닙니다. 문서 frontmatter와 `sem-doc-work-context.v4`는
[`sem-doc README`](https://github.com/mineclover/context-action/blob/main/packages/sem-doc/README.md)를
참고하세요.

## 출력과 종료 코드

자동화에는 `--format json`, PR artifact에는 `--format markdown`을 사용합니다.

| 코드 | 의미 |
| ---: | --- |
| `0` | 선택한 `--fail-on` threshold를 통과함 |
| `1` | finding이 선택한 threshold에 도달함 |
| `2` | 입력·filesystem·SEM 실행 오류로 유효한 report를 만들지 못함 |

report는 review evidence입니다. business correctness, dynamic loading, runtime data flow, 내부
함수 호출 순서를 증명하지 않습니다. 동작 테스트, owner review, 공개 문서를 별도 evidence source로
유지하세요.

## CI 기본 recipe

```bash
pnpm install --frozen-lockfile
pnpm arch:type-check
pnpm arch:check:registry
pnpm arch:check
pnpm arch:test
```

Pull request에서는 `--from <base-sha> --to <head-sha>`를 지정한 range check를 추가하고 JSON 또는
Markdown report를 artifact로 업로드합니다. range report는 review 범위를 좁히는 자료이며 전체
architecture gate를 대체하지 않습니다.
