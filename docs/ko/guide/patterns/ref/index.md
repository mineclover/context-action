# Ref 패턴

React 리렌더링 없이 고성능 UI를 위한 직접 DOM 조작 패턴입니다.

## 개요

Ref 패턴은 React 리렌더링을 트리거하지 않고 하드웨어 가속 DOM 조작을 제공하여 애니메이션, 실시간 상호작용, 싱글톤 객체 관리에 완벽합니다.

**🚀 빠른 시작**: 전체 설정 패턴과 타입 정의는 **[RefContext 설정](../setup/ref-context-setup.md)**으로 시작하세요.

### 선행 요건

**필수 설정 가이드**: **[RefContext 설정](../setup/ref-context-setup.md)**에서 제공하는 내용:
- **타입 정의**: DOM 요소, 서비스, 워커, WASM 모듈
- **컨텍스트 생성**: 기본 및 고급 RefContext 패턴
- **프로바이더 설정**: 단일, 다중, 조건부 프로바이더 패턴
- **초기화**: 지연 로딩 및 서비스 초기화 전략

### 사용 가능한 Ref 패턴

모든 패턴은 **[RefContext 설정](../setup/ref-context-setup.md)**의 타입과 설정을 사용합니다:

- **[기본 사용법](./basic-usage.md)** - **UIRefs** 설정을 사용한 기본 RefContext 패턴
- **[컨텍스트 싱글톤 처리](./singleton-handling.md)** - **ServiceRefs**와 **DatabaseRefs** 관리
- **[멀티 컨텍스트](./multi-context.md)** - **멀티 도메인 RefContext** 구성 패턴
- **[성능](./performance.md)** - **WorkerRefs**와 **WASMRefs** 최적화 개요

### 성능 최적화 가이드

**[RefContext 설정](../setup/ref-context-setup.md)**을 기반으로 한 고급 패턴:

- **[캔버스 최적화](./canvas-optimization.md)** - **WorkerRefs** 통합을 통한 **CanvasRefs** 성능
- **[하드웨어 가속](./hardware-acceleration.md)** - GPU 가속 **DOM 요소 Refs**
- **[메모리 최적화](./memory-optimization.md)** - **서비스 및 라이브러리 Refs** 정리 패턴

## 설정 기반 빠른 참고

