import React, { useState } from 'react';
import { ActionRegister, type ActionPayloadMap } from '@context-action/core';
import { Container } from '../components/ui/Container';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { CodeExample } from '../components/ui/CodeExample';

interface DemoActions extends ActionPayloadMap {
  userLogin: { userId: string; email: string };
  userLogout: void;
  processData: { data: any; type: string };
  // 타입으로만 선언된 액션 (핸들러 없음)
  typeOnlyAction: { value: string };
}

const WarningDemoPage: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [counter, setCounter] = useState(0);
  const [registry] = useState(() => new ActionRegister<DemoActions>({
    name: 'WarningDemoRegister',
    registry: { debug: false }
  }));

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testTypeOnlyAction = async () => {
    addLog('Testing type-only action (typeOnlyAction - no handler registered)...');
    try {
      await registry.dispatch('typeOnlyAction', { value: 'test' });
      addLog('✅ Dispatch completed (check console for warnings)');
    } catch (error) {
      addLog(`❌ Error: ${error}`);
    }
  };

  const registerHandler = async () => {
    addLog('Registering typeOnlyAction handler with counter logic...');
    try {
      // 핸들러 등록 - 카운터 증가 로직
      registry.register('typeOnlyAction', (payload) => {
        setCounter(prev => prev + 1);
        addLog(`🎯 Handler executed: Counter increased to ${counter + 1} (payload: ${payload.value})`);
        return { success: true, counter: counter + 1 };
      }, { id: 'counter-handler', priority: 100 });

      addLog('✅ typeOnlyAction handler registered successfully');
      addLog('Now you can test the action - it will increment the counter!');
    } catch (error) {
      addLog(`❌ Error: ${error}`);
    }
  };


  const clearLogs = () => {
    setLogs([]);
  };

  const resetCounter = () => {
    setCounter(0);
    addLog('🔄 Counter reset to 0');
  };

  return (
    <Container>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Warning Messages Demo</h1>
          <p className="mt-2 text-gray-600">
            Context-Action의 새로운 경고 메시지 기능을 테스트해보세요.
            개발자 도구의 콘솔을 열어서 경고 메시지를 확인하세요.
          </p>
        </div>

        {/* 카운터 UI */}
        <Card>
          <h2 className="text-xl font-semibold mb-4">Counter Display</h2>
          <div className="flex items-center justify-center space-x-4">
            <div className="text-6xl font-bold text-blue-600">{counter}</div>
            <div className="text-gray-600">
              <p className="text-sm">Handler executions</p>
              <p className="text-xs text-gray-500">Each dispatch increments counter</p>
            </div>
          </div>
          <div className="mt-4 flex justify-center space-x-2">
            <Button onClick={resetCounter} variant="outline" size="sm">
              🔄 Reset Counter
            </Button>
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-semibold mb-4">Action Testing</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button onClick={testTypeOnlyAction} variant="outline">
                🚫 typeOnlyAction (핸들러 없음)
              </Button>
              <Button onClick={registerHandler} variant="primary">
                ✅ 핸들러 등록 (카운터 로직)
              </Button>
            </div>
            <div className="flex justify-center">
              <Button onClick={clearLogs} variant="secondary">
                🗑️ 로그 지우기
              </Button>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-semibold mb-4">실행 로그</h2>
          <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-500">로그가 없습니다. 위의 버튼을 클릭해서 테스트해보세요.</p>
            ) : (
              <div className="space-y-1">
                {logs.map((log, index) => (
                  <div key={index} className="text-sm font-mono">
                    {log}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-semibold mb-4">예상되는 경고 메시지</h2>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs leading-relaxed whitespace-pre-wrap overflow-x-auto">
{`// 개발자 도구 콘솔에서 확인할 수 있는 경고 메시지들:

// 1. 핸들러 등록 전 테스트
⚠️ Action 'typeOnlyAction' has no registered handlers. This action will be ignored.
💡 Tip: Register a handler using registry.register() before dispatching this action.
📋 Available actions: []

// 2. 핸들러 등록 후 테스트 (경고 없음)
✅ typeOnlyAction handler registered successfully
🎯 Handler executed: Counter increased to 1 (payload: test-1234567890)
✅ Registered action dispatched successfully (no warnings expected)`}
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-semibold mb-4">사용 방법</h2>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-sm font-bold">1</div>
              <div>
                <h3 className="font-semibold text-lg">핸들러 없이 테스트</h3>
                <p className="text-gray-600">"typeOnlyAction (핸들러 없음)" 버튼을 클릭하여 경고 메시지를 확인하세요.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">2</div>
              <div>
                <h3 className="font-semibold text-lg">핸들러 등록</h3>
                <p className="text-gray-600">"핸들러 등록 (카운터 로직)" 버튼을 클릭하여 카운터 증가 로직을 등록하세요.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-bold">3</div>
              <div>
                <h3 className="font-semibold text-lg">핸들러 등록 후 테스트</h3>
                <p className="text-gray-600">핸들러 등록 후 "typeOnlyAction (핸들러 없음)" 버튼을 다시 클릭하면 카운터가 증가합니다.</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </Container>
  );
};

export default WarningDemoPage;