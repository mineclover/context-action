/**
 * Registry viewer component showing all registered stores
 */

import type React from 'react';
import { useState } from 'react';
import { useStoreRegistry, useRegistry, useStore } from '@context-action/react';

const StoreRegistryViewer: React.FC = () => {
  const registry = useStoreRegistry();
  const stores = useRegistry(registry);
  const [expandedStores, setExpandedStores] = useState<Set<string>>(new Set());

  const toggleExpanded = (storeName: string) => {
    const newExpanded = new Set(expandedStores);
    if (newExpanded.has(storeName)) {
      newExpanded.delete(storeName);
    } else {
      newExpanded.add(storeName);
    }
    setExpandedStores(newExpanded);
  };

  const formatValue = (value: any): string => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return `"${value}"`;
    if (typeof value === 'boolean') return value.toString();
    if (typeof value === 'number') return value.toString();
    if (Array.isArray(value)) return `Array(${value.length})`;
    if (typeof value === 'object') {
      return `Object(${Object.keys(value).length} keys)`;
    }
    return String(value);
  };

  const getStoreTypeInfo = (store: any): string => {
    if (store.constructor.name === 'CounterStore') return 'Counter Store';
    if (store.constructor.name === 'ThemeStore') return 'Theme Store';
    if (store.constructor.name === 'UserStore') return 'User Store';
    if (store.constructor.name === 'CartStore') return 'Cart Store';
    if (store.constructor.name === 'ComputedStore') return 'Computed Store';
    if (store.constructor.name === 'PersistedStore') return 'Persisted Store';
    if (store.constructor.name === 'NumericStore') return 'Numeric Store';
    if (store.constructor.name === 'Store') return 'Basic Store';
    return 'Unknown Store';
  };

  const StoreDetail: React.FC<{ storeName: string; store: any }> = ({ storeName, store }) => {
    const snapshot = useStore(store);
    const isExpanded = expandedStores.has(storeName);

    return (
      <div style={storeItemStyle}>
        <div style={storeHeaderStyle} onClick={() => toggleExpanded(storeName)}>
          <div style={storeNameStyle}>
            <span style={expandIconStyle}>
              {isExpanded ? '▼' : '▶'}
            </span>
            <strong>{storeName}</strong>
            <span style={storeTypeStyle}>({getStoreTypeInfo(store)})</span>
          </div>
          <div style={storeMetaStyle}>
            <span style={listenerCountStyle}>
              {store.getListenerCount?.() || 0} listeners
            </span>
            <span style={timestampStyle}>
              {new Date(snapshot.lastUpdate).toLocaleTimeString()}
            </span>
          </div>
        </div>
        
        {isExpanded && (
          <div style={storeContentStyle}>
            <div style={valuePreviewStyle}>
              <strong>Current Value:</strong>
              <div style={valueDisplayStyle}>
                {formatValue(snapshot.value)}
              </div>
              {typeof snapshot.value === 'object' && snapshot.value !== null && (
                <details style={detailsStyle}>
                  <summary style={summaryStyle}>View Details</summary>
                  <pre style={jsonPreStyle}>
                    {JSON.stringify(snapshot.value, null, 2)}
                  </pre>
                </details>
              )}
            </div>
            
            <div style={storeInfoStyle}>
              <div style={infoRowStyle}>
                <span>Store Name:</span>
                <code>{store.name}</code>
              </div>
              <div style={infoRowStyle}>
                <span>Type:</span>
                <code>{getStoreTypeInfo(store)}</code>
              </div>
              <div style={infoRowStyle}>
                <span>Listeners:</span>
                <code>{store.getListenerCount?.() || 0}</code>
              </div>
              <div style={infoRowStyle}>
                <span>Last Update:</span>
                <code>{new Date(snapshot.lastUpdate).toLocaleString()}</code>
              </div>
              {store.constructor.name === 'ComputedStore' && (
                <div style={infoRowStyle}>
                  <span>Dependencies:</span>
                  <code>Computed (read-only)</code>
                </div>
              )}
              {store.constructor.name === 'PersistedStore' && (
                <div style={infoRowStyle}>
                  <span>Persistence:</span>
                  <code>localStorage/sessionStorage</code>
                </div>
              )}
            </div>

            {store.setValue && (
              <div style={actionsStyle}>
                <small style={actionsLabelStyle}>Quick Actions:</small>
                <div style={actionButtonsStyle}>
                  {store.constructor.name === 'CounterStore' && (
                    <>
                      <button style={actionButtonStyle} onClick={() => store.increment()}>
                        +1
                      </button>
                      <button style={actionButtonStyle} onClick={() => store.decrement()}>
                        -1
                      </button>
                      <button style={actionButtonStyle} onClick={() => store.reset()}>
                        Reset
                      </button>
                    </>
                  )}
                  {store.constructor.name === 'ThemeStore' && (
                    <button style={actionButtonStyle} onClick={() => store.toggleTheme()}>
                      Toggle Theme
                    </button>
                  )}
                  {store.constructor.name === 'CartStore' && (
                    <button style={actionButtonStyle} onClick={() => store.clearCart()}>
                      Clear Cart
                    </button>
                  )}
                  {store.constructor.name === 'UserStore' && (
                    <button style={actionButtonStyle} onClick={() => store.logout()}>
                      Logout
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={cardStyle}>
      <div style={headerStyle}>
        <h3 style={titleStyle}>🗂️ Store Registry Viewer</h3>
        <div style={statsStyle}>
          <span style={statStyle}>
            <strong>{stores.length}</strong> stores registered
          </span>
          <span style={statStyle}>
            Registry: <code>{registry.name}</code>
          </span>
        </div>
      </div>
      
      <p style={descriptionStyle}>
        This component shows all registered stores in the registry with their current values,
        metadata, and available actions. Click on any store to expand its details.
      </p>

      {stores.length === 0 ? (
        <div style={emptyStateStyle}>
          <div style={emptyIconStyle}>📂</div>
          <p style={emptyTextStyle}>No stores registered</p>
          <p style={emptySubTextStyle}>
            Stores will appear here as they are registered with the registry.
          </p>
        </div>
      ) : (
        <div style={storeListStyle}>
          {stores.map(([storeName, store]) => (
            <StoreDetail key={storeName} storeName={storeName} store={store} />
          ))}
        </div>
      )}

      <div style={controlsStyle}>
        <button
          style={toggleAllButtonStyle}
          onClick={() => {
            if (expandedStores.size === stores.length) {
              setExpandedStores(new Set());
            } else {
              setExpandedStores(new Set(stores.map(([name]) => name)));
            }
          }}
        >
          {expandedStores.size === stores.length ? 'Collapse All' : 'Expand All'}
        </button>
        
        <div style={registryActionsStyle}>
          <button
            style={debugButtonStyle}
            onClick={() => {
              console.log('Registry Debug Info:', {
                registryName: registry.name,
                storeCount: stores.length,
                stores: stores.map(([name, store]) => ({
                  name,
                  type: getStoreTypeInfo(store),
                  value: store.getValue(),
                  listeners: (store as any).getListenerCount?.() || 0
                }))
              });
            }}
          >
            Log Debug Info
          </button>
        </div>
      </div>

      <div style={infoStyle}>
        <small>
          💡 This registry viewer demonstrates real-time store monitoring. 
          All values update automatically when stores change. 
          Check the browser console for detailed debug information.
        </small>
      </div>
    </div>
  );
};

// Styles
const cardStyle: React.CSSProperties = {
  backgroundColor: 'white',
  borderRadius: '12px',
  padding: '24px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  border: '1px solid #e2e8f0'
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: '16px',
  flexWrap: 'wrap',
  gap: '12px'
};

const titleStyle: React.CSSProperties = {
  margin: '0',
  color: '#1e293b',
  fontSize: '1.25rem',
  fontWeight: '600'
};

const statsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '16px',
  alignItems: 'center',
  flexWrap: 'wrap'
};

const statStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  color: '#64748b',
  padding: '4px 8px',
  backgroundColor: '#f1f5f9',
  borderRadius: '4px'
};

const descriptionStyle: React.CSSProperties = {
  margin: '0 0 20px 0',
  color: '#64748b',
  fontSize: '0.9rem',
  lineHeight: '1.4'
};

const emptyStateStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '60px 20px',
  color: '#64748b'
};

const emptyIconStyle: React.CSSProperties = {
  fontSize: '3rem',
  marginBottom: '16px'
};

const emptyTextStyle: React.CSSProperties = {
  margin: '0 0 8px 0',
  fontSize: '1.1rem',
  fontWeight: '500',
  color: '#374151'
};

const emptySubTextStyle: React.CSSProperties = {
  margin: '0',
  fontSize: '0.9rem'
};

const storeListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  marginBottom: '20px'
};

const storeItemStyle: React.CSSProperties = {
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  overflow: 'hidden'
};

const storeHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 16px',
  backgroundColor: '#f8fafc',
  cursor: 'pointer',
  transition: 'background-color 0.2s'
};

const storeNameStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  color: '#1e293b',
  fontSize: '0.95rem',
  fontWeight: '500'
};

const expandIconStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  color: '#64748b',
  width: '12px'
};

const storeTypeStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: '0.8rem',
  fontWeight: 'normal'
};

const storeMetaStyle: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
  alignItems: 'center',
  fontSize: '0.8rem',
  color: '#64748b'
};

const listenerCountStyle: React.CSSProperties = {
  padding: '2px 6px',
  backgroundColor: '#dbeafe',
  color: '#1e40af',
  borderRadius: '3px',
  fontSize: '0.75rem'
};

const timestampStyle: React.CSSProperties = {
  fontFamily: 'monospace',
  fontSize: '0.75rem'
};

const storeContentStyle: React.CSSProperties = {
  padding: '16px',
  backgroundColor: 'white',
  borderTop: '1px solid #e2e8f0'
};

const valuePreviewStyle: React.CSSProperties = {
  marginBottom: '16px'
};

const valueDisplayStyle: React.CSSProperties = {
  padding: '8px 12px',
  backgroundColor: '#f1f5f9',
  borderRadius: '4px',
  fontFamily: 'monospace',
  fontSize: '0.85rem',
  marginTop: '4px',
  color: '#1e293b'
};

const detailsStyle: React.CSSProperties = {
  marginTop: '8px'
};

const summaryStyle: React.CSSProperties = {
  cursor: 'pointer',
  fontSize: '0.85rem',
  color: '#3b82f6',
  marginBottom: '8px'
};

