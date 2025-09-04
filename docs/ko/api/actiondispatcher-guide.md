# `ActionDispatcher` 인터페이스

## 1. 목적

`ActionDispatcher` 인터페이스는 액션을 타입-세이프하게 디스패치하는 방법을 제공합니다. `ActionPayloadMap`을 기반으로 각 액션에 대해 올바른 페이로드가 제공되도록 조건부 타입을 사용하여 강제합니다.

## 2. 구조

`ActionDispatcher` 인터페이스는 여러 호출 시그니처를 가진 함수입니다.

```typescript
export interface ActionDispatcher<T extends ActionPayloadMap> {
  // 페이로드 없는 액션 디스패치
  <K extends VoidActions<T>>(
    action: K,
    options?: DispatchOptions
  ): Promise<void>;

  // 선택적 undefined 페이로드를 가진 액션 디스패치
  <K extends VoidActions<T>>(
    action: K,
    payload?: undefined,
    options?: DispatchOptions
  ): Promise<void>;

  // 필수 페이로드를 가진 액션 디스패치
  <K extends PayloadActions<T>>(
    action: K,
    payload: T[K],
    options?: DispatchOptions
  ): Promise<void>;
}
```

## 3. 사용 패턴

일반적으로 `ActionRegister`나 `useActionDispatch` 훅에서 `ActionDispatcher` 인스턴스를 얻습니다.

### 액션 디스패치하기

```typescript
interface MyActions extends ActionPayloadMap {
  login: { user: string; pass: string };
  logout: void;
}

const register = new ActionRegister<MyActions>();
const dispatch: ActionDispatcher<MyActions> = register.dispatch.bind(register);

// 페이로드를 가진 액션 디스패치
dispatch('login', { user: 'test', pass: '123' });

// 페이로드 없는 액션 디스패치
dispatch('logout');
```

## 4. TypeDoc 링크

[types.ts의 ActionDispatcher](../../../packages/core/src/types.ts)
