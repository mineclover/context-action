# 인터페이스 문서 가이드

TypeDoc으로 생성된 API 참조를 위한 핵심 기능 문서입니다.

## 📋 필수 구조

기능, 사용 패턴 및 TypeDoc 링크에 중점을 둔 간소화된 문서입니다.

## 🎯 @context-action/core 인터페이스 문서

### 📚 클래스

#### ActionRegister ✅ 완료
- [x] **핵심 메서드**: `registerHandler()`, `dispatch()`, `unregisterHandler()`
- [x] **사용법**: 파이프라인 설정, 핸들러 우선순위, 실행 모드
- [x] **링크**: [`ActionRegister.md`](./core/src/classes/ActionRegister.md) → **[actionregister-guide.md](./actionregister-guide.md)**

#### ReactActionError ✅ 완료
- [x] **속성**: `action`, `payload`, `handlerId`, `timestamp`
- [x] **사용법**: 오류 처리, `isReactActionError()`를 사용한 타입 검사
- [x] **링크**: [`ReactActionError.md`](./core/src/classes/ReactActionError.md) → **[reactactionerror-guide.md](./reactactionerror-guide.md)**

### 🔌 인터페이스

#### ActionPayloadMap ✅ 완료
- [x] **구조**: `{ actionType: PayloadType }` 타입 매핑
- [x] **사용법**: 액션 타입 정의, 확장 패턴
- [x] **링크**: [`ActionPayloadMap.md`](./core/src/interfaces/ActionPayloadMap.md) → **[actionpayloadmap-guide.md](./actionpayloadmap-guide.md)**

#### PipelineController ✅ 완료
- [x] **메서드**: `abort()`, `getContext()`, `setResult()`
- [x] **사용법**: 핸들러 실행 제어, 오류 처리
- [x] **링크**: [`PipelineController.md`](./core/src/interfaces/PipelineController.md) → **[pipelinecontroller-guide.md](./pipelinecontroller-guide.md)**

#### HandlerConfig ✅ 완료
- [x] **속성**: `priority`, `id`, `blocking`, `once`, `debounce`, `throttle`, `replaceExisting`, `cleanup`
- [x] **사용법**: 핸들러 등록, 우선순위 지정, 타이밍 제어 및 생명주기 관리
- [x] **링크**: [`HandlerConfig.md`](./core/src/interfaces/HandlerConfig.md) → **[handlerconfig-guide.md](./handlerconfig-guide.md)**

#### ActionRegisterConfig ✅ 완료
- [x] **속성**: `name`, `registry` (예: `debug`, `defaultExecutionMode` 등의 옵션 포함)
- [x] **사용법**: ActionRegister 초기화, 성능 튜닝, 디버깅
- [x] **링크**: [`ActionRegisterConfig.md`](./core/src/interfaces/ActionRegisterConfig.md) → **[actionregisterconfig-guide.md](./actionregisterconfig-guide.md)**

#### DispatchOptions ✅ 완료
- [x] **속성**: 동적 디스패치 구성
- [x] **사용법**: 디스패치별 동작 재정의
- [x] **링크**: [`DispatchOptions.md`](./core/src/interfaces/DispatchOptions.md) → **[dispatchoptions-guide.md](./dispatchoptions-guide.md)**

#### ExecutionResult ✅ 완료
- [x] **구조**: 성공/오류 상태, 결과 컬렉션
- [x] **사용법**: 액션 실행 결과, 오류 처리
- [x] **링크**: [`ExecutionResult.md`](./core/src/interfaces/ExecutionResult.md) → **[executionresult-guide.md](./executionresult-guide.md)**

#### ActionDispatcher ✅ 완료
- [x] **메서드**: 타입-세이프 액션 디스패치 인터페이스
- [x] **사용법**: 디스패처 구현 계약
- [x] **링크**: [`ActionDispatcher.md`](./core/src/interfaces/ActionDispatcher.md) → **[actiondispatcher-guide.md](./actiondispatcher-guide.md)**

### 🏷️ 타입 별칭

#### ActionHandler ✅ 완료
- [x] **타입**: `(payload, controller) => Promise<any> | any`
- [x] **사용법**: 핸들러 구현, 비동기/동기 패턴
- [x] **링크**: [`ActionHandler.md`](./core/src/type-aliases/ActionHandler.md) → **[actionhandler-guide.md](./actionhandler-guide.md)**

