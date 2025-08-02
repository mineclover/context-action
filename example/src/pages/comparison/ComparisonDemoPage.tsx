import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createStore, useStoreValue } from '@context-action/react';
import { ErrorBoundary } from './ErrorBoundary';
import { PageWithLogMonitor, useActionLoggerWithToast } from '../../components/LogMonitor/';

// 안전 장치 설정
const RENDER_LIMIT = 15; // 렌더링 임계치
const AUTO_STOP_LIMIT = 20; // 자동 중단 임계치

// 참조 안정한 렌더링 카운터 훅 (useMemo로 참조 안정화)
function useRenderCounter(name: string) {
  const renderCount = useRef(0);
  const hasLoggedStop = useRef(false);
  
  // 실제 렌더링될 때마다 카운트 증가
  renderCount.current += 1;
  
  // 계산된 값들
  const currentCount = renderCount.current;
  const isExceeded = currentCount > AUTO_STOP_LIMIT;
  
  // 한 번만 에러 로깅
  if (isExceeded && !hasLoggedStop.current) {
    console.error(`🚨 EMERGENCY STOP: ${name} exceeded ${AUTO_STOP_LIMIT} renders!`);
    hasLoggedStop.current = true;
  }
  
  // 처음 5회만 일반 로깅
  useEffect(() => {
    if (currentCount <= 5) {
      console.log(`🔄 ${name} rendered: ${currentCount} times`);
    }
  }, [name, currentCount]); // currentCount를 의존성에 포함하되 useMemo로 안정화
  
  // 🎯 핵심: useMemo로 객체 참조 안정화
  // 실제 값이 변경될 때만 새 객체 생성
  return useMemo(() => ({
    renderCount: currentCount,
    stopped: isExceeded
  }), [currentCount, isExceeded]);
}

// 데이터 패턴 타입 정의
type DataPattern = 
  | 'primitive'
  | 'simple-object'
  | 'nested-object'
  | 'array-simple'
  | 'array-complex'
  | 'mixed-complex'
  | 'changing-shape'
  | 'large-object';

// 데이터 패턴 생성기
function generateDataPattern(pattern: DataPattern, iteration: number = 0) {
  switch (pattern) {
    case 'primitive':
      return `test-value-${iteration}`;
    
    case 'simple-object':
      return {
        id: `item-${iteration}`,
        name: 'Test Item',
        active: true,
        count: 42
      };
    
    case 'nested-object':
      return {
        user: {
          id: `user-${iteration}`,
          profile: {
            name: 'John Doe',
            settings: {
              theme: 'light',
              notifications: true,
              preferences: {
                language: 'ko',
                timezone: 'Asia/Seoul'
              }
            }
          }
        },
        metadata: {
          lastUpdated: new Date().toISOString(),
          version: '1.0.0'
        }
      };
    
    case 'array-simple':
      return ['item1', 'item2', `item${iteration}`, 'item4'];
    
    case 'array-complex':
      return [
        { id: 1, name: 'First' },
        { id: 2, name: 'Second' },
        { id: iteration, name: `Dynamic-${iteration}` },
        { id: 4, name: 'Fourth' }
      ];
    
    case 'mixed-complex':
      return {
        primitive: `value-${iteration}`,
        array: [1, 2, iteration],
        nested: {
          deep: {
            value: `nested-${iteration}`,
            list: ['a', 'b', `c-${iteration}`]
          }
        },
        timestamp: Date.now()
      };
    
    case 'changing-shape':
      // 매번 다른 프로퍼티 구조
      const base = { id: iteration, name: 'Base' };
      if (iteration % 3 === 0) return { ...base, extra: 'property' };
      if (iteration % 3 === 1) return { ...base, different: 'field', nested: { value: iteration } };
      return base;
    
    case 'large-object':
      // 큰 객체 (성능 테스트용)
      const large: any = { id: iteration };
      for (let i = 0; i < 50; i++) {
        large[`field_${i}`] = `value_${i}_${iteration}`;
      }
      return large;
    
    default:
      return `default-${iteration}`;
  }
}

