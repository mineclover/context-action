/**
 * @fileoverview Core file processing with parallel execution support
 */

import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import type { 
  ParallelConfig,
  FileProcessResult,
  ProcessorOptions,
  Logger,
  SyncEvents 
} from '../types/index.js'
import { CacheManager } from './CacheManager.js'
import { QualityValidator } from './QualityValidator.js'
import { MetricsCollector } from './MetricsCollector.js'
import { ErrorHandler } from './ErrorHandler.js'
import { MarkdownProcessor } from '../processors/MarkdownProcessor.js'

const MAX_MARKDOWN_FILE_SIZE_BYTES = 8 * 1024 * 1024
const MAX_TRANSIENT_WRITE_ATTEMPTS = 3
const TRANSIENT_WRITE_ERROR_CODES = new Set([
  'EAGAIN',
  'EBUSY',
  'EMFILE',
  'ENFILE',
  'ETXTBSY'
])
type FileSystemError = Error & { code?: string }

export class FileProcessor {
  private config: Required<ParallelConfig>
  private cache: CacheManager
  private validator: QualityValidator
  private metrics: MetricsCollector
  private errorHandler: ErrorHandler
  private markdownProcessor: MarkdownProcessor
  private logger: Logger | undefined
  private eventEmitter: (<K extends keyof SyncEvents>(event: K, ...args: Parameters<SyncEvents[K]>) => void) | undefined
  private pendingOperations: Set<Promise<unknown>> = new Set()

  constructor(
    config: ParallelConfig,
    cache: CacheManager,
    validator: QualityValidator,
    metrics: MetricsCollector,
    errorHandler: ErrorHandler,
    logger?: Logger,
    eventEmitter?: <K extends keyof SyncEvents>(event: K, ...args: Parameters<SyncEvents[K]>) => void
  ) {
    this.config = {
      enabled: true,
      maxWorkers: 4,
      batchSize: 10,
      ...config
    }
    this.cache = cache
    this.validator = validator
    this.metrics = metrics
    this.errorHandler = errorHandler
    this.markdownProcessor = new MarkdownProcessor()
    this.logger = logger ?? undefined
    this.eventEmitter = eventEmitter ?? undefined
  }

