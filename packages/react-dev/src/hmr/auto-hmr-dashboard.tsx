/**
 * @fileoverview Auto HMR Dashboard
 * 개발 환경에서 자동으로 표시되는 최소한의 HMR 상태 표시기
 * 설정 없이 자동으로 활성화되며, 필요시에만 확장 가능
 */

import React, { useEffect, useState } from 'react';
import { getAutoHMRStats, shouldAutoEnableHMRTools } from './auto-hmr';
import { hmrLogger } from './hmr-logger';

/**
 * 자동 HMR 상태 정보
 */
interface AutoHMRStatus {
  isActive: boolean;
  storeCount: number;
  lastActivity: string | null;
  errors: number;
}

/**
 * 최소한의 HMR 상태 표시 컴포넌트
 * 우측 하단에 작은 상태 표시기로 나타남
 */
export function AutoHMRStatus() {
  const [status, setStatus] = useState<AutoHMRStatus>({
    isActive: false,
    storeCount: 0,
    lastActivity: null,
    errors: 0
  });

  const [isVisible, setIsVisible] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!shouldAutoEnableHMRTools()) return;

    const updateStatus = () => {
      const autoStats = getAutoHMRStats();
      const loggerStats = hmrLogger.getStats();
      
      setStatus({
        isActive: autoStats.enabled,
        storeCount: autoStats.wrappedStores || 0,
        lastActivity: loggerStats.lastActivity?.toLocaleTimeString('ko-KR') || null,
        errors: loggerStats.errorCount
      });
    };

    // 초기 업데이트
    updateStatus();

    // 주기적 업데이트 (5초마다)
    const interval = setInterval(updateStatus, 5000);

    // HMR 로그 구독
    const unsubscribe = hmrLogger.subscribe(() => {
      updateStatus();
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, []);

  // HMR이 비활성화된 환경에서는 렌더링하지 않음
  if (!shouldAutoEnableHMRTools() || !isVisible) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 9999,
        backgroundColor: status.isActive ? '#1a1a1a' : '#333',
        color: '#fff',
        borderRadius: '8px',
        border: `2px solid ${status.errors > 0 ? '#ff4444' : status.isActive ? '#00ff88' : '#666'}`,
        fontFamily: 'Monaco, Consolas, monospace',
        fontSize: '11px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        minWidth: isExpanded ? '200px' : '80px',
        maxWidth: isExpanded ? '300px' : '120px'
      }}
      onClick={() => setIsExpanded(!isExpanded)}
      title="HMR 상태 (클릭하여 확장/축소)"
    >
      {/* 헤더 */}
      <div
        style={{
          padding: '4px 8px',
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          borderTopLeftRadius: '6px',
          borderTopRightRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <span style={{ color: status.isActive ? '#00ff88' : '#999' }}>
          🔥 HMR
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsVisible(false);
          }}
          style={{
            background: 'none',
            border: 'none',
            color: '#999',
            cursor: 'pointer',
            fontSize: '12px',
            padding: '0',
            width: '16px',
            height: '16px'
          }}
          title="숨기기"
        >
          ×
        </button>
      </div>

      {/* 상태 정보 */}
      <div style={{ padding: '6px 8px' }}>
        {isExpanded ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>상태:</span>
              <span style={{ color: status.isActive ? '#00ff88' : '#ff4444' }}>
                {status.isActive ? '활성' : '비활성'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Store:</span>
              <span style={{ color: '#00aaff' }}>{status.storeCount}개</span>
            </div>
            {status.errors > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>오류:</span>
                <span style={{ color: '#ff4444' }}>{status.errors}개</span>
              </div>
            )}
            {status.lastActivity && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#999' }}>
                <span>최근:</span>
                <span>{status.lastActivity}</span>
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: status.isActive ? '#00ff88' : '#999' }}>
              {status.isActive ? '●' : '○'}
            </div>
            <div style={{ fontSize: '9px', color: '#999' }}>
              {status.storeCount}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 전역 자동 HMR 상태 표시기
 * 앱의 루트에서 한 번만 렌더링하면 됨
 */
export function GlobalAutoHMRStatus() {
  // 이미 다른 AutoHMRStatus가 렌더링되었는지 확인
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    // 전역에서 한 번만 렌더링되도록 체크
    const key = '__AUTO_HMR_STATUS_RENDERED__';
    
    if (!(window as any)[key] && shouldAutoEnableHMRTools()) {
      (window as any)[key] = true;
      setShouldRender(true);
      
      return () => {
        delete (window as any)[key];
      };
    }
  }, []);

  if (!shouldRender) {
    return null;
  }

  return <AutoHMRStatus />;
}