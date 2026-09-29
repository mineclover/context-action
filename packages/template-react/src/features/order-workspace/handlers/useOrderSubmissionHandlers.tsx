import { useCallback } from 'react';
import { useOrderActionHandler, useOrderStore } from '../contexts/OrderContexts';
import { validateOrderDraft } from '../business/orderValidation';
import { transitionOrderState } from '../business/orderStateMachine';

export function useOrderSubmissionHandlers() {
  const draftStore = useOrderStore('draft');
  const validationStore = useOrderStore('validationIssues');
  const submissionStore = useOrderStore('submission');
  const activityStore = useOrderStore('activityLog');

  useOrderActionHandler(
    'submitOrder',
    useCallback(async () => {
      const draft = draftStore.getValue();

      // 1. 상태 머신 전이: validating
      let state = transitionOrderState(submissionStore.getValue(), { type: 'submit_requested' });
      submissionStore.setValue(state);

      // 2. 순수 검증 함수 호출
      const validation = validateOrderDraft(draft);
      if (!validation.isValid) {
        validationStore.setValue(validation.issues);
        state = transitionOrderState(state, {
          type: 'validation_failed',
          message: validation.issues.map((i) => i.message).join(' / '),
        });
        submissionStore.setValue(state);

        const logs = activityStore.getValue();
        activityStore.setValue([...logs, `[검증 실패] ${validation.issues.length}건의 입력 오류가 발견되었습니다.`]);
        return;
      }

      // 3. 상태 머신 전이: submitting
      state = transitionOrderState(state, { type: 'validation_passed' });
      submissionStore.setValue(state);

      const logs = activityStore.getValue();
      activityStore.setValue([...logs, `[서버 전송] 주문 요청을 처리 중입니다... (수량: ${draft.quantity})`]);

      // 4. 모의 서버 비동기 지연 (600ms)
      await new Promise((resolve) => setTimeout(resolve, 600));

      // 5. 성공 처리
      const generatedOrderId = `ORD-${Date.now().toString(36).toUpperCase()}`;
      state = transitionOrderState(state, {
        type: 'server_succeeded',
        orderId: generatedOrderId,
      });
      submissionStore.setValue(state);

      const latestLogs = activityStore.getValue();
      activityStore.setValue([...latestLogs, `[주문 성공] 주문이 체결되었습니다! (주문번호: ${generatedOrderId})`]);
    }, [draftStore, validationStore, submissionStore, activityStore])
  );

  useOrderActionHandler(
    'retrySubmission',
    useCallback(() => {
      const state = transitionOrderState(submissionStore.getValue(), { type: 'reset' });
      submissionStore.setValue(state);
      validationStore.setValue([]);
    }, [submissionStore, validationStore])
  );
}
