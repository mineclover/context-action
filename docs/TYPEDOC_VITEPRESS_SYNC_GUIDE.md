# TypeDoc VitePress Sync 완전 가이드

`@context-action/typedoc-vitepress-sync` 라이브러리와 최적으로 동작하기 위한 완전한 설정 및 사용 가이드입니다.

## 🚀 빠른 시작

### 1. 설치

```bash
# 프로젝트 의존성으로 설치
npm install @context-action/typedoc-vitepress-sync

# 또는 전역 설치 (CLI 사용)
npm install -g @context-action/typedoc-vitepress-sync
```

### 2. 기본 설정

```bash
# 설정 파일 초기화
npx typedoc-vitepress-sync init

# TypeDoc 출력 생성
npx typedoc --json docs/api/generated/api.json src/

# 동기화 실행
npx typedoc-vitepress-sync sync
```

## 📋 완전한 설정 옵션

### 기본 설정 (`typedoc-vitepress-sync.config.js`)

```javascript
export default {
  // 필수 설정
  sourceDir: './docs/api/generated',     // TypeDoc JSON 출력 디렉토리
  targetDir: './docs/en/api',           // VitePress 마크다운 출력 디렉토리
  sidebarConfigPath: './docs/.vitepress/config/api-spec.ts', // 사이드바 설정 출력
  
  // 패키지 매핑 (모노레포 지원)
  packageMapping: {
    'core': 'core',                     // @scope/core-package → core
    'react': 'react',                   // @scope/react-package → react
    'utils': 'utilities'                // utils → utilities
  },
  
  // 🚀 성능 최적화 설정 (67-69% 향상)
  cache: {
    enabled: true,                      // 필수: 캐싱 활성화
    dir: './.typedoc-vitepress-cache',  // 캐시 디렉토리
    ttl: 24 * 60 * 60 * 1000,          // 24시간 TTL
    hashAlgorithm: 'sha256',            // SHA256 해시 (권장)
    manifestFile: 'manifest.json'       // 캐시 매니페스트
  },
  
  // ⚡ 병렬 처리 설정
  parallel: {
    enabled: true,                      // 병렬 처리 활성화
    maxWorkers: 4,                      // 워커 수 (CPU 코어 기준)
    batchSize: 10                       // 배치 크기 (5-15 권장)
  },
  
  // 🔍 품질 검증 설정
  quality: {
    validateLinks: true,                // 내부 링크 검증
    validateMarkdown: true,             // 마크다운 문법 검증
    checkAccessibility: true            // 접근성 규정 검증
  },
  
  // 📊 메트릭 수집 설정
  metrics: {
    enabled: true,                      // 메트릭 수집 활성화
    outputFile: './reports/sync-metrics.json' // 메트릭 출력 파일
  }
}
```

### 환경별 설정 최적화

```javascript
// 개발 환경 설정
const isDev = process.env.NODE_ENV === 'development'
const isCI = process.env.CI === 'true'

export default {
  sourceDir: './docs/api/generated',
  targetDir: './docs/en/api',
  
  cache: {
    enabled: !isDev,                   // 개발 시 비활성화
    ttl: isDev ? 0 : 24 * 60 * 60 * 1000
  },
  
  parallel: {
    enabled: !isDev,                   // 개발 시 단일 스레드
    maxWorkers: isDev ? 1 : (isCI ? 8 : 4)
  },
  
  quality: {
    validateLinks: !isDev,             // 개발 시 성능을 위해 비활성화
    validateMarkdown: true,
    checkAccessibility: isCI           // CI에서만 전체 검증
  }
}
```

### TypeDoc 설정 최적화 (`typedoc.json`)

```json
{
  "entryPoints": [
    "./packages/core/src/index.ts",
    "./packages/react/src/index.ts"
  ],
  "out": "./docs/api/generated",
  "plugin": ["typedoc-plugin-markdown"],
  "theme": "markdown",
  
  // VitePress 호환성을 위한 필수 설정
  "readme": "none",
  "hideGenerator": true,
  "disableSources": false,
  "includeVersion": true,
  
  // 일관된 구조를 위한 정렬 설정
  "sort": ["source-order"],
  "categorizeByGroup": false,
  "kindSortOrder": [
    "Class", "Interface", "TypeAlias", 
    "Function", "Variable"
  ],
  
  // 품질 보장
  "validation": {
    "notExported": true,
    "invalidLink": true,
    "notDocumented": false
  },
  
  "excludePrivate": true,
  "excludeProtected": true,
  "excludeInternal": true
}
```

