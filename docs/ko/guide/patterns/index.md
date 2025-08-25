# 패턴

이 섹션은 Context-Action 프레임워크를 위한 포괄적인 코드 패턴과 구현 가이드를 포함하고 있습니다.

## 핵심 프레임워크 패턴

### 액션 패턴
- **[액션 패턴](./action/)** - 스토어 관리 없는 순수한 액션 디스패칭
  - [기본 사용법](./action/basic-usage.md) - 기본적인 Action Only 패턴 구현
  - [레지스터 위임](./action/register-delegation.md) - 모듈식 핸들러 구성을 위한 고급 패턴

### 스토어 패턴  
- **[스토어 패턴](./store/)** - 타입 안전 스토어 관리 (권장)
  - [기본 사용법](./store/basic-usage.md) - 타입 추론을 활용한 기본적인 Store Only 패턴
  - [HOC 패턴](./store/hoc-pattern.md) - 자동 Provider 래핑을 위한 고차 컴포넌트 패턴
  - [고급 설정](./store/advanced-config.md) - 성능 최적화 및 커스텀 비교 전략

### Ref 패턴
- **[Ref 패턴](./ref/)** - 제로 리렌더링과 컨텍스트 싱글톤 관리를 통한 직접 DOM 조작
  - [기본 사용법](./ref/basic-usage.md) - 타입 안전 ref 관리를 활용한 기본적인 RefContext 패턴
  - [컨텍스트 싱글톤 처리](./ref/singleton-handling.md) - 지연 평가를 통한 컨텍스트 싱글톤 및 외부 리소스 관리
  - [다중 컨텍스트](./ref/multi-context.md) - 복잡한 애플리케이션을 위한 다중 RefContext 구성
  - [성능](./ref/performance.md) - 하드웨어 가속 및 성능 최적화

### 아키텍처 패턴
- **[아키텍처 패턴](./architecture/)** - 시스템 아키텍처 및 디자인 패턴
  - [MVVM 패턴](./architecture/mvvm.md) - 완벽한 레이어 분리를 갖춘 Model-View-ViewModel 아키텍처
  - [도메인 컨텍스트 패턴](./architecture/domain-context.md) - 다중 도메인 앱을 위한 문서 중심 도메인 분리
  - [구성 전략](./architecture/composition.md) - 복잡한 애플리케이션을 위한 고급 패턴 구성
  - [컨텍스트 분할 패턴](./architecture/context-splitting.md) - 확장성을 위한 대형 컨텍스트 관리 및 분할

### 비동기 패턴
- **[비동기 패턴](./async/)** - 비동기 작업 패턴 및 제어 흐름
  - [실시간 상태 액세스](./async/real-time-state-access.md) - store.getValue()를 통한 클로저 트랩 방지
  - [Wait-Then-Execute](./async/wait-then-execute.md) - 요소 가용성 이후 안전한 DOM 작업
  - [조건부 대기](./async/conditional-await.md) - 조건 기반 스마트 대기
  - [타임아웃 보호](./async/timeout-protection.md) - 폴백 전략을 통한 무한 대기 방지

### 성능 패턴
- **[성능 패턴](./performance/)** - 성능 최적화 기법 및 전략
  - [최적화 기법](./performance/optimization-techniques.md) - 스토어 최적화, 메모이제이션, RefContext 성능

### 디버그 패턴
- **[디버그 패턴](./debug/)** - 프로덕션 디버깅 및 트러블슈팅 패턴
  - [프로덕션 디버깅](./debug/production-debugging.md) - 치명적 문제, 상태 모니터링, 에러 복구, 스트레스 테스팅

## 빠른 시작 가이드

| 패턴 | 사용 사례 | 임포트 | 최적 용도 |
|---------|----------|--------|----------|
| **🎯 Action Only** | 스토어 없는 액션 디스패칭 | `createActionContext` | 이벤트 시스템, 명령 패턴 |
| **🏪 Store Only** | 액션 없는 상태 관리 | `createDeclarativeStorePattern` | 순수 상태 관리, 데이터 레이어 |
| **🔧 Ref Context** | 직접 DOM 조작 및 싱글톤 객체 관리 | `createRefContext` | 고성능 UI, 애니메이션, 외부 서비스 |

**참고**: 복잡한 애플리케이션의 경우 최대 유연성과 관심사 분리를 위해 패턴들을 조합하여 사용하세요.

## 사용 가이드라인

각 패턴은 다음을 포함합니다:
- ✅ **모범 사례** 작업 예제
- ❌ **피해야 할 일반적인 함정**
- 🎯 **사용 사례** 패턴 적용 시기
- ⚡ **성능 고려사항** 및 최적화 팁

## 아키텍처 의사결정 가이드

### 단일 도메인 애플리케이션
1. **간단한 앱**: **Store Only Pattern**으로 시작
2. **인터랙티브 앱**: 비즈니스 로직을 위해 **Action Only Pattern** 추가
3. **고성능 앱**: 애니메이션을 위해 **RefContext Pattern** 추가
4. **복잡한 앱**: 완벽한 레이어 분리를 위해 **MVVM Architecture** 사용

### 다중 도메인 애플리케이션
1. **팀 경계**: 비즈니스 분리를 위해 **Domain Context Architecture** 사용
2. **결합된 접근**: 각 비즈니스 도메인 내에서 **MVVM Architecture** 적용
3. **엔터프라이즈 규모**: 적절한 도메인 격리와 함께 모든 패턴 결합

## 패턴 통합

이러한 패턴들은 복잡한 시나리오를 위해 결합될 수 있습니다:
- **Action Only** + **Store Only** 완전한 비즈니스 로직 분리용
- **RefContext** + **Store Only** 고성능 상태 기반 애니메이션용
- **세 패턴 모두** + **Domain Architecture** 엔터프라이즈 애플리케이션용
- **MVVM Architecture** 완벽한 아키텍처 레이어 분리용