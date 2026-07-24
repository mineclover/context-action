---
document_id: guide--patterns--action--handler-state-access
category: guide
source_path: ko/guide/patterns/action/handler-state-access.md
character_limit: 1000
last_update: '2026-07-24T05:15:02.404Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
액션 핸들러 상태 접근 패턴

액션 핸들러 상태 접근 패턴 일반적인 함정을 피하기 위한 중요한 모범 사례를 포함한 액션 핸들러 내에서 상태에 접근하고 관리하는 고급 패턴입니다. Import 필수 조건 🎯 스펙 재사용: 완전한 액션 핸들러 설정 패턴은 기본 액션 설정을 참조하세요. 📖 이 문서의 모든 예제는 아래 설정 스펙을 재사용합니다: - 🎯 액션 타입 → EventActions, UserActions - 🎯 훅 명명 → useEventAction 패턴 - 🎯 핸들러 패턴 → 액션 핸들러 설정 💡 일관된 학습: 설정 가이드를 먼저 읽으면 이 문서의 모든 예제를 즉시 이해할 수 있습니다. 📋 목차 1. 중요: 클로저 함정 피하기 2. 실시간 상태 접근 패턴 3. useEffect 의존성 모범 사례

Key points:
• 🎯 액션 타입 → [EventActions, UserActions](../setup/basic-action-setup.md#type-definitions)
• 🎯 훅 명명 → [useEventAction 패턴](../setup/basic-action-setup.md#context-creation)
• 🎯 핸들러 패턴 → [액션 핸들러...