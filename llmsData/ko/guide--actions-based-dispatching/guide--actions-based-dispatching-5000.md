---
document_id: guide--actions-based-dispatching
category: guide
source_path: ko/guide/actions-based-dispatching.md
character_limit: 5000
last_update: '2026-07-24T05:15:02.372Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Actions 기반 디스패칭

Actions 기반 디스패칭 Actions 기반 디스패칭은 Context-Action에서 액션을 디스패치하는 더 직관적이고 함수형 접근 방식을 제공합니다. 기존의 registry.dispatch() 메서드 대신 registry.actions 속성을 통해 액션을 직접 함수로 호출할 수 있습니다. 개요 actions 속성은 각 등록된 액션이 호출 가능한 함수가 되는 함수형 인터페이스를 제공합니다. 이 접근 방식은 향상된 타입 안전성과 더 직관적인 구문으로 더 나은 개발자 경험을 제공합니다. 기본 사용법 1. 액션 타입 정의 먼저 ActionPayloadMap 인터페이스를 사용하여 액션 타입을 정의합니다: 2. ActionRegister 생성 액션 타입과 함께 ActionRegister 인스턴스를 생성합니다: 3. 핸들러 등록 액션에 대한 핸들러를 등록합니다: 4. 액션 디스패치 Actions 기반 접근 방식을 사용하여 액션을 디스패치합니다: 5. 결과 수집이 있는 액션 상세한 실행 결과가 필요한 경우 actionsWithResult를 사용하세요: 고급 기능 옵션 지원 Actions 기반 디스패칭은 기존 디스패칭과 동일한 모든 옵션을 지원합니다: 타입 안전성 Actions 기반 접근 방식은 훌륭한 타입 안전성을 제공합니다: 필터링 및 고급 옵션 모든 고급 필터링 및 실행 옵션을 사용할 수 있습니다: 장점 1. 직관적인 구문 Actions 기반 디스패칭은 더 자연스럽고 함수형으로 느껴집니다: 2. 더 나은 타입 안전성 자동완성과 컴파일 타임 오류 검사가 포함된 완전한 TypeScript 지원: 3. 일관된 API 페이로드가 있는지 여부에 관계없이 모든 액션이 동일한 패턴을 따릅니다: 4. 전체 기능 지원 모든 기존 디스패치 기능을 사용할 수 있습니다: - 실행 모드 (순차, 병렬, 경쟁) - 필터링 (핸들러 ID, 우선순위, 사용자 정의 필터별) - 스로틀링 및 디바운싱 - 결과 수집 - 중단 신호 - 오류 처리 기존 디스패치에서 마이그레이션 현재 기존 디스패치를 사용하고 있다면, 마이그레이션은 간단합니다: 모범 사례 1. 설명적인 액션 이름 사용 무엇을 하는지 명확하게 설명하는 액션 이름을 선택하세요: 2. 명확한 페이로드 타입 정의 페이로드에 대해 구체적인 타입을 사용하세요: 3. 적절한 오류 처리 핸들러에서 적절한 오류 처리를 사용하세요: 4. 옵션을 현명하게 사용 사용 사례에 따라 실행 옵션을 적용하세요: 예제 완전한 예제 Actions 기반 디스패칭은 기존 접근 방식의 모든 힘과 유연성을 유지하면서 Context-Action으로 작업하는 더 직관적이고 개발자 친화적인 방법을 제공합니다.

Key points:
• 실행 모드 (순차, 병렬, 경쟁)
• 필터링 (핸들러 ID, 우선순위, 사용자 정의 필터별)
• 스로틀링 및 디바운싱
• 결과 수집
• 중단 신호
• 오류 처리