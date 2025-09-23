/**
 * Action Dispatch & Callbacks Layer
 *
 * This layer:
 * - Provides action dispatching functions
 * - Handles action results and callbacks
 * - Manages async action coordination
 * - Abstracts action complexities from views
 */

import { useCallback } from 'react';
import { useUserManagementAction, type User } from '../contexts/UserManagementContexts';
import { useRegisterSourceFile } from '../../../../hooks/useRegisterSourceFile';

/**
 * User Management Actions Hook
 *
 * Provides typed action dispatching functions for user management operations.
 * Each action returns a Promise with the operation result.
 */
export function useUserManagementActions() {
  // actions 레이어 등록
  useRegisterSourceFile('pages/patterns/layered-architecture/actions/useUserManagementActions.ts', {
    name: 'useUserManagementActions',
    description: 'Action dispatching functions and callback management',
    tags: ['actions', 'dispatch', 'callbacks'],
    priority: 15
  });

  const dispatch = useUserManagementAction();

  // 🎯 Create User Action
  const createUser = useCallback(async (data: {
    name: string;
    email: string;
    role: User['role'];
  }) => {
    await dispatch('createUser', data);
  }, [dispatch]);

  // 🎯 Update User Action
  const updateUser = useCallback(async (data: {
    id: string;
    updates: Partial<Pick<User, 'name' | 'email' | 'role'>>;
  }) => {
    await dispatch('updateUser', data);
  }, [dispatch]);

  // 🎯 Delete User Action
  const deleteUser = useCallback(async (userId: string) => {
    await dispatch('deleteUser', { id: userId });
  }, [dispatch]);

  // 🎯 Validate User Action
  const validateUser = useCallback(async (data: {
    name: string;
    email: string;
  }) => {
    await dispatch('validateUser', data);
  }, [dispatch]);

  // 🎯 Reset Validation Action
  const resetValidation = useCallback(async () => {
    await dispatch('resetValidation');
  }, [dispatch]);

  // 🎯 Batch Operations (Convenience Actions)
  const createAndValidateUser = useCallback(async (data: {
    name: string;
    email: string;
    role: User['role'];
  }) => {
    // First validate, then create - results tracked in stores
    await validateUser(data);
    await createUser(data);
  }, [validateUser, createUser]);

  const updateAndValidateUser = useCallback(async (data: {
    id: string;
    updates: Partial<Pick<User, 'name' | 'email' | 'role'>>;
  }) => {
    // Update - results tracked in stores
    await updateUser(data);
  }, [updateUser]);

  return {
    // Basic actions
    createUser,
    updateUser,
    deleteUser,
    validateUser,
    resetValidation,

    // Convenience actions
    createAndValidateUser,
    updateAndValidateUser,
  };
}

/**
 * User Management Action Callbacks Hook
 *
 * Provides callback-based action functions for scenarios where
 * you need to handle success/error cases explicitly.
 */
export function useUserManagementCallbacks() {
  const actions = useUserManagementActions();

  // 🎯 Create User with Callbacks
  const createUserWithCallbacks = useCallback(async (
    data: Parameters<typeof actions.createUser>[0],
    callbacks?: {
      onSuccess?: () => void;
      onError?: (error: Error) => void;
      onFinally?: () => void;
    }
  ) => {
    try {
      await actions.createUser(data);
      callbacks?.onSuccess?.();
    } catch (error) {
      callbacks?.onError?.(error as Error);
    } finally {
      callbacks?.onFinally?.();
    }
  }, [actions]);

  // 🎯 Update User with Callbacks
  const updateUserWithCallbacks = useCallback(async (
    data: Parameters<typeof actions.updateUser>[0],
    callbacks?: {
      onSuccess?: () => void;
      onError?: (error: Error) => void;
      onFinally?: () => void;
    }
  ) => {
    try {
      await actions.updateUser(data);
      callbacks?.onSuccess?.();
    } catch (error) {
      callbacks?.onError?.(error as Error);
    } finally {
      callbacks?.onFinally?.();
    }
  }, [actions]);

  // 🎯 Delete User with Callbacks
  const deleteUserWithCallbacks = useCallback(async (
    userId: string,
    callbacks?: {
      onSuccess?: () => void;
      onError?: (error: Error) => void;
      onFinally?: () => void;
    }
  ) => {
    try {
      await actions.deleteUser(userId);
      callbacks?.onSuccess?.();
    } catch (error) {
      callbacks?.onError?.(error as Error);
    } finally {
      callbacks?.onFinally?.();
    }
  }, [actions]);

  return {
    ...actions,
    createUserWithCallbacks,
    updateUserWithCallbacks,
    deleteUserWithCallbacks,
  };
}