## 📝 코드 작성 규칙

### 1. JSDoc 주석 작성 규칙

#### ✅ 권장하는 JSDoc 패턴

```typescript
/**
 * Action Register for managing action handlers with priority-based execution
 * 
 * @example Basic Usage
 * ```typescript
 * const register = new ActionRegister<AppActions>()
 * 
 * register.addHandler('updateUser', async (payload, controller) => {
 *   await userService.update(payload.id, payload.data)
 * })
 * 
 * await register.dispatch('updateUser', { id: '123', data: { name: 'John' } })
 * ```
 * 
 * @example With Priority
 * ```typescript
 * register.addHandler('validateUser', handler1, 100) // High priority
 * register.addHandler('validateUser', handler2, 50)  // Lower priority
 * ```
 * 
 * @template TActionMap - Action payload mapping interface
 * @since 1.0.0
 * @public
 */
export class ActionRegister<TActionMap extends ActionPayloadMap> {
  /**
   * Dispatch an action with optional execution options
   * 
   * @param action - The action type to dispatch
   * @param payload - The action payload
   * @param options - Execution options (mode, timeout, etc.)
   * 
   * @returns Promise resolving to execution results
   * 
   * @throws {Error} When action dispatching fails
   * 
   * @example
   * ```typescript
   * // Basic dispatch
   * await register.dispatch('updateUser', { id: '123', name: 'John' })
   * 
   * // With options
   * await register.dispatch('updateUser', payload, {
   *   mode: 'parallel',
   *   timeout: 5000
   * })
   * ```
   */
  async dispatch<TAction extends keyof TActionMap>(
    action: TAction,
    payload: TActionMap[TAction],
    options?: DispatchOptions
  ): Promise<ExecutionResult<TActionMap[TAction]>[]> {
    // Implementation
  }
}
```

#### ❌ 피해야 할 패턴

```typescript
// 나쁜 예: 불완전한 문서화
/**
 * Does something with user data
 */
export function updateUser(data: any) { }

// 나쁜 예: undefined 값이 포함된 예제
/**
 * @example
 * ```typescript
 * const result = undefined // 이렇게 하면 안됨
 * ```
 */

// 나쁜 예: 빈 링크나 잘못된 참조
/**
 * See {@link } for more info  // 빈 링크
 * See {@link NonExistentClass} // 존재하지 않는 클래스
 */
```

### 2. 타입 정의 규칙

#### ✅ 명확한 타입 문서화

```typescript
/**
 * Action payload mapping interface for type-safe action dispatching
 * 
 * @example
 * ```typescript
 * interface AppActions extends ActionPayloadMap {
 *   updateUser: { id: string; name: string; email: string }
 *   deleteUser: { id: string }
 *   resetUser: void
 * }
 * ```
 */
export interface ActionPayloadMap {
  [key: string]: any
}

/**
 * Configuration options for ActionRegister initialization
 * 
 * @public
 */
export interface ActionRegisterConfig {
  /** Maximum execution timeout in milliseconds @defaultValue 5000 */
  timeout?: number
  
  /** Default execution mode @defaultValue 'sequential' */
  defaultMode?: ExecutionMode
  
  /** Enable debug logging @defaultValue false */
  debug?: boolean
}
```

### 3. 함수/메서드 문서화 규칙

#### ✅ 완전한 함수 문서화

```typescript
/**
 * Execute multiple handlers in parallel with result aggregation
 * 
 * @param handlers - Array of handler functions to execute
 * @param payload - Shared payload for all handlers
 * @param timeout - Maximum execution time in milliseconds
 * 
 * @returns Promise resolving to array of execution results
 * 
 * @throws {TimeoutError} When execution exceeds timeout
 * @throws {ValidationError} When payload validation fails
 * 
 * @example Basic Usage
 * ```typescript
 * const results = await executeParallel(
 *   [handler1, handler2, handler3],
 *   { userId: '123' },
 *   5000
 * )
 * 
 * console.log(`Executed ${results.length} handlers`)
 * ```
 * 
 * @example Error Handling
 * ```typescript
 * try {
 *   await executeParallel(handlers, payload, 1000)
 * } catch (error) {
 *   if (error instanceof TimeoutError) {
 *     console.log('Execution timed out')
 *   }
 * }
 * ```
 * 
 * @since 1.2.0
 * @public
 */
export async function executeParallel<T>(
  handlers: Array<ActionHandler<T>>,
  payload: T,
  timeout: number = 5000
): Promise<ExecutionResult<T>[]> {
  // Implementation
}
```

