[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-protocol/src](../README.md) / createActionFactory

# Function: createActionFactory()

> **createActionFactory**(`zodModule`): [`ActionFactory`](../type-aliases/ActionFactory.md)

Defined in: [packages/tool-protocol/src/action-schema.ts:400](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/action-schema.ts#L400)

Zod 모듈을 바인딩한 defineAction 팩토리 생성

매번 z 모듈을 전달하지 않아도 되도록 팩토리 패턴 제공

## Parameters

### zodModule

`__module`

Zod 모듈

## Returns

[`ActionFactory`](../type-aliases/ActionFactory.md)

defineAction 함수 (z 바인딩됨)

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
