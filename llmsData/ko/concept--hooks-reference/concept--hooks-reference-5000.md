---
document_id: concept--hooks-reference
category: concept
source_path: ko/concept/hooks-reference.md
character_limit: 5000
last_update: '2026-07-20T04:55:10.469Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Context-Action React 훅 참조

Context-Action React 훅 참조 이 문서는 Context-Action 프레임워크에서 사용 가능한 모든 React 훅을 필수 훅 (핵심 기능)과 유틸리티 훅 (편의 및 최적화)으로 분류합니다. 📋 목차 1. 필수 훅 2. 유틸리티 훅 3. 훅 분류 4. 사용 가이드라인 --- 필수 훅 이 훅들은 Context-Action 프레임워크를 사용하는 데 필수적입니다. 대부분의 애플리케이션에서 이러한 훅이 필요합니다. 🔧 RefContext 훅 (성능) createRefContext<T>() 고성능 DOM 조작을 위한 모든 ref 관련 훅을 생성하는 팩토리 함수. - 목적: 제로 React 리렌더링으로 타입 안전한 직접 DOM 조작 시스템 생성 - 반환: { Provider, useRefHandler, useWaitForRefs, useGetAllRefs } - 필수 용도: 성능 중요 UI, 애니메이션, 실시간 상호작용 useRefHandler() 타입 안전한 직접 DOM 조작이 가능한 ref 핸들러에 액세스하는 주요 훅. - 목적: 타입 안전성을 갖춘 특정 DOM 요소의 ref 핸들러 가져오기 - 필수 용도: React 리렌더링 없는 직접 DOM 업데이트 - 패턴: React 재조정을 우회하는 성능 레이어 useWaitForRefs() 작업을 실행하기 전에 여러 ref가 마운트될 때까지 대기하는 유틸리티 훅. - 목적: 여러 DOM 요소가 필요한 작업 조정 - 필수 용도: 복잡한 DOM 초기화 시퀀스 - 패턴: 비동기 ref 조정 🎯 Action 훅 (핵심) createActionContext<T>() 특정 액션 컨텍스트를 위한 모든 액션 관련 훅을 생성하는 팩토리 함수. - 목적: 타입 안전한 액션 디스패치 및 핸들러 시스템 생성 - 반환: { Provider, useActionDispatch, useActionHandler, useActionRegister } - 필수 용도: 모든 액션 기반 로직 useActionDispatch() 핸들러로 액션을 디스패치하는 주요 훅. - 목적: 액션을 트리거하는 디스패치 함수 가져오기 - 필수 용도: 비즈니스 로직과의 컴포넌트 상호작용 - 패턴: MVVM 아키텍처의 ViewModel 레이어 useActionHandler() 액션 핸들러를 등록하는 주요 훅. - 목적: 특정 액션에 대한 비즈니스 로직 등록 - 필수 용도: 비즈니스 로직 구현 - 모범 사례: 최적화를 위해 useCallback과 함께 사용 - 핸들러 업데이트: 핸들러 함수가 변경될 때 자동으로 업데이트 - 내부 메모이제이션: 안정적인 참조를 유지하면서 핸들러 업데이트 허용 핸들러 업데이트 패턴: 📖 참조: 핸들러 런타임 업데이트 종합적인 패턴 가이드 🏪 Store 훅 (핵심) createStoreContext<T>() 타입 안전성을 갖춘 모든 스토어 관련 훅을 생성하는 팩토리 함수. - 목적: 타입 안전한 스토어 관리 시스템 생성 - 반환: { Provider, useStore, useStoreManager, withProvider } - 필수 용도: 모든 상태 관리 useStoreValue<T>(store) 스토어 변경사항을 구독하는 주요 훅. - 목적: 스토어에서 반응형 값 가져오기 - 필수 용도: 컴포넌트에서 상태 읽기 - 성능: 실제 값 변경 시에만 리렌더링 useStore(name) (패턴에서) 이름으로 스토어에 액세스하는 주요 훅. - 목적: 컨텍스트에서 스토어 인스턴스 가져오기 - 필수 용도: 컴포넌트에서 스토어 액세스 - 타입 안전: 적절히 타입이 지정된 스토어 반환 --- 유틸리티 훅 이 훅들은 추가 기능, 최적화, 편의 기능을 제공합니다. 🎯 Action 유틸리티 훅 useActionDispatchWithResult() 결과 수집이 필요한 액션을 위한 유틸리티 훅. - 목적: 액션을 디스패치하고 핸들러 결과 수집 - 사용 사례: 핸들러로부터 반환 값이 필요한 경우 - 고급: 핸들러 응답이 필요한 복잡한 워크플로우용 useActionRegister() ActionRegister 인스턴스에 직접 액세스하는 유틸리티 훅. - 목적: 액션 레지스트리에 대한 고급 제어 - 사용 사례: 동적 핸들러 관리, 디버깅 - 고급: 일반적인 애플리케이션에서는 거의 필요하지 않음 🏪 Store 유틸리티 훅 useStoreSelector<T, R>(store, selector, equalityFn?) 선택적 구독을 위한 성능 훅. - 목적: 스토어의 특정 부분만 구독 - 최적화: 불필요한 리렌더링 방지 - 사용 사례: 일부만 변경되는 큰 객체 useComputedStore<T, R>(store, compute, config?) 계산된 값을 위한 파생 상태 훅. - 목적: 스토어에서 파생 상태 생성 - 최적화: 의존성이 변경될 때만 재계산 - 사용 사례: 계산된 값, 집계 useLocalStore<T>(initialValue, name?) 컴포넌트 로컬 스토어 훅. - 목적: 컴포넌트 라이프사이클에 범위가 지정된 스토어 생성 - 사용 사례: 복잡한 컴포넌트 상태 - 장점: 전역 상태 없이 스토어 API 사용 assertStoreValue<T>(value, storeName) 스토어 값을 위한 타입 어설션 유틸리티. - 목적: undefined가 아닌 값에 대한 런타임 어설션 - 타입 안전: undefined인 경우 오류 발생 - 사용 사례: 스토어에 값이 반드시 있어야 하는 경우 🔧 성능 최적화 훅 useMultiStoreSelector(stores, selector, equalityFn?) 스토어를 결합하는 다중 스토어 선택자. - 목적: 여러 스토어에서 효율적으로 선택 - 최적화: 여러 스토어에 대한 단일 구독