const jsonPreStyle: React.CSSProperties = {
  backgroundColor: '#1e293b',
  color: '#e2e8f0',
  padding: '12px',
  borderRadius: '4px',
  fontSize: '0.75rem',
  overflow: 'auto',
  maxHeight: '200px'
};

const storeInfoStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '8px',
  marginBottom: '16px'
};

const infoRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: '0.8rem',
  padding: '4px 0'
};

const actionsStyle: React.CSSProperties = {
  borderTop: '1px solid #e2e8f0',
  paddingTop: '12px'
};

const actionsLabelStyle: React.CSSProperties = {
  color: '#64748b',
  display: 'block',
  marginBottom: '8px'
};

const actionButtonsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '6px',
  flexWrap: 'wrap'
};

const actionButtonStyle: React.CSSProperties = {
  padding: '4px 8px',
  backgroundColor: '#3b82f6',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '0.75rem',
  fontWeight: '500'
};

const controlsStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '12px',
  marginBottom: '16px',
  flexWrap: 'wrap'
};

const toggleAllButtonStyle: React.CSSProperties = {
  padding: '8px 16px',
  backgroundColor: '#8b5cf6',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '0.85rem',
  fontWeight: '500'
};

const registryActionsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '8px'
};

const debugButtonStyle: React.CSSProperties = {
  padding: '6px 12px',
  backgroundColor: '#64748b',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '0.8rem'
};

const infoStyle: React.CSSProperties = {
  padding: '12px',
  backgroundColor: 'rgba(59, 130, 246, 0.1)',
  borderRadius: '6px',
  borderLeft: '3px solid #3b82f6',
  color: '#64748b'
};

export default StoreRegistryViewer;