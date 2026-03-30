import React from 'react';
import {
  buildAccessReviewPacket,
  transitionAccessReviewState,
  type AccessActivityEventInput,
  type AccessValidationField,
  validateAccessRequestDraft,
} from '../business/accessBusiness';
import {
  useAccessRequestActionHandler,
  useAccessRequestRef,
  useAccessRequestStoreManager,
} from '../contexts/AccessRequestContexts';
import { toValidationViewState } from './accessHandlerSupport';

interface SubmissionHandlerOptions {
  appendActivity: (event: AccessActivityEventInput) => void;
}

export function useAccessSubmissionHandlers({
  appendActivity,
}: SubmissionHandlerOptions) {
  const storeManager = useAccessRequestStoreManager();
  const requesterNameRef = useAccessRequestRef('requesterNameInput');
  const emailRef = useAccessRequestRef('emailInput');
  const scopeRef = useAccessRequestRef('scopeSelect');
  const justificationRef = useAccessRequestRef('justificationInput');
  const statusPanelRef = useAccessRequestRef('statusPanel');

  useAccessRequestActionHandler(
    'submitReview',
    React.useCallback(async () => {
      const draftStore = storeManager.getStore('draft');
      const validationStore = storeManager.getStore('validation');
      const reviewStore = storeManager.getStore('review');
      const draft = draftStore.getValue();

      reviewStore.update((current) =>
        transitionAccessReviewState(current, { type: 'review_requested' })
      );
      appendActivity({ type: 'review_requested' });

      const validation = validateAccessRequestDraft(draft);
      const validationView = toValidationViewState(validation);

      validationStore.setValue({
        fieldErrors: validationView.fieldErrors,
        focusField: validationView.focusField,
        hasAttemptedSubmit: true,
        summary: validationView.summary,
      });

      if (!validation.isValid) {
        reviewStore.update((current) =>
          transitionAccessReviewState(current, { type: 'validation_failed' })
        );
        appendActivity({
          type: 'validation_failed',
          issues: validation.issues,
        });

        const focusField = validationView.focusField;
        const focusHandlers: Record<AccessValidationField, () => void> = {
          requesterName: () =>
            requesterNameRef.executeIfMounted((target) => {
              target.focus();
              target.select?.();
            }),
          email: () =>
            emailRef.executeIfMounted((target) => {
              target.focus();
              target.select?.();
            }),
          scope: () =>
            scopeRef.executeIfMounted((target) => {
              target.focus();
            }),
          justification: () =>
            justificationRef.executeIfMounted((target) => {
              target.focus();
              target.select?.();
            }),
        };

        if (focusField !== null) {
          focusHandlers[focusField]();
        }

        statusPanelRef.executeIfMounted((target) => {
          target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });

        return;
      }

      reviewStore.update((current) =>
        transitionAccessReviewState(current, { type: 'validation_passed' })
      );
      appendActivity({ type: 'validation_passed' });

      await new Promise((resolve) => setTimeout(resolve, 40));
      const packet = buildAccessReviewPacket(draft);
      const reviewedAt = new Date().toISOString();

      reviewStore.update((current) =>
        transitionAccessReviewState(current, {
          type: 'packet_ready',
          packet,
          reviewedAt,
          requesterName: draft.requesterName,
          scope: draft.scope,
        })
      );
      appendActivity({
        type: 'packet_ready',
        priority: packet.priority,
        scope: draft.scope,
      });

      statusPanelRef.executeIfMounted((target) => {
        target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    }, [
      appendActivity,
      emailRef,
      justificationRef,
      requesterNameRef,
      scopeRef,
      statusPanelRef,
      storeManager,
    ])
  );
}