Key points:
• **목적**: 제로 React 리렌더링으로 타입 안전한 직접 DOM 조작 시스템 생성
• **반환**: `{ Provider, useRefHandler, useWaitForRefs, useGetAllRefs }`
• **필수 용도**: 성능 중요 UI, 애니메이션, 실시간 상호작용
• **목적**: 타입 안전성을 갖춘 특정 DOM 요소의 ref 핸들러 가져오기
• **필수 용도**: React 리렌더링 없는 직접 DOM 업데이트
• **패턴**: React 재조정을 우회하는 성능 레이어
• **목적**: 여러 DOM 요소가 필요한 작업 조정
• **필수 용도**: 복잡한 DOM 초기화 시퀀스
• **패턴**: 비동기 ref 조정
• **목적**: 타입 안전한 액션 디스패치 및 핸들러 시스템 생성
• **반환**: `{ Provider, useActionDispatch, useActionHandler, useActionRegister }`
• **필수 용도**: 모든 액션 기반 로직
• **목적**: 액션을 트리거하는 디스패치 함수 가져오기
• **필수 용도**: 비즈니스 로직과의 컴포넌트 상호작용
• **패턴**: MVVM 아키텍처의 ViewModel 레이어
• **목적**: 특정 액션에 대한 비즈니스 로직 등록
• **필수 용도**: 비즈니스 로직 구현
• **모범 사례**: 최적화를 위해 `useCallback`과 함께 사용
• **핸들러 업데이트**: 핸들러 함수가 변경될 때 자동으로 업데이트
• **내부 메모이제이션**: 안정적인 참조를 유지하면서 핸들러 업데이트 허용
• **목적**: 타입 안전한 스토어 관리 시스템 생성
• **반환**: `{ Provider, useStore, useStoreManager, withProvider }`
• **필수 용도**: 모든 상태 관리
• **목적**: 스토어에서 반응형 값 가져오기
• **필수 용도**: 컴포넌트에서 상태 읽기
• **성능**: 실제 값 변경 시에만 리렌더링
• **목적**: 컨텍스트에서 스토어 인스턴스 가져오기
• **필수 용도**: 컴포넌트에서 스토어 액세스
• **타입 안전**: 적절히 타입이 지정된 스토어 반환
• **목적**: 액션을 디스패치하고 핸들러 결과 수집
• **사용 사례**: 핸들러로부터 반환 값이 필요한 경우
• **고급**: 핸들러 응답이 필요한 복잡한 워크플로우용
• **목적**: 액션 레지스트리에 대한 고급 제어
• **사용 사례**: 동적 핸들러 관리, 디버깅
• **고급**: 일반적인 애플리케이션에서는 거의 필요하지 않음
• **목적**: 스토어의 특정 부분만 구독
• **최적화**: 불필요한 리렌더링 방지
• **사용 사례**: 일부만 변경되는 큰 객체
• **목적**: 스토어에서 파생 상태 생성
• **최적화**: 의존성이 변경될 때만 재계산
• **사용 사례**: 계산된 값, 집계
• **목적**: 컴포넌트 라이프사이클에 범위가 지정된 스토어 생성
• **사용 사례**: 복잡한 컴포넌트 상태
• **장점**: 전역 상태 없이 스토어 API 사용
• **목적**: undefined가 아닌 값에 대한 런타임 어설션
• **타입 안전**: undefined인 경우 오류 발생