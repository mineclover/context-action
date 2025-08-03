/**
 * @fileoverview Auto HMR Example - 설정 없는 자동 HMR
 * 개발자가 별도 설정 없이도 자동으로 HMR이 활성화되는 예시
 */

import React, { useEffect, useState, useCallback } from 'react';
import { 
  createStore, 
  useStoreValue, 
  ActionRegister,
  useActionDispatch,
  useActionRegister,
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

// 모니터링 데이터 타입 정의
interface ActionEvent {
  id: string;
  action: string;
  timestamp: number;
  duration?: number;
  status: 'pending' | 'success' | 'error';
  payload?: any;
  storeChanges?: Array<{
    storeName: string;
    oldValue: any;
    newValue: any;
  }>;
}

interface MonitoringData {
  events: ActionEvent[];
  totalActions: number;
  averageResponseTime: number;
  storeStates: Record<string, any>;
}

// 모니터링 스토어 생성
const monitoringStore = createStore('auto-hmr-monitoring', {
  events: [] as ActionEvent[],
  totalActions: 0,
  averageResponseTime: 0,
  storeStates: {
    counter: { count: 0, lastUpdate: Date.now() },
    user: { name: '자동 HMR 사용자', email: 'auto@hmr.com' }
  }
} as MonitoringData);

// 액션 타입 정의
interface AutoHMRActions extends ActionPayloadMap {
  increment: void;
  decrement: void;
  updateUser: { name: string; email: string };
  reset: void;
}

// ActionProvider가 내부적으로 ActionRegister를 생성하므로 여기서는 제거

// 모니터링 헬퍼 함수들
const logActionStart = (action: string, payload?: any): string => {
  const eventId = `${action}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const monitoring = monitoringStore.getValue();
  
  const newEvent: ActionEvent = {
    id: eventId,
    action,
    timestamp: Date.now(),
    status: 'pending',
    payload: payload || null
  };
  
  monitoringStore.setValue({
    ...monitoring,
    events: [...monitoring.events.slice(-9), newEvent], // 최근 10개만 유지
    totalActions: monitoring.totalActions + 1
  });
  
  return eventId;
};

const logActionComplete = (eventId: string, storeChanges?: Array<{ storeName: string; oldValue: any; newValue: any }>) => {
  const monitoring = monitoringStore.getValue();
  const events = monitoring.events.map(event => {
    if (event.id === eventId) {
      const duration = Date.now() - event.timestamp;
      return {
        ...event,
        status: 'success' as const,
        duration,
        storeChanges
      };
    }
    return event;
  });
  
  // 평균 응답 시간 계산
  const completedEvents = events.filter(e => e.status === 'success' && e.duration);
  const averageResponseTime = completedEvents.length > 0 
    ? Math.round(completedEvents.reduce((sum, e) => sum + (e.duration || 0), 0) / completedEvents.length)
    : 0;
  
  // 현재 스토어 상태 업데이트
  const storeStates = {
    counter: counterStore.getValue(),
    user: userStore.getValue()
  };
  
  monitoringStore.setValue({
    ...monitoring,
    events,
    averageResponseTime,
    storeStates
  });
};

// 액션 핸들러들 (HMR 대응을 위해 함수로 분리)
const incrementHandler = () => {
  const eventId = logActionStart('increment');
  const current = counterStore.getValue();
  const newValue = {
    count: current.count + 1,
    lastUpdate: Date.now()
  };
  
  counterStore.setValue(newValue);
  console.log(`카운터 증가: ${current.count} → ${current.count + 1}`);
  
  logActionComplete(eventId, [{
    storeName: 'counter',
    oldValue: current,
    newValue
  }]);
};

const decrementHandler = () => {
  const eventId = logActionStart('decrement');
  const current = counterStore.getValue();
  const newValue = {
    count: current.count - 1,
    lastUpdate: Date.now()
  };
  
  counterStore.setValue(newValue);
  console.log(`카운터 감소: ${current.count} → ${current.count - 1}`);
  
  logActionComplete(eventId, [{
    storeName: 'counter',
    oldValue: current,
    newValue
  }]);
};

const updateUserHandler = ({ name, email }: { name: string; email: string }) => {
  const eventId = logActionStart('updateUser', { name, email });
  const current = userStore.getValue();
  const newValue = { name, email };
  
  userStore.setValue(newValue);
  console.log(`사용자 업데이트:`, { name, email });
  
  logActionComplete(eventId, [{
    storeName: 'user',
    oldValue: current,
    newValue
  }]);
};

const resetHandler = () => {
  const eventId = logActionStart('reset');
  const currentCounter = counterStore.getValue();
  const currentUser = userStore.getValue();
  
  const newCounter = { count: 0, lastUpdate: Date.now() };
  const newUser = { name: '자동 HMR 사용자', email: 'auto@hmr.com' };
  
  counterStore.setValue(newCounter);
  userStore.setValue(newUser);
  console.log('모든 상태 초기화');
  
  logActionComplete(eventId, [
    { storeName: 'counter', oldValue: currentCounter, newValue: newCounter },
    { storeName: 'user', oldValue: currentUser, newValue: newUser }
  ]);
};

/**
 * 실시간 모니터링 컴포넌트
 */
function MonitoringTool() {
  const monitoringData = useStoreValue(monitoringStore);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('ko-KR', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit'
    });
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#ff9800';
      case 'success': return '#4CAF50';
      case 'error': return '#f44336';
      default: return '#666';
    }
  };
  
  const renderStoreChange = (change: { storeName: string; oldValue: any; newValue: any }) => {
    if (change.storeName === 'counter') {
      return `카운터: ${change.oldValue.count} → ${change.newValue.count}`;
    } else if (change.storeName === 'user') {
      return `사용자: ${change.oldValue.name} → ${change.newValue.name}`;
    }
    return `${change.storeName}: 변경됨`;
  };
  
  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      color: 'white',
      borderRadius: '12px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      minWidth: '300px',
      maxWidth: '500px',
      zIndex: 1000,
      fontSize: '12px',
      backdropFilter: 'blur(10px)'
    }}>
      {/* 헤더 */}
      <div 
        style={{
          padding: '12px 16px',
          backgroundColor: 'rgba(33, 150, 243, 0.2)',
          borderRadius: '12px 12px 0 0',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: isExpanded ? '1px solid rgba(255, 255, 255, 0.1)' : 'none'
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>📊</span>
          <strong>실시간 모니터링</strong>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '10px', color: '#90CAF9' }}>
            총 {monitoringData.totalActions}회 | 평균 {monitoringData.averageResponseTime}ms
          </span>
          <span style={{ transform: `rotate(${isExpanded ? 180 : 0}deg)`, transition: 'transform 0.2s' }}>
            ▼
          </span>
        </div>
      </div>
      
      {/* 상세 내용 */}
      {isExpanded && (
        <div style={{ padding: '16px' }}>
          {/* 성능 메트릭 */}
          <div style={{ marginBottom: '16px' }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#E3F2FD', fontSize: '14px' }}>⚡ 성능 메트릭</h4>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '8px',
              padding: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '6px'
            }}>
              <div>
                <div style={{ color: '#90CAF9', fontSize: '10px' }}>총 액션 수</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{monitoringData.totalActions}</div>
              </div>
              <div>
                <div style={{ color: '#90CAF9', fontSize: '10px' }}>평균 응답시간</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{monitoringData.averageResponseTime}ms</div>
              </div>
            </div>
          </div>
          
          {/* 현재 스토어 상태 */}
          <div style={{ marginBottom: '16px' }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#E3F2FD', fontSize: '14px' }}>🏪 현재 스토어 상태</h4>
            <div style={{ 
              padding: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '6px',
              fontSize: '11px'
            }}>
              <div style={{ marginBottom: '4px' }}>
                <span style={{ color: '#A5D6A7' }}>카운터:</span> {monitoringData.storeStates.counter?.count || 0}
              </div>
              <div>
                <span style={{ color: '#A5D6A7' }}>사용자:</span> {monitoringData.storeStates.user?.name || 'N/A'}
              </div>
            </div>
          </div>
          
          {/* 최근 액션 이벤트 */}
          <div>
            <h4 style={{ margin: '0 0 8px 0', color: '#E3F2FD', fontSize: '14px' }}>🎯 최근 액션 ({monitoringData.events.length})</h4>
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {monitoringData.events.length === 0 ? (
                <div style={{ 
                  padding: '12px',
                  textAlign: 'center',
                  color: '#666',
                  fontStyle: 'italic'
                }}>
                  아직 액션이 실행되지 않았습니다
                </div>
              ) : (
                monitoringData.events.slice().reverse().map((event) => (
                  <div key={event.id} style={{
                    padding: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '6px',
                    marginBottom: '6px',
                    borderLeft: `3px solid ${getStatusColor(event.status)}`
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 'bold', color: '#FFF' }}>{event.action}</span>
                      <span style={{ color: '#90CAF9', fontSize: '10px' }}>
                        {formatTime(event.timestamp)}
                      </span>
                    </div>
                    <div style={{ marginTop: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ 
                        color: getStatusColor(event.status),
                        fontSize: '10px',
                        textTransform: 'uppercase',
                        fontWeight: 'bold'
                      }}>
                        {event.status}
                      </span>
                      {event.duration && (
                        <span style={{ color: '#A5D6A7', fontSize: '10px' }}>
                          {event.duration}ms
                        </span>
                      )}
                    </div>
                    {event.storeChanges && event.storeChanges.length > 0 && (
                      <div style={{ marginTop: '4px', fontSize: '10px', color: '#FFCC80' }}>
                        {event.storeChanges.map((change, idx) => (
                          <div key={idx}>{renderStoreChange(change)}</div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 메인 예시 컴포넌트
 * 별도 HMR 설정 없이 일반적인 패턴으로 작성
 */
function AutoHMRDemo() {
  // 일반적인 useStoreValue 사용 - HMR 자동 적용됨!
  const counter = useStoreValue(counterStore) as { count: number; lastUpdate: number };
  const user = useStoreValue(userStore) as { name: string; email: string };
  const dispatch = useActionDispatch<AutoHMRActions>();
  const actionRegister = useActionRegister<AutoHMRActions>();

  // 핸들러 등록 - ActionProvider의 ActionRegister 사용
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
  }, [actionRegister]);

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
    <ActionProvider config={{ debug: false }}>
      <AutoHMRDemo />
      <MonitoringTool />
      <GlobalAutoHMRStatus />
    </ActionProvider>
  );
}