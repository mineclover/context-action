# 성능 최적화

Context-Action 프레임워크에서의 성능 최적화는 반응형 상태 관리, 핸들러 실행, 그리고 컴포넌트 렌더링의 효율성을 극대화하는 것입니다. 이 가이드는 실제 애플리케이션에서 검증된 최적화 기법을 제공합니다.

## 기본 성능 원칙

### 1. 측정 기반 최적화

```typescript
// 성능 측정 유틸리티
class PerformanceProfiler {
  private static measurements = new Map<string, number[]>();
  
  static measure<T>(label: string, fn: () => T): T {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    
    const measurements = this.measurements.get(label) || [];
    measurements.push(end - start);
    this.measurements.set(label, measurements);
    
    // 최근 100개 측정값만 유지
    if (measurements.length > 100) {
      measurements.shift();
    }
    
    return result;
  }
  
  static async measureAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    
    const measurements = this.measurements.get(label) || [];
    measurements.push(end - start);
    this.measurements.set(label, measurements);
    
    return result;
  }
  
  static getStats(label: string) {
    const measurements = this.measurements.get(label) || [];
    if (measurements.length === 0) return null;
    
    const avg = measurements.reduce((sum, val) => sum + val, 0) / measurements.length;
    const max = Math.max(...measurements);
    const min = Math.min(...measurements);
    
    return { average: avg, max, min, count: measurements.length };
  }
  
  static getAllStats() {
    const stats = {};
    for (const [label, measurements] of this.measurements) {
      stats[label] = this.getStats(label);
    }
    return stats;
  }
}

// 사용법
const loginHandler = useCallback(async (payload, controller) => {
  return await PerformanceProfiler.measureAsync('user-login', async () => {
    // 로그인 로직
    return await performLogin(payload);
  });
}, []);
```

### 2. 성능 모니터링 대시보드

```typescript
// 개발 환경 성능 모니터
function PerformanceDashboard() {
  const [stats, setStats] = useState({});
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    if (!process.env.NODE_ENV === 'development') return;
    
    const interval = setInterval(() => {
      setStats(PerformanceProfiler.getAllStats());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  if (!process.env.NODE_ENV === 'development' || !isVisible) {
    return (
      <button 
        className="perf-toggle"
        onClick={() => setIsVisible(true)}
        style={{
          position: 'fixed',
          bottom: '10px',
          right: '10px',
          zIndex: 9999
        }}
      >
        📊
      </button>
    );
  }
  
  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      width: '400px',
      maxHeight: '300px',
      backgroundColor: 'rgba(0,0,0,0.9)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      fontFamily: 'monospace',
      overflow: 'auto',
      zIndex: 9999
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        <h4>성능 통계</h4>
        <button onClick={() => setIsVisible(false)}>×</button>
      </div>
      
      {Object.entries(stats).map(([label, stat]: [string, any]) => (
        <div key={label} style={{ marginBottom: '8px' }}>
          <div><strong>{label}</strong></div>
          <div>평균: {stat?.average?.toFixed(2)}ms</div>
          <div>최대: {stat?.max?.toFixed(2)}ms</div>
          <div>최소: {stat?.min?.toFixed(2)}ms</div>
          <div>호출: {stat?.count}회</div>
          <hr style={{ margin: '5px 0', opacity: 0.3 }} />
        </div>
      ))}
    </div>
  );
}
```

## 스토어 성능 최적화

### 1. 선택적 구독 패턴

```typescript
// ✅ 효율적: 필요한 필드만 구독
function OptimizedUserName() {
  const profileStore = useUserStore('profile');
  
  // 이름만 변경될 때 리렌더링
  const name = useStoreValue(profileStore, profile => profile.name);
  
  return <span>{name}</span>;
}

function OptimizedUserEmail() {
  const profileStore = useUserStore('profile');
  
  // 이메일만 변경될 때 리렌더링
  const email = useStoreValue(profileStore, profile => profile.email);
  
  return <span>{email}</span>;
}

// ❌ 비효율적: 전체 프로필 구독
function InefficientUserInfo() {
  const profileStore = useUserStore('profile');
  const profile = useStoreValue(profileStore); // 모든 변경에 리렌더링
  
  return (
    <div>
      <span>{profile.name}</span>
      <span>{profile.email}</span>
    </div>
  );
}

// ✅ 개선된 버전: 조합 컴포넌트
function EfficientUserInfo() {
  return (
    <div>
      <OptimizedUserName />
      <OptimizedUserEmail />
    </div>
  );
}
```

