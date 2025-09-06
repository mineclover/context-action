# API 참조 인덱스

Context-Action 프레임워크 TypeDoc 생성 문서에 대한 완전한 참조 가이드입니다.

## 📋 개요

이 인덱스는 인터페이스별 문서를 작성할 때 쉽게 참조할 수 있도록 모든 TypeDoc 생성 API 문서를 패키지 및 범주별로 정리합니다.

## 📦 패키지 구조

### @context-action/core
- **목적**: 순수 TypeScript 액션 파이프라인 (프레임워크 독립적)
- **의존성**: 의존성 없음
- **문서**: [코어 패키지 API](./core/src/README.md)

### @context-action/react
- **목적**: MVVM 아키텍처를 사용한 React 통합
- **의존성**: React, @context-action/core
- **문서**: [React 패키지 API](./react/src/README.md)

## 🎯 @context-action/core API 참조

### 📚 클래스 (2)
- [`ActionRegister`](./core/src/classes/ActionRegister.md) - 핵심 액션 파이프라인 관리
- [`ReactActionError`](./core/src/classes/ReactActionError.md) - 액션별 오류 처리

### 🔌 인터페이스 (7)
- [`ActionPayloadMap`](./core/src/interfaces/ActionPayloadMap.md) - 타입-세이프 액션 페이로드 정의
- [`PipelineController`](./core/src/interfaces/PipelineController.md) - 액션 실행 제어 인터페이스
- [`HandlerConfig`](./core/src/interfaces/HandlerConfig.md) - 핸들러 등록 구성
- [`ActionRegisterConfig`](./core/src/interfaces/ActionRegisterConfig.md) - ActionRegister 구성 옵션
- [`DispatchOptions`](./core/src/interfaces/DispatchOptions.md) - 액션 디스패치 구성
- [`ExecutionResult`](./core/src/interfaces/ExecutionResult.md) - 액션 실행 결과 구조
- [`ActionDispatcher`](./core/src/interfaces/ActionDispatcher.md) - 액션 디스패치 인터페이스

### 🏷️ 타입 별칭 (3)
- [`ActionHandler`](./core/src/type-aliases/ActionHandler.md) - 액션 핸들러 함수 타입
- [`ExecutionMode`](./core/src/type-aliases/ExecutionMode.md) - 액션 실행 모드 타입
- [`UnregisterFunction`](./core/src/type-aliases/UnregisterFunction.md) - 핸들러 정리 함수 타입

### ⚙️ 함수 (7)
#### 실행 함수
- [`executeSequential`](./core/src/functions/executeSequential.md) - 순차 핸들러 실행
- [`executeParallel`](./core/src/functions/executeParallel.md) - 병렬 핸들러 실행  
- [`executeRace`](./core/src/functions/executeRace.md) - 레이스 기반 핸들러 실행

#### 팩토리 함수
- [`createActionHandler`](./core/src/functions/createActionHandler.md) - 액션 핸들러 생성
- [`createReactHandlerConfig`](./core/src/functions/createReactHandlerConfig.md) - React 핸들러 구성 생성
- [`createReactDispatcher`](./core/src/functions/createReactDispatcher.md) - React 디스패처 생성

#### 유틸리티 함수
- [`isReactActionError`](./core/src/functions/isReactActionError.md) - 오류 타입 검사

### 🛠️ 변수 (1)
- [`ReactDevUtils`](./core/src/variables/ReactDevUtils.md) - 개발 유틸리티

## ⚛️ @context-action/react API 참조

### 📚 클래스 (3)
- [`Store`](./react/src/classes/Store.md) - 반응형 스토어 구현
- [`StoreManager`](./react/src/classes/StoreManager.md) - 스토어 레지스트리 관리
- [`StoreErrorBoundary`](./react/src/classes/StoreErrorBoundary.md) - 스토어용 React 오류 경계

