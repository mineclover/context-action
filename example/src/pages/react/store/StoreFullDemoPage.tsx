import { StoreProvider } from '@context-action/react';
import CounterDemo from './demo/CounterDemo';
import ThemeDemo from './demo/ThemeDemo';
import UserDemo from './demo/UserDemo';
import CartDemo from './demo/CartDemo';
import ComputedStoreDemo from './demo/ComputedStoreDemo';
import PersistedStoreDemo from './demo/PersistedStoreDemo';
import StoreLifecycleDemo from './demo/StoreLifecycleDemo';
import MetadataDemo from './demo/MetadataDemo';
import StoreRegistryViewer from './demo/StoreRegistryViewer';

export function StoreFullDemoPage() {
  return (
    <StoreProvider>
      <div className="page-content">
        <h3>Full Store Demo</h3>
        <p className="text-gray-600 mb-6">
          A comprehensive demonstration of all store features in action.
        </p>

        <div className="demo-layout">
          <div className="demo-main">
            <section className="demo-section">
              <h4>Core Features</h4>
              <div className="demo-grid">
                <CounterDemo />
                <ThemeDemo />
                <UserDemo />
                <CartDemo />
              </div>
            </section>

            <section className="demo-section">
              <h4>Advanced Features</h4>
              <div className="demo-grid">
                <ComputedStoreDemo />
                <PersistedStoreDemo />
                <StoreLifecycleDemo />
                <MetadataDemo />
              </div>
            </section>
          </div>

          <aside className="demo-sidebar">
            <StoreRegistryViewer />
          </aside>
        </div>

        <section className="demo-section">
          <h4>Demo Features</h4>
          <div className="feature-list">
            <div className="feature-item">
              <span className="feature-icon">🔢</span>
              <div>
                <strong>Counter Store</strong>
                <p>Numeric store with history and undo functionality</p>
              </div>
            </div>
            
            <div className="feature-item">
              <span className="feature-icon">🎨</span>
              <div>
                <strong>Theme Store</strong>
                <p>Persisted theme settings with live preview</p>
              </div>
            </div>
            
            <div className="feature-item">
              <span className="feature-icon">👤</span>
              <div>
                <strong>User Store</strong>
                <p>Authentication state and profile management</p>
              </div>
            </div>
            
            <div className="feature-item">
              <span className="feature-icon">🛒</span>
              <div>
                <strong>Shopping Cart</strong>
                <p>Complex state with items, quantities, and totals</p>
              </div>
            </div>
            
            <div className="feature-item">
              <span className="feature-icon">📊</span>
              <div>
                <strong>Computed Stores</strong>
                <p>Derived values from multiple store dependencies</p>
              </div>
            </div>
            
            <div className="feature-item">
              <span className="feature-icon">💾</span>
              <div>
                <strong>Persistence</strong>
                <p>LocalStorage integration with cross-tab sync</p>
              </div>
            </div>
            
            <div className="feature-item">
              <span className="feature-icon">♻️</span>
              <div>
                <strong>Lifecycle Management</strong>
                <p>Dynamic store creation and cleanup</p>
              </div>
            </div>
            
            <div className="feature-item">
              <span className="feature-icon">📝</span>
              <div>
                <strong>WeakMap Metadata</strong>
                <p>Rich metadata with automatic garbage collection</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </StoreProvider>
  );
}