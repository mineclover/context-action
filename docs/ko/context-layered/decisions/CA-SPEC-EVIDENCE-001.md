# CA-SPEC-EVIDENCE-001: TypeSpec Evidence 결합 및 프론트엔드 상태 계층화(State Tiering) 거버넌스

**상태:** accepted  
**소유자:** Framework Core & Architecture Governance  
**관련 이슈/스펙:** CA-ARCH-001, CA-SPEC-001, [change-management-convention](../change-management-convention.md), [triad-evidence-sync-guide](../triad-evidence-sync-guide.md)  
**최종 검토:** 2026-10-18  

## 맥락

Context-Action 프레임워크는 `contexts / business / handlers / actions / hooks / views`의 6개 레이어 분리를 통해 프론트엔드 상태 관리와 비즈니스 로직의 격리를 성공적으로 달성했습니다. 특히 `business/` 레이어에 순수 함수(`*Draft`, `*Validation`, `*Result`, `*StateMachine`)만을 배치하도록 강제함으로써 높은 테스트 용이성을 제공합니다.

그러나 대규모 엔터프라이즈 환경 및 AI 에이전트 협업 환경에서는 다음과 같은 새로운 도전 과제가 대두되었습니다:
1. **기획-코드 간 추적성(Traceability)의 컴파일 타임 강제 부재**: 이슈와 스펙 식별자(`CA-*`)가 텍스트/PR 레벨에서 검증될 뿐, 기획 요구사항 변경이나 API 스키마 변경 시 프론트엔드 비즈니스 로직 함수와의 불일치를 컴파일 타임에 즉시 차단(Fail-Closed)하지 못함.
2. **빈번한 UI 변경에 따른 거버넌스 피로도(Governance Friction)**: 모든 UI 상태를 엄격한 스펙 계약(SSOT)으로 관리하려 할 경우, 잦은 화면 수정(모달 열림/닫힘, 포커스, 탭 전환 등) 시 불필요한 스펙 수정과 해시 갱신 비용이 발생하여 개발 생산성을 저해함.

이에 컴파일러 기반 SSOT 계약 거버넌스인 `tsp-evidence`를 도입하고, 프론트엔드 특성에 맞춘 **3단계 상태 계층화(State Tiering)** 규칙을 제정합니다. (`ttsc-ex` 및 `oa-sdk`와의 최신 책임 분리 및 자율 동기화 절차는 [통합 트라이어드 자율 동기화 가이드](../triad-evidence-sync-guide.md)를 참조합니다.)

---

## 검토한 선택지

1. **대안 A: 전면적 TypeSpec SSOT 적용 (Full-Scale TypeSpec)**
   - 모든 Action, Store State, UI 로컬 상태까지 TypeSpec 모델로 정의하고 TypeScript 코드를 생성.
   - *기각 사유*: UI의 일시적/장식적 상태 변경 시마다 TypeSpec 컴파일 및 AST 해시 락 갱신이 필요하여 개발 피로도가 극대화됨.
2. **대안 B: 기존 PR 텍스트 추적성 유지 (Status Quo)**
   - `check-change-traceability.mjs`를 통해 커밋 메시지의 `#issue` 및 `CA-*` ID만 검사.
   - *기각 사유*: 런타임 결함 발생 시 기획 원천까지의 3단 역추적이 불가능하며, 비즈니스 로직의 침묵하는 스키마 드리프트(Silent Drift)를 방지할 수 없음.
3. **대안 C (선택): 상태 계층화(State Tiering) 기반의 선택적 TypeSpec Evidence 결합**
   - 영속적 도메인 계약(Tier 1)에만 TypeSpec SSOT 및 엄격한 AST 해시 락(`@evidenceReview`)을 강제.
   - 순수 함수 비즈니스 레이어는 TypeSpec의 "Policy Hopping" 타깃으로 연동.
   - 휘발성 프레젠테이션 상태(Tier 3)는 Evidence 대상에서 공식 면제(Waiver).

---

## 결정

### 1. 3단계 상태 계층화 (Three-Tier State Classification)

모든 상태와 비즈니스 함수는 설계 시점에 다음 3개 계층 중 하나로 명확히 분류되어야 합니다:

| 계층 (Tier) | 대상 정의 | 관리 위치 | TypeSpec SSOT | Evidence 강제 수준 |
| :--- | :--- | :--- | :--- | :--- |
| **Tier 1: Durable Domain Contract** | 외부 API 연동 DTO, 영속화 모델(IndexedDB 등), 법적/금융 유효성 검증 규칙, 핵심 비즈니스 상태 머신(Phase/Event) | `specs/*.tsp`<br>`contexts/`<br>`business/` | **필수 (Mandatory)** | **Fail-Closed (`error`)**<br>`@evidenceReview` AST 해시 락 강제 |
| **Tier 2: Transient Application Logic** | 클라이언트 전용 계산 공식(`*Result.ts`), 화면 단위 파생 뷰모델, 활동 로그 이벤트(`*Activity.ts`) | `business/`<br>`hooks/` | 선택적 (Optional) | **Phased (`warning` / `off`)**<br>베타 단계까지 경고 허용 |
| **Tier 3: Volatile Presentation State** | 모달/드로어 개폐(`isOpen`), 포커스/호버, 탭 전환, 폼 단순 입력 draft(검증 전), UI 전용 애니메이션 | 컴포넌트 `useState`<br>`ref` Context | **절대 금지 (Forbidden)** | **명시적 면제 (Waiver)**<br>Evidence 추적 대상 제외 |

