/**
 * @fileoverview HMR Demo Page
 * Hot Module Replacement 기능을 시연하는 예제 페이지
 * 개발 환경에서만 표시되며, HMR 상태 보존과 복원을 실제로 테스트할 수 있음
 */

import React, { useEffect, useState } from 'react';
import { 
  useStoreHMR, 
  useActionRegisterHMR, 
  useIntegratedHMR,
  AutoHMRDashboard,
  hmrLogger,
  HMRLogUtils
} from '@context-action/react';
import { ActionRegister, createStore, useStoreValue } from '@context-action/react';
import type { ActionPayloadMap } from '@context-action/core';
import { HMRTodoExample } from './HMRTodoExample';

// HMR 데모용 액션 타입 정의
interface HMRDemoActions extends ActionPayloadMap {
  updateCounter: { increment: number };
  updateUser: { name: string; email: string };
  resetAll: void;
  testHMRRestore: void;
}

// HMR 데모용 Store 생성
const counterStore = createStore('hmr-counter', { count: 0, lastUpdate: Date.now() });
const userStore = createStore('hmr-user', { name: 'HMR 사용자', email: 'hmr@example.com' });

// HMR 데모용 ActionRegister 생성
const demoActionRegister = new ActionRegister<HMRDemoActions>();

/**
 * HMR 핸들러들 (HMR 복원을 위해 함수로 분리)
 */
const createUpdateCounterHandler = () => ({ increment }: { increment: number }, controller: any) => {
  const currentCount = counterStore.getValue();
  const newCount = { 
    count: currentCount.count + increment, 
    lastUpdate: Date.now() 
  };
  
  counterStore.setValue(newCount);
  HMRLogUtils.action.withTiming('updateCounter', 'executed', () => {
    console.log(`Counter updated: ${currentCount.count} → ${newCount.count}`);
  });
  
  controller.next();
};

const createUpdateUserHandler = () => ({ name, email }: { name: string; email: string }, controller: any) => {
  const newUser = { name, email };
  
  userStore.setValue(newUser);
  HMRLogUtils.action.withTiming('updateUser', 'executed', () => {
    console.log(`User updated:`, newUser);
  });
  
  controller.next();
};

const createResetAllHandler = () => (_: void, controller: any) => {
  counterStore.setValue({ count: 0, lastUpdate: Date.now() });
  userStore.setValue({ name: 'HMR 사용자', email: 'hmr@example.com' });
  
  HMRLogUtils.system.info('모든 상태가 초기화되었습니다.');
  controller.next();
};

const createTestHMRRestoreHandler = () => (_: void, controller: any) => {
  HMRLogUtils.system.info('HMR 복원 테스트 - 이 핸들러가 HMR 후에도 작동하면 성공!');
  controller.next();
};

/**
 * HMR 통합 훅을 사용하는 컴포넌트
 */
