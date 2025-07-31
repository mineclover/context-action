/**
 * Store lifecycle demonstration component
 */

import type React from 'react';
import { useState } from 'react';
import { useStoreRegistry, useRegistry, Store, NumericStore } from '@context-action/react';

interface TempStore {
  id: string;
  name: string;
  type: 'basic' | 'numeric';
  createdAt: number;
}

const StoreLifecycleDemo: React.FC = () => {
  const registry = useStoreRegistry();
  const stores = useRegistry(registry);
  const [tempStores, setTempStores] = useState<TempStore[]>([]);
  const [newStoreName, setNewStoreName] = useState('');
  const [storeType, setStoreType] = useState<'basic' | 'numeric'>('basic');

  const createTempStore = () => {
    if (!newStoreName.trim()) {
      alert('Please enter a store name');
      return;
    }

    if (registry.hasStore(newStoreName)) {
      alert('Store with this name already exists');
      return;
    }

    const storeId = Math.random().toString(36).substring(7);
    const tempStore: TempStore = {
      id: storeId,
      name: newStoreName,
      type: storeType,
      createdAt: Date.now()
    };

    // Create and register the store
    let store;
    if (storeType === 'numeric') {
      store = new NumericStore(newStoreName, 0);
    } else {
      store = new Store(newStoreName, `Initial value for ${newStoreName}`);
    }

    registry.register(newStoreName, store);
    setTempStores(prev => [...prev, tempStore]);
    setNewStoreName('');

    console.log(`Created and registered ${storeType} store: ${newStoreName}`);
  };

  const removeTempStore = (storeName: string) => {
    registry.unregister(storeName);
    setTempStores(prev => prev.filter(store => store.name !== storeName));
    console.log(`Unregistered and removed store: ${storeName}`);
  };

  const clearAllTempStores = () => {
    tempStores.forEach(store => {
      registry.unregister(store.name);
    });
    setTempStores([]);
    console.log('Cleared all temporary stores');
  };

  const permanentStores = stores.filter(([name]) => 
    !tempStores.some(temp => temp.name === name)
  );

  return (
    <div style={cardStyle}>
      <h3 style={titleStyle}>⚡ Store Lifecycle Demo</h3>
      <p style={descriptionStyle}>
        Demonstrates dynamic store creation, registration, and cleanup.
        Create temporary stores and watch them appear in the registry.
      </p>

      <div style={createSectionStyle}>
        <h4 style={sectionTitleStyle}>Create New Store</h4>
        <div style={formStyle}>
          <div style={inputGroupStyle}>
            <input
              style={inputStyle}
              type="text"
              placeholder="Store name (e.g., temp-counter)"
              value={newStoreName}
              onChange={(e) => setNewStoreName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && createTempStore()}
            />
            <select
              style={selectStyle}
              value={storeType}
              onChange={(e) => setStoreType(e.target.value as 'basic' | 'numeric')}
            >
              <option value="basic">Basic Store</option>
              <option value="numeric">Numeric Store</option>
            </select>
          </div>
          <button style={createButtonStyle} onClick={createTempStore}>
            Create & Register
          </button>
        </div>
      </div>

      <div style={storesSectionStyle}>
        <div style={storeTypeStyle}>
          <h4 style={sectionTitleStyle}>
            Permanent Stores ({permanentStores.length})
          </h4>
          <div style={storeListStyle}>
            {permanentStores.map(([name, store]) => (
              <div key={name} style={storeItemStyle}>
                <div style={storeInfoStyle}>
                  <span style={storeNameStyle}>{name}</span>
                  <span style={storeMetaStyle}>
                    {store.constructor.name} | {(store as any).getListenerCount?.() || 0} listeners
                  </span>
                </div>
                <div style={permanentBadgeStyle}>Permanent</div>
              </div>
            ))}
          </div>
          {permanentStores.length === 0 && (
            <p style={emptyTextStyle}>No permanent stores found</p>
          )}
        </div>

        <div style={storeTypeStyle}>
          <div style={tempHeaderStyle}>
            <h4 style={sectionTitleStyle}>
              Temporary Stores ({tempStores.length})
            </h4>
            {tempStores.length > 0 && (
              <button style={clearAllButtonStyle} onClick={clearAllTempStores}>
                Clear All
              </button>
            )}
          </div>
          <div style={storeListStyle}>
            {tempStores.map((store) => (
              <div key={store.id} style={tempStoreItemStyle}>
                <div style={storeInfoStyle}>
                  <span style={storeNameStyle}>{store.name}</span>
                  <span style={storeMetaStyle}>
                    {store.type === 'numeric' ? 'NumericStore' : 'Store'} | 
                    Created {new Date(store.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                <button
                  style={removeButtonStyle}
                  onClick={() => removeTempStore(store.name)}
                  title="Remove store"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          {tempStores.length === 0 && (
            <p style={emptyTextStyle}>No temporary stores created</p>
          )}
        </div>
      </div>

      <div style={statsStyle}>
        <div style={statItemStyle}>
          <span style={statLabelStyle}>Total Stores:</span>
          <span style={statValueStyle}>{stores.length}</span>
        </div>
        <div style={statItemStyle}>
          <span style={statLabelStyle}>Permanent:</span>
          <span style={statValueStyle}>{permanentStores.length}</span>
        </div>
        <div style={statItemStyle}>
          <span style={statLabelStyle}>Temporary:</span>
          <span style={statValueStyle}>{tempStores.length}</span>
        </div>
        <div style={statItemStyle}>
          <span style={statLabelStyle}>Registry:</span>
          <span style={statValueStyle}>{registry.name}</span>
        </div>
      </div>

      <div style={actionsStyle}>
        <button
          style={actionButtonStyle}
          onClick={() => {
            const randomNames = ['alpha', 'beta', 'gamma', 'delta', 'epsilon'];
            const randomName = `${randomNames[Math.floor(Math.random() * randomNames.length)]}-${Date.now()}`;
            setNewStoreName(randomName);
          }}
        >
          Generate Random Name
        </button>
        <button
          style={actionButtonStyle}
          onClick={() => {
            console.log('Store Registry Lifecycle Info:', {
              totalStores: stores.length,
              permanentStores: permanentStores.length,
              temporaryStores: tempStores.length,
              registryName: registry.name,
              storeNames: stores.map(([name]) => name),
              tempStoreDetails: tempStores
            });
          }}
        >
          Log Lifecycle Info
        </button>
      </div>

      <div style={infoStyle}>
        <small>
          💡 This demonstrates the complete store lifecycle: creation, registration, 
          usage, and cleanup. Temporary stores can be created and removed dynamically 
          while permanent stores remain throughout the app lifecycle.
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

const createSectionStyle: React.CSSProperties = {
  marginBottom: '24px',
  padding: '16px',
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  border: '1px solid #e2e8f0'
};

const sectionTitleStyle: React.CSSProperties = {
  margin: '0 0 12px 0',
  color: '#374151',
  fontSize: '1rem',
  fontWeight: '500'
};

const formStyle: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
  alignItems: 'flex-end',
  flexWrap: 'wrap'
};

const inputGroupStyle: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  flex: '1',
  minWidth: '300px'
};

const inputStyle: React.CSSProperties = {
  flex: '1',
  padding: '8px 12px',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  fontSize: '0.9rem'
};

const selectStyle: React.CSSProperties = {
  padding: '8px 12px',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  fontSize: '0.9rem',
  backgroundColor: 'white'
};

const createButtonStyle: React.CSSProperties = {
  padding: '8px 16px',
  backgroundColor: '#10b981',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '0.9rem',
  fontWeight: '500',
  whiteSpace: 'nowrap'
};

const storesSectionStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '20px',
  marginBottom: '20px'
};

const storeTypeStyle: React.CSSProperties = {
  minHeight: '200px'
};

const tempHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '12px'
};

const clearAllButtonStyle: React.CSSProperties = {
  padding: '4px 8px',
  backgroundColor: '#ef4444',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '0.8rem'
};

const storeListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px'
};

const storeItemStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '8px 12px',
  backgroundColor: '#f1f5f9',
  borderRadius: '6px',
  border: '1px solid #e2e8f0'
};

const tempStoreItemStyle: React.CSSProperties = {
  ...storeItemStyle,
  backgroundColor: '#fef3c7',
  border: '1px solid #f9d71c'
};

const storeInfoStyle: React.CSSProperties = {
  flex: '1',
  minWidth: 0
};

const storeNameStyle: React.CSSProperties = {
  fontWeight: '500',
  color: '#1e293b',
  fontSize: '0.9rem',
  display: 'block'
};

const storeMetaStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: '0.75rem',
  display: 'block',
  marginTop: '2px'
};

