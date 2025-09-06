[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / createRefContext

# Function: createRefContext()

## Call Signature

> **createRefContext**&lt;`T`&gt;(`contextName`, `options?`): [`RefContextReturn`](../interfaces/RefContextReturn.md)&lt;`T`&gt;

Defined in: [packages/react/src/refs/createRefContext.ts:93](https://github.com/mineclover/context-action/blob/9ef553971e551d0c040b094ff64383ff10f16722/packages/react/src/refs/createRefContext.ts#L93)

간소화된 참조 컨텍스트 생성 함수 - 향상된 타입 추론

### Type Parameters

#### T

`T` *extends* `Record`\<`string`, `any`\>

### Parameters

#### contextName

`string`

#### options?

[`CreateRefContextOptions`](../interfaces/CreateRefContextOptions.md)

### Returns

[`RefContextReturn`](../interfaces/RefContextReturn.md)&lt;`T`&gt;

## Call Signature

> **createRefContext**&lt;`T`&gt;(`contextName`, `refDefinitions`, `options?`): [`RefContextReturn`](../interfaces/RefContextReturn.md)\<`InferRefTypes`&lt;`T`&gt;\>

Defined in: [packages/react/src/refs/createRefContext.ts:98](https://github.com/mineclover/context-action/blob/9ef553971e551d0c040b094ff64383ff10f16722/packages/react/src/refs/createRefContext.ts#L98)

간소화된 참조 컨텍스트 생성 함수 - 향상된 타입 추론

### Type Parameters

#### T

`T` *extends* `RefDefinitions`

### Parameters

#### contextName

`string`

#### refDefinitions

Type parameter **T**

#### options?

[`CreateRefContextOptions`](../interfaces/CreateRefContextOptions.md)

### Returns

[`RefContextReturn`](../interfaces/RefContextReturn.md)\<`InferRefTypes`&lt;`T`&gt;\>