function HMRIntegratedDemo() {
  const {
    store: hmrCounterStore,
    actionRegister: hmrActionRegister,
    registerHandlerFactory,
    storeWasRestored,
    actionRegisterWasRestored,
  } = useIntegratedHMR(counterStore, demoActionRegister, {
    enableLogging: true,
    store: { 
      autoBackup: true, 
      backupInterval: 5000 // 5초마다 백업
    },
    actionRegister: { 
      autoBackup: true, 
      autoRestore: true 
    }
  });

  const counter = useStoreValue(hmrCounterStore) as { count: number; lastUpdate: number };

  // 핸들러 팩토리 등록 (HMR 복원용)
  useEffect(() => {
    registerHandlerFactory('updateCounter', 'main-counter', createUpdateCounterHandler);
    registerHandlerFactory('updateUser', 'main-user', createUpdateUserHandler);
    registerHandlerFactory('resetAll', 'main-reset', createResetAllHandler);
    registerHandlerFactory('testHMRRestore', 'main-test', createTestHMRRestoreHandler);
  }, [registerHandlerFactory]);

  // 핸들러 등록
  useEffect(() => {
    const unregisterCounter = hmrActionRegister.register('updateCounter', createUpdateCounterHandler(), { 
      id: 'main-counter', 
      priority: 10 
    });
    
    const unregisterUser = hmrActionRegister.register('updateUser', createUpdateUserHandler(), { 
      id: 'main-user', 
      priority: 10 
    });
    
    const unregisterReset = hmrActionRegister.register('resetAll', createResetAllHandler(), { 
      id: 'main-reset', 
      priority: 20 
    });
    
    const unregisterTest = hmrActionRegister.register('testHMRRestore', createTestHMRRestoreHandler(), { 
      id: 'main-test', 
      priority: 5 
    });

    return () => {
      unregisterCounter();
      unregisterUser();
      unregisterReset();
      unregisterTest();
    };
  }, [hmrActionRegister]);

  return (
    <div style={{ padding: '20px', border: '2px solid #00ff88', borderRadius: '8px', margin: '10px 0' }}>
      <h3>🔥 HMR 통합 데모</h3>
      
      {/* 복원 상태 표시 */}
      <div style={{ 
        marginBottom: '15px', 
        padding: '10px', 
        backgroundColor: '#f5f5f5', 
        borderRadius: '4px',
        fontSize: '12px'
      }}>
        <div>
          📦 Store 복원됨: {storeWasRestored ? '✅ Yes' : '❌ No'}
        </div>
        <div>
          ⚡ Action 복원됨: {actionRegisterWasRestored ? '✅ Yes' : '❌ No'}
        </div>
      </div>

      {/* 카운터 상태 */}
      <div style={{ marginBottom: '15px' }}>
        <h4>카운터 상태</h4>
        <div>현재 값: <strong>{counter.count}</strong></div>
        <div>마지막 업데이트: <small>{new Date(counter.lastUpdate).toLocaleTimeString('ko-KR')}</small></div>
      </div>

      {/* 액션 버튼들 */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button onClick={() => hmrActionRegister.dispatch('updateCounter', { increment: 1 })}>
          +1 증가
        </button>
        <button onClick={() => hmrActionRegister.dispatch('updateCounter', { increment: 5 })}>
          +5 증가
        </button>
        <button onClick={() => hmrActionRegister.dispatch('updateCounter', { increment: -1 })}>
          -1 감소
        </button>
        <button onClick={() => hmrActionRegister.dispatch('updateUser', { 
          name: `사용자 ${Math.floor(Math.random() * 100)}`, 
          email: `user${Math.floor(Math.random() * 100)}@test.com` 
        })}>
          사용자 업데이트
        </button>
        <button onClick={() => hmrActionRegister.dispatch('testHMRRestore')}>
          HMR 복원 테스트
        </button>
        <button 
          onClick={() => hmrActionRegister.dispatch('resetAll')}
          style={{ backgroundColor: '#ff4444', color: 'white' }}
        >
          전체 초기화
        </button>
      </div>
    </div>
  );
}

/**
 * 개별 Store HMR 데모 컴포넌트
 */
function IndividualStoreHMRDemo() {
  const { 
    store: hmrUserStore, 
    backup, 
    restore, 
    wasRestored 
  } = useStoreHMR(userStore, {
    autoBackup: true,
    backupInterval: 5000, // 5초마다 백업
    enableLogging: true
  });

  const user = useStoreValue(hmrUserStore) as { name: string; email: string };

  return (
    <div style={{ padding: '20px', border: '2px solid #0088ff', borderRadius: '8px', margin: '10px 0' }}>
      <h3>🏪 개별 Store HMR 데모</h3>
      
      <div style={{ 
        marginBottom: '15px', 
        padding: '10px', 
        backgroundColor: '#f0f8ff', 
        borderRadius: '4px',
        fontSize: '12px'
      }}>
        복원 상태: {wasRestored ? '✅ 복원됨' : '❌ 새로운 세션'}
      </div>

      <div style={{ marginBottom: '15px' }}>
        <h4>사용자 정보</h4>
        <div>이름: <strong>{user.name}</strong></div>
        <div>이메일: <strong>{user.email}</strong></div>
      </div>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button onClick={() => hmrUserStore.setValue({
          name: `테스트 사용자 ${Math.floor(Math.random() * 100)}`,
          email: `test${Math.floor(Math.random() * 100)}@example.com`
        })}>
          랜덤 사용자 생성
        </button>
        <button onClick={() => backup()}>
          수동 백업
        </button>
        <button onClick={() => restore()}>
          수동 복원
        </button>
      </div>
    </div>
  );
}

/**
 * HMR 통계 및 상태 표시 컴포넌트
 */
function HMRStatsDisplay() {
  const [stats, setStats] = useState(() => hmrLogger.getStats());

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(hmrLogger.getStats());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: '20px', border: '2px solid #ffaa00', borderRadius: '8px', margin: '10px 0' }}>
      <h3>📊 HMR 통계</h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
        <div style={{ padding: '10px', backgroundColor: '#fff8e1', borderRadius: '4px' }}>
          <div style={{ fontSize: '12px', color: '#666' }}>전체 로그</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ff8f00' }}>
            {stats.totalLogs}
          </div>
        </div>
        
        <div style={{ padding: '10px', backgroundColor: '#ffebee', borderRadius: '4px' }}>
          <div style={{ fontSize: '12px', color: '#666' }}>오류 수</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#f44336' }}>
            {stats.errorCount}
          </div>
        </div>
        
        <div style={{ padding: '10px', backgroundColor: '#e8f5e8', borderRadius: '4px' }}>
          <div style={{ fontSize: '12px', color: '#666' }}>마지막 활동</div>
          <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#4caf50' }}>
            {stats.lastActivity ? stats.lastActivity.toLocaleTimeString('ko-KR') : 'None'}
          </div>
        </div>
      </div>

      <div style={{ marginTop: '15px' }}>
        <h4>카테고리별 로그</h4>
        <div style={{ fontSize: '12px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {Object.entries(stats.byCategory).map(([category, count]) => (
            <span key={category} style={{ 
              padding: '2px 6px', 
              backgroundColor: '#f5f5f5', 
              borderRadius: '3px' 
            }}>
              {category}: {count}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * HMR 데모 메인 페이지
 */
export function HMRDemoPage() {
  // 프로덕션 환경에서는 HMR 데모를 표시하지 않음
  if (process.env.NODE_ENV === 'production') {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>🔥 HMR Demo</h2>
        <p>HMR 데모는 개발 환경에서만 사용할 수 있습니다.</p>
        <p>개발 모드로 앱을 실행해주세요.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>🔥 Hot Module Replacement Demo</h1>
      
      <div style={{ 
        marginBottom: '20px', 
        padding: '15px', 
        backgroundColor: '#e1f5fe', 
        borderRadius: '8px',
        border: '1px solid #0288d1'
      }}>
        <h3>🎯 HMR 테스트 방법</h3>
        <ol style={{ fontSize: '14px', lineHeight: '1.6' }}>
          <li>아래 버튼들을 클릭하여 상태를 변경해보세요.</li>
          <li>이 파일 (HMRDemoPage.tsx)을 수정하고 저장하세요.</li>
          <li>페이지가 자동으로 리로드되면서 상태가 보존되는지 확인하세요.</li>
          <li>우측 하단의 HMR Dashboard를 통해 실시간 상태를 모니터링하세요.</li>
          <li>콘솔에서 HMR 로그를 확인하세요.</li>
        </ol>
      </div>

      {/* 실용적인 HMR 예시 - 할일 관리 앱 */}
      <div style={{ 
        marginBottom: '30px', 
        padding: '20px', 
        border: '3px solid #10b981', 
        borderRadius: '12px',
        backgroundColor: '#ecfdf5'
      }}>
        <h2>🎯 실용적인 HMR 예시</h2>
        <p style={{ fontSize: '14px', color: '#374151', marginBottom: '15px' }}>
          실제 앱에서 HMR이 어떻게 작동하는지 확인해보세요. 할일을 추가한 후 코드를 수정해도 데이터가 보존됩니다!
        </p>
        <HMRTodoExample />
      </div>

      {/* 기술적인 HMR 데모들 */}
      <details style={{ marginBottom: '20px' }}>
        <summary style={{ 
          padding: '10px', 
          backgroundColor: '#f3f4f6', 
          borderRadius: '6px', 
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: 'bold'
        }}>
          🔧 기술적인 HMR 데모들 (개발자용)
        </summary>
        <div style={{ marginTop: '15px' }}>
          {/* HMR 통합 데모 */}
          <HMRIntegratedDemo />

          {/* 개별 Store HMR 데모 */}
          <IndividualStoreHMRDemo />

          {/* HMR 통계 */}
          <HMRStatsDisplay />
        </div>
      </details>

      {/* HMR 대시보드 (자동 렌더링) */}
      <AutoHMRDashboard />
      
      <div style={{ 
        marginTop: '30px', 
        padding: '15px', 
        backgroundColor: '#f5f5f5', 
        borderRadius: '8px',
        fontSize: '12px',
        color: '#666'
      }}>
        <h4>📝 참고사항</h4>
        <ul>
          <li>HMR 기능은 개발 환경에서만 작동합니다.</li>
          <li>Vite와 Webpack 모두 지원됩니다.</li>
          <li>Store 상태와 Action 핸들러가 모듈 리로드 후에도 보존됩니다.</li>
          <li>우측 하단의 대시보드에서 실시간 HMR 상태를 확인할 수 있습니다.</li>
          <li>콘솔에서 자세한 HMR 로그를 확인하세요.</li>
        </ul>
      </div>
    </div>
  );
}