import React from 'react';
import {
  RenewalRiskReviewActionProvider,
  RenewalRiskReviewRefProvider,
  RenewalRiskReviewStoreProvider,
  useRenewalRiskReviewStoreManager,
} from '../contexts/RenewalRiskReviewContexts';
import {
  createRenewalActivityEvent,
  type RenewalActivityEventInput,
} from '../business/renewalBusiness';
import { useRenewalDraftHandlers } from './useRenewalDraftHandlers';
import { useRenewalSubmissionHandlers } from './useRenewalSubmissionHandlers';

function RenewalRiskReviewHandlerRegistry({
  children,
}: {
  children: React.ReactNode;
}) {
  const storeManager = useRenewalRiskReviewStoreManager();

  const appendActivity = React.useCallback(
    (event: RenewalActivityEventInput) => {
      const activityStore = storeManager.getStore('activity');
      activityStore.update((current) => [
        ...current.slice(-5),
        createRenewalActivityEvent(event),
      ]);
    },
    [storeManager]
  );

  useRenewalDraftHandlers({ appendActivity });
  useRenewalSubmissionHandlers({ appendActivity });

  return <>{children}</>;
}

export function RenewalRiskReviewProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RenewalRiskReviewActionProvider>
      <RenewalRiskReviewStoreProvider>
        <RenewalRiskReviewRefProvider>
          <RenewalRiskReviewHandlerRegistry>
            {children}
          </RenewalRiskReviewHandlerRegistry>
        </RenewalRiskReviewRefProvider>
      </RenewalRiskReviewStoreProvider>
    </RenewalRiskReviewActionProvider>
  );
}
