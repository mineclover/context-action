import { useStoreValue, createStoreContext, createActionContext } from '@context-action/react';
import type React from 'react';
import { useCallback, useEffect, useMemo } from 'react';
import { useActionLoggerWithToast } from '@/components/LogMonitor';
import { storeActionRegister } from '../actions';
import { StoreScenarios } from '../stores';
import type { TodoItem } from '../types';

// UI State Management with Context-Action
const {
  Provider: TodoUIStoreProvider,
  useStore: useTodoUIStore
} = createStoreContext('TodoUI', {
  newTodo: { initialValue: '' },
  priority: { initialValue: 'medium' as TodoItem['priority'] },
  filter: { initialValue: 'all' as 'all' | 'active' | 'completed' },
  sortBy: { initialValue: 'created' as 'created' | 'priority' | 'title' }
});

// UI Actions for form interactions
interface TodoUIActions {
  updateNewTodo: { value: string };
  setPriority: { priority: TodoItem['priority'] };
  setFilter: { filter: 'all' | 'active' | 'completed' };
  setSortBy: { sortBy: 'created' | 'priority' | 'title' };
  resetForm: void;
}

const {
  Provider: TodoUIActionProvider,
  useActionDispatch: useTodoUIAction,
  useActionHandler: useTodoUIActionHandler
} = createActionContext<TodoUIActions>('TodoUI');

import { todoComputations } from '../modules/computations';
import { loggingModule } from '../modules/logging';

/**
 * 할일 목록 관리 데모 컴포넌트
 * CRUD 작업과 필터링, 정렬 기능을 보여주는 Declarative Store 패턴 예제
 *
 * @implements store-integration-pattern
 * @implements action-handler
 * @memberof core-concepts
 * @see {@link https://github.com/mineclover/context-action/blob/main/docs/en/guide/patterns/store/basic-usage.md Store Pattern Basic Usage}
 * @see {@link https://github.com/mineclover/context-action/blob/main/docs/en/guide/patterns/action/basic-usage.md Action Pattern Basic Usage}
 * @example
 * // 할일 목록 관리를 위한 Declarative Store 패턴
 * const todosStore = StoreScenarios.useStore('todos'); // 자동 타입 추론: Store<TodoItem[]>
 * const todos = useStoreValue(todosStore);
 * @since 2.0.0
 */
