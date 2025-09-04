# `UnregisterFunction` 타입 별칭

## 1. 목적

`UnregisterFunction` 타입 별칭은 액션 핸들러를 등록할 때 반환되는 함수를 나타냅니다. 이 함수를 호출하면 액션 파이프라인에서 해당 핸들러가 등록 해제되어 이후에 실행되지 않습니다.

## 2. 구조

`UnregisterFunction`은 인자를 받지 않고 아무것도 반환하지 않는 간단한 함수 타입입니다.

```typescript
export type UnregisterFunction = () => void;
```

## 3. 사용 패턴

`ActionRegister` 인스턴스에서 `register`를 호출하면 `UnregisterFunction`을 얻게 됩니다.

### 핸들러 등록 해제하기

```typescript
import { ActionRegister } from '@context-action/core';

const register = new ActionRegister();

const userHandler = (payload) => {
  console.log('사용자 업데이트:', payload);
};

// 핸들러를 등록하고 등록 해제 함수를 가져옵니다.
const unregister = register.register('updateUser', userHandler);

// ... 코드의 뒷부분에서 핸들러를 제거하고 싶을 때
unregister();
```

## 4. TypeDoc 링크

[types.ts의 UnregisterFunction](../../../packages/core/src/types.ts)
