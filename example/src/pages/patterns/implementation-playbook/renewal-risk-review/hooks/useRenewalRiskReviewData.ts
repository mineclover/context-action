import { useStoreValue } from '@context-action/react';
import {
  useRenewalRiskReviewRef,
  useRenewalRiskReviewStore,
} from '../contexts/RenewalRiskReviewContexts';
import {
  isReviewBusy,
  toActivityEntry,
  toReviewViewState,
} from '../handlers/renewalHandlerSupport';

export function useRenewalRiskReviewData() {
  const draftStore = useRenewalRiskReviewStore('draft');
  const validationStore = useRenewalRiskReviewStore('validation');
  const reviewStore = useRenewalRiskReviewStore('review');
  const activityStore = useRenewalRiskReviewStore('activity');

  const draft = useStoreValue(draftStore);
  const validation = useStoreValue(validationStore);
  const review = useStoreValue(reviewStore);
  const activity = useStoreValue(activityStore);
  const reviewView = toReviewViewState(review);
  const activityEntries = activity.map(toActivityEntry);

  return {
    draft,
    validation,
    review,
    reviewView,
    activity: activityEntries,
    isBusy: isReviewBusy(review),
    hasErrors: Object.keys(validation.fieldErrors).length > 0,
  };
}

export function useRenewalRiskReviewRefs() {
  return {
    accountNameRef: useRenewalRiskReviewRef('accountNameInput'),
    renewalWindowRef: useRenewalRiskReviewRef('renewalWindowSelect'),
    usageScoreRef: useRenewalRiskReviewRef('usageScoreInput'),
    riskNotesRef: useRenewalRiskReviewRef('riskNotesInput'),
    statusPanelRef: useRenewalRiskReviewRef('statusPanel'),
  };
}
