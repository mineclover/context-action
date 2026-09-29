import { useCallback } from 'react';
import { useOrderActionHandler, useOrderStore } from '../contexts/OrderContexts';
import type { OrderDraft } from '../business/orderDraft';
import { createDefaultOrderDraft } from '../business/orderDraft';

export function useOrderDraftHandlers() {
  const draftStore = useOrderStore('draft');
  const activityStore = useOrderStore('activityLog');
  const validationStore = useOrderStore('validationIssues');

  useOrderActionHandler(
    'updateDraft',
    useCallback(
      (updates: Partial<OrderDraft>) => {
        const current = draftStore.getValue();
        const updated = { ...current, ...updates };
        draftStore.setValue(updated);
        validationStore.setValue([]); // 입력 변경 시 에러 초기화
      },
      [draftStore, validationStore]
    )
  );

  useOrderActionHandler(
    'resetDraft',
    useCallback(() => {
      draftStore.setValue(createDefaultOrderDraft());
      validationStore.setValue([]);
      const logs = activityStore.getValue();
      activityStore.setValue([...logs, '[입력] 주문서가 기본값으로 초기화되었습니다.']);
    }, [draftStore, validationStore, activityStore])
  );
}
