[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / deepClone

# Function: deepClone()

> **deepClone**&lt;`T`&gt;(`value`): `T`

Defined in: [packages/react/src/stores/utils/immutable.ts:111](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/react/src/stores/utils/immutable.ts#L111)

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

## See

https://mineclover.github.io/context-action/en/guide/patterns/store/advanced-config
