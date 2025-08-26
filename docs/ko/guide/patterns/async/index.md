# 비동기 패턴 설정 및 구성

Context-Action 프레임워크에서 비동기 작업, 엘리먼트 대기, DOM 안전성 패턴을 처리하기 위한 완전한 설정 가이드입니다.

## 필수 조건

### 필수 설정 가이드
- **[기본 액션 설정](../setup/basic-action-setup.md)** - 비동기 핸들러를 위한 액션 컨텍스트 설정
- **[기본 스토어 설정](../setup/basic-store-setup.md)** - 비동기 상태 관리를 위한 스토어 컨텍스트  
- **[RefContext 설정](../setup/ref-context-setup.md)** - DOM 엘리먼트 추적을 위한 Ref 컨텍스트
- **[멀티 컨텍스트 설정](../setup/multi-context-setup.md)** - 여러 컨텍스트를 사용하는 복잡한 비동기 아키텍처

### 핵심 의존성
```typescript
import { 
  createActionContext, 
  createStoreContext,
  createRefContext,
  useWaitForRefs
} from '@context-action/react';
```

## 설정 개요

비동기 패턴은 최적의 안전성과 성능을 위해 세 가지 주요 컨텍스트 간의 조정된 설정이 필요합니다:

### 1. 액션 컨텍스트 설정
비동기 작업 및 비즈니스 로직 처리를 위해:

```typescript
interface AsyncActions {
  processData: { data: any; timeout?: number };
  retryOperation: { operationId: string; maxRetries: number };
  cancelOperation: { operationId: string };
}

const { useActionHandler, useActionDispatch } = createActionContext<AsyncActions>('AsyncOps');
```

### 2. 스토어 컨텍스트 설정  
비동기 작업 상태 관리를 위해:

```typescript
const { useStore } = createStoreContext('AsyncState', {
  isProcessing: { initialValue: false },
  retryCount: { initialValue: 0 },
  operationResults: { initialValue: {} as Record<string, any> },
  timeoutConfig: { initialValue: { default: 5000, max: 30000 } }
});
```

### 3. RefContext 설정
DOM 엘리먼트 가용성 추적을 위해:

```typescript
interface AsyncElementRefs {
  targetElement: HTMLElement;
  progressIndicator: HTMLElement;  
  resultDisplay: HTMLElement;
}

const { useAppRef, useWaitForRefs } = createRefContext<AsyncElementRefs>('AsyncRefs');
```

## 비동기 패턴 사양

### 핵심 비동기 패턴

#### 1. 실시간 상태 접근 패턴
**설정 사양**: 액션 컨텍스트 + 스토어 컨텍스트
- **목적**: `store.getValue()`를 사용한 클로저 트랩 방지  
- **필수 설정**: [기본 액션 설정](../setup/basic-action-setup.md) + [기본 스토어 설정](../setup/basic-store-setup.md)
- **핵심 구현**: 비동기 핸들러에서 실시간 상태 접근
- **문서**: [실시간 상태 접근](./real-time-state-access.md)

#### 2. 대기 후 실행 패턴
**설정 사양**: RefContext + 액션 컨텍스트
- **목적**: 엘리먼트 가용성 확인 후 안전한 DOM 작업
- **필수 설정**: [RefContext 설정](../setup/ref-context-setup.md) + [기본 액션 설정](../setup/basic-action-setup.md)
- **핵심 구현**: DOM 조작 전 `await waitForRefs()` 사용
- **문서**: [대기 후 실행](./wait-then-execute.md)

#### 3. 조건부 대기 패턴  
**설정 사양**: 스토어 컨텍스트 + RefContext + 액션 컨텍스트
- **목적**: 런타임 조건에 따른 스마트 대기
- **필수 설정**: 상태 기반 대기 결정을 위한 세 가지 컨텍스트 설정 모두
- **핵심 구현**: 스토어 상태에 따른 조건부 `waitForRefs()`
- **문서**: [조건부 대기](./conditional-await.md)

