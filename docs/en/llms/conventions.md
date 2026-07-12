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
