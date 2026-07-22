# Conventions

## Coding Conventions for LLM Integration

This document outlines the coding conventions and best practices when working with LLMs and the Context-Action framework.

### Action Naming

- Use descriptive action names: `updateUserProfile` instead of `update`
- Follow camelCase convention for action names
- Use verb-noun pattern for clarity

### Type Safety

```typescript
// Always extend ActionPayloadMap
interface UserActions extends ActionPayloadMap {
  updateProfile: { id: string; data: UserData };
  deleteUser: { id: string };
  refreshData: void;
}
```

### Handler Implementation

```typescript
// Use proper error handling
useActionHandler('updateProfile', useCallback(async (payload, controller) => {
  try {
    // Business logic
    const result = await userService.update(payload.id, payload.data);
    userStore.setValue(result);
  } catch (error) {
    controller.abort('Update failed', error);
  }
}, [userStore]));
```

### Store Patterns

- Use declarative store pattern for type safety
- Prefer `useStoreSelector` for specific field access
- Always provide meaningful initial values

### Tool-Calling Protocol Boundary

For an LLM or local agent that can operate a Context-Action workspace, keep the
tool protocol in one registry boundary:

```typescript
import {
  toToolCallRequest,
  toToolListRequest,
} from '@context-action/tool-protocol';

const discovery = registry.listTools(toToolListRequest());
const result = await registry.executeModelToolCall(
  { id, name, arguments: parsedArguments },
  { context: { source: 'model', sessionId }, signal }
);

// Use this only when a JSON-RPC-shaped request must be displayed, exported,
// or executed by a direct-command action boundary.
const request = toToolCallRequest({ id, name, arguments: parsedArguments });
await registry.callTool(request, { context: { source: 'local', sessionId } });
```

- Define each tool once in the `ToolContext` schema. Derive `tools/list`,
  provider definitions, validation, and execution from the registry.
- Provider adapters must derive their payload from the returned canonical
  `ToolDefinition` values: use `toOpenAIToolDefinitions(listAllTools(registry))`
  for an OpenAI-compatible envelope, or pass each `inputSchema` through the
  provider SDK's JSON-Schema adapter. Do not perform a second registry lookup to
  rebuild provider definitions.
- Create discovery requests with `toToolListRequest({ cursor })` when the
  catalog is paginated; do not hand-build protocol objects in provider code.
- Route model-originated calls through `executeModelToolCall()` so source,
  policy, validation, lifecycle events, and structured results stay consistent.
- Use `toToolCallRequest()` and `callTool()` only for a boundary that explicitly
  owns a direct `tools/call` command, such as a catalog sample or local palette.
- Keep retry, cancellation, message history, and provider errors in the runner
  or action hook. Tool handlers own domain invariants and return structured
  values or canonical errors.

The complete web-studio recipe is documented in
[Tool-Calling Web Studio Convention](/en/context-layered/usecase-tool-calling-web-studio).

### AI Runner and Credential Boundary

Keep the view independent from the LLM provider, transport, and credential by
depending on a small runner contract such as `ToolTextGenerator`. The runner
owns provider setup and authentication; the view supplies only the selected
model, message history, and ToolContext execution bridge.

```typescript
interface ToolTextGenerator {
  generate(request: ToolTextGenerationRequest): Promise<ToolTextGenerationResult>;
}
```

When a provider runs a multi-step tool loop, `ToolTextGenerationResult` should
return the provider's complete `responseMessages` as well as display text and a
call count. The caller must append those assistant tool-call and tool-result
messages to the next model turn; storing only the final prose loses the
conversation's execution context. Keep that model history separate from the
short, user-facing chat transcript.

- A browser runner is permitted only for a user-owned, session-only key. State
  the direct-to-provider behavior in the UI and never pass an application-owned
  secret to that runner.
- A production application secret belongs in a server proxy runner. The proxy
  owns authorization, rate limits, audit logging, and provider credentials.
- An OAuth runner owns token acquisition and refresh. Do not put bearer tokens
  in the view-level generation request or persist them in an example by default.
- Tool schemas remain the single source of truth in `ToolContext`. Tool
  handlers should return structured data when the model needs the result in a
  later step; invoke them through `dispatchWithResult`.
- Bound an automatic tool loop with a step limit and return a clear failure to
  the user when a tool execution is rejected or aborted.

The browser OpenRouter example is intentionally a demo runner. A server or
OAuth implementation can replace it without changing the view's generation
call.

### Documentation Standards

- Include comprehensive JSDoc for public APIs
- Provide usage examples in documentation
- Keep examples simple and focused
