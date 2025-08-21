---
document_id: guide--action-handlers
category: guide
source_path: ko/guide/action-handlers.md
character_limit: 500
last_update: '2025-08-21T02:13:42.395Z'
update_status: auto_generated
priority_score: 95
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
액션 핸들러

useActionHandler + useEffect 패턴으로 비즈니스 로직을 구현합니다. 주요 기능:

• 우선순위 기반 실행 (순차/병렬/경합 모드)
• 컨트롤러 메서드로 흐름 제어 (abort, jumpToPriority, setResult)
• 컨텍스트와 의미있는 메시지로 강력한 에러 처리
• unregister 함수로 메모리 정리
• 설정 가능한 전략으로 여러 핸들러에서 결과 수집

모범 사례: useCallback으로 핸들러 감싸기, 지연 스토어 평가 사용, 적절한 검증 구현, 유지보수성을 위해 도메인별로 핸들러 구성.
