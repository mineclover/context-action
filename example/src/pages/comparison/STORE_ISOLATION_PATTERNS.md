# Store 격리 패턴 가이드

Context-Action 프레임워크에서 StoreRegistry를 활용한 이름 기반 Store 격리 패턴과 모범 사례를 제공합니다.

## 🎯 이름 기반 격리의 중요성

StoreRegistry를 활용한 이름 기반 Store 격리는 다음과 같은 장점을 제공합니다:
- **안정성**: 같은 이름으로 접근하면 항상 동일한 Store 인스턴스 반환
- **자연스러운 격리**: Registry에서 이름을 기준으로 Store가 자동 관리됨
- **중복 생성 방지**: 이미 등록된 Store는 재사용하여 효율성 향상
- **메모리 효율성**: Registry에서 통합 관리로 메모리 누수 방지

## 이름 기반 격리 패턴

### 1. 기본 이름 기반 Store 사용

```typescript
import { useIsolatedStore, useStoreValue } from '@context-action/react';

function UserComponent({ userId }: { userId: string }) {
  // 이름 기반으로 안정적인 Store 사용
  // StoreRegistry에서 찾고, 없으면 생성
  const userStore = useIsolatedStore(
    `user-${userId}`, // Store 이름 (Registry에서 찾는 기준)
    { id: userId, name: '', email: '' }, // 초기값 (이미 있으면 무시)
    { strategy: 'shallow', debug: true }  // Store 옵션
  );
  
  const user = useStoreValue(userStore);
  
  return (
    <div>
      <h2>User: {user.name}</h2>
      <button onClick={() => userStore.setValue({ ...user, name: 'Updated' })}>
        Update User
      </button>
    </div>
  );
}
```

### 2. 지연 초기화 이름 기반 Store

```typescript
import { useLazyIsolatedStore, useStoreValue } from '@context-action/react';

function HeavyDataComponent({ dataId }: { dataId: string }) {
  // 이름 기반으로 Store를 찾고, 없을 때만 무거운 초기화 수행
  const dataStore = useLazyIsolatedStore(
    `data-${dataId}`, // Store 이름
    () => {
      // 이미 Store가 있으면 실행되지 않음
      console.log('무거운 데이터 로딩 중...');
      return processLargeDataSet(dataId);
    },
    { strategy: 'deep' } // 옵션
  );
  
  const data = useStoreValue(dataStore);
  
  return (
    <div>
      <h3>Data ID: {dataId}</h3>
      <p>Items: {data.items?.length || 0}</p>
    </div>
  );
}
```

### 3. 조건부 격리 Store

```typescript
import { useConditionalIsolatedStore, useStoreValue } from '@context-action/react';

function ConditionalComponent({ 
  shouldIsolate, 
  globalStore,
  userId 
}: { 
  shouldIsolate: boolean; 
  globalStore: Store<UserData>;
  userId: string;
}) {
  const store = useConditionalIsolatedStore(
    `conditional-user-${userId}`, // Store 이름
    shouldIsolate ? 'isolated' : 'shared', // 모드
    { name: '', email: '' }, // 초기값
    shouldIsolate ? undefined : globalStore, // 공유 Store
    { strategy: 'shallow' } // 옵션
  );
  
  const value = useStoreValue(store);
  
  return (
    <div>
      <span>{shouldIsolate ? '🔒 격리된' : '🤝 공유된'}</span>
      <p>Name: {value.name}</p>
    </div>
  );
}
```

## 안전 가이드라인

### 1. 의미 있는 Store 이름 사용

```typescript
// ✓ 좋은 예시: 도메인-식별자 형식
const userStore = useIsolatedStore(`user-${userId}`, ...);
const settingsStore = useIsolatedStore(`settings-${componentId}`, ...);
const cacheStore = useIsolatedStore(`cache-api-${endpoint}`, ...);

// ✗ 나쁜 예시: 모호하거나 충돌 가능성
const userStore = useIsolatedStore('user', ...);
const genericStore = useIsolatedStore('data', ...);
const tempStore = useIsolatedStore('temp', ...);
```

### 2. StoreRegistry 기반 안정성

```typescript
// ✓ 좋은 예시: 이름 기반 안정성
function MyComponent({ userId }: { userId: string }) {
  // 같은 이름으로 여러 번 호출해도 동일한 Store 반환
  const userStore1 = useIsolatedStore(`user-${userId}`, { name: 'Initial' });
  const userStore2 = useIsolatedStore(`user-${userId}`, { name: 'Different' }); // 무시됨
  
  console.log(userStore1 === userStore2); // true - 동일
  
  return <div>...</div>;
}

// ✓ 좋은 예시: 컴포넌트 전달도 안전
function ParentComponent() {
  const userStore = useIsolatedStore('shared-user', { name: 'Parent' });
  
  return (
    <div>
      <ChildComponent userStore={userStore} />
      <AnotherChild /> {/* 내부에서 동일한 이름으로 접근 가능 */}
    </div>
  );
}

function AnotherChild() {
  // 동일한 Store에 접근
  const sameStore = useIsolatedStore('shared-user', { name: 'Child' }); // 무시됨
  return <div>...</div>;
}
```

