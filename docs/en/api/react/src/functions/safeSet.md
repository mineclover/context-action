[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / safeSet

# Function: safeSet()

> **safeSet**&lt;`T`&gt;(`value`, `enableCloning`): `T`

Defined in: [packages/react/src/stores/utils/immutable.ts:418](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/react/src/stores/utils/immutable.ts#L418)

안전한 setter - 입력값의 불변성을 보장하는 값 설정

## Type Parameters

### Generic type T

Type parameter **T**

값의 타입

## Parameters

### value

Type parameter **T**

설정할 값

### enableCloning

`boolean` = `true`

복사 활성화 여부 (기본: true)

## Returns

Type parameter **T**

불변성이 보장된 값
