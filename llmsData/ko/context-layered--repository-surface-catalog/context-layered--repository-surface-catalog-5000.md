---
document_id: context-layered--repository-surface-catalog
category: context-layered
source_path: ko/context-layered/repository-surface-catalog.md
character_limit: 5000
last_update: '2026-11-19T21:52:04.893Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
저장소 표면 카탈로그 (API · 예제 · 관리 문서 기준 규격)

저장소 표면 카탈로그 (API · 예제 · 관리 문서 기준 규격) 상태: Active 스펙 / 결정 ID: CA-SURFACE-CATALOG-001 소유자: Framework Architecture & Documentation Governance 정식 JSON 카탈로그: - catalog/repository-surface/api-surface.v1.json - catalog/repository-surface/example-surface.v1.json - catalog/repository-surface/document-surface.v1.json 이 문서는 저장소 내 세 가지 핵심 표면의 원칙, 기본 규격(스키마·분류·검증 규칙), 그리고 전체 목록을 정의합니다. 1. API 전체 구성: 20개 워크스페이스 패키지(packages/), 공개 exports 서브패스, 워크스페이스 의존성, 안정성 등급, TypeDoc 포함 범위 2. 예제가 설명하는 것: example/ 앱 내 13개 의미 그룹(72개 정식 라우트 전체), 독립 데모 2종(demos/bolt-style-editor, examples/vanilla-js), 7개 패키지 로컬 examples/, 9개 내러티브 예제 문서 3. 관리되는 문서 구조: 13개 루트 마크다운 문서, 13개 관리 문서 영역(권한 등급·한영 쌍 정책·추적 중인 번역 공백), 파생 TypeDoc/LLMS 산출물 관련 기준 문서는 패키지 경계 및 코드베이스 관리 컨벤션, 스펙·이슈·문서 관리 컨벤션, 문서 및 개발 관리 컨벤션, ADR CA-SURFACE-CATALOG-001입니다. --- 1. 5대 기본 원칙 1. 원본 우선 및 비복제(Source-First Non-Duplication): 런타임 매니페스트(packages//package.json), TypeDoc 엔트리(typedoc.json), 라우트 등록(example/src/App.tsx), 사람이 작성한 가이드(docs/{en,ko}/)가 정식 원본입니다. 카탈로그는 이를 복제하지 않고 색인·교차 검증합니다. 2. 권한 문서와 파생 산출물의 엄격한 분리: 모든 관리 문서는 authoritative, discovery, evidence, derived, transitional, historical 중 하나로 분류합니다. 파생 산출물(docs/api/generated, docs/en/api, api-spec.ts, llmsData, llms-.txt)은 직접 수정하지 않고 원본에서 재생성합니다. 3. 3개 표면의 버전 관리 스키마 대칭성: API(api-surface.v1.json), 예제(example-surface.v1.json), 문서(document-surface.v1.json) 모두 버전화된 스키마, 안정적 kebab ID, 한영 설명(en / ko), 명시적 검증 게이트(verificationGate)를 갖습니다. 4. 한영 번역 격차의 정직한 계상: 동기화가 강제되는 디렉터리는 strict-paired(미번역 0건)로 잠그고, 기존 번역 공백이 남아 있는 guide와 troubleshooting은 tracked-partial + knownUnpaired 목록으로 관리해 공백이 조용히 늘어나지 않도록 합니다. 5. Fail-Closed 드리프트 검증: 카탈로그 갱신 없이 패키지, export 서브패스, 워크스페이스 의존성, 정식 예제 라우트, packages//examples, 루트 .md, 또는 미번역 가이드가 바뀌면 pnpm verify:surface-catalog와 pnpm convention:check가 즉시 실패합니다. --- 2. 기본 규격 패키지 계층 및 안정성 등급 (api-surface.v1.json) | 계층 (layer) | 역할 | 사용 안정성 등급 (stability) | | --- | --- | --- | | foundation | Zero/최소 의존성 코어 계약 및 엔진 (core, store-core, mutative-core, tool-protocol, tool-durable-operations) | stable, public-preview | | framework-adapter | 프레임워크 바인딩 (react, mutative, lit, preact) | stable, public-preview | | ui-runtime | DOM 루트 소유권, 웹 컴포넌트, FACE, SSR/하이드레이션 (lit-ui, preact-ui) | public-preview | | integration-adapter | 외부 프로토콜·런타임 어댑터 (ai-sdk, webmcp, xstate) | public-preview | | tooling | 빌드·문서·스타일 검증 도구 (llms-generator, typedoc-vitepress-sync, style-testing) | tooling, private | | private-host-support | 비공개 데모·스타터 지원 (live-code-editor, openrouter-browser-storage, template-react) | private | 문서 권한 분류 및 한영 쌍 정책 (document-surface.v1.json) | 권한 분류 (authorityClass) | 역할 | | --- | --- | | authoritative | 정식 사양, 아키텍처 컨벤션 또는 사용자 가이드 | | discovery | 정식 문서로 안내하는 루트 README, 에이전트 가이드, 인덱스 | | evidence | 불변 릴리스 계획, v1 감사·런북 기록, 검증 증거 | | derived | 기계 생성 산출물 (Type

Key points:
• [`catalog/repository-surface/api-surface.v1.json`](../../../catalog/repository-surface/api-surface.v1.json)
• [`catalog/repository-surface/example-surface.v1.json`](../../../catalog/repository-surface/example-surface.v1.json)
• [`catalog/repository-surface/document-surface.v1.json`](../../../catalog/repository-surface/document-surface.v1.json)
• `docs/api/generated` (`pnpm docs:api`) ← `typedoc.json` + export된 TypeScript 소스/JSDoc
• `docs/en/api` 및 `docs/.vitepress/config/api-spec.ts` (`pnpm docs:sync`) ← `docs/api/generated` + `typedoc-vitepress-sync`
• `llmsData` (`pnpm llms:sync-docs --changed-files <paths>`) ← `docs/{en,ko}/**/*.md`
• `docs/{en,ko}/llms/llms-origin.txt`, `llms-500chars.txt`, `llms-minimal.txt` (`llms-generate`) ← `llmsData/{en,ko}/**`
• **API 전체 구성**: 20개 워크스페이스 패키지(`packages/*`), 공개 `exports` 서브패스, 워크스페이스 의존성, 안정성 등급, TypeDoc 포함 범위
• **예제가 설명하는 것**: `example/` 앱 내 13개 의미 그룹(72개 정식 라우트 전체), 독립 데모 2종(`demos/bolt-style-editor`, `examples/vanilla-js`), 7개 패키지 로컬 `examples/`, 9개 내러티브 예제 문서
• **관리되는 문서 구조**: 13개 루트 마크다운 문서, 13개 관리 문서 영역(권한 등급·한영 쌍 정책·추적 중인 번역 공백), 파생 TypeDoc/LLMS 산출물
• **원본 우선 및 비복제(Source-First Non-Duplication)**: 런타임 매니페스트(`packages/*/package.json`), TypeDoc 엔트리(`typedoc.json`), 라우트 등록(`example/src/App.tsx`), 사람이 작성한 가이드(`docs/{en,ko}/**`)가 정식 원본입니다. 카탈로그는 이를 복제하지 않고 색인·교차 검증합니다.
• **권한 문서와 파생 산출물의 엄격한 분리**: 모든 관리 문서는 `authoritative`, `discovery`, `evidence`, `derived`, `transitional`, `historical` 중 하나로 분류합니다. 파생 산출물(`docs/api/generated`, `docs/en/api`, `api-spec.ts`, `llmsData`, `llms-*.txt`)은 직접 수정하지 않고 원본에서 재생성합니다.
• **3개 표면의 버전 관리 스키마 대칭성**: API(`api-surface.v1.json`), 예제(`example-surface.v1.json`), 문서(`document-surface.v1.json`) 모두 버전화된 스키마, 안정적 kebab ID, 한영 설명(`en` / `ko`), 명시적 검증 게이트(`verificationGate`)를 갖습니다.
• **한영 번역 격차의...