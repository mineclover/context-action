import React, { useState, useCallback } from 'react';
import { PageWithLogMonitor, useActionLoggerWithToast } from '../../components/LogMonitor/';
import { DemoCard, Button, Input } from '../../components/ui';

/**
 * config.enableToast 명시적 설정 예제 페이지
 * 
 * 이 페이지는 LogMonitor의 config.enableToast를 명시적으로 true로 설정하는 
 * 다양한 방법을 보여줍니다.
 */

// 예제 1: 기본 Toast 활성화 데모
function BasicToastDemo() {
  const { logAction } = useActionLoggerWithToast();
  const [message, setMessage] = useState('');

  const handleTestToast = useCallback(() => {
    logAction('testBasicToast', { 
      message: '기본 Toast 테스트', 
      timestamp: new Date().toISOString() 
    });
  }, [logAction]);

  const handleCustomMessage = useCallback(() => {
    if (message.trim()) {
      logAction('customMessage', { 
        userMessage: message,
        length: message.length 
      });
      setMessage('');
    }
  }, [logAction, message]);

  return (
    <DemoCard>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        예제 1: 기본 Toast 활성화 (enableToast: true)
      </h3>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-blue-800">
          ✅ <strong>이 페이지의 설정:</strong> 
          <code className="ml-2 bg-blue-100 px-2 py-1 rounded">
            initialConfig=&#123;&#123; enableToast: true, maxLogs: 100 &#125;&#125;
          </code>
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Button onClick={handleTestToast} variant="primary">
            🍞 기본 Toast 테스트
          </Button>
          <p className="text-sm text-gray-600 mt-2">
            이 버튼을 클릭하면 Toast 알림이 표시됩니다.
          </p>
        </div>

        <div className="space-y-2">
          <Input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="커스텀 메시지를 입력하세요"
            className="w-full"
          />
          <Button 
            onClick={handleCustomMessage} 
            variant="secondary"
            disabled={!message.trim()}
          >
            📝 커스텀 메시지 Toast
          </Button>
        </div>
      </div>
    </DemoCard>
  );
}

// 예제 2: 다양한 Toast 타입 데모
function ToastTypesDemo() {
  const { logAction } = useActionLoggerWithToast();

  const testToastTypes = [
    { 
      type: 'success', 
      action: 'successAction',
      label: '✅ Success Toast', 
      payload: { result: '성공적으로 완료되었습니다' } 
    },
    { 
      type: 'error', 
      action: 'errorAction',
      label: '❌ Error Toast', 
      payload: { error: '오류가 발생했습니다' } 
    },
    { 
      type: 'info', 
      action: 'infoAction',
      label: 'ℹ️ Info Toast', 
      payload: { info: '정보를 확인하세요' } 
    },
    { 
      type: 'warning', 
      action: 'warningAction',
      label: '⚠️ Warning Toast', 
      payload: { warning: '주의가 필요합니다' } 
    }
  ];

  return (
    <DemoCard>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        예제 2: 다양한 Toast 타입 테스트
      </h3>

      <div className="grid grid-cols-2 gap-3">
        {testToastTypes.map(({ action, label, payload }) => (
          <Button
            key={action}
            onClick={() => logAction(action, payload)}
            variant="secondary"
            className="text-sm"
          >
            {label}
          </Button>
        ))}
      </div>

      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-700">
          각 버튼은 서로 다른 액션을 실행하며, ACTION_MESSAGES에 정의된 
          메시지에 따라 적절한 Toast 타입이 표시됩니다.
        </p>
      </div>
    </DemoCard>
  );
}

// 예제 3: 실시간 액션 로깅과 Toast
function RealTimeActionsDemo() {
  const { logAction } = useActionLoggerWithToast();
  const [counter, setCounter] = useState(0);
  const [autoMode, setAutoMode] = useState(false);

  const handleIncrement = useCallback(() => {
    const newValue = counter + 1;
    setCounter(newValue);
    logAction('incrementCounter', { 
      oldValue: counter, 
      newValue, 
      timestamp: Date.now() 
    });
  }, [counter, logAction]);

  const handleReset = useCallback(() => {
    setCounter(0);
    logAction('resetCounter', { 
      previousValue: counter, 
      resetTime: new Date().toISOString() 
    });
  }, [counter, logAction]);

  const toggleAutoMode = useCallback(() => {
    const newMode = !autoMode;
    setAutoMode(newMode);
    logAction('toggleAutoMode', { 
      enabled: newMode, 
      counterValue: counter 
    });

    if (newMode) {
      // 자동 모드에서는 3초마다 증가
      const interval = setInterval(() => {
        setCounter(prev => {
          const newVal = prev + 1;
          logAction('autoIncrement', { 
            autoValue: newVal, 
            mode: 'automatic' 
          });
          return newVal;
        });
      }, 3000);

      // 10초 후 자동 정지
      setTimeout(() => {
        clearInterval(interval);
        setAutoMode(false);
        logAction('autoModeTimeout', { 
          finalValue: counter, 
          duration: '10초' 
        });
      }, 10000);
    }
  }, [autoMode, counter, logAction]);

  return (
    <DemoCard>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        예제 3: 실시간 액션 로깅 + Toast
      </h3>

      <div className="text-center mb-4">
        <div className="text-4xl font-bold text-blue-600 mb-2">{counter}</div>
        <p className="text-sm text-gray-600">
          모든 카운터 변경이 로그와 Toast로 기록됩니다
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex gap-2 justify-center">
          <Button onClick={handleIncrement} variant="primary">
            ➕ 증가 (+1)
          </Button>
          <Button onClick={handleReset} variant="secondary">
            🔄 리셋
          </Button>
        </div>

        <div className="text-center">
          <Button 
            onClick={toggleAutoMode} 
            variant={autoMode ? "danger" : "primary"}
            disabled={autoMode}
          >
            {autoMode ? "🔄 자동 모드 실행 중..." : "⚡ 자동 모드 시작 (10초)"}
          </Button>
          {autoMode && (
            <p className="text-sm text-orange-600 mt-2">
              3초마다 자동으로 증가하며 Toast가 표시됩니다
            </p>
          )}
        </div>
      </div>
    </DemoCard>
  );
}

