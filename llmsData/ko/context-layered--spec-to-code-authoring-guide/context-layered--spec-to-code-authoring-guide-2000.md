---
document_id: context-layered--spec-to-code-authoring-guide
category: context-layered
source_path: ko/context-layered/spec-to-code-authoring-guide.md
character_limit: 2000
last_update: '2026-11-21T09:09:45.490Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
스펙 기반 코드 작성 가이드 (Spec-to-Code Authoring Guide)

스펙 기반 코드 작성 가이드 (Spec-to-Code Authoring Guide) 상태: Active 스펙 / 결정 ID: CA-SURFACE-CATALOG-001, CA-SPEC-EVIDENCE-001, CA-STATECHART-EFFECT-001, CA-ELEMENT-INTEROP-001 소유자: Framework Core, React Runtime & Architecture Governance 관련 명세: - 개발 컨벤션 인덱스 - Implementation Playbook 표준 컨벤션 - Store별 선택 및 사용법 가이드 - Core Action Contracts - React State Contracts - 상호작용 의도 계약에서 구현까지의 흐름 - 통합 트라이어드 자율 동기화 가이드 Context-Action은 스펙의 설계 의도, 도메인 상태, 실행 파이프라인, UI 바인딩, 자동 검증 게이트가 서로 1:1로 대응되도록 설계된 프레임워크입니다. 새 기능을 구현할 때마다 여러 문서를 왕복하지 않고, 설계 스펙에서 실제 코드와 검증 명령까지 한 번에 관통할 수 있도록 작성 흐름 전체를 하나로 묶었습니다. --- 1. End-to-End 스펙-코드 파이프라인 --- 2. 스펙 ↔ 레이어 ↔ 검증 게이트 매핑 매트릭스 | 작성 단계 | 대상 디렉터리 / 산출물 | 핵심 코드 작성 규칙 | 기준 명세 문서 | 강제 범위 & 검증 수단 | | --- | --- | --- | --- | --- | | Stage 0 · 의도 & 상태 티어링 | 설계 스펙 / PR / @evidence | UX 단축·대체 신호·복구 경로 기록(CA-IIC-); 2-Second State Rule 적용 (Tier 1 TypeSpec + @evidenceReview, Tier 2 클라이언트 계산·활동 로그, Tier 3 휘발성 UI 상태 제외) | IIC 구현 흐름, CA-SPEC-EVIDENCE-001 | 권고 / 크로스-레포 (Advisory / Cross-Repo) — 인접 ttsc-ex / oa-sdk Policy Hopping 게이트 실행 시 fail-closed | | Stage 1 · 경계 & Store 선택 | contexts/ (Contexts.tsx, Context.ts) | BusinessActionIntent 와 LayoutActionIntent 분리(No Mixed Payloads); 도메인 규모별 점진적 도

Key points:
• [개발 컨벤션 인덱스](./convention-index.md)
• [Implementation Playbook 표준 컨벤션](./implementation-convention.md)
• [Store별 선택 및 사용법 가이드](./store-selection-and-usage-guide.md)
• [Core Action Contracts](../../../packages/core/docs/action-contracts.md)
• [React State Contracts](../../../packages/react/docs/state-contracts.md)
• [상호작용 의도 계약에서 구현까지의 흐름](./interaction-intent-implementation-flow.md)
• [통합 트라이어드 자율 동기화 가이드](./triad-evidence-sync-guide.md)
• **Enterprise 6-Layer Playbook (React HandlerRegistry + 순수 business + 명시적 FSM + IIC):**
• **Headless-First Symmetric DI (`runtime/` + `ownership="shared"` React DI):**
• **도구 호출형 AI 워크스페이스 (`tool-protocol` + `ai-sdk` + `webmcp` + `tool-durable-operations`):**