import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ActionPayloadMap, createActionContextPattern } from '@context-action/react';
import { PageWithLogMonitor, useActionLoggerWithToast } from '../../components/LogMonitor/';

// 테스트용 액션 타입 정의
interface ActionGuardTestActions extends ActionPayloadMap {
  searchUser: { query: string };
  saveData: { data: string };
  scrollEvent: { position: number };
  buttonClick: { buttonId: string };
  validateForm: { formData: any };
  asyncOperation: { operationType: string; delay: number };
  errorTest: { shouldFail: boolean };
  conditionalAction: { condition: boolean; data: string };
  priorityTest: { priority: number; message: string };
}

// Action Context Pattern 생성
const ActionGuardContext = createActionContextPattern<ActionGuardTestActions>('ActionGuardTest');

// 성능 메트릭 타입
interface PerformanceMetrics {
  totalDispatches: number;
  throttledCount: number;
  debouncedCount: number;
  averageExecutionTime: number;
  lastExecutionTime: number;
}

// 메인 테스트 컴포넌트
function ActionGuardTest() {
  const dispatch = ActionGuardContext.useAction();
  const actionRegister = ActionGuardContext.useActionRegister();
  const actionLogger = useActionLoggerWithToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [saveData, setSaveData] = useState('test data');
  const [scrollPosition, setScrollPosition] = useState(0);
  const [formData, setFormData] = useState({ name: '', email: '', age: '' });
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    totalDispatches: 0,
    throttledCount: 0,
    debouncedCount: 0,
    averageExecutionTime: 0,
    lastExecutionTime: 0
  });
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [testResults, setTestResults] = useState<Array<{
    id: string;
    testName: string;
    status: 'pending' | 'success' | 'failed';
    message: string;
    timestamp: Date;
    executionTime: number;
  }>>([]);
  const [bulkTestRunning, setBulkTestRunning] = useState(false);

  const executionTimes = useRef<number[]>([]);
  const autoScrollInterval = useRef<NodeJS.Timeout>();

  // 성능 메트릭 업데이트 함수
  const updateMetrics = useCallback((executionTime: number, type: 'throttled' | 'debounced' | 'normal') => {
    executionTimes.current.push(executionTime);
    if (executionTimes.current.length > 100) {
      executionTimes.current.shift(); // 최근 100개만 유지
    }
    
    const avgTime = executionTimes.current.reduce((a, b) => a + b, 0) / executionTimes.current.length;
    
    setMetrics(prev => ({
      totalDispatches: prev.totalDispatches + 1,
      throttledCount: type === 'throttled' ? prev.throttledCount + 1 : prev.throttledCount,
      debouncedCount: type === 'debounced' ? prev.debouncedCount + 1 : prev.debouncedCount,
      averageExecutionTime: Math.round(avgTime * 100) / 100,
      lastExecutionTime: executionTime
    }));
  }, []);

  // 테스트 결과 추가 함수
  const addTestResult = useCallback((testName: string, status: 'success' | 'failed', message: string, executionTime?: number) => {
    const result = {
      id: Date.now().toString(),
      testName,
      status,
      message,
      timestamp: new Date(),
      executionTime: executionTime || 0
    };
    setTestResults(prev => [result, ...prev.slice(0, 19)]); // 최근 20개로 확장
  }, []);

  // 액션 핸들러 등록
  useEffect(() => {
    // 검색 액션 (debounce 테스트용)
    const unregister1 = actionRegister.register('searchUser', ({ query }, controller) => {
      const actionStartTime = performance.now();
      
      actionLogger.logAction('searchUser', { query }, {
        context: 'ActionGuard Test',
        toast: { type: 'info', message: `검색: "${query}"` }
      });
      
      const execTime = performance.now() - actionStartTime;
      updateMetrics(execTime, 'debounced');
      addTestResult('Debounce Search', 'success', `검색어: "${query}"`, execTime);
      controller.next();
    }, { debounce: 300 });

    // 저장 액션 (throttle 테스트용) 
    const unregister2 = actionRegister.register('saveData', ({ data }, controller) => {
      const actionStartTime = performance.now();
      
      actionLogger.logAction('saveData', { data }, {
        context: 'ActionGuard Test',
        toast: { type: 'success', message: '데이터 저장됨' }
      });
      
      const execTime = performance.now() - actionStartTime;
      updateMetrics(execTime, 'throttled');
      addTestResult('Throttled Save', 'success', `데이터: "${data}"`, execTime);
      controller.next();
    }, { throttle: 1000 });

    // 스크롤 액션 (throttle 테스트용)
    const unregister3 = actionRegister.register('scrollEvent', ({ position }, controller) => {
      const actionStartTime = performance.now();
      
      actionLogger.logAction('scrollEvent', { position }, {
        context: 'ActionGuard Test'
      });
      
      const execTime = performance.now() - actionStartTime;
      updateMetrics(execTime, 'throttled');
      controller.next();
    }, { throttle: 100 });

    // 버튼 클릭 액션
    const unregister4 = actionRegister.register('buttonClick', ({ buttonId }, controller) => {
      const actionStartTime = performance.now();
      
      actionLogger.logAction('buttonClick', { buttonId }, {
        context: 'ActionGuard Test',
        toast: { type: 'info', message: `버튼 클릭: ${buttonId}` }
      });
      
      const execTime = performance.now() - actionStartTime;
      updateMetrics(execTime, 'normal');
      addTestResult('Button Click', 'success', `버튼: ${buttonId}`, execTime);
      controller.next();
    });

    // 양식 검증 액션 (조건부 실행)
    const unregister5 = actionRegister.register('validateForm', ({ formData }, controller) => {
      const actionStartTime = performance.now();
      const isValid = formData.name && formData.email && formData.age;
      
      if (isValid) {
        actionLogger.logAction('validateForm', { formData }, {
          context: 'ActionGuard Test',
          toast: { type: 'success', message: '양식 검증 성공' }
        });
        const execTime = performance.now() - actionStartTime;
        addTestResult('Form Validation', 'success', '유효한 양식', execTime);
        updateMetrics(execTime, 'normal');
      } else {
        actionLogger.logError('Form validation failed', new Error('Required fields missing'), {
          context: 'ActionGuard Test',
          toast: true
        });
        const execTime = performance.now() - actionStartTime;
        addTestResult('Form Validation', 'failed', '필수 필드 누락', execTime);
        updateMetrics(execTime, 'normal');
      }
      
      controller.next();
    }, { 
      condition: () => formData.name?.length > 0,
      validation: (payload) => {
        if (!payload.formData.email?.includes('@')) {
          throw new Error('유효하지 않은 이메일 형식');
        }
        return true;
      }
    });

    // 비동기 작업 액션
    const unregister6 = actionRegister.register('asyncOperation', async ({ operationType, delay }, controller) => {
      const execStartTime = performance.now();
      
      actionLogger.logSystem(`비동기 작업 시작: ${operationType}`, {
        context: 'ActionGuard Test'
      });
      
      try {
        await new Promise(resolve => setTimeout(resolve, delay));
        const execTime = performance.now() - execStartTime;
        
        actionLogger.logAction('asyncOperation', { operationType, delay }, {
          context: 'ActionGuard Test',
          toast: { type: 'success', message: `${operationType} 완료 (${delay}ms)` }
        });
        
        addTestResult('Async Operation', 'success', `${operationType} 완료`, execTime);
        updateMetrics(execTime, 'normal');
        controller.next();
      } catch (error) {
        const execTime = performance.now() - execStartTime;
        actionLogger.logError(`비동기 작업 실패: ${operationType}`, error as Error, {
          context: 'ActionGuard Test',
          toast: true
        });
        addTestResult('Async Operation', 'failed', `${operationType} 실패`, execTime);
        controller.abort('Async operation failed');
      }
    });

    // 에러 테스트 액션
    const unregister7 = actionRegister.register('errorTest', ({ shouldFail }, controller) => {
      const actionStartTime = performance.now();
      
      if (shouldFail) {
        const error = new Error('의도적인 테스트 에러');
        actionLogger.logError('에러 테스트 실행', error, {
          context: 'ActionGuard Test',
          toast: true
        });
        const execTime = performance.now() - actionStartTime;
        addTestResult('Error Test', 'failed', '의도적 에러 발생', execTime);
        updateMetrics(execTime, 'normal');
        controller.abort('Test error');
      } else {
        actionLogger.logAction('errorTest', { shouldFail }, {
          context: 'ActionGuard Test',
          toast: { type: 'success', message: '에러 테스트 성공' }
        });
        const execTime = performance.now() - actionStartTime;
        addTestResult('Error Test', 'success', '에러 없이 성공', execTime);
        updateMetrics(execTime, 'normal');
        controller.next();
      }
    });

    // 우선순위 테스트 액션
    const unregister8 = actionRegister.register('priorityTest', ({ priority, message }, controller) => {
      const actionStartTime = performance.now();
      
      actionLogger.logAction('priorityTest', { priority, message }, {
        context: 'ActionGuard Test',
        toast: { type: 'info', message: `우선순위 ${priority}: ${message}` }
      });
      
      const execTime = performance.now() - actionStartTime;
      addTestResult('Priority Test', 'success', `P${priority}: ${message}`, execTime);
      updateMetrics(execTime, 'normal');
      controller.next();
    }, { priority: 1 });

    return () => {
      unregister1();
      unregister2();
      unregister3();
      unregister4();
      unregister5();
      unregister6();
      unregister7();
      unregister8();
    };
  }, [actionRegister, actionLogger, updateMetrics, addTestResult]);

  // 테스트 함수들
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.trim()) {
      dispatch('searchUser', { query });
    }
  }, [dispatch]);

  const handleSaveClick = useCallback(() => {
    dispatch('saveData', { data: saveData });
  }, [dispatch, saveData]);

  const handleScrollSimulation = useCallback(() => {
    const newPosition = scrollPosition + 100;
    setScrollPosition(newPosition);
    dispatch('scrollEvent', { position: newPosition });
  }, [dispatch, scrollPosition]);

  const handleFormValidation = useCallback(() => {
    dispatch('validateForm', { formData });
  }, [dispatch, formData]);

  const handleAsyncTest = useCallback((operationType: string, delay: number) => {
    dispatch('asyncOperation', { operationType, delay });
  }, [dispatch]);

  const handleErrorTest = useCallback((shouldFail: boolean) => {
    dispatch('errorTest', { shouldFail });
  }, [dispatch]);

  const handlePriorityTest = useCallback(() => {
    // 다양한 우선순위로 액션 실행 (숫자가 높을수록 높은 우선순위)
    dispatch('priorityTest', { priority: 5, message: 'High priority (P5)' });
    dispatch('priorityTest', { priority: 3, message: 'Medium priority (P3)' });
    dispatch('priorityTest', { priority: 1, message: 'Low priority (P1)' });
  }, [dispatch]);

  const startAutoScroll = useCallback(() => {
    if (isAutoScrolling) return;
    
    setIsAutoScrolling(true);
    autoScrollInterval.current = setInterval(() => {
      setScrollPosition(prev => {
        const newPos = prev + 50;
        dispatch('scrollEvent', { position: newPos });
        return newPos;
      });
    }, 150);
  }, [dispatch, isAutoScrolling]);

  const stopAutoScroll = useCallback(() => {
    setIsAutoScrolling(false);
    if (autoScrollInterval.current) {
      clearInterval(autoScrollInterval.current);
    }
  }, []);

  const resetMetrics = useCallback(() => {
    setMetrics({
      totalDispatches: 0,
      throttledCount: 0,
      debouncedCount: 0,
      averageExecutionTime: 0,
      lastExecutionTime: 0
    });
    setTestResults([]);
    executionTimes.current = [];
    setIsPaused(false);
  }, []);

  // 일괄 테스트 실행
  const runBulkTest = useCallback(async () => {
    if (bulkTestRunning) return;
    
    setBulkTestRunning(true);
    const tests = [
      () => dispatch('saveData', { data: 'bulk-save-test' }),
      () => dispatch('buttonClick', { buttonId: 'bulk-test-btn' }),
      () => dispatch('validateForm', { formData: { name: 'Test', email: 'test@example.com', age: '25' } }),
      () => dispatch('errorTest', { shouldFail: false }),
      () => dispatch('priorityTest', { priority: 2, message: 'Bulk priority test' }),
    ];

    for (let i = 0; i < tests.length; i++) {
      if (isPaused) break;
      tests[i]();
      await new Promise(resolve => setTimeout(resolve, 200)); // 200ms 간격
    }
    
    setBulkTestRunning(false);
  }, [dispatch, bulkTestRunning, isPaused]);

  // 스트레스 테스트 실행
  const runStressTest = useCallback(async () => {
    if (bulkTestRunning) return;
    
    setBulkTestRunning(true);
    actionLogger.logSystem('스트레스 테스트 시작 (50회 실행)', {
      context: 'ActionGuard Test',
      toast: { type: 'info', message: '스트레스 테스트 시작' }
    });

    for (let i = 0; i < 50; i++) {
      if (isPaused) break;
      
      const testType = i % 4;
      switch (testType) {
        case 0:
          dispatch('searchUser', { query: `stress-test-${i}` });
          break;
        case 1:
          dispatch('saveData', { data: `stress-data-${i}` });
          break;
        case 2:
          dispatch('scrollEvent', { position: i * 10 });
          break;
        case 3:
          dispatch('buttonClick', { buttonId: `stress-btn-${i}` });
          break;
      }
      
      if (i % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 50)); // 10개마다 잠시 대기
      }
    }
    
    setBulkTestRunning(false);
    actionLogger.logSystem('스트레스 테스트 완료', {
      context: 'ActionGuard Test',
      toast: { type: 'success', message: '스트레스 테스트 완료!' }
    });
  }, [dispatch, bulkTestRunning, isPaused, actionLogger]);

  // 테스트 일시정지/재개
  const togglePause = useCallback(() => {
    setIsPaused(prev => !prev);
    if (isPaused) {
      actionLogger.logSystem('테스트 재개', { context: 'ActionGuard Test' });
    } else {
      actionLogger.logSystem('테스트 일시정지', { context: 'ActionGuard Test' });
    }
  }, [isPaused, actionLogger]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (autoScrollInterval.current) {
        clearInterval(autoScrollInterval.current);
      }
    };
  }, []);

  return (
    <div className="action-guard-test">
      <header className="page-header">
        <h1>ActionGuard Advanced Testing Suite</h1>
        <p className="page-description">
          dispatch 옵션(debounce, throttle, validation, condition 등)과 성능 모니터링을 
          실시간으로 테스트하고 분석할 수 있습니다.
        </p>
      </header>

      {/* 성능 메트릭 대시보드 */}
      <div className="demo-card mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3>📊 실시간 성능 메트릭</h3>
          <div className="flex gap-2">
            {(bulkTestRunning || isAutoScrolling) && (
              <button 
                onClick={togglePause} 
                className={`btn btn-small ${isPaused ? 'btn-success' : 'btn-warning'}`}
              >
                {isPaused ? '▶️ 재개' : '⏸️ 일시정지'}
              </button>
            )}
            <button onClick={resetMetrics} className="btn btn-small btn-secondary">
              🔄 Reset
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="metric-item">
            <div className="metric-value">{metrics.totalDispatches}</div>
            <div className="metric-label">총 실행</div>
          </div>
          <div className="metric-item">
            <div className="metric-value">{metrics.throttledCount}</div>
            <div className="metric-label">Throttled</div>
          </div>
          <div className="metric-item">
            <div className="metric-value">{metrics.debouncedCount}</div>
            <div className="metric-label">Debounced</div>
          </div>
          <div className="metric-item">
            <div className="metric-value">{metrics.averageExecutionTime}ms</div>
            <div className="metric-label">평균 시간</div>
          </div>
          <div className="metric-item">
            <div className="metric-value">{metrics.lastExecutionTime.toFixed(2)}ms</div>
            <div className="metric-label">최근 실행</div>
          </div>
        </div>
      </div>

      {/* 일괄 테스트 컨트롤 */}
      <div className="demo-card mb-6">
        <h3>🚀 고급 테스트 시나리오</h3>
        <p className="text-sm text-gray-600 mb-4">
          복합적인 테스트 시나리오를 실행하여 ActionGuard의 성능과 안정성을 검증합니다.
        </p>
        <div className="button-group">
          <button 
            onClick={runBulkTest} 
            disabled={bulkTestRunning}
            className="btn btn-primary"
          >
            {bulkTestRunning ? '실행 중...' : '📦 일괄 테스트'}
          </button>
          <button 
            onClick={runStressTest} 
            disabled={bulkTestRunning}
            className="btn btn-warning"
          >
            {bulkTestRunning ? '실행 중...' : '⚡ 스트레스 테스트'}
          </button>
          <button 
            onClick={() => {
              handlePriorityTest();
              setTimeout(() => handleAsyncTest('Batch Async', 1500), 100);
              setTimeout(() => handleErrorTest(false), 200);
            }} 
            className="btn btn-secondary"
          >
            🎯 복합 테스트
          </button>
        </div>
        {bulkTestRunning && (
          <div className="mt-3 p-3 bg-blue-50 rounded text-sm">
            <div className="flex items-center gap-2">
              <div className="loading-spinner"></div>
              <span>테스트 실행 중... {isPaused ? '(일시정지됨)' : ''}</span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 기본 테스트 */}
        <div className="space-y-6">
          <div className="demo-card">
            <h3>🔄 Debounce 테스트 (300ms)</h3>
            <p className="text-sm text-gray-600 mb-3">
              빠르게 타이핑하면 마지막 입력 후 300ms 뒤에만 실행됩니다.
            </p>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="검색어를 입력하세요..."
              className="text-input"
            />
            <div className="mt-2 text-xs text-gray-500">
              현재 검색어: "{searchQuery}"
            </div>
          </div>

          <div className="demo-card">
            <h3>⏱️ Throttle 테스트 (1초)</h3>
            <p className="text-sm text-gray-600 mb-3">
              1초에 최대 1번만 실행됩니다. 빠르게 클릭해보세요.
            </p>
            <div className="space-y-2">
              <input
                type="text"
                value={saveData}
                onChange={(e) => setSaveData(e.target.value)}
                placeholder="저장할 데이터"
                className="text-input"
              />
              <button onClick={handleSaveClick} className="btn btn-primary w-full">
                💾 데이터 저장 (Throttled)
              </button>
            </div>
          </div>

          <div className="demo-card">
            <h3>📜 스크롤 테스트 (100ms throttle)</h3>
            <div className="space-y-2">
              <div className="text-sm">현재 위치: {scrollPosition}px</div>
              <div className="button-group">
                <button onClick={handleScrollSimulation} className="btn btn-secondary">
                  수동 스크롤
                </button>
                <button 
                  onClick={isAutoScrolling ? stopAutoScroll : startAutoScroll}
                  className={`btn ${isAutoScrolling ? 'btn-danger' : 'btn-success'}`}
                >
                  {isAutoScrolling ? '자동 정지' : '자동 스크롤'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 고급 테스트 */}
        <div className="space-y-6">
          <div className="demo-card">
            <h3>📝 양식 검증 테스트</h3>
            <div className="space-y-2">
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="이름 (필수)"
                className="text-input"
              />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="이메일 (필수)"
                className="text-input"
              />
              <input
                type="number"
                value={formData.age}
                onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                placeholder="나이"
                className="text-input"
              />
              <button onClick={handleFormValidation} className="btn btn-primary w-full">
                ✅ 양식 검증
              </button>
            </div>
          </div>

          <div className="demo-card">
            <h3>⚡ 비동기 작업 테스트</h3>
            <div className="button-group">
              <button 
                onClick={() => handleAsyncTest('API Call', 1000)}
                className="btn btn-secondary"
              >
                API 호출 (1s)
              </button>
              <button 
                onClick={() => handleAsyncTest('File Upload', 2000)}
                className="btn btn-secondary"
              >
                파일 업로드 (2s)
              </button>
              <button 
                onClick={() => handleAsyncTest('Database Query', 500)}
                className="btn btn-secondary"
              >
                DB 쿼리 (0.5s)
              </button>
            </div>
          </div>

          <div className="demo-card">
            <h3>❌ 에러 처리 테스트</h3>
            <div className="button-group">
              <button 
                onClick={() => handleErrorTest(false)}
                className="btn btn-success"
              >
                성공 케이스
              </button>
              <button 
                onClick={() => handleErrorTest(true)}
                className="btn btn-danger"
              >
                실패 케이스
              </button>
            </div>
          </div>

          <div className="demo-card">
            <h3>🎯 우선순위 테스트</h3>
            <button onClick={handlePriorityTest} className="btn btn-primary w-full">
              우선순위 액션 실행
            </button>
            <p className="text-xs text-gray-500 mt-2">
              우선순위 순서: P5(High) → P3(Medium) → P1(Low)
            </p>
          </div>
        </div>

        {/* 테스트 결과 */}
        <div className="demo-card">
          <div className="flex justify-between items-center mb-3">
            <h3>📋 최근 테스트 결과</h3>
            <div className="text-xs text-gray-500">
              {testResults.length > 0 && `${testResults.length}/20 결과`}
            </div>
          </div>
          <div className="test-results">
            {testResults.length === 0 ? (
              <div className="text-gray-500 text-center py-4">
                테스트를 실행하면 결과가 표시됩니다
              </div>
            ) : (
              testResults.map((result) => (
                <div 
                  key={result.id} 
                  className={`test-result-item ${result.status}`}
                >
                  <div className="test-result-header">
                    <span className="test-name">{result.testName}</span>
                    <div className="flex items-center gap-2">
                      <span className="execution-time">
                        {result.executionTime > 0 ? `${result.executionTime.toFixed(1)}ms` : ''}
                      </span>
                      <span className={`status-badge ${result.status}`}>
                        {result.status === 'success' ? '✅' : '❌'}
                      </span>
                    </div>
                  </div>
                  <div className="test-message">{result.message}</div>
                  <div className="test-time">
                    {result.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              ))
            )}
          </div>
          
          {/* 테스트 결과 통계 */}
          {testResults.length > 0 && (
            <div className="test-stats mt-4 pt-3 border-t border-gray-200">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="stat-item">
                  <div className="stat-value text-green-600">
                    {testResults.filter(r => r.status === 'success').length}
                  </div>
                  <div className="stat-label">성공</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value text-red-600">
                    {testResults.filter(r => r.status === 'failed').length}
                  </div>
                  <div className="stat-label">실패</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value text-blue-600">
                    {testResults.length > 0 ? 
                      `${((testResults.filter(r => r.status === 'success').length / testResults.length) * 100).toFixed(1)}%` 
                      : '0%'}
                  </div>
                  <div className="stat-label">성공률</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 사용법 안내 */}
      <div className="demo-card mt-6">
        <h3>💡 ActionGuard 옵션 가이드</h3>
        <div className="code-example-grid">
          <div className="code-example-item">
            <h4>Debounce</h4>
            <pre className="code-block">
{`dispatch('searchUser', { query }, { 
  debounce: 300 
});`}
            </pre>
            <p>마지막 호출 후 지정 시간 대기</p>
          </div>
          
          <div className="code-example-item">
            <h4>Throttle</h4>
            <pre className="code-block">
{`dispatch('saveData', { data }, { 
  throttle: 1000 
});`}
            </pre>
            <p>지정 시간 간격으로 최대 1번 실행</p>
          </div>
          
          <div className="code-example-item">
            <h4>Validation</h4>
            <pre className="code-block">
{`register('action', handler, {
  validation: (payload) => {
    if (!payload.email.includes('@')) {
      throw new Error('Invalid email');
    }
  }
});`}
            </pre>
            <p>실행 전 유효성 검사</p>
          </div>
          
          <div className="code-example-item">
            <h4>Condition</h4>
            <pre className="code-block">
{`register('action', handler, {
  condition: (payload) => 
    payload.data.length > 0
});`}
            </pre>
            <p>조건부 실행</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// 페이지 래퍼
function ActionGuardTestPage() {
  return (
    <PageWithLogMonitor 
      pageId="actionguard-test" 
      title="ActionGuard Testing Suite"
      initialConfig={{ enableToast: true, maxLogs: 200 }}
    >
      <ActionGuardContext.Provider registryId="action-guard-test">
        <ActionGuardTest />
      </ActionGuardContext.Provider>
    </PageWithLogMonitor>
  );
}

export default ActionGuardTestPage;

// 스타일 추가
const styles = `
  .metric-item {
    text-align: center;
    padding: 1rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    background: #f9fafb;
  }
  
  .metric-value {
    font-size: 1.5rem;
    font-weight: bold;
    color: #1f2937;
    margin-bottom: 0.25rem;
  }
  
  .metric-label {
    font-size: 0.75rem;
    color: #6b7280;
    text-transform: uppercase;
    font-weight: 500;
  }
  
  .test-results {
    max-height: 400px;
    overflow-y: auto;
    space-y: 0.5rem;
  }
  
  .test-result-item {
    padding: 0.75rem;
    border-radius: 0.5rem;
    border: 1px solid #e5e7eb;
    margin-bottom: 0.5rem;
  }
  
  .test-result-item.success {
    background: #f0fdf4;
    border-color: #bbf7d0;
  }
  
  .test-result-item.failed {
    background: #fef2f2;
    border-color: #fecaca;
  }
  
  .test-result-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.25rem;
  }
  
  .test-name {
    font-weight: 600;
    color: #1f2937;
    font-size: 0.875rem;
  }
  
  .status-badge {
    font-size: 0.75rem;
  }
  
  .test-message {
    font-size: 0.75rem;
    color: #4b5563;
    margin-bottom: 0.25rem;
  }
  
  .test-time {
    font-size: 0.625rem;
    color: #9ca3af;
    font-family: 'Monaco', 'Menlo', monospace;
  }
  
  .execution-time {
    font-size: 0.6875rem;
    color: #6b7280;
    font-family: 'Monaco', 'Menlo', monospace;
    font-weight: 500;
    background: #f3f4f6;
    padding: 0.125rem 0.375rem;
    rounded: 0.25rem;
    border-radius: 0.25rem;
  }
  
  .loading-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid #e5e7eb;
    border-top: 2px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .test-stats .stat-item {
    padding: 0.5rem;
  }
  
  .test-stats .stat-value {
    font-size: 1.25rem;
    font-weight: bold;
    margin-bottom: 0.25rem;
  }
  
  .test-stats .stat-label {
    font-size: 0.75rem;
    color: #6b7280;
    text-transform: uppercase;
    font-weight: 500;
  }
  
  .code-example-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1rem;
    margin-top: 1rem;
  }
  
  .code-example-item {
    padding: 1rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    background: #f9fafb;
  }
  
  .code-example-item h4 {
    margin-bottom: 0.5rem;
    color: #1f2937;
    font-weight: 600;
  }
  
  .code-example-item p {
    margin-top: 0.5rem;
    font-size: 0.875rem;
    color: #6b7280;
  }
`;

// DOM에 스타일 추가
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);
}