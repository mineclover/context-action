# Advanced Filtering System

Powerful handler filtering capabilities for precise action execution control in `ActionRegister`.

## 🎯 Overview

`DispatchOptions['filter']` lets you run only a targeted subset of registered handlers per dispatch by **priority range**, **handler ID inclusion/exclusion**, or a **custom predicate** receiving `Readonly<ResolvedHandlerConfig>`.

> [!IMPORTANT] Admission Guard Invariant
> Handlers registered with `register.registerGuard(...)` are **admission controls** and are **never bypassed** by `options.filter`. Filtering applies only to non-guard handlers (commands, result handlers, and observers).

## 🔧 Filter Types

### Priority Range Filtering

Filter handlers by `priority` range (`min` / `max` inclusive) to control execution scope:

<!-- @context-action-compile -->
```typescript
import { ActionRegister, type ActionPayloadMap } from '@context-action/core';

interface ProcessActions extends ActionPayloadMap {
  processData: { payload: string };
}

const register = new ActionRegister<ProcessActions>();

async function runFilteredDispatches(data: { payload: string }) {
  // Execute only high-priority handlers (50-100)
  await register.dispatch('processData', data, {
    filter: {
      priority: { min: 50, max: 100 }
    }
  });

  // Execute only handlers with priority >= 20
  await register.dispatch('processData', data, {
    filter: {
      priority: { min: 20 }
    }
  });

  // Execute only low-priority background handlers (<= 10)
  await register.dispatch('processData', data, {
    filter: {
      priority: { max: 10 }
    }
  });
}
```

### Handler ID Filtering

Target or exclude handlers by their resolved `id`:

<!-- @context-action-compile -->
```typescript
import { ActionRegister, type ActionPayloadMap } from '@context-action/core';

interface WorkflowActions extends ActionPayloadMap {
  securityCheck: { userId: string };
  processPayment: { amount: number };
  dataProcessing: { batchId: string };
}

const register = new ActionRegister<WorkflowActions>();

async function runByHandlerId() {
  // Execute only specific handlers
  await register.dispatch('securityCheck', { userId: 'u-1' }, {
    filter: {
      handlerIds: ['validation', 'authorization', 'logging']
    }
  });

  // Execute all non-guard handlers except analytics/debug hooks
  await register.dispatch('processPayment', { amount: 42 }, {
    filter: {
      excludeHandlerIds: ['analytics', 'debugging']
    }
  });

  // Combine inclusion and exclusion (exclusion wins when both match)
  await register.dispatch('dataProcessing', { batchId: 'b-9' }, {
    filter: {
      handlerIds: ['core-processing', 'validation', 'optional-analytics'],
      excludeHandlerIds: ['optional-analytics']
    }
  });
}
```

### Custom Logic Filtering

Pass a predicate receiving `Readonly<ResolvedHandlerConfig>` (a frozen snapshot where `config.id`, `config.priority`, and `config.blocking` are already resolved):

<!-- @context-action-compile -->
```typescript
import {
  ActionRegister,
  type ActionPayloadMap,
  type ResolvedHandlerConfig
} from '@context-action/core';

interface OperationActions extends ActionPayloadMap {
  criticalOperation: { taskId: string; role: 'admin' | 'user' };
}

const register = new ActionRegister<OperationActions>();

async function runCustomFilters(payload: OperationActions['criticalOperation']) {
  // Execute only blocking handlers
  await register.dispatch('criticalOperation', payload, {
    filter: {
      custom: (config: Readonly<ResolvedHandlerConfig>) => config.blocking === true
    }
  });

  // Role-based priority threshold
  await register.dispatch('criticalOperation', payload, {
    filter: {
      custom: (config: Readonly<ResolvedHandlerConfig>) => {
        return payload.role === 'admin'
          ? config.priority >= 50
          : config.priority <= 30;
      }
    }
  });
}
```

### Admission Guards Cannot Be Filtered Out

`registerGuard()` handlers always execute before filtered handlers, even when a dispatch specifies `handlerIds` that omit the guard's ID:

<!-- @context-action-compile -->
```typescript
import { ActionRegister, type ActionPayloadMap } from '@context-action/core';

interface OrderActions extends ActionPayloadMap {
  submitOrder: { total: number };
}

const register = new ActionRegister<OrderActions>();

register.registerGuard(
  'submitOrder',
  (payload, controller) => {
    if (payload.total <= 0) {
      controller.abort('Order total must be positive');
    }
  },
  { id: 'positive-total-guard', priority: 100 }
);

register.register('submitOrder', () => {
  // Runs only after admission guards succeed
}, { id: 'persist-order', priority: 10 });

async function dispatchProtected() {
  // 'positive-total-guard' still runs even though handlerIds only names 'persist-order'
  await register.dispatch('submitOrder', { total: 0 }, {
    filter: { handlerIds: ['persist-order'] }
  });
}
```

## 🏗️ Combined Filtering

Combine `priority`, `handlerIds` / `excludeHandlerIds`, and `custom` filters in a single dispatch. A handler runs only when **all** configured filter checks pass:

