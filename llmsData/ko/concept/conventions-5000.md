---
document_id: ko_concept_conventions
category: concept
source_path: ko/concept/conventions.md
character_limit: 5000
last_update: '2026-01-03T06:32:34.907Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Context-Action Framework Conventions

Context-Action Framework Conventions 이 문서는 Context-Action 프레임워크의 핵심 패턴(Actions, Stores)과 고급 패턴(RefContext 등)을 사용할 때 따라야 할 코딩 컨벤션과 베스트 프랙티스를 정의합니다. 📋 목차 1. 네이밍 컨벤션 2. 파일 구조 3. 패턴 사용법 4. 타입 정의 5. 코드 스타일 6. Import와 모듈 패턴 7. 핵심 프레임워크 원칙 8. Action Handler Registration 컨벤션 9. Store 업데이트 컨벤션 10. 성능 가이드라인 11. 에러 핸들링 12. RefContext 컨벤션 --- 네이밍 컨벤션 🏷️ 리네이밍 패턴 (Renaming Pattern) Context-Action 프레임워크의 핵심 컨벤션은 세 가지 패턴 모두에 대한 도메인별 리네이밍 패턴입니다. ✅ Store Pattern 리네이밍 ✅ Action Pattern 리네이밍 ✅ RefContext Pattern 리네이밍 🎯 컨텍스트 이름 규칙 도메인 기반 네이밍 Action vs Store vs RefContext 구분 🔤 Hook 네이밍 패턴 Store Hook 네이밍 Action Hook 네이밍 RefContext Hook 네이밍 --- 파일 구조 📁 권장 디렉토리 구조 📄 파일명 컨벤션 Context 파일명 Provider 파일명 --- 패턴 사용법 🎯 패턴 선택 가이드 Store Only Pattern Action Only Pattern   Pattern Composition 🔄 Provider 조합 패턴 HOC 패턴 (권장) Manual Provider 조합 --- 타입 정의 🏷️ Interface 네이밍 Action Payload Map Store Data Interface 🎯 제네릭 타입 사용 --- 코드 스타일 ✨ 컴포넌트 패턴 Store 사용 패턴 Action Handler 패턴 🎨 Import 정리 Import와 모듈 패턴 📦 Import 및 모듈 패턴 Named Import vs Namespace Import 트리 쉐이킹과 번들 최적화를 위해 Named Import 선호 Named Import의 장점: - 트리 쉐이킹: 번들러가 사용되지 않는 내보내기를 더 효율적으로 제거 - 번들 크기: 사용되지 않는 코드를 제외하여 최종 번들 크기 감소 - 정적 분석: 사용되지 않는 import 감지를 위한 더 나은 IDE 지원 - 성능: 더 빠른 빌드 시간과 런타임 성능 함수 기반 유틸 vs Static-Only 클래스 Static-Only 클래스보다 유틸리티 함수 선호 유틸리티 함수의 장점: - 트리 쉐이킹: 개별 함수를 독립적으로 트리 쉐이킹 가능 - 린팅 준수: "static-only class" 린팅 경고 방지 - 함수형 프로그래밍: 함수형 프로그래밍 패턴 촉진 - 단순성: 더 깔끔한 import 문과 사용법 - 테스팅: 개별 함수를 모킹하고 테스트하기 쉬움 Import 구조 정리 --- 핵심 프레임워크 원칙 🎯 아키텍처 철학 1. 비즈니스 로직의 완전한 분리 - 모든 로직을 Context-Action 시스템으로 위임 - 컴포넌트는 순수하게 UI 렌더링에만 집중 - Props 의존성을 극단적으로 최소화 2. 단방향 의존성 원칙 - 상위 컨텍스트는 하위 컨텍스트를 모른다 - 하위 컨텍스트가 상위 컨텍스트 데이터를 활용 - 느슨한 결합과 높은 재사용성 확보 📋 Props 사용 원칙 ✅ Props를 써도 되는 경우 1. 디자인 시스템과 컴포넌트 조합 2. 컴포넌트의 고유 식별자 3. 외부 라이브러리와의 인터페이스 ❌ Props를 쓰면 안 되는 경우 1. Context-Action 로직에 props 개입 2. 상태나 액션을 props로 전달 3. 컴포넌트 간 데이터 통신을 props로 처리 🏗️ 컨텍스트 의존성 흐름 Provider 계층 구조 하위 컨텍스트에서 상위 데이터 활용 --- Action Handler Registration 컨벤션 🎯 핵심 개념 Handler 등록 기본 원칙 Action handler는 디스패치된 액션에 대응하여 비즈니스 로직을 실행합니다. 등록 라이프사이클을 이해하는 것이 최적 성능을 위해 중요합니다. 핵심 원칙: 1. 지연 평가(Lazy Evaluation): 등록 시점이 아닌 실행 시점에 상태를 읽어야 함 2. 최소 의존성: useCallback deps에는 안정적인 참조만 포함 3. 상태 구독 없음: Handler는 store를 구독하지 않음 (React 컴포넌트와 달리) useActionHandler 내부 최적화 useActionHandler는 이미 ref 패턴을 사용하여 재등록을 방지합니다: --- 📚 두 가지 등록 방식 방식 1: useActionHandler (권장) 대부분의 사용 사례를 위한 표준 훅. 자동으로 등록/정리를 처리합니다. 장점: - ✅ 언마운트 시 자동 정리 - ✅ 내장 ref 최적화 (handler 변경 시 재등록 안 함) - ✅ 간단하고 선언적인 API 단점: - ⚠️ 재등록 조건에 대한 제한된 제어 - ⚠️ ActionRegister 메서드 접근 불가 방식 2: useActionRegister (고급 제어) handler 라이프사이클에 대한 세밀한 제어를 위한 직접 등록. 장점: - ✅ 재등록 deps에 대한 완전한 제어 - ✅ ActionRegister API 접근 (getHandlers, clearAction 등) - ✅ 명시적 useEffect를 통한 조건부 등록 - ✅ 동적 다중 handler 등록 단점: - ⚠️ 수동 useEffect 관리 필요 - ⚠️ useActionHandler보다 장황함 비교 표 | 시나리오 | useActionHandler | useAct

