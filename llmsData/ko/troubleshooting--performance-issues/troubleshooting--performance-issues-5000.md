---
document_id: troubleshooting--performance-issues
category: troubleshooting
source_path: ko/troubleshooting/performance-issues.md
character_limit: 5000
last_update: '2026-07-24T05:15:02.440Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
성능 및 무한 루프 문제

성능 및 무한 루프 문제 개요 Context-Action 프레임워크에서 발생할 수 있는 성능 문제와 무한 루프 해결 방법을 설명합니다. 일반적인 성능 문제 1. 과도한 리렌더링 문제: 스토어 업데이트로 인한 불필요한 컴포넌트 리렌더링 해결책: 2. 핸들러 재등록 문제: useCallback 누락으로 인한 핸들러 재등록 해결책: 무한 루프 방지 1. 의존성 배열 관리 문제: 잘못된 의존성으로 인한 무한 루프 해결책: 2. 상태 업데이트 체인 문제: 핸들러가 다른 핸들러를 트리거하는 순환 참조 해결책: 상태 플래그나 조건부 업데이트 사용 성능 모니터링 성능 문제 디버깅을 위해 React DevTools와 Context-Action 디버그 유틸리티를 활용하세요.