#### ExecutionMode ✅ 완료
- [x] **값**: `'sequential' | 'parallel' | 'race'`
- [x] **사용법**: 핸들러 실행 전략 선택
- [x] **링크**: [`ExecutionMode.md`](./core/src/type-aliases/ExecutionMode.md) → **[executionmode-guide.md](./executionmode-guide.md)**

#### UnregisterFunction ✅ 완료
- [x] **타입**: `() => void`
- [x] **사용법**: 핸들러 정리, 메모리 관리
- [x] **링크**: [`UnregisterFunction.md`](./core/src/type-aliases/UnregisterFunction.md) → **[unregisterfunction-guide.md](./unregisterfunction-guide.md)**

### ⚙️ 함수

#### 실행 함수
##### executeSequential ✅ 완료
- [x] **시그니처**: `(handlers, payload, options) => Promise<ExecutionResult>`
- [x] **사용법**: 우선순위 기반 핸들러 실행
- [x] **링크**: [`executeSequential.md`](./core/src/functions/executeSequential.md) → **[executesequential-guide.md](./executesequential-guide.md)**

##### executeParallel ✅ 완료
- [x] **시그니처**: `(handlers, payload, options) => Promise<ExecutionResult>`
- [x] **사용법**: 동시 핸들러 실행, 성능 최적화
- [x] **링크**: [`executeParallel.md`](./core/src/functions/executeParallel.md) → **[executeparallel-guide.md](./executeparallel-guide.md)**

##### executeRace ✅ 완료
- [x] **시그니처**: `(handlers, payload, options) => Promise<ExecutionResult>`
- [x] **사용법**: 첫 번째 성공 결과, 폴백 패턴
- [x] **링크**: [`executeRace.md`](./core/src/functions/executeRace.md) → **[executerace-guide.md](./executerace-guide.md)**

#### 팩토리 함수
##### createActionHandler ✅ 완료
- [x] **시그니처**: `(handler, config?) => HandlerConfig`
- [x] **사용법**: 타입-세이프 핸들러 생성
- [x] **링크**: [`createActionHandler.md`](./core/src/functions/createActionHandler.md) → **[createactionhandler-guide.md](./createactionhandler-guide.md)**

##### createReactHandlerConfig ✅ 완료
- [x] **시그니처**: `(component, config) => HandlerConfig`
- [x] **사용법**: React 통합, 컴포넌트 생명주기
- [x] **링크**: [`createReactHandlerConfig.md`](./core/src/functions/createReactHandlerConfig.md) → **[createreacthandlerconfig-guide.md](./createreacthandlerconfig-guide.md)**

##### createReactDispatcher ✅ 완료
- [x] **시그니처**: `(register, options?) => ActionDispatcher`
- [x] **사용법**: React에 최적화된 디스패처
- [x] **링크**: [`createReactDispatcher.md`](./core/src/functions/createReactDispatcher.md) → **[createreactdispatcher-guide.md](./createreactdispatcher-guide.md)**

#### 유틸리티
##### isReactActionError ✅ 완료
- [x] **시그니처**: `(error: any) => error is ReactActionError`
- [x] **사용법**: 오류 처리를 위한 타입 가드
- [x] **링크**: [`isReactActionError.md`](./core/src/functions/isReactActionError.md) → **[isreactactionerror-guide.md](./isreactactionerror-guide.md)**

### 🛠️ 변수

#### ReactDevUtils ✅ 완료
- [x] **타입**: 개발 유틸리티 객체
- [x] **사용법**: 디버그 도구, React 개발 패턴
- [x] **링크**: [`ReactDevUtils.md`](./core/src/variables/ReactDevUtils.md) → **[reactdevutils-guide.md](./reactdevutils-guide.md)**

## ⚛️ @context-action/react

### 📚 클래스

#### Store ✅ 완료
- [x] **메서드**: `getValue()`, `setValue()`, `update()`, `subscribe()`, `snapshot()`
- [x] **사용법**: 반응형 상태, 구독, 유효성 검사
- [x] **링크**: [`Store.md`](./react/src/classes/Store.md) → **[store-guide.md](./store-guide.md)**

#### StoreManager ✅ 완료
- [x] **메서드**: `register()`, `getStore()`, `getAllStores()`, `clear()`
- [x] **사용법**: 스토어 레지스트리, 생명주기 관리
- [x] **링크**: [`StoreManager.md`](./react/src/classes/StoreManager.md) → **[storemanager-guide.md](./storemanager-guide.md)**

