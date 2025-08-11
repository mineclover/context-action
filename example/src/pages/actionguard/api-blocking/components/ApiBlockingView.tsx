/**
 * @fileoverview API Blocking View Component - View Layer
 * 
 * Hook을 통해 Data/Action과 연결되는 View 컴포넌트입니다.
 */

import React from 'react';
import { DemoCard, Button, Input, CodeBlock, CodeExample } from '../../../../components/ui';
import { useApiBlockingLogic } from '../hooks/useApiBlockingLogic';

/**
 * API 블로킹 View 컴포넌트
 * 
 * Hook Layer를 통해 데이터와 액션을 받아 UI를 렌더링합니다.
 */
export function ApiBlockingView() {
  const {
    blockingState,
    remainingBlockTime,
    makeApiCall,
    setBlockDuration,
    clearHistory,
    isBlocked,
    hasHistory,
    successRate,
  } = useApiBlockingLogic();

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const duration = parseInt(e.target.value) || 1000;
    setBlockDuration(duration);
  };

  return (
    <div className="space-y-6">
      {/* 메인 API 블로킹 UI */}
      <DemoCard>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            🚫 API Call Blocking Demo
          </h3>
          <p className="text-sm text-gray-600">
            This demo prevents duplicate API calls using a blocking mechanism. After an API call, 
            all subsequent calls are blocked for a configurable duration (default: <strong>2 seconds</strong>). 
            This prevents accidental double-clicks and reduces server load.
          </p>
        </div>
        
        <div className="space-y-4">
          {/* 블로킹 설정 */}
          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
            <label className="text-sm font-medium text-gray-700">
              Block Duration:
            </label>
            <Input
              type="number"
              value={blockingState.blockDuration}
              onChange={handleDurationChange}
              min={500}
              max={10000}
              step={500}
              className="w-24"
            />
            <span className="text-sm text-gray-600">ms</span>
          </div>

          {/* API 호출 버튼들 */}
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => makeApiCall('/api/users')}
                disabled={isBlocked}
                variant="primary"
                size="sm"
              >
                GET /api/users
              </Button>
              <Button
                onClick={() => makeApiCall('/api/posts')}
                disabled={isBlocked}
                variant="primary"
                size="sm"
              >
                GET /api/posts
              </Button>
              <Button
                onClick={() => makeApiCall('/api/comments')}
                disabled={isBlocked}
                variant="primary"
                size="sm"
              >
                GET /api/comments
              </Button>
              <Button
                onClick={() => makeApiCall('/api/profile')}
                disabled={isBlocked}
                variant="primary"
                size="sm"
              >
                GET /api/profile
              </Button>
              <Button
                onClick={() => makeApiCall('/api/settings')}
                disabled={isBlocked}
                variant="primary"
                size="sm"
              >
                GET /api/settings
              </Button>
            </div>

            {/* 블로킹 상태 표시 */}
            {isBlocked && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    🚫 API calls blocked for {Math.ceil(remainingBlockTime / 1000)}s
                  </span>
                  <div className="text-xs text-yellow-600">
                    Action: {blockingState.blockedAction}
                  </div>
                </div>
                <div className="mt-2 bg-yellow-200 rounded-full h-2">
                  <div
                    className="bg-yellow-500 h-2 rounded-full transition-all duration-1000"
                    style={{
                      width: `${(remainingBlockTime / blockingState.blockDuration) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* 통계 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {blockingState.successCount}
              </div>
              <div className="text-xs text-gray-600">Successful</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {blockingState.blockedCount}
              </div>
              <div className="text-xs text-gray-600">Blocked</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {successRate.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-600">Success Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {blockingState.apiCalls.length}
              </div>
              <div className="text-xs text-gray-600">Total Calls</div>
            </div>
          </div>

          {/* 히스토리 */}
          {hasHistory && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h4 className="font-medium text-gray-900">Recent API Calls:</h4>
                <Button
                  onClick={clearHistory}
                  variant="secondary"
                  size="sm"
                >
                  Clear History
                </Button>
              </div>
              <div className="max-h-60 overflow-y-auto space-y-1">
                {blockingState.apiCalls.map((call) => (
                  <div
                    key={call.id}
                    className={`p-3 rounded-lg border text-sm ${
                      call.status === 'success'
                        ? 'bg-green-50 border-green-200 text-green-800'
                        : call.status === 'blocked'
                        ? 'bg-red-50 border-red-200 text-red-800'
                        : 'bg-gray-50 border-gray-200 text-gray-800'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <span className="font-mono font-medium">
                          {call.endpoint}
                        </span>
                        {call.responseTime && (
                          <span className="ml-2 text-xs opacity-75">
                            ({call.responseTime}ms)
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className={`px-2 py-1 rounded-full font-medium ${
                          call.status === 'success'
                            ? 'bg-green-100 text-green-800'
                            : call.status === 'blocked'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {call.status}
                        </span>
                        <span className="text-gray-500">
                          {new Date(call.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 빈 상태 */}
          {!hasHistory && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm">
              Click any API button above to start making calls. 
              The first call will succeed, then subsequent calls will be blocked 
              for the configured duration.
            </div>
          )}
        </div>
      </DemoCard>

      {/* 개념 설명 */}
      <DemoCard variant="info">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Blocking Pattern
        </h3>
        <div className="space-y-3 text-sm text-gray-700">
          <p>
            <strong className="text-gray-900">What is Action Blocking?</strong>
            <br />
            Blocking prevents the same action from executing again for a specified 
            duration. This is different from debouncing or throttling - it completely 
            blocks subsequent executions until the blocking period expires.
          </p>
          <p>
            <strong className="text-gray-900">Benefits:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Prevents duplicate API calls from user impatience</li>
            <li>Reduces server load and prevents rate limiting</li>
            <li>Improves data consistency</li>
            <li>Better user experience with clear feedback</li>
            <li>Prevents accidental double-submissions</li>
          </ul>
          <p>
            <strong className="text-gray-900">How it works:</strong>
            <br />
            After a successful execution, the action is blocked for a configured 
            duration. During this time, any attempts to execute the same action 
            are immediately rejected with appropriate feedback.
          </p>
        </div>
      </DemoCard>

      {/* 코드 예제 */}
      <CodeExample title="Blocking Implementation">
        <CodeBlock>
          {`// Custom blocking hook
function useActionBlock(duration: number = 2000) {
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockedAction, setBlockedAction] = useState<string>('');
  const [blockEndTime, setBlockEndTime] = useState<number | null>(null);

  const blockAction = useCallback((actionName: string) => {
    // Check if currently blocked
    if (isBlocked && blockEndTime && Date.now() < blockEndTime) {
      return false; // Action is blocked
    }

    // Start blocking
    const endTime = Date.now() + duration;
    setIsBlocked(true);
    setBlockedAction(actionName);
    setBlockEndTime(endTime);

    // Auto-unblock after duration
    setTimeout(() => {
      setIsBlocked(false);
      setBlockedAction('');
      setBlockEndTime(null);
    }, duration);

    return true; // Action allowed
  }, [isBlocked, blockEndTime, duration]);

  const remainingTime = blockEndTime 
    ? Math.max(0, blockEndTime - Date.now())
    : 0;

  return { 
    isBlocked, 
    blockedAction, 
    blockAction, 
    remainingTime 
  };
}

// Usage in API calls
const { isBlocked, blockAction } = useActionBlock(2000);

const handleApiCall = async (endpoint: string) => {
  if (!blockAction('apiCall')) {
    // Show blocked feedback
    toast.error('Please wait before making another call');
    return;
  }

  try {
    const response = await api.get(endpoint);
    toast.success('API call successful');
  } catch (error) {
    toast.error('API call failed');
  }
};`}
        </CodeBlock>
      </CodeExample>

      {/* 블로킹 vs 다른 패턴들 */}
      <DemoCard variant="info">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Blocking vs Other Patterns
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Blocking</h4>
            <ul className="space-y-1 text-gray-700">
              <li>• Completely prevents execution</li>
              <li>• Time-based blocking period</li>
              <li>• Immediate rejection feedback</li>
              <li>• Use cases: API calls, form submission</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Debouncing</h4>
            <ul className="space-y-1 text-gray-700">
              <li>• Delays execution until pause</li>
              <li>• Cancels previous attempts</li>
              <li>• Good for search inputs</li>
              <li>• Use cases: search, validation</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Throttling</h4>
            <ul className="space-y-1 text-gray-700">
              <li>• Limits to fixed intervals</li>
              <li>• Allows regular execution</li>
              <li>• Good for continuous events</li>
              <li>• Use cases: scroll, resize</li>
            </ul>
          </div>
        </div>
      </DemoCard>

      {/* 사용 사례 */}
      <DemoCard variant="info">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Common Use Cases
        </h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-green-600">✓</span>
            <span>API calls to prevent duplicate requests</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600">✓</span>
            <span>Form submissions to prevent double-posting</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600">✓</span>
            <span>Payment processing to prevent multiple charges</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600">✓</span>
            <span>File uploads to prevent corrupted uploads</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600">✓</span>
            <span>Social actions (like, follow) to prevent spam</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600">✓</span>
            <span>Critical system operations</span>
          </li>
        </ul>
      </DemoCard>
    </div>
  );
}