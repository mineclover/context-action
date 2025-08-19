# Advanced Usage Guide

This guide covers advanced features and patterns for power users of TypeDoc VitePress Sync.

## Table of Contents

- [Custom Event Handling](#custom-event-handling)
- [Performance Optimization](#performance-optimization)
- [Custom Validation Rules](#custom-validation-rules)
- [Programmatic Cache Management](#programmatic-cache-management)
- [Parallel Processing Strategies](#parallel-processing-strategies)
- [Custom Logger Implementation](#custom-logger-implementation)
- [Integration Patterns](#integration-patterns)

---

## Custom Event Handling

### Progress Tracking with Events

Create sophisticated progress tracking using the event system:

```typescript
import { TypeDocVitePressSync } from '@context-action/typedoc-vitepress-sync'
import { performance } from 'perf_hooks'

class SyncProgressTracker {
  private startTime: number = 0
  private filesProcessed: number = 0
  private cacheHits: number = 0
  private errors: string[] = []

  track(sync: TypeDocVitePressSync) {
    sync.on('start', (config) => {
      this.startTime = performance.now()
      console.log('📊 Starting sync operation...')
      console.log(`  Source: ${config.sourceDir}`)
      console.log(`  Target: ${config.targetDir}`)
    })

    sync.on('fileComplete', (filePath, result) => {
      this.filesProcessed++
      
      if (result.cached) {
        this.cacheHits++
        console.log(`  💾 Cached: ${filePath}`)
      } else {
        const time = result.processingTime.toFixed(2)
        console.log(`  ✅ Processed: ${filePath} (${time}ms)`)
      }

      if (result.quality) {
        console.log(`  ⚠️ Quality issues in ${filePath}:`)
        result.quality.issues.forEach(issue => {
          console.log(`    - ${issue.type}: ${issue.message}`)
        })
      }
    })

    sync.on('error', (error, filePath) => {
      this.errors.push(`${filePath}: ${error.message}`)
      console.error(`  ❌ Error in ${filePath}: ${error.message}`)
    })

    sync.on('complete', (result) => {
      const elapsed = ((performance.now() - this.startTime) / 1000).toFixed(2)
      const rate = ((this.cacheHits / this.filesProcessed) * 100).toFixed(1)
      
      console.log('\n📈 Sync Statistics:')
      console.log(`  Duration: ${elapsed}s`)
      console.log(`  Files: ${this.filesProcessed}`)
      console.log(`  Cache Hit Rate: ${rate}%`)
      console.log(`  Errors: ${this.errors.length}`)
      
      if (this.errors.length > 0) {
        console.log('\n❌ Errors encountered:')
        this.errors.forEach(err => console.log(`  - ${err}`))
      }
    })
  }
}

// Usage
const sync = new TypeDocVitePressSync(config)
const tracker = new SyncProgressTracker()
tracker.track(sync)
await sync.sync()
```

### Real-time Dashboard

Create a real-time dashboard for monitoring sync operations:

```typescript
import blessed from 'blessed'

class SyncDashboard {
  private screen: any
  private progressBar: any
  private logBox: any
  private statsBox: any

  constructor() {
    this.screen = blessed.screen({
      smartCSR: true,
      title: 'TypeDoc VitePress Sync Dashboard'
    })

    this.progressBar = blessed.progressbar({
      parent: this.screen,
      top: 0,
      left: 0,
      width: '100%',
      height: 3,
      border: { type: 'line' },
      label: 'Progress',
      filled: 0
    })

    this.statsBox = blessed.box({
      parent: this.screen,
      top: 3,
      left: 0,
      width: '50%',
      height: '50%',
      border: { type: 'line' },
      label: 'Statistics'
    })

    this.logBox = blessed.log({
      parent: this.screen,
      top: 3,
      left: '50%',
      width: '50%',
      height: '50%',
      border: { type: 'line' },
      label: 'Activity Log',
      scrollable: true
    })

    this.screen.render()
  }

  attachToSync(sync: TypeDocVitePressSync, totalFiles: number) {
    let processed = 0

    sync.on('fileComplete', (filePath, result) => {
      processed++
      this.progressBar.setProgress(processed / totalFiles)
      
      const status = result.cached ? 'CACHED' : 'PROCESSED'
      this.logBox.log(`[${status}] ${filePath}`)
      
      this.updateStats(processed, totalFiles)
      this.screen.render()
    })
  }

  private updateStats(processed: number, total: number) {
    const percent = ((processed / total) * 100).toFixed(1)
    this.statsBox.setContent([
      `Files Processed: ${processed}/${total}`,
      `Progress: ${percent}%`,
      `Remaining: ${total - processed}`
    ].join('\n'))
  }
}
```

---

## Performance Optimization

### System Resource-Based Configuration

Automatically configure based on available system resources:

```typescript
import os from 'os'
import { TypeDocVitePressSync } from '@context-action/typedoc-vitepress-sync'

function createOptimizedSync(baseConfig: SyncConfig): TypeDocVitePressSync {
  const cpuCount = os.cpus().length
  const totalMemory = os.totalmem()
  const freeMemory = os.freemem()
  
  // Calculate optimal settings
  const maxWorkers = Math.min(cpuCount - 1, 8) // Leave one CPU free
  const memoryPerWorker = freeMemory / maxWorkers
  const batchSize = memoryPerWorker > 500_000_000 ? 20 : 10 // 500MB threshold
  
  const optimizedConfig = {
    ...baseConfig,
    parallel: {
      enabled: true,
      maxWorkers,
      batchSize
    },
    cache: {
      ...baseConfig.cache,
      enabled: true,
      // Larger cache for systems with more memory
      ttl: totalMemory > 8_000_000_000 ? 48 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000
    }
  }
  
  console.log('🔧 Optimized Configuration:')
  console.log(`  Workers: ${maxWorkers} (from ${cpuCount} CPUs)`)
  console.log(`  Batch Size: ${batchSize}`)
  console.log(`  Cache TTL: ${optimizedConfig.cache.ttl / 3600000} hours`)
  
  return new TypeDocVitePressSync(optimizedConfig)
}
```

### Incremental Sync Strategy

Implement incremental sync for large projects:

```typescript
class IncrementalSync {
  private sync: TypeDocVitePressSync
  private lastSyncTime: Date | null = null
  private changedFiles: Set<string> = new Set()

  constructor(config: SyncConfig) {
    this.sync = new TypeDocVitePressSync(config)
    this.loadLastSyncTime()
  }

  async performIncrementalSync(): Promise<SyncResult> {
    // Watch for file changes since last sync
    const changes = await this.detectChanges()
    
    if (changes.length === 0) {
      console.log('✨ No changes detected since last sync')
      return {
        filesProcessed: 0,
        filesSkipped: 0,
        processingTime: 0,
        cache: this.sync.getCacheStats(),
        quality: { totalIssues: 0 },
        errors: { errors: 0, warnings: 0 }
      }
    }

    console.log(`📝 Detected ${changes.length} changed files`)
    
    // Process only changed files
    const result = await this.sync.syncFiles(changes)
    
    // Update last sync time
    this.lastSyncTime = new Date()
    this.saveLastSyncTime()
    
    return result
  }

  private async detectChanges(): Promise<string[]> {
    // Implementation would check file modification times
    // against lastSyncTime
    return []
  }

  private loadLastSyncTime() {
    // Load from persistent storage
  }

  private saveLastSyncTime() {
    // Save to persistent storage
  }
}
```

---

## Custom Validation Rules

### Creating Custom Validators

Extend the validation system with custom rules:

```typescript
import { QualityValidator } from '@context-action/typedoc-vitepress-sync'

class CustomValidator extends QualityValidator {
  constructor(config: QualityConfig, logger: Logger) {
    super(config, logger)
  }

  // Add custom validation for your organization's standards
  async validateCustomRules(content: string, filePath: string): Promise<CustomIssue[]> {
    const issues: CustomIssue[] = []

    // Check for required copyright header
    if (!content.startsWith('// Copyright')) {
      issues.push({
        type: 'missing-copyright',
        line: 1,
        message: 'Missing copyright header'
      })
    }

    // Check for proper JSDoc comments
    const functionPattern = /function\s+(\w+)\s*\(/g
    let match
    while ((match = functionPattern.exec(content)) !== null) {
      const funcName = match[1]
      const lineNum = content.substring(0, match.index).split('\n').length
      
      // Check if function has JSDoc above it
      const beforeFunc = content.substring(0, match.index)
      if (!beforeFunc.endsWith('*/\n')) {
        issues.push({
          type: 'missing-jsdoc',
          line: lineNum,
          message: `Function '${funcName}' missing JSDoc comment`
        })
      }
    }

    // Check for TODO comments
    const todoPattern = /\/\/\s*TODO/gi
    const todos = content.match(todoPattern) || []
    todos.forEach(todo => {
      const lineNum = content.split(todo)[0].split('\n').length
      issues.push({
        type: 'todo-comment',
        line: lineNum,
        message: 'TODO comment found - should be tracked in issue tracker'
      })
    })

    return issues
  }

  // Override the main validation method
  async validateFile(filePath: string): Promise<QualityIssues | null> {
    const baseIssues = await super.validateFile(filePath)
    const content = await fs.readFile(filePath, 'utf-8')
    const customIssues = await this.validateCustomRules(content, filePath)

    if (customIssues.length === 0 && !baseIssues) {
      return null
    }

    return {
      ...baseIssues,
      customIssues,
      totalIssues: (baseIssues?.totalIssues || 0) + customIssues.length
    }
  }
}
```

### Validation Profiles

Create different validation profiles for different scenarios:

```typescript
enum ValidationProfile {
  STRICT = 'strict',
  STANDARD = 'standard',
  LENIENT = 'lenient',
  CI_CD = 'ci-cd'
}

class ProfileBasedValidator {
  private profiles = {
    [ValidationProfile.STRICT]: {
      validateLinks: true,
      validateMarkdown: true,
      checkAccessibility: true,
      maxLineLength: 80,
      requireAltText: true,
      requireJSDoc: true
    },
    [ValidationProfile.STANDARD]: {
      validateLinks: true,
      validateMarkdown: true,
      checkAccessibility: true,
      maxLineLength: 120,
      requireAltText: true,
      requireJSDoc: false
    },
    [ValidationProfile.LENIENT]: {
      validateLinks: false,
      validateMarkdown: true,
      checkAccessibility: false,
      maxLineLength: 200,
      requireAltText: false,
      requireJSDoc: false
    },
    [ValidationProfile.CI_CD]: {
      validateLinks: true,
      validateMarkdown: true,
      checkAccessibility: true,
      maxLineLength: 100,
      requireAltText: true,
      requireJSDoc: true,
      failOnWarning: true
    }
  }

  getConfig(profile: ValidationProfile): QualityConfig {
    return this.profiles[profile]
  }
}

// Usage
const profile = process.env.CI ? ValidationProfile.CI_CD : ValidationProfile.STANDARD
const validationConfig = new ProfileBasedValidator().getConfig(profile)

const sync = new TypeDocVitePressSync({
  ...baseConfig,
  quality: validationConfig
})
```

---

## Programmatic Cache Management

### Advanced Cache Strategies

Implement sophisticated caching strategies:

```typescript
import { CacheManager } from '@context-action/typedoc-vitepress-sync'

class SmartCacheManager extends CacheManager {
  private hotFiles: Map<string, number> = new Map()
  private cacheHistory: Map<string, Date[]> = new Map()

  // Implement adaptive TTL based on file access patterns
  getAdaptiveTTL(filePath: string): number {
    const accessCount = this.hotFiles.get(filePath) || 0
    const baseT2L = 24 * 60 * 60 * 1000 // 24 hours

    // Hot files get longer TTL
    if (accessCount > 10) {
      return baseT2L * 3 // 72 hours
    } else if (accessCount > 5) {
      return baseT2L * 2 // 48 hours
    }
    
    return baseT2L
  }

  // Track file access patterns
  recordAccess(filePath: string) {
    const count = this.hotFiles.get(filePath) || 0
    this.hotFiles.set(filePath, count + 1)

    // Track access history
    const history = this.cacheHistory.get(filePath) || []
    history.push(new Date())
    this.cacheHistory.set(filePath, history)
  }

  // Predictive cache warming
  async warmCache(patterns: string[]) {
    console.log('🔥 Warming cache for common files...')
    
    for (const pattern of patterns) {
      const files = await glob(pattern)
      for (const file of files) {
        // Pre-compute hashes for frequently accessed files
        await this.computeAndStoreHash(file)
      }
    }
  }

  // Cache analytics
  getAnalytics() {
    const totalAccesses = Array.from(this.hotFiles.values())
      .reduce((sum, count) => sum + count, 0)
    
    const hotFilesList = Array.from(this.hotFiles.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
    
    return {
      totalAccesses,
      uniqueFiles: this.hotFiles.size,
      hotFiles: hotFilesList,
      averageAccessesPerFile: totalAccesses / this.hotFiles.size
    }
  }
}
```

### Cache Persistence Strategies

Implement different cache persistence strategies:

```typescript
interface CachePersistenceStrategy {
  save(data: CacheData): Promise<void>
  load(): Promise<CacheData>
  clear(): Promise<void>
}

class FileCacheStrategy implements CachePersistenceStrategy {
  constructor(private cacheDir: string) {}

  async save(data: CacheData): Promise<void> {
    const manifestPath = path.join(this.cacheDir, 'manifest.json')
    await fs.writeFile(manifestPath, JSON.stringify(data, null, 2))
  }

  async load(): Promise<CacheData> {
    const manifestPath = path.join(this.cacheDir, 'manifest.json')
    const content = await fs.readFile(manifestPath, 'utf-8')
    return JSON.parse(content)
  }

  async clear(): Promise<void> {
    await fs.rm(this.cacheDir, { recursive: true, force: true })
  }
}

class RedisCacheStrategy implements CachePersistenceStrategy {
  constructor(private redisClient: RedisClient) {}

  async save(data: CacheData): Promise<void> {
    await this.redisClient.set('typedoc-sync-cache', JSON.stringify(data))
  }

  async load(): Promise<CacheData> {
    const data = await this.redisClient.get('typedoc-sync-cache')
    return data ? JSON.parse(data) : {}
  }

  async clear(): Promise<void> {
    await this.redisClient.del('typedoc-sync-cache')
  }
}
```

---

## Parallel Processing Strategies

### Dynamic Worker Pool Management

Implement dynamic worker pool that adjusts based on load:

```typescript
class DynamicWorkerPool {
  private workers: Worker[] = []
  private queue: Task[] = []
  private activeWorkers = 0
  private maxWorkers: number
  private minWorkers = 2

  constructor(maxWorkers = 8) {
    this.maxWorkers = maxWorkers
    this.initialize()
  }

  private initialize() {
    // Start with minimum workers
    for (let i = 0; i < this.minWorkers; i++) {
      this.addWorker()
    }

    // Monitor load and adjust workers
    setInterval(() => this.adjustWorkerCount(), 5000)
  }

  private adjustWorkerCount() {
    const load = this.queue.length / this.workers.length
    
    if (load > 2 && this.workers.length < this.maxWorkers) {
      // High load - add worker
      this.addWorker()
      console.log(`📈 Added worker (total: ${this.workers.length})`)
    } else if (load < 0.5 && this.workers.length > this.minWorkers) {
      // Low load - remove worker
      this.removeWorker()
      console.log(`📉 Removed worker (total: ${this.workers.length})`)
    }
  }

  private addWorker() {
    const worker = new Worker('./processor.js')
    worker.on('message', (result) => this.handleResult(result))
    this.workers.push(worker)
  }

  private removeWorker() {
    const worker = this.workers.pop()
    worker?.terminate()
  }

  async process(task: Task): Promise<any> {
    return new Promise((resolve, reject) => {
      this.queue.push({ ...task, resolve, reject })
      this.processNext()
    })
  }

  private processNext() {
    if (this.queue.length === 0 || this.activeWorkers >= this.workers.length) {
      return
    }

    const task = this.queue.shift()
    const worker = this.workers[this.activeWorkers++]
    worker.postMessage(task)
  }
}
```

---

## Custom Logger Implementation

### Advanced Logging with Multiple Outputs

Create a custom logger with multiple output targets:

```typescript
import winston from 'winston'
import { Logger } from '@context-action/typedoc-vitepress-sync'

class MultiOutputLogger implements Logger {
  private winston: winston.Logger
  private websocket?: WebSocket
  private metricsCollector: MetricsCollector

  constructor() {
    this.winston = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      transports: [
        // Console output
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        }),
        // File output
        new winston.transports.File({
          filename: 'sync-error.log',
          level: 'error'
        }),
        new winston.transports.File({
          filename: 'sync-combined.log'
        })
      ]
    })
  }

  // Connect WebSocket for real-time monitoring
  connectWebSocket(url: string) {
    this.websocket = new WebSocket(url)
  }

  info(message: string, meta?: any) {
    this.winston.info(message, meta)
    this.broadcast('info', message, meta)
  }

  warn(message: string, meta?: any) {
    this.winston.warn(message, meta)
    this.broadcast('warn', message, meta)
  }

  error(message: string, error?: Error) {
    this.winston.error(message, { error: error?.stack })
    this.broadcast('error', message, { error: error?.message })
  }

  debug(message: string, meta?: any) {
    this.winston.debug(message, meta)
    this.broadcast('debug', message, meta)
  }

  private broadcast(level: string, message: string, meta?: any) {
    if (this.websocket?.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify({
        level,
        message,
        meta,
        timestamp: new Date().toISOString()
      }))
    }
  }
}
```

---

## Integration Patterns

### GitHub Actions Integration

Advanced GitHub Actions workflow:

```yaml
name: Documentation Sync

on:
  push:
    paths:
      - 'src/**/*.ts'
      - 'docs/**/*.md'
  workflow_dispatch:
    inputs:
      force:
        description: 'Force full sync (ignore cache)'
        required: false
        default: 'false'
      profile:
        description: 'Validation profile'
        required: false
        default: 'standard'
        type: choice
        options:
          - strict
          - standard
          - lenient

jobs:
  sync:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Cache TypeDoc output
        uses: actions/cache@v3
        with:
          path: |
            .typedoc-vitepress-cache
            docs/api/generated
          key: typedoc-${{ runner.os }}-${{ hashFiles('src/**/*.ts') }}
          restore-keys: |
            typedoc-${{ runner.os }}-
      
      - name: Install dependencies
        run: npm ci
      
      - name: Generate TypeDoc
        run: npm run docs:api
      
      - name: Sync to VitePress
        run: |
          npx typedoc-vitepress-sync sync \
            --verbose \
            ${{ github.event.inputs.force == 'true' && '--force' || '' }} \
            --profile ${{ github.event.inputs.profile || 'standard' }}
      
      - name: Upload metrics
        uses: actions/upload-artifact@v3
        with:
          name: sync-metrics
          path: reports/sync-metrics.json
      
      - name: Comment PR with results
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs');
            const metrics = JSON.parse(fs.readFileSync('reports/sync-metrics.json'));
            
            const comment = `## 📊 Documentation Sync Results
            
            - **Files Processed**: ${metrics.filesProcessed}
            - **Cache Hit Rate**: ${metrics.cache.hitRate}
            - **Processing Time**: ${(metrics.processingTime / 1000).toFixed(2)}s
            - **Quality Issues**: ${metrics.quality.totalIssues}
            
            ${metrics.quality.totalIssues > 0 ? '⚠️ Please review quality issues before merging.' : '✅ All quality checks passed!'}`;
            
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: comment
            });
```

### Monorepo Integration

Handle multiple packages in a monorepo:

```typescript
class MonorepoSync {
  private packages: string[]
  private configs: Map<string, SyncConfig> = new Map()

  constructor(private rootDir: string) {
    this.packages = this.discoverPackages()
    this.setupConfigs()
  }

  private discoverPackages(): string[] {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(this.rootDir, 'package.json'), 'utf-8')
    )
    
    if (packageJson.workspaces) {
      // Handle npm/yarn workspaces
      return glob.sync(packageJson.workspaces.packages || packageJson.workspaces)
    }
    
    // Handle lerna
    const lernaJson = JSON.parse(
      fs.readFileSync(path.join(this.rootDir, 'lerna.json'), 'utf-8')
    )
    return glob.sync(lernaJson.packages)
  }

  private setupConfigs() {
    for (const pkg of this.packages) {
      const pkgName = path.basename(pkg)
      this.configs.set(pkgName, {
        sourceDir: path.join(pkg, 'docs/api/generated'),
        targetDir: path.join(this.rootDir, 'docs/packages', pkgName, 'api'),
        packageMapping: { [pkgName]: pkgName }
      })
    }
  }

  async syncAll(): Promise<Map<string, SyncResult>> {
    const results = new Map<string, SyncResult>()
    
    console.log(`🚀 Syncing ${this.packages.length} packages...`)
    
    // Process packages in parallel
    const promises = this.packages.map(async (pkg) => {
      const pkgName = path.basename(pkg)
      const config = this.configs.get(pkgName)!
      
      console.log(`📦 Processing ${pkgName}...`)
      
      const sync = new TypeDocVitePressSync(config)
      sync.autoOptimize()
      
      const result = await sync.sync()
      results.set(pkgName, result)
      
      console.log(`✅ ${pkgName} complete (${result.filesProcessed} files)`)
      
      return result
    })
    
    await Promise.all(promises)
    
    // Generate combined sidebar
    this.generateCombinedSidebar(results)
    
    return results
  }

  private generateCombinedSidebar(results: Map<string, SyncResult>) {
    // Implementation for combined sidebar generation
  }
}

// Usage
const monorepoSync = new MonorepoSync(process.cwd())
const results = await monorepoSync.syncAll()

// Display combined statistics
let totalFiles = 0
let totalTime = 0

for (const [pkg, result] of results) {
  totalFiles += result.filesProcessed
  totalTime += result.processingTime
}

console.log('\n📊 Monorepo Sync Summary:')
console.log(`  Packages: ${results.size}`)
console.log(`  Total Files: ${totalFiles}`)
console.log(`  Total Time: ${(totalTime / 1000).toFixed(2)}s`)
```