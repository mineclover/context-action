import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { createActionContext, createDeclarativeStorePattern, useStoreValue } from '@context-action/react';

interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  environment: 'development' | 'staging' | 'production';
  userGroup?: 'beta' | 'premium' | 'all';
}

interface UserContext {
  id: string;
  group: 'beta' | 'premium' | 'standard';
  environment: 'development' | 'staging' | 'production';
}

interface FeatureActions {
  checkFeature: { featureKey: string; userContext: UserContext };
  toggleFeature: { featureKey: string };
  executeFeature: { featureKey: string; userContext: UserContext };
}

const { Provider: FeatureActionProvider, useActionDispatch: useFeatureAction, useActionHandler: useFeatureHandler } = createActionContext<FeatureActions>('FeatureToggle');

const { Provider: FeatureStoreProvider, useStore: useFeatureStore } = createDeclarativeStorePattern('FeatureToggle', {
  features: { 
    initialValue: {
      'advanced-analytics': {
        key: 'advanced-analytics',
        name: 'Advanced Analytics Dashboard',
        description: 'Enhanced analytics with real-time charts',
        enabled: true,
        environment: 'production' as const,
        userGroup: 'premium' as const
      },
      'beta-ui': {
        key: 'beta-ui',
        name: 'Beta UI Components',
        description: 'New experimental user interface',
        enabled: true,
        environment: 'staging' as const,
        userGroup: 'beta' as const
      },
      'ai-suggestions': {
        key: 'ai-suggestions',
        name: 'AI-Powered Suggestions',
        description: 'Machine learning recommendations',
        enabled: false,
        environment: 'development' as const,
        userGroup: 'all' as const
      }
    } as Record<string, FeatureFlag>
  },
  featureChecks: { initialValue: [] as Array<{ feature: string; allowed: boolean; reason: string; timestamp: number }> },
  executionLogs: { initialValue: [] as Array<{ feature: string; executed: boolean; reason: string; timestamp: number }> }
});

