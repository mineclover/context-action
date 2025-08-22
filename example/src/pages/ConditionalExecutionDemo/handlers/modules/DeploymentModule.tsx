import { useCallback, useEffect } from 'react';
import { useConditionalActionHandler, useConditionalStoreManager } from '../../stores';
import { mockServices } from '../../mockServices';
import { addLog } from '../../utils';
import { handlerRegistry, type HandlerModule } from '../core/HandlerRegistry';

// Module Definition
const deploymentModule: HandlerModule = {
  name: 'deployment',
  description: 'Environment-based deployment handlers for dev, staging, and production',
  category: 'deployment',
  isActive: true,
  handlers: new Map([
    ['dev-deployer', {
      id: 'dev-deployer',
      priority: 100,
      tags: ['deployment', 'development'],
      description: 'Fast deployment for development environment with hot reload',
      category: 'environment',
      environment: ['development']
    }],
    ['staging-deployer', {
      id: 'staging-deployer',
      priority: 100,
      tags: ['deployment', 'staging', 'testing'],
      description: 'Staging deployment with integration tests and preview URL',
      category: 'environment',
      environment: ['staging'],
      dependencies: ['integration-tests']
    }],
    ['prod-deployer', {
      id: 'prod-deployer',
      priority: 100,
      tags: ['deployment', 'production', 'blue-green'],
      description: 'Production deployment with comprehensive validation and blue-green strategy',
      category: 'environment',
      environment: ['production'],
      dependencies: ['production-validation', 'rollback-capability']
    }]
  ])
};

export function DeploymentModule() {
  const stores = useConditionalStoreManager();

  // Register module on mount
  useEffect(() => {
    handlerRegistry.registerModule('deployment', deploymentModule);
    return () => {
      handlerRegistry.deactivateModule('deployment');
    };
  }, []);

  // Development deployment handler
  useConditionalActionHandler('deployApplication', useCallback(async (payload, controller) => {
    if (payload.environment !== 'development') return;
    
    const startTime = performance.now();
    const logsStore = stores.getStore('logs');
    
    try {
      logsStore.update(logs => addLog(logs, 'info', '🚧 Development deployment started', { 
        version: payload.version,
        features: payload.features 
      }));
      
      const result = await mockServices.quickDeploy(payload.version);
      const deploymentResult = {
        environment: 'development',
        deploymentId: result.id,
        skipValidations: true,
        hotReload: true,
        version: payload.version,
        timestamp: Date.now()
      };
      
      const deploymentStore = stores.getStore('deploymentResults');
      deploymentStore.update(results => [...results, deploymentResult]);
      
      logsStore.update(logs => addLog(logs, 'info', '✅ Development deployment completed', deploymentResult));
      
      // Record execution stats
      const executionTime = performance.now() - startTime;
      handlerRegistry.recordExecution('dev-deployer', true, executionTime);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logsStore.update(logs => addLog(logs, 'error', '❌ Development deployment failed', { error: errorMessage }));
      
      const executionTime = performance.now() - startTime;
      handlerRegistry.recordExecution('dev-deployer', false, executionTime);
      
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
    
    const startTime = performance.now();
    const logsStore = stores.getStore('logs');
    
    try {
      logsStore.update(logs => addLog(logs, 'info', '🔄 Staging deployment started', { 
        version: payload.version,
        features: payload.features 
      }));
      
      // Run integration tests
      logsStore.update(logs => addLog(logs, 'info', '🧪 Running integration tests...'));
      const testResults = await mockServices.runIntegrationTests(payload.version);
      
      if (!testResults.allPassed) {
        const errorMsg = `Integration tests failed: ${testResults.failures.join(', ')}`;
        logsStore.update(logs => addLog(logs, 'error', errorMsg, testResults));
        
        const executionTime = performance.now() - startTime;
        handlerRegistry.recordExecution('staging-deployer', false, executionTime);
        
        controller.abort(errorMsg);
        return;
      }
      
      logsStore.update(logs => addLog(logs, 'info', '✅ Integration tests passed'));
      
      const result = await mockServices.stagingDeploy(payload.version);
      const deploymentResult = {
        environment: 'staging',
        deploymentId: result.id,
        testResults,
        previewUrl: result.previewUrl,
        version: payload.version,
        timestamp: Date.now()
      };
      
      const deploymentStore = stores.getStore('deploymentResults');
      deploymentStore.update(results => [...results, deploymentResult]);
      
      logsStore.update(logs => addLog(logs, 'info', '✅ Staging deployment completed', {
        deploymentId: result.id,
        previewUrl: result.previewUrl
      }));
      
      const executionTime = performance.now() - startTime;
      handlerRegistry.recordExecution('staging-deployer', true, executionTime);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logsStore.update(logs => addLog(logs, 'error', '❌ Staging deployment failed', { error: errorMessage }));
      
      const executionTime = performance.now() - startTime;
      handlerRegistry.recordExecution('staging-deployer', false, executionTime);
      
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
    
    const startTime = performance.now();
    const logsStore = stores.getStore('logs');
    
    try {
      logsStore.update(logs => addLog(logs, 'info', '🏭 Production deployment started', { 
        version: payload.version,
        features: payload.features 
      }));
      
      // Comprehensive validations
      logsStore.update(logs => addLog(logs, 'info', '🔍 Running production validations...'));
      const validations = await mockServices.runProductionValidations(payload);
      
      if (!validations.approved) {
        const errorMsg = `Production validation failed: ${validations.reason}`;
        logsStore.update(logs => addLog(logs, 'error', errorMsg, validations));
        
        const executionTime = performance.now() - startTime;
        handlerRegistry.recordExecution('prod-deployer', false, executionTime);
        
        controller.abort(errorMsg);
        return;
      }
      
      logsStore.update(logs => addLog(logs, 'info', '✅ Production validations passed'));
      
      // Blue-green deployment
      logsStore.update(logs => addLog(logs, 'info', '🔵🟢 Starting blue-green deployment...'));
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
      
      const deploymentStore = stores.getStore('deploymentResults');
      deploymentStore.update(results => [...results, deploymentResult]);
      
      logsStore.update(logs => addLog(logs, 'info', '✅ Production deployment completed', {
        deploymentId: result.id,
        rollbackId: result.rollbackId,
        strategy: 'blue-green'
      }));
      
      const executionTime = performance.now() - startTime;
      handlerRegistry.recordExecution('prod-deployer', true, executionTime);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logsStore.update(logs => addLog(logs, 'error', '❌ Production deployment failed', { error: errorMessage }));
      
      const executionTime = performance.now() - startTime;
      handlerRegistry.recordExecution('prod-deployer', false, executionTime);
      
      controller.abort(`Production deployment failed: ${errorMessage}`);
    }
  }, [stores]), {
    priority: 100,
    id: 'prod-deployer',
    tags: ['deployment', 'production', 'blue-green']
  });

  return null;
}