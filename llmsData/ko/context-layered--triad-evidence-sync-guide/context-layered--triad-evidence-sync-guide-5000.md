---
document_id: context-layered--triad-evidence-sync-guide
category: context-layered
source_path: ko/context-layered/triad-evidence-sync-guide.md
character_limit: 5000
last_update: '2026-10-17T15:53:39.588Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
통합 트라이어드(`ttsc-ex` · `oa-sdk` · `context-action`) 책임 분리 및 자율 동기화 가이드

통합 트라이어드(ttsc-ex · oa-sdk · context-action) 책임 분리 및 자율 동기화 가이드 상태: active 소유자: Framework Core & Architecture Governance 관련 문서: Implementation Convention, CA-SPEC-EVIDENCE-001, 패널 레이아웃 Preference 컨벤션 상대 워크스페이스 참조 정본: - ttsc-ex 통합 허브: /Users/junwoobang/workflow/samchon/docs/cross-repo-responsibility-and-sync-guide.md - ttsc-ex 프론트엔드 연동 가이드: /Users/junwoobang/workflow/samchon/docs/context-action-frontend-evidence-guide.md - oa-sdk 위임 및 동기화 가이드: /Users/junwoobang/workflow/oa-sdk/docs/guides/ttsc-ex-delegation-and-sync-guide.md --- 1. 목적 및 3대 워크스페이스 책임 경계 context-action은 통합 트라이어드(Unified Triad) 아키텍처에서 프론트엔드 모듈러 상태 관리, 액션 인텐트 파이프라인, 그리고 뷰포트 레이아웃 위계(Pillar 3 & Pillar 4)를 전담합니다. 반면 .tsp(TypeSpec) 도메인 계약 모델링과 TypeScript/OpenAPI 코드 생성은 oa-sdk(Pillar 1 & 2)가 전담하며, 요구사항 앵커 증명(@evidence)과 컴파일러 그래프/해시 잠금 검증(@evidenceReview)은 ttsc-ex(Pillar 5)가 전담합니다. 본 문서는 context-action 작업자 및 AI 에이전트가 패키지 무의존성 원칙(@context-action/core, @context-action/react의 런타임 의존성 0개)을 훼손하지 않으면서도, ttsc-ex와 oa-sdk에서 고도화된 규약을 자율적으로 읽어와(Self-Serve Pull) 반영하는 기준과 절차를 설명합니다. | 워크스페이스 | 핵심 소유 책임 (Single Responsibility) | context-action과의 경계 규칙 | | :--- | :--- | :--- | | context-action | • 6-Layer 분리 (contexts / business / handlers / actions / hooks / views)<br>• BusinessActionIntent vs LayoutActionIntent 분리<br>• 3-Tier State Ownership & Promise.allSettled 애스펙트 복원<br>• 6-Level 레이아웃 위계 & 2대 황금률 | @context-action/ 런타임 패키지는 @typespec/, @oa-sdk/, ttsc를 런타임 의존성으로 직접 추가하지 않음 | | oa-sdk | • 모든 .tsp 도메인·거버넌스 데코레이터 (@oa-sdk/typespec-decorators)<br>• .tsp $\rightarrow$ OpenAPI 3.1/3.2 및 TypeScript DTO/핸들러/상수 생성 (oa-gen)<br>• x-oa-sdk-trace + x-samchon-evidence JSDoc 합성 | context-action 애플리케이션/예제는 .tsp를 직접 파싱하지 않고 oa-sdk가 생성한 불변 TypeScript 선언(dto.ts, handlers.ts 등)만 import하여 소비 | | ttsc-ex | • @samchon/typespec-evidence (@evidence, @evidenceExclude, @evidence)<br>• ttsc@0.33.1 + @wrtnlabs/evidence@0.8.0 컴파일러 그래프 및 @evidenceReview 해시 잠금 게이트 | business/ 순수 함수는 생성된 TS 선언을 @evidenceReview (또는 분리형 evidenceFiles)로 잠가 스펙 드리프트를 컴파일 타임에 차단 | --- 2. 양방향 참조 문서 지도 ttsc-ex 또는 oa-sdk의 업데이트 내용을 확인하고 가져올 때 아래 정본 문서를 먼저 읽습니다: 1. 3대 워크스페이스 책임 분리 및 매핑 허브 (ttsc-ex) - /Users/junwoobang/workflow/samchon/docs/cross-repo-responsibility-and-sync-guide.md 2. Context-Action 프론트엔드 Evidence & 레이아웃 통합 명세 (ttsc-ex) - /Users/junwoobang/workflow/samchon/docs/context-action-frontend-evidence-guide.md - /Users/junwoobang/workflow/samchon/docs/menu-driven-layout-hierarchy-guide.md - /Users/junwoobang/workflow/samchon/docs/distributed-identity-and-aspect-lifecycle-spec.md 3. .tsp 데코레이터 위임 및 코드젠 브리지 명세 (oa-sdk) - /Users/junwoobang/workflow/oa-sdk/docs/guides/ttsc-ex-delegation-and-sync-guide.md - /Users/junwoobang/workflow/oa-sdk/docs/guides/schema-architecture-and-ttsc-guide.md --- 3. context-action 자율 흡수(Pull) 5대 핵심 가이드라인 3.1 bus

