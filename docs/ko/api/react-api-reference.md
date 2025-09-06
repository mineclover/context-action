# @context-action/react API 참조

MVVM 아키텍처를 지원하는 React 통합 패키지에 대한 완전한 참조입니다.

## 📋 패키지 개요

**@context-action/react**는 Context-Action 프레임워크를 위한 React 통합을 제공하며, Action-Only, Store-Only, RefContext의 세 가지 주요 패턴으로 MVVM 아키텍처를 가능하게 합니다.

### 주요 기능
- ✅ Context API를 통한 완벽한 React 통합
- ✅ 반응형 구독을 통한 타입-세이프 스토어 관리
- ✅ 파이프라인 통합을 통한 액션 컨텍스트
- ✅ RefContext를 통한 직접 DOM 조작
- ✅ MVVM 아키텍처 지원
- ✅ HOC 패턴 및 사용자 정의 훅

### 의존성
- React (피어 의존성)
- @context-action/core

## 📚 클래스

### Store
**파일**: [`Store.md`](./react/src/classes/Store.md)  
**목적**: 구독 관리를 통한 반응형 스토어 구현

**주요 기능**:
- 반응형 값 저장 및 업데이트
- 구독 관리 및 알림
- 유효성 검사 및 오류 처리
- 성능 최적화 전략
- 스냅샷 및 롤백 지원

**사용 컨텍스트**:
- 개별 스토어 인스턴스
- 상태 관리 코어
- 반응형 데이터 컨테이너
- 컴포넌트 데이터 바인딩

### StoreManager  
**파일**: [`StoreManager.md`](./react/src/classes/StoreManager.md)  
**목적**: 스토어 레지스트리 및 생명주기 관리

**주요 기능**:
- 스토어 등록 및 검색
- 스토어 생명주기 관리
- 레지스트리 격리 지원
- 스토어 정리 및 재설정
- 스토어 정보 집계

**사용 컨텍스트**:
- 스토어 컨텍스트 구현
- 스토어 레지스트리 관리
- 다중 스토어 조정
- 스토어 생명주기 제어

### StoreErrorBoundary
**파일**: [`StoreErrorBoundary.md`](./react/src/classes/StoreErrorBoundary.md)  
**목적**: 스토어 관련 오류를 위한 React 오류 경계

**주요 기능**:
- 스토어 오류 격리
- 오류 복구 전략
- 오류 보고 및 로깅
- 컴포넌트 트리 보호

**사용 컨텍스트**:
- 스토어 오류 처리
- 오류 경계 구현
- 스토어 안전 패턴
- 개발 디버깅

## 🔌 인터페이스

### 액션 컨텍스트 인터페이스

#### ActionContextConfig
**파일**: [`ActionContextConfig.md`](./react/src/interfaces/ActionContextConfig.md)  
**목적**: 액션 컨텍스트 생성 구성

**사용 컨텍스트**:
- 액션 컨텍스트 사용자 정의
- 파이프라인 구성
- 액션 등록 옵션
- 컨텍스트 동작 설정

#### ActionContextType
**파일**: [`ActionContextType.md`](./react/src/interfaces/ActionContextType.md)  
**목적**: 액션 컨텍스트 타입 정의 및 구조

**사용 컨텍스트**:
- 컨텍스트 타입 유효성 검사
- 타입-세이프 컨텍스트 사용
- 액션 컨텍스트 계약
- 인터페이스 정의 패턴

#### ActionContextReturn
**파일**: [`ActionContextReturn.md`](./react/src/interfaces/ActionContextReturn.md)  
**목적**: 액션 컨텍스트 생성의 반환 타입

**주요 기능**:
- Provider 컴포넌트
- 액션 디스패치 훅
- 액션 핸들러 훅  
- 컨텍스트 관리 유틸리티

**사용 컨텍스트**:
- 액션 컨텍스트 생성
- 훅 타입 정의
- Provider 패턴 구현
- 컨텍스트 API 구조

### Ref 컨텍스트 인터페이스

#### RefContextReturn
**파일**: [`RefContextReturn.md`](./react/src/interfaces/RefContextReturn.md)  
**목적**: Ref 컨텍스트 생성의 반환 타입

**주요 기능**:
- Provider 컴포넌트
- Ref 핸들러 훅
- Ref 작업 유틸리티
- 컨텍스트 관리 도구

**사용 컨텍스트**:
- Ref 컨텍스트 생성
- 직접 DOM 조작
- 성능 최적화
- 제로 리렌더링 패턴

