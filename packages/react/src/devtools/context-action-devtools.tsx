/**
 * Context-Action DevTools React 컴포넌트
 * 독립적인 DevTools UI 제공
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { globalDevTools } from './devtools-manager';
import type { DevToolsState, DevToolsAction } from './types';

interface DevToolsProps {
  /** DevTools 표시 여부 */
  isOpen?: boolean;
  /** DevTools 토글 함수 */
  onToggle?: () => void;
  /** DevTools 위치 */
  position?: 'bottom' | 'right' | 'floating';
  /** DevTools 테마 */
  theme?: 'light' | 'dark' | 'auto';
  /** 최대 높이 */
  maxHeight?: number;
}

/**
 * Context-Action DevTools 메인 컴포넌트
 */
export const ContextActionDevTools: React.FC<DevToolsProps> = ({
  isOpen = false,
  onToggle,
  position = 'bottom',
  theme = 'auto',
  maxHeight = 400
}) => {
  const [devToolsState, setDevToolsState] = useState<DevToolsState>(() => 
    globalDevTools.getStateSnapshot()
  );
  const [selectedTab, setSelectedTab] = useState<'stores' | 'actions' | 'performance'>('stores');
  const [selectedStore, setSelectedStore] = useState<string | null>(null);

  // DevTools 상태 구독
  useEffect(() => {
    let isSubscribed = true;
    
    const updateState = () => {
      if (isSubscribed) {
        setDevToolsState(globalDevTools.getStateSnapshot());
      }
    };

    // 주기적으로 상태 업데이트 (실제로는 DevTools에서 이벤트를 받아야 함)
    const interval = setInterval(updateState, 1000);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, []);

  // 테마 감지
  const effectiveTheme = useMemo(() => {
    if (theme === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return theme;
  }, [theme]);

  // 스타일 계산
  const containerStyle: React.CSSProperties = {
    position: position === 'floating' ? 'fixed' : 'relative',
    bottom: position === 'bottom' ? 0 : 'auto',
    right: position === 'right' ? 0 : 'auto',
    width: position === 'right' ? '400px' : '100%',
    height: isOpen ? `${maxHeight}px` : '40px',
    backgroundColor: effectiveTheme === 'dark' ? '#1a1a1a' : '#ffffff',
    border: `1px solid ${effectiveTheme === 'dark' ? '#333' : '#ccc'}`,
    borderRadius: position === 'floating' ? '8px' : '0',
    fontFamily: '"Monaco", "Menlo", "Ubuntu Mono", monospace',
    fontSize: '12px',
    boxShadow: position === 'floating' ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
    zIndex: 10000,
    transition: 'height 0.3s ease',
    overflow: 'hidden'
  };

  const headerStyle: React.CSSProperties = {
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    padding: '0 12px',
    backgroundColor: effectiveTheme === 'dark' ? '#2a2a2a' : '#f5f5f5',
    borderBottom: `1px solid ${effectiveTheme === 'dark' ? '#333' : '#ddd'}`,
    cursor: 'pointer'
  };

  const contentStyle: React.CSSProperties = {
    height: 'calc(100% - 80px)',
    overflow: 'auto',
    padding: '8px'
  };

  const tabStyle: React.CSSProperties = {
    height: '40px',
    display: 'flex',
    borderBottom: `1px solid ${effectiveTheme === 'dark' ? '#333' : '#ddd'}`
  };

  const getTabButtonStyle = (tabName: string): React.CSSProperties => ({
    padding: '8px 16px',
    border: 'none',
    backgroundColor: selectedTab === tabName 
      ? (effectiveTheme === 'dark' ? '#444' : '#e9e9e9')
      : 'transparent',
    color: effectiveTheme === 'dark' ? '#fff' : '#000',
    cursor: 'pointer',
    borderBottom: selectedTab === tabName ? '2px solid #007acc' : 'none'
  });

  const handleToggle = useCallback(() => {
    onToggle?.();
  }, [onToggle]);

  if (!isOpen) {
    return (
      <div style={containerStyle}>
        <div style={headerStyle} onClick={handleToggle}>
          <span style={{ color: effectiveTheme === 'dark' ? '#fff' : '#000' }}>
            🔧 Context-Action DevTools
          </span>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={headerStyle} onClick={handleToggle}>
        <span style={{ color: effectiveTheme === 'dark' ? '#fff' : '#000' }}>
          🔧 Context-Action DevTools
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          <span style={{ color: effectiveTheme === 'dark' ? '#888' : '#666' }}>
            Stores: {Object.keys(devToolsState.stores).length}
          </span>
          <span style={{ color: effectiveTheme === 'dark' ? '#888' : '#666' }}>
            Actions: {devToolsState.actions.length}
          </span>
        </div>
      </div>

      <div style={tabStyle}>
        {(['stores', 'actions', 'performance'] as const).map(tab => (
          <button
            key={tab}
            style={getTabButtonStyle(tab)}
            onClick={() => setSelectedTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div style={contentStyle}>
        {selectedTab === 'stores' && (
          <StoresTab 
            stores={devToolsState.stores}
            theme={effectiveTheme}
            selectedStore={selectedStore}
            onSelectStore={setSelectedStore}
          />
        )}
        
        {selectedTab === 'actions' && (
          <ActionsTab 
            actions={devToolsState.actions}
            theme={effectiveTheme}
          />
        )}
        
        {selectedTab === 'performance' && (
          <PerformanceTab 
            performance={devToolsState.performance}
            theme={effectiveTheme}
          />
        )}
      </div>
    </div>
  );
};

/**
 * Stores 탭 컴포넌트
 */
const StoresTab: React.FC<{
  stores: DevToolsState['stores'];
  theme: 'light' | 'dark';
  selectedStore: string | null;
  onSelectStore: (storeName: string | null) => void;
}> = ({ stores, theme, selectedStore, onSelectStore }) => {
  const storeListStyle: React.CSSProperties = {
    display: 'flex',
    height: '100%'
  };

  const sidebarStyle: React.CSSProperties = {
    width: '200px',
    borderRight: `1px solid ${theme === 'dark' ? '#333' : '#ddd'}`,
    overflow: 'auto'
  };

  const contentStyle: React.CSSProperties = {
    flex: 1,
    padding: '0 12px',
    overflow: 'auto'
  };

  const storeItemStyle = (storeName: string): React.CSSProperties => ({
    padding: '8px 12px',
    cursor: 'pointer',
    backgroundColor: selectedStore === storeName 
      ? (theme === 'dark' ? '#444' : '#e9e9e9') 
      : 'transparent',
    borderBottom: `1px solid ${theme === 'dark' ? '#333' : '#eee'}`,
    color: theme === 'dark' ? '#fff' : '#000'
  });

  return (
    <div style={storeListStyle}>
      <div style={sidebarStyle}>
        {Object.entries(stores).map(([storeName, storeState]) => (
          <div
            key={storeName}
            style={storeItemStyle(storeName)}
            onClick={() => onSelectStore(storeName)}
          >
            <div style={{ fontWeight: 'bold' }}>{storeName}</div>
            <div style={{ fontSize: '10px', color: theme === 'dark' ? '#888' : '#666' }}>
              v{storeState.version}
            </div>
          </div>
        ))}
      </div>
      
      <div style={contentStyle}>
        {selectedStore ? (
          <div>
            <h4 style={{ color: theme === 'dark' ? '#fff' : '#000' }}>
              {selectedStore}
            </h4>
            <pre style={{ 
              backgroundColor: theme === 'dark' ? '#222' : '#f8f8f8',
              padding: '12px',
              borderRadius: '4px',
              fontSize: '11px',
              color: theme === 'dark' ? '#fff' : '#000',
              overflow: 'auto'
            }}>
              {JSON.stringify(stores[selectedStore]?.value, null, 2)}
            </pre>
          </div>
        ) : (
          <div style={{ 
            color: theme === 'dark' ? '#888' : '#666',
            textAlign: 'center',
            padding: '20px'
          }}>
            Select a store to view its state
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Actions 탭 컴포넌트
 */
const ActionsTab: React.FC<{
  actions: DevToolsAction[];
  theme: 'light' | 'dark';
}> = ({ actions, theme }) => {
  const actionStyle: React.CSSProperties = {
    padding: '8px 12px',
    borderBottom: `1px solid ${theme === 'dark' ? '#333' : '#eee'}`,
    fontSize: '11px'
  };

  const recentActions = actions.slice(-20).reverse();

  return (
    <div>
      {recentActions.length === 0 ? (
        <div style={{ 
          color: theme === 'dark' ? '#888' : '#666',
          textAlign: 'center',
          padding: '20px'
        }}>
          No actions recorded
        </div>
      ) : (
        recentActions.map((action, index) => (
          <div key={`${action.timestamp}-${index}`} style={actionStyle}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              color: theme === 'dark' ? '#fff' : '#000'
            }}>
              <span style={{ fontWeight: 'bold' }}>{action.type}</span>
              <span style={{ color: theme === 'dark' ? '#888' : '#666' }}>
                {action.duration ? `${action.duration.toFixed(2)}ms` : ''}
              </span>
            </div>
            {action.storeName && (
              <div style={{ color: theme === 'dark' ? '#888' : '#666' }}>
                Store: {action.storeName}
              </div>
            )}
            <div style={{ 
              color: theme === 'dark' ? '#888' : '#666',
              fontSize: '10px'
            }}>
              {new Date(action.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

/**
 * Performance 탭 컴포넌트
 */
const PerformanceTab: React.FC<{
  performance: DevToolsState['performance'];
  theme: 'light' | 'dark';
}> = ({ performance, theme }) => {
  const statStyle: React.CSSProperties = {
    padding: '12px',
    borderBottom: `1px solid ${theme === 'dark' ? '#333' : '#eee'}`,
    color: theme === 'dark' ? '#fff' : '#000'
  };

  return (
    <div>
      <div style={statStyle}>
        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
          Total Actions: {performance.totalActions}
        </div>
      </div>
      
      <div style={statStyle}>
        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
          Average Action Time: {performance.averageActionTime.toFixed(2)}ms
        </div>
      </div>
      
      <div style={statStyle}>
        <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
          Slow Actions ({performance.slowActions.length})
        </div>
        {performance.slowActions.slice(-5).map((action, index) => (
          <div key={index} style={{ 
            fontSize: '11px', 
            marginBottom: '4px',
            color: theme === 'dark' ? '#888' : '#666'
          }}>
            {action.type} - {action.duration?.toFixed(2)}ms
          </div>
        ))}
      </div>
    </div>
  );
};