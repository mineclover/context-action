/**
 * Context Definitions & Types Layer
 *
 * This layer defines:
 * - TypeScript interfaces and types
 * - Action payload maps
 * - Store schemas
 * - Context creation
 */

import { ActionPayloadMap } from '@context-action/core';
import { createActionContext, createStoreContext } from '@context-action/react';

// 🎯 Domain Types
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'guest';
  createdAt: Date;
}

export interface UserValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface UserOperationResult {
  success: boolean;
  message: string;
  user?: User;
}

// 🎯 Action Payload and Result Map
export interface UserManagementActions extends ActionPayloadMap {
  createUser: {
    name: string;
    email: string;
    role: User['role'];
  };
  updateUser: {
    id: string;
    updates: Partial<Pick<User, 'name' | 'email' | 'role'>>;
  };
  deleteUser: {
    id: string;
  };
  validateUser: {
    name: string;
    email: string;
  };
  resetValidation: void;
}

// 🎯 Action Result Map for type safety
export interface UserManagementActionResults {
  createUser: UserOperationResult;
  updateUser: UserOperationResult;
  deleteUser: UserOperationResult;
  validateUser: UserValidationResult;
  resetValidation: void;
}

// 🎯 Store Schema
export interface UserManagementStores {
  users: User[];
  validationResult: UserValidationResult | null;
  operationStatus: {
    isLoading: boolean;
    lastOperation: string | null;
    result: UserOperationResult | null;
  };
}

// 🎯 Context Creation
export const {
  Provider: UserManagementActionProvider,
  useActionDispatch: useUserManagementAction,
  useActionHandler: useUserManagementActionHandler,
} = createActionContext<UserManagementActions>('UserManagement');

export const {
  Provider: UserManagementStoreProvider,
  useStore: useUserManagementStore,
} = createStoreContext('UserManagementStores', {
  users: { initialValue: [] as User[] },
  validationResult: { initialValue: null as UserValidationResult | null },
  operationStatus: {
    initialValue: {
      isLoading: false,
      lastOperation: null as string | null,
      result: null as UserOperationResult | null,
    },
  },
});