// 데이터 패턴 설명
const DATA_PATTERN_INFO = {
  primitive: { name: '원시 값', desc: 'String, Number 등 단순 값', strategy: 'reference' },
  'simple-object': { name: '단순 객체', desc: '1레벨 프로퍼티만 있는 객체', strategy: 'shallow' },
  'nested-object': { name: '중첩 객체', desc: '깊은 중첩 구조', strategy: 'deep' },
  'array-simple': { name: '단순 배열', desc: '원시 값들의 배열', strategy: 'shallow' },
  'array-complex': { name: '복잡 배열', desc: '객체들의 배열', strategy: 'deep' },
  'mixed-complex': { name: '혼합 복잡', desc: '다양한 타입 혼합', strategy: 'deep' },
  'changing-shape': { name: '변화하는 구조', desc: '매번 다른 프로퍼티', strategy: 'deep' },
  'large-object': { name: '큰 객체', desc: '50개 프로퍼티 (성능 테스트)', strategy: 'shallow' }
} as const;

// 메인 테스트 컴포넌트
function ComparisonTestComponent({ 
  strategy, 
  dataPattern, 
  testId,
  onRenderUpdate 
}: { 
  strategy: 'reference' | 'shallow' | 'deep';
  dataPattern: DataPattern;
  testId: string;
  onRenderUpdate: (testId: string, count: number, stopped: boolean) => void;
}) {
  const { logAction, logSystem, logError } = useActionLoggerWithToast();
  const { renderCount, stopped } = useRenderCounter(`${strategy}-${dataPattern}`);
  const [iteration, setIteration] = useState(0);
  
  // ✅ Hook 규칙 준수: 모든 hook을 항상 호출
  
  // 완전히 독립적인 스토어 생성 (고정된 스토어)
  const testStore = useMemo(() => {
    // 초기 데이터를 Store 생성 시점에 직접 생성
    const initialData = generateDataPattern(dataPattern, 0);
    
    // ✅ 고유한 Store 이름과 개별 설정으로 완전 격리
    const uniqueStoreName = `demo-${strategy}-${dataPattern}-${testId}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const store = createStore<any>(uniqueStoreName, initialData);
    store.setComparisonOptions({ strategy }); // 전역 설정 대신 Store별 설정
    
    return store;
  }, [strategy, dataPattern, testId]); // stopped 의존성 제거
  
  // Store 생성 로깅 (useMemo 외부에서)
  useEffect(() => {
    logSystem(`🔧 Created isolated demo store: demo-${strategy}-${dataPattern} with ${strategy} strategy`);
  }, [logSystem, strategy, dataPattern, testId]);
  
  // Store 값 구독 - fallback 로직 제거로 무한 루프 방지
  const storeValue = useStoreValue(testStore);
  
  // 렌더링 상태 업데이트 (제한된 useEffect)
  useEffect(() => {
    onRenderUpdate(testId, renderCount, stopped);
  }, [testId, onRenderUpdate]); // renderCount, stopped 의존성 제거
  
  // 데이터 변경 트리거 (안전한 버전)
  const updateData = useCallback(() => {
    if (stopped) return;
    const newIteration = iteration + 1;
    setIteration(newIteration);
    const newData = generateDataPattern(dataPattern, newIteration);
    testStore.setValue(newData);
  }, [iteration, dataPattern, testStore, stopped]);
  
  // Store 값 직접 설정 (테스트용)
  const setStoreValue = useCallback(() => {
    if (stopped) return;
    const newData = generateDataPattern(dataPattern, Date.now() % 1000); // 시간 기반 데이터
    testStore.setValue(newData);
  }, [testStore, dataPattern, stopped]);
  

  
  // 위험도 표시
  const getRenderStatus = () => {
    if (renderCount <= 3) return { color: 'text-green-600', icon: '✅', text: 'Safe' };
    if (renderCount <= 8) return { color: 'text-yellow-600', icon: '⚠️', text: 'Watch' };
    if (renderCount <= RENDER_LIMIT) return { color: 'text-orange-600', icon: '🔄', text: 'High' };
    return { color: 'text-red-600', icon: '🚨', text: 'Danger' };
  };
  
  const status = getRenderStatus();
  
  return (
    <ComparisonCard
      strategy={strategy}
      title={strategy.toUpperCase()}
      renderCount={renderCount}
      stopped={stopped}
    >
      <div className="text-xs space-y-2">
        <div className="bg-white p-2 rounded border">
          <strong>Data Preview:</strong><br/>
          <code className="text-xs">
            {storeValue && typeof storeValue === 'object' 
              ? JSON.stringify(storeValue, null, 1).slice(0, 100) + '...'
              : String(storeValue ?? 'empty')
            }
          </code>
        </div>
        
        <div className="flex gap-1">
          <Button 
            onClick={updateData}
            disabled={stopped}
            size="xs"
            variant="primary"
          >
            Update Data
          </Button>
          <Button 
            onClick={setStoreValue}
            disabled={stopped}
            size="xs"
            variant="success"
          >
            Set Store
          </Button>
        </div>
      </div>
    </ComparisonCard>
  );
}

// 내부 컨텐츠 컴포넌트 (Provider 내부에서 사용)
function ComparisonDemoContent() {
  const { logAction, logSystem, logError } = useActionLoggerWithToast();
  const [selectedPattern, setSelectedPattern] = useState<DataPattern>('primitive');
  const [testKey, setTestKey] = useState(0);
  const [renderStats, setRenderStats] = useState<Record<string, { count: number; stopped: boolean }>>({});
  const [isolationId] = useState(() => `demo-isolation-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const pageRenderCount = useRenderCounter('DemoPage');
  
  // 렌더링 상태 업데이트 핸들러 (안정화)
  const handleRenderUpdate = useCallback((testId: string, count: number, stopped: boolean) => {
    // 비동기로 상태 업데이트를 지연시켜 렌더링 루프 방지
    setTimeout(() => {
      setRenderStats(prev => ({
        ...prev,
        [testId]: { count, stopped }
      }));
    }, 0);
  }, []);
  
  // 전체 리셋 (완전 격리)
  const resetAll = useCallback(() => {
    setTestKey(prev => prev + 1);
    setRenderStats({});
    console.clear();
    logAction('resetAllDemos', { isolationId }, { toast: true });
  }, [logAction, isolationId]);
  
  // 패턴 변경
  const changePattern = useCallback((pattern: DataPattern) => {
    setSelectedPattern(pattern);
    setTestKey(prev => prev + 1);
    setRenderStats({});
  }, []);
  
  const patternInfo = DATA_PATTERN_INFO[selectedPattern];
  
  return (
    <Container size="xl">
      {/* 헤더 */}
      <PerformanceCard type="info" title="Store Comparison Logic Demo (Isolated)" icon="⚡" className="mb-6">
        <p className="text-blue-700 text-sm mb-2">
          완전히 격리된 환경에서 다양한 데이터 패턴의 Store 비교 전략 성능 차이를 실시간으로 확인해보세요.
        </p>
        <div className="flex flex-wrap gap-4 text-xs text-blue-600">
          <span>🔒 각 컴포넌트는 독립적인 Store와 설정을 사용하여 상호 영향 없음</span>
          <span>🔄 Page Renders: <strong>{pageRenderCount.renderCount}</strong></span>
          {pageRenderCount.stopped && <span className="text-red-600">🚨 Page Stopped</span>}
        </div>
      </PerformanceCard>
      
      {/* 컨트롤 패널 */}
      <Card className="mb-6">
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2 text-gray-700">Data Pattern</label>
              <select 
                value={selectedPattern}
                onChange={(e) => changePattern(e.target.value as DataPattern)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {Object.entries(DATA_PATTERN_INFO).map(([key, info]) => (
                  <option key={key} value={key}>
                    {info.name} - {info.desc}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={resetAll} variant="primary">
                🔄 Reset All
              </Button>
              <Button onClick={() => window.location.reload()} variant="secondary">
                🔃 Reload Page
              </Button>
            </div>
          </div>
          
          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-700 space-y-1">
              <div><strong>선택된 패턴:</strong> {patternInfo.name}</div>
              <div><strong>설명:</strong> {patternInfo.desc}</div>
              <div><strong>권장 전략:</strong> <Badge variant="primary">{patternInfo.strategy}</Badge></div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* 안전 경고 */}
      {Object.values(renderStats).some(stat => stat.count > RENDER_LIMIT) && (
        <PerformanceCard type="error" title="High Render Count Detected" icon="⚠️" className="mb-6">
          <p className="text-red-700 text-sm mb-3">
            일부 컴포넌트가 {RENDER_LIMIT}회 이상 렌더링되었습니다. 
            이는 비교 전략이 적절하지 않을 수 있음을 의미합니다.
          </p>
          <ul className="text-red-600 text-xs space-y-1 list-disc list-inside">
            <li>Reference 전략: 매번 새로운 객체를 "다름"으로 판단</li>
            <li>Shallow 전략: 1레벨 프로퍼티만 비교</li>
            <li>Deep 전략: 모든 중첩 프로퍼티 비교</li>
          </ul>
        </PerformanceCard>
      )}
      
      {/* 완전히 격리된 비교 테스트 컴포넌트들 */}
      <Grid cols={3} className="mb-6">
        {(['reference', 'shallow', 'deep'] as const).map((strategy) => {
          const uniqueTestId = `${strategy}-${testKey}-${isolationId}`;
          
          return (
            <div key={uniqueTestId}>
              <ErrorBoundary 
                onError={(error, errorInfo) => {
                          logError(`🚨 Error in ${strategy} strategy (${uniqueTestId})`, error);
        logError('Component Error Info', new Error(JSON.stringify(errorInfo)));
                }}
              >
                <ComparisonTestComponent
                  strategy={strategy}
                  dataPattern={selectedPattern}
                  testId={uniqueTestId}
                  onRenderUpdate={handleRenderUpdate}
                />
              </ErrorBoundary>
            </div>
          );
        })}
      </div>
      
      {/* 결과 분석 */}
      <Card className="mb-6">
        <CardContent>
          <h3 className="text-lg font-semibold mb-3">📊 Performance Analysis</h3>
          <Grid cols={3}>
            {(['reference', 'shallow', 'deep'] as const).map((strategy) => {
              const stats = renderStats[`${strategy}-${testKey}`] || { count: 0, stopped: false };
              const efficiency = stats.count <= 3 ? '매우 효율적' : 
                                stats.count <= 8 ? '보통' : 
                                stats.count <= RENDER_LIMIT ? '비효율적' : '위험';
              
              const efficiencyVariant = stats.count <= 3 ? 'success' : 
                                       stats.count <= 8 ? 'default' : 
                                       stats.count <= RENDER_LIMIT ? 'warning' : 'danger';
              
              return (
                <div key={strategy} className="bg-gray-50 p-3 rounded-lg">
                  <h4 className="font-medium mb-2 capitalize text-gray-900">{strategy}</h4>
                  <div className="space-y-2">
                    <div className="text-xs text-gray-600">
                      렌더링: <strong>{stats.count}회</strong>
                    </div>
                    <Badge variant={efficiencyVariant}>{efficiency}</Badge>
                    <div className="text-xs">
                      상태: {stats.stopped ? '🚨 중단됨' : '✅ 정상'}
                    </div>
                  </div>
                </div>
              );
            })}
          </Grid>
        </CardContent>
      </Card>
      
      {/* 가이드라인 */}
      <PerformanceCard type="success" title="Best Practice Guidelines" icon="💡">
        <Grid cols={2} className="text-sm text-blue-700">
          <div>
            <h4 className="font-medium mb-2">언제 어떤 전략을 사용할까?</h4>
            <ul className="space-y-1 list-disc list-inside text-xs">
              <li><strong>Reference:</strong> 원시 값, 안정적인 참조</li>
              <li><strong>Shallow:</strong> 대부분의 객체, 배열 (권장)</li>
              <li><strong>Deep:</strong> 중첩 객체, 복잡한 데이터</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">성능 최적화 팁</h4>
            <ul className="space-y-1 list-disc list-inside text-xs">
              <li>데이터 구조에 맞는 전략 선택</li>
              <li>불필요한 중첩 최소화</li>
              <li>안정적인 참조 사용</li>
              <li>렌더링 카운트 모니터링</li>
            </ul>
          </div>
        </Grid>
      </PerformanceCard>
    </Container>
  );
}

// 메인 페이지 컴포넌트
export default function ComparisonDemoPage() {
  return (
    <PageWithLogMonitor pageId="comparison-demo" title="Store Comparison Logic Demo">
      <ComparisonDemoContent />
    </PageWithLogMonitor>
  );
}