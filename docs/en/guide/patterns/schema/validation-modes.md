# Validation Modes

Configure how the ActionRegister handles validation errors during dispatch.

## Available Modes

### strict (Default)

Throws `ActionValidationError` when validation fails. The handler is not executed.

```typescript
const { Provider } = createActionContext<MyActions>('App', {
  schema: mySchema,
  registry: {
    validationMode: 'strict',
  },
});

// Usage
try {
  await dispatch('updateUser', { id: '', name: 'A' }); // Invalid
} catch (error) {
  if (isActionValidationError(error)) {
    console.log(error.action);    // 'updateUser'
    console.log(error.firstError); // First validation message
    console.log(error.issues);     // All validation issues
  }
}
```

### warn

Logs a warning but continues with handler execution.

```typescript
const { Provider } = createActionContext<MyActions>('App', {
  schema: mySchema,
  registry: {
    validationMode: 'warn',
  },
});

// Console output: Action "updateUser" payload validation failed: ...
// Handler still executes with the invalid payload
await dispatch('updateUser', { id: '', name: 'A' });
```

### silent

Ignores validation errors completely. Handler executes with potentially invalid payload.

```typescript
const { Provider } = createActionContext<MyActions>('App', {
  schema: mySchema,
  registry: {
    validationMode: 'silent',
  },
});

// No error, no warning, handler executes
await dispatch('updateUser', { id: '', name: 'A' });
```

## Disabling Validation

To completely disable validation while keeping schema metadata:

```typescript
const { Provider } = createActionContext<MyActions>('App', {
  schema: mySchema,
  registry: {
    validateOnDispatch: false, // Disable validation
  },
});
```

## Recommended Setup

### Development

Use `strict` mode to catch validation errors early:

```typescript
const config = {
  schema: mySchema,
  registry: {
    validationMode: 'strict',
  },
};
```

### Production

Consider using `warn` or `silent` to prevent crashes:

```typescript
const config = {
  schema: mySchema,
  registry: {
    validationMode: process.env.NODE_ENV === 'production' ? 'warn' : 'strict',
  },
};
```

### Testing

Use `strict` mode and catch errors explicitly:

```typescript
it('should reject invalid payload', async () => {
  await expect(
    dispatch('updateUser', { id: '', name: 'A' })
  ).rejects.toThrow(ActionValidationError);
});
```

## Schema-less Actions

Actions not defined in the schema are not validated:

```typescript
const schema = createActionSchema({
  updateUser: defineAction({ ... }, z),
  // deleteUser is NOT in schema
});

const { Provider } = createActionContext<MyActions>('App', {
  schema,
  registry: { validationMode: 'strict' },
});

// updateUser is validated
await dispatch('updateUser', { ... }); // Validates

// deleteUser is NOT validated (not in schema)
await dispatch('deleteUser', { ... }); // No validation
```

## Performance Considerations

- Validation runs on every dispatch when enabled
- For high-frequency actions, consider `validateOnDispatch: false`
- Schema definitions are created once and reused
