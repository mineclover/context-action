# Context-Action Framework 구현 계획서

> **현재 상태**: 13/37 용어 구현 완료 (35% 구현률)  
> **목표**: 90% 이상 구현률 달성  
> **예상 기간**: 6-8주  

## 📊 현재 상황 분석

### ✅ 구현 완료된 핵심 컴포넌트 (13개 용어)

#### 🎯 Core Concepts (9개 구현됨)
- **ActionRegister** (`action-pipeline-system`, `actionregister`): 클래스 전체 구현 완료
- **ActionPayloadMap** (`action-payload-map`): 타입 정의 완료  
- **PipelineController** (`pipeline-controller`): 인터페이스 정의 완료
- **ActionHandler** (`action-handler`): 타입 정의 완료
- **HandlerConfig** (`handler-configuration`): 설정 인터페이스 완료
- **Store** (`store-integration-pattern`, `model-layer`): 클래스 구현 완료
- **StoreRegistry** (`store-registry`): 클래스 구현 완료

#### 🔌 API Terms (3개 구현됨)  
- **useActionDispatch** (`action-dispatcher`): 훅 구현 완료
- **ActionDispatcher** (`action-dispatcher`): 인터페이스 정의 완료
- **PipelineContext** (`pipeline-context`): 인터페이스 정의 완료
- **useStoreValues** (`selective-subscription`): 선택적 구독 훅 완료

#### 🏗️ Architecture Terms (1개 구현됨)
- **createActionContext** (`view-layer`): React Context 생성 함수 완료

#### 📝 Naming Conventions (0개 구현됨)
- 모든 네이밍 규칙 용어 미구현

### ❌ 미구현 우선순위 용어 (24개)

#### 🎯 Core Concepts (17개 미구현)
- `storeprovider` - StoreProvider 컴포넌트 
- `actionprovider` - ActionProvider 컴포넌트 
- `store-hooks` - Store 관련 훅들
- `cross-store-coordination` - 스토어 간 조정
- `computed-store` - 계산된 스토어

#### 🏗️ Architecture Terms (16개 미구현)
- `mvvm-pattern` - MVVM 패턴 구현
- `viewmodel-layer` - ViewModel 레이어
- `decoupled-architecture` - 분리된 아키텍처
- `unidirectional-data-flow` - 단방향 데이터 플로우
- `lazy-evaluation` - 지연 평가
- `type-safety` - 타입 안전성
- `business-logic` - 비즈니스 로직
- `async-operations` - 비동기 작업

#### 🔌 API Terms (13개 미구현)  
- `priority-based-execution` - 우선순위 기반 실행
- `actionprovider` - ActionProvider (중복)
- `storeprovider` - StoreProvider (중복)
- `store-hooks` - Store 훅들 (중복)

#### 📝 Naming Conventions (7개 미구현)
- `class-naming` - 클래스 네이밍 규칙
- `interface-naming` - 인터페이스 네이밍 규칙  
- `function-naming` - 함수 네이밍 규칙
- `constant-naming` - 상수 네이밍 규칙
- `file-naming` - 파일 네이밍 규칙
- `directory-structure` - 디렉토리 구조
- `variable-naming` - 변수 네이밍 규칙

#### ⚠️ 특별 사항
- **selective-subscription**: 이미 구현되었지만 용어집에 정의되지 않음 (용어집 추가 필요)
- **action-handler**: 부분 구현 (타입만 정의됨, 실제 핸들러 예제 필요)
- **actionregister**: 부분 구현 (클래스만 구현됨, 메서드별 태그 필요)

---

## ⚡ 즉시 시작 가능한 작업들 (2.5시간)

> 기존 구현에 JSDoc 태그만 추가하면 되는 빠른 성과 작업들

### 🏃‍♂️ Phase 0: 기존 구현 태그 추가 (당일 완료 가능)

#### 1. ActionProvider 태그 추가 (30분)
**파일**: `packages/react/src/ActionProvider.tsx`
```typescript
/**
 * React context provider for action system
 * @implements actionprovider
 * @memberof api-terms
 */
export function ActionProvider({ children, config }: ActionProviderProps) {
```

#### 2. StoreProvider 태그 추가 (30분)  
**파일**: `packages/react/src/StoreProvider.tsx`
```typescript
/**
 * React context provider for store system
 * @implements storeprovider
 * @memberof api-terms
 */
export function StoreProvider({ children }: StoreProviderProps) {
```

