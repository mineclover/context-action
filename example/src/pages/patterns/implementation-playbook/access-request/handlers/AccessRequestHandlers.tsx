import React from 'react';
import {
  AccessRequestActionProvider,
  AccessRequestRefProvider,
  AccessRequestStoreProvider,
  useAccessRequestStoreManager,
} from '../contexts/AccessRequestContexts';
import {
  createAccessActivityEvent,
  type AccessActivityEventInput,
} from '../business/accessBusiness';
import { useAccessDraftHandlers } from './useAccessDraftHandlers';
import { useAccessSubmissionHandlers } from './useAccessSubmissionHandlers';

function AccessRequestHandlerRegistry({
  children,
}: {
  children: React.ReactNode;
}) {
  const storeManager = useAccessRequestStoreManager();

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
      <AccessRequestStoreProvider>
        <AccessRequestRefProvider>
          <AccessRequestHandlerRegistry>{children}</AccessRequestHandlerRegistry>
        </AccessRequestRefProvider>
      </AccessRequestStoreProvider>
    </AccessRequestActionProvider>
  );
}
