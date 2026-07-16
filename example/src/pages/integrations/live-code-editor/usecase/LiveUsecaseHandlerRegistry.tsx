import React from 'react';
import { appendUsecaseActivity } from './business/live-usecase-activity';
import {
  createReviewPacket,
  validateUsecaseReason,
} from './business/live-usecase-rules';
import {
  initialUsecaseActivity,
  initialUsecaseWorkflow,
  LiveUsecaseActionProvider,
  LiveUsecaseStoreProvider,
  useLiveUsecaseActionHandler,
  useLiveUsecaseStoreManager,
} from './LiveUsecaseContexts';

function LiveUsecaseHandlerRegistry({
  children,
}: {
  children: React.ReactNode;
}) {
  const storeManager = useLiveUsecaseStoreManager();

  useLiveUsecaseActionHandler(
    'selectResource',
    React.useCallback(
      (resourceId) => {
        const workflowStore = storeManager.getStore('workflow');
        const activityStore = storeManager.getStore('activity');
        workflowStore.update((current) => ({
          ...current,
          resourceId,
          phase: 'idle',
          error: null,
          packet: null,
        }));
        activityStore.update((current) =>
          appendUsecaseActivity(current, {
            layer: 'recipe',
            label: 'Resource selected',
            detail: `${resourceId}를 선택하고 recipe 상태를 초기화했습니다.`,
            tone: 'info',
          })
        );
      },
      [storeManager]
    )
  );

  useLiveUsecaseActionHandler(
    'changeReason',
    React.useCallback(
      (reason) => {
        storeManager.getStore('workflow').update((current) => ({
          ...current,
          reason,
          phase: current.phase === 'ready' ? 'idle' : current.phase,
          error: null,
          packet: current.phase === 'ready' ? null : current.packet,
        }));
      },
      [storeManager]
    )
  );

  useLiveUsecaseActionHandler(
    'submitRequest',
    React.useCallback(
      async (_, controller): Promise<void> => {
        const workflowStore = storeManager.getStore('workflow');
        const activityStore = storeManager.getStore('activity');
        const workflow = workflowStore.getValue();

        workflowStore.update((current) => ({
          ...current,
          phase: 'validating',
          error: null,
        }));
        activityStore.update((current) =>
          appendUsecaseActivity(current, {
            layer: 'handler',
            label: 'Validation handler',
            detail: '최신 Store 값을 읽고 request contract를 검증합니다.',
            tone: 'info',
          })
        );

        const validationIssue = validateUsecaseReason(workflow.reason);
        if (validationIssue) {
          workflowStore.update((current) => ({
            ...current,
            phase: 'blocked',
            error: `접근 목적은 최소 ${validationIssue.minimumLength}자 이상이어야 합니다.`,
          }));
          activityStore.update((current) =>
            appendUsecaseActivity(current, {
              layer: 'contract',
              label: 'Request blocked',
              detail: 'Validation이 실패하여 후속 handler를 중단했습니다.',
              tone: 'blocked',
            })
          );
          controller.abort('request contract validation failed');
          return;
        }

        activityStore.update((current) =>
          appendUsecaseActivity(current, {
            layer: 'business',
            label: 'Validation passed',
            detail: '순수 business 규칙을 통과했습니다.',
            tone: 'success',
          })
        );
      },
      [storeManager]
    ),
    { id: 'live-usecase-submit-validation', priority: 100, blocking: true }
  );

  useLiveUsecaseActionHandler(
    'submitRequest',
    React.useCallback(async () => {
      const workflowStore = storeManager.getStore('workflow');
      const activityStore = storeManager.getStore('activity');

      workflowStore.update((current) => ({
        ...current,
        phase: 'packaging',
      }));
      await new Promise((resolve) => window.setTimeout(resolve, 260));

      const workflow = workflowStore.getValue();
      workflowStore.update((current) => ({
        ...current,
        phase: 'ready',
        packet: createReviewPacket(workflow.resourceId),
      }));
      activityStore.update((current) =>
        appendUsecaseActivity(current, {
          layer: 'business',
          label: 'Review packet ready',
          detail: 'business 결과를 Store에 반영했습니다.',
          tone: 'success',
        })
      );
    }, [storeManager]),
    { id: 'live-usecase-submit-packet', priority: 50, blocking: true }
  );

  useLiveUsecaseActionHandler(
    'submitRequest',
    React.useCallback(() => {
      const activityStore = storeManager.getStore('activity');
      activityStore.update((current) =>
        appendUsecaseActivity(current, {
          layer: 'handler',
          label: 'Audit recorded',
          detail: 'usecase 실행 결과를 activity stream에 기록했습니다.',
          tone: 'info',
        })
      );
    }, [storeManager]),
    { id: 'live-usecase-submit-audit', priority: 10, blocking: true }
  );

  useLiveUsecaseActionHandler(
    'resetRequest',
    React.useCallback(() => {
      storeManager.getStore('workflow').setValue(initialUsecaseWorkflow);
      storeManager.getStore('activity').setValue(initialUsecaseActivity);
    }, [storeManager])
  );

  return <>{children}</>;
}

export function LiveUsecaseProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LiveUsecaseActionProvider>
      <LiveUsecaseStoreProvider>
        <LiveUsecaseHandlerRegistry>{children}</LiveUsecaseHandlerRegistry>
      </LiveUsecaseStoreProvider>
    </LiveUsecaseActionProvider>
  );
}
