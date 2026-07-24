---
document_id: guide--patterns--action--type-system
category: guide
source_path: ko/guide/patterns/action/type-system.md
character_limit: 2000
last_update: '2026-07-24T05:15:02.399Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
액션 타입 시스템

액션 타입 시스템 ActionPayloadMap, 타입 안전성, TypeScript 통합을 포함한 Context-Action 프레임워크의 액션 타입 시스템에 대한 완전한 가이드입니다. 필수 조건 액션 타입 정의와 컨텍스트 설정에 대해서는 기본 액션 설정을 참조하세요. 이 문서는 액션 설정을 사용한 타입 시스템 패턴을 보여줍니다: - 타입 정의 → 확장 액션 인터페이스 - 공통 패턴 → 공통 액션 패턴 ActionPayloadMap 인터페이스 Context-Action 프레임워크에서 타입 안전 액션 처리의 기반입니다. 기본 액션 매핑 ActionRegister와 함께 사용 파이프라인 컨트롤러 타입 액션 핸들러를 위한 타입 안전 파이프라인 제어입니다. 기본 파이프라인 제어 결과와 함께 조기 반환 우선순위 점프 액션 핸들러 타입 완전한 TypeScript 지원을 갖춘 타입 안전 액션 핸들러 정의입니다. 스토어 통합 패턴 에러 처리가 있는 비동기 핸들러 핸들러 구성 포괄적인 옵션을 갖춘 타입 안전 핸들러 구성입니다. 기본 핸들러 구성 고급 구성 조건부 핸들러 실제 예제 - TodoListDemo - 액션 타입이 있는 완전한 할 일 목록 - ChatDemo - 메시지 액션이 있는 채팅 시스템 - UserProfileDemo - 사용자 프로필 관리 관련 패턴 - 액션 기본 사용법 - 기본 액션 패턴 - 등록 위임 - 고급 등록 패턴 - 스토어 통합 - 스토어와 통합

Key points:
• 타입 정의 → [확장 액션 인터페이스](../setup/basic-action-setup.md#extended-action-interface)
• 공통 패턴 → [공통 액션 패턴](../setup/basic-action-setup.md#common-action-patterns)
• [TodoListDemo](https://github.com/mineclover/context-action/blob/main/example/src/pages/demos/store-scenarios/components/TodoListDemo.tsx) - 액션 타입이 있는 완전한 할 일 목록
• [ChatDemo](https://github.com/mineclover/context-action/blob/main/example/src/pages/demos/store-scenarios/components/ChatDemo.tsx) - 메시지 액션이 있는 채팅 시스템
• [UserProfileDemo](https://github.com/mineclover/context-action/blob/main/example/src/pages/demos/store-scenarios/components/UserProfileDemo.tsx) - 사용자 프로필 관리
• [액션 기본 사용법](./basic-usage.md) - 기본 액션 패턴
• [등록 위임](./register-delegation.md) - 고급 등록 패턴
• [스토어 통합](../store/basic-usage.md) - 스토어와 통합