import { Outlet, Link, useLocation } from 'react-router-dom';

export function StoreIndexPage() {
  const location = useLocation();
  const isIndex = location.pathname === '/react/store';

  return (
    <div className="store-index-page">
      <div className="page-header">
        <h2>Store Management System</h2>
        <p className="text-gray-600">
          Explore the powerful store management system with Context API, WeakMap metadata, and sync utilities.
        </p>
      </div>

      <nav className="sub-navigation">
        <Link 
          to="/react/store/basics" 
          className={`nav-link ${location.pathname === '/react/store/basics' ? 'active' : ''}`}
        >
          Basics
        </Link>
        <Link 
          to="/react/store/registry" 
          className={`nav-link ${location.pathname === '/react/store/registry' ? 'active' : ''}`}
        >
          Registry
        </Link>
        <Link 
          to="/react/store/context" 
          className={`nav-link ${location.pathname === '/react/store/context' ? 'active' : ''}`}
        >
          Context API
        </Link>
        <Link 
          to="/react/store/sync" 
          className={`nav-link ${location.pathname === '/react/store/sync' ? 'active' : ''}`}
        >
          Sync Utilities
        </Link>
        <Link 
          to="/react/store/demo" 
          className={`nav-link ${location.pathname === '/react/store/demo' ? 'active' : ''}`}
        >
          Full Demo
        </Link>
      </nav>

      {isIndex ? (
        <div className="index-content">
          <div className="feature-grid">
            <div className="feature-card">
              <h3>🏗️ Core Architecture</h3>
              <p>Learn about Store, StoreRegistry, and the foundation of our store system.</p>
              <Link to="/react/store/basics" className="feature-link">
                Explore Basics →
              </Link>
            </div>

            <div className="feature-card">
              <h3>📦 Store Registry</h3>
              <p>Manage multiple stores with metadata using WeakMap for automatic GC.</p>
              <Link to="/react/store/registry" className="feature-link">
                View Registry →
              </Link>
            </div>

            <div className="feature-card">
              <h3>🎯 Context API</h3>
              <p>Share stores across components with React Context and typed hooks.</p>
              <Link to="/react/store/context" className="feature-link">
                Learn Context →
              </Link>
            </div>

            <div className="feature-card">
              <h3>🔄 Sync Utilities</h3>
              <p>Advanced store synchronization with useStoreSync and typed hook factories.</p>
              <Link to="/react/store/sync" className="feature-link">
                Discover Sync →
              </Link>
            </div>

            <div className="feature-card">
              <h3>🚀 Full Demo</h3>
              <p>See everything in action with a complete interactive demonstration.</p>
              <Link to="/react/store/demo" className="feature-link">
                Launch Demo →
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <Outlet />
      )}
    </div>
  );
}