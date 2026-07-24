---
document_id: concept--business-logic-separation-guide
category: concept
source_path: ko/concept/business-logic-separation-guide.md
character_limit: 5000
last_update: '2026-07-24T05:15:02.517Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
비즈니스 로직 분리 가이드

비즈니스 로직 분리 가이드 이 가이드는 Context-Action 프레임워크에서 UI 컴포넌트와 상태 관리로부터 비즈니스 로직을 분리하는 패턴을 보여줍니다. > 관련 문서: > - Store 컨벤션 - Store 타입과 사용 패턴 > - 컨벤션 - 전체 코딩 컨벤션 > - Action Pipeline 가이드 - Action handler 패턴 비즈니스 로직 분리 개요 UI 컴포넌트와 상태 관리로부터 비즈니스 로직을 분리하는 것은 유지보수성, 테스트 가능성, 확장성에 매우 중요합니다. Context-Action 프레임워크는 비동기 프로세스 상태 관리와 함께 모듈화된 비즈니스 로직 패턴을 통해 이를 지원합니다. 핵심 원칙 1. 순수 비즈니스 로직: 비즈니스 로직은 React와 store 구현으로부터 독립적이어야 함 2. 상태 머신: 복잡한 비동기 프로세스를 위한 명시적 상태 전이 사용 3. 진행률 분리: notifyPath를 사용하여 상태 변경과 진행률 업데이트 분리 4. 모듈화 설계: 비즈니스 로직 모듈은 UI 없이 테스트 가능해야 함 패턴 1: 비즈니스 로직 모듈 React/store로부터 독립적인 순수 비즈니스 로직 클래스 또는 함수 생성: 장점: - ✅ React나 store 없이 테스트 가능 - ✅ 다양한 UI 프레임워크에서 재사용 가능 - ✅ 명확한 관심사 분리 - ✅ 쉬운 모킹과 테스트 테스트 참조: packages/react/tests/stores/notifyPath-async-process.test.tsx 참조 - describe('Business Logic Separation') - 의존성 없는 순수 비즈니스 로직 - FileUploadService 클래스 구현 패턴 2: 비동기 프로세스 상태 머신 복잡한 비동기 워크플로우를 위한 명시적 상태 타입과 전이 사용: 상태 머신 장점: - ✅ 명시적 상태 전이 - ✅ 워크플로우 시각화 용이 - ✅ 잘못된 상태 방지 - ✅ 디버깅 촉진 테스트 참조: packages/react/tests/stores/notifyPath-async-process.test.tsx 참조 - describe('Async Process State Machine') - notifyPath를 사용한 상태 머신 패턴 - it('proves state machine pattern with notifyPath for state-only updates') - 전체 워크플로우 테스트 패턴 3: 진행률 전용 업데이트 최대 성능을 위해 진행률 업데이트와 상태 변경 분리: 진행률 분리 장점: - ✅ 100% 재렌더링 효율성 (낭비되는 렌더링 없음) - ✅ 성능 비용 없는 고빈도 업데이트 - ✅ 독립적 컴포넌트 구독 - ✅ 진행률 바, 로딩 표시기에 최적 테스트 참조: packages/react/tests/stores/notifyPath-async-process.test.tsx 참조 - describe('Async Process State Machine') - 진행률 전용 업데이트 테스트 - it('proves progress-only updates do not trigger state re-renders') - 10번 진행률 업데이트, 0번 상태 렌더링 패턴 4: 모듈화 통합 명확한 경계를 가진 비즈니스 로직, 상태 관리, UI 통합: 통합 장점: - ✅ 비즈니스 로직 독립적 테스트 가능 - ✅ 비즈니스 로직과 상태 관리 분리 - ✅ UI 컴포넌트는 순수 표현 - ✅ 명확한 관심사 분리 - ✅ 각 레이어 독립적 테스트 가능 테스트 참조: packages/react/tests/stores/notifyPath-async-process.test.tsx 참조 - describe('Modular Business Logic Integration') - 완전한 통합 테스트 - it('proves integration of business logic, state management, and selective rendering') - 전체 레이어 분리 증명 패턴 5: 상태 머신을 통한 에러 핸들링 명시적 상태 전이를 통한 에러 처리: 에러 핸들링 장점: - ✅ 명시적 에러 상태 - ✅ 백오프를 사용한 재시도 로직 - ✅ 에러 세부 정보 추적 - ✅ 명확한 실패 복구 경로 테스트 참조: packages/react/tests/stores/notifyPath-async-process.test.tsx 참조 - describe('Error Handling with State Machine') - 에러 상태 관리 테스트 - it('proves error state management with notifyPath') - 검증 에러 핸들링 패턴 6: 다중 파일 큐 관리 여러 동시 작업이 있는 복잡한 워크플로우: 큐 관리 장점: - ✅ 항목별 상태 추적 - ✅ 선택적 경로 업데이트 - ✅ notifyPaths를 사용한 배치 알림 - ✅ 불필요한 재렌더링 없음 - ✅ 전역 큐 상태 추적 테스트 참조: packages/react/tests/stores/notifyPath-async-process.test.tsx 참조 - describe('Complex Workflow: Multi-file Upload Queue') - 큐 관리 테스트 - it('proves complex async workflow with queue management') - 3개 파일, 각 5번 진행률 업데이트 비즈니스 로직 테스트 성능 특성 전통적인 setValue 접근 방식: 최적화된 notifyPath 접근 방식: 베스트 프랙티스 요약 1. 비즈니스 로직 분리: 비즈니스 로직을 React/store와 독립적으로 유지 2. 상태 머신 사용: 복잡한

