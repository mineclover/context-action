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
  useCoreActionHandler,
  useCoreStoreManager,
} from '../contexts/CoreBasicsContexts';

function CoreBasicsHandlerRegistry({
  children,
}: {
  children: React.ReactNode;
}) {
  const storeManager = useCoreStoreManager();
  const { logAction } = useActionLoggerWithToast();

  useCoreActionHandler(
    'increment',
    React.useCallback(() => {
      storeManager
        .getStore('count')
        .update((current) => updateCount(current, 1));
      logAction('increment', undefined);
    }, [logAction, storeManager])
  );

  useCoreActionHandler(
    'decrement',
    React.useCallback(() => {
      storeManager
        .getStore('count')
        .update((current) => updateCount(current, -1));
      logAction('decrement', undefined);
    }, [logAction, storeManager])
  );

  useCoreActionHandler(
    'setCount',
    React.useCallback(
      (value) => {
        storeManager.getStore('count').setValue(value);
        logAction('setCount', value);
      },
      [logAction, storeManager]
    )
  );

  useCoreActionHandler(
    'reset',
    React.useCallback(() => {
      storeManager.getStore('count').setValue(0);
      logAction('reset', undefined);
    }, [logAction, storeManager])
  );

  useCoreActionHandler(
    'generateLog',
    React.useCallback(() => {
      logAction('generateLog', createRandomLogMessage());
    }, [logAction])
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
