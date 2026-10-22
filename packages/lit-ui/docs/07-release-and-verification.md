# 07. 공개 릴리스와 검증

이 문서는 `@context-action/lit@0.1.0`, `@context-action/lit-ui@0.1.0` 공개 preview의
검증 계약과 보호 배포 경로를 설명합니다. 릴리스 계획의 source of truth는
[`releases/LIT_PUBLIC_0.1.0.md`](../../../releases/LIT_PUBLIC_0.1.0.md)와
[`releases/lit-public-2026-10.json`](../../../releases/lit-public-2026-10.json)입니다.

## 1. 패키지 경계

```text
@context-action/lit@0.1.0
  └─ @context-action/core@^1.2.6

@context-action/lit-ui@0.1.0
  ├─ @context-action/core@^1.2.6
  └─ @context-action/lit@^0.1.0
```

선택적 peer:

- `lit@^3.2.0`
- `@lit/context@^1.1.0`
- `react@^18 || ^19` (bridge 전용)
- `@lit-labs/ssr@^4.1.0` (`./ssr`)
- `@lit-labs/ssr-client@^1.1.8` (`./ssr`, `./hydrate`)

공개 패키지는 `private: false`, `publishConfig.access=public`, Apache-2.0 LICENSE,
CHANGELOG, repository metadata를 포함합니다.

## 2. 로컬 검증

```sh
pnpm install --frozen-lockfile
pnpm verify:lit-public-release -- --require-current-source
pnpm verify:lit-public-workflows
pnpm check:lit
pnpm verify:lit-react-compatibility
pnpm --filter @context-action/lit-ui test:browser
pnpm verify:package-exports
pnpm verify:package-tarballs
pnpm verify:lit-packed-consumer
pnpm package-boundary:check
pnpm release:check
```

| 명령 | 확인 내용 |
| --- | --- |
| `verify:lit-public-release` | plan/manifest/version/dependency/CHANGELOG/Lerna 일치 |
| `verify:lit-public-workflows` | candidate/promotion guard, input, publish order |
| `check:lit` | build, type-check, unit, edge runtime |
| `verify:lit-react-compatibility` | React 18 consumer matrix |
| `test:browser` | Chromium DSD hydration/event/controller/part/data |
| `verify:package-exports` | ESM/CJS/types export contract |
| `verify:package-tarballs` | LICENSE/README/CHANGELOG/archive target |
| `verify:lit-packed-consumer` | tarball 설치, SSR, hydrate export, 소비자 타입 |

## 3. 보호 배포

### Candidate

Workflow: `publish-lit-public-candidate.yml`

```text
inputs:
  release_commit: 승인된 immutable main SHA
  publish_auth: token | oidc
environment: npm-stable
candidate tag: next
```

Candidate는 다음을 fail-closed로 수행합니다.

1. release commit이 main의 승인된 commit인지 확인
2. Lit release plan과 workflow contract 검증
3. release gate, Lit build/type/test/edge/browser
4. package exports/tarballs/packed consumer/boundary
5. publication 직전 source 불변 재검증
6. `@context-action/lit` → `@context-action/lit-ui` 순서로 `next` 게시
7. provenance, published consumer smoke, registry evidence

### 첫 배포 bootstrap

두 패키지는 아직 npm에 없으므로 첫 배포는 반드시:

```text
publish_auth = token
NPM_TOKEN in npm-stable environment
```

OIDC/trusted publishing은 초기 package version이 npm에 존재한 후 별도로 검토합니다.
Candidate workflow는 OIDC 선택 시 package 존재 여부를 확인하고 없으면 fail-closed로 중단합니다.

### Promotion

Workflow: `promote-lit-public.yml`

```text
inputs:
  release_commit: candidate와 동일한 SHA
  confirmation: PROMOTE_LIT_PUBLIC
environment: npm-stable
promotion tag: latest
```

Promotion은 다음을 검증합니다.

1. `next` provenance가 release commit과 candidate workflow에 결속
2. published consumer matrix
3. 이전 `latest` snapshot
4. `lit` → `lit-ui` 순서로 `latest` 승격
5. `latest` consumer/provenance/evidence 재검증
6. 실패 시 candidate가 아직 `latest`일 때만 이전 `latest`로 rollback

## 4. 증거와 rollback

Candidate evidence:

```text
reports/npm-lit-public-candidate-summary.json
reports/npm-lit-public-candidate-provenance.json
reports/npm-lit-public-candidate-registry-evidence.json
```

Promotion evidence:

```text
reports/npm-lit-public-promotion-preflight-provenance.json
reports/npm-lit-public-promotion-summary.json
reports/npm-lit-public-promotion-provenance.json
reports/npm-lit-public-promotion-registry-evidence.json
```

Workflow artifact:

- `npm-lit-public-candidate-evidence`
- `npm-lit-public-promotion-evidence`

Rollback은 promotion helper가 캡처한 이전 `latest`만 사용하며, 승격 이후 `latest`가 다른 값으로 바뀐 경우
rollback을 거부합니다.

## 5. 금지 경로

- 로컬 `npm publish`
- 직접 `npm dist-tag`
- mutable working tree에서 publish
- candidate 검증 없이 `latest` 변경
- provenance/consumer evidence 없이 promotion
- 이미 게시된 버전 덮어쓰기

두 패키지는 0.x public preview입니다. 1.0 안정성 결정 전에는 API와 지원 범위가 바뀔 수 있습니다.