### 4. React 컴포넌트/훅 문서화

#### ✅ 훅 문서화 패턴

```typescript
/**
 * Hook for accessing and managing store values with reactive updates
 * 
 * @param store - Store instance to subscribe to
 * 
 * @returns Current store value that updates on changes
 * 
 * @example Basic Usage
 * ```tsx
 * function UserProfile() {
 *   const user = useStoreValue(userStore)
 *   
 *   return <div>Hello, {user.name}!</div>
 * }
 * ```
 * 
 * @example With Complex Store
 * ```tsx
 * interface UserState {
 *   profile: { name: string; email: string }
 *   preferences: { theme: 'light' | 'dark' }
 * }
 * 
 * function Settings() {
 *   const userState = useStoreValue(userStore)
 *   
 *   return (
 *     <div className={userState.preferences.theme}>
 *       <h1>{userState.profile.name}</h1>
 *     </div>
 *   )
 * }
 * ```
 * 
 * @public
 */
export function useStoreValue<T>(store: IStore<T>): T {
  // Implementation
}
```

## 🔧 VitePress 통합 최적화

### 사이드바 자동 생성 설정

```typescript
// docs/.vitepress/config.ts
import { defineConfig } from 'vitepress'
import { sidebarApiEn } from './config/api-spec'

export default defineConfig({
  themeConfig: {
    sidebar: {
      '/en/api/': sidebarApiEn(),
      '/ko/api/': sidebarApiKo(),
    }
  }
})
```

### 마크다운 호환성 규칙

#### ✅ VitePress 친화적 마크다운

```markdown
# 올바른 제목 구조
## 클래스 이름
### 메서드 이름
#### 예제

<!-- 올바른 링크 형식 -->
[Action Pipeline](./action-pipeline.md)
[Store Pattern](../concepts/store-pattern.md)

<!-- 올바른 코드 블록 -->
```typescript
// 명확한 언어 지정과 완전한 예제
const example = new ActionRegister<MyActions>()
```

<!-- 올바른 테이블 형식 -->
| 속성 | 타입 | 기본값 | 설명 |
|------|------|---------|------|
| enabled | boolean | true | 캐시 활성화 여부 |
```

#### ❌ 피해야 할 마크다운 패턴

```markdown
<!-- 나쁜 예: 제목 레벨 건너뛰기 -->
# 제목 1
### 제목 3 (제목 2를 건너뜀)

<!-- 나쁜 예: 빈 링크 -->
[빈 링크]()
[존재하지 않는 파일](./nonexistent.md)

<!-- 나쁜 예: 불완전한 코드 블록 -->
```
const incomplete = // 완성되지 않은 코드
```

<!-- 나쁜 예: 잘못된 테이블 형식 -->
| 헤더1 | 헤더2
| 값1 | 값2 | 값3  // 컬럼 수 불일치
```

## 📊 성능 최적화 팁

### 1. 캐시 전략

```javascript
// 프로젝트 크기별 권장 설정
const configs = {
  small: {  // < 50 파일
    cache: { ttl: 12 * 60 * 60 * 1000 }, // 12시간
    parallel: { maxWorkers: 2, batchSize: 5 }
  },
  
  medium: { // 50-200 파일
    cache: { ttl: 24 * 60 * 60 * 1000 }, // 24시간
    parallel: { maxWorkers: 4, batchSize: 10 }
  },
  
  large: {  // > 200 파일
    cache: { ttl: 48 * 60 * 60 * 1000 }, // 48시간
    parallel: { maxWorkers: 6, batchSize: 15 }
  }
}
```

### 2. CI/CD 최적화

```yaml
# .github/workflows/docs.yml
name: Documentation

on:
  push:
    branches: [main]
    paths: ['packages/*/src/**', 'docs/**']

jobs:
  docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'
          
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
        
      - name: Generate TypeDoc
        run: pnpm docs:api
        
      - name: Sync to VitePress (with cache)
        run: pnpm docs:sync
        
      - name: Build documentation
        run: pnpm docs:build
```