### 3. 메모리 누수 방지

```typescript
// ✓ 좋은 예시: 안전한 참조
function ListComponent({ items }: { items: Item[] }) {
  return (
    <div>
      {items.map(item => (
        <ItemComponent key={item.id} itemId={item.id} />
      ))}
    </div>
  );
}

function ItemComponent({ itemId }: { itemId: string }) {
  // Registry에서 관리되므로 안전
  const itemStore = useIsolatedStore(`item-${itemId}`, ...);
  
  return <div>...</div>;
}

// ✓ 좋은 예시: 명시적 정리가 필요한 경우
function ComponentWithExplicitCleanup() {
  const registry = useStoreRegistry();
  
  useEffect(() => {
    return () => {
      // 특수한 경우에만 명시적 정리
      registry.unregister('specific-store-name');
    };
  }, []);
  
  return <div>...</div>;
}
```

## 성능 최적화

### 1. 비교 전략 선택

```typescript
// 기본형 데이터: reference 비교 (가장 빠름)
const counterStore = useIsolatedStore(
  'counter', 
  0,
  { strategy: 'reference' } // 기본값
);

// 얕은 객체: shallow 비교 (균형)
const userStore = useIsolatedStore(
  `user-${userId}`,
  { id: userId, name: '', settings: {} },
  { strategy: 'shallow' }
);

// 중첩 객체: deep 비교 (가장 정확)
const configStore = useIsolatedStore(
  'complex-config',
  { ui: { theme: 'dark', layout: { sidebar: true } } },
  { strategy: 'deep' }
);
```

### 2. 지연 초기화 활용

```typescript
// 무거운 데이터 로딩
const heavyDataStore = useLazyIsolatedStore(
  `heavy-data-${id}`,
  () => {
    // 이 함수는 Store가 Registry에 없을 때만 실행
    return processLargeDataSet(id);
  },
  { strategy: 'deep' }
);

// API 호출 지연
const apiDataStore = useLazyIsolatedStore(
  `api-data-${endpoint}`,
  async () => {
    // Registry에 이미 있으면 호출되지 않음
    const response = await fetch(endpoint);
    return response.json();
  },
  { strategy: 'shallow' }
);

// 조건부 지연 초기화
const conditionalStore = useLazyIsolatedStore(
  `conditional-${userId}`,
  () => {
    // 복잡한 초기화 로직
    if (shouldProcessHeavyData) {
      return processHeavyData(userId);
    }
    return getDefaultData();
  },
  { strategy: 'reference' }
);
```

## 모니터링 및 디버깅

### 1. Store 상태 모니터링

```typescript
import { 
  useStoreIsolationMonitoring, 
  useStoreRegistry 
} from '@context-action/react';

function MonitoringComponent() {
  const userStore = useIsolatedStore('user-123', { name: '' });
  const settingsStore = useIsolatedStore('settings-123', { theme: 'light' });
  const registry = useStoreRegistry();
  
  const monitoring = useStoreIsolationMonitoring(
    [userStore, settingsStore],
    {
      trackPerformance: true,
      logUpdates: true
    }
  );
  
  return (
    <div>
      <h3>모니터링 대시보드</h3>
      <p>Registry 이름: {registry.name}</p>
      <p>전체 Store 수: {registry.getStoreCount()}</p>
      <p>모니터링 Store: {monitoring.storeCount}</p>
      <p>총 리스너: {monitoring.totalListeners}</p>
      <p>평균 업데이트 시간: {monitoring.averageUpdateTime}ms</p>
      
      <details>
        <summary>Registry Store 목록</summary>
        <ul>
          {registry.getStoreNames().map(name => (
            <li key={name}>{name}</li>
          ))}
        </ul>
      </details>
    </div>
  );
}
```

### 2. 디버깅 모드

