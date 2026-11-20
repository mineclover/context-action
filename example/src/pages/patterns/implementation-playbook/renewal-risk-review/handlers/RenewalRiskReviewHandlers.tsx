import React from 'react';
import {
  createRenewalActivityEvent,
  type RenewalActivityEventInput,
} from '../business/renewalBusiness';
import {
  RenewalRiskReviewActionProvider,
  RenewalRiskReviewLayoutActionProvider,
  RenewalRiskReviewLayoutStoreProvider,
  RenewalRiskReviewRefProvider,
  RenewalRiskReviewStoreProvider,
  useRenewalRiskReviewLayoutCommandHandler,
  useRenewalRiskReviewLayoutStore,
  useRenewalRiskReviewStoreManager,
} from '../contexts/RenewalRiskReviewContexts';
import { useRenewalDraftHandlers } from './useRenewalDraftHandlers';
import { useRenewalSubmissionHandlers } from './useRenewalSubmissionHandlers';

function RenewalRiskReviewHandlerRegistry({
  children,
}: {
  children: React.ReactNode;
}) {
  const storeManager = useRenewalRiskReviewStoreManager();
  const inspectorTabStore = useRenewalRiskReviewLayoutStore('inspectorTab');

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

  // Separate LayoutActionIntent handler for Tier 3 UI tab state
  useRenewalRiskReviewLayoutCommandHandler(
    'setInspectorTab',
    React.useCallback(
      ({ tab }) => {
        inspectorTabStore.setValue(tab);
      },
      [inspectorTabStore]
    )
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
      <RenewalRiskReviewLayoutActionProvider>
        <RenewalRiskReviewStoreProvider>
          <RenewalRiskReviewLayoutStoreProvider>
            <RenewalRiskReviewRefProvider>
              <RenewalRiskReviewHandlerRegistry>
                {children}
              </RenewalRiskReviewHandlerRegistry>
            </RenewalRiskReviewRefProvider>
          </RenewalRiskReviewLayoutStoreProvider>
        </RenewalRiskReviewStoreProvider>
      </RenewalRiskReviewLayoutActionProvider>
    </RenewalRiskReviewActionProvider>
  );
}
