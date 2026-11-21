# Context-Action 아키텍처 및 핵심 철학

## 1. 핵심 철학 및 설계 원칙

### 왜 Context-Action인가

애플리케이션 상태 관리가 복잡해지는 핵심 원인은 세 가지 관심사가 뒤섞일 때 발생합니다:

- **UI 생명주기 결합**: 비즈니스 워크플로와 비동기 파이프라인이 React 컴포넌트·`useEffect`·커스텀 훅에 갇혀 화면 밖에서 단독 테스트하거나 재사용하기 어려워집니다.
- **이진 상태 함정**: 거대한 전역 싱글턴 아니면 파편화된 로컬 `useState` 사이를 오가며 명확한 도메인 경계가 사라집니다.
- **비정형 비동기 파이프라인**: 검증 가드, 우선순위 실행, `AbortSignal` 취소, 다중 스토어 정합성, 정리(teardown) 로직을 이벤트 핸들러마다 중복 구현하게 됩니다.

Context-Action은 이를 **5가지 핵심 원칙**으로 해결합니다:

1. **Action–Store 분리 & Read/Write 분리**: View는 타입이 지정된 **Action**을 디스패치해 *의도*만 전달하고(`ActionRegister`), 핸들러는 **Store**(`Store` / `StateStore`)를 갱신하며, View는 선택적 Store 구독으로 상태만 읽어 클로저 오염과 비즈니스 로직 혼입을 막습니다.
2. **Headless-First / DI 경계로서의 Context**: UI 생명주기와 무관한 도메인 오케스트레이션과 상태는 순수 TypeScript 모듈에서 `ActionRegister` + `Store` / `StoreManager` / `createStateStore`로 조립합니다. React Context Provider(`<ActionProvider register={...} />`, `<StoreProvider stores={...} />` 또는 `manager={...}`)는 이를 주입만 하는 얇은 DI 경계로 동작합니다(기본값 `ownership="shared"`, 회수 위임 시 `ownership="owned"`).
3. **도메인 경계 격리 & 3계층 상태 모델**: 단일 전역 스토어 대신 도메인 단위로 파이프라인과 상태를 격리하며, 상태를 **Tier 1 외부·영속 계약**, **Tier 2 도메인 오케스트레이션 상태**, **Tier 3 UI 표출 상태**(모달·호버·120fps `RefContext`)로 나눕니다.
4. **역할이 드러나는 명시적 파이프라인**: Guard(`registerGuard` / `useActionGuard`), Command(`registerCommand` / `useActionCommandHandler`), Result(`registerResult` / `useActionResultHandler`), Observer(`useActionObserver`)로 파이프라인 단계를 분리하고 우선순위와 `AbortSignal`을 일급으로 다룹니다.
5. **점진적 도입 + 계약 기반 일관성**: `Level 1`(단일 스토어/액션 컨텍스트)로 시작해 필요할 때 `Level 2`(헤드리스 DI + 역할별 훅)와 `Level 3`(6계층 Context-Layered, `StoreTransactionCoordinator`, `@context-action/tool-protocol`, `@context-action/xstate`, Lit/Preact 브리지)로 확장하며 `CA-SURFACE-CATALOG-001` 계약 검증을 유지합니다.

### 핵심 아키텍처 흐름

```text
[순수 TS 도메인 모듈: ActionRegister + Store / StateStore]
                         │  (React DI 주입: ownership="shared" | "owned")
                         ▼
[View] ──dispatch──▶ [<ActionProvider register>] ──▶ [Handlers / Guards] ──▶ [<StoreProvider stores>] ──subscribe──▶ [View]
```

### Headless-First 대칭 DI 예제

React 바깥에서 도메인 상태와 파이프라인을 완성한 뒤, Action과 Store를 대칭적으로 React Context에 주입합니다:

