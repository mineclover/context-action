# React Compiler Integration Guide

A comprehensive guide for integrating and utilizing React Compiler with the Context-Action Framework to achieve automatic memoization and performance optimization.

> **For architectural principles and philosophy, see [Context-Driven Architecture](context-driven-architecture.md)**

## 📋 Table of Contents

1. [Overview](#overview)
2. [React Compiler Setup](#react-compiler-setup)
3. ["use memo" Directive Usage](#use-memo-directive-usage)
4. [Real-World Example: Infinite Loop Prevention](#real-world-example-infinite-loop-prevention)
5. [Automatic Compilation Options](#automatic-compilation-options)
6. [Performance Optimization Patterns](#performance-optimization-patterns)
7. [Best Practices](#best-practices)
8. [Migration Guide](#migration-guide)
9. [Troubleshooting](#troubleshooting)

---

## Overview

React Compiler provides automatic memoization for React components and hooks, eliminating the need for manual `useCallback`, `useMemo`, and `React.memo` optimizations. When integrated with the Context-Action Framework, it provides significant performance benefits for action dispatching, state management, and component rendering.

### ✅ **Key Benefits**
- **Automatic Memoization** - No need for manual `useCallback` or `useMemo`
- **Reduced Bundle Size** - Eliminates manual optimization code
- **Better Performance** - Compile-time optimizations
- **Simplified Code** - Cleaner, more readable component code
- **Framework Integration** - Seamless integration with Context-Action patterns

### 🎯 **Integration Points**
- **Action Context Components** - Automatic memoization of action handlers
- **Store Components** - Optimized state subscription patterns
- **Hook Functions** - Automatic memoization of custom hooks
- **Event Handlers** - Optimized callback functions

---

## React Compiler Setup

### 1. Package Installation

```bash
# Install React Compiler dependencies
pnpm add react-compiler-runtime
pnpm add -D babel-plugin-react-compiler
```

### 2. Babel Configuration

Create or update `babel.config.js`:

```javascript
module.exports = {
  plugins: [
    ['babel-plugin-react-compiler', {
      // Compiler options
      target: '18', // or '19' for React 19
      compilationMode: 'annotation', // or 'infer'
    }],
  ],
};
```

### 3. Package Configuration

Update `package.json` for library packages:

```json
{
  "dependencies": {
    "react-compiler-runtime": "^0.0.0-experimental-592b524-20240529"
  },
  "peerDependencies": {
    "react": ">=17.0.0",
    "react-dom": ">=17.0.0"
  }
}
```

### 4. Build Tool Integration

#### For tsdown (Library Build)

```typescript
// tsdown.config.ts
import { defineConfig } from 'tsdown';

export default defineConfig({
  // ... other config
  plugins: [
    // Babel plugin for React Compiler
    {
      name: 'babel',
      transform: {
        include: ['**/*.{ts,tsx}'],
        transform: async (code, id) => {
          // Apply Babel with React Compiler plugin
          return babelTransform(code, {
            plugins: ['babel-plugin-react-compiler'],
          });
        },
      },
    },
  ],
  external: ['react-compiler-runtime'],
});
```

#### For Vite (Example/App Build)

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [
          ['babel-plugin-react-compiler', {
            target: '18',
            compilationMode: 'annotation',
          }],
        ],
      },
    }),
  ],
});
```

---

## "use memo" Directive Usage

The `"use memo"` directive is the primary way to control React Compiler's automatic memoization behavior.

### ✅ **Correct Usage**

#### Component-Level Memoization

```tsx
// ✅ Correct: At component top level
export function MyComponent({ data }: { data: any }) {
  "use memo";
  
  const [state, setState] = useState(0);
  const handleClick = () => setState(prev => prev + 1);
  
  return <button onClick={handleClick}>{state}</button>;
}
```

#### Hook-Level Memoization

```tsx
// ✅ Correct: In custom hooks
function useMyHook() {
  "use memo";
  
  const [value, setValue] = useState(0);
  const updateValue = (newValue: number) => setValue(newValue);
  
  return { value, updateValue };
}
```

### ❌ **Incorrect Usage**

```tsx
// ❌ Incorrect: Inside regular functions
export function MyComponent() {
  const handleClick = () => {
    "use memo"; // ❌ This will cause errors
    // ... function body
  };
  
  return <button onClick={handleClick}>Click</button>;
}

// ❌ Incorrect: Inside useEffect or other hooks
export function MyComponent() {
  useEffect(() => {
    "use memo"; // ❌ This will cause errors
    // ... effect body
  }, []);
}
```

### 🎯 **Context-Action Framework Patterns**

#### Action Context Components

```tsx
// ✅ Correct: Action context with automatic memoization
export function UserActionContext({ children }: { children: React.ReactNode }) {
  "use memo";
  
  const [users, setUsers] = useState<User[]>([]);
  
  const addUser = (user: User) => {
    setUsers(prev => [...prev, user]);
  };
  
  const updateUser = (id: string, updates: Partial<User>) => {
    setUsers(prev => prev.map(user => 
      user.id === id ? { ...user, ...updates } : user
    ));
  };
  
  return (
    <UserContext.Provider value={{ users, addUser, updateUser }}>
      {children}
    </UserContext.Provider>
  );
}
```

#### Store Components

```tsx
// ✅ Correct: Store component with automatic memoization
export function UserStore({ children }: { children: React.ReactNode }) {
  "use memo";
  
  const store = createStore<UserState>({
    users: [],
    loading: false,
    error: null,
  });
  
  const addUser = (user: User) => {
    store.updateValue(prev => ({
      ...prev,
      users: [...prev.users, user],
    }));
  };
  
  return (
    <StoreProvider store={store}>
      {children}
    </StoreProvider>
  );
}
```

---

## Real-World Example: Infinite Loop Prevention

### The Problem: Without React Compiler

The following example demonstrates a common infinite loop issue that occurs without proper memoization:

```tsx
// ❌ Problem: Infinite loop without memoization
export function MemoryLeakPreventionExample({ children }: { children: React.ReactNode }) {
  const refRegistry = useRefRegistry();
  const [logs, setLogs] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);

  // This function is recreated on every render, causing infinite loops
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 4)]);
  };

  useEffect(() => {
    if (!isActive) return;

    addLog('🔧 Setting up event listeners');

    const interval = setInterval(() => {
      const timerValue = refRegistry.timer.current?.getTime() || 0;
      if (timerValue > 0 && timerValue % 10 === 0) {
        addLog(`📊 Timer checkpoint: ${timerValue}s`);
      }
    }, 1000);

    return () => {
      addLog('🧹 Cleaning up event listeners');
      clearInterval(interval);
    };
  }, [refRegistry, addLog, isActive]); // ❌ addLog changes every render!

  // ... rest of component
}
```

**Result**: `Maximum update depth exceeded` error due to infinite re-renders.

### The Solution: With React Compiler

```tsx
// ✅ Solution: React Compiler automatic memoization
export function MemoryLeakPreventionExample({ children }: { children: React.ReactNode }) {
  "use memo";
  
  const refRegistry = useRefRegistry();
  const [logs, setLogs] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);

  // This function is automatically memoized by React Compiler
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 4)]);
  };

  useEffect(() => {
    if (!isActive) return;

    addLog('🔧 Setting up event listeners');

    const interval = setInterval(() => {
      const timerValue = refRegistry.timer.current?.getTime() || 0;
      if (timerValue > 0 && timerValue % 10 === 0) {
        addLog(`📊 Timer checkpoint: ${timerValue}s`);
      }
    }, 1000);

    return () => {
      addLog('🧹 Cleaning up event listeners');
      clearInterval(interval);
    };
  }, [refRegistry, addLog, isActive]); // ✅ addLog is now stable!

  // ... rest of component
}
```

**Result**: No infinite loops, optimal performance with automatic memoization.

### Manual Solution (Before React Compiler)

```tsx
// Manual solution with useCallback (more verbose)
export function MemoryLeakPreventionExample({ children }: { children: React.ReactNode }) {
  const refRegistry = useRefRegistry();
  const [logs, setLogs] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 4)]);
  }, []); // Manual dependency management

  useEffect(() => {
    if (!isActive) return;

    addLog('🔧 Setting up event listeners');

    const interval = setInterval(() => {
      const timerValue = refRegistry.timer.current?.getTime() || 0;
      if (timerValue > 0 && timerValue % 10 === 0) {
        addLog(`📊 Timer checkpoint: ${timerValue}s`);
      }
    }, 1000);

    return () => {
      addLog('🧹 Cleaning up event listeners');
      clearInterval(interval);
    };
  }, [refRegistry, addLog, isActive]);

  // ... rest of component
}
```

---

## Automatic Compilation Options

### Compilation Modes

React Compiler supports different compilation modes that affect how automatic memoization is applied:

#### 1. Annotation Mode (Recommended)

```javascript
// babel.config.js
module.exports = {
  plugins: [
    ['babel-plugin-react-compiler', {
      compilationMode: 'annotation', // Only compile components with "use memo"
      target: '18', // React version target
    }],
  ],
};
```

**Behavior**: Only components with `"use memo"` directive are compiled.

```tsx
// ✅ This component will be compiled
export function MyComponent() {
  "use memo";
  // ... component logic
}

