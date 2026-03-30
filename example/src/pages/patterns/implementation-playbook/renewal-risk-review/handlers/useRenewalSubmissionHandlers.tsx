import React from 'react';
import {
  buildRenewalRiskPacket,
  transitionRenewalReviewState,
  type RenewalActivityEventInput,
  type RenewalValidationField,
  validateRenewalReviewDraft,
} from '../business/renewalBusiness';
import {
  useRenewalRiskReviewActionHandler,
  useRenewalRiskReviewRef,
  useRenewalRiskReviewStoreManager,
} from '../contexts/RenewalRiskReviewContexts';
import { toValidationViewState } from './renewalHandlerSupport';

interface SubmissionHandlerOptions {
  appendActivity: (event: RenewalActivityEventInput) => void;
}

export function useRenewalSubmissionHandlers({
  appendActivity,
}: SubmissionHandlerOptions) {
  const storeManager = useRenewalRiskReviewStoreManager();
  const accountNameRef = useRenewalRiskReviewRef('accountNameInput');
  const renewalWindowRef = useRenewalRiskReviewRef('renewalWindowSelect');
  const usageScoreRef = useRenewalRiskReviewRef('usageScoreInput');
  const riskNotesRef = useRenewalRiskReviewRef('riskNotesInput');
  const statusPanelRef = useRenewalRiskReviewRef('statusPanel');

  useRenewalRiskReviewActionHandler(
    'submitReview',
    React.useCallback(async () => {
      const draftStore = storeManager.getStore('draft');
      const validationStore = storeManager.getStore('validation');
      const reviewStore = storeManager.getStore('review');
      const draft = draftStore.getValue();

      reviewStore.update((current) =>
        transitionRenewalReviewState(current, {
          type: 'review_requested',
        })
      );
      appendActivity({ type: 'review_requested' });

      const validation = validateRenewalReviewDraft(draft);
      const validationView = toValidationViewState(validation);

      validationStore.setValue({
        fieldErrors: validationView.fieldErrors,
        focusField: validationView.focusField,
        hasAttemptedSubmit: true,
        summary: validationView.summary,
      });

      if (!validation.isValid) {
        reviewStore.update((current) =>
          transitionRenewalReviewState(current, {
            type: 'validation_failed',
          })
        );
        appendActivity({
          type: 'validation_failed',
          issues: validation.issues,
        });

        const focusField = validationView.focusField;
        const focusHandlers: Record<RenewalValidationField, () => void> = {
          accountName: () =>
            accountNameRef.executeIfMounted((target) => {
              target.focus();
              target.select?.();
            }),
          renewalWindow: () =>
            renewalWindowRef.executeIfMounted((target) => {
              target.focus();
            }),
          usageScore: () =>
            usageScoreRef.executeIfMounted((target) => {
              target.focus();
              target.select?.();
            }),
          riskNotes: () =>
            riskNotesRef.executeIfMounted((target) => {
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
        transitionRenewalReviewState(current, {
          type: 'validation_passed',
        })
      );
      appendActivity({ type: 'validation_passed' });

      await new Promise((resolve) => setTimeout(resolve, 40));
      const packet = buildRenewalRiskPacket(draft);
      const reviewedAt = new Date().toISOString();

      reviewStore.update((current) =>
        transitionRenewalReviewState(current, {
          type: 'packet_ready',
          packet,
          reviewedAt,
          accountName: draft.accountName,
          riskBand: packet.riskBand,
        })
      );
      appendActivity({
        type: 'packet_ready',
        riskBand: packet.riskBand,
        renewalWindow: draft.renewalWindow,
      });

      statusPanelRef.executeIfMounted((target) => {
        target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    }, [
      accountNameRef,
      appendActivity,
      renewalWindowRef,
      riskNotesRef,
      statusPanelRef,
      storeManager,
      usageScoreRef,
    ])
  );
}
