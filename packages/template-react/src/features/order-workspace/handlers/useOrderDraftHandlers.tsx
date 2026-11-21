import { useCallback } from 'react';
import { createDefaultOrderDraft, type OrderDraft } from '../business/orderDraft';
import { transitionOrderState } from '../business/orderStateMachine';
import {
  useOrderBusinessActionCommandHandler,
  useOrderStore,
} from '../contexts/OrderContexts';

export function useOrderDraftHandlers() {
  const draftStore = useOrderStore('draft');
  const activityStore = useOrderStore('activityLog');
  const validationStore = useOrderStore('validationIssues');
  const submissionStore = useOrderStore('submission');

  useOrderBusinessActionCommandHandler(
    'updateDraft',
    useCallback(
      (updates: Partial<OrderDraft>) => {
        const current = draftStore.getValue();
        draftStore.setValue({ ...current, ...updates });
        validationStore.setValue([]);
        const currentSubmission = submissionStore.getValue();
        if (
          currentSubmission.phase === 'success' ||
          currentSubmission.phase === 'failed'
        ) {
          submissionStore.setValue(
            transitionOrderState(currentSubmission, { type: 'draft_edited' })
          );
        }
      },
      [draftStore, submissionStore, validationStore]
    ),
    { id: 'order-update-draft-command' }
  );

  useOrderBusinessActionCommandHandler(
    'resetDraft',
    useCallback(() => {
      draftStore.setValue(createDefaultOrderDraft());
      validationStore.setValue([]);
      const logs = activityStore.getValue();
      activityStore.setValue([...logs, { type: 'draft_reset' }]);
    }, [activityStore, draftStore, validationStore]),
    { id: 'order-reset-draft-command' }
  );
}
