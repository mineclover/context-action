import React from 'react';
import { useActionLoggerWithToast } from '@/components/LogMonitor';
import {
  appendPriorityResult,
  createAsyncResult,
  divideCount,
  incrementCount,
  multiplyCount,
  updateAsyncResult,
} from '../business/core-advanced-rules';
import {
  CoreAdvancedActionProvider,
  CoreAdvancedStoreProvider,
  useCoreAdvancedActionHandler,
  useCoreAdvancedStoreManager,
} from '../contexts/CoreAdvancedContexts';

function createResultId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function CoreAdvancedHandlerRegistry({
  children,
}: {
  children: React.ReactNode;
}) {
  const storeManager = useCoreAdvancedStoreManager();
  const { logAction, logError, logSystem } = useActionLoggerWithToast();

  useCoreAdvancedActionHandler(
    'increment',
    React.useCallback(() => {
      storeManager.getStore('count').update(incrementCount);
      logAction('increment');
    }, [logAction, storeManager])
  );

  useCoreAdvancedActionHandler(
    'multiply',
    React.useCallback(
      (factor) => {
        storeManager
          .getStore('count')
          .update((count) => multiplyCount(count, factor));
        logAction('multiply', factor, { priority: 2 });
      },
      [logAction, storeManager]
    ),
    { id: 'core-advanced-multiply', priority: 2 }
  );

  useCoreAdvancedActionHandler(
    'divide',
    React.useCallback(
      (divisor, controller) => {
        if (divisor === 0) {
          logError('Cannot divide by zero', new Error('Division by zero'));
          controller.abort('Division by zero is not allowed');
          return;
        }
        storeManager
          .getStore('count')
          .update((count) => divideCount(count, divisor));
        logAction('divide', divisor);
      },
      [logAction, logError, storeManager]
    )
  );

  useCoreAdvancedActionHandler(
    'errorAction',
    React.useCallback(
      (_payload, controller) => {
        logAction('errorAction', undefined, { toast: false });
        const error = new Error('Intentional error for testing');
        logSystem('의도적인 에러 발생 테스트');
        logError('Action handler error', error);
        controller.abort('Handler error occurred - 핸들러에서 에러 발생');
      },
      [logAction, logError, logSystem]
    )
  );

  useCoreAdvancedActionHandler(
    'runPriorityTest',
    React.useCallback(() => {
      storeManager.getStore('priorityResults').setValue([]);
    }, [storeManager]),
    { id: 'core-advanced-priority-reset', priority: 4 }
  );

  useCoreAdvancedActionHandler(
    'runPriorityTest',
    React.useCallback(
      (message) => {
        storeManager
          .getStore('priorityResults')
          .update((results) => appendPriorityResult(results, 3, message));
        logAction('runPriorityTest', message, { priority: 3 });
      },
      [logAction, storeManager]
    ),
    { id: 'core-advanced-priority-high', priority: 3 }
  );

  useCoreAdvancedActionHandler(
    'runPriorityTest',
    React.useCallback(
      (message) => {
        storeManager
          .getStore('priorityResults')
          .update((results) => appendPriorityResult(results, 2, message));
        logAction('runPriorityTest', message, { priority: 2 });
      },
      [logAction, storeManager]
    ),
    { id: 'core-advanced-priority-mid', priority: 2 }
  );

  useCoreAdvancedActionHandler(
    'runPriorityTest',
    React.useCallback(
      (message) => {
        storeManager
          .getStore('priorityResults')
          .update((results) => appendPriorityResult(results, 1, message));
        logAction('runPriorityTest', message, { priority: 1 });
      },
      [logAction, storeManager]
    ),
    { id: 'core-advanced-priority-low', priority: 1 }
  );

  useCoreAdvancedActionHandler(
    'clearPriorityResults',
    React.useCallback(() => {
      storeManager.getStore('priorityResults').setValue([]);
    }, [storeManager])
  );

  useCoreAdvancedActionHandler(
    'runAsync',
    React.useCallback(
      async ({ delay, message }) => {
        const id = createResultId('single');
        const resultsStore = storeManager.getStore('asyncResults');
        resultsStore.update((results) => [
          ...results,
          createAsyncResult(
            id,
            message,
            'pending',
            new Date().toLocaleTimeString()
          ),
        ]);
        logAction('runAsync', { delay, message });

        try {
          await new Promise((resolve) => window.setTimeout(resolve, delay));
          resultsStore.update((results) =>
            updateAsyncResult(
              results,
              id,
              'completed',
              new Date().toLocaleTimeString()
            )
          );
          logSystem(`비동기 액션 완료: ${message}`);
        } catch (error) {
          resultsStore.update((results) =>
            updateAsyncResult(
              results,
              id,
              'error',
              new Date().toLocaleTimeString()
            )
          );
          logError('비동기 액션 에러', error);
        }
      },
      [logAction, logError, logSystem, storeManager]
    )
  );

  useCoreAdvancedActionHandler(
    'runMultipleAsync',
    React.useCallback(
      async (message) => {
        const resultsStore = storeManager.getStore('asyncResults');
        const tasks = [1000, 500, 1500].map(async (delay, index) => {
          const id = createResultId(`multi-${index}`);
          const taskMessage = `${message} - Task ${index + 1}`;
          resultsStore.update((results) => [
            ...results,
            createAsyncResult(
              id,
              taskMessage,
              'pending',
              new Date().toLocaleTimeString()
            ),
          ]);
          await new Promise((resolve) => window.setTimeout(resolve, delay));
          resultsStore.update((results) =>
            updateAsyncResult(
              results,
              id,
              'completed',
              new Date().toLocaleTimeString()
            )
          );
          return `Task ${index + 1} 완료`;
        });

        const completed = await Promise.all(tasks);
        logAction('runMultipleAsync', message);
        logSystem(`모든 비동기 작업 완료: ${completed.join(', ')}`);
      },
      [logAction, logSystem, storeManager]
    )
  );

  useCoreAdvancedActionHandler(
    'clearAsyncResults',
    React.useCallback(() => {
      storeManager.getStore('asyncResults').setValue([]);
    }, [storeManager])
  );

  return <>{children}</>;
}

export function CoreAdvancedProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CoreAdvancedActionProvider>
      <CoreAdvancedStoreProvider>
        <CoreAdvancedHandlerRegistry>{children}</CoreAdvancedHandlerRegistry>
      </CoreAdvancedStoreProvider>
    </CoreAdvancedActionProvider>
  );
}
