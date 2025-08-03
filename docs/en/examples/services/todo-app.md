# Complete Todo Application

Context Action을 사용하여 완전한 Todo 애플리케이션을 구축하는 방법을 단계별로 안내합니다.

## Application Overview

이 예제는 다음 기능을 포함한 완전한 Todo 애플리케이션을 구현합니다:

- ✅ Todo 항목 생성, 수정, 삭제
- ✅ 완료 상태 토글
- ✅ 카테고리별 필터링
- ✅ 로컬 스토리지 동기화
- ✅ 실시간 검색
- ✅ 드래그 앤 드롭 정렬

## Data Models

```typescript
// types/todo.ts
export interface Todo {
  id: string
  title: string
  description?: string
  completed: boolean
  category: TodoCategory
  priority: TodoPriority
  dueDate?: Date
  createdAt: Date
  updatedAt: Date
}

export enum TodoCategory {
  PERSONAL = 'personal',
  WORK = 'work',
  SHOPPING = 'shopping',
  HEALTH = 'health'
}

export enum TodoPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export interface TodoFilter {
  category?: TodoCategory
  completed?: boolean
  priority?: TodoPriority
  search?: string
}
```

## Action Setup

```typescript
// actions/todoActions.ts
import { ActionRegister } from '@context-action/core'
import type { Todo, TodoFilter } from '../types/todo'

export const todoActionRegister = new ActionRegister()

// Todo 목록 가져오기
todoActionRegister.register('fetchTodos', {
  handler: async (): Promise<Todo[]> => {
    // 로컬 스토리지에서 데이터 로드
    const stored = localStorage.getItem('todos')
    const todos: Todo[] = stored ? JSON.parse(stored) : []
    
    // 날짜 객체 복원
    return todos.map(todo => ({
      ...todo,
      createdAt: new Date(todo.createdAt),
      updatedAt: new Date(todo.updatedAt),
      dueDate: todo.dueDate ? new Date(todo.dueDate) : undefined
    }))
  },
  onSuccess: (todos) => {
    console.log(`${todos.length}개의 Todo 항목을 불러왔습니다`)
  }
})

// Todo 생성
todoActionRegister.register('createTodo', {
  handler: async (todoData: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>): Promise<Todo> => {
    const newTodo: Todo = {
      ...todoData,
      id: `todo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    // 기존 Todo 목록 가져오기
    const fetchAction = todoActionRegister.get('fetchTodos')
    const existingTodos = await fetchAction?.execute() || []
    
    // 새 Todo 추가
    const updatedTodos = [...existingTodos, newTodo]
    
    // 로컬 스토리지에 저장
    localStorage.setItem('todos', JSON.stringify(updatedTodos))
    
    return newTodo
  },
  onSuccess: (todo) => {
    console.log(`새 Todo 생성: ${todo.title}`)
  }
})

// Todo 업데이트
todoActionRegister.register('updateTodo', {
  handler: async ({ id, updates }: { id: string; updates: Partial<Todo> }): Promise<Todo> => {
    const fetchAction = todoActionRegister.get('fetchTodos')
    const todos = await fetchAction?.execute() || []
    
    const todoIndex = todos.findIndex(todo => todo.id === id)
    if (todoIndex === -1) {
      throw new Error(`Todo not found: ${id}`)
    }
    
    const updatedTodo: Todo = {
      ...todos[todoIndex],
      ...updates,
      updatedAt: new Date()
    }
    
    todos[todoIndex] = updatedTodo
    localStorage.setItem('todos', JSON.stringify(todos))
    
    return updatedTodo
  },
  onSuccess: (todo) => {
    console.log(`Todo 업데이트: ${todo.title}`)
  }
})

// Todo 삭제
todoActionRegister.register('deleteTodo', {
  handler: async (id: string): Promise<void> => {
    const fetchAction = todoActionRegister.get('fetchTodos')
    const todos = await fetchAction?.execute() || []
    
    const filteredTodos = todos.filter(todo => todo.id !== id)
    localStorage.setItem('todos', JSON.stringify(filteredTodos))
  },
  onSuccess: () => {
    console.log('Todo 삭제 완료')
  }
})

