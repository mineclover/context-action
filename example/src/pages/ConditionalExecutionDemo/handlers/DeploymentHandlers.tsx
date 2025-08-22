import { useCallback } from 'react';
import { useConditionalActionHandler, useConditionalStoreManager } from '../stores';
import { mockServices } from '../mockServices';
import { addLog } from '../utils';

export function DeploymentHandlers() {
  const stores = useConditionalStoreManager();
  
  // Development deployment handler
  useConditionalActionHandler('deployApplication', useCallback(async (payload, controller) => {
    if (payload.environment !== 'development') return;
    
    const logsStore = stores.getStore('logs');
    logsStore.update(logs => addLog(logs, 'info', '🚧 Development deployment started', { version: payload.version }));
    
    try {
      const result = await mockServices.quickDeploy(payload.version);
      const deploymentResult = {
        environment: 'development',
        deploymentId: result.id,
        skipValidations: true,
        hotReload: true,
        version: payload.version,
        timestamp: Date.now()
      };
      
      // Store result in store for other handlers to access
      
      // Update store
      const deploymentStore = stores.getStore('deploymentResults');
      deploymentStore.update(results => [...results, deploymentResult]);
      
      logsStore.update(logs => addLog(logs, 'info', '✅ Development deployment completed', deploymentResult));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logsStore.update(logs => addLog(logs, 'error', '❌ Development deployment failed', { error: errorMessage }));
      controller.abort(`Development deployment failed: ${errorMessage}`);
    }
  }, [stores]), {
    priority: 100,
    id: 'dev-deployer',
    tags: ['deployment', 'development']
  });

  // Staging deployment handler
  useConditionalActionHandler('deployApplication', useCallback(async (payload, controller) => {
    if (payload.environment !== 'staging') return;
    
    const logsStore = stores.getStore('logs');
    logsStore.update(logs => addLog(logs, 'info', '🔄 Staging deployment started', { version: payload.version }));
    
    try {
      // Run integration tests
      const testResults = await mockServices.runIntegrationTests(payload.version);
      
      if (!testResults.allPassed) {
        const errorMsg = `Integration tests failed: ${testResults.failures.join(', ')}`;
        logsStore.update(logs => addLog(logs, 'error', errorMsg, testResults));
        controller.abort(errorMsg);
        return;
      }
      
      const result = await mockServices.stagingDeploy(payload.version);
      const deploymentResult = {
        environment: 'staging',
        deploymentId: result.id,
        testResults,
        previewUrl: result.previewUrl,
        version: payload.version,
        timestamp: Date.now()
      };
      
      // Store result in store for other handlers to access
      
      const deploymentStore = stores.getStore('deploymentResults');
      deploymentStore.update(results => [...results, deploymentResult]);
      
      logsStore.update(logs => addLog(logs, 'info', '✅ Staging deployment completed', deploymentResult));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logsStore.update(logs => addLog(logs, 'error', '❌ Staging deployment failed', { error: errorMessage }));
      controller.abort(`Staging deployment failed: ${errorMessage}`);
    }
  }, [stores]), {
    priority: 100,
    id: 'staging-deployer',
    tags: ['deployment', 'staging', 'testing']
  });

  // Production deployment handler
  useConditionalActionHandler('deployApplication', useCallback(async (payload, controller) => {
    if (payload.environment !== 'production') return;
    
    const logsStore = stores.getStore('logs');
    logsStore.update(logs => addLog(logs, 'info', '🏭 Production deployment started', { version: payload.version }));
    
    try {
      // Comprehensive validations
      const validations = await mockServices.runProductionValidations(payload);
      
      if (!validations.approved) {
        const errorMsg = `Production validation failed: ${validations.reason}`;
        logsStore.update(logs => addLog(logs, 'error', errorMsg, validations));
        controller.abort(errorMsg);
        return;
      }
      
      // Blue-green deployment
      const result = await mockServices.blueGreenDeploy(payload.version);
      const deploymentResult = {
        environment: 'production',
        deploymentId: result.id,
        strategy: 'blue-green',
        validations,
        rollbackId: result.rollbackId,
        version: payload.version,
        timestamp: Date.now()
      };
      
      // Store result in store for other handlers to access
      
      const deploymentStore = stores.getStore('deploymentResults');
      deploymentStore.update(results => [...results, deploymentResult]);
      
      logsStore.update(logs => addLog(logs, 'info', '✅ Production deployment completed', deploymentResult));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logsStore.update(logs => addLog(logs, 'error', '❌ Production deployment failed', { error: errorMessage }));
      controller.abort(`Production deployment failed: ${errorMessage}`);
    }
  }, [stores]), {
    priority: 100,
    id: 'prod-deployer',
    tags: ['deployment', 'production', 'blue-green']
  });

  return null;
}