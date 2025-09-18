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

### Documentation Standards

- Include comprehensive JSDoc for public APIs
- Provide usage examples in documentation
- Keep examples simple and focused