---
document_id: guide--react-aria-integration
category: guide
source_path: ko/guide/react-aria-integration.md
character_limit: 2000
last_update: '2026-08-10T05:45:29.523Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
React Aria 통합 경계

React Aria 통합 경계 Context-Action은 React Aria와 도메인 경계에서 통합합니다. React Stately가 제공하는 컴포넌트 내부 상호작용 상태를 대체하지 않습니다. 실행 가능한 레퍼런스는 예제 앱의 /integrations/react-aria-reference에 있습니다. react-aria-components의 다중 선택·정렬 Table 및 Calendar를 사용하고, 이 컴포넌트들이 내보내는 제품 도메인 결정을 Context-Action action과 store로 관리합니다. 소유 모델 | 관심사 | 소유자 | 이유 | | --- | --- | --- | | 키보드 이동, 포커스 이동, typeahead, 컬렉션 순회 | React Aria / React Stately | 접근성 상태 계약에 의존하는 동작입니다. | | Calendar 월 이동과 셀 포커스 | React Aria / React Stately | 고빈도 상호작용 루프를 로컬·동기적으로 유지합니다. | | 선택한 작업, 유지할 정렬, 선택한 리뷰 날짜 | Context-Action Store | 다른 화면과 handler가 소비할 수 있는 애플리케이션 값입니다. | | 일정 등록, 권한 확인, API 작업, 감사 기록 | Context-Action Action handler | 비동기·guard·observer가 필요한 도메인 워크플로입니다. | Table 경계 Context-Action에 기록된 선택·정렬 값을 controlled prop으로 전달합니다. React Aria callback은 의미 있는 action으로 변환하되, SelectionManager, 행 포커스, 컬렉션 생성을 재구현하지 않습니다. 행의 포커스와 키보드 동작은 React Aria에 맡깁니다. action handler는 선택을 저장하거나 상세를 불러오고 다른 context를 갱신할 수 있지만, 컴포넌트가 자체 이벤트를 처리하기 전에 await 경계를 만들어서는 안 됩니다. Calendar 경

Key points:
• 화살표 키 이동, 범위/다중 선택, focus-visible 동작
• 키보드와 포인터 입력 모두에서 Calendar 월 이동과 날짜 선택
• 관련 popover 또는 dialog의 overlay 포커스 복원
• controlled 값이 서버에서 공급된다면 React 18/19 SSR과 hydration
• action handler가 고빈도 상호작용을 지연시키지 않는지: roving focus를 action