#### 3. useStoreValue 태그 추가 (30분)
**파일**: `packages/react/src/store/hooks/useStoreValue.ts`
```typescript
/**
 * Hook to get current value from store  
 * @implements store-hooks
 * @memberof api-terms
 */
export function useStoreValue<T, R = T>(
```

#### 4. useComputedStore 태그 추가 (30분)
**파일**: `packages/react/src/store/hooks/useComputedStore.ts`
```typescript
/**
 * Hook for creating computed stores with dependencies
 * @implements computed-store  
 * @memberof api-terms
 */
export function useComputedStore<T, D extends readonly IStore[]>(
```

#### 5. selective-subscription 용어집 정의 추가 (30분)
**파일**: `glossary/terms/api-terms.md`에 새 섹션 추가

**즉시 효과**: 35% → 48% 구현률 (13개 → 18개 용어)

---

## 🎯 Phase 1: 핵심 기능 완성 (2-3주)

### Priority 1: ✅ ActionRegister 이미 구현 완료 

**현재 상태**: ActionRegister 클래스는 이미 완전히 구현되어 있음
- ✅ `action-pipeline-system` 태그 완료
- ✅ `actionregister` 태그 완료  
- ✅ JSDoc 예제 코드 완료

**⏭️ 다음 우선순위로 이동**: StoreProvider 및 ActionProvider 구현

### Priority 1: ActionProvider 태그 추가

**목표**: 기존에 구현된 ActionProvider에 JSDoc 태그 추가

**구현 파일**: `packages/react/src/ActionProvider.tsx` (기존 파일)

```typescript
/**
 * React context provider for action system  
 * @implements actionprovider
 * @memberof api-terms
 * @example
 * ```typescript
 * function App() {
 *   return (
 *     <ActionProvider config={{ logLevel: LogLevel.DEBUG }}>
 *       <MainApp />
 *     </ActionProvider>
 *   );
 * }
 * ```
 */
export function ActionProvider({ children, config }: ActionProviderProps) {
  // 기존 구현에 태그만 추가
}
```

**예상 소요**: 30분 (기존 구현에 태그만 추가)

### Priority 2: StoreProvider 태그 추가

**목표**: 기존에 구현된 StoreProvider에 JSDoc 태그 추가

**구현 파일**: `packages/react/src/StoreProvider.tsx` (기존 파일)

```typescript
/**
 * React context provider for store system
 * @implements storeprovider  
 * @memberof api-terms
 * @example
 * ```typescript
 * function App() {
 *   return (
 *     <StoreProvider>
 *       <ActionProvider config={{ logLevel: LogLevel.DEBUG }}>
 *         <MainApp />
 *       </ActionProvider>
 *     </StoreProvider>
 *   );
 * }
 * ```
 */
export function StoreProvider({ children }: StoreProviderProps) {
  // 기존 구현에 태그만 추가
}
```

**예상 소요**: 30분 (기존 구현에 태그만 추가)

### Priority 3: Store Hooks 태그 추가

**목표**: 기존 Store 관련 훅들에 JSDoc 태그 추가

**구현 파일들**:

#### useStoreValue.ts (일부 완료)
```typescript
/**
 * Hook to get current value from store
 * @implements store-hooks
 * @memberof api-terms  
 * @example
 * ```typescript
 * const user = useStoreValue(userStore);
 * const userName = useStoreValue(userStore, user => user.name);
 * ```
 */
export function useStoreValue<T, R = T>(
  store: IStore<T> | undefined | null,
  selector?: (value: T) => R
): R | undefined
```

#### useComputedStore.ts
```typescript
/**
 * Hook for creating computed stores with dependencies
 * @implements computed-store
 * @memberof api-terms
 * @example
 * ```typescript
 * const userFullName = useComputedStore(
 *   [userStore, settingsStore],
 *   ([user, settings]) => `${user.firstName} ${user.lastName}`
 * );
 * ```
 */
export function useComputedStore<T, D extends readonly IStore[]>(
  dependencies: D,
  computeFn: (values: StoreValues<D>) => T
): IStore<T>
```

**예상 소요**: 1시간 (기존 구현에 태그만 추가)

---

## 🏗️ Phase 2: MVVM 아키텍처 구현 (2-3주)

### Priority 1: MVVM Pattern 기반 구조 확립

**목표**: MVVM 패턴을 명확히 구현하고 문서화

**구현 대상**:

#### ViewModel Layer
**새 파일**: `packages/react/src/viewmodel/BaseViewModel.ts`