function TodoListDemoInner() {
  const todosStore = StoreScenarios.useStore('todos'); // 자동 타입 추론: Store<TodoItem[]>
  const todos = useStoreValue(todosStore);
  
  // Context-Action UI state instead of React useState
  const newTodoStore = useTodoUIStore('newTodo');
  const priorityStore = useTodoUIStore('priority');
  const filterStore = useTodoUIStore('filter');
  const sortByStore = useTodoUIStore('sortBy');
  
  const newTodo = useStoreValue(newTodoStore);
  const priority = useStoreValue(priorityStore);
  const filter = useStoreValue(filterStore);
  const sortBy = useStoreValue(sortByStore);
  
  const uiDispatch = useTodoUIAction();
  const logger = useActionLoggerWithToast();

  // Action handlers using useCallback (keeping original pattern)
  const addTodoHandler = useCallback(
    ({ title, priority }: { title: string; priority: TodoItem['priority'] }) => {
      const newTodo: TodoItem = {
        id: `todo-${Date.now()}`,
        title,
        completed: false,
        priority,
        createdAt: new Date(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7일 후
      };
      todosStore.update((prev) => [...prev, newTodo]);
    },
    [todosStore]
  );

  const toggleTodoHandler = useCallback(
    ({ todoId }: { todoId: string }) => {
      todosStore.update((prev) =>
        prev.map((todo) =>
          todo.id === todoId ? { ...todo, completed: !todo.completed } : todo
        )
      );
    },
    [todosStore]
  );

  const deleteTodoHandler = useCallback(
    ({ todoId }: { todoId: string }) => {
      todosStore.update((prev) => prev.filter((todo) => todo.id !== todoId));
    },
    [todosStore]
  );

  const updateTodoPriorityHandler = useCallback(
    ({ todoId, priority }: { todoId: string; priority: TodoItem['priority'] }) => {
      todosStore.update((prev) =>
        prev.map((todo) =>
          todo.id === todoId ? { ...todo, priority } : todo
        )
      );
    },
    [todosStore]
  );

  // Register action handlers with storeActionRegister
  useEffect(() => {
    const unsubscribers = [
      storeActionRegister.register('addTodo', addTodoHandler),
      storeActionRegister.register('toggleTodo', toggleTodoHandler),
      storeActionRegister.register('deleteTodo', deleteTodoHandler),
      storeActionRegister.register('updateTodoPriority', updateTodoPriorityHandler),
    ];

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [addTodoHandler, toggleTodoHandler, deleteTodoHandler, updateTodoPriorityHandler]);
  
  // UI Action handlers for form interactions
  useTodoUIActionHandler('updateNewTodo', async ({ value }) => {
    newTodoStore.setValue(value);
  });
  
  useTodoUIActionHandler('setPriority', async ({ priority }) => {
    priorityStore.setValue(priority);
  });
  
  useTodoUIActionHandler('setFilter', async ({ filter }) => {
    filterStore.setValue(filter);
  });
  
  useTodoUIActionHandler('setSortBy', async ({ sortBy }) => {
    sortByStore.setValue(sortBy);
  });
  
  useTodoUIActionHandler('resetForm', async () => {
    newTodoStore.setValue('');
    priorityStore.setValue('medium');
  });

  const filteredAndSortedTodos = useMemo(() => {
    if (!todos) return [];
    
    const filtered = todoComputations.filterTodos(todos, filter);
    const sorted = todoComputations.sortTodos(filtered, sortBy);
    
    return sorted;
  }, [todos, filter, sortBy]);

  // 로깅을 모듈화된 시스템으로 분리 - 무한 루프 방지
  useEffect(() => {
    if (todos && todos.length > 0) {
      loggingModule.logSystem('할일 목록 필터링/정렬', {
        filter,
        sortBy,
        total: todos.length,
        filtered: filteredAndSortedTodos.length
      });
    }
  }, [todos?.length, filter, sortBy, filteredAndSortedTodos.length]);

  const stats = useMemo(() => {
    return todoComputations.calculateStats(todos || []);
  }, [todos]);

  const addTodo = () => {
    if (newTodo.trim()) {
      logger.logAction('addTodo', {
        title: newTodo.trim(),
        priority,
        currentTotalCount: todos?.length ?? 0,
      });
      storeActionRegister.dispatch('addTodo', {
        title: newTodo.trim(),
        priority,
      });
      uiDispatch('resetForm');
    }
  };

  const toggleTodo = (todoId: string) => {
    const todo = todos?.find((t) => t.id === todoId);
    logger.logAction('toggleTodo', {
      todoId,
      currentStatus: todo?.completed,
      newStatus: !todo?.completed,
      title: todo?.title,
    });
    storeActionRegister.dispatch('toggleTodo', { todoId });
  };

  const deleteTodo = (todoId: string) => {
    const todo = todos?.find((t) => t.id === todoId);
    logger.logAction('deleteTodo', {
      todoId,
      title: todo?.title,
      wasCompleted: todo?.completed,
    });
    storeActionRegister.dispatch('deleteTodo', { todoId });
  };

  const updatePriority = (todoId: string, newPriority: TodoItem['priority']) => {
    const todo = todos?.find((t) => t.id === todoId);
    const _priorityLabels = { high: '높음', medium: '보통', low: '낮음' };
    logger.logAction('updateTodoPriority', {
      todoId,
      oldPriority: todo?.priority,
      newPriority,
      title: todo?.title,
    });
    storeActionRegister.dispatch('updateTodoPriority', {
      todoId,
      priority: newPriority,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addTodo();
    }
  };

  const getPriorityColor = (priority: TodoItem['priority']) => {
    switch (priority) {
      case 'high':
        return '#ef4444';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  const getPriorityIcon = (priority: TodoItem['priority']) => {
    switch (priority) {
      case 'high':
        return '🔴';
      case 'medium':
        return '🟡';
      case 'low':
        return '🟢';
      default:
        return '⚪';
    }
  };

  return (
    <div className="demo-card">
      <h3>✅ Todo List Management</h3>
      <p className="demo-description">
        CRUD 작업과 필터링, 정렬 기능을 보여주는 할일 목록 데모
      </p>

      {/* 통계 섹션 */}
      <div className="todo-stats">
        <div className="stat-card">
          <div className="stat-number">{stats.total}</div>
          <div className="stat-label">Total Tasks</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.active}</div>
          <div className="stat-label">Active</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.completed}</div>
          <div className="stat-label">Completed</div>
        </div>
        <div className="stat-card urgent">
          <div className="stat-number">{stats.highPriority}</div>
          <div className="stat-label">High Priority</div>
        </div>
      </div>

      {/* 새 할일 추가 */}
      <div className="todo-input-section">
        <div className="todo-input-group">
          <input
            type="text"
            value={newTodo}
            onChange={(e) => {
              uiDispatch('updateNewTodo', { value: e.target.value });
              logger.logAction('typeTodoTitle', {
                length: e.target.value.length,
              });
            }}
            onKeyPress={handleKeyPress}
            placeholder="새로운 할일을 입력하세요..."
            className="todo-input"
          />
          <select
            value={priority}
            onChange={(e) => {
              const newPriority = e.target.value as TodoItem['priority'];
              uiDispatch('setPriority', { priority: newPriority });
              logger.logAction('selectTodoPriority', { priority: newPriority });
            }}
            className="priority-select"
          >
            <option value="low">🟢 낮음</option>
            <option value="medium">🟡 보통</option>
            <option value="high">🔴 높음</option>
          </select>
          <button
            onClick={addTodo}
            disabled={!newTodo.trim()}
            className="btn btn-primary add-todo-btn"
          >
            ➕ 추가
          </button>
        </div>
      </div>

      {/* 필터 및 정렬 */}
      <div className="todo-controls">
        <div className="filter-controls">
          <span className="control-label">필터:</span>
          {(['all', 'active', 'completed'] as const).map((filterType) => (
            <button
              key={filterType}
              onClick={() => {
                uiDispatch('setFilter', { filter: filterType });
                logger.logAction('filterTodos', { filter: filterType });
              }}
              className={`filter-btn ${filter === filterType ? 'active' : ''}`}
            >
              {filterType === 'all'
                ? '전체'
                : filterType === 'active'
                  ? '진행중'
                  : '완료'}
              {filterType === 'all' && ` (${stats.total})`}
              {filterType === 'active' && ` (${stats.active})`}
              {filterType === 'completed' && ` (${stats.completed})`}
            </button>
          ))}
        </div>

        <div className="sort-controls">
          <span className="control-label">정렬:</span>
          <select
            value={sortBy}
            onChange={(e) => {
              const newSortBy = e.target.value as
                | 'created'
                | 'priority'
                | 'title';
              uiDispatch('setSortBy', { sortBy: newSortBy });
              logger.logAction('sortTodos', { sortBy: newSortBy });
            }}
            className="sort-select"
          >
            <option value="created">생성일순</option>
            <option value="priority">우선순위순</option>
            <option value="title">제목순</option>
          </select>
        </div>
      </div>

      {/* 할일 목록 */}
      <div className="todo-list">
        {filteredAndSortedTodos.length === 0 ? (
          <div className="todo-empty">
            <div className="empty-icon">📝</div>
            <div className="empty-message">
              {filter === 'all'
                ? '아직 할일이 없습니다'
                : filter === 'active'
                  ? '진행중인 할일이 없습니다'
                  : '완료된 할일이 없습니다'}
            </div>
            <div className="empty-hint">위에서 새로운 할일을 추가해보세요</div>
          </div>
        ) : (
          filteredAndSortedTodos.map((todo) => (
            <div
              key={todo.id}
              className={`todo-item ${todo.completed ? 'completed' : ''}`}
            >
              <div className="todo-checkbox-section">
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => toggleTodo(todo.id)}
                  className="todo-checkbox"
                />
              </div>

              <div className="todo-content">
                <div className="todo-title-section">
                  <span
                    className={`todo-title ${todo.completed ? 'completed' : ''}`}
                  >
                    {todo.title}
                  </span>
                  <div className="todo-priority">
                    <select
                      value={todo.priority}
                      onChange={(e) =>
                        updatePriority(
                          todo.id,
                          e.target.value as TodoItem['priority']
                        )
                      }
                      className="priority-mini-select"
                      disabled={todo.completed}
                    >
                      <option value="low">🟢</option>
                      <option value="medium">🟡</option>
                      <option value="high">🔴</option>
                    </select>
                  </div>
                </div>

                <div className="todo-meta">
                  <span className="todo-date">
                    📅 {new Date(todo.createdAt).toLocaleDateString('ko-KR')}
                  </span>
                  {todo.dueDate && (
                    <span
                      className={`todo-due ${new Date(todo.dueDate) < new Date() ? 'overdue' : ''}`}
                    >
                      ⏰ {new Date(todo.dueDate).toLocaleDateString('ko-KR')}
                    </span>
                  )}
                  <span
                    className="todo-priority-badge"
                    style={{ backgroundColor: getPriorityColor(todo.priority) }}
                  >
                    {getPriorityIcon(todo.priority)} {todo.priority}
                  </span>
                </div>
              </div>

              <div className="todo-actions">
                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="btn btn-small btn-danger delete-todo-btn"
                  title="할일 삭제"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 진행률 바 */}
      {stats.total > 0 && (
        <div className="todo-progress">
          <div className="progress-info">
            <span>
              진행률: {Math.round((stats.completed / stats.total) * 100)}%
            </span>
            <span>
              {stats.completed}/{stats.total} 완료
            </span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${(stats.completed / stats.total) * 100}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
}

// Main component with providers
export function TodoListDemo() {
  return (
    <TodoUIActionProvider>
      <TodoUIStoreProvider>
        <TodoListDemoInner />
      </TodoUIStoreProvider>
    </TodoUIActionProvider>
  );
}
