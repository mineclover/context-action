---
document_id: guide--action-handlers
category: guide
source_path: ko/guide/action-handlers.md
character_limit: 300
last_update: '2025-08-21T02:13:42.394Z'
update_status: auto_generated
priority_score: 95
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
액션 핸들러

액션 핸들러는 애플리케이션의 비즈니스 로직을 포함합니다. 확장 가능하고 유지보수가 가능한 애플리케이션을 위해 핸들러를 효과적으로 구현, 등록, 관리하는 방법을 알아보세요. 핸들러 구현 패턴

모범 사례: useActionHandler 패턴

핸들러 등록에 권장되는 패턴은 최적의 성능과 적절한 정리를 위해 useActionHandler + useEffect를 사용하는 것입니다:

핸들러 설정 옵션

핸들러 실행 흐름

1. 순차 모드 (기본값): 핸들러가 우선순위 순서로 실행
2.
