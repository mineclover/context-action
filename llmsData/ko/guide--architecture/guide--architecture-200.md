---
document_id: guide--architecture
category: guide
source_path: ko/guide/architecture.md
character_limit: 200
last_update: '2025-08-21T02:13:42.397Z'
update_status: auto_generated
priority_score: 95
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
아키텍처

Context-Action은 MVVM에서 영감을 받은 패턴을 통해 명확한 관심사 분리를 구현합니다. 핵심 아키텍처

프레임워크는 관심사를 세 개의 명확한 레이어로 분리합니다:

레이어

1. View 레이어: UI를 렌더링하고 액션을 디스패치하는 React 컴포넌트
2.
