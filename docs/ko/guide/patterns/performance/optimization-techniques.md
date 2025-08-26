# 성능 최적화 기법

Context-Action 프레임워크를 위한 포괄적인 성능 최적화 패턴 및 기법입니다.

## 전제 조건

이러한 최적화에서 사용되는 설정 패턴에 대해서는 다음을 참조하세요:
- **[기본 Store 설정](../setup/basic-store-setup.md)** - Store 성능 구성
- **[기본 Action 설정](../setup/basic-action-setup.md)** - Action 최적화 패턴
- **[RefContext 설정](../setup/ref-context-setup.md)** - DOM 성능 최적화
- **[Provider 구성 설정](../setup/provider-composition-setup.md)** - Provider 최적화

## 📋 목차

1. [Store 최적화](#store-최적화)
2. [Action 최적화](#action-최적화)
3. [메모이제이션 패턴](#메모이제이션-패턴)
4. [RefContext 성능](#refcontext-성능)

---

## Store 최적화

### 🔄 비교 전략 선택

데이터 특성에 따라 적절한 비교 전략을 선택하세요:

```tsx
// ✅ 설정 가이드의 성능 최적화 패턴 사용
// 참조: setup/basic-store-setup.md#type-inference-configurations
const {
  Provider: PerformanceStoreProvider,
  useStore: usePerformanceStore
} = createStoreContext('Performance', {
  // 원시값: reference (기본값)
  counter: 0,
  isLoading: false,
  
  // 속성 변경이 있는 객체: shallow  
  userProfile: {
    initialValue: { id: '', name: '', email: '', role: 'guest' as const },
    strategy: 'shallow' as const
  },
  
  // 빈번한 변경이 있는 깊게 중첩된 객체: deep
  complexForm: {
    initialValue: { nested: { deep: { values: {} } } },
    strategy: 'deep' as const
  },
  
  // 대용량 배열 또는 성능 중요한 경우: reference
  largeDataset: {
    initialValue: [] as DataItem[],
    strategy: 'reference' as const,
    description: '성능을 위해 참조 동등성 사용'
  },
  
  // 고급 비교 옵션
  advancedData: {
    initialValue: { id: '', data: {}, lastUpdated: new Date() },
    comparisonOptions: {
      strategy: 'shallow',
      ignoreKeys: ['lastUpdated'], // 특정 키 무시
      maxDepth: 2,                 // 성능을 위한 깊이 제한
      enableCircularCheck: true    // 순환 참조 방지
    }
  },
  
  // 커스텀 비교 로직
  versionedData: {
    initialValue: { version: 1, content: {} },
    comparisonOptions: {
      strategy: 'custom',
      customComparator: (oldVal, newVal) => {
        // 버전 기반 비교
        return oldVal.version === newVal.version;
      }
    }
  }
});
```

### 📊 Store 구독 최적화

```tsx
// ✅ 권장: 특정 값에 구독
const userName = useStoreValue(profileStore)?.name;

// ❌ 피하기: 부분 데이터만 필요할 때 불필요한 전체 객체 구독
const fullProfile = useStoreValue(profileStore);
const userName = fullProfile.name; // 프로필의 모든 변경에 대해 재렌더링
```

---

## Action 최적화

### ⚡ 핸들러 메모이제이션

```tsx
// ✅ 권장: 안정적인 의존성을 가진 메모이즈된 핸들러
function UserComponent() {
  const profileStore = useUserStore('profile');
  const profile = useStoreValue(profileStore);
  
  // 핸들러 메모이제이션 (의존성 배열 주의)
  const updateHandler = useCallback(async (payload) => {
    // 항상 store에서 최신 상태 가져오기
    const currentProfile = profileStore.getValue();
    profileStore.setValue({ ...currentProfile, ...payload.data });
  }, [profileStore]); // deps에는 store 참조만 포함
  
  useUserActionHandler('updateProfile', updateHandler);
  
  // 계산된 값 메모이제이션
  const displayName = useMemo(() => {
    return profile.firstName + ' ' + profile.lastName;
  }, [profile.firstName, profile.lastName]);
  
  return <div>{displayName}</div>;
}
```

### 🎯 디바운스/스로틀 구성

```tsx
// ✅ 권장: 적절한 디바운스/스로틀 사용
useUserActionHandler('searchUsers', searchHandler, {
  debounce: 300,  // 검색에는 디바운스 사용
  id: 'search-handler'
});

useUserActionHandler('trackScroll', scrollHandler, {
  throttle: 100,  // 스크롤에는 스로틀 사용  
  id: 'scroll-handler'
});

useUserActionHandler('saveForm', saveHandler, {
  blocking: true,  // 중요한 액션은 블로킹
  once: false,
  id: 'save-handler'
});
```

---

## 메모이제이션 패턴

### 🔄 컴포넌트 메모이제이션

```tsx
// ✅ 권장: 비용이 많이 드는 계산 메모이즈
function ExpensiveComponent({ data }: { data: ComplexData }) {
  // 비용이 많이 드는 계산 - 메모이즈됨
  const processedData = useMemo(() => {
    return data.items
      .filter(item => item.isActive)
      .map(item => ({
        ...item,
        computed: expensiveCalculation(item)
      }))
      .sort((a, b) => a.priority - b.priority);
  }, [data.items]); // items가 변경될 때만 재계산
  
  // 비용이 많이 드는 렌더링 - 메모이즈된 컴포넌트
  return (
    <div>
      {processedData.map(item => (
        <MemoizedItemComponent key={item.id} item={item} />
      ))}
    </div>
  );
}

// 메모이즈된 서브 컴포넌트
const MemoizedItemComponent = memo(({ item }: { item: ProcessedItem }) => {
  return <div>{item.name}: {item.computed}</div>;
});
```

### ⚡ 콜백 메모이제이션

```tsx
// ✅ 권장: 안정적인 콜백으로 자식 재렌더링 방지
function ParentComponent() {
  const [filter, setFilter] = useState('');
  const items = useStoreValue(itemsStore);
  
  // 메모이즈된 필터 함수
  const handleFilterChange = useCallback((newFilter: string) => {
    setFilter(newFilter);
  }, []);
  
  // 메모이즈된 아이템 핸들러
  const handleItemClick = useCallback((itemId: string) => {
    // 아이템 클릭 처리
    dispatch('selectItem', { itemId });
  }, [dispatch]);
  
  return (
    <div>
      <FilterComponent onChange={handleFilterChange} />
      {items.map(item => (
        <ItemComponent 
          key={item.id} 
          item={item} 
          onClick={handleItemClick}
        />
      ))}
    </div>
  );
}
```

---

## RefContext 성능

### ⚡ 제로 재렌더링 DOM 조작

```tsx
// ✅ 권장: 성능을 위한 직접 DOM 조작
function HighPerformanceMouseTracker() {
  const cursor = useMouseRef('cursor');
  const container = useMouseRef('container');
  
  // React 재렌더링 없음 - 모든 DOM 업데이트는 직접
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!cursor.target || !container.target) return;
    
    const rect = container.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // 하드웨어 가속 변환 (GPU 가속)
    cursor.target.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    
    // 복잡한 애니메이션을 위해 will-change 사용
    if (!cursor.target.style.willChange) {
      cursor.target.style.willChange = 'transform';
    }
  }, [cursor, container]);
  
  // 메모리 최적화를 위해 언마운트 시 will-change 정리
  useEffect(() => {
    return () => {
      if (cursor.target) {
        cursor.target.style.willChange = '';
      }
    };
  }, [cursor]);
  
  return (
    <div ref={container.setRef} onMouseMove={handleMouseMove}>
      <div 
        ref={cursor.setRef}
        style={{ transform: 'translate3d(0, 0, 0)' }} // 초기 GPU 레이어
      />
    </div>
  );
}

// ❌ 피하기: 재렌더링을 유발하는 상태 기반 업데이트
function SlowMouseTracker() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  const handleMouseMove = (e: React.MouseEvent) => {
    // 이것은 매 마우스 이동마다 재렌더링을 유발
    setPosition({ x: e.clientX, y: e.clientY });
  };
  
  return (
    <div onMouseMove={handleMouseMove}>
      <div style={{ left: position.x, top: position.y }} />
    </div>
  );
}
```

### 🎨 애니메이션 성능

```tsx
// ✅ 권장: 부드러운 애니메이션을 위한 requestAnimationFrame
function SmoothAnimationComponent() {
  const target = useAnimationRef('target');
  const animationRef = useRef<number>();
  
  const startAnimation = useCallback(() => {
    const animate = (timestamp: number) => {
      if (target.target) {
        // 하드웨어 가속을 사용한 부드러운 애니메이션
        const progress = (timestamp % 2000) / 2000;
        const x = progress * 200;
        target.target.style.transform = `translate3d(${x}px, 0, 0)`;
      }
      animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);
  }, [target]);
  
  const stopAnimation = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  }, []);
  
  useEffect(() => {
    return () => stopAnimation(); // 언마운트 시 정리
  }, [stopAnimation]);
  
  return (
    <div>
      <div ref={target.setRef} style={{ transform: 'translate3d(0, 0, 0)' }} />
      <button onClick={startAnimation}>시작</button>
      <button onClick={stopAnimation}>정지</button>
    </div>
  );
}
```

---

## 📊 성능 측정

### 🔍 성능 모니터링

```tsx
// ✅ 성능 모니터링 유틸리티
const usePerformanceMonitor = (operationName: string) => {
  const measure = useCallback((fn: () => void | Promise<void>) => {
    const start = performance.now();
    
    const result = fn();
    
    if (result instanceof Promise) {
      return result.finally(() => {
        const end = performance.now();
        console.log(`${operationName}: ${end - start}ms`);
      });
    } else {
      const end = performance.now();
      console.log(`${operationName}: ${end - start}ms`);
      return result;
    }
  }, [operationName]);
  
  return { measure };
};

// 사용법
function MonitoredComponent() {
  const { measure } = usePerformanceMonitor('DataProcessing');
  
  const processData = useCallback(async (data: unknown[]) => {
    return measure(() => {
      // 비용이 많이 드는 데이터 처리
      return data.map(item => processItem(item));
    });
  }, [measure]);
}
```

---

## 📚 관련 패턴

- [RefContext 성능](../ref/performance.md) - 상세한 RefContext 최적화
- [하드웨어 가속](../ref/hardware-acceleration.md) - GPU 가속 기법
- [메모리 최적화](../ref/memory-optimization.md) - 메모리 관리 패턴

---

## 💡 성능 팁

1. **데이터 패턴에 따라 적절한 store 비교 전략을 선택**하세요
2. **전략적으로 메모이제이션 사용** - 모든 곳에 사용하지 마세요
3. **성능이 중요한 작업에는 RefContext를 활용**하세요
4. **측정 유틸리티로 성능을 모니터링**하세요
5. **애니메이션에 하드웨어 가속을 사용**하세요
6. **메모리 누수를 방지하기 위해 리소스를 적절히 정리**하세요