# Context-Action 가이드

Context-Action 종합 가이드에 오신 것을 환영합니다! 이 문서는 Context-Action 프레임워크를 효과적으로 이해하고 구현하는 데 도움을 드립니다.

## 📚 목차

### 시작하기
- [**시작하기**](./getting-started.md) - 빠른 시작 가이드 및 설치
- [**첫 번째 Action**](../examples/first-action.md) - 첫 Action 구현

### 핵심 아키텍처
- [**🏗️ 아키텍처 개요**](./architecture.md) - **NEW** 구현 패턴을 포함한 종합 아키텍처 가이드
- [**🎯 MVVM 아키텍처**](./mvvm-architecture.md) - MVVM 패턴 구현에 대한 심화 학습

### Action 시스템
- [**⚡ Action Pipeline**](./action-pipeline.md) - Action 실행 시스템 이해
- [**⚙️ 핸들러 구성**](./handler-configuration.md) - Action 핸들러와 미들웨어 구성

### Store 통합
- [**📦 Store 통합**](./store-integration.md) - 고급 store 통합 패턴

### 모범 사례 및 고급 주제
- [**✅ 모범 사례**](./best-practices.md) - 개발 모범 사례 및 가이드라인
- [**🚀 고급 패턴**](./advanced.md) - 고급 사용 패턴 및 기법

## 🎯 빠른 탐색

### 경험 수준별

#### 🆕 초보자
Context-Action을 처음 사용하는 경우 여기서 시작하세요:
1. [시작하기](./getting-started.md)
2. [첫 번째 Action](../examples/first-action.md)
3. [아키텍처 개요](./architecture.md)
4. [MVVM 아키텍처](./mvvm-architecture.md)

#### 🏃‍♂️ 중급자  
기본을 이해하고 더 많이 배우고 싶은 경우:
1. [Store 통합](./store-integration.md)
2. [Action Pipeline](./action-pipeline.md)
3. [데이터 흐름 패턴](./data-flow-patterns.md)

#### 🧙‍♂️ 고급자
복잡한 패턴과 최적화를 할 준비가 된 경우:
1. [고급 패턴](./advanced.md)
2. [핸들러 구성](./handler-configuration.md)
3. [모범 사례](./best-practices.md)
4. [성능 최적화](./best-practices.md#성능-고려사항)

### 사용 사례별

#### 🎨 UI 컴포넌트 구축
- [MVVM 아키텍처 - View 레이어](./mvvm-architecture.md#1-🎨-view-layer-react-components)
- [컴포넌트 통합 패턴](./mvvm-architecture.md#component-integration-patterns)
- [React 통합 예제](../examples/react/)

#### ⚡ 비즈니스 로직 관리
- [Action Pipeline 시스템](./architecture.md#1-action-pipeline-시스템)
- [Action 핸들러 모범 사례](./mvvm-architecture.md#action-handler-responsibilities)
- [크로스 스토어 조정](./architecture.md#1-크로스-스토어-조정)

#### 📦 상태 관리
- [Store 통합 패턴](./store-integration.md)
- [다중 Store 작업](./architecture.md#1-크로스-스토어-조정)
- [Action에서 계산된 값](./architecture.md#2-action에서-계산된-값)

#### 🧪 테스트 및 품질
- [테스트 전략](./best-practices.md#테스트-전략)
- [오류 처리 패턴](./architecture.md#3-상태-업데이트를-사용한-비동기-작업)
- [성능 고려사항](./mvvm-architecture.md#성능-고려사항)

## 🔗 외부 자료

### API 문서
- [Core API 참조](../api/core/) - Core 패키지 API 문서
- [React API 참조](../api/react/) - React 통합 API
- [TypeScript 타입](../api/core/types.md) - 타입 정의 및 인터페이스

### 예제 및 튜토리얼
- [기본 설정](../examples/basic-setup.md) - 기본 프로젝트 설정
- [React 예제](../examples/react/) - React 특화 예제
- [서비스 예제](../examples/services/) - 실제 서비스 구현

### 관련 패키지
- [@context-action/core](../packages/core.md) - 핵심 action pipeline 시스템
- [@context-action/react](../packages/react.md) - React 통합 훅 및 프로바이더
- [@context-action/jotai](../packages/jotai.md) - Jotai 상태 관리 통합

## 🤝 기여하기

문제를 발견했거나 문서를 개선하고 싶으시나요? 
- [이슈 보고](https://github.com/context-action/context-action/issues)
- [문서 기여](https://github.com/context-action/context-action/tree/main/docs)

## 📖 읽기 가이드

### 권장 읽기 순서

1. **기초** (모든 사용자 필수)
   - [시작하기](./getting-started.md)
   - [아키텍처 개요](./architecture.md)

2. **아키텍처 이해** (필수)
   - [MVVM 아키텍처](./mvvm-architecture.md)

3. **구현 세부사항** (활발한 개발용)
   - [Store 통합](./store-integration.md)
   - [Action Pipeline](./action-pipeline.md)

4. **숙련** (최적화 및 고급 사용)
   - [모범 사례](./best-practices.md)
   - [고급 패턴](./advanced.md)

### 빠른 참조 카드

#### 필수 훅
```typescript
// Action 디스패치
const dispatch = useActionDispatch<MyActions>();

// Store 값 구독  
const value = useStoreValue(myStore);

// Store 레지스트리 접근
const registry = useStoreRegistry();
```

#### Action 핸들러 패턴
```typescript
actionRegister.register('actionName', async (payload, controller) => {
  // 1. 현재 상태 가져오기
  const state = someStore.getValue();
  
  // 2. 비즈니스 로직
  const result = processBusinessLogic(payload, state);
  
  // 3. Store 업데이트
  someStore.setValue(result);
}, { priority: 10, blocking: true });
```

#### 컴포넌트 패턴
```typescript
function MyComponent() {
  const dispatch = useActionDispatch();
  const data = useStoreValue(dataStore);
  
  const handleAction = () => {
    dispatch('actionName', payload);
  };
  
  return <div onClick={handleAction}>{data.value}</div>;
}
```

---

Context-Action으로 즐거운 코딩하세요! 🚀