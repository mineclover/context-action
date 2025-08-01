# Term-Code Linking Convention

용어집의 추상적 용어와 구체적 코드 구현체를 연결하는 명확한 컨벤션입니다.

## 🔗 연결 메커니즘 개요

```
용어집 용어 (Abstract) ←→ JSDoc @implements ←→ Code Implementation (Concrete)
     ↓                        ↓                          ↓
  Action Handler    @implements action-handler    interface ActionHandler
  kebab-case              kebab-case                  PascalCase/camelCase
```

## 📝 JSDoc 태그 컨벤션

### 핵심 태그들

#### `@implements {term-name}`
**목적**: 코드가 특정 용어집 용어를 구현함을 명시
**형식**: `@implements {kebab-case-term-name}`

```typescript
/**
 * 액션 핸들러 인터페이스
 * @implements action-handler
 */
interface ActionHandler<T> {
  // 구현 내용
}
```

#### `@memberof {category}`
**목적**: 용어가 속한 용어집 카테고리 명시
**형식**: `@memberof {category-name}`

```typescript
/**
 * 파이프라인 컨트롤러
 * @implements pipeline-controller
 * @memberof core-concepts
 */
class PipelineController {
  // 구현 내용
}
```

#### `@example`
**목적**: 구체적 사용 예시 (용어집에는 없는 구현 레벨 정보)

```typescript
/**
 * 스토어 훅
 * @implements store-hooks
 * @memberof core-concepts
 * @example
 * const value = useStoreValue(userStore);
 * const setValue = useStoreSetValue(userStore);
 */
export function useStoreValue<T>(store: Store<T>): T {
  // 구현 내용
}
```

#### `@since {version}`
**목적**: 구현이 추가된 버전 명시

```typescript
/**
 * 액션 디스패처
 * @implements action-dispatcher
 * @memberof core-concepts
 * @since 1.2.0
 */
export class ActionDispatcher {
  // 구현 내용
}
```

## 🎯 네이밍 컨벤션

### 용어집 → 코드 매핑

#### 1. 용어집 (Abstract Level)
- **형식**: `kebab-case`
- **예시**: `action-handler`, `store-integration-pattern`, `pipeline-controller`
- **위치**: `glossary/terms/*.md` 파일의 `## 헤더`

#### 2. JSDoc 태그 (Bridge Level) 
- **형식**: `kebab-case` (용어집과 동일)
- **예시**: `@implements action-handler`
- **위치**: 코드 파일의 JSDoc 주석

#### 3. 코드 구현 (Concrete Level)
- **형식**: 언어별 컨벤션 (PascalCase, camelCase 등)
- **예시**: `ActionHandler`, `useActionHandler`, `createActionHandler`
- **위치**: 실제 TypeScript/JavaScript 코드

### 변환 규칙

```javascript
// 용어집 용어 → JSDoc 태그 (1:1 매핑)
"Action Handler" → "action-handler" → "@implements action-handler"

// JSDoc 태그 → 코드 구현 (1:N 매핑 가능)
"@implements action-handler" → {
  "ActionHandler",           // 인터페이스
  "useActionHandler",        // 훅
  "createActionHandler",     // 팩토리 함수
  "actionHandlerMiddleware"  // 미들웨어
}
```

## 🏗️ 구현 패턴

### 단일 구현 (1:1)

```typescript
/**
 * 액션 페이로드 맵 인터페이스
 * @implements action-payload-map
 * @memberof api-terms
 * @since 0.1.0
 */
export interface ActionPayloadMap {
  [actionName: string]: any;
}
```

### 다중 구현 (1:N)

```typescript
// 같은 용어의 여러 구현체들
/**
 * 액션 핸들러 타입
 * @implements action-handler
 * @memberof core-concepts
 */
export type ActionHandler<T> = (payload: T, controller: PipelineController) => void | Promise<void>;

/**
 * 액션 핸들러 훅
 * @implements action-handler
 * @memberof core-concepts
 * @example
 * const handler = useActionHandler('updateUser', async (payload) => {
 *   // 비즈니스 로직
 * });
 */
export function useActionHandler<T>(actionName: string, handler: ActionHandler<T>) {
  // 훅 구현
}

/**
 * 액션 핸들러 팩토리
 * @implements action-handler
 * @memberof core-concepts
 */
export function createActionHandler<T>(config: HandlerConfig): ActionHandler<T> {
  // 팩토리 구현
}
```

### 복합 구현 (N:1)

```typescript
/**
 * 통합 액션 가드 - 여러 용어를 동시에 구현
 * @implements action-handler
 * @implements pipeline-controller
 * @memberof core-concepts
 * @example
 * const guard = useActionGuard({
 *   mode: 'debounce',
 *   debounce: { delay: 1000 }
 * });
 */
export function useActionGuard(options: GuardOptions) {
  // 통합 구현
}
```

## 📂 파일별 구현 패턴

### 타입 정의 파일

```typescript
// packages/core/src/types.ts
/**
 * @fileoverview Core type definitions for Context-Action framework
 * @implements pipeline-controller
 * @implements action-payload-map
 * @memberof core-concepts
 * @since 0.0.1
 */

export interface PipelineController<T = any> {
  // 파이프라인 컨트롤러 구현
}

export interface ActionPayloadMap {
  // 액션 페이로드 맵 구현
}
```

### 훅 파일

