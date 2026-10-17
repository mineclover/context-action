---
document_id: context-layered--triad-evidence-sync-guide
category: context-layered
source_path: ko/context-layered/triad-evidence-sync-guide.md
character_limit: 2000
last_update: '2026-10-17T15:53:39.587Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
통합 트라이어드(`ttsc-ex` · `oa-sdk` · `context-action`) 책임 분리 및 자율 동기화 가이드

통합 트라이어드(ttsc-ex · oa-sdk · context-action) 책임 분리 및 자율 동기화 가이드 상태: active 소유자: Framework Core & Architecture Governance 관련 문서: Implementation Convention, CA-SPEC-EVIDENCE-001, 패널 레이아웃 Preference 컨벤션 상대 워크스페이스 참조 정본: - ttsc-ex 통합 허브: /Users/junwoobang/workflow/samchon/docs/cross-repo-responsibility-and-sync-guide.md - ttsc-ex 프론트엔드 연동 가이드: /Users/junwoobang/workflow/samchon/docs/context-action-frontend-evidence-guide.md - oa-sdk 위임 및 동기화 가이드: /Users/junwoobang/workflow/oa-sdk/docs/guides/ttsc-ex-delegation-and-sync-guide.md --- 1. 목적 및 3대 워크스페이스 책임 경계 context-action은 통합 트라이어드(Unified Triad) 아키텍처에서 프론트엔드 모듈러 상태 관리, 액션 인텐트 파이프라인, 그리고 뷰포트 레이아웃 위계(Pillar 3 & Pillar 4)를 전담합니다. 반면 .tsp(TypeSpec) 도메인 계약 모델링과 TypeScript/OpenAPI 코드 생성은 oa-sdk(Pillar 1 & 2)가 전담하며, 요구사항 앵커 증명(@evidence)과 컴파일러 그래프/해시 잠금 검증(@evidenceReview)은 ttsc-ex(Pillar 5)가 전담합니다. 본 문서는 context-action 작업자 및 AI 에이전트가 패키지 무의존성 원칙(@context-action/core, @context-action/react의 런타임 의존성 0개)을 훼손하지 않으면서도, ttsc-ex와 oa-sd

Key points:
• `ttsc-ex` 통합 허브: `/Users/junwoobang/workflow/samchon/docs/cross-repo-responsibility-and-sync-guide.md`
• `ttsc-ex` 프론트엔드 연동 가이드: `/Users/junwoobang/workflow/samchon/docs/context-action-frontend-evidence-guide.md`
• `oa-sdk` 위임 및 동기화 가이드: `/Users/junwoobang/workflow/oa-sdk/docs/guides/ttsc-ex-delegation-and-sync-guide.md`
• **생성된 TypeScript 계약 심볼 잠금**:
• **주석 비대화 방지 (Comment-Bloat Pruning)**:
• `contexts/`와 `handlers/` 설계 시 두 종류의 인텐트 페이로드를 절대 혼합하지 않습니다(`No Mixed Payloads`):
• 백엔드/스키마 계층(`oa-sdk`)에서 Anti-God-Table 원칙에 따라 코어 엔티티(`@entityRoot`)와 확장...