### 2. 조건부 구독 최적화

```typescript
// 조건에 따른 스마트 구독
function ConditionalUserData({ showDetails, isLoggedIn }: {
  showDetails: boolean;
  isLoggedIn: boolean;
}) {
  const profileStore = useUserStore('profile');
  
  // 로그인되고 상세보기일 때만 전체 데이터 구독
  const profileData = useStoreValue(
    profileStore,
    isLoggedIn && showDetails 
      ? (profile) => profile  // 전체 프로필
      : (profile) => ({ name: profile.name }) // 이름만
  );
  
  if (!isLoggedIn) {
    return <div>로그인이 필요합니다</div>;
  }
  
  if (!showDetails) {
    return <div>안녕하세요, {profileData.name}님</div>;
  }
  
  return (
    <div>
      <h2>{profileData.name}</h2>
      <p>이메일: {profileData.email}</p>
      <p>가입일: {profileData.createdAt}</p>
      {/* 기타 상세 정보 */}
    </div>
  );
}
```

### 3. 메모화된 선택자

```typescript
// 복잡한 계산을 메모화하는 선택자
const createMemoizedSelector = <T, R>(
  selector: (state: T) => R,
  equalityFn?: (a: R, b: R) => boolean
) => {
  let lastInput: T;
  let lastResult: R;
  let hasResult = false;
  
  return (state: T): R => {
    // 입력이 같으면 캐시된 결과 반환
    if (hasResult && Object.is(state, lastInput)) {
      return lastResult;
    }
    
    const result = selector(state);
    
    // 커스텀 등가성 검사가 있고 결과가 같으면 캐시 유지
    if (hasResult && equalityFn && equalityFn(result, lastResult)) {
      return lastResult;
    }
    
    lastInput = state;
    lastResult = result;
    hasResult = true;
    
    return result;
  };
};

// 사용법
function ExpensiveUserStats() {
  const profileStore = useUserStore('profile');
  const activityStore = useUserStore('activity');
  
  // 복잡한 계산을 메모화
  const expensiveSelector = useMemo(() => 
    createMemoizedSelector((profile: UserProfile) => {
      // 무거운 계산
      return PerformanceProfiler.measure('user-stats-calculation', () => {
        const accountAge = Date.now() - new Date(profile.createdAt).getTime();
        const ageDays = Math.floor(accountAge / (24 * 60 * 60 * 1000));
        
        return {
          accountAgeDays: ageDays,
          accountAgeCategory: ageDays > 365 ? 'veteran' : ageDays > 30 ? 'regular' : 'new',
          completionScore: calculateProfileCompleteness(profile)
        };
      });
    })
  , []);
  
  const profile = useStoreValue(profileStore);
  const userStats = expensiveSelector(profile);
  
  return (
    <div>
      <p>계정 사용일: {userStats.accountAgeDays}일</p>
      <p>사용자 등급: {userStats.accountAgeCategory}</p>
      <p>프로필 완성도: {userStats.completionScore}%</p>
    </div>
  );
}
```

## 핸들러 성능 최적화

### 1. 핸들러 배치 처리

