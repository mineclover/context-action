# @context-action/core API 참조

코어 TypeScript 액션 파이프라인 패키지에 대한 완전한 참조입니다.

## 📋 패키지 개요

**@context-action/core**는 프레임워크에 구애받지 않는 액션 처리 및 비즈니스 로직 관리를 위해 설계된 의존성이 없는 순수 TypeScript 액션 파이프라인 시스템입니다.

### 주요 기능
- ✅ 순수 TypeScript (React 의존성 없음)
- ✅ 외부 의존성 없음  
- ✅ 타입-세이프 액션 디스패치
- ✅ 우선순위 기반 핸들러 실행
- ✅ 고급 오류 처리
- ✅ 다중 실행 모드

## 📚 클래스

### ActionRegister
**파일**: [`ActionRegister.md`](./core/src/classes/ActionRegister.md)  
**목적**: 핵심 액션 파이프라인 관리 및 실행

**주요 기능**:
- 액션 핸들러 등록 및 관리
- 우선순위 기반 실행 순서 지정
- 다중 실행 모드 (순차, 병렬, 레이스)
- 파이프라인 제어 및 중단 지원
- 결과 집계 및 오류 처리

**사용 컨텍스트**:
- 중앙 액션 처리 허브
- 비즈니스 로직 조정
- 모듈 간 통신
- 이벤트 처리 시스템

### ReactActionError
**파일**: [`ReactActionError.md`](./core/src/classes/ReactActionError.md)  
**목적**: 액션별 오류 처리 및 컨텍스트 보존

**주요 기능**:
- 액션 인식 오류 정보
- 스택 추적 보존
- 컨텍스트 데이터 첨부
- React별 오류 패턴

**사용 컨텍스트**:
- 액션 핸들러 오류 처리
- 파이프라인 오류 복구
- 개발 디버깅
- 오류 보고 시스템

## 🔌 인터페이스

### 코어 액션 인터페이스

#### ActionPayloadMap
**파일**: [`ActionPayloadMap.md`](./core/src/interfaces/ActionPayloadMap.md)  
**목적**: 타입-세이프 액션 페이로드 정의

**사용 컨텍스트**:
- 액션 타입 정의
- 페이로드 타입 유효성 검사
- TypeScript 엄격 모드 준수
- 인터페이스 확장 패턴

#### ActionDispatcher
**파일**: [`ActionDispatcher.md`](./core/src/interfaces/ActionDispatcher.md)  
**목적**: 액션 디스패치 인터페이스 계약

**사용 컨텍스트**:
- 디스패처 구현
- 액션 호출 패턴
- 타입-세이프 디스패치 작업
- 프레임워크 통합

### 파이프라인 제어 인터페이스

#### PipelineController
**파일**: [`PipelineController.md`](./core/src/interfaces/PipelineController.md)  
**목적**: 액션 실행 제어 및 파이프라인 관리

**주요 기능**:
- 실행 중단 기능
- 파이프라인 상태 관리  
- 오류 처리 제어
- 결과 수집

**사용 컨텍스트**:
- 핸들러 구현
- 파이프라인 제어 패턴
- 오류 처리 전략
- 실행 흐름 관리

#### HandlerConfig
**파일**: [`HandlerConfig.md`](./core/src/interfaces/HandlerConfig.md)  
**목적**: 핸들러 등록 구성

**주요 기능**:
- 우선순위 할당
- 실행 옵션
- 핸들러 메타데이터
- 등록 매개변수

**사용 컨텍스트**:
- 핸들러 등록
- 우선순위 관리
- 실행 사용자 정의
- 핸들러 구성

### 구성 인터페이스

#### ActionRegisterConfig
**파일**: [`ActionRegisterConfig.md`](./core/src/interfaces/ActionRegisterConfig.md)  
**목적**: ActionRegister 구성 옵션

**사용 컨텍스트**:
- ActionRegister 초기화
- 파이프라인 동작 사용자 정의
- 성능 튜닝
- 디버그 모드 설정

#### DispatchOptions
**파일**: [`DispatchOptions.md`](./core/src/interfaces/DispatchOptions.md)  
**목적**: 액션 디스패치 구성

