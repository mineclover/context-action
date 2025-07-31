import { useState, useEffect } from 'react';
import { Store, StoreRegistry } from '@context-action/react';

export function StoreRegistryPage() {
  const [registry] = useState(() => new StoreRegistry('demo-registry'));
  const [stores, setStores] = useState<Array<[string, any]>>([]);
  const [metadata, setMetadata] = useState<Record<string, any>>({});

  useEffect(() => {
    // Subscribe to registry changes
    const unsubscribe = registry.subscribe(() => {
      setStores(registry.getSnapshot());
      
      // Update metadata display
      const meta: Record<string, any> = {};
      registry.getSnapshot().forEach(([name]) => {
        meta[name] = registry.getStoreMetadata(name);
      });
      setMetadata(meta);
    });

    // Initialize with some stores
    registry.register('user', new Store('user', { name: 'John Doe', role: 'admin' }), {
      description: 'User authentication store',
      tags: ['auth', 'profile']
    });

    registry.register('settings', new Store('settings', { theme: 'light', lang: 'en' }), {
      description: 'Application settings',
      tags: ['config', 'ui']
    });

    registry.register('counter', new Store('counter', 0), {
      description: 'Simple counter store',
      tags: ['demo']
    });

    return unsubscribe;
  }, [registry]);

  const addNewStore = () => {
    const name = `store-${Date.now()}`;
    registry.register(name, new Store(name, { created: new Date().toISOString() }), {
      description: 'Dynamically created store',
      tags: ['dynamic', 'test']
    });
  };

  const removeStore = (name: string) => {
    registry.unregister(name);
  };

  const updateStoreTags = (name: string) => {
    const newTag = prompt('Enter a new tag:');
    if (newTag) {
      const current = registry.getStoreMetadata(name);
      if (current) {
        registry.updateStoreMetadata(name, {
          tags: [...(current.tags || []), newTag]
        });
        
        // Force update
        const meta: Record<string, any> = {};
        registry.getSnapshot().forEach(([n]) => {
          meta[n] = registry.getStoreMetadata(n);
        });
        setMetadata(meta);
      }
    }
  };

  return (
    <div className="page-content">
      <h3>Store Registry</h3>
      <p className="text-gray-600 mb-6">
        Manage multiple stores with metadata using WeakMap for automatic garbage collection.
      </p>

      <div className="example-section">
        <h4>Registry Features</h4>
        <div className="example-card">
          <pre className="code-block">
{`const registry = new StoreRegistry('app');

// Register stores with metadata
registry.register('user', userStore, {
  description: 'User authentication store',
  tags: ['auth', 'profile']
});

// Get store metadata
const metadata = registry.getStoreMetadata('user');

// Update metadata
registry.updateStoreMetadata('user', {
  tags: [...metadata.tags, 'new-tag']
});

// Unregister (calls destroy if available)
registry.unregister('user');`}
          </pre>
        </div>
      </div>

      <div className="example-section">
        <h4>Registry Dashboard</h4>
        <div className="registry-dashboard">
          <div className="registry-header">
            <div className="registry-stats">
              <span>Total Stores: {stores.length}</span>
              <span>Registry: {registry.name}</span>
            </div>
            <button onClick={addNewStore} className="btn btn-primary">
              Add Store
            </button>
          </div>

          <div className="store-grid">
            {stores.map(([name, store]) => {
              const meta = metadata[name];
              const snapshot = store.getSnapshot();
              
              return (
                <div key={name} className="store-card">
                  <div className="store-header">
                    <h5>{name}</h5>
                    <button
                      onClick={() => removeStore(name)}
                      className="btn-close"
                      title="Remove store"
                    >
                      ×
                    </button>
                  </div>
                  
                  <div className="store-content">
                    <div className="store-value">
                      <strong>Value:</strong>
                      <pre>{JSON.stringify(snapshot.value, null, 2)}</pre>
                    </div>
                    
                    {meta && (
                      <div className="store-metadata">
                        <div className="metadata-item">
                          <strong>Description:</strong>
                          <span>{meta.description}</span>
                        </div>
                        
                        <div className="metadata-item">
                          <strong>Tags:</strong>
                          <div className="tag-list">
                            {meta.tags?.map((tag: string) => (
                              <span key={tag} className="tag">{tag}</span>
                            ))}
                            <button
                              onClick={() => updateStoreTags(name)}
                              className="tag-add"
                              title="Add tag"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        
                        <div className="metadata-item">
                          <strong>Registered:</strong>
                          <span>{new Date(meta.registeredAt).toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="example-section">
        <h4>WeakMap Metadata System</h4>
        <div className="concept-grid">
          <div className="concept-card">
            <h5>🗑️ Automatic GC</h5>
            <p>
              Metadata is stored in WeakMap, so when a store is removed and has no other references,
              its metadata is automatically garbage collected.
            </p>
          </div>
          
          <div className="concept-card">
            <h5>📝 Rich Metadata</h5>
            <p>
              Attach descriptions, tags, timestamps, and custom data to stores without affecting
              the store's core functionality.
            </p>
          </div>
          
          <div className="concept-card">
            <h5>🔍 Store Discovery</h5>
            <p>
              Query stores by name, pattern, or metadata. Filter and search through registered
              stores efficiently.
            </p>
          </div>
          
          <div className="concept-card">
            <h5>♻️ Lifecycle Management</h5>
            <p>
              Stores can implement a destroy() method that gets called during unregistration
              for proper cleanup.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}