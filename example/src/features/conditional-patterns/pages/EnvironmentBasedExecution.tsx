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

function EnvironmentHandlers() {
  const stores = useConditionalStoreManager();

  // Development Handler
  useConditionalActionHandler('deployApplication', async (payload, controller) => {
    if (payload.environment !== 'development') return;
    
    const logsStore = stores.getStore('logs');
    logsStore.update(logs => addLog(logs, 'info', '🚧 Development deployment started', { 
      version: payload.version,
      features: payload.features 
    }));
    
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
      
      const deploymentStore = stores.getStore('deploymentResults');
      deploymentStore.update(results => [...results, deploymentResult]);
      
      logsStore.update(logs => addLog(logs, 'info', '✅ Development deployment completed', deploymentResult));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logsStore.update(logs => addLog(logs, 'error', '❌ Development deployment failed', { error: errorMessage }));
      controller.abort(`Development deployment failed: ${errorMessage}`);
    }
  }, {
    priority: 100,
    id: 'dev-deployer',
    tags: ['deployment', 'development']
  });

  // Staging Handler
  useConditionalActionHandler('deployApplication', async (payload, controller) => {
    if (payload.environment !== 'staging') return;
    
    const logsStore = stores.getStore('logs');
    logsStore.update(logs => addLog(logs, 'info', '🔄 Staging deployment started', { 
      version: payload.version,
      features: payload.features 
    }));
    
    try {
      // Integration tests
      logsStore.update(logs => addLog(logs, 'info', '🧪 Running integration tests...'));
      const testResults = await mockServices.runIntegrationTests(payload.version);
      
      if (!testResults.allPassed) {
        const errorMsg = `Integration tests failed: ${testResults.failures.join(', ')}`;
        logsStore.update(logs => addLog(logs, 'error', errorMsg, testResults));
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
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logsStore.update(logs => addLog(logs, 'error', '❌ Staging deployment failed', { error: errorMessage }));
      controller.abort(`Staging deployment failed: ${errorMessage}`);
    }
  }, {
    priority: 100,
    id: 'staging-deployer',
    tags: ['deployment', 'staging', 'testing']
  });

  // Production Handler
  useConditionalActionHandler('deployApplication', async (payload, controller) => {
    if (payload.environment !== 'production') return;
    
    const logsStore = stores.getStore('logs');
    logsStore.update(logs => addLog(logs, 'info', '🏭 Production deployment started', { 
      version: payload.version,
      features: payload.features 
    }));
    
    try {
      // Comprehensive validations
      logsStore.update(logs => addLog(logs, 'info', '🔍 Running production validations...'));
      const validations = await mockServices.runProductionValidations(payload);
      
      if (!validations.approved) {
        const errorMsg = `Production validation failed: ${validations.reason}`;
        logsStore.update(logs => addLog(logs, 'error', errorMsg, validations));
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
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logsStore.update(logs => addLog(logs, 'error', '❌ Production deployment failed', { error: errorMessage }));
      controller.abort(`Production deployment failed: ${errorMessage}`);
    }
  }, {
    priority: 100,
    id: 'prod-deployer',
    tags: ['deployment', 'production', 'blue-green']
  });

  return null;
}

function EnvironmentControls() {
  const environmentStore = useConditionalStore('environment');
  const environment = useStoreValue(environmentStore);
  const dispatch = useConditionalAction();
  const [version, setVersion] = useState('1.0.0');
  const [features, setFeatures] = useState(['feature-a', 'feature-b']);

  const handleDeploy = () => {
    dispatch('deployApplication', {
      version,
      environment,
      features
    });
  };

  const generateVersion = () => {
    const major = Math.floor(Math.random() * 3) + 1;
    const minor = Math.floor(Math.random() * 10);
    const patch = Math.floor(Math.random() * 20);
    setVersion(`${major}.${minor}.${patch}`);
  };

  return (
    <div className="bg-white border rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">🚀 Deployment Configuration</h3>
      
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-2">Target Environment</label>
          <select 
            value={environment} 
            onChange={(e) => environmentStore.setValue(e.target.value as any)}
            className="w-full border rounded px-3 py-2"
          >
            <option value="development">Development</option>
            <option value="staging">Staging</option>
            <option value="production">Production</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Version</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              className="flex-1 border rounded px-3 py-2"
            />
            <button
              onClick={generateVersion}
              className="bg-gray-500 text-white px-3 py-2 rounded hover:bg-gray-600"
            >
              Random
            </button>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Features to Deploy</label>
        <div className="flex flex-wrap gap-2">
          {['feature-a', 'feature-b', 'feature-c', 'security-patch', 'performance-boost'].map(feat => (
            <label key={feat} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={features.includes(feat)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setFeatures([...features, feat]);
                  } else {
                    setFeatures(features.filter(f => f !== feat));
                  }
                }}
              />
              <span className="text-sm">{feat}</span>
            </label>
          ))}
        </div>
      </div>

      <button 
        onClick={handleDeploy}
        className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Deploy to {environment}
      </button>
    </div>
  );
}