// ❌ This component will NOT be compiled
export function AnotherComponent() {
  // ... component logic (no "use memo")
}
```

#### 2. Infer Mode (Automatic)

```javascript
// babel.config.js
module.exports = {
  plugins: [
    ['babel-plugin-react-compiler', {
      compilationMode: 'infer', // Automatically compile all components
      target: '18',
    }],
  ],
};
```

**Behavior**: All React components are automatically compiled without needing `"use memo"`.

```tsx
// ✅ This component will be automatically compiled
export function MyComponent() {
  // No "use memo" needed - automatic compilation
  const [state, setState] = useState(0);
  
  const handleClick = () => {
    setState(prev => prev + 1);
  };
  
  return <button onClick={handleClick}>{state}</button>;
}

// ✅ This component will also be automatically compiled
export function AnotherComponent() {
  // No "use memo" needed - automatic compilation
  const [data, setData] = useState([]);
  
  const processData = () => {
    return data.map(item => processItem(item));
  };
  
  return <div>{processData()}</div>;
}
```

### When to Use Each Mode

#### Use Annotation Mode When:
- You want explicit control over which components are optimized
- You're migrating existing codebase gradually
- You want to avoid potential compilation issues
- You prefer explicit optimization declarations

```tsx
// Gradual migration approach
export function OptimizedComponent() {
  "use memo"; // Explicitly opt-in to optimization
  // ... component logic
}

