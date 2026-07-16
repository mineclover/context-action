import type React from 'react';
import { evaluatePermission } from '../business/permission-rules';
import {
  useConditionalActionHandler,
  useConditionalStoreManager,
} from '../contexts/ConditionalPatternsContexts';
import { mockServices } from '../mockServices';
import { addLog } from '../utils';

/**
 * Registers every permission-related action handler for the conditional
 * execution example.
 */
export function PermissionHandlerRegistry({
  children,
}: {
  children: React.ReactNode;
}) {
  const stores = useConditionalStoreManager();

  useConditionalActionHandler(
    'checkPermission',
    async (payload, controller) => {
      const logsStore = stores.getStore('logs');
      const userRoleStore = stores.getStore('userRole');
      const auditLogsStore = stores.getStore('auditLogs');
      const userRole = userRoleStore.getValue();

      logsStore.update((logs) =>
        addLog(logs, 'info', '🔒 Permission check started', {
          action: payload.action,
          userId: payload.userId,
          userRole,
          resourceId: payload.resourceId,
        })
      );

      try {
        const evaluation = evaluatePermission(userRole, payload.action);
        const auditEntry = {
          timestamp: Date.now(),
          userId: payload.userId,
          action: payload.action,
          resourceId: payload.resourceId,
          userRole,
          userLevel: evaluation.userLevel,
          requiredLevel: evaluation.requiredLevel,
          granted: evaluation.granted,
          ip: '192.168.1.100',
          userAgent: 'Demo Browser',
        };

        auditLogsStore.update((logs) => [...logs, auditEntry]);

        if (!evaluation.granted) {
          const errorMsg = evaluation.reason;
          logsStore.update((logs) =>
            addLog(logs, 'error', '❌ Permission denied', {
              error: errorMsg,
              userRole,
              requiredAction: payload.action,
            })
          );
          const permissionResultsStore = stores.getStore('permissionResults');
          permissionResultsStore.update((results) => [
            ...results,
            {
              action: payload.action,
              userId: payload.userId,
              userRole,
              granted: false,
              reason: errorMsg,
              timestamp: Date.now(),
            },
          ]);
          controller.abort(errorMsg);
          return;
        }

        const permissionResultsStore = stores.getStore('permissionResults');
        permissionResultsStore.update((results) => [
          ...results,
          {
            action: payload.action,
            userId: payload.userId,
            userRole,
            granted: true,
            reason: evaluation.reason,
            timestamp: Date.now(),
          },
        ]);
        logsStore.update((logs) =>
          addLog(logs, 'success', '✅ Permission granted', {
            action: payload.action,
            userRole,
          })
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        logsStore.update((logs) =>
          addLog(logs, 'error', '❌ Permission check failed', {
            error: errorMessage,
          })
        );
        controller.abort(`Permission check failed: ${errorMessage}`);
      }
    },
    { priority: 100, id: 'permission-guard' }
  );

  useConditionalActionHandler(
    'executeSecureAction',
    async (payload, controller) => {
      const logsStore = stores.getStore('logs');
      logsStore.update((logs) =>
        addLog(logs, 'info', '🛡️ Secure action initiated', {
          action: payload.action,
          userId: payload.userId,
        })
      );

      try {
        const permissionCheck = await mockServices.checkUserPermissions(
          payload.userId,
          payload.action
        );
        if (!permissionCheck.allowed) {
          const errorMessage = `Secure action denied: ${payload.userId} does not have ${payload.action} permission`;
          const permissionResultsStore = stores.getStore('permissionResults');
          permissionResultsStore.update((results) => [
            ...results,
            {
              action: `secure-${payload.action}`,
              userId: payload.userId,
              granted: false,
              reason: errorMessage,
              auditId: permissionCheck.auditId,
              timestamp: Date.now(),
            },
          ]);
          logsStore.update((logs) =>
            addLog(logs, 'error', '❌ Secure action denied', {
              action: payload.action,
              userId: payload.userId,
              permissions: permissionCheck.permissions,
            })
          );
          controller.abort(errorMessage);
          return;
        }

        const result = await mockServices.executeSecureOperation(
          payload.action,
          payload.userId,
          payload.payload
        );
        const permissionResultsStore = stores.getStore('permissionResults');
        permissionResultsStore.update((results) => [
          ...results,
          {
            action: `secure-${payload.action}`,
            userId: payload.userId,
            granted: true,
            result,
            executedAt: Date.now(),
            timestamp: Date.now(),
          },
        ]);
        logsStore.update((logs) =>
          addLog(logs, 'success', '✅ Secure action completed', {
            action: payload.action,
            result,
          })
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        logsStore.update((logs) =>
          addLog(logs, 'error', '❌ Secure action failed', {
            error: errorMessage,
          })
        );
        controller.abort(`Secure action failed: ${errorMessage}`);
      }
    },
    { priority: 90, id: 'secure-executor' }
  );

  return <>{children}</>;
}
