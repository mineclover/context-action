[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-protocol/src](../README.md) / defineAction

# Function: defineAction()

> **defineAction**&lt;`TSchema`&gt;(`options`, `zodModule`): [`UnifiedAction`](../interfaces/UnifiedAction.md)\<`$InferObjectOutput`\<`TSchema`, \{ \}\>\>

Defined in: packages/tool-protocol/src/action-schema.ts:226

Zod 스키마 기반 Action 정의

defineTool 패턴을 기반으로 context-action에 맞게 구현:
- Single Source of Truth: Zod 스키마로 타입 + 검증 + 메타데이터 통합
- 런타임 검증: validate(), safeParse()
- Tool Chain 호환: toMCP(), toOpenAI(), toAnthropic()

## Type Parameters

### TSchema

`TSchema` *extends* `Readonly`\<\{\[`k`: `string`\]: `$ZodType`\<`unknown`, `unknown`, `$ZodTypeInternals`\<`unknown`, `unknown`\>\>; \}\>

## Parameters

### options

[`DefineActionOptions`](../interfaces/DefineActionOptions.md)&lt;`TSchema`&gt;

Action 정의 옵션

### zodModule

`__module`

Zod 모듈. Passing the caller's module keeps schema creation
  bound to the same Zod instance used by the application.

## Returns

[`UnifiedAction`](../interfaces/UnifiedAction.md)\<`$InferObjectOutput`\<`TSchema`, \{ \}\>\>

UnifiedAction 인스턴스

## Example

```typescript
import { z } from 'zod';
import { defineAction } from '@context-action/tool-protocol';

const updateUserAction = defineAction({
  name: 'updateUser',
  description: 'Update user profile',
  parameters: z.object({
    id: z.string().min(1).meta({ description: 'User ID' }),
    name: z.string().min(2).max(50).meta({ description: 'User name' }),
    email: z.string().email().optional(),
  }),
}, z);

// 검증
const validated = updateUserAction.validate({ id: '123', name: 'John' });

// Tool chain 변환
const mcpTool = updateUserAction.toMCP();
```
