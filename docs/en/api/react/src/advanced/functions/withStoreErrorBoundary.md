[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src/advanced](../README.md) / withStoreErrorBoundary

# Function: withStoreErrorBoundary()

> **withStoreErrorBoundary**&lt;`P`&gt;(`WrappedComponent`, `errorBoundaryProps?`): `ComponentType`&lt;`P`&gt;

Defined in: [packages/react/src/stores/components/StoreErrorBoundary.tsx:305](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/components/StoreErrorBoundary.tsx#L305)

Enhanced HOC for automatic Store Error Boundary wrapping with security

## Type Parameters

### Generic type P

`P` *extends* `object`

Component props type

## Parameters

### WrappedComponent

`ComponentType`&lt;`P`&gt;

Component to wrap with error boundary

### errorBoundaryProps?

`Omit`\<[`StoreErrorBoundaryProps`](../../interfaces/StoreErrorBoundaryProps.md), `"children"`\>

Error boundary configuration

## Returns

`ComponentType`&lt;`P`&gt;

Enhanced component with comprehensive error handling