Key points:
• `ttsc-ex` 통합 허브: `/Users/junwoobang/workflow/samchon/docs/cross-repo-responsibility-and-sync-guide.md`
• `ttsc-ex` 프론트엔드 연동 가이드: `/Users/junwoobang/workflow/samchon/docs/context-action-frontend-evidence-guide.md`
• `oa-sdk` 위임 및 동기화 가이드: `/Users/junwoobang/workflow/oa-sdk/docs/guides/ttsc-ex-delegation-and-sync-guide.md`
• **생성된 TypeScript 계약 심볼 잠금**:
• **주석 비대화 방지 (Comment-Bloat Pruning)**:
• `contexts/`와 `handlers/` 설계 시 두 종류의 인텐트 페이로드를 절대 혼합하지 않습니다(`No Mixed Payloads`):
• 백엔드/스키마 계층(`oa-sdk`)에서 Anti-God-Table 원칙에 따라 코어 엔티티(`@entityRoot`)와 확장 애스펙트(`@aspectOf`)가 분리된 경우, `handlers/` 계층은 **`Promise.allSettled`**로 병렬 조회하여 일부 부가 애스펙트가 실패하더라도 `degraded: true` / `null` 처리와 함께 코어 화면을 블로킹 없이 복원합니다.
• **6단계 DOM/논리 위계**: `L1 app-shell (page)` $\to$ 병렬 형제 `L2 page-canvas (region)` & `L3 dock-panel (pane)` $\to$ `L4 slot-panel (panel)` $\to$ `L5 section-card (section)` $\to$ `L6 floating-overlay (widget)`.
• **2대 황금률**:
• **4-Tier 시맨틱 Z-Index**: 임의의 매직 넘버(`9999` 등)를 금지하고 표준 시맨틱 토큰(`--z-base: 1` ~ `--z-toast: 1100`)만 사용합니다.
• **2초 상태 판별법**: 페이지 새로고침 후에도 유지되어야 하는 상태는 **Tier 1 Durable Domain Contract**(`.tsp` 모델 필수), 클라이언트 파생/전이 상태는 **Tier 2 Transient Application Logic**, 일시적 UI 크롬(모달 개폐, 포커스, 호버)은 **Tier 3 Volatile Presentation State**(TypeSpec/Evidence 면제)로 분류합니다.
• Tier 3 상태 중 사용자 행동 관측이 필요한 경우 `@oa-sdk/telemetry` 표준 추적 심볼(`UI:EDITOR:...`, 150ms 디바운스)만 연결합니다.
• **3대 워크스페이스 책임 분리 및 매핑 허브 (`ttsc-ex`)**
• **Context-Action 프론트엔드 Evidence & 레이아웃 통합 명세 (`ttsc-ex`)**
• **`.tsp` 데코레이터 위임 및 코드젠 브리지 명세 (`oa-sdk`)**
• **Step 1 — 업스트림 변경사항 확인**
• **Step 2 — 한/영 페어 문서 및 컨벤션 동기화**
• **Step 3 — 예제 및 핸들러/비즈니스 레이어 적용**
• **Step 4 — `context-action` 로컬 검증 게이트 실행**