## 🛠️ CLI 사용법

### 기본 명령어

```bash
# 문서 동기화
npx typedoc-vitepress-sync sync

# 상세 로그와 함께 실행
npx typedoc-vitepress-sync sync --verbose

# 캐시 무시하고 강제 실행
npx typedoc-vitepress-sync sync --force

# 미리보기 (실제 변경 없이 확인)
npx typedoc-vitepress-sync sync --dry-run

# 캐시 및 생성 파일 정리
npx typedoc-vitepress-sync clean

# 캐시 통계 확인
npx typedoc-vitepress-sync cache stats

# 캐시 초기화
npx typedoc-vitepress-sync cache clear
```

### 설정 오버라이드

```bash
# 소스/타겟 디렉토리 지정
npx typedoc-vitepress-sync sync \
  --source ./custom/api/generated \
  --target ./custom/docs/api

# 기능 비활성화
npx typedoc-vitepress-sync sync \
  --no-cache \
  --no-parallel \
  --no-quality

# 커스텀 설정 파일 사용
npx typedoc-vitepress-sync sync \
  --config ./custom-sync.config.js
```

## 🔧 프로그래밍 방식 사용법

### 기본 사용

```typescript
import { TypeDocVitePressSync } from '@context-action/typedoc-vitepress-sync'

const sync = new TypeDocVitePressSync({
  sourceDir: './docs/api/generated',
  targetDir: './docs/en/api',
  packageMapping: {
    'core': 'core',
    'react': 'react'
  }
})

// 자동 최적화 적용
sync.autoOptimize()

// 동기화 실행
const result = await sync.sync()
console.log(`처리된 파일: ${result.filesProcessed}개`)
console.log(`캐시 적중률: ${result.cache.hitRate}`)
```

### 이벤트 기반 처리

```typescript
// 진행률 추적
sync.on('start', (config) => {
  console.log('🚀 동기화 시작')
})

sync.on('fileComplete', (filePath, result) => {
  const status = result.cached ? '💾 캐시됨' : '🔄 처리됨'
  console.log(`${status}: ${filePath}`)
})

sync.on('complete', (result) => {
  console.log('✅ 동기화 완료!')
})

// 에러 처리
sync.on('error', (error, context) => {
  console.error(`❌ 오류 발생 (${context}):`, error.message)
})

await sync.sync()
```

### 고급 사용법

```typescript
// 커스텀 로거 사용
class CustomLogger {
  info(message: string) { /* 커스텀 로깅 */ }
  warn(message: string) { /* 커스텀 경고 */ }
  error(message: string) { /* 커스텀 에러 */ }
  debug(message: string) { /* 커스텀 디버그 */ }
}

const sync = new TypeDocVitePressSync(config, new CustomLogger())

// 설정 검증
const issues = sync.validateConfig()
if (issues.length > 0) {
  console.log('설정 문제:', issues)
}

// 런타임 통계
const cacheStats = sync.getCacheStats()
const qualityStats = sync.getQualityStats()
const errorSummary = sync.getErrorSummary()
```

## 🚨 문제 해결

### 일반적인 문제와 해결책

#### 1. 설치 문제
```bash
# peer dependency 오류
npm install typedoc vitepress @context-action/typedoc-vitepress-sync

# 전역 설치 문제
npm config get prefix  # PATH 확인
npx @context-action/typedoc-vitepress-sync  # npx 사용
```

#### 2. 설정 문제
```bash
# 설정 파일이 없음
npx typedoc-vitepress-sync init

# 경로 오류 확인
npx typedoc-vitepress-sync sync --dry-run

# 설정 검증
npx typedoc-vitepress-sync sync --verbose
```

#### 3. 캐시 문제
```bash
# 캐시 초기화
npx typedoc-vitepress-sync clean

# 캐시 상태 확인
npx typedoc-vitepress-sync cache stats

# 강제 재생성
npx typedoc-vitepress-sync sync --force
```

#### 4. 성능 문제
```javascript
// 메모리 부족 시 설정 조정
export default {
  parallel: {
    maxWorkers: 2,    // 워커 수 감소
    batchSize: 5      // 배치 크기 감소
  }
}

// Node.js 메모리 증가
NODE_OPTIONS="--max-old-space-size=4096" npx typedoc-vitepress-sync sync
```

