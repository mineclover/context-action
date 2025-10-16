/**
 * User Management 6-Layer Architecture Example
 *
 * Demonstrates the Complete Guide implementation:
 * - Atomic Context Structure
 * - 6-Layer Hook Architecture
 * - Delayed Evaluation Pattern
 * - Selective Subscription Model
 */

import { useState, useCallback, useMemo } from 'react';
import {
  UserManagementActionProvider,
  UserManagementStoreProvider,
  type User,
} from './contexts/UserManagementContexts';
import { useRegisterSourceFile } from '../../../hooks/useRegisterSourceFile';

// 6-Layer Hooks
import { useUserManagementData, useUserFormData } from './subscriptions/useUserSubscriptions';
import { useUserHandlerRegistry } from './registries/useUserHandlerRegistry';
import { useUserManagementActions } from './dispatchers/useUserDispatchers';

// Views Layer
import { UserListView } from './views/UserListView';
import { UserFormView, type UserFormData } from './views/UserFormView';
import { UserStatsView } from './views/UserStatsView';

/**
 * Main User Management Example Component
 * Demonstrates Complete Guide 6-Layer architecture implementation
 */
export function UserManagement6LayerPage() {
  useRegisterSourceFile('pages/patterns/layered-architecture/UserManagement6LayerPage.tsx', {
    name: 'UserManagement6LayerPage',
    description: '6-Layer architecture demonstration following Complete Guide',
    tags: ['6-layer', 'atomic-context', 'complete-guide'],
    priority: 5
  });

  return (
    <UserManagementActionProvider>
      <UserManagementStoreProvider>
        <UserManagementWithRegistry />
      </UserManagementStoreProvider>
    </UserManagementActionProvider>
  );
}

/**
 * Component with Handler Registration
 *
 * Key Pattern: Use registries layer for handler registration
 * No props injection - handlers get context through hooks
 */
function UserManagementWithRegistry() {
  // Layer 4: Handler Registration - Register all handlers
  useUserHandlerRegistry();

  return <UserManagementUI />;
}

/**
 * Main UI Component
 *
 * Demonstrates how the 6-layers work together:
 * - Uses subscriptions for data access (Layer 3)
 * - Uses dispatchers for behavior (Layer 5)
 * - Uses pure view components (Layer 6)
 * - Business logic handled in handlers (Layer 2)
 * - Handler registration managed by registries (Layer 4)
 */
