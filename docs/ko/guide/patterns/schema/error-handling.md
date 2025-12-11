# 에러 처리

React 애플리케이션에서 검증 에러를 우아하게 처리합니다.

## ActionValidationError

`strict` 모드에서 검증이 실패하면 `ActionValidationError`가 throw됩니다.

### 에러 속성

```typescript
import { ActionValidationError, isActionValidationError } from '@context-action/react';

try {
  await dispatch('updateUser', { id: '', name: 'A' });
} catch (error) {
  if (isActionValidationError(error)) {
    // 실패한 액션 이름
    error.action; // 'updateUser'

    // 에러 메시지
    error.message; // 'Action "updateUser" payload validation failed: ...'

    // 모든 검증 이슈
    error.issues; // [{ message: '...', path: ['id'], code: '...' }, ...]

    // 첫 번째 에러 메시지
    error.firstError; // '문자열은 최소 1자 이상이어야 합니다'

    // 에러가 있는 경로
    error.errorPaths; // ['id', 'name']

    // 포맷된 에러 (중첩 객체)
    error.formattedErrors; // { id: { _errors: [...] }, name: { _errors: [...] } }

    // 평탄화된 에러
    error.flattenedErrors; // { fieldErrors: { id: [...], name: [...] }, formErrors: [] }

    // 로깅용 직렬화
    error.toJSON(); // { name, action, message, issues }
  }
}
```

## React 에러 처리 패턴

### 컴포넌트 수준 에러 상태

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
        throw e; // 검증 외 에러는 다시 throw
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <ErrorSummary error={error} />}
      {/* 폼 필드 */}
    </form>
  );
}

function ErrorSummary({ error }: { error: ActionValidationError }) {
  return (
    <div className="error-summary">
      <h4>검증 에러</h4>
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

### 필드 수준 에러

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

// 사용
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

### 검증용 커스텀 훅

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

// 사용
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
      // 성공 처리
    }
  };
}
```

## 사전 검증 패턴

액션을 시도하지 않고 에러를 보여주기 위해 dispatch 전에 검증합니다:

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

// 사용
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

    // 검증 통과, dispatch 안전
    await dispatch('createUser', result.data);
  };
}
```

## Error Boundary 통합

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
    throw error; // 검증 외 에러는 다시 throw
  }

  render() {
    if (this.state.error) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}
```

## 로깅 및 모니터링

```typescript
// 모니터링을 위한 전역 에러 핸들러
function setupValidationErrorLogging() {
  const originalDispatch = actionRegister.dispatch.bind(actionRegister);

  actionRegister.dispatch = async (action, payload, options) => {
    try {
      return await originalDispatch(action, payload, options);
    } catch (error) {
      if (isActionValidationError(error)) {
        // 모니터링 서비스에 로그
        console.error('Validation Error:', error.toJSON());

        // 애널리틱스로 전송
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
