# createStore

## 개요

createStore is a core API in the Context-Action framework that provides essential functionality for the Context-Action framework.

### 주요 기능
- ✨ Core framework functionality

### 사용 시점
Use this API as part of the Context-Action framework integration.


## 빠른 시작

가장 간단한 사용 방법: createStore:

```typescript
const config = createStoreConfig({
});
```

> should create store config with default validator


## 사용 예제

### 기본 사용법

#### Example 1: should create store config with default validator

```typescript
const config = createStoreConfig({
});
```

#### Example 2: should preserve transform function

```typescript
const transform = (value: unknown) => String(value);
const config = createStoreConfig({
});
```

#### Example 3: should create store with correct type and initial value

```typescript
const stringStore = createStore('string', 'initial');
const numberStore = createStore('number', 42);
const objectStore = createStore('object', { test: true });
stringStore.dispose();
numberStore.dispose();
objectStore.dispose();
```



## 고급 사용법

### 고급 패턴

#### should export Store class and createStore

```typescript

```

#### should export createStoreContext and StoreManager

```typescript

```



## 에러 처리

적절한 에러 처리 패턴 예제:

### should export error boundary components

```typescript

```

### should handle transformation errors gracefully

```typescript
const store = createStore('transform-test', 'initial');
const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
store.setValue(mockEvent as any, {
  eventTransform: () => {
    throw new Error('Transform error');
  }
});
consoleErrorSpy.mockRestore();
store.dispose();
```





## 테스트 커버리지

이 API는 철저하게 테스트되었습니다. **81 test cases** covering:

- ✅ Basic functionality and usage patterns
- ✅ Error conditions and edge cases
- ✅ Performance characteristics
- ✅ Integration scenarios
- ✅ Type safety validation

### Test Files
다음 테스트 파일들이 이 API를 검증합니다:

- [Comprehensive Tests](../../packages/react/__tests__/)
- [Type Safety Tests](../../packages/react/__tests__/type-safety/)
- [Performance Tests](../../packages/react/__tests__/performance/)

## Type Safety

이 API는 다음과 같은 완전한 TypeScript 지원을 제공합니다:
- 🎯 **Strict type checking** - Compile-time error prevention
- 🔍 **Intelligent IntelliSense** - Auto-completion and documentation
- 🛡️ **Runtime validation** - Payload and parameter validation
- 📝 **Self-documenting code** - Types serve as documentation




---

*이 문서는 테스트 코드를 기반으로 자동 생성되어 정확성과 완성도를 보장합니다.*

**Need help?** Check the [troubleshooting guide](../troubleshooting/) or [open an issue](https://github.com/mineclover/context-action/issues).
