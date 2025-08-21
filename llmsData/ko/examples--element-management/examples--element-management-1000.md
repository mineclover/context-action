---
document_id: examples--element-management
category: examples
source_path: ko/examples/element-management.md
character_limit: 1000
last_update: '2025-08-21T02:13:42.391Z'
update_status: auto_generated
priority_score: 80
priority_tier: medium
completion_status: completed
workflow_stage: content_generated
---
DOM Element 관리

Context-Action 프레임워크를 사용한 포괄적인 DOM element 관리 고급 예제입니다. 개요

이 예제는 Context-Action의 Action Pipeline과 Store Pattern을 활용하여 React와 Core 패키지에서 DOM element를 효과적으로 관리하는 방법을 보여줍니다:

- 중앙화된 Element Registry: 모든 DOM element를 중앙에서 관리
- Type-safe Element Management: TypeScript를 활용한 타입 안전성
- Reactive State Management: Element 상태 변경에 대한 실시간 반응
- Lifecycle Management: Element 등록/해제의 자동화
- Focus & Selection Management: 포커스와 선택 상태 관리

주요 기능

Core 패키지 기능
- ElementManager 클래스: 중앙화된 DOM element 생명주기 관리
- Action 기반 API: 모든 element 작업이 action pipeline을 통해 수행
- 자동 정리: DOM에서 제거된 element들의 주기적 정리
- Type-safe 관리: TypeScript를 활용한 완전한 타입 안전성

React 패키지 기능
- useElementRef Hook: Element 자동 등록을 위한 hook
- Focus 관리: useFocusedElement hook으로 포커스 상태 관리
- Selection 관리: useElementSelection hook으로 다중 선택 지원
- Type별 조회: useElementsByType으로 타입별 element 조회
- Managed Components: 자동으로 등록되는 ManagedInput, ManagedButton 컴포넌트

기본 사용법

1. 설정

2. Element 등록 및 관리

3. Focus 관리

4.
