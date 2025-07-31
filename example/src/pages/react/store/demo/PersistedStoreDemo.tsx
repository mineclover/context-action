/**
 * Persisted store demonstration component
 */

import type React from 'react';
import { useState } from 'react';
import { useStoreRegistry, Store, useStoreValue } from '@context-action/react';

interface AppState {
  sessionId: string;
  lastVisit: number;
  visitCount: number;
  userNotes: string[];
  preferences: {
    autoSave: boolean;
    notifications: boolean;
  };
}

class PersistedStore extends Store<AppState> {
  constructor(name: string) {
    const initialState: AppState = {
      sessionId: Math.random().toString(36).substring(7),
      lastVisit: Date.now(),
      visitCount: 1,
      userNotes: [],
      preferences: {
        autoSave: true,
        notifications: true
      }
    };
    super(name, initialState);
  }

  addNote(note: string) {
    this.update(state => ({
      ...state,
      userNotes: [...state.userNotes, note]
    }));
  }

  removeNote(index: number) {
    this.update(state => ({
      ...state,
      userNotes: state.userNotes.filter((_, i) => i !== index)
    }));
  }

  updatePreferences(prefs: Partial<AppState['preferences']>) {
    this.update(state => ({
      ...state,
      preferences: { ...state.preferences, ...prefs }
    }));
  }

  incrementVisit() {
    this.update(state => ({
      ...state,
      visitCount: state.visitCount + 1,
      lastVisit: Date.now()
    }));
  }
}

