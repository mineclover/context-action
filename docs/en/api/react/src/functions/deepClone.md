[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / deepClone

# Function: deepClone()

> **deepClone**&lt;`T`&gt;(`value`): `T`

Defined in: [packages/react/src/stores/utils/immutable.ts:126](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/stores/utils/immutable.ts#L126)

깊은 복사 함수 - structuredClone 기반 구현

핵심 로직:
1. Primitive 값은 그대로 반환 (복사 불필요)
2. null/undefined는 그대로 반환
3. 객체/배열은 structuredClone으로 깊은 복사
4. Function, Symbol 등 복사 불가능한 타입은 에러 처리

## Type Parameters

### Generic type T

Type parameter **T**

복사할 값의 타입

## Parameters

### value

Type parameter **T**

복사할 값

## Returns

Type parameter **T**

깊은 복사된 값

## Example

```typescript
// Primitive 값 - 복사 불필요
const num = deepClone(42);           // 42 (동일한 값)
const str = deepClone('hello');      // 'hello' (동일한 값)

// 객체 - 깊은 복사
const user = { id: '1', profile: { name: 'John' } };
const clonedUser = deepClone(user);
clonedUser.profile.name = 'Jane';    // 원본 user는 변경되지 않음

// 배열 - 깊은 복사
const items = [{ id: 1 }, { id: 2 }];
const clonedItems = deepClone(items);
clonedItems[0].id = 999;             // 원본 items는 변경되지 않음
```