<!-- @context-action-compile -->
```typescript
import { ActionRegister, type ActionPayloadMap } from '@context-action/core';

interface PipelineActions extends ActionPayloadMap {
  complexWorkflow: { documentId: string };
}

const register = new ActionRegister<PipelineActions>();

async function runCombinedFilter(documentId: string) {
  await register.dispatch('complexWorkflow', { documentId }, {
    filter: {
      priority: { min: 10, max: 50 },
      excludeHandlerIds: ['debug-handler', 'test-handler'],
      custom: (config) => config.blocking === true && !config.id.includes('optional')
    }
  });
}
```

## 🚀 Performance & Reuse Patterns

### Efficient Filter Patterns

- Prefer `priority` ranges and `handlerIds` / `excludeHandlerIds` (`Set` lookups inside `ActionRegister`) over heavy string parsing in `custom`.
- Reuse pure filter predicates and `Set` exclusions across dispatches rather than allocating new regular expressions on hot paths.

<!-- @context-action-compile -->
```typescript
import {
  ActionRegister,
  type ActionPayloadMap,
  type DispatchOptions,
  type ResolvedHandlerConfig
} from '@context-action/core';

interface TaskActions extends ActionPayloadMap {
  operation: { id: string };
}

const register = new ActionRegister<TaskActions>();

const excludedIds = new Set(['analytics', 'debug']);
const productionFilter = (config: Readonly<ResolvedHandlerConfig>) =>
  !config.id.includes('dev') && !excludedIds.has(config.id);

const criticalFilter: NonNullable<DispatchOptions['filter']> = {
  priority: { min: 80 },
  custom: productionFilter
};

async function executeCriticalTasks() {
  await register.dispatch('operation', { id: 'op-1' }, { filter: criticalFilter });
  await register.dispatch('operation', { id: 'op-2' }, { filter: criticalFilter });
}
```

## 🎯 Common Use Cases

### Composable Role & Environment Filter Factory

<!-- @context-action-compile -->
```typescript
import {
  ActionRegister,
  type ActionPayloadMap,
  type DispatchOptions,
  type ResolvedHandlerConfig
} from '@context-action/core';

interface AppActions extends ActionPayloadMap {
  accessResource: { resourceId: string };
}

const register = new ActionRegister<AppActions>();

function createFilter(options: {
  environment?: 'dev' | 'staging' | 'prod';
  userRole?: 'admin' | 'user' | 'guest';
  priority?: { min?: number; max?: number };
}): NonNullable<DispatchOptions['filter']> {
  return {
    priority: options.priority,
    custom: (config: Readonly<ResolvedHandlerConfig>) => {
      if (options.environment === 'prod' && config.id.includes('dev')) {
        return false;
      }

      if (options.userRole === 'guest' && config.priority > 20) {
        return false;
      }

      return true;
    }
  };
}

async function accessAsGuest(resourceId: string) {
  const filter = createFilter({
    environment: 'prod',
    userRole: 'guest',
    priority: { min: 0, max: 50 }
  });

  await register.dispatch('accessResource', { resourceId }, { filter });
}
```

## 🚨 Error Handling & Diagnostics

### Zero-Match Dispatches vs Custom Filter Errors

Matching **zero** non-guard handlers does **not** throw an error—the dispatch resolves cleanly with `result.execution.handlersExecuted === 0`. Only user code inside `filter.custom` that throws rejects synchronously while building the dispatch plan.

Use `dispatchWithResult` and `getHandlerCount` when you need to inspect or fall back on empty filter matches:

<!-- @context-action-compile -->
```typescript
import { ActionRegister, type ActionPayloadMap } from '@context-action/core';

interface DiagnosticActions extends ActionPayloadMap {
  syncItem: { id: string };
}

const register = new ActionRegister<DiagnosticActions>();

async function safeFilteredDispatch(id: string) {
  // Does NOT throw when no handlers match; executes 0 non-guard handlers
  const result = await register.dispatchWithResult(
    'syncItem',
    { id },
    {
      filter: {
        handlerIds: ['nonexistent-handler']
      },
      result: { collect: true }
    }
  );

  const registeredCount = register.getHandlerCount('syncItem');
  const executedCount = result.execution.handlersExecuted;

  if (executedCount === 0 && registeredCount > 0) {
    // Filter excluded all registered handlers — apply fallback if needed
    return {
      executedCount,
      registeredCount,
      durationMs: result.execution.duration,
      fallbackRequired: true
    };
  }

  return {
    executedCount,
    registeredCount,
    durationMs: result.execution.duration,
    fallbackRequired: false
  };
}
```

## ⚠️ Important Considerations

- **Guard Preservation**: `registerGuard()` admission handlers still run even when excluded by `handlerIds` or priority bounds; keep authorization/validation logic in guards.
- **No Exception on Empty Match**: Always inspect `result.execution.handlersExecuted` with `dispatchWithResult` when an empty filter match requires a fallback or warning.
- **Readonly Config Snapshot**: `custom` receives `Object.freeze({ ...config })` (`Readonly<ResolvedHandlerConfig>`), so attempts to mutate handler config inside a filter fail safely.
- **Interactive Demo**: Explore priority and handler filtering live in the example app at `/performance/action-guard/advanced-filtering`.
