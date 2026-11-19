---
document_id: context-layered--decisions--CA-SURFACE-CATALOG-001
category: context-layered
source_path: ko/context-layered/decisions/CA-SURFACE-CATALOG-001.md
character_limit: 2000
last_update: '2026-11-19T21:52:06.062Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
CA-SURFACE-CATALOG-001: 저장소 API·예제·문서 표면 카탈로그 거버넌스

CA-SURFACE-CATALOG-001: 저장소 API·예제·문서 표면 카탈로그 거버넌스 상태: accepted 소유자: Framework Architecture & Documentation Governance 관련 이슈/스펙: CA-SURFACE-CATALOG-001 (저장소 표면 카탈로그, 패키지 경계 및 코드베이스 관리 컨벤션, 스펙·이슈·문서 관리 컨벤션) 맥락 현재 저장소는 20개 워크스페이스 패키지(packages/), example/ 앱 내 72개 정식 라우트(레거시 리다이렉트 포함 총 116개), 독립 데모(demos/bolt-style-editor, examples/vanilla-js), 7개 패키지 로컬 examples/, 9개 내러티브 예제 가이드, 13개 루트 마크다운 파일, 한영 문서 트리, 릴리스 매니페스트, 파생 TypeDoc/LLMS 산출물로 구성되어 있습니다. 기존에는 이러한 표면이 package.json, typedoc.json, example/src/App.tsx, sidebars.ts, package-boundary-convention.md 등에 흩어져 있어(@context-action/lit, @context-action/lit-ui, @context-action/webmcp, @context-action/template-react가 패키지 맵 표에서 누락되는 등), 새 패키지나 예제 라우트·미번역 문서가 추가될 때 조용한 드리프트가 발생했습니다. 검토한 선택지 - 수작업 마크다운 목록만 유지: 패키지, export subpath, 정식 라우트, 마크다운 트리가 바뀔 때 즉시 불일치가 발생하므로 제외했습니다. - 기존 원본(package.json, typedoc.json, App.tsx)을 단일 생성기로 대체: 각 표면은 이미 정식 런타임 원본을 소유하고 있으며 런타임 소유권을 복제하는 것은 package-boundary-convention.md에 위배되므로 제외했습니다.

Key points:
• **수작업 마크다운 목록만 유지**: 패키지, export subpath, 정식 라우트, 마크다운 트리가 바뀔 때 즉시 불일치가 발생하므로 제외했습니다.
• **기존 원본(`package.json`, `typedoc.json`, `App.tsx`)을 단일 생성기로 대체**: 각 표면은 이미 정식 런타임 원본을 소유하고 있으며 런타임 소유권을 복제하는 것은 `package-boundary-convention.md`에 위배되므로 제외했습니다.
• **옵션 1 (채택): `catalog/repository-surface/` 아래 3개 버전 관리 JSON 카탈로그와 실제 디스크 간 fail-closed 대조 검증 + 한영 기본 규격 문서**: 기존 정식 원본의 소유권을 유지하면서 `pnpm verify:surface-catalog`로 1:1 구조 정합성을 강제합니다.
• `catalog/repository-surface/api-surface.v1.json`: 20개 전체 워크스페이스 패키지의 `layer`, `visibility`, `stability`, `exports` 서브패스, 워크스페이스 의존성/피어,...