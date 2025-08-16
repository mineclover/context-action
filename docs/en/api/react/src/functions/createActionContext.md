[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / createActionContext

# Function: createActionContext()

## Fileoverview

Action system exports - comprehensive action management

## Implements

actioncontext

## Implements

viewmodel-layer

## Implements

mvvm-pattern

## Memberof

api-terms

## Since

1.0.0

Comprehensive action system including context providers, enhanced type-safe contexts,
utilities for business logic coordination, and various patterns for managing user 
interactions and business logic flow.

## Call Signature

> **createActionContext**&lt;`T`&gt;(`contextName`, `config?`): [`ActionContextReturn`](../interfaces/ActionContextReturn.md)&lt;`T`&gt;

Defined in: [packages/react/src/actions/ActionContext.tsx:156](https://github.com/mineclover/context-action/blob/08bf17d6ec1c09cfe0ffb9710189395df90c9772/packages/react/src/actions/ActionContext.tsx#L156)

Enhanced action context factory with automatic type inference

### Type Parameters

#### T

`T` *extends* `object`

Action payload map type for complete type safety

### Parameters

#### contextName

`string`

#### config?

[`ActionContextConfig`](../interfaces/ActionContextConfig.md)

Configuration options for the ActionRegister

### Returns

[`ActionContextReturn`](../interfaces/ActionContextReturn.md)&lt;`T`&gt;

Object containing Provider, hooks, and utility functions

### Example

```typescript
interface MyActions extends ActionPayloadMap {
  login: { username: string; password: string };
  logout: void;
}

const { 
  Provider, 
  useAction, 
  useActionHandler, 
  useActionWithResult 
} = createActionContext<MyActions>({
  name: 'AuthActions'
});

function AuthComponent() {
  const dispatch = useAction();
  const dispatchWithResult = useActionWithResult();
  
  useActionHandler('login', async ({ username, password }) => {
    // Handle login logic
    return { success: true, userId: '123' };
  });
  
  const handleLogin = async () => {
    const result = await dispatchWithResult('login', 
      { username: 'user', password: 'pass' }, 
      { result: { collect: true } }
    );
    console.log('Login result:', result.results);
  };
  
  return (
    <div>
      <button onClick={handleLogin}>
        Login with Result
      </button>
      <button onClick={() => dispatch('login', { username: 'user', password: 'pass' })}>
        Login (no result)
      </button>
    </div>
  );
}

// Alternative: Using useActionRegister for direct ActionRegister access
function AuthComponentAlt() {
  const dispatch = useAction();
  const register = useActionRegister();
  
  useEffect(() => {
    if (!register) return;
    
    // Clear existing handlers if needed
    register.clearAction('login');
    
    // Register handlers with full control
    const unregisterLogin = register.register('login', async ({ username, password }) => {
      // Handle login logic
    }, { priority: 100 });
    
    // Can also use dispatchWithResult directly from register
    const handleLoginWithResult = async () => {
      const result = await register.dispatchWithResult('login', 
        { username: 'user', password: 'pass' }
      );
      console.log('Login result:', result);
    };
    
    return () => {
      unregisterLogin();
    };
  }, [register]);
  
  return (
    <button onClick={() => dispatch('login', { username: 'user', password: 'pass' })}>
      Login
    </button>
  );
}

function App() {
  return (
    <Provider>
      <AuthComponent />
    </Provider>
  );
}
```

## Call Signature

> **createActionContext**&lt;`T`&gt;(`config`): [`ActionContextReturn`](../interfaces/ActionContextReturn.md)&lt;`T`&gt;

Defined in: [packages/react/src/actions/ActionContext.tsx:162](https://github.com/mineclover/context-action/blob/08bf17d6ec1c09cfe0ffb9710189395df90c9772/packages/react/src/actions/ActionContext.tsx#L162)

Enhanced action context factory with automatic type inference

### Type Parameters

#### T

`T` *extends* `object`

Action payload map type for complete type safety

### Parameters

#### config

[`ActionContextConfig`](../interfaces/ActionContextConfig.md)

Configuration options for the ActionRegister

### Returns

[`ActionContextReturn`](../interfaces/ActionContextReturn.md)&lt;`T`&gt;

Object containing Provider, hooks, and utility functions

### Example

```typescript
interface MyActions extends ActionPayloadMap {
  login: { username: string; password: string };
  logout: void;
}

const { 
  Provider, 
  useAction, 
  useActionHandler, 
  useActionWithResult 
} = createActionContext<MyActions>({
  name: 'AuthActions'
});

function AuthComponent() {
  const dispatch = useAction();
  const dispatchWithResult = useActionWithResult();
  
  useActionHandler('login', async ({ username, password }) => {
    // Handle login logic
    return { success: true, userId: '123' };
  });
  
  const handleLogin = async () => {
    const result = await dispatchWithResult('login', 
      { username: 'user', password: 'pass' }, 
      { result: { collect: true } }
    );
    console.log('Login result:', result.results);
  };
  
  return (
    <div>
      <button onClick={handleLogin}>
        Login with Result
      </button>
      <button onClick={() => dispatch('login', { username: 'user', password: 'pass' })}>
        Login (no result)
      </button>
    </div>
  );
}

// Alternative: Using useActionRegister for direct ActionRegister access
function AuthComponentAlt() {
  const dispatch = useAction();
  const register = useActionRegister();
  
  useEffect(() => {
    if (!register) return;
    
    // Clear existing handlers if needed
    register.clearAction('login');
    
    // Register handlers with full control
    const unregisterLogin = register.register('login', async ({ username, password }) => {
      // Handle login logic
    }, { priority: 100 });
    
    // Can also use dispatchWithResult directly from register
    const handleLoginWithResult = async () => {
      const result = await register.dispatchWithResult('login', 
        { username: 'user', password: 'pass' }
      );
      console.log('Login result:', result);
    };
    
    return () => {
      unregisterLogin();
    };
  }, [register]);
  
  return (
    <button onClick={() => dispatch('login', { username: 'user', password: 'pass' })}>
      Login
    </button>
  );
}

function App() {
  return (
    <Provider>
      <AuthComponent />
    </Provider>
  );
}
```
