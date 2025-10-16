import { useStoreValue } from '@context-action/react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { mockServices } from './mockServices';
import {
  ConditionalActionProvider,
  ConditionalStoreProvider,
  useConditionalAction,
  useConditionalActionHandler,
  useConditionalStore,
  useConditionalStoreManager,
} from './stores';
import { addLog } from './utils';

function PermissionHandlers() {
  const stores = useConditionalStoreManager();

  // Check Permission Handler
  useConditionalActionHandler(
    'checkPermission',
    async (payload, controller) => {
      const logsStore = stores.getStore('logs');
      const userRoleStore = stores.getStore('userRole');
      const auditLogsStore = stores.getStore('auditLogs');

      const userRole = userRoleStore.getValue();

      // Security Guard Pattern: Permission validation at entry
      logsStore.update((logs) =>
        addLog(logs, 'info', '🔒 Permission check started', {
          action: payload.action,
          userId: payload.userId,
          userRole,
          resourceId: payload.resourceId,
        })
      );

      try {
        // Role hierarchy: guest < user < moderator < admin < superadmin
        const roleHierarchy: Record<string, number> = {
          guest: 0,
          user: 1,
          moderator: 2,
          admin: 3,
          superadmin: 4,
        };

        const requiredPermissions: Record<string, number> = {
          read: 0, // Anyone can read
          create: 1, // User level required
          update: 1, // User level required
          delete: 2, // Moderator level required
          moderate: 2, // Moderator level required
          admin: 3, // Admin level required
          'manage-users': 3, // Admin level required
          'system-config': 4, // Superadmin only
        };

        const userLevel = roleHierarchy[userRole] || 0;
        const requiredLevel = requiredPermissions[payload.action] || 0;

        // Create audit log entry
        const auditEntry = {
          timestamp: Date.now(),
          userId: payload.userId,
          action: payload.action,
          resourceId: payload.resourceId,
          userRole,
          userLevel,
          requiredLevel,
          granted: userLevel >= requiredLevel,
          ip: '192.168.1.100', // Mock IP
          userAgent: 'Demo Browser',
        };

        auditLogsStore.update((logs) => [...logs, auditEntry]);

        if (userLevel < requiredLevel) {
          // Fail-secure by default
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

        // Permission granted
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
    {
      priority: 100,
      id: 'permission-guard',
    }
  );

  // Execute Secure Action Handler
  useConditionalActionHandler(
    'executeSecureAction',
    async (payload, controller) => {
      const logsStore = stores.getStore('logs');

      // Security Guard Pattern: Execute permission check first
      logsStore.update((logs) =>
        addLog(logs, 'info', '🛡️ Secure action initiated', {
          action: payload.action,
          userId: payload.userId,
        })
      );

      try {
        // First check permissions
        await mockServices.checkUserPermissions(payload.userId, payload.action);

        // Permission passed, execute business logic
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
    {
      priority: 90,
      id: 'secure-executor',
    }
  );

  return null;
}

function PermissionBasedExecutionContent() {
  const dispatch = useConditionalAction();
  const [selectedAction, setSelectedAction] = useState('read');
  const [selectedUserId, setSelectedUserId] = useState('user-123');

  const logsStore = useConditionalStore('logs');
  const logs = useStoreValue(logsStore);

  const userRoleStore = useConditionalStore('userRole');
  const userRole = useStoreValue(userRoleStore);

  const permissionResultsStore = useConditionalStore('permissionResults');
  const permissionResults = useStoreValue(permissionResultsStore);

  const auditLogsStore = useConditionalStore('auditLogs');
  const auditLogs = useStoreValue(auditLogsStore);

  const actions = [
    { key: 'read', label: 'Read Content', required: 'guest' },
    { key: 'create', label: 'Create Content', required: 'user' },
    { key: 'update', label: 'Update Content', required: 'user' },
    { key: 'delete', label: 'Delete Content', required: 'moderator' },
    { key: 'moderate', label: 'Moderate Users', required: 'moderator' },
    { key: 'admin', label: 'Admin Functions', required: 'admin' },
    { key: 'manage-users', label: 'Manage Users', required: 'admin' },
    { key: 'system-config', label: 'System Config', required: 'superadmin' },
  ];

  const roles = ['guest', 'user', 'moderator', 'admin', 'superadmin'];

  const handleCheckPermission = () => {
    dispatch('checkPermission', {
      action: selectedAction,
      userId: selectedUserId,
      resourceId: 'resource-001',
    });
  };

  const handleExecuteSecureAction = () => {
    dispatch('executeSecureAction', {
      action: selectedAction,
      userId: selectedUserId,
      payload: { data: 'secure operation data' },
    });
  };

  const handleRoleChange = (newRole: string) => {
    userRoleStore.setValue(newRole as any);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PermissionHandlers />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6 lg:pr-80">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-6">
            <Link
              to="/actionguard/conditional"
              className="text-blue-600 hover:text-blue-800 underline text-sm font-medium transition-colors"
            >
              ← Back to Conditional Execution
            </Link>
            <span className="hidden sm:inline text-gray-300">|</span>
            <Link
              to="/"
              className="text-gray-600 hover:text-gray-800 underline text-sm font-medium transition-colors"
            >
              🏠 Home
            </Link>
          </div>

          <div className="mb-6">
            <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              🔒 Permission-Based Execution
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Security-first handlers with role-based access control and
              comprehensive audit logging.
            </p>
          </div>

          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🛡️</span>
              <div>
                <h3 className="font-semibold text-yellow-800 mb-1">
                  Security Guard Pattern
                </h3>
                <p className="text-sm text-yellow-700 leading-relaxed">
                  Handlers validate permissions before execution. All access
                  attempts are logged with fail-secure by default behavior.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6 mb-8">
          {/* Permission Control Panel */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <span>🎛️</span>
              <span>Access Control Test</span>
            </h2>

            {/* Current Role */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current User Role
              </label>
              <div className="flex gap-2 flex-wrap">
                {roles.map((role) => (
                  <button
                    key={role}
                    onClick={() => handleRoleChange(role)}
                    className={`px-3 py-1 rounded text-sm border ${
                      userRole === role
                        ? 'bg-blue-100 border-blue-300 text-blue-800'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
              <div className="mt-2 text-sm">
                <span className="font-medium">Current Role: </span>
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    userRole === 'superadmin'
                      ? 'bg-red-100 text-red-800'
                      : userRole === 'admin'
                        ? 'bg-orange-100 text-orange-800'
                        : userRole === 'moderator'
                          ? 'bg-yellow-100 text-yellow-800'
                          : userRole === 'user'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {userRole}
                </span>
              </div>
            </div>

            {/* Action Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Action to Test
              </label>
              <select
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              >
                {actions.map((action) => (
                  <option key={action.key} value={action.key}>
                    {action.label} (requires: {action.required})
                  </option>
                ))}
              </select>
            </div>

            {/* User ID */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User ID
              </label>
              <input
                type="text"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleCheckPermission}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
              >
                Check Permission
              </button>
              <button
                onClick={handleExecuteSecureAction}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
              >
                Execute Secure Action
              </button>
            </div>
          </div>

          {/* Role Hierarchy */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <span>👥</span>
              <span>Role Hierarchy</span>
            </h2>
            <div className="space-y-3">
              {[
                {
                  role: 'superadmin',
                  level: 4,
                  desc: 'System configuration, all privileges',
                  color: 'bg-red-100 text-red-800',
                },
                {
                  role: 'admin',
                  level: 3,
                  desc: 'User management, admin functions',
                  color: 'bg-orange-100 text-orange-800',
                },
                {
                  role: 'moderator',
                  level: 2,
                  desc: 'Content moderation, delete permissions',
                  color: 'bg-yellow-100 text-yellow-800',
                },
                {
                  role: 'user',
                  level: 1,
                  desc: 'Create and update content',
                  color: 'bg-green-100 text-green-800',
                },
                {
                  role: 'guest',
                  level: 0,
                  desc: 'Read-only access',
                  color: 'bg-gray-100 text-gray-800',
                },
              ].map((item) => (
                <div
                  key={item.role}
                  className={`flex items-center justify-between p-4 border rounded-lg transition-all ${
                    userRole === item.role
                      ? 'border-blue-300 bg-blue-50 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${item.color}`}
                      >
                        Level {item.level}: {item.role}
                      </span>
                      {userRole === item.role && (
                        <span className="flex items-center gap-1 text-blue-600 text-sm font-medium">
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          Current
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-6 mb-8">
          {/* Permission Results */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span>🔐</span>
              <span>Permission Results</span>
            </h3>
            {permissionResults.length === 0 ? (
              <p className="text-gray-500">
                No permission checks yet. Test an action above.
              </p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {permissionResults
                  .slice(-5)
                  .reverse()
                  .map((result, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded border ${
                        result.granted
                          ? 'bg-green-50 border-green-200'
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{result.action}</span>
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            result.granted
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {result.granted ? 'GRANTED' : 'DENIED'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <div>
                          User: {result.userId} ({result.userRole})
                        </div>
                        <div>{result.reason}</div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Audit Trail */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span>📋</span>
              <span>Security Audit Trail</span>
            </h3>
            {auditLogs.length === 0 ? (
              <p className="text-gray-500">
                No audit entries yet. Perform security actions to see audit
                trail.
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {auditLogs
                  .slice(-5)
                  .reverse()
                  .map((entry, index) => (
                    <div key={index} className="p-2 bg-gray-50 rounded text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{entry.action}</span>
                        <span
                          className={`px-1 py-0.5 rounded ${
                            entry.granted
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {entry.granted ? 'ALLOW' : 'DENY'}
                        </span>
                      </div>
                      <div className="text-gray-600">
                        {entry.userId} • {entry.userRole} (L{entry.userLevel}) •
                        Req: L{entry.requiredLevel}
                      </div>
                      <div className="text-gray-500">
                        {new Date(entry.timestamp).toLocaleTimeString()} •{' '}
                        {entry.ip}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Execution Log */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow mb-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span>📋</span>
            <span>Execution Log</span>
          </h3>
          {logs.length === 0 ? (
            <p className="text-gray-500">
              No activity yet. Test security actions above.
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {logs
                .slice(-10)
                .reverse()
                .map((log, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-2 bg-gray-50 rounded"
                  >
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        log.level === 'success'
                          ? 'bg-green-100 text-green-800'
                          : log.level === 'error'
                            ? 'bg-red-100 text-red-800'
                            : log.level === 'warning'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {log.level}
                    </span>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{log.message}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Architecture Description */}
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-yellow-900 mb-6 flex items-center gap-3">
            <span>🏗️</span>
            <span>Security Guard Pattern Implementation</span>
          </h2>
          <div className="grid lg:grid-cols-2 gap-8 text-sm">
            <div>
              <h3 className="font-medium text-yellow-800 mb-2">
                Pattern Features:
              </h3>
              <ul className="text-yellow-700 space-y-1">
                <li>
                  • <strong>Early Validation:</strong> Permission check at
                  handler entry
                </li>
                <li>
                  • <strong>Fail-Secure:</strong> Deny by default, explicit
                  permissions required
                </li>
                <li>
                  • <strong>Role Hierarchy:</strong> Level-based permission
                  inheritance
                </li>
                <li>
                  • <strong>Audit Trail:</strong> Complete security event
                  logging
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-yellow-800 mb-2">
                Security Benefits:
              </h3>
              <ul className="text-yellow-700 space-y-1">
                <li>
                  • <strong>Compliance Ready:</strong> Full audit trail for
                  regulations
                </li>
                <li>
                  • <strong>Threat Detection:</strong> Real-time security
                  monitoring
                </li>
                <li>
                  • <strong>Zero Trust:</strong> Every action requires explicit
                  permission
                </li>
                <li>
                  • <strong>Role Management:</strong> Centralized role-based
                  access control
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PermissionBasedExecution() {
  return (
    <ConditionalStoreProvider>
      <ConditionalActionProvider>
        <PermissionBasedExecutionContent />
      </ConditionalActionProvider>
    </ConditionalStoreProvider>
  );
}
