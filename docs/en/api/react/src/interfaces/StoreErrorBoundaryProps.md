[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / StoreErrorBoundaryProps

# Interface: StoreErrorBoundaryProps

Defined in: [packages/react/src/stores/components/StoreErrorBoundary.tsx:14](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/components/StoreErrorBoundary.tsx#L14)

Store Error Boundary Props

## Properties

### children

> **children**: `ReactNode`

Defined in: [packages/react/src/stores/components/StoreErrorBoundary.tsx:15](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/components/StoreErrorBoundary.tsx#L15)

***

### fallback?

> `optional` **fallback?**: `ReactNode` \| ((`error`, `errorInfo`) => `ReactNode`)

Defined in: [packages/react/src/stores/components/StoreErrorBoundary.tsx:16](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/components/StoreErrorBoundary.tsx#L16)

***

### onError?

> `optional` **onError?**: (`error`, `errorInfo`) => `void`

Defined in: [packages/react/src/stores/components/StoreErrorBoundary.tsx:17](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/components/StoreErrorBoundary.tsx#L17)

#### Parameters

##### error

Type parameter **ContextActionError**

##### errorInfo

Type parameter **ErrorInfo**

#### Returns

`void`

***

### resetOnPropsChange?

> `optional` **resetOnPropsChange?**: `boolean`

Defined in: [packages/react/src/stores/components/StoreErrorBoundary.tsx:18](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/components/StoreErrorBoundary.tsx#L18)

***

### resetKeys?

> `optional` **resetKeys?**: (`string` \| `number`)[]

Defined in: [packages/react/src/stores/components/StoreErrorBoundary.tsx:19](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/components/StoreErrorBoundary.tsx#L19)
