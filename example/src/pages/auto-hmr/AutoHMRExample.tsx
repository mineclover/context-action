/**
 * @fileoverview Auto HMR Example - 설정 없는 자동 HMR
 * 개발자가 별도 설정 없이도 자동으로 HMR이 활성화되는 예시
 */

import React, { useEffect } from 'react';
import { 
  createStore, 
  useStoreValue, 
  ActionRegister,
  useActionDispatch,
  ActionProvider,
  GlobalAutoHMRStatus
} from '@context-action/react';
import type { ActionPayloadMap } from '@context-action/core';

// 일반적인 Store 생성 - 별도 HMR 설정 없음!
const counterStore = createStore('auto-hmr-counter', { 
  count: 0, 
  lastUpdate: Date.now() 
});

const userStore = createStore('auto-hmr-user', { 
  name: '자동 HMR 사용자', 
  email: 'auto@hmr.com' 
});

// 액션 타입 정의
interface AutoHMRActions extends ActionPayloadMap {
  increment: void;
  decrement: void;
  updateUser: { name: string; email: string };
  reset: void;
}

// 일반적인 ActionRegister 생성 - 별도 HMR 설정 없음!
const actionRegister = new ActionRegister<AutoHMRActions>();

// 액션 핸들러들 (HMR 대응을 위해 함수로 분리)
const incrementHandler = () => {
  const current = counterStore.getValue();
  counterStore.setValue({
    count: current.count + 1,
    lastUpdate: Date.now()
  });
  console.log(`카운터 증가: ${current.count} → ${current.count + 1}`);
};

const decrementHandler = () => {
  const current = counterStore.getValue();
  counterStore.setValue({
    count: current.count - 1,
    lastUpdate: Date.now()
  });
  console.log(`카운터 감소: ${current.count} → ${current.count - 1}`);
};

const updateUserHandler = ({ name, email }: { name: string; email: string }) => {
  userStore.setValue({ name, email });
  console.log(`사용자 업데이트:`, { name, email });
};

const resetHandler = () => {
  counterStore.setValue({ count: 0, lastUpdate: Date.now() });
  userStore.setValue({ name: '자동 HMR 사용자', email: 'auto@hmr.com' });
  console.log('모든 상태 초기화');
};

/**
 * 메인 예시 컴포넌트
 * 별도 HMR 설정 없이 일반적인 패턴으로 작성
 */
