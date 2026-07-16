import { useStoreValue } from '@context-action/react';
import { buildAccessReviewPacket } from '../business/accessBusiness';
import {
  useAccessRequestRef,
  useAccessRequestStore,
} from '../contexts/AccessRequestContexts';
import {
  isReviewBusy,
  toActivityEntry,
  toReviewViewState,
} from '../handlers/accessHandlerSupport';

export function useAccessRequestData() {
  const draftStore = useAccessRequestStore('draft');
  const validationStore = useAccessRequestStore('validation');
  const reviewStore = useAccessRequestStore('review');
  const activityStore = useAccessRequestStore('activity');

  const draft = useStoreValue(draftStore);
  const validation = useStoreValue(validationStore);
  const review = useStoreValue(reviewStore);
  const activity = useStoreValue(activityStore);
  const livePacket = buildAccessReviewPacket(draft);
  const reviewView = toReviewViewState(review);
  const activityEntries = activity.map(toActivityEntry);

  return {
    draft,
    validation,
    review,
    reviewView,
    livePacket,
    activity: activityEntries,
    isBusy: isReviewBusy(review),
    hasErrors: Object.keys(validation.fieldErrors).length > 0,
  };
}

export function useAccessRequestRefs() {
  return {
    requesterNameRef: useAccessRequestRef('requesterNameInput'),
    emailRef: useAccessRequestRef('emailInput'),
    scopeRef: useAccessRequestRef('scopeSelect'),
    justificationRef: useAccessRequestRef('justificationInput'),
    statusPanelRef: useAccessRequestRef('statusPanel'),
  };
}
