# Tool Chain Export

Export your action schemas to LLM tool formats for integration with AI services.

## Supported Formats

### MCP (Model Context Protocol)

```typescript
const action = defineAction({
  name: 'searchProducts',
  description: 'Search for products in the catalog',
  parameters: z.object({
    query: z.string(),
    category: z.enum(['electronics', 'clothing', 'home']).optional(),
    maxResults: z.number().int().positive().default(10),
  }),
}, z);

const mcpTool = action.toMCP();
// {
//   name: 'searchProducts',
//   description: 'Search for products in the catalog',
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
//     description: 'Search for products in the catalog',
//     parameters: {
//       type: 'object',
//       properties: { ... },
//       required: ['query']
//     }
//   }
// }

// Use with OpenAI API
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
//   description: 'Search for products in the catalog',
//   input_schema: {
//     type: 'object',
//     properties: { ... },
//     required: ['query']
//   }
// }

// Use with Anthropic API
const response = await anthropic.messages.create({
  model: 'claude-3-opus',
  messages: [...],
  tools: [anthropicTool],
});
```

### JSON Schema (draft-7)

```typescript
const jsonSchema = action.toJSONSchema();
// Standard JSON Schema format
```

## Building Tool Arrays

Convert all actions to tools at once:

```typescript
const schema = createActionSchema({
  search: defineAction({ ... }, z),
  create: defineAction({ ... }, z),
  update: defineAction({ ... }, z),
  delete: defineAction({ ... }, z),
});

// For OpenAI
const openaiTools = Object.values(schema).map(action => action.toOpenAI());

// For Anthropic
const anthropicTools = Object.values(schema).map(action => action.toAnthropic());

// For MCP
const mcpTools = Object.values(schema).map(action => action.toMCP());
```

## Handling LLM Tool Calls

When the LLM calls a tool, validate and dispatch:

```typescript
async function handleToolCall(toolName: string, args: unknown) {
  const action = schema[toolName];

  if (!action) {
    throw new Error(`Unknown tool: ${toolName}`);
  }

  // Validate the arguments
  const result = action.safeParse(args);

  if (!result.success) {
    return {
      error: `Invalid arguments: ${result.error.message}`,
    };
  }

  // Dispatch the action
  await dispatch(toolName, result.data);

  return { success: true };
}
```

## Field Descriptions with meta()

Use Zod 4's `.meta()` to add descriptions for better LLM understanding:

```typescript
const searchAction = defineAction({
  name: 'search',
  description: 'Search the knowledge base',
  parameters: z.object({
    query: z.string()
      .min(1)
      .meta({ description: 'The search query string' }),

    filters: z.object({
      dateFrom: z.string()
        .datetime()
        .optional()
        .meta({ description: 'Filter results from this date (ISO 8601)' }),

      tags: z.array(z.string())
        .optional()
        .meta({ description: 'Filter by tags' }),
    }).optional(),

    limit: z.number()
      .int()
      .min(1)
      .max(100)
      .default(20)
      .meta({ description: 'Maximum number of results to return' }),
  }),
}, z);
```

## Type Safety with Tool Results

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
