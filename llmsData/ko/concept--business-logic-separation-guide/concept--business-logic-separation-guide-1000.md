---
document_id: concept--business-logic-separation-guide
category: concept
source_path: ko/concept/business-logic-separation-guide.md
character_limit: 1000
last_update: '2026-07-24T05:15:02.517Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
비즈니스 로직 분리 가이드

비즈니스 로직 분리 가이드 이 가이드는 Context-Action 프레임워크에서 UI 컴포넌트와 상태 관리로부터 비즈니스 로직을 분리하는 패턴을 보여줍니다. > 관련 문서: > - Store 컨벤션 - Store 타입과 사용 패턴 > - 컨벤션 - 전체 코딩 컨벤션 > - Action Pipeline 가이드 - Action handler 패턴 비즈니스 로직 분리 개요 UI 컴포넌트와 상태 관리로부터 비즈니스 로직을 분리하는 것은 유지보수성, 테스트 가능성, 확장성에 매우 중요합니다. Context-Action 프레임워크는 비동기 프로세스 상태 관리와 함께 모듈화된 비즈니스 로직 패턴을 통해 이를 지원합니다. 핵심 원칙 1. 순수 비즈니스 로직: 비즈니스 로직은 React와 store 구

Key points:
• ✅ React나 store 없이 테스트 가능
• ✅ 다양한 UI 프레임워크에서 재사용 가능
• ✅ 명확한 관심사 분리
• ✅ 쉬운 모킹과 테스트
• `describe('Business Logic Separation')` - 의존성 없는 순수 비즈니스 로직
• `FileUploadService` 클래스 구현