// Todo 완료 상태 토글
todoActionRegister.register('toggleTodo', {
  handler: async (id: string): Promise<Todo> => {
    const fetchAction = todoActionRegister.get('fetchTodos')
    const updateAction = todoActionRegister.get('updateTodo')
    
    const todos = await fetchAction?.execute() || []
    const todo = todos.find(t => t.id === id)
    
    if (!todo) {
      throw new Error(`Todo not found: ${id}`)
    }
    
    return await updateAction?.execute({
      id,
      updates: { completed: !todo.completed }
    }) as Todo
  }
})

// Todo 필터링
todoActionRegister.register('filterTodos', {
  handler: async (filter: TodoFilter): Promise<Todo[]> => {
    const fetchAction = todoActionRegister.get('fetchTodos')
    const todos = await fetchAction?.execute() || []
    
    return todos.filter(todo => {
      // 카테고리 필터
      if (filter.category && todo.category !== filter.category) {
        return false
      }
      
      // 완료 상태 필터
      if (filter.completed !== undefined && todo.completed !== filter.completed) {
        return false
      }
      
      // 우선순위 필터
      if (filter.priority && todo.priority !== filter.priority) {
        return false
      }
      
      // 검색 필터
      if (filter.search) {
        const searchLower = filter.search.toLowerCase()
        const titleMatch = todo.title.toLowerCase().includes(searchLower)
        const descMatch = todo.description?.toLowerCase().includes(searchLower)
        
        if (!titleMatch && !descMatch) {
          return false
        }
      }
      
      return true
    })
  }
})

