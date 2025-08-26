/**
 * useWaitForRefs 성능 검증 데모
 * 
 * 사용자의 가설 검증:
 * "useWaitForRefs의 await를 사용하면 target이 null일 때만 기다리고, 
 *  이미 존재하면 즉시 리턴한다"
 */

import { useEffect } from 'react';
import { createRefContext, createStoreContext, createActionContext, useStoreValue } from '@context-action/react';

type DemoRefs = {
  existingElement: HTMLDivElement;
  pendingElement: HTMLDivElement;
  interactiveElement: HTMLDivElement;
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
} = createStoreContext('PerformanceResults', {
  existingTime: { initialValue: 0 },
  pendingTime: { initialValue: 0 },
  testComplete: { initialValue: false },
  isMounted: { initialValue: false },
  lastActionTime: { initialValue: 0 },
  actionLog: { initialValue: [] as string[] },
  isWaiting: { initialValue: false },
  isProcessing: { initialValue: false },
  lastTestResult: { initialValue: '' }, // 마지막 테스트 결과
  testResultColor: { initialValue: '#6b7280' }, // 테스트 결과 색상
  activeTest: { initialValue: '' }, // 현재 활성 테스트
  waitAndExecuteStatus: { initialValue: 'idle' }, // waitAndExecute 상태: 'idle' | 'waiting' | 'executing' | 'completed'
  lastTestType: { initialValue: '' }, // 마지막 테스트 타입: 'waitForRefs' | 'waitAndExecute'
  testResultStatus: { initialValue: 'none' } // 테스트 결과 상태: 'none' | 'success' | 'warning' | 'error'
});

// Actions for managing test execution
interface TestActions {
  startTest: void;
  updateResults: { existingTime: number; pendingTime: number };
  completeTest: void;
  mountElement: void;
  unmountElement: void;
  waitForElement: void;
  waitAndExecute: void;
  addLog: { message: string };
  clearLog: void;
  setWaiting: { waiting: boolean };
  checkRefStatus: void;
}

const {
  Provider: TestActionProvider,
  useActionDispatch: useTestAction,
  useActionHandler: useTestActionHandler
} = createActionContext<TestActions>('PerformanceTest');

// 마운트될 때만 실제로 렌더링되는 컴포넌트 (명확한 생명주기)
function DynamicMountedElement() {
  const interactiveElement = useDemoRef('interactiveElement');
  const dispatch = useTestAction();
  const lastActionTimeStore = useResultsStore('lastActionTime');
  const activeTestStore = useResultsStore('activeTest');
  const waitAndExecuteStatusStore = useResultsStore('waitAndExecuteStatus');
  const lastTestTypeStore = useResultsStore('lastTestType');
  const testResultStatusStore = useResultsStore('testResultStatus');
  
  const activeTest = useStoreValue(activeTestStore);
  const waitAndExecuteStatus = useStoreValue(waitAndExecuteStatusStore);
  const lastTestType = useStoreValue(lastTestTypeStore);
  const testResultStatus = useStoreValue(testResultStatusStore);
  
  // 마운트 시점 로깅만 수행 (cleanup은 액션 핸들러에서 관리)
  useEffect(() => {
    console.log('🎉 DynamicMountedElement가 마운트되었습니다!');
    dispatch('addLog', { message: '🎉 컴포넌트가 실제로 마운트되었습니다!' });
    lastActionTimeStore.setValue(performance.now());
    
    return () => {
      console.log('👋 DynamicMountedElement가 언마운트됩니다!');
      dispatch('addLog', { message: '👋 컴포넌트가 실제로 언마운트됩니다!' });
      // ref 정리는 액션 핸들러에서 이미 처리됨 - 여기서는 제거
    };
  }, [dispatch, lastActionTimeStore]);
  
  // 테스트별 스타일 결정
  const getTestStyle = () => {
    // 활성 테스트가 있을 때
    if (activeTest === 'waitForRefs') {
      return {
        background: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)',
        animation: 'pulseGlow 1.5s ease-in-out infinite',
        textShadow: '0 0 20px rgba(52, 211, 153, 0.8)',
        border: '2px solid #34d399'
      };
    }
    
    if (activeTest === 'waitAndExecute') {
      if (waitAndExecuteStatus === 'waiting') {
        return {
          background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #f87171 100%)',
          animation: 'spinPulse 2s ease-in-out infinite',
          textShadow: '0 0 20px rgba(248, 113, 113, 0.8)',
          border: '2px solid #f87171'
        };
      } else if (waitAndExecuteStatus === 'executing') {
        return {
          background: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 50%, #a78bfa 100%)',
          animation: 'rainbowGradient 1s linear infinite',
          textShadow: '0 0 20px rgba(167, 139, 250, 0.8)',
          border: '2px solid #a78bfa'
        };
      } else if (waitAndExecuteStatus === 'completed') {
        return {
          background: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)',
          animation: 'matrixEffect 1s ease-in-out 3',
          textShadow: '0 0 30px rgba(52, 211, 153, 1)',
          border: '2px solid #34d399'
        };
      }
    }
    
    // 테스트 결과 상태가 있을 때 (activeTest가 없고 결과만 있을 때)
    if (!activeTest && testResultStatus !== 'none') {
      if (testResultStatus === 'success') {
        return {
          background: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)',
          animation: 'matrixEffect 1s ease-in-out 2',
          textShadow: '0 0 15px rgba(52, 211, 153, 0.8)',
          border: '2px solid #34d399'
        };
      } else if (testResultStatus === 'warning') {
        return {
          background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 50%, #fcd34d 100%)',
          animation: 'pulseGlow 1s ease-in-out 2',
          textShadow: '0 0 15px rgba(252, 211, 77, 0.8)',
          border: '2px solid #fcd34d'
        };
      } else if (testResultStatus === 'error') {
        return {
          background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #f87171 100%)',
          animation: 'spinPulse 1s ease-in-out 2',
          textShadow: '0 0 15px rgba(248, 113, 113, 0.8)',
          border: '2px solid #f87171'
        };
      }
    }
    
    // 기본 스타일
    return {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      textShadow: 'none',
      border: 'none'
    };
  };
  
  const testStyle = getTestStyle();
  
  return (
    <div 
      ref={interactiveElement.setRef}
      id="interactive-element-content"
      style={{
        padding: '20px',
        color: 'white',
        borderRadius: '8px',
        textAlign: 'center',
        fontWeight: 'bold',
        boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
        opacity: 1,
        transform: 'translateY(0)',
        transition: activeTest ? 'none' : 'all 0.3s ease-in',
        ...testStyle
      }}
    >
      {activeTest === 'waitForRefs' ? '🔥 useWaitForRefs 테스트 실행 중!' :
       activeTest === 'waitAndExecute' && waitAndExecuteStatus === 'waiting' ? '⏳ waitForRefs 대기 중...' :
       activeTest === 'waitAndExecute' && waitAndExecuteStatus === 'executing' ? '⚡ 작업 실행 중...' :
       activeTest === 'waitAndExecute' && waitAndExecuteStatus === 'completed' ? '✅ waitAndExecute 작업 완료!' :
       !activeTest && testResultStatus === 'success' && lastTestType === 'waitForRefs' ? '✅ useWaitForRefs 테스트 성공!' :
       !activeTest && testResultStatus === 'warning' && lastTestType === 'waitForRefs' ? '⚠️ useWaitForRefs 테스트 주의!' :
       !activeTest && testResultStatus === 'error' && lastTestType === 'waitForRefs' ? '❌ useWaitForRefs 테스트 실패!' :
       '✨ 실제로 마운트된 컴포넌트입니다! ✨'}
    </div>
  );
}

