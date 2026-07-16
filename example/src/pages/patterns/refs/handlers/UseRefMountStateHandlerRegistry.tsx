import React, { useCallback } from 'react';
import {
  incrementRenderCount,
  resetRenderCounts,
  toggleTest,
} from '../business/use-ref-mount-state-rules';
import {
  useTestActionHandler,
  useTestStore,
} from '../contexts/UseRefMountStateContexts';

export function UseRefMountStateHandlerRegistry({
  children,
}: {
  children: React.ReactNode;
}) {
  const renderCountsStore = useTestStore('renderCounts');
  const activeTestsStore = useTestStore('activeTests');

  useTestActionHandler(
    'incrementRenderCount',
    useCallback(
      async (payload) => {
        renderCountsStore.setValue(
          incrementRenderCount(
            renderCountsStore.getValue(),
            payload.componentId
          )
        );
      },
      [renderCountsStore]
    )
  );

  useTestActionHandler(
    'toggleTest',
    useCallback(
      async (payload) => {
        activeTestsStore.setValue(
          toggleTest(activeTestsStore.getValue(), payload.testId)
        );
      },
      [activeTestsStore]
    )
  );

  useTestActionHandler(
    'resetRenderCounts',
    useCallback(async () => {
      renderCountsStore.setValue(resetRenderCounts());
    }, [renderCountsStore])
  );

  return <>{children}</>;
}
