import React from 'react';
import type {
  RenewalReviewDraft,
  RenewalWindow,
} from '../business/renewalBusiness';
import {
  type RenewalRiskReviewInspectorTab,
  useRenewalRiskReviewDispatch,
  useRenewalRiskReviewLayoutDispatch,
} from '../contexts/RenewalRiskReviewContexts';

type DraftStringField = 'accountName' | 'riskNotes';

export function useRenewalRiskReviewActions() {
  const dispatch = useRenewalRiskReviewDispatch();
  const layoutDispatch = useRenewalRiskReviewLayoutDispatch();

  const updateTextField = React.useCallback(
    (field: DraftStringField, value: string) => {
      return dispatch('updateDraft', {
        [field]: value,
      } as Partial<RenewalReviewDraft>);
    },
    [dispatch]
  );

  const updateRenewalWindow = React.useCallback(
    (renewalWindow: RenewalWindow) =>
      dispatch('updateDraft', { renewalWindow }),
    [dispatch]
  );

  const updateUsageScore = React.useCallback(
    (usageScore: number) => dispatch('updateDraft', { usageScore }),
    [dispatch]
  );

  const setExecutiveSponsor = React.useCallback(
    (executiveSponsor: boolean) =>
      dispatch('updateDraft', { executiveSponsor }),
    [dispatch]
  );

  const submitReview = React.useCallback(
    () => dispatch('submitReview'),
    [dispatch]
  );

  const prefillExample = React.useCallback(
    () => dispatch('prefillExample'),
    [dispatch]
  );

  const resetDemo = React.useCallback(() => dispatch('resetDemo'), [dispatch]);

  const setInspectorTab = React.useCallback(
    (tab: RenewalRiskReviewInspectorTab) =>
      layoutDispatch('setInspectorTab', { tab }),
    [layoutDispatch]
  );

  return {
    updateTextField,
    updateRenewalWindow,
    updateUsageScore,
    setExecutiveSponsor,
    submitReview,
    prefillExample,
    resetDemo,
    setInspectorTab,
  };
}
