# `ActionRegister` 클래스

## 1. 목적

`ActionRegister` 클래스는 액션 기반 아키텍처의 핵심 구성 요소입니다. 액션 핸들러를 등록하고, 액션을 디스패치하며, 핸들러 실행을 관리하는 중앙 집중식 메커니즘을 제공합니다. 이는 비즈니스 로직과 UI를 분리하고, 예측 가능하며 테스트 가능한 애플리케이션 흐름을 가능하게 합니다.

## 2. 구조

`ActionRegister` 클래스는 다음 속성과 메서드를 가집니다.

```typescript
export class ActionRegister<T extends ActionPayloadMap> {
  // 액션 레지스트리의 고유한 이름입니다.
  readonly name: string;

  // 액션 레지스트리의 구성입니다.
  readonly config: Required<ActionRegisterConfig>;

  // 액션 핸들러를 등록합니다.
  register<K extends keyof T>(
    action: K,
    handler: ActionHandler<T[K]>,
    config?: HandlerConfig
  ): UnregisterFunction;

  // 액션을 디스패치합니다.
  dispatch<K extends keyof T>(
    action: K,
    payload?: T[K],
    options?: DispatchOptions
  ): Promise<void>;

  // 액션을 디스패치하고 실행 결과를 반환합니다.
  dispatchWithResult<K extends keyof T, R = void>(
    action: K,
    payload?: T[K],
    options?: DispatchOptions
  ): Promise<ExecutionResult<R>>;

  // 특정 액션에 대한 실행 모드를 설정합니다.
  setActionExecutionMode(action: keyof T, mode: ExecutionMode): void;

  // 특정 액션에 대한 실행 모드를 가져옵니다.
  getActionExecutionMode(action: keyof T): ExecutionMode;

  // 모든 핸들러를 등록 해제합니다.
  clear(): void;

  // ... 기타 유틸리티 메서드
}
```

## 3. 사용 패턴

`ActionRegister`는 애플리케이션의 액션 흐름을 관리하는 데 사용됩니다.

### 액션 레지스터 생성하기

```typescript
import { ActionRegister } from '@context-action/core';

// 액션 페이로드 맵을 정의합니다.
interface AppActions extends ActionPayloadMap {
  userLoggedIn: { userId: string };
  itemAddedToCart: { itemId: string; quantity: number };
}

// 새 ActionRegister 인스턴스를 생성합니다.
const appActions = new ActionRegister<AppActions>({
  name: 'MyAppActions',
  registry: {
    debug: true, // 개발 모드에서 디버깅 활성화
  },
});
```

### 핸들러 등록하기

`register` 메서드를 사용하여 특정 액션에 응답하는 함수를 연결합니다.

```typescript
// 사용자 로그인 시 호출될 핸들러
appActions.register('userLoggedIn', (payload) => {
  console.log(`사용자 ${payload.userId}가 로그인했습니다.`);
});

// 장바구니에 항목이 추가될 때 호출될 핸들러
appActions.register('itemAddedToCart', (payload) => {
  console.log(`${payload.itemId} 항목 ${payload.quantity}개가 장바구니에 추가되었습니다.`);
}, { priority: 10 }); // 우선순위가 높은 핸들러
```

### 액션 디스패치하기

`dispatch` 메서드를 사용하여 액션을 트리거합니다.

```typescript
// 사용자 로그인 액션 디스패치
appActions.dispatch('userLoggedIn', { userId: 'user123' });

// 장바구니에 항목 추가 액션 디스패치
appActions.dispatch('itemAddedToCart', { itemId: 'productABC', quantity: 2 });
```

### 실행 결과 가져오기

`dispatchWithResult`를 사용하여 액션 실행의 결과를 기다리고 분석합니다.

```typescript
const result = await appActions.dispatchWithResult('userLoggedIn', { userId: 'user456' });

if (result.success) {
  console.log('액션이 성공적으로 처리되었습니다.');
} else {
  console.error('액션 처리 중 오류 발생:', result.error);
}
```

### 실행 모드 구성하기

특정 액션에 대해 핸들러가 실행되는 방식을 변경할 수 있습니다.

```typescript
// 'dataFetch' 액션에 대한 핸들러를 병렬로 실행하도록 설정
appActions.setActionExecutionMode('dataFetch', 'parallel');

// 'criticalUpdate' 액션에 대한 핸들러를 순차적으로 실행하도록 설정
appActions.setActionExecutionMode('criticalUpdate', 'sequential');
```

## 4. TypeDoc 링크

[ActionRegister.ts의 ActionRegister](../../../packages/core/src/classes/ActionRegister.ts)