```typescript
/**
 * Base class for ViewModel layer in MVVM pattern
 * @implements viewmodel-layer
 * @implements mvvm-pattern
 * @memberof architecture-terms
 * @example
 * ```typescript
 * class UserViewModel extends BaseViewModel {
 *   constructor(private userStore: IStore<User>) {
 *     super();
 *   }
 * 
 *   get user() {
 *     return this.userStore.get();
 *   }
 * 
 *   updateUser = (updates: Partial<User>) => {
 *     this.dispatch('updateUser', updates);
 *   }
 * }
 * ```
 */
export abstract class BaseViewModel {
  // 구현 내용
}
```

#### Model Layer 확장
**파일**: `packages/react/src/store/Store.ts`

```typescript
/**
 * Enhanced Store implementation representing Model layer
 * @implements model-layer
 * @implements unidirectional-data-flow
 * @implements lazy-evaluation
 * @memberof architecture-terms
 */
export class Store<T = any> implements IStore<T> {
  // 기존 구현에 태그 추가
}
```

#### View Layer 확장
**파일**: `packages/react/src/components/index.ts`

```typescript
/**
 * View layer components with MVVM integration
 * @implements view-layer
 * @implements decoupled-architecture
 * @memberof architecture-terms
 */
```

**예상 소요**: 1주

### Priority 2: Business Logic 분리

**목표**: 비즈니스 로직을 별도 레이어로 분리

**새 파일**: `packages/core/src/business/BusinessLogicHandler.ts`

```typescript
/**
 * Handler for business logic execution
 * @implements business-logic
 * @memberof core-concepts
 * @example
 * ```typescript
 * const businessHandler = new BusinessLogicHandler();
 * 
 * businessHandler.register('validateUser', async (user) => {
 *   if (!user.email) throw new Error('Email required');
 *   if (!user.name) throw new Error('Name required');
 *   return { ...user, validated: true };
 * });
 * ```
 */
export class BusinessLogicHandler {
  // 구현 내용
}
```

**예상 소요**: 3일

---

## 🔌 Phase 3: API 및 고급 기능 (1-2주)

### Priority 1: Computed Store 시스템

**목표**: 계산된 스토어 기능 완성

**파일**: `packages/react/src/store/hooks/useComputedStore.ts`

```typescript
/**
 * Hook for creating computed stores with dependencies
 * @implements computed-store
 * @memberof api-terms
 * @example
 * ```typescript
 * const userFullName = useComputedStore(
 *   [userStore, settingsStore],
 *   ([user, settings]) => {
 *     const format = settings.nameFormat || 'first-last';
 *     return format === 'last-first' 
 *       ? `${user.lastName}, ${user.firstName}`
 *       : `${user.firstName} ${user.lastName}`;
 *   }
 * );
 * ```
 */
export function useComputedStore<T, D extends readonly IStore[]>(
  dependencies: D,
  computeFn: (values: StoreValues<D>) => T,
  options?: ComputedStoreOptions
): IStore<T>
```

**예상 소요**: 2일

### Priority 2: 비동기 작업 관리

**목표**: 비동기 작업에 대한 체계적 관리

**새 파일**: `packages/core/src/async/AsyncOperationManager.ts`

```typescript
/**
 * Manager for async operations with cancellation and retry
 * @implements async-operations
 * @memberof api-terms
 * @example
 * ```typescript
 * const asyncManager = new AsyncOperationManager();
 * 
 * const result = await asyncManager.execute('fetchUser', async () => {
 *   const response = await fetch('/api/user');
 *   return response.json();
 * }, {
 *   timeout: 5000,
 *   retries: 3,
 *   cancellable: true
 * });
 * ```
 */
export class AsyncOperationManager {
  // 구현 내용
}
```

**예상 소요**: 3일

### Priority 3: 우선순위 기반 실행 시스템 강화

**목표**: Priority-based execution 로직 개선

**파일**: `packages/core/src/ActionRegister.ts`

```typescript
/**
 * Enhanced priority-based execution system
 * @implements priority-based-execution
 * @memberof api-terms
 */
private async executePipeline<K extends keyof T>(
  action: K,
  payload: T[K],
  context: PipelineContext<T[K]>
): Promise<void> {
  // 구현 개선
}
```

**예상 소요**: 2일

---

## 📝 Phase 4: 네이밍 규칙 및 문서화 (1주)

### Priority 1: 네이밍 규칙 문서화

