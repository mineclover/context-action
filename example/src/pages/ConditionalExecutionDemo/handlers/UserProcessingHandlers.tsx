import { useCallback } from 'react';
import { useConditionalActionHandler, useConditionalStoreManager } from '../stores';
import { mockServices } from '../mockServices';
import { addLog } from '../utils';

export function UserProcessingHandlers() {
  const stores = useConditionalStoreManager();
  
  // Basic user processing
  useConditionalActionHandler('processUser', useCallback(async (payload, controller) => {
    const logsStore = stores.getStore('logs');
    logsStore.update(logs => addLog(logs, 'info', '👤 Basic user processing started', { userId: payload.userId }));
    
    try {
      const userData = await mockServices.getBasicUserData(payload.userId);
      
      const result = {
        step: 'basic-processing',
        userId: payload.userId,
        data: userData,
        timestamp: Date.now()
      };
      
      // Store basic user data for enhanced processing handler
      const basicDataStore = stores.getStore('basicUserData');
      basicDataStore.setValue(result);
      
      const userStore = stores.getStore('userProcessingResults');
      userStore.update(results => [...results, { ...result, processed: true, enhanced: false }]);
      
      logsStore.update(logs => addLog(logs, 'info', '✅ Basic user processing completed', result));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logsStore.update(logs => addLog(logs, 'error', '❌ Basic user processing failed', { error: errorMessage }));
      controller.abort(`Basic user processing failed: ${errorMessage}`);
    }
  }, [stores]), {
    priority: 100,
    id: 'basic-processor',
    tags: ['user', 'basic']
  });

  // Enhanced processing (feature-gated)
  useConditionalActionHandler('processUser', useCallback(async (payload, controller) => {
    const featureFlagsStore = stores.getStore('featureFlags');
    const featureFlags = featureFlagsStore.getValue();
    const logsStore = stores.getStore('logs');
    
    // Check feature flag
    const featureEnabled = featureFlags['enhanced-user-processing'];
    
    if (!featureEnabled) {
      logsStore.update(logs => addLog(logs, 'warning', 'Enhanced processing disabled, skipping...', { feature: 'enhanced-user-processing' }));
      return;
    }
    
    logsStore.update(logs => addLog(logs, 'info', '🚀 Enhanced user processing started', { userId: payload.userId }));
    
    try {
      const basicDataStore = stores.getStore('basicUserData');
      const basicResult = basicDataStore.getValue();
      
      if (!basicResult) {
        const errorMsg = 'Basic processing required for enhancement';
        logsStore.update(logs => addLog(logs, 'error', errorMsg));
        controller.abort(errorMsg);
        return;
      }
      
      const enhancedData = await mockServices.enhanceUserData(basicResult.data);
      
      const result = {
        step: 'enhanced-processing',
        userId: payload.userId,
        enhancedData,
        enhancementType: 'advanced-analytics',
        timestamp: Date.now()
      };
      
      // Store result for handler coordination
      
      const userStore = stores.getStore('userProcessingResults');
      userStore.update(results => {
        const updatedResults = [...results];
        const lastIndex = updatedResults.length - 1;
        if (lastIndex >= 0) {
          updatedResults[lastIndex] = { ...updatedResults[lastIndex], enhanced: true, enhancedData };
        }
        return updatedResults;
      });
      
      logsStore.update(logs => addLog(logs, 'info', '✅ Enhanced user processing completed', result));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logsStore.update(logs => addLog(logs, 'error', '❌ Enhanced user processing failed', { error: errorMessage }));
      controller.abort(`Enhanced user processing failed: ${errorMessage}`);
    }
  }, [stores]), {
    priority: 80,
    id: 'enhanced-processor',
    tags: ['user', 'enhanced', 'analytics']
  });

  return null;
}