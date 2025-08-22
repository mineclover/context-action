import React, { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ConditionalStoreProvider, 
  ConditionalActionProvider,
  useConditionalAction,
  useConditionalStore,
  useConditionalActionHandler
} from '../stores';
import { useStoreValue } from '@context-action/react';
import { mockServices } from '../mockServices';

// Combined Patterns State Interface
interface CombinedPatternsState {
  scenario: 'enterpriseDeployment' | 'featureRollout' | 'emergencyResponse' | 'maintenanceWindow';
  environment: 'development' | 'staging' | 'production';
  userRole: 'guest' | 'user' | 'moderator' | 'admin' | 'superadmin';
  customerTier: 'bronze' | 'silver' | 'gold' | 'platinum';
  emergencyOverride: boolean;
  featureFlag: boolean;
  executionResults: PatternOrchestrationResult[];
  finalDecision: {
    approved: boolean;
    reason: string;
    executedPatterns: string[];
    executionTime: number;
  } | null;
}

interface PatternOrchestrationResult {
  patternName: string;
  priority: number;
  passed: boolean;
  result: any;
  executionTime: number;
  aborted?: boolean;
  timestamp: Date;
}

// Scenario configurations
const scenarios = {
  enterpriseDeployment: {
    name: 'Enterprise Deployment',
    description: 'Secure production deployment with all safety checks',
    patterns: ['Environment', 'Permission', 'Business Rules', 'Time-Based'],
    icon: '🚀'
  },
  featureRollout: {
    name: 'Feature Rollout',
    description: 'Gradual feature rollout with user segmentation',
    patterns: ['Feature Flags', 'Business Rules', 'Permission'],
    icon: '🎯'
  },
  emergencyResponse: {
    name: 'Emergency Response', 
    description: 'Critical fixes with emergency overrides',
    patterns: ['Permission', 'Time-Based', 'Environment'],
    icon: '🚨'
  },
  maintenanceWindow: {
    name: 'Maintenance Window',
    description: 'Scheduled maintenance with coordination',
    patterns: ['Time-Based', 'Environment', 'Permission'],
    icon: '🔧'
  }
};

