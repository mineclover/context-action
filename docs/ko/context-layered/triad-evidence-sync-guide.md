# 통합 트라이어드(`ttsc-ex` · `oa-sdk` · `context-action`) 책임 분리 및 자율 동기화 가이드

**상태:** active  
**소유자:** Framework Core & Architecture Governance  
**관련 문서:** [Implementation Convention](./implementation-convention.md), [CA-SPEC-EVIDENCE-001](./decisions/CA-SPEC-EVIDENCE-001.md), [개발 컨벤션 인덱스](./convention-index.md), [패널 레이아웃 Preference 컨벤션](./usecase-panel-layout.md)  
**연결된 에이전트 스킬:** [`.agents/skills/context-action-implementation-playbook/SKILL.md`](../../../.agents/skills/context-action-implementation-playbook/SKILL.md), [`skills/context-action-implementation-playbook/SKILL.md`](../../../skills/context-action-implementation-playbook/SKILL.md)  
**상대 워크스페이스 참조 정본:**  
- `ttsc-ex` 통합 허브: `/Users/junwoobang/workflow/samchon/docs/cross-repo-responsibility-and-sync-guide.md`  
- `ttsc-ex` 프론트엔드 연동 가이드: `/Users/junwoobang/workflow/samchon/docs/context-action-frontend-evidence-guide.md`  
- `oa-sdk` 위임 및 동기화 가이드: `/Users/junwoobang/workflow/oa-sdk/docs/guides/ttsc-ex-delegation-and-sync-guide.md`

---

## 1. 목적 및 3대 워크스페이스 책임 경계 (Zero-Dependency 보존 원칙)

`context-action`은 통합 트라이어드(Unified Triad) 아키텍처에서 **프론트엔드 모듈러 상태 관리, 액션 인텐트 파이프라인, 그리고 뷰포트 레이아웃 위계(Pillar 3 & Pillar 4)**를 전담합니다.  
반면 `.tsp`(TypeSpec) 도메인 계약 모델링과 TypeScript/OpenAPI 코드 생성은 **`oa-sdk`(Pillar 1 & 2)**가 전담하며, 요구사항 앵커 증명(`@evidence`)과 컴파일러 그래프/해시 잠금 검증(`@evidenceReview`)은 **`ttsc-ex`(Pillar 5)**가 전담합니다.

본 문서는 `context-action` 작업자 및 AI 에이전트가 **패키지 무의존성 원칙(`@context-action/core`, `@context-action/react`, `@context-action/preact`, `@context-action/preact-ui`의 외부 도메인 런타임 의존성 0개)을 훼손하지 않으면서도, `ttsc-ex`와 `oa-sdk`에서 고도화된 규약을 자율적으로 읽어와(Self-Serve Pull) 반영하는 기준과 절차**를 설명합니다.

| 워크스페이스 | 핵심 소유 책임 (Single Responsibility) | `context-action`과의 경계 규칙 |
| :--- | :--- | :--- |
| **`context-action`** | • 6-Layer 분리 (`contexts / business / handlers / actions / hooks / views`)<br>• `BusinessActionIntent` vs `LayoutActionIntent` 분리 (`No Mixed Payloads`)<br>• 3-Tier State Ownership & `Promise.allSettled` 병렬 애스펙트 복원<br>• 6-Level 레이아웃 위계, 2대 황금률 & 4-Tier 시맨틱 Z-Index | `@context-action/*` 런타임 패키지는 `@typespec/*`, `@oa-sdk/*`, `ttsc`, `@wrtnlabs/evidence`를 런타임 의존성으로 직접 추가하지 않음 (**Zero-Dependency 보존**) |
| **`oa-sdk`** | • 모든 `.tsp` 도메인·거버넌스 데코레이터 (`@oa-sdk/typespec-decorators`)<br>• `.tsp` $\rightarrow$ OpenAPI 3.1/3.2 및 TypeScript DTO/핸들러/상수 생성 (`oa-gen`)<br>• `x-oa-sdk-trace` + `x-samchon-evidence` JSDoc 합성 | `context-action` 애플리케이션/예제는 `.tsp`를 직접 파싱하지 않고 `oa-sdk`가 생성한 불변 TypeScript 선언(`dto.ts`, `handlers.ts`, `identity.ts`, `aspect-storage.ts`, `tools.ts`)만 import하여 소비 |
| **`ttsc-ex`** | • `@samchon/typespec-evidence` (`@evidence`, `@evidenceExclude`, `## @evidence`)<br>• `ttsc@0.33.1` + `@wrtnlabs/evidence@0.8.0` 컴파일러 그래프 및 `@evidenceReview` 해시 잠금 게이트 | `business/` 순수 함수는 생성된 TS 선언을 `@evidenceReview ./generated/dto.ts#... #hash` (또는 분리형 `evidenceFiles`)로 잠가 스펙 드리프트를 컴파일 타임에 차단 |