const PersistedStoreDemo: React.FC = () => {
  const registry = useStoreRegistry();
  
  // Get or create the app state store
  const [appStateStore] = useState(() => {
    let store = registry.getStore('app-state') as PersistedStore;
    if (!store) {
      store = new PersistedStore('app-state');
      registry.register('app-state', store);
    }
    return store;
  });

  const appState = useStoreValue(appStateStore);
  const [customNote, setCustomNote] = useState('');

  if (!appStateStore) {
    return (
      <div style={cardStyle}>
        <h3 style={titleStyle}>💾 Persisted Store Demo</h3>
        <p style={descriptionStyle}>
          App state store not found. The persisted store should be automatically 
          registered when the app starts.
        </p>
      </div>
    );
  }

  const addNote = () => {
    if (customNote.trim()) {
      appStateStore.addNote(customNote.trim());
      setCustomNote('');
    }
  };

  const toggleAutoSave = () => {
    appStateStore.updatePreferences({ autoSave: !appState.preferences.autoSave });
  };

  const incrementVisitCount = () => {
    appStateStore.incrementVisit();
  };

  const resetAppState = () => {
    if (confirm('Are you sure you want to reset the app state? This will clear all data.')) {
      const newState: AppState = {
        sessionId: Math.random().toString(36).substring(7),
        lastVisit: Date.now(),
        visitCount: 1,
        userNotes: [],
        preferences: {
          autoSave: true,
          notifications: true
        }
      };
      appStateStore.setValue(newState);
    }
  };

  const simulateAppActivity = () => {
    // Simulate various app activities
    appStateStore.incrementVisit();
    
    setTimeout(() => {
      appStateStore.addNote(`Activity simulated at ${new Date().toLocaleTimeString()}`);
    }, 500);
    
    setTimeout(() => {
      appStateStore.updatePreferences({ notifications: !appState.preferences.notifications });
    }, 1000);
  };

  const clearPersistentStorage = () => {
    if (confirm('Clear all localStorage data for this demo?')) {
      try {
        localStorage.removeItem('demo-app-state');
        // Force reload to see the effect
        if (confirm('Storage cleared! Reload the page to see the default values?')) {
          window.location.reload();
        }
      } catch (error) {
        console.error('Failed to clear storage:', error);
      }
    }
  };

  const exportState = () => {
    const stateData = {
      timestamp: Date.now(),
      appState: appState,
      note: customNote || 'Exported app state'
    };
    
    const dataStr = JSON.stringify(stateData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `app-state-${Date.now()}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  };

  const getStorageSize = () => {
    try {
      const data = localStorage.getItem('demo-app-state');
      return data ? new Blob([data]).size : 0;
    } catch {
      return 0;
    }
  };

  const getStorageInfo = () => {
    try {
      const data = localStorage.getItem('demo-app-state');
      if (!data) return null;
      
      const parsed = JSON.parse(data);
      return {
        size: new Blob([data]).size,
        keys: Object.keys(parsed),
        lastModified: new Date(parsed.lastVisit || Date.now())
      };
    } catch {
      return null;
    }
  };

  const storageInfo = getStorageInfo();

  return (
    <div style={cardStyle}>
      <h3 style={titleStyle}>💾 Persisted Store Demo</h3>
      <p style={descriptionStyle}>
        This store automatically saves its state to localStorage and restores it on page reload.
        Try changing values and refreshing the page to see persistence in action.
      </p>

      <div style={currentStateStyle}>
        <h4 style={sectionTitleStyle}>Current App State</h4>
        <div style={stateDisplayStyle}>
          <div style={stateItemStyle}>
            <span style={stateKeyStyle}>Notifications:</span>
            <span style={{
              ...stateValueStyle,
              color: appState.preferences.notifications ? '#10b981' : '#ef4444'
            }}>
              {appState.preferences.notifications ? '🔔 Notifications On' : '🔕 Notifications Off'}
            </span>
          </div>
          <div style={stateItemStyle}>
            <span style={stateKeyStyle}>Visit Count:</span>
            <span style={stateValueStyle}>{appState.visitCount}</span>
          </div>
          <div style={stateItemStyle}>
            <span style={stateKeyStyle}>Last Visit:</span>
            <span style={stateValueStyle}>
              {new Date(appState.lastVisit).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      <div style={actionsStyle}>
        <h4 style={sectionTitleStyle}>State Actions</h4>
        <div style={buttonGroupStyle}>
          <button
            style={{
              ...actionButtonStyle,
              backgroundColor: appState.preferences.autoSave ? '#ef4444' : '#3b82f6'
            }}
            onClick={toggleAutoSave}
          >
            {appState.preferences.autoSave ? 'Disable AutoSave' : 'Enable AutoSave'}
          </button>
          <button style={actionButtonStyle} onClick={incrementVisitCount}>
            Increment Visit Count
          </button>
          <button
            style={{ ...actionButtonStyle, backgroundColor: '#8b5cf6' }}
            onClick={simulateAppActivity}
          >
            Simulate Activity
          </button>
          <button
            style={{ ...actionButtonStyle, backgroundColor: '#ef4444' }}
            onClick={resetAppState}
          >
            Reset State
          </button>
        </div>
      </div>

      <div style={persistenceInfoStyle}>
        <h4 style={sectionTitleStyle}>Persistence Info</h4>
        <div style={infoGridStyle}>
          <div style={infoItemStyle}>
            <span style={infoLabelStyle}>Storage Key:</span>
            <code style={infoValueStyle}>demo-app-state</code>
          </div>
          <div style={infoItemStyle}>
            <span style={infoLabelStyle}>Storage Type:</span>
            <code style={infoValueStyle}>localStorage</code>
          </div>
          <div style={infoItemStyle}>
            <span style={infoLabelStyle}>Data Size:</span>
            <code style={infoValueStyle}>{getStorageSize()} bytes</code>
          </div>
          <div style={infoItemStyle}>
            <span style={infoLabelStyle}>Auto-save:</span>
            <code style={infoValueStyle}>Enabled</code>
          </div>
        </div>

        {storageInfo && (
          <div style={storageDetailsStyle}>
            <h5 style={detailsTitleStyle}>Storage Details</h5>
            <div style={detailsContentStyle}>
              <div>Keys in storage: {storageInfo.keys.join(', ')}</div>
              <div>Last modified: {storageInfo.lastModified.toLocaleString()}</div>
              <div>Size: {storageInfo.size} bytes</div>
            </div>
          </div>
        )}
      </div>

      <div style={dataManagementStyle}>
        <h4 style={sectionTitleStyle}>Data Management</h4>
        <div style={managementActionsStyle}>
          <div style={exportSectionStyle}>
            <input
              style={noteInputStyle}
              type="text"
              placeholder="Add note for export (optional)"
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
            />
            <button style={exportButtonStyle} onClick={exportState}>
              Export State
            </button>
          </div>
          <button
            style={clearButtonStyle}
            onClick={clearPersistentStorage}
          >
            Clear Storage
          </button>
        </div>
      </div>

      <div style={demonstrationStyle}>
        <h4 style={sectionTitleStyle}>Try This!</h4>
        <ol style={instructionListStyle}>
          <li style={instructionItemStyle}>
            Toggle auto-save and increment visit count
          </li>
          <li style={instructionItemStyle}>
            Refresh the page (Ctrl+R or Cmd+R)
          </li>
          <li style={instructionItemStyle}>
            Notice the state persists across page reloads
          </li>
          <li style={instructionItemStyle}>
            Try opening this demo in a new tab - same state!
          </li>
        </ol>
      </div>

      <div style={infoStyle}>
        <small>
          💡 Persisted stores automatically save to localStorage/sessionStorage on every change.
          This is perfect for user preferences, app settings, or any state that should 
          survive page reloads and browser sessions.
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

const titleStyle: React.CSSProperties = {
  margin: '0 0 8px 0',
  color: '#1e293b',
  fontSize: '1.25rem',
  fontWeight: '600'
};

const descriptionStyle: React.CSSProperties = {
  margin: '0 0 20px 0',
  color: '#64748b',
  fontSize: '0.9rem',
  lineHeight: '1.4'
};

const currentStateStyle: React.CSSProperties = {
  marginBottom: '20px'
};

const sectionTitleStyle: React.CSSProperties = {
  margin: '0 0 12px 0',
  color: '#374151',
  fontSize: '1rem',
  fontWeight: '500'
};

const stateDisplayStyle: React.CSSProperties = {
  padding: '16px',
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  border: '1px solid #e2e8f0'
};

const stateItemStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '8px',
  fontSize: '0.9rem'
};

const stateKeyStyle: React.CSSProperties = {
  fontWeight: '500',
  color: '#374151'
};

const stateValueStyle: React.CSSProperties = {
  fontFamily: 'monospace',
  color: '#1e293b',
  fontWeight: '500'
};

const actionsStyle: React.CSSProperties = {
  marginBottom: '20px'
};

const buttonGroupStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
  gap: '8px'
};

const actionButtonStyle: React.CSSProperties = {
  padding: '8px 12px',
  backgroundColor: '#3b82f6',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '0.85rem',
  fontWeight: '500',
  textAlign: 'center'
};

const persistenceInfoStyle: React.CSSProperties = {
  marginBottom: '20px'
};

const infoGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: '8px',
  marginBottom: '12px'
};

const infoItemStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '8px 12px',
  backgroundColor: '#f1f5f9',
  borderRadius: '6px',
  fontSize: '0.85rem'
};

const infoLabelStyle: React.CSSProperties = {
  color: '#64748b',
  fontWeight: '500'
};

const infoValueStyle: React.CSSProperties = {
  backgroundColor: '#e2e8f0',
  padding: '2px 6px',
  borderRadius: '3px',
  fontSize: '0.8rem'
};

const storageDetailsStyle: React.CSSProperties = {
  padding: '12px',
  backgroundColor: '#fef7ff',
  borderRadius: '6px',
  border: '1px solid #e879f9'
};

const detailsTitleStyle: React.CSSProperties = {
  margin: '0 0 8px 0',
  fontSize: '0.9rem',
  fontWeight: '500',
  color: '#92400e'
};

const detailsContentStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  color: '#92400e',
  lineHeight: '1.4'
};

const dataManagementStyle: React.CSSProperties = {
  marginBottom: '20px'
};

const managementActionsStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px'
};

const exportSectionStyle: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  alignItems: 'center'
};

const noteInputStyle: React.CSSProperties = {
  flex: '1',
  padding: '6px 10px',
  border: '1px solid #d1d5db',
  borderRadius: '4px',
  fontSize: '0.85rem'
};

const exportButtonStyle: React.CSSProperties = {
  padding: '6px 12px',
  backgroundColor: '#10b981',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '0.85rem',
  fontWeight: '500',
  whiteSpace: 'nowrap'
};

const clearButtonStyle: React.CSSProperties = {
  padding: '8px 16px',
  backgroundColor: '#ef4444',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '0.85rem',
  fontWeight: '500',
  alignSelf: 'flex-start'
};

const demonstrationStyle: React.CSSProperties = {
  marginBottom: '16px'
};

const instructionListStyle: React.CSSProperties = {
  margin: '0',
  paddingLeft: '20px',
  color: '#374151'
};

const instructionItemStyle: React.CSSProperties = {
  fontSize: '0.9rem',
  marginBottom: '4px',
  lineHeight: '1.4'
};

const infoStyle: React.CSSProperties = {
  padding: '12px',
  backgroundColor: 'rgba(59, 130, 246, 0.1)',
  borderRadius: '6px',
  borderLeft: '3px solid #3b82f6',
  color: '#64748b'
};

export default PersistedStoreDemo;