const permanentBadgeStyle: React.CSSProperties = {
  padding: '2px 6px',
  backgroundColor: '#dbeafe',
  color: '#1e40af',
  borderRadius: '3px',
  fontSize: '0.7rem',
  fontWeight: '500'
};

const removeButtonStyle: React.CSSProperties = {
  padding: '4px 8px',
  backgroundColor: '#ef4444',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '0.75rem'
};

const emptyTextStyle: React.CSSProperties = {
  color: '#9ca3af',
  fontSize: '0.85rem',
  fontStyle: 'italic',
  textAlign: 'center',
  padding: '20px'
};

const statsStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
  gap: '12px',
  marginBottom: '20px',
  padding: '16px',
  backgroundColor: '#f8fafc',
  borderRadius: '8px'
};

const statItemStyle: React.CSSProperties = {
  textAlign: 'center'
};

const statLabelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.75rem',
  color: '#64748b',
  marginBottom: '4px'
};

const statValueStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '1.2rem',
  fontWeight: 'bold',
  color: '#1e293b'
};

const actionsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  marginBottom: '16px',
  flexWrap: 'wrap'
};

const actionButtonStyle: React.CSSProperties = {
  padding: '6px 12px',
  backgroundColor: '#8b5cf6',
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

export default StoreLifecycleDemo;