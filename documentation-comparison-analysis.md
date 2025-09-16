# Context-Action Documentation Comparison Analysis

방금 정리한 핵심 원칙들과 기존 문서들을 비교 분석한 결과입니다.

## 📊 비교 결과 요약

### ✅ 잘 문서화된 내용들

#### 1. **Context 분리 기준**
- **기존 문서**: `architecture-guide.md`에 명확히 정의됨
  - Domain-Based Context Architecture (Business, UI, Validation, Design, Architecture)
  - Document-Based Context Design (Design Documentation → Design Context)
- **내가 정리한 내용**: 기존 문서와 완전히 일치 ✅

#### 2. **MVVM 아키텍처**
- **기존 문서**: `conventions.md`에 매우 상세히 설명됨
  - Model Layer (Context declarations)
  - ViewModel Layer (Hook-based injection)
  - Business Logic Layer (Action handlers)
  - View Layer (Pure components consuming ViewModels)
- **내가 정리한 내용**: 기존 문서가 훨씬 더 상세함

#### 3. **Store 업데이트 패턴**
- **기존 문서**: `conventions.md`에 Immer 기반 업데이트 규칙 상세 설명
  - 3-Step Process: Read → Business Logic → Update
  - Forbidden patterns와 해결책
- **내가 정리한 내용**: 기존 문서가 더 완성도 높음

#### 4. **Handler 등록 베스트 프랙티스**
- **기존 문서**: `conventions.md`에 memoization, ID 전략 등 상세 설명
- **내가 정리한 내용**: 기본적인 내용만 다룸

## 🚨 문서화 Gap 발견!

### 1. **가장 중요한 Gap: 단방향 의존성 원칙**

**현재 상황**:
- **내가 정리한 핵심 원칙**: "상위 컨텍스트는 하위 컨텍스트를 모르고, 하위가 상위 데이터를 활용"
- **기존 문서 상태**: 이 핵심 원칙이 **명시적으로 문서화되지 않음**

**발견된 내용**:
```typescript
// architecture-guide.md에 암시적으로만 언급됨
- **Cross-Context Coordination**: Controlled communication between domain contexts
- **Domain Isolation**: Each context maintains its own handler registry

// 하지만 구체적인 데이터 흐름 방향은 설명 없음
```

### 2. **Props 사용 원칙 미비**

**현재 상황**:
- **내가 정리한 원칙**: "Props는 극단적으로 쓰지 않는 게 좋다. Context-Action 영역에서는 안 쓰는 게 맞다"
- **기존 문서 상태**: 구체적인 Props 사용 가이드라인 부족

**발견된 내용**:
```typescript
// conventions.md에 Shared Layer에서만 언급
// ✅ Shared Layer - Pure view components
Button.tsx // Pure button with explicit props

// 하지만 언제 Props를 써야 하고 안 써야 하는지 명확한 기준 없음
```

### 3. **Cross-Context 데이터 흐름 패턴 부족**

**현재 상황**:
- **내가 정리한 패턴**: 하위 컨텍스트에서 상위 컨텍스트 데이터 활용하는 구체적인 코드 예시
- **기존 문서 상태**: Provider 계층 구조는 있지만 실제 데이터 활용 패턴 부족

## 📋 구체적인 문서 개선 제안

### 1. **architecture-guide.md에 추가 필요한 섹션**

```markdown
## Context Dependency Direction Rules

### Single-Direction Dependency Principle
- **Upper contexts MUST NOT know about lower contexts**
- **Lower contexts CAN consume upper context data**
- **Data flows from upper to lower, never reverse**

### Cross-Context Data Usage Pattern
```typescript
// Lower context consuming upper context data
function PaymentHandlers() {
  const userStore = useUserStore('profile');    // Upper context data
  const authStore = useAuthStore('session');    // Upper context data
  const paymentStore = usePaymentStore('card'); // Current context data

  const processPaymentHandler = useCallback(async (payload) => {
    const user = userStore.getValue();      // Use upper context data
    const session = authStore.getValue();   // Use upper context data
    // Process payment with combined data
  }, [userStore, authStore, paymentStore]);
}
```

### 2. **conventions.md에 추가 필요한 섹션**

```markdown
## Props Usage Guidelines

### When NOT to use Props (Context-Action Domain)
- ❌ Passing business logic data through props
- ❌ Store references or action dispatchers as props
- ❌ Any data that can be managed by Context-Action

### When Props are Acceptable
- ✅ Design system components (Button, Card, etc.)
- ✅ Pure view components with explicit interfaces
- ✅ External library integration where Context-Action cannot be used

### Cross-Context Communication Rules
- 하위 컨텍스트에서 상위 컨텍스트 데이터 활용 방법
- Provider 계층 구조와 데이터 흐름 방향
```

## 🎯 액션 플랜

### 1. 즉시 개선 가능한 문서들
- `architecture-guide.md`: 단방향 의존성 원칙 섹션 추가
- `conventions.md`: Props 사용 가이드라인 섹션 추가

### 2. 새로 필요한 문서
- `cross-context-patterns.md`: 컨텍스트 간 데이터 흐름 패턴 전용 문서
- `dependency-direction-guide.md`: 의존성 방향 규칙 상세 가이드

### 3. 기존 문서 활용
- `conventions.md`의 MVVM 섹션은 이미 매우 완성도 높음
- `architecture-guide.md`의 Context 분리 기준도 잘 정리됨
- 이 부분들은 그대로 활용하고 Gap만 채우면 됨

## 💡 결론

**기존 문서들의 품질은 매우 높음**. 특히 MVVM 패턴, Store 업데이트 규칙, Handler 등록 등은 매우 상세하고 실용적으로 문서화되어 있음.

**하지만 핵심 원칙 중 가장 중요한 "단방향 의존성"과 "Props 사용 원칙"이 명시적으로 문서화되지 않은 것이 가장 큰 Gap**.

이 두 가지를 추가로 문서화하면 Context-Action 프레임워크의 핵심 철학이 완전히 문서화될 것임.