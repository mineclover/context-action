---
document_id: guide--patterns--store--path-based-subscription
category: guide
source_path: ko/guide/patterns/store/path-based-subscription.md
character_limit: 5000
last_update: '2026-07-24T05:15:02.415Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
경로 기반 구독 (Path-Based Subscription)

경로 기반 구독 (Path-Based Subscription) JSON 패치를 분석하여 리렌더링 시점을 결정하는 최적화된 구독 패턴입니다. 컴포넌트 업데이트를 세밀하게 제어할 수 있습니다. 개요 기존 셀렉터는 모든 상태 변경 시 실행되어 결과를 비교합니다. 경로 기반 구독은 JSON 패치를 분석하여 구독 경로가 영향받았는지 확인하므로, 불필요한 셀렉터 실행을 피할 수 있습니다. 핵심 API useStorePath 스토어의 특정 경로를 구독합니다. 해당 경로가 변경될 때만 리렌더링됩니다. useStoreSelectorWithPaths 셀렉터 변환과 경로 기반 최적화를 결합합니다. 셀렉터와 비교 | 기능 | useStoreSelector | useStorePath | useStoreSelectorWithPaths | |------|------------------|--------------|---------------------------| | 셀렉터 실행 | 매 변경마다 | 경로 매칭 시만 | 경로 매칭 시만 | | 비교 대상 | 셀렉터 결과 | 패치 경로 | 패치 경로 | | 파생값 지원 | ✅ 가능 | ❌ 불가 | ✅ 가능 | | 성능 | 셀렉터 비용 의존 | 빠름 (문자열 비교) | 두 장점 결합 | 언제 무엇을 사용할까 useStorePath 변환 없이 직접 속성에 접근할 때: useStoreSelector 경로 힌트가 실용적이지 않은 복잡한 변환: useStoreSelectorWithPaths 의존성이 명확한 파생값: 경로 포맷 레퍼런스 경로 타입 정의 - string: 객체 속성 키 - number: 배열 인덱스 경로 예시 | 상태 접근 | 경로 | |----------|------| | state.user | ['user'] | | state.user.name | ['user', 'name'] | | state.user.profile.address.city | ['user', 'profile', 'address', 'city'] | | state.items[0] | ['items', 0] | | state.items[1].name | ['items', 1, 'name'] | | state.matrix[0][1] | ['matrix', 0, 1] | 경로 문자열 정규화 (JSON Pointer RFC 6901) 내부적으로 경로는 효율적인 접두사 매칭을 위해 JSON Pointer 문자열 (RFC 6901)로 변환됩니다: 특수 문자 이스케이프 (RFC 6901 섹션 3): 나 /를 포함한 키는 이스케이프됩니다. 순서가 중요합니다 - 를 먼저 이스케이프: - → 0 - / → 1 RFC 6901 섹션 5 예시: 경로 경계 매칭: 매칭 알고리즘은 경로 경계를 정확히 처리합니다: 유틸리티 함수 (export됨): 경로 매칭 동작 방식 패치가 구독 경로에 영향을 주는 경우: 1. 정확히 일치: 패치 경로가 구독 경로와 동일 2. 부모 변경: 패치 경로가 구독 경로의 접두사 3. 자식 변경: 구독 경로가 패치 경로의 접두사 매칭 알고리즘 배열 연산과 패치 배열 변경이 어떤 패치를 생성하는지 이해하면 효과적인 경로 구독이 가능합니다. 배열 변경 패치 패턴 | 연산 | 생성되는 패치 | 예시 | |------|--------------|------| | arr[i] = value | 인덱스에 replace | { path: ['items', 1], op: 'replace' } | | arr[i].prop = value | 중첩 경로에 replace | { path: ['items', 1, 'name'], op: 'replace' } | | arr.push(value) | 새 인덱스에 add | { path: ['items', 3], op: 'add' } | | arr.unshift(value) | 여러 replace + add | 모든 인덱스 이동 | | arr.splice(i, n) | 여러 replace + length | i 이후 인덱스 영향 | 상세 패치 예시 배열 구독 전략 전략 1: 특정 인덱스 구독 전략 2: 전체 배열 구독 전략 3: 배열 길이 + 특정 아이템 중첩 배열 (Matrix) 복잡한 중첩 구조 커스텀 동등성 비교 두 훅 모두 커스텀 동등성 함수를 지원합니다: Store API: subscribeWithPatches 경로 기반 훅을 지원하는 기본 Store API: 스토어가 한 애니메이션 프레임 안에서 여러 업데이트를 배치하면 콜백에는 해당 프레임의 모든 전환 패치가 연결되어 전달됩니다. 따라서 경로 기반 구독자가 앞선 업데이트를 놓치지 않으며, 알림이 반영된 후 getLastPatches()도 동일한 누적 패치를 반환합니다. 성능 이점 이전 (셀렉터만 사용) 이후 (경로 기반) 모범 사례 권장 - 단순 속성 접근에는 useStorePath 사용 - 변환과 최적화가 모두 필요하면 useStoreSelectorWithPaths 사용 - 더 나은 필터링을 위해 정확한 dependsOn 경로 지정 - 특정 배열 요소 구독에는 배열 인덱스 사용 피해야 할 것 - 파생/계산 값이 필요할 때 useStorePath 사용 - 경로를 알 때 dependsOn 생략 (매 변경마다 실행됨) - 경로 과다 지정 (여러 자식이 필요하면 부모 구독) 관련 패턴 - useStoreValue 패턴 - 기본 구독 패턴 - 스토어 설정 - 스토어 설정 옵션 - 기본 사용법 - 스토어 기본 사용법

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
• **자식 변경**: 구독 경로가 패치 경로의 접두사