```typescript
// 배치 처리를 위한 유틸리티
class BatchProcessor<T> {
  private queue: T[] = [];
  private timeoutId: NodeJS.Timeout | null = null;
  private readonly batchSize: number;
  private readonly delay: number;
  
  constructor(
    private processor: (items: T[]) => Promise<void>,
    batchSize = 10,
    delay = 100
  ) {
    this.batchSize = batchSize;
    this.delay = delay;
  }
  
  add(item: T) {
    this.queue.push(item);
    
    // 배치 크기에 도달하면 즉시 처리
    if (this.queue.length >= this.batchSize) {
      this.processBatch();
      return;
    }
    
    // 타이머 설정 (지연 처리)
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    
    this.timeoutId = setTimeout(() => {
      this.processBatch();
    }, this.delay);
  }
  
  private async processBatch() {
    if (this.queue.length === 0) return;
    
    const batch = [...this.queue];
    this.queue = [];
    
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    
    try {
      await this.processor(batch);
    } catch (error) {
      console.error('배치 처리 실패:', error);
    }
  }
  
  flush() {
    if (this.queue.length > 0) {
      this.processBatch();
    }
  }
}

// 배치 처리 핸들러 예시
function useBatchedAnalytics() {
  const register = useUserActionRegister();
  
  // 분석 이벤트 배치 처리기
  const analyticsProcessor = useMemo(
    () => new BatchProcessor(
      async (events: AnalyticsEvent[]) => {
        await PerformanceProfiler.measureAsync('analytics-batch', async () => {
          await fetch('/api/analytics/batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ events })
          });
        });
      },
      20, // 배치 크기
      500 // 지연 시간 (ms)
    ),
    []
  );
  
  const trackingHandler = useCallback(async (payload, controller) => {
    // 즉시 배치에 추가 (논블로킹)
    analyticsProcessor.add({
      userId: payload.userId,
      action: payload.action,
      timestamp: Date.now(),
      metadata: payload.metadata
    });
    
    return { success: true, queued: true };
  }, [analyticsProcessor]);
  
  // 컴포넌트 언마운트 시 남은 배치 처리
  useEffect(() => {
    return () => {
      analyticsProcessor.flush();
    };
  }, [analyticsProcessor]);
  
  useEffect(() => {
    if (!register) return;
    
    const unregister = register('trackEvent', trackingHandler, {
      id: 'batched-analytics',
      priority: 50,
      blocking: false // 논블로킹으로 성능 개선
    });
    
    return unregister;
  }, [register, trackingHandler]);
}
```

### 2. 디바운싱과 쓰로틀링

```typescript
// 디바운스 훅
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
}

// 쓰로틀 훅
function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastCall = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  return useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    
    if (now - lastCall.current >= delay) {
      lastCall.current = now;
      return callback(...args);
    } else {
      // 마지막 호출을 예약
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        lastCall.current = Date.now();
        callback(...args);
      }, delay - (now - lastCall.current));
    }
  }, [callback, delay]) as T;
}

// 디바운스된 검색 핸들러
function useOptimizedSearch() {
  const register = useUserActionRegister();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
  const searchHandler = useCallback(async (payload, controller) => {
    return await PerformanceProfiler.measureAsync('user-search', async () => {
      const response = await fetch(`/api/search?q=${encodeURIComponent(payload.term)}`);
      return await response.json();
    });
  }, []);
  
  const throttledSearchHandler = useThrottle(searchHandler, 1000);
  
  useEffect(() => {
    if (!register) return;
    
    const unregister = register('search', throttledSearchHandler, {
      id: 'optimized-search',
      priority: 100,
      blocking: true
    });
    
    return unregister;
  }, [register, throttledSearchHandler]);
  
  // 디바운스된 검색어 변경에 자동 반응
  useEffect(() => {
    if (debouncedSearchTerm.length > 2) {
      throttledSearchHandler({ term: debouncedSearchTerm });
    }
  }, [debouncedSearchTerm, throttledSearchHandler]);
  
  return { searchTerm, setSearchTerm };
}
```

### 3. 우선순위 기반 핸들러 최적화