---

## 2. 양방향 참조 문서 및 컨벤션 연결 지도

### 2.1 상대 워크스페이스 정본 (`ttsc-ex` & `oa-sdk`)
1. **3대 워크스페이스 책임 분리 및 매핑 허브 (`ttsc-ex`)**
   - `/Users/junwoobang/workflow/samchon/docs/cross-repo-responsibility-and-sync-guide.md`
2. **Context-Action 프론트엔드 Evidence & 레이아웃 통합 명세 (`ttsc-ex`)**
   - `/Users/junwoobang/workflow/samchon/docs/context-action-frontend-evidence-guide.md`
   - `/Users/junwoobang/workflow/samchon/docs/menu-driven-layout-hierarchy-guide.md`
   - `/Users/junwoobang/workflow/samchon/docs/distributed-identity-and-aspect-lifecycle-spec.md`
3. **`.tsp` 데코레이터 위임 및 코드젠 브리지 명세 (`oa-sdk`)**
   - `/Users/junwoobang/workflow/oa-sdk/docs/guides/ttsc-ex-delegation-and-sync-guide.md`
   - `/Users/junwoobang/workflow/oa-sdk/docs/guides/schema-architecture-and-ttsc-guide.md`

### 2.2 `context-action` 내부 연결 컨벤션 및 스킬
- **아키텍처 결정 기록**: [`CA-SPEC-EVIDENCE-001.md`](./decisions/CA-SPEC-EVIDENCE-001.md) (KO) / [`CA-SPEC-EVIDENCE-001.md`](../../en/context-layered/decisions/CA-SPEC-EVIDENCE-001.md) (EN)
- **구현 표준 컨벤션**: [`implementation-convention.md`](./implementation-convention.md) (KO) / [`implementation-convention.md`](../../en/context-layered/implementation-convention.md) (EN)
- **개발 컨벤션 인덱스**: [`convention-index.md`](./convention-index.md) (KO) / [`convention-index.md`](../../en/context-layered/convention-index.md) (EN)
- **에이전트 플레이북 스킬**: [`.agents/skills/context-action-implementation-playbook/SKILL.md`](../../../.agents/skills/context-action-implementation-playbook/SKILL.md) 및 [`skills/context-action-implementation-playbook/SKILL.md`](../../../skills/context-action-implementation-playbook/SKILL.md)

---

## 3. `context-action` 자율 흡수(Pull) 5대 핵심 가이드라인

### 3.1 `business/` Policy Hopping 및 `@evidenceReview` 문법 (`ttsc@0.33.1` / `@wrtnlabs/evidence@0.8.0`)

1. **생성된 TypeScript 계약 심볼 잠금 (`@evidenceReview ./generated/dto.ts#... #hash`)**:
   - 구버전처럼 `.ts`에서 `.tsp` 파일을 직접 지목(`@evidenceReview specs/order.tsp#...`)하지 않고, `oa-gen` 또는 `tsp-evidence pipeline`이 생성한 TypeScript 선언(`dto.ts`, `handlers.ts`, `identity.ts`, `aspect-storage.ts`, `tools.ts`)을 인용하고 리뷰 해시를 잠급니다:
     ```ts
     /**
      * @evidence ./generated/dto.ts#OrderDraftDTO Validates order draft bounds before submission
      * @evidenceReview ./generated/dto.ts#OrderDraftDTO #a1b2c3d4
      */
     export function validateOrderDraft(draft: OrderDraftDTO): ValidationIssue[] {
       // Pure validation logic (zero React/DOM imports)
     }
     ```
2. **Heading-Form 주석 (`## @evidence`, `## @evidenceReview`, `## @evidenceExclude`)**:
   - 다중 문단 사유, 불변식 목록, 체크리스트를 서술할 때는 단일 라인 태그 대신 Heading-Form 주석을 사용합니다:
     ```ts
     /**
      * ## @evidence ./generated/dto.ts#OrderValidationPolicy
      * - 주문 수량은 1~99 사이여야 한다.
      * - 결제 수단이 반드시 지정되어야 한다.
      *
      * ## @evidenceReview ./generated/dto.ts#OrderValidationPolicy #a1b2c3d4
      */
     export function evaluateOrderPolicy(draft: OrderDraftDTO): PolicyResult {
       // ...
     }
     ```
