# 용어집 태그 사용 가이드

## 🏷️ JSDoc 태그 형식

### 기본 사용법
```typescript
/**
 * 함수 또는 컴포넌트 설명
 * 
 * @implements action-handler
 * @memberof core-concepts
 * @since 1.0.0
 * @example
 * ```typescript
 * const result = useMyHook();
 * ```
 */
export function useMyHook() { ... }
```

## 📋 필수 태그

### `@implements` (필수)
구현하는 용어집 용어를 명시합니다.
```typescript
// @implements action-handler
// @implements action-handler, pipeline-controller  (여러 용어 가능)
```

### `@memberof` (필수)  
소속 용어집 카테고리를 명시합니다.
```typescript
// @memberof core-concepts
```

**사용 가능한 카테고리**:
- `core-concepts`: 핵심 개념
- `architecture-terms`: 아키텍처 용어
- `api-terms`: API 관련 용어
- `naming-conventions`: 명명 규칙

## 🎨 적용 예시

### React 훅
```typescript
/**
 * 액션 스로틀링 훅
 * @implements action-handler
 * @memberof core-concepts
 * @since 1.0.0
 */
export function useActionThrottle() { ... }
```

### 클래스
```typescript
/**
 * 액션 등록 관리 클래스
 * @implements actionregister
 * @memberof api-terms
 */
export class ActionRegister { ... }
```

### 타입/인터페이스
```typescript
/**
 * 액션 페이로드 매핑 인터페이스
 * @implements action-payload-map
 * @memberof api-terms
 */
export interface ActionPayloadMap { ... }
```

## ✅ 태그 검증

```bash
# 태그 유효성 검사
pnpm glossary:validate

# 미구현 용어 확인
pnpm glossary:missing

# 전체 분석
pnpm glossary:update
```