export function LegacyComponent() {
  // Not optimized yet - can be migrated later
  // ... component logic
}
```

#### Use Infer Mode When:
- You want automatic optimization for all components
- You're starting a new project
- You trust the compiler to make good decisions
- You want maximum convenience

```tsx
// All components automatically optimized
export function Component1() {
  // Automatically memoized
  // ... component logic
}

export function Component2() {
  // Automatically memoized
  // ... component logic
}
```

### Configuration Examples

#### Library Package Configuration

```typescript
// tsdown.config.ts - For library packages
import { defineConfig } from 'tsdown';

export default defineConfig({
  plugins: [
    {
      name: 'babel',
      transform: {
        include: ['**/*.{ts,tsx}'],
        transform: async (code, id) => {
          return babelTransform(code, {
            plugins: [
              ['babel-plugin-react-compiler', {
                compilationMode: 'annotation', // Explicit control for libraries
                target: '18',
              }],
            ],
          });
        },
      },
    },
  ],
  external: ['react-compiler-runtime'],
});
```

#### Application Configuration

```typescript
// vite.config.ts - For applications
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [
          ['babel-plugin-react-compiler', {
            compilationMode: 'infer', // Automatic for applications
            target: '18',
          }],
        ],
      },
    }),
  ],
});
```

### Performance Comparison

#### Without React Compiler

```tsx
// Manual optimization required
export function MyComponent({ data }: { data: any[] }) {
  const [filter, setFilter] = useState('');
  
  // Manual memoization
  const filteredData = useMemo(() => {
    return data.filter(item => item.name.includes(filter));
  }, [data, filter]);
  
  const handleClick = useCallback(() => {
    // ... handler logic
  }, []);
  
  return (
    <div>
      {filteredData.map(item => (
        <div key={item.id} onClick={handleClick}>
          {item.name}
        </div>
      ))}
    </div>
  );
}
```

#### With React Compiler (Annotation Mode)

```tsx
// Explicit optimization
export function MyComponent({ data }: { data: any[] }) {
  "use memo";
  
  const [filter, setFilter] = useState('');
  
  // Automatic memoization
  const filteredData = data.filter(item => item.name.includes(filter));
  
  const handleClick = () => {
    // ... handler logic
  };
  
  return (
    <div>
      {filteredData.map(item => (
        <div key={item.id} onClick={handleClick}>
          {item.name}
        </div>
      ))}
    </div>
  );
}
```

#### With React Compiler (Infer Mode)

```tsx
// Automatic optimization
export function MyComponent({ data }: { data: any[] }) {
  // No "use memo" needed - automatically optimized
  
  const [filter, setFilter] = useState('');
  
  // Automatic memoization
  const filteredData = data.filter(item => item.name.includes(filter));
  
  const handleClick = () => {
    // ... handler logic
  };
  
  return (
    <div>
      {filteredData.map(item => (
        <div key={item.id} onClick={handleClick}>
          {item.name}
        </div>
      ))}
    </div>
  );
}
```

---

## Performance Optimization Patterns

### 1. Action Handler Optimization

```tsx
// Before: Manual memoization
export function UserActions() {
  const addUser = useCallback((user: User) => {
    // ... handler logic
  }, []);
  
  const updateUser = useCallback((id: string, updates: Partial<User>) => {
    // ... handler logic
  }, []);
  
  return { addUser, updateUser };
}