3. **분리형 증명 문서 (`evidenceFiles`) 및 파일 상단 `@evidenceExclude`**:
   - 프로덕션 코드의 주석 비대화(Comment Bloat)를 방지하려면 `evidence.config.json`의 **분리형 증명 문서**(`evidenceFiles: ["evidence/**/*.md"]`, `# <unit>` H1 블록 아래 작성)를 활용합니다.
   - Tier 3 프레젠테이션 전용 파일(`views/*.tsx` 등)은 **파일 최상단 주석에 `@evidenceExclude`**를 선언하여 파일 내 모든 export 선언에 면제를 자동 전파합니다:
     ```tsx
     /**
      * @evidenceExclude Tier 3 volatile presentation view component
      */
     export function OrderWorkspaceView() {
       // Render-only component
     }
     ```
   - 수정한 유닛만 빠르게 검증할 때는 `npx evidence check --only <unit> --context`를 사용합니다.

### 3.2 액션 인텐트 도메인 이원화 (`BusinessActionIntent` vs `LayoutActionIntent`)

- `contexts/`와 `handlers/` 설계 시 두 종류의 인텐트 페이로드를 절대 혼합하지 않습니다(**`No Mixed Payloads`**):
  1. **`BusinessActionIntent`**: 서버/스토리지 영속성 변이, 핵심 비즈니스 상태 머신(`*StateMachine.ts`) 전이, 또는 MCP/Agent 도구 디스패치를 유발하는 액션.
  2. **`LayoutActionIntent`**: 스플릿 독 개폐, 패널 리사이즈, 캔버스 줌/팬, 활성 탭 전환 등 로컬 뷰포트 크롬만 제어하는 액션.

```ts
// contexts/OrderContexts.tsx — 비즈니스 인텐트와 레이아웃 인텐트의 물리적 분리
export interface OrderBusinessActionIntent {
  updateDraft: Partial<OrderDraftDTO>;
  submitOrder: void;
  resetOrder: void;
}

export interface OrderLayoutActionIntent {
  toggleInspectorDock: { open?: boolean };
  resizeSlotPanel: { panelId: string; widthPx: number };
  setCanvasTransform: { zoom: number; panX: number; panY: number };
}
```

### 3.3 분리 저장 관점(`@aspectOf`)의 비동기 병렬 복원 (`Promise.allSettled`)

- 백엔드/스키마 계층(`oa-sdk`)에서 Anti-God-Table 원칙에 따라 코어 엔티티(`@entityRoot`)와 확장 애스펙트(`@aspectOf`)가 분리된 경우, `handlers/` 계층은 **`Promise.allSettled`**로 병렬 조회하여 일부 부가 애스펙트가 실패하더라도 `degraded: true` / `null` 처리와 함께 코어 화면을 블로킹 없이 복원합니다:

```ts
// handlers/useOrderHydrationHandlers.tsx
const [rootResult, fulfillmentAspect, auditAspect] = await Promise.allSettled([
  fetchOrderRoot(orderId),
  fetchOrderFulfillmentAspect(orderId),
  fetchOrderAuditAspect(orderId),
]);

if (rootResult.status === 'rejected') {
  orderStore.setValue(transition(orderStore.getValue(), { type: 'HYDRATION_FAILED' }));
  return;
}

orderStore.setValue({
  root: rootResult.value,
  fulfillment: fulfillmentAspect.status === 'fulfilled' ? fulfillmentAspect.value : null,
  audit: auditAspect.status === 'fulfilled' ? auditAspect.value : null,
  degraded: fulfillmentAspect.status === 'rejected' || auditAspect.status === 'rejected',
});
```

### 3.4 뷰포트·레이아웃 6단계 위계, 2대 황금률 및 4-Tier 시맨틱 Z-Index

1. **6단계 DOM/논리 위계 (`6-Level Layout Hierarchy`)**:
   - `L1 app-shell (page)` (`#root`, `isolation: isolate`)
   - $\to$ 병렬 형제(Parallel Siblings): `L2 page-canvas (region)` (`<main>`) & `L3 dock-panel (pane)` (`<aside>`)
   - $\to$ `L4 slot-panel (panel)` (`MenuNode` 슬라이스)
   - $\to$ `L5 section-card (section)` (내부 컨트롤 그룹)
   - $\to$ `L6 floating-overlay (widget)` (`<dialog>`, `[popover]`, `#overlay-portal`)
2. **2대 황금률 (`Two Golden Rules`)**:
   - **황금률 1 (컴포넌트 슬롯 분리의 황금률)**: *"부모(`AppShell`)는 병렬 슬롯 공간 배치만 정의하고, 자식(`SectionCard` 등)은 내부 구성을 캡슐화한다."*
   - **황금률 2 (뷰포트 기하 변환 격리의 황금률)**: *"캔버스 `transform: matrix(...)` 내부에는 글로벌 모달/오버레이를 직접 마운트하지 않으며, HTML5 Native Top Layer(`<dialog>`, `popover`) 또는 루트 포털 + 기하 역보정(`scale(1/zoom)`)을 사용한다."*