```typescript
// 개발 모드에서 디버깅 정보 표시
const debugStore = useIsolatedStore(
  'debug-store',
  { count: 0, data: [] },
  { 
    strategy: 'shallow',
    debug: true // 콘솔에 Store 생성/사용 로그 출력
  }
);

// 성능 추적 활성화
const performanceStore = useIsolatedStore(
  'performance-store',
  complexInitialData,
  { 
    strategy: 'deep',
    debug: true,
    comparisonOptions: {
      trackMetrics: true // 비교 메트릭 추적
    }
  }
);

// Registry 상태 디버깅
function RegistryDebugComponent() {
  const registry = useStoreRegistry();
  
  if (process.env.NODE_ENV === 'development') {
    console.log('Registry Debug Info:', {
      name: registry.name,
      storeCount: registry.getStoreCount(),
      storeNames: registry.getStoreNames(),
      stores: registry.getAllStores()
    });
  }
  
  return <div>Registry Debug Component</div>;
}
```

## 모범 사례 모음

### 사용자 프로필 관리 (이름 기반)

```typescript
function UserProfileManager({ userId }: { userId: string }) {
  // 사용자별 격리된 Store
  const userStore = useIsolatedStore(
    `user-profile-${userId}`,
    { id: userId, name: '', email: '', preferences: {} },
    { strategy: 'shallow' }
  );
  
  // 설정별 격리된 Store  
  const settingsStore = useIsolatedStore(
    `user-settings-${userId}`,
    { theme: 'light', notifications: true, privacy: {} },
    { strategy: 'deep' }
  );
  
  const user = useStoreValue(userStore);
  const settings = useStoreValue(settingsStore);
  
  return (
    <div className="user-profile">
      <UserInfo user={user} onUpdate={userStore.setValue} />
      <UserSettings settings={settings} onChange={settingsStore.setValue} />
    </div>
  );
}

// 다른 컴포넌트에서도 동일한 Store에 안전하게 접근
function UserQuickAccess({ userId }: { userId: string }) {
  // 동일한 이름으로 동일한 Store 사용
  const userStore = useIsolatedStore(
    `user-profile-${userId}`,
    {}, // 이미 있으므로 무시됨
    { strategy: 'shallow' }
  );
  
  const user = useStoreValue(userStore);
  
  return (
    <div className="user-quick-access">
      <span>Hello, {user.name}!</span>
    </div>
  );
}
```

### 대시보드 데이터 관리 (지연 초기화 활용)

```typescript
function DashboardContainer() {
  // 대시보드 데이터
  const dashboardStore = useIsolatedStore(
    'dashboard-data',
    { widgets: [], layout: 'grid', filters: {} },
    { strategy: 'shallow' }
  );
  
  // 실시간 데이터 (지연 초기화 - WebSocket 연결이 한 번만 실행됨)
  const realtimeStore = useLazyIsolatedStore(
    'realtime-data',
    () => {
      console.log('WebSocket 연결 시작...'); // 한 번만 실행
      return connectToWebSocket();
    },
    { strategy: 'reference' }
  );
  
  // API 캐시 (지연 초기화)
  const cacheStore = useLazyIsolatedStore(
    'dashboard-cache',
    async () => {
      console.log('API 캐시 초기화...'); // 한 번만 실행
      const responses = await Promise.all([
        fetch('/api/widgets'),
        fetch('/api/analytics'),
        fetch('/api/user-preferences')
      ]);
      return {
        widgets: await responses[0].json(),
        analytics: await responses[1].json(),
        preferences: await responses[2].json(),
        lastFetch: Date.now()
      };
    },
    { strategy: 'deep' }
  );
  
  return (
    <Dashboard
      data={useStoreValue(dashboardStore)}
      realtime={useStoreValue(realtimeStore)}
      cache={useStoreValue(cacheStore)}
    />
  );
}

// 다른 컴포넌트에서 동일한 캐시 사용
function DashboardSidebar() {
  // 동일한 캐시 Store 사용 (지연 초기화 함수는 실행되지 않음)
  const cacheStore = useLazyIsolatedStore(
    'dashboard-cache',
    () => {
      console.log('이 로그는 출력되지 않음'); // 이미 Store가 있음
      return {};
    },
    { strategy: 'deep' }
  );
  
  const cache = useStoreValue(cacheStore);
  
  return (
    <aside>
      <h3>대시보드 요약</h3>
      <p>마지막 업데이트: {new Date(cache.lastFetch).toLocaleString()}</p>
    </aside>
  );
}
```

## 핵심 원칙 요약

1. **이름으로 Store 관리**: Registry에서 이름을 기준으로 Store를 찾고 재사용
2. **중복 생성 방지**: 같은 이름의 Store는 한 번만 생성되어 자동으로 재사용
3. **안정적인 참조**: 이름이 같으면 항상 동일한 Store 인스턴스 반환
4. **지연 초기화 활용**: 무거운 작업은 Store가 없을 때만 실행하여 성능 최적화
5. **의미 있는 네이밍**: 도메인-식별자 형식으로 명확하고 충돌 없는 이름 사용

이러한 패턴을 따르면 안전하고 효율적인 Store 격리를 달성할 수 있습니다.