### 2. Policy Hopping을 통한 `business/` 순수 함수 바인딩 (`ttsc@0.33.1` / `@wrtnlabs/evidence@0.8.0`)

`context-action`의 `business/` 계층 내 함수들은 UI 및 React 런타임에 독립적인 순수 함수이므로, `tsp-evidence` 및 `oa-sdk`가 생성한 계약 선언의 바인딩 타깃으로 공식 지정됩니다:

```typespec
// specs/order.tsp
@evidence("docs/requirements.md#CA-ORDER-1", "주문서 제출 유효성 검증 규칙")
model OrderValidationPolicy {}
```

```typescript
// packages/react/src/patterns/canonical-order/business/orderValidation.ts
/**
 * @evidence ./generated/dto.ts#OrderValidationPolicy 주문서 제출 유효성 검증 규칙
 * @evidenceReview ./generated/dto.ts#OrderValidationPolicy #65a0cfc
 */
export function validateOrderDraft(draft: OrderDraft): ValidationIssue[] {
  // 순수 비즈니스 검증 로직
}
```

- **Heading-Form 주석 및 주석 비대화 방지**: 다중 문단 사유나 체크리스트는 `## @evidence`, `## @evidenceReview`, `## @evidenceExclude` Heading-Form으로 작성하거나 `evidence.config.json`의 분리형 증명 문서(`evidenceFiles: ["evidence/**/*.md"]`)로 분리합니다.
- **파일 상단 `@evidenceExclude`**: Tier 3 프레젠테이션 뷰(`views/*.tsx`) 파일은 파일 최상단에 `@evidenceExclude`를 선언하여 파일 내 모든 선언을 일괄 면제합니다.

### 3. 역방향 3단 풀체인 추적 (Full-Chain Reverse Forensics)

컴포넌트 또는 핸들러 결함 발생 시, 다음 경로를 통해 기획 요구사항 앵커까지 단 1회의 MCP 질의로 역추적합니다:
$$\text{OrderView / Handlers} \xrightarrow{} \text{business/orderValidation.ts} \xrightarrow[\text{@evidenceReview}]{\text{AST Hash}} \text{generated/dto.ts} \xrightarrow{} \text{specs/order.tsp} \xrightarrow[\text{@evidence}]{\text{Anchor}} \text{docs/requirements.md\#CA-ORDER-1}$$

### 4. 점진적 릴리즈 심각도 라이프사이클 (Severity Lifecycle)

피로도 방지와 민첩한 개발을 위해 심각도 오버라이드를 적용합니다:
- **Inception / Experimental**: `"severity": "off"` (기능 프로토타이핑 중 CI 차단 없음)
- **Beta / Hardening**: `"severity": "warning"` (누락된 앵커 및 미충족 요건 가시화)
- **GA / Release**: `"severity": "error"` (Fail-Closed 강제, 100% 충족 필수)

---

## 결과와 Invariant

1. **패키지 무의존성(Zero-Dependency) 보존**: `@context-action/core`, `@context-action/react`, `@context-action/preact`, `@context-action/preact-ui` 런타임 패키지는 `@typespec/*`, `@oa-sdk/*`, `ttsc`, `@wrtnlabs/evidence`를 직접 의존하지 않습니다.
2. **순수 함수 무결성**: `business/` 모듈은 React나 프레임워크 런타임을 import하지 않는 기존 규칙을 100% 엄수합니다.
3. **인텐트 분리 및 병렬 복원**: `BusinessActionIntent`와 `LayoutActionIntent`는 페이로드를 혼합하지 않으며(`No Mixed Payloads`), 분리 저장 관점(`@entityRoot` + `@aspectOf`)은 `handlers/`에서 `Promise.allSettled`로 병렬 복원합니다.
4. **Presentation State Waiver 및 6-Level 레이아웃 불변식**: 컴포넌트 내부 렌더링용 임시 플래그(`isOpen`, `activeTab` 등)를 TypeSpec 모델이나 Evidence 앵커로 등록하는 것은 안티패턴으로 기각되며, 뷰 레이어는 6-Level 레이아웃 위계, 2대 황금률, 4-Tier 시맨틱 Z-Index(`--z-base: 1` ~ `--z-toast: 1100`)를 준수합니다.

---

## 검증 증거

- `pnpm docs:management`: 한/영 페어 문서, 이슈 템플릿, 컨벤션 인덱스 및 ADR 링크 무결성 검증.
- `pnpm llms:check`: 문서 변경에 따른 `llmsData/` 요약 템플릿 동기화 검증.
- `pnpm convention:check` (`node scripts/verify-context-action-conventions.mjs`): Context-Layered 6계층 분리, React import 격리 및 use-case 경계 검증.
- `tsp-evidence check specs/**/*.tsp` / `npx evidence check --only <unit> --context`: TypeSpec 및 생성 TS 선언과 프론트엔드 비즈니스 로직 간 바인딩 정적 검증.

---

## 되돌림 또는 Migration 조건

- 프론트엔드 전용 컴파일러 린터 플러그인이 네이티브 TS 데코레이터로 발전하여 TypeSpec 없이 완결 가능한 규격이 확립될 경우, 상위 SSOT 레이어를 재검토할 수 있습니다.
