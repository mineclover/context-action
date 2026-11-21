---
document_id: context-layered--spec-to-code-authoring-guide
category: context-layered
source_path: ko/context-layered/spec-to-code-authoring-guide.md
character_limit: 5000
last_update: '2026-11-21T09:09:45.490Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
스펙 기반 코드 작성 가이드 (Spec-to-Code Authoring Guide)

스펙 기반 코드 작성 가이드 (Spec-to-Code Authoring Guide) 상태: Active 스펙 / 결정 ID: CA-SURFACE-CATALOG-001, CA-SPEC-EVIDENCE-001, CA-STATECHART-EFFECT-001, CA-ELEMENT-INTEROP-001 소유자: Framework Core, React Runtime & Architecture Governance 관련 명세: - 개발 컨벤션 인덱스 - Implementation Playbook 표준 컨벤션 - Store별 선택 및 사용법 가이드 - Core Action Contracts - React State Contracts - 상호작용 의도 계약에서 구현까지의 흐름 - 통합 트라이어드 자율 동기화 가이드 Context-Action은 스펙의 설계 의도, 도메인 상태, 실행 파이프라인, UI 바인딩, 자동 검증 게이트가 서로 1:1로 대응되도록 설계된 프레임워크입니다. 새 기능을 구현할 때마다 여러 문서를 왕복하지 않고, 설계 스펙에서 실제 코드와 검증 명령까지 한 번에 관통할 수 있도록 작성 흐름 전체를 하나로 묶었습니다. --- 1. End-to-End 스펙-코드 파이프라인 --- 2. 스펙 ↔ 레이어 ↔ 검증 게이트 매핑 매트릭스 | 작성 단계 | 대상 디렉터리 / 산출물 | 핵심 코드 작성 규칙 | 기준 명세 문서 | 강제 범위 & 검증 수단 | | --- | --- | --- | --- | --- | | Stage 0 · 의도 & 상태 티어링 | 설계 스펙 / PR / @evidence | UX 단축·대체 신호·복구 경로 기록(CA-IIC-); 2-Second State Rule 적용 (Tier 1 TypeSpec + @evidenceReview, Tier 2 클라이언트 계산·활동 로그, Tier 3 휘발성 UI 상태 제외) | IIC 구현 흐름, CA-SPEC-EVIDENCE-001 | 권고 / 크로스-레포 (Advisory / Cross-Repo) — 인접 ttsc-ex / oa-sdk Policy Hopping 게이트 실행 시 fail-closed | | Stage 1 · 경계 & Store 선택 | contexts/ (Contexts.tsx, Context.ts) | BusinessActionIntent 와 LayoutActionIntent 분리(No Mixed Payloads); 도메인 규모별 점진적 도입(Level 1 Lite, Level 2 Standard Headless-First DI, Level 3 Enterprise 6-Layer); Store 매트릭스에 따른 프리미티브 선택 | Store 선택 가이드, 트라이어드 가이드 | 레포 CI 강제 (CI-Enforced): pnpm convention:check, pnpm package-boundary:check | | Stage 2 · 순수 도메인 로직 | business/ (Draft.ts, Validation.ts, Result.ts, Activity.ts, StateMachine.ts) | React 및 @context-action/ import 전면 금지; 순수 전이 state + event -> nextState; UI 문구·DOM 호출 배제; UI 문자열 대신 도메인 이벤트 정의 | 표준 컨벤션, 명시적 상태 머신 | 레포 CI 강제 (CI-Enforced): pnpm convention:check (business/ 파일명 및 import 경계 검사) | | Stage 3A · 헤드리스 엔진 (선택) | runtime/ (create.ts, .test.ts) | React 없이 Node/Worker/Preact/Lit에서도 동작하는 순수 TS 엔진 조립 (ActionRegister + createStore / createStateStore / TimeTravelStoreManager); react/react-dom 및 React 하위 레이어 import 금지 | Context-Layered 가이드, Headless-First 예제 | 레포 CI 강제 (CI-Enforced): pnpm convention:check (runtime/ .ts 파일명 및 React/UI import 금지) | | Stage 3B · React 오케스트레이션 | handlers/ (HandlerRegistry.tsx, useHandlers.tsx, HandlerSupport.ts) | 3단계 커밋 루프(getValue() → business/ → setValue()/update()); 4-역할 핸들러 훅 사용; 다중 스토어 원자적 Undo는 StoreTransactionCoordinator / bindActionTransactions; 분리 애스펙트 복원은 Promise.allSettled 병렬 처리 | Core Action Contracts, React State Contracts | 레포 CI 강제 (CI-Enforced): pnpm convention:check (handlers/ 외 직접 핸들러 훅 호출 금지 및 Action → Store → Ref → Registry 순서 검증) | | Stage 4 · 얇은 UI & 호스트 브리지 | actions/, hooks/, views/ (.tsx) | actions/는 raw dispatch를 숨긴 의미적 명령만 노출; hooks/는 StoreReader 기반 화면 파생 모델 생성; views/는 파일 상단 @evidenceExclude, runtime//business//handlers/ 런타임 import 금지, 6-Level 레이아웃·4-Tier Z-Index 준수; Preact/Lit은 읽기 전용 브리지 사용 | 폴더 구조, CA-ELEMENT-INTEROP-001 | 레포 CI 강제 (CI-Enforced): pnpm convention:check, pnpm --filter example check, pnpm verify:element-interop | | Stage 5 · 카탈로그, 문서 & 영수증 | catalog/repository-surface/.

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