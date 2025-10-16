/**
 * Layer 5: on~ Function Generation Hooks (dispatchers/)
 *
 * - Generate on~ functions to execute subscribed actions with appropriate execution options
 * - View interface layer for action dispatching
 * - Provide execution options and configuration
 * - Used by views for user interactions
 */

import { useCallback } from 'react';
import { useUserManagementAction } from '../contexts/UserManagementContexts';

export function useUserManagementActions() {
  const dispatch = useUserManagementAction();

  // 🎯 Create User Dispatcher
  const createUser = useCallback(
    async (formData: {
      name: string;
      email: string;
      role: 'admin' | 'user' | 'guest';
    }) => {
      return await dispatch('createUser', formData);
    },
    [dispatch]
  );

  // 🎯 Update User Dispatcher
  const updateUser = useCallback(
    async (payload: {
      id: string;
      updates: Partial<{
        name: string;
        email: string;
        role: 'admin' | 'user' | 'guest';
      }>;
    }) => {
      return await dispatch('updateUser', payload);
    },
    [dispatch]
  );

  // 🎯 Delete User Dispatcher
  const deleteUser = useCallback(
    async (userId: string) => {
      return await dispatch('deleteUser', { id: userId });
    },
    [dispatch]
  );

  // 🎯 Validate User Dispatcher
  const validateUser = useCallback(
    async (data: { name: string; email: string }) => {
      return await dispatch('validateUser', data);
    },
    [dispatch]
  );

  // 🎯 Reset Validation Dispatcher
  const resetValidation = useCallback(async () => {
    return await dispatch('resetValidation');
  }, [dispatch]);

  return {
    createUser,
    updateUser,
    deleteUser,
    validateUser,
    resetValidation,
  };
}
