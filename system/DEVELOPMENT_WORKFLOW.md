# Development Workflow

Context-Action 프레임워크의 체계적 개발 워크플로우입니다.

## 🏗️ 개발 워크플로우 개요

```
📋 시스템 구조 설계 → 📚 용어집 명세 → 🔗 용어 연결 → 💻 API 구현 → 📖 문서화 → 🧪 예시/테스트
        ↓                 ↓              ↓           ↓            ↓            ↓
   architecture.md    glossary/terms/   JSDoc      packages/    docs/api/   example/
```

## 📋 1단계: 시스템 구조 설계

### 기준 문서
- **위치**: `docs/ko/guide/architecture.md`
- **목적**: 전체 시스템 아키텍처와 핵심 개념 정의
- **내용**: MVVM 패턴, Action Pipeline, Store 통합 등

### 설계 원칙
- **관심사 분리**: Actions (ViewModel) ↔ Stores (Model) ↔ Components (View)
- **중앙집중식 파이프라인**: Action 등록 및 처리 시스템
- **Store 통합 패턴**: 느슨한 결합을 통한 상태 관리

### 산출물
```markdown
## 핵심 아키텍처

### 1. Action Pipeline 시스템
- Action들은 dispatched 이벤트를 처리하는 중앙 파이프라인에 등록
- 비즈니스 로직의 중앙화와 관리

### 2. Store 통합 패턴  
- Action 핸들러의 상태 읽기/쓰기 패턴
- 크로스 스토어 조정과 일관성 보장
```

## 📚 2단계: 용어집 명세

### 마스터 용어집 작성
- **위치**: `glossary/terms/`
- **언어**: 영어 (기준)
- **특징**: 추상적, 구현 중립적 정의

### 용어 추출 과정
1. **아키텍처 문서 분석**: `architecture.md`에서 핵심 개념 식별
2. **용어 정의**: 각 개념의 추상적, 기술적 정의 작성
3. **카테고리 분류**: core-concepts, architecture-terms, api-terms 등
4. **관계 설정**: 용어 간 연관관계 정의

### 예시: 아키텍처 → 용어집 매핑
```
architecture.md                    glossary/terms/
─────────────────                  ──────────────────
"Action Pipeline 시스템"        →  ## Action Pipeline System
"Store 통합 패턴"               →  ## Store Integration Pattern  
"비즈니스 로직 처리"             →  ## Action Handler
"상태 관리"                     →  ## Store Registry
```

### 용어 정의 형식
```markdown
## Action Pipeline System

**Definition**: The central orchestration system that processes dispatched actions through a series of registered handlers in priority order.

**Usage Context**:
- Core framework functionality
- Business logic execution
- Event-driven architecture implementation

**Key Characteristics**:
- Priority-based handler execution
- Type-safe action dispatch with payload validation
- Pipeline flow control (abort, continue, modify)

**Related Terms**: [Action Handler](#action-handler), [Pipeline Controller](#pipeline-controller)
```

## 🔗 3단계: 용어-구현 연결

### JSDoc 태그를 통한 매핑
- **기준**: 마스터 용어집의 영어 kebab-case 용어명
- **방법**: `@implements` 태그 사용
- **목적**: 추상적 개념과 구체적 구현의 연결

### 매핑 컨벤션
```typescript
/**
 * Action handler interface for business logic processing
 * @implements action-handler          // 용어집 연결
 * @memberof core-concepts            // 카테고리 지정
 * @example
 * const handler = (payload, controller) => {
 *   // Business logic implementation
 * };
 * @since 1.0.0                       // 버전 정보
 */
interface ActionHandler<T> {
  // 구현 내용
}
```

### 연결 검증
```bash
# 용어집 시스템으로 매핑 상태 확인
pnpm glossary:update

# 구현 현황 대시보드 확인
cat glossary/implementations/dashboard.md
```

## 💻 4단계: API 구현

### 구현 위치
- **패키지**: `packages/*/src/`
- **구조**: 모노레포 구조로 도메인별 분리
- **예시**: `@context-action/core`, `@context-action/react`

### 구현 과정
1. **타입 정의**: `types.ts`에서 인터페이스 정의
2. **핵심 로직**: 비즈니스 로직과 상태 관리 구현
3. **통합 API**: 사용자 친화적 API 제공
4. **JSDoc 태그**: 용어집과 연결

