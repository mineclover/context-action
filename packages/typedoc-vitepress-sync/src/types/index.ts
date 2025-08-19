/**
 * @fileoverview Type definitions for TypeDoc VitePress Sync
 */

// =============================
// Core Configuration Types
// =============================

export interface SyncConfig {
  /** Source directory containing TypeDoc generated JSON */
  sourceDir: string
  /** Target directory for VitePress markdown files */
  targetDir: string
  /** VitePress sidebar configuration file path */
  sidebarConfigPath?: string
  /** Package mapping configuration */
  packageMapping?: Record<string, string>
  /** Cache configuration */
  cache?: CacheConfig
  /** Parallel processing configuration */
  parallel?: ParallelConfig
  /** Quality validation configuration */
  quality?: QualityConfig
  /** Metrics collection configuration */
  metrics?: MetricsConfig
}

export interface CacheConfig {
  /** Enable caching system */
  enabled?: boolean
  /** Cache directory path */
  dir?: string
  /** Hash algorithm for file change detection */
  hashAlgorithm?: 'sha256' | 'sha1' | 'md5'
  /** Time to live in milliseconds */
  ttl?: number
  /** Cache manifest file path */
  manifestFile?: string
}

export interface ParallelConfig {
  /** Enable parallel processing */
  enabled?: boolean
  /** Maximum number of worker threads */
  maxWorkers?: number
  /** Batch size for parallel processing */
  batchSize?: number
}

export interface QualityConfig {
  /** Validate internal links */
  validateLinks?: boolean
  /** Validate markdown syntax */
  validateMarkdown?: boolean
  /** Check accessibility compliance */
  checkAccessibility?: boolean
}

export interface MetricsConfig {
  /** Enable metrics collection */
  enabled?: boolean
  /** Output file path for metrics */
  outputFile?: string
}

// =============================
// Processing Result Types
// =============================

export interface SyncResult {
  /** Total files processed */
  filesProcessed: number
  /** Files skipped due to cache */
  filesSkipped: number
  /** Processing time in milliseconds */
  processingTime: number
  /** Cache statistics */
  cache: CacheStats
  /** Quality validation results */
  quality: QualityStats
  /** Error and warning summary */
  errors: ErrorSummary
}

export interface CacheStats {
  /** Cache hits count */
  hits: number
  /** Cache misses count */
  misses: number
  /** Expired cache entries count */
  expired: number
  /** Total cache operations */
  total: number
  /** Cache hit rate percentage */
  hitRate: string
}

export interface QualityStats {
  /** Total number of files with issues */
  totalIssues: number
  /** Detailed issue information per file */
  files: QualityIssue[]
}

export interface QualityIssue {
  /** File path with issues */
  file: string
  /** List of issues found */
  issues: string[]
}

export interface ErrorSummary {
  /** Number of errors */
  errors: number
  /** Number of warnings */
  warnings: number
  /** Detailed error information */
  details: {
    errors: ErrorInfo[]
    warnings: WarningInfo[]
  }
}

export interface ErrorInfo {
  /** Error message */
  message: string
  /** Error code */
  code?: string
  /** Context where error occurred */
  context: string
  /** Timestamp of error */
  timestamp: string
  /** Error stack trace */
  stack?: string
}

export interface WarningInfo {
  /** Warning message */
  message: string
  /** Context where warning occurred */
  context: string
  /** Timestamp of warning */
  timestamp: string
}

// =============================
// Cache System Types
// =============================

export interface CacheEntry {
  /** Hash of source file */
  sourceHash: string
  /** Hash of target file */
  targetHash: string
  /** Timestamp when cached */
  timestamp: number
  /** Source file path */
  sourcePath: string
  /** Target file path */
  targetPath: string
}

export interface CacheManifest {
  [key: string]: CacheEntry
}

// =============================
// File Processing Types
// =============================

export interface FileProcessResult {
  /** Whether processing was successful */
  success: boolean
  /** Whether file was served from cache */
  cached: boolean
  /** Error information if failed */
  error?: string
}

export interface ProcessorOptions {
  /** Enable Vue compatibility processing */
  vueCompatibility?: boolean
  /** Custom display name mappings */
  displayNameMappings?: Record<string, string>
}

// =============================
// API Structure Types
// =============================

export interface ApiStructure {
  [packageName: string]: {
    text: string
    items: ApiItem[]
  }
}

export interface ApiItem {
  /** Display text for the item */
  text: string
  /** Relative path to the documentation */
  path: string
}

export interface SidebarItem {
  /** Display text */
  text: string
  /** Link URL */
  link: string
}

export interface SidebarSection {
  /** Section title */
  text: string
  /** Whether section is collapsed by default */
  collapsed: boolean
  /** Items in the section */
  items: SidebarItem[]
}

// =============================
// CLI Types
// =============================

export interface CliOptions {
  /** Configuration file path */
  config?: string
  /** Source directory override */
  source?: string
  /** Target directory override */
  target?: string
  /** Enable verbose output */
  verbose?: boolean
  /** Disable caching */
  noCache?: boolean
  /** Force processing all files */
  force?: boolean
  /** Output format for results */
  output?: 'json' | 'text'
}

// =============================
// Event Types
// =============================

export interface SyncEvents {
  /** Emitted when sync starts */
  start: (config: SyncConfig) => void
  /** Emitted when file processing starts */
  fileStart: (filePath: string) => void
  /** Emitted when file processing completes */
  fileComplete: (filePath: string, result: FileProcessResult) => void
  /** Emitted when sync completes */
  complete: (result: SyncResult) => void
  /** Emitted on errors */
  error: (error: Error, context: string) => void
  /** Emitted on warnings */
  warning: (message: string, context: string) => void
}

// =============================
// Utility Types
// =============================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface Logger {
  debug(message: string, ...args: unknown[]): void
  info(message: string, ...args: unknown[]): void
  warn(message: string, ...args: unknown[]): void
  error(message: string, ...args: unknown[]): void
}

export type RecoveryStrategy = {
  message: string
  action: () => unknown
}

export type ErrorRecoveryStrategies = {
  [errorCode: string]: RecoveryStrategy
}