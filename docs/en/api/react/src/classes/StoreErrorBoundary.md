[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / StoreErrorBoundary

# Class: StoreErrorBoundary

Defined in: [packages/react/src/stores/components/StoreErrorBoundary.tsx:39](https://github.com/mineclover/context-action/blob/9ef553971e551d0c040b094ff64383ff10f16722/packages/react/src/stores/components/StoreErrorBoundary.tsx#L39)

Store 시스템을 위한 에러 경계 컴포넌트

Store 관련 에러들을 캐치하고 적절한 fallback UI를 제공합니다.
개발 모드에서는 자세한 에러 정보를 표시하고, 프로덕션에서는 
사용자 친화적인 메시지를 보여줍니다.

## Extends

- `Component`\<[`StoreErrorBoundaryProps`](../interfaces/StoreErrorBoundaryProps.md), `StoreErrorBoundaryState`\>

## Constructors

### Constructor

> **new StoreErrorBoundary**(`props`): `StoreErrorBoundary`

Defined in: [packages/react/src/stores/components/StoreErrorBoundary.tsx:42](https://github.com/mineclover/context-action/blob/9ef553971e551d0c040b094ff64383ff10f16722/packages/react/src/stores/components/StoreErrorBoundary.tsx#L42)

#### Parameters

##### props

[`StoreErrorBoundaryProps`](../interfaces/StoreErrorBoundaryProps.md)

#### Returns

Type parameter **StoreErrorBoundary**

#### Overrides

`Component<StoreErrorBoundaryProps, StoreErrorBoundaryState>.constructor`

## Methods

### getDerivedStateFromError()

> `static` **getDerivedStateFromError**(`error`): `Partial`&lt;`StoreErrorBoundaryState`&gt;

Defined in: [packages/react/src/stores/components/StoreErrorBoundary.tsx:53](https://github.com/mineclover/context-action/blob/9ef553971e551d0c040b094ff64383ff10f16722/packages/react/src/stores/components/StoreErrorBoundary.tsx#L53)

#### Parameters

##### error

Type parameter **Error**

#### Returns

`Partial`&lt;`StoreErrorBoundaryState`&gt;

***

### componentDidCatch()

> **componentDidCatch**(`error`, `errorInfo`): `void`

Defined in: [packages/react/src/stores/components/StoreErrorBoundary.tsx:65](https://github.com/mineclover/context-action/blob/9ef553971e551d0c040b094ff64383ff10f16722/packages/react/src/stores/components/StoreErrorBoundary.tsx#L65)

Catches exceptions generated in descendant components. Unhandled exceptions will cause
the entire component tree to unmount.

#### Parameters

##### error

Type parameter **Error**

##### errorInfo

Type parameter **ErrorInfo**

#### Returns

`void`

#### Overrides

`Component.componentDidCatch`

***

### componentDidUpdate()

> **componentDidUpdate**(`prevProps`): `void`

Defined in: [packages/react/src/stores/components/StoreErrorBoundary.tsx:96](https://github.com/mineclover/context-action/blob/9ef553971e551d0c040b094ff64383ff10f16722/packages/react/src/stores/components/StoreErrorBoundary.tsx#L96)

Called immediately after updating occurs. Not called for the initial render.

The snapshot is only present if getSnapshotBeforeUpdate is present and returns non-null.

#### Parameters

##### prevProps

[`StoreErrorBoundaryProps`](../interfaces/StoreErrorBoundaryProps.md)

#### Returns

`void`

#### Overrides

`Component.componentDidUpdate`

***

### componentWillUnmount()

> **componentWillUnmount**(): `void`

Defined in: [packages/react/src/stores/components/StoreErrorBoundary.tsx:118](https://github.com/mineclover/context-action/blob/9ef553971e551d0c040b094ff64383ff10f16722/packages/react/src/stores/components/StoreErrorBoundary.tsx#L118)

Called immediately before a component is destroyed. Perform any necessary cleanup in this method, such as
cancelled network requests, or cleaning up any DOM elements created in `componentDidMount`.

#### Returns

`void`

#### Overrides

`Component.componentWillUnmount`

***

### resetErrorBoundary()

> **resetErrorBoundary**(): `void`

Defined in: [packages/react/src/stores/components/StoreErrorBoundary.tsx:124](https://github.com/mineclover/context-action/blob/9ef553971e551d0c040b094ff64383ff10f16722/packages/react/src/stores/components/StoreErrorBoundary.tsx#L124)

#### Returns

`void`

***

### render()

> **render**(): `ReactNode`

Defined in: [packages/react/src/stores/components/StoreErrorBoundary.tsx:137](https://github.com/mineclover/context-action/blob/9ef553971e551d0c040b094ff64383ff10f16722/packages/react/src/stores/components/StoreErrorBoundary.tsx#L137)

#### Returns

Type parameter **ReactNode**

#### Overrides

`Component.render`