### 구현 예시
```typescript
// packages/core/src/ActionRegister.ts
/**
 * Central action registration and dispatch system
 * @implements action-pipeline-system
 * @implements actionregister  
 * @memberof core-concepts
 * @since 1.0.0
 */
export class ActionRegister<T extends ActionPayloadMap> {
  /**
   * Register action handler with pipeline
   * @implements action-handler
   */
  register<K extends keyof T>(
    actionName: K,
    handler: ActionHandler<T[K]>,
    config?: HandlerConfig
  ): UnregisterFunction {
    // 구현 로직
  }

  /**
   * Dispatch action through pipeline
   * @implements action-dispatcher
   */
  async dispatch<K extends keyof T>(
    actionName: K,
    payload: T[K]
  ): Promise<void> {
    // 디스패치 로직
  }
}
```

## 📖 5단계: API 문서화

### API 참조 문서
- **위치**: `docs/api/`
- **목적**: 구현된 API의 상세 스펙 문서화
- **특징**: 기술적, 완전한 API 레퍼런스

### 문서 구조
```
docs/api/
├── core/
│   ├── ActionRegister.md       # 클래스별 상세 API
│   ├── ActionHandler.md        # 인터페이스 설명
│   └── types.md               # 타입 정의 모음
├── react/
│   ├── hooks.md               # React 훅 API
│   └── components.md          # 컴포넌트 API
└── index.md                   # API 전체 개요
```

### API 문서 형식
```markdown
# ActionRegister

액션 등록 및 디스패치를 관리하는 중앙 클래스입니다.

## 생성자

### `new ActionRegister<T>()`

## 메서드

### `register<K>(actionName, handler, config?)`

액션 핸들러를 파이프라인에 등록합니다.

**Parameters:**
- `actionName: K` - 등록할 액션명
- `handler: ActionHandler<T[K]>` - 액션 핸들러 함수
- `config?: HandlerConfig` - 핸들러 설정 옵션

**Returns:** `UnregisterFunction` - 핸들러 등록 해제 함수

**Example:**
```typescript
const unregister = actionRegister.register('updateUser', 
  async (payload, controller) => {
    // 비즈니스 로직
  }
);
```
```

## 📚 6단계: 사용 가이드 문서화

### 사용 가이드 문서
- **위치**: `docs/example/`
- **목적**: 실용적 사용법과 패턴 가이드
- **특징**: 사용자 친화적, 예시 중심

### 가이드 구조
```
docs/example/
├── getting-started/
│   ├── installation.md        # 설치 및 설정
│   ├── basic-usage.md         # 기본 사용법
│   └── first-action.md        # 첫 번째 액션 만들기
├── patterns/
│   ├── store-integration.md   # 스토어 통합 패턴
│   ├── async-actions.md       # 비동기 액션 처리
│   └── error-handling.md      # 에러 처리 패턴
├── recipes/
│   ├── user-management.md     # 사용자 관리 예시
│   ├── shopping-cart.md       # 쇼핑 카트 구현
│   └── form-handling.md       # 폼 처리 패턴
└── advanced/
    ├── custom-middleware.md   # 커스텀 미들웨어
    ├── testing.md            # 테스팅 가이드
    └── performance.md        # 성능 최적화
```

### 가이드 문서 형식
```markdown
# Store 통합 패턴

액션 핸들러에서 여러 스토어를 조정하는 패턴입니다.

## 기본 패턴

```typescript
// 사용자 정보 업데이트 시 여러 스토어 조정
actionRegister.register('updateUser', async (payload, controller) => {
  // 1. 현재 상태 읽기
  const user = userStore.getValue();
  const settings = settingsStore.getValue();
  
  // 2. 비즈니스 로직 실행
  const updatedUser = {
    ...user,
    ...payload,
    lastModified: Date.now()
  };
  
  // 3. 여러 스토어 업데이트
  userStore.setValue(updatedUser);
  activityStore.update(activities => [...activities, {
    type: 'user_updated',
    userId: payload.id,
    timestamp: Date.now()
  }]);
});
```

## 고급 패턴

### 조건부 업데이트
...

### 에러 처리
...
```

