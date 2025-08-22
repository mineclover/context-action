import React from 'react';
import { useStoreValue } from '@context-action/react';
import { useConditionalStore, useConditionalAction, useConditionalStoreManager } from '../stores';

export function PermissionControls() {
  const userRoleStore = useConditionalStore('userRole');
  const currentUserStore = useConditionalStore('currentUser');
  const userRole = useStoreValue(userRoleStore);
  const currentUser = useStoreValue(currentUserStore);
  const dispatch = useConditionalAction();

  const handleSystemOperation = (operation: 'backup' | 'restore' | 'maintenance') => {
    // Clear previous permission check
    const stores = useConditionalStoreManager();
    stores.getStore('permissionCheckResult').setValue(null);
    
    const userId = userRole === 'admin' ? 'admin-456' : 
                   userRole === 'user' ? 'user-123' : 'guest-789';
    
    dispatch('manageSystem', {
      operation,
      userId,
      options: { includeUserData: true, duration: '30m' }
    });
  };

  return (
    <div className="border rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-3">🔒 Permission-Based Execution</h3>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">User Role:</label>
        <select 
          value={userRole} 
          onChange={(e) => userRoleStore.setValue(e.target.value as any)}
          className="border rounded px-3 py-1"
        >
          <option value="guest">Guest</option>
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      
      <div className="space-x-2 mb-2">
        <button 
          onClick={() => handleSystemOperation('backup')}
          className="bg-purple-500 text-white px-3 py-1 rounded hover:bg-purple-600 text-sm"
        >
          Backup
        </button>
        <button 
          onClick={() => handleSystemOperation('restore')}
          className="bg-orange-500 text-white px-3 py-1 rounded hover:bg-orange-600 text-sm"
        >
          Restore
        </button>
        <button 
          onClick={() => handleSystemOperation('maintenance')}
          className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm"
        >
          Maintenance
        </button>
      </div>
      
      <p className="text-sm text-gray-600">
        Only admin users can perform system operations.
      </p>
    </div>
  );
}