```typescript
// 핸들러 우선순위 최적화
function useOptimizedUserHandlers() {
  const register = useUserActionRegister();
  const registry = useUserStores();
  
  // 크리티컬 핸들러 (높은 우선순위, 블로킹)
  const criticalLoginHandler = useCallback(async (payload, controller) => {
    return await PerformanceProfiler.measureAsync('critical-login', async () => {
      // 필수 로그인 로직만
      const result = await authenticateUser(payload);
      
      if (result.success) {
        // 즉시 필요한 상태만 업데이트
        const sessionStore = registry.getStore('session');
        sessionStore.setValue({
          isLoggedIn: true,
          token: result.token,
          expiresAt: result.expiresAt,
          lastActivity: Date.now()
        });
      }
      
      return result;
    });
  }, [registry]);
  
  // 보조 핸들러 (낮은 우선순위, 논블로킹)
  const auxiliaryLoginHandler = useCallback(async (payload, controller) => {
    // 부가적인 작업들 (비동기적으로 처리)
    setTimeout(async () => {
      try {
        await Promise.all([
          updateLoginAnalytics(payload.userId),
          preloadUserPreferences(payload.userId),
          syncUserActivity(payload.userId)
        ]);
      } catch (error) {
        console.warn('보조 로그인 작업 실패:', error);
      }
    }, 0);
    
    return { success: true, auxiliary: true };
  }, []);
  
  useEffect(() => {
    if (!register) return;
    
    // 크리티컬 핸들러 먼저 등록
    const unregisterCritical = register('login', criticalLoginHandler, {
      id: 'login-critical',
      priority: 200, // 높은 우선순위
      blocking: true // 완료 대기
    });
    
    // 보조 핸들러는 나중에, 논블로킹으로
    const unregisterAuxiliary = register('login', auxiliaryLoginHandler, {
      id: 'login-auxiliary',
      priority: 50,  // 낮은 우선순위
      blocking: false // 비동기 처리
    });
    
    return () => {
      unregisterCritical();
      unregisterAuxiliary();
    };
  }, [register, criticalLoginHandler, auxiliaryLoginHandler]);
}
```

## 컴포넌트 렌더링 최적화

### 1. React.memo와 커스텀 비교 함수

```typescript
// 효율적인 메모화 컴포넌트
interface UserCardProps {
  user: UserProfile;
  onEdit: (userId: string) => void;
  onDelete: (userId: string) => void;
}

const UserCard = React.memo<UserCardProps>(({ user, onEdit, onDelete }) => {
  console.log(`UserCard 렌더링: ${user.name}`); // 개발 중 렌더링 추적
  
  return (
    <div className="user-card">
      <img src={user.avatar} alt={`${user.name} 프로필`} />
      <h3>{user.name}</h3>
      <p>{user.email}</p>
      <div>
        <button onClick={() => onEdit(user.id)}>편집</button>
        <button onClick={() => onDelete(user.id)}>삭제</button>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // 커스텀 비교 함수로 불필요한 리렌더링 방지
  return (
    prevProps.user.id === nextProps.user.id &&
    prevProps.user.name === nextProps.user.name &&
    prevProps.user.email === nextProps.user.email &&
    prevProps.user.avatar === nextProps.user.avatar &&
    prevProps.onEdit === nextProps.onEdit &&
    prevProps.onDelete === nextProps.onDelete
  );
});

// 안정된 콜백 사용
function UserList() {
  const users = useStoreValue(useUserStore('userList'));
  const dispatch = useUserAction();
  
  // 콜백 메모화로 불필요한 리렌더링 방지
  const handleEdit = useCallback((userId: string) => {
    dispatch('editUser', { userId });
  }, [dispatch]);
  
  const handleDelete = useCallback((userId: string) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      dispatch('deleteUser', { userId });
    }
  }, [dispatch]);
  
  return (
    <div className="user-list">
      {users.map(user => (
        <UserCard
          key={user.id}
          user={user}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
}
```

### 2. 가상화 (Virtualization)