// After: React Compiler automatic memoization
export function UserActions() {
  "use memo";
  
  const addUser = (user: User) => {
    // ... handler logic
  };
  
  const updateUser = (id: string, updates: Partial<User>) => {
    // ... handler logic
  };
  
  return { addUser, updateUser };
}
```

### 2. Event Handler Optimization

```tsx
// Before: Manual memoization
export function UserForm() {
  const [formData, setFormData] = useState<UserFormData>({});
  
  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);
  
  const handleSubmit = useCallback((e: FormEvent) => {
    e.preventDefault();
    // ... submit logic
  }, [formData]);
  
  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
    </form>
  );
}

// After: React Compiler automatic memoization
export function UserForm() {
  "use memo";
  
  const [formData, setFormData] = useState<UserFormData>({});
  
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // ... submit logic
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
    </form>
  );
}
```

### 3. Custom Hook Optimization

```tsx
// Before: Manual memoization
export function useUserActions() {
  const [users, setUsers] = useState<User[]>([]);
  
  const addUser = useCallback((user: User) => {
    setUsers(prev => [...prev, user]);
  }, []);
  
  const removeUser = useCallback((id: string) => {
    setUsers(prev => prev.filter(user => user.id !== id));
  }, []);
  
  return useMemo(() => ({
    users,
    addUser,
    removeUser,
  }), [users, addUser, removeUser]);
}