#### CreateRefContextOptions
**파일**: [`CreateRefContextOptions.md`](./react/src/interfaces/CreateRefContextOptions.md)  
**목적**: Ref 컨텍스트 생성 옵션

**사용 컨텍스트**:
- Ref 컨텍스트 사용자 정의
- 성능 튜닝 옵션
- 디버깅 구성
- 컨텍스트 동작 제어

#### RefTarget
**파일**: [`RefTarget.md`](./react/src/interfaces/RefTarget.md)  
**목적**: DOM 요소 관리를 위한 Ref 대상 인터페이스

**주요 기능**:
- 대상 요소 접근
- 마운트 상태 추적
- 타입-세이프 요소 작업
- 생명주기 관리

**사용 컨텍스트**:
- 직접 DOM 조작
- 요소 생명주기 추적
- 타입-세이프 Ref 작업
- 성능에 중요한 UI

#### RefOperationResult
**파일**: [`RefOperationResult.md`](./react/src/interfaces/RefOperationResult.md)  
**목적**: Ref 작업의 결과 구조

**사용 컨텍스트**:
- 작업 결과 처리
- Ref 작업의 오류 추적
- 성공/실패 상태
- 작업 메타데이터

#### RefOperationOptions
**파일**: [`RefOperationOptions.md`](./react/src/interfaces/RefOperationOptions.md)  
**목적**: Ref 작업 구성 옵션

**사용 컨텍스트**:
- 작업 사용자 정의
- 타임아웃 구성
- 오류 처리 옵션
- 작업 동작 제어

### 스토어 인터페이스

#### StoreErrorBoundaryProps
**파일**: [`StoreErrorBoundaryProps.md`](./react/src/interfaces/StoreErrorBoundaryProps.md)  
**목적**: StoreErrorBoundary 컴포넌트의 Props 인터페이스

**사용 컨텍스트**:
- 오류 경계 구성
- 오류 처리 사용자 정의
- 폴백 UI 지정
- 오류 복구 옵션

#### Snapshot
**파일**: [`Snapshot.md`](./react/src/interfaces/Snapshot.md)  
**목적**: 상태 캡처를 위한 스토어 스냅샷 인터페이스

**주요 기능**:
- 특정 시점의 상태 캡처
- 롤백 기능
- 상태 비교 유틸리티
- 디버그 정보

**사용 컨텍스트**:
- 상태 디버깅
- 실행 취소/다시 실행 기능
- 상태 기록 추적
- 개발 도구

#### IStore
**파일**: [`IStore.md`](./react/src/interfaces/IStore.md)  
**목적**: 스토어 인터페이스 정의 및 계약

**사용 컨텍스트**:
- 스토어 구현 계약
- 타입-세이프 스토어 작업
- 스토어 인터페이스 준수
- 사용자 정의 스토어 구현

#### StoreConfig
**파일**: [`StoreConfig.md`](./react/src/interfaces/StoreConfig.md)  
**목적**: 스토어 구성 옵션

**주요 기능**:
- 초기 값 지정
- 유효성 검사 구성
- 업데이트 전략
- 성능 옵션

**사용 컨텍스트**:
- 스토어 초기화
- 스토어 동작 사용자 정의
- 유효성 검사 설정
- 성능 튜닝

## 🏷️ 타입 별칭

### InitialStores
**파일**: [`InitialStores.md`](./react/src/type-aliases/InitialStores.md)  
**목적**: 초기 스토어 구성에 대한 타입 정의

**사용 컨텍스트**:
- 스토어 컨텍스트 생성
- 타입 추론 패턴
- 스토어 정의 구조
- 구성 타입 안전성

## ⚙️ 함수

### 컨텍스트 생성 함수

#### createActionContext
**파일**: [`createActionContext.md`](./react/src/functions/createActionContext.md)  
**목적**: 순수 액션 디스패치를 위한 액션 전용 컨텍스트 생성

**주요 기능**:
- 타입-세이프 액션 디스패치
- 액션 핸들러 등록
- 액션 파이프라인 통합
- 컨텍스트 프로바이더 생성

**사용 컨텍스트**:
- 액션 전용 패턴 구현
- 비즈니스 로직 분리
- 이벤트 시스템 생성
- 명령 패턴 구현

**패턴 타입**: **주요 패턴** - Action-Only

