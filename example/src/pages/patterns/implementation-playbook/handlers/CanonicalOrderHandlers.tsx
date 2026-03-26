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
            ? `입력값이 갱신되었습니다: ${changedKeys.join(', ')}`
            : current.summary,
        }));

        appendActivity(
          '입력값 갱신',
          changedKeys.length ? changedKeys.join(', ') : '변경된 항목이 없습니다.',
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
        summary: '샘플 입력을 불러왔습니다. 바로 견적 흐름을 확인할 수 있습니다.',
      });
      storeManager.getStore('submission').setValue(initialSubmissionState);
      appendActivity(
        '샘플 불러오기',
        '정상 제출 경로를 바로 볼 수 있도록 예시 입력을 채웠습니다.',
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
          '예제 초기화',
          'draft, validation, submission 상태를 초기값으로 되돌렸습니다.',
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
        message: '입력값을 검증하고 있습니다.',
        quote: null,
        submittedAt: null,
      });
      appendActivity(
        '검증 시작',
        'handler가 Store Context에서 최신 draft를 읽었습니다.',
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
          '검증 실패',
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
        message: '견적을 계산하고 상태를 반영하고 있습니다.',
        quote: null,
        submittedAt: null,
      });
      appendActivity(
        '비즈니스 로직 실행',
        '검증이 통과되어 business 레이어에서 견적 계산을 시작했습니다.',
        'info'
      );

      await new Promise((resolve) => setTimeout(resolve, 40));
      const quote = buildOrderQuote(draft);

      submissionStore.setValue({
        status: 'success',
        message: `${draft.customerName}님 팀 견적이 준비되었습니다.`,
        quote,
        submittedAt: new Date().toISOString(),
      });
      appendActivity(
        '견적 준비 완료',
        `최종 견적은 $${quote.total.toFixed(2)} 입니다.`,
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
