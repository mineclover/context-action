import { type ActionPayloadMap, ActionRegister } from '@context-action/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useActionLoggerWithToast } from '@/components/LogMonitor';
import { Button, DemoCard } from '@/components/ui';

// 우선순위 데모용 액션 맵
interface PriorityActionMap extends ActionPayloadMap {
  priorityTest: string;
}

export function PriorityDemo() {
  const [results, setResults] = useState<string[]>([]);
  const [actionRegister] = useState(
    () => new ActionRegister<PriorityActionMap>()
  );
  const { logAction, logSystem } = useActionLoggerWithToast();

  const logActionRef = useRef(logAction);
  const logSystemRef = useRef(logSystem);
  
  // Update refs when logger functions change
  logActionRef.current = logAction;
  logSystemRef.current = logSystem;

  useEffect(() => {
    logSystemRef.current('PriorityDemo - ActionRegister 초기화');
    setResults([]); // Clear results on mount

    // 우선순위 3 - 가장 높음 (먼저 실행)
    const unsubscribeHigh = actionRegister.register(
      'priorityTest',
      (message, _controller) => {
        const result = `High Priority (3): ${message}`;
        setResults(prev => [...prev, result]);
        logActionRef.current('priorityTest', message, { priority: 3 });
      },
      { priority: 3 }
    );

    // 우선순위 1 - 낮음 (마지막에 실행)
    const unsubscribeLow = actionRegister.register(
      'priorityTest',
      (message, _controller) => {
        const result = `Low Priority (1): ${message}`;
        setResults(prev => [...prev, result]);
        logActionRef.current('priorityTest', message, { priority: 1 });
      },
      { priority: 1 }
    );

    // 우선순위 2 - 중간 (두 번째로 실행)
    const unsubscribeMid = actionRegister.register(
      'priorityTest',
      (message, _controller) => {
        const result = `Mid Priority (2): ${message}`;
        setResults(prev => [...prev, result]);
        logActionRef.current('priorityTest', message, { priority: 2 });
      },
      { priority: 2 }
    );

    logSystemRef.current('PriorityDemo - 우선순위 핸들러 등록 완료');

    return () => {
      unsubscribeHigh();
      unsubscribeLow();
      unsubscribeMid();
      logSystemRef.current('PriorityDemo - 핸들러 등록 해제 완료');
    };
  }, [actionRegister]);

  const testPriority = useCallback(() => {
    setResults([]); // Clear previous results
    const timestamp = new Date().toLocaleTimeString();
    actionRegister.dispatch('priorityTest', `테스트 ${timestamp}`);
  }, [actionRegister]);

  const clearResults = useCallback(() => {
    setResults([]);
  }, []);

  return (
    <DemoCard title="우선순위 시스템 테스트">
      <div className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={testPriority}>우선순위 테스트 실행</Button>
          <Button variant="outline" onClick={clearResults}>결과 초기화</Button>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold mb-2">실행 순서 (우선순위별):</h4>
          {results.length === 0 ? (
            <p className="text-gray-500 italic">테스트 버튼을 눌러서 우선순위 실행 순서를 확인해보세요.</p>
          ) : (
            <ol className="space-y-1">
              {results.map((result, index) => (
                <li key={index} className="text-sm font-mono">
                  {index + 1}. {result}
                </li>
              ))}
            </ol>
          )}
        </div>
        
        <p className="text-sm text-gray-600">
          하나의 액션에 여러 핸들러가 등록되어 있을 때, 우선순위가 높은 핸들러부터 순차적으로 실행됩니다.
          (Priority 3 → 2 → 1 순서)
        </p>
      </div>
    </DemoCard>
  );
}