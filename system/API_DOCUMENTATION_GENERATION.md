# API 문서 자동 생성

Context Action은 TypeDoc을 사용하여 API 문서를 자동으로 생성하고 관리합니다.

## 개요

API 문서는 TypeScript 소스 코드에서 자동으로 생성되며, 다음과 같은 특징을 가집니다:

- **자동 생성**: TypeDoc이 TypeScript 코드를 분석하여 API 문서 생성
- **실시간 동기화**: 코드 변경 시 자동으로 문서 업데이트
- **구조화된 네비게이션**: 패키지별로 체계적으로 구성된 사이드바
- **다국어 지원**: 영어/한국어 로케일별 문서 제공

## 아키텍처

### 1. TypeDoc 설정

TypeDoc 설정은 `typedoc.json`에서 관리됩니다:

```json
{
  "entryPoints": [
    "./packages/core/src/index.ts",
    "./packages/logger/src/index.ts", 
    "./packages/react/src/index.ts",
    "./packages/jotai/src/index.tsx"
  ],
  "out": "./docs/api/generated",
  "plugin": ["typedoc-plugin-markdown"],
  "theme": "markdown"
}
```

### 2. 문서 동기화

생성된 문서는 `scripts/sync-api-docs.js` 스크립트를 통해 `docs/ko/api/` 경로로 동기화됩니다:

```bash
pnpm docs:sync
```

#### 주요 기능

- **스마트 동기화**: 새로 생성된 파일만 선택적으로 복사
- **파일명 변환**: 자동으로 읽기 쉬운 이름으로 변환
- **사이드바 자동 생성**: API 구조를 파싱하여 사이드바 설정 생성

### 3. 사이드바 생성

API 구조가 자동으로 파싱되어 사이드바 설정이 생성됩니다:

```typescript
// 자동 생성되는 사이드바 구조
export const API_STRUCTURE = {
  "core": {
    "text": "Core API",
    "items": [
      { "text": "Action Register", "path": "/core/src/classes/ActionRegister" },
      { "text": "Action Dispatcher", "path": "/core/src/interfaces/ActionDispatcher" }
    ]
  },
  "react": {
    "text": "React API", 
    "items": [
      { "text": "useStore", "path": "/react/src/functions/useStore" },
      { "text": "ActionProvider", "path": "/react/src/functions/ActionProvider" }
    ]
  }
}
```

## 워크플로우

### 1. 문서 생성

```bash
# TypeDoc으로 API 문서 생성
pnpm docs:api

# 생성된 문서를 동기화하고 사이드바 업데이트
pnpm docs:sync

# 전체 문서 빌드 (생성 + 동기화 + 빌드)
pnpm docs:full
```

### 2. 파일 구조

```
docs/
├── api/generated/          # TypeDoc 원본 생성 위치
│   └── packages/
│       ├── core/
│       ├── react/
│       ├── jotai/
│       └── logger/
├── en/api/                # 동기화된 영어 API 문서
│   ├── core/
│   ├── react/
│   ├── jotai/
│   └── logger/
└── ko/api/                # 동기화된 한국어 API 문서
    ├── core/
    ├── react/
    ├── jotai/
    └── logger/
```

### 3. 사이드바 설정

자동 생성된 사이드바는 `docs/.vitepress/config/api-spec.ts`에 저장됩니다:

```typescript
// 자동 생성된 API 사이드바 설정
export function sidebarApiKo() {
  return Object.values(API_STRUCTURE).map(section => 
    createSidebarSection('ko', section)
  )
}
```

## 파일명 규칙

스크립트는 파일명을 자동으로 읽기 쉬운 형태로 변환합니다:

| 원본 파일명 | 표시 이름 |
|------------|----------|
| `ActionRegister.md` | `Action Register` |
| `useStore.md` | `useStore` |
| `ActionProviderProps.md` | `Action Provider Props` |
| `README.md` | `Overview` |

## 패키지 매핑

각 패키지는 다음과 같이 매핑됩니다:

```javascript
const PACKAGE_MAPPING = {
  'core': 'core',
  'react': 'react', 
  'jotai': 'jotai',
  'logger': 'logger'
}
```

## 동기화 로직

### 1. 파일 비교

스크립트는 파일의 수정 시간을 비교하여 새로 생성된 파일만 동기화합니다:

```javascript
function isNewerFile(sourcePath, targetPath) {
  if (!fs.existsSync(targetPath)) {
    return true; // 타겟 파일이 없으면 새 파일로 간주
  }
  
  const sourceStat = fs.statSync(sourcePath);
  const targetStat = fs.statSync(targetPath);
  
  return sourceStat.mtime > targetStat.mtime;
}
```

### 2. 안전한 복사

```javascript
function copyFileIfNewer(sourcePath, targetPath) {
  if (!isNewerFile(sourcePath, targetPath)) {
    console.log(`⏭️  건너뜀 (최신): ${path.basename(sourcePath)}`);
    return false;
  }
  
  // 파일 복사 및 로그 출력
  fs.copyFileSync(sourcePath, targetPath);
  console.log(`📄 파일 복사: ${path.basename(sourcePath)}`);
  return true;
}
```

## 설정

### TypeDoc 설정

`typedoc.json`에서 다음 설정을 관리합니다:

- **entryPoints**: 문서화할 TypeScript 파일들
- **out**: 생성된 문서의 출력 위치
- **plugin**: 마크다운 플러그인 사용
- **exclude**: 제외할 파일 패턴

### 스크립트 설정

`scripts/sync-api-docs.js`에서 다음 설정을 관리합니다:

```javascript
const SOURCE_DIR = './docs/api/generated';
const TARGET_DIR = './docs/ko/api';
const SIDEBAR_CONFIG_PATH = './docs/.vitepress/config/api-spec.ts';
```

## 모범 사례

### 1. 코드 문서화

TypeScript 코드에 JSDoc 주석을 추가하여 자동 문서화:

```typescript
/**
 * Action handler function type
 * @implements action-handler
 * @memberof core-concepts
 */
export type ActionHandler<T, R> = (payload: T) => R | Promise<R>;
```

### 2. 타입 안전성

모든 API는 타입이 명시되어야 합니다:

```typescript
/**
 * Creates a new action register
 * @param config - Configuration options
 * @returns Action register instance
 */
export function createActionRegister(config: ActionRegisterConfig): ActionRegister
```

### 3. 예제 코드

JSDoc에 예제 코드를 포함하여 사용법을 명확히 합니다:

```typescript
/**
 * Example usage:
 * ```typescript
 * const register = createActionRegister();
 * register.register('fetchUser', {
 *   handler: async (id: string) => {
 *     return await fetchUser(id);
 *   }
 * });
 * ```
 */
```

## Vue 호환성 처리

### 문제: Vue 컴파일러와 TypeScript 제네릭 구문 충돌

TypeDoc으로 생성된 API 문서에서 TypeScript 제네릭 구문(`<T>`, `Snapshot<T>` 등)이 Vue 컴파일러에 의해 HTML 태그로 잘못 해석되어 빌드 오류가 발생할 수 있습니다.

**오류 예시:**
```
[vite:vue] docs/en/api/react/src/functions/useStore.md (19:24): Element is missing end tag.
```

### 해결 방법

#### 1. JSDoc Template 구문 수정

JSDoc에서 `@template` 태그의 대시 패턴을 제거하여 TypeDoc이 안전한 출력을 생성하도록 합니다:

```typescript
// ❌ 문제가 되는 패턴
/**
 * @template T - Store 값 타입
 * @template R - 반환 타입
 */

// ✅ 올바른 패턴  
/**
 * @template T Store 값 타입
 * @template R 반환 타입
 */
```

#### 2. 마크다운 후처리

`scripts/sync-api-docs.js`에서 생성된 마크다운을 Vue 호환 형태로 후처리합니다:

```javascript
function postProcessMarkdown(content) {
  return content
    // 제네릭 타입 패턴: Snapshot<T> → Snapshot&lt;T&gt;
    .replace(/([A-Za-z]+)<([A-Z])>/g, '$1&lt;$2&gt;')
    // 타입 파라미터: Type parameter `T` → Type parameter **T**
    .replace(/Type parameter `([A-Z])`/g, 'Type parameter **$1**')
    // 헤더 안전화: ### T → ### Generic type T
    .replace(/^### ([A-Z])$/gm, '### Generic type $1')
    // 기타 제네릭 패턴들
    .replace(/\\<`([^`]+)`\\>/g, '&lt;`$1`&gt;');
}
```

#### 3. 적용된 변환 패턴

| 원본 패턴 | 변환 후 | 이유 |
|-----------|---------|------|
| `<T>` | `&lt;T&gt;` | HTML 태그로 인식 방지 |
| `Snapshot<T>` | `Snapshot&lt;T&gt;` | Vue 컴파일러 호환성 |
| `Type parameter `T`` | `Type parameter **T**` | 백틱 패턴 안전화 |
| `### T` | `### Generic type T` | 단일 문자 헤더 방지 |

### 워크플로우 통합

이 후처리는 문서 동기화 과정에서 자동으로 적용됩니다:

```bash
pnpm docs:api   # TypeDoc 생성
pnpm docs:sync  # 후처리 및 동기화 (자동 적용)
pnpm docs:build # Vue 호환 빌드 성공
```

## 문제 해결

### 1. 문서가 업데이트되지 않는 경우

```bash
# 캐시된 파일 강제 업데이트
rm -rf docs/ko/api/
pnpm docs:sync
```

### 2. 사이드바가 생성되지 않는 경우

```bash
# 사이드바 설정 재생성
rm docs/.vitepress/config/api-spec.ts
pnpm docs:sync
```

### 3. Vue 빌드 오류 해결

Vue 컴파일러 오류가 발생하는 경우:

```bash
# 문제 파일 강제 재생성
rm -rf docs/en/api/
pnpm docs:sync
pnpm docs:build
```

**주요 체크포인트:**
- JSDoc `@template` 구문에 대시(-) 사용 금지
- 제네릭 타입 패턴이 HTML 엔티티로 변환되었는지 확인
- 타입 파라미터가 안전한 형태로 표시되는지 확인

### 4. TypeDoc 경고 해결

TypeDoc 경고는 대부분 JSDoc 태그 관련입니다:

```typescript
// 올바른 JSDoc 태그 사용
/**
 * @param payload - Input data
 * @returns Processed result
 * @template T Store value type (대시 없이)
 */
```

## CI/CD 통합

### GitHub Actions

```yaml
- name: Generate API Documentation
  run: |
    pnpm docs:api
    pnpm docs:sync
    pnpm docs:build
```

### Pre-commit Hook

```json
{
  "scripts": {
    "pre-commit": "pnpm docs:sync"
  }
}
```

## 향후 개선 사항

### 1. 자동 링크 생성

코드 간 참조를 자동으로 링크로 변환

### 2. 검색 기능 강화

API 문서 내에서의 고급 검색 기능

### 3. 버전별 문서

API 버전별 문서 자동 생성 및 관리

---

이 시스템을 통해 Context Action의 API 문서는 항상 최신 상태를 유지하며, 개발자들이 쉽게 참조할 수 있습니다. 