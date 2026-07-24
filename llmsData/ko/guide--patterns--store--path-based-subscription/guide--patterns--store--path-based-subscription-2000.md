---
document_id: guide--patterns--store--path-based-subscription
category: guide
source_path: ko/guide/patterns/store/path-based-subscription.md
character_limit: 2000
last_update: '2026-07-24T05:15:02.415Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
경로 기반 구독 (Path-Based Subscription)

경로 기반 구독 (Path-Based Subscription) JSON 패치를 분석하여 리렌더링 시점을 결정하는 최적화된 구독 패턴입니다. 컴포넌트 업데이트를 세밀하게 제어할 수 있습니다. 개요 기존 셀렉터는 모든 상태 변경 시 실행되어 결과를 비교합니다. 경로 기반 구독은 JSON 패치를 분석하여 구독 경로가 영향받았는지 확인하므로, 불필요한 셀렉터 실행을 피할 수 있습니다. 핵심 API useStorePath 스토어의 특정 경로를 구독합니다. 해당 경로가 변경될 때만 리렌더링됩니다. useStoreSelectorWithPaths 셀렉터 변환과 경로 기반 최적화를 결합합니다. 셀렉터와 비교 | 기능 | useStoreSelector | useStorePath | useStoreSelectorWithPaths | |------|------------------|--------------|---------------------------| | 셀렉터 실행 | 매 변경마다 | 경로 매칭 시만 | 경로 매칭 시만 | | 비교 대상 | 셀렉터 결과 | 패치 경로 | 패치 경로 | | 파생값 지원 | ✅ 가능 | ❌ 불가 | ✅ 가능 | | 성능 | 셀렉터 비용 의존 | 빠름 (문자열 비교) | 두 장점 결합 | 언제 무엇을 사용할까 useStorePath 변환 없이 직접 속성에 접근할 때: useStoreSelector 경로 힌트가 실용적이지 않은 복잡한 변환: useStoreSelectorWithPaths 의존성이 명확한 파생값: 경로 포맷 레퍼런스 경로 타입 정의 - string: 객체 속성 키 - number: 배열 인덱스 경로 예시 | 상태 접근 | 경로 | |----------|------| | state.user | ['user'] | | state.user.name | ['user', 'name'] | | state.user.profile.address.city | ['user', 'profile', 'address', '

Key points:
• **string**: 객체 속성 키
• **number**: 배열 인덱스
• `~` → `~0`
• `/` → `~1`
• 단순 속성 접근에는 `useStorePath` 사용
• 변환과 최적화가 모두 필요하면 `useStoreSelectorWithPaths` 사용
• 더 나은 필터링을 위해 정확한 `dependsOn` 경로 지정
• 특정 배열 요소 구독에는 배열 인덱스 사용
• 파생/계산 값이 필요할 때 `useStorePath` 사용
• 경로를 알 때 `dependsOn` 생략 (매 변경마다 실행됨)
• 경로 과다 지정 (여러 자식이 필요하면 부모 구독)
• [useStoreValue 패턴](./useStoreValue-patterns.md) - 기본 구독 패턴
• [스토어 설정](./store-configuration.md) - 스토어 설정 옵션
• [기본 사용법](./basic-usage.md) - 스토어 기본 사용법
• **정확히 일치**: 패치 경로가 구독 경로와 동일
• **부모 변경**: 패치 경로가 구독 경로의 접두사