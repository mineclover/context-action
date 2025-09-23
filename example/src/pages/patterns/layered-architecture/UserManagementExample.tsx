/**
 * Integration Point - UserManagementExample
 *
 * This is the main integration component that:
 * 1. Sets up all Context Providers
 * 2. Injects dependencies into Handlers via props (DI Pattern)
 * 3. Coordinates between different layers
 * 4. Demonstrates the complete 5-layer architecture
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  UserManagementActionProvider,
  UserManagementStoreProvider,
  type User,
} from './contexts/UserManagementContexts';
import { useRegisterSourceFile } from '../../../hooks/useRegisterSourceFile';
import { UserManagementHandlers } from './handlers/UserManagementHandlers';
import { useUserManagementActions } from './actions/useUserManagementActions';
import { useUserManagementData, useUserFormData } from './hooks/useUserManagementData';
import { UserListView } from './views/UserListView';
import { UserFormView, type UserFormData } from './views/UserFormView';
import { UserStatsView } from './views/UserStatsView';

// 🎯 Mock external dependencies for demonstration
const mockApiClient = {
  saveUser: async (user: User) => {
    console.log('🌐 API: Saving user', user);
    await new Promise(resolve => setTimeout(resolve, 1000));
  },
  updateUser: async (userId: string, updates: Partial<User>) => {
    console.log('🌐 API: Updating user', userId, updates);
    await new Promise(resolve => setTimeout(resolve, 800));
  },
  deleteUser: async (userId: string) => {
    console.log('🌐 API: Deleting user', userId);
    await new Promise(resolve => setTimeout(resolve, 600));
  },
};

const mockLogger = {
  info: (message: string, data?: any) => {
    console.log(`📝 LOG: ${message}`, data);
  },
  error: (message: string, error?: any) => {
    console.error(`❌ ERROR: ${message}`, error);
  },
};

/**
 * Main User Management Example Component
 *
 * Demonstrates the complete 5-layer architecture implementation
 */
export function UserManagementExample() {
  // 메인 통합 컴포넌트 등록
  useRegisterSourceFile('pages/patterns/layered-architecture/UserManagementExample.tsx', {
    name: 'UserManagementExample',
    description: 'Main integration component for 6-layer architecture demonstration',
    tags: ['integration', 'main', 'demo'],
    priority: 5
  });

  // contexts 레이어 파일 등록 (TypeScript 파일이므로 여기서 대신 등록)
  useRegisterSourceFile('pages/patterns/layered-architecture/contexts/UserManagementContexts.ts', {
    name: 'UserManagementContexts',
    description: 'Context definitions, types, and action payload maps for user management',
    tags: ['contexts', 'types', 'definitions'],
    priority: 30
  });

  // business 레이어 파일 등록 (TypeScript 파일이므로 여기서 대신 등록)
  useRegisterSourceFile('pages/patterns/layered-architecture/business/userBusinessLogic.ts', {
    name: 'userBusinessLogic',
    description: 'Pure business logic functions for user validation and operations',
    tags: ['business', 'pure-functions', 'validation'],
    priority: 35
  });

  return (
    <UserManagementActionProvider>
      <UserManagementStoreProvider>
        <UserManagementWithHandlers />
      </UserManagementStoreProvider>
    </UserManagementActionProvider>
  );
}

/**
 * Component with Handler Registration
 *
 * This component demonstrates the key pattern:
 * - Gets store references from context
 * - Injects them into handlers via props (Handler Injection Pattern)
 * - Handlers register themselves using useActionHandler within context boundaries
 */
function UserManagementWithHandlers() {
  // 🎯 Get store references for dependency injection
  const { stores } = useUserManagementData();

  return (
    <UserManagementHandlers
      moduleId="user-management-demo"
      usersStore={stores.usersStore}
      validationStore={stores.validationStore}
      operationStatusStore={stores.operationStatusStore}
      apiClient={mockApiClient}
      logger={mockLogger}
      onUserCreated={(user) => console.log('🎉 User created:', user)}
      onUserUpdated={(user) => console.log('✏️ User updated:', user)}
      onUserDeleted={(user) => console.log('🗑️ User deleted:', user)}
    >
      <UserManagementUI />
    </UserManagementHandlers>
  );
}

/**
 * Main UI Component
 *
 * Demonstrates how the layers work together:
 * - Uses hooks for data access (Hook Layer)
 * - Uses actions for behavior (Action Layer)
 * - Uses pure view components (View Layer)
 * - Business logic is handled in handlers (Handler Layer)
 * - Pure business functions are in business layer (Business Layer)
 */
function UserManagementUI() {
  // 🎯 State management
  const [currentView, setCurrentView] = useState<'list' | 'create' | 'edit'>('list');
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // 🎯 Hook Layer - Data subscriptions
  const {
    users,
    sortedUsers,
    userStatistics,
    recentUsers,
    isLoading,
    operationStatus,
  } = useUserManagementData();

  const { validationResult, hasErrors, isSubmitting } = useUserFormData();

  // 🎯 Action Layer - Behavior
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
      {/* Enhanced Header with Gradient Background */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 p-6 rounded-xl border border-blue-100">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">User Management System</h2>
            <p className="text-sm text-gray-600">
              Experience the 5-Layer Architecture with Handler Injection Pattern
            </p>
          </div>

          {/* Enhanced Navigation with Icons */}
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

      {/* Enhanced Operation Status with Animation */}
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

          {/* Animated background overlay */}
          <div className={`
            absolute inset-0 opacity-10 animate-pulse
            ${operationStatus.result?.success ? 'bg-green-400' : 'bg-red-400'}
          `}></div>
        </div>
      )}

      {/* Statistics Overview - Top Section */}
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

      {/* Main Content Area - User Directory */}
      <div>
          <div className="min-h-[500px]">
            {/* Enhanced Loading State */}
            {isLoading && (
              <div className="bg-white rounded-xl border shadow-sm p-8">
                <div className="flex items-center justify-center space-x-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="text-gray-600 font-medium">Processing...</span>
                </div>
              </div>
            )}

            {/* Enhanced List View */}
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

            {/* Enhanced Form View */}
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

      {/* Enhanced Debug Panel */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-900 rounded-xl overflow-hidden">
          <details className="group">
            <summary className="cursor-pointer p-4 bg-gray-800 text-white font-mono text-sm flex items-center gap-3 hover:bg-gray-700 transition-colors">
              <span className="text-lg">🐛</span>
              <span>Debug Information</span>
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