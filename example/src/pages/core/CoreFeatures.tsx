import React, { useState, useEffect, useCallback } from 'react';
import { 
  ActionRegister,
  ActionPayloadMap 
} from '@context-action/core';
import { createLogger, LogLevel } from '@context-action/logger';
import { PageWithLogMonitor, useActionLoggerWithToast } from '../../components/LogMonitor/';

// Core 패키지용 액션 맵
interface CoreActionMap extends ActionPayloadMap {
  basicAction: { message: string; timestamp: number };
  asyncAction: { delay: number };
  errorAction: { errorMessage: string };
  priorityAction: { taskId: number; data: string };
  chainedAction: { step: number; data: any };
}

const logger = createLogger(LogLevel.DEBUG);

// 기본 ActionRegister 테스트 컴포넌트
function BasicActionRegisterTest() {
  const [coreRegister] = useState(() => new ActionRegister<CoreActionMap>({ name: 'CoreBasicTest' }));
  const [results, setResults] = useState<string[]>([]);
  const actionLogger = useActionLoggerWithToast();

  useEffect(() => {
    // 기본 액션 핸들러 등록
    const unsubscribe1 = coreRegister.register('basicAction', ({ message, timestamp }: { message: string; timestamp: number }, controller: any) => {
      const result = `[Basic] Action executed: ${message} at ${new Date(timestamp).toLocaleTimeString()}`;
      setResults(prev => [...prev, result]);
      
      actionLogger.logAction('basicAction', { message, timestamp }, {
        context: 'Basic ActionRegister Test',
        toast: { type: 'info', message: '기본 액션 실행됨' }
      });
      
      controller.next();
    });

    const unsubscribe2 = coreRegister.register('asyncAction', async ({ delay }: { delay: number }, controller: any) => {
      const startTime = Date.now();
      setResults(prev => [...prev, `[Async] Starting async action (${delay}ms delay)...`]);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      
      const endTime = Date.now();
      const actualDelay = endTime - startTime;
      const result = `[Async] Completed in ${actualDelay}ms`;
      setResults(prev => [...prev, result]);
      
      actionLogger.logAction('asyncAction', { delay }, {
        context: 'Basic ActionRegister Test',
        toast: { type: 'success', message: `비동기 작업 완료 (${actualDelay}ms)` }
      });
      
      controller.next();
    });

    const unsubscribe3 = coreRegister.register('errorAction', ({ errorMessage }: { errorMessage: string }, controller: any) => {
      const result = `[Error] Error handled: ${errorMessage}`;
      setResults(prev => [...prev, result]);
      
      actionLogger.logError(`Core Package Error: ${errorMessage}`, new Error(errorMessage), {
        context: 'Basic ActionRegister Test',
        toast: true
      });
      
      controller.abort('Test error', new Error(errorMessage));
    });

    return () => {
      unsubscribe1();
      unsubscribe2();
      unsubscribe3();
    };
  }, [coreRegister, actionLogger]);

  const runBasicTest = useCallback(() => {
    coreRegister.dispatch('basicAction', { 
      message: 'Basic Core functionality test', 
      timestamp: Date.now() 
    });
  }, [coreRegister]);

  const runAsyncTest = useCallback(() => {
    coreRegister.dispatch('asyncAction', { delay: 1000 });
  }, [coreRegister]);

  const runErrorTest = useCallback(() => {
    coreRegister.dispatch('errorAction', { errorMessage: 'Core package test error' });
  }, [coreRegister]);

  const clearResults = useCallback(() => {
    setResults([]);
  }, []);

  return (
    <div className="demo-card">
      <div className="card-header">
        <h3>기본 ActionRegister 기능 테스트</h3>
        <div className="flex gap-2">
          <button onClick={clearResults} className="btn btn-small btn-secondary">
            Clear
          </button>
        </div>
      </div>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-3">
          @context-action/core 패키지의 핵심 ActionRegister 기능을 테스트합니다.
        </p>
        
        <div className="button-group">
          <button onClick={runBasicTest} className="btn btn-primary">
            Basic Action
          </button>
          <button onClick={runAsyncTest} className="btn btn-secondary">
            Async Action
          </button>
          <button onClick={runErrorTest} className="btn btn-danger">
            Error Action
          </button>
        </div>
      </div>

      <div className="results-container">
        <h4 className="text-sm font-medium mb-2">실행 결과:</h4>
        <div className="result-log">
          {results.length === 0 ? (
            <div className="text-sm text-gray-500 italic">아직 실행된 액션이 없습니다.</div>
          ) : (
            results.map((result, index) => (
              <div key={index} className="result-entry">
                <span className="result-time">{new Date().toLocaleTimeString()}</span>
                <span className="result-message">{result}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// 고급 기능 테스트 컴포넌트
function AdvancedActionRegisterTest() {
  const [advancedRegister] = useState(() => new ActionRegister<CoreActionMap>({ name: 'CoreAdvancedTest' }));
  const [advancedResults, setAdvancedResults] = useState<string[]>([]);
  const [chainState, setChainState] = useState<{ step: number; data: any[] }>({ step: 0, data: [] });
  const actionLogger = useActionLoggerWithToast();

  useEffect(() => {
    // 우선순위 기반 액션 핸들러들 (서로 다른 우선순위로 등록)
    const unsubscribe1 = advancedRegister.register('priorityAction', ({ taskId, data }: { taskId: number; data: string }, controller: any) => {
      const result = `[High Priority Handler] Processing: ${data} (task ID: ${taskId})`;
      setAdvancedResults(prev => [...prev, result]);
      
      actionLogger.logAction('priorityAction', { taskId, data }, {
        context: 'Advanced ActionRegister Test - High Priority',
        toast: { type: 'success', message: `🚀 고우선순위 핸들러: ${data}` }
      });
      
      controller.next();
    }, { priority: 10 }); // 높은 우선순위

    const unsubscribe1b = advancedRegister.register('priorityAction', ({ taskId, data }: { taskId: number; data: string }, controller: any) => {
      const result = `[Medium Priority Handler] Processing: ${data} (task ID: ${taskId})`;
      setAdvancedResults(prev => [...prev, result]);
      
      actionLogger.logAction('priorityAction', { taskId, data }, {
        context: 'Advanced ActionRegister Test - Medium Priority',
        toast: { type: 'info', message: `⚡ 중우선순위 핸들러: ${data}` }
      });
      
      controller.next();
    }, { priority: 5 }); // 중간 우선순위

    const unsubscribe1c = advancedRegister.register('priorityAction', ({ taskId, data }: { taskId: number; data: string }, controller: any) => {
      const result = `[Low Priority Handler] Processing: ${data} (task ID: ${taskId})`;
      setAdvancedResults(prev => [...prev, result]);
      
      actionLogger.logAction('priorityAction', { taskId, data }, {
        context: 'Advanced ActionRegister Test - Low Priority',
        toast: { type: 'info', message: `📋 저우선순위 핸들러: ${data}` }
      });
      
      controller.next();
    }, { priority: 1 }); // 낮은 우선순위

    // 체인 액션 핸들러
    const unsubscribe2 = advancedRegister.register('chainedAction', ({ step, data }: { step: number; data: any }, controller: any) => {
      const newData = [...chainState.data, { step, data, timestamp: Date.now() }];
      setChainState({ step: step + 1, data: newData });
      
      const result = `[Chain Step ${step}] Added data: ${JSON.stringify(data)}`;
      setAdvancedResults(prev => [...prev, result]);
      
      // 다음 체인 액션 자동 실행 (3단계 까지)
      if (step < 3) {
        setTimeout(() => {
          advancedRegister.dispatch('chainedAction', { 
            step: step + 1, 
            data: `chain-${step + 1}` 
          });
        }, 500);
      } else {
        const finalResult = `[Chain Complete] Processed ${newData.length} steps`;
        setAdvancedResults(prev => [...prev, finalResult]);
        
        actionLogger.logSystem('체인 액션 완료', {
          context: 'Advanced ActionRegister Test',
          toast: { type: 'success', message: '체인 액션 완료!' }
        });
      }
      
      controller.next();
    });

    return () => {
      unsubscribe1();
      unsubscribe1b();
      unsubscribe1c();
      unsubscribe2();
    };
  }, [advancedRegister, actionLogger, chainState.data]);

  const runPriorityTest = useCallback(() => {
    // 우선순위 테스트: 한 번의 dispatch로 여러 핸들러가 우선순위 순서대로 실행
    setAdvancedResults(prev => [...prev, '=== 우선순위 테스트 시작 (단일 dispatch) ===']);
    
    // 하나의 액션으로 모든 핸들러가 우선순위 순서대로 실행됨 (10 -> 5 -> 1)
    advancedRegister.dispatch('priorityAction', { taskId: 123, data: '테스트 데이터' });
  }, [advancedRegister]);

  const runChainTest = useCallback(() => {
    setChainState({ step: 0, data: [] });
    advancedRegister.dispatch('chainedAction', { step: 1, data: 'chain-start' });
  }, [advancedRegister]);

  const clearAdvancedResults = useCallback(() => {
    setAdvancedResults([]);
    setChainState({ step: 0, data: [] });
  }, []);

  return (
    <div className="demo-card">
      <div className="card-header">
        <h3>고급 ActionRegister 기능 테스트</h3>
        <div className="flex gap-2">
          <button onClick={clearAdvancedResults} className="btn btn-small btn-secondary">
            Clear
          </button>
        </div>
      </div>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-3">
          단일 dispatch로 여러 핸들러가 우선순위 순서대로 실행됩니다 (10→5→1).
        </p>
        
        <div className="button-group">
          <button onClick={runPriorityTest} className="btn btn-primary">
            Priority Actions
          </button>
          <button onClick={runChainTest} className="btn btn-secondary">
            Chained Actions
          </button>
        </div>
        
        {chainState.data.length > 0 && (
          <div className="mt-3 p-2 bg-blue-50 rounded text-sm">
            <strong>Chain State:</strong> Step {chainState.step}, 
            Data: {chainState.data.map(d => d.data).join(' → ')}
          </div>
        )}
      </div>

      <div className="results-container">
        <h4 className="text-sm font-medium mb-2">고급 기능 실행 결과:</h4>
        <div className="result-log">
          {advancedResults.length === 0 ? (
            <div className="text-sm text-gray-500 italic">아직 실행된 고급 액션이 없습니다.</div>
          ) : (
            advancedResults.map((result, index) => (
              <div key={index} className="result-entry">
                <span className="result-time">{new Date().toLocaleTimeString()}</span>
                <span className="result-message">{result}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// Core 패키지 특징 설명 컴포넌트
function CoreFeaturesOverview() {
  return (
    <div className="demo-card info-card">
      <h3>@context-action/core 패키지 특징</h3>
      
      <div className="features-grid">
        <div className="feature-section">
          <h4>🚀 핵심 기능</h4>
          <ul className="feature-list">
            <li>✅ 타입 안전한 액션 파이프라인</li>
            <li>✅ 우선순위 기반 핸들러 실행</li>
            <li>✅ 비동기 액션 완벽 지원</li>
            <li>✅ 에러 핸들링 및 복구</li>
            <li>✅ Controller 기반 플로우 제어</li>
            <li>✅ 체인 액션 및 조건부 실행</li>
          </ul>
        </div>
        
        <div className="feature-section">
          <h4>⚡ 성능 특징</h4>
          <ul className="feature-list">
            <li>✅ 최소 번들 크기 (~15KB)</li>
            <li>✅ Tree-shaking 최적화</li>
            <li>✅ 런타임 오버헤드 최소화</li>
            <li>✅ 메모리 효율적 설계</li>
            <li>✅ 프로덕션 환경 최적화</li>
            <li>✅ TypeScript 네이티브 지원</li>
          </ul>
        </div>
      </div>
      
      <div className="usage-patterns">
        <h4>📋 사용 패턴</h4>
        <div className="pattern-grid">
          <div className="pattern-item">
            <strong>기본 사용:</strong>
            <p className="text-sm text-gray-600">
              단순한 액션 처리와 상태 변경에 적합
            </p>
          </div>
          <div className="pattern-item">
            <strong>고급 사용:</strong>
            <p className="text-sm text-gray-600">
              복잡한 비즈니스 로직과 플로우 제어에 활용
            </p>
          </div>
          <div className="pattern-item">
            <strong>프로덕션 사용:</strong>
            <p className="text-sm text-gray-600">
              안정적이고 최적화된 프로덕션 환경에서 사용
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function CoreFeaturesPage() {
  return (
    <PageWithLogMonitor 
      pageId="core-features" 
      title="Core Package Features"
      initialConfig={{ enableToast: true, maxLogs: 150 }}
    >
      <div className="page-container">
        <header className="page-header">
          <h1>Core Package Features & Capabilities</h1>
          <p className="page-description">
            @context-action/core 패키지의 모든 기능을 테스트하고 
            실제 동작을 확인할 수 있습니다.
          </p>
        </header>

        <div className="space-y-6">
          <CoreFeaturesOverview />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BasicActionRegisterTest />
            <AdvancedActionRegisterTest />
          </div>
          
          {/* 코드 예제 */}
          <div className="code-example">
            <h3>Core 패키지 사용 예제</h3>
            <div className="code-tabs">
              <div className="code-tab">
                <h4>기본 ActionRegister 설정</h4>
                <pre className="code-block">
{`// 1. ActionRegister 생성
import { ActionRegister } from '@context-action/core';

const actionRegister = new ActionRegister<MyActions>({
  name: 'MyApp'
});

// 2. 액션 핸들러 등록
actionRegister.register('userAction', (payload, controller) => {
  // 비즈니스 로직 처리
  console.log('User action:', payload);
  
  // 다음 핸들러로 진행
  controller.next();
});

// 3. 액션 실행
actionRegister.dispatch('userAction', { 
  userId: 123, 
  action: 'login' 
});`}
                </pre>
              </div>
              
              <div className="code-tab">
                <h4>고급 기능 활용</h4>
                <pre className="code-block">
{`// 우선순위 기반 핸들러
actionRegister.register('criticalAction', (payload, controller) => {
  // 높은 우선순위로 먼저 실행됨
  handleCriticalLogic(payload);
  controller.next();
}, 10); // 우선순위 10

// 비동기 액션 처리
actionRegister.register('asyncAction', async (payload, controller) => {
  try {
    const result = await apiCall(payload);
    // 성공 시 다음 핸들러로
    controller.next(result);
  } catch (error) {
    // 에러 시 파이프라인 중단
    controller.abort('API call failed', error);
  }
});

// 조건부 체인 액션
actionRegister.register('chainAction', (payload, controller) => {
  if (payload.shouldContinue) {
    // 다른 액션 실행
    actionRegister.dispatch('nextAction', payload.data);
  }
  controller.next();
});`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageWithLogMonitor>
  );
}

export default CoreFeaturesPage;

// 컴포넌트 전용 스타일
const styles = `
  .features-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    margin: 1.5rem 0;
  }
  
  .feature-section h4 {
    color: #2563eb;
    margin-bottom: 1rem;
    font-weight: 600;
  }
  
  .pattern-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-top: 1rem;
  }
  
  .pattern-item {
    padding: 1rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    background: #f9fafb;
  }
  
  .pattern-item strong {
    color: #1f2937;
    display: block;
    margin-bottom: 0.5rem;
  }
  
  .results-container {
    margin-top: 1.5rem;
  }
  
  .result-log {
    max-height: 200px;
    overflow-y: auto;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    padding: 0.75rem;
    background: #f9fafb;
    font-family: 'JetBrains Mono', 'Monaco', 'Menlo', monospace;
    font-size: 0.875rem;
  }
  
  .result-entry {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.25rem 0;
    border-bottom: 1px solid #f3f4f6;
  }
  
  .result-entry:last-child {
    border-bottom: none;
  }
  
  .result-time {
    color: #6b7280;
    font-size: 0.75rem;
    min-width: 80px;
    font-weight: 500;
  }
  
  .result-message {
    color: #374151;
    flex: 1;
  }
  
  .code-tabs {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
    margin-top: 1rem;
  }
  
  .code-tab h4 {
    margin-bottom: 0.75rem;
    color: #1f2937;
    font-size: 0.875rem;
    font-weight: 600;
  }
  
  .usage-patterns {
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid #e5e7eb;
  }
  
  .usage-patterns h4 {
    color: #1f2937;
    margin-bottom: 1rem;
  }
  
  @media (max-width: 768px) {
    .features-grid,
    .pattern-grid,
    .code-tabs {
      grid-template-columns: 1fr;
    }
  }
`;

// 스타일을 DOM에 추가
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);
}