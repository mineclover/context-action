# Zod 스키마 통합

Zod 기반 액션 정의 시스템을 통해 런타임 검증과 타입 안전성을 제공합니다.

## 개요

스키마 통합을 통해 다음을 할 수 있습니다:

- **Zod 스키마로 액션 정의** - 타입과 검증의 단일 소스
- **런타임 페이로드 검증** - dispatch 시 페이로드 검증
- **Tool Chain 포맷 변환** - MCP, OpenAI, Anthropic 포맷으로 내보내기
- **타입 추론** - 스키마에서 TypeScript 타입 자동 생성

## 빠른 시작

```typescript
import { z } from 'zod';
import { defineAction, createActionSchema, createActionContext } from '@context-action/react';

// 1. Zod 스키마로 액션 정의
const updateUserAction = defineAction({
  name: 'updateUser',
  description: '사용자 프로필 업데이트',
  parameters: z.object({
    id: z.string().min(1),
    name: z.string().min(2).max(50),
    email: z.string().email().optional(),
  }),
}, z);

// 2. 스키마 맵 생성
const userSchema = createActionSchema({
  updateUser: updateUserAction,
});

// 3. 스키마와 함께 ActionContext 생성
const { Provider, useActionDispatch } = createActionContext<
  InferActionPayloadMap<typeof userSchema>
>('User', {
  schema: userSchema,
  registry: {
    validationMode: 'strict', // 'strict' | 'warn' | 'silent'
  },
});
```

## 문서

- [기본 사용법](./basic-usage.md) - 스키마 정의 시작하기
- [검증 모드](./validation-modes.md) - 검증 에러 처리 방식 설정
- [Tool Chain 내보내기](./tool-chain.md) - LLM 도구 포맷으로 스키마 내보내기
- [에러 처리](./error-handling.md) - 앱에서 검증 에러 처리하기

## API 레퍼런스

### defineAction

검증과 포맷 변환 기능이 있는 통합 액션을 생성합니다.

```typescript
function defineAction<TSchema extends ZodRawShape>(
  options: DefineActionOptions<TSchema>,
  zodModule: typeof z
): UnifiedAction<z.infer<ZodObject<TSchema>>>
```

### createActionSchema

여러 액션을 스키마 맵으로 그룹화합니다.

```typescript
function createActionSchema<T extends Record<string, UnifiedAction>>(
  actions: T
): T & ActionSchemaMap
```

### createActionFactory

Zod 모듈이 미리 바인딩된 팩토리를 생성합니다.

```typescript
function createActionFactory(zodModule: typeof z): DefineActionFn
```

## 요구사항

- `zod@^4.0.0` peer dependency (선택사항)
- 스키마가 제공된 경우에만 스키마 검증이 활성화됨