#### 4. 타임아웃 보호 패턴
**설정 사양**: 액션 컨텍스트 + 스토어 컨텍스트 (선택적 RefContext)
- **목적**: 폴백 전략으로 무한 대기 방지
- **필수 설정**: 타임아웃 로직을 위한 [기본 액션 설정](../setup/basic-action-setup.md)
- **핵심 구현**: 구성 가능한 타임아웃과 함께 `Promise.race()` 사용  
- **문서**: [타임아웃 보호](./timeout-protection.md)

## 설정 기반 빠른 참조

| 패턴 | 설정 요구사항 | 핵심 설정 구성 요소 | 구성 초점 |
|---------|-------------------|---------------------|-------------------|
| **실시간 상태 접근** | 액션 + 스토어 | `useActionHandler`, `store.getValue()` | 비동기 상태 접근 |
| **대기 후 실행** | Ref + 액션 | `useWaitForRefs`, `useAppRef` | DOM 안전성 설정 |
| **조건부 대기** | 모든 컨텍스트 | 상태 기반 대기 로직 | 조건부 패턴 |
| **타임아웃 보호** | 액션 + 스토어 | 타임아웃 구성, 폴백 핸들러 | 오류 복구 설정 |

## 완전한 설정 통합 예제

### 비동기 작업을 위한 전체 멀티 컨텍스트 설정

```typescript
// 1. 액션 컨텍스트 설정
interface AsyncActions {
  processData: { data: any; timeout?: number };
  retryOperation: { operationId: string; maxRetries: number };
  cancelOperation: { operationId: string };
}

const { 
  Provider: AsyncActionProvider,
  useActionHandler: useAsyncActionHandler,
  useActionDispatch: useAsyncAction 
} = createActionContext<AsyncActions>('AsyncOps');

// 2. 스토어 컨텍스트 설정
const { 
  Provider: AsyncStateProvider,
  useStore: useAsyncStore 
} = createStoreContext('AsyncState', {
  isProcessing: { initialValue: false },
  retryCount: { initialValue: 0 },
  operationResults: { initialValue: {} as Record<string, any> },
  timeoutConfig: { initialValue: { default: 5000, max: 30000 } }
});

// 3. RefContext 설정
interface AsyncElementRefs {
  targetElement: HTMLElement;
  progressIndicator: HTMLElement;
  resultDisplay: HTMLElement;
}

const { 
  Provider: AsyncRefProvider,
  useAppRef: useAsyncRef,
  useWaitForRefs: useAsyncWaitForRefs 
} = createRefContext<AsyncElementRefs>('AsyncRefs');

// 4. 결합된 프로바이더 설정
function AsyncPatternProvider({ children }: { children: React.ReactNode }) {
  return (
    <AsyncActionProvider>
      <AsyncStateProvider>
        <AsyncRefProvider>
          {children}
        </AsyncRefProvider>
      </AsyncStateProvider>
    </AsyncActionProvider>
  );
}

// 5. 모든 패턴을 포함한 구현 컴포넌트
function CompleteAsyncComponent() {
  // 설정 훅
  const isProcessingStore = useAsyncStore('isProcessing');
  const retryCountStore = useAsyncStore('retryCount');
  const timeoutConfigStore = useAsyncStore('timeoutConfig');
  
  const elementRef = useAsyncRef('targetElement');
  const waitForRefs = useAsyncWaitForRefs();
  
  // 모든 패턴을 포함한 비동기 핸들러 설정
  useAsyncActionHandler('processData', async (payload, controller) => {
    // 실시간 상태 접근 패턴 - 클로저 트랩 방지
    const isProcessing = isProcessingStore.getValue();
    if (isProcessing) {
      controller.abort('Already processing');
      return;
    }
    
    isProcessingStore.setValue(true);
    
    try {
      // 조건부 대기 패턴 - 상태 기반 대기
      const retryCount = retryCountStore.getValue();
      if (retryCount > 0) {
        // 대기 후 실행 패턴 - 안전한 DOM 작업
        await waitForRefs('targetElement');
      }
      
      // 타임아웃 보호 패턴 - 무한 대기 방지
      const timeoutConfig = timeoutConfigStore.getValue();
      const timeout = payload.timeout || timeoutConfig.default;
      
      const result = await Promise.race([
        processAsyncData(payload.data),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), timeout)
        )
      ]);
      
      // 대기 후 안전한 DOM 조작
      const element = elementRef.target;
      if (element) {
        element.textContent = `Processed: ${result}`;
      }
      
    } catch (error) {
      console.error('Async operation failed:', error);
      const currentRetries = retryCountStore.getValue();
      retryCountStore.setValue(currentRetries + 1);
      controller.abort('Processing failed', error);
    } finally {
      isProcessingStore.setValue(false);
    }
  });
  
  return (
    <div>
      <div ref={elementRef.setRef}>Target Element</div>
      {/* 컴포넌트 구현 */}
    </div>
  );
}
```