```typescript
// 대용량 리스트 가상화
import { FixedSizeList as List } from 'react-window';

interface VirtualizedUserListProps {
  users: UserProfile[];
  onEdit: (userId: string) => void;
  onDelete: (userId: string) => void;
}

// 가상화된 아이템 컴포넌트
const VirtualizedUserItem = React.memo<{
  index: number;
  style: React.CSSProperties;
  data: {
    users: UserProfile[];
    onEdit: (userId: string) => void;
    onDelete: (userId: string) => void;
  };
}>(({ index, style, data }) => {
  const user = data.users[index];
  
  return (
    <div style={style}>
      <UserCard
        user={user}
        onEdit={data.onEdit}
        onDelete={data.onDelete}
      />
    </div>
  );
});

function VirtualizedUserList({ users, onEdit, onDelete }: VirtualizedUserListProps) {
  const itemData = useMemo(() => ({
    users,
    onEdit,
    onDelete
  }), [users, onEdit, onDelete]);
  
  return (
    <div style={{ height: '600px' }}>
      <List
        height={600}
        itemCount={users.length}
        itemSize={120} // 각 아이템의 높이
        itemData={itemData}
        overscanCount={5} // 미리 렌더링할 아이템 수
      >
        {VirtualizedUserItem}
      </List>
    </div>
  );
}

// 사용법
function OptimizedUserList() {
  const users = useStoreValue(useUserStore('userList'));
  const dispatch = useUserAction();
  
  const handleEdit = useCallback((userId: string) => {
    dispatch('editUser', { userId });
  }, [dispatch]);
  
  const handleDelete = useCallback((userId: string) => {
    dispatch('deleteUser', { userId });
  }, [dispatch]);
  
  // 사용자가 많을 때 가상화 사용
  if (users.length > 100) {
    return (
      <VirtualizedUserList
        users={users}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    );
  }
  
  // 적은 수의 사용자는 일반 렌더링
  return (
    <div className="user-list">
      {users.map(user => (
        <UserCard
          key={user.id}
          user={user}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
}
```

### 3. 지연 로딩과 코드 분할

```typescript
// 지연 로딩 컴포넌트
const LazyUserEditor = React.lazy(() => 
  import('./UserEditor').then(module => ({
    default: module.UserEditor
  }))
);

const LazyUserAnalytics = React.lazy(() => 
  import('./UserAnalytics').then(module => ({
    default: module.UserAnalytics
  }))
);

// 조건부 지연 로딩
function OptimizedUserDashboard() {
  const [activeTab, setActiveTab] = useState<'profile' | 'editor' | 'analytics'>('profile');
  const userRole = useStoreValue(useUserStore('session'), session => session.role);
  
  return (
    <div className="user-dashboard">
      <nav className="dashboard-nav">
        <button 
          onClick={() => setActiveTab('profile')}
          className={activeTab === 'profile' ? 'active' : ''}
        >
          프로필
        </button>
        <button 
          onClick={() => setActiveTab('editor')}
          className={activeTab === 'editor' ? 'active' : ''}
        >
          편집
        </button>
        {userRole === 'admin' && (
          <button 
            onClick={() => setActiveTab('analytics')}
            className={activeTab === 'analytics' ? 'active' : ''}
          >
            분석
          </button>
        )}
      </nav>
      
      <div className="dashboard-content">
        {activeTab === 'profile' && <UserProfile />}
        
        {activeTab === 'editor' && (
          <Suspense fallback={<div>편집기 로딩 중...</div>}>
            <LazyUserEditor />
          </Suspense>
        )}
        
        {activeTab === 'analytics' && userRole === 'admin' && (
          <Suspense fallback={<div>분석 도구 로딩 중...</div>}>
            <LazyUserAnalytics />
          </Suspense>
        )}
      </div>
    </div>
  );
}
```

## 네트워크 최적화

### 1. 요청 최적화