#### createStoreContext
**파일**: [`createStoreContext.md`](./react/src/functions/createStoreContext.md)  
**목적**: 상태 관리를 위한 스토어 전용 컨텍스트 생성

**주요 기능**:
- 타입-세이프 스토어 관리
- 반응형 구독
- 스토어 생명주기 관리
- HOC 패턴 지원

**사용 컨텍스트**:
- 스토어 전용 패턴 구현
- 상태 관리 계층
- 데이터 영속성
- 반응형 데이터 흐름

**패턴 타입**: **주요 패턴** - Store-Only

#### createRefContext
**파일**: [`createRefContext.md`](./react/src/functions/createRefContext.md)  
**목적**: 직접 DOM 조작을 위한 Ref 컨텍스트 생성

**주요 기능**:
- React 리렌더링 없음
- 직접 DOM 접근
- 타입-세이프 Ref 관리
- 성능 최적화

**사용 컨텍스트**:
- 고성능 UI
- 애니메이션 시스템
- 직접 DOM 조작
- 실시간 상호 작용

**패턴 타입**: **주요 패턴** - RefContext

### 스토어 함수

#### createStore
**파일**: [`createStore.md`](./react/src/functions/createStore.md)  
**목적**: 개별 스토어 인스턴스 생성

**사용 컨텍스트**:
- 수동 스토어 생성
- 사용자 정의 스토어 구현
- 스토어 조합 패턴
- 고급 스토어 구성

#### useStoreValue
**파일**: [`useStoreValue.md`](./react/src/functions/useStoreValue.md)  
**목적**: 자동 리렌더링을 통한 스토어 값 구독

**주요 기능**:
- 반응형 구독
- 자동 컴포넌트 업데이트
- 타입-세이프 값 접근
- 성능 최적화

**사용 컨텍스트**:
- 스토어 값 구독
- 컴포넌트 데이터 바인딩
- 반응형 UI 업데이트
- 상태 소비 패턴

#### useStoreSelector
**파일**: [`useStoreSelector.md`](./react/src/functions/useStoreSelector.md)  
**목적**: 메모이제이션을 통한 스토어 값의 특정 부분 선택

**주요 기능**:
- 선택적 구독
- 메모이제이션된 셀렉터
- 성능 최적화
- 파생 상태 패턴

**사용 컨텍스트**:
- 성능 최적화
- 선택적 업데이트
- 파생 상태 계산
- 복잡한 상태 선택

## 📖 카테고리별 사용 패턴

### 1. Action-Only 패턴
**주요 API**:
- [`createActionContext`](./react/src/functions/createActionContext.md) - 패턴 생성
- [`ActionContextReturn`](./react/src/interfaces/ActionContextReturn.md) - 사용 가능한 훅
- [`ActionContextConfig`](./react/src/interfaces/ActionContextConfig.md) - 구성

**사용 컨텍스트**:
- 이벤트 시스템
- 명령 패턴  
- 비즈니스 로직 분리
- 사이드 이펙트 관리

**주요 이점**:
- 경량 (스토어 오버헤드 없음)
- 타입-세이프 액션 디스패치
- 파이프라인 통합
- 메모리 관리

### 2. Store-Only 패턴
**주요 API**:
- [`createStoreContext`](./react/src/functions/createStoreContext.md) - 패턴 생성
- [`useStoreValue`](./react/src/functions/useStoreValue.md) - 값 구독
- [`StoreManager`](./react/src/classes/StoreManager.md) - 스토어 관리

**사용 컨텍스트**:
- 순수 상태 관리
- 데이터 계층
- 간단한 상태 요구 사항
- 반응형 데이터 흐름

**주요 이점**:
- 뛰어난 타입 추론
- 간소화된 API
- 직접 값 지원
- HOC 패턴

### 3. RefContext 패턴
**주요 API**:
- [`createRefContext`](./react/src/functions/createRefContext.md) - 패턴 생성
- [`RefContextReturn`](./react/src/interfaces/RefContextReturn.md) - 사용 가능한 훅
- [`RefTarget`](./react/src/interfaces/RefTarget.md) - Ref 관리

**사용 컨텍스트**:
- 고성능 UI
- 직접 DOM 조작
- 애니메이션 시스템
- 실시간 상호 작용

**주요 이점**:
- React 리렌더링 없음
- 하드웨어 가속 변환
- 타입-세이프 Ref 관리
- 자동 정리