## 설정 구성 모범 사례

### 1. 컨텍스트 조직화
- **관심사 분리**: 액션, 상태, ref를 위한 별도 컨텍스트 사용
- **명확한 명명**: 도메인 접두사와 함께 설명적인 컨텍스트 이름 사용
- **프로바이더 구성**: 논리적 순서로 프로바이더 결합 (액션 → 상태 → Ref)

### 2. 타입 안전성 설정
- **인터페이스 정의**: 각 컨텍스트 타입에 대한 명확한 인터페이스 정의
- **제네릭 제약**: 타입 안전성을 위한 적절한 제네릭 제약 사용
- **내보내기 패턴**: 컴포넌트 간 재사용을 위한 설정 함수 내보내기

### 3. 성능 구성
- **지연 로딩**: 비용이 많이 드는 비동기 작업에 지연 평가 사용
- **정리 관리**: 타임아웃 및 프로미스에 대한 적절한 정리 구현
- **메모리 최적화**: 실시간 상태 접근으로 클로저 트랩 방지

### 4. 오류 처리 설정
- **타임아웃 구성**: 구성 가능한 타임아웃 값 설정
- **재시도 로직**: 재시도 작업에 대한 지수 백오프 구현  
- **폴백 전략**: 실패한 작업에 대한 폴백 동작 구성

## 패턴 선택 매트릭스

| 사용 사례 | 필수 설정 | 핵심 구성 | 성능 영향 |
|----------|---------------|-------------------|-------------------|
| **단순 비동기 핸들러** | 액션만 | 기본 액션 핸들러 | 낮음 |
| **상태 의존 비동기** | 액션 + 스토어 | 실시간 상태 접근 | 중간 |
| **DOM 의존 비동기** | 액션 + Ref | 엘리먼트 가용성 대기 | 중간 |
| **복잡한 비동기 워크플로우** | 모든 컨텍스트 | 전체 패턴 통합 | 높음 |
| **성능 중심 비동기** | 모든 것 + 최적화 | 메모리/정리 관리 | 가변 |

## 설정 통합 가이드라인

### 단순 애플리케이션의 경우
**[기본 액션 설정](../setup/basic-action-setup.md)**으로 시작하여 필요에 따라 컨텍스트 추가:
1. 비동기 핸들러를 위한 액션 컨텍스트로 시작
2. 상태 관리가 필요할 때 스토어 컨텍스트 추가
3. DOM 안전성이 필요할 때 RefContext 추가

### 복잡한 애플리케이션의 경우  
전체 통합으로 **[멀티 컨텍스트 설정](../setup/multi-context-setup.md)** 사용:
1. 비동기 요구사항을 기반으로 컨텍스트 아키텍처 계획
2. 최적 성능을 위한 프로바이더 구성 설정
3. 오류 처리 및 타임아웃 전략 구성
4. 정리 및 메모리 관리 패턴 구현

## 다음 단계

1. **설정 가이드 검토**: 사용 사례에 대한 필수 설정 가이드 학습
2. **패턴 선택**: 애플리케이션 요구사항에 따른 비동기 패턴 선택
3. **설정 구현**: 선택한 각 패턴에 대한 설정 사양 따르기
4. **예제 학습**: 자세한 예제는 개별 패턴 문서 검토
5. **최적화**: 성능 및 오류 처리 모범 사례 적용

자세한 구현 예제와 고급 사용 사례는 개별 패턴 문서를 참조하세요.