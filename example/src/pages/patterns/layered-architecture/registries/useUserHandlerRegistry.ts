/**
 * Layer 4: Handler Registration Hooks (registries/)
 *
 * - Bring context and register handlers with delayed evaluation
 * - Register handlers to execute with latest values obtained through delayed evaluation
 * - Manage handler registration lifecycle
 * - Observable registration state for debugging
 */

import { useUserManagementActionHandler } from '../contexts/UserManagementContexts';
import { useUserHandlerDefinitions } from '../handlers/useUserHandlerDefinitions';

export function useUserHandlerRegistry() {
  // Get handler definitions from handlers layer
  const {
    createUserHandler,
    updateUserHandler,
    deleteUserHandler,
    validateUserHandler,
    resetValidationHandler,
  } = useUserHandlerDefinitions();

  // Register handlers with Context Action Pipeline
  // These run within the Context boundaries and have access to latest store values
  useUserManagementActionHandler('createUser', createUserHandler);
  useUserManagementActionHandler('updateUser', updateUserHandler);
  useUserManagementActionHandler('deleteUser', deleteUserHandler);
  useUserManagementActionHandler('validateUser', validateUserHandler);
  useUserManagementActionHandler('resetValidation', resetValidationHandler);

  // Return registration status for debugging/observability
  return {
    registered: true,
    handlers: [
      'createUser',
      'updateUser',
      'deleteUser',
      'validateUser',
      'resetValidation',
    ],
  };
}
