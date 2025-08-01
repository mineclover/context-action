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

### 3. TypeDoc 경고 해결

TypeDoc 경고는 대부분 JSDoc 태그 관련입니다:

```typescript
// 올바른 JSDoc 태그 사용
/**
 * @param payload - Input data
 * @returns Processed result
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