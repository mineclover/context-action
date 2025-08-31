[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / createRefContext

# Function: createRefContext()

## Call Signature

> **createRefContext**\<`T`\>(`contextName`, `options?`): [`RefContextReturn`](../interfaces/RefContextReturn.md)\<`T`\>

Defined in: [packages/react/src/refs/createRefContext.ts:93](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/react/src/refs/createRefContext.ts#L93)

간소화된 참조 컨텍스트 생성 함수 - 향상된 타입 추론

### Type Parameters

#### T

`T` *extends* `Record`\<`string`, [`RefTarget`](../interfaces/RefTarget.md)\>

### Parameters

#### contextName

`string`

#### options?

[`CreateRefContextOptions`](../interfaces/CreateRefContextOptions.md)

### Returns

[`RefContextReturn`](../interfaces/RefContextReturn.md)\<`T`\>

## Call Signature

> **createRefContext**\<`T`\>(`contextName`, `refDefinitions`, `options?`): [`RefContextReturn`](../interfaces/RefContextReturn.md)\<`InferRefTypes`\<`T`\>\>

Defined in: [packages/react/src/refs/createRefContext.ts:98](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/react/src/refs/createRefContext.ts#L98)

간소화된 참조 컨텍스트 생성 함수 - 향상된 타입 추론

### Type Parameters

#### T

`T` *extends* `RefDefinitions`

### Parameters

#### contextName

`string`

#### refDefinitions

`T`

#### options?

[`CreateRefContextOptions`](../interfaces/CreateRefContextOptions.md)

### Returns

[`RefContextReturn`](../interfaces/RefContextReturn.md)\<`InferRefTypes`\<`T`\>\>
