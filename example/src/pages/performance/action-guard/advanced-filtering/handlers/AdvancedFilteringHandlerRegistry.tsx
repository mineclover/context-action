import type { DispatchOptions } from '@context-action/core';
import React, { useCallback } from 'react';
import {
  createInitialVisualizationState,
  type FilteringDispatchOptions,
  getExecutedHandlerIds,
  toFailedFilteringExecutionResult,
  toFilteringExecutionResult,
} from '../business/filtering-demo-rules';
import {
  AdvancedFilteringActionProvider,
  AdvancedFilteringStoreProvider,
  useAdvancedFilteringActionHandler,
  useAdvancedFilteringDispatchWithResult,
  useAdvancedFilteringStoreManager,
} from '../contexts/AdvancedFilteringContexts';

const wait = (duration: number) =>
  new Promise<void>((resolve) => window.setTimeout(resolve, duration));

function toProcessDataOptions(
  filterOptions?: FilteringDispatchOptions
): Pick<DispatchOptions, 'filter'> {
  const filter = filterOptions?.filter;
  if (!filter) return {};

  const { custom, ...filterFields } = filter;

  return {
    filter: {
      ...filterFields,
      ...(custom
        ? {
            custom: (config) =>
              custom({ id: config.id, blocking: config.blocking }),
          }
        : {}),
    },
  };
}

function AdvancedFilteringHandlerRegistry({
  children,
}: {
  children: React.ReactNode;
}) {
  const storeManager = useAdvancedFilteringStoreManager();
  const { dispatchWithResult } = useAdvancedFilteringDispatchWithResult();

  useAdvancedFilteringActionHandler(
    'processData',
    useCallback(async (payload) => {
      console.info('🔐 Security validation for:', payload.userId);
      await wait(50);
    }, []),
    { id: 'security-check', priority: 100, blocking: true }
  );

  useAdvancedFilteringActionHandler(
    'processData',
    useCallback(async (payload) => {
      console.info('📊 Analytics tracking for:', payload.userId);
      await wait(30);
    }, []),
    { id: 'analytics', priority: 80, blocking: false }
  );

  useAdvancedFilteringActionHandler(
    'processData',
    useCallback(async (payload) => {
      console.info('💾 Database save for:', payload.userId);
      await wait(80);
    }, []),
    { id: 'database-save', priority: 60, blocking: true }
  );

  useAdvancedFilteringActionHandler(
    'processData',
    useCallback(async (payload) => {
      console.info('🔔 Notification sent for:', payload.userId);
      await wait(40);
    }, []),
    { id: 'notification', priority: 40, blocking: false }
  );

  useAdvancedFilteringActionHandler(
    'processData',
    useCallback(async (payload) => {
      console.info('📝 Audit log for:', payload.userId);
      await wait(20);
    }, []),
    { id: 'audit-log', priority: 20, blocking: false }
  );

  useAdvancedFilteringActionHandler(
    'runDemo',
    useCallback(
      async ({ demoKey, filterOptions }) => {
        const resultsStore = storeManager.getStore('executionResults');
        const isLoadingStore = storeManager.getStore('isLoading');
        const visualizationStore = storeManager.getStore('visualization');

        resultsStore.setValue({ [demoKey]: null });
        isLoadingStore.setValue(true);
        visualizationStore.setValue(
          createInitialVisualizationState(demoKey, true)
        );

        try {
          const result = await dispatchWithResult(
            'processData',
            {
              userId: `user-${Date.now()}`,
              data: { demo: demoKey },
            },
            {
              result: { collect: true, strategy: 'all' },
              ...toProcessDataOptions(filterOptions),
            }
          );
          const executedHandlers = getExecutedHandlerIds(result.handlers);
          const duration = result.execution.duration;

          resultsStore.setValue({
            [demoKey]: toFilteringExecutionResult(result),
          });
          visualizationStore.setValue({
            executedHandlers,
            isRunning: false,
            totalExecuted: result.execution.handlersExecuted,
            totalDuration: duration,
            currentDemo: demoKey,
          });
        } catch (error) {
          resultsStore.setValue({
            [demoKey]: toFailedFilteringExecutionResult(error),
          });
          visualizationStore.setValue(createInitialVisualizationState(demoKey));
        } finally {
          isLoadingStore.setValue(false);
        }
      },
      [dispatchWithResult, storeManager]
    )
  );

  useAdvancedFilteringActionHandler(
    'clearResults',
    useCallback(() => {
      storeManager.getStore('executionResults').setValue({});
      storeManager.getStore('isLoading').setValue(false);
      storeManager
        .getStore('visualization')
        .setValue(createInitialVisualizationState());
    }, [storeManager])
  );

  return <>{children}</>;
}

export function AdvancedFilteringProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdvancedFilteringActionProvider>
      <AdvancedFilteringStoreProvider>
        <AdvancedFilteringHandlerRegistry>
          {children}
        </AdvancedFilteringHandlerRegistry>
      </AdvancedFilteringStoreProvider>
    </AdvancedFilteringActionProvider>
  );
}
