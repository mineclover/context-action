[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src/advanced](../README.md) / handleContextActionError

# Function: handleContextActionError()

> **handleContextActionError**(`type`, `message`, `context?`, `originalError?`): [`ContextActionError`](../classes/ContextActionError.md)

Defined in: [packages/react/src/stores/utils/error-handling.ts:142](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/utils/error-handling.ts#L142)

표준화된 에러 처리 함수 (통합된 에러 바운더리 사용)

## Parameters

### type

[`ContextActionErrorType`](../enumerations/ContextActionErrorType.md)

### message

`string`

### context?

`Record`\<`string`, `unknown`\>

### originalError?

`Error`

## Returns

[`ContextActionError`](../classes/ContextActionError.md)