**사용 컨텍스트**:
- 동적 디스패치 동작
- 액션별 구성
- 실행 모드 재정의
- 결과 처리 옵션

### 결과 인터페이스

#### ExecutionResult
**파일**: [`ExecutionResult.md`](./core/src/interfaces/ExecutionResult.md)  
**목적**: 액션 실행 결과 구조

**주요 기능**:
- 성공/실패 상태
- 결과 데이터 수집
- 오류 정보
- 실행 메타데이터

**사용 컨텍스트**:
- 결과 처리
- 오류 처리
- 파이프라인 모니터링
- 성공 확인

## 🏷️ 타입 별칭

### ActionHandler
**파일**: [`ActionHandler.md`](./core/src/type-aliases/ActionHandler.md)  
**목적**: 액션 핸들러 함수 타입 정의

**사용 컨텍스트**:
- 핸들러 구현
- 타입-세이프 핸들러 생성
- 핸들러 등록
- 비즈니스 로직 함수

### ExecutionMode
**파일**: [`ExecutionMode.md`](./core/src/type-aliases/ExecutionMode.md)  
**목적**: 액션 실행 모드 타입

**사용 가능한 모드**:
- `sequential` - 순차 핸들러 실행
- `parallel` - 병렬 핸들러 실행  
- `race` - 레이스 기반 실행

**사용 컨텍스트**:
- 실행 전략 선택
- 성능 최적화
- 핸들러 조정
- 파이프라인 구성

### UnregisterFunction
**파일**: [`UnregisterFunction.md`](./core/src/type-aliases/UnregisterFunction.md)  
**목적**: 핸들러 정리 함수 타입

**사용 컨텍스트**:
- 핸들러 정리
- 메모리 관리
- 등록 생명주기
- 리소스 폐기

## ⚙️ 함수

### 실행 함수

#### executeSequential
**파일**: [`executeSequential.md`](./core/src/functions/executeSequential.md)  
**목적**: 우선순위 순서 지정을 통한 순차 핸들러 실행

**사용 컨텍스트**:
- 순서 지정된 실행 요구 사항
- 의존성 인식 처리
- 단계별 워크플로우
- 기본 실행 모드

#### executeParallel  
**파일**: [`executeParallel.md`](./core/src/functions/executeParallel.md)  
**목적**: 성능을 위한 병렬 핸들러 실행

**사용 컨텍스트**:
- 독립적인 핸들러 실행
- 성능 최적화
- 동시 처리
- I/O 집약적 작업

#### executeRace
**파일**: [`executeRace.md`](./core/src/functions/executeRace.md)  
**목적**: 레이스 기반 실행 (첫 번째 성공 결과)

**사용 컨텍스트**:
- 대체 전략 실행
- 가장 빠른 응답 시나리오
- 폴백 패턴 구현
- 타임아웃 처리

### 팩토리 함수

#### createActionHandler
**파일**: [`createActionHandler.md`](./core/src/functions/createActionHandler.md)  
**목적**: 타입-세이프 액션 핸들러 생성

**사용 컨텍스트**:
- 핸들러 생성 유틸리티
- 타입 안전성 강제
- 핸들러 팩토리 패턴
- 비즈니스 로직 캡슐화

#### createReactHandlerConfig
**파일**: [`createReactHandlerConfig.md`](./core/src/functions/createReactHandlerConfig.md)  
**목적**: React별 핸들러 구성 생성

**사용 컨텍스트**:
- React 통합 패턴
- 컴포넌트 인식 구성
- React 생명주기 통합
- 훅 기반 핸들러 설정

#### createReactDispatcher
**파일**: [`createReactDispatcher.md`](./core/src/functions/createReactDispatcher.md)  
**목적**: React에 최적화된 디스패처 생성

**사용 컨텍스트**:
- React 컴포넌트 통합
- 훅 기반 디스패치
- React 컨텍스트 패턴
- 컴포넌트 통신

### 유틸리티 함수

#### isReactActionError
**파일**: [`isReactActionError.md`](./core/src/functions/isReactActionError.md)  
**목적**: ReactActionError 감지를 위한 타입 가드

**사용 컨텍스트**:
- 오류 타입 검사
- 오류 처리 분기
- 타입-세이프 오류 처리
- 디버그 정보 추출

