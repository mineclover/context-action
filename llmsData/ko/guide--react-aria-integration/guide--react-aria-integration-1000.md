---
document_id: guide--react-aria-integration
category: guide
source_path: ko/guide/react-aria-integration.md
character_limit: 1000
last_update: '2026-08-10T05:45:29.523Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
React Aria 통합 경계

React Aria 통합 경계 Context-Action은 React Aria와 도메인 경계에서 통합합니다. React Stately가 제공하는 컴포넌트 내부 상호작용 상태를 대체하지 않습니다. 실행 가능한 레퍼런스는 예제 앱의 /integrations/react-aria-reference에 있습니다. react-aria-components의 다중 선택·정렬 Table 및 Calendar를 사용하고, 이 컴포넌트들이 내보내는 제품 도메인 결정을 Context-Action action과 store로 관리합니다. 소유 모델 | 관심사 | 소유자 | 이유 | | --- | --- | --- | | 키보드 이동, 포커스 이동, typeahead, 컬렉션 순회 | React Aria / React Stately | 접근성

Key points:
• 화살표 키 이동, 범위/다중 선택, focus-visible 동작
• 키보드와 포인터 입력 모두에서 Calendar 월 이동과 날짜 선택
• 관련 popover 또는 dialog의 overlay 포커스 복원
• controlled 값이 서버에서 공급된다면 React 18/19 SSR과 hydration
• action handler가 고빈도 상호작용을 지연시키지 않는지: roving focus를 action