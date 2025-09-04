# `createStore` 함수

## 1. 목적

`createStore` 함수는 `Store` 클래스의 인스턴스를 생성하기 위한 팩토리입니다. 주어진 이름과 초기값으로 새 스토어를 간단하고 타입-세이프하게 생성하는 방법을 제공합니다.

## 2. 시그니처

```typescript
export function createStore<T>(name: string, initialValue: T): Store<T>;
```

## 3. 사용 패턴

`createStore`를 사용하여 새 스토어 인스턴스를 생성합니다.

### 간단한 스토어 생성하기

```typescript
import { createStore } from '@context-action/react';

const userStore = createStore('user', { name: 'Guest', age: 0 });
const themeStore = createStore('theme', 'light');
```

## 4. TypeDoc 링크

[Store.ts의 createStore](../../../packages/react/src/stores/core/Store.ts)
