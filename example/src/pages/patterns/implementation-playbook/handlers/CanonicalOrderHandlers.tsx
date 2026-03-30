import React from 'react';
import {
  CanonicalOrderActionProvider,
  CanonicalOrderRefProvider,
  CanonicalOrderStoreProvider,
  useCanonicalOrderStoreManager,
} from '../contexts/CanonicalOrderContexts';
import {
  createOrderActivityEvent,
  type OrderActivityEventInput,
} from '../business/orderBusiness';
import { useCanonicalOrderDraftHandlers } from './useCanonicalOrderDraftHandlers';
import { useCanonicalOrderSubmissionHandlers } from './useCanonicalOrderSubmissionHandlers';

function CanonicalOrderHandlerRegistry({
  children,
}: {
  children: React.ReactNode;
}) {
  const storeManager = useCanonicalOrderStoreManager();

  const appendActivity = React.useCallback(
    (event: OrderActivityEventInput) => {
      const activityStore = storeManager.getStore('activity');
      activityStore.update((current) => [
        ...current.slice(-5),
        createOrderActivityEvent(event),
      ]);
    },
    [storeManager]
  );

  useCanonicalOrderDraftHandlers({ appendActivity });
  useCanonicalOrderSubmissionHandlers({ appendActivity });

  return <>{children}</>;
}

export function CanonicalOrderProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CanonicalOrderActionProvider>
      <CanonicalOrderStoreProvider>
        <CanonicalOrderRefProvider>
          <CanonicalOrderHandlerRegistry>{children}</CanonicalOrderHandlerRegistry>
        </CanonicalOrderRefProvider>
      </CanonicalOrderStoreProvider>
    </CanonicalOrderActionProvider>
  );
}
