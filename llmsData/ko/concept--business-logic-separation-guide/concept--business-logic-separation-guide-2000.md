---
document_id: concept--business-logic-separation-guide
category: concept
source_path: ko/concept/business-logic-separation-guide.md
character_limit: 2000
last_update: '2026-07-24T05:15:02.517Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
비즈니스 로직 분리 가이드

비즈니스 로직 분리 가이드 이 가이드는 Context-Action 프레임워크에서 UI 컴포넌트와 상태 관리로부터 비즈니스 로직을 분리하는 패턴을 보여줍니다. > 관련 문서: > - Store 컨벤션 - Store 타입과 사용 패턴 > - 컨벤션 - 전체 코딩 컨벤션 > - Action Pipeline 가이드 - Action handler 패턴 비즈니스 로직 분리 개요 UI 컴포넌트와 상태 관리로부터 비즈니스 로직을 분리하는 것은 유지보수성, 테스트 가능성, 확장성에 매우 중요합니다. Context-Action 프레임워크는 비동기 프로세스 상태 관리와 함께 모듈화된 비즈니스 로직 패턴을 통해 이를 지원합니다. 핵심 원칙 1. 순수 비즈니스 로직: 비즈니스 로직은 React와 store 구현으로부터 독립적이어야 함 2. 상태 머신: 복잡한 비동기 프로세스를 위한 명시적 상태 전이 사용 3. 진행률 분리: notifyPath를 사용하여 상태 변경과 진행률 업데이트 분리 4. 모듈화 설계: 비즈니스 로직 모듈은 UI 없이 테스트 가능해야 함 패턴 1: 비즈니스 로직 모듈 React/store로부터 독립적인 순수 비즈니스 로직 클래스 또는 함수 생성: 장점: - ✅ React나 store 없이 테스트 가능 - ✅ 다양한 UI 프레임워크에서 재사용 가능 - ✅ 명확한 관심사 분리 - ✅ 쉬운 모킹과 테스트 테스트 참조: packages/react/tests/stores/notifyPath-async-process.test.tsx 참조 - describe('Business Logic Separation') - 의존성 없는 순수 비즈니스 로직 - FileUploadService 클래스 구현 패턴 2: 비동기 프로세스 상태 머신 복잡한 비동기 워크플로우를 위한 명시적 상태 타입과 전이 사용: 상태 머신 장점: - ✅ 명시적 상태 전이 - ✅ 워크플로우 시각화 용이 - ✅ 잘못된 상태 방지 - ✅ 디버깅 촉진 테스트 참조: packages/react/tes

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