#### StoreErrorBoundary ✅ 완료
- [x] **속성**: 오류 경계 구성
- [x] **사용법**: 스토어 오류 격리, 복구 전략
- [x] **링크**: [`StoreErrorBoundary.md`](./react/src/classes/StoreErrorBoundary.md) → **[storeerrorboundary-guide.md](./storeerrorboundary-guide.md)**

### 🔌 인터페이스

#### 액션 컨텍스트
##### ActionContextConfig ✅ 완료
- [x] **속성**: 액션 컨텍스트 구성 옵션
- [x] **사용법**: 컨텍스트 사용자 정의, 파이프라인 구성
- [x] **링크**: [`ActionContextConfig.md`](./react/src/interfaces/ActionContextConfig.md) → **[actioncontextconfig-guide.md](./actioncontextconfig-guide.md)**

##### ActionContextType ✅ 완료
- [x] **구조**: 액션 컨텍스트 타입 정의
- [x] **사용법**: 타입-세이프 컨텍스트 유효성 검사
- [x] **링크**: [`ActionContextType.md`](./core/src/interfaces/ActionContextType.md) → **[actioncontexttype-guide.md](./actioncontexttype-guide.md)**

##### ActionContextReturn ✅ 완료
- [x] **속성**: `Provider`, `useActionDispatch`, `useActionHandler` 및 기타 훅
- [x] **사용법**: 훅 구현, 컨텍스트 패턴
- [x] **링크**: [`ActionContextReturn.md`](./react/src/interfaces/ActionContextReturn.md) → **[actioncontextreturn-guide.md](./actioncontextreturn-guide.md)**

#### Ref 컨텍스트
##### RefContextReturn ✅ 완료
- [x] **속성**: Provider, ref 핸들러 훅
- [x] **사용법**: 직접 DOM 조작, 제로 리렌더링
- [x] **링크**: [`RefContextReturn.md`](./react/src/interfaces/RefContextReturn.md) → **[refcontextreturn-guide.md](./refcontextreturn-guide.md)**

##### CreateRefContextOptions ✅ 완료
- [x] **속성**: Ref 컨텍스트 구성
- [x] **사용법**: 성능 튜닝, 컨텍스트 사용자 정의
- [x] **링크**: [`CreateRefContextOptions.md`](./react/src/interfaces/CreateRefContextOptions.md) → **[createrefcontextoptions-guide.md](./createrefcontextoptions-guide.md)**

##### RefTarget ✅ 완료
- [x] **속성**: `target`, `isMounted`, `setRef`
- [x] **사용법**: Ref 관리, 타입-세이프 요소 작업
- [x] **링크**: [`RefTarget.md`](./react/src/interfaces/RefTarget.md) → **[reftarget-guide.md](./reftarget-guide.md)**

##### RefOperationResult ✅ 완료
- [x] **구조**: 작업 결과 상태 및 데이터
- [x] **사용법**: 작업 결과 처리, 오류 관리
- [x] **링크**: [`RefOperationResult.md`](./react/src/interfaces/RefOperationResult.md) → **[refoperationresult-guide.md](./refoperationresult-guide.md)**

##### RefOperationOptions ✅ 완료
- [x] **속성**: 작업 구성 옵션
- [x] **사용법**: 작업 사용자 정의
- [x] **링크**: [`RefOperationOptions.md`](./react/src/interfaces/RefOperationOptions.md) → **[refoperationoptions-guide.md](./refoperationoptions-guide.md)**

#### 스토어 인터페이스
##### StoreErrorBoundaryProps ✅ 완료
- [x] **속성**: 오류 경계 구성
- [x] **사용법**: 오류 경계 설정, 스토어 오류 처리
- [x] **링크**: [`StoreErrorBoundaryProps.md`](./react/src/interfaces/StoreErrorBoundaryProps.md) → **[storeerrorboundaryprops-guide.md](./storeerrorboundaryprops-guide.md)**

##### Snapshot ✅ 완료
- [x] **구조**: 스토어 스냅샷 데이터 구조
- [x] **사용법**: 상태 디버깅, 롤백 기능
- [x] **링크**: [`Snapshot.md`](./react/src/interfaces/Snapshot.md) → **[snapshot-guide.md](./snapshot-guide.md)**

##### IStore ✅ 완료
- [x] **메서드**: 스토어 인터페이스 계약 메서드
- [x] **사용법**: 스토어 구현 계약, 사용자 정의 스토어
- [x] **링크**: [`IStore.md`](./react/src/interfaces/IStore.md) → **[istore-guide.md](./istore-guide.md)**

