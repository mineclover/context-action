---
document_id: guide--react-19-activity
category: guide
source_path: ko/guide/react-19-activity.md
character_limit: 2000
last_update: '2026-08-22T02:29:35.458Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
React 19.2 Activity

React 19.2 Activity <Activity>는 보이지 않는 UI 일부를 마운트된 상태로 유지하는 React 19.2 컴포넌트입니다. hide/reveal 사이에 컴포넌트·DOM·Store·Action Provider 상태는 보존하지만, 해당 UI의 effect와 외부 구독을 계속 활성화하지는 않습니다. @context-action/react 3.0은 React 19.2 이상을 요구합니다. Activity는 React에서 import하며 Context-Action은 이를 감싸거나 다시 export하지 않습니다. 다시 돌아올 UI에 사용하기 사용자가 곧 다시 돌아올 가능성이 크고 로컬 상태가 사라지면 불편한 탭, 사이드바, 검색·필터 패널, 작성 중인 폼, 상세 패널에 적합합니다. 떠날 때 상태를 버려야 한다면 일반 조건부 렌더링을 사용하세요. 작성기를 다시 보이게 하면 draft 값과 textarea DOM 상태가 복원됩니다. Context-Action은 같은 주기 동안 Store manager도 유지하므로 Provider를 Activity 경계 안에 둘 수 있습니다. Provider와 withProvider() 배치 직접 Provider와 withProvider() wrapper 모두 Activity가 hidden인 동안 Store manager를 보존합니다. 화면 구조가 더 명확한 쪽을 선택하면 되며, Activity 전용 Context-Action API는 필요하지 않습니다. createTimeTravelStoreContext에도 같은 규칙이 적용됩니다. 현재 상태와 undo/redo history가 hide/reveal 뒤에도 남습니다. 실제 unmount에서는 manager가 dispose되며, withProvider({ autoCleanup: false })를 의도적으로 선택한 경우만 예외입니다. hidden 상태에서 바뀌는 점 React는 경계를 display: none으로 숨기고 DOM과 상태는 보존하지만 layout/passive effect를 cle