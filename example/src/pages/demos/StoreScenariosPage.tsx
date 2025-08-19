/**
 * @fileoverview Store Scenarios Demo Page
 * 다양한 상태 관리 시나리오를 보여주는 실용적인 데모들
 */

import React from 'react';
import { PageWithLogMonitor } from '../../components/LogMonitor/';
import {
  ChatDemo,
  ShoppingCartDemo,
  TodoListDemo,
  UserProfileDemo
} from './store-scenarios/components';
import { StoreScenarios } from './store-scenarios/stores';

export function StoreScenariosPage() {
  return (
    <PageWithLogMonitor
      pageId="store-scenarios"
      title="Store Scenarios"
    >
      <StoreScenarios.Provider>
        <div className="max-w-7xl mx-auto p-6">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-8 rounded-xl mb-8 border border-green-200">
          <div className="flex items-start gap-6">
            <div className="text-4xl">🏪</div>
            <div>
              <h1 className="text-3xl font-bold text-green-900 mb-4">Complete Store Scenarios (4 Core Demos)</h1>
              <p className="text-green-800 text-lg mb-4">
                실제 애플리케이션에서 자주 사용되는 상태 관리 패턴들을 Context-Action 
                프레임워크로 구현한 <strong>핵심 데모 컬렉션</strong>입니다.
              </p>
              
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-emerald-600">✨</span>
                  <span className="font-semibold text-emerald-800">
                    Core Collection: 실무 필수 패턴들
                  </span>
                </div>
                <p className="text-emerald-800 text-sm">
                  이 페이지는 <strong>실제 프로젝트에서 가장 많이 사용되는 4개의 핵심 패턴</strong>을 보여줍니다. 
                  각 데모는 완전히 구현되어 있으며, 실제 코드에 바로 적용 가능합니다.
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-green-900 mb-3">🎯 다루는 패턴</h3>
                  <ul className="text-green-700 space-y-2 text-sm">
                    <li>• <strong>CRUD 작업</strong>: 생성, 읽기, 수정, 삭제</li>
                    <li>• <strong>실시간 업데이트</strong>: 채팅, 알림 시스템</li>
                    <li>• <strong>복잡한 계산</strong>: 장바구니, 가격 계산</li>
                    <li>• <strong>폼 처리</strong>: 유효성 검사, 다단계 폼</li>
                    <li>• <strong>필터링/검색</strong>: 동적 데이터 처리</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold text-green-900 mb-3">🛠️ 구현 기법</h3>
                  <ul className="text-green-700 space-y-2 text-sm">
                    <li>• Store Pattern으로 중앙 상태 관리</li>
                    <li>• Action Handler로 비즈니스 로직 분리</li>
                    <li>• TypeScript 완전 지원</li>
                    <li>• 성능 최적화 기법</li>
                    <li>• 메모리 효율적 구현</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Demos */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900">🎮 핵심 구현 데모</h2>
            <div className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium">
              4개 데모 완전 구현됨
            </div>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Todo List Demo */}
            <div className="bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-shadow duration-300">
              <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-600 p-6">
                <div className="flex items-center justify-between text-white">
                  <div>
                    <h3 className="text-xl font-bold flex items-center gap-3">
                      <span className="text-2xl">✅</span>
                      Todo List Demo
                    </h3>
                    <p className="text-blue-100 text-sm mt-2 leading-relaxed">
                      기본적인 CRUD 패턴과 필터링, 정렬 기능을 보여주는 할일 관리 시스템
                    </p>
                  </div>
                  <div className="text-right text-blue-100 text-xs">
                    <div>Priority System</div>
                    <div>Filter & Sort</div>
                    <div>Progress Tracking</div>
                  </div>
                </div>
              </div>
              <div className="p-0">
                <TodoListDemo />
              </div>
            </div>

            {/* Shopping Cart Demo */}
            <div className="bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-shadow duration-300">
              <div className="bg-gradient-to-br from-purple-500 via-purple-600 to-pink-600 p-6">
                <div className="flex items-center justify-between text-white">
                  <div>
                    <h3 className="text-xl font-bold flex items-center gap-3">
                      <span className="text-2xl">🛒</span>
                      Shopping Cart Demo
                    </h3>
                    <p className="text-purple-100 text-sm mt-2 leading-relaxed">
                      복잡한 계산과 상태 관리, 실시간 가격 업데이트가 포함된 장바구니 시스템
                    </p>
                  </div>
                  <div className="text-right text-purple-100 text-xs">
                    <div>Real-time Calc</div>
                    <div>Tax & Shipping</div>
                    <div>Dynamic Pricing</div>
                  </div>
                </div>
              </div>
              <div className="p-0">
                <ShoppingCartDemo />
              </div>
            </div>

            {/* Chat Demo */}
            <div className="bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-shadow duration-300">
              <div className="bg-gradient-to-br from-green-500 via-green-600 to-emerald-600 p-6">
                <div className="flex items-center justify-between text-white">
                  <div>
                    <h3 className="text-xl font-bold flex items-center gap-3">
                      <span className="text-2xl">💬</span>
                      Chat Demo
                    </h3>
                    <p className="text-green-100 text-sm mt-2 leading-relaxed">
                      실시간 메시징과 사용자 관리, 메시지 히스토리를 포함한 채팅 시스템
                    </p>
                  </div>
                  <div className="text-right text-green-100 text-xs">
                    <div>Real-time Chat</div>
                    <div>User Management</div>
                    <div>Message History</div>
                  </div>
                </div>
              </div>
              <div className="p-0">
                <ChatDemo />
              </div>
            </div>

            {/* User Profile Demo */}
            <div className="bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-shadow duration-300">
              <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 p-6">
                <div className="flex items-center justify-between text-white">
                  <div>
                    <h3 className="text-xl font-bold flex items-center gap-3">
                      <span className="text-2xl">👤</span>
                      User Profile Demo
                    </h3>
                    <p className="text-orange-100 text-sm mt-2 leading-relaxed">
                      폼 처리와 유효성 검사, 실시간 업데이트가 포함된 사용자 프로필 관리
                    </p>
                  </div>
                  <div className="text-right text-orange-100 text-xs">
                    <div>Form Validation</div>
                    <div>Real-time Update</div>
                    <div>Error Handling</div>
                  </div>
                </div>
              </div>
              <div className="p-0">
                <UserProfileDemo />
              </div>
            </div>
          </div>
        </div>


        {/* Technical Details */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">🔧 기술적 구현 세부사항</h2>
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="font-semibold text-lg mb-4 text-blue-600">Store Architecture</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• <strong>Centralized State</strong>: 모든 데이터를 중앙에서 관리</li>
                <li>• <strong>Immutable Updates</strong>: 불변성을 보장하는 상태 업데이트</li>
                <li>• <strong>Selective Subscriptions</strong>: 필요한 부분만 구독</li>
                <li>• <strong>Auto Cleanup</strong>: 자동 메모리 관리</li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="font-semibold text-lg mb-4 text-green-600">Action Patterns</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• <strong>Command Pattern</strong>: 액션을 명령으로 처리</li>
                <li>• <strong>Handler Registration</strong>: 동적 핸들러 등록</li>
                <li>• <strong>Priority System</strong>: 우선순위 기반 실행</li>
                <li>• <strong>Error Handling</strong>: 통합 에러 관리</li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="font-semibold text-lg mb-4 text-purple-600">Performance</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• <strong>Lazy Loading</strong>: 필요시점 데이터 로딩</li>
                <li>• <strong>Memoization</strong>: 계산 결과 캐싱</li>
                <li>• <strong>Batch Updates</strong>: 배치 업데이트 처리</li>
                <li>• <strong>Virtual Scrolling</strong>: 대용량 리스트 최적화</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Code Examples */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">💻 핵심 패턴 코드 예제</h2>
          <div className="bg-gray-50 p-6 rounded-lg border">
            <h3 className="font-semibold text-lg mb-4">Store와 Action 연동 패턴</h3>
            <pre className="bg-gray-800 text-green-400 p-4 rounded text-sm overflow-x-auto">
{`// 1. Store 생성
const todosStore = createStore<Todo[]>('todos', []);
const filterStore = createStore<FilterType>('filter', 'all');

// 2. Action Context 생성
const {
  Provider: TodoProvider,
  useActionDispatch: useTodoAction,
  useActionHandler: useTodoHandler
} = createActionContext<TodoActions>('TodoActions');

// 3. Action Handler 등록
function TodoHandlers() {
  useTodoHandler('addTodo', async (payload, controller) => {
    const currentTodos = todosStore.getValue();
    const newTodo = {
      id: Date.now().toString(),
      text: payload.text,
      completed: false,
      createdAt: new Date()
    };
    
    todosStore.setValue([...currentTodos, newTodo]);
  });

  useTodoHandler('toggleTodo', async (payload, controller) => {
    const currentTodos = todosStore.getValue();
    const updatedTodos = currentTodos.map(todo =>
      todo.id === payload.id 
        ? { ...todo, completed: !todo.completed }
        : todo
    );
    
    todosStore.setValue(updatedTodos);
  });
  
  return null;
}

// 4. 컴포넌트에서 사용
function TodoApp() {
  return (
    <TodoProvider>
      <TodoHandlers />
      <TodoList />
      <AddTodoForm />
    </TodoProvider>
  );
}

function TodoList() {
  const todos = useStoreValue(todosStore);
  const filter = useStoreValue(filterStore);
  const dispatch = useTodoAction();
  
  const filteredTodos = useMemo(() => {
    switch (filter) {
      case 'active': return todos.filter(t => !t.completed);
      case 'completed': return todos.filter(t => t.completed);
      default: return todos;
    }
  }, [todos, filter]);
  
  return (
    <div>
      {filteredTodos.map(todo => (
        <TodoItem 
          key={todo.id} 
          todo={todo}
          onToggle={() => dispatch('toggleTodo', { id: todo.id })}
        />
      ))}
    </div>
  );
}`}
            </pre>
          </div>
        </div>

        {/* Related Links */}
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h2 className="text-xl font-bold mb-4">🔗 관련 리소스</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <a 
              href="/demos"
              className="text-blue-600 hover:text-blue-800 text-sm hover:underline"
            >
              🎭 모든 데모 보기
            </a>
            <a 
              href="/store"
              className="text-blue-600 hover:text-blue-800 text-sm hover:underline"
            >
              🏪 Store 시스템 가이드
            </a>
            <a 
              href="/react"
              className="text-blue-600 hover:text-blue-800 text-sm hover:underline"
            >
              ⚛️ React 통합 문서
            </a>
          </div>
        </div>
      </div>
      </StoreScenarios.Provider>
    </PageWithLogMonitor>
  );
}