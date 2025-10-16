import { type ActionPayloadMap, ActionRegister } from '@context-action/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useActionLoggerWithToast } from '@/components/LogMonitor';
import { Button, DemoCard } from '@/components/ui';

// 비동기 데모용 액션 맵
interface AsyncActionMap extends ActionPayloadMap {
  asyncAction: { delay: number; message: string };
  multipleAsync: string;
}

interface AsyncResult {
  id: string;
  message: string;
  status: 'pending' | 'completed' | 'error';
  timestamp: string;
}

export function AsyncDemo() {
  const [results, setResults] = useState<AsyncResult[]>([]);
  const [actionRegister] = useState(
    () => new ActionRegister<AsyncActionMap>()
  );
  const { logAction, logSystem, logError } = useActionLoggerWithToast();

  const logActionRef = useRef(logAction);
  const logSystemRef = useRef(logSystem);
  const logErrorRef = useRef(logError);
  
  // Update refs when logger functions change
  logActionRef.current = logAction;
  logSystemRef.current = logSystem;
  logErrorRef.current = logError;

  useEffect(() => {
    logSystemRef.current('AsyncDemo - ActionRegister 초기화');

    // 비동기 액션 핸들러
    const unsubscribeAsync = actionRegister.register(
      'asyncAction',
      async ({ delay, message }, _controller) => {
        const id = Math.random().toString(36).substr(2, 9);
        const timestamp = new Date().toLocaleTimeString();
        
        // 시작 상태 추가
        setResults(prev => [...prev, {
          id,
          message,
          status: 'pending',
          timestamp
        }]);

        logActionRef.current('asyncAction', { delay, message });
        
        try {
          // 비동기 작업 시뮬레이션
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // 완료 상태로 업데이트
          setResults(prev => prev.map(result => 
            result.id === id 
              ? { ...result, status: 'completed' as const, timestamp: new Date().toLocaleTimeString() }
              : result
          ));
          
          logSystemRef.current(`비동기 액션 완료: ${message}`);
        } catch (error) {
          // 에러 상태로 업데이트
          setResults(prev => prev.map(result => 
            result.id === id 
              ? { ...result, status: 'error' as const, timestamp: new Date().toLocaleTimeString() }
              : result
          ));
          
          logErrorRef.current('비동기 액션 에러', error);
        }
      },
      { priority: 1 }
    );

    // 다중 비동기 액션 핸들러
    const unsubscribeMultiple = actionRegister.register(
      'multipleAsync',
      async (message, _controller) => {
        const promises = [1000, 500, 1500].map(async (delay, index) => {
          const id = `multi-${index}-${Math.random().toString(36).substr(2, 6)}`;
          const timestamp = new Date().toLocaleTimeString();
          
          setResults(prev => [...prev, {
            id,
            message: `${message} - Task ${index + 1}`,
            status: 'pending',
            timestamp
          }]);
          
          await new Promise(resolve => setTimeout(resolve, delay));
          
          setResults(prev => prev.map(result => 
            result.id === id 
              ? { ...result, status: 'completed', timestamp: new Date().toLocaleTimeString() }
              : result
          ));
          
          return `Task ${index + 1} 완료`;
        });
        
        const allResults = await Promise.all(promises);
        logSystemRef.current(`모든 비동기 작업 완료: ${allResults.join(', ')}`);
        logActionRef.current('multipleAsync', message);
      },
      { priority: 2 }
    );

    logSystemRef.current('AsyncDemo - 비동기 핸들러 등록 완료');

    return () => {
      unsubscribeAsync();
      unsubscribeMultiple();
      logSystemRef.current('AsyncDemo - 핸들러 등록 해제 완료');
    };
  }, [actionRegister]);

  const runSingleAsync = useCallback(() => {
    const delay = Math.floor(Math.random() * 2000) + 500; // 500-2500ms
    actionRegister.dispatch('asyncAction', { 
      delay, 
      message: `단일 비동기 작업 (${delay}ms)` 
    });
  }, [actionRegister]);

  const runMultipleAsync = useCallback(() => {
    actionRegister.dispatch('multipleAsync', '다중 비동기 작업');
  }, [actionRegister]);

  const clearResults = useCallback(() => {
    setResults([]);
  }, []);

  const getStatusColor = (status: AsyncResult['status']) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <DemoCard title="비동기 액션 처리">
      <div className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={runSingleAsync}>단일 비동기 작업</Button>
          <Button variant="secondary" onClick={runMultipleAsync}>
            다중 비동기 작업
          </Button>
          <Button variant="outline" onClick={clearResults}>결과 초기화</Button>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg max-h-64 overflow-y-auto">
          <h4 className="font-semibold mb-3">비동기 작업 상태:</h4>
          {results.length === 0 ? (
            <p className="text-gray-500 italic">비동기 작업을 실행해보세요.</p>
          ) : (
            <div className="space-y-2">
              {results.map((result) => (
                <div 
                  key={result.id} 
                  className="flex items-center justify-between p-2 bg-white rounded border"
                >
                  <div className="flex-1">
                    <div className="text-sm font-medium">{result.message}</div>
                    <div className="text-xs text-gray-500">{result.timestamp}</div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(result.status)}`}>
                    {result.status === 'pending' ? '진행중...' : 
                     result.status === 'completed' ? '완료' : '에러'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <p className="text-sm text-gray-600">
          ActionRegister는 비동기 핸들러를 완전히 지원합니다. 여러 비동기 작업이 동시에 실행되어도 
          각각 독립적으로 처리되며 상태를 추적할 수 있습니다.
        </p>
      </div>
    </DemoCard>
  );
}