**목표**: 프로젝트 전반의 네이밍 규칙을 JSDoc으로 문서화

**구현 대상**:

#### 클래스 네이밍
**파일**: `packages/core/src/ActionRegister.ts`

```typescript
/**
 * Central action registration and dispatch system
 * @implements class-naming
 * @memberof naming-conventions
 * @example
 * // ✅ 올바른 클래스 명명: PascalCase + 명확한 목적
 * class ActionRegister extends BaseRegister { }
 * class StoreRegistry implements IRegistry { }
 * class CrossStoreCoordinator { }
 * 
 * // ❌ 잘못된 명명
 * class actionreg { }  // camelCase 사용
 * class AR { }         // 축약어만 사용
 * class Thing { }      // 모호한 이름
 */
export class ActionRegister<T extends ActionPayloadMap = ActionPayloadMap> {
```

#### 인터페이스 네이밍
**파일**: `packages/core/src/types.ts`

```typescript
/**
 * Interface naming conventions with 'I' prefix
 * @implements interface-naming
 * @memberof naming-conventions
 * @example
 * // ✅ 올바른 인터페이스 명명
 * interface IStore<T> { }
 * interface IActionRegister { }
 * interface IStoreRegistry { }
 * 
 * // ❌ 잘못된 명명
 * interface store { }     // lowercase
 * interface Store { }     // 클래스와 구분 없음
 * interface StoreInt { }  // 축약형 suffix
 */
export interface ActionPayloadMap {
```

#### 함수 네이밍
**파일**: `packages/react/src/ActionProvider.tsx`

```typescript
/**
 * Hook for action dispatch with clear naming
 * @implements function-naming
 * @memberof naming-conventions
 * @example
 * // ✅ 올바른 함수 명명
 * useActionDispatch()     // 훅: use + 명확한 목적
 * createActionContext()   // 팩토리: create + 생성 대상
 * registerHandler()       // 동사 + 명사
 * 
 * // ❌ 잘못된 명명
 * getAD()                // 축약어
 * actionDispatcher()     // 명사로 시작
 * dispatch()             // 너무 일반적
 */
export function useActionDispatch<T extends ActionPayloadMap = ActionPayloadMap>(): ActionDispatcher<T>
```

**예상 소요**: 2일

### Priority 2: 파일 네이밍 규칙

**목표**: 파일 구조와 네이밍 규칙 문서화

**새 파일**: `packages/core/src/utils/FileNamingGuide.ts`

```typescript
/**
 * File naming conventions guide
 * @implements file-naming
 * @implements directory-structure
 * @memberof naming-conventions
 * @example
 * // ✅ 올바른 파일 명명 구조
 * packages/core/src/
 *   ActionRegister.ts          // PascalCase for classes
 *   types.ts                   // lowercase for type definitions
 *   utils/
 *     stringHelpers.ts         // camelCase for utilities
 *     constants.ts             // lowercase for constants
 * 
 * packages/react/src/
 *   components/
 *     ActionProvider.tsx       // PascalCase for React components
 *   hooks/
 *     useActionDispatch.ts     // camelCase starting with 'use'
 *   store/
 *     Store.ts                 // PascalCase for main classes
 *     hooks/
 *       useStoreValue.ts       // nested hooks
 * 
 * // ❌ 잘못된 명명
 * actionregister.ts            // 클래스 파일이 lowercase
 * UseActionDispatch.ts         // 훅 파일이 PascalCase
 * store-registry.ts            // kebab-case 사용
 */
export const FileNamingGuide = {
  // documentation only
}
```

**예상 소요**: 1일

---

## 🔍 Phase 5: 타입 안전성 및 품질 보증 (1주)

### Priority 1: 타입 안전성 강화

**목표**: TypeScript 타입 시스템을 최대한 활용한 안전성 구현

**파일**: `packages/core/src/types/TypeSafety.ts`

```typescript
/**
 * Type safety utilities and constraints
 * @implements type-safety
 * @memberof architecture-terms
 * @example
 * ```typescript
 * // 컴파일 타임 타입 체크
 * type StrictActionPayload<T> = T extends ActionPayloadMap ? T : never;
 * 
 * // 런타임 타입 검증
 * function validatePayload<T>(payload: unknown, schema: Schema<T>): T {
 *   if (!isValidPayload(payload, schema)) {
 *     throw new TypeError('Invalid payload type');
 *   }
 *   return payload as T;
 * }
 * ```
 */
export namespace TypeSafety {
  // 타입 안전성 유틸리티
}
```