// 컨테이너 컴포넌트 - state 기반 조건부 렌더링
function InteractiveElementContainer() {
  // Context-Action stores
  const isMountedStore = useResultsStore('isMounted');
  const isMounted = useStoreValue(isMountedStore);
  
  return (
    <div style={{ width: '100%', textAlign: 'center', minHeight: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {!isMounted ? (
        <div style={{ color: '#9ca3af', fontSize: '16px', fontStyle: 'italic' }}>
          요소가 마운트되지 않았습니다.
        </div>
      ) : (
        <DynamicMountedElement />
      )}
    </div>
  );
}

function PerformanceDemo() {
  const existingElement = useDemoRef('existingElement');
  const pendingElement = useDemoRef('pendingElement');
  const interactiveElement = useDemoRef('interactiveElement');
  const waitForRefs = useWaitForRefs();
  
  // Context-Action stores instead of useState
  const existingTimeStore = useResultsStore('existingTime');
  const pendingTimeStore = useResultsStore('pendingTime');
  const testCompleteStore = useResultsStore('testComplete');
  
  const existingTime = useStoreValue(existingTimeStore);
  const pendingTime = useStoreValue(pendingTimeStore);
  const testComplete = useStoreValue(testCompleteStore);
  
  // New interactive demo stores
  const isMountedStore = useResultsStore('isMounted');
  const lastActionTimeStore = useResultsStore('lastActionTime');
  const actionLogStore = useResultsStore('actionLog');
  const isWaitingStore = useResultsStore('isWaiting');
  const isProcessingStore = useResultsStore('isProcessing');
  const lastTestResultStore = useResultsStore('lastTestResult');
  const testResultColorStore = useResultsStore('testResultColor');
  const activeTestStore = useResultsStore('activeTest');
  const waitAndExecuteStatusStore = useResultsStore('waitAndExecuteStatus');
  const lastTestTypeStore = useResultsStore('lastTestType');
  const testResultStatusStore = useResultsStore('testResultStatus');
  
  const isMounted = useStoreValue(isMountedStore);
  const actionLog = useStoreValue(actionLogStore);
  const isWaiting = useStoreValue(isWaitingStore);
  const isProcessing = useStoreValue(isProcessingStore);
  const lastTestResult = useStoreValue(lastTestResultStore);
  const testResultColor = useStoreValue(testResultColorStore);
  const activeTest = useStoreValue(activeTestStore);
  const waitAndExecuteStatus = useStoreValue(waitAndExecuteStatusStore);
  
  const dispatch = useTestAction();


  // Interactive demo action handlers
  useTestActionHandler('mountElement', async () => {
    // 실시간 상태 확인 (중복 요청 방지)
    const currentMountedState = isMountedStore.getValue();
    const currentProcessingState = isProcessingStore.getValue();
    
    dispatch('addLog', { message: `🚀 마운트 요청 - 현재 isMounted: ${currentMountedState}, isProcessing: ${currentProcessingState}` });
    
    if (currentProcessingState) {
      dispatch('addLog', { message: '⚠️ 이미 처리 중입니다. 잠시 기다려주세요.' });
      return;
    }
    
    if (!currentMountedState) {
      // 처리 시작
      isProcessingStore.setValue(true);
      dispatch('addLog', { message: '🔄 요소 마운트 시작... (2초 대기)' });
      dispatch('setWaiting', { waiting: true });
      
      // 2초 대기 후 마운트
      setTimeout(() => {
        isMountedStore.setValue(true);
        lastActionTimeStore.setValue(performance.now());
        dispatch('addLog', { message: '✅ isMounted를 true로 설정했습니다!' });
        dispatch('addLog', { message: '✅ 요소가 성공적으로 마운트되었습니다!' });
        dispatch('setWaiting', { waiting: false });
        isProcessingStore.setValue(false); // 처리 완료
      }, 2000);
    } else {
      dispatch('addLog', { message: '⚠️ 이미 마운트된 상태입니다.' });
    }
  });
  
  useTestActionHandler('unmountElement', async () => {
    // 실시간 상태 확인 (중복 요청 방지)
    const currentMountedState = isMountedStore.getValue();
    const currentProcessingState = isProcessingStore.getValue();
    
    dispatch('addLog', { message: `🗑️ 언마운트 요청 - 현재 isMounted: ${currentMountedState}, isProcessing: ${currentProcessingState}` });
    
    if (currentProcessingState) {
      dispatch('addLog', { message: '⚠️ 이미 처리 중입니다. 잠시 기다려주세요.' });
      return;
    }
    
    if (currentMountedState) {
      // 처리 시작
      isProcessingStore.setValue(true);
      dispatch('addLog', { message: '🗑️ 요소 언마운트 시작...' });
      
      // 현재 ref 상태 확인
      const currentTarget = interactiveElement.target;
      dispatch('addLog', { 
        message: `🔍 언마운트 전 ref 상태: ${currentTarget ? 'DOM 요소 존재' : 'null'}` 
      });
      
      // 1. 먼저 상태를 false로 변경 (React가 컴포넌트를 언마운트하도록)
      isMountedStore.setValue(false);
      lastActionTimeStore.setValue(performance.now());
      dispatch('addLog', { message: '❌ isMounted를 false로 설정 - React가 컴포넌트를 언마운트합니다.' });
      
      // 2. React 언마운트 후 ref 상태 확인 (비동기적으로)
      // React의 렌더링이 완료된 후 ref 상태를 확인
      setTimeout(() => {
        const afterTarget = interactiveElement.target;
        dispatch('addLog', { 
          message: `🔍 React 언마운트 후 ref 상태: ${afterTarget ? 'DOM 요소 존재 (수동 정리 필요)' : 'null (자동 정리됨)'}` 
        });
        
        // 만약 ref가 여전히 존재한다면 수동으로 정리
        if (afterTarget) {
          interactiveElement.setRef(document.createElement('div'));
          dispatch('addLog', { message: '🧹 ref를 정리했습니다.' });
        }
        
        isProcessingStore.setValue(false); // 처리 완료
      }, 50); // React 렌더링 완료를 기다리기 위한 최소 지연
    } else {
      dispatch('addLog', { message: '⚠️ 이미 언마운트된 상태입니다.' });
    }
  });
  
  useTestActionHandler('waitForElement', async () => {
    const currentMountedState = isMountedStore.getValue(); // 실시간 상태 확인
    const currentWaitingState = isWaitingStore.getValue(); // 현재 대기 상태 확인
    
    // 이미 대기 중인 경우 경고 메시지
    if (currentWaitingState) {
      dispatch('addLog', { 
        message: '⚠️ 아직 마운트되지 않았습니다.' 
      });
      return;
    }
    
    // 시각적 피드백 시작
    activeTestStore.setValue('waitForRefs');
    const startTime = performance.now();
    
    dispatch('addLog', { 
      message: `⏳ useWaitForRefs('interactiveElement') 호출... ${currentMountedState ? '(이미 마운트됨)' : '(언마운트 상태 - 대기 예상)'}` 
    });
    dispatch('setWaiting', { waiting: true });
    
    try {
      // 언마운트 상태일 때만 실제 대기 테스트 수행
      if (!currentMountedState) {
        // 실제로 useWaitForRefs가 대기하는지 테스트
        await waitForRefs('interactiveElement');
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        const isExpectedBehavior = duration > 100;
        const resultMessage = `⚡ waitForRefs 완료! 소요시간: ${duration.toFixed(2)}ms ${isExpectedBehavior ? '✅ (대기 후 반환 - 정상)' : '⚠️ (즉시 반환 - 예상과 다름)'}`;
        
        // 시각적 피드백 업데이트
        lastTestResultStore.setValue(isExpectedBehavior ? '✅ 대기 동작 정상' : '⚠️ 예상과 다름');
        testResultColorStore.setValue(isExpectedBehavior ? '#16a34a' : '#f59e0b');
        
        // 컴포넌트 시각적 피드백을 위한 상태 설정
        lastTestTypeStore.setValue('waitForRefs');
        testResultStatusStore.setValue(isExpectedBehavior ? 'success' : 'warning');
        
        dispatch('addLog', { message: resultMessage });
      } else {
        // 마운트 상태에서는 즉시 반환 테스트
        await waitForRefs('interactiveElement');
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        const isExpectedBehavior = duration < 5;
        const resultMessage = `⚡ waitForRefs 완료! 소요시간: ${duration.toFixed(2)}ms ${isExpectedBehavior ? '✅ (즉시 반환 - 정상)' : '⚠️ (예상보다 오래 걸림)'}`;
        
        // 시각적 피드백 업데이트
        lastTestResultStore.setValue(isExpectedBehavior ? '✅ 즉시 반환 정상' : '⚠️ 예상보다 느림');
        testResultColorStore.setValue(isExpectedBehavior ? '#16a34a' : '#f59e0b');
        
        // 컴포넌트 시각적 피드백을 위한 상태 설정
        lastTestTypeStore.setValue('waitForRefs');
        testResultStatusStore.setValue(isExpectedBehavior ? 'success' : 'warning');
        
        dispatch('addLog', { message: resultMessage });
      }
    } catch (error) {
      lastTestResultStore.setValue('❌ 테스트 실패');
      testResultColorStore.setValue('#dc2626');
      
      // 컴포넌트 시각적 피드백을 위한 상태 설정
      lastTestTypeStore.setValue('waitForRefs');
      testResultStatusStore.setValue('error');
      
      dispatch('addLog', { message: `❌ 에러 발생: ${error}` });
    } finally {
      dispatch('setWaiting', { waiting: false });
      activeTestStore.setValue(''); // 시각적 피드백 종료
      
      // 3초 후 결과 상태 초기화
      setTimeout(() => {
        testResultStatusStore.setValue('none');
        lastTestTypeStore.setValue('');
      }, 3000);
    }
  });
  
  useTestActionHandler('addLog', async ({ message }) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    actionLogStore.update(prev => [...prev, logEntry]);
  });
  
  useTestActionHandler('clearLog', async () => {
    actionLogStore.setValue([]);
  });
  
  useTestActionHandler('setWaiting', async ({ waiting }) => {
    isWaitingStore.setValue(waiting);
  });
  
  useTestActionHandler('checkRefStatus', async () => {
    const currentTarget = interactiveElement.target;
    const targetInfo = currentTarget ? {
      tagName: currentTarget.tagName,
      id: currentTarget.id,
      isConnected: currentTarget.isConnected,
      parentNode: currentTarget.parentNode ? 'exists' : 'null'
    } : null;
    
    dispatch('addLog', { 
      message: `🔍 현재 ref 상태: ${currentTarget ? `DOM 요소 존재 (${JSON.stringify(targetInfo)})` : 'null'}` 
    });
  });
  
  useTestActionHandler('waitAndExecute', async () => {
    const currentMountedState = isMountedStore.getValue();
    const startTime = performance.now();
    
    // 시각적 피드백 시작
    activeTestStore.setValue('waitAndExecute');
    waitAndExecuteStatusStore.setValue('waiting');
    
    dispatch('addLog', { 
      message: `🎯 waitForRefs 기반 실행 시작... ${currentMountedState ? '(이미 마운트됨 - 즉시 실행)' : '(언마운트 상태 - 마운트 대기 후 실행)'}` 
    });
    
    try {
      // waitForRefs로 요소가 마운트될 때까지 기다림
      await waitForRefs('interactiveElement');
      const waitEndTime = performance.now();
      const waitDuration = waitEndTime - startTime;
      
      // 실행 단계로 상태 변경
      waitAndExecuteStatusStore.setValue('executing');
      
      dispatch('addLog', { 
        message: `⏳ waitForRefs 완료! 대기시간: ${waitDuration.toFixed(2)}ms - 이제 작업을 실행합니다...` 
      });
      
      // 실제 작업 실행 (예: DOM 조작, 스타일 변경 등)
      const element = interactiveElement.target;
      if (element) {
        // 예시 작업: 요소에 효과 적용
        element.style.transform = 'scale(1.1)';
        element.style.boxShadow = '0 8px 25px rgba(0,0,0,0.3)';
        
        dispatch('addLog', { 
          message: '✨ 작업 실행: 요소에 스케일 및 그림자 효과 적용' 
        });
        
        // 2초 후 원래 상태로 복원
        setTimeout(() => {
          if (element) {
            element.style.transform = 'translateY(0)';
            element.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
            dispatch('addLog', { 
              message: '🔄 효과 복원 완료' 
            });
          }
        }, 2000);
        
        const totalEndTime = performance.now();
        const totalDuration = totalEndTime - startTime;
        
        // 완료 상태로 변경
        waitAndExecuteStatusStore.setValue('completed');
        
        dispatch('addLog', { 
          message: `✅ waitForRefs 기반 작업 완료! 총 소요시간: ${totalDuration.toFixed(2)}ms (대기: ${waitDuration.toFixed(2)}ms)` 
        });
        
        // 2초 후 상태 초기화
        setTimeout(() => {
          waitAndExecuteStatusStore.setValue('idle');
          activeTestStore.setValue('');
        }, 4000);
      } else {
        waitAndExecuteStatusStore.setValue('idle');
        activeTestStore.setValue('');
        dispatch('addLog', { 
          message: '❌ 요소를 찾을 수 없습니다.' 
        });
      }
    } catch (error) {
      waitAndExecuteStatusStore.setValue('idle');
      activeTestStore.setValue('');
      dispatch('addLog', { 
        message: `❌ waitForRefs 기반 실행 실패: ${error}` 
      });
    }
  });
  
  // Original performance test action handler (keeping for backward compatibility)
  useTestActionHandler('startTest', async () => {
    console.log('🔍 성능 테스트 시작...');
    
    existingElement.setRef(document.createElement('div'));
    pendingElement.setRef(document.createElement('div'));
    
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const div1 = document.createElement('div');
    div1.id = 'existing-element';
    existingElement.setRef(div1);
    
    console.log('✅ Existing element가 즉시 마운트됨');
    
    const existingStart = performance.now();
    await waitForRefs('existingElement');
    const existingEnd = performance.now();
    const measuredExistingTime = existingEnd - existingStart;
    
    console.log(`⚡ 이미 존재하는 요소: ${measuredExistingTime.toFixed(3)}ms`);
    
    const pendingStart = performance.now();
    
    setTimeout(() => {
      const div2 = document.createElement('div');
      div2.id = 'pending-element';
      pendingElement.setRef(div2);
      console.log('✅ Pending element이 100ms 후 마운트됨');
    }, 100);
    
    await waitForRefs('pendingElement');
    const pendingEnd = performance.now();
    const measuredPendingTime = pendingEnd - pendingStart;
    
    console.log(`⏳ 존재하지 않던 요소: ${measuredPendingTime.toFixed(3)}ms`);
    
    dispatch('updateResults', { 
      existingTime: measuredExistingTime, 
      pendingTime: measuredPendingTime 
    });
    dispatch('completeTest');
  });

  useTestActionHandler('updateResults', async (payload) => {
    existingTimeStore.setValue(payload.existingTime);
    pendingTimeStore.setValue(payload.pendingTime);
  });

  useTestActionHandler('completeTest', async () => {
    testCompleteStore.setValue(true);
  });

  useEffect(() => {
    // Auto-run original performance test on mount
    dispatch('startTest');
    // Initialize with welcome message
    dispatch('addLog', { message: '🎉 인터랙티브 useWaitForRefs 데모에 오신 것을 환영합니다!' });
  }, [dispatch]);

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui, -apple-system, sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ color: '#2563eb', marginBottom: '10px' }}>🧪 useWaitForRefs 인터랙티브 데모</h2>
      <p style={{ color: '#6b7280', marginBottom: '30px' }}>
        버튼을 클릭하여 useWaitForRefs의 동작을 직접 확인해보세요.
      </p>
      
      {/* Interactive Controls */}
      <div style={{ marginBottom: '30px', padding: '20px', border: '2px solid #e5e7eb', borderRadius: '8px', background: '#f9fafb' }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#374151' }}>🎮 인터랙티브 컨트롤</h3>
        
        {/* 첫 번째 행: 기본 컨트롤 */}
        <div style={{ marginBottom: '15px' }}>
          <div style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 'bold', color: '#374151' }}>
            📦 기본 컨트롤 - 컴포넌트 생명주기 관리
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => dispatch('mountElement')}
              disabled={isMounted || isWaiting || isProcessing}
              style={{
                padding: '10px 20px',
                backgroundColor: (isMounted || isProcessing) ? '#d1d5db' : '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: (isMounted || isWaiting || isProcessing) ? 'not-allowed' : 'pointer',
                fontWeight: 'bold'
              }}
            >
              {isProcessing && !isMounted ? '⏳ 마운트 중...' : 
               isWaiting && !isMounted ? '⏳ 대기 중...' : 
               isMounted ? '✅ 이미 마운트됨' : '🚀 요소 마운트 (2초 대기)'}
            </button>
            
            <button
              onClick={() => dispatch('unmountElement')}
              disabled={!isMounted || isWaiting || isProcessing}
              style={{
                padding: '10px 20px',
                backgroundColor: (!isMounted || isProcessing) ? '#d1d5db' : '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: (!isMounted || isWaiting || isProcessing) ? 'not-allowed' : 'pointer',
                fontWeight: 'bold'
              }}
            >
              {isProcessing && isMounted ? '⏳ 언마운트 중...' : '🗑️ 요소 언마운트'}
            </button>
          </div>
          <div style={{ marginTop: '5px', fontSize: '12px', color: '#6b7280' }}>
            React 컴포넌트 조건부 렌더링: <code>isMounted</code> 상태 기반으로 컴포넌트 마운트/언마운트 제어
          </div>
        </div>
        
        {/* 두 번째 행: useWaitForRefs 테스트 */}
        <div style={{ marginBottom: '15px' }}>
          <div style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 'bold', color: '#374151' }}>
            ⏱️ useWaitForRefs 테스트 - 조건부 대기 검증
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => dispatch('waitForElement')}
              disabled={false}
              style={{
                padding: '10px 20px',
                backgroundColor: activeTest === 'waitForRefs' ? '#059669' : 
                               lastTestResult ? testResultColor : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'all 0.3s ease'
              }}
            >
              {activeTest === 'waitForRefs' ? '🔥 테스트 실행 중...' :
               isWaiting ? '⏳ 대기 중 (다시 테스트 가능)' : 
               lastTestResult ? `${lastTestResult.split(' ')[0]} useWaitForRefs 테스트` : 
               '⏱️ useWaitForRefs 테스트'}
            </button>
          </div>
          <div style={{ marginTop: '5px', fontSize: '12px', color: '#6b7280' }}>
            <code>await waitForRefs('interactiveElement')</code> - 요소가 없으면 대기, 이미 있으면 즉시 반환하는 조건부 동작 검증
          </div>
        </div>
        
        {/* 세 번째 행: waitForRefs 기반 실행 */}
        <div style={{ marginBottom: '15px' }}>
          <div style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 'bold', color: '#374151' }}>
            🎯 waitForRefs 기반 실행 - 실용적 활용 예시
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => dispatch('waitAndExecute')}
              style={{
                padding: '10px 20px',
                backgroundColor: activeTest === 'waitAndExecute' ? 
                  (waitAndExecuteStatus === 'waiting' ? '#dc2626' :
                   waitAndExecuteStatus === 'executing' ? '#7c3aed' :
                   waitAndExecuteStatus === 'completed' ? '#059669' : '#f59e0b') : '#f59e0b',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'all 0.3s ease'
              }}
            >
              {activeTest === 'waitAndExecute' ? 
                (waitAndExecuteStatus === 'waiting' ? '⏳ 마운트 대기 중...' :
                 waitAndExecuteStatus === 'executing' ? '⚡ 작업 실행 중...' :
                 waitAndExecuteStatus === 'completed' ? '✅ 실행 완료!' : '🎯 waitForRefs 기반 실행') : 
                '🎯 waitForRefs 기반 실행'}
            </button>
          </div>
          <div style={{ marginTop: '5px', fontSize: '12px', color: '#6b7280' }}>
            <code>await waitForRefs() → DOM 조작</code> - 요소 준비 완료 후 실제 작업 실행하는 실용적 패턴
          </div>
        </div>
        
        {/* 네 번째 행: 유틸리티 */}
        <div style={{ marginBottom: '15px' }}>
          <div style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 'bold', color: '#374151' }}>
            🛠️ 유틸리티 - 디버깅 및 관리
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => dispatch('clearLog')}
              style={{
                padding: '10px 20px',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              🧹 로그 지우기
            </button>
            
            <button
              onClick={() => dispatch('checkRefStatus')}
              style={{
                padding: '10px 20px',
                backgroundColor: '#8b5cf6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              🔍 ref 상태 확인
            </button>
          </div>
          <div style={{ marginTop: '5px', fontSize: '12px', color: '#6b7280' }}>
            개발자 도구: 로그 관리 및 RefContext 내부 상태 점검 기능
          </div>
        </div>
        
        <div style={{ padding: '15px', backgroundColor: isMounted ? '#dcfce7' : '#fef2f2', borderRadius: '6px', border: '2px solid', borderColor: isMounted ? '#16a34a' : '#dc2626' }}>
          <div style={{ textAlign: 'center', marginBottom: '10px' }}>
            <strong>📊 현재 상태 모니터링</strong>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', fontSize: '14px' }}>
            <div style={{ padding: '8px', backgroundColor: 'white', borderRadius: '4px', border: '1px solid #e5e7eb' }}>
              <strong>isMounted:</strong>
              <div style={{ 
                color: isMounted ? '#16a34a' : '#dc2626', 
                fontWeight: 'bold', 
                fontSize: '16px',
                marginTop: '4px'
              }}>
                {isMounted ? '✅ true' : '❌ false'}
              </div>
            </div>
            
            <div style={{ padding: '8px', backgroundColor: 'white', borderRadius: '4px', border: '1px solid #e5e7eb' }}>
              <strong>컴포넌트:</strong>
              <div style={{ 
                color: isMounted ? '#16a34a' : '#dc2626', 
                fontWeight: 'bold', 
                fontSize: '16px',
                marginTop: '4px'
              }}>
                {isMounted ? '🔵 렌더링됨' : '⚪ 언마운트됨'}
              </div>
            </div>
            
            <div style={{ padding: '8px', backgroundColor: 'white', borderRadius: '4px', border: '1px solid #e5e7eb' }}>
              <strong>처리 상태:</strong>
              <div style={{ 
                color: isProcessing ? '#dc2626' : '#6b7280', 
                fontWeight: 'bold', 
                fontSize: '16px',
                marginTop: '4px'
              }}>
                {isProcessing ? '🔄 처리 중' : '⭕ 대기'}
              </div>
            </div>
            
            <div style={{ padding: '8px', backgroundColor: 'white', borderRadius: '4px', border: '1px solid #e5e7eb' }}>
              <strong>대기 상태:</strong>
              <div style={{ 
                color: isWaiting ? '#f59e0b' : '#6b7280', 
                fontWeight: 'bold', 
                fontSize: '16px',
                marginTop: '4px'
              }}>
                {isWaiting ? '⏳ 대기 중' : '⭕ 대기 안함'}
              </div>
            </div>
            
            <div style={{ padding: '8px', backgroundColor: 'white', borderRadius: '4px', border: '1px solid #e5e7eb' }}>
              <strong>예상 동작:</strong>
              <div style={{ 
                color: '#6b7280', 
                fontWeight: 'bold', 
                fontSize: '14px',
                marginTop: '4px'
              }}>
                {isMounted ? 'JSX 렌더링' : 'JSX 제거'}
              </div>
            </div>
            
            <div style={{ padding: '8px', backgroundColor: 'white', borderRadius: '4px', border: '1px solid #e5e7eb' }}>
              <strong>테스트 버튼:</strong>
              <div style={{ 
                color: '#16a34a', 
                fontWeight: 'bold', 
                fontSize: '14px',
                marginTop: '4px'
              }}>
                🔓 항상 테스트 가능
              </div>
            </div>
            
            <div style={{ padding: '8px', backgroundColor: 'white', borderRadius: '4px', border: '1px solid #e5e7eb' }}>
              <strong>테스트 결과:</strong>
              <div style={{ 
                color: testResultColor, 
                fontWeight: 'bold', 
                fontSize: '14px',
                marginTop: '4px'
              }}>
                {lastTestResult || '테스트 없음'}
              </div>
            </div>
            
            <div style={{ padding: '8px', backgroundColor: 'white', borderRadius: '4px', border: '1px solid #e5e7eb' }}>
              <strong>현재 테스트:</strong>
              <div style={{ 
                color: activeTest ? '#dc2626' : '#6b7280', 
                fontWeight: 'bold', 
                fontSize: '14px',
                marginTop: '4px'
              }}>
                {activeTest === 'waitForRefs' ? '🔥 useWaitForRefs' :
                 activeTest === 'waitAndExecute' ? '🎯 waitAndExecute' : '⭕ 없음'}
              </div>
            </div>
            
            <div style={{ padding: '8px', backgroundColor: 'white', borderRadius: '4px', border: '1px solid #e5e7eb' }}>
              <strong>테스트 가이드:</strong>
              <div style={{ 
                color: '#6b7280', 
                fontWeight: 'bold', 
                fontSize: '12px',
                marginTop: '4px'
              }}>
                {isMounted ? '즉시 반환 예상' : '대기 후 반환 예상'}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Element Display Area */}
      <div style={{ marginBottom: '30px', padding: '20px', border: '2px solid #e5e7eb', borderRadius: '8px', minHeight: '150px', background: '#ffffff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ margin: '0', color: '#374151' }}>📦 요소 표시 영역</h3>
          <div style={{ 
            padding: '4px 8px', 
            borderRadius: '4px', 
            fontSize: '12px', 
            fontWeight: 'bold',
            backgroundColor: isMounted ? '#dcfce7' : '#fef2f2',
            color: isMounted ? '#16a34a' : '#dc2626',
            border: '1px solid',
            borderColor: isMounted ? '#16a34a' : '#dc2626'
          }}>
            조건부 렌더링: {isMounted ? 'true → 컴포넌트 렌더링' : 'false → 컴포넌트 제거'}
          </div>
        </div>
        <InteractiveElementContainer />
      </div>
      
      {/* CSS for animation */}
      <style>
        {`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes pulseGlow {
            0%, 100% {
              box-shadow: 0 0 20px rgba(5, 150, 105, 0.8), 0 0 40px rgba(5, 150, 105, 0.5), 0 0 60px rgba(5, 150, 105, 0.3);
              transform: scale(1);
            }
            50% {
              box-shadow: 0 0 30px rgba(5, 150, 105, 1), 0 0 60px rgba(5, 150, 105, 0.8), 0 0 90px rgba(5, 150, 105, 0.5);
              transform: scale(1.02);
            }
          }
          
          @keyframes rainbowGradient {
            0% { background: linear-gradient(45deg, #ff0000, #ff8800, #ffff00); }
            16% { background: linear-gradient(45deg, #ff8800, #ffff00, #88ff00); }
            33% { background: linear-gradient(45deg, #ffff00, #88ff00, #00ff88); }
            50% { background: linear-gradient(45deg, #88ff00, #00ff88, #0088ff); }
            66% { background: linear-gradient(45deg, #00ff88, #0088ff, #8800ff); }
            83% { background: linear-gradient(45deg, #0088ff, #8800ff, #ff0088); }
            100% { background: linear-gradient(45deg, #8800ff, #ff0088, #ff0000); }
          }
          
          @keyframes spinPulse {
            0% { 
              transform: rotate(0deg) scale(1);
              box-shadow: 0 0 20px rgba(245, 158, 11, 0.8);
            }
            25% { 
              transform: rotate(90deg) scale(1.1);
              box-shadow: 0 0 40px rgba(220, 38, 38, 0.8);
            }
            50% { 
              transform: rotate(180deg) scale(1);
              box-shadow: 0 0 60px rgba(124, 58, 237, 0.8);
            }
            75% { 
              transform: rotate(270deg) scale(1.1);
              box-shadow: 0 0 40px rgba(5, 150, 105, 0.8);
            }
            100% { 
              transform: rotate(360deg) scale(1);
              box-shadow: 0 0 20px rgba(245, 158, 11, 0.8);
            }
          }
          
          @keyframes matrixEffect {
            0%, 100% {
              background: linear-gradient(90deg, #059669, #10b981, #34d399);
              box-shadow: 
                0 0 20px #059669,
                inset 0 0 20px rgba(52, 211, 153, 0.3),
                0 0 40px rgba(5, 150, 105, 0.5);
              text-shadow: 0 0 10px #34d399;
            }
            50% {
              background: linear-gradient(90deg, #10b981, #34d399, #6ee7b7);
              box-shadow: 
                0 0 40px #10b981,
                inset 0 0 30px rgba(110, 231, 183, 0.5),
                0 0 60px rgba(16, 185, 129, 0.7);
              text-shadow: 0 0 20px #6ee7b7;
            }
          }
          
          .test-active-waitForRefs {
            animation: pulseGlow 1.5s ease-in-out infinite;
          }
          
          .test-active-waitAndExecute {
            animation: spinPulse 2s ease-in-out infinite;
          }
          
          .test-completed {
            animation: matrixEffect 1s ease-in-out 3;
          }
        `}
      </style>
      
      {/* Action Log */}
      <div style={{ marginBottom: '30px', padding: '20px', border: '2px solid #e5e7eb', borderRadius: '8px', background: '#1f2937' }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#f3f4f6' }}>📝 실시간 로그</h3>
        <div style={{ 
          backgroundColor: '#111827', 
          padding: '15px', 
          borderRadius: '6px', 
          fontFamily: 'monaco, monospace', 
          fontSize: '13px', 
          maxHeight: '200px', 
          overflowY: 'auto',
          color: '#e5e7eb'
        }}>
          {actionLog.length === 0 ? (
            <div style={{ color: '#9ca3af' }}>로그가 없습니다.</div>
          ) : (
            actionLog.slice(-10).map((log, index) => (
              <div key={index} style={{ marginBottom: '5px' }}>
                {log}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Original Performance Results */}
      <div style={{ padding: '15px', border: '1px solid #d1d5db', borderRadius: '8px', background: '#f8fafc' }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#374151' }}>📊 자동 성능 테스트 결과</h3>
        <div>• 이미 존재하는 요소: <strong>{existingTime.toFixed(3)}ms</strong></div>
        <div>• 존재하지 않던 요소: <strong>{pendingTime.toFixed(3)}ms</strong></div>
        <div>• 자동 테스트 완료: {testComplete ? '✅' : '⏳ 진행 중...'}</div>
        {testComplete && (
          <div style={{ marginTop: '10px', fontSize: '14px', color: '#6b7280' }}>
            {existingTime < 5 ? '✅' : '❌'} 이미 존재하는 요소는 즉시 반환 (&lt; 5ms)<br/>
            {pendingTime > 95 ? '✅' : '❌'} 존재하지 않던 요소는 실제 대기 (&gt; 95ms)
          </div>
        )}
      </div>
      
      {/* Hidden elements for original test */}
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