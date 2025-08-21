---
document_id: concept--hooks-reference
category: concept
source_path: ko/concept/hooks-reference.md
character_limit: 2000
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
ActionRegister 인스턴스에 직접 액세스하는 유틸리티 훅.
