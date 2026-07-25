[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-protocol/src](../README.md) / createActionFactory

# Function: createActionFactory()

> **createActionFactory**(`zodModule`): &lt;`TSchema`&gt;(`options`) => [`UnifiedAction`](../interfaces/UnifiedAction.md)\<`$InferObjectOutput`\<`TSchema`, \{ \}\>\>

Defined in: [packages/tool-protocol/src/action-schema.ts:359](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-protocol/src/action-schema.ts#L359)

Zod 모듈을 바인딩한 defineAction 팩토리 생성

매번 z 모듈을 전달하지 않아도 되도록 팩토리 패턴 제공

## Parameters

### zodModule

`__module`

Zod 모듈

## Returns

defineAction 함수 (z 바인딩됨)

&lt;`TSchema`&gt;(`options`) => [`UnifiedAction`](../interfaces/UnifiedAction.md)\<`$InferObjectOutput`\<`TSchema`, \{ \}\>\>

## Example

```typescript
import { z } from 'zod';
import { createActionFactory } from '@context-action/tool-protocol';

const defineAction = createActionFactory(z);

const updateUser = defineAction({
  name: 'updateUser',
  parameters: z.object({ id: z.string() }),
});
```
