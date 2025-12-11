# Tool Chain 내보내기

AI 서비스와 통합하기 위해 액션 스키마를 LLM 도구 포맷으로 내보냅니다.

## 지원 포맷

### MCP (Model Context Protocol)

```typescript
const action = defineAction({
  name: 'searchProducts',
  description: '카탈로그에서 제품 검색',
  parameters: z.object({
    query: z.string(),
    category: z.enum(['electronics', 'clothing', 'home']).optional(),
    maxResults: z.number().int().positive().default(10),
  }),
}, z);

const mcpTool = action.toMCP();
// {
//   name: 'searchProducts',
//   description: '카탈로그에서 제품 검색',
//   inputSchema: {
//     type: 'object',
//     properties: {
//       query: { type: 'string' },
//       category: { type: 'string', enum: ['electronics', 'clothing', 'home'] },
//       maxResults: { type: 'integer', default: 10 }
//     },
//     required: ['query']
//   }
// }
```

### OpenAI Function Calling

```typescript
const openaiTool = action.toOpenAI();
// {
//   type: 'function',
//   function: {
//     name: 'searchProducts',
//     description: '카탈로그에서 제품 검색',
//     parameters: {
//       type: 'object',
//       properties: { ... },
//       required: ['query']
//     }
//   }
// }

// OpenAI API와 사용
const response = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [...],
  tools: [openaiTool],
});
```

### Anthropic Claude Tool Use

```typescript
const anthropicTool = action.toAnthropic();
// {
//   name: 'searchProducts',
//   description: '카탈로그에서 제품 검색',
//   input_schema: {
//     type: 'object',
//     properties: { ... },
//     required: ['query']
//   }
// }

// Anthropic API와 사용
const response = await anthropic.messages.create({
  model: 'claude-3-opus',
  messages: [...],
  tools: [anthropicTool],
});
```

### JSON Schema (draft-7)

```typescript
const jsonSchema = action.toJSONSchema();
// 표준 JSON Schema 포맷
```

## 도구 배열 구성

모든 액션을 한 번에 도구로 변환합니다:

```typescript
const schema = createActionSchema({
  search: defineAction({ ... }, z),
  create: defineAction({ ... }, z),
  update: defineAction({ ... }, z),
  delete: defineAction({ ... }, z),
});

// OpenAI용
const openaiTools = Object.values(schema).map(action => action.toOpenAI());

// Anthropic용
const anthropicTools = Object.values(schema).map(action => action.toAnthropic());

// MCP용
const mcpTools = Object.values(schema).map(action => action.toMCP());
```

## LLM 도구 호출 처리

LLM이 도구를 호출하면 검증 후 dispatch합니다:

```typescript
async function handleToolCall(toolName: string, args: unknown) {
  const action = schema[toolName];

  if (!action) {
    throw new Error(`알 수 없는 도구: ${toolName}`);
  }

  // 인자 검증
  const result = action.safeParse(args);

  if (!result.success) {
    return {
      error: `유효하지 않은 인자: ${result.error.message}`,
    };
  }

  // 액션 dispatch
  await dispatch(toolName, result.data);

  return { success: true };
}
```

## meta()로 필드 설명 추가

Zod 4의 `.meta()`를 사용하여 LLM이 더 잘 이해할 수 있도록 설명을 추가합니다:

```typescript
const searchAction = defineAction({
  name: 'search',
  description: '지식 베이스 검색',
  parameters: z.object({
    query: z.string()
      .min(1)
      .meta({ description: '검색 쿼리 문자열' }),

    filters: z.object({
      dateFrom: z.string()
        .datetime()
        .optional()
        .meta({ description: '이 날짜 이후 결과 필터링 (ISO 8601)' }),

      tags: z.array(z.string())
        .optional()
        .meta({ description: '태그로 필터링' }),
    }).optional(),

    limit: z.number()
      .int()
      .min(1)
      .max(100)
      .default(20)
      .meta({ description: '반환할 최대 결과 수' }),
  }),
}, z);
```

## 도구 결과의 타입 안전성

```typescript
interface ToolCallResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

async function executeToolCall<K extends keyof typeof schema>(
  toolName: K,
  args: unknown
): Promise<ToolCallResult<InferActionPayloadMap<typeof schema>[K]>> {
  const action = schema[toolName];
  const result = action.safeParse(args);

  if (!result.success) {
    return { success: false, error: result.error.message };
  }

  return { success: true, data: result.data };
}
```
