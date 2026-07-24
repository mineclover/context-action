---
document_id: guide--patterns--store--path-based-subscription
category: guide
source_path: ko/guide/patterns/store/path-based-subscription.md
character_limit: 1000
last_update: '2026-07-24T05:15:02.414Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
경로 기반 구독 (Path-Based Subscription)

경로 기반 구독 (Path-Based Subscription) JSON 패치를 분석하여 리렌더링 시점을 결정하는 최적화된 구독 패턴입니다. 컴포넌트 업데이트를 세밀하게 제어할 수 있습니다. 개요 기존 셀렉터는 모든 상태 변경 시 실행되어 결과를 비교합니다. 경로 기반 구독은 JSON 패치를 분석하여 구독 경로가 영향받았는지 확인하므로, 불필요한 셀렉터 실행을 피할 수 있습니다. 핵심 API useStorePath 스토어의 특정 경로를 구독합니다. 해당 경로가 변경될 때만 리렌더링됩니다. useStoreSelectorWithPaths 셀렉터 변환과 경로 기반 최적화를 결합합니다. 셀렉터와 비교 | 기능 | useStoreSelector | useStorePath | useSto

Key points:
• **string**: 객체 속성 키
• **number**: 배열 인덱스
• `~` → `~0`
• `/` → `~1`
• 단순 속성 접근에는 `useStorePath` 사용
• 변환과 최적화가 모두 필요하면 `useStoreSelectorWithPaths` 사용