function ToastConfigExamplePage() {
  return (
    <PageWithLogMonitor 
      pageId="toast-config-example" 
      title="Toast Configuration Example"
      initialConfig={{ 
        enableToast: true,    // 🔑 명시적으로 Toast 활성화
        maxLogs: 100,        // 최대 로그 개수 설정
        defaultLogLevel: 1   // DEBUG 레벨로 설정
      }}
    >
      <div className="max-w-6xl mx-auto px-6 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Toast Configuration 예제
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed mb-4">
            LogMonitor의 <code className="bg-gray-100 px-2 py-1 rounded">config.enableToast</code>를 
            명시적으로 <code className="bg-green-100 px-2 py-1 rounded">true</code>로 설정하는 방법과 
            Toast 시스템의 동작을 확인하는 예제입니다.
          </p>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-800 mb-2">💡 핵심 설정</h3>
            <pre className="text-sm text-yellow-700 font-mono">
{`<PageWithLogMonitor 
  pageId="toast-config-example"
  initialConfig={{
    enableToast: true,    // 🔑 Toast 활성화
    maxLogs: 100,
    defaultLogLevel: 1
  }}
>
  {/* 컴포넌트 내용 */}
</PageWithLogMonitor>`}
            </pre>
          </div>
        </header>

        <div className="space-y-6">
          <BasicToastDemo />
          <ToastTypesDemo />
          <RealTimeActionsDemo />
          
          {/* 설정 방법 안내 */}
          <DemoCard variant="info">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              📋 Toast 활성화 설정 방법
            </h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">1. PageWithLogMonitor 컴포넌트에서</h4>
                <pre className="bg-gray-50 p-3 rounded text-sm font-mono">
{`<PageWithLogMonitor 
  pageId="my-page"
  initialConfig={{ enableToast: true }}
>
  <MyComponent />
</PageWithLogMonitor>`}
                </pre>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">2. 런타임에서 동적 변경</h4>
                <pre className="bg-gray-50 p-3 rounded text-sm font-mono">
{`const { updateConfig } = useLogMonitor();

// Toast 활성화
updateConfig({ enableToast: true });

// Toast 비활성화  
updateConfig({ enableToast: false });`}
                </pre>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">3. 액션 로깅에서 Toast 사용</h4>
                <pre className="bg-gray-50 p-3 rounded text-sm font-mono">
{`const { logAction } = useActionLoggerWithToast();

// 기본 Toast (ACTION_MESSAGES 기반)
logAction('myAction', { data: 'test' });

// enableToast: true 설정 후 자동으로 Toast 표시됨`}
                </pre>
              </div>
            </div>
          </DemoCard>

          {/* Toast 동작 원리 */}
          <DemoCard variant="info">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              🔄 Toast 동작 원리
            </h3>
            
            <div className="space-y-3 text-sm text-gray-700">
              <div className="flex items-start gap-2">
                <span className="font-semibold text-blue-600">1.</span>
                <span>useActionLoggerWithToast() 훅이 Toast 시스템을 자동 감지</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold text-blue-600">2.</span>
                <span>config.enableToast가 true인지 확인</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold text-blue-600">3.</span>
                <span>ACTION_MESSAGES에서 액션에 해당하는 메시지 조회</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold text-blue-600">4.</span>
                <span>Toast 컴포넌트로 알림 표시 (자동 제거 타이머 포함)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold text-blue-600">5.</span>
                <span>LogMonitor에 액션 로그도 동시에 기록</span>
              </div>
            </div>
          </DemoCard>
        </div>
      </div>
    </PageWithLogMonitor>
  );
}

export default ToastConfigExamplePage;