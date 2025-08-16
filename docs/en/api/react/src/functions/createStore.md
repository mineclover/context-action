[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / createStore

# Function: createStore()

> **createStore**&lt;`T`&gt;(`name`, `initialValue`): [`Store`](../classes/Store.md)&lt;`T`&gt;

Defined in: [packages/react/src/stores/core/Store.ts:360](https://github.com/mineclover/context-action/blob/08bf17d6ec1c09cfe0ffb9710189395df90c9772/packages/react/src/stores/core/Store.ts#L360)

Store 팩토리 함수 - 간편한 Store 인스턴스 생성
핵심 기능: 타입 안전한 Store 인스턴스 생성을 위한 팩토리 함수

## Type Parameters

### Generic type T

Type parameter **T**

Store 값 타입

## Parameters

### name

`string`

Store 식별자 이름

### initialValue

Type parameter **T**

Store 초기값

## Returns

[`Store`](../classes/Store.md)&lt;`T`&gt;

Store 인스턴스

## Example

```typescript
// 객체 Store 생성
const userStore = createStore('user', { id: '', name: '', email: '' });

// 원시값 Store 생성
const countStore = createStore('count', 0);
const themeStore = createStore('theme', 'light');

// Store 사용
userStore.setValue({ id: '1', name: 'John', email: 'john@example.com' });
countStore.setValue(42);
```
