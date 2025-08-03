/**
 * @fileoverview HMR Development Dashboard Component
 * HMR 상태를 시각적으로 모니터링하고 디버깅할 수 있는 개발 도구
 * 개발 환경에서만 사용되며 프로덕션 빌드에서는 제외됨
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { hmrStateManager } from './hmr-state-manager';
import { LogArtHelpers } from '@context-action/logger';

/**
 * HMR 대시보드 상태
 */
interface HMRDashboardState {
  stats: ReturnType<typeof hmrStateManager.getStats>;
  isExpanded: boolean;
  selectedTab: 'overview' | 'stores' | 'actions' | 'logs';
  autoRefresh: boolean;
  refreshInterval: number;
}

/**
 * HMR 로그 엔트리
 */
interface HMRLogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'debug' | 'warn' | 'error';
  category: 'store' | 'action' | 'system';
  message: string;
  details?: any;
}

/**
 * HMR 대시보드 스타일
 */
const dashboardStyles: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    backgroundColor: '#1a1a1a',
    color: '#ffffff',
    border: '1px solid #333',
    borderRadius: '8px',
    fontFamily: 'Monaco, Consolas, "Courier New", monospace',
    fontSize: '12px',
    zIndex: 10000,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
    maxWidth: '600px',
    maxHeight: '400px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 12px',
    backgroundColor: '#2a2a2a',
    borderBottom: '1px solid #333',
    borderRadius: '8px 8px 0 0',
    cursor: 'pointer',
  },
  title: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#00ff88',
  },
  controls: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#333',
    color: '#fff',
    border: 'none',
    padding: '4px 8px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '11px',
  },
  buttonActive: {
    backgroundColor: '#00ff88',
    color: '#000',
  },
  content: {
    padding: '12px',
    overflow: 'auto',
    maxHeight: '300px',
  },
  tabs: {
    display: 'flex',
    gap: '2px',
    marginBottom: '12px',
    borderBottom: '1px solid #333',
  },
  tab: {
    padding: '6px 12px',
    backgroundColor: 'transparent',
    color: '#999',
    border: 'none',
    borderBottomWidth: '2px',
    borderBottomStyle: 'solid',
    borderBottomColor: 'transparent',
    cursor: 'pointer',
    fontSize: '11px',
  },
  tabActive: {
    color: '#00ff88',
    borderBottomColor: '#00ff88',
  },
  stats: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
    marginBottom: '12px',
  },
  statItem: {
    padding: '8px',
    backgroundColor: '#2a2a2a',
    borderRadius: '4px',
  },
  statLabel: {
    color: '#999',
    fontSize: '10px',
    marginBottom: '2px',
  },
  statValue: {
    color: '#00ff88',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  logEntry: {
    marginBottom: '4px',
    padding: '4px 8px',
    backgroundColor: '#2a2a2a',
    borderRadius: '4px',
    borderLeft: '3px solid',
  },
  logTimestamp: {
    color: '#999',
    fontSize: '10px',
  },
  logMessage: {
    color: '#fff',
    marginTop: '2px',
  },
  logDetails: {
    color: '#ccc',
    fontSize: '10px',
    marginTop: '2px',
    opacity: 0.8,
  },
};

/**
 * 로그 레벨별 색상
 */
const logLevelColors = {
  info: '#00ff88',
  debug: '#0088ff',
  warn: '#ffaa00',
  error: '#ff4444',
};

/**
 * HMR 개발 대시보드 컴포넌트
 * 
 * 개발 환경에서 HMR 상태를 실시간으로 모니터링할 수 있는 시각적 도구
 * Store 상태, Action 핸들러, 복원 통계 등을 표시
 */
