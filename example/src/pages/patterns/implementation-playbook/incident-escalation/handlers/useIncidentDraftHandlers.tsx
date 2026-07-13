import React from 'react';
import {
  createEmptyIncidentDraft,
  createExampleIncidentDraft,
  createIncidentActivityEvent,
  type IncidentActivityEventInput,
  type IncidentDraftField,
  transitionIncidentEscalationState,
} from '../business/incidentBusiness';
import {
  initialIncidentActivityState,
  initialIncidentEscalationState,
  initialIncidentValidationState,
  useIncidentEscalationActionHandler,
  useIncidentEscalationRef,
  useIncidentEscalationStoreManager,
} from '../contexts/IncidentEscalationContexts';
import { removeResolvedFieldErrors } from './incidentHandlerSupport';

interface DraftHandlerOptions {
  appendActivity: (event: IncidentActivityEventInput) => void;
}

export function useIncidentDraftHandlers({
  appendActivity,
}: DraftHandlerOptions) {
  const storeManager = useIncidentEscalationStoreManager();
  const incidentTitleRef = useIncidentEscalationRef('incidentTitleInput');

  useIncidentEscalationActionHandler(
    'updateDraft',
    React.useCallback(
      async (payload) => {
        const draftStore = storeManager.getStore('draft');
        const validationStore = storeManager.getStore('validation');
        const escalationStore = storeManager.getStore('escalation');
        const changedKeys = Object.keys(payload) as IncidentDraftField[];

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
            ? '변경된 입력을 반영했습니다. 필요하면 다시 escalation packet 생성을 눌러 주세요.'
            : '변경된 항목이 없습니다.',
        }));

        escalationStore.update((current) =>
          transitionIncidentEscalationState(current, {
            type: 'draft_changed',
          })
        );

        appendActivity({
          type: 'draft_updated',
          fields: changedKeys,
        });
      },
      [appendActivity, storeManager]
    )
  );

  useIncidentEscalationActionHandler(
    'prefillExample',
    React.useCallback(async () => {
      storeManager.getStore('draft').setValue(createExampleIncidentDraft());
      storeManager.getStore('validation').setValue({
        ...initialIncidentValidationState,
        summary:
          '샘플 incident를 불러왔습니다. 바로 escalation packet 흐름을 확인할 수 있습니다.',
      });
      storeManager.getStore('escalation').setValue(
        transitionIncidentEscalationState(initialIncidentEscalationState, {
          type: 'prefill_loaded',
        })
      );
      appendActivity({ type: 'sample_loaded' });
    }, [appendActivity, storeManager])
  );

  useIncidentEscalationActionHandler(
    'resetDemo',
    React.useCallback(async () => {
      storeManager.getStore('draft').setValue(createEmptyIncidentDraft());
      storeManager
        .getStore('validation')
        .setValue(initialIncidentValidationState);
      storeManager.getStore('escalation').setValue(
        transitionIncidentEscalationState(initialIncidentEscalationState, {
          type: 'reset',
        })
      );
      storeManager
        .getStore('activity')
        .setValue([
          ...initialIncidentActivityState,
          createIncidentActivityEvent({ type: 'demo_reset' }),
        ]);

      incidentTitleRef.executeIfMounted((target) => {
        target.focus();
      });
    }, [incidentTitleRef, storeManager])
  );
}
