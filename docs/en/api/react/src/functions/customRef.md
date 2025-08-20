[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / customRef

# Function: customRef()

> **customRef**&lt;`T`&gt;(`config`): [`RefInitConfig`](../interfaces/RefInitConfig.md)&lt;`T`&gt;

Defined in: [packages/react/src/refs/helpers.ts:15](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/refs/helpers.ts#L15)

커스텀 참조 정의 헬퍼

## Type Parameters

### Generic type T

`T` *extends* [`RefTarget`](../interfaces/RefTarget.md)

## Parameters

### config

`Partial`\<`Omit`\<[`RefInitConfig`](../interfaces/RefInitConfig.md)&lt;`T`&gt;, `"objectType"`\>\> & `object`

## Returns

[`RefInitConfig`](../interfaces/RefInitConfig.md)&lt;`T`&gt;
