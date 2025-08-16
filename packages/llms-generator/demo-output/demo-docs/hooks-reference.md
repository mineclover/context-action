# Hooks Reference

## useActionDispatch
액션을 디스패치하는 훅입니다.

### 매개변수
- `actionType`: 액션 타입
- `payload`: 액션 페이로드

### 반환값
- `dispatch`: 액션 디스패치 함수

### 예시
```typescript
const dispatch = useActionDispatch();
dispatch('updateUser', { id: 1, name: 'John' });
```

## useStoreValue
스토어 값을 구독하는 훅입니다.

### 매개변수
- `store`: 스토어 인스턴스

### 반환값
- 현재 스토어 값
