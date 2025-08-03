/**
 * @fileoverview HMR 실용 예시 - 할일 관리 앱
 * HMR이 실제 앱에서 어떻게 작동하는지 보여주는 실용적인 예시
 * 사용자가 할일을 추가하고 수정한 후, 코드를 변경해도 상태가 보존되는 것을 확인할 수 있음
 */

import React, { useEffect, useState } from 'react';
import { 
  useIntegratedHMR,
  AutoHMRDashboard 
} from '@context-action/react';
import { ActionRegister, createStore, useStoreValue } from '@context-action/react';
import type { ActionPayloadMap } from '@context-action/core';

// 할일 아이템 타입
interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: number;
  updatedAt: number;
}

// 할일 앱 상태 타입
interface TodoAppState {
  todos: TodoItem[];
  filter: 'all' | 'active' | 'completed';
  stats: {
    total: number;
    completed: number;
    active: number;
  };
}

// 액션 타입 정의
interface TodoActions extends ActionPayloadMap {
  addTodo: { text: string; priority: TodoItem['priority'] };
  toggleTodo: { id: string };
  deleteTodo: { id: string };
  updateTodo: { id: string; text: string; priority: TodoItem['priority'] };
  setFilter: { filter: TodoAppState['filter'] };
  clearCompleted: void;
  updateStats: void;
}

// Store 생성
const todoStore = createStore<TodoAppState>('hmr-todo-app', {
  todos: [],
  filter: 'all',
  stats: {
    total: 0,
    completed: 0,
    active: 0
  }
});

// ActionRegister 생성
const todoActionRegister = new ActionRegister<TodoActions>();

