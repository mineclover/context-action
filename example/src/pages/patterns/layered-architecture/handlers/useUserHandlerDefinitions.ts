/**
 * Layer 2: Internal Function Definition Hooks (handlers/)
 *
 * Define internal functions to be registered in pipe at appropriate timing
 * - Pre-define handler functions with delayed evaluation
 * - Implement 3-Step Store Integration: read → logic → update
 * - Use `useCallback` for memoization, access latest values via `store.getValue()`
 */

import { useCallback } from 'react';
import {
  createUserEntity,
  deleteUserEntity,
  updateUserEntity,
  validateUserData,
} from '../business/userBusinessLogic';
import { useUserManagementData } from '../subscriptions/useUserSubscriptions';

export function useUserHandlerDefinitions() {
  // Get store references from subscriptions layer
  const { stores } = useUserManagementData();

  // 🎯 Create User Handler Definition
  const createUserHandler = useCallback(
    async (payload: {
      name: string;
      email: string;
      role: 'admin' | 'user' | 'guest';
    }) => {
      // Step 1: Read current state (delayed evaluation)
      const currentUsers = stores.usersStore.getValue();

      // Step 2: Execute business logic
      const result = createUserEntity(payload, currentUsers);

      // Step 3: Update stores
      if (result.success && result.user) {
        const newUsers = [...currentUsers, result.user];
        stores.usersStore.setValue(newUsers);
      }

      // Update operation status
      stores.operationStatusStore.setValue({
        isLoading: false,
        lastOperation: 'create',
        result,
      });
    },
    [stores.usersStore, stores.operationStatusStore]
  );

  // 🎯 Update User Handler Definition
  const updateUserHandler = useCallback(
    async (payload: {
      id: string;
      updates: Partial<{
        name: string;
        email: string;
        role: 'admin' | 'user' | 'guest';
      }>;
    }) => {
      // Step 1: Read current state (delayed evaluation)
      const currentUsers = stores.usersStore.getValue();

      // Step 2: Execute business logic
      const result = updateUserEntity(
        payload.id,
        payload.updates,
        currentUsers
      );

      // Step 3: Update stores
      if (result.success && result.user) {
        const updatedUsers = currentUsers.map((user) =>
          user.id === payload.id ? result.user! : user
        );
        stores.usersStore.setValue(updatedUsers);
      }

      // Update operation status
      stores.operationStatusStore.setValue({
        isLoading: false,
        lastOperation: 'update',
        result,
      });
    },
    [stores.usersStore, stores.operationStatusStore]
  );

  // 🎯 Delete User Handler Definition
  const deleteUserHandler = useCallback(
    async (payload: { id: string }) => {
      // Step 1: Read current state (delayed evaluation)
      const currentUsers = stores.usersStore.getValue();

      // Step 2: Execute business logic
      const result = deleteUserEntity(payload.id, currentUsers);

      // Step 3: Update stores
      if (result.success && result.user) {
        const updatedUsers = currentUsers.filter(
          (user) => user.id !== payload.id
        );
        stores.usersStore.setValue(updatedUsers);
      }

      // Update operation status
      stores.operationStatusStore.setValue({
        isLoading: false,
        lastOperation: 'delete',
        result,
      });
    },
    [stores.usersStore, stores.operationStatusStore]
  );

  // 🎯 Validate User Handler Definition
  const validateUserHandler = useCallback(
    async (payload: { name: string; email: string }) => {
      // Pure business logic function (no side effects)
      const validationResult = validateUserData(payload);

      // Update validation store
      stores.validationStore.setValue(validationResult);
    },
    [stores.validationStore]
  );

  // 🎯 Reset Validation Handler Definition
  const resetValidationHandler = useCallback(async () => {
    stores.validationStore.setValue(null);
  }, [stores.validationStore]);

  return {
    createUserHandler,
    updateUserHandler,
    deleteUserHandler,
    validateUserHandler,
    resetValidationHandler,
  };
}