#### 5. 품질 검증 오류
```bash
# 링크 검증 비활성화 (임시)
npx typedoc-vitepress-sync sync --no-quality

# 특정 검증만 활성화
export default {
  quality: {
    validateLinks: false,    // 링크 검증 비활성화
    validateMarkdown: true,
    checkAccessibility: false
  }
}
```

### 디버깅 기법

```bash
# 상세 로그 활성화
DEBUG=typedoc-vitepress-sync:* npx typedoc-vitepress-sync sync

# 성능 프로파일링
npx typedoc-vitepress-sync sync --verbose > debug.log

# 시스템 정보 확인
node --version
npm --version
npx typedoc-vitepress-sync --version
```

## 📊 성능 모니터링

### 메트릭 분석

생성된 `reports/sync-metrics.json`에서 확인 가능한 정보:

```json
{
  "filesProcessed": 76,
  "filesSkipped": 72,
  "processingTime": 1250,
  "cache": {
    "hits": 72,
    "misses": 4,
    "hitRate": "94.74%"
  },
  "quality": {
    "totalIssues": 2,
    "files": [...]
  },
  "performance": {
    "filesPerSecond": "60.8",
    "averageTimePerFile": "16.45ms"
  }
}
```

### 성능 벤치마크

| 프로젝트 규모 | 파일 수 | 첫 실행 | 캐시 적용 | 개선도 |
|-------------|--------|---------|-----------|--------|
| 소규모 | 20개 | 150ms | 50ms | **67% 향상** |
| 중규모 | 76개 | 300ms | 100ms | **67% 향상** |
| 대규모 | 200+개 | 800ms | 250ms | **69% 향상** |

### 권장 임계값

```javascript
const performanceTargets = {
  cacheHitRate: 90,              // 90% 이상
  averageTimePerFile: 20,        // 20ms 이하
  filesPerSecond: 50,            // 50파일/초 이상
  qualityIssues: 5               // 품질 이슈 5개 이하
}
```

## 🤝 통합 예제

### GitHub Actions 통합

```yaml
# .github/workflows/docs.yml
name: Documentation

on:
  push:
    branches: [main]
    paths: ['packages/*/src/**', 'docs/**']

jobs:
  docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      # 캐시 복원
      - name: Cache TypeDoc VitePress Sync
        uses: actions/cache@v3
        with:
          path: .typedoc-vitepress-cache
          key: typedoc-sync-${{ runner.os }}-${{ hashFiles('packages/*/src/**/*.ts') }}
          restore-keys: typedoc-sync-${{ runner.os }}-
      
      - name: Install dependencies
        run: npm ci
      
      - name: Generate TypeDoc
        run: npm run docs:api
      
      - name: Sync to VitePress
        run: npx typedoc-vitepress-sync sync --verbose
      
      - name: Upload metrics
        uses: actions/upload-artifact@v3
        with:
          name: sync-metrics
          path: reports/sync-metrics.json
```

### package.json 스크립트

```json
{
  "scripts": {
    "docs:api": "typedoc --json docs/api/generated/api.json src/",
    "docs:sync": "typedoc-vitepress-sync sync",
    "docs:sync:force": "typedoc-vitepress-sync sync --force",
    "docs:clean": "typedoc-vitepress-sync clean",
    "docs:build": "npm run docs:api && npm run docs:sync && vitepress build docs",
    "docs:dev": "vitepress dev docs",
    "docs:preview": "vitepress preview docs"
  }
}
```

## 📚 추가 리소스

- **패키지 문서**: [GitHub Repository](https://github.com/mineclover/context-action/tree/main/packages/typedoc-vitepress-sync)
- **API 참조**: [완전한 API 문서](https://github.com/mineclover/context-action/tree/main/packages/typedoc-vitepress-sync/docs/api-reference.md)
- **고급 사용법**: [고급 기능 가이드](https://github.com/mineclover/context-action/tree/main/packages/typedoc-vitepress-sync/docs/advanced-usage.md)
- **문제 해결**: [상세 문제 해결 가이드](https://github.com/mineclover/context-action/tree/main/packages/typedoc-vitepress-sync/docs/troubleshooting.md)

이 완전 가이드를 통해 TypeDoc VitePress Sync의 모든 기능을 최대한 활용할 수 있습니다. 67-69%의 성능 향상과 포괄적인 품질 검증을 통해 고품질 문서화 워크플로우를 구축하세요.