// 유틸리티 함수들
const generateTodoId = () => `todo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const calculateStats = (todos: TodoItem[]) => ({
  total: todos.length,
  completed: todos.filter(todo => todo.completed).length,
  active: todos.filter(todo => !todo.completed).length
});

// 액션 핸들러 팩토리들 (HMR 복원을 위해 함수로 분리)
const createAddTodoHandler = () => ({ text, priority }: { text: string; priority: TodoItem['priority'] }, controller: any) => {
  const currentState = todoStore.getValue();
  const newTodo: TodoItem = {
    id: generateTodoId(),
    text: text.trim(),
    completed: false,
    priority,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  const newTodos = [...currentState.todos, newTodo];
  const newStats = calculateStats(newTodos);

  todoStore.setValue({
    ...currentState,
    todos: newTodos,
    stats: newStats
  });

  console.log(`✅ 새 할일 추가: "${newTodo.text}" (우선순위: ${priority})`);
  controller.next();
};

const createToggleTodoHandler = () => ({ id }: { id: string }, controller: any) => {
  const currentState = todoStore.getValue();
  const newTodos = currentState.todos.map(todo =>
    todo.id === id
      ? { ...todo, completed: !todo.completed, updatedAt: Date.now() }
      : todo
  );
  const newStats = calculateStats(newTodos);

  todoStore.setValue({
    ...currentState,
    todos: newTodos,
    stats: newStats
  });

  const toggledTodo = newTodos.find(todo => todo.id === id);
  console.log(`🔄 할일 상태 변경: "${toggledTodo?.text}" → ${toggledTodo?.completed ? '완료' : '미완료'}`);
  controller.next();
};

const createDeleteTodoHandler = () => ({ id }: { id: string }, controller: any) => {
  const currentState = todoStore.getValue();
  const todoToDelete = currentState.todos.find(todo => todo.id === id);
  const newTodos = currentState.todos.filter(todo => todo.id !== id);
  const newStats = calculateStats(newTodos);

  todoStore.setValue({
    ...currentState,
    todos: newTodos,
    stats: newStats
  });

  console.log(`🗑️ 할일 삭제: "${todoToDelete?.text}"`);
  controller.next();
};

const createUpdateTodoHandler = () => ({ id, text, priority }: { id: string; text: string; priority: TodoItem['priority'] }, controller: any) => {
  const currentState = todoStore.getValue();
  const newTodos = currentState.todos.map(todo =>
    todo.id === id
      ? { ...todo, text: text.trim(), priority, updatedAt: Date.now() }
      : todo
  );

  todoStore.setValue({
    ...currentState,
    todos: newTodos
  });

  console.log(`✏️ 할일 수정: "${text}" (우선순위: ${priority})`);
  controller.next();
};

const createSetFilterHandler = () => ({ filter }: { filter: TodoAppState['filter'] }, controller: any) => {
  const currentState = todoStore.getValue();
  
  todoStore.setValue({
    ...currentState,
    filter
  });

  console.log(`🔍 필터 변경: ${filter}`);
  controller.next();
};

const createClearCompletedHandler = () => (_: void, controller: any) => {
  const currentState = todoStore.getValue();
  const newTodos = currentState.todos.filter(todo => !todo.completed);
  const newStats = calculateStats(newTodos);
  const deletedCount = currentState.todos.length - newTodos.length;

  todoStore.setValue({
    ...currentState,
    todos: newTodos,
    stats: newStats
  });

  console.log(`🧹 완료된 할일 정리: ${deletedCount}개 삭제`);
  controller.next();
};

// 우선순위별 색상 매핑
const priorityColors = {
  low: '#10b981',     // green
  medium: '#f59e0b',  // amber  
  high: '#ef4444'     // red
};

const priorityLabels = {
  low: '낮음',
  medium: '보통',
  high: '높음'
};

// 개별 할일 아이템 컴포넌트
function TodoItemComponent({ 
  todo, 
  onToggle, 
  onDelete, 
  onUpdate 
}: { 
  todo: TodoItem;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, text: string, priority: TodoItem['priority']) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);
  const [editPriority, setEditPriority] = useState(todo.priority);

  const handleSave = () => {
    if (editText.trim()) {
      onUpdate(todo.id, editText, editPriority);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditText(todo.text);
    setEditPriority(todo.priority);
    setIsEditing(false);
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      padding: '12px',
      backgroundColor: todo.completed ? '#f9fafb' : '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      marginBottom: '8px',
      opacity: todo.completed ? 0.7 : 1
    }}>
      {/* 완료 체크박스 */}
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggle(todo.id)}
        style={{ marginRight: '12px', width: '18px', height: '18px' }}
      />

      {/* 우선순위 표시 */}
      <div style={{
        width: '12px',
        height: '12px',
        backgroundColor: priorityColors[todo.priority],
        borderRadius: '50%',
        marginRight: '8px',
        'aria-label': `우선순위: ${priorityLabels[todo.priority]}`
      }} />

      {/* 할일 내용 */}
      <div style={{ flex: 1 }}>
        {isEditing ? (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              style={{
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                padding: '4px 8px',
                fontSize: '14px',
                flex: 1
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') handleCancel();
              }}
              autoFocus
            />
            <select
              value={editPriority}
              onChange={(e) => setEditPriority(e.target.value as TodoItem['priority'])}
              style={{
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                padding: '4px 8px',
                fontSize: '12px'
              }}
            >
              <option value="low">낮음</option>
              <option value="medium">보통</option>
              <option value="high">높음</option>
            </select>
          </div>
        ) : (
          <div>
            <span style={{
              textDecoration: todo.completed ? 'line-through' : 'none',
              fontSize: '14px',
              color: todo.completed ? '#6b7280' : '#111827'
            }}>
              {todo.text}
            </span>
            <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
              생성: {new Date(todo.createdAt).toLocaleString('ko-KR')}
              {todo.updatedAt !== todo.createdAt && (
                <span> • 수정: {new Date(todo.updatedAt).toLocaleString('ko-KR')}</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 액션 버튼들 */}
      <div style={{ display: 'flex', gap: '4px', marginLeft: '8px' }}>
        {isEditing ? (
          <>
            <button
              onClick={handleSave}
              style={{
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '4px 8px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              저장
            </button>
            <button
              onClick={handleCancel}
              style={{
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '4px 8px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              취소
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setIsEditing(true)}
              style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '4px 8px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              수정
            </button>
            <button
              onClick={() => onDelete(todo.id)}
              style={{
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '4px 8px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              삭제
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// 할일 추가 폼 컴포넌트
function TodoAddForm({ onAdd }: { onAdd: (text: string, priority: TodoItem['priority']) => void }) {
  const [text, setText] = useState('');
  const [priority, setPriority] = useState<TodoItem['priority']>('medium');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onAdd(text, priority);
      setText('');
      setPriority('medium');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{
      display: 'flex',
      gap: '8px',
      padding: '16px',
      backgroundColor: '#f9fafb',
      borderRadius: '8px',
      marginBottom: '20px'
    }}>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="새 할일을 입력하세요..."
        style={{
          flex: 1,
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          padding: '8px 12px',
          fontSize: '14px'
        }}
      />
      <select
        value={priority}
        onChange={(e) => setPriority(e.target.value as TodoItem['priority'])}
        style={{
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          padding: '8px 12px',
          fontSize: '14px'
        }}
      >
        <option value="low">낮음</option>
        <option value="medium">보통</option>
        <option value="high">높음</option>
      </select>
      <button
        type="submit"
        style={{
          backgroundColor: '#10b981',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          padding: '8px 16px',
          fontSize: '14px',
          cursor: 'pointer'
        }}
      >
        추가
      </button>
    </form>
  );
}

// 메인 HMR Todo 예시 컴포넌트
export function HMRTodoExample() {
  // HMR 통합 훅 사용
  const {
    store: hmrTodoStore,
    actionRegister: hmrActionRegister,
    registerHandlerFactory,
    storeWasRestored,
    actionRegisterWasRestored,
  } = useIntegratedHMR(todoStore, todoActionRegister, {
    enableLogging: true,
    store: { 
      autoBackup: true, 
      backupInterval: 5000 // 5초마다 백업 (성능 최적화)
    },
    actionRegister: { 
      autoBackup: true, 
      autoRestore: true 
    }
  });

  const todoState = useStoreValue(hmrTodoStore) as TodoAppState;

  // 핸들러 팩토리 등록 (HMR 복원용)
  useEffect(() => {
    registerHandlerFactory('addTodo', 'main-add', createAddTodoHandler);
    registerHandlerFactory('toggleTodo', 'main-toggle', createToggleTodoHandler);
    registerHandlerFactory('deleteTodo', 'main-delete', createDeleteTodoHandler);
    registerHandlerFactory('updateTodo', 'main-update', createUpdateTodoHandler);
    registerHandlerFactory('setFilter', 'main-filter', createSetFilterHandler);
    registerHandlerFactory('clearCompleted', 'main-clear', createClearCompletedHandler);
  }, [registerHandlerFactory]);

  // 핸들러 등록
  useEffect(() => {
    const unregisterAdd = hmrActionRegister.register('addTodo', createAddTodoHandler(), { 
      id: 'main-add', priority: 10 
    });
    const unregisterToggle = hmrActionRegister.register('toggleTodo', createToggleTodoHandler(), { 
      id: 'main-toggle', priority: 10 
    });
    const unregisterDelete = hmrActionRegister.register('deleteTodo', createDeleteTodoHandler(), { 
      id: 'main-delete', priority: 10 
    });
    const unregisterUpdate = hmrActionRegister.register('updateTodo', createUpdateTodoHandler(), { 
      id: 'main-update', priority: 10 
    });
    const unregisterFilter = hmrActionRegister.register('setFilter', createSetFilterHandler(), { 
      id: 'main-filter', priority: 10 
    });
    const unregisterClear = hmrActionRegister.register('clearCompleted', createClearCompletedHandler(), { 
      id: 'main-clear', priority: 10 
    });

    return () => {
      unregisterAdd();
      unregisterToggle();
      unregisterDelete();
      unregisterUpdate();
      unregisterFilter();
      unregisterClear();
    };
  }, [hmrActionRegister]);

  // 필터링된 할일 목록
  const filteredTodos = todoState.todos.filter(todo => {
    switch (todoState.filter) {
      case 'active':
        return !todo.completed;
      case 'completed':
        return todo.completed;
      default:
        return true;
    }
  });

  // 프로덕션 환경에서는 표시하지 않음
  if (process.env.NODE_ENV === 'production') {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>🔥 HMR Todo 예시</h2>
        <p>이 예시는 개발 환경에서만 사용할 수 있습니다.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🔥 HMR 할일 관리 앱</h1>
      
      {/* HMR 상태 표시 */}
      <div style={{ 
        marginBottom: '20px', 
        padding: '15px', 
        backgroundColor: storeWasRestored || actionRegisterWasRestored ? '#dcfce7' : '#fef3c7', 
        borderRadius: '8px',
        border: `1px solid ${storeWasRestored || actionRegisterWasRestored ? '#16a34a' : '#d97706'}`
      }}>
        <h3>🔍 HMR 상태</h3>
        <div style={{ fontSize: '14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            📦 Store 복원: {storeWasRestored ? '✅ 복원됨' : '❌ 새 세션'}
          </div>
          <div>
            ⚡ Action 복원: {actionRegisterWasRestored ? '✅ 복원됨' : '❌ 새 세션'}
          </div>
        </div>
      </div>

      {/* HMR 테스트 가이드 */}
      <div style={{ 
        marginBottom: '20px', 
        padding: '15px', 
        backgroundColor: '#eff6ff', 
        borderRadius: '8px',
        border: '1px solid #3b82f6'
      }}>
        <h3>🎯 HMR 테스트하기</h3>
        <ol style={{ fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
          <li>아래에서 할일을 추가하고 수정해보세요.</li>
          <li>이 파일 (HMRTodoExample.tsx)을 열고 콘솔 메시지나 스타일을 변경해보세요.</li>
          <li>파일을 저장하면 페이지가 자동으로 리로드됩니다.</li>
          <li>리로드 후에도 추가한 할일들이 그대로 남아있는지 확인하세요!</li>
          <li>우측 하단의 HMR Dashboard에서 실시간 상태를 확인하세요.</li>
        </ol>
      </div>

      {/* 통계 표시 */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', 
        gap: '10px', 
        marginBottom: '20px' 
      }}>
        <div style={{ padding: '10px', backgroundColor: '#f3f4f6', borderRadius: '6px', textAlign: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937' }}>
            {todoState.stats.total}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>전체</div>
        </div>
        <div style={{ padding: '10px', backgroundColor: '#fef3c7', borderRadius: '6px', textAlign: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#d97706' }}>
            {todoState.stats.active}
          </div>
          <div style={{ fontSize: '12px', color: '#92400e' }}>진행중</div>
        </div>
        <div style={{ padding: '10px', backgroundColor: '#dcfce7', borderRadius: '6px', textAlign: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#16a34a' }}>
            {todoState.stats.completed}
          </div>
          <div style={{ fontSize: '12px', color: '#15803d' }}>완료</div>
        </div>
      </div>

      {/* 할일 추가 폼 */}
      <TodoAddForm onAdd={(text, priority) => hmrActionRegister.dispatch('addTodo', { text, priority })} />

      {/* 필터 버튼들 */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {(['all', 'active', 'completed'] as const).map(filter => (
          <button
            key={filter}
            onClick={() => hmrActionRegister.dispatch('setFilter', { filter })}
            style={{
              backgroundColor: todoState.filter === filter ? '#3b82f6' : '#e5e7eb',
              color: todoState.filter === filter ? 'white' : '#374151',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 16px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            {filter === 'all' && '전체'}
            {filter === 'active' && '진행중'}
            {filter === 'completed' && '완료'}
            {filter !== 'all' && ` (${filter === 'active' ? todoState.stats.active : todoState.stats.completed})`}
          </button>
        ))}
        
        {todoState.stats.completed > 0 && (
          <button
            onClick={() => hmrActionRegister.dispatch('clearCompleted')}
            style={{
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 16px',
              fontSize: '14px',
              cursor: 'pointer',
              marginLeft: 'auto'
            }}
          >
            완료 항목 정리 ({todoState.stats.completed})
          </button>
        )}
      </div>

      {/* 할일 목록 */}
      <div>
        {filteredTodos.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px', 
            color: '#9ca3af',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            border: '2px dashed #d1d5db'
          }}>
            {todoState.filter === 'all' && '할일이 없습니다. 새로운 할일을 추가해보세요!'}
            {todoState.filter === 'active' && '진행중인 할일이 없습니다.'}
            {todoState.filter === 'completed' && '완료된 할일이 없습니다.'}
          </div>
        ) : (
          <div>
            {filteredTodos
              .sort((a, b) => {
                // 우선순위 정렬 (high > medium > low)
                const priorityOrder = { high: 3, medium: 2, low: 1 };
                return priorityOrder[b.priority] - priorityOrder[a.priority];
              })
              .map(todo => (
                <TodoItemComponent
                  key={todo.id}
                  todo={todo}
                  onToggle={(id) => hmrActionRegister.dispatch('toggleTodo', { id })}
                  onDelete={(id) => hmrActionRegister.dispatch('deleteTodo', { id })}
                  onUpdate={(id, text, priority) => hmrActionRegister.dispatch('updateTodo', { id, text, priority })}
                />
              ))}
          </div>
        )}
      </div>

      {/* HMR 대시보드 (자동 렌더링) */}
      <AutoHMRDashboard />
      
      <div style={{ 
        marginTop: '30px', 
        padding: '15px', 
        backgroundColor: '#f8fafc', 
        borderRadius: '8px',
        fontSize: '12px',
        color: '#64748b'
      }}>
        <h4>💡 HMR 동작 확인 팁</h4>
        <ul style={{ margin: 0, paddingLeft: '20px' }}>
          <li>할일을 몇 개 추가한 후 이 파일의 콘솔 메시지를 변경해보세요.</li>
          <li>스타일을 변경하거나 새로운 기능을 추가해보세요.</li>
          <li>파일 저장 후 리로드되어도 할일 데이터가 그대로 유지되는지 확인하세요.</li>
          <li>브라우저 개발자 도구 콘솔에서 HMR 로그를 확인할 수 있습니다.</li>
        </ul>
      </div>
    </div>
  );
}