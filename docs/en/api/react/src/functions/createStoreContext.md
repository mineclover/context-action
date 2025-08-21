[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / createStoreContext

# Function: createStoreContext()

> **createStoreContext**(`name?`): [`StoreContextReturn`](../interfaces/StoreContextReturn.md)

Defined in: [packages/react/src/stores/core/StoreContext.tsx:29](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/react/src/stores/core/StoreContext.tsx#L29)

Store Context 팩토리 함수 - 고급 사용 시나리오용

핵심 기능: 독립적인 StoreRegistry 인스턴스를 가진 Context 생성
사용 시나리오: 
- 여러 독립적인 Store 영역이 필요한 경우
- 라이브러리에서 격리된 Store 컨텍스트가 필요한 경우

참고: 일반적인 사용에는 StoreProvider를 권장

## Parameters

### name?

`string`

StoreRegistry 인스턴스 이름

## Returns

[`StoreContextReturn`](../interfaces/StoreContextReturn.md)

Provider 컴포넌트와 훅들을 포함한 객체

## See

https://mineclover.github.io/context-action/en/guide/patterns/store/advanced-config#isolated-contexts
