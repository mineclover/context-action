import { useStoreValue } from '@context-action/react';
import { useOrderStore } from '../contexts/OrderContexts';

export function useOrderData() {
  const draftStore = useOrderStore('draft');
  const validationStore = useOrderStore('validationIssues');
  const submissionStore = useOrderStore('submission');
  const activityStore = useOrderStore('activityLog');

  const draft = useStoreValue(draftStore);
  const validationIssues = useStoreValue(validationStore);
  const submission = useStoreValue(submissionStore);
  const activityLog = useStoreValue(activityStore);

  const isSubmitting = submission.phase === 'validating' || submission.phase === 'submitting';
  const isSuccess = submission.phase === 'success';
  const hasErrors = validationIssues.length > 0;

  return {
    draft,
    validationIssues,
    submission,
    activityLog,
    isSubmitting,
    isSuccess,
    hasErrors,
  };
}
