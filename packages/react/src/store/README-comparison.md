# Store Enhanced Comparison System

Store의 강화된 값 비교 시스템으로 불필요한 리렌더링을 방지하고 성능을 최적화할 수 있습니다.

## 개요

기존의 `Object.is()` 기반 참조 비교에서 발전하여, 다양한 비교 전략을 제공합니다:

- **참조 비교** (Reference): 기본값, 가장 빠름
- **얕은 비교** (Shallow): 1레벨 프로퍼티 비교
- **깊은 비교** (Deep): 모든 중첩 프로퍼티 비교
- **커스텀 비교** (Custom): 사용자 정의 비교 로직
- **빠른 비교** (Fast): 성능 최적화된 하이브리드 비교

## 기본 사용법

### 1. Store별 비교 옵션 설정

```typescript
import { createStore, ComparisonStrategy } from '@context-action/react';

// 얕은 비교 사용
const userStore = createStore('user', { name: '', email: '' });
userStore.setComparisonOptions({ strategy: 'shallow' });

// 깊은 비교 사용
const nestedStore = createStore('nested', { user: { profile: { name: '' } } });
nestedStore.setComparisonOptions({ 
  strategy: 'deep', 
  maxDepth: 3 
});

// 특정 키 무시하고 얕은 비교
const stateStore = createStore('state', { data: {}, timestamp: 0 });
stateStore.setComparisonOptions({ 
  strategy: 'shallow',
  ignoreKeys: ['timestamp'] 
});
```

### 2. 커스텀 비교 함수

```typescript
interface User {
  id: string;
  name: string;
  lastLogin: Date;
}

const userStore = createStore<User>('user', {
  id: '1',
  name: 'John',
  lastLogin: new Date()
});

// ID만 비교하는 커스텀 로직 (lastLogin 변경은 무시)
userStore.setCustomComparator((oldUser, newUser) => 
  oldUser.id === newUser.id && oldUser.name === newUser.name
);
```

### 3. 전역 비교 설정

```typescript
import { setGlobalComparisonOptions } from '@context-action/react';

// 모든 Store에 기본적으로 얕은 비교 적용
setGlobalComparisonOptions({ strategy: 'shallow' });

// Store별 설정이 전역 설정을 오버라이드
const store = createStore('test', {});
store.setComparisonOptions({ strategy: 'deep' }); // 이 Store만 깊은 비교
```

## 실제 사용 시나리오

### 사용자 프로필 관리

```typescript
interface UserProfile {
  id: string;
  name: string;
  email: string;
  lastLogin: Date;
  preferences: {
    theme: 'light' | 'dark';
    notifications: boolean;
  };
}

const userProfileStore = createStore<UserProfile>('userProfile', initialProfile);

// 핵심 프로필 정보만 비교 (lastLogin 제외)
userProfileStore.setCustomComparator((old, newVal) => 
  old.id === newVal.id && 
  old.name === newVal.name && 
  old.email === newVal.email &&
  old.preferences.theme === newVal.preferences.theme &&
  old.preferences.notifications === newVal.preferences.notifications
);
```

### 쇼핑카트 아이템 관리

```typescript
interface CartItem {
  id: string;
  quantity: number;
  price: number;
}

const cartStore = createStore<CartItem[]>('cart', []);

// 배열과 객체를 정확히 비교하되 깊이 제한
cartStore.setComparisonOptions({ 
  strategy: 'deep',
  maxDepth: 2 // 배열 + 객체 = 2레벨
});
```

### 대용량 데이터 최적화

```typescript
const largeDataStore = createStore('largeData', hugeArray);

// 성능을 위해 참조 비교만 사용
largeDataStore.setComparisonOptions({ strategy: 'reference' });

// 또는 빠른 비교 (기본값) - 작은 변경사항은 감지하되 큰 데이터는 참조 비교
// 별도 설정 없이 사용하면 자동으로 최적화된 비교 사용
```

### 실시간 데이터 스트림

```typescript
interface StreamData {
  id: string;
  data: any[];
  timestamp: number;
  metadata: {
    source: string;
    version: number;
  };
}

const streamStore = createStore<StreamData>('stream', initialData);

// timestamp와 metadata.version은 무시하고 핵심 데이터만 비교
streamStore.setCustomComparator((old, newVal) => 
  old.id === newVal.id && 
  JSON.stringify(old.data) === JSON.stringify(newVal.data) &&
  old.metadata.source === newVal.metadata.source
);
```

## API 참조

### ComparisonOptions 인터페이스

```typescript
interface ComparisonOptions<T = any> {
  strategy: 'reference' | 'shallow' | 'deep' | 'custom';
  customComparator?: (oldValue: T, newValue: T) => boolean;
  maxDepth?: number;              // 깊은 비교 시 최대 깊이 (기본: 5)
  ignoreKeys?: string[];          // 무시할 키 목록
  enableCircularCheck?: boolean;  // 순환 참조 체크 (기본: true)
}
```

### Store 메서드

```typescript
// 비교 옵션 설정
store.setComparisonOptions(options: Partial<ComparisonOptions<T>>): void

// 커스텀 비교 함수 설정
store.setCustomComparator(comparator: (oldValue: T, newValue: T) => boolean): void

// 현재 설정 조회
store.getComparisonOptions(): Partial<ComparisonOptions<T>> | undefined

// 설정 해제 (전역 설정 사용)
store.clearComparisonOptions(): void
store.clearCustomComparator(): void
```

### 유틸리티 함수

```typescript
// 직접 값 비교
compareValues(oldValue, newValue, options?)

// 성능 최적화된 빠른 비교
fastCompare(oldValue, newValue)

// 개별 비교 함수들
referenceEquals(a, b)
shallowEquals(a, b, ignoreKeys?)
deepEquals(a, b, options?)

// Store용 비교 함수 생성기
createStoreComparator(options)

// 성능 측정
measureComparison(oldValue, newValue, options)
```

## 성능 가이드라인

### 전략 선택 가이드

1. **참조 비교**: 원시 타입, 불변 객체, 대용량 데이터
2. **빠른 비교**: 대부분의 일반적인 경우 (기본값)
3. **얕은 비교**: 플랫한 객체, 간단한 상태
4. **깊은 비교**: 중첩 객체, 복잡한 데이터 구조
5. **커스텀 비교**: 특별한 비즈니스 로직이 필요한 경우

### 성능 최적화 팁

```typescript
// ✅ 좋은 예: 작은 객체에 얕은 비교
const settingsStore = createStore('settings', { theme: 'dark', language: 'ko' });
settingsStore.setComparisonOptions({ strategy: 'shallow' });

// ✅ 좋은 예: 특정 필드만 중요한 경우 커스텀 비교
const userStore = createStore('user', user);
userStore.setCustomComparator((old, newVal) => old.id === newVal.id);

// ❌ 피해야 할 예: 대용량 배열에 깊은 비교
const hugeArrayStore = createStore('huge', largeArray);
hugeArrayStore.setComparisonOptions({ strategy: 'deep' }); // 성능 문제

// ✅ 개선된 예: 대용량 데이터는 참조 비교 또는 커스텀 로직
hugeArrayStore.setCustomComparator((old, newVal) => old.length === newVal.length);
```

### 모니터링

```typescript
// 비교 성능 측정
const metrics = measureComparison(oldValue, newValue, { strategy: 'deep' });
console.log(`Comparison took ${metrics.duration}ms`);

// 느린 비교 감지 (1ms 이상 시 자동 경고)
// Store에서 자동으로 모니터링하며 콘솔에 경고 출력
```

## 주의사항

1. **순환 참조**: 깊은 비교 시 순환 참조가 있는 객체는 자동으로 감지하여 처리됩니다.
2. **메모리 사용**: 깊은 비교는 더 많은 메모리를 사용할 수 있습니다.
3. **성능 모니터링**: 1ms 이상 걸리는 비교는 자동으로 경고가 출력됩니다.
4. **커스텀 함수**: 커스텀 비교 함수에서 에러가 발생하면 자동으로 참조 비교로 fallback됩니다.

## 마이그레이션 가이드

기존 코드는 변경 없이 그대로 작동합니다. 성능 최적화가 필요한 부분에만 선택적으로 적용하세요:

```typescript
// 기존 코드 (변경 없음)
const store = createStore('test', initialValue);

// 성능 최적화가 필요한 경우에만 추가
store.setComparisonOptions({ strategy: 'shallow' });
```