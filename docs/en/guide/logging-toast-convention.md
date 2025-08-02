# Logging & Toast Integration Convention

## Overview

The Context-Action project uses a convention of **unified management of logging and toast notifications from a single entry point**. This allows real-time tracking and visualization of action execution states during development.

## Core Principles

### 1. Single Entry Point
All logging should be performed exclusively through the `useActionLoggerWithToast` hook.

```tsx
// ✅ Correct usage - Unified entry point
const { logAction, logSystem, logError } = useActionLoggerWithToast();

// ❌ Incorrect usage - Individual systems
const logger = useLogger();
const { showToast } = useActionToast();
```

### 2. Auto Synchronization
A single logging call simultaneously executes:
- 📊 **LogMonitor** records logs
- 🍞 **Toast** displays visual notifications

### 3. Global Application
All examples and demo components use the same approach.

## Basic Usage

### 1. Hook Usage in Components

```tsx
import { useActionLoggerWithToast } from '../../components/LogMonitor/';

export function YourComponent() {
  const { logAction, logSystem, logError } = useActionLoggerWithToast();
  
  const handleAction = () => {
    // Action execution logging (log + toast simultaneously)
    logAction('updateData', { userId: 123, data: newData });
  };
  
  const handleError = (error: Error) => {
    // Error logging (error log + error toast simultaneously)
    logError('Data update failed', error);
  };
  
  return (
    // Component JSX
  );
}
```

### 2. Page Level Setup

```tsx
import { PageWithLogMonitor } from '../../components/LogMonitor/';

// Automatically includes LogMonitor in page
export default function YourPage() {
  return (
    <PageWithLogMonitor pageId="your-page" title="Your Page">
      <YourComponent />
    </PageWithLogMonitor>
  );
}
```

### 3. App Level Setup

```tsx
// App.tsx - Global toast system setup
function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          {/* Routes */}
        </Routes>
      </Layout>
      
      {/* Global toast system */}
      <ToastContainer />
      <ToastControlPanel />
    </Router>
  );
}
```

## Logging Types Usage

### Action Logging
```tsx
// Use when executing actions
logAction('actionType', payload, options);
```

### System Logging
```tsx
// Use for system events or state changes
logSystem('Component initialized');
logSystem('Store updated', { context: { storeId: 'user' } });
```

### Error Logging
```tsx
// Use when errors occur
logError('Operation failed', error);
logError('Validation failed', new Error('Invalid input'));
```

## Visualization Components

### LogMonitor
- Real-time log display
- Log level control
- Log detail inspection

### ToastControlPanel
- Toast testing and configuration
- Toast position, duration adjustment
- Stress testing functionality

## Convention Compliance

### ✅ What to Do

1. **Always use `useActionLoggerWithToast`**
   ```tsx
   const { logAction, logSystem, logError } = useActionLoggerWithToast();
   ```

2. **Specify meaningful action types**
   ```tsx
   logAction('updateUserProfile', userData);
   logAction('addToCart', { productId, quantity });
   ```

3. **Include LogMonitor per page**
   ```tsx
   <PageWithLogMonitor pageId="unique-page-id">
   ```

### ❌ What Not to Do

1. **Don't use individual logging systems directly**
   ```tsx
   // ❌ Forbidden
   console.log('action executed');
   showToast('success', 'Done');
   ```

2. **Don't execute important actions without logging**
   ```tsx
   // ❌ Forbidden - Important action without logging
   const saveData = () => {
     api.save(data); // No logging
   };
   ```

3. **Don't duplicate page IDs**
   ```tsx
   // ❌ Forbidden - Reusing same pageId
   <PageWithLogMonitor pageId="demo"> // "demo" used in other pages too
   ```

### 🔄 Allowed Exception Cases

Specific cases where direct `console` usage is permitted:

1. **Development-only debugging tools**
   ```tsx
   // ✅ Allowed - Render counters and dev tools
   function useRenderCounter(name: string) {
     useEffect(() => {
       console.log(`🔄 ${name} rendered: ${count} times`);
     });
   }
   ```

2. **Example code strings**
   ```tsx
   // ✅ Allowed - Non-executable example code display
   const exampleCode = `
     console.log('Counter incremented');
     controller.next();
   `;
   ```

3. **Error handling systems**
   ```tsx
   // ✅ Allowed - ErrorBoundary and error handling
   componentDidCatch(error: Error, errorInfo: any) {
     console.error('ErrorBoundary caught an error:', error);
   }
   ```

4. **Educational logging**
   ```tsx
   // ✅ Allowed - Performance optimization education
   const expensiveData = useMemo(() => {
     console.log('🔄 Expensive calculation triggered');
     return computeHeavyData();
   }, [dependency]);
   ```

5. **Development convenience features**
   ```tsx
   // ✅ Allowed - Log clearing etc. (but use with logging convention)
   const resetAll = () => {
     console.clear();
     logAction('resetAll', data, { toast: true });
   };
   ```

## Benefits

### Development Efficiency
- 🎯 **Consistent debugging experience**: Same logging approach across all components
- 📊 **Real-time monitoring**: Immediate verification of action execution status
- 🔍 **Integrated tracking**: Complete action flow understanding through logs and toasts

### User Experience
- 🍞 **Immediate feedback**: Instant toast notifications on action execution
- 🎨 **Visual distinction**: Color coding by action type
- ⚙️ **Development tools**: Testing and configuration via ToastControlPanel

### Maintainability
- 🏗️ **Centralized management**: Logging logic managed in one place
- 🔧 **Easy configuration changes**: Global settings applied to all pages
- 📝 **Standardized logs**: Consistent log format for easy analysis

## Example Code

Refer to these files for complete implementation examples:

- `example/src/pages/core/CoreBasicsPage.tsx`
- `example/src/demos/store-scenarios/components/UserProfileDemo.tsx`
- `example/src/components/LogMonitor/hooks.tsx`
- `example/src/components/ToastSystem/useActionToast.ts`

## Conclusion

This convention enables **consistent and effective logging and visualization experience** across all Context-Action examples. Please follow this convention when creating new components or pages.