function EnvironmentComparisonTable() {
  const deploymentStore = useConditionalStore('deploymentResults');
  const deployments = useStoreValue(deploymentStore);

  const devDeployments = deployments.filter((d: any) => d.environment === 'development');
  const stagingDeployments = deployments.filter((d: any) => d.environment === 'staging');
  const prodDeployments = deployments.filter((d: any) => d.environment === 'production');

  return (
    <div className="bg-white border rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">📊 Environment Comparison</h3>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">Aspect</th>
              <th className="text-left p-2 bg-blue-50">Development</th>
              <th className="text-left p-2 bg-yellow-50">Staging</th>
              <th className="text-left p-2 bg-green-50">Production</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="p-2 font-medium">Strategy</td>
              <td className="p-2 bg-blue-50">Quick Deploy</td>
              <td className="p-2 bg-yellow-50">Test & Deploy</td>
              <td className="p-2 bg-green-50">Blue-Green</td>
            </tr>
            <tr className="border-b">
              <td className="p-2 font-medium">Validations</td>
              <td className="p-2 bg-blue-50">❌ Skipped</td>
              <td className="p-2 bg-yellow-50">✅ Integration Tests</td>
              <td className="p-2 bg-green-50">✅ Full Validation</td>
            </tr>
            <tr className="border-b">
              <td className="p-2 font-medium">Hot Reload</td>
              <td className="p-2 bg-blue-50">✅ Enabled</td>
              <td className="p-2 bg-yellow-50">❌ Disabled</td>
              <td className="p-2 bg-green-50">❌ Disabled</td>
            </tr>
            <tr className="border-b">
              <td className="p-2 font-medium">Rollback</td>
              <td className="p-2 bg-blue-50">❌ Not Available</td>
              <td className="p-2 bg-yellow-50">⚠️ Manual</td>
              <td className="p-2 bg-green-50">✅ Automatic</td>
            </tr>
            <tr className="border-b">
              <td className="p-2 font-medium">Deployments</td>
              <td className="p-2 bg-blue-50">{devDeployments.length}</td>
              <td className="p-2 bg-yellow-50">{stagingDeployments.length}</td>
              <td className="p-2 bg-green-50">{prodDeployments.length}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DeploymentTimeline() {
  const deploymentStore = useConditionalStore('deploymentResults');
  const deployments = useStoreValue(deploymentStore);
  const logsStore = useConditionalStore('logs');
  const logs = useStoreValue(logsStore);

  const recentDeployments = deployments.slice(-5).reverse();
  const recentLogs = logs.slice(-10).reverse();

  const getEnvironmentColor = (env: string) => {
    switch (env) {
      case 'development': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'staging': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'production': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Deployment Timeline */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">🕐 Deployment Timeline</h3>
        
        {recentDeployments.length === 0 ? (
          <p className="text-gray-500 text-sm">No deployments yet. Start by selecting an environment and deploying.</p>
        ) : (
          <div className="space-y-3">
            {recentDeployments.map((deployment: any, index: number) => (
              <div key={deployment.deploymentId} className={`border rounded-lg p-3 ${getEnvironmentColor(deployment.environment)}`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-medium">{deployment.environment.toUpperCase()}</div>
                    <div className="text-sm opacity-75">Version: {deployment.version}</div>
                  </div>
                  <div className="text-xs opacity-75">
                    {new Date(deployment.timestamp).toLocaleTimeString()}
                  </div>
                </div>
                
                {deployment.strategy && (
                  <div className="text-xs">Strategy: {deployment.strategy}</div>
                )}
                {deployment.previewUrl && (
                  <div className="text-xs">Preview: {deployment.previewUrl}</div>
                )}
                {deployment.rollbackId && (
                  <div className="text-xs">Rollback ID: {deployment.rollbackId}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Activity Log */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">📋 Activity Log</h3>
        
        {recentLogs.length === 0 ? (
          <p className="text-gray-500 text-sm">No activity yet. Deploy to see the execution flow.</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {recentLogs.map((log: any, index: number) => (
              <div key={`${log.timestamp}-${index}`} className="text-xs p-2 border-l-2 border-gray-200 hover:bg-gray-50">
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
    </div>
  );
}

function EnvironmentBasedExecutionContent() {
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
        
        <h1 className="text-3xl font-bold mb-2">🌍 Environment-Based Execution</h1>
        <p className="text-gray-600">
          Different deployment strategies and validation rules for each environment without conditional logic in handlers.
        </p>
      </div>

      {/* Key Concept */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-3">🎯 Key Concept</h2>
        <p className="text-blue-800 mb-3">
          Each environment runs only its designated handlers through filtering, not conditional branches.
          Handlers check the environment once at the beginning and return early if not matching.
        </p>
        <div className="bg-white rounded p-4">
          <pre className="text-sm text-gray-800">
{`// Handler pattern - Early return for non-matching environment
useActionHandler('deploy', async (payload, controller) => {
  if (payload.environment !== 'production') return; // Early exit
  
  // Production-specific logic only
  await runProductionValidations();
  await blueGreenDeploy();
});`}
          </pre>
        </div>
      </div>

      <div className="space-y-6">
        {/* Controls */}
        <EnvironmentControls />
        
        {/* Comparison Table */}
        <EnvironmentComparisonTable />
        
        {/* Timeline and Logs */}
        <DeploymentTimeline />

        {/* Learning Points */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">📚 What This Demonstrates</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">✅ Benefits</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Clean separation of environment logic</li>
                <li>• No complex nested conditionals</li>
                <li>• Easy to test each environment</li>
                <li>• Prevents cross-environment code execution</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">🔧 Use Cases</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• CI/CD pipelines</li>
                <li>• Multi-stage deployments</li>
                <li>• Environment-specific features</li>
                <li>• Progressive rollouts</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function EnvironmentBasedExecution() {
  return (
    <ConditionalStoreProvider>
      <ConditionalActionProvider>
        <EnvironmentHandlers />
        <EnvironmentBasedExecutionContent />
      </ConditionalActionProvider>
    </ConditionalStoreProvider>
  );
}