3. **4-Tier 시맨틱 Z-Index 스케일 (매직 넘버 `9999` 금지)**:

| Tier | 시맨틱 CSS 변수 토큰 | 기본값 | 적용 레이어 및 용도 |
| :--- | :--- | :---: | :--- |
| **Tier 1 (Canvas & Base)** | `--z-base` / `--z-canvas-node` | `1` / `10` | L2 아트워크 캔버스 및 선택 기즈모 |
| **Tier 2 (Chrome & Dock)** | `--z-sticky` / `--z-dock` | `100` / `200` | L1 상단 고정 헤더 및 L3/L4 스플릿 독 패널 |
| **Tier 3 (Overlay & Modal)** | `--z-drawer` / `--z-popover` / `--z-modal` | `400` / `600` / `800` | L6 드로어, 팝오버, 다이얼로그 포털 |
| **Tier 4 (System Notification)** | `--z-toast` | `1100` | 최상위 시스템 토스트 및 긴급 알림 |

### 3.5 3-Tier State Ownership 및 Presentation State Waiver 텔레메트리

- **2초 상태 판별법**:
  - 페이지 새로고침 후에도 유지되어야 하는 영속/도메인 계약 상태 $\to$ **Tier 1 Durable Domain Contract** (`.tsp` 모델 및 `@evidenceReview` 필수)
  - 클라이언트 파생 계산(`*Result.ts`) 및 활동 이벤트(`*Activity.ts`) $\to$ **Tier 2 Transient Application Logic**
  - 일시적 UI 크롬(`isOpen`, `activeTab`, `isHovered`, `isFocused`) 및 명령형 핸들(`ref` Context / `useImperativeHandle` OOP Facade) $\to$ **Tier 3 Volatile Presentation State** (TypeSpec/Evidence 면제)
- Tier 3 상태 중 사용자 행동 관측이 필요한 경우 `@oa-sdk/telemetry` 표준 추적 심볼(`UI:EDITOR:...`, 150ms 디바운스)만 연결합니다.

---

## 4. 4단계 자율 Pull 업데이트 흐름 및 로컬 검증 절차

`ttsc-ex` 또는 `oa-sdk`에서 아키텍처 규약이 업데이트되었을 때, `context-action`에서는 다음 4단계로 변경사항을 자율 반영하고 검증합니다:

1. **Step 1 — 업스트림 변경사항 확인 (Discovery)**
   - `/Users/junwoobang/workflow/samchon/docs/cross-repo-responsibility-and-sync-guide.md`, `/Users/junwoobang/workflow/samchon/docs/context-action-frontend-evidence-guide.md`, `/Users/junwoobang/workflow/oa-sdk/docs/guides/ttsc-ex-delegation-and-sync-guide.md`에서 갱신된 계약·증명·레이아웃 규칙을 확인합니다.
2. **Step 2 — 한/영 페어 문서 및 에이전트 스킬 동기화 (Docs & Skill Sync)**
   - `docs/ko/context-layered/`와 `docs/en/context-layered/`의 대응 문서([`triad-evidence-sync-guide.md`](./triad-evidence-sync-guide.md), [`CA-SPEC-EVIDENCE-001.md`](./decisions/CA-SPEC-EVIDENCE-001.md), [`implementation-convention.md`](./implementation-convention.md), [`convention-index.md`](./convention-index.md)) 및 에이전트 스킬([`.agents/skills/context-action-implementation-playbook/SKILL.md`](../../../.agents/skills/context-action-implementation-playbook/SKILL.md), [`skills/context-action-implementation-playbook/SKILL.md`](../../../skills/context-action-implementation-playbook/SKILL.md))을 한/영 대칭으로 갱신합니다.
   - 문서 변경 후 `pnpm llms:sync-docs --changed-files ...`로 `llmsData/` 요약 템플릿과 우선순위 메타데이터를 동기화합니다.
3. **Step 3 — 예제 및 핸들러/비즈니스 레이어 적용 (Layer Application)**
   - `contexts/`의 인텐트 분리(`BusinessActionIntent` vs `LayoutActionIntent`), `business/` 순수 함수의 `@evidenceReview ./generated/dto.ts#... #hash` 잠금, `handlers/`의 `Promise.allSettled` 병렬 복원, `views/`의 파일 상단 `@evidenceExclude` 및 6-Level 레이아웃 규칙을 적용합니다.
4. **Step 4 — `context-action` 로컬 검증 게이트 실행 (Local Verification)**
   ```bash
   pnpm docs:management
   pnpm llms:check
   pnpm convention:check
   ```