function CombinedPatternsExecutionContent() {
  const dispatch = useConditionalAction();
  const logsStore = useConditionalStore('logs');
  const logs = useStoreValue(logsStore);

  // Combined Patterns State
  const [combinedState, setCombinedState] = useState<CombinedPatternsState>({
    scenario: 'enterpriseDeployment',
    environment: 'production',
    userRole: 'admin',
    customerTier: 'gold',
    emergencyOverride: false,
    featureFlag: true,
    executionResults: [],
    finalDecision: null
  });

  const [isProcessing, setIsProcessing] = useState(false);

  // Pattern Orchestration: Multiple patterns work together
  useConditionalActionHandler('executeOrchestration', useCallback(async (payload: any, controller) => {
    setIsProcessing(true);
    setCombinedState(prev => ({ ...prev, executionResults: [], finalDecision: null }));
    
    const startTime = Date.now();
    const results: PatternOrchestrationResult[] = [];
    let allPassed = true;
    let abortReason = '';
    let executedPatterns: string[] = [];

    try {
      const scenarioConfig = scenarios[payload.scenario];
      
      // Pattern 1: Environment Check (if applicable)
      if (scenarioConfig.patterns.includes('Environment')) {
        const envStart = Date.now();
        let envPassed = true;
        let envReason = '';

        // Environment-based logic
        if (payload.scenario === 'enterpriseDeployment' || payload.scenario === 'maintenanceWindow') {
          envPassed = payload.environment === 'production';
          envReason = envPassed ? 'Production environment verified' : `Wrong environment: ${payload.environment}`;
        } else {
          envPassed = true;
          envReason = 'Environment check passed';
        }

        const envTime = Date.now() - envStart;
        results.push({
          patternName: 'Environment Check',
          priority: 100,
          passed: envPassed,
          result: { environment: payload.environment, required: 'production', allowed: envPassed },
          executionTime: envTime,
          aborted: !envPassed,
          timestamp: new Date()
        });

        if (!envPassed && !payload.emergencyOverride) {
          allPassed = false;
          abortReason = `Environment validation failed: ${envReason}`;
          controller.abort(abortReason);
          setCombinedState(prev => ({ 
            ...prev, 
            executionResults: results,
            finalDecision: { 
              approved: false, 
              reason: abortReason, 
              executedPatterns: ['Environment Check'], 
              executionTime: Date.now() - startTime 
            }
          }));
          return;
        }

        if (envPassed) executedPatterns.push('Environment Check');
      }

      // Pattern 2: Permission Validation (if applicable)
      if (scenarioConfig.patterns.includes('Permission')) {
        const permStart = Date.now();
        
        // Role hierarchy validation
        const roleHierarchy = { guest: 0, user: 1, moderator: 2, admin: 3, superadmin: 4 };
        const requiredPermissions = {
          enterpriseDeployment: 3, // admin
          featureRollout: 2, // moderator  
          emergencyResponse: 1, // user (with override)
          maintenanceWindow: 3 // admin
        };
        
        const userLevel = roleHierarchy[payload.userRole] || 0;
        const requiredLevel = requiredPermissions[payload.scenario] || 3;
        const permissionPassed = userLevel >= requiredLevel || payload.emergencyOverride;
        
        const permTime = Date.now() - permStart;
        results.push({
          patternName: 'Permission Validation',
          priority: 95,
          passed: permissionPassed,
          result: { 
            userRole: payload.userRole, 
            userLevel, 
            requiredLevel, 
            emergencyOverride: payload.emergencyOverride,
            allowed: permissionPassed 
          },
          executionTime: permTime,
          aborted: !permissionPassed,
          timestamp: new Date()
        });

        if (!permissionPassed) {
          allPassed = false;
          abortReason = `Permission denied: ${payload.userRole} (level ${userLevel}) insufficient for ${payload.scenario}`;
          controller.abort(abortReason);
          setCombinedState(prev => ({ 
            ...prev, 
            executionResults: results,
            finalDecision: { 
              approved: false, 
              reason: abortReason, 
              executedPatterns: [...executedPatterns, 'Permission Validation'], 
              executionTime: Date.now() - startTime 
            }
          }));
          return;
        }

        if (permissionPassed) executedPatterns.push('Permission Validation');
      }

      // Pattern 3: Feature Flag Check (if applicable)
      if (scenarioConfig.patterns.includes('Feature Flags')) {
        const flagStart = Date.now();
        const flagPassed = payload.featureFlag;
        
        const flagTime = Date.now() - flagStart;
        results.push({
          patternName: 'Feature Flag Check',
          priority: 90,
          passed: flagPassed,
          result: { featureEnabled: payload.featureFlag, required: true },
          executionTime: flagTime,
          aborted: !flagPassed,
          timestamp: new Date()
        });

        if (!flagPassed) {
          allPassed = false;
          abortReason = 'Feature flag disabled - rollout not active';
          controller.abort(abortReason);
          setCombinedState(prev => ({ 
            ...prev, 
            executionResults: results,
            finalDecision: { 
              approved: false, 
              reason: abortReason, 
              executedPatterns: [...executedPatterns, 'Feature Flag Check'], 
              executionTime: Date.now() - startTime 
            }
          }));
          return;
        }

        if (flagPassed) executedPatterns.push('Feature Flag Check');
      }

      // Pattern 4: Business Rules (if applicable) 
      if (scenarioConfig.patterns.includes('Business Rules')) {
        const bizStart = Date.now();
        
        // Simple business rule based on customer tier
        const tierRules = {
          enterpriseDeployment: ['gold', 'platinum'],
          featureRollout: ['silver', 'gold', 'platinum'],
          emergencyResponse: ['bronze', 'silver', 'gold', 'platinum'],
          maintenanceWindow: ['gold', 'platinum']
        };
        
        const allowedTiers = tierRules[payload.scenario] || [];
        const bizPassed = allowedTiers.includes(payload.customerTier) || payload.emergencyOverride;
        
        const bizTime = Date.now() - bizStart;
        results.push({
          patternName: 'Business Rules',
          priority: 85,
          passed: bizPassed,
          result: { 
            customerTier: payload.customerTier, 
            allowedTiers, 
            emergencyOverride: payload.emergencyOverride,
            allowed: bizPassed 
          },
          executionTime: bizTime,
          aborted: !bizPassed,
          timestamp: new Date()
        });

        if (!bizPassed) {
          allPassed = false;
          abortReason = `Business rule violation: ${payload.customerTier} tier not allowed for ${payload.scenario}`;
          controller.abort(abortReason);
          setCombinedState(prev => ({ 
            ...prev, 
            executionResults: results,
            finalDecision: { 
              approved: false, 
              reason: abortReason, 
              executedPatterns: [...executedPatterns, 'Business Rules'], 
              executionTime: Date.now() - startTime 
            }
          }));
          return;
        }

        if (bizPassed) executedPatterns.push('Business Rules');
      }

      // Pattern 5: Time-Based Check (if applicable)
      if (scenarioConfig.patterns.includes('Time-Based')) {
        const timeStart = Date.now();
        
        const businessHoursResult = await mockServices.checkBusinessHours();
        let timePassed = true;
        let timeReason = '';
        
        if (payload.scenario === 'enterpriseDeployment') {
          timePassed = businessHoursResult.isBusinessTime || payload.emergencyOverride;
          timeReason = timePassed ? 'Business hours check passed' : 'Outside business hours - emergency override required';
        } else if (payload.scenario === 'maintenanceWindow') {
          timePassed = !businessHoursResult.isBusinessTime;
          timeReason = timePassed ? 'Off-hours maintenance window' : 'Cannot perform maintenance during business hours';
        } else {
          timePassed = true;
          timeReason = 'Time check passed';
        }
        
        const timeTime = Date.now() - timeStart;
        results.push({
          patternName: 'Time-Based Check',
          priority: 80,
          passed: timePassed,
          result: { 
            currentTime: businessHoursResult.currentTime,
            isBusinessTime: businessHoursResult.isBusinessTime,
            emergencyOverride: payload.emergencyOverride,
            allowed: timePassed,
            reason: timeReason
          },
          executionTime: timeTime,
          aborted: !timePassed,
          timestamp: new Date()
        });

        if (!timePassed) {
          allPassed = false;
          abortReason = `Time constraint violation: ${timeReason}`;
          controller.abort(abortReason);
          setCombinedState(prev => ({ 
            ...prev, 
            executionResults: results,
            finalDecision: { 
              approved: false, 
              reason: abortReason, 
              executedPatterns: [...executedPatterns, 'Time-Based Check'], 
              executionTime: Date.now() - startTime 
            }
          }));
          return;
        }

        if (timePassed) executedPatterns.push('Time-Based Check');
      }

      // All patterns passed - Pattern Orchestration success
      const successReason = `All patterns passed: ${executedPatterns.join(', ')}`;
      setCombinedState(prev => ({ 
        ...prev, 
        executionResults: results,
        finalDecision: { 
          approved: true, 
          reason: successReason, 
          executedPatterns, 
          executionTime: Date.now() - startTime 
        }
      }));

      logsStore.setValue(prev => [...prev, {
        timestamp: new Date(),
        action: 'executeOrchestration',
        level: 'success' as const,
        details: `${payload.scenario} orchestration succeeded: ${executedPatterns.length} patterns executed in ${Date.now() - startTime}ms`
      }]);

    } catch (error) {
      allPassed = false;
      abortReason = error instanceof Error ? error.message : 'Unknown error occurred';
      setCombinedState(prev => ({ 
        ...prev, 
        executionResults: results,
        finalDecision: { 
          approved: false, 
          reason: abortReason, 
          executedPatterns, 
          executionTime: Date.now() - startTime 
        }
      }));
    } finally {
      setIsProcessing(false);
    }
  }, []));

  const handleExecuteScenario = () => {
    dispatch('executeOrchestration', {
      scenario: combinedState.scenario,
      environment: combinedState.environment,
      userRole: combinedState.userRole,
      customerTier: combinedState.customerTier,
      emergencyOverride: combinedState.emergencyOverride,
      featureFlag: combinedState.featureFlag
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link 
              to="/actionguard/conditional" 
              className="text-blue-600 hover:text-blue-800 underline text-sm"
            >
              ← Back to Patterns
            </Link>
            <Link 
              to="/" 
              className="text-gray-600 hover:text-gray-800 underline text-sm"
            >
              🏠 Home
            </Link>
          </div>
          
          <h1 className="text-3xl font-bold mb-4">🔀 Combined Patterns</h1>
          <p className="text-lg text-gray-600 mb-4">
            Pattern Orchestration: Multiple conditional patterns working together in enterprise workflows
          </p>
          
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-800">
              <strong>Pattern Orchestration:</strong> Enterprise scenarios combining environment validation, 
              permission checks, business rules, feature flags, and time constraints with coordinated execution and graceful failure handling.
            </p>
          </div>
        </div>

        {/* Scenario Controls */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-4">Scenario Configuration</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Enterprise Scenario</label>
                <select 
                  value={combinedState.scenario}
                  onChange={(e) => setCombinedState(prev => ({ ...prev, scenario: e.target.value as any }))}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                >
                  {Object.entries(scenarios).map(([key, scenario]) => (
                    <option key={key} value={key}>
                      {scenario.icon} {scenario.name} - {scenario.description}
                    </option>
                  ))}
                </select>
                <div className="mt-2 text-xs text-gray-500">
                  Patterns: {scenarios[combinedState.scenario].patterns.join(', ')}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Environment</label>
                  <select 
                    value={combinedState.environment}
                    onChange={(e) => setCombinedState(prev => ({ ...prev, environment: e.target.value as any }))}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                  >
                    <option value="development">Development</option>
                    <option value="staging">Staging</option>
                    <option value="production">Production</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">User Role</label>
                  <select 
                    value={combinedState.userRole}
                    onChange={(e) => setCombinedState(prev => ({ ...prev, userRole: e.target.value as any }))}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                  >
                    <option value="guest">Guest (Level 0)</option>
                    <option value="user">User (Level 1)</option>
                    <option value="moderator">Moderator (Level 2)</option>
                    <option value="admin">Admin (Level 3)</option>
                    <option value="superadmin">Super Admin (Level 4)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Customer Tier</label>
                  <select 
                    value={combinedState.customerTier}
                    onChange={(e) => setCombinedState(prev => ({ ...prev, customerTier: e.target.value as any }))}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                  >
                    <option value="bronze">Bronze</option>
                    <option value="silver">Silver</option>
                    <option value="gold">Gold</option>
                    <option value="platinum">Platinum</option>
                  </select>
                </div>

                <div className="flex items-center space-x-4 pt-6">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="featureFlag"
                      checked={combinedState.featureFlag}
                      onChange={(e) => setCombinedState(prev => ({ ...prev, featureFlag: e.target.checked }))}
                      className="rounded border-gray-300 text-gray-600 focus:ring-gray-500"
                    />
                    <label htmlFor="featureFlag" className="text-sm text-gray-700">Feature Enabled</label>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="emergencyOverride"
                  checked={combinedState.emergencyOverride}
                  onChange={(e) => setCombinedState(prev => ({ ...prev, emergencyOverride: e.target.checked }))}
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <label htmlFor="emergencyOverride" className="text-sm font-medium text-gray-700">
                  🚨 Emergency Override (Bypass Some Restrictions)
                </label>
              </div>

              <button
                onClick={handleExecuteScenario}
                disabled={isProcessing}
                className="w-full bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Orchestrating Patterns...' : 'Execute Scenario'}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-4">Pattern Orchestration Results</h2>
            
            {combinedState.executionResults.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Configure scenario and click "Execute Scenario" to see pattern coordination
              </div>
            ) : (
              <div className="space-y-3">
                {combinedState.executionResults.map((result, index) => (
                  <div 
                    key={index} 
                    className={`p-3 rounded-lg border ${
                      result.passed ? 'bg-green-50 border-green-200' : 
                      result.aborted ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">
                        {result.passed ? '✅' : result.aborted ? '❌' : '⚠️'} {result.patternName}
                      </span>
                      <span className="text-xs text-gray-500">
                        P{result.priority} | {result.executionTime}ms
                      </span>
                    </div>
                    <div className="text-xs text-gray-600">
                      {typeof result.result === 'object' ? 
                        Object.entries(result.result).slice(0, 3).map(([k, v]) => `${k}: ${v}`).join(', ') :
                        String(result.result)
                      }
                      {result.aborted && <span className="ml-2 text-red-600 font-medium">(ABORTED)</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Final Decision */}
        {combinedState.finalDecision && (
          <div className={`rounded-lg shadow-sm border p-6 mb-8 ${
            combinedState.finalDecision.approved 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              {combinedState.finalDecision.approved ? '✅ Orchestration Approved' : '❌ Orchestration Denied'}
            </h2>
            
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-gray-600">Executed Patterns</div>
                <div className="font-semibold">{combinedState.finalDecision.executedPatterns.length}</div>
              </div>
              <div>
                <div className="text-gray-600">Execution Time</div>
                <div className="font-semibold">{combinedState.finalDecision.executionTime}ms</div>
              </div>
              <div>
                <div className="text-gray-600">Status</div>
                <div className="font-semibold">{combinedState.finalDecision.reason}</div>
              </div>
            </div>
            
            <div className="mt-3 text-xs text-gray-600">
              Patterns: {combinedState.finalDecision.executedPatterns.join(' → ')}
            </div>
          </div>
        )}

        {/* Pattern Orchestration Explanation */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Pattern Orchestration Benefits</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-800 mb-2">Enterprise Features</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• <strong>Multi-Pattern Coordination:</strong> Patterns work together seamlessly</li>
                <li>• <strong>Priority-Based Execution:</strong> High-priority patterns execute first</li>
                <li>• <strong>Graceful Failure:</strong> Early termination prevents unnecessary processing</li>
                <li>• <strong>Emergency Overrides:</strong> Critical operations can bypass restrictions</li>
                <li>• <strong>Comprehensive Audit:</strong> Complete execution trail across patterns</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-800 mb-2">Real-World Scenarios</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• <strong>Enterprise Deployment:</strong> All safety checks for production</li>
                <li>• <strong>Feature Rollout:</strong> Gradual release with user segmentation</li>
                <li>• <strong>Emergency Response:</strong> Critical fixes with override capabilities</li>
                <li>• <strong>Maintenance Window:</strong> Coordinated off-hours operations</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Logs Display */}
        {logs.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Pattern Orchestration Logs</h2>
            </div>
            <div className="p-4">
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {logs.slice(-10).reverse().map((log, index) => (
                  <div key={index} className="text-sm font-mono">
                    <span className="text-gray-500">[{log.timestamp.toLocaleTimeString()}]</span>
                    <span className={`ml-2 ${
                      log.level === 'error' ? 'text-red-600' :
                      log.level === 'warning' ? 'text-yellow-600' :
                      log.level === 'success' ? 'text-green-600' :
                      'text-blue-600'
                    }`}>
                      {log.action}
                    </span>
                    <span className="ml-2 text-gray-700">{log.details}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function CombinedPatternsExecution() {
  return (
    <ConditionalStoreProvider>
      <ConditionalActionProvider>
        <CombinedPatternsExecutionContent />
      </ConditionalActionProvider>
    </ConditionalStoreProvider>
  );
}