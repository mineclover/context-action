import { useCallback, useEffect, useRef } from 'react';
import { transitionOrderState } from '../business/orderStateMachine';
import { validateOrderDraft } from '../business/orderValidation';
import {
  useOrderBusinessActionCommandHandler,
  useOrderBusinessActionGuard,
  useOrderBusinessActionObserver,
  useOrderLayoutDispatch,
  useOrderStore,
} from '../contexts/OrderContexts';

export function useOrderSubmissionHandlers() {
  const draftStore = useOrderStore('draft');
  const validationStore = useOrderStore('validationIssues');
  const submissionStore = useOrderStore('submission');
  const activityStore = useOrderStore('activityLog');
  const layoutDispatch = useOrderLayoutDispatch();
  const submissionEpochRef = useRef(0);
  const timeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingResolveRef = useRef<((completed: boolean) => void) | null>(
    null
  );

  const cancelPendingSubmission = useCallback(() => {
    submissionEpochRef.current += 1;
    if (timeoutIdRef.current !== null) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
    if (pendingResolveRef.current !== null) {
      const resolvePending = pendingResolveRef.current;
      pendingResolveRef.current = null;
      resolvePending(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      cancelPendingSubmission();
    };
  }, [cancelPendingSubmission]);

  // 1. Guard: 중복 제출 방지 및 순수 도메인 검증 실패 시 파이프라인 중단
  useOrderBusinessActionGuard(
    'submitOrder',
    useCallback(
      (_, controller) => {
        const currentSubmission = submissionStore.getValue();
        if (
          currentSubmission.phase === 'validating' ||
          currentSubmission.phase === 'submitting' ||
          currentSubmission.phase === 'success'
        ) {
          controller.abort('duplicate_submission');
          return;
        }

        const validatingState = transitionOrderState(currentSubmission, {
          type: 'submit_requested',
        });
        submissionStore.setValue(validatingState);

        const validation = validateOrderDraft(draftStore.getValue());
        const firstIssue = validation.issues[0];
        if (!validation.isValid && firstIssue) {
          validationStore.setValue(validation.issues);
          submissionStore.setValue(
            transitionOrderState(validatingState, {
              type: 'validation_failed',
              errorCode: firstIssue.code,
            })
          );
          void layoutDispatch('focusField', { field: firstIssue.field });
          controller.abort('validation_failed');
          return;
        }

        validationStore.setValue([]);
      },
      [draftStore, layoutDispatch, submissionStore, validationStore]
    ),
    { id: 'order-submit-guard', priority: 100 }
  );

  // 2. Command: 유효성 통과 후 상태 전이 및 비동기 제출 실행
  useOrderBusinessActionCommandHandler(
    'submitOrder',
    useCallback(async () => {
      const epoch = submissionEpochRef.current + 1;
      submissionEpochRef.current = epoch;
      if (timeoutIdRef.current !== null) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }

      const draft = draftStore.getValue();
      const submittingState = transitionOrderState(submissionStore.getValue(), {
        type: 'validation_passed',
      });
      submissionStore.setValue(submittingState);

      activityStore.setValue([
        ...activityStore.getValue(),
        { type: 'submission_started', quantity: draft.quantity },
      ]);

      if (pendingResolveRef.current !== null) {
        const resolvePending = pendingResolveRef.current;
        pendingResolveRef.current = null;
        resolvePending(false);
      }

      // 모의 서버 비동기 지연 (600ms)
      const completed = await new Promise<boolean>((resolve) => {
        pendingResolveRef.current = resolve;
        timeoutIdRef.current = setTimeout(() => {
          timeoutIdRef.current = null;
          pendingResolveRef.current = null;
          resolve(submissionEpochRef.current === epoch);
        }, 600);
      });
      if (!completed || submissionEpochRef.current !== epoch) {
        return;
      }

      const generatedOrderId = `ORD-${Date.now().toString(36).toUpperCase()}`;
      submissionStore.setValue(
        transitionOrderState(submissionStore.getValue(), {
          type: 'server_succeeded',
          orderId: generatedOrderId,
        })
      );
    }, [activityStore, draftStore, submissionStore]),
    { id: 'order-submit-command', priority: 10 }
  );

  // 3. Observer: 정산 결과 기반 도메인 활동 이벤트 기록 (abort/결과 권한 없음)
  useOrderBusinessActionObserver(
    'submitOrder',
    useCallback(
      (event) => {
        if (event.outcome === 'cancelled') {
          const issues = validationStore.getValue();
          if (issues.length > 0) {
            activityStore.setValue([
              ...activityStore.getValue(),
              { type: 'validation_failed', issueCount: issues.length },
            ]);
          }
          return;
        }

        if (event.outcome === 'completed') {
          const submission = submissionStore.getValue();
          if (submission.phase === 'success' && submission.orderId) {
            activityStore.setValue([
              ...activityStore.getValue(),
              { type: 'order_completed', orderId: submission.orderId },
            ]);
          }
        }
      },
      [activityStore, submissionStore, validationStore]
    ),
    { id: 'order-audit-observer', priority: 1, when: 'always' }
  );

  useOrderBusinessActionCommandHandler(
    'retrySubmission',
    useCallback(() => {
      cancelPendingSubmission();
      const state = transitionOrderState(submissionStore.getValue(), {
        type: 'reset',
      });
      submissionStore.setValue(state);
      validationStore.setValue([]);
    }, [cancelPendingSubmission, submissionStore, validationStore]),
    { id: 'order-retry-submission-command' }
  );

  useOrderBusinessActionCommandHandler(
    'resetDraft',
    useCallback(() => {
      cancelPendingSubmission();
      const current = submissionStore.getValue();
      if (current.phase !== 'idle') {
        submissionStore.setValue(
          transitionOrderState(current, { type: 'reset' })
        );
      }
    }, [cancelPendingSubmission, submissionStore]),
    { id: 'order-reset-submission-command' }
  );
}
