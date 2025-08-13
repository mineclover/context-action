/**
 * Common action types for example application
 */

import type { ActionPayloadMap } from '@context-action/core';

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
  submitForm: { formId: string; data: Record<string, unknown> };
  validateField: { fieldName: string; value: unknown };

  // === CONCURRENT ACTION TEST ACTIONS ===
  // Actions for testing simultaneous execution and abort functionality
  longRunningTaskA: { taskId: string; duration: number };
  longRunningTaskB: { taskId: string; duration: number };
  longRunningTaskC: { taskId: string; duration: number };

  // Data processing actions
  processDataSet: { dataSetId: string; chunkSize: number };
  calculateResults: { inputData: number[]; complexity: number };

  // API simulation actions
  apiCallPrimary: { endpoint: string; params: Record<string, unknown> };
  apiCallSecondary: { endpoint: string; params: Record<string, unknown> };
  networkRequest: { endpoint: string; params: Record<string, unknown> };

  // Additional actions for examples
  quickTask: { taskId: string; duration: number };
  processLargeDataSet: { dataSetId: string; chunkSize: number };

  // Background job actions
  backgroundJob: { jobId: string; jobType: string; priority: number };

  // File processing actions
  uploadFile: { fileId: string; fileName: string; size: number };
  processFile: { fileId: string; processingType: string };
}