### 🔌 인터페이스 (12)
#### 액션 컨텍스트 인터페이스
- [`ActionContextConfig`](./react/src/interfaces/ActionContextConfig.md) - 액션 컨텍스트 구성
- [`ActionContextType`](./react/src/interfaces/ActionContextType.md) - 액션 컨텍스트 타입 정의
- [`ActionContextReturn`](./react/src/interfaces/ActionContextReturn.md) - 액션 컨텍스트 반환 타입

#### Ref 컨텍스트 인터페이스
- [`RefContextReturn`](./react/src/interfaces/RefContextReturn.md) - Ref 컨텍스트 반환 타입
- [`CreateRefContextOptions`](./react/src/interfaces/CreateRefContextOptions.md) - Ref 컨텍스트 생성 옵션
- [`RefTarget`](./react/src/interfaces/RefTarget.md) - Ref 대상 인터페이스
- [`RefOperationResult`](./react/src/interfaces/RefOperationResult.md) - Ref 작업 결과
- [`RefOperationOptions`](./react/src/interfaces/RefOperationOptions.md) - Ref 작업 옵션

#### 스토어 인터페이스
- [`StoreErrorBoundaryProps`](./react/src/interfaces/StoreErrorBoundaryProps.md) - 오류 경계 props
- [`Snapshot`](./react/src/interfaces/Snapshot.md) - 스토어 스냅샷 인터페이스
- [`IStore`](./react/src/interfaces/IStore.md) - 스토어 인터페이스 정의
- [`StoreConfig`](./react/src/interfaces/StoreConfig.md) - 스토어 구성

### 🏷️ 타입 별칭 (1)
- [`InitialStores`](./react/src/type-aliases/InitialStores.md) - 초기 스토어 정의 타입

### ⚙️ 함수 (6)
#### 컨텍스트 생성 함수
- [`createActionContext`](./react/src/functions/createActionContext.md) - 액션 전용 컨텍스트 생성
- [`createStoreContext`](./react/src/functions/createStoreContext.md) - 스토어 전용 컨텍스트 생성
- [`createRefContext`](./react/src/functions/createRefContext.md) - Ref 컨텍스트 생성

#### 스토어 함수
- [`createStore`](./react/src/functions/createStore.md) - 개별 스토어 생성
- [`useStoreValue`](./react/src/functions/useStoreValue.md) - 스토어 값 구독
- [`useStoreSelector`](./react/src/functions/useStoreSelector.md) - 셀렉터로 스토어 값 선택

## 📖 사용 사례별 문서 범주

### 🎯 액션 파이프라인 (코어 패키지 중심)
**핵심 개념**:
- [`ActionRegister`](./core/src/classes/ActionRegister.md) - 주요 파이프라인 관리
- [`ActionHandler`](./core/src/type-aliases/ActionHandler.md) - 핸들러 함수 타입
- [`PipelineController`](./core/src/interfaces/PipelineController.md) - 실행 제어

**실행 모드**:
- [`executeSequential`](./core/src/functions/executeSequential.md) - 순차 실행
- [`executeParallel`](./core/src/functions/executeParallel.md) - 병렬 실행
- [`executeRace`](./core/src/functions/executeRace.md) - 레이스 기반 핸들러 실행
- [`ExecutionMode`](./core/src/type-aliases/ExecutionMode.md) - 모드 타입

### 🏪 스토어 시스템 (React 패키지 중심)
**스토어 코어**:
- [`Store`](./react/src/classes/Store.md) - 개별 스토어 구현
- [`StoreManager`](./react/src/classes/StoreManager.md) - 스토어 레지스트리
- [`createStore`](./react/src/functions/createStore.md) - 스토어 생성

**스토어 컨텍스트 패턴**:
- [`createStoreContext`](./react/src/functions/createStoreContext.md) - 컨텍스트 생성
- [`InitialStores`](./react/src/type-aliases/InitialStores.md) - 스토어 정의
- [`StoreConfig`](./react/src/interfaces/StoreConfig.md) - 스토어 구성