Key points:
• **트리 쉐이킹**: 번들러가 사용되지 않는 내보내기를 더 효율적으로 제거
• **번들 크기**: 사용되지 않는 코드를 제외하여 최종 번들 크기 감소
• **정적 분석**: 사용되지 않는 import 감지를 위한 더 나은 IDE 지원
• **성능**: 더 빠른 빌드 시간과 런타임 성능
• **트리 쉐이킹**: 개별 함수를 독립적으로 트리 쉐이킹 가능
• **린팅 준수**: "static-only class" 린팅 경고 방지
• **함수형 프로그래밍**: 함수형 프로그래밍 패턴 촉진
• **단순성**: 더 깔끔한 import 문과 사용법
• **테스팅**: 개별 함수를 모킹하고 테스트하기 쉬움
• **모든 로직을 Context-Action 시스템으로 위임**
• 컴포넌트는 순수하게 UI 렌더링에만 집중
• Props 의존성을 극단적으로 최소화
• **상위 컨텍스트는 하위 컨텍스트를 모른다**
• **하위 컨텍스트가 상위 컨텍스트 데이터를 활용**
• 느슨한 결합과 높은 재사용성 확보
• ✅ 언마운트 시 자동 정리
• ✅ 내장 ref 최적화 (handler 변경 시 재등록 안 함)
• ✅ 간단하고 선언적인 API
• ⚠️ 재등록 조건에 대한 제한된 제어
• ⚠️ ActionRegister 메서드 접근 불가
• ✅ 재등록 deps에 대한 완전한 제어
• ✅ ActionRegister API 접근 (getHandlers, clearAction 등)
• ✅ 명시적 useEffect를 통한 조건부 등록
• ✅ 동적 다중 handler 등록
• ⚠️ 수동 useEffect 관리 필요
• ⚠️ useActionHandler보다 장황함
• **useStorePath**: 변환 없이 단순 속성 접근
• **useStoreSelector**: 경로 힌트가 실용적이지 않은 복잡한 변환
• **useStoreSelectorWithPaths**: 의존성이 명확한 파생값 (최고 성능)
• [Pattern Guide](./pattern-guide.md) - 상세한 패턴 사용법
• [Full Architecture Guide](./architecture-guide.md) - 완전한 아키텍처 가이드
• [Hooks Reference](./hooks-reference.md) - Hooks 참조 문서
• [API Reference](../../api/) - API 문서
• [Basic Example](../../../example/) - 기본 사용 예제
• [Advanced Patterns](../../examples/) - 고급 패턴 예제
• [Legacy Pattern Migration](./pattern-guide.md#migration-guide) - 레거시 패턴에서 마이그레이션
• **Store Only**: 순수 상태 관리 (폼, 설정, 캐시)
• **Action Only**: 순수 이벤트 처리 (로깅, 트래킹, 알림)
• **RefContext Only**: 고성능 DOM 조작 (애니메이션, 실시간 상호작용)
• **Composition**: 여러 패턴이 필요한 복잡한 비즈니스 로직 (사용자 관리, 상호작용형 쇼핑카트)
• **타입 추론 (권장)**: 대부분의 경우, 코드가 간결하고 타입 안전성 보장
• **명시적 제네릭**: 복잡한 타입 구조나 엄격한 타입 제약이 필요한 경우
• **RefContext 사용 시**: 직접 DOM 조작 필요, 60fps 성능 필요, 제로 리렌더링이 중요
• **일반 state 사용 시**: 데이터를 UI에 표시해야 함, 컴포넌트 리렌더링이 허용됨
• **둘 다 사용 시**: 데이터 표시와 성능 중요 작업이 함께 필요 (예: 실시간 차트)
• [네이밍 컨벤션](#네이밍-컨벤션)