  /**
   * Process a single file with caching and quality validation
   */
  async processFile(
    sourcePath: string, 
    targetPath: string,
    options: ProcessorOptions = {}
  ): Promise<FileProcessResult> {
    this.eventEmitter?.('fileStart', sourcePath)
    
    try {
      this.assertFileSizeWithinLimit(sourcePath)

      // Check cache first
      if (!this.cache.shouldProcess(sourcePath, targetPath)) {
        this.logger?.debug(`Cache hit: ${path.basename(sourcePath)}`)
        this.metrics.recordFile(sourcePath, true)
        const cacheResult = { success: true, cached: true }
        this.eventEmitter?.('fileComplete', sourcePath, cacheResult)
        return cacheResult
      }

      // Ensure target directory exists
      const targetDir = path.dirname(targetPath)
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true })
      }

      // Read and process file content
      let content = fs.readFileSync(sourcePath, 'utf8')
      
      // Apply markdown processing
      if (options.vueCompatibility !== false) {
        content = this.markdownProcessor.postProcessMarkdown(content)
      }

      // Write processed content
      this.writeFileWithRetry(targetPath, content)
      this.logger?.debug(`Processed: ${path.basename(sourcePath)}`)

      // Update cache
      this.cache.updateCache(sourcePath, targetPath)
      
      // Record metrics
      this.metrics.recordFile(targetPath)

      // Validate quality if enabled
      await this.validator.validateFile(targetPath)

      const successResult = { success: true, cached: false }
      this.eventEmitter?.('fileComplete', sourcePath, successResult)
      return successResult

    } catch (error) {
      const processingError = error instanceof Error ? error : new Error(String(error))
      const context = `Processing file: ${sourcePath}`

      this.eventEmitter?.('error', processingError, context)
      this.errorHandler.handleError(processingError, context)
      const errorResult = { 
        success: false, 
        cached: false, 
        error: processingError.message
      }
      this.eventEmitter?.('fileComplete', sourcePath, errorResult)
      return errorResult
    }
  }

  /**
   * Process multiple files with optional parallel execution
   */
  async processFiles(
    filePairs: Array<{ source: string; target: string }>,
    options: ProcessorOptions = {}
  ): Promise<FileProcessResult[]> {
    if (!this.config.enabled || filePairs.length < this.config.batchSize) {
      // Sequential processing
      this.logger?.debug(`Processing ${filePairs.length} files sequentially`)
      const results: FileProcessResult[] = []
      
      for (const pair of filePairs) {
        const result = await this.processFile(pair.source, pair.target, options)
        results.push(result)
      }
      
      return results
    }

    // Parallel processing
    this.logger?.debug(`Processing ${filePairs.length} files in parallel (batch size: ${this.config.batchSize})`)
    return this.processFilesInParallel(filePairs, options)
  }

  /**
   * Process files in parallel batches
   */
  private async processFilesInParallel(
    filePairs: Array<{ source: string; target: string }>,
    options: ProcessorOptions
  ): Promise<FileProcessResult[]> {
    // Split into batches
    const batches: Array<Array<{ source: string; target: string }>> = []
    for (let i = 0; i < filePairs.length; i += this.config.batchSize) {
      batches.push(filePairs.slice(i, i + this.config.batchSize))
    }

    const results: FileProcessResult[] = []

    // Process batches sequentially (but files within batch in parallel)
    for (const batch of batches) {
      const batchPromises = batch.map(pair => {
        const promise = this.processFile(pair.source, pair.target, options)
        this.pendingOperations.add(promise)
        promise.finally(() => this.pendingOperations.delete(promise))
        return promise
      })
      
      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)
    }

    return results
  }

  /**
   * Process directory recursively
   */
  async processDirectory(
    sourceDir: string,
    targetDir: string,
    options: ProcessorOptions = {}
  ): Promise<FileProcessResult[]> {
    if (!fs.existsSync(sourceDir)) {
      const message = `Source directory does not exist: ${sourceDir}`
      this.errorHandler.addWarning(message, 'processDirectory')
      this.eventEmitter?.('warning', message, 'processDirectory')
      return []
    }

    const filePairs = this.collectFilePairs(sourceDir, targetDir)
    return this.processFiles(filePairs, options)
  }

  /**
   * Collect all markdown file pairs from directory
   */
  private collectFilePairs(
    sourceDir: string,
    targetDir: string
  ): Array<{ source: string; target: string }> {
    const pairs: Array<{ source: string; target: string }> = []
    
    const collectRecursive = (currentSource: string, currentTarget: string) => {
      try {
        const items = fs.readdirSync(currentSource)
        
        for (const item of items) {
          const sourcePath = path.join(currentSource, item)
          const targetPath = path.join(currentTarget, item)
          const stat = fs.statSync(sourcePath)
          
          if (stat.isDirectory()) {
            collectRecursive(sourcePath, targetPath)
          } else if (stat.isFile() && item.endsWith('.md')) {
            pairs.push({ source: sourcePath, target: targetPath })
          }
        }
      } catch (error) {
        this.errorHandler.handleError(
          error as Error,
          `Collecting files from: ${currentSource}`
        )
      }
    }

    collectRecursive(sourceDir, targetDir)
    return pairs
  }

  /**
   * Reject inputs that would require unbounded whole-file string processing.
   */
  private assertFileSizeWithinLimit(sourcePath: string): void {
    const fileSize = fs.statSync(sourcePath).size
    if (fileSize <= MAX_MARKDOWN_FILE_SIZE_BYTES) {
      return
    }

    const error = new Error(
      `Markdown file exceeds the ${MAX_MARKDOWN_FILE_SIZE_BYTES} byte processing limit: ${sourcePath}`
    ) as FileSystemError
    error.code = 'EFBIG'
    throw error
  }

  /**
   * Retry only operating-system errors that are commonly transient.
   */
  private writeFileWithRetry(targetPath: string, content: string): void {
    for (let attempt = 1; attempt <= MAX_TRANSIENT_WRITE_ATTEMPTS; attempt++) {
      try {
        fs.writeFileSync(targetPath, content)
        return
      } catch (error) {
        const errorCode = (error as FileSystemError).code
        const shouldRetry = errorCode !== undefined
          && TRANSIENT_WRITE_ERROR_CODES.has(errorCode)
          && attempt < MAX_TRANSIENT_WRITE_ATTEMPTS

        if (!shouldRetry) {
          throw error
        }

        this.logger?.warn(
          `Transient write failure for ${targetPath}; retrying (${attempt}/${MAX_TRANSIENT_WRITE_ATTEMPTS})`
        )
      }
    }
  }

  /**
   * Get processing statistics
   */
  getStats(): {
    totalFiles: number
    successCount: number
    errorCount: number
    cacheHits: number
  } {
    const metrics = this.metrics.getCurrentMetrics()
    const errors = this.errorHandler.getSummary()
    
    return {
      totalFiles: (metrics.filesProcessed || 0) + (metrics.filesSkipped || 0),
      successCount: metrics.filesProcessed || 0,
      errorCount: errors.errors,
      cacheHits: metrics.filesSkipped || 0
    }
  }

  /**
   * Configure parallel processing options
   */
  setParallelConfig(config: Partial<ParallelConfig>): void {
    Object.assign(this.config, config)
    this.logger?.debug(`Parallel config updated:`, this.config)
  }

  /**
   * Get current parallel configuration
   */
  getParallelConfig(): Readonly<Required<ParallelConfig>> {
    return this.config
  }

  /**
   * Check if parallel processing is enabled
   */
  isParallelEnabled(): boolean {
    return this.config.enabled
  }

  /**
   * Estimate optimal batch size based on system resources
   */
  estimateOptimalBatchSize(): number {
    const cpuCount = os.cpus().length
    const memoryGB = os.totalmem() / (1024 * 1024 * 1024)
    
    // Basic heuristic: scale with CPU cores and available memory
    let optimalSize = Math.min(cpuCount * 2, Math.floor(memoryGB))
    optimalSize = Math.max(1, Math.min(optimalSize, 20)) // Clamp between 1-20
    
    this.logger?.debug(`Estimated optimal batch size: ${optimalSize} (CPU: ${cpuCount}, Memory: ${memoryGB.toFixed(1)}GB)`)
    
    return optimalSize
  }

  /**
   * Auto-configure based on system resources
   */
  autoConfigureParallel(): void {
    const optimalBatchSize = this.estimateOptimalBatchSize()
    const cpuCount = os.cpus().length
    
    this.config.batchSize = optimalBatchSize
    this.config.maxWorkers = Math.min(cpuCount, 8) // Max 8 workers
    
    this.logger?.info(`Auto-configured parallel processing: batchSize=${this.config.batchSize}, maxWorkers=${this.config.maxWorkers}`)
  }

  /**
   * Clean up resources and wait for pending operations
   */
  async destroy(): Promise<void> {
    // Wait for all pending operations to complete
    if (this.pendingOperations.size > 0) {
      await Promise.allSettled(Array.from(this.pendingOperations))
      this.pendingOperations.clear()
    }
    
    // Clear references
    this.logger = undefined
    this.eventEmitter = undefined
  }
}
