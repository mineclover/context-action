import React, { useCallback, useEffect, useRef } from 'react';
import {
  appendPriorityResult,
  markAllExecuting,
  markPriorityCompleted,
  registerPriorityAction,
  registerPriorityStatus,
} from '../business/priority-demo-rules';
import {
  usePriorityDemoActionHandler,
  usePriorityDemoStore,
} from '../contexts/PriorityDemoContexts';

const EXECUTION_STEP_DELAY = 500;

export function PriorityDemoHandlerRegistry({
  children,
}: {
  children: React.ReactNode;
}) {
  const registeredActionsStore = usePriorityDemoStore('registeredActions');
  const executionResultStore = usePriorityDemoStore('executionResult');
  const isExecutingStore = usePriorityDemoStore('isExecuting');
  const executionStatusStore = usePriorityDemoStore('executionStatus');
  const executionRunRef = useRef(0);

  usePriorityDemoActionHandler(
    'registerWord',
    useCallback(
      async (payload) => {
        registeredActionsStore.setValue(
          registerPriorityAction(registeredActionsStore.getValue(), payload)
        );
        executionStatusStore.setValue(
          registerPriorityStatus(executionStatusStore.getValue(), payload)
        );
      },
      [executionStatusStore, registeredActionsStore]
    )
  );

  usePriorityDemoActionHandler(
    'executeRegistered',
    useCallback(async () => {
      if (isExecutingStore.getValue()) return;

      const actions = registeredActionsStore.getValue();
      if (actions.length === 0) return;

      const runId = ++executionRunRef.current;
      isExecutingStore.setValue(true);
      executionResultStore.setValue('');
      executionStatusStore.setValue(
        markAllExecuting(executionStatusStore.getValue())
      );

      try {
        let result = '';

        for (const action of actions) {
          await new Promise((resolve) =>
            setTimeout(resolve, EXECUTION_STEP_DELAY)
          );

          if (executionRunRef.current !== runId) return;

          result = appendPriorityResult(result, action.word);
          executionStatusStore.setValue(
            markPriorityCompleted(
              executionStatusStore.getValue(),
              action.priority
            )
          );
          executionResultStore.setValue(result);
        }
      } finally {
        if (executionRunRef.current === runId) {
          isExecutingStore.setValue(false);
        }
      }
    }, [
      executionResultStore,
      executionStatusStore,
      isExecutingStore,
      registeredActionsStore,
    ])
  );

  usePriorityDemoActionHandler(
    'clear',
    useCallback(async () => {
      executionRunRef.current += 1;
      registeredActionsStore.setValue([]);
      executionResultStore.setValue('');
      executionStatusStore.setValue([]);
      isExecutingStore.setValue(false);
    }, [
      executionResultStore,
      executionStatusStore,
      isExecutingStore,
      registeredActionsStore,
    ])
  );

  useEffect(() => {
    return () => {
      executionRunRef.current += 1;
    };
  }, []);

  return <>{children}</>;
}