**예상 소요**: 3일

### Priority 2: 선택적 구독 시스템 완성

**목표**: useStoreValue의 선택적 구독 기능 완성

**파일**: `packages/react/src/store/hooks/useStoreValue.ts`

```typescript
/**
 * Hook for selective subscription to store changes
 * @implements selective-subscription
 * @memberof api-terms
 * @example
 * ```typescript
 * // 전체 구독
 * const user = useStoreValue(userStore);
 * 
 * // 선택적 구독 (특정 필드만)
 * const userName = useStoreValue(userStore, user => user.name);
 * const userEmail = useStoreValue(userStore, user => user.email);
 * 
 * // 다중 선택적 구독
 * const { name, email } = useStoreValues(userStore, {
 *   name: user => user.name,
 *   email: user => user.email
 * });
 * ```
 */
export function useStoreValue<T, R = T>(
  store: IStore<T> | undefined | null,
  selector?: (value: T) => R
): R | undefined
```

**예상 소요**: 2일

---

## 📋 구현 순서 및 마일스톤 (수정됨)

### Week 1: 기존 구현 태그 추가 (즉시 가능)
- [ ] ActionProvider에 `actionprovider` 태그 추가 (30분)
- [ ] StoreProvider에 `storeprovider` 태그 추가 (30분)  
- [ ] useStoreValue에 `store-hooks` 태그 추가 (30분)
- [ ] useComputedStore에 `computed-store` 태그 추가 (30분)
- [ ] selective-subscription 용어집 정의 추가 (30분)
- **목표**: 40% → 50% 구현률 달성 (5개 용어 추가)

### Week 2-3: 핵심 신규 구현
- [ ] Cross-Store Coordination 구현
- [ ] Priority-based execution 강화 
- [ ] Business Logic 분리 구현
- **목표**: 50% → 65% 구현률 달성

### Week 4-5: MVVM 아키텍처 구현
- [ ] BaseViewModel 클래스 구현
- [ ] Model/View/ViewModel 레이어 구조화
- [ ] MVVM Pattern 문서화 및 태그 추가
- **목표**: 65% → 75% 구현률 달성

### Week 6: 아키텍처 용어 구현  
- [ ] Lazy evaluation 태그 추가 (Store 클래스)
- [ ] Unidirectional data flow 태그 추가
- [ ] Type safety 강화 및 태그 추가
- [ ] Async operations 구현
- **목표**: 75% → 85% 구현률 달성

### Week 7: 네이밍 규칙 및 문서화
- [ ] 네이밍 규칙 JSDoc 추가 (7개 용어)
- [ ] 파일 구조 가이드 작성
- [ ] Directory structure 문서화
- **목표**: 85% → 92% 구현률 달성

### Week 8: 품질 보증 및 마무리
- [ ] 전체 검증 및 테스트
- [ ] 누락된 태그 보완
- [ ] 예제 코드 품질 개선
- **목표**: 92% → 95% 구현률 달성

---

## 🎯 성공 지표

### 정량적 지표
- **구현률**: 95% 이상 (35/37 용어)
- **에러 수**: 0개
- **경고 수**: 5개 이하
- **태그된 파일**: 15개 이상

### 정성적 지표
- **문서 품질**: 모든 핵심 컴포넌트에 예제 코드 포함
- **네이밍 일관성**: 프로젝트 전반의 일관된 네이밍 규칙 적용
- **아키텍처 명확성**: MVVM 패턴이 명확히 구현되고 문서화됨
- **개발자 경험**: JSDoc을 통한 IntelliSense 지원 완성

---

## 📞 후속 계획

### 유지보수 계획
- **주간 검증**: 매주 `pnpm glossary:update` 실행하여 구현률 확인
- **분기별 리뷰**: 3개월마다 용어집 업데이트 및 새 용어 추가 검토
- **버전 연동**: 새 기능 추가 시 관련 용어 정의 및 태그 추가 의무화

### 확장 계획
- **테스팅 용어집**: 테스트 관련 용어 및 패턴 추가
- **성능 최적화**: 성능 관련 용어 및 최적화 패턴 추가
- **국제화**: 다국어 용어집 지원 고려

이 계획을 통해 Context-Action 프레임워크의 용어집 구현률을 35%에서 95%로 향상시키고, 개발자 경험과 코드 품질을 크게 개선할 수 있을 것입니다.