import React from 'react';
import {
  type AccessActivityEventInput,
  type AccessRequestField,
  createAccessActivityEvent,
  createEmptyAccessRequestDraft,
  createExampleAccessRequestDraft,
  transitionAccessReviewState,
} from '../business/accessBusiness';
import {
  initialAccessActivityState,
  initialAccessReviewState,
  initialAccessValidationState,
  useAccessRequestActionHandler,
  useAccessRequestRef,
  useAccessRequestStoreManager,
} from '../contexts/AccessRequestContexts';
import { removeResolvedFieldErrors } from './accessHandlerSupport';

interface DraftHandlerOptions {
  appendActivity: (event: AccessActivityEventInput) => void;
}

export function useAccessDraftHandlers({
  appendActivity,
}: DraftHandlerOptions) {
  const storeManager = useAccessRequestStoreManager();
  const requesterNameRef = useAccessRequestRef('requesterNameInput');

  useAccessRequestActionHandler(
    'updateDraft',
    React.useCallback(
      async (payload) => {
        const draftStore = storeManager.getStore('draft');
        const validationStore = storeManager.getStore('validation');
        const reviewStore = storeManager.getStore('review');
        const changedKeys = Object.keys(payload) as AccessRequestField[];

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
            ? '변경된 입력을 반영했습니다. 필요하면 다시 리뷰 패키지 생성을 눌러 주세요.'
            : '변경된 항목이 없습니다.',
        }));

        reviewStore.update((current) =>
          transitionAccessReviewState(current, { type: 'draft_changed' })
        );

        appendActivity({
          type: 'draft_updated',
          fields: changedKeys,
        });
      },
      [appendActivity, storeManager]
    )
  );

  useAccessRequestActionHandler(
    'prefillExample',
    React.useCallback(async () => {
      storeManager
        .getStore('draft')
        .setValue(createExampleAccessRequestDraft());
      storeManager.getStore('validation').setValue({
        ...initialAccessValidationState,
        summary:
          '샘플 요청을 불러왔습니다. 바로 리뷰 패키지 흐름을 확인할 수 있습니다.',
      });
      storeManager.getStore('review').setValue(
        transitionAccessReviewState(initialAccessReviewState, {
          type: 'prefill_loaded',
        })
      );
      appendActivity({ type: 'sample_loaded' });
    }, [appendActivity, storeManager])
  );

  useAccessRequestActionHandler(
    'resetDemo',
    React.useCallback(async () => {
      storeManager.getStore('draft').setValue(createEmptyAccessRequestDraft());
      storeManager
        .getStore('validation')
        .setValue(initialAccessValidationState);
      storeManager.getStore('review').setValue(
        transitionAccessReviewState(initialAccessReviewState, {
          type: 'reset',
        })
      );
      storeManager
        .getStore('activity')
        .setValue([
          ...initialAccessActivityState,
          createAccessActivityEvent({ type: 'demo_reset' }),
        ]);

      requesterNameRef.executeIfMounted((target) => {
        target.focus();
      });
    }, [requesterNameRef, storeManager])
  );
}