// After: React Compiler automatic memoization
export function useUserActions() {
  "use memo";
  
  const [users, setUsers] = useState<User[]>([]);
  
  const addUser = (user: User) => {
    setUsers(prev => [...prev, user]);
  };
  
  const removeUser = (id: string) => {
    setUsers(prev => prev.filter(user => user.id !== id));
  };
  
  return { users, addUser, removeUser };
}
```

---

## Best Practices

### 1. Component Structure

```tsx
// ✅ Recommended: Clear component structure
export function OptimizedComponent({ data, onUpdate }: Props) {
  "use memo";
  
  // 1. State declarations
  const [localState, setLocalState] = useState(initialValue);
  
  // 2. Computed values (automatically memoized)
  const processedData = data.map(item => processItem(item));
  
  // 3. Event handlers (automatically memoized)
  const handleClick = () => {
    onUpdate(processedData);
  };
  
  // 4. Effects
  useEffect(() => {
    // ... effect logic
  }, [data]);
  
  // 5. Render
  return <div onClick={handleClick}>{/* JSX */}</div>;
}
```

### 2. Hook Organization

```tsx
// ✅ Recommended: Hook with clear separation
export function useOptimizedUserManagement() {
  "use memo";
  
  // State
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Actions (automatically memoized)
  const addUser = (user: User) => {
    setUsers(prev => [...prev, user]);
  };
  
  const updateUser = (id: string, updates: Partial<User>) => {
    setUsers(prev => prev.map(user => 
      user.id === id ? { ...user, ...updates } : user
    ));
  };
  
  const removeUser = (id: string) => {
    setUsers(prev => prev.filter(user => user.id !== id));
  };
  
  // Computed values (automatically memoized)
  const userCount = users.length;
  const activeUsers = users.filter(user => user.active);
  
  return {
    users,
    loading,
    userCount,
    activeUsers,
    addUser,
    updateUser,
    removeUser,
  };
}
```

### 3. Context Provider Optimization

```tsx
// ✅ Recommended: Optimized context provider
export function OptimizedUserProvider({ children }: { children: React.ReactNode }) {
  "use memo";
  
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Actions (automatically memoized)
  const actions = {
    addUser: (user: User) => {
      setUsers(prev => [...prev, user]);
    },
    updateUser: (id: string, updates: Partial<User>) => {
      setUsers(prev => prev.map(user => 
        user.id === id ? { ...user, ...updates } : user
      ));
    },
    setCurrentUser: (user: User | null) => {
      setCurrentUser(user);
    },
  };
  
  // Computed values (automatically memoized)
  const contextValue = {
    users,
    currentUser,
    userCount: users.length,
    ...actions,
  };
  
  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
}
```

---

## Migration Guide

### Step 1: Remove Manual Memoization

```tsx
// Before: Manual memoization
export function MyComponent({ data }: Props) {
  const [state, setState] = useState(0);
  
  const handleClick = useCallback(() => {
    setState(prev => prev + 1);
  }, []);
  
  const processedData = useMemo(() => {
    return data.map(item => processItem(item));
  }, [data]);
  
  return <div onClick={handleClick}>{processedData}</div>;
}

// After: React Compiler automatic memoization
export function MyComponent({ data }: Props) {
  "use memo";
  
  const [state, setState] = useState(0);
  
  const handleClick = () => {
    setState(prev => prev + 1);
  };
  
  const processedData = data.map(item => processItem(item));
  
  return <div onClick={handleClick}>{processedData}</div>;
}
```

### Step 2: Update Import Statements

```tsx
// Before: Import useCallback and useMemo
import React, { useState, useCallback, useMemo } from 'react';

// After: Remove unnecessary imports
import React, { useState } from 'react';
```

### Step 3: Add "use memo" Directives

```tsx
// Add "use memo" to components and hooks
export function MyComponent() {
  "use memo";
  // ... component logic
}

