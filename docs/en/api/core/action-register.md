# ActionRegister

`ActionRegister`는 Context Action의 핵심 클래스로, 액션을 등록하고 관리하는 역할을 합니다.

## 생성자

```typescript
new ActionRegister()
```

## 메서드

### register()

새로운 액션을 등록합니다.

```typescript
register<T, R>(name: string, config: ActionConfig<T, R>): Action<T, R>
```

**매개변수:**
- `name`: 액션의 고유 이름
- `config`: 액션 설정 객체

**반환값:**
- 등록된 `Action` 인스턴스

**예제:**

```typescript
const userAction = actionRegister.register('fetchUser', {
  handler: async (userId: string) => {
    const response = await fetch(`/api/users/${userId}`)
    return response.json()
  },
  onSuccess: (user) => {
    console.log('사용자 로드 완료:', user.name)
  },
  onError: (error) => {
    console.error('사용자 로드 실패:', error)
  }
})
```

### get()

등록된 액션을 가져옵니다.

```typescript
get(name: string): Action | undefined
```

### getAll()

모든 등록된 액션을 가져옵니다.

```typescript
getAll(): Map<string, Action>
```

### unregister()

액션 등록을 해제합니다.

```typescript
unregister(name: string): boolean
```

## 관련 문서

- [Types](/api/core/types) - ActionConfig 및 관련 타입
- [Utilities](/api/core/utilities) - 유틸리티 함수들