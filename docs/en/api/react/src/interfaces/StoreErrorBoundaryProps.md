[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/react/src](../README.md) / StoreErrorBoundaryProps

# Interface: StoreErrorBoundaryProps

Defined in: [packages/react/src/stores/components/StoreErrorBoundary.tsx:19](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/components/StoreErrorBoundary.tsx#L19)

Store Error Boundary Props

## Properties

### children

> **children**: `ReactNode`

Defined in: [packages/react/src/stores/components/StoreErrorBoundary.tsx:20](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/components/StoreErrorBoundary.tsx#L20)

***

### fallback?

> `optional` **fallback?**: `ReactNode` \| ((`error`, `errorInfo`) => `ReactNode`)

Defined in: [packages/react/src/stores/components/StoreErrorBoundary.tsx:21](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/components/StoreErrorBoundary.tsx#L21)

***

### onError?

> `optional` **onError?**: (`error`, `errorInfo`) => `void`

Defined in: [packages/react/src/stores/components/StoreErrorBoundary.tsx:22](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/components/StoreErrorBoundary.tsx#L22)

#### Parameters

##### error

`ContextActionError`

##### errorInfo

`ErrorInfo`

#### Returns

`void`

***

### resetOnPropsChange?

> `optional` **resetOnPropsChange?**: `boolean`

Defined in: [packages/react/src/stores/components/StoreErrorBoundary.tsx:23](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/components/StoreErrorBoundary.tsx#L23)

***

### resetKeys?

> `optional` **resetKeys?**: (`string` \| `number`)[]

Defined in: [packages/react/src/stores/components/StoreErrorBoundary.tsx:24](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/components/StoreErrorBoundary.tsx#L24)
