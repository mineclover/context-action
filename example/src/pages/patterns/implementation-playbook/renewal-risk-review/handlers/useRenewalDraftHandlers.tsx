import React from 'react';
import {
  createEmptyRenewalReviewDraft,
  createExampleRenewalReviewDraft,
  createRenewalActivityEvent,
  transitionRenewalReviewState,
  type RenewalActivityEventInput,
  type RenewalDraftField,
} from '../business/renewalBusiness';
import {
  initialRenewalActivityState,
  initialRenewalReviewState,
  initialRenewalValidationState,
  useRenewalRiskReviewActionHandler,
  useRenewalRiskReviewRef,
  useRenewalRiskReviewStoreManager,
} from '../contexts/RenewalRiskReviewContexts';
import { removeResolvedFieldErrors } from './renewalHandlerSupport';

interface DraftHandlerOptions {
  appendActivity: (event: RenewalActivityEventInput) => void;
}

export function useRenewalDraftHandlers({
  appendActivity,
}: DraftHandlerOptions) {
  const storeManager = useRenewalRiskReviewStoreManager();
  const accountNameRef = useRenewalRiskReviewRef('accountNameInput');

  useRenewalRiskReviewActionHandler(
    'updateDraft',
    React.useCallback(
      async (payload) => {
        const draftStore = storeManager.getStore('draft');
        const validationStore = storeManager.getStore('validation');
        const reviewStore = storeManager.getStore('review');
        const changedKeys = Object.keys(payload) as RenewalDraftField[];

        draftStore.update((current) => ({
          ...current,
          ...payload,
        }));

        validationStore.update((current) => ({
          ...current,
          fieldErrors: removeResolvedFieldErrors(current.fieldErrors, changedKeys),
          focusField:
            current.focusField !== null && changedKeys.includes(current.focusField)
              ? null
              : current.focusField,
          summary: changedKeys.length
            ? '변경된 입력을 반영했습니다. 필요하면 다시 renewal review packet 생성을 눌러 주세요.'
            : '변경된 항목이 없습니다.',
        }));

        reviewStore.update((current) =>
          transitionRenewalReviewState(current, { type: 'draft_changed' })
        );

        appendActivity({
          type: 'draft_updated',
          fields: changedKeys,
        });
      },
      [appendActivity, storeManager]
    )
  );

  useRenewalRiskReviewActionHandler(
    'prefillExample',
    React.useCallback(async () => {
      storeManager.getStore('draft').setValue(createExampleRenewalReviewDraft());
      storeManager.getStore('validation').setValue({
        ...initialRenewalValidationState,
        summary:
          '샘플 renewal review를 불러왔습니다. 바로 review packet 흐름을 확인할 수 있습니다.',
      });
      storeManager.getStore('review').setValue(
        transitionRenewalReviewState(initialRenewalReviewState, {
          type: 'prefill_loaded',
        })
      );
      appendActivity({ type: 'sample_loaded' });
    }, [appendActivity, storeManager])
  );

  useRenewalRiskReviewActionHandler(
    'resetDemo',
    React.useCallback(async () => {
      storeManager.getStore('draft').setValue(createEmptyRenewalReviewDraft());
      storeManager.getStore('validation').setValue(initialRenewalValidationState);
      storeManager.getStore('review').setValue(
        transitionRenewalReviewState(initialRenewalReviewState, {
          type: 'reset',
        })
      );
      storeManager.getStore('activity').setValue([
        ...initialRenewalActivityState,
        createRenewalActivityEvent({ type: 'demo_reset' }),
      ]);

      accountNameRef.executeIfMounted((target) => {
        target.focus();
      });
    }, [accountNameRef, storeManager])
  );
}