```typescript
// 요청 중복 제거와 캐싱
class RequestCache {
  private cache = new Map<string, Promise<any>>();
  private results = new Map<string, { data: any; timestamp: number }>();
  private readonly ttl: number;
  
  constructor(ttl = 60000) { // 기본 1분 TTL
    this.ttl = ttl;
  }
  
  async fetch<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    // 캐시된 결과가 유효한지 확인
    const cached = this.results.get(key);
    if (cached && Date.now() - cached.timestamp < this.ttl) {
      return cached.data;
    }
    
    // 진행 중인 요청이 있으면 재사용
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }
    
    // 새 요청 생성
    const promise = fetcher().then(data => {
      this.results.set(key, { data, timestamp: Date.now() });
      this.cache.delete(key);
      return data;
    }).catch(error => {
      this.cache.delete(key);
      throw error;
    });
    
    this.cache.set(key, promise);
    return promise;
  }
  
  invalidate(key: string) {
    this.cache.delete(key);
    this.results.delete(key);
  }
  
  clear() {
    this.cache.clear();
    this.results.clear();
  }
}

// 전역 요청 캐시
const requestCache = new RequestCache();

// 최적화된 사용자 데이터 핸들러
function useOptimizedUserDataHandlers() {
  const register = useUserActionRegister();
  const registry = useUserStores();
  
  const loadUserDataHandler = useCallback(async (payload, controller) => {
    const cacheKey = `user-data-${payload.userId}`;
    
    return await requestCache.fetch(cacheKey, async () => {
      return await PerformanceProfiler.measureAsync('user-data-fetch', async () => {
        const response = await fetch(`/api/users/${payload.userId}`);
        if (!response.ok) {
          throw new Error('사용자 데이터 로드 실패');
        }
        
        const userData = await response.json();
        
        // 스토어 업데이트
        const profileStore = registry.getStore('profile');
        profileStore.setValue(userData.profile);
        
        return userData;
      });
    });
  }, [registry]);
  
  // 사용자 데이터 무효화 핸들러
  const invalidateUserDataHandler = useCallback(async (payload, controller) => {
    const cacheKey = `user-data-${payload.userId}`;
    requestCache.invalidate(cacheKey);
    
    return { success: true, invalidated: true };
  }, []);
  
  useEffect(() => {
    if (!register) return;
    
    const unregisterLoad = register('loadUserData', loadUserDataHandler, {
      id: 'optimized-user-data-loader',
      priority: 100
    });
    
    const unregisterInvalidate = register('invalidateUserData', invalidateUserDataHandler, {
      id: 'user-data-cache-invalidator',
      priority: 100
    });
    
    return () => {
      unregisterLoad();
      unregisterInvalidate();
    };
  }, [register, loadUserDataHandler, invalidateUserDataHandler]);
}
```

### 2. 프리페칭과 백그라운드 로딩

```typescript
// 백그라운드 프리페칭
function useBackgroundPreloading() {
  const dispatch = useUserAction();
  
  // 사용자가 hover할 때 데이터 프리페치
  const preloadUserData = useCallback((userId: string) => {
    // 백그라운드에서 프리페치 (논블로킹)
    setTimeout(() => {
      dispatch('loadUserData', { userId }).catch(error => {
        console.warn('프리페치 실패:', error);
      });
    }, 0);
  }, [dispatch]);
  
  // 예상되는 네비게이션을 위한 프리페치
  const preloadNextPage = useCallback(() => {
    const currentPage = parseInt(location.pathname.split('/').pop() || '1');
    const nextPage = currentPage + 1;
    
    // 다음 페이지 데이터 미리 로드
    setTimeout(() => {
      dispatch('loadUserList', { page: nextPage }).catch(error => {
        console.warn('다음 페이지 프리페치 실패:', error);
      });
    }, 1000); // 1초 후 백그라운드 로딩
  }, [dispatch]);
  
  return { preloadUserData, preloadNextPage };
}

// 스마트 프리페칭이 적용된 사용자 카드
function SmartUserCard({ user }: { user: UserProfile }) {
  const { preloadUserData } = useBackgroundPreloading();
  const [isHovered, setIsHovered] = useState(false);
  
  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    preloadUserData(user.id); // hover 시 프리페치
  }, [user.id, preloadUserData]);
  
  return (
    <div 
      className="user-card"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setIsHovered(false)}
    >
      <img src={user.avatar} alt={`${user.name} 프로필`} />
      <h3>{user.name}</h3>
      <p>{user.email}</p>
      
      {isHovered && (
        <div className="hover-actions">
          <Link to={`/users/${user.id}`}>상세보기</Link>
        </div>
      )}
    </div>
  );
}
```

