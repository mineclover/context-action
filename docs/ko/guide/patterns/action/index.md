# 액션 패턴

상태 관리 오버헤드 없이 순수한 액션 디스패칭 패턴입니다.

## 개요

액션 패턴은 이벤트 시스템, 커맨드 패턴, 부수 효과 처리에 완벽합니다. 모든 액션 패턴은 **[기본 액션 설정](../setup/basic-action-setup.md)** 가이드의 표준화된 설정 명세를 기반으로 구축됩니다.

## 필수 조건

액션 패턴을 구현하기 전에 설정 과정을 완료하세요:

1. **타입 정의** → [공통 액션 패턴](../setup/basic-action-setup.md#common-action-patterns)
2. **컨텍스트 생성** → [컨텍스트 생성 패턴](../setup/basic-action-setup.md#context-creation-patterns)  
3. **프로바이더 설정** → [프로바이더 설정 패턴](../setup/basic-action-setup.md#provider-setup-patterns)

액션 패턴 문서의 모든 예제는 표준화된 설정 패턴을 사용합니다. 특히:
- 기본 예제용 **EventActions** 타입 패턴
- **단일 도메인 컨텍스트** 생성 패턴
- 컴포넌트 통합용 **단일 프로바이더 설정**

## 사용 가능한 액션 패턴

### 핵심 패턴
- **[기본 사용법](./basic-usage.md)** - 타입 안전 디스패칭을 갖춘 기본 액션 온리 패턴
  - *기본 액션 설정의 EventActions 설정 패턴 사용*
- **[타입 시스템](./type-system.md)** - TypeScript 통합 및 타입 안전성
  - *설정 가이드의 ActionPayloadMap 확장 패턴 기반*
- **[등록 위임](./register-delegation.md)** - 대규모 애플리케이션용 모듈식 핸들러 구성
  - *멀티 도메인 컨텍스트 설정 패턴 사용*

### 고급 패턴
- **[고급 패턴](./advanced-patterns.md)** - 모든 고급 액션 패턴 개요
  - *복잡한 아키텍처용 다중 설정 패턴 쇼케이스*
- **[디스패치 패턴](./dispatch-patterns.md)** - 실행 모드, 필터링, 성능
  - *설정의 AppActions 확장 인터페이스 패턴 사용*
- **[결과와 함께 디스패치](./dispatch-with-result.md)** - 결과 수집 및 처리
  - *결과 처리 확장을 포함한 설정 패턴 기반*
- **[등록 패턴](./register-patterns.md)** - 고급 핸들러 등록
  - *복잡한 시나리오용 조건부 프로바이더 설정 패턴 사용*
- **[디스패치 접근](./dispatch-access.md)** - 훅 기반 vs 등록 기반 접근
  - *다른 접근 전략을 위한 설정 패턴 변형 시연*
- **[핸들러 상태 접근](./handler-state-access.md)** - ⚠️ **중요**: 핸들러에서 클로저 함정 피하기
  - *적절한 설정 및 핸들러 라이프사이클 관리를 위한 필수 패턴*

## 빠른 참조

모든 예제는 표준화된 **[기본 액션 설정](../setup/basic-action-setup.md)** 명세를 사용합니다.

### 설정 기반 빠른 시작

```typescript
// 1. EventActions 타입 패턴 사용 (설정 가이드에서)
interface EventActions {
  userClick: { x: number; y: number };
  analytics: { event: string; data: any };
}

// 2. 단일 도메인 컨텍스트 패턴 사용 (설정 가이드에서)
const {
  Provider: EventActionProvider,
  useActionDispatch: useEventDispatch,
  useActionHandler: useEventHandler
} = createActionContext<EventActions>('Events');

// 3. 단일 프로바이더 설정 패턴 사용 (설정 가이드에서)
function App() {
  return (
    <EventActionProvider>
      <InteractiveComponent />
    </EventActionProvider>
  );
}

// 4. 설정 패턴을 사용한 컴포넌트 구현
function InteractiveComponent() {
  const dispatch = useEventDispatch();
  
  const clickHandler = useCallback((payload) => {
    console.log('클릭 위치:', payload.x, payload.y);
  }, []);
  
  useEventHandler('userClick', clickHandler);
  
  return <button onClick={(e) => 
    dispatch('userClick', { x: e.clientX, y: e.clientY })
  }>
    클릭하세요
  </button>;
}
```

### 패턴 참조

| 패턴 | 설정 기반 | 최적 사용 사례 |
|---------|------------------|----------|
| **기본 사용법** | EventActions + 단일 도메인 | 이벤트 시스템, 분석, API 호출 |
| **고급 패턴** | 멀티 도메인 설정 | 복잡한 애플리케이션, 도메인 분리 |
| **등록 위임** | 멀티 컨텍스트 설정 | 대규모 앱, 팀 분리, 모듈식 아키텍처 |

## 언제 액션 패턴을 사용할까요

표준화된 설정을 기반으로 구축된 액션 패턴을 선택하는 경우:

- **순수 부수 효과**: 분석, 로깅, 알림
- **커맨드 패턴**: 사용자 액션, 시스템 명령  
- **이벤트 시스템**: 컴포넌트 간 통신
- **API 통합**: 외부 서비스 호출
- **모듈식 아키텍처**: 팀 기반 핸들러 분리

모든 구현은 일관성과 유지보수성을 위해 설정 명세를 따릅니다.

## 주요 기능

액션 패턴은 표준화된 설정을 통해 다음 기능들을 제공합니다:

- ✅ 타입 안전 액션 디스패칭 (ActionPayloadMap 확장을 통해)
- ✅ 우선순위 기반 핸들러 실행 (적절한 컨텍스트 생성을 통해)
- ✅ 중단 지원 및 에러 처리 (설정 패턴에 내장)
- ✅ 비동기 지원으로 결과 처리 (useActionDispatchWithResult를 통해)
- ✅ 경량 (스토어 오버헤드 없음, 설정 최적화)
- ✅ 모듈식 핸들러 구성 (멀티 도메인 설정 패턴을 통해)

## 설정 기반 아키텍처 통합

액션 패턴은 공유 설정 기반을 통해 다른 패턴과 원활하게 통합됩니다:

- **[스토어 패턴](../store/)** - 상태 관리를 위한 스토어 설정과 결합
- **[설정 패턴](../setup/)** - 모든 액션 구현의 기반
- **[아키텍처 패턴](../architecture/)** - MVVM 및 도메인 컨텍스트 통합
- **멀티 컨텍스트 설정** - 복잡한 애플리케이션 아키텍처

### 설정 통합 플로우

1. **설정으로 시작** → [기본 액션 설정](../setup/basic-action-setup.md)
2. **패턴 선택** → 이 가이드에서 적절한 액션 패턴 선택
3. **컴포넌트 구현** → 각 패턴의 설정 기반 예제 사용
4. **아키텍처 확장** → 복잡한 앱을 위한 멀티 컨텍스트 설정으로 확장

## 다음 단계

1. **설정 완료**: [기본 액션 설정](../setup/basic-action-setup.md)을 먼저 따르기
2. **기본부터 시작**: [기본 사용법](./basic-usage.md)으로 시작하기
3. **고급 탐색**: 준비되면 [고급 패턴](./advanced-patterns.md)으로 이동
4. **확장**: 복잡한 애플리케이션을 위해 [등록 위임](./register-delegation.md) 사용