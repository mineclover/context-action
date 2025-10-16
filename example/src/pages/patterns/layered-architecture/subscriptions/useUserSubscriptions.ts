/**
 * Layer 3: Selective State Subscription Hooks (subscriptions/)
 *
 * - Selective state subscription or get subscribed state from parent context hooks
 * - UI update-focused selective subscriptions
 * - Computed values and derived state
 * - Access parent context subscriptions when needed
 */

import { useStoreValue } from '@context-action/react';
import { useMemo } from 'react';
import {
  type User,
  type UserOperationResult,
  type UserValidationResult,
  useUserManagementStore,
} from '../contexts/UserManagementContexts';

export function useUserManagementData() {
  // Get store references
  const usersStore = useUserManagementStore('users');
  const validationStore = useUserManagementStore('validationResult');
  const operationStatusStore = useUserManagementStore('operationStatus');

  // Selective subscriptions - only subscribe to what UI needs
  const users = useStoreValue(usersStore);
  const validationResult = useStoreValue(validationStore);
  const operationStatus = useStoreValue(operationStatusStore);

  // Computed values (derived state)
  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => a.name.localeCompare(b.name));
  }, [users]);

  const userStatistics = useMemo(
    () => ({
      totalUsers: users.length,
      roleDistribution: {
        admin: users.filter((user) => user.role === 'admin').length,
        user: users.filter((user) => user.role === 'user').length,
        guest: users.filter((user) => user.role === 'guest').length,
      },
      newestUser:
        users.length > 0
          ? ([...users].sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            )[0] ?? null)
          : null,
    }),
    [users]
  );

  const recentUsers = useMemo(() => {
    return users
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 3);
  }, [users]);

  const isLoading = operationStatus.isLoading;

  // Store references for handler injection
  const stores = {
    usersStore,
    validationStore,
    operationStatusStore,
  };

  return {
    // Subscribed state
    users,
    validationResult,
    operationStatus,

    // Computed state
    sortedUsers,
    userStatistics,
    recentUsers,
    isLoading,

    // Store references for handlers
    stores,
  };
}

export function useUserFormData() {
  const validationStore = useUserManagementStore('validationResult');
  const operationStatusStore = useUserManagementStore('operationStatus');

  const validationResult = useStoreValue(validationStore);
  const operationStatus = useStoreValue(operationStatusStore);

  const hasErrors = validationResult && !validationResult.isValid;
  const isSubmitting = operationStatus.isLoading;

  return {
    validationResult,
    hasErrors,
    isSubmitting,
  };
}

// Export types for other layers
export type { User, UserValidationResult, UserOperationResult };