## 메모리 관리

### 1. 메모리 사용량 모니터링

```typescript
// 메모리 사용량 추적
class MemoryMonitor {
  private static instance: MemoryMonitor;
  private measurements: Array<{ timestamp: number; used: number }> = [];
  
  static getInstance() {
    if (!this.instance) {
      this.instance = new MemoryMonitor();
    }
    return this.instance;
  }
  
  measure() {
    if (typeof window !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory;
      const measurement = {
        timestamp: Date.now(),
        used: memory.usedJSHeapSize / 1024 / 1024 // MB 단위
      };
      
      this.measurements.push(measurement);
      
      // 최근 100개 측정값만 유지
      if (this.measurements.length > 100) {
        this.measurements.shift();
      }
      
      return measurement;
    }
    return null;
  }
  
  getStats() {
    if (this.measurements.length === 0) return null;
    
    const latest = this.measurements[this.measurements.length - 1];
    const first = this.measurements[0];
    const average = this.measurements.reduce((sum, m) => sum + m.used, 0) / this.measurements.length;
    const peak = Math.max(...this.measurements.map(m => m.used));
    
    return {
      current: latest.used,
      average,
      peak,
      trend: latest.used - first.used
    };
  }
}

// 메모리 모니터링 훅
function useMemoryMonitoring(interval = 5000) {
  const [memoryStats, setMemoryStats] = useState(null);
  
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    
    const monitor = MemoryMonitor.getInstance();
    
    const measureInterval = setInterval(() => {
      monitor.measure();
      setMemoryStats(monitor.getStats());
    }, interval);
    
    return () => clearInterval(measureInterval);
  }, [interval]);
  
  return memoryStats;
}
```

### 2. 메모리 누수 방지

```typescript
// 메모리 누수 방지 패턴
function useMemorySafeHandlers() {
  const register = useUserActionRegister();
  const registry = useUserStores();
  
  // WeakMap을 사용한 메모리 안전한 캐시
  const handlerCache = useMemo(() => new WeakMap(), []);
  
  const optimizedHandler = useCallback(async (payload, controller) => {
    // WeakMap 캐시 확인
    if (handlerCache.has(payload)) {
      return handlerCache.get(payload);
    }
    
    const result = await performExpensiveOperation(payload);
    
    // WeakMap에 결과 캐시 (자동 가비지 컬렉션)
    handlerCache.set(payload, result);
    
    return result;
  }, [handlerCache]);
  
  useEffect(() => {
    if (!register) return;
    
    const unregister = register('expensiveOperation', optimizedHandler, {
      id: 'memory-safe-handler',
      priority: 100
    });
    
    return () => {
      unregister();
      // WeakMap은 자동으로 정리되므로 추가 정리 불필요
    };
  }, [register, optimizedHandler]);
}

// 자동 정리가 적용된 구독
function useAutoCleanupSubscription() {
  const abortController = useMemo(() => new AbortController(), []);
  
  useEffect(() => {
    // AbortController를 사용한 자동 정리
    const subscription = someExternalService.subscribe(
      data => {
        // 데이터 처리
      },
      { signal: abortController.signal }
    );
    
    return () => {
      abortController.abort(); // 모든 관련 작업 취소
    };
  }, [abortController]);
}
```

## 성능 모니터링과 프로파일링

### 1. 실시간 성능 대시보드