<!-- @context-action-compile -->
```tsx
import type React from 'react';
import { ActionRegister, type ActionPayloadMap } from '@context-action/core';
import {
  createActionContext,
  createStore,
  createStoreContext,
  useStoreValue,
} from '@context-action/react';

interface BillingActions extends ActionPayloadMap {
  charge: { invoiceId: string; amount: number };
}

interface BillingStores {
  summary: { lastInvoiceId: string | null; totalCharged: number };
}

// 1. 프레임워크 중립 도메인 엔진 (React 임포트 없이 순수 TS 테스트 가능)
export const billingRegister = new ActionRegister<BillingActions>({ name: 'HeadlessBilling' });
export const billingSummaryStore = createStore<BillingStores['summary']>('summary', {
  lastInvoiceId: null,
  totalCharged: 0,
});

billingRegister.registerCommand('charge', ({ invoiceId, amount }) => {
  const prev = billingSummaryStore.getValue();
  billingSummaryStore.setValue({
    lastInvoiceId: invoiceId,
    totalCharged: prev.totalCharged + amount,
  });
}, { id: 'domain-charge' });

// 2. 얇은 React Context DI 경계 (기본 ownership="shared")
const BillingActionsContext = createActionContext<BillingActions>('BillingActions');
const BillingStoresContext = createStoreContext<BillingStores>('BillingStores', {
  summary: { lastInvoiceId: null, totalCharged: 0 },
});

function BillingPanel() {
  const dispatch = BillingActionsContext.useActionDispatch();
  const summary = useStoreValue(BillingStoresContext.useStore('summary'));

  return (
    <button
      type="button"
      onClick={() => void dispatch('charge', { invoiceId: 'INV-100', amount: 50 })}
    >
      합계: {summary.totalCharged} ({summary.lastInvoiceId ?? '없음'})
    </button>
  );
}

export function BillingFeature(): React.JSX.Element {
  return (
    <BillingActionsContext.Provider register={billingRegister} ownership="shared">
      <BillingStoresContext.Provider stores={{ summary: billingSummaryStore }} ownership="shared">
        <BillingPanel />
      </BillingStoresContext.Provider>
    </BillingActionsContext.Provider>
  );
}
```

### 아키텍처 구현 레이어

- **도메인 엔진 (헤드리스)**: `ActionRegister` (`@context-action/core`) + `Store` / `StoreManager` / `createStateStore` (`@context-action/store-core`)
- **Action Context (ViewModel DI 경계)**: `createActionContext` (내부 생성 또는 외부 `ActionRegister` 주입)
- **선언적 Store Context (Model DI 경계)**: `createStoreContext` (내부 생성 또는 외부 `StoreManager` / `stores` 맵 주입)
- **RefContext (제로 리렌더 성능 레이어)**: `createRefContext` (DOM·Canvas·Three.js 직접 참조)
- **선택적 구독**: `useStoreValue`, `useStoreSelector`, `useStorePath`, `useStoreSelectorWithPaths`
- **프레젠테이션 (View 레이어)**: 의도를 디스패치하고 구독 상태를 그리는 순수 React/Lit/Preact 컴포넌트

### 컨텍스트 분리 전략

#### 도메인 기반 컨텍스트 아키텍처
- **비즈니스 컨텍스트**: 비즈니스 로직, 데이터 처리, 도메인 규칙 (액션 + 스토어)
- **UI 컨텍스트**: 화면 상태, 사용자 상호작용, 컴포넌트 동작 (스토어 + RefContext)
- **성능 컨텍스트**: 고성능 DOM 조작과 애니메이션 (RefContext)
- **검증 컨텍스트**: 데이터 검증, 폼 처리, 오류 처리 (액션 + 스토어)
- **디자인 컨텍스트**: 테마 관리, 스타일링, 레이아웃, 시각적 상태 (스토어 + RefContext)
- **아키텍처 컨텍스트**: 시스템 구성, 인프라, 기술적 결정 (액션 + 스토어)

#### 문서 기반 컨텍스트 설계
각 컨텍스트는 해당 문서와 결과물을 관리하도록 설계됩니다:
- **디자인 문서** → Design Context (테마, 컴포넌트 사양, 스타일 가이드) → 스토어 + RefContext
- **비즈니스 요구사항** → Business Context (워크플로, 규칙, 도메인 로직) → 액션 + 스토어
- **성능 사양** → Performance Context (애니메이션, 상호작용) → RefContext
- **아키텍처 문서** → Architecture Context (시스템 설계, 기술적 결정) → 액션 + 스토어
- **검증 사양** → Validation Context (규칙, 스키마, 오류 처리) → 액션 + 스토어
- **UI 사양** → UI Context (상호작용, 상태 관리, 사용자 플로우) → 세 패턴 모두

### 고급 핸들러 및 트리거 관리

Context-Action은 기존 라이브러리에서 부족한 정교한 핸들러 및 트리거 관리를 제공합니다:

