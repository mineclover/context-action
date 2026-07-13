import React from 'react';
import {
  createIncidentActivityEvent,
  type IncidentActivityEventInput,
} from '../business/incidentBusiness';
import {
  IncidentEscalationActionProvider,
  IncidentEscalationRefProvider,
  IncidentEscalationStoreProvider,
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
      <IncidentEscalationStoreProvider>
        <IncidentEscalationRefProvider>
          <IncidentEscalationHandlerRegistry>
            {children}
          </IncidentEscalationHandlerRegistry>
        </IncidentEscalationRefProvider>
      </IncidentEscalationStoreProvider>
    </IncidentEscalationActionProvider>
  );
}