## 🛠️ 변수

### ReactDevUtils
**파일**: [`ReactDevUtils.md`](./core/src/variables/ReactDevUtils.md)  
**목적**: React 통합을 위한 개발 유틸리티

**사용 컨텍스트**:
- 개발 디버깅
- 성능 모니터링
- React 통합 도우미
- 개발 전용 기능

## 📖 카테고리별 사용 패턴

### 1. 기본 액션 파이프라인 설정
**주요 API**:
- [`ActionRegister`](./core/src/classes/ActionRegister.md) - 파이프라인 생성
- [`ActionHandler`](./core/src/type-aliases/ActionHandler.md) - 핸들러 정의
- [`HandlerConfig`](./core/src/interfaces/HandlerConfig.md) - 핸들러 등록

```typescript
// 예제 패턴 참조
const register = new ActionRegister();
register.registerHandler('actionType', handler, { priority: 100 });
```

### 2. 고급 실행 제어
**주요 API**:
- [`PipelineController`](./core/src/interfaces/PipelineController.md) - 실행 제어
- [`ExecutionMode`](./core/src/type-aliases/ExecutionMode.md) - 모드 선택
- [`DispatchOptions`](./core/src/interfaces/DispatchOptions.md) - 동적 옵션

```typescript
// 파이프라인 제어 패턴 참조
controller.abort('Custom cancellation reason');
dispatch('action', payload, { mode: 'parallel' });
```

### 3. 오류 처리 패턴
**주요 API**:
- [`ReactActionError`](./core/src/classes/ReactActionError.md) - 오류 생성
- [`isReactActionError`](./core/src/functions/isReactActionError.md) - 타입 검사
- [`ExecutionResult`](./core/src/interfaces/ExecutionResult.md) - 결과 처리

```typescript
// 오류 처리 패턴 참조
if (isReactActionError(error)) {
  // 액션별 오류 처리
}
```

### 4. 타입 안전성 패턴
**주요 API**:
- [`ActionPayloadMap`](./core/src/interfaces/ActionPayloadMap.md) - 타입 정의
- [`ActionDispatcher`](./core/src/interfaces/ActionDispatcher.md) - 디스패처 타입
- 엄격한 타이핑을 위한 모든 함수 및 인터페이스 타입

## 🎯 문서 우선순위 가이드

### 높은 우선순위 (코어 사용)
1. [`ActionRegister`](./core/src/classes/ActionRegister.md) - 가장 중요한 클래스
2. [`ActionHandler`](./core/src/type-aliases/ActionHandler.md) - 필수 타입
3. [`PipelineController`](./core/src/interfaces/PipelineController.md) - 제어 인터페이스
4. [`HandlerConfig`](./core/src/interfaces/HandlerConfig.md) - 구성

### 중간 우선순위 (고급 기능)
1. [`ExecutionMode`](./core/src/type-aliases/ExecutionMode.md) - 실행 옵션
2. [`executeSequential`](./core/src/functions/executeSequential.md) - 기본 실행
3. [`executeParallel`](./core/src/functions/executeParallel.md) - 성능 최적화
4. [`ReactActionError`](./core/src/classes/ReactActionError.md) - 오류 처리

### 낮은 우선순위 (유틸리티 및 고급)
1. [`ReactDevUtils`](./core/src/variables/ReactDevUtils.md) - 개발 전용
2. [`executeRace`](./core/src/functions/executeRace.md) - 특수 실행
3. 팩토리 함수 - 고급 패턴
4. 유틸리티 함수 - 엣지 케이스

## 🔗 관련 문서

- **React 통합**: [React API 참조](./react-api-reference.md)
- **전체 인덱스**: [API 참조 인덱스](./api-reference-index.md)
- **사용 예제**: [코어 예제](/en/examples/)
- **아키텍처 가이드**: [아키텍처 개요](/en/concept/architecture-guide.md)

---

*이 참조는 @context-action/core 패키지에 대해 TypeDoc으로 생성된 모든 문서를 다룹니다. 각 링크된 파일에는 상세한 API 사양, 매개변수, 반환 타입 및 사용 예제가 포함되어 있습니다.*