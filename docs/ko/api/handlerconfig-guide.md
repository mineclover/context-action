# `HandlerConfig` 인터페이스

## 1. 목적

`HandlerConfig` 인터페이스는 액션 파이프라인 내에서 액션 핸들러의 동작을 제어하기 위한 구성 옵션 세트를 제공합니다. 실행 우선순위, 타이밍 및 생명주기 관리를 세밀하게 제어할 수 있습니다.

## 2. 구조

`HandlerConfig` 인터페이스는 다음 속성을 가집니다.

```typescript
export interface HandlerConfig {
  /** 우선순위 수준 (숫자가 높을수록 먼저 실행). 기본값: 0 */
  priority?: number;
  
  /** 핸들러의 고유 식별자. 제공되지 않으면 자동 생성됨 */
  id?: string;
  
  /** 비동기 핸들러가 완료될 때까지 기다릴지 여부. 기본값: false */
  blocking?: boolean;
  
  /** 이 핸들러가 한 번만 실행되고 제거될지 여부. 기본값: false */
  once?: boolean;
  
  /** 디바운스 지연 시간(밀리초) */
  debounce?: number;
  
  /** 스로틀 지연 시간(밀리초) */
  throttle?: number;
  
  /** 동일한 ID를 가진 기존 핸들러를 교체할지 여부. 기본값: false (하위 호환성을 위해) */
  replaceExisting?: boolean;
  
  /** 핸들러가 등록 해제될 때 호출할 정리 함수 */
  cleanup?: () => void;
}
```

## 3. 사용 패턴

`HandlerConfig`는 `actionRegister.register()`로 핸들러를 등록할 때 세 번째 인수로 사용됩니다.

### 기본 구성

실행 순서를 제어하기 위해 `priority`를 지정하고, `debounce` 및 `throttle`과 같은 타이밍 제어를 사용할 수 있습니다.

```typescript
// 이 핸들러는 기본 우선순위(0)를 가진 핸들러보다 먼저 실행됩니다.
// 그리고 마지막 디스패치 후 300ms 후에만 호출됩니다.
register.register('search', searchHandler, {
  priority: 100,
  debounce: 300,
});
```

### 생명주기 관리

`once` 속성은 핸들러가 한 번만 실행된 후 자동으로 등록 해제되도록 합니다. `cleanup` 함수는 핸들러가 등록 해제될 때 호출되며, 이는 리소스 관리에 유용합니다.

```typescript
const initHandler = () => { console.log('초기화 로직'); };
const cleanupLogic = () => { console.log('리소스 정리 중'); };

register.register('init', initHandler, {
  once: true, // 이 핸들러는 첫 번째 실행 후 제거됩니다.
  cleanup: cleanupLogic, // 이 함수는 등록 해제 시 호출됩니다.
});
```

### 고급 제어

`blocking` 속성은 파이프라인이 비동기 핸들러가 완료될 때까지 기다리도록 강제하는 데 사용할 수 있습니다. `id`는 식별 및 `replaceExisting`을 사용한 교체에 사용할 수 있습니다.

```typescript
register.register('payment', asyncPaymentHandler, {
  priority: 200,
  blocking: true, // 파이프라인은 이 핸들러가 해결될 때까지 기다립니다.
  id: 'payment-processor',
});

// 나중에 동일한 id를 사용하여 핸들러를 교체할 수 있습니다.
register.register('payment', newAsyncPaymentHandler, {
  id: 'payment-processor',
  replaceExisting: true,
});
```

## 4. TypeDoc 링크

[types.ts의 HandlerConfig](../../../packages/core/src/types.ts)
