---
document_id: context-layered--repository-surface-catalog
category: context-layered
source_path: ko/context-layered/repository-surface-catalog.md
character_limit: 2000
last_update: '2026-11-19T21:52:04.893Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
저장소 표면 카탈로그 (API · 예제 · 관리 문서 기준 규격)

저장소 표면 카탈로그 (API · 예제 · 관리 문서 기준 규격) 상태: Active 스펙 / 결정 ID: CA-SURFACE-CATALOG-001 소유자: Framework Architecture & Documentation Governance 정식 JSON 카탈로그: - catalog/repository-surface/api-surface.v1.json - catalog/repository-surface/example-surface.v1.json - catalog/repository-surface/document-surface.v1.json 이 문서는 저장소 내 세 가지 핵심 표면의 원칙, 기본 규격(스키마·분류·검증 규칙), 그리고 전체 목록을 정의합니다. 1. API 전체 구성: 20개 워크스페이스 패키지(packages/), 공개 exports 서브패스, 워크스페이스 의존성, 안정성 등급, TypeDoc 포함 범위 2. 예제가 설명하는 것: example/ 앱 내 13개 의미 그룹(72개 정식 라우트 전체), 독립 데모 2종(demos/bolt-style-editor, examples/vanilla-js), 7개 패키지 로컬 examples/, 9개 내러티브 예제 문서 3. 관리되는 문서 구조: 13개 루트 마크다운 문서, 13개 관리 문서 영역(권한 등급·한영 쌍 정책·추적 중인 번역 공백), 파생 TypeDoc/LLMS 산출물 관련 기준 문서는 패키지 경계 및 코드베이스 관리 컨벤션, 스펙·이슈·문서 관리 컨벤션, 문서 및 개발 관리 컨벤션, ADR CA-SURFACE-CATALOG-001입니다. --- 1. 5대 기본 원칙 1. 원본 우선 및 비복제(Source-First Non-Duplication): 런타임 매니페스트(packages//package.json), TypeDoc 엔트리(typedoc.json), 라우트 등록(example/src/App.tsx), 사람이 작성한 가이드(docs/{en,ko}/)

Key points:
• [`catalog/repository-surface/api-surface.v1.json`](../../../catalog/repository-surface/api-surface.v1.json)
• [`catalog/repository-surface/example-surface.v1.json`](../../../catalog/repository-surface/example-surface.v1.json)
• [`catalog/repository-surface/document-surface.v1.json`](../../../catalog/repository-surface/document-surface.v1.json)
• `docs/api/generated` (`pnpm docs:api`) ← `typedoc.json` + export된 TypeScript 소스/JSDoc
• `docs/en/api` 및 `docs/.vitepress/config/api-spec.ts` (`pnpm docs:sync`) ← `docs/api/generated` + `typedoc-vitepress-sync`
• `llmsData` (`pnpm llms:sync-docs...