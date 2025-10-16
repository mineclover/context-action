/**
 * Store Subscriptions Layer
 *
 * This layer:
 * - Provides reactive subscriptions to store values
 * - Computes derived state from store data
 * - Handles data transformation and formatting
 * - Abstracts store access from views
 */

import { useStoreValue } from '@context-action/react';
import { useMemo } from 'react';
import { useRegisterSourceFile } from '../../../../hooks/useRegisterSourceFile';
import {
  calculateUserStatistics,
  filterUsersByRole,
  sortUsersByCreatedDate,
  sortUsersByName,
} from '../business/userBusinessLogic';
import {
  type User,
  useUserManagementStore,
} from '../contexts/UserManagementContexts';

/**
 * User Management Data Hook
 *
 * Provides reactive access to user management state with computed values.
 */
export function useUserManagementData() {
  // hooks 레이어 등록
  useRegisterSourceFile(
    'pages/patterns/layered-architecture/hooks/useUserManagementData.ts',
    {
      name: 'useUserManagementData',
      description: 'Store subscriptions and derived state management',
      tags: ['hooks', 'subscriptions', 'derived-state'],
      priority: 20,
    }
  );

  // 🎯 Raw Store Subscriptions
  const usersStore = useUserManagementStore('users');
  const validationStore = useUserManagementStore('validationResult');
  const operationStatusStore = useUserManagementStore('operationStatus');

  // 🎯 Reactive Values
  const users = useStoreValue(usersStore);
  const validationResult = useStoreValue(validationStore);
  const operationStatus = useStoreValue(operationStatusStore);

  // 🎯 Computed Values (Memoized)
  const userStatistics = useMemo(() => {
    return calculateUserStatistics(users);
  }, [users]);

  const sortedUsers = useMemo(() => {
    return sortUsersByName(users);
  }, [users]);

  const usersByRole = useMemo(() => {
    return {
      admin: filterUsersByRole(users, 'admin'),
      user: filterUsersByRole(users, 'user'),
      guest: filterUsersByRole(users, 'guest'),
    };
  }, [users]);

  const recentUsers = useMemo(() => {
    return sortUsersByCreatedDate(users).slice(0, 5);
  }, [users]);

  // 🎯 Status Helpers
  const isLoading = operationStatus.isLoading;
  const hasValidationErrors = validationResult && !validationResult.isValid;
  const lastOperationFailed =
    operationStatus.result && !operationStatus.result.success;

  return {
    // Raw store data
    users,
    validationResult,
    operationStatus,

    // Computed data
    userStatistics,
    sortedUsers,
    usersByRole,
    recentUsers,

    // Status helpers
    isLoading,
    hasValidationErrors,
    lastOperationFailed,

    // Store references (for advanced usage)
    stores: {
      usersStore,
      validationStore,
      operationStatusStore,
    },
  };
}

/**
 * User Detail Data Hook
 *
 * Provides data for a specific user with related information.
 */
export function useUserDetailData(userId: string | null) {
  const { users, usersByRole } = useUserManagementData();

  // 🎯 Find specific user
  const user = useMemo(() => {
    if (!userId) return null;
    return users.find((u) => u.id === userId) || null;
  }, [users, userId]);

  // 🎯 Related users (same role)
  const relatedUsers = useMemo(() => {
    if (!user) return [];
    return usersByRole[user.role].filter((u) => u.id !== user.id);
  }, [user, usersByRole]);

  // 🎯 User position in list
  const userPosition = useMemo(() => {
    if (!user) return null;
    const sortedUsers = sortUsersByName(users);
    return sortedUsers.findIndex((u) => u.id === user.id) + 1;
  }, [user, users]);

  return {
    user,
    relatedUsers,
    userPosition,
    exists: user !== null,
  };
}

/**
 * User Form Data Hook
 *
 * Provides data and helpers for user forms.
 */
export function useUserFormData() {
  const { validationResult, isLoading } = useUserManagementData();

  // 🎯 Form state helpers
  const formErrors = validationResult?.errors || [];
  const hasErrors = formErrors.length > 0;
  const isSubmitting = isLoading;

  // 🎯 Field validation helpers
  const getFieldError = (fieldName: string) => {
    if (!hasErrors) return null;

    const fieldErrors = formErrors.filter((error) =>
      error.toLowerCase().includes(fieldName.toLowerCase())
    );

    return fieldErrors.length > 0 ? fieldErrors[0] : null;
  };

  const isFieldValid = (fieldName: string) => {
    return getFieldError(fieldName) === null;
  };

  return {
    // Validation state
    validationResult,
    formErrors,
    hasErrors,
    isSubmitting,

    // Field helpers
    getFieldError,
    isFieldValid,

    // Form state
    canSubmit: !hasErrors && !isSubmitting,
  };
}

/**
 * User Search Data Hook
 *
 * Provides search and filtering functionality for users.
 */
export function useUserSearchData() {
  const { users } = useUserManagementData();

  // 🎯 Search function
  const searchUsers = useMemo(() => {
    return (query: string) => {
      if (!query.trim()) return users;

      const lowercaseQuery = query.toLowerCase();
      return users.filter(
        (user) =>
          user.name.toLowerCase().includes(lowercaseQuery) ||
          user.email.toLowerCase().includes(lowercaseQuery) ||
          user.role.toLowerCase().includes(lowercaseQuery)
      );
    };
  }, [users]);

  // 🎯 Filter functions
  const filterByRole = useMemo(() => {
    return (role: User['role'] | 'all') => {
      if (role === 'all') return users;
      return filterUsersByRole(users, role);
    };
  }, [users]);

  return {
    searchUsers,
    filterByRole,
    totalUsers: users.length,
  };
}
