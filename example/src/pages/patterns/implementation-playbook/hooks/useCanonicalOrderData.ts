import { useStoreValue } from '@context-action/react';
import {
  useCanonicalOrderRef,
  useCanonicalOrderStore,
} from '../contexts/CanonicalOrderContexts';

export function useCanonicalOrderData() {
  const draftStore = useCanonicalOrderStore('draft');
  const validationStore = useCanonicalOrderStore('validation');
  const submissionStore = useCanonicalOrderStore('submission');
  const activityStore = useCanonicalOrderStore('activity');

  const draft = useStoreValue(draftStore);
  const validation = useStoreValue(validationStore);
  const submission = useStoreValue(submissionStore);
  const activity = useStoreValue(activityStore);

  return {
    draft,
    validation,
    submission,
    activity,
    isBusy:
      submission.status === 'validating' || submission.status === 'submitting',
    hasErrors: Object.keys(validation.fieldErrors).length > 0,
    latestActivity: activity[activity.length - 1] ?? null,
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
