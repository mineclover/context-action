import React, { useState, useEffect } from 'react';
import { PageWithLogMonitor, useActionLoggerWithToast } from '../../components/LogMonitor/';
import { registerStoreActions } from '../../demos/store-scenarios/actions';
import { StoreScenarios } from '../../demos/store-scenarios/stores';
import { 
  UserProfileDemo,
  ShoppingCartDemo,
  TodoListDemo,
  ChatDemo,
  FormWizardDemo,
  SettingsDemo,
  ProductCatalogDemo,
  NotificationDemo
} from '../../demos/store-scenarios/components';

// 액션 설정 컴포넌트
function StoreActionSetup() {
  useEffect(() => {
    const unsubscribeActions = registerStoreActions();
    return unsubscribeActions;
  }, []);

  return null;
}

function StoreFullDemoPage() {
  const [activeDemo, setActiveDemo] = useState<string>('user-profile');
  const [showAllDemos, setShowAllDemos] = useState<boolean>(false);

  const demos = [
    { id: 'user-profile', title: '👤 User Profile', description: 'Complex object updates with nested properties', component: <UserProfileDemo /> },
    { id: 'shopping-cart', title: '🛒 Shopping Cart', description: 'Array manipulation with quantity tracking', component: <ShoppingCartDemo /> },
    { id: 'todo-list', title: '✅ Todo List', description: 'CRUD operations with filtering and sorting', component: <TodoListDemo /> },
    { id: 'chat', title: '💬 Real-time Chat', description: 'Message streaming with auto-scroll', component: <ChatDemo /> },
    { id: 'form-wizard', title: '📋 Form Wizard', description: 'Multi-step form data validation', component: <FormWizardDemo /> },
    { id: 'settings', title: '⚙️ Settings', description: 'Hierarchical configuration management', component: <SettingsDemo /> },
    { id: 'product-catalog', title: '📦 Product Catalog', description: 'Dynamic inventory management', component: <ProductCatalogDemo /> },
    { id: 'notifications', title: '🔔 Notifications', description: 'Event-driven alerts system', component: <NotificationDemo /> }
  ];

  const currentDemo = demos.find(demo => demo.id === activeDemo);

  return (
    <PageWithLogMonitor pageId="store-full-demo" title="Store System - 8 Real-world Scenarios">
      <div className="page-container">
        <header className="page-header">
          <h1>🏪 Modularized Store System</h1>
          <p className="page-description">
            8개의 실제 시나리오를 모듈화하여 구현한 Store 시스템 데모입니다.
            각 시나리오는 별도의 컴포넌트, 액션, 스토어로 분리되어 관리됩니다.
          </p>
          <div className="architecture-info">
            <div className="architecture-badge">
              <span className="badge-label">📁 모듈 구조:</span>
              <code>/demos/store-scenarios/</code>
            </div>
            <div className="architecture-badge">
              <span className="badge-label">🔧 분리된 관심사:</span>
              <span>Types, Stores, Actions, Components</span>
            </div>
          </div>
        </header>

        <StoreActionSetup />

        {/* Demo Navigation */}
        <div className="demo-navigation">
          <div className="demo-tabs">
            {demos.map((demo) => (
              <button
                key={demo.id}
                onClick={() => setActiveDemo(demo.id)}
                className={`demo-tab ${activeDemo === demo.id ? 'active' : ''}`}
              >
                <span className="tab-title">{demo.title}</span>
                <span className="tab-description">{demo.description}</span>
              </button>
            ))}
          </div>
          
          <div className="view-controls">
            <button
              onClick={() => setShowAllDemos(!showAllDemos)}
              className={`btn ${showAllDemos ? 'btn-secondary' : 'btn-primary'}`}
            >
              {showAllDemos ? '🎯 Focus Mode' : '🌐 Show All'}
            </button>
          </div>
        </div>

        {/* Demo Content */}
        <StoreScenarios.Provider registryId="store-full-demo">
          {showAllDemos ? (
            <div className="demo-grid full-demo-grid">
              <UserProfileDemo />
              <ShoppingCartDemo />
              <TodoListDemo />
              <ChatDemo />
              <FormWizardDemo />
              <SettingsDemo />
              <ProductCatalogDemo />
              <NotificationDemo />
            </div>
          ) : (
            <div className="focused-demo">
              <div className="demo-header">
                <h2>{currentDemo?.title}</h2>
                <p>{currentDemo?.description}</p>
              </div>
              <div className="demo-content">
                {currentDemo?.component}
              </div>
            
            {/* Demo Navigator */}
            <div className="demo-navigator">
              <button
                onClick={() => {
                  const currentIndex = demos.findIndex(d => d.id === activeDemo);
                  const prevIndex = currentIndex > 0 ? currentIndex - 1 : demos.length - 1;
                  setActiveDemo(demos[prevIndex].id);
                }}
                className="btn btn-secondary"
              >
                ← Previous
              </button>
              
              <span className="demo-counter">
                {demos.findIndex(d => d.id === activeDemo) + 1} of {demos.length}
              </span>
              
              <button
                onClick={() => {
                  const currentIndex = demos.findIndex(d => d.id === activeDemo);
                  const nextIndex = currentIndex < demos.length - 1 ? currentIndex + 1 : 0;
                  setActiveDemo(demos[nextIndex].id);
                }}
                className="btn btn-primary"
              >
                Next →
              </button>
            </div>
          </div>
          )}
        </StoreScenarios.Provider>

        {/* Modular Architecture Overview */}
        <div className="architecture-overview">
          <h3>🏗️ Modular Architecture</h3>
          <div className="architecture-grid">
            <div className="architecture-item">
              <h4>📄 Types</h4>
              <p>공통 인터페이스와 액션 타입 정의</p>
              <code>/types/index.ts</code>
            </div>
            <div className="architecture-item">
              <h4>🗄️ Stores</h4>
              <p>각 시나리오별 데이터 스토어와 초기값</p>
              <code>/stores/index.ts</code>
            </div>
            <div className="architecture-item">
              <h4>⚡ Actions</h4>
              <p>비즈니스 로직과 액션 핸들러</p>
              <code>/actions/index.ts</code>
            </div>
            <div className="architecture-item">
              <h4>🎨 Components</h4>
              <p>재사용 가능한 UI 컴포넌트들</p>
              <code>/components/*.tsx</code>
            </div>
          </div>
        </div>

        {/* Store Patterns Summary */}
        <div className="patterns-summary">
          <h3>📚 Store Management Patterns Overview</h3>
          <div className="patterns-grid">
            {demos.map((demo, index) => (
              <div 
                key={demo.id} 
                className={`pattern-item ${activeDemo === demo.id ? 'active' : ''}`}
                onClick={() => setActiveDemo(demo.id)}
              >
                <h4>{index + 1}. {demo.title}</h4>
                <p>{demo.description}</p>
                {activeDemo === demo.id && <div className="pattern-indicator">Currently Viewing</div>}
              </div>
            ))}
          </div>
        </div>

        {/* Code Example */}
        <div className="code-example">
          <h3>🔧 Modular Implementation Example</h3>
          <pre className="code-block">
{`// 1. 타입 정의 (/types/index.ts)
export interface UserProfileActions {
  updateUser: { user: User };
  updateUserTheme: { theme: 'light' | 'dark' };
}

// 2. 스토어 생성 (/stores/index.ts)
export const userStore = createStore<User>('demo-user', defaultUser);

// 3. 액션 핸들러 (/actions/index.ts)
storeActionRegister.register('updateUser', ({ user }, controller) => {
  userStore.setValue(user);
  controller.next();
});

// 4. 컴포넌트 사용 (/components/UserProfileDemo.tsx)
export function UserProfileDemo() {
  const user = useStoreValue(userStore);
  const logger = useActionLoggerWithToast();
  
  const handleSave = useCallback(() => {
    logger.logAction('saveUserProfile', { oldUser: user, newUser: editForm });
    storeActionRegister.dispatch('updateUser', { user: editForm });
  }, [editForm, user, logger]);
  
  return <div>...</div>;
}`}
          </pre>
        </div>

        {/* Benefits Section */}
        <div className="system-benefits">
          <h3>🎯 Modular Architecture Benefits</h3>
          <div className="benefits-grid">
            <div className="benefit-item">
              <h4>🔄 재사용성</h4>
              <p>각 모듈을 독립적으로 재사용하고 테스트할 수 있습니다.</p>
            </div>
            <div className="benefit-item">
              <h4>🧪 테스트 용이성</h4>
              <p>분리된 로직으로 단위 테스트가 쉬워집니다.</p>
            </div>
            <div className="benefit-item">
              <h4>🎛️ 관심사 분리</h4>
              <p>타입, 데이터, 로직, UI가 명확히 분리되어 있습니다.</p>
            </div>
            <div className="benefit-item">
              <h4>🔍 유지보수성</h4>
              <p>각 모듈의 책임이 명확해 수정과 확장이 용이합니다.</p>
            </div>
          </div>
        </div>
      </div>
    </PageWithLogMonitor>
  );
}

export default StoreFullDemoPage;