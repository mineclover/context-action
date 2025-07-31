import { useState, useEffect } from 'react';
import { StoreProvider, useStoreRegistry, Store, useStore, useStoreValue } from '@context-action/react';

// Example component using the store context
function UserProfile() {
  const registry = useStoreRegistry();
  const [userStore, setUserStore] = useState<Store<{ name: string; email: string }> | null>(null);

  useEffect(() => {
    const store = registry.getStore('user') as Store<{ name: string; email: string }>;
    if (store) {
      setUserStore(store);
    }
  }, [registry]);

  if (!userStore) return <div>Loading user store...</div>;

  const user = useStoreValue(userStore);

  return (
    <div className="profile-card">
      <h4>User Profile</h4>
      <p>Name: {user?.name}</p>
      <p>Email: {user?.email}</p>
      <button
        onClick={() => userStore.update(u => ({ ...u, name: `${u.name} (updated)` }))}
        className="btn btn-sm btn-primary"
      >
        Update Name
      </button>
    </div>
  );
}

// Example component showing all stores
function StoreList() {
  const registry = useStoreRegistry();
  const [stores, setStores] = useState<Array<[string, any]>>([]);

  useEffect(() => {
    const update = () => setStores(registry.getSnapshot());
    update();
    return registry.subscribe(update);
  }, [registry]);

  return (
    <div className="store-list">
      <h4>Registered Stores</h4>
      <ul>
        {stores.map(([name]) => (
          <li key={name}>{name}</li>
        ))}
      </ul>
    </div>
  );
}

// Main demo component
function ContextDemo() {
  const registry = useStoreRegistry();

  useEffect(() => {
    // Register some demo stores
    registry.register('user', new Store('user', { name: 'Alice', email: 'alice@example.com' }));
    registry.register('theme', new Store('theme', { mode: 'light', primary: '#3b82f6' }));
    registry.register('counter', new Store('counter', 0));

    return () => {
      registry.unregister('user');
      registry.unregister('theme');
      registry.unregister('counter');
    };
  }, [registry]);

  return (
    <div className="context-demo">
      <div className="demo-grid">
        <UserProfile />
        <StoreList />
      </div>
    </div>
  );
}

export function StoreContextPage() {
  return (
    <div className="page-content">
      <h3>Context API Pattern</h3>
      <p className="text-gray-600 mb-6">
        Share stores across components using React Context with StoreProvider and hooks.
      </p>

      <div className="example-section">
        <h4>Setting up Context</h4>
        <div className="example-card">
          <pre className="code-block">
{`import { StoreProvider, useStoreRegistry } from '@context-action/react';

// Wrap your app with StoreProvider
function App() {
  return (
    <StoreProvider>
      <YourComponents />
    </StoreProvider>
  );
}

// Access registry in any component
function Component() {
  const registry = useStoreRegistry();
  
  useEffect(() => {
    // Register stores
    registry.register('user', new Store('user', userData));
    
    return () => {
      registry.unregister('user');
    };
  }, [registry]);
}`}
          </pre>
        </div>
      </div>

      <div className="example-section">
        <h4>Live Demo</h4>
        <div className="demo-container">
          <StoreProvider>
            <ContextDemo />
          </StoreProvider>
        </div>
      </div>

      <div className="example-section">
        <h4>Custom Store Context</h4>
        <div className="example-card">
          <pre className="code-block">
{`import { createStoreContext } from '@context-action/react';

// Create isolated context for a feature
const { 
  Provider: FeatureProvider, 
  useStoreRegistry: useFeatureRegistry 
} = createStoreContext('feature');

function FeatureModule() {
  return (
    <FeatureProvider>
      <FeatureComponents />
    </FeatureProvider>
  );
}`}
          </pre>
        </div>
      </div>

      <div className="example-section">
        <h4>Context API Benefits</h4>
        <div className="concept-grid">
          <div className="concept-card">
            <h5>🌳 Component Tree Sharing</h5>
            <p>
              Share a single StoreRegistry instance across your entire component tree
              without prop drilling.
            </p>
          </div>
          
          <div className="concept-card">
            <h5>🔒 Isolation</h5>
            <p>
              Create multiple contexts for different parts of your app to maintain
              separation of concerns.
            </p>
          </div>
          
          <div className="concept-card">
            <h5>🪝 Hook-based Access</h5>
            <p>
              Clean, modern API using hooks like useStoreRegistry() for accessing
              the registry anywhere.
            </p>
          </div>
          
          <div className="concept-card">
            <h5>♻️ Automatic Cleanup</h5>
            <p>
              Stores registered in components are automatically cleaned up when
              components unmount.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}