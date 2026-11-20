import { useStoreValue } from '@context-action/react';
import { buildOrderQuote } from '../business/orderBusiness';
import {
  useCanonicalOrderLayoutStore,
  useCanonicalOrderRef,
  useCanonicalOrderStore,
} from '../contexts/CanonicalOrderContexts';
import {
  isSubmissionBusy,
  toActivityEntry,
  toSubmissionViewState,
} from '../handlers/orderHandlerSupport';

export function useCanonicalOrderData() {
  const draftStore = useCanonicalOrderStore('draft');
  const validationStore = useCanonicalOrderStore('validation');
  const submissionStore = useCanonicalOrderStore('submission');
  const activityStore = useCanonicalOrderStore('activity');
  const inspectorTabStore = useCanonicalOrderLayoutStore('inspectorTab');

  const draft = useStoreValue(draftStore);
  const validation = useStoreValue(validationStore);
  const submission = useStoreValue(submissionStore);
  const activity = useStoreValue(activityStore);
  const inspectorTab = useStoreValue(inspectorTabStore);
  const liveQuote = buildOrderQuote(draft);
  const submissionView = toSubmissionViewState(submission);
  const activityEntries = activity.map(toActivityEntry).slice().reverse();

  return {
    draft,
    validation,
    submission,
    submissionView,
    liveQuote,
    activity: activityEntries,
    inspectorTab,
    isBusy: isSubmissionBusy(submission),
    hasErrors: Object.keys(validation.fieldErrors).length > 0,
    latestActivity: activityEntries[0] ?? null,
  };
}

export function useCanonicalOrderRefs() {
  return {
    customerNameRef: useCanonicalOrderRef('customerNameInput'),
    emailRef: useCanonicalOrderRef('emailInput'),
    quantityRef: useCanonicalOrderRef('quantityInput'),
    statusPanelRef: useCanonicalOrderRef('statusPanel'),
  };
}