#### 우선순위 기반 핸들러 실행
- **순차 처리**: 적절한 비동기 처리와 함께 우선순위 순서로 핸들러 실행
- **도메인 격리**: 각 컨텍스트가 자체 핸들러 레지스트리를 유지
- **교차 컨텍스트 조정**: 도메인 컨텍스트 간 제어된 통신
- **결과 수집**: 복잡한 워크플로를 위한 여러 핸들러의 결과 집계

#### 지능형 트리거 시스템
- **상태 변경 트리거**: 스토어 값 변경에 기반한 자동 트리거
- **교차 컨텍스트 트리거**: 도메인 경계가 다른 컨텍스트의 액션을 트리거
- **조건부 트리거**: 비즈니스 규칙과 조건에 기반한 스마트 트리거
- **트리거 정리**: 자동 정리가 메모리 누수와 오래된 참조를 방지

### 주요 이점

1. **문서-아티팩트 관리**: 문서와 구현 간의 직접적 관계
2. **도메인 격리**: 각 컨텍스트가 완전한 독립성을 유지
3. **타입 안전성**: 도메인별 훅으로 완전한 TypeScript 지원
4. **성능**: RefContext로 제로 React 리렌더링, 스토어로 선택적 업데이트
5. **확장성**: 기존 도메인에 영향을 주지 않고 새 도메인을 쉽게 추가
6. **팀 협업**: 다양한 팀이 충돌 없이 서로 다른 도메인에서 작업
7. **명확한 경계**: 문서 도메인을 기반으로 한 완벽한 관심사 분리
8. **하드웨어 가속**: 60fps 성능을 위한 `translate3d()`로 직접 DOM 조작

## 구현 문서

**참고**: 자세한 구현 패턴과 예제는 더 나은 구성을 위해 [패턴 섹션](../guide/patterns/setup/index.md)으로 이동되었습니다.

### 핵심 패턴
- **[🎯 Action Only 패턴](../guide/patterns/action/basic-usage.md)** - 상태 관리 없는 순수 액션 디스패칭
- **[🏪 Store Only 패턴](../guide/patterns/store/basic-usage.md)** - 액션 없는 타입 안전한 상태 관리
- **[🔧 Ref Context 패턴](../guide/patterns/ref/basic-usage.md)** - 제로 리렌더링으로 직접 DOM 조작

### 아키텍처 패턴
- **[패턴 조합](../examples/pattern-composition.md)** - 복잡한 애플리케이션을 위한 패턴 결합
- **[도메인 컨텍스트 아키텍처](../context-layered/context-layered-guide.md)** - 문서 중심의 컨텍스트 분리
- **[MVVM 아키텍처](./architecture-guide.md)** - 완전한 Model-View-ViewModel 구현

### 구현 가이드
- **[실시간 상태 액세스](../guide/patterns/async/real-time-state-access.md)** - 핸들러에서 클로저 트랩 방지
- **[Provider 조합 설정](../guide/patterns/setup/provider-composition-setup.md)** - 고급 provider 조합 패턴

## RefContext 성능 아키텍처

### 제로 리렌더 철학

RefContext 패턴은 DOM 조작을 위해 React의 렌더링 사이클을 완전히 우회하는 **성능 우선 레이어**를 도입합니다:

```
[사용자 상호작용] → [직접 DOM 조작] → [하드웨어 가속] → [60fps 업데이트]
                               ↓
                         [React 리렌더링 없음]
```

#### 핵심 성능 원칙

1. **직접 DOM 액세스**: React 재조정을 트리거하지 않고 DOM 요소를 직접 조작
2. **하드웨어 가속**: GPU 가속 애니메이션을 위한 `transform3d()` 사용
3. **관심사 분리**: 시각적 업데이트를 비즈니스 로직 업데이트와 분리
4. **메모리 효율성**: 자동 정리 및 생명주기 관리
5. **타입 안전성**: DOM 요소 타입에 대한 완전한 TypeScript 지원

#### 성능 특성

RefContext는 직접 DOM 제어가 필요한 **고성능 시나리오**를 위해 특별히 설계되었습니다:

| 접근법 | 사용 사례 | React 리렌더링 | DOM 액세스 |
|-------|----------|----------------|------------|
| **useState** | 표준 UI 상호작용 | 재조정 트리거 | React 관리 |
| **useRef** | 기본 DOM 조작 | 수동 제어 필요 | 직접 참조 |
| **RefContext** | **고성능 그래픽, 애니메이션** | 제로 리렌더링 | 직접 조작 |

