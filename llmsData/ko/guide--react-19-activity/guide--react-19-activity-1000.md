---
document_id: guide--react-19-activity
category: guide
source_path: ko/guide/react-19-activity.md
character_limit: 1000
last_update: '2026-08-22T02:29:35.457Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
React 19.2 Activity

React 19.2 Activity <Activity>는 보이지 않는 UI 일부를 마운트된 상태로 유지하는 React 19.2 컴포넌트입니다. hide/reveal 사이에 컴포넌트·DOM·Store·Action Provider 상태는 보존하지만, 해당 UI의 effect와 외부 구독을 계속 활성화하지는 않습니다. @context-action/react 3.0은 React 19.2 이상을 요구합니다. Activity는 React에서 import하며 Context-Action은 이를 감싸거나 다시 export하지 않습니다. 다시 돌아올 UI에 사용하기 사용자가 곧 다시 돌아올 가능성이 크고 로컬 상태가 사라지면 불편한 탭, 사이드바, 검색·필터 패널, 작성 중인 폼, 상세 패널에 적합합니다. 떠날 때 상태를 버려야 한다면 일반