### 4. 스토어 시스템 심층 분석
**코어 클래스**:
- [`Store`](./react/src/classes/Store.md) - 개별 스토어 구현
- [`StoreManager`](./react/src/classes/StoreManager.md) - 레지스트리 관리
- [`StoreErrorBoundary`](./react/src/classes/StoreErrorBoundary.md) - 오류 처리

**구성**:
- [`StoreConfig`](./react/src/interfaces/StoreConfig.md) - 스토어 구성
- [`InitialStores`](./react/src/type-aliases/InitialStores.md) - 스토어 정의
- [`Snapshot`](./react/src/interfaces/Snapshot.md) - 상태 스냅샷

**훅**:
- [`useStoreValue`](./react/src/functions/useStoreValue.md) - 반응형 구독
- [`useStoreSelector`](./react/src/functions/useStoreSelector.md) - 선택적 구독

### 5. 오류 처리 패턴
**주요 API**:
- [`StoreErrorBoundary`](./react/src/classes/StoreErrorBoundary.md) - React 오류 경계
- [`StoreErrorBoundaryProps`](./react/src/interfaces/StoreErrorBoundaryProps.md) - 구성
- 코어 [`ReactActionError`](./core/src/classes/ReactActionError.md)와 통합

## 🎯 패턴 통합 가이드

### 패턴 조합
세 가지 패턴은 복잡한 애플리케이션을 위해 결합될 수 있습니다.

```typescript
// 패턴 조합 참조
<ActionProvider>      {/* ViewModel 계층 */}
  <StoreProvider>     {/* Model 계층 */}
    <RefProvider>     {/* 직접 DOM 계층 */}
      <Component />   {/* View 계층 */}
    </RefProvider>
  </StoreProvider>
</ActionProvider>
```

### MVVM 아키텍처 통합
- **모델 계층**: [`createStoreContext`](./react/src/functions/createStoreContext.md)를 사용한 Store-Only 패턴
- **뷰모델 계층**: [`createActionContext`](./react/src/functions/createActionContext.md)를 사용한 Action-Only 패턴
- **뷰 계층**: 성능에 중요한 부분에 RefContext를 사용하는 React 컴포넌트

### 패턴 간 통신
- **액션 → 스토어**: 액션은 핸들러 로직을 통해 스토어를 업데이트
- **스토어 → 뷰**: 컴포넌트는 [`useStoreValue`](./react/src/functions/useStoreValue.md)를 통해 구독
- **RefContext → 모두**: 다른 패턴에 영향을 주지 않는 직접 DOM 조작

## 🎯 문서 우선순위 가이드

### 높은 우선순위 (코어 사용)
1. [`createStoreContext`](./react/src/functions/createStoreContext.md) - 가장 많이 사용되는 패턴
2. [`createActionContext`](./react/src/functions/createActionContext.md) - 액션 패턴
3. [`useStoreValue`](./react/src/functions/useStoreValue.md) - 필수 훅
4. [`Store`](./react/src/classes/Store.md) - 코어 스토어 클래스

### 중간 우선순위 (고급 기능)
1. [`createRefContext`](./react/src/functions/createRefContext.md) - 성능 패턴
2. [`StoreManager`](./react/src/classes/StoreManager.md) - 스토어 관리
3. [`useStoreSelector`](./react/src/functions/useStoreSelector.md) - 성능 훅
4. [`ActionContextReturn`](./react/src/interfaces/ActionContextReturn.md) - 훅 타입

### 낮은 우선순위 (특수 기능)
1. [`StoreErrorBoundary`](./react/src/classes/StoreErrorBoundary.md) - 오류 처리
2. [`Snapshot`](./react/src/interfaces/Snapshot.md) - 디버그 유틸리티
3. [`RefOperationResult`](./react/src/interfaces/RefOperationResult.md) - 고급 Ref 작업
4. 구성 인터페이스 - 엣지 케이스

## 🔗 관련 문서

- **코어 패키지**: [코어 API 참조](./core-api-reference.md)
- **전체 인덱스**: [API 참조 인덱스](./api-reference-index.md)
- **패턴 가이드**: [패턴 문서](/en/concept/pattern-guide.md)
- **아키텍처**: [MVVM 아키텍처](/en/concept/mvvm-core-architecture.md)
- **예제**: [React 예제](/en/examples/)

---

*이 참조는 @context-action/react 패키지에 대해 TypeDoc으로 생성된 모든 문서를 다룹니다. 각 링크된 파일에는 상세한 API 사양, 매개변수, 반환 타입 및 사용 예제가 포함되어 있습니다.*