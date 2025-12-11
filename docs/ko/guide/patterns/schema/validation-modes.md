# 검증 모드

dispatch 시 ActionRegister가 검증 에러를 처리하는 방식을 설정합니다.

## 사용 가능한 모드

### strict (기본값)

검증 실패 시 `ActionValidationError`를 throw합니다. 핸들러가 실행되지 않습니다.

```typescript
const { Provider } = createActionContext<MyActions>('App', {
  schema: mySchema,
  registry: {
    validationMode: 'strict',
  },
});

// 사용
try {
  await dispatch('updateUser', { id: '', name: 'A' }); // 유효하지 않음
} catch (error) {
  if (isActionValidationError(error)) {
    console.log(error.action);    // 'updateUser'
    console.log(error.firstError); // 첫 번째 검증 메시지
    console.log(error.issues);     // 모든 검증 이슈
  }
}
```

### warn

경고를 로그하지만 핸들러 실행을 계속합니다.

```typescript
const { Provider } = createActionContext<MyActions>('App', {
  schema: mySchema,
  registry: {
    validationMode: 'warn',
  },
});

// 콘솔 출력: Action "updateUser" payload validation failed: ...
// 핸들러는 유효하지 않은 페이로드로 계속 실행됨
await dispatch('updateUser', { id: '', name: 'A' });
```

### silent

검증 에러를 완전히 무시합니다. 핸들러는 잠재적으로 유효하지 않은 페이로드로 실행됩니다.

```typescript
const { Provider } = createActionContext<MyActions>('App', {
  schema: mySchema,
  registry: {
    validationMode: 'silent',
  },
});

// 에러 없음, 경고 없음, 핸들러 실행됨
await dispatch('updateUser', { id: '', name: 'A' });
```

## 검증 비활성화

스키마 메타데이터를 유지하면서 검증을 완전히 비활성화하려면:

```typescript
const { Provider } = createActionContext<MyActions>('App', {
  schema: mySchema,
  registry: {
    validateOnDispatch: false, // 검증 비활성화
  },
});
```

## 권장 설정

### 개발 환경

`strict` 모드를 사용하여 검증 에러를 조기에 발견합니다:

```typescript
const config = {
  schema: mySchema,
  registry: {
    validationMode: 'strict',
  },
};
```

### 프로덕션 환경

크래시를 방지하기 위해 `warn` 또는 `silent` 사용을 고려하세요:

```typescript
const config = {
  schema: mySchema,
  registry: {
    validationMode: process.env.NODE_ENV === 'production' ? 'warn' : 'strict',
  },
};
```

### 테스트

`strict` 모드를 사용하고 에러를 명시적으로 catch합니다:

```typescript
it('유효하지 않은 페이로드를 거부해야 함', async () => {
  await expect(
    dispatch('updateUser', { id: '', name: 'A' })
  ).rejects.toThrow(ActionValidationError);
});
```

## 스키마 없는 액션

스키마에 정의되지 않은 액션은 검증되지 않습니다:

```typescript
const schema = createActionSchema({
  updateUser: defineAction({ ... }, z),
  // deleteUser는 스키마에 없음
});

const { Provider } = createActionContext<MyActions>('App', {
  schema,
  registry: { validationMode: 'strict' },
});

// updateUser는 검증됨
await dispatch('updateUser', { ... }); // 검증됨

// deleteUser는 검증되지 않음 (스키마에 없음)
await dispatch('deleteUser', { ... }); // 검증 없음
```

## 성능 고려사항

- 검증은 활성화된 경우 매 dispatch마다 실행됨
- 고빈도 액션의 경우 `validateOnDispatch: false` 고려
- 스키마 정의는 한 번 생성되어 재사용됨