function AutoHMRDemo() {
  // 일반적인 useStoreValue 사용 - HMR 자동 적용됨!
  const counter = useStoreValue(counterStore) as { count: number; lastUpdate: number };
  const user = useStoreValue(userStore) as { name: string; email: string };
  const dispatch = useActionDispatch<AutoHMRActions>();

  // 핸들러 등록 - 일반적인 패턴
  useEffect(() => {
    const unregisterIncrement = actionRegister.register('increment', incrementHandler);
    const unregisterDecrement = actionRegister.register('decrement', decrementHandler);
    const unregisterUpdateUser = actionRegister.register('updateUser', updateUserHandler);
    const unregisterReset = actionRegister.register('reset', resetHandler);

    return () => {
      unregisterIncrement();
      unregisterDecrement();
      unregisterUpdateUser();
      unregisterReset();
    };
  }, []);

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>🚀 자동 HMR 예시</h1>
      
      <div style={{ 
        marginBottom: '20px', 
        padding: '15px', 
        backgroundColor: '#f0f8ff', 
        borderRadius: '8px',
        border: '1px solid #0066cc'
      }}>
        <h3>✨ 특징</h3>
        <ul style={{ fontSize: '14px', lineHeight: '1.6' }}>
          <li><strong>설정 불필요</strong>: 별도 HMR 훅이나 설정 없음</li>
          <li><strong>자동 활성화</strong>: 개발 환경에서 자동으로 HMR 지원</li>
          <li><strong>기존 패턴</strong>: 일반적인 Store/Action 패턴 그대로 사용</li>
          <li><strong>프로덕션 안전</strong>: 프로덕션에서는 완전히 비활성화</li>
        </ul>
      </div>

      <div style={{ 
        marginBottom: '20px', 
        padding: '15px', 
        backgroundColor: '#fff8e1', 
        borderRadius: '8px',
        border: '1px solid #ffb300'
      }}>
        <h3>🧪 테스트 방법</h3>
        <ol style={{ fontSize: '14px', lineHeight: '1.6' }}>
          <li>아래 버튼들로 상태를 변경하세요</li>
          <li>이 파일을 수정하고 저장하세요</li>
          <li>페이지가 리로드되어도 상태가 보존되는지 확인하세요</li>
          <li>우측 하단의 HMR 상태 표시기를 확인하세요</li>
        </ol>
      </div>

      {/* 카운터 상태 */}
      <div style={{ 
        marginBottom: '20px',
        padding: '15px',
        backgroundColor: '#f9f9f9',
        borderRadius: '8px',
        border: '1px solid #ddd'
      }}>
        <h4>📊 카운터 상태</h4>
        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>
          {counter.count}
        </div>
        <div style={{ fontSize: '12px', color: '#666' }}>
          마지막 업데이트: {new Date(counter.lastUpdate).toLocaleTimeString('ko-KR')}
        </div>
        
        <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => dispatch('increment')}
            style={{
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '8px 16px',
              cursor: 'pointer'
            }}
          >
            +1 증가
          </button>
          <button 
            onClick={() => dispatch('decrement')}
            style={{
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '8px 16px',
              cursor: 'pointer'
            }}
          >
            -1 감소
          </button>
        </div>
      </div>

      {/* 사용자 상태 */}
      <div style={{ 
        marginBottom: '20px',
        padding: '15px',
        backgroundColor: '#f9f9f9',
        borderRadius: '8px',
        border: '1px solid #ddd'
      }}>
        <h4>👤 사용자 상태</h4>
        <div style={{ marginBottom: '8px' }}>
          <strong>이름:</strong> {user.name}
        </div>
        <div style={{ marginBottom: '10px' }}>
          <strong>이메일:</strong> {user.email}
        </div>
        
        <button 
          onClick={() => dispatch('updateUser', {
            name: `사용자 ${Math.floor(Math.random() * 100)}`,
            email: `user${Math.floor(Math.random() * 100)}@test.com`
          })}
          style={{
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '8px 16px',
            cursor: 'pointer'
          }}
        >
          사용자 정보 변경
        </button>
      </div>

      {/* 전체 초기화 */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <button 
          onClick={() => dispatch('reset')}
          style={{
            backgroundColor: '#ff9800',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '10px 20px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          🔄 전체 초기화
        </button>
      </div>

      <div style={{ 
        marginTop: '30px', 
        padding: '15px', 
        backgroundColor: '#f8fafc', 
        borderRadius: '8px',
        fontSize: '12px',
        color: '#64748b'
      }}>
        <h4>💡 개발자 노트</h4>
        <ul style={{ margin: 0, paddingLeft: '20px' }}>
          <li>이 예시는 일반적인 <code>createStore()</code>와 <code>ActionRegister</code>만 사용</li>
          <li>개발 환경에서 자동으로 HMR이 적용되어 상태가 보존됨</li>
          <li>프로덕션에서는 HMR 코드가 완전히 제거됨</li>
          <li>기존 코드를 전혀 수정하지 않아도 HMR 혜택을 받을 수 있음</li>
        </ul>
      </div>
    </div>
  );
}

/**
 * 메인 페이지 컴포넌트
 */
export function AutoHMRExample() {
  return (
    <ActionProvider actionRegister={actionRegister}>
      <AutoHMRDemo />
      
      {/* 자동 HMR 상태 표시기 - 전역에서 한 번만 렌더링 */}
      <GlobalAutoHMRStatus />
    </ActionProvider>
  );
}