[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / usePersistedStore

# Function: usePersistedStore()

> **usePersistedStore**&lt;`T`&gt;(`key`, `initialValue`, `options`): [`Store`](../classes/Store.md)&lt;`T`&gt;

Defined in: [packages/react/src/stores/hooks/usePersistedStore.ts:30](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/stores/hooks/usePersistedStore.ts#L30)

지속성 Store Hook
핵심 기능: localStorage/sessionStorage에 자동 저장/로드되는 Store 생성

핵슬 로직:
1. 초기화 - Storage에서 기존 값 로드 또는 초기값 사용
2. 자동 저장 - Store 값 변경 시 Storage에 자동 저장
3. 교차 탭 동기화 - storage 이벤트로 다른 탭과 동기화
4. 에러 처리 - 직렬화/역직렬화 실패 시 경고 로그

## Type Parameters

### Generic type T

Type parameter **T**

## Parameters

### key

`string`

Storage 키

### initialValue

Type parameter **T**

초기값

### options

`PersistOptions` = `{}`

지속성 옵션

## Returns

[`Store`](../classes/Store.md)&lt;`T`&gt;

지속성 Store 인스턴스
