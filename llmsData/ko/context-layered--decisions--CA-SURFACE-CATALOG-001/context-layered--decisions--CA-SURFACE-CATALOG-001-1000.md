---
document_id: context-layered--decisions--CA-SURFACE-CATALOG-001
category: context-layered
source_path: ko/context-layered/decisions/CA-SURFACE-CATALOG-001.md
character_limit: 1000
last_update: '2026-11-19T21:52:06.062Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
CA-SURFACE-CATALOG-001: 저장소 API·예제·문서 표면 카탈로그 거버넌스

CA-SURFACE-CATALOG-001: 저장소 API·예제·문서 표면 카탈로그 거버넌스 상태: accepted 소유자: Framework Architecture & Documentation Governance 관련 이슈/스펙: CA-SURFACE-CATALOG-001 (저장소 표면 카탈로그, 패키지 경계 및 코드베이스 관리 컨벤션, 스펙·이슈·문서 관리 컨벤션) 맥락 현재 저장소는 20개 워크스페이스 패키지(packages/), example/ 앱 내 72개 정식 라우트(레거시 리다이렉트 포함 총 116개), 독립 데모(demos/bolt-style-editor, examples/vanilla-js), 7개 패키지 로컬 examples/, 9개 내러티브

Key points:
• **수작업 마크다운 목록만 유지**: 패키지, export subpath, 정식 라우트, 마크다운 트리가 바뀔 때 즉시 불일치가 발생하므로 제외했습니다.
• **기존 원본(`package.json`, `typedoc.json`, `App.tsx`)을 단일 생성기로 대체**: 각 표면은 이미 정식 런타임 원본을...