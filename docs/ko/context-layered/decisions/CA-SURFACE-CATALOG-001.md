# CA-SURFACE-CATALOG-001: 저장소 API·예제·문서 표면 카탈로그 거버넌스

**상태:** accepted  
**소유자:** Framework Architecture & Documentation Governance  
**관련 이슈/스펙:** CA-SURFACE-CATALOG-001 ([저장소 표면 카탈로그](../repository-surface-catalog.md), [패키지 경계 및 코드베이스 관리 컨벤션](../package-boundary-convention.md), [스펙·이슈·문서 관리 컨벤션](../change-management-convention.md))

## 맥락

현재 저장소는 20개 워크스페이스 패키지(`packages/*`), `example/` 앱 내 76개 정식 라우트(레거시 리다이렉트 포함 총 120개), 독립 데모(`demos/bolt-style-editor`, `examples/vanilla-js`), 7개 패키지 로컬 `examples/`, 9개 내러티브 예제 가이드, 13개 루트 마크다운 파일, 한영 문서 트리, 릴리스 매니페스트, 파생 TypeDoc/LLMS 산출물로 구성되어 있습니다.

기존에는 이러한 표면이 `package.json`, `typedoc.json`, `example/src/App.tsx`, `sidebars.ts`, `package-boundary-convention.md` 등에 흩어져 있어(`@context-action/lit`, `@context-action/lit-ui`, `@context-action/webmcp`, `@context-action/template-react`가 패키지 맵 표에서 누락되는 등), 새 패키지나 예제 라우트·미번역 문서가 추가될 때 조용한 드리프트가 발생했습니다.

## 검토한 선택지

- **수작업 마크다운 목록만 유지**: 패키지, export subpath, 정식 라우트, 마크다운 트리가 바뀔 때 즉시 불일치가 발생하므로 제외했습니다.
- **기존 원본(`package.json`, `typedoc.json`, `App.tsx`)을 단일 생성기로 대체**: 각 표면은 이미 정식 런타임 원본을 소유하고 있으며 런타임 소유권을 복제하는 것은 `package-boundary-convention.md`에 위배되므로 제외했습니다.
- **옵션 1 (채택): `catalog/repository-surface/` 아래 3개 버전 관리 JSON 카탈로그와 실제 디스크 간 fail-closed 대조 검증 + 한영 기본 규격 문서**: 기존 정식 원본의 소유권을 유지하면서 `pnpm verify:surface-catalog`로 1:1 구조 정합성을 강제합니다.

## 결정

`catalog/repository-surface/` 아래 3개 버전 관리 카탈로그와 한영 기본 규격 문서를 도입합니다.

- `catalog/repository-surface/api-surface.v1.json`: 20개 전체 워크스페이스 패키지의 `layer`, `visibility`, `stability`, `exports` 서브패스, 워크스페이스 의존성/피어, `typedocEntryPoints`, `readme`, `authoritativeDocs`, `verificationGate`를 나열·고정합니다.
- `catalog/repository-surface/example-surface.v1.json`: `example/` 내 13개 의미 그룹(76개 정식 라우트 전체), 독립 데모 2종(`demos/bolt-style-editor`, `examples/vanilla-js`), 7개 `packages/*/examples` 스위트, 9개 한영 내러티브 예제 문서(`docs/{en,ko}/examples/*.md`)가 무엇을 설명하는지 나열합니다.
- `catalog/repository-surface/document-surface.v1.json`: 13개 루트 마크다운 파일, 관리 영역별 `authorityClass` 및 `pairingPolicy`(`strict-paired`, `tracked-partial`, `single-locale`, `derived`, `not-applicable`), 파생 TypeDoc/LLMS 산출물을 나열합니다.
- `scripts/verify-repository-surface-catalog.mjs`(`pnpm verify:surface-catalog`) 및 `scripts/verify-repository-surface-catalog.test.mjs`를 `pnpm convention:check`에 연결해 fail-closed로 드리프트를 차단합니다.

## 결과와 invariant

1. **원본 우선 및 비복제(Source-First)**: 카탈로그는 `package.json`, `typedoc.json`, `example/src/App.tsx`, `docs/`를 대체하지 않고 색인·검증합니다.
2. **부분 번역 격차의 명시적 추적**: 기존 번역 공백이 남아 있는 `docs/{en,ko}/guide`와 `docs/{en,ko}/troubleshooting`은 `tracked-partial` 정책과 정확한 `knownUnpaired` 목록으로 관리하고, `concept`, `context-layered`, `examples`, `llms`는 `strict-paired` 무결성을 강제합니다.
3. **Fail-Closed 드리프트 차단**: 워크스페이스 패키지, export 서브패스, 워크스페이스 의존성, 정식 예제 라우트, `packages/*/examples`, 루트 `.md` 파일, 미번역 가이드가 카탈로그 갱신 없이 변경되면 `pnpm verify:surface-catalog` 및 `pnpm convention:check`가 즉시 실패합니다.
4. **잔여 공백 가시화**: TypeDoc이 공개 패키지 16개 중 6개만 포함하는 현황과 `guide`/`troubleshooting` 번역 공백을 숨기지 않고 추적 가능한 백로그로 노출합니다.

## 검증 증거

- 기본 규격 및 전체 목록: [저장소 표면 카탈로그](../repository-surface-catalog.md) (EN: [Repository Surface Catalog](../../../en/context-layered/repository-surface-catalog.md))
- 카탈로그 계약: `catalog/repository-surface/api-surface.v1.json`, `catalog/repository-surface/example-surface.v1.json`, `catalog/repository-surface/document-surface.v1.json`
- Fail-closed 검증기 및 회귀 테스트: `scripts/verify-repository-surface-catalog.mjs`, `scripts/verify-repository-surface-catalog.test.mjs` (`pnpm verify:surface-catalog`, `pnpm convention:check`)
- 문서 탐색 및 빌드 게이트: `pnpm docs:management`, `pnpm llms:check`, `pnpm docs:build`

## 되돌림 또는 migration 조건

패키지 계층, 안정성 등급 또는 문서 권한 분류 체계가 호환되지 않게 바뀔 때는 스키마 버전(`*.v2.json`)을 올립니다. 패키지가 폐기되거나 `tracked-partial` 영역의 한영 번역이 100% 완료되면 해당 항목을 갱신하고 `strict-paired`로 승격합니다.