## 🧪 7단계: 예시 및 테스트 구현

### 실제 구현 예시
- **위치**: `example/`
- **목적**: 실제 동작하는 예시 + 통합 테스트
- **특징**: 실용적, 검증 가능

### 예시 구조
```
example/
├── src/
│   ├── stores/               # 예시 스토어들
│   │   ├── userStore.ts
│   │   ├── cartStore.ts
│   │   └── index.ts
│   ├── actions/              # 예시 액션들
│   │   ├── userActions.ts
│   │   ├── cartActions.ts
│   │   └── index.ts
│   ├── components/           # React 컴포넌트들
│   │   ├── UserProfile.tsx
│   │   ├── ShoppingCart.tsx
│   │   └── index.ts
│   ├── hooks/               # 커스텀 훅들
│   │   ├── useActionHandler.ts
│   │   └── useStoreValue.ts
│   └── App.tsx              # 메인 앱
├── tests/                   # 통합 테스트
│   ├── actions.test.ts
│   ├── stores.test.ts
│   └── integration.test.ts
└── README.md               # 예시 실행 가이드
```

### 테스트와 검증
```typescript
// example/src/actions/userActions.ts
/**
 * User management actions with store integration
 * @implements action-handler
 * @memberof core-concepts
 */
export const setupUserActions = (actionRegister: ActionRegister<AppActions>) => {
  actionRegister.register('updateUser', async (payload, controller) => {
    const user = userStore.getValue();
    const updatedUser = { ...user, ...payload };
    userStore.setValue(updatedUser);
  });
};

// example/tests/actions.test.ts
describe('User Actions', () => {
  it('should update user with store integration', async () => {
    // 액션 테스트 및 검증
  });
});
```

## 🔄 품질 관리 워크플로우

### 자동화된 검증
```bash
# 1. 용어집 일관성 검증
pnpm glossary:update

# 2. 타입 체크
pnpm type-check

# 3. 테스트 실행
pnpm test

# 4. 문서 빌드 검증
pnpm docs:build
```

### 문서 동기화 확인
1. **아키텍처 변경** → 용어집 업데이트 필요성 검토
2. **용어집 변경** → JSDoc 태그와 일치성 확인
3. **API 변경** → API 문서와 사용 가이드 업데이트
4. **예시 업데이트** → 문서와 실제 코드 일치성 확인

## 🎯 워크플로우 체크리스트

### ✅ 새 기능 개발 시
- [ ] `architecture.md`에서 개념적 설계 확인/업데이트
- [ ] `glossary/terms/`에 관련 용어 정의 추가/수정
- [ ] 구현 시 적절한 JSDoc `@implements` 태그 추가
- [ ] `packages/`에서 API 구현
- [ ] `docs/api/`에 API 참조 문서 작성
- [ ] `docs/example/`에 사용 가이드 작성
- [ ] `example/`에 동작하는 예시 구현
- [ ] `pnpm glossary:update`로 용어집 동기화 검증

### ✅ 문서 업데이트 시
- [ ] 마스터 용어집 우선 업데이트
- [ ] 구현체의 JSDoc 태그 일치성 확인
- [ ] API 문서와 실제 구현 일치성 검증
- [ ] 사용 가이드의 예시 코드 동작 확인
- [ ] 용어집 대시보드에서 구현 현황 검토

## 🚀 효과 및 이점

### 개발 효율성
- **체계적 접근**: 설계 → 명세 → 구현 → 문서화의 명확한 단계
- **일관성 보장**: 용어집 시스템을 통한 개념-구현 일치
- **자동화된 검증**: 문서와 코드의 동기화 상태 추적

### 품질 보장
- **추적 가능성**: 모든 구현의 개념적 근거 명확화
- **완전성**: 용어집 대시보드를 통한 구현 완성도 추적
- **일관성**: 단일 소스에서 파생된 일관된 문서화

### 팀 협업
- **명확한 소통**: 공통 용어집을 통한 개념 공유
- **역할 분담**: 설계자, 개발자, 문서 작성자의 명확한 워크플로우
- **품질 관리**: 각 단계별 검증 포인트와 체크리스트

---

*이 워크플로우는 Context-Action 프레임워크의 체계적이고 일관된 개발을 위한 포괄적 프로세스입니다.*