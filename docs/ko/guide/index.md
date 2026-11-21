# 사용자 가이드

Context-Action 프레임워크 사용자 가이드에 오신 것을 환영합니다. 기초 설정부터 단계적 아키텍처 확장 패턴까지 한눈에 살펴볼 수 있습니다.

## 🚀 시작하기

### 핵심 가이드
- **[시작하기](./getting-started.md)** - 점진적 도입 단계, 설치, React/Headless/Ref 빠른 시작
- **[파이프라인 시스템](./pipeline/)** - 액션 처리 파이프라인, 우선순위, 디스패치 동작 이해하기
- **[훅 수명주기](../concept/action-pipeline-guide.md)** - 액션 파이프라인과 React 훅 내부 동작 원리
- **[모범 사례](./best-practices.md)** - 프로덕션 권장 패턴과 컨벤션
- **[React Aria 통합](./react-aria-integration.md)** - 접근성 UI 상태는 로컬에 두고 도메인 결정만 Context-Action과 연결하기
- **[문제 해결 가이드](./troubleshooting.md)** - 자주 겪는 문제와 메모리·성능 점검

## 🎯 패턴 모음

### 핵심 프레임워크 패턴
- **[코드 패턴](./code-patterns.md)** - 패턴 개요 및 디렉터리별 마이그레이션 안내
- **[패턴 컬렉션](./patterns/setup/index.md)** - 전체 구현 패턴 인덱스

**[패턴 컬렉션](./patterns/setup/index.md)** 에서 상황별 세부 패턴을 확인할 수 있습니다:

| 패턴 | 활용 시나리오 | 적합한 대상 |
|------|---------------|-------------|
| **[Action Only](./patterns/action/)** | Store 없이 액션 파이프라인만 구성 | 이벤트 버스, 커맨드 파이프라인 |
| **[Store Only](./patterns/store/basic-usage.md)** | Action 없이 순수 상태 저장소 관리 | 데이터 레이어, 단순 상태 공유 |
| **[RefContext](./patterns/ref/basic-usage.md)** | 리렌더 없는 직접 DOM 조작 | 고빈도 120fps UI, 애니메이션, Canvas |
| **[Setup Patterns](./patterns/setup/)** | 기본 컨텍스트 및 Provider 조합 | 모든 신규 기능 구성 |
| **[Context-Layered 아키텍처](../context-layered/context-layered-guide.md)** | 계층별 책임 분리 및 Headless DI | 중대형 도메인 워크플로 |
| **[경로 기반 성능 구독](./patterns/store/path-based-subscription.md)** | 중첩 객체 선택적 구독 최적화 | 대형 상태 트리 |
| **[Async Patterns](./patterns/async/)** | 비동기 대기·취소·타임아웃 제어 | DOM 마운트 대기, API race 방지 |

## 📖 추천 학습 순서

### 처음 시작하는 분
1. **[시작하기](./getting-started.md)** 에서 Level 1 ~ Level 2 빠른 시작 예제 확인
2. **[아키텍처 가이드](../concept/architecture-guide.md)** 로 전체 데이터 흐름 이해
3. **[Store Only 패턴](./patterns/store/basic-usage.md)** 으로 가벼운 상태 관리 적용
4. 필요해질 때 **[패턴 컬렉션](./patterns/setup/index.md)** 으로 확장

### 심화/대규모 적용
1. **[파이프라인 시스템](./pipeline/)** 에서 우선순위·가드·흐름 제어 익히기
2. **[Context-Layered 아키텍처](../context-layered/context-layered-guide.md)** 와 [Store별 선택 가이드](../context-layered/store-selection-and-usage-guide.md)로 도메인 경계 확립
3. **[비동기 패턴](./patterns/async/)** 과 [타입 추론 가이드](./type-inference.md) 점검
4. **[모범 사례](./best-practices.md)** 로 프로덕션 안전성 확인

## 🔗 관련 문서

- **[핵심 개념](../concept/architecture-guide.md)** - 프레임워크 기본 철학과 설계
- **[API 레퍼런스](/en/api/README)** - TypeDoc 기반 전체 API 문서 (영문)
- **[예제 워크스루](../examples/basic-setup.md)** - 동작하는 실제 예제 코드
- **[LLM 리소스](/ko/llms/)** - AI 에이전트 연동용 요약 리소스

---

*Context-Action은 타입 안전한 커맨드 파이프라인과 반응형 스토어·Ref를 분리하여, 단순한 구조로 시작하고 복잡도가 늘어날 때만 엄격한 아키텍처 경계를 점진적으로 추가할 수 있게 돕습니다.*
