---
document_id: guide--useStoreSelector-patterns
category: guide
source_path: ko/guide/patterns/store/useStoreSelector-patterns.md
character_limit: 2000
last_update: '2025-08-26T00:34:27.383Z'
update_status: auto_generated
priority_score: 95
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
useStoreSelector 패턴

선택적 구독과 성능 최적화를 위한 useStoreSelector를 사용한 고급 스토어 선택 패턴. 사전 요구사항

이 가이드는 설정 사양을 기반으로 구축됩니다. 다음이 있는지 확인하세요:
- 스토어 설정 패턴에 대한 기본 이해
- UserStores와 ProductStores 명명 패턴에 대한 익숙함
- 스토어 프로바이더 설정에 대한 지식

핵심 기능

useStoreSelector 훅은 다음을 제공합니다:
- 선택적 구독: 스토어 데이터의 특정 부분만 구독
- 자동 셀렉터 안정화: 내부 useRef가 셀렉터가 메모이제이션 없이 작동하도록 보장
- 성능 최적화: 지능적인 등가성 확인을 통해 불필요한 재렌더링 방지
- 타입 안전성: 제네릭 타입 매개변수로 완전한 TypeScript 지원

내부 셀렉터 안정화

핵심 기능: useStoreSelector는 내부적으로 useRef를 사용하여 셀렉터 함수를 안정화하므로 성능 문제 없이 인라인 셀렉터를 전달할 수 있습니다:

내부 작동 방식:
- 셀렉터 함수는 안정된 참조를 유지하기 위해 useRef에 저장됩니다
- 매 렌더링마다 새로운 인라인 함수를 전달해도 효율적으로 작동합니다
- 개발 모드에서는 도움이 되는 경고를 표시하지만 기능을 깨뜨리지 않습니다
- 더 최적화하려는 경우가 아니라면 useCallback이 필요하지 않습니다

기본 단일 스토어 선택

설정 기반 UserStores 패턴 사용:

useMultiStoreSelector를 사용한 다중 스토어 선택

UserStores와 ProductStores 패턴 결합:

고급 선택 패턴

useStorePathSelector를 사용한 경로 기반 선택

설정 기반 스토어 접근 사용:

조건부 스토어 선택

설정 기반 조건부 접근 사용:

성능 최적화

등가성 함수

외부 셀렉터 (최고 성능)

useCallback을 사용한 동적 셀렉터

빠른 참조

모범 사례

1. 셀렉터를 순수하게 유지

2. 선택된 데이터 최소화

3. 올바른 패턴 선택

4. 가능할 때 외부 셀렉터 선호

5. 셀렉터 조직

관련 패턴

- useStoreValue 패턴 - 기본 스토어 구독 패턴
- useComputedStore 패턴 - 계산된 값 패턴
- 성능 패턴 - 성능 최적화 기법.
