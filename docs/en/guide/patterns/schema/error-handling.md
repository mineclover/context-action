# Error Handling

Handle validation errors gracefully in your React applications.

## ActionValidationError

When validation fails in `strict` mode, an `ActionValidationError` is thrown.

### Error Properties

```typescript
import { ActionValidationError, isActionValidationError } from '@context-action/react';

try {
  await dispatch('updateUser', { id: '', name: 'A' });
} catch (error) {
  if (isActionValidationError(error)) {
    // Action name that failed
    error.action; // 'updateUser'

    // Error message
    error.message; // 'Action "updateUser" payload validation failed: ...'

    // All validation issues
    error.issues; // [{ message: '...', path: ['id'], code: '...' }, ...]

    // First error message
    error.firstError; // 'String must contain at least 1 character(s)'

    // Paths with errors
    error.errorPaths; // ['id', 'name']

    // Formatted errors (nested object)
    error.formattedErrors; // { id: { _errors: [...] }, name: { _errors: [...] } }

    // Flattened errors
    error.flattenedErrors; // { fieldErrors: { id: [...], name: [...] }, formErrors: [] }

    // Serialize for logging
    error.toJSON(); // { name, action, message, issues }
  }
}
```

## React Error Handling Patterns

### Component-Level Error State

```typescript
function UserForm() {
  const dispatch = useUserDispatch();
  const [error, setError] = useState<ActionValidationError | null>(null);

  const handleSubmit = async (data: FormData) => {
    try {
      setError(null);
      await dispatch('updateUser', data);
    } catch (e) {
      if (isActionValidationError(e)) {
        setError(e);
      } else {
        throw e; // Re-throw non-validation errors
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <ErrorSummary error={error} />}
      {/* form fields */}
    </form>
  );
}

function ErrorSummary({ error }: { error: ActionValidationError }) {
  return (
    <div className="error-summary">
      <h4>Validation Errors</h4>
      <ul>
        {error.issues.map((issue, i) => (
          <li key={i}>
            <strong>{issue.path.join('.')}</strong>: {issue.message}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Field-Level Errors

```typescript
function useFormWithValidation<T extends Record<string, any>>() {
  const dispatch = useDispatch();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const submit = async (action: string, data: T) => {
    setFieldErrors({});

    try {
      await dispatch(action, data);
      return true;
    } catch (e) {
      if (isActionValidationError(e)) {
        const errors: Record<string, string[]> = {};

        for (const issue of e.issues) {
          const path = issue.path.join('.');
          if (!errors[path]) errors[path] = [];
          errors[path].push(issue.message);
        }

        setFieldErrors(errors);
        return false;
      }
      throw e;
    }
  };

  const getFieldError = (field: string) => fieldErrors[field]?.[0];
  const hasFieldError = (field: string) => !!fieldErrors[field]?.length;

  return { submit, fieldErrors, getFieldError, hasFieldError };
}

// Usage
function ProfileForm() {
  const { submit, getFieldError, hasFieldError } = useFormWithValidation();

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      submit('updateProfile', formData);
    }}>
      <input
        name="name"
        className={hasFieldError('name') ? 'error' : ''}
      />
      {hasFieldError('name') && (
        <span className="error-text">{getFieldError('name')}</span>
      )}
    </form>
  );
}
```

### Custom Hook for Validation

```typescript
function useValidatedDispatch<T extends ActionPayloadMap>() {
  const dispatch = useActionDispatch();

  return useCallback(async <K extends keyof T>(
    action: K,
    payload: T[K],
    onError?: (error: ActionValidationError) => void
  ): Promise<boolean> => {
    try {
      await dispatch(action, payload);
      return true;
    } catch (error) {
      if (isActionValidationError(error)) {
        onError?.(error);
        return false;
      }
      throw error;
    }
  }, [dispatch]);
}

// Usage
function MyComponent() {
  const validatedDispatch = useValidatedDispatch<UserActions>();
  const [errors, setErrors] = useState<string[]>([]);

  const handleClick = async () => {
    const success = await validatedDispatch(
      'updateUser',
      { id: '', name: 'A' },
      (error) => setErrors(error.issues.map(i => i.message))
    );

    if (success) {
      // Success handling
    }
  };
}
```

## Pre-Validation Pattern

Validate before dispatch to show errors without attempting the action:

```typescript
function usePreValidation<K extends keyof typeof schema>(actionName: K) {
  const action = schema[actionName];

  const validate = useCallback((data: unknown) => {
    const result = action.safeParse(data);

    if (result.success) {
      return { valid: true, data: result.data, errors: null };
    }

    const errors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const path = issue.path.join('.');
      if (!errors[path]) {
        errors[path] = issue.message;
      }
    }

    return { valid: false, data: null, errors };
  }, [action]);

  return validate;
}

// Usage
function CreateUserForm() {
  const validate = usePreValidation('createUser');
  const dispatch = useDispatch();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (data: FormData) => {
    const result = validate(data);

    if (!result.valid) {
      setErrors(result.errors);
      return;
    }

    // Validation passed, safe to dispatch
    await dispatch('createUser', result.data);
  };
}
```

## Error Boundary Integration

```typescript
class ActionErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { error: ActionValidationError | null }
> {
  state = { error: null };

  static getDerivedStateFromError(error: Error) {
    if (isActionValidationError(error)) {
      return { error };
    }
    throw error; // Re-throw non-validation errors
  }

  render() {
    if (this.state.error) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}
```

## Logging and Monitoring

```typescript
// Global error handler for monitoring
function setupValidationErrorLogging() {
  const originalDispatch = actionRegister.dispatch.bind(actionRegister);

  actionRegister.dispatch = async (action, payload, options) => {
    try {
      return await originalDispatch(action, payload, options);
    } catch (error) {
      if (isActionValidationError(error)) {
        // Log to monitoring service
        console.error('Validation Error:', error.toJSON());

        // Send to analytics
        analytics.track('validation_error', {
          action: error.action,
          issues: error.issues,
        });
      }
      throw error;
    }
  };
}
```
