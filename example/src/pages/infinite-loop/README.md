# 🧪 Infinite Loop Test Environment

## 개요
이 테스트 환경은 React + Context-Action Store 통합에서 발생할 수 있는 무한 루프 패턴을 실제로 체험하고 해결책을 검증할 수 있는 데모 페이지입니다.

## 접속 방법
- URL: `/infinite-loop/test`
- 네비게이션: 사이드바의 "🧪 Infinite Loop Test" 클릭

## 주요 기능

### 1. 📊 실시간 렌더링 모니터링
- **렌더링 카운터**: 각 컴포넌트의 렌더링 횟수 실시간 표시
- **콘솔 로깅**: useEffect 호출과 컴포넌트 생명주기 추적
- **시각적 경고**: 무한 루프 감지 시 경고 표시

### 2. 🎛️ 인터랙티브 컨트롤
- **컴포넌트 타입 토글**: 좋은/나쁜 컴포넌트 패턴 비교
- **마운트/언마운트 제어**: 컴포넌트 생명주기 테스트
- **페이지 ID 변경**: props 변경에 따른 렌더링 동작 관찰
- **자동 리마운트**: 3초마다 자동으로 컴포넌트 재마운트 (선택사항)

### 3. 🔍 패턴 비교

#### ❌ Bad Component (무한 루프 유발)
```typescript
// 문제가 되는 패턴들:
const config = useStoreValue(configStore) ?? { 
  maxLogs: 50,
  pageId // ❌ 매번 새로운 객체 생성
};

useEffect(() => {
  stores.logs.setValue([initLog]); // ❌ 직접 store 조작
}, [pageId, stores, config]); // ❌ 불안정한 의존성
```

**증상:**
- 렌더링 카운트가 급속히 증가 (>10)
- 콘솔에 useEffect 호출 로그 반복 출력
- 브라우저 성능 저하
- React DevTools 경고 메시지

#### ✅ Good Component (안정적)
```typescript
// 해결된 패턴들:
const fallbackConfig = useMemo(() => ({ 
  maxLogs: 50,
  pageId 
}), [pageId]); // ✅ 안정적인 참조

useEffect(() => {
  stableAPI.addLog(`초기화: ${pageId}`); // ✅ API 사용
}, [pageId, stableAPI]); // ✅ 안정적인 의존성
```

**결과:**
- 안정적인 렌더링 카운트 (≤3)
- 깨끗한 useEffect 생명주기
- 예측 가능한 성능
- 메모리 누수 없음

## 테스트 시나리오

### 🧪 기본 테스트
1. "Good Component" 선택 후 Mount → 정상 동작 확인
2. "Bad Component" 선택 후 Mount → 무한 루프 관찰
3. 개발자 도구 콘솔에서 로그 패턴 비교

### 🔄 라이프사이클 테스트
1. Auto Remount 활성화
2. 컴포넌트 마운트/언마운트 반복 관찰
3. 메모리 사용량 및 성능 변화 모니터링

### ⚙️ Props 변경 테스트
1. Page ID 변경 (예: test-page-1 → test-page-2)
2. 각 컴포넌트의 반응 차이 관찰
3. 의존성 배열 동작 검증

## 학습 포인트

### 1. Store 직접 조작의 위험성
- `useEffect`에서 `setValue()` 직접 호출 금지
- `_notifyListeners` → React rerender → 무한 루프 발생

### 2. fallbackConfig 패턴
- `useMemo`를 사용한 안정적인 fallback 객체 생성
- 불필요한 리렌더링 방지

### 3. 의존성 배열 관리
- 안정적인 참조만 의존성으로 사용
- 불안정한 객체 참조 회피

## 확장 가능성
- 다른 무한 루프 패턴 추가
- 성능 메트릭 수집 기능
- A/B 테스트 환경 구현
- 자동화된 테스트 스위트 연동