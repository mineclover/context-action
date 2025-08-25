# 스토어 설정

복잡한 스토어 시나리오를 위한 성능 최적화와 커스텀 비교 전략.

## 사전 요구사항

기본 스토어 설정과 설정 패턴은 **[기본 스토어 설정](../setup/basic-store-setup.md)** 을 참조하세요.

이 문서는 설정 패턴을 사용한 고급 설정을 보여줍니다:
- 타입 정의 → [일반적인 스토어 패턴](../setup/basic-store-setup.md#common-store-patterns)
- 설정 → [타입 추론 설정](../setup/basic-store-setup.md#type-inference-configurations)
- 컨텍스트 생성 → [단일 도메인 스토어 컨텍스트](../setup/basic-store-setup.md#single-domain-store-context)

## 개요

고급 설정은 확립된 설정 패턴을 기반으로 구축된 복잡한 애플리케이션을 위한 스토어 동작, 비교 전략 및 성능 최적화에 대한 세밀한 제어를 제공합니다.

## 성능 최적화 설정

```tsx
import { createDeclarativeStorePattern } from '@context-action/react';

// 성능 최적화된 설정과 ProductStores 패턴 사용
interface OptimizedProductStores {
  catalog: Product[];
  categories: Category[];
  filters: {
    category?: string;
    priceRange?: { min: number; max: number };
    searchTerm?: string;
    sortBy?: 'name' | 'price' | 'rating';
  };
  cart: {
    items: CartItem[];
    total: number;
    discounts: Discount[];
  };
}

const {
  Provider: ProductStoreProvider,
  useStore: useProductStore,
  useStoreManager: useProductStoreManager
} = createDeclarativeStorePattern<OptimizedProductStores>('Product', {
  // 대용량 카탈로그 - 성능을 위한 참조 등가성
  catalog: {
    initialValue: [] as Product[],
    strategy: 'reference' as const,  // 성능을 위한 참조 등가성
    debug: true,                     // 디버그 로깅 활성화
    description: '참조 등가성을 가진 제품 카탈로그'
  },
  
  // 얕은 비교를 가진 카테고리
  categories: {
    initialValue: [] as Category[],
    strategy: 'shallow' as const,
    description: '얕은 비교를 가진 제품 카테고리'
  },
  
  // 깊은 비교를 가진 복잡한 필터
  filters: {
    initialValue: {
      category: undefined,
      priceRange: undefined,
      searchTerm: undefined,
      sortBy: undefined
    },
    strategy: 'deep' as const,       // 중첩 변경을 위한 깊은 비교
    comparisonOptions: {
      ignoreKeys: ['timestamp'],     // 특정 키 무시
      maxDepth: 5                    // 비교 깊이 제한
    }
  },
  
  // 커스텀 비교를 가진 쇼핑 카트
  cart: {
    initialValue: { items: [], total: 0, discounts: [] },
    strategy: 'shallow' as const,
    comparisonOptions: {
      customComparator: (oldCart, newCart) => {
        // 카트 최적화를 위한 커스텀 비교 로직
        return oldCart.items.length === newCart.items.length &&
               oldCart.total === newCart.total;
      }
    }
  }
});
```

## 비교 전략

### 참조 전략
```tsx
// 최적 사용: 대용량 배열, 참조 변경이 업데이트를 나타내는 객체
// 참조 전략과 설정 가이드의 ProductStores 패턴 사용
const {
  Provider: ProductStoreProvider,
  useStore: useProductStore
} = createDeclarativeStorePattern<ProductStores>('Product', {
  catalog: {
    initialValue: [] as Product[],
    strategy: 'reference' as const // 배열 참조가 변경된 경우에만 재렌더링
  },
  
  categories: {
    initialValue: [] as Category[],
    strategy: 'reference' as const // 불변 데이터 구조에 완벽
  },
  
  filters: {
    initialValue: {},
    strategy: 'reference' as const
  },
  
  cart: {
    initialValue: { items: [], total: 0, discounts: [] },
    strategy: 'reference' as const
  }
});
```

### 얕은 전략
```tsx
// 최적 사용: 최상위 속성이 변경되는 객체
// 설정 가이드의 UIStores 패턴 사용
const {
  Provider: UIStoreProvider,
  useStore: useUIStore
} = createDeclarativeStorePattern<UIStores>('UI', {
  modal: {
    initialValue: { isOpen: false, type: undefined, data: undefined },
    strategy: 'shallow' as const // 최상위 속성이 변경된 경우 재렌더링
  },
  
  loading: {
    initialValue: { global: false, operations: {} },
    strategy: 'shallow' as const // 로딩 상태에 적합
  },
  
  notifications: {
    initialValue: { items: [], maxVisible: 5 },
    strategy: 'shallow' as const // 알림 상태에 적합
  },
  
  navigation: {
    initialValue: { currentRoute: '', history: [], params: {} },
    strategy: 'shallow' as const
  }
});
```

### 깊은 전략
```tsx
// 최적 사용: 깊은 변경 감지가 필요한 중첩 객체
// 깊은 설정과 설정 가이드의 UserStores 패턴 사용
const {
  Provider: UserStoreProvider,
  useStore: useUserStore
} = createDeclarativeStorePattern<UserStores>('User', {
  profile: {
    initialValue: { id: '', name: '', email: '', role: 'guest' },
    strategy: 'deep' as const, // 모든 중첩 레벨에서 변경 감지
    comparisonOptions: {
      maxDepth: 10,  // 무한 재귀 방지
      ignoreKeys: ['timestamp', 'lastUpdated'] // 타임스탬프 필드 무시
    }
  },
  
  preferences: {
    initialValue: { theme: 'light', language: 'en', notifications: true },
    strategy: 'deep' as const,
    comparisonOptions: {
      maxDepth: 5
    }
  },
  
  session: {
    initialValue: { isAuthenticated: false, permissions: [], lastActivity: 0 },
    strategy: 'deep' as const,
    comparisonOptions: {
      ignoreKeys: ['lastActivity'] // 빈번한 업데이트 무시
    }
  }
});
```

## 커스텀 비교 옵션

### 키 무시 패턴
```tsx
// 키 무시와 설정 가이드의 FormStores 패턴 사용
interface TrackingFormStores {
  userActivity: {
    userId: string;
    actions: string[];
    timestamp: number;
    sessionId: string;
  };
}

const {
  Provider: FormStoreProvider,
  useStore: useFormStore
} = createDeclarativeStorePattern<TrackingFormStores>('Form', {
  userActivity: {
    initialValue: { 
      userId: '', 
      actions: [], 
      timestamp: 0, 
      sessionId: '' 
    },
    strategy: 'shallow' as const,
    comparisonOptions: {
      ignoreKeys: ['timestamp', 'sessionId'] // 이러한 변경에 대해서는 재렌더링하지 않음
    }
  }
});
```

### 커스텀 비교자 패턴
```tsx
// 검색 결과를 위한 커스텀 비교로 ProductStores 패턴 확장
interface AdvancedProductStores extends ProductStores {
  searchResults: SearchResult[];
  coordinates: { x: number; y: number };
}

const {
  Provider: ProductStoreProvider,
  useStore: useProductStore
} = createDeclarativeStorePattern<AdvancedProductStores>('Product', {
  // 기본 ProductStores 필드
  catalog: [] as Product[],
  categories: [] as Category[],
  filters: {},
  cart: { items: [], total: 0, discounts: [] },
  
  // 커스텀 비교를 가진 고급 필드
  searchResults: {
    initialValue: [] as SearchResult[],
    comparisonOptions: {
      customComparator: (oldResults, newResults) => {
        // 커스텀 로직: 결과 수나 첫 번째 항목이 변경된 경우에만 재렌더링
        return oldResults.length === newResults.length && 
               oldResults[0]?.id === newResults[0]?.id;
      }
    }
  },
  
  coordinates: {
    initialValue: { x: 0, y: 0 },
    comparisonOptions: {
      customComparator: (oldCoords, newCoords) => {
        // 의미 있는 이동(>5px)인 경우에만 재렌더링
        const distance = Math.sqrt(
          Math.pow(newCoords.x - oldCoords.x, 2) + 
          Math.pow(newCoords.y - oldCoords.y, 2)
        );
        return distance < 5;
      }
    }
  }
});
```

## 디버그 설정

```tsx
// 디버그 설정과 설정 가이드의 UIStores 패턴 사용
const {
  Provider: UIStoreProvider,
  useStore: useUIStore
} = createDeclarativeStorePattern<UIStores>('UI', {
  modal: {
    initialValue: { isOpen: false, type: undefined, data: undefined },
    debug: true,  // 상세한 로깅 활성화
    tags: ['ui', 'modal'], // 로그 필터링용 태그
    version: '2.1.0', // 디버깅용 버전
    description: '디버깅이 활성화된 모달 상태'
  },
  
  loading: {
    initialValue: { global: false, operations: {} },
    debug: true,
    description: '로딩 상태 추적'
  },
  
  notifications: {
    initialValue: { items: [], maxVisible: 5 },
    debug: true,
    tags: ['notifications', 'critical'],
    description: '중요 알림 시스템'
  },
  
  navigation: {
    initialValue: { currentRoute: '', history: [], params: {} },
    debug: false // 자주 변경되는 네비게이션에 대해 디버그 비활성화
  }
});

// 디버그 출력 예제:
// [Store:UI:modal] 값 변경됨: { isOpen: true, type: 'confirmation' }
// [Store:UI:notifications] 구독자에게 알림: 3
// [Store:UI:loading] 성능: 0.23ms
```

## 성능 모니터링

```tsx
// 성능 추적과 ProductStores 패턴 사용
interface MonitoredProductStores extends ProductStores {
  performanceData: {
    metrics: PerformanceMetric[];
    alerts: Alert[];
  };
}

const {
  Provider: ProductStoreProvider,
  useStore: useProductStore
} = createDeclarativeStorePattern<MonitoredProductStores>('Product', {
  // 표준 ProductStores 필드
  catalog: [] as Product[],
  categories: [] as Category[],
  filters: {},
  cart: { items: [], total: 0, discounts: [] },
  
  // 성능 모니터링 스토어
  performanceData: {
    initialValue: { metrics: [], alerts: [] },
    strategy: 'shallow' as const,
    debug: true,
    description: '성능 모니터링 데이터',
    comparisonOptions: {
      customComparator: (oldData, newData) => {
        // 성능 영향 로깅
        const startTime = performance.now();
        const isEqual = oldData.metrics.length === newData.metrics.length;
        const endTime = performance.now();
        
        if (endTime - startTime > 1) {
          console.warn(`느린 비교 감지: ${endTime - startTime}ms`);
        }
        
        return isEqual;
      }
    }
  }
});
```

## 메모리 최적화

```tsx
// 설정 패턴을 사용한 메모리 효율적인 스토어 설정
interface MemoryOptimizedUIStores extends UIStores {
  largeList: LargeItem[];
  circularData: any;
}

const {
  Provider: UIStoreProvider,
  useStore: useUIStore
} = createDeclarativeStorePattern<MemoryOptimizedUIStores>('UI', {
  // 표준 UIStores 필드
  modal: { isOpen: false, type: undefined, data: undefined },
  loading: { global: false, operations: {} },
  notifications: { items: [], maxVisible: 5 },
  navigation: { currentRoute: '', history: [], params: {} },
  
  // 메모리 최적화 필드
  largeList: {
    initialValue: [] as LargeItem[],
    strategy: 'reference' as const, // 비용이 많이 드는 깊은 비교 피하기
    comparisonOptions: {
      maxDepth: 1, // 비교 깊이 제한
      ignoreKeys: ['metadata', 'timestamps'] // 필수적이지 않은 데이터 무시
    }
  },
  
  circularData: {
    initialValue: {} as any,
    comparisonOptions: {
      maxDepth: 3, // 순환 참조에서 무한 재귀 방지
      customComparator: (old, new_) => {
        // 순환 참조를 안전하게 처리
        try {
          return JSON.stringify(old) === JSON.stringify(new_);
        } catch {
          return old === new_; // 참조 비교로 대체
        }
      }
    }
  }
});
```

## 모범 사례

1. **설정 패턴 따르기**: [기본 스토어 설정](../setup/basic-store-setup.md#common-store-patterns)의 확립된 스토어 인터페이스 사용
   - `UserStores`: 사용자 프로필, 기본 설정 및 세션 관리
   - `ProductStores`: 제품 카탈로그, 카테고리, 필터 및 쇼핑 카트
   - `UIStores`: 모달, 로딩, 알림 및 네비게이션 상태
   - `FormStores`: 폼 데이터, 검증 및 오류 처리

2. **전략 선택**: 가장 효율적인 비교 전략 선택
   - `reference`: 불변 데이터와 큰 객체에 대해 (ProductStores.catalog)
   - `shallow`: 최상위 변경이 있는 간단한 객체에 대해 (UserStores.profile)
   - `deep`: 중첩 객체에 대해서만 필요한 경우 (FormStores validation)

3. **타입 안전성**: 적절한 TypeScript 인터페이스로 설정 패턴 확장
   - 확장을 위해 `interface ExtendedStores extends BaseStores` 사용
   - 설정 패턴 정의와 타입 일관성 유지

4. **관련 없는 키 무시**: 타임스탬프와 메타데이터 필드에 `ignoreKeys` 사용
   - 일반적인 패턴: `ignoreKeys: ['timestamp', 'lastUpdated', 'sessionId']`

5. **커스텀 비교자**: 도메인별 비교 로직 구현
   - 큰 데이터셋에 대한 성능 최적화
   - 도메인별 요구에 대한 비즈니스 로직 기반 비교

6. **성능 모니터링**: 개발에서 디버그 모드와 타이밍 사용
   - 개발 중 중요한 스토어에 대해 디버그 활성화
   - 커스텀 비교자로 비교 성능 모니터링

7. **메모리 관리**: 중첩 객체에 적절한 `maxDepth` 설정
   - 순환 참조로 무한 재귀 방지
   - 데이터 구조에 기반한 비교 깊이 최적화

8. **프로덕션 최적화**: 프로덕션 빌드에서 디버그 모드 비활성화
   - 환경 기반 디버그 설정 사용
   - 개발 전용 로깅과 성능 추적 제거

## 일반적인 설정 패턴

```tsx
// 설정 패턴을 사용한 실제 설정 예제
// 설정 가이드의 UserStores와 FormStores 패턴 결합
interface RealWorldStores {
  // UserStores 패턴에서
  userProfile: {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'user' | 'guest';
  };
  userPreferences: {
    theme: 'light' | 'dark';
    language: 'en' | 'ko' | 'ja' | 'zh';
    notifications: boolean;
    lastUpdated: number;
  };
  
  // ProductStores 패턴에서 (캐시용)
  dataCache: Map<string, any>;
  
  // FormStores 패턴에서 (적응)
  formState: {
    fields: Record<string, any>;
    validation: Record<string, boolean>;
    errors: Record<string, string>;
  };
}

const {
  Provider: RealWorldStoreProvider,
  useStore: useRealWorldStore
} = createDeclarativeStorePattern<RealWorldStores>('RealWorld', {
  // 사용자 데이터 - 프로필 업데이트를 위한 얕은 비교 (UserStores 패턴)
  userProfile: {
    initialValue: { id: '', name: '', email: '', role: 'guest' },
    strategy: 'shallow' as const
  },
  
  // UI 기본 설정 - 타임스탬프 무시 (UserStores 패턴 확장)
  userPreferences: {
    initialValue: { theme: 'light', language: 'en', notifications: true, lastUpdated: 0 },
    strategy: 'shallow' as const,
    comparisonOptions: { ignoreKeys: ['lastUpdated'] }
  },
  
  // 큰 데이터셋 - 성능을 위한 참조 등가성 (ProductStores 패턴)
  dataCache: {
    initialValue: new Map(),
    strategy: 'reference' as const
  },
  
  // 폼 상태 - 중첩 검증을 위한 깊은 비교 (FormStores 패턴)
  formState: {
    initialValue: { fields: {}, validation: {}, errors: {} },
    strategy: 'deep' as const,
    comparisonOptions: { maxDepth: 3 }
  }
});
```

## 설정 패턴과의 통합

이 설정 가이드는 [기본 스토어 설정](../setup/basic-store-setup.md)에서 확립된 기반 위에 구축됩니다. 주요 통합 지점:

### 타입 재사용
- **기본 인터페이스**: `UserStores`, `ProductStores`, `UIStores`, `FormStores`를 기반으로 사용
- **확장 패턴**: 고급 설정 요구에 대해 기본 인터페이스를 확장
- **타입 안전성**: 설정 패턴 타입 정의와 일관성 유지

### 설정 정렬
- **전략 일관성**: 설정 패턴 스토어에 설정 전략 적용
- **프로바이더 명명**: 설정 패턴의 표준 명명 규칙 따르기
- **컨텍스트 통합**: 설정 컨텍스트 생성 및 프로바이더 패턴과 정렬

### 모범 사례 준수
- **90%+ 설정 준수**: 모든 예제는 확립된 설정 패턴을 따름
- **재사용 가능한 설정**: 설정 옵션은 모든 설정 패턴 스토어와 작동
- **성능 최적화**: 고급 기능은 설정 패턴 성능을 향상

## 관련 패턴

- **[기본 스토어 설정](../setup/basic-store-setup.md)** - 스토어 설정을 위한 기본 패턴
- **[스토어 성능 패턴](./performance-patterns.md)** - 성능 최적화 기법
- **[useStoreValue 패턴](./useStoreValue-patterns.md)** - 효율적인 스토어 값 사용
- **[MVVM 아키텍처](../architecture/mvvm.md)** - 스토어 설정을 위한 아키텍처 컨텍스트