import { mockServices } from '../mockServices';
import {
  useConditionalActionHandler,
  useConditionalStoreManager,
} from '../stores';
import { addLog } from '../utils';

/**
 * Registers every permission-related action handler for the conditional
 * execution example.
 */
export function PermissionHandlerRegistry() {
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
        const roleHierarchy: Record<string, number> = {
          guest: 0,
          user: 1,
          moderator: 2,
          admin: 3,
          superadmin: 4,
        };
        const requiredPermissions: Record<string, number> = {
          read: 0,
          create: 1,
          update: 1,
          delete: 2,
          moderate: 2,
          admin: 3,
          'manage-users': 3,
          'system-config': 4,
        };
        const userLevel = roleHierarchy[userRole] || 0;
        const requiredLevel = requiredPermissions[payload.action] || 0;
        const auditEntry = {
          timestamp: Date.now(),
          userId: payload.userId,
          action: payload.action,
          resourceId: payload.resourceId,
          userRole,
          userLevel,
          requiredLevel,
          granted: userLevel >= requiredLevel,
          ip: '192.168.1.100',
          userAgent: 'Demo Browser',
        };

        auditLogsStore.update((logs) => [...logs, auditEntry]);

        if (userLevel < requiredLevel) {
          const errorMsg = `Access denied: ${userRole} (level ${userLevel}) insufficient for ${payload.action} (requires level ${requiredLevel})`;
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
            reason: `Permission granted: ${userRole} has sufficient privileges`,
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
        await mockServices.checkUserPermissions(payload.userId, payload.action);
        const result = await mockServices.executeSecureOperation(
          payload.action,
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

  return null;
}

