import React from 'react';
import { useActionLoggerWithToast } from '@/components/LogMonitor';
import {
  createRandomLogMessage,
  markAsyncFinished,
  markAsyncStarted,
  updateCount,
} from '../business/core-basics-rules';
import {
  CoreActionProvider,
  CoreStoreProvider,
  useCoreActionEffectHandler,
  useCoreActionGuard,
  useCoreActionHandler,
  useCoreActionObserver,
  useCoreStoreManager,
} from '../contexts/CoreBasicsContexts';

function CoreBasicsHandlerRegistry({
  children,
}: {
  children: React.ReactNode;
}) {
  const storeManager = useCoreStoreManager();
  const { logAction } = useActionLoggerWithToast();

  useCoreActionGuard(
    'setCount',
    React.useCallback((value, controller) => {
      if (!Number.isFinite(value)) {
        controller.abort('Count must be a finite number');
      }
    }, []),
    { id: 'core-basics-set-count-guard', priority: 100 }
  );

  useCoreActionEffectHandler(
    'increment',
    React.useCallback(() => {
      storeManager
        .getStore('count')
        .update((current) => updateCount(current, 1));
      logAction('increment', undefined);
    }, [logAction, storeManager]),
    { effectKind: 'observer' }
  );

  useCoreActionEffectHandler(
    'decrement',
    React.useCallback(() => {
      storeManager
        .getStore('count')
        .update((current) => updateCount(current, -1));
      logAction('decrement', undefined);
    }, [logAction, storeManager]),
    { effectKind: 'observer' }
  );

  useCoreActionEffectHandler(
    'setCount',
    React.useCallback(
      (value) => {
        storeManager.getStore('count').setValue(value);
        logAction('setCount', value);
      },
      [logAction, storeManager]
    ),
    { effectKind: 'observer' }
  );

  useCoreActionObserver(
    'setCount',
    React.useCallback(
      (event) => {
        if (event.outcome === 'cancelled') {
          logAction('setCount', 'Rejected non-finite count value');
        }
      },
      [logAction]
    ),
    { id: 'core-basics-set-count-observer', when: 'always', priority: 10 }
  );

  useCoreActionEffectHandler(
    'reset',
    React.useCallback(() => {
      storeManager.getStore('count').setValue(0);
      logAction('reset', undefined);
    }, [logAction, storeManager]),
    { effectKind: 'observer' }
  );

  useCoreActionEffectHandler(
    'generateLog',
    React.useCallback(() => {
      logAction('generateLog', createRandomLogMessage());
    }, [logAction]),
    { effectKind: 'observer' }
  );

  useCoreActionHandler(
    'asyncOperation',
    React.useCallback(
      async (_, controller) => {
        const statusStore = storeManager.getStore('asyncStatus');
        let aborted = false;
        statusStore.update(markAsyncStarted);
        logAction('asyncOperation', '🔄 Async operation started... (3초 소요)');

        try {
          await new Promise<void>((resolve, reject) => {
            const timeoutId = setTimeout(resolve, 3000);
            const originalAbort = controller.abort;
            controller.abort = (reason) => {
              aborted = true;
              clearTimeout(timeoutId);
              originalAbort.call(controller, reason);
              reject(new Error('Operation aborted by user'));
            };
          });

          if (!aborted) {
            logAction(
              'asyncOperation',
              '✅ Async operation completed successfully'
            );
          }
        } catch (error) {
          if (aborted) {
            logAction('asyncOperation', '❌ Async operation was aborted');
          } else {
            logAction(
              'asyncOperation',
              `❌ Async operation failed: ${(error as Error).message}`
            );
          }
          throw error;
        } finally {
          statusStore.update(markAsyncFinished);
        }
      },
      [logAction, storeManager]
    )
  );

  return <>{children}</>;
}

export function CoreBasicsProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CoreActionProvider>
      <CoreStoreProvider>
        <CoreBasicsHandlerRegistry>{children}</CoreBasicsHandlerRegistry>
      </CoreStoreProvider>
    </CoreActionProvider>
  );
}
