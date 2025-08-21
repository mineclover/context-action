[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / customRef

# Function: customRef()

> **customRef**&lt;`T`&gt;(`config`): [`RefInitConfig`](../interfaces/RefInitConfig.md)&lt;`T`&gt;

Defined in: [packages/react/src/refs/helpers.ts:15](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/react/src/refs/helpers.ts#L15)

커스텀 참조 정의 헬퍼

## Type Parameters

### Generic type T

`T` *extends* [`RefTarget`](../interfaces/RefTarget.md)

## Parameters

### config

`Partial`\<`Omit`\<[`RefInitConfig`](../interfaces/RefInitConfig.md)&lt;`T`&gt;, `"objectType"`\>\> & `object`

## Returns

[`RefInitConfig`](../interfaces/RefInitConfig.md)&lt;`T`&gt;
