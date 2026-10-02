---
document_id: guide--production-readiness
category: guide
source_path: ko/guide/production-readiness.md
character_limit: 1000
last_update: '2026-10-02T01:34:57.626Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
프로덕션 준비도

프로덕션 준비도 Context-Action은 패키지 경계와 운영 모델이 문제에 맞는 경우 프로덕션 React 애플리케이션 상태 관리에 사용할 수 있습니다. 이 문서는 포괄적인 성능 또는 exactly-once 보장을 주장하지 않고, 현재의 검증된 계약을 설명합니다. 결론 | 워크로드 | 판단 | 필요한 실천 | | --- | --- | --- | | 로컬 React UI·애플리케이션 상태 | 사용 가능 | createStoreContext, useStoreValue, 좁은 컨텍스트 경계를 사용합니다. | | 타입 안전한 액션 조율 | 사용 가능 | 도메인 작업은 핸들러에 두고 취소·타임아웃 의미를 명시합니다. | | React 19.2 SSR·하이드레이션 | 검증 버전에서 사용 가능 | 지원되는 React와 타입 패

Key points:
• Core `1.2.6`, Store Core `0.1.3`, Mutative Core `0.8.14`, scoped adapter `0.8.15`, React `4.0.7`을 함께 고정하고 테스트합니다.
• 정확한 후보 커밋에서 `pnpm release:check`를 실행합니다.
• workspace 테스트만이 아니라 패킹 소비자·React 호환성 검사를 릴리즈 게이트로 사용합니다.
• 이 cohort는 일반적인 애플리케이션...