export function useMyHook() {
  "use memo";
  // ... hook logic
}
```

### Step 4: Test Performance

```tsx
// Use React DevTools Profiler to verify optimizations
// Check that components are not re-rendering unnecessarily
// Verify that functions are properly memoized
```

---

## Troubleshooting

### Common Issues

#### 1. "Invalid hook call" Error

```tsx
// ❌ Problem: "use memo" inside regular function
export function MyComponent() {
  const handleClick = () => {
    "use memo"; // ❌ This causes the error
    // ... function body
  };
  
  return <button onClick={handleClick}>Click</button>;
}

// ✅ Solution: Move "use memo" to component level
export function MyComponent() {
  "use memo";
  
  const handleClick = () => {
    // ... function body
  };
  
  return <button onClick={handleClick}>Click</button>;
}
```

#### 2. Compiler Not Working

```bash
# Check Babel configuration
# Ensure babel-plugin-react-compiler is installed
# Verify build tool integration
```

#### 3. Performance Issues

```tsx
// If automatic memoization isn't working as expected:
// 1. Check "use memo" placement
// 2. Verify Babel plugin configuration
// 3. Use React DevTools Profiler to identify issues
```

### Debugging Tips

1. **Use React DevTools Profiler** to verify memoization is working
2. **Check console for React Compiler warnings**
3. **Verify Babel plugin is processing files correctly**
4. **Test with and without "use memo" to compare performance**

---

## Integration with Context-Action Framework

### Action Context with React Compiler

```tsx
// Optimized Action Context
export function createOptimizedActionContext<T extends {}>() {
  "use memo";
  
  const Context = createContext<ActionContextType<T> | null>(null);
  
  function Provider({ children, initialActions }: ProviderProps<T>) {
    "use memo";
    
    const [actions, setActions] = useState<T>(initialActions);
    const [executionState, setExecutionState] = useState<ExecutionState>('idle');
    
    const dispatch = (actionName: keyof T, payload?: any) => {
      setExecutionState('executing');
      // ... dispatch logic
      setExecutionState('completed');
    };
    
    const contextValue = {
      actions,
      dispatch,
      executionState,
    };
    
    return (
      <Context.Provider value={contextValue}>
        {children}
      </Context.Provider>
    );
  }
  
  function useActionContext() {
    "use memo";
    
    const context = useContext(Context);
    if (!context) {
      throw new Error('useActionContext must be used within ActionProvider');
    }
    return context;
  }
  
  return { Provider, useActionContext };
}
```

### Store Context with React Compiler

```tsx
// Optimized Store Context
export function createOptimizedStoreContext<T>(initialValue: T) {
  "use memo";
  
  const store = createStore<T>(initialValue);
  const Context = createContext<Store<T> | null>(null);
  
  function Provider({ children }: { children: React.ReactNode }) {
    "use memo";
    
    return (
      <Context.Provider value={store}>
        {children}
      </Context.Provider>
    );
  }
  
  function useStore() {
    "use memo";
    
    const store = useContext(Context);
    if (!store) {
      throw new Error('useStore must be used within StoreProvider');
    }
    return store;
  }
  
  function useStoreValue() {
    "use memo";
    
    const store = useStore();
    const [value, setValue] = useState<T>(store.getValue());
    
    useEffect(() => {
      const unsubscribe = store.subscribe(setValue);
      return unsubscribe;
    }, [store]);
    
    return value;
  }
  
  return { Provider, useStore, useStoreValue };
}
```

---

## Conclusion

React Compiler integration with the Context-Action Framework provides significant performance benefits through automatic memoization. By following the patterns and best practices outlined in this guide, you can achieve optimal performance while maintaining clean, readable code.

### Key Takeaways

1. **Use `"use memo"` at component and hook top levels only**
2. **Remove manual `useCallback` and `useMemo` optimizations**
3. **Let React Compiler handle memoization automatically**
4. **Test performance with React DevTools Profiler**
5. **Follow Context-Action Framework patterns for optimal integration**

For more information about the Context-Action Framework architecture, see [Context-Driven Architecture](context-driven-architecture.md).