Key points:
• ✅ React나 store 없이 테스트 가능
• ✅ 다양한 UI 프레임워크에서 재사용 가능
• ✅ 명확한 관심사 분리
• ✅ 쉬운 모킹과 테스트
• `describe('Business Logic Separation')` - 의존성 없는 순수 비즈니스 로직
• `FileUploadService` 클래스 구현
• ✅ 명시적 상태 전이
• ✅ 워크플로우 시각화 용이
• ✅ 잘못된 상태 방지
• ✅ 디버깅 촉진
• `describe('Async Process State Machine')` - notifyPath를 사용한 상태 머신 패턴
• `it('proves state machine pattern with notifyPath for state-only updates')` - 전체 워크플로우 테스트
• ✅ 100% 재렌더링 효율성 (낭비되는 렌더링 없음)
• ✅ 성능 비용 없는 고빈도 업데이트
• ✅ 독립적 컴포넌트 구독
• ✅ 진행률 바, 로딩 표시기에 최적
• `describe('Async Process State Machine')` - 진행률 전용 업데이트 테스트
• `it('proves progress-only updates do not trigger state re-renders')` - 10번 진행률 업데이트, 0번 상태 렌더링
• ✅ 비즈니스 로직 독립적 테스트 가능
• ✅ 비즈니스 로직과 상태 관리 분리
• ✅ UI 컴포넌트는 순수 표현
• ✅ 명확한 관심사 분리
• ✅ 각 레이어 독립적 테스트 가능
• `describe('Modular Business Logic Integration')` - 완전한 통합 테스트
• `it('proves integration of business logic, state management, and selective rendering')` - 전체 레이어 분리 증명
• ✅ 명시적 에러 상태
• ✅ 백오프를 사용한 재시도 로직
• ✅ 에러 세부 정보 추적
• ✅ 명확한 실패 복구 경로
• `describe('Error Handling with State Machine')` - 에러 상태 관리 테스트
• `it('proves error state management with notifyPath')` - 검증 에러 핸들링
• ✅ 항목별 상태 추적
• ✅ 선택적 경로 업데이트
• ✅ `notifyPaths`를 사용한 배치 알림
• ✅ 불필요한 재렌더링 없음
• ✅ 전역 큐 상태 추적
• `describe('Complex Workflow: Multi-file Upload Queue')` - 큐 관리 테스트
• `it('proves complex async workflow with queue management')` - 3개 파일, 각 5번 진행률 업데이트
• [Performance Proof](./notifyPath-performance-proof.md) - 수학적 성능 증명 (50% 재렌더링 감소, RAF 배칭 등)
• [Async Process Tests](../../packages/react/__tests__/stores/notifyPath-async-process.test.tsx) - 6개 테스트 카테고리의 종합 테스트 스위트:
• [Performance Tests](../../packages/react/__tests__/stores/notifyPath-performance.test.tsx) - 재렌더링 감소, RAF 배칭, 선택적 렌더링 벤치마크
• [Event Loop Control](#event-loop-control) - Action Handler 및 RefContext와의 통합 패턴
• [Main Conventions](./conventions.md) - 전체...