| 패턴 | 사용되는 설정 타입 | 프로바이더 패턴 | 최적 용도 |
|---------|------------------|-----------------|----------|
| **[기본 사용법](./basic-usage.md)** | `UIRefs`, `FormRefs` | [단일 RefContext 프로바이더](../setup/ref-context-setup.md#single-refcontext-provider) | 마우스 추적, 단순 애니메이션 |
| **[컨텍스트 싱글톤 처리](./singleton-handling.md)** | `ServiceRefs`, `DatabaseRefs`, `AnalyticsRefs` | [서비스 초기화](../setup/ref-context-setup.md#service-initialization) | 사용자 데이터베이스, 외부 서비스, 테스트 목킹 |
| **[멀티 컨텍스트](./multi-context.md)** | `PerformanceRefs`, `MediaRefs`, `ExternalRefs` | [멀티 도메인 RefContext 설정](../setup/ref-context-setup.md#multi-domain-refcontext-setup) | 복잡한 UI, 관심사 분리 |
| **[캔버스 최적화](./canvas-optimization.md)** | `CanvasRefs`, `WorkerRefs` | [워커 초기화](../setup/ref-context-setup.md#worker-initialization) | 그리기 앱, 실시간 그래픽 |
| **[하드웨어 가속](./hardware-acceleration.md)** | `UIRefs`, `MediaRefs` | [DOM 요소 Refs](../setup/ref-context-setup.md#dom-element-refs) | 부드러운 애니메이션, 고빈도 업데이트 |
| **[메모리 최적화](./memory-optimization.md)** | `ServiceRefs`, `WASMRefs` | [지연 초기화](../setup/ref-context-setup.md#lazy-initialization) | 대규모 앱, 누수 방지 |

## Ref 패턴을 사용해야 하는 경우

Ref 패턴은 **[RefContext 설정](../setup/ref-context-setup.md)**에서 정의된 시나리오에 이상적입니다:

- **고성능 UI**: **[DOM 요소 Refs](../setup/ref-context-setup.md#dom-element-refs)**를 사용한 60fps 애니메이션
- **직접 DOM 조작**: **CanvasRefs**, **MediaRefs**가 React 렌더링을 우회
- **하드웨어 가속**: **UIRefs** 패턴을 통한 GPU 가속 변환
- **실시간 상호작용**: **FormRefs**를 통한 마우스 추적, 제스처 인식
- **Canvas/SVG 작업**: **[캔버스 및 그래픽 Refs](../setup/ref-context-setup.md#dom-element-refs)**를 사용한 직접 조작
- **컨텍스트 싱글톤 관리**: 사용자별 연결, 테스트 격리를 위한 **[서비스 및 라이브러리 Refs](../setup/ref-context-setup.md#service-and-library-refs)**
- **무거운 계산**: **[웹 워커](../setup/ref-context-setup.md#heavy-computation-refs)** 및 **WebAssembly** 통합

## 주요 기능

RefContext는 **[RefContext 설정](../setup/ref-context-setup.md)** 패턴을 통해 모든 기능을 제공합니다:

- ✅ **React 리렌더링 없음** - 직접 ref 액세스를 통한 DOM 조작
- ✅ **하드웨어 가속 변환** - GPU 최적화된 **DOM 요소 Refs** 사용
- ✅ **타입 안전 ref 관리** - 포괄적인 타입 정의 포함
- ✅ **자동 라이프사이클 관리** - **[프로바이더 설정 패턴](../setup/ref-context-setup.md#provider-setup-patterns)** 통해
- ✅ **완벽한 관심사 분리** - **[멀티 도메인 RefContext](../setup/ref-context-setup.md#multi-domain-refcontext-setup)** 통해
- ✅ **메모리 효율적** - **[지연 초기화](../setup/ref-context-setup.md#lazy-initialization)** 및 자동 정리

## 성능 비교

| 방식 | React 리렌더링 | 성능 | 메모리 | 설정 복잡도 |
|----------|------------------|-------------|---------|------------------|
| **useState** | 매번 업데이트 | ~30fps | 높은 GC | 간단 |
| **useRef** | 수동 확인 | ~45fps | 보통 | 보통 |
| **RefContext** | 없음 | 60fps+ | 낮음 | **[설정 가이드](../setup/ref-context-setup.md)** |

## 다른 패턴과의 통합

Ref 패턴은 **[RefContext 설정](../setup/ref-context-setup.md)** 프로바이더 구성을 통해 원활하게 통합됩니다:

- **[스토어 패턴](../store/)**과 상태 관리 - **[통합 MVVM 설정](../setup/ref-context-setup.md#integrated-with-store-and-action-contexts)** 통해
- **[액션 패턴](../action/)**과 비즈니스 로직 - **[프로바이더 구성](../setup/ref-context-setup.md#multiple-refcontext-providers)** 통해
- **[비동기 패턴](../async/)**과 안전한 비동기 작업 - **[서비스 초기화](../setup/ref-context-setup.md#service-initialization)** 통해

## 설정 통합 예제

모든 통합 패턴은 **[RefContext 설정](../setup/ref-context-setup.md)**에서 자세히 설명됩니다:

- **[단일 프로바이더 설정](../setup/ref-context-setup.md#single-refcontext-provider)** - 기본 통합
- **[다중 프로바이더](../setup/ref-context-setup.md#multiple-refcontext-providers)** - 복잡한 애플리케이션
- **[조건부 설정](../setup/ref-context-setup.md#conditional-refcontext-setup)** - 기능 기반 로딩
- **[MVVM 통합](../setup/ref-context-setup.md#integrated-with-store-and-action-contexts)** - 전체 아키텍처