```typescript
// example/src/hooks/useActionDebouncer.ts
/**
 * 액션 중복 실행을 방지하는 디바운싱 훅
 * @implements action-handler
 * @memberof core-concepts
 * @example
 * const debouncedAction = useActionDebouncer('addToCart', { delay: 1000 });
 * @since 1.0.0
 */
export interface DebounceOptions {
  delay: number;
  leading?: boolean;
  trailing?: boolean;
}

export function useActionDebouncer(actionName: string, options: DebounceOptions) {
  // 디바운서 구현
}
```

### 클래스 파일

```typescript
// packages/core/src/ActionRegister.ts
/**
 * 액션 등록 및 디스패치 관리 클래스
 * @implements actionregister
 * @implements action-pipeline-system
 * @memberof core-concepts
 * @since 0.1.0
 */
export class ActionRegister<T extends ActionPayloadMap> {
  /**
   * 액션 핸들러 등록
   * @implements action-handler
   */
  register<K extends keyof T>(
    actionName: K,
    handler: ActionHandler<T[K]>,
    config?: HandlerConfig
  ): UnregisterFunction {
    // 등록 로직
  }

  /**
   * 액션 디스패치
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

## 🔍 검증 규칙

### 용어 매칭 검증

```javascript
// 용어집에서 추출된 용어들
const glossaryTerms = [
  'action-handler',
  'pipeline-controller',
  'store-integration-pattern'
];

// 코드에서 발견된 @implements 태그들
const implementedTerms = [
  'action-handler',
  'pipeline-controller',
  'unknown-term'  // ❌ 용어집에 없는 용어
];

// 검증 결과
const validation = {
  valid: ['action-handler', 'pipeline-controller'],
  invalid: ['unknown-term'],  // 경고 발생
  missing: ['store-integration-pattern']  // 미구현 용어
};
```

### 중복 구현 검증

```javascript
// 하나의 구현체가 여러 용어를 구현하는 경우
/**
 * @implements action-handler
 * @implements pipeline-controller  // ✅ 허용됨 (복합 구현)
 */

// 여러 구현체가 같은 이름을 가지는 경우
// File A:
/**
 * @implements action-handler
 */
interface DebounceOptions { }

// File B:
/**
 * @implements pipeline-controller
 */
type DebounceOptions = { };  // ⚠️ 경고: 같은 이름의 다른 구현
```

## 📊 자동 분석 및 리포팅

### 구현 현황 매트릭스

```markdown
## 구현 현황

| 용어집 용어 | 구현 상태 | 구현체 수 | 주요 파일 |
|------------|-----------|-----------|-----------|
| action-handler | ✅ 구현됨 | 4개 | useActionThrottle.ts, useActionDebouncer.ts |
| pipeline-controller | ✅ 구현됨 | 2개 | types.ts, useActionGuard.ts |
| store-registry | ❌ 미구현 | 0개 | - |
```

### 카테고리별 구현률

```markdown
## 카테고리별 현황

### 🎯 Core Concepts (17% 구현)
- ✅ action-handler (4개 구현체)
- ✅ pipeline-controller (2개 구현체)
- ❌ action-pipeline-system (미구현)
- ❌ store-integration-pattern (미구현)
```

## 🎯 베스트 프랙티스

### ✅ 권장사항

1. **일관된 네이밍**
   ```typescript
   // ✅ 좋은 예
   @implements action-handler  // kebab-case
   interface ActionHandler     // PascalCase
   ```

2. **명확한 설명**
   ```typescript
   /**
    * 액션 핸들러 - 비즈니스 로직을 처리하는 함수
    * @implements action-handler
    * @memberof core-concepts
    * @example
    * const handler = (payload, controller) => { /* 로직 */ };
    */
   ```

3. **적절한 그룹핑**
   ```typescript
   /**
    * 여러 용어를 동시에 구현하는 경우 명시
    * @implements action-handler
    * @implements pipeline-controller
    */
   ```

### ❌ 주의사항

1. **잘못된 용어 참조**
   ```typescript
   // ❌ 나쁜 예
   @implements ActionHandler    // PascalCase 사용 금지
   @implements action_handler   // snake_case 사용 금지
   ```

2. **존재하지 않는 용어**
   ```typescript
   // ❌ 나쁜 예
   @implements non-existent-term  // 용어집에 없는 용어
   ```

3. **누락된 메타데이터**
   ```typescript
   // ❌ 불완전한 예
   @implements action-handler
   // memberof, example, since 등 누락
   ```

## 🔄 워크플로우 통합

### 개발 시 체크리스트

1. **새 용어 구현 시**
   - [ ] 용어집에서 정확한 용어명 확인
   - [ ] `@implements {kebab-case-term}` 추가
   - [ ] `@memberof {category}` 추가
   - [ ] `@example` 사용 예시 추가
   - [ ] `@since` 버전 정보 추가

2. **기존 코드 태깅 시**
   - [ ] 해당 용어의 정의 확인
   - [ ] 구현체가 정의에 부합하는지 검토
   - [ ] 적절한 JSDoc 태그 추가
   - [ ] `pnpm glossary:update` 실행하여 검증

3. **용어집 업데이트 시**
   - [ ] 새 용어의 kebab-case 명 확정
   - [ ] 기존 구현체들의 태그 업데이트 필요 여부 확인
   - [ ] 관련 용어들과의 일관성 검토

---

*이 컨벤션은 용어집의 추상적 개념과 구체적 코드 구현 사이의 명확하고 일관된 연결을 보장합니다.*