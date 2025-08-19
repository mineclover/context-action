# API Reference

Complete API documentation for `@context-action/typedoc-vitepress-sync`.

## Table of Contents

- [TypeDocVitePressSync](#typedocvitepresssync)
- [CacheManager](#cachemanager)
- [QualityValidator](#qualityvalidator)
- [FileProcessor](#fileprocessor)
- [MetricsCollector](#metricscollector)
- [SidebarGenerator](#sidebargenerator)
- [Types and Interfaces](#types-and-interfaces)

---

## TypeDocVitePressSync

The main class that orchestrates the synchronization process.

### Constructor

```typescript
constructor(config: SyncConfig, logger?: Logger)
```

**Parameters:**
- `config` - Configuration object (see [SyncConfig](#syncconfig))
- `logger` - Optional custom logger implementation

### Methods

#### `sync(): Promise<SyncResult>`

Performs the synchronization operation.

**Returns:** Promise resolving to [SyncResult](#syncresult)

**Example:**
```typescript
const result = await sync.sync()
console.log(`Processed ${result.filesProcessed} files`)
```

#### `autoOptimize(): void`

Automatically optimizes configuration based on system resources.

**Example:**
```typescript
sync.autoOptimize()
// Automatically sets optimal worker count and batch size
```

#### `validateConfig(): ValidationIssue[]`

Validates the current configuration.

**Returns:** Array of validation issues (empty if valid)

**Example:**
```typescript
const issues = sync.validateConfig()
if (issues.length > 0) {
  console.error('Configuration issues:', issues)
}
```

#### `clean(): Promise<void>`

Cleans cache and generated files.

**Example:**
```typescript
await sync.clean()
console.log('Cache and generated files cleaned')
```

#### `getCacheStats(): CacheStats`

Gets current cache statistics.

**Returns:** [CacheStats](#cachestats) object

**Example:**
```typescript
const stats = sync.getCacheStats()
console.log(`Cache hit rate: ${stats.hitRate}`)
```

#### `on(event: string, handler: Function): void`

Registers an event handler.

**Events:**
- `'start'` - Sync operation started
- `'fileComplete'` - Individual file processed
- `'complete'` - Sync operation completed
- `'error'` - Error occurred

**Example:**
```typescript
sync.on('fileComplete', (filePath, result) => {
  console.log(`Processed: ${filePath}`)
})
```

---

## CacheManager

Manages file caching with SHA256 hash-based change detection.

### Constructor

```typescript
constructor(config: CacheConfig, logger: Logger)
```

### Methods

#### `initialize(): Promise<void>`

Initializes the cache system.

#### `shouldProcess(sourcePath: string, targetPath: string): boolean`

Determines if a file needs processing based on cache state.

**Parameters:**
- `sourcePath` - Source file path
- `targetPath` - Target file path

**Returns:** `true` if file should be processed, `false` if cached

#### `updateCache(sourcePath: string, targetPath: string): void`

Updates cache after successful file processing.

#### `clearCache(): Promise<void>`

Clears all cache entries.

#### `getStats(): CacheStats`

Returns cache statistics.

---

## QualityValidator

Validates markdown quality, links, and accessibility.

### Constructor

```typescript
constructor(config: QualityConfig, logger: Logger)
```

### Methods

#### `validateFile(filePath: string): Promise<QualityIssues | null>`

Validates a single file for quality issues.

**Parameters:**
- `filePath` - Path to file to validate

**Returns:** QualityIssues object or null if no issues

**Example:**
```typescript
const issues = await validator.validateFile('./docs/api.md')
if (issues) {
  console.log('Issues found:', issues.issues)
}
```

#### `validateMarkdown(content: string): MarkdownIssue[]`

Validates markdown syntax.

**Issues Detected:**
- Undefined template values
- Unclosed code blocks
- Malformed tables
- Invalid heading hierarchy
- Overly long lines

#### `validateLinks(content: string, filePath: string): LinkIssue[]`

Validates internal links.

**Issues Detected:**
- Broken file references
- Empty link text
- Invalid relative paths
- Missing link targets

#### `checkAccessibility(content: string): AccessibilityIssue[]`

Checks accessibility compliance.

**Issues Detected:**
- Images without alt text
- Invalid heading hierarchy
- Improper list formatting
- Table structure issues

---

## FileProcessor

Handles parallel file processing with batching.

### Constructor

```typescript
constructor(
  config: ParallelConfig,
  cache: CacheManager,
  validator: QualityValidator,
  metrics: MetricsCollector,
  errorHandler: ErrorHandler,
  logger: Logger
)
```

### Methods

#### `processFiles(files: string[]): Promise<ProcessResult[]>`

Processes multiple files in parallel.

**Parameters:**
- `files` - Array of file paths to process

**Returns:** Array of processing results

#### `processBatch(batch: string[]): Promise<ProcessResult[]>`

Processes a batch of files.

---

## MetricsCollector

Collects and reports performance metrics.

### Constructor

```typescript
constructor(config: MetricsConfig, logger: Logger)
```

### Methods

#### `startCollection(): void`

Starts metrics collection.

#### `endCollection(): void`

Ends metrics collection and calculates final metrics.

#### `recordFile(filePath: string, cached: boolean, processingTime: number): void`

Records metrics for a single file.

#### `getMetrics(): Metrics`

Returns collected metrics.

#### `saveMetrics(outputPath?: string): Promise<void>`

Saves metrics to JSON file.

---

## SidebarGenerator

Generates VitePress sidebar configuration.

### Constructor

```typescript
constructor(logger: Logger)
```

### Methods

#### `generateSidebar(sourceDir: string, packageMapping: Record<string, string>): SidebarConfig`

Generates sidebar configuration from source files.

**Parameters:**
- `sourceDir` - Source directory path
- `packageMapping` - Package name mappings

**Returns:** VitePress sidebar configuration

#### `writeSidebarConfig(config: SidebarConfig, outputPath: string): Promise<void>`

Writes sidebar configuration to file.

---

## Types and Interfaces

### SyncConfig

```typescript
interface SyncConfig {
  sourceDir: string                        // Source directory path
  targetDir: string                        // Target directory path
  sidebarConfigPath?: string              // Sidebar config output path
  packageMapping?: Record<string, string>  // Package name mappings
  cache?: CacheConfig                     // Cache configuration
  parallel?: ParallelConfig               // Parallel processing config
  quality?: QualityConfig                 // Quality validation config
  metrics?: MetricsConfig                 // Metrics collection config
}
```

### CacheConfig

```typescript
interface CacheConfig {
  enabled?: boolean         // Enable caching (default: true)
  dir?: string             // Cache directory (default: './.typedoc-vitepress-cache')
  hashAlgorithm?: string   // Hash algorithm (default: 'sha256')
  ttl?: number            // Time to live in ms (default: 86400000)
  manifestFile?: string    // Cache manifest file name
}
```

### ParallelConfig

```typescript
interface ParallelConfig {
  enabled?: boolean    // Enable parallel processing (default: true)
  maxWorkers?: number  // Max worker threads (default: 4)
  batchSize?: number   // Files per batch (default: 10)
}
```

### QualityConfig

```typescript
interface QualityConfig {
  validateLinks?: boolean        // Validate internal links (default: true)
  validateMarkdown?: boolean     // Validate markdown syntax (default: true)
  checkAccessibility?: boolean   // Check accessibility (default: true)
}
```

### MetricsConfig

```typescript
interface MetricsConfig {
  enabled?: boolean     // Enable metrics collection (default: true)
  outputFile?: string   // Output file path (default: './reports/metrics.json')
}
```

### SyncResult

```typescript
interface SyncResult {
  filesProcessed: number      // Total files processed
  filesSkipped: number        // Files skipped (cache hits)
  processingTime: number      // Total processing time in ms
  cache: CacheStats          // Cache statistics
  quality: QualityStats      // Quality validation results
  errors: ErrorSummary       // Error and warning summary
}
```

### CacheStats

```typescript
interface CacheStats {
  hits: number          // Cache hits count
  misses: number        // Cache misses count
  expired: number       // Expired entries count
  total: number         // Total cache operations
  hitRate: string       // Hit rate percentage (e.g., "94.74%")
}
```

### QualityStats

```typescript
interface QualityStats {
  totalIssues: number               // Total files with issues
  files: QualityFileResult[]        // Per-file quality results
  markdownIssues: number           // Total markdown issues
  linkIssues: number               // Total link issues
  accessibilityIssues: number      // Total accessibility issues
}
```

### ErrorSummary

```typescript
interface ErrorSummary {
  errors: number        // Total errors
  warnings: number      // Total warnings
  files: string[]       // Files with errors
}
```

## Event Types

### SyncEvents

```typescript
interface SyncEvents {
  start: (config: SyncConfig) => void
  fileComplete: (filePath: string, result: FileResult) => void
  complete: (result: SyncResult) => void
  error: (error: Error, filePath?: string) => void
}
```

### FileResult

```typescript
interface FileResult {
  filePath: string           // File path
  cached: boolean           // Was cached
  processingTime: number    // Processing time in ms
  quality?: QualityIssues   // Quality issues if any
  error?: Error            // Error if occurred
}
```