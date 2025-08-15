# TypeDoc VitePress Sync 가이드

TypeDoc VitePress Sync 라이브러리와 최적으로 동작하기 위한 설정 및 코드 작성 가이드입니다.

## 📋 권장 설정

### 기본 설정 (`typedoc-vitepress-sync.config.js`)

```javascript
export default {
  // 필수 설정
  sourceDir: './docs/api/generated',
  targetDir: './docs/en/api',
  sidebarConfigPath: './docs/.vitepress/config/api-spec.ts',
  
  // 패키지 매핑 (모노레포용)
  packageMapping: {
    'core': 'core',
    'react': 'react',
    'utils': 'utilities'
  },
  
  // 성능 최적화 설정
  cache: {
    enabled: true,                    // 필수: 67% 성능 향상
    dir: './.typedoc-vitepress-cache',
    ttl: 24 * 60 * 60 * 1000,        // 24시간 권장
    hashAlgorithm: 'sha256'           // 정확한 변경 감지
  },
  
  parallel: {
    enabled: true,                    // 대용량 프로젝트에 필수
    maxWorkers: 4,                    // CPU 코어 수에 맞게 조정
    batchSize: 10                     // 파일 수에 따라 5-15 권장
  },
  
  // 품질 보장 설정
  quality: {
    validateLinks: true,              // 내부 링크 검증
    validateMarkdown: true,           // 마크다운 문법 검증
    checkAccessibility: true          // 접근성 검증
  },
  
  // 모니터링 설정
  metrics: {
    enabled: true,
    outputFile: './reports/api-sync-metrics.json'
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

## 🚨 문제 해결

### 일반적인 문제와 해결책

1. **캐시 관련 문제**
   ```bash
   # 캐시 초기화
   npx @context-action/typedoc-vitepress-sync clean
   
   # 강제 재생성
   pnpm docs:sync --force
   ```

2. **링크 검증 오류**
   - 상대 경로 사용: `./relative-path.md`
   - 절대 경로 피하기: `/absolute/path.md` (❌)

3. **마크다운 문법 오류**
   - 코드 블록에 언어 지정 필수
   - 테이블 컬럼 수 일치 확인
   - 제목 레벨 순서 준수

4. **성능 최적화**
   ```javascript
   // 대용량 프로젝트용 설정
   export default {
     parallel: {
       enabled: true,
       maxWorkers: Math.min(8, require('os').cpus().length),
       batchSize: Math.ceil(totalFiles / 20)
     },
     cache: {
       enabled: true,
       ttl: 7 * 24 * 60 * 60 * 1000 // 1주일
     }
   }
   ```

## 📈 모니터링

### 메트릭 분석

생성된 `reports/api-sync-metrics.json`을 통해 다음을 모니터링:

- **성능**: 파일당 평균 처리 시간
- **캐시 효율성**: 히트율 >80% 목표
- **품질**: 검증 오류 수 최소화
- **처리량**: 초당 파일 처리 수

### 권장 임계값

```javascript
const thresholds = {
  performance: {
    averageTimePerFile: 20,    // 20ms 이하
    cacheHitRate: 80,          // 80% 이상
    filesPerSecond: 50         // 50 파일/초 이상
  },
  quality: {
    maxLinkErrors: 0,          // 링크 오류 0개
    maxMarkdownErrors: 5,      // 마크다운 오류 5개 이하
    maxAccessibilityIssues: 3  // 접근성 이슈 3개 이하
  }
}
```

이 가이드를 따르면 TypeDoc VitePress Sync와 최적으로 동작하는 문서화 시스템을 구축할 수 있습니다.