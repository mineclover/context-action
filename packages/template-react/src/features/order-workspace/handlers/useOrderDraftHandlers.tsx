import { useCallback } from 'react';
import { createDefaultOrderDraft, type OrderDraft } from '../business/orderDraft';
import {
  useOrderBusinessActionCommandHandler,
  useOrderStore,
} from '../contexts/OrderContexts';

export function useOrderDraftHandlers() {
  const draftStore = useOrderStore('draft');
  const activityStore = useOrderStore('activityLog');
  const validationStore = useOrderStore('validationIssues');

  useOrderBusinessActionCommandHandler(
    'updateDraft',
    useCallback(
      (updates: Partial<OrderDraft>) => {
        const current = draftStore.getValue();
        draftStore.setValue({ ...current, ...updates });
        validationStore.setValue([]);
      },
      [draftStore, validationStore]
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
