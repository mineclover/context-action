/**
 * @fileoverview Action Priority Demo Page
 * 
 * Action handler priority 시스템을 시연하는 데모 페이지입니다.
 * priority.md에서 설명한 priority-based handler execution을 보여줍니다.
 */

import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button } from '../../components/ui';
import type { ActionPayloadMap } from '@context-action/core';
import { createActionContext } from '@context-action/react';

// ================================
// Types & Action Definitions
// ================================

interface ActionPriorityDemoActions extends ActionPayloadMap {
  /** 인증 프로세스 시뮬레이션 */
  authenticate: { username: string; password: string };
  
  /** 데이터 처리 프로세스 시뮬레이션 */
  processData: { data: any; options?: any };
  
  /** 실행 결과 초기화 */
  resetResults: void;
}

interface HandlerResult {
  id: string;
  priority: number;
  step: string;
  result: any;
  timestamp: number;
  duration: number;
}

// ================================
// Action Context
// ================================

const ActionPriorityContext = createActionContext<ActionPriorityDemoActions>({
  name: 'ActionPriorityDemo',
});

// ================================
// Main Component
// ================================

function ActionPriorityDemoContent() {
  const [executionResults, setExecutionResults] = useState<HandlerResult[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const dispatch = ActionPriorityContext.useActionDispatch();

  // ================================
  // Handler Registration
  // ================================

  // Authentication Pipeline Handlers (높은 priority → 낮은 priority 순서)
  
  // Priority 100: Input Validation (가장 높은 우선순위)
  ActionPriorityContext.useActionHandler('authenticate', useCallback((payload, controller) => {
    const startTime = Date.now();
    
    if (!payload.username || !payload.password) {
      controller.abort('Missing credentials');
      return;
    }
    
    const result = { step: 'input-validation', success: true, valid: true };
    controller.setResult(result);
    
    setExecutionResults(prev => [...prev, {
      id: 'input-validator',
      priority: 100,
      step: 'Input Validation',
      result,
      timestamp: Date.now(),
      duration: Date.now() - startTime
    }]);
    
    return result;
  }, []), { priority: 100, id: 'input-validator' });

  // Priority 95: Security Check
  ActionPriorityContext.useActionHandler('authenticate', useCallback(async (payload, controller) => {
    const startTime = Date.now();
    
    // 시뮬레이션을 위한 짧은 지연
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const isSuspicious = payload.username === 'hacker';
    
    if (isSuspicious) {
      controller.abort('Suspicious activity detected');
      return;
    }
    
    const result = { step: 'security-check', success: true, cleared: true };
    controller.setResult(result);
    
    setExecutionResults(prev => [...prev, {
      id: 'security-checker',
      priority: 95,
      step: 'Security Check',
      result,
      timestamp: Date.now(),
      duration: Date.now() - startTime
    }]);
    
    return result;
  }, []), { priority: 95, id: 'security-checker' });

  // Priority 90: Rate Limiting
  ActionPriorityContext.useActionHandler('authenticate', useCallback((payload, controller) => {
    const startTime = Date.now();
    
    // 시뮬레이션: rate limit 체크
    const isRateLimited = Math.random() < 0.1; // 10% 확률로 rate limit
    
    if (isRateLimited) {
      controller.abort('Rate limit exceeded');
      return;
    }
    
    const result = { step: 'rate-limiting', success: true, consumed: true };
    controller.setResult(result);
    
    setExecutionResults(prev => [...prev, {
      id: 'rate-limiter',
      priority: 90,
      step: 'Rate Limiting',
      result,
      timestamp: Date.now(),
      duration: Date.now() - startTime
    }]);
    
    return result;
  }, []), { priority: 90, id: 'rate-limiter' });

  // Priority 80: Authentication (Business Logic)
  ActionPriorityContext.useActionHandler('authenticate', useCallback(async (payload) => {
    const startTime = Date.now();
    
    // 시뮬레이션을 위한 짧은 지연
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const isValidCredentials = payload.username === 'admin' && payload.password === 'password';
    
    const result = {
      step: 'authentication',
      success: isValidCredentials,
      user: isValidCredentials ? { id: '123', username: payload.username } : null,
      token: isValidCredentials ? 'jwt-token-example' : null
    };
    
    setExecutionResults(prev => [...prev, {
      id: 'authenticator',
      priority: 80,
      step: 'Authentication',
      result,
      timestamp: Date.now(),
      duration: Date.now() - startTime
    }]);
    
    return result;
  }, []), { priority: 80, id: 'authenticator' });

  // Priority 30: Analytics (낮은 우선순위)
  ActionPriorityContext.useActionHandler('authenticate', useCallback((payload) => {
    const startTime = Date.now();
    
    const result = {
      step: 'analytics',
      tracked: true,
      event: 'login_attempt',
      username: payload.username
    };
    
    setExecutionResults(prev => [...prev, {
      id: 'analytics-tracker',
      priority: 30,
      step: 'Analytics Tracking',
      result,
      timestamp: Date.now(),
      duration: Date.now() - startTime
    }]);
    
    return result;
  }, []), { priority: 30, id: 'analytics-tracker' });

  // Priority 10: Audit Logging (가장 낮은 우선순위)
  ActionPriorityContext.useActionHandler('authenticate', useCallback((payload, controller) => {
    const startTime = Date.now();
    
    const results = controller.getResults();
    const authResult = results.find(r => r.step === 'authentication');
    
    const result = {
      step: 'audit',
      logged: true,
      action: 'login',
      username: payload.username,
      success: authResult?.success || false
    };
    
    setExecutionResults(prev => [...prev, {
      id: 'audit-logger',
      priority: 10,
      step: 'Audit Logging',
      result,
      timestamp: Date.now(),
      duration: Date.now() - startTime
    }]);
    
    return result;
  }, []), { priority: 10, id: 'audit-logger' });

  // Reset handler
  ActionPriorityContext.useActionHandler('resetResults', useCallback(() => {
    setExecutionResults([]);
  }, []), { priority: 50 });

  // ================================
  // Event Handlers
  // ================================

  const handleAuthenticateTest = async (username: string, password: string) => {
    setIsExecuting(true);
    setExecutionResults([]);
    
    try {
      await dispatch('authenticate', { username, password });
    } catch (error) {
      console.log('Authentication pipeline aborted:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleReset = () => {
    dispatch('resetResults', undefined);
  };

  // ================================
  // Helper Functions
  // ================================

  const getPriorityColor = (priority: number) => {
    if (priority >= 90) return 'bg-red-100 text-red-800 border-red-200';
    if (priority >= 80) return 'bg-orange-100 text-orange-800 border-orange-200';
    if (priority >= 50) return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const formatDuration = (ms: number) => {
    return `${ms}ms`;
  };

  // ================================
  // Render
  // ================================

  return (
    <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <header className="page-header">
            <h1>⚡ Action Priority System Demo</h1>
            <p className="page-description">
              Action handler의 priority 기반 실행 순서를 시연합니다. 
              높은 priority 번호를 가진 handler가 먼저 실행됩니다 (100 → 95 → 90 → ... → 10).
            </p>
            <div className="flex items-center gap-4 mt-4">
              <Link
                to="/demos"
                className="text-blue-600 hover:text-blue-800 underline text-sm"
              >
                📋 Back to Demos
              </Link>
              <Link
                to="/actionguard/priority-performance"
                className="text-purple-600 hover:text-purple-800 underline text-sm"
              >
                ⚡ View Performance Demo
              </Link>
            </div>
          </header>

          {/* Priority System Explanation */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">📊 Priority System Overview</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium mb-3 text-red-800">🔴 High Priority (90-100): System Critical</h3>
                <ul className="text-sm space-y-1 text-red-700">
                  <li>• <strong>100</strong>: Input validation</li>
                  <li>• <strong>95</strong>: Security checks</li>
                  <li>• <strong>90</strong>: Rate limiting</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium mb-3 text-orange-800">🟠 Medium Priority (50-89): Business Logic</h3>
                <ul className="text-sm space-y-1 text-orange-700">
                  <li>• <strong>80</strong>: Authentication</li>
                  <li>• <strong>70</strong>: Data processing</li>
                  <li>• <strong>60</strong>: State updates</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium mb-3 text-gray-800">⚫ Low Priority (10-49): Logging & Analytics</h3>
                <ul className="text-sm space-y-1 text-gray-700">
                  <li>• <strong>30</strong>: Analytics tracking</li>
                  <li>• <strong>20</strong>: Performance monitoring</li>
                  <li>• <strong>10</strong>: Audit logging</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Test Controls */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">🧪 Authentication Pipeline Test</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <Button
                onClick={() => handleAuthenticateTest('admin', 'password')}
                disabled={isExecuting}
                className="flex flex-col gap-2 h-16"
              >
                <span>✅ Valid Credentials</span>
                <span className="text-xs opacity-75">admin / password</span>
              </Button>
              
              <Button
                onClick={() => handleAuthenticateTest('user', 'wrong')}
                disabled={isExecuting}
                variant="secondary"
                className="flex flex-col gap-2 h-16"
              >
                <span>❌ Invalid Credentials</span>
                <span className="text-xs opacity-75">user / wrong</span>
              </Button>
              
              <Button
                onClick={() => handleAuthenticateTest('hacker', 'attack')}
                disabled={isExecuting}
                variant="danger"
                className="flex flex-col gap-2 h-16"
              >
                <span>🚨 Suspicious User</span>
                <span className="text-xs opacity-75">hacker / attack</span>
              </Button>
            </div>
            
            <div className="mt-4 flex justify-between items-center">
              <div className="text-sm text-gray-600">
                각 테스트는 서로 다른 시나리오를 시연합니다
              </div>
              <Button
                onClick={handleReset}
                variant="outline"
                size="sm"
                disabled={isExecuting}
              >
                🔄 Reset Results
              </Button>
            </div>
          </Card>

          {/* Execution Results */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">📋 Handler Execution Results</h2>
              {isExecuting && (
                <div className="flex items-center gap-2 text-blue-600">
                  <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                  <span>Executing...</span>
                </div>
              )}
            </div>
            
            {executionResults.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                위의 테스트 버튼을 클릭하여 handler 실행 순서를 확인하세요
              </div>
            ) : (
              <div className="space-y-3">
                {executionResults.map((result, index) => (
                  <div
                    key={`${result.id}-${result.timestamp}`}
                    className={`p-4 rounded-lg border ${getPriorityColor(result.priority)}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-bold">
                          #{index + 1}
                        </span>
                        <span className="font-semibold">{result.step}</span>
                        <span className="px-2 py-1 bg-white bg-opacity-50 rounded text-xs font-mono">
                          Priority: {result.priority}
                        </span>
                      </div>
                      <span className="text-xs font-mono">
                        {formatDuration(result.duration)}
                      </span>
                    </div>
                    <div className="text-sm">
                      <strong>Result:</strong>
                      <pre className="mt-1 p-2 bg-white bg-opacity-50 rounded text-xs overflow-x-auto">
                        {JSON.stringify(result.result, null, 2)}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Code Example */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">💻 Implementation Example</h2>
            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
              <pre className="text-sm">{`// 높은 priority (100) - 가장 먼저 실행
useActionHandler('authenticate', validateInput, { priority: 100 });

// 중간 priority (95) - 두 번째 실행  
useActionHandler('authenticate', securityCheck, { priority: 95 });

// 중간 priority (90) - 세 번째 실행
useActionHandler('authenticate', rateLimitCheck, { priority: 90 });

// 비즈니스 로직 (80) - 네 번째 실행
useActionHandler('authenticate', performAuth, { priority: 80 });

// 낮은 priority (30) - 다섯 번째 실행
useActionHandler('authenticate', trackAnalytics, { priority: 30 });

// 가장 낮은 priority (10) - 마지막 실행
useActionHandler('authenticate', auditLog, { priority: 10 });`}</pre>
            </div>
          </Card>
        </div>
    </div>
  );
}

// Wrapper component with Provider
export function ActionPriorityDemoPage() {
  return (
    <ActionPriorityContext.Provider>
      <ActionPriorityDemoContent />
    </ActionPriorityContext.Provider>
  );
}

export default ActionPriorityDemoPage;