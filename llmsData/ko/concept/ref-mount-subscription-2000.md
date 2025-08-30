---
document_id: ko_concept_ref-mount-subscription
category: concept
source_path: ko/concept/ref-mount-subscription.md
character_limit: 2000
last_update: '2025-08-30T10:57:25.920Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
RefContext 마운트 상태 구독

RefContext 마운트 상태 구독 RefContext는 이제 마운트 상태 변경에 대한 반응형 구독 기능을 제공하여, 컴포넌트가 React 리렌더링으로 마운팅/언마운팅 이벤트에 응답할 수 있게 합니다. 개요 RefContext의 전통적인 isMounted 속성은 지연 평가를 사용하여 리렌더링을 발생시키지 않고 최신 상태를 제공하지만, 새로운 구독 훅은 컴포넌트가 마운트 상태 변경에 응답해야 할 때 반응형 패턴을 가능하게 합니다. 사용 가능한 구독 훅 1. useRefMountState(refName) 마운트 상태 변경을 구독하고 상태가 변경될 때 리렌더링을 트리거합니다. 반환값: - isMounted: boolean - 엘리먼트가 현재 마운트되어 있는지 여부 - isWaitingForMount: boolean - 마운트를 기다리고 있는지 여부 - mountedTarget: T | null - 실제 마운트된 엘리먼트 (또는 null) 2. useOnMountStateChange(refName, callback) 마운트 상태가 변경될 때마다 콜백을 실행합니다. 3. useRefMountChecker(refName) 현재 마운트 상태를 확인하는 안정적인 함수를 반환합니다 (이벤트 핸들러에서 유용). 사용 패턴 패턴 1: 반응형 마운트 상태 표시 패턴 2: 마운트 기반 이펙트 실행 패턴 3: 이벤트 핸들러 안전성 확인 비교: 지연 평가 vs 반응형 구독 전통적 방식 (지연 평가) - 리렌더링 없음 새로운 방식 (반응형 구독) - 리렌더링 트리거 각 패턴을 사용해야 하는 경우 지연 평가 (전통적) 사용 시기: - ✅ 선택적 구독 패턴 구축 (리렌더링 없음) - ✅ 고성능 직접 DOM 조작 - ✅ 현재 상태를 확인하는 이벤트 핸들러 - ✅ 최대 성능을 위한 비반응형 패턴 반응형 구독 (새로운 방식) 사용 시기: - ✅ UI가 마운트 상태 변경을 반영해야 하는 경우 - ✅ 컴포넌트가 마운팅/언마운팅에 반응해야 하는 경우 - ✅ 마운트 상태에 기반한 조건부 렌더링 - 

Key points:
• `isMounted`: boolean - 엘리먼트가 현재 마운트되어 있는지 여부
• `isWaitingForMount`: boolean - 마운트를 기다리고 있는지 여부
• `mountedTarget`: T | null - 실제 마운트된 엘리먼트 (또는 null)
• ✅ 선택적 구독 패턴 구축 (리렌더링 없음)
• ✅ 고성능 직접 DOM 조작
• ✅ 현재 상태를 확인하는 이벤트 핸들러
• ✅ 최대 성능을 위한 비반응형 패턴
• ✅ UI가 마운트 상태 변경을 반영해야 하는 경우
• ✅ 컴포넌트가 마운팅/언마운팅에 반응해야 하는 경우
• ✅ 마운트 상태에 기반한 조건부 렌더링
• ✅ 엘리먼트가 사용 가능해질 때 이펙트 트리거
• **반응형 구독**: 마운트 상태 변경 시 React 리렌더링 트리거
• **지연 평가**: 리렌더링 없음, 항상 현재 상태
• **마운트 체커**: 안정적인 함수, 리렌더링 없음, 요청 시 현재 상태