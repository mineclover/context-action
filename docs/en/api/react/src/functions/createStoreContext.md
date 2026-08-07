[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / createStoreContext

# Function: createStoreContext()

Implementation function that handles both overloads

## Call Signature

> **createStoreContext**&lt;`T`&gt;(`contextName`, `storeDefinitions`): `StoreContextReturn`\<`InferStoreTypes`&lt;`T`&gt;\>

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:338](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L338)

Overload 1: Type inference - Types inferred from store definitions

### Type Parameters

#### T

`T` *extends* `StoreDefinitions`

### Parameters

#### contextName

`string`

#### storeDefinitions

Type parameter **T**

### Returns

`StoreContextReturn`\<`InferStoreTypes`&lt;`T`&gt;\>

### See

https://mineclover.github.io/context-action/en/guide/patterns/store/basic-usage

## Call Signature

> **createStoreContext**&lt;`T`&gt;(`contextName`, `initialStores`): `StoreContextReturn`&lt;`T`&gt;

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:348](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L348)

Overload 2: Explicit generic types - User provides explicit type interface

### Type Parameters

#### T

`T` *extends* `Record`\<`string`, `any`\>

### Parameters

#### contextName

`string`

#### initialStores

[`InitialStores`](../type-aliases/InitialStores.md)&lt;`T`&gt;

### Returns

`StoreContextReturn`&lt;`T`&gt;

### See

https://mineclover.github.io/context-action/en/guide/patterns/store/basic-usage

## Call Signature

> **createStoreContext**(`contextName`, `initialStores`): `StoreContextReturn`&lt;`any`&gt;

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:358](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L358)

Reflection-friendly overload used by utilities such as
`ReturnType<typeof createStoreContext>`. Specific calls continue to resolve
through the inference overloads above.

### Parameters

#### contextName

`string`

#### initialStores

`Record`\<`string`, `any`\>

### Returns

`StoreContextReturn`&lt;`any`&gt;
