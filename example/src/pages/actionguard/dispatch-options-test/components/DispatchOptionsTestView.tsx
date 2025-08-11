/**
 * @fileoverview Dispatch Options Test View Component - View Layer
 * 
 * Hook을 통해 Data/Action과 연결되는 View 컴포넌트입니다.
 */

import { DemoCard, Button, Input, CodeBlock } from '../../../../components/ui';
import { useDispatchOptionsTestLogic } from '../hooks/useDispatchOptionsTestLogic';
import { DispatchOptionsTestStyles } from './DispatchOptionsTestStyles';

/**
 * 디스패치 옵션 테스트 View 컴포넌트
 * 
 * Hook Layer를 통해 데이터와 액션을 받아 UI를 렌더링합니다.
 */
export function DispatchOptionsTestView() {
  const {
    testState,
    searchUser,
    saveData,
    scrollEvent,
    buttonClick,
    validateForm,
    asyncOperation,
    errorTest,
    conditionalAction,
    priorityTest,
    updateSearchQuery,
    updateSaveData,
    updateScrollPosition,
    updateFormData,
    startAutoScrolling,
    stopAutoScrolling,
    togglePause,
    resetMetrics,
    runBulkTest,
    stopBulkTest,
    canOperate,
    recentResults,
    successRate,
  } = useDispatchOptionsTestLogic();

  return (
    <div className="space-y-6">
      <DispatchOptionsTestStyles />
      <header className="page-header">
        <h1>🧪 Dispatch Options Comprehensive Test</h1>
        <p className="page-description">
          This comprehensive testing suite demonstrates all Context-Action framework dispatch options: 
          <strong>debouncing (300ms)</strong>, <strong>throttling (1000ms, 100ms)</strong>, 
          <strong>priority handling</strong>, and <strong>async operations</strong>. 
          Use this page to understand performance characteristics and test different scenarios.
        </p>
        <div className="mt-3 text-sm text-gray-600">
          <strong>Features:</strong> Real-time metrics • Bulk testing • Auto-scrolling • Form validation • Error handling
        </div>
      </header>

      {/* 성능 메트릭 대시보드 */}
      <DemoCard>
        <h3 className="text-lg font-semibold mb-4">📊 성능 메트릭</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="metric-item">
            <div className="metric-value">{testState.metrics.totalDispatches}</div>
            <div className="metric-label">총 디스패치</div>
          </div>
          <div className="metric-item">
            <div className="metric-value">{testState.metrics.throttledCount}</div>
            <div className="metric-label">스로틀</div>
          </div>
          <div className="metric-item">
            <div className="metric-value">{testState.metrics.debouncedCount}</div>
            <div className="metric-label">디바운스</div>
          </div>
          <div className="metric-item">
            <div className="metric-value">
              {testState.metrics.averageExecutionTime.toFixed(2)}ms
            </div>
            <div className="metric-label">평균 실행시간</div>
          </div>
          <div className="metric-item">
            <div className="metric-value">{successRate}%</div>
            <div className="metric-label">성공률</div>
          </div>
        </div>
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-gray-600">
            마지막 실행: {testState.metrics.lastExecutionTime.toFixed(2)}ms
          </div>
          <Button onClick={resetMetrics} variant="outline" size="sm">
            🔄 메트릭 리셋
          </Button>
        </div>
      </DemoCard>

      {/* 개별 테스트 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Debounce 테스트 */}
        <DemoCard>
          <h3 className="text-lg font-semibold mb-4">🔍 Debounce 테스트 (검색)</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                검색 쿼리 (300ms 디바운스)
              </label>
              <Input
                type="text"
                value={testState.searchQuery}
                onChange={(e) => {
                  updateSearchQuery(e.target.value);
                  searchUser(e.target.value);
                }}
                placeholder="검색어를 입력하세요..."
                disabled={!canOperate}
              />
            </div>
            <p className="text-sm text-gray-600">
              빠르게 타이핑하면 300ms 후에 한 번만 실행됩니다.
            </p>
          </div>
        </DemoCard>

        {/* Throttle 테스트 */}
        <DemoCard>
          <h3 className="text-lg font-semibold mb-4">💾 Throttle 테스트 (저장)</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                저장할 데이터 (1초 스로틀)
              </label>
              <Input
                type="text"
                value={testState.saveData}
                onChange={(e) => updateSaveData(e.target.value)}
                placeholder="저장할 데이터..."
                disabled={!canOperate}
              />
            </div>
            <Button 
              onClick={() => saveData(testState.saveData)}
              variant="primary"
              disabled={!canOperate}
            >
              💾 데이터 저장 (연속 클릭 테스트)
            </Button>
            <p className="text-sm text-gray-600">
              연속으로 클릭해도 1초에 한 번만 실행됩니다.
            </p>
          </div>
        </DemoCard>
      </div>

      {/* 스크롤 테스트 */}
      <DemoCard>
        <h3 className="text-lg font-semibold mb-4">📜 Scroll 테스트 (100ms 스로틀)</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">위치:</label>
              <span className="font-mono text-blue-600">{testState.scrollPosition}px</span>
            </div>
            <Input
              type="range"
              min="0"
              max="1000"
              value={testState.scrollPosition}
              onChange={(e) => {
                const position = Number(e.target.value);
                updateScrollPosition(position);
                scrollEvent(position);
              }}
              className="flex-1"
              disabled={!canOperate}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={testState.isAutoScrolling ? stopAutoScrolling : startAutoScrolling}
              variant={testState.isAutoScrolling ? 'danger' : 'success'}
              disabled={!canOperate}
            >
              {testState.isAutoScrolling ? '⏹️ 자동 스크롤 중지' : '▶️ 자동 스크롤 시작'}
            </Button>
            {testState.isAutoScrolling && (
              <Button
                onClick={togglePause}
                variant="secondary"
                disabled={!canOperate}
              >
                {testState.isPaused ? '▶️ 재개' : '⏸️ 일시정지'}
              </Button>
            )}
          </div>
          <p className="text-sm text-gray-600">
            슬라이더를 빠르게 움직이거나 자동 스크롤을 사용하여 스로틀링 효과를 확인하세요.
          </p>
        </div>
      </DemoCard>

      {/* 폼 검증 테스트 */}
      <DemoCard>
        <h3 className="text-lg font-semibold mb-4">📋 Form Validation 테스트 (500ms 디바운스)</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
              <Input
                type="text"
                value={testState.formData.name}
                onChange={(e) => updateFormData({ name: e.target.value })}
                placeholder="이름을 입력하세요"
                disabled={!canOperate}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
              <Input
                type="email"
                value={testState.formData.email}
                onChange={(e) => updateFormData({ email: e.target.value })}
                placeholder="이메일을 입력하세요"
                disabled={!canOperate}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">나이</label>
              <Input
                type="number"
                value={testState.formData.age}
                onChange={(e) => updateFormData({ age: e.target.value })}
                placeholder="나이를 입력하세요"
                disabled={!canOperate}
              />
            </div>
          </div>
          <Button
            onClick={() => validateForm(testState.formData)}
            variant="primary"
            disabled={!canOperate}
          >
            ✅ 폼 검증 실행
          </Button>
          <p className="text-sm text-gray-600">
            입력 중에는 500ms 디바운스가 적용되어 검증이 지연됩니다.
          </p>
        </div>
      </DemoCard>

      {/* 추가 테스트 옵션 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DemoCard>
          <h3 className="text-lg font-semibold mb-4">🎯 특수 테스트</h3>
          <div className="space-y-3">
            <Button
              onClick={() => buttonClick('special-button')}
              variant="secondary"
              disabled={!canOperate}
              className="w-full"
            >
              🔘 일반 버튼 클릭
            </Button>
            <Button
              onClick={() => asyncOperation('test-async', 1000)}
              variant="primary"
              disabled={!canOperate}
              className="w-full"
            >
              ⏱️ 비동기 작업 (1초 지연)
            </Button>
            <div className="flex gap-2">
              <Button
                onClick={() => errorTest(false)}
                variant="success"
                disabled={!canOperate}
                className="flex-1"
              >
                ✅ 성공 테스트
              </Button>
              <Button
                onClick={() => errorTest(true)}
                variant="danger"
                disabled={!canOperate}
                className="flex-1"
              >
                ❌ 에러 테스트
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => conditionalAction(true, 'condition-met')}
                variant="success"
                disabled={!canOperate}
                className="flex-1"
              >
                ✅ 조건 충족
              </Button>
              <Button
                onClick={() => conditionalAction(false, 'condition-not-met')}
                variant="secondary"
                disabled={!canOperate}
                className="flex-1"
              >
                ❌ 조건 불충족
              </Button>
            </div>
            <Button
              onClick={() => priorityTest(Math.floor(Math.random() * 100), 'priority test')}
              variant="primary"
              disabled={!canOperate}
              className="w-full"
            >
              🏆 우선순위 테스트 (랜덤)
            </Button>
          </div>
        </DemoCard>

        <DemoCard>
          <h3 className="text-lg font-semibold mb-4">🚀 벌크 테스트</h3>
          <div className="space-y-3">
            <Button
              onClick={testState.bulkTestRunning ? stopBulkTest : runBulkTest}
              variant={testState.bulkTestRunning ? 'danger' : 'success'}
              disabled={!canOperate}
              className="w-full"
            >
              {testState.bulkTestRunning ? '⏹️ 벌크 테스트 중지' : '🚀 벌크 테스트 실행'}
            </Button>
            {testState.bulkTestRunning && (
              <div className="p-3 bg-blue-50 rounded-lg text-sm">
                <div className="flex items-center gap-2">
                  <div className="loading-spinner" />
                  <span>모든 테스트를 순차적으로 실행 중...</span>
                </div>
              </div>
            )}
            <p className="text-sm text-gray-600">
              모든 액션 유형을 순차적으로 실행하여 종합적인 성능을 테스트합니다.
            </p>
          </div>
        </DemoCard>
      </div>

      {/* 최근 테스트 결과 */}
      <DemoCard>
        <h3 className="text-lg font-semibold mb-4">📋 최근 테스트 결과</h3>
        {recentResults.length > 0 ? (
          <div className="space-y-2">
            {recentResults.map((result) => (
              <div
                key={result.id}
                className={`p-3 rounded-lg border-l-4 ${
                  result.status === 'success'
                    ? 'border-green-500 bg-green-50'
                    : result.status === 'failed'
                    ? 'border-red-500 bg-red-50'
                    : 'border-yellow-500 bg-yellow-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold text-sm">
                      {result.status === 'success' ? '✅' : result.status === 'failed' ? '❌' : '⏳'}{' '}
                      {result.testName}
                    </div>
                    <div className="text-sm text-gray-600">{result.message}</div>
                  </div>
                  <div className="text-xs text-gray-500 text-right">
                    <div>{result.timestamp.toLocaleTimeString()}</div>
                    {result.executionTime > 0 && (
                      <div>{result.executionTime.toFixed(2)}ms</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            아직 실행된 테스트가 없습니다. 위의 테스트 버튼들을 클릭해보세요.
          </div>
        )}
      </DemoCard>

      {/* 옵션 설명 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DemoCard variant="info">
          <h3 className="text-lg font-semibold mb-4">📚 Dispatch 옵션 설명</h3>
          <div className="space-y-3 text-sm">
            <div>
              <strong>Throttle:</strong> 지정된 시간 간격 내에 첫 번째 호출만 실행하고 나머지는 무시
              <CodeBlock>
                {`register('action', handler, { throttle: 1000 })`}
              </CodeBlock>
            </div>
            <div>
              <strong>Debounce:</strong> 연속 호출 시 마지막 호출 후 지정 시간이 지나면 실행
              <CodeBlock>
                {`register('action', handler, { debounce: 300 })`}
              </CodeBlock>
            </div>
            <div>
              <strong>Priority:</strong> 액션 실행 우선순위 설정 (높을수록 우선)
              <CodeBlock>
                {`register('action', handler, { priority: 100 })`}
              </CodeBlock>
            </div>
          </div>
        </DemoCard>

        <DemoCard variant="info">
          <h3 className="text-lg font-semibold mb-4">💡 성능 최적화 팁</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✅</span>
              <span>검색, 자동완성 → debounce 사용</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✅</span>
              <span>스크롤, 리사이즈 → throttle 사용</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✅</span>
              <span>중요한 액션 → priority 설정</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✅</span>
              <span>조건부 실행 → controller.skip() 활용</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✅</span>
              <span>에러 처리 → controller.abort() 활용</span>
            </div>
          </div>
        </DemoCard>
      </div>
    </div>
  );
}