```typescript
// 통합 성능 모니터
function usePerformanceMonitor() {
  const [performanceData, setPerformanceData] = useState({
    handlers: {},
    memory: null,
    renders: 0,
    storeUpdates: 0
  });
  
  // 렌더링 횟수 추적
  const renderCount = useRef(0);
  useEffect(() => {
    renderCount.current += 1;
    setPerformanceData(prev => ({ ...prev, renders: renderCount.current }));
  });
  
  // 스토어 업데이트 추적
  const updateCount = useRef(0);
  const profileStore = useUserStore('profile');
  
  useEffect(() => {
    const unsubscribe = profileStore.subscribe(() => {
      updateCount.current += 1;
      setPerformanceData(prev => ({ ...prev, storeUpdates: updateCount.current }));
    });
    
    return unsubscribe;
  }, [profileStore]);
  
  // 주기적 성능 데이터 수집
  useEffect(() => {
    const interval = setInterval(() => {
      const handlerStats = PerformanceProfiler.getAllStats();
      const memoryStats = MemoryMonitor.getInstance().getStats();
      
      setPerformanceData(prev => ({
        ...prev,
        handlers: handlerStats,
        memory: memoryStats
      }));
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  return performanceData;
}

// 성능 대시보드 컴포넌트
function PerformanceMonitorDashboard() {
  const performanceData = usePerformanceMonitor();
  
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  
  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      left: '10px',
      width: '300px',
      backgroundColor: 'rgba(0,0,0,0.9)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '11px',
      fontFamily: 'monospace',
      zIndex: 10000
    }}>
      <h4>성능 모니터</h4>
      
      <div>
        <strong>렌더링:</strong> {performanceData.renders}회
      </div>
      
      <div>
        <strong>스토어 업데이트:</strong> {performanceData.storeUpdates}회
      </div>
      
      {performanceData.memory && (
        <div>
          <strong>메모리:</strong> {performanceData.memory.current.toFixed(1)}MB
          (평균: {performanceData.memory.average.toFixed(1)}MB)
        </div>
      )}
      
      <div style={{ marginTop: '10px' }}>
        <strong>핸들러 성능:</strong>
        {Object.entries(performanceData.handlers).map(([name, stats]: [string, any]) => (
          <div key={name} style={{ marginLeft: '10px', fontSize: '10px' }}>
            {name}: {stats.average?.toFixed(1)}ms (×{stats.count})
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 모범 사례 체크리스트

### ✅ 스토어 최적화
- [ ] 선택적 구독 사용
- [ ] 조건부 구독 구현
- [ ] 복잡한 계산 메모화
- [ ] 적절한 변경 감지 전략 선택

### ✅ 핸들러 최적화
- [ ] 배치 처리 구현
- [ ] 디바운싱/쓰로틀링 적용
- [ ] 우선순위 기반 최적화
- [ ] 논블로킹 핸들러 활용

### ✅ 컴포넌트 최적화
- [ ] React.memo 적절히 사용
- [ ] 콜백 메모화
- [ ] 가상화 적용 (대용량 리스트)
- [ ] 지연 로딩 구현

### ✅ 네트워크 최적화
- [ ] 요청 중복 제거
- [ ] 캐싱 전략 구현
- [ ] 프리페칭 적용
- [ ] 백그라운드 로딩

### ✅ 메모리 관리
- [ ] 메모리 사용량 모니터링
- [ ] 자동 정리 구현
- [ ] WeakMap 활용
- [ ] 구독 해제 보장

### ✅ 성능 모니터링
- [ ] 핸들러 성능 추적
- [ ] 렌더링 최적화 검증
- [ ] 메모리 누수 감지
- [ ] 사용자 경험 메트릭

---

## 요약

Context-Action 프레임워크의 성능 최적화는 다음 원칙을 따릅니다:

- **측정 기반** - 실제 데이터로 최적화 결정
- **단계적 최적화** - 가장 큰 병목부터 해결
- **사용자 경험 우선** - 인지 가능한 성능 개선 집중
- **메모리 안전성** - 자동 정리와 누수 방지
- **모니터링 필수** - 지속적인 성능 추적

올바른 최적화 기법을 적용하면 대규모 애플리케이션에서도 우수한 성능을 유지할 수 있습니다.

---

::: tip 다음 단계
- [오류 처리](./error-handling) - 성능에 영향을 주는 오류 처리 최적화
- [모범 사례](./best-practices) - 프로덕션 환경 성능 권장사항
- [공통 함정](./common-pitfalls) - 성능 문제를 일으키는 일반적인 실수들
:::