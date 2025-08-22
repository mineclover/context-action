import { useCallback } from 'react';
import { useConditionalActionHandler, useConditionalStoreManager } from '../stores';
import { mockServices } from '../mockServices';
import { addLog } from '../utils';

export function PermissionHandlers() {
  const stores = useConditionalStoreManager();
  
  // Permission check handler
  useConditionalActionHandler('manageSystem', useCallback(async (payload, controller) => {
    const logsStore = stores.getStore('logs');
    logsStore.update(logs => addLog(logs, 'info', '🔒 Permission check started', { userId: payload.userId, operation: payload.operation }));
    
    try {
      const userPermissions = await mockServices.getUserPermissions(payload.userId);
      
      const result = {
        step: 'permission-check',
        userId: payload.userId,
        permissions: userPermissions,
        hasAdminAccess: userPermissions.includes('admin'),
        timestamp: Date.now()
      };
      
      // Store permission result for admin handler
      const permissionStore = stores.getStore('permissionCheckResult');
      permissionStore.setValue(result);
      
      if (!userPermissions.includes('admin')) {
        const errorMsg = 'Insufficient permissions for system management';
        logsStore.update(logs => addLog(logs, 'error', errorMsg, result));
        controller.abort(errorMsg);
        return;
      }
      
      logsStore.update(logs => addLog(logs, 'info', '✅ Permission check passed', result));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logsStore.update(logs => addLog(logs, 'error', '❌ Permission check failed', { error: errorMessage }));
      controller.abort(`Permission check failed: ${errorMessage}`);
    }
  }, [stores]), {
    priority: 100,
    id: 'permission-checker',
    tags: ['security', 'authorization']
  });

  // Admin operation handler
  useConditionalActionHandler('manageSystem', useCallback(async (payload, controller) => {
    const permissionStore = stores.getStore('permissionCheckResult');
    const permissionResult = permissionStore.getValue();
    const logsStore = stores.getStore('logs');
    
    if (!permissionResult?.hasAdminAccess) {
      const errorMsg = 'Permission check failed';
      logsStore.update(logs => addLog(logs, 'error', errorMsg));
      controller.abort(errorMsg);
      return;
    }
    
    logsStore.update(logs => addLog(logs, 'info', `🛠️ System ${payload.operation} started`, { operation: payload.operation }));
    
    try {
      let result;
      switch (payload.operation) {
        case 'backup':
          result = await mockServices.performSystemBackup(payload.options);
          break;
        case 'restore':
          result = await mockServices.performSystemRestore(payload.options);
          break;
        case 'maintenance':
          result = await mockServices.performMaintenanceMode(payload.options);
          break;
        default:
          throw new Error(`Unknown operation: ${payload.operation}`);
      }
      
      const operationResult = {
        step: 'admin-operation',
        operation: payload.operation,
        result,
        executedBy: payload.userId,
        executedAt: Date.now()
      };
      
      // Store operation result
      
      const systemStore = stores.getStore('systemResults');
      systemStore.update(results => [...results, { 
        operation: payload.operation,
        success: true,
        result,
        timestamp: Date.now()
      }]);
      
      logsStore.update(logs => addLog(logs, 'info', `✅ System ${payload.operation} completed`, operationResult));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logsStore.update(logs => addLog(logs, 'error', `❌ System ${payload.operation} failed`, { error: errorMessage }));
      controller.abort(`System ${payload.operation} failed: ${errorMessage}`);
    }
  }, [stores]), {
    priority: 80,
    id: 'admin-operator',
    tags: ['admin', 'system-management']
  });

  return null;
}