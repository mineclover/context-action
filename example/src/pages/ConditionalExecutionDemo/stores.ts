import { createActionContext, createDeclarativeStorePattern } from '@context-action/react';
import { ConditionalActions, LogEntry } from './types';

// ===== Store Setup =====
export const {
  Provider: ConditionalStoreProvider,
  useStore: useConditionalStore,
  useStoreManager: useConditionalStoreManager
} = createDeclarativeStorePattern('ConditionalDemo', {
  environment: { initialValue: 'development' as 'development' | 'staging' | 'production' },
  featureFlags: { 
    initialValue: {
      'enhanced-user-processing': true,
      'experimental-features': false,
      'advanced-analytics': true,
      'blue-green-deployment': false
    } as Record<string, boolean>
  },
  userRole: { initialValue: 'user' as 'user' | 'admin' | 'guest' },
  currentUser: { initialValue: 'user-123' },
  deploymentResults: { initialValue: [] as Array<any> },
  userProcessingResults: { initialValue: [] as Array<any> },
  systemResults: { initialValue: [] as Array<any> },
  orderResults: { initialValue: [] as Array<any> },
  scheduleResults: { initialValue: [] as Array<any> },
  logs: { initialValue: [] as Array<LogEntry> },
  
  // Coordination stores for handler communication
  basicUserData: { initialValue: null as any },
  permissionCheckResult: { initialValue: null as any },
  creditCheckResult: { initialValue: null as any }
});

// ===== Action Context =====
export const {
  Provider: ConditionalActionProvider,
  useActionDispatch: useConditionalAction,
  useActionHandler: useConditionalActionHandler
} = createActionContext<ConditionalActions>('ConditionalDemo');