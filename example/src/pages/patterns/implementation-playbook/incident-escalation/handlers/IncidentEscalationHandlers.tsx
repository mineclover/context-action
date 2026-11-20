import React from 'react';
import {
  createIncidentActivityEvent,
  type IncidentActivityEventInput,
} from '../business/incidentBusiness';
import {
  IncidentEscalationActionProvider,
  IncidentEscalationLayoutActionProvider,
  IncidentEscalationLayoutStoreProvider,
  IncidentEscalationRefProvider,
  IncidentEscalationStoreProvider,
  useIncidentEscalationLayoutEffectHandler,
  useIncidentEscalationLayoutStore,
  useIncidentEscalationStoreManager,
} from '../contexts/IncidentEscalationContexts';
import { useIncidentDraftHandlers } from './useIncidentDraftHandlers';
import { useIncidentSubmissionHandlers } from './useIncidentSubmissionHandlers';

function IncidentEscalationHandlerRegistry({
  children,
}: {
  children: React.ReactNode;
}) {
  const storeManager = useIncidentEscalationStoreManager();
  const inspectorTabStore = useIncidentEscalationLayoutStore('inspectorTab');

  const appendActivity = React.useCallback(
    (event: IncidentActivityEventInput) => {
      const activityStore = storeManager.getStore('activity');
      activityStore.update((current) => [
        ...current.slice(-5),
        createIncidentActivityEvent(event),
      ]);
    },
    [storeManager]
  );

  // Separate LayoutActionIntent handler for Tier 3 UI tab state
  useIncidentEscalationLayoutEffectHandler(
    'setInspectorTab',
    React.useCallback(
      ({ tab }) => {
        inspectorTabStore.setValue(tab);
      },
      [inspectorTabStore]
    ),
    { effectKind: 'observer' }
  );

  useIncidentDraftHandlers({ appendActivity });
  useIncidentSubmissionHandlers({ appendActivity });

  return <>{children}</>;
}

export function IncidentEscalationProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <IncidentEscalationActionProvider>
      <IncidentEscalationLayoutActionProvider>
        <IncidentEscalationStoreProvider>
          <IncidentEscalationLayoutStoreProvider>
            <IncidentEscalationRefProvider>
              <IncidentEscalationHandlerRegistry>
                {children}
              </IncidentEscalationHandlerRegistry>
            </IncidentEscalationRefProvider>
          </IncidentEscalationLayoutStoreProvider>
        </IncidentEscalationStoreProvider>
      </IncidentEscalationLayoutActionProvider>
    </IncidentEscalationActionProvider>
  );
}
