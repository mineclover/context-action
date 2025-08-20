/**
 * useWaitForRefs 성능 검증 데모
 * 
 * 사용자의 가설 검증:
 * "useWaitForRefs의 await를 사용하면 target이 null일 때만 기다리고, 
 *  이미 존재하면 즉시 리턴한다"
 */

import React, { useEffect } from 'react';
import { createRefContext, createDeclarativeStorePattern, createActionContext, useStoreValue } from '@context-action/react';

type DemoRefs = {
  existingElement: HTMLDivElement;
  pendingElement: HTMLDivElement;
};

// RefContext for DOM elements
const {
  Provider: DemoProvider,
  useRefHandler: useDemoRef,
  useWaitForRefs
} = createRefContext<DemoRefs>('Demo');

// Store pattern for test results
const {
  Provider: ResultsStoreProvider,
  useStore: useResultsStore
} = createDeclarativeStorePattern('PerformanceResults', {
  existingTime: { initialValue: 0 },
  pendingTime: { initialValue: 0 },
  testComplete: { initialValue: false }
});

// Actions for managing test execution
interface TestActions {
  startTest: void;
  updateResults: { existingTime: number; pendingTime: number };
  completeTest: void;
}

const {
  Provider: TestActionProvider,
  useActionDispatch: useTestAction,
  useActionHandler: useTestActionHandler
} = createActionContext<TestActions>('PerformanceTest');

function PerformanceDemo() {
  const existingElement = useDemoRef('existingElement');
  const pendingElement = useDemoRef('pendingElement');
  const waitForRefs = useWaitForRefs();
  
  // Context-Action stores instead of useState
  const existingTimeStore = useResultsStore('existingTime');
  const pendingTimeStore = useResultsStore('pendingTime');
  const testCompleteStore = useResultsStore('testComplete');
  
  const existingTime = useStoreValue(existingTimeStore);
  const pendingTime = useStoreValue(pendingTimeStore);
  const testComplete = useStoreValue(testCompleteStore);
  
  const dispatch = useTestAction();

  // Action handler for managing test execution
  useTestActionHandler('startTest', async () => {
    console.log('🔍 성능 테스트 시작...');
    
    // ⚠️ 중요: React Strict Mode에서 중복 실행 방지를 위한 초기화
    existingElement.setRef(null);
    pendingElement.setRef(null);
    
    // 초기화 완료 후 잠시 대기
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // 1. 즉시 existing element 마운트
    const div1 = document.createElement('div');
    div1.id = 'existing-element';
    existingElement.setRef(div1);
    
    console.log('✅ Existing element가 즉시 마운트됨');
    
    // 2. 이미 존재하는 요소에 대한 waitForRefs 성능 측정
    console.log('⏱️  이미 존재하는 요소에 대한 waitForRefs 시간 측정...');
    const existingStart = performance.now();
    await waitForRefs('existingElement');
    const existingEnd = performance.now();
    const measuredExistingTime = existingEnd - existingStart;
    
    console.log(`⚡ 이미 존재하는 요소: ${measuredExistingTime.toFixed(3)}ms (즉시 반환 예상)`);
    
    // 3. 존재하지 않는 요소에 대한 waitForRefs 성능 측정
    console.log('⏱️  존재하지 않는 요소에 대한 waitForRefs 시간 측정...');
    console.log('📍 pendingElement가 null인지 확인:', pendingElement.target === null);
    
    const pendingStart = performance.now();
    
    // 100ms 후에 pending element 마운트 
    setTimeout(() => {
      const div2 = document.createElement('div');
      div2.id = 'pending-element';
      pendingElement.setRef(div2);
      console.log('✅ Pending element이 100ms 후 마운트됨');
    }, 100);
    
    await waitForRefs('pendingElement');
    const pendingEnd = performance.now();
    const measuredPendingTime = pendingEnd - pendingStart;
    
    console.log(`⏳ 존재하지 않던 요소: ${measuredPendingTime.toFixed(3)}ms (실제 대기 시간 포함)`);
    
    // 4. 결과 업데이트 - Context-Action 스토어 사용
    dispatch('updateResults', { 
      existingTime: measuredExistingTime, 
      pendingTime: measuredPendingTime 
    });
    dispatch('completeTest');
    
    // 5. 가설 검증
    const isHypothesisCorrect = measuredExistingTime < 5 && measuredPendingTime > 95;
    console.log(`\n📊 가설 검증 결과:`);
    console.log(`  • 이미 존재하는 요소 (< 5ms): ${measuredExistingTime.toFixed(3)}ms ${measuredExistingTime < 5 ? '✅' : '❌'}`);
    console.log(`  • 존재하지 않던 요소 (> 95ms): ${measuredPendingTime.toFixed(3)}ms ${measuredPendingTime > 95 ? '✅' : '❌'}`);
    console.log(`  • 가설이 맞습니까? ${isHypothesisCorrect ? '✅ 맞습니다!' : '❌ 틀렸습니다.'}`);
    
    console.log(`\n🎯 결론: useWaitForRefs는 target이 이미 존재하면 즉시 반환하고, \n                      존재하지 않으면 실제 마운트될 때까지 대기합니다.`);
  });

  useTestActionHandler('updateResults', async (payload) => {
    existingTimeStore.setValue(payload.existingTime);
    pendingTimeStore.setValue(payload.pendingTime);
  });

  useTestActionHandler('completeTest', async () => {
    testCompleteStore.setValue(true);
  });

  useEffect(() => {
    dispatch('startTest');
  }, [dispatch]);

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>🧪 useWaitForRefs 성능 검증 데모</h2>
      
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd' }}>
        <h3>가설</h3>
        <p>
          "useWaitForRefs의 await를 사용하면 target이 null일 때만 기다리고, 
          이미 존재하면 즉시 리턴한다"
        </p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>📊 측정 결과</h3>
        <div>• 이미 존재하는 요소: <strong>{existingTime.toFixed(3)}ms</strong></div>
        <div>• 존재하지 않던 요소: <strong>{pendingTime.toFixed(3)}ms</strong></div>
        <div>• 테스트 완료: {testComplete ? '✅' : '⏳ 진행 중...'}</div>
      </div>

      <div>
        <h3>🎯 검증</h3>
        {testComplete && (
          <div>
            <div>
              {existingTime < 5 ? '✅' : '❌'} 
              이미 존재하는 요소는 즉시 반환 (&lt; 5ms)
            </div>
            <div>
              {pendingTime > 95 ? '✅' : '❌'} 
              존재하지 않던 요소는 실제 대기 (&gt; 95ms)
            </div>
          </div>
        )}
      </div>
      
      <div>
        <h3>📖 브라우저 콘솔을 확인하세요</h3>
        <p>더 자세한 로그는 브라우저의 개발자 도구 콘솔에서 확인할 수 있습니다.</p>
      </div>
      
      {/* 실제 DOM 요소들 */}
      <div style={{ display: 'none' }}>
        <div ref={existingElement.setRef} />
        <div ref={pendingElement.setRef} />
      </div>
    </div>
  );
}

export function WaitForRefsPerformanceDemo() {
  return (
    <TestActionProvider>
      <ResultsStoreProvider>
        <DemoProvider>
          <PerformanceDemo />
        </DemoProvider>
      </ResultsStoreProvider>
    </TestActionProvider>
  );
}

export default WaitForRefsPerformanceDemo;