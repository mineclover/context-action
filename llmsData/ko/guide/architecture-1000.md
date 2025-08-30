---
document_id: ko_guide_architecture
category: guide
source_path: ko/guide/architecture.md
character_limit: 1000
last_update: '2025-08-30T10:45:52.577Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
아키텍처

아키텍처 Context-Action은 MVVM에서 영감을 받은 패턴을 통해 명확한 관심사 분리를 구현합니다. 핵심 아키텍처 프레임워크는 관심사를 세 개의 명확한 레이어로 분리합니다: 레이어 1. View 레이어: UI를 렌더링하고 액션을 디스패치하는 React 컴포넌트 2. ViewModel 레이어: 우선순위 기반 핸들러 실행을 가진 액션 파이프라인   3. Model 레이어: 반응형 상태 관리를 가진 스토어 시스템 컨텍스트 분리 Context-Action은 코드를 도메인별 컨텍스트로 구성합니다: 도메인 기반 컨텍스트 - 비즈니스 컨텍스트: 비즈니스 로직, 데이터 처리, 도메인 규칙 - UI 컨텍스트: 화면 상태, 사용자 상호작용, 컴포넌트 동작   - 검증 컨텍스트: 데이터 검증, 폼 처리, 에러 핸들링 - 디자인 컨텍스트: 테마

Key points:
• **비즈니스 컨텍스트**: 비즈니스 로직, 데이터 처리, 도메인 규칙
• **UI 컨텍스트**: 화면 상태, 사용자 상호작용, 컴포넌트 동작
• **검증 컨텍스트**: 데이터 검증, 폼 처리, 에러 핸들링
• **디자인 컨텍스트**: 테마 관리, 스타일링, 레이아웃, 비주얼 상태
• **아키텍처 컨텍스트**: 시스템 설정, 인프라스트럭처, 기술적 결정
• **도메인 격리**: 각 컨텍스트는 완전한 독립성을 유지