// 통계 계산
todoActionRegister.register('getTodoStats', {
  handler: async () => {
    const fetchAction = todoActionRegister.get('fetchTodos')
    const todos = await fetchAction?.execute() || []
    
    const total = todos.length
    const completed = todos.filter(t => t.completed).length
    const pending = total - completed
    
    const byCategory = todos.reduce((acc, todo) => {
      acc[todo.category] = (acc[todo.category] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const byPriority = todos.reduce((acc, todo) => {
      acc[todo.priority] = (acc[todo.priority] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return {
      total,
      completed,
      pending,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      byCategory,
      byPriority
    }
  }
})
```

## React Components

### Main Todo App

```tsx
// components/TodoApp.tsx
import React, { useEffect, useState } from 'react'
import { ActionProvider } from '@context-action/react'
import { todoActionRegister } from '../actions/todoActions'
import { TodoList } from './TodoList'
import { TodoForm } from './TodoForm'
import { TodoFilters } from './TodoFilters'
import { TodoStats } from './TodoStats'
import type { Todo, TodoFilter } from '../types/todo'

export function TodoApp() {
  return (
    <ActionProvider register={todoActionRegister}>
      <div className="todo-app">
        <header className="app-header">
          <h1>Context Action Todo</h1>
          <TodoStats />
        </header>
        
        <main className="app-main">
          <div className="todo-controls">
            <TodoForm />
            <TodoFilters />
          </div>
          
          <div className="todo-content">
            <TodoList />
          </div>
        </main>
      </div>
    </ActionProvider>
  )
}
```

### Todo List Component

```typescript
// components/TodoList.tsx
import React, { useEffect, useState } from 'react'
import { useAction } from '@context-action/react'
import { TodoItem } from './TodoItem'
import type { Todo, TodoFilter } from '../types/todo'

export function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [filter, setFilter] = useState<TodoFilter>({})
  const [loading, setLoading] = useState(false)
  
  const fetchTodos = useAction('fetchTodos')
  const filterTodos = useAction('filterTodos')
  
  // 초기 Todo 목록 로드
  useEffect(() => {
    loadTodos()
  }, [])
  
  // 필터 변경 시 필터링된 목록 업데이트
  useEffect(() => {
    applyFilter()
  }, [filter])
  
  const loadTodos = async () => {
    if (!fetchTodos) return
    
    setLoading(true)
    try {
      const todosData = await fetchTodos.execute()
      setTodos(todosData)
    } catch (error) {
      console.error('Todo 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const applyFilter = async () => {
    if (!filterTodos) return
    
    try {
      const filteredTodos = await filterTodos.execute(filter)
      setTodos(filteredTodos)
    } catch (error) {
      console.error('Todo 필터링 실패:', error)
    }
  }
  
  const handleTodoUpdate = () => {
    // Todo가 업데이트되면 목록 새로고침
    applyFilter()
  }
  
  if (loading) {
    return <div className="loading">Todo 목록을 불러오는 중...</div>
  }
  
  if (todos.length === 0) {
    return (
      <div className="empty-state">
        <h3>Todo가 없습니다</h3>
        <p>새로운 Todo를 추가해보세요!</p>
      </div>
    )
  }
  
  return (
    <div className="todo-list">
      {todos.map(todo => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onUpdate={handleTodoUpdate}
        />
      ))}
    </div>
  )
}
```

### Todo Item Component

```typescript
// components/TodoItem.tsx
import React, { useState } from 'react'
import { useAction } from '@context-action/react'
import type { Todo } from '../types/todo'

interface TodoItemProps {
  todo: Todo
  onUpdate: () => void
}

export function TodoItem({ todo, onUpdate }: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(todo.title)
  const [editDescription, setEditDescription] = useState(todo.description || '')
  
  const toggleTodo = useAction('toggleTodo')
  const updateTodo = useAction('updateTodo')
  const deleteTodo = useAction('deleteTodo')
  
  const handleToggle = async () => {
    if (!toggleTodo) return
    
    try {
      await toggleTodo.execute(todo.id)
      onUpdate()
    } catch (error) {
      console.error('Todo 토글 실패:', error)
    }
  }
  
  const handleSave = async () => {
    if (!updateTodo) return
    
    try {
      await updateTodo.execute({
        id: todo.id,
        updates: {
          title: editTitle,
          description: editDescription
        }
      })
      setIsEditing(false)
      onUpdate()
    } catch (error) {
      console.error('Todo 업데이트 실패:', error)
    }
  }
  
  const handleDelete = async () => {
    if (!deleteTodo) return
    
    if (confirm('정말 삭제하시겠습니까?')) {
      try {
        await deleteTodo.execute(todo.id)
        onUpdate()
      } catch (error) {
        console.error('Todo 삭제 실패:', error)
      }
    }
  }
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#ff4757'
      case 'high': return '#ff7675'
      case 'medium': return '#fdcb6e'
      case 'low': return '#6c5ce7'
      default: return '#74b9ff'
    }
  }
  
  if (isEditing) {
    return (
      <div className="todo-item editing">
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          className="edit-title"
        />
        <textarea
          value={editDescription}
          onChange={(e) => setEditDescription(e.target.value)}
          className="edit-description"
          placeholder="설명 (선택사항)"
        />
        <div className="edit-actions">
          <button onClick={handleSave} className="btn-save">
            저장
          </button>
          <button onClick={() => setIsEditing(false)} className="btn-cancel">
            취소
          </button>
        </div>
      </div>
    )
  }
  
  return (
    <div className={`todo-item ${todo.completed ? 'completed' : ''}`}>
      <div className="todo-checkbox">
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={handleToggle}
        />
      </div>
      
      <div className="todo-content">
        <h3 className="todo-title">{todo.title}</h3>
        {todo.description && (
          <p className="todo-description">{todo.description}</p>
        )}
        
        <div className="todo-meta">
          <span className="todo-category">{todo.category}</span>
          <span 
            className="todo-priority"
            style={{ backgroundColor: getPriorityColor(todo.priority) }}
          >
            {todo.priority}
          </span>
          {todo.dueDate && (
            <span className="todo-due-date">
              {todo.dueDate.toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
      
      <div className="todo-actions">
        <button onClick={() => setIsEditing(true)} className="btn-edit">
          수정
        </button>
        <button onClick={handleDelete} className="btn-delete">
          삭제
        </button>
      </div>
    </div>
  )
}
```

### Todo Form Component

```typescript
// components/TodoForm.tsx
import React, { useState } from 'react'
import { useAction } from '@context-action/react'
import { TodoCategory, TodoPriority } from '../types/todo'

export function TodoForm() {
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<TodoCategory>(TodoCategory.PERSONAL)
  const [priority, setPriority] = useState<TodoPriority>(TodoPriority.MEDIUM)
  const [dueDate, setDueDate] = useState('')
  
  const createTodo = useAction('createTodo')
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!createTodo || !title.trim()) return
    
    try {
      await createTodo.execute({
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        priority,
        completed: false,
        dueDate: dueDate ? new Date(dueDate) : undefined
      })
      
      // 폼 리셋
      setTitle('')
      setDescription('')
      setCategory(TodoCategory.PERSONAL)
      setPriority(TodoPriority.MEDIUM)
      setDueDate('')
      setIsOpen(false)
      
      // 페이지 새로고침으로 목록 업데이트
      window.location.reload()
    } catch (error) {
      console.error('Todo 생성 실패:', error)
    }
  }
  
  if (!isOpen) {
    return (
      <div className="todo-form-toggle">
        <button onClick={() => setIsOpen(true)} className="btn-primary">
          새 Todo 추가
        </button>
      </div>
    )
  }
  
  return (
    <form onSubmit={handleSubmit} className="todo-form">
      <div className="form-group">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Todo 제목을 입력하세요"
          required
          className="form-input"
        />
      </div>
      
      <div className="form-group">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="설명 (선택사항)"
          className="form-textarea"
        />
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <label>카테고리</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as TodoCategory)}
            className="form-select"
          >
            <option value={TodoCategory.PERSONAL}>개인</option>
            <option value={TodoCategory.WORK}>업무</option>
            <option value={TodoCategory.SHOPPING}>쇼핑</option>
            <option value={TodoCategory.HEALTH}>건강</option>
          </select>
        </div>
        
        <div className="form-group">
          <label>우선순위</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as TodoPriority)}
            className="form-select"
          >
            <option value={TodoPriority.LOW}>낮음</option>
            <option value={TodoPriority.MEDIUM}>보통</option>
            <option value={TodoPriority.HIGH}>높음</option>
            <option value={TodoPriority.URGENT}>긴급</option>
          </select>
        </div>
        
        <div className="form-group">
          <label>마감일</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="form-input"
          />
        </div>
      </div>
      
      <div className="form-actions">
        <button type="submit" className="btn-primary">
          Todo 추가
        </button>
        <button type="button" onClick={() => setIsOpen(false)} className="btn-secondary">
          취소
        </button>
      </div>
    </form>
  )
}
```

## Styling

```css
/* styles/TodoApp.css */
.todo-app {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.app-header {
  text-align: center;
  margin-bottom: 2rem;
}

.app-header h1 {
  color: #2c3e50;
  margin-bottom: 1rem;
}

.todo-controls {
  margin-bottom: 2rem;
}

.todo-form {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 1rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 1rem;
}

.form-input, .form-textarea, .form-select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.form-textarea {
  min-height: 80px;
  resize: vertical;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.btn-primary, .btn-secondary {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-primary:hover {
  background: #2980b9;
}

.btn-secondary {
  background: #95a5a6;
  color: white;
}

.btn-secondary:hover {
  background: #7f8c8d;
}

.todo-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.todo-item {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  transition: all 0.2s;
}

.todo-item:hover {
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.todo-item.completed {
  opacity: 0.7;
}

.todo-item.completed .todo-title {
  text-decoration: line-through;
}

.todo-checkbox input {
  width: 1.2rem;
  height: 1.2rem;
}

.todo-content {
  flex: 1;
}

.todo-title {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  color: #2c3e50;
}

.todo-description {
  margin: 0 0 0.75rem 0;
  color: #7f8c8d;
  line-height: 1.4;
}

.todo-meta {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.todo-category, .todo-priority {
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: uppercase;
}

.todo-category {
  background: #ecf0f1;
  color: #2c3e50;
}

.todo-priority {
  color: white;
}

.todo-due-date {
  font-size: 0.85rem;
  color: #e74c3c;
  font-weight: 500;
}

.todo-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-edit, .btn-delete {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-edit {
  background: #f39c12;
  color: white;
}

.btn-edit:hover {
  background: #e67e22;
}

.btn-delete {
  background: #e74c3c;
  color: white;
}

.btn-delete:hover {
  background: #c0392b;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #7f8c8d;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #7f8c8d;
}

.empty-state h3 {
  margin-bottom: 0.5rem;
}
```

이 완전한 Todo 애플리케이션은 Context Action의 모든 주요 기능을 실제 애플리케이션에서 어떻게 활용할 수 있는지 보여줍니다. 상태 관리, 데이터 영속성, 사용자 인터랙션 등 실제 서비스에서 필요한 모든 요소들이 포함되어 있습니다.