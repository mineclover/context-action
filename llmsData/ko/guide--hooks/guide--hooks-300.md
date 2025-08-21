---
document_id: guide--hooks
category: guide
source_path: ko/guide/hooks.md
character_limit: 300
last_update: '2025-08-21T02:13:42.404Z'
update_status: auto_generated
priority_score: 95
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
React 훅

Context-Action은 액션 디스패칭과 스토어 관리를 위한 React 훅을 제공합니다. 필수 훅

가장 자주 사용할 핵심 훅들입니다. 액션 훅

createActionContext<T>()
모든 액션 관련 훅을 생성하는 팩토리 함수. useActionDispatch()
핸들러에 액션을 디스패치하는 주요 훅. useActionHandler()
액션 핸들러를 등록하는 주요 훅. 스토어 훅

createDeclarativeStorePattern<T>()
모든 스토어 관련 훅을 생성하는 팩토리 함수.
