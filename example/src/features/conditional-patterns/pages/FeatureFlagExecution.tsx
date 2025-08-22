import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStoreValue } from '@context-action/react';
import { 
  ConditionalStoreProvider, 
  ConditionalActionProvider,
  useConditionalStore,
  useConditionalAction,
  useConditionalActionHandler,
  useConditionalStoreManager
} from '../stores';
import { mockServices } from '../mockServices';
import { addLog } from '../utils';

function FeatureFlagHandlers() {
  const stores = useConditionalStoreManager();

  // Basic User Processing (Always runs)
  useConditionalActionHandler('processUser', async (payload, controller) => {
    const logsStore = stores.getStore('logs');
    logsStore.update(logs => addLog(logs, 'info', '👤 Starting basic user processing', { 
      userId: payload.userId,
      operation: payload.operation 
    }));
    
    try {
      const userData = await mockServices.getBasicUserData(payload.userId);
      
      const basicResult = {
        step: 'basic-processing',
        userId: payload.userId,
        data: userData,
        processed: true,
        enhanced: false,
        timestamp: Date.now()
      };
      
      // Store result for coordination
      const basicDataStore = stores.getStore('basicUserData');
      basicDataStore.setValue(userData);
      
      const resultsStore = stores.getStore('userProcessingResults');
      resultsStore.update(results => [...results, basicResult]);
      
      logsStore.update(logs => addLog(logs, 'info', '✅ Basic user processing completed', userData));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logsStore.update(logs => addLog(logs, 'error', '❌ Basic processing failed', { error: errorMessage }));
      controller.abort(`Basic processing failed: ${errorMessage}`);
    }
  }, {
    priority: 100,
    id: 'basic-processor',
    tags: ['user', 'basic']
  });

  // Enhanced Processing (Feature-gated)
  useConditionalActionHandler('processUser', async (payload, controller) => {
    const logsStore = stores.getStore('logs');
    const featureFlagsStore = stores.getStore('featureFlags');
    const featureFlags = featureFlagsStore.getValue();
    
    // Check feature flag
    if (!featureFlags['enhanced-user-processing']) {
      logsStore.update(logs => addLog(logs, 'warning', '⚠️ Enhanced processing disabled by feature flag'));
      return; // Skip enhanced processing
    }
    
    logsStore.update(logs => addLog(logs, 'info', '✨ Enhanced processing enabled, starting...'));
    
    try {
      // Get basic data from previous handler
      const basicDataStore = stores.getStore('basicUserData');
      const basicData = basicDataStore.getValue();
      
      if (!basicData) {
        logsStore.update(logs => addLog(logs, 'error', '❌ Basic data required for enhancement'));
        return;
      }
      
      const enhancedData = await mockServices.enhanceUserData(basicData);
      
      const enhancedResult = {
        step: 'enhanced-processing',
        userId: payload.userId,
        data: basicData,
        enhancedData,
        processed: true,
        enhanced: true,
        timestamp: Date.now()
      };
      
      const resultsStore = stores.getStore('userProcessingResults');
      resultsStore.update(results => [...results, enhancedResult]);
      
      logsStore.update(logs => addLog(logs, 'info', '✅ Enhanced processing completed', {
        analytics: enhancedData.analytics,
        recommendations: enhancedData.recommendations
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logsStore.update(logs => addLog(logs, 'error', '❌ Enhanced processing failed', { error: errorMessage }));
      // Don't abort - enhanced processing is optional
    }
  }, {
    priority: 80,
    id: 'enhanced-processor',
    tags: ['user', 'enhanced', 'analytics']
  });

  // Experimental Features (Feature-gated)
  useConditionalActionHandler('processUser', async (payload, controller) => {
    const logsStore = stores.getStore('logs');
    const featureFlagsStore = stores.getStore('featureFlags');
    const featureFlags = featureFlagsStore.getValue();
    
    if (!featureFlags['experimental-features']) {
      logsStore.update(logs => addLog(logs, 'info', '🔬 Experimental features disabled'));
      return;
    }
    
    logsStore.update(logs => addLog(logs, 'info', '🔬 Running experimental features...'));
    
    // Simulate experimental processing
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const experimentalResult = {
      step: 'experimental',
      userId: payload.userId,
      experiments: ['ml-predictions', 'quantum-processing'],
      timestamp: Date.now()
    };
    
    const resultsStore = stores.getStore('userProcessingResults');
    resultsStore.update(results => [...results, experimentalResult]);
    
    logsStore.update(logs => addLog(logs, 'info', '✅ Experimental features completed', experimentalResult));
  }, {
    priority: 60,
    id: 'experimental-processor',
    tags: ['user', 'experimental']
  });

  return null;
}

function FeatureFlagControls() {
  const featureFlagsStore = useConditionalStore('featureFlags');
  const featureFlags = useStoreValue(featureFlagsStore);
  const dispatch = useConditionalAction();
  const [userId, setUserId] = useState('user-123');

  const toggleFeature = (flag: string) => {
    featureFlagsStore.update(flags => ({
      ...flags,
      [flag]: !flags[flag]
    }));
  };

  const handleProcessUser = () => {
    dispatch('processUser', {
      userId,
      operation: 'profile-update'
    });
  };

  const features = [
    {
      key: 'enhanced-user-processing',
      name: 'Enhanced User Processing',
      description: 'Adds analytics and recommendations',
      icon: '✨'
    },
    {
      key: 'experimental-features',
      name: 'Experimental Features',
      description: 'ML predictions and quantum processing',
      icon: '🔬'
    },
    {
      key: 'advanced-analytics',
      name: 'Advanced Analytics',
      description: 'Deep user behavior analysis',
      icon: '📊'
    },
    {
      key: 'blue-green-deployment',
      name: 'Blue-Green Deployment',
      description: 'Advanced deployment strategy',
      icon: '🔵'
    }
  ];

  return (
    <div className="bg-white border rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">🎯 Feature Flag Configuration</h3>
      
      <div className="space-y-4 mb-6">
        {features.map(feature => (
          <div key={feature.key} className="flex items-start justify-between p-3 border rounded-lg hover:bg-gray-50">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xl">{feature.icon}</span>
                <h4 className="font-medium">{feature.name}</h4>
              </div>
              <p className="text-sm text-gray-600 mt-1">{feature.description}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={featureFlags[feature.key] || false}
                onChange={() => toggleFeature(feature.key)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
              <span className="ml-2 text-sm font-medium text-gray-900">
                {featureFlags[feature.key] ? 'ON' : 'OFF'}
              </span>
            </label>
          </div>
        ))}
      </div>

      <div className="border-t pt-4">
        <label className="block text-sm font-medium mb-2">User ID to Process</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="flex-1 border rounded px-3 py-2"
          />
          <button
            onClick={() => setUserId(`user-${Math.floor(Math.random() * 1000)}`)}
            className="bg-gray-500 text-white px-3 py-2 rounded hover:bg-gray-600"
          >
            Random
          </button>
        </div>
        
        <button 
          onClick={handleProcessUser}
          className="w-full mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Process User with Current Flags
        </button>
      </div>
    </div>
  );
}

function FeatureFlagResults() {
  const resultsStore = useConditionalStore('userProcessingResults');
  const results = useStoreValue(resultsStore);
  const featureFlagsStore = useConditionalStore('featureFlags');
  const featureFlags = useStoreValue(featureFlagsStore);

  const getStepIcon = (step: string) => {
    switch (step) {
      case 'basic-processing': return '👤';
      case 'enhanced-processing': return '✨';
      case 'experimental': return '🔬';
      default: return '📊';
    }
  };

  const getStepColor = (enhanced: boolean) => {
    return enhanced ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200';
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Processing Pipeline */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">🔄 Processing Pipeline</h3>
        
        <div className="space-y-3">
          {/* Basic Processing */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              👤
            </div>
            <div className="flex-1">
              <div className="font-medium">Basic Processing</div>
              <div className="text-sm text-gray-600">Always runs</div>
            </div>
            <div className="text-sm font-medium text-green-600">✓ Active</div>
          </div>

          {/* Arrow */}
          <div className="ml-5 text-gray-400">↓</div>

          {/* Enhanced Processing */}
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              featureFlags['enhanced-user-processing'] ? 'bg-green-100' : 'bg-gray-100'
            }`}>
              ✨
            </div>
            <div className="flex-1">
              <div className="font-medium">Enhanced Processing</div>
              <div className="text-sm text-gray-600">Feature: enhanced-user-processing</div>
            </div>
            <div className={`text-sm font-medium ${
              featureFlags['enhanced-user-processing'] ? 'text-green-600' : 'text-gray-400'
            }`}>
              {featureFlags['enhanced-user-processing'] ? '✓ Active' : '✗ Disabled'}
            </div>
          </div>

          {/* Arrow */}
          <div className="ml-5 text-gray-400">↓</div>

          {/* Experimental Features */}
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              featureFlags['experimental-features'] ? 'bg-purple-100' : 'bg-gray-100'
            }`}>
              🔬
            </div>
            <div className="flex-1">
              <div className="font-medium">Experimental Features</div>
              <div className="text-sm text-gray-600">Feature: experimental-features</div>
            </div>
            <div className={`text-sm font-medium ${
              featureFlags['experimental-features'] ? 'text-purple-600' : 'text-gray-400'
            }`}>
              {featureFlags['experimental-features'] ? '✓ Active' : '✗ Disabled'}
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">📊 Processing Results</h3>
        
        {results.length === 0 ? (
          <p className="text-gray-500 text-sm">No results yet. Process a user to see feature flag effects.</p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {results.slice(-5).reverse().map((result: any, index: number) => (
              <div key={index} className={`border rounded-lg p-3 ${getStepColor(result.enhanced)}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getStepIcon(result.step)}</span>
                    <div>
                      <div className="font-medium capitalize">{result.step.replace('-', ' ')}</div>
                      <div className="text-xs text-gray-600">User: {result.userId}</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(result.timestamp).toLocaleTimeString()}
                  </div>
                </div>
                
                {result.enhanced && (
                  <div className="text-xs text-green-600">
                    ✅ Enhanced features applied
                  </div>
                )}
                
                {result.experiments && (
                  <div className="text-xs text-purple-600">
                    🔬 Experiments: {result.experiments.join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FeatureFlagExecutionContent() {
  const logsStore = useConditionalStore('logs');
  const logs = useStoreValue(logsStore);

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Link 
            to="/actionguard/conditional" 
            className="text-blue-600 hover:text-blue-800 underline text-sm"
          >
            ← Back to Conditional Execution
          </Link>
          <Link 
            to="/" 
            className="text-gray-600 hover:text-gray-800 underline text-sm"
          >
            🏠 Home
          </Link>
        </div>
        
        <h1 className="text-3xl font-bold mb-2">🎯 Feature Flag Integration</h1>
        <p className="text-gray-600">
          Runtime feature control with gradual rollouts and graceful degradation.
        </p>
      </div>

      {/* Key Concept */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-green-900 mb-3">🎯 Key Concept</h2>
        <p className="text-green-800 mb-3">
          Handlers check feature state at runtime and skip execution when disabled.
          This enables safe feature rollouts without code deployment.
        </p>
        <div className="bg-white rounded p-4">
          <pre className="text-sm text-gray-800">
{`// Feature-gated handler pattern
useActionHandler('processUser', async (payload, controller) => {
  const featureEnabled = await getFeatureFlag('enhanced-processing');
  
  if (!featureEnabled) {
    console.log('Feature disabled, skipping...');
    return; // Graceful degradation
  }
  
  // Enhanced processing only when enabled
  const enhancedData = await enhanceUserData(payload);
});`}
          </pre>
        </div>
      </div>

      <div className="space-y-6">
        {/* Controls */}
        <FeatureFlagControls />
        
        {/* Results */}
        <FeatureFlagResults />

        {/* Activity Log */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">📋 Execution Log</h3>
          
          {logs.length === 0 ? (
            <p className="text-gray-500 text-sm">No activity yet. Process a user to see feature flag effects.</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {logs.slice(-20).reverse().map((log: any, index: number) => (
                <div key={`${log.timestamp}-${index}`} className="text-xs p-2 border-l-2 hover:bg-gray-50" 
                     style={{
                       borderLeftColor: log.level === 'error' ? '#ef4444' : 
                                       log.level === 'warning' ? '#f59e0b' : '#3b82f6'
                     }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-1 py-0.5 rounded text-xs ${
                      log.level === 'error' ? 'bg-red-100 text-red-800' :
                      log.level === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {log.level}
                    </span>
                    <span className="text-gray-500">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-gray-700">{log.message}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Learning Points */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">📚 What This Demonstrates</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">✅ Benefits</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Safe feature rollouts without deployment</li>
                <li>• A/B testing capabilities</li>
                <li>• Graceful feature degradation</li>
                <li>• Progressive feature enablement</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">🔧 Use Cases</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Gradual feature rollouts</li>
                <li>• Experimental features</li>
                <li>• Premium feature gating</li>
                <li>• Emergency feature disabling</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function FeatureFlagExecution() {
  return (
    <ConditionalStoreProvider>
      <ConditionalActionProvider>
        <FeatureFlagHandlers />
        <FeatureFlagExecutionContent />
      </ConditionalActionProvider>
    </ConditionalStoreProvider>
  );
}