**RefContext 장점:**
- **제로 React 리렌더링**: 재조정 없는 직접 DOM 조작
- **하드웨어 가속**: GPU 최적화 애니메이션 지원

**RefContext 주요 대상:**
- ✅ 캔버스 애니메이션과 Three.js 그래픽
- ✅ WebGL 렌더링과 게임 엔진
- ✅ 고빈도 DOM 업데이트

**참고**: 데이터 관리의 경우 더 나은 확장성과 타입 안전성을 위해 useState 대신 **Store contexts**를 사용하세요.

## 모범 사례 요약

### 아키텍처 설계
1. **하나의 도메인 = 하나의 컨텍스트 경계**
2. **비즈니스와 UI 관심사 분리**
3. **문서 주도 컨텍스트 분리 사용**
4. **도메인 격리 우선, 필요시 도메인 간 통신 사용**

### 패턴 선택
5. **단순한 상태 관리는 Store Only로 시작**
6. **부수 효과나 복잡한 워크플로가 필요할 때 Action Only 추가**
7. **고성능 DOM 조작이 필요할 때 RefContext 추가**
8. **완전한 기능의 애플리케이션을 위해 모든 패턴 조합**

### 구현
9. **타입 안전성과 명확성을 위해 항상 도메인별 훅 사용**
10. **오래된 상태를 피하기 위해 핸들러에서 지연 평가 사용**
11. **적절한 중첩을 위해 provider 조합 패턴 따르기**
12. **팀 협업을 위해 도메인 경계를 명확하게 문서화**

### 코드 품질 및 모듈 조직
13. **더 나은 트리 쉐이킹과 번들 최적화를 위해 네임스페이스 import보다 명명된 import 선호**
14. **트리 쉐이킹 개선과 린팅 문제 방지를 위해 static-only 클래스 대신 유틸리티 함수 사용**
15. **체계적인 import 구성**: React/외부 → 프레임워크 → 상대 경로 → 타입
16. **유틸리티 함수와 에러 팩토리에 함수형 프로그래밍 패턴 따르기**

### 코드 예시

#### ✅ 권장하는 Import 패턴
```tsx
// 더 나은 트리 쉐이킹을 위한 명명된 import
import { validateFormData, FormData, ValidationState } from '../business/businessLogic';
import { createValidationError, createRefError } from '../utils/errorFactory';

// 명확한 import 구성
import React, { useState, useCallback } from 'react';
import { useStoreValue } from '@context-action/react';
import { useRefRegistry } from '../contexts/RefContexts';
import type { ValidationResult } from '../types/validation';
```

#### ✅ 권장하는 유틸리티 함수
```tsx
// static-only 클래스 대신 유틸리티 함수
export function createValidationError(message: string, context?: Record<string, any>): HandlerError {
  return {
    code: 'VALIDATION_ERROR',
    message,
    timestamp: Date.now(),
    context,
    recoverable: true
  };
}

// 사용법: 직접 함수 호출
import { createValidationError } from './errorUtils';
throw createValidationError('Invalid input', { field: 'email' });
```

#### ❌ 피해야 할 패턴
```tsx
// 네임스페이스 import는 트리 쉐이킹을 방해
import * as BusinessLogic from '../business/businessLogic';
import * as ErrorFactory from '../utils/errorFactory';

// Static-only 클래스는 린팅 경고 발생
export class ErrorFactory {
  static createValidationError(message: string): HandlerError {
    // 구현...
  }
}
```

## 시작하기

자세한 구현 예제와 단계별 가이드는 다음을 참조하세요:

- **[패턴 가이드 색인](../guide/patterns/setup/index.md)** - 완전한 패턴 문서
- **[Action Only 패턴](../guide/patterns/action/basic-usage.md)** - 순수 액션으로 시작
- **[Store Only 패턴](../guide/patterns/store/basic-usage.md)** - 권장 시작점
- **[패턴 조합](../examples/pattern-composition.md)** - 패턴 결합
- **[코딩 컨벤션](./conventions.md)** - import 패턴을 포함한 완전한 코딩 컨벤션과 베스트 프랙티스

더 많은 정보와 업데이트는 프로젝트 저장소를 방문하세요.

