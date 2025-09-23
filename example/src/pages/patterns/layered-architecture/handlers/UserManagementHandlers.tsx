/**
 * Handler Logic with Injection Layer
 *
 * This layer:
 * - Registers action handlers using useActionHandler
 * - Injects latest values from context (stores)
 * - Calls pure business logic functions
 * - Handles side effects (store updates, API calls)
 * - Receives dependencies through props (DI pattern)
 */

import { ReactNode, useCallback } from 'react';
import type { Store } from '@context-action/react';
import { useRegisterSourceFile } from '../../../../hooks/useRegisterSourceFile';
import {
  useUserManagementActionHandler,
  type User,
  type UserValidationResult,
  type UserManagementStores,
} from '../contexts/UserManagementContexts';
import {
  validateUserData,
  createUserEntity,
  updateUserEntity,
  deleteUserEntity,
} from '../business/userBusinessLogic';

// 🎯 Handler Dependencies Interface
export interface UserManagementHandlerProps {
  moduleId: string;
  children: ReactNode;
  // Store Dependencies (Injected)
  usersStore: Store<User[]>;
  validationStore: Store<UserValidationResult | null>;
  operationStatusStore: Store<UserManagementStores['operationStatus']>;
  // Service Dependencies (Optional)
  apiClient?: UserApiClient;
  logger?: Logger;
  onUserCreated?: (user: User) => void;
  onUserUpdated?: (user: User) => void;
  onUserDeleted?: (user: User) => void;
}

