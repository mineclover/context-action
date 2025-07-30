# 할일 앱 예제

Context Action을 사용한 완전한 할일 관리 애플리케이션 예제입니다.

## 액션 정의

```typescript
// 할일 관련 액션들
const todoActions = {
  'todo/add': async (payload) => {
    // 할일 추가 로직
  },
  'todo/toggle': async (payload) => {
    // 할일 완료/미완료 토글
  },
  'todo/delete': async (payload) => {
    // 할일 삭제
  },
  'todo/fetch': async () => {
    // 할일 목록 조회
  }
}
```

## React 컴포넌트

```tsx
function TodoApp() {
  const [addTodo] = useAction('todo/add')
  const [toggleTodo] = useAction('todo/toggle')
  const [deleteTodo] = useAction('todo/delete')
  
  return (
    <div className="todo-app">
      <TodoForm onAdd={addTodo} />
      <TodoList 
        onToggle={toggleTodo}
        onDelete={deleteTodo}
      />
    </div>
  )
}
```

## 상태 관리

Jotai와 함께 사용하면 더욱 강력한 상태 관리가 가능합니다.