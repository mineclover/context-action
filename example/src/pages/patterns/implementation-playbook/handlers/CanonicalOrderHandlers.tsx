import React from 'react';
import {
  createOrderActivityEvent,
  type OrderActivityEventInput,
} from '../business/orderBusiness';
import {
  CanonicalOrderActionProvider,
  CanonicalOrderLayoutActionProvider,
  CanonicalOrderLayoutStoreProvider,
  CanonicalOrderRefProvider,
  CanonicalOrderStoreProvider,
  useCanonicalOrderLayoutEffectHandler,
  useCanonicalOrderLayoutStore,
  useCanonicalOrderStoreManager,
} from '../contexts/CanonicalOrderContexts';
import { useCanonicalOrderDraftHandlers } from './useCanonicalOrderDraftHandlers';
import { useCanonicalOrderSubmissionHandlers } from './useCanonicalOrderSubmissionHandlers';

function CanonicalOrderHandlerRegistry({
  children,
}: {
  children: React.ReactNode;
}) {
  const storeManager = useCanonicalOrderStoreManager();
  const inspectorTabStore = useCanonicalOrderLayoutStore('inspectorTab');

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

  // Separate LayoutActionIntent handler for Tier 3 UI tab state
  useCanonicalOrderLayoutEffectHandler(
    'setInspectorTab',
    React.useCallback(
      ({ tab }) => {
        inspectorTabStore.setValue(tab);
      },
      [inspectorTabStore]
    ),
    { effectKind: 'observer' }
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
      <CanonicalOrderLayoutActionProvider>
        <CanonicalOrderStoreProvider>
          <CanonicalOrderLayoutStoreProvider>
            <CanonicalOrderRefProvider>
              <CanonicalOrderHandlerRegistry>
                {children}
              </CanonicalOrderHandlerRegistry>
            </CanonicalOrderRefProvider>
          </CanonicalOrderLayoutStoreProvider>
        </CanonicalOrderStoreProvider>
      </CanonicalOrderLayoutActionProvider>
    </CanonicalOrderActionProvider>
  );
}