// 🎯 External Service Interfaces
interface UserApiClient {
  saveUser: (user: User) => Promise<void>;
  updateUser: (userId: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
}

interface Logger {
  info: (message: string, data?: any) => void;
  error: (message: string, error?: any) => void;
}

/**
 * User Management Handlers Component
 *
 * Key Pattern: Handler Injection for Latest Values
 * - useActionHandler registers handlers within Context boundaries
 * - Handlers get latest values via store.getValue()
 * - Pure business logic is called with current state
 * - Side effects are handled after business logic execution
 */
export function UserManagementHandlers({
  moduleId,
  children,
  usersStore,
  validationStore,
  operationStatusStore,
  apiClient,
  logger,
  onUserCreated,
  onUserUpdated,
  onUserDeleted,
}: UserManagementHandlerProps) {
  // handlers 레이어 등록
  useRegisterSourceFile('pages/patterns/layered-architecture/handlers/UserManagementHandlers.tsx', {
    name: 'UserManagementHandlers',
    description: 'Handler logic with dependency injection for user management',
    tags: ['handlers', 'injection', 'business-logic'],
    priority: 10
  });

  // 🎯 Create User Handler
  const createUserHandler = useCallback(async (payload: {
    name: string;
    email: string;
    role: User['role'];
  }) => {
    logger?.info('Creating user', { payload });

    // Start loading state
    operationStatusStore.setValue({
      isLoading: true,
      lastOperation: 'create',
      result: null,
    });

    try {
      // 🔑 KEY: Get latest values from stores (Handler Injection)
      const currentUsers = usersStore.getValue();

      // 🔑 KEY: Call pure business logic function
      const result = createUserEntity(payload, currentUsers);

      if (result.success && result.user) {
        // Update stores with new user
        const newUsers = [...currentUsers, result.user];
        usersStore.setValue(newUsers);

        // Call external API if available
        if (apiClient) {
          await apiClient.saveUser(result.user);
        }

        // Trigger callback
        onUserCreated?.(result.user);

        logger?.info('User created successfully', { user: result.user });
      }

      // Update operation status
      operationStatusStore.setValue({
        isLoading: false,
        lastOperation: 'create',
        result,
      });
    } catch (error) {
      logger?.error('Failed to create user', error);

      operationStatusStore.setValue({
        isLoading: false,
        lastOperation: 'create',
        result: {
          success: false,
          message: 'An unexpected error occurred',
        },
      });

      throw error;
    }
  }, [
    usersStore,
    operationStatusStore,
    apiClient,
    logger,
    onUserCreated,
  ]);

  // 🎯 Update User Handler
  const updateUserHandler = useCallback(async (payload: {
    id: string;
    updates: Partial<Pick<User, 'name' | 'email' | 'role'>>;
  }) => {
    logger?.info('Updating user', { payload });

    operationStatusStore.setValue({
      isLoading: true,
      lastOperation: 'update',
      result: null,
    });

    try {
      // 🔑 KEY: Get latest values from stores
      const currentUsers = usersStore.getValue();

      // 🔑 KEY: Call pure business logic function
      const result = updateUserEntity(payload.id, payload.updates, currentUsers);

      if (result.success && result.user) {
        // Update stores
        const updatedUsers = currentUsers.map(user =>
          user.id === payload.id ? result.user! : user
        );
        usersStore.setValue(updatedUsers);

        // Call external API if available
        if (apiClient) {
          await apiClient.updateUser(payload.id, payload.updates);
        }

        // Trigger callback
        onUserUpdated?.(result.user);

        logger?.info('User updated successfully', { user: result.user });
      }

      operationStatusStore.setValue({
        isLoading: false,
        lastOperation: 'update',
        result,
      });
    } catch (error) {
      logger?.error('Failed to update user', error);

      operationStatusStore.setValue({
        isLoading: false,
        lastOperation: 'update',
        result: {
          success: false,
          message: 'An unexpected error occurred',
        },
      });

      throw error;
    }
  }, [
    usersStore,
    operationStatusStore,
    apiClient,
    logger,
    onUserUpdated,
  ]);

  // 🎯 Delete User Handler
  const deleteUserHandler = useCallback(async (payload: { id: string }) => {
    logger?.info('Deleting user', { payload });

    operationStatusStore.setValue({
      isLoading: true,
      lastOperation: 'delete',
      result: null,
    });

    try {
      // 🔑 KEY: Get latest values from stores
      const currentUsers = usersStore.getValue();

      // 🔑 KEY: Call pure business logic function
      const result = deleteUserEntity(payload.id, currentUsers);

      if (result.success && result.user) {
        // Update stores
        const updatedUsers = currentUsers.filter(user => user.id !== payload.id);
        usersStore.setValue(updatedUsers);

        // Call external API if available
        if (apiClient) {
          await apiClient.deleteUser(payload.id);
        }

        // Trigger callback
        onUserDeleted?.(result.user);

        logger?.info('User deleted successfully', { user: result.user });
      }

      operationStatusStore.setValue({
        isLoading: false,
        lastOperation: 'delete',
        result,
      });
    } catch (error) {
      logger?.error('Failed to delete user', error);

      operationStatusStore.setValue({
        isLoading: false,
        lastOperation: 'delete',
        result: {
          success: false,
          message: 'An unexpected error occurred',
        },
      });

      throw error;
    }
  }, [
    usersStore,
    operationStatusStore,
    apiClient,
    logger,
    onUserDeleted,
  ]);

  // 🎯 Validate User Handler
  const validateUserHandler = useCallback(async (payload: {
    name: string;
    email: string;
  }) => {
    logger?.info('Validating user data', { payload });

    try {
      // 🔑 KEY: Call pure business logic function (no side effects)
      const validationResult = validateUserData(payload);

      // Update validation store
      validationStore.setValue(validationResult);

      logger?.info('User validation completed', { validationResult });
    } catch (error) {
      logger?.error('Failed to validate user', error);
      throw error;
    }
  }, [validationStore, logger]);

  // 🎯 Reset Validation Handler
  const resetValidationHandler = useCallback(async () => {
    validationStore.setValue(null);
    logger?.info('Validation state reset');
  }, [validationStore, logger]);

  // 🔑 KEY: Register all handlers using useActionHandler
  // These run within the Context boundaries and have access to latest store values
  useUserManagementActionHandler('createUser', createUserHandler);
  useUserManagementActionHandler('updateUser', updateUserHandler);
  useUserManagementActionHandler('deleteUser', deleteUserHandler);
  useUserManagementActionHandler('validateUser', validateUserHandler);
  useUserManagementActionHandler('resetValidation', resetValidationHandler);

  // Return children to continue the component tree
  return <>{children}</>;
}