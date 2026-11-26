# @context-action/template-react

Standard Context-Action React (`@context-action/react@5.0.0` + `@context-action/core@2.0.0`) Starter Template with Astryx Design System Theme Contract and State Tiering Governance.

Context-Action의 핵심 3축(`Action Pipeline`, `Reactive Store`, `Imperative Ref` via `@context-action/react` + `@context-action/react/refs`), 6-Layer Context-Layered 아키텍처, `BusinessActionIntent` / `LayoutActionIntent` 분리, 4-Role 핸들러 훅(`useActionGuard`, `useActionCommandHandler`, `useActionObserver`), 그리고 Astryx 디자인 시스템 + TypeSpec Evidence 거버넌스를 함께 보여주는 표준 시작 템플릿입니다.

---

## 🎯 핵심 아키텍처 기준

1. **Core 3 Axes (`Action · Store · Ref`) + Strict Nesting**:
   - `OrderBusinessActionProvider → OrderLayoutActionProvider → OrderStoreProvider → OrderRefProvider → OrderHandlerRegistry → OrderWorkspaceView` 순서로 경계를 조립합니다.
2. **Intent 분리 (`No Mixed Payloads`) & 4-Role 핸들러 위계**:
   - `OrderBusinessActions`(도메인 상태/주문 제출)와 `OrderLayoutActions`(`focusField` 등 UI 제어)를 별도 ActionContext로 분리합니다.
   - `useOrderSubmissionHandlers`는 `useOrderBusinessActionGuard` → `useOrderBusinessActionCommandHandler` → `useOrderBusinessActionObserver` 3단계 역할로 승인·실행·관찰을 분리합니다.
   - `actions/` 레이어는 Store에 직접 접근하지 않고 의미적 `dispatch` 래퍼만 노출합니다.
3. **도메인 코드/이벤트 중심 설계 (`business/` → `hooks/` 번역)**:
   - `business/orderValidation.ts`와 `business/orderActivity.ts`는 UI 문구 대신 구조화된 `OrderValidationCode` 및 `OrderActivityEvent`를 반환하고, UI 문자열 매핑은 `hooks/useOrderData.ts`에서 수행합니다.
4. **Astryx 테마 컨텍스트 분리 (`src/theme/`)**:
   - CSS 변수 동기화 핸들러는 `ThemeHandlerRegistry.tsx`에 격리하고, View는 `useTheme()` 훅을 통해서만 테마 상태와 전환 커맨드를 소비합니다.
5. **Tier 3 Presentation Waiver (`views/`)**:
   - `OrderWorkspaceView.tsx` 상단에 `@evidenceExclude`를 명시하며 `@context-action/*` 런타임 import 없이 훅/액션만 소비합니다. 아코디언 개폐(`isActivityOpen`) 같은 휘발성 UI 상태는 로컬 `useState`에 둡니다.

---

## 🏗️ 폴더 구조

```text
src/
├── theme/                     # Astryx 디자인 시스템 테마
│   ├── primitives.ts          # Primitive Tokens (색상, 타이포, 반경, 모션)
│   ├── semantics.ts           # Semantic Tokens (Action, Surface, Content, Border, Status)
│   ├── astryx-mapping.ts      # toAstryxTokens 어댑터 (CSS 변수 생성)
│   ├── theme-contract.ts      # 테마 정의 계약 및 applyThemeToDocument 유틸
│   ├── ThemeHandlerRegistry.tsx # 테마 액션 핸들러 및 DOM CSS 변수 동기화
│   ├── ThemeContext.tsx       # Context-Action Design Context
│   └── useTheme.ts            # View용 테마 구독/디스패치 훅
├── features/
│   └── order-workspace/       # Context-Layered 표준 6-Layer 워크스페이스
│       ├── contexts/          # Business/Layout Action, Store, Ref Contexts (Tier 1)
│       ├── business/          # Pure Functions (Draft, Validation Code, Activity Event, FSM)
│       ├── handlers/          # 4-Role Handlers, Layout Focus Handler & Registry
│       ├── actions/           # Semantic Dispatch Helpers (No Store Access)
│       ├── hooks/             # Store Subscription, Code->Text Translation & Ref Binding
│       └── views/             # @evidenceExclude Presentation View (Zero @context-action import)
└── styles/
    └── global.css             # Astryx CSS 변수 기반 전역 스타일
```

---

## 🚀 검증 및 실행

```bash
# Context-Layered 정적 규칙 및 경계 검사 (저장소 루트에서 실행)
pnpm convention:check

# template-react 통합 테스트 (저장소 루트에서 실행)
pnpm --filter @context-action/react test -- template-react

# 타입 검증
pnpm --filter @context-action/template-react type-check

# 프로덕션 빌드
pnpm --filter @context-action/template-react build

# 개발 서버 실행
pnpm --filter @context-action/template-react dev
```