function UserManagementUI() {
  // 🎯 Local UI State
  const [currentView, setCurrentView] = useState<'list' | 'create' | 'edit'>('list');
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // 🎯 Layer 3: Selective State Subscriptions
  const {
    users,
    sortedUsers,
    userStatistics,
    recentUsers,
    isLoading,
    operationStatus,
  } = useUserManagementData();

  const { validationResult, hasErrors, isSubmitting } = useUserFormData();

  // 🎯 Layer 5: Action Dispatchers (View Interface)
  const {
    createUser,
    updateUser,
    deleteUser,
    validateUser,
    resetValidation,
  } = useUserManagementActions();

  // 🎯 Event Handlers
  const handleCreateUser = useCallback(async (formData: UserFormData) => {
    try {
      await createUser(formData);
      setCurrentView('list');
      await resetValidation();
    } catch (error) {
      console.error('Failed to create user:', error);
    }
  }, [createUser, resetValidation]);

  const handleUpdateUser = useCallback(async (formData: UserFormData) => {
    if (!editingUser) return;

    try {
      await updateUser({
        id: editingUser.id,
        updates: formData,
      });
      setCurrentView('list');
      setEditingUser(null);
      await resetValidation();
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  }, [updateUser, editingUser, resetValidation]);

  const handleDeleteUser = useCallback(async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      await deleteUser(userId);
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  }, [deleteUser]);

  const handleEditUser = useCallback((user: User) => {
    setEditingUser(user);
    setCurrentView('edit');
    resetValidation();
  }, [resetValidation]);

  const handleFormValidation = useCallback(async (data: { name: string; email: string }) => {
    await validateUser(data);
  }, [validateUser]);

  const handleCancel = useCallback(() => {
    setCurrentView('list');
    setEditingUser(null);
    resetValidation();
  }, [resetValidation]);

  // 🎯 Computed values
  const formInitialData = useMemo(() => {
    if (currentView === 'edit' && editingUser) {
      return {
        name: editingUser.name,
        email: editingUser.email,
        role: editingUser.role,
      };
    }
    return {};
  }, [currentView, editingUser]);

  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 p-6 rounded-xl border border-blue-100">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">User Management System</h2>
            <p className="text-sm text-gray-600">
              Experience the 6-Layer Architecture following Complete Guide
            </p>
          </div>

          {/* Navigation */}
          <div className="flex gap-3">
            <button
              onClick={() => setCurrentView('list')}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 transform
                ${currentView === 'list'
                  ? 'bg-blue-600 text-white shadow-lg scale-105'
                  : 'bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 hover:scale-105 hover:shadow-md'
                }
              `}
            >
              <span className="text-lg">📋</span>
              Users List
            </button>
            <button
              onClick={() => {
                setCurrentView('create');
                resetValidation();
              }}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 transform
                ${currentView === 'create'
                  ? 'bg-green-600 text-white shadow-lg scale-105'
                  : 'bg-white text-green-600 border border-green-200 hover:bg-green-50 hover:scale-105 hover:shadow-md'
                }
              `}
            >
              <span className="text-lg">➕</span>
              Add User
            </button>
          </div>
        </div>
      </div>

      {/* Operation Status */}
      {operationStatus.result && (
        <div
          className={`
            relative overflow-hidden p-5 rounded-xl border-l-4 transition-all duration-500 ease-in-out transform
            ${operationStatus.result.success
              ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-l-green-500 border border-green-200'
              : 'bg-gradient-to-r from-red-50 to-rose-50 border-l-red-500 border border-red-200'
            }
          `}
        >
          <div className="flex items-start gap-3">
            <div className={`
              flex items-center justify-center w-8 h-8 rounded-full
              ${operationStatus.result?.success ? 'bg-green-100' : 'bg-red-100'}
            `}>
              <span className="text-lg">
                {operationStatus.result?.success ? '✅' : '❌'}
              </span>
            </div>
            <div className="flex-1">
              <p className={`font-semibold capitalize ${
                operationStatus.result?.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {operationStatus.lastOperation} Operation: {' '}
                {operationStatus.result?.success ? 'Success' : 'Failed'}
              </p>
              <p className={`text-sm mt-1 ${
                operationStatus.result?.success ? 'text-green-700' : 'text-red-700'
              }`}>
                {operationStatus.result?.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Overview */}
      <div className="mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-1 rounded-xl">
          <div className="bg-white rounded-lg p-1">
            <UserStatsView
              statistics={userStatistics}
              recentUsers={recentUsers}
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div>
        <div className="min-h-[500px]">
          {/* Loading State */}
          {isLoading && (
            <div className="bg-white rounded-xl border shadow-sm p-8">
              <div className="flex items-center justify-center space-x-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="text-gray-600 font-medium">Processing...</span>
              </div>
            </div>
          )}

          {/* List View */}
          {currentView === 'list' && !isLoading && (
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden transition-all duration-300 hover:shadow-lg">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 border-b">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">👥</span>
                  <h3 className="text-xl font-semibold text-gray-800">User Directory</h3>
                  <div className="ml-auto bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    {users.length} {users.length === 1 ? 'user' : 'users'}
                  </div>
                </div>
              </div>
              <div className="p-4">
                <UserListView
                  users={sortedUsers}
                  isLoading={isLoading}
                  onEditUser={handleEditUser}
                  onDeleteUser={handleDeleteUser}
                  onViewDetails={(userId) => console.log('View details for:', userId)}
                />
              </div>
            </div>
          )}

          {/* Form View */}
          {(currentView === 'create' || currentView === 'edit') && (
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden transition-all duration-300 hover:shadow-lg">
              <div className={`bg-gradient-to-r p-4 border-b ${
                currentView === 'create'
                  ? 'from-green-50 to-emerald-100'
                  : 'from-blue-50 to-indigo-100'
              }`}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {currentView === 'create' ? '➕' : '✏️'}
                  </span>
                  <h3 className="text-xl font-semibold text-gray-800">
                    {currentView === 'create' ? 'Create New User' : 'Edit User Profile'}
                  </h3>
                  {currentView === 'edit' && editingUser && (
                    <div className="ml-auto bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      Editing: {editingUser.name}
                    </div>
                  )}
                </div>
              </div>
              <div className="p-6">
                <UserFormView
                  mode={currentView}
                  initialData={formInitialData}
                  validationResult={validationResult}
                  isSubmitting={isSubmitting}
                  onSubmit={currentView === 'create' ? handleCreateUser : handleUpdateUser}
                  onCancel={handleCancel}
                  onValidate={handleFormValidation}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Debug Panel */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-900 rounded-xl overflow-hidden">
          <details className="group">
            <summary className="cursor-pointer p-4 bg-gray-800 text-white font-mono text-sm flex items-center gap-3 hover:bg-gray-700 transition-colors">
              <span className="text-lg">🐛</span>
              <span>6-Layer Architecture Debug</span>
              <span className="ml-auto text-xs text-gray-400 group-open:hidden">Click to expand</span>
              <span className="ml-auto text-xs text-gray-400 hidden group-open:inline">Click to collapse</span>
            </summary>
            <div className="p-4 bg-gray-900">
              <pre className="text-green-400 font-mono text-xs overflow-auto leading-relaxed">
                {JSON.stringify(
                  {
                    currentView,
                    usersCount: users.length,
                    validationResult,
                    operationStatus,
                    isLoading,
                    hasErrors,
                    isSubmitting,
                    editingUser: editingUser ? { id: editingUser.id, name: editingUser.name } : null,
                  },
                  null,
                  2
                )}
              </pre>
            </div>
          </details>
        </div>
      )}
    </div>
  );
}