##### StoreConfig ✅ 완료
- [x] **속성**: `name`, `initialValue`, `registry`, `autoRegister`
- [x] **사용법**: 스토어 초기화, 유효성 검사, 성능 튜닝
- [x] **링크**: [`StoreConfig.md`](./react/src/interfaces/StoreConfig.md) → **[storeconfig-guide.md](./storeconfig-guide.md)**

### 🏷️ 타입 별칭

#### InitialStores ✅ 완료
- [x] **구조**: 스토어 정의 매핑 타입
- [x] **사용법**: 스토어 컨텍스트 생성, 타입 추론
- [x] **링크**: [`InitialStores.md`](./react/src/type-aliases/InitialStores.md) → **[initialstores-guide.md](./initialstores-guide.md)**

### ⚙️ 함수

#### 컨텍스트 생성 (주요 패턴)
##### createActionContext ✅ 완료
- [x] **시그니처**: `<T>(name: string, config?) => ActionContextReturn<T>`
- [x] **사용법**: 액션 전용 패턴, 비즈니스 로직 분리
- [x] **링크**: [`createActionContext.md`](./react/src/functions/createActionContext.md) → **[createactioncontext-guide.md](./createactioncontext-guide.md)**

##### createStoreContext ✅ 완료
- [x] **시그니처**: `(name, stores) => StoreContextReturn` (2개 오버로드)
- [x] **사용법**: 스토어 전용 패턴, 타입 추론, HOC 패턴
- [x] **링크**: [`createStoreContext.md`](./react/src/functions/createStoreContext.md) → **[createstorecontext-guide.md](./createstorecontext-guide.md)**

##### createRefContext ✅ 완료
- [x] **시그니처**: `<T>(name: string, options?) => RefContextReturn<T>`
- [x] **사용법**: RefContext 패턴, 제로 리렌더링, DOM 조작
- [x] **링크**: [`createRefContext.md`](./react/src/functions/createRefContext.md) → **[createrefcontext-guide.md](./createrefcontext-guide.md)**

#### 스토어 함수
##### createStore ✅ 완료
- [x] **시그니처**: `<T>(config: StoreConfig<T>) => Store<T>`
- [x] **사용법**: 수동 스토어 생성, 사용자 정의 구현
- [x] **링크**: [`createStore.md`](./react/src/functions/createStore.md) → **[createstore-guide.md](./createstore-guide.md)**

##### useStoreValue ✅ 완료
- [x] **시그니처**: `<T>(store: Store<T>) => T`
- [x] **사용법**: 반응형 구독, 컴포넌트 데이터 바인딩
- [x] **링크**: [`useStoreValue.md`](./react/src/functions/useStoreValue.md) → **[usestorevalue-guide.md](./usestorevalue-guide.md)**

##### useStoreSelector ✅ 완료
- [x] **시그니처**: `<T, R>(store: Store<T>, selector: (value: T) => R) => R`
- [x] **사용법**: 선택적 구독, 성능 최적화
- [x] **링크**: [`useStoreSelector.md`](./react/src/functions/useStoreSelector.md) → **[usestoreselector-guide.md](./usestoreselector-guide.md)**

## 📝 문서 템플릿

### 핵심 구조
1. **함수/인터페이스 목적** - 한 줄 설명
2. **시그니처/구조** - 타입 시그니처 또는 인터페이스 구조
3. **사용 패턴** - 일반적인 구현 패턴
4. **TypeDoc 링크** - 생성된 문서로 직접 연결

### 우선순위 수준
- **높음**: 핵심 패턴 (ActionRegister, createStoreContext, useStoreValue)
- **중간**: 고급 기능 (실행 모드, 구성)
- **낮음**: 유틸리티 및 디버그 도구

## 📊 진행 상황 추적

### 코어 패키지: 20개 항목
- [x] 클래스: 2개 항목
- [x] 인터페이스: 7개 항목
- [x] 타입: 3개 항목
- [x] 함수: 7개 항목
- [x] 변수: 1개 항목

### React 패키지: 22개 항목
- [x] 클래스: 3개 항목
- [x] 인터페이스: 12개 항목
- [x] 타입: 1개 항목
- [x] 함수: 6개 항목

### 총계: 42/42 완료 (100%)

## ✅ 완료된 가이드 (42/42)

### 코어 패키지 (20/20)
- [x] **ActionRegister** → [actionregister-guide.md](./actionregister-guide.md)
- [x] **ActionPayloadMap** → [actionpayloadmap-guide.md](./actionpayloadmap-guide.md) 
- [x] **PipelineController** → [pipelinecontroller-guide.md](./pipelinecontroller-guide.md)
- [x] **ActionHandler** → [actionhandler-guide.md](./actionhandler-guide.md)
- [x] **HandlerConfig** → [handlerconfig-guide.md](./handlerconfig-guide.md)
- [x] **ActionRegisterConfig** → [actionregisterconfig-guide.md](./actionregisterconfig-guide.md)
- [x] **ExecutionMode** → [executionmode-guide.md](./executionmode-guide.md)
- [x] **ReactActionError** → [reactactionerror-guide.md](./reactactionerror-guide.md)
- [x] **DispatchOptions** → [dispatchoptions-guide.md](./dispatchoptions-guide.md)
- [x] **ExecutionResult** → [executionresult-guide.md](./executionresult-guide.md)
- [x] **ActionDispatcher** → [actiondispatcher-guide.md](./actiondispatcher-guide.md)
- [x] **UnregisterFunction** → [unregisterfunction-guide.md](./unregisterfunction-guide.md)
- [x] **createReactHandlerConfig** → [createreacthandlerconfig-guide.md](./createreacthandlerconfig-guide.md)
- [x] **createReactDispatcher** → [createreactdispatcher-guide.md](./createreactdispatcher-guide.md)
- [x] **executeSequential** → [executesequential-guide.md](./executesequential-guide.md)
- [x] **executeParallel** → [executeparallel-guide.md](./executeparallel-guide.md)
- [x] **executeRace** → [executerace-guide.md](./executerace-guide.md)
- [x] **createActionHandler** → [createactionhandler-guide.md](./createactionhandler-guide.md)
- [x] **isReactActionError** → [isreactactionerror-guide.md](./isreactactionerror-guide.md)
- [x] **ReactDevUtils** → [reactdevutils-guide.md](./reactdevutils-guide.md)

### React 패키지 (22/22)
- [x] **Store** → [store-guide.md](./store-guide.md)
- [x] **createActionContext** → [createactioncontext-guide.md](./createactioncontext-guide.md)
- [x] **createStoreContext** → [createstorecontext-guide.md](./createstorecontext-guide.md)
- [x] **useStoreValue** → [usestorevalue-guide.md](./usestorevalue-guide.md)
- [x] **StoreManager** → [storemanager-guide.md](./storemanager-guide.md)
- [x] **ActionContextReturn** → [actioncontextreturn-guide.md](./actioncontextreturn-guide.md)
- [x] **StoreConfig** → [storeconfig-guide.md](./storeconfig-guide.md)
- [x] **StoreErrorBoundary** → [storeerrorboundary-guide.md](./storeerrorboundary-guide.md)
- [x] **ActionContextConfig** → [actioncontextconfig-guide.md](./actioncontextconfig-guide.md)
- [x] **ActionContextType** → [actioncontexttype-guide.md](./actioncontexttype-guide.md)
- [x] **RefContextReturn** → [refcontextreturn-guide.md](./refcontextreturn-guide.md)
- [x] **CreateRefContextOptions** → [createrefcontextoptions-guide.md](./createrefcontextoptions-guide.md)
- [x] **RefTarget** → [reftarget-guide.md](./reftarget-guide.md)
- [x] **RefOperationResult** → [refoperationresult-guide.md](./refoperationresult-guide.md)
- [x] **RefOperationOptions** → [refoperationoptions-guide.md](./refoperationoptions-guide.md)
- [x] **StoreErrorBoundaryProps** → [storeerrorboundaryprops-guide.md](./storeerrorboundaryprops-guide.md)
- [x] **Snapshot** → [snapshot-guide.md](./snapshot-guide.md)
- [x] **IStore** → [istore-guide.md](./istore-guide.md)
- [x] **InitialStores** → [initialstores-guide.md](./initialstores-guide.md)
- [x] **createRefContext** → [createrefcontext-guide.md](./createrefcontext-guide.md)
- [x] **createStore** → [createstore-guide.md](./createstore-guide.md)
- [x] **useStoreSelector** → [usestoreselector-guide.md](./usestoreselector-guide.md)

## 🎯 다음 우선순위 대상

### 중간 우선순위 React
