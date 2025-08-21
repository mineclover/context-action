---
document_id: guide--hooks
category: guide
source_path: ko/guide/hooks.md
character_limit: 1000
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
모든 스토어 관련 훅을 생성하는 팩토리 함수. useStoreValue<T>(store)
스토어 변경 사항을 구독하는 주요 훅. useStore(name)
이름으로 스토어에 접근하는 주요 훅. 유틸리티 훅

고급 시나리오를 위한 추가 훅들. 스토어 관리

useStoreManager()
프로그래밍 방식으로 스토어를 업데이트하는 훅. 고급 액션 훅

useActionDispatchWithResult()
디스패치와 결과 수집 기능을 모두 제공하는 훅. 사용 가이드라인

모범 사례

1. 핸들러에 useCallback 사용:

2. 필요할 때 패턴 조합:

3. 타입 안전한 스토어 접근:

성능 팁

- 스토어 구독은 실제 값 변경 시에만 다시 렌더링됩니다
- 전체 상태를 구독하는 대신 특정 스토어 구독을 사용하세요
- 핸들러 등록은 최소한의 다시 렌더링에 최적화되어 있습니다
- 액션 디스패칭은 자동으로 메모이제이션됩니다.