function FeatureToggleContent() {
  const dispatch = useFeatureAction();
  
  const featuresStore = useFeatureStore('features');
  const featureChecksStore = useFeatureStore('featureChecks');
  const executionLogsStore = useFeatureStore('executionLogs');
  
  const [selectedUser, setSelectedUser] = useState<UserContext>({
    id: 'user123',
    group: 'standard',
    environment: 'production'
  });
  
  useFeatureHandler('checkFeature', useCallback(async (payload, controller) => {
    const { featureKey, userContext } = payload;
    const features = featuresStore.getValue();
    const feature = features[featureKey];
    
    if (!feature) {
      controller.abort(`Feature '${featureKey}' not found`);
      return;
    }
    
    let allowed = false;
    let reason = '';
    
    if (!feature.enabled) {
      reason = 'Feature is disabled globally';
    } else if (feature.environment !== userContext.environment) {
      reason = `Feature only available in ${feature.environment}, user is in ${userContext.environment}`;
    } else if (feature.userGroup && feature.userGroup !== 'all' && feature.userGroup !== userContext.group) {
      reason = `Feature requires ${feature.userGroup} group, user is ${userContext.group}`;
    } else {
      allowed = true;
      reason = 'Feature access granted';
    }
    
    const checkResult = {
      feature: featureKey,
      allowed,
      reason,
      timestamp: Date.now()
    };
    
    const currentChecks = featureChecksStore.getValue();
    featureChecksStore.setValue([checkResult, ...currentChecks].slice(0, 10));
    
  }, [featuresStore, featureChecksStore]));
  
  useFeatureHandler('executeFeature', useCallback(async (payload, controller) => {
    const { featureKey, userContext } = payload;
    const features = featuresStore.getValue();
    const feature = features[featureKey];
    
    if (!feature) {
      controller.abort(`Feature '${featureKey}' not found`);
      return;
    }
    
    let allowed = false;
    let reason = '';
    
    if (!feature.enabled) {
      reason = 'Feature is disabled globally';
    } else if (feature.environment !== userContext.environment) {
      reason = `Feature only available in ${feature.environment}, user is in ${userContext.environment}`;
    } else if (feature.userGroup && feature.userGroup !== 'all' && feature.userGroup !== userContext.group) {
      reason = `Feature requires ${feature.userGroup} group, user is ${userContext.group}`;
    } else {
      allowed = true;
      reason = 'Feature access granted';
    }
    
    if (!allowed) {
      const executionLog = {
        feature: featureKey,
        executed: false,
        reason: `Execution blocked: ${reason}`,
        timestamp: Date.now()
      };
      
      const currentLogs = executionLogsStore.getValue();
      executionLogsStore.setValue([executionLog, ...currentLogs].slice(0, 10));
      
      return;
    }
    
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const executionLog = {
      feature: featureKey,
      executed: true,
      reason: `Feature '${featureKey}' executed successfully`,
      timestamp: Date.now()
    };
    
    const currentLogs = executionLogsStore.getValue();
    executionLogsStore.setValue([executionLog, ...currentLogs].slice(0, 10));
    
  }, [featuresStore, executionLogsStore]));
  
  useFeatureHandler('toggleFeature', useCallback(async (payload, controller) => {
    const { featureKey } = payload;
    const features = featuresStore.getValue();
    const feature = features[featureKey];
    
    if (!feature) {
      controller.abort(`Feature '${featureKey}' not found`);
      return;
    }
    
    const updatedFeature = { ...feature, enabled: !feature.enabled };
    featuresStore.setValue({
      ...features,
      [featureKey]: updatedFeature
    });
    
  }, [featuresStore]));
  
  const features = useStoreValue(featuresStore);
  const featureChecks = useStoreValue(featureChecksStore);
  const executionLogs = useStoreValue(executionLogsStore);
  
  const handleCheckFeature = useCallback((featureKey: string) => {
    dispatch('checkFeature', { featureKey, userContext: selectedUser });
  }, [dispatch, selectedUser]);
  
  const handleExecuteFeature = useCallback((featureKey: string) => {
    dispatch('executeFeature', { featureKey, userContext: selectedUser });
  }, [dispatch, selectedUser]);
  
  const handleToggleFeature = useCallback((featureKey: string) => {
    dispatch('toggleFeature', { featureKey });
  }, [dispatch]);
  
  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link to="/actionguard/conditional" className="text-blue-600 hover:text-blue-800 underline text-sm">
            ← Back to Conditional Patterns
          </Link>
        </div>
        
        <h1 className="text-4xl font-bold mb-4">🎛️ Feature Toggle Pattern</h1>
        <p className="text-xl text-gray-600 mb-4">
          Conditional feature execution based on environment and user context
        </p>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
          <p className="text-sm text-green-800">
            <strong>Conditional Features:</strong> This pattern demonstrates how actions can conditionally execute 
            features based on environment settings, user groups, and feature flags.
          </p>
        </div>
      </div>
      
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">👤 User Context</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                <input
                  type="text"
                  value={selectedUser.id}
                  onChange={(e) => setSelectedUser({ ...selectedUser, id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">User Group</label>
                <select
                  value={selectedUser.group}
                  onChange={(e) => setSelectedUser({ ...selectedUser, group: e.target.value as UserContext['group'] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="standard">Standard</option>
                  <option value="premium">Premium</option>
                  <option value="beta">Beta Tester</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Environment</label>
                <select
                  value={selectedUser.environment}
                  onChange={(e) => setSelectedUser({ ...selectedUser, environment: e.target.value as UserContext['environment'] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="development">Development</option>
                  <option value="staging">Staging</option>
                  <option value="production">Production</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">📊 Feature Checks</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {featureChecks.length === 0 ? (
                <p className="text-gray-500 text-sm">No feature checks yet</p>
              ) : (
                featureChecks.map((check, index) => (
                  <div key={index} className={`p-2 rounded text-sm ${
                    check.allowed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    <div className="font-medium">{check.feature}</div>
                    <div className="text-xs">{check.reason}</div>
                    <div className="text-xs opacity-70">{new Date(check.timestamp).toLocaleTimeString()}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">🎛️ Feature Management</h2>
            
            <div className="space-y-4">
              {Object.values(features).map((feature) => (
                <div key={feature.key} className={`border rounded-lg p-4 ${
                  feature.enabled ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">{feature.name}</h3>
                        <div className={`px-2 py-1 rounded text-xs ${
                          feature.enabled ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'
                        }`}>
                          {feature.enabled ? 'ENABLED' : 'DISABLED'}
                        </div>
                        <div className={`px-2 py-1 rounded text-xs ${
                          feature.environment === 'production' ? 'bg-blue-500 text-white' :
                          feature.environment === 'staging' ? 'bg-yellow-500 text-white' :
                          'bg-purple-500 text-white'
                        }`}>
                          {feature.environment.toUpperCase()}
                        </div>
                        {feature.userGroup && feature.userGroup !== 'all' && (
                          <div className="px-2 py-1 rounded text-xs bg-orange-500 text-white">
                            {feature.userGroup.toUpperCase()}
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{feature.description}</p>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleCheckFeature(feature.key)}
                          className="bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded text-sm font-medium transition-colors"
                        >
                          🔍 Check Access
                        </button>
                        
                        <button
                          onClick={() => handleExecuteFeature(feature.key)}
                          className="bg-purple-600 hover:bg-purple-700 text-white py-1 px-3 rounded text-sm font-medium transition-colors"
                        >
                          ⚡ Execute
                        </button>
                        
                        <button
                          onClick={() => handleToggleFeature(feature.key)}
                          className={`py-1 px-3 rounded text-sm font-medium transition-colors ${
                            feature.enabled
                              ? 'bg-red-600 hover:bg-red-700 text-white'
                              : 'bg-green-600 hover:bg-green-700 text-white'
                          }`}
                        >
                          {feature.enabled ? '🔴 Disable' : '🟢 Enable'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">📋 Execution Logs</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {executionLogs.length === 0 ? (
                <p className="text-gray-500 text-sm">No executions yet</p>
              ) : (
                executionLogs.map((log, index) => (
                  <div key={index} className={`p-3 rounded border ${
                    log.executed 
                      ? 'bg-green-50 border-green-200 text-green-800' 
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="font-medium">
                        {log.executed ? '✅ Executed' : '❌ Blocked'}: {log.feature}
                      </div>
                      <div className="text-xs opacity-70">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                    <div className="text-sm mt-1">{log.reason}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">🔍 Conditional Logic Examples</h3>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div className="bg-white p-4 rounded">
            <h4 className="font-medium text-green-700 mb-2">Environment Check</h4>
            <p className="text-gray-700">Features conditionally execute based on deployment environment (dev/staging/prod)</p>
          </div>
          <div className="bg-white p-4 rounded">
            <h4 className="font-medium text-green-700 mb-2">User Group Check</h4>
            <p className="text-gray-700">Features conditionally available to specific user groups (beta/premium/all)</p>
          </div>
          <div className="bg-white p-4 rounded">
            <h4 className="font-medium text-green-700 mb-2">Feature Toggle</h4>
            <p className="text-gray-700">Global feature enable/disable controls conditional execution</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function FeatureToggle() {
  return (
    <FeatureActionProvider>
      <FeatureStoreProvider>
        <FeatureToggleContent />
      </FeatureStoreProvider>
    </FeatureActionProvider>
  );
}