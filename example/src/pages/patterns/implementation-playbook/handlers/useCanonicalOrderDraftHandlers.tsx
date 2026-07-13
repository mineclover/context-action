import React from 'react';
import {
  createEmptyOrderDraft,
  createExampleOrderDraft,
  createOrderActivityEvent,
  type OrderActivityEventInput,
  type OrderDraftField,
  transitionOrderSubmissionState,
} from '../business/orderBusiness';
import {
  initialActivityState,
  initialSubmissionState,
  initialValidationState,
  useCanonicalOrderActionHandler,
  useCanonicalOrderRef,
  useCanonicalOrderStoreManager,
} from '../contexts/CanonicalOrderContexts';
import { removeResolvedFieldErrors } from './orderHandlerSupport';

interface DraftHandlerOptions {
  appendActivity: (event: OrderActivityEventInput) => void;
}

export function useCanonicalOrderDraftHandlers({
  appendActivity,
}: DraftHandlerOptions) {
  const storeManager = useCanonicalOrderStoreManager();
  const customerNameRef = useCanonicalOrderRef('customerNameInput');

  useCanonicalOrderActionHandler(
    'updateDraft',
    React.useCallback(
      async (payload) => {
        const draftStore = storeManager.getStore('draft');
        const validationStore = storeManager.getStore('validation');
        const submissionStore = storeManager.getStore('submission');
        const changedKeys = Object.keys(payload) as OrderDraftField[];

        draftStore.update((current) => ({
          ...current,
          ...payload,
        }));

        validationStore.update((current) => ({
          ...current,
          fieldErrors: removeResolvedFieldErrors(
            current.fieldErrors,
            changedKeys
          ),
          focusField:
            current.focusField !== null &&
            changedKeys.includes(current.focusField)
              ? null
              : current.focusField,
          summary: changedKeys.length
            ? '변경된 입력을 반영했습니다. 필요하면 다시 견적 생성을 눌러 주세요.'
            : '변경된 항목이 없습니다.',
        }));

        submissionStore.update((current) =>
          transitionOrderSubmissionState(current, { type: 'draft_changed' })
        );

        appendActivity({
          type: 'draft_updated',
          fields: changedKeys,
        });
      },
      [appendActivity, storeManager]
    )
  );

  useCanonicalOrderActionHandler(
    'prefillExample',
    React.useCallback(async () => {
      storeManager.getStore('draft').setValue(createExampleOrderDraft());
      storeManager.getStore('validation').setValue({
        ...initialValidationState,
        summary:
          '샘플 입력을 불러왔습니다. 바로 견적 흐름을 확인할 수 있습니다.',
      });
      storeManager.getStore('submission').setValue(
        transitionOrderSubmissionState(initialSubmissionState, {
          type: 'prefill_loaded',
        })
      );
      appendActivity({
        type: 'sample_loaded',
      });
    }, [appendActivity, storeManager])
  );

  useCanonicalOrderActionHandler(
    'resetDemo',
    React.useCallback(async () => {
      storeManager.getStore('draft').setValue(createEmptyOrderDraft());
      storeManager.getStore('validation').setValue(initialValidationState);
      storeManager.getStore('submission').setValue(
        transitionOrderSubmissionState(initialSubmissionState, {
          type: 'reset',
        })
      );
      storeManager
        .getStore('activity')
        .setValue([
          ...initialActivityState,
          createOrderActivityEvent({ type: 'demo_reset' }),
        ]);

      customerNameRef.executeIfMounted((target) => {
        target.focus();
      });
    }, [customerNameRef, storeManager])
  );
}
