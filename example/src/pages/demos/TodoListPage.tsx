/**
 * @fileoverview Todo List Demo Page - Individual Demo
 * CRUD 작업과 필터링, 정렬 기능을 보여주는 할일 관리 시스템
 */

import React from 'react';
import { PageWithLogMonitor } from '../../components/LogMonitor/';
import { TodoListDemo } from './store-scenarios/components';
import { StoreScenarios } from './store-scenarios/stores';

export function TodoListPage() {
  return (
    <PageWithLogMonitor
      pageId="todo-list-demo"
      title="Todo List Demo"
    >
      <StoreScenarios.Provider>
        <div className="max-w-4xl mx-auto p-6">
          {/* Hero Section */}
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-8 rounded-xl mb-8 border border-blue-200">
            <div className="flex items-start gap-6">
              <div className="text-5xl">✅</div>
              <div>
                <h1 className="text-3xl font-bold text-blue-900 mb-4">Todo List Management Demo</h1>
                <p className="text-blue-800 text-lg mb-4">
                  기본적인 <strong>CRUD 패턴</strong>과 필터링, 정렬 기능을 보여주는 할일 관리 시스템입니다.
                  실제 프로젝트에서 가장 자주 사용되는 상태 관리 패턴을 구현했습니다.
                </p>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-blue-600">🎯</span>
                    <span className="font-semibold text-blue-800">
                      핵심 기능: CRUD + 필터링 + 정렬 + 우선순위
                    </span>
                  </div>
                  <p className="text-blue-800 text-sm">
                    할일 생성, 완료 처리, 우선순위 설정, 필터링(전체/진행중/완료), 정렬(생성일/우선순위/제목) 기능을 제공합니다.
                  </p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-3">🛠️ 구현 기능</h3>
                    <ul className="text-blue-700 space-y-2 text-sm">
                      <li>• <strong>Create</strong>: 새로운 할일 추가</li>
                      <li>• <strong>Read</strong>: 할일 목록 조회</li>
                      <li>• <strong>Update</strong>: 완료 상태, 우선순위 변경</li>
                      <li>• <strong>Delete</strong>: 할일 삭제</li>
                      <li>• <strong>Filter</strong>: 상태별 필터링</li>
                      <li>• <strong>Sort</strong>: 다양한 정렬 옵션</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-3">⚡ 기술 특징</h3>
                    <ul className="text-blue-700 space-y-2 text-sm">
                      <li>• TypeScript 완전 지원</li>
                      <li>• Immutable 상태 업데이트</li>
                      <li>• 메모이제이션 최적화</li>
                      <li>• 실시간 통계 계산</li>
                      <li>• 키보드 단축키 지원</li>
                      <li>• 진행률 시각화</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Demo Section */}
          <div className="mb-8">
            <div className="bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-600 p-6">
                <div className="flex items-center justify-between text-white">
                  <div>
                    <h2 className="text-2xl font-bold flex items-center gap-3">
                      <span className="text-3xl">✅</span>
                      Live Demo
                    </h2>
                    <p className="text-blue-100 text-sm mt-2 leading-relaxed">
                      할일을 추가하고, 우선순위를 설정하고, 필터링과 정렬을 사용해 보세요
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
          </div>

          {/* Technical Implementation */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">🔧 기술적 구현 세부사항</h2>
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="font-semibold text-lg mb-4 text-blue-600">Store Pattern</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• <strong>todosStore</strong>: 할일 목록 중앙 관리</li>
                  <li>• <strong>Immutable Updates</strong>: 배열/객체 불변성 보장</li>
                  <li>• <strong>Computed Values</strong>: 실시간 통계 계산</li>
                  <li>• <strong>Reactive Subscriptions</strong>: 자동 UI 업데이트</li>
                </ul>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="font-semibold text-lg mb-4 text-green-600">Action Handlers</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• <strong>addTodo</strong>: 새 할일 생성</li>
                  <li>• <strong>toggleTodo</strong>: 완료 상태 토글</li>
                  <li>• <strong>deleteTodo</strong>: 할일 삭제</li>
                  <li>• <strong>updateTodoPriority</strong>: 우선순위 변경</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Code Example */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">💻 핵심 코드 패턴</h2>
            <div className="bg-gray-50 p-6 rounded-lg border">
              <h3 className="font-semibold text-lg mb-4">Todo CRUD 구현</h3>
              <pre className="bg-gray-800 text-green-400 p-4 rounded text-sm overflow-x-auto">
{`// 1. Action Handler 등록
useActionHandler('addTodo', useCallback(
  ({ title, priority }: { title: string; priority: TodoItem['priority'] }) => {
    const newTodo: TodoItem = {
      id: \`todo-\${Date.now()}\`,
      title,
      completed: false,
      priority,
      createdAt: new Date(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    };
    todosStore.update((prev) => [...prev, newTodo]);
  },
  [todosStore]
));

// 2. 필터링 및 정렬 로직
const filteredAndSortedTodos = useMemo(() => {
  if (!todos) return [];
  
  const filtered = todoComputations.filterTodos(todos, filter);
  const sorted = todoComputations.sortTodos(filtered, sortBy);
  
  return sorted;
}, [todos, filter, sortBy]);

// 3. 통계 계산
const stats = useMemo(() => {
  return todoComputations.calculateStats(todos || []);
}, [todos]);`}
              </pre>
            </div>
          </div>

          {/* Related Links */}
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h2 className="text-xl font-bold mb-4 text-gray-900">🔗 관련 리소스</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <a 
                href="/demos/store-scenarios"
                className="text-blue-600 hover:text-blue-800 text-sm hover:underline"
              >
                🏪 전체 Store 데모 컬렉션
              </a>
              <a 
                href="/demos/shopping-cart"
                className="text-blue-600 hover:text-blue-800 text-sm hover:underline"
              >
                🛒 Shopping Cart Demo
              </a>
              <a 
                href="/demos/chat"
                className="text-blue-600 hover:text-blue-800 text-sm hover:underline"
              >
                💬 Chat Demo
              </a>
            </div>
          </div>
        </div>
      </StoreScenarios.Provider>
    </PageWithLogMonitor>
  );
}