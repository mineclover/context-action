# Vue 호환성 가이드

Context Action 프로젝트에서 TypeDoc으로 생성된 API 문서와 Vue 컴파일러 간의 호환성 문제를 해결하는 방법을 설명합니다.

## 문제 개요

### 근본 원인

TypeDoc이 생성하는 마크다운 문서에 포함된 TypeScript 제네릭 구문이 Vue 컴파일러에 의해 HTML 태그로 잘못 해석되어 빌드 오류가 발생합니다.

**문제가 되는 패턴들:**
- `<T>`, `<K>`, `<R>` - 단일 제네릭 타입 파라미터
- `Snapshot<T>`, `IStore<T>` - 제네릭 타입 사용
- `### T` - 단일 문자로 된 마크다운 헤더
- `` `T` `` - 백틱으로 감싸진 단일 타입 파라미터

**결과적으로 발생하는 오류:**
```
[vite:vue] docs/en/api/react/src/functions/useStore.md (19:24): Element is missing end tag.
Error: Process completed with exit code 1.
```

## 해결 방법

### 1. JSDoc 구문 규칙

TypeScript 파일에서 JSDoc 주석 작성 시 다음 규칙을 준수해야 합니다:

#### ❌ 문제가 되는 패턴
```typescript
/**
 * Store Hook - 스냅샷 구독
 * @template T - Store 값 타입
 * @template R - 반환 타입 (기본값: Snapshot<T>)
 */
export function useStore<T, R = Snapshot<T>>() {
  // ...
}
```

#### ✅ 올바른 패턴
```typescript
/**
 * Store Hook - 스냅샷 구독
 * @template T Store 값 타입
 * @template R 반환 타입 (기본값: Snapshot<T>)
 */
export function useStore<T, R = Snapshot<T>>() {
  // ...
}
```

**핵심 변경사항:**
- `@template T - description` → `@template T description`
- 대시(`-`) 제거가 핵심

### 2. 마크다운 후처리 시스템

`scripts/sync-api-docs.js`에서 자동으로 Vue 호환성을 위한 후처리를 수행합니다:

```javascript
function postProcessMarkdown(content) {
  return content
    // 제네릭 타입 파라미터 \<T\> -> &lt;T&gt;
    .replace(/\\<`([A-Z])`\\>/g, '&lt;`$1`&gt;')
    // 다른 제네릭 패턴들도 처리
    .replace(/\\<`([A-Z][A-Za-z0-9]*)`\\>/g, '&lt;`$1`&gt;')
    // 복잡한 제네릭 타입도 처리 (예: \<T, K\>)
    .replace(/\\<`([^`]+)`\\>/g, '&lt;`$1`&gt;')
    // Vue가 문제를 일으키는 일반적인 제네릭 타입 패턴들 처리
    .replace(/([A-Za-z]+)<([A-Z])>/g, '$1&lt;$2&gt;')
    // Vue가 문제를 일으키는 단일 타입 파라미터 헤더들을 안전한 형태로 변경
    .replace(/^### ([A-Z])$/gm, '### Generic type $1')
    // 백틱이 있는 단일 대문자를 완전히 안전한 형태로 변경
    .replace(/Type parameter `([A-Z])`/g, 'Type parameter **$1**')
    // 단일 줄에 단일 대문자만 있는 경우 (예: `T`)
    .replace(/^`([A-Z])`$/gm, 'Type parameter **$1**')
    // 단일 줄에 제네릭 타입만 있는 경우 (예: `T extends Something`)
    .replace(/^`([A-Z][A-Za-z0-9 =<>\[\]]*)`$/gm, 'Type parameter **$1**')
    // 타입 파라미터 설명 라인들을 안전하게 처리
    .replace(/^Generic type parameter ([A-Z])$/gm, 'Type parameter **$1**');
}
```

### 3. 변환 패턴 테이블

| 원본 패턴 | 변환 후 | Vue 호환성 | 이유 |
|-----------|---------|------------|------|
| `<T>` | `&lt;T&gt;` | ✅ | HTML 태그로 해석 방지 |
| `Snapshot<T>` | `Snapshot&lt;T&gt;` | ✅ | 제네릭 타입 안전화 |
| `` `T` `` | `**T**` | ✅ | 백틱 패턴 제거 |
| `### T` | `### Generic type T` | ✅ | 단일 문자 헤더 방지 |
| `Type parameter `T`` | `Type parameter **T**` | ✅ | 백틱 제거 및 볼드 처리 |

## 적용 및 검증

### 1. 자동 적용

문서 동기화 과정에서 자동으로 후처리가 적용됩니다:

```bash
pnpm docs:api     # TypeDoc으로 원본 문서 생성
pnpm docs:sync    # Vue 호환성 후처리 자동 적용
pnpm docs:build   # Vue 컴파일러 호환 빌드 성공
```

### 2. 검증 방법

#### 로컬 테스트
```bash
# 전체 문서 빌드 테스트
pnpm docs:full

# 개별 단계 테스트
pnpm docs:api && pnpm docs:sync && pnpm docs:build
```

#### 패턴 검사
```bash
# 문제가 될 수 있는 패턴 검색
grep -r "<[A-Z]>" docs/en/api/
grep -r "`[A-Z]`" docs/en/api/

# 올바르게 변환되었는지 확인
grep -r "&lt;[A-Z]&gt;" docs/en/api/
grep -r "\*\*[A-Z]\*\*" docs/en/api/
```

## CI/CD 통합

### GitHub Actions 워크플로우

```yaml
- name: Generate API documentation
  run: |
    pnpm docs:api
    pnpm docs:sync  # Vue 호환성 후처리 포함

- name: Build documentation
  run: pnpm docs:build  # Vue 호환 빌드
```

### 실패 시 디버깅

CI/CD에서 Vue 빌드 오류 발생 시:

```bash
# 로그에서 찾을 오류 패턴
"Element is missing end tag"
"[vite:vue]"
"SyntaxError: [plugin vite:vue]"

# 문제 파일 식별 패턴
"docs/en/api/.../fileName.md (line:column): Element is missing end tag"
```

## 모범 사례

### 1. JSDoc 작성 규칙

```typescript
// ✅ 권장 패턴
/**
 * 제네릭 함수 설명
 * @template T 첫 번째 타입 파라미터
 * @template K 두 번째 타입 파라미터  
 * @template V 값 타입
 * @param data 입력 데이터
 * @returns 처리된 결과
 */
export function processData<T, K, V>(data: T): V {
  // ...
}
```

### 2. 타입 정의 문서화

```typescript
// ✅ 복잡한 제네릭 타입도 안전하게 문서화
/**
 * 스토어 인터페이스 정의
 * @template T 저장할 값의 타입
 * @implements store-interface
 * @memberof core-concepts
 * @since 1.0.0
 */
export interface IStore<T> {
  getValue(): T;
  setValue(value: T): void;
  subscribe(listener: () => void): () => void;
}
```

### 3. 예제 코드 작성

```typescript
/**
 * 사용 예제:
 * ```typescript
 * const userStore: IStore<User> = createStore('user', {
 *   id: '',
 *   name: '',
 *   email: ''
 * });
 * 
 * // 타입 안전한 사용
 * const user = userStore.getValue(); // User 타입
 * userStore.setValue({ id: '1', name: 'John', email: 'john@example.com' });
 * ```
 */
```

## 문제 해결

### 1. 빌드 오류 발생 시

```bash
# 문제 파일 강제 재생성
rm -rf docs/en/api/
pnpm docs:sync
pnpm docs:build
```

### 2. 특정 파일 문제 해결

```bash
# 특정 문제 파일 삭제 후 재생성
rm docs/en/api/react/src/functions/useStore.md
pnpm docs:sync
```

### 3. JSDoc 구문 확인

```bash
# 문제가 될 수 있는 JSDoc 패턴 검색
find packages -name "*.ts" -o -name "*.tsx" | xargs grep -l "@template.*-"
```

### 4. 디버깅 팁

- Vue 컴파일 오류는 정확한 파일과 라인을 표시하므로 해당 위치를 집중적으로 확인
- 후처리 로직이 적용되지 않은 경우 `pnpm docs:sync` 재실행
- TypeDoc 생성 과정에서 경고 메시지도 함께 확인

## 향후 개선 방안

### 1. 사전 검증

- Pre-commit hook에서 JSDoc 구문 검증
- 자동화된 패턴 검사 도구 개발

### 2. 더 나은 후처리

- 정규표현식 패턴 최적화
- 성능 향상을 위한 캐싱 전략

### 3. 도구 통합

- ESLint 규칙으로 JSDoc 패턴 강제
- IDE 확장으로 실시간 검증

---

이 가이드를 통해 Context Action 프로젝트에서 Vue 호환성 문제를 완전히 해결하고, 향후 유사한 문제를 예방할 수 있습니다.