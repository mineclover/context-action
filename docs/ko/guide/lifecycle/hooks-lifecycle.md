# 훅 라이프사이클

Context-Action React 훅은 적절한 리소스 관리, 메모리 정리, 최적 성능을 보장하기 위해 특정 라이프사이클 패턴을 따릅니다. 이 가이드는 **훅의 내부 동작 방식**을 설명합니다 - 라이프사이클, 정리 메커니즘, 성능 특성을 다룹니다.

## 관련 가이드

- 🎯 **[React 훅](./hooks.md)** - 훅 사용 방법 (API 예제와 사용 패턴)
- 📚 **[훅 참조](/ko/concept/hooks-reference)** - 사용 가능한 모든 훅의 완전한 목록  
- ✅ **[모범 사례](../best-practices.md)** - 코딩 패턴과 규칙

---

## 핵심 라이프사이클 개념

### 훅 등록 및 정리 패턴

모든 Context-Action 훅은 일관된 **등록-및-정리** 라이프사이클을 따릅니다:

1. **마운트**: 훅이 리소스를 등록 (핸들러, 구독, ref)
2. **업데이트**: 의존성이 변경되면 필요에 따라 훅이 재등록
3. **언마운트**: 자동 정리로 메모리 누수 방지

이 패턴은 다음을 보장합니다:
- 컴포넌트 언마운트 시 리소스가 적절히 정리됨
- 메모리 누수가 방지됨
- 핸들러 등록이 성능을 위해 최적화됨

## 액션 훅 라이프사이클

### `useActionHandler()` 라이프사이클

Context-Action에서 가장 중요한 라이프사이클 패턴:

\`\`\`tsx
function UserComponent() {
  useActionHandler('updateUser', useCallback(async (payload) => {
    // 핸들러 로직
  }, []), { priority: 1 });
}
\`\`\`

**라이프사이클 단계:**

1. **등록 단계** (마운트/업데이트)
   \`\`\`tsx
   useEffect(() => {
     // 고유 ID로 핸들러 등록
     const unregister = register.register(action, handler, config);
     
     // 정리 함수 반환
     return unregister;
   }, [action, actionId]); // 액션이나 ID가 변경될 때 재등록
   \`\`\`

2. **실행 단계** (런타임)
   - 액션이 디스패치될 때 핸들러가 실행됨
   - 현재 ref 값 사용 (오래된 클로저 아님)
   - 우선순위 기반 실행 지원

3. **정리 단계** (언마운트/업데이트)
   - 반환된 정리 함수를 통한 자동 등록 해제
   - 컴포넌트 언마운트 후 핸들러 실행 방지
   - 메모리 누수나 오래된 핸들러 없음

**주요 구현 세부사항:**
- 현재 핸들러 저장을 위해 `useRef` 사용 (오래된 클로저 방지)
- 고유 핸들러 식별을 위해 `useId` 사용
- 의존성 변경 시 ref 업데이트 (재등록 불필요)
- 액션 이름이나 컴포넌트 ID가 변경될 때만 재등록

### `useActionDispatch()` 라이프사이클

컴포넌트 리렌더링에서 안정적인 디스패치 함수 제공:

\`\`\`tsx
const dispatch = useActionDispatch();
// 리렌더링에서 동일한 참조 - useCallback deps에 안전하게 사용 가능
\`\`\`

**라이프사이클 특성:**
- **안정적인 참조**: 빈 deps 배열과 함께 `useCallback` 사용
- **자동 중단**: React 컴포넌트에 대한 자동 취소 활성화
- **오류 경계**: 컨텍스트를 찾을 수 없으면 설명적인 오류 발생

## 스토어 훅 라이프사이클

### `useStoreValue()` 라이프사이클

자동 정리와 함께 스토어 변경사항 구독:

\`\`\`tsx
function UserProfile() {
  const user = useStoreValue(userStore);
  // 자동 구독 관리
}
\`\`\`

**라이프사이클 단계:**

1. **구독 단계** (마운트)
   - 스토어 변경사항 구독
   - 즉시 초기값 획득

2. **업데이트 단계** (스토어 변경)
   - 스토어 값이 실제로 변경될 때만 리렌더링
   - 최적화를 위해 기본적으로 얕은 동등성 사용

3. **정리 단계** (언마운트)
   - 스토어에서 자동으로 구독 해제
   - 메모리 누수 방지

**성능 최적화:**
- 실제 값 변경시에만 리렌더링 (참조 변경 아님)
- 구독 정리는 자동
- 수동 구독 관리 불필요

### `useStore()` 라이프사이클 (Store Pattern에서)

컨텍스트 유효성 검사와 함께 스토어 인스턴스에 대한 접근 제공:

\`\`\`tsx
const profileStore = useUserStore('profile');
\`\`\`

**라이프사이클 특성:**
- **컨텍스트 유효성 검사**: 컨텍스트가 사용 불가능하면 오류 발생
- **타입 안전성**: 적절히 타입화된 스토어 인스턴스 반환
- **안정적인 참조**: 스토어 참조는 리렌더링에서 안정적으로 유지

## RefContext 훅 라이프사이클

### `useRefHandler()` 라이프사이클

마운트/언마운트 처리와 함께 DOM 요소 참조 관리:

\`\`\`tsx
function CanvasComponent() {
  const canvasRef = useCanvasRef('mainCanvas');
  
  useEffect(() => {
    if (canvasRef.target) {
      // 직접 DOM 조작
      canvasRef.target.width = 800;
    }
  }, [canvasRef.target]);
}
\`\`\`

**라이프사이클 단계:**

1. **초기 단계** (마운트)
   - 초기 상태로 ref 핸들러 반환 (`target: null`)
   - 요소 첨부를 위한 `setRef` 함수 제공

2. **마운트 단계** (요소 첨부됨)
   - `setRef(element)`를 통해 요소 첨부
   - 마운트 이벤트 트리거 및 마운트 promise 해결
   - 상태 업데이트: `{ target: element, isMounted: true }`

3. **정리 단계** (언마운트)
   - 요소 분리 (`setRef(null)`)
   - `autoCleanup: true`인 경우 자동 정리
   - 사용자 정의 정리 함수 실행
   - 정리 오류와 함께 마운트 promise 거부

**고급 기능:**
- **마운트 타임아웃**: 요소 마운팅을 위한 설정 가능한 타임아웃
- **자동 정리**: 언마운트 시 자동 리소스 정리
- **마운트 Promise**: 비동기 작업을 위한 `waitForMount()`
- **이벤트 시스템**: 마운트/언마운트/정리 이벤트 알림

## 라이프사이클 패턴 요약

Context-Action 훅은 React의 라이프사이클에 최적화된 일관된 라이프사이클 패턴을 따릅니다. 구체적인 사용 패턴과 모범 사례는 다음을 참조하세요:

- [React 훅 가이드](/ko/guide/hooks) - 훅 사용법과 API 예제
- [모범 사례 가이드](/ko/guide/best-practices) - 코딩 패턴과 규칙
- [훅 참조](/ko/concept/hooks-reference) - 완전한 훅 목록

## 메모리 관리

### 자동 정리 기능

Context-Action 훅은 메모리 누수를 방지하기 위한 자동 정리를 제공합니다:

1. **액션 핸들러 정리**
   - 언마운트 시 핸들러 자동 등록 해제
   - 컴포넌트 언마운트 후 오래된 핸들러 실행 없음

2. **스토어 구독 정리** 
   - 언마운트 시 구독 자동 제거
   - 스토어 리스너로부터 메모리 누수 없음

3. **Ref 리소스 정리**
   - 언마운트 시 사용자 정의 정리 함수 실행
   - 자동 리소스 해제 (Three.js 객체, 이벤트 리스너 등)

4. **컨텍스트 정리**
   - 컨텍스트 언마운트 시 Provider 정리
   - 적절한 ActionRegister 해제

### 수동 정리 제어

고급 시나리오를 위한 수동 정리 제어 사용 가능:

\`\`\`tsx
// 수동 핸들러 등록 해제
const unregister = register.register('action', handler);
// 나중에...
unregister();

// 수동 스토어 구독
const subscription = store.subscribe(callback);
// 나중에...
subscription.unsubscribe();

// 수동 ref 정리
await refStore.cleanup();
\`\`\`

## 성능 특성

Context-Action 훅은 성능을 염두에 두고 설계되었습니다:

- **최소 리렌더링**: 필요할 때만 업데이트 트리거
- **효율적인 등록**: 최적화된 핸들러 관리
- **메모리 안전성**: 자동 정리로 누수 방지

자세한 성능 최적화 기법은 [성능 가이드](/ko/guide/patterns/ref/performance)를 참조하세요.

## 라이프사이클 문제 디버깅

### 일반적인 문제와 해결책

1. **핸들러의 오래된 클로저**
   \`\`\`tsx
   // ❌ 문제: 오래된 상태 캡처
   useActionHandler('action', async () => {
     console.log(someState); // 오래된 값일 수 있음
   });

   // ✅ 해결책: 현재 상태 접근
   useActionHandler('action', useCallback(async () => {
     const current = store.getValue();
     console.log(current);
   }, []));
   \`\`\`

2. **핸들러가 실행되지 않음**
   - Provider가 컴포넌트를 감싸는지 확인
   - 디스패치 전에 핸들러 등록 확인
   - 고유한 핸들러 ID 보장

3. **메모리 누수**
   - 자동 정리가 작동하는지 확인
   - 정리가 필요한 수동 구독 확인
   - React DevTools Profiler를 사용하여 누수 식별

### 디버깅을 위한 라이프사이클 이벤트

RefContext는 디버깅을 위한 라이프사이클 이벤트를 제공합니다:

\`\`\`tsx
const canvasRef = useCanvasRef('canvas');

canvasRef.addEventListener((event) => {
  console.log(\`Ref 이벤트: \${event.type}\`, event);
  // 이벤트: 'mount', 'unmount', 'cleanup', 'error'
});
\`\`\`

이러한 라이프사이클 이해는 Context-Action으로 견고하고 성능이 우수한 React 애플리케이션을 구축하는 데 필수적입니다.