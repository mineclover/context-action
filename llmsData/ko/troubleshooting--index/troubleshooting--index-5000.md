---
document_id: troubleshooting--index
category: troubleshooting
source_path: ko/troubleshooting/index.md
character_limit: 5000
last_update: '2026-07-24T05:15:02.441Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
문제 해결

문제 해결 Context-Action 프레임워크 사용 중 발생할 수 있는 일반적인 문제들과 해결 방법을 제공합니다. 🚨 중요 문제들 성능 및 무한 루프 - 성능 및 무한 루프 문제 - 성능 최적화와 무한 루프 방지 액션 시스템 문제 - 액션 시스템 문제 - 액션 디스패치 및 핸들러 관련 문제 스토어 및 상태 문제 - 스토어 및 상태 문제 - 상태 관리 및 스토어 관련 문제 Ref 시스템 문제 - Ref 시스템 문제 - Ref 컨텍스트 및 DOM 조작 관련 문제 빠른 해결책 대부분의 문제는 다음과 같은 일반적인 원인에서 발생합니다: 1. 핸들러 등록 시점 문제 - 컴포넌트 마운트 이전에 핸들러를 등록해야 합니다 2. 무한 루프 - 의존성 배열 누락이나 잘못된 상태 업데이트 3. 타입 안전성 - ActionPayloadMap 확장 누락 4. 메모리 누수 - 적절한 cleanup 및 unregister 함수 사용 필요 자세한 해결 방법은 각 섹션의 문서를 참조하세요.

Key points:
• [성능 및 무한 루프 문제](./performance-issues.md) - 성능 최적화와 무한 루프 방지
• [액션 시스템 문제](./action-issues.md) - 액션 디스패치 및 핸들러 관련 문제
• [스토어 및 상태 문제](./store-issues.md) - 상태 관리 및 스토어 관련 문제
• [Ref 시스템 문제](./ref-issues.md) - Ref 컨텍스트 및 DOM 조작 관련 문제
• **핸들러 등록 시점 문제** - 컴포넌트 마운트 이전에 핸들러를 등록해야 합니다
• **무한 루프** - 의존성 배열 누락이나 잘못된 상태 업데이트
• **타입 안전성** - ActionPayloadMap 확장 누락
• **메모리 누수** - 적절한 cleanup 및 unregister 함수 사용 필요