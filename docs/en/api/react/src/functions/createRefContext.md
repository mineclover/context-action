[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / createRefContext

# Function: createRefContext()

참조 컨텍스트 생성 함수 (구현)

## Param

컨텍스트 이름

## Param

참조 정의 (선언적 사용 시)

## See

 - https://mineclover.github.io/context-action/en/guide/patterns/ref/
 - https://mineclover.github.io/context-action/en/guide/patterns/ref/basic-usage

## Call Signature

> **createRefContext**&lt;`T`&gt;(`contextName`): [`RefContextReturn`](../interfaces/RefContextReturn.md)&lt;`T`&gt;

Defined in: [packages/react/src/refs/createRefContext.ts:56](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/react/src/refs/createRefContext.ts#L56)

### Type Parameters

#### T

`T` *extends* `Record`\<`string`, [`RefTarget`](../interfaces/RefTarget.md)\>

### Parameters

#### contextName

`string`

### Returns

[`RefContextReturn`](../interfaces/RefContextReturn.md)&lt;`T`&gt;

## Call Signature

> **createRefContext**&lt;`T`&gt;(`contextName`, `refDefinitions`): [`RefContextReturn`](../interfaces/RefContextReturn.md)&lt;`T`&gt;

Defined in: [packages/react/src/refs/createRefContext.ts:61](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/react/src/refs/createRefContext.ts#L61)

### Type Parameters

#### T

`T` *extends* `RefDefinitions`

### Parameters

#### contextName

`string`

#### refDefinitions

Type parameter **T**

### Returns

[`RefContextReturn`](../interfaces/RefContextReturn.md)&lt;`T`&gt;
