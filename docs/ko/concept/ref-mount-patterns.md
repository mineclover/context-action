# RefContext 마운트 상태 패턴

## 개요

RefContext는 마운트 상태를 처리하는 여러 패턴을 제공합니다. 이러한 패턴 간의 차이점을 이해하는 것은 올바른 구현에 중요합니다.

## ✅ 권장: 반응형 마운트 상태 패턴

진정으로 반응형인 마운트 상태 구독을 위해 `useRefMountState`를 사용하세요:

```typescript
const mountState = useRefMountState('container');
const { isMounted, mountedTarget } = mountState;

useEffect(() => {
  if (isMounted && mountedTarget) {
    console.log('Container mounted');
    // 마운트 관련 작업 수행
  } else {
    console.log('Container unmounted');
    // 정리 또는 기능 비활성화
  }
}, [isMounted, mountedTarget]);
```

### 이점
- **자동 상태 업데이트**: 마운트/언마운트 상태 변경이 자동으로 리렌더링을 트리거
- **수동 정리 불필요**: 언마운트 시 수동으로 상태를 false로 설정할 필요 없음
- **타입 안전성**: 적절한 타이핑으로 완전한 TypeScript 지원
- **반응형**: React의 반응형 모델과 자연스럽게 통합

## ⚠️ 일반적인 함정: onMount 콜백 패턴

`onMount` 콜백 패턴에는 미묘하지만 중요한 제한이 있습니다:

```typescript
// ⚠️ 문제가 있는 패턴
const [isContainerMounted, setIsContainerMounted] = useState(false);

useEffect(() => {
  const unregister = containerRef.onMount((element) => {
    setIsContainerMounted(true); // ✅ 마운트 처리
  });
  
  return unregister; // ❌ 콜백만 등록 해제, 상태 업데이트 안함!
}, [containerRef]);

// 문제: 언마운트될 때 isContainerMounted가 true로 남아있음!
```

### 문제점

`onMount`에서 반환되는 `unregister` 함수는:
- ✅ 내부 콜백 세트에서 콜백을 제거
- ❌ 로컬 상태를 업데이트하지 않음
- ❌ 언마운트 이벤트에 대해 알리지 않음

### onMount를 사용한 올바른 사용법

`onMount`를 사용해야 한다면, 언마운트를 수동으로 처리하세요:

```typescript
const [isContainerMounted, setIsContainerMounted] = useState(false);

useEffect(() => {
  const unregister = containerRef.onMount((element) => {
    setIsContainerMounted(true);
  });
  
  return () => {
    unregister();
    setIsContainerMounted(false); // ✅ 수동으로 언마운트 처리
  };
}, [containerRef]);
```

## 패턴 비교

| 패턴 | 마운트 감지 | 언마운트 감지 | 반응성 | 권장 |
|------|-------------|---------------|--------|------|
| `useRefMountState` | ✅ 자동 | ✅ 자동 | ✅ 완전 | ✅ 예 |
| `onMount` 콜백 | ✅ 수동 | ❌ 제공되지 않음 | ⚠️ 부분적 | ❌ 아니오 |
| `executeIfMounted` | N/A | N/A | ❌ 없음 | ⚠️ 조건부 |

## 모범 사례

### 1. 상태 의존적 UI에는 항상 반응형 패턴 사용

```typescript
// ✅ 좋음: 반응형 마운트 상태
const { isMounted, mountedTarget } = useRefMountState('container');

return (
  <div>
    {isMounted ? '✅ 마운트됨' : '❌ 마운트되지 않음'}
  </div>
);
```

### 2. 일회성 초기화에만 onMount 사용

```typescript
// ✅ 괜찮음: React 상태에 영향을 주지 않는 일회성 설정
useEffect(() => {
  const unregister = ref.onMount((element) => {
    // 서드파티 라이브러리 초기화
    initializeLibrary(element);
  });
  
  return unregister;
}, [ref]);
```

### 3. 필요할 때 패턴 결합

```typescript
// ✅ 좋음: 반응형 상태 + 초기화 콜백
const { isMounted } = useRefMountState('container');

useEffect(() => {
  const unregister = ref.onMount((element) => {
    // 일회성 초기화
    setupEventListeners(element);
  });
  
  return unregister;
}, [ref]);

// UI용 반응형 상태 사용
useEffect(() => {
  if (isMounted) {
    enableFeatures();
  } else {
    disableFeatures();
  }
}, [isMounted]);
```

## 마이그레이션 가이드

### onMount에서 useRefMountState로

이전:
```typescript
const [mounted, setMounted] = useState(false);

useEffect(() => {
  const unregister = ref.onMount(() => {
    setMounted(true);
  });
  return () => {
    unregister();
    setMounted(false); // 잊기 쉬움!
  };
}, [ref]);
```

이후:
```typescript
const { isMounted } = useRefMountState('refName');
// 끝! 수동 상태 관리 불필요
```

## 요약

- **항상 `useRefMountState` 선호** 반응형 마운트 상태 관리용
- **알아두기** `onMount`의 unregister 함수는 언마운트 상태를 처리하지 않음
- **onMount 사용** React 상태에 영향을 주지 않는 일회성 초기화용으로만
- **패턴 결합** 반응형 상태와 초기화 콜백이 모두 필요할 때