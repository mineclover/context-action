import React from 'react';
import {
  type AccessActivityEventInput,
  createAccessActivityEvent,
} from '../business/accessBusiness';
import {
  AccessRequestActionProvider,
  AccessRequestLayoutActionProvider,
  AccessRequestLayoutStoreProvider,
  AccessRequestRefProvider,
  AccessRequestStoreProvider,
  useAccessRequestLayoutEffectHandler,
  useAccessRequestLayoutStore,
  useAccessRequestStoreManager,
} from '../contexts/AccessRequestContexts';
import { useAccessDraftHandlers } from './useAccessDraftHandlers';
import { useAccessSubmissionHandlers } from './useAccessSubmissionHandlers';

function AccessRequestHandlerRegistry({
  children,
}: {
  children: React.ReactNode;
}) {
  const storeManager = useAccessRequestStoreManager();
  const inspectorTabStore = useAccessRequestLayoutStore('inspectorTab');

  const appendActivity = React.useCallback(
    (event: AccessActivityEventInput) => {
      const activityStore = storeManager.getStore('activity');
      activityStore.update((current) => [
        ...current.slice(-5),
        createAccessActivityEvent(event),
      ]);
    },
    [storeManager]
  );

  // Separate LayoutActionIntent handler for Tier 3 UI tab state
  useAccessRequestLayoutEffectHandler(
    'setInspectorTab',
    React.useCallback(
      ({ tab }) => {
        inspectorTabStore.setValue(tab);
      },
      [inspectorTabStore]
    ),
    { effectKind: 'observer' }
  );

  useAccessDraftHandlers({ appendActivity });
  useAccessSubmissionHandlers({ appendActivity });

  return <>{children}</>;
}

export function AccessRequestProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AccessRequestActionProvider>
      <AccessRequestLayoutActionProvider>
        <AccessRequestStoreProvider>
          <AccessRequestLayoutStoreProvider>
            <AccessRequestRefProvider>
              <AccessRequestHandlerRegistry>
                {children}
              </AccessRequestHandlerRegistry>
            </AccessRequestRefProvider>
          </AccessRequestLayoutStoreProvider>
        </AccessRequestStoreProvider>
      </AccessRequestLayoutActionProvider>
    </AccessRequestActionProvider>
  );
}