export function HMRDevDashboard(): JSX.Element | null {
  // 프로덕션 환경에서는 렌더링하지 않음
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  const [state, setState] = useState<HMRDashboardState>({
    stats: hmrStateManager.getStats(),
    isExpanded: false,
    selectedTab: 'overview',
    autoRefresh: true,
    refreshInterval: 2000, // 2초마다 새로고침
  });

  const [logs, setLogs] = useState<HMRLogEntry[]>([]);

  // 통계 새로고침
  const refreshStats = useCallback(() => {
    setState(prev => ({ ...prev, stats: hmrStateManager.getStats() }));
  }, []);

  // 자동 새로고침 효과
  useEffect(() => {
    if (!state.autoRefresh) return;

    const timer = setInterval(refreshStats, state.refreshInterval);
    return () => clearInterval(timer);
  }, [state.autoRefresh, state.refreshInterval, refreshStats]);

  // HMR 로그 추가 함수
  const addLog = useCallback((entry: Omit<HMRLogEntry, 'id' | 'timestamp'>) => {
    const newEntry: HMRLogEntry = {
      ...entry,
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };

    setLogs(prev => {
      const updated = [newEntry, ...prev].slice(0, 50); // 최대 50개 로그 유지
      return updated;
    });
  }, []);

  // HMR 이벤트 리스너 등록
  useEffect(() => {
    // 전역 HMR 로그 수집기 등록
    const originalConsoleInfo = console.info;
    const originalConsoleWarn = console.warn;
    const originalConsoleError = console.error;

    console.info = (...args) => {
      originalConsoleInfo(...args);
      const message = args.join(' ');
      if (message.includes('HMR') || message.includes('Store') || message.includes('Action')) {
        addLog({
          level: 'info',
          category: message.includes('Store') ? 'store' : message.includes('Action') ? 'action' : 'system',
          message,
          details: args.length > 1 ? args.slice(1) : undefined,
        });
      }
    };

    console.warn = (...args) => {
      originalConsoleWarn(...args);
      const message = args.join(' ');
      if (message.includes('HMR') || message.includes('Store') || message.includes('Action')) {
        addLog({
          level: 'warn',
          category: message.includes('Store') ? 'store' : message.includes('Action') ? 'action' : 'system',
          message,
          details: args.length > 1 ? args.slice(1) : undefined,
        });
      }
    };

    console.error = (...args) => {
      originalConsoleError(...args);
      const message = args.join(' ');
      if (message.includes('HMR') || message.includes('Store') || message.includes('Action')) {
        addLog({
          level: 'error',
          category: message.includes('Store') ? 'store' : message.includes('Action') ? 'action' : 'system',
          message,
          details: args.length > 1 ? args.slice(1) : undefined,
        });
      }
    };

    return () => {
      console.info = originalConsoleInfo;
      console.warn = originalConsoleWarn;
      console.error = originalConsoleError;
    };
  }, [addLog]);

  // 대시보드 토글
  const toggleDashboard = useCallback(() => {
    setState(prev => ({ ...prev, isExpanded: !prev.isExpanded }));
  }, []);

  // 탭 변경
  const changeTab = useCallback((tab: HMRDashboardState['selectedTab']) => {
    setState(prev => ({ ...prev, selectedTab: tab }));
  }, []);

  // 자동 새로고침 토글
  const toggleAutoRefresh = useCallback(() => {
    setState(prev => ({ ...prev, autoRefresh: !prev.autoRefresh }));
  }, []);

  // 전체 상태 정리
  const clearAll = useCallback(() => {
    hmrStateManager.clearAll();
    setLogs([]);
    refreshStats();
    addLog({
      level: 'info',
      category: 'system',
      message: 'HMR 전체 상태 정리 완료',
    });
  }, [refreshStats, addLog]);

  // 탭별 콘텐츠 렌더링
  const renderTabContent = () => {
    switch (state.selectedTab) {
      case 'overview':
        return (
          <div>
            <div style={dashboardStyles.stats}>
              <div style={dashboardStyles.statItem}>
                <div style={dashboardStyles.statLabel}>활성화 상태</div>
                <div style={dashboardStyles.statValue}>
                  {state.stats.enabled ? '✅ 활성화' : '❌ 비활성화'}
                </div>
              </div>
              <div style={dashboardStyles.statItem}>
                <div style={dashboardStyles.statLabel}>Store 수</div>
                <div style={dashboardStyles.statValue}>{state.stats.stores}</div>
              </div>
              <div style={dashboardStyles.statItem}>
                <div style={dashboardStyles.statLabel}>Action 수</div>
                <div style={dashboardStyles.statValue}>{state.stats.actions}</div>
              </div>
              <div style={dashboardStyles.statItem}>
                <div style={dashboardStyles.statLabel}>Registry 수</div>
                <div style={dashboardStyles.statValue}>{state.stats.registries}</div>
              </div>
            </div>
            <div>
              <div style={{ color: '#999', fontSize: '10px', marginBottom: '8px' }}>
                상태 요약
              </div>
              <div style={{ color: '#ccc', fontSize: '11px', lineHeight: '1.5' }}>
                {state.stats.enabled 
                  ? `HMR이 활성화되어 ${state.stats.stores}개의 Store와 ${state.stats.actions}개의 Action이 모니터링되고 있습니다.`
                  : 'HMR이 비활성화 상태입니다. 개발 환경에서만 사용 가능합니다.'
                }
              </div>
            </div>
          </div>
        );

      case 'stores':
        return (
          <div>
            <div style={{ color: '#999', fontSize: '10px', marginBottom: '8px' }}>
              Store 상태 목록
            </div>
            {state.stats.stores > 0 ? (
              <div style={{ color: '#ccc', fontSize: '11px' }}>
                {state.stats.stores}개의 Store가 HMR 백업되고 있습니다.
              </div>
            ) : (
              <div style={{ color: '#999', fontSize: '11px' }}>
                백업된 Store가 없습니다.
              </div>
            )}
          </div>
        );

      case 'actions':
        return (
          <div>
            <div style={{ color: '#999', fontSize: '10px', marginBottom: '8px' }}>
              Action 핸들러 목록
            </div>
            {state.stats.actions > 0 ? (
              <div style={{ color: '#ccc', fontSize: '11px' }}>
                {state.stats.actions}개의 Action 타입이 등록되어 있습니다.
              </div>
            ) : (
              <div style={{ color: '#999', fontSize: '11px' }}>
                등록된 Action 핸들러가 없습니다.
              </div>
            )}
          </div>
        );

      case 'logs':
        return (
          <div>
            <div style={{ color: '#999', fontSize: '10px', marginBottom: '8px' }}>
              HMR 로그 ({logs.length}/50)
            </div>
            {logs.length > 0 ? (
              <div style={{ maxHeight: '200px', overflow: 'auto' }}>
                {logs.map(log => (
                  <div 
                    key={log.id} 
                    style={{ 
                      ...dashboardStyles.logEntry, 
                      borderLeftColor: logLevelColors[log.level] 
                    }}
                  >
                    <div style={dashboardStyles.logTimestamp}>
                      {log.timestamp.toLocaleTimeString('ko-KR')} [{log.category}]
                    </div>
                    <div style={dashboardStyles.logMessage}>{log.message}</div>
                    {log.details && (
                      <div style={dashboardStyles.logDetails}>
                        {JSON.stringify(log.details, null, 2)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: '#999', fontSize: '11px' }}>
                로그가 없습니다.
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={dashboardStyles.container}>
      {/* 헤더 */}
      <div style={dashboardStyles.header} onClick={toggleDashboard}>
        <div style={dashboardStyles.title}>
          🔥 HMR Dashboard {state.stats.enabled ? '●' : '○'}
        </div>
        <div style={dashboardStyles.controls}>
          <button
            style={{
              ...dashboardStyles.button,
              ...(state.autoRefresh ? dashboardStyles.buttonActive : {}),
            }}
            onClick={(e) => {
              e.stopPropagation();
              toggleAutoRefresh();
            }}
          >
            {state.autoRefresh ? '⏸️' : '▶️'}
          </button>
          <button
            style={dashboardStyles.button}
            onClick={(e) => {
              e.stopPropagation();
              refreshStats();
            }}
          >
            🔄
          </button>
          <button
            style={dashboardStyles.button}
            onClick={(e) => {
              e.stopPropagation();
              clearAll();
            }}
          >
            🗑️
          </button>
          <span>{state.isExpanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* 콘텐츠 */}
      {state.isExpanded && (
        <div style={dashboardStyles.content}>
          {/* 탭 */}
          <div style={dashboardStyles.tabs}>
            {['overview', 'stores', 'actions', 'logs'].map(tab => (
              <button
                key={tab}
                style={{
                  ...dashboardStyles.tab,
                  ...(state.selectedTab === tab ? dashboardStyles.tabActive : {}),
                }}
                onClick={() => changeTab(tab as HMRDashboardState['selectedTab'])}
              >
                {tab === 'overview' && '📊 개요'}
                {tab === 'stores' && '🏪 Store'}
                {tab === 'actions' && '⚡ Action'}
                {tab === 'logs' && '📝 로그'}
              </button>
            ))}
          </div>

          {/* 탭 콘텐츠 */}
          {renderTabContent()}
        </div>
      )}
    </div>
  );
}

/**
 * HMR 개발 대시보드를 자동으로 렌더링하는 컴포넌트
 * 개발 환경에서만 렌더링됨
 */
export function AutoHMRDashboard(): JSX.Element | null {
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  // HMR이 활성화된 경우에만 대시보드 표시
  const [isHMREnabled, setIsHMREnabled] = useState(false);

  useEffect(() => {
    const checkHMRStatus = () => {
      const stats = hmrStateManager.getStats();
      setIsHMREnabled(stats.enabled);
    };

    checkHMRStatus();
    const timer = setInterval(checkHMRStatus, 5000); // 5초마다 상태 확인

    return () => clearInterval(timer);
  }, []);

  return isHMREnabled ? <HMRDevDashboard /> : null;
}