import { useStoreValue } from '@context-action/react';
import type React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useActionLoggerWithToast } from '../../../components/LogMonitor/';
import { storeActionRegister } from '../actions';
import { StoreScenarios } from '../stores';
import type { TodoItem } from '../types';

/**
 * 할일 목록 관리 데모 컴포넌트
 * CRUD 작업과 필터링, 정렬 기능을 보여주는 Declarative Store 패턴 예제
 *
 * @implements store-integration-pattern
 * @implements action-handler
 * @memberof core-concepts
 * @example
 * // 할일 목록 관리를 위한 Declarative Store 패턴
 * const todosStore = StoreScenarios.useStore('todos'); // 자동 타입 추론: Store<TodoItem[]>
 * const todos = useStoreValue(todosStore);
 * @since 2.0.0
 */
export function TodoListDemo() {
  const todosStore = StoreScenarios.useStore('todos'); // 자동 타입 추론: Store<TodoItem[]>
  const todos = useStoreValue(todosStore);
  const [newTodo, setNewTodo] = useState('');
  const [priority, setPriority] = useState<TodoItem['priority']>('medium');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [sortBy, setSortBy] = useState<'created' | 'priority' | 'title'>(
    'created'
  );
  const logger = useActionLoggerWithToast();

  // 필요한 액션 핸들러들을 등록
  useEffect(() => {
    const unsubscribers = [
      storeActionRegister.register(
        'addTodo',
        ({ title, priority }, controller) => {
          const newTodo: TodoItem = {
            id: `todo-${Date.now()}`,
            title,
            completed: false,
            priority,
            createdAt: new Date(),
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7일 후
          };
          todosStore.update((prev) => [...prev, newTodo]);
          controller.next();
        }
      ),

      storeActionRegister.register('toggleTodo', ({ todoId }, controller) => {
        todosStore.update((prev) =>
          prev.map((todo) =>
            todo.id === todoId ? { ...todo, completed: !todo.completed } : todo
          )
        );
        controller.next();
      }),

      storeActionRegister.register('deleteTodo', ({ todoId }, controller) => {
        todosStore.update((prev) => prev.filter((todo) => todo.id !== todoId));
        controller.next();
      }),

      storeActionRegister.register(
        'updateTodoPriority',
        ({ todoId, priority }, controller) => {
          todosStore.update((prev) =>
            prev.map((todo) =>
              todo.id === todoId ? { ...todo, priority } : todo
            )
          );
          controller.next();
        }
      ),
    ];

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [todosStore]);

  const filteredAndSortedTodos = useMemo(() => {
    if (!todos) return [];

    // 필터링
    let filtered = todos;
    if (filter === 'active') {
      filtered = todos.filter((todo) => !todo.completed);
    } else if (filter === 'completed') {
      filtered = todos.filter((todo) => todo.completed);
    }

    // 정렬
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'priority': {
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
      }
    });

    logger.logSystem('할일 목록 필터링/정렬', {
      context: `filter: ${filter}, sortBy: ${sortBy}, total: ${todos.length}, filtered: ${sorted.length}`,
    });

    return sorted;
  }, [todos, filter, sortBy, logger]);

  const stats = useMemo(() => {
    if (!todos) return { total: 0, completed: 0, active: 0, highPriority: 0 };

    const completed = todos.filter((todo) => todo.completed).length;
    const active = todos.length - completed;
    const highPriority = todos.filter(
      (todo) => todo.priority === 'high' && !todo.completed
    ).length;

    return {
      total: todos.length,
      completed,
      active,
      highPriority,
    };
  }, [todos]);

  const addTodo = useCallback(() => {
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
      setNewTodo('');
      setPriority('medium');
    }
  }, [newTodo, priority, todos, logger]);

  const toggleTodo = useCallback(
    (todoId: string) => {
      const todo = todos?.find((t) => t.id === todoId);
      logger.logAction('toggleTodo', {
        todoId,
        currentStatus: todo?.completed,
        newStatus: !todo?.completed,
        title: todo?.title,
      });
      storeActionRegister.dispatch('toggleTodo', { todoId });
    },
    [todos, logger]
  );

  const deleteTodo = useCallback(
    (todoId: string) => {
      const todo = todos?.find((t) => t.id === todoId);
      logger.logAction('deleteTodo', {
        todoId,
        title: todo?.title,
        wasCompleted: todo?.completed,
      });
      storeActionRegister.dispatch('deleteTodo', { todoId });
    },
    [todos, logger]
  );

  const updatePriority = useCallback(
    (todoId: string, newPriority: TodoItem['priority']) => {
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
    },
    [todos, logger]
  );

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        addTodo();
      }
    },
    [addTodo]
  );

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
              setNewTodo(e.target.value);
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
              setPriority(newPriority);
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
                setFilter(filterType);
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
              setSortBy(newSortBy);
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
