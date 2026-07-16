/**
 * @fileoverview Action Priority Demo Page
 *
 * Action handler priority 시스템을 시연하는 데모 페이지입니다.
 * priority.md에서 설명한 priority-based handler execution을 보여줍니다.
 */

import { useStoreValue } from '@context-action/react';
import { Link } from 'react-router-dom';
import { Button, Card, CodeBlock } from '@/components/ui';
import { useActionPriorityDemoActions } from './actions/useActionPriorityDemoActions';
import {
  ActionPriorityDemoActionProvider,
  ActionPriorityDemoStoreProvider,
  useActionPriorityDemoStore,
} from './contexts/ActionPriorityDemoContexts';
import { ActionPriorityDemoHandlerRegistry } from './handlers/ActionPriorityDemoHandlerRegistry';

// ================================
// Main Component
// ================================

function ActionPriorityDemoContent() {
  const executionResultsStore = useActionPriorityDemoStore('executionResults');
  const isExecutingStore = useActionPriorityDemoStore('isExecuting');
  const executionResults = useStoreValue(executionResultsStore);
  const isExecuting = useStoreValue(isExecutingStore);
  const { authenticate, resetResults, setExecutionStatus } =
    useActionPriorityDemoActions();

  // ================================
  // Event Handlers
  // ================================

  const handleAuthenticateTest = async (username: string, password: string) => {
    await setExecutionStatus(true);
    await resetResults();

    try {
      await authenticate(username, password);
    } catch (error) {
      console.log('Authentication pipeline aborted:', error);
    } finally {
      await setExecutionStatus(false);
    }
  };

  const handleReset = () => {
    resetResults();
  };

  // ================================
  // Helper Functions
  // ================================

  const getPriorityColor = (priority: number) => {
    if (priority >= 90) return 'bg-red-100 text-red-800 border-red-200';
    if (priority >= 80)
      return 'bg-orange-100 text-orange-800 border-orange-200';
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
            Action handler의 priority 기반 실행 순서를 시연합니다. 높은 priority
            번호를 가진 handler가 먼저 실행됩니다 (100 → 95 → 90 → ... → 10).
          </p>
          <div className="flex items-center gap-4 mt-4">
            <Link
              to="/demos"
              className="text-blue-600 hover:text-blue-800 underline text-sm"
            >
              📋 Back to Demos
            </Link>
          </div>
        </header>

        {/* Priority System Explanation */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">
            📊 Priority System Overview
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-3 text-red-800">
                🔴 High Priority (90-100): System Critical
              </h3>
              <ul className="text-sm space-y-1 text-red-700">
                <li>
                  • <strong>100</strong>: Input validation
                </li>
                <li>
                  • <strong>95</strong>: Security checks
                </li>
                <li>
                  • <strong>90</strong>: Rate limiting
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-3 text-orange-800">
                🟠 Medium Priority (50-89): Business Logic
              </h3>
              <ul className="text-sm space-y-1 text-orange-700">
                <li>
                  • <strong>80</strong>: Authentication
                </li>
                <li>
                  • <strong>70</strong>: Data processing
                </li>
                <li>
                  • <strong>60</strong>: State updates
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-3 text-gray-800">
                ⚫ Low Priority (10-49): Logging & Analytics
              </h3>
              <ul className="text-sm space-y-1 text-gray-700">
                <li>
                  • <strong>30</strong>: Analytics tracking
                </li>
                <li>
                  • <strong>20</strong>: Performance monitoring
                </li>
                <li>
                  • <strong>10</strong>: Audit logging
                </li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Test Controls */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">
            🧪 Authentication Pipeline Test
          </h2>
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
            <h2 className="text-xl font-semibold">
              📋 Handler Execution Results
            </h2>
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
                    <CodeBlock size="sm">
                      {JSON.stringify(result.result, null, 2)}
                    </CodeBlock>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Code Example */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">
            💻 Implementation Example
          </h2>
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
            <CodeBlock size="sm">{`// 높은 priority (100) - 가장 먼저 실행
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
useActionHandler('authenticate', auditLog, { priority: 10 });`}</CodeBlock>
          </div>
        </Card>
      </div>
    </div>
  );
}

export function ActionPriorityDemoPage() {
  return (
    <ActionPriorityDemoActionProvider>
      <ActionPriorityDemoStoreProvider>
        <ActionPriorityDemoHandlerRegistry>
          <ActionPriorityDemoContent />
        </ActionPriorityDemoHandlerRegistry>
      </ActionPriorityDemoStoreProvider>
    </ActionPriorityDemoActionProvider>
  );
}

export default ActionPriorityDemoPage;
