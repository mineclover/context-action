import { useEffect, useState } from 'react';
import { PageWithLogMonitor } from '../../components/LogMonitor/';
import { Badge, Button, Card, CardContent } from '../../components/ui';
import { registerStoreActions } from '../../demos/store-scenarios/actions';
import {
  ChatDemo,
  ShoppingCartDemo,
  TodoListDemo,
  UserProfileDemo,
} from '../../demos/store-scenarios/components';
import { StoreScenarios } from '../../demos/store-scenarios/stores';

/**
 * 모듈화된 Store 시스템 데모 페이지
 * 8개의 실제 시나리오를 통해 Declarative Store 패턴의 활용을 보여주는 종합 데모
 *
 * @implements store-integration-pattern
 * @implements action-pipeline-system
 * @memberof core-concepts
 * @example
 * // 모듈화된 Declarative Store 시스템 사용 예제
 * <StoreScenarios.Provider registryId="store-full-demo">
 *   <UserProfileDemo />
 *   <ShoppingCartDemo />
 *   <TodoListDemo />
 *   <ChatDemo />
 * </StoreScenarios.Provider>
 * @since 2.0.0
 */

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
    {
      id: 'user-profile',
      title: '👤 User Profile',
      description: 'Complex object updates with nested properties',
      component: <UserProfileDemo />,
      color: 'blue',
    },
    {
      id: 'shopping-cart',
      title: '🛒 Shopping Cart',
      description: 'Array manipulation with quantity tracking',
      component: <ShoppingCartDemo />,
      color: 'green',
    },
    {
      id: 'todo-list',
      title: '✅ Todo List',
      description: 'CRUD operations with filtering and sorting',
      component: <TodoListDemo />,
      color: 'purple',
    },
    {
      id: 'chat',
      title: '💬 Real-time Chat',
      description: 'Message streaming with auto-scroll',
      component: <ChatDemo />,
      color: 'orange',
    },
  ];

  const currentDemo = demos.find((demo) => demo.id === activeDemo);

  const getColorClasses = (color: string, isActive: boolean = false) => {
    const colorMap = {
      blue: isActive
        ? 'bg-blue-500 text-white'
        : 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100',
      green: isActive
        ? 'bg-green-500 text-white'
        : 'bg-green-50 text-green-800 border-green-200 hover:bg-green-100',
      purple: isActive
        ? 'bg-purple-500 text-white'
        : 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100',
      orange: isActive
        ? 'bg-orange-500 text-white'
        : 'bg-orange-50 text-orange-800 border-orange-200 hover:bg-orange-100',
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  return (
    <PageWithLogMonitor
      pageId="store-full-demo"
      title="Store System - Real-world Scenarios"
      initialConfig={{ enableToast: true, maxLogs: 150 }}
    >
      <div className="page-container">
        <header className="page-header">
          <h1>🏪 Modularized Store System</h1>
          <p className="page-description">
            4개의 실제 시나리오를 모듈화하여 구현한 Store 시스템 데모입니다. 각
            시나리오는 별도의 컴포넌트, 액션, 스토어로 분리되어 관리됩니다.
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            <Badge variant="outline" className="bg-blue-50 text-blue-800">
              📁 모듈 구조: /demos/store-scenarios/
            </Badge>
            <Badge variant="outline" className="bg-green-50 text-green-800">
              🔧 분리된 관심사: Types, Stores, Actions, Components
            </Badge>
          </div>
        </header>

        <StoreActionSetup />

        {/* Demo Navigation */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                📋 Store Scenarios
              </h3>
              <Button
                onClick={() => setShowAllDemos(!showAllDemos)}
                variant={showAllDemos ? 'secondary' : 'primary'}
                size="sm"
              >
                {showAllDemos ? '🎯 Focus Mode' : '🌐 Show All'}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {demos.map((demo) => (
                <button
                  key={demo.id}
                  onClick={() => setActiveDemo(demo.id)}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${getColorClasses(
                    demo.color,
                    activeDemo === demo.id
                  )}`}
                >
                  <div className="font-medium text-sm mb-1">{demo.title}</div>
                  <div className="text-xs opacity-80">{demo.description}</div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Demo Content */}
        <StoreScenarios.Provider registryId="store-full-demo">
          {showAllDemos ? (
            <div className="space-y-6">
              <UserProfileDemo />
              <ShoppingCartDemo />
              <TodoListDemo />
              <ChatDemo />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Current Demo Header */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        {currentDemo?.title}
                      </h2>
                      <p className="text-gray-600 mt-1">
                        {currentDemo?.description}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`${getColorClasses(currentDemo?.color || 'blue')}`}
                    >
                      {demos.findIndex((d) => d.id === activeDemo) + 1} of{' '}
                      {demos.length}
                    </Badge>
                  </div>

                  {/* Demo Navigator */}
                  <div className="flex items-center justify-center gap-4 pt-4 border-t border-gray-200">
                    <Button
                      onClick={() => {
                        const currentIndex = demos.findIndex(
                          (d) => d.id === activeDemo
                        );
                        const prevIndex =
                          currentIndex > 0
                            ? currentIndex - 1
                            : demos.length - 1;
                        setActiveDemo(demos[prevIndex].id);
                      }}
                      variant="secondary"
                      size="sm"
                    >
                      ← Previous
                    </Button>

                    <span className="text-sm text-gray-600 px-4">
                      Navigate through store scenarios
                    </span>

                    <Button
                      onClick={() => {
                        const currentIndex = demos.findIndex(
                          (d) => d.id === activeDemo
                        );
                        const nextIndex =
                          currentIndex < demos.length - 1
                            ? currentIndex + 1
                            : 0;
                        setActiveDemo(demos[nextIndex].id);
                      }}
                      variant="primary"
                      size="sm"
                    >
                      Next →
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Current Demo Component */}
              <div>{currentDemo?.component}</div>
            </div>
          )}
        </StoreScenarios.Provider>

        {/* Modular Architecture Overview */}
        <Card className="mt-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              🏗️ Modular Architecture
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">📄</span>
                  <h4 className="font-medium text-blue-900">Types</h4>
                </div>
                <p className="text-sm text-blue-700 mb-2">
                  공통 인터페이스와 액션 타입 정의
                </p>
                <code className="text-xs bg-blue-100 px-2 py-1 rounded text-blue-800">
                  /types/index.ts
                </code>
              </div>

              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🗄️</span>
                  <h4 className="font-medium text-green-900">Stores</h4>
                </div>
                <p className="text-sm text-green-700 mb-2">
                  각 시나리오별 데이터 스토어와 초기값
                </p>
                <code className="text-xs bg-green-100 px-2 py-1 rounded text-green-800">
                  /stores/index.ts
                </code>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">⚡</span>
                  <h4 className="font-medium text-purple-900">Actions</h4>
                </div>
                <p className="text-sm text-purple-700 mb-2">
                  비즈니스 로직과 액션 핸들러
                </p>
                <code className="text-xs bg-purple-100 px-2 py-1 rounded text-purple-800">
                  /actions/index.ts
                </code>
              </div>

              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🎨</span>
                  <h4 className="font-medium text-orange-900">Components</h4>
                </div>
                <p className="text-sm text-orange-700 mb-2">
                  재사용 가능한 UI 컴포넌트들
                </p>
                <code className="text-xs bg-orange-100 px-2 py-1 rounded text-orange-800">
                  /components/*.tsx
                </code>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Store Patterns Summary */}
        <Card className="mt-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              📚 Store Management Patterns Overview
            </h3>
            <div className="space-y-3">
              {demos.map((demo, index) => (
                <div
                  key={demo.id}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                    activeDemo === demo.id
                      ? getColorClasses(demo.color, true)
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                  onClick={() => setActiveDemo(demo.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">
                        {index + 1}. {demo.title}
                      </h4>
                      <p className="text-sm opacity-80 mt-1">
                        {demo.description}
                      </p>
                    </div>
                    {activeDemo === demo.id && (
                      <Badge
                        variant="outline"
                        className="bg-white/20 text-current border-current/20"
                      >
                        Currently Viewing
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Code Example */}
        <Card className="mt-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              🔧 Modular Implementation Example
            </h3>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
              {`// 1. 타입 정의 (/types/index.ts)
export interface UserProfileActions {
  updateUser: { user: User };
  updateUserTheme: { theme: 'light' | 'dark' };
}

// 2. Context Store 패턴 생성 (/stores/index.ts)
export const StoreScenarios = createContextStorePattern('StoreScenarios');

// 3. 컴포넌트에서 Store 사용
const userStore = StoreScenarios.useStore('user', defaultUser);
const user = useStoreValue(userStore);

// 4. 액션 핸들러 (컴포넌트 내부)
useEffect(() => {
  const unsubscribe = storeActionRegister.register('updateUser', ({ user }, controller) => {
    userStore.setValue(user);
    controller.next();
  });
  return unsubscribe;
}, [userStore]);

// 5. Provider로 감싸기 (/pages/StoreFullDemoPage.tsx)
<StoreScenarios.Provider registryId="store-full-demo">
  <UserProfileDemo />
  <ShoppingCartDemo />
  <TodoListDemo />
  <ChatDemo />
</StoreScenarios.Provider>

// 6. 컴포넌트 구현 (/components/UserProfileDemo.tsx)
export function UserProfileDemo() {
  const userStore = StoreScenarios.useStore('user', defaultUser);
  const user = useStoreValue(userStore);
  const logger = useActionLoggerWithToast();
  
  const handleSave = useCallback(() => {
    logger.logAction('saveUserProfile', { oldUser: user, newUser: editForm });
    storeActionRegister.dispatch('updateUser', { user: editForm });
  }, [editForm, user, logger]);
  
  return <div>...</div>;
}`}
            </pre>
          </CardContent>
        </Card>

        {/* Benefits Section */}
        <Card className="mt-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              🎯 Modular Architecture Benefits
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🔄</span>
                  <h4 className="font-medium text-blue-900">재사용성</h4>
                </div>
                <p className="text-sm text-blue-700">
                  각 모듈을 독립적으로 재사용하고 테스트할 수 있습니다.
                </p>
              </div>

              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🧪</span>
                  <h4 className="font-medium text-green-900">테스트 용이성</h4>
                </div>
                <p className="text-sm text-green-700">
                  분리된 로직으로 단위 테스트가 쉬워집니다.
                </p>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🎛️</span>
                  <h4 className="font-medium text-purple-900">관심사 분리</h4>
                </div>
                <p className="text-sm text-purple-700">
                  타입, 데이터, 로직, UI가 명확히 분리되어 있습니다.
                </p>
              </div>

              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🔍</span>
                  <h4 className="font-medium text-orange-900">유지보수성</h4>
                </div>
                <p className="text-sm text-orange-700">
                  각 모듈의 책임이 명확해 수정과 확장이 용이합니다.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageWithLogMonitor>
  );
}

export default StoreFullDemoPage;
