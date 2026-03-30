import React from 'react';
import {
  useCanonicalOrderActionHandler,
  useCanonicalOrderRef,
  useCanonicalOrderStoreManager,
} from '../contexts/CanonicalOrderContexts';
import {
  buildOrderQuote,
  transitionOrderSubmissionState,
  type OrderActivityEventInput,
  type OrderFieldErrors,
  validateOrderDraft,
} from '../business/orderBusiness';
import {
  toValidationViewState,
} from './orderHandlerSupport';

interface SubmissionHandlerOptions {
  appendActivity: (event: OrderActivityEventInput) => void;
}

export function useCanonicalOrderSubmissionHandlers({
  appendActivity,
}: SubmissionHandlerOptions) {
  const storeManager = useCanonicalOrderStoreManager();
  const customerNameRef = useCanonicalOrderRef('customerNameInput');
  const emailRef = useCanonicalOrderRef('emailInput');
  const quantityRef = useCanonicalOrderRef('quantityInput');
  const statusPanelRef = useCanonicalOrderRef('statusPanel');

  useCanonicalOrderActionHandler(
    'submitOrder',
    React.useCallback(async () => {
      const draftStore = storeManager.getStore('draft');
      const validationStore = storeManager.getStore('validation');
      const submissionStore = storeManager.getStore('submission');
      const draft = draftStore.getValue();

      submissionStore.update((current) =>
        transitionOrderSubmissionState(current, { type: 'submit_requested' })
      );
      appendActivity({
        type: 'submission_requested',
      });

      const validation = validateOrderDraft(draft);
      const validationView = toValidationViewState(validation);

      validationStore.setValue({
        fieldErrors: validationView.fieldErrors,
        focusField: validationView.focusField,
        hasAttemptedSubmit: true,
        summary: validationView.summary,
      });

      if (!validation.isValid) {
        submissionStore.update((current) =>
          transitionOrderSubmissionState(current, {
            type: 'validation_failed',
          })
        );
        appendActivity({
          type: 'validation_failed',
          issues: validation.issues,
        });

        const refMap: Record<keyof OrderFieldErrors, typeof customerNameRef> = {
          customerName: customerNameRef,
          email: emailRef,
          quantity: quantityRef,
        };

        const focusTarget =
          validationView.focusField !== null
            ? refMap[validationView.focusField]
            : null;

        focusTarget?.executeIfMounted((target) => {
          target.focus();
          target.select?.();
        });

        statusPanelRef.executeIfMounted((target) => {
          target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });

        return;
      }

      submissionStore.update((current) =>
        transitionOrderSubmissionState(current, {
          type: 'validation_passed',
        })
      );
      appendActivity({
        type: 'validation_passed',
      });

      await new Promise((resolve) => setTimeout(resolve, 40));
      const quote = buildOrderQuote(draft);
      const submittedAt = new Date().toISOString();

      submissionStore.update((current) =>
        transitionOrderSubmissionState(current, {
          type: 'quote_ready',
          quote,
          submittedAt,
          customerName: draft.customerName,
          plan: draft.plan,
        })
      );
      appendActivity({
        type: 'quote_ready',
        total: quote.total,
        plan: draft.plan,
      });

      statusPanelRef.executeIfMounted((target) => {
        target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    }, [
      appendActivity,
      customerNameRef,
      emailRef,
      quantityRef,
      statusPanelRef,
      storeManager,
    ])
  );
}
