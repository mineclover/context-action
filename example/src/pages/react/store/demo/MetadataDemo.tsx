/**
 * Metadata Demo component showcasing WeakMap metadata in StoreRegistry
 */

import type React from 'react';
import { useStoreRegistry, useRegistry } from '@context-action/react';

const MetadataDemo: React.FC = () => {
  const registry = useStoreRegistry();
  const stores = useRegistry(registry);

  return (
    <div style={cardStyle}>
      <h3 style={titleStyle}>🏷️ Store Metadata Demo</h3>
      <p style={descriptionStyle}>
        This component demonstrates the new WeakMap-based metadata system in StoreRegistry.
        Metadata is automatically cleaned up when stores are removed.
      </p>

      <div style={metadataGridStyle}>
        {stores.map(([storeName, store]) => {
          const metadata = (registry as any).getStoreMetadata?.(storeName);
          
          return (
            <div key={storeName} style={metadataItemStyle}>
              <div style={storeHeaderStyle}>
                <strong>{storeName}</strong>
                <span style={storeTypeStyle}>
                  {store.constructor.name}
                </span>
              </div>
              
              {metadata && (
                <div style={metadataContentStyle}>
                  <div style={metadataRowStyle}>
                    <span>Registered At:</span>
                    <code>{new Date(metadata.registeredAt).toLocaleTimeString()}</code>
                  </div>
                  <div style={metadataRowStyle}>
                    <span>Store Name:</span>
                    <code>{metadata.name}</code>
                  </div>
                  {metadata.tags && (
                    <div style={metadataRowStyle}>
                      <span>Tags:</span>
                      <div style={tagsStyle}>
                        {metadata.tags.map((tag: string) => (
                          <span key={tag} style={tagStyle}>{tag}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {metadata.description && (
                    <div style={metadataRowStyle}>
                      <span>Description:</span>
                      <code>{metadata.description}</code>
                    </div>
                  )}
                </div>
              )}
              
              <div style={actionsStyle}>
                <button
                  style={actionButtonStyle}
                  onClick={() => {
                    const currentMeta = (registry as any).getStoreMetadata?.(storeName) || {};
                    (registry as any).updateStoreMetadata?.(storeName, {
                      ...currentMeta,
                      tags: ['demo', 'tagged'],
                      description: `Updated at ${new Date().toLocaleTimeString()}`
                    });
                  }}
                >
                  Add Metadata
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div style={infoStyle}>
        <strong>💡 New Features Showcased:</strong>
        <ul style={featureListStyle}>
          <li>WeakMap-based metadata storage (automatic GC)</li>
          <li>Context API pattern with StoreProvider</li>
          <li>Typed hooks (useStoreRegistry, useRegistry, etc.)</li>
          <li>Store sync utilities and computed stores</li>
          <li>Enhanced store lifecycle management</li>
        </ul>
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

const metadataGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  gap: '16px',
  marginBottom: '20px'
};

const metadataItemStyle: React.CSSProperties = {
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  padding: '16px',
  backgroundColor: '#f8fafc'
};

const storeHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '12px',
  paddingBottom: '8px',
  borderBottom: '1px solid #e2e8f0'
};

const storeTypeStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  color: '#64748b',
  backgroundColor: '#e2e8f0',
  padding: '2px 8px',
  borderRadius: '4px'
};

const metadataContentStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  marginBottom: '12px'
};

const metadataRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  fontSize: '0.85rem',
  gap: '8px'
};

const tagsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '4px',
  flexWrap: 'wrap'
};

const tagStyle: React.CSSProperties = {
  backgroundColor: '#dbeafe',
  color: '#1e40af',
  padding: '2px 6px',
  borderRadius: '3px',
  fontSize: '0.75rem'
};

const actionsStyle: React.CSSProperties = {
  borderTop: '1px solid #e2e8f0',
  paddingTop: '12px'
};

const actionButtonStyle: React.CSSProperties = {
  padding: '6px 12px',
  backgroundColor: '#3b82f6',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '0.8rem',
  fontWeight: '500'
};

const infoStyle: React.CSSProperties = {
  padding: '16px',
  backgroundColor: 'rgba(59, 130, 246, 0.1)',
  borderRadius: '8px',
  borderLeft: '4px solid #3b82f6',
  color: '#1e293b'
};

const featureListStyle: React.CSSProperties = {
  margin: '8px 0 0 0',
  paddingLeft: '16px',
  fontSize: '0.9rem',
  lineHeight: '1.5'
};

export default MetadataDemo;