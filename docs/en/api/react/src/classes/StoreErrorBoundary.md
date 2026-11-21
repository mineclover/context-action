[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/react/src](../README.md) / StoreErrorBoundary

# Class: StoreErrorBoundary

Defined in: [packages/react/src/stores/components/StoreErrorBoundary.tsx:44](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/components/StoreErrorBoundary.tsx#L44)

Store 시스템을 위한 에러 경계 컴포넌트

Store 관련 에러들을 캐치하고 적절한 fallback UI를 제공합니다.
개발 모드에서는 자세한 에러 정보를 표시하고, 프로덕션에서는 
사용자 친화적인 메시지를 보여줍니다.

## Extends

- `Component`\<[`StoreErrorBoundaryProps`](../interfaces/StoreErrorBoundaryProps.md), [`StoreErrorBoundaryState`](../advanced/interfaces/StoreErrorBoundaryState.md)\>

## Constructors

### Constructor

> **new StoreErrorBoundary**(`props`): `StoreErrorBoundary`

Defined in: [packages/react/src/stores/components/StoreErrorBoundary.tsx:45](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/components/StoreErrorBoundary.tsx#L45)

#### Parameters

##### props

[`StoreErrorBoundaryProps`](../interfaces/StoreErrorBoundaryProps.md)

#### Returns

`StoreErrorBoundary`

#### Overrides

`Component<StoreErrorBoundaryProps, StoreErrorBoundaryState>.constructor`

## Methods

### getDerivedStateFromError()

> `static` **getDerivedStateFromError**(`error`): `Partial`\<[`StoreErrorBoundaryState`](../advanced/interfaces/StoreErrorBoundaryState.md)\>

Defined in: [packages/react/src/stores/components/StoreErrorBoundary.tsx:56](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/components/StoreErrorBoundary.tsx#L56)

#### Parameters

##### error

`Error`

#### Returns

`Partial`\<[`StoreErrorBoundaryState`](../advanced/interfaces/StoreErrorBoundaryState.md)\>

***

### componentDidCatch()

> **componentDidCatch**(`error`, `errorInfo`): `void`

Defined in: [packages/react/src/stores/components/StoreErrorBoundary.tsx:67](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/components/StoreErrorBoundary.tsx#L67)

Catches exceptions generated in descendant components. Unhandled exceptions will cause
the entire component tree to unmount.

#### Parameters

##### error

`Error`

##### errorInfo

`ErrorInfo`

#### Returns

`void`

#### Overrides

`Component.componentDidCatch`

***

### componentDidUpdate()

> **componentDidUpdate**(`prevProps`): `void`

Defined in: [packages/react/src/stores/components/StoreErrorBoundary.tsx:112](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/components/StoreErrorBoundary.tsx#L112)

Called immediately after updating occurs. Not called for the initial render.

The snapshot is only present if [getSnapshotBeforeUpdate](#) is present and returns non-null.

#### Parameters

##### prevProps

[`StoreErrorBoundaryProps`](../interfaces/StoreErrorBoundaryProps.md)

#### Returns

`void`

#### Overrides

`Component.componentDidUpdate`

***

### resetErrorBoundary()

> **resetErrorBoundary**(): `void`

Defined in: [packages/react/src/stores/components/StoreErrorBoundary.tsx:134](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/components/StoreErrorBoundary.tsx#L134)

#### Returns

`void`

***

### render()

> **render**(): `ReactNode`

Defined in: [packages/react/src/stores/components/StoreErrorBoundary.tsx:143](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/components/StoreErrorBoundary.tsx#L143)

#### Returns

`ReactNode`

#### Overrides

`Component.render`