**스토어 훅**:
- [`useStoreValue`](./react/src/functions/useStoreValue.md) - 값 구독
- [`useStoreSelector`](./react/src/functions/useStoreSelector.md) - 선택적 구독

### 🎯 액션 컨텍스트 (React 패키지 중심)
**컨텍스트 생성**:
- [`createActionContext`](./react/src/functions/createActionContext.md) - 액션 전용 컨텍스트 생성
- [`ActionContextConfig`](./react/src/interfaces/ActionContextConfig.md) - 구성
- [`ActionContextReturn`](./react/src/interfaces/ActionContextReturn.md) - 반환 타입

### 🔧 Ref 컨텍스트 (React 패키지 중심)
**직접 DOM 조작**:
- [`createRefContext`](./react/src/functions/createRefContext.md) - Ref 컨텍스트 생성
- [`RefContextReturn`](./react/src/interfaces/RefContextReturn.md) - 반환 타입
- [`RefTarget`](./react/src/interfaces/RefTarget.md) - Ref 대상 인터페이스
- [`RefOperationResult`](./react/src/interfaces/RefOperationResult.md) - 작업 결과

### 🛡️ 오류 처리
**오류 타입**:
- [`ReactActionError`](./core/src/classes/ReactActionError.md) - 액션 오류
- [`isReactActionError`](./core/src/functions/isReactActionError.md) - 타입 검사
- [`StoreErrorBoundary`](./react/src/classes/StoreErrorBoundary.md) - React 오류 경계

### 🛠️ 개발 및 유틸리티
**개발 도구**:
- [`ReactDevUtils`](./core/src/variables/ReactDevUtils.md) - 개발 유틸리티
- [`Snapshot`](./react/src/interfaces/Snapshot.md) - 스토어 스냅샷

## 📝 인터페이스별 문서 가이드

인터페이스별 문서를 작성할 때 다음 구조를 사용하십시오.

### 1. 코어 파이프라인 문서
- 주요 API는 [`ActionRegister`](./core/src/classes/ActionRegister.md) 참조
- 구성 예제는 [`HandlerConfig`](./core/src/interfaces/HandlerConfig.md) 사용
- 고급 패턴은 실행 함수 참조

### 2. 스토어 패턴 문서
- 기본 패턴은 [`createStoreContext`](./react/src/functions/createStoreContext.md)로 시작
- 고급 스토어 작업은 [`Store`](./react/src/classes/Store.md) 참조
- 구독 패턴은 [`useStoreValue`](./react/src/functions/useStoreValue.md) 사용

### 3. 액션 패턴 문서
- [`createActionContext`](./react/src/functions/createActionContext.md)로 시작
- 사용 가능한 훅은 [`ActionContextReturn`](./react/src/interfaces/ActionContextReturn.md) 참조
- 제어 패턴은 [`PipelineController`](./core/src/interfaces/PipelineController.md) 사용

### 4. RefContext 문서
- [`createRefContext`](./react/src/functions/createRefContext.md)로 시작
- Ref 관리는 [`RefTarget`](./react/src/interfaces/RefTarget.md) 참조
- 작업 패턴은 [`RefOperationResult`](./react/src/interfaces/RefOperationResult.md) 사용

## 🔗 교차 참조

### 패턴 관계
- **액션 → 코어**: 액션 컨텍스트는 코어 ActionRegister 사용
- **스토어 → 오류**: 스토어는 StoreErrorBoundary와 통합
- **모두 → 타입 안전성**: 모든 패턴은 타입 안전성을 위해 ActionPayloadMap 사용

### 문서 우선순위
1. **높은 우선순위**: 주요 패턴 함수 (`createActionContext`, `createStoreContext`, `createRefContext`)
2. **중간 우선순위**: 코어 클래스 (`ActionRegister`, `Store`, `StoreManager`)
3. **낮은 우선순위**: 유틸리티 함수 및 개발 도구

---

*이 인덱스는 자동으로 유지 관리되며 현재 TypeDoc 생성 문서 구조를 반영합니다.*
