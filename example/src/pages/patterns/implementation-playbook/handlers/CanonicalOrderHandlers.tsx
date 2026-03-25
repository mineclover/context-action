import React from 'react';
import {
  CanonicalOrderActionProvider,
  CanonicalOrderRefProvider,
  CanonicalOrderStoreProvider,
  initialActivityState,
  initialSubmissionState,
  initialValidationState,
  useCanonicalOrderActionHandler,
  useCanonicalOrderRef,
  useCanonicalOrderStoreManager,
} from '../contexts/CanonicalOrderContexts';
import {
  buildOrderQuote,
  createEmptyOrderDraft,
  createExampleOrderDraft,
  type OrderFieldErrors,
  validateOrderDraft,
} from '../business/orderBusiness';

function createActivityEntry(
  step: string,
  detail: string,
  tone: 'info' | 'success' | 'warning'
) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    step,
    detail,
    tone,
  };
}

function removeResolvedFieldErrors(
  fieldErrors: OrderFieldErrors,
  changedKeys: string[]
): OrderFieldErrors {
  const nextErrors = { ...fieldErrors };

  for (const key of changedKeys) {
    if (key in nextErrors) {
      delete nextErrors[key as keyof OrderFieldErrors];
    }
  }

  return nextErrors;
}

function CanonicalOrderHandlerRegistry({
  children,
}: {
  children: React.ReactNode;
}) {
  const storeManager = useCanonicalOrderStoreManager();
  const customerNameRef = useCanonicalOrderRef('customerNameInput');
  const emailRef = useCanonicalOrderRef('emailInput');
  const quantityRef = useCanonicalOrderRef('quantityInput');
  const statusPanelRef = useCanonicalOrderRef('statusPanel');

  const appendActivity = React.useCallback(
    (step: string, detail: string, tone: 'info' | 'success' | 'warning') => {
      const activityStore = storeManager.getStore('activity');
      activityStore.update((current) => [
        ...current.slice(-5),
        createActivityEntry(step, detail, tone),
      ]);
    },
    [storeManager]
  );

  useCanonicalOrderActionHandler(
    'updateDraft',
    React.useCallback(
      async (payload) => {
        const draftStore = storeManager.getStore('draft');
        const validationStore = storeManager.getStore('validation');
        const changedKeys = Object.keys(payload);

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
            ? `Draft updated: ${changedKeys.join(', ')}.`
            : current.summary,
        }));

        appendActivity(
          'Draft updated',
          changedKeys.length ? changedKeys.join(', ') : 'No fields changed.',
          'info'
        );
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
        summary: 'Loaded a valid implementation-focused example.',
      });
      storeManager.getStore('submission').setValue(initialSubmissionState);
      appendActivity(
        'Example loaded',
        'Injected a valid draft so you can inspect the happy path quickly.',
        'info'
      );
    }, [appendActivity, storeManager])
  );

  useCanonicalOrderActionHandler(
    'resetDemo',
    React.useCallback(async () => {
      storeManager.getStore('draft').setValue(createEmptyOrderDraft());
      storeManager.getStore('validation').setValue(initialValidationState);
      storeManager.getStore('submission').setValue(initialSubmissionState);
      storeManager.getStore('activity').setValue([
        ...initialActivityState,
        createActivityEntry(
          'Demo reset',
          'Stores returned to their initial baseline state.',
          'info'
        ),
      ]);

      customerNameRef.executeIfMounted((target) => {
        target.focus();
      });
    }, [customerNameRef, storeManager])
  );

  useCanonicalOrderActionHandler(
    'submitOrder',
    React.useCallback(async () => {
      const draftStore = storeManager.getStore('draft');
      const validationStore = storeManager.getStore('validation');
      const submissionStore = storeManager.getStore('submission');
      const draft = draftStore.getValue();

      submissionStore.setValue({
        status: 'validating',
        message: 'Validating draft in the business layer.',
        quote: null,
        submittedAt: null,
      });
      appendActivity(
        'Validation started',
        'Handler pulled the latest draft from Store Context.',
        'info'
      );

      const validation = validateOrderDraft(draft);
      validationStore.setValue({
        fieldErrors: validation.fieldErrors,
        focusField: validation.focusField,
        hasAttemptedSubmit: true,
        summary: validation.summary,
      });

      if (!validation.isValid) {
        submissionStore.setValue({
          status: 'error',
          message: validation.summary,
          quote: null,
          submittedAt: null,
        });
        appendActivity(
          'Validation failed',
          validation.summary,
          'warning'
        );

        const refMap = {
          customerName: customerNameRef,
          email: emailRef,
          quantity: quantityRef,
        } as const;

        const focusTarget =
          validation.focusField !== null ? refMap[validation.focusField] : null;

        focusTarget?.executeIfMounted((target) => {
          target.focus();
          target.select?.();
        });

        statusPanelRef.executeIfMounted((target) => {
          target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });

        return;
      }

      submissionStore.setValue({
        status: 'submitting',
        message: 'Calculating quote and committing side effects.',
        quote: null,
        submittedAt: null,
      });
      appendActivity(
        'Business logic running',
        'Validation passed. Quote calculation moved to the business layer.',
        'info'
      );

      await new Promise((resolve) => setTimeout(resolve, 40));
      const quote = buildOrderQuote(draft);

      submissionStore.setValue({
        status: 'success',
        message: `Prepared quote for ${draft.customerName}.`,
        quote,
        submittedAt: new Date().toISOString(),
      });
      appendActivity(
        'Submission ready',
        `Quote total: $${quote.total.toFixed(2)}.`,
        'success'
      );

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

  return <>{children}</>;
}

export function CanonicalOrderProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CanonicalOrderActionProvider>
      <CanonicalOrderStoreProvider>
        <CanonicalOrderRefProvider>
          <CanonicalOrderHandlerRegistry>{children}</CanonicalOrderHandlerRegistry>
        </CanonicalOrderRefProvider>
      </CanonicalOrderStoreProvider>
    </CanonicalOrderActionProvider>
  );
}
