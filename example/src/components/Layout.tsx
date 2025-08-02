import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

function Layout({ children }: LayoutProps) {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home', category: 'main' },
    { path: '/core/basics', label: 'Core Basics', category: 'core' },
    { path: '/core/advanced', label: 'Core Advanced', category: 'core' },
    { path: '/store/basics', label: 'Store Basics', category: 'store' },
    { path: '/store/full-demo', label: 'Store Full Demo', category: 'store' },
    { path: '/react/provider', label: 'React Provider', category: 'react' },
    { path: '/react/context', label: 'React Context', category: 'react' },
    { path: '/react/hooks', label: 'React Hooks', category: 'react' },
    { path: '/logger/demo', label: 'Logger System', category: 'logger' },
    { path: '/actionguard/demo', label: 'Action Guard', category: 'actionguard' },
  ];

  return (
    <div className="app-layout">
      <nav className="sidebar">
        <div className="logo">
          <h2>Context-Action</h2>
          <p>Framework Examples</p>
        </div>
        
        <div className="nav-section">
          <h3>Navigation</h3>
          <ul className="nav-list">
            {navItems.map((item) => (
              <li key={item.path} className={`nav-item ${item.category}`}>
                <Link 
                  to={item.path} 
                  className={location.pathname === item.path ? 'active' : ''}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
      
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

export default Layout;