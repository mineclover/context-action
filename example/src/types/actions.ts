/**
 * Common action types for example application
 */

import { ActionPayloadMap } from '@context-action/core';

/**
 * Application-wide action definitions
 */
export interface AppActions extends ActionPayloadMap {
  // Search actions
  search: { query: string };
  
  // User data actions
  fetchUserData: { userId: string };
  loadUserPreferences: { userId: string };
  loadUserNotifications: { userId: string };
  
  // Data manipulation
  updateUser: { id: string; name: string; email?: string };
  deleteUser: { id: string };
  
  // UI actions
  toggleTheme: void;
  showNotification: { message: string; type: 'info' | 'success' | 'error' };
  
  // Form actions
  submitForm: { formId: string; data: Record<string, any> };
  validateField: { fieldName: string; value: any };
}