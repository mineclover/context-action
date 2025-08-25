# 성능 패턴

메모이제이션, 배칭, 디버깅, 모범 사례를 포함한 스토어 훅을 위한 성능 최적화 패턴.

## 메모이제이션 전략

### useCallback을 사용한 안정적인 셀렉터

```tsx
import { useCallback } from 'react';

// ✅ 좋음: 안정적인 셀렉터로 불필요한 재렌더링 방지
const userName = useStoreValue(userStore, useCallback(
  user => user.name,
  [] // 안정적인 셀렉터에는 의존성 불필요
));

// ❌ 피해야 함: 매 렌더링마다 새로운 셀렉터 함수 생성
const userName = useStoreValue(userStore, user => user.name);
```

### 복잡한 셀렉터 메모이제이션

```tsx
const processedUserData = useStoreValue(
  userStore,
  useCallback(user => ({
    displayName: `${user.firstName} ${user.lastName}`,
    initials: `${user.firstName[0]}${user.lastName[0]}`,
    status: user.isActive ? 'online' : 'offline',
    joinedDate: new Date(user.createdAt).toLocaleDateString()
  }), [])
);
```

### 메모이제이션된 계산 스토어 의존성

```tsx
const memoizedComputation = useComputedStore(
  [userStore, settingsStore],
  useMemo(() => ([user, settings]) => {
    // 여기서 비용이 많이 드는 계산 수행
    return performComplexCalculation(user, settings);
  }, []),
  {
    comparison: 'shallow'
  }
);
```

## 배치 업데이트

### 스토어 업데이트 배칭

```tsx
import { unstable_batchedUpdates } from 'react-dom';

const handleBulkUpdate = useCallback(async (updates) => {
  // 불필요한 재렌더링 방지를 위해 여러 스토어 업데이트를 배치 처리
  unstable_batchedUpdates(() => {
    const userStore = manager.getStore('user');
    const settingsStore = manager.getStore('settings');
    const profileStore = manager.getStore('profile');
    
    userStore.update(user => ({ ...user, ...updates.user }));
    settingsStore.update(settings => ({ ...settings, ...updates.settings }));
    profileStore.update(profile => ({ ...profile, ...updates.profile }));
  });
}, [manager]);
```

### 스토어 배치 API

```tsx
const updateMultipleStores = useCallback(async (updates) => {
  const userStore = manager.getStore('user');
  
  // 최적 성능을 위해 스토어의 배치 메소드 사용
  userStore.batch(() => {
    userStore.update(user => ({ ...user, ...updates.user }));
    
    // 배치 내에서 다른 스토어 작업
    const profileStore = manager.getStore('profile');
    profileStore.update(profile => ({ ...profile, ...updates.profile }));
    
    const settingsStore = manager.getStore('settings');
    settingsStore.update(settings => ({ ...settings, ...updates.settings }));
  });
}, [manager]);
```

## 지연 평가 패턴

### 지연 상태 접근

```tsx
const handleAction = useCallback(async () => {
  // 렌더링 시점이 아닌 실행 시점에 현재 상태 가져오기
  const userStore = manager.getStore('user');
  const settingsStore = manager.getStore('settings');
  
  const currentUser = userStore.getValue();
  const currentSettings = settingsStore.getValue();
  
  // 최신 상태로 처리
  await processData(currentUser, currentSettings);
}, [manager]);
```

### 조건부 스토어 접근

```tsx
const handleConditionalUpdate = useCallback((condition, data) => {
  if (!condition) return;
  
  // 필요할 때만 스토어 접근
  const dataStore = manager.getStore('data');
  const cacheStore = manager.getStore('cache');
  
  if (dataStore.getValue().shouldUpdate) {
    dataStore.setValue(data);
    cacheStore.update(cache => ({ ...cache, lastUpdated: Date.now() }));
  }
}, [manager]);
```

## 구독 최적화

### 선택적 구독

```tsx
// 특정 필드만 구독
const userName = useStoreValue(userStore, user => user.name);
const userEmail = useStoreValue(userStore, user => user.email);

// 더 나음: 관련 구독을 그룹화
const userBasicInfo = useStoreValue(userStore, user => ({
  name: user.name,
  email: user.email
}));
```

### 조건부 구독

```tsx
const [enableRealTimeUpdates, setEnableRealTimeUpdates] = useState(false);

// 필요할 때만 구독
const liveData = useStoreValue(
  enableRealTimeUpdates ? dataStore : null,
  data => data?.liveMetrics
);
```

### 디바운싱된 구독

```tsx
// 빠른 스토어 변경을 디바운싱
const debouncedValue = useStoreValue(fastChangingStore, undefined, {
  debounce: 300  // 마지막 변경 후 300ms 대기
});

// 검색이나 입력 시나리오에서 사용
const searchResults = useStoreValue(searchStore, search => search.query, {
  debounce: 500
});
```

## 비교 전략 최적화

### 참조 비교 (가장 빠름)

```tsx
// 원시 값이나 정확한 참조가 중요한 경우
const primitiveValue = useStoreValue(store, undefined, {
  comparison: 'reference' // 기본값, 가장 빠름
});
```

### 얕은 비교 (균형)

```tsx
// 얕은 변경이 있는 객체에 대해
const shallowData = useStoreValue(settingsStore, undefined, {
  comparison: 'shallow' // 성능과 정확도의 좋은 균형
});
```

### 깊은 비교 (가장 정확)

```tsx
// 복잡한 중첩 객체에 대해서만 필요한 경우
const deepData = useStoreValue(complexStore, undefined, {
  comparison: 'deep' // 가장 철저하지만 드물게 사용
});
```

### 커스텀 비교

```tsx
const customComparison = useStoreValue(userStore, user => user.profile, {
  customComparator: (prev, next) => {
    // 특정 필드가 변경된 경우에만 업데이트
    return prev.name === next.name && prev.avatar === next.avatar;
  }
});
```

## 메모리 관리

### 구독 정리

```tsx
function UserComponent() {
  const userStore = useAppStore('user');
  
  useEffect(() => {
    // 정리가 포함된 수동 구독
    const unsubscribe = userStore.subscribe((user, prevUser) => {
      // 사용자 변경 처리
      console.log('사용자 변경됨:', { user, prevUser });
    });
    
    // 구독 정리
    return unsubscribe;
  }, [userStore]);
  
  return <div>사용자 컴포넌트</div>;
}
```

### 큰 데이터에 대한 WeakReferences

```tsx
const largeDataCache = new WeakMap();

const processedLargeData = useComputedStore(
  [largeDataStore],
  ([data]) => {
    // 큰 객체 캐싱에 WeakMap 사용
    if (largeDataCache.has(data)) {
      return largeDataCache.get(data);
    }
    
    const processed = expensiveProcessing(data);
    largeDataCache.set(data, processed);
    return processed;
  }
);
```

## 디버깅 및 개발

### 스토어 디버그 모드

```tsx
const debugUser = useStoreValue(userStore, undefined, {
  debug: true,
  debugName: 'UserProfile'
});

// 콘솔 출력:
// [UserProfile] 스토어 값 변경됨: { previous: {...}, current: {...} }
```

### 성능 모니터링

```tsx
const useStorePerformanceMonitor = (storeName) => {
  const [metrics, setMetrics] = useState({
    updateCount: 0,
    lastUpdate: null,
    averageUpdateInterval: 0
  });
  
  const store = useAppStore(storeName);
  
  useEffect(() => {
    const startTime = Date.now();
    let updateCount = 0;
    let lastUpdateTime = startTime;
    
    const unsubscribe = store.subscribe(() => {
      const now = Date.now();
      updateCount++;
      
      setMetrics(prev => ({
        updateCount,
        lastUpdate: now,
        averageUpdateInterval: (now - startTime) / updateCount
      }));
      
      lastUpdateTime = now;
    });
    
    return unsubscribe;
  }, [store]);
  
  return metrics;
};

// 사용법
function MonitoredComponent() {
  const metrics = useStorePerformanceMonitor('user');
  
  if (process.env.NODE_ENV === 'development') {
    console.log('스토어 메트릭:', metrics);
  }
  
  return <div>모니터링이 있는 컴포넌트</div>;
}
```

### 스토어 상태 검사

```tsx
const useStoreDebugger = (stores) => {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    
    const unsubscribers = Object.entries(stores).map(([name, store]) => {
      return store.subscribe((value, previous) => {
        console.group(`🏪 스토어 [${name}] 업데이트됨`);
        console.log('이전:', previous);
        console.log('현재:', value);
        console.log('변경됨:', !Object.is(previous, value));
        console.groupEnd();
      });
    });
    
    return () => unsubscribers.forEach(unsub => unsub());
  }, [stores]);
};

// 사용법
function DebuggedApp() {
  const userStore = useAppStore('user');
  const settingsStore = useAppStore('settings');
  
  useStoreDebugger({
    user: userStore,
    settings: settingsStore
  });
  
  return <div>스토어 디버깅이 있는 앱</div>;
}
```

## 실제 최적화 예제

### 최적화된 사용자 대시보드

```tsx
function OptimizedUserDashboard() {
  // 비용이 많이 드는 셀렉터 메모이제이션
  const userStats = useStoreValue(
    userStore,
    useCallback(user => ({
      name: user.name,
      totalOrders: user.orders?.length || 0,
      totalSpent: user.orders?.reduce((sum, order) => sum + order.total, 0) || 0,
      memberSince: new Date(user.createdAt).getFullYear()
    }), [])
  );
  
  // 설정에 얕은 비교 사용
  const displaySettings = useStoreValue(settingsStore, undefined, {
    comparison: 'shallow'
  });
  
  // 검색 업데이트 디바운싱
  const searchResults = useStoreValue(searchStore, search => search.results, {
    debounce: 300
  });
  
  return (
    <div>
      <h1>{userStats.name}님, 환영합니다!</h1>
      <div>주문: {userStats.totalOrders}</div>
      <div>총 지출: ${userStats.totalSpent}</div>
    </div>
  );
}
```

### 고성능 데이터 테이블

```tsx
function OptimizedDataTable() {
  // 비용이 많이 드는 필터링/정렬을 위한 계산 스토어 사용
  const processedData = useComputedStore(
    [dataStore, filtersStore, sortStore],
    ([data, filters, sort]) => {
      let filtered = data;
      
      // 필터 적용
      if (filters.searchTerm) {
        filtered = filtered.filter(item =>
          item.name.toLowerCase().includes(filters.searchTerm.toLowerCase())
        );
      }
      
      if (filters.category !== 'all') {
        filtered = filtered.filter(item => item.category === filters.category);
      }
      
      // 정렬 적용
      if (sort.field) {
        filtered.sort((a, b) => {
          const aValue = a[sort.field];
          const bValue = b[sort.field];
          const result = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
          return sort.direction === 'desc' ? -result : result;
        });
      }
      
      return filtered;
    },
    {
      comparison: 'shallow',
      cacheKey: 'table-data'
    }
  );
  
  return (
    <table>
      {processedData.map(item => (
        <tr key={item.id}>
          <td>{item.name}</td>
          <td>{item.category}</td>
        </tr>
      ))}
    </table>
  );
}
```

## 모범 사례 요약

### ✅ 해야 할 것

- 안정적인 셀렉터에 `useCallback` 사용
- 여러 스토어 업데이트 배칭
- 적절한 비교 전략 선택
- 개발 환경에서 디버그 모드 활성화
- 복잡한 애플리케이션에서 성능 모니터링
- 비용이 많이 드는 작업에 지연 평가 사용

### ❌ 피해야 할 것

- 매 렌더링마다 셀렉터에서 새로운 함수 생성
- 절대 필요하지 않은 경우 깊은 비교
- 부분만 필요할 때 큰 객체 전체를 구독
- 구독 정리 무시
- 계산된 값에서 부작용
- 프로덕션에서 과도한 디버깅

## 관련 패턴

- [useStoreValue 패턴](./useStoreValue-patterns.md) - 기본 구독 패턴
- [useStoreSelector 패턴](./useStoreSelector-patterns.md) - 다중 스토어 선택
- [useComputedStore 패턴](./useComputedStore-patterns.md) - 계산된 값 패턴