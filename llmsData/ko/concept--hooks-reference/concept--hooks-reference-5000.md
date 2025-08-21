---
document_id: concept--hooks-reference
category: concept
source_path: ko/concept/hooks-reference.md
character_limit: 5000
last_update: '2025-08-21T02:13:42.384Z'
update_status: auto_generated
priority_score: 85
priority_tier: medium
completion_status: completed
workflow_stage: content_generated
---
Context-Action React 훅 참조

이 문서는 Context-Action 프레임워크에서 사용 가능한 모든 React 훅을 필수 훅 (핵심 기능)과 유틸리티 훅 (편의 및 최적화)으로 분류합니다. 📋 목차

1. 필수 훅
2. 유틸리티 훅
3. 훅 분류
4. 사용 가이드라인

---

필수 훅

이 훅들은 Context-Action 프레임워크를 사용하는 데 필수적입니다. 대부분의 애플리케이션에서 이러한 훅이 필요합니다. 🔧 RefContext 훅 (성능)

createRefContext<T>()
고성능 DOM 조작을 위한 모든 ref 관련 훅을 생성하는 팩토리 함수. - 목적: 제로 React 리렌더링으로 타입 안전한 직접 DOM 조작 시스템 생성
- 반환: { Provider, useRefHandler, useWaitForRefs, useGetAllRefs }
- 필수 용도: 성능 중요 UI, 애니메이션, 실시간 상호작용

useRefHandler()
타입 안전한 직접 DOM 조작이 가능한 ref 핸들러에 액세스하는 주요 훅. - 목적: 타입 안전성을 갖춘 특정 DOM 요소의 ref 핸들러 가져오기
- 필수 용도: React 리렌더링 없는 직접 DOM 업데이트
- 패턴: React 재조정을 우회하는 성능 레이어

useWaitForRefs()
작업을 실행하기 전에 여러 ref가 마운트될 때까지 대기하는 유틸리티 훅. - 목적: 여러 DOM 요소가 필요한 작업 조정
- 필수 용도: 복잡한 DOM 초기화 시퀀스
- 패턴: 비동기 ref 조정

🎯 Action 훅 (핵심)

createActionContext<T>()
특정 액션 컨텍스트를 위한 모든 액션 관련 훅을 생성하는 팩토리 함수. - 목적: 타입 안전한 액션 디스패치 및 핸들러 시스템 생성
- 반환: { Provider, useActionDispatch, useActionHandler, useActionRegister }
- 필수 용도: 모든 액션 기반 로직

useActionDispatch()
핸들러로 액션을 디스패치하는 주요 훅. - 목적: 액션을 트리거하는 디스패치 함수 가져오기
- 필수 용도: 비즈니스 로직과의 컴포넌트 상호작용
- 패턴: MVVM 아키텍처의 ViewModel 레이어

useActionHandler()
액션 핸들러를 등록하는 주요 훅. - 목적: 특정 액션에 대한 비즈니스 로직 등록
- 필수 용도: 비즈니스 로직 구현
- 모범 사례: 최적화를 위해 useCallback과 함께 사용

🏪 Store 훅 (핵심)

createDeclarativeStorePattern<T>()
타입 안전성을 갖춘 모든 스토어 관련 훅을 생성하는 팩토리 함수. - 목적: 타입 안전한 스토어 관리 시스템 생성
- 반환: { Provider, useStore, useStoreManager, withProvider }
- 필수 용도: 모든 상태 관리

useStoreValue<T>(store)
스토어 변경사항을 구독하는 주요 훅. - 목적: 스토어에서 반응형 값 가져오기
- 필수 용도: 컴포넌트에서 상태 읽기
- 성능: 실제 값 변경 시에만 리렌더링

useStore(name) (패턴에서)
이름으로 스토어에 액세스하는 주요 훅. - 목적: 컨텍스트에서 스토어 인스턴스 가져오기
- 필수 용도: 컴포넌트에서 스토어 액세스
- 타입 안전: 적절히 타입이 지정된 스토어 반환

---

유틸리티 훅

이 훅들은 추가 기능, 최적화, 편의 기능을 제공합니다. 🎯 Action 유틸리티 훅

useActionDispatchWithResult()
결과 수집이 필요한 액션을 위한 유틸리티 훅. - 목적: 액션을 디스패치하고 핸들러 결과 수집
- 사용 사례: 핸들러로부터 반환 값이 필요한 경우
- 고급: 핸들러 응답이 필요한 복잡한 워크플로우용

useActionRegister()
ActionRegister 인스턴스에 직접 액세스하는 유틸리티 훅. - 목적: 액션 레지스트리에 대한 고급 제어
- 사용 사례: 동적 핸들러 관리, 디버깅
- 고급: 일반적인 애플리케이션에서는 거의 필요하지 않음

🏪 Store 유틸리티 훅

useStoreSelector<T, R>(store, selector, equalityFn?)
선택적 구독을 위한 성능 훅. - 목적: 스토어의 특정 부분만 구독
- 최적화: 불필요한 리렌더링 방지
- 사용 사례: 일부만 변경되는 큰 객체

useComputedStore<T, R>(store, compute, config?)
계산된 값을 위한 파생 상태 훅. - 목적: 스토어에서 파생 상태 생성
- 최적화: 의존성이 변경될 때만 재계산
- 사용 사례: 계산된 값, 집계

useLocalStore<T>(initialValue, name?)
컴포넌트 로컬 스토어 훅. - 목적: 컴포넌트 라이프사이클에 범위가 지정된 스토어 생성
- 사용 사례: 복잡한 컴포넌트 상태
- 장점: 전역 상태 없이 스토어 API 사용

usePersistedStore<T>(key, initialValue, options?)
브라우저 저장소를 위한 지속성 훅. - 목적: localStorage/sessionStorage와 스토어 자동 동기화
- 사용 사례: 설정, 사용자 기본 설정, 임시 데이터
- 기능: 탭 간 동기화

assertStoreValue<T>(value, storeName)
스토어 값을 위한 타입 어설션 유틸리티. - 목적: undefined가 아닌 값에 대한 런타임 어설션
- 타입 안전: undefined인 경우 오류 발생
- 사용 사례: 스토어에 값이 반드시 있어야 하는 경우

🔧 성능 최적화 훅

useMultiStoreSelector(stores, selector, equalityFn?)
스토어를 결합하는 다중 스토어 선택자. - 목적: 여러 스토어에서 효율적으로 선택
- 최적화: 여러 스토어에 대한 단일 구독
- 사용 사례: 스토어 간 계산된 값

useStorePathSelector(store, path, equalityFn?)
중첩된 객체를 위한 경로 기반 선택자. - 목적: 경로로 중첩된 값 선택
- 편의성: 깊은 선택을 위한 점 표기법
- 사용 사례: 복잡한 중첩 상태

useAsyncComputedStore(asyncCompute, deps, config?)
비동기 계산된 값 훅. - 목적: 비동기적으로 값 계산
- 기능: 로딩 상태, 오류 처리
- 사용 사례: API 파생 상태

---

훅 분류

도메인별 분류

상태 관리
- 필수: useStoreValue, useStore (패턴에서)
- 유틸리티: useStoreSelector, useComputedStore, useLocalStore

액션 처리
- 필수: useActionDispatch, useActionHandler
- 유틸리티: useActionDispatchWithResult, useActionRegister

DOM 조작 및 성능
- 필수: useRefHandler (RefContext에서)
- 유틸리티: useWaitForRefs, useGetAllRefs

지속성
- 유틸리티: usePersistedStore

고급/메타
- 유틸리티: useActionRegister

사용 빈도별 분류

높은 빈도 (컴포넌트의 80% 이상)
- useStoreValue
- useActionDispatch
- useStore (패턴에서)

중간 빈도 (컴포넌트의 20-80%)
- useActionHandler
- useStoreSelector
- useLocalStore

낮은 빈도 (컴포넌트의 20% 미만)
- useComputedStore
- usePersistedStore
- useActionDispatchWithResult

---

사용 가이드라인

필수 훅을 사용해야 하는 경우

1. 새로운 기능 시작: 항상 필수 훅부터 시작
2. 기본 CRUD 작업: 필수 훅으로 충분
3. 단순한 상태 관리: useStoreValue + useActionDispatch
4. 표준 비즈니스 로직: 로직 구현을 위한 useActionHandler

유틸리티 훅을 사용해야 하는 경우

1. 성능 문제: 최적화를 위한 선택자 훅 사용
2. 복잡한 상태 파생: useComputedStore 사용
3. 브라우저 저장소 필요: usePersistedStore 사용
4. 컴포넌트 로컬 복잡 상태: useLocalStore 사용
5. 고급 워크플로우: 결과 수집 훅 사용
6. 메타 프로그래밍: 레지스트리 훅 사용

모범 사례

필수 훅 패턴

유틸리티 훅 패턴

마이그레이션 경로

새로운 프로젝트의 경우:
1. 필수 훅만으로 시작
2. 필요에 따라 유틸리티 훅 추가
3. 최적화를 위해 유틸리티 훅으로 리팩터링

기존 프로젝트의 경우:
1. 기존 패턴 유지
2. 새로운 기능에 점진적으로 유틸리티 훅 채택
3. 성능이 중요한 영역을 선택자 훅으로 리팩터링

---

추가 훅 및 유틸리티

🔍 컨텍스트 훅

useStoreContext()
스토어 컨텍스트에 직접 액세스하는 저수준 컨텍스트 훅. - 목적: 스토어 컨텍스트 내부에 직접 액세스
- 사용 사례: 커스텀 스토어 패턴, 디버깅
- 고급: 애플리케이션에서는 거의 필요하지 않음

📊 다중 스토어 훅

useStoreValues<T, S>(store, selectors)
한 번에 여러 값을 추출하는 다중 선택자 훅. - 목적: 단일 구독으로 여러 값 추출
- 성능: 여러 useStoreValue 호출보다 효율적
- 사용 사례: 여러 파생 값이 필요한 컴포넌트

useMultiStoreSelector<R>(stores, selector, equalityFn?)
여러 스토어를 결합하는 스토어 간 선택자. - 목적: 여러 스토어에서 값 계산
- 성능: 모든 스토어에 대한 단일 구독
- 사용 사례: 스토어 간 계산된 값

useMultiComputedStore<R>(stores, compute, config?)
복잡한 파생을 위한 다중 스토어 계산 훅.
