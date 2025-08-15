/**
 * @fileoverview Main API entry point for TypeDoc VitePress Sync
 */

import fs from 'fs'
import path from 'path'
import type { 
  SyncConfig, 
  SyncResult, 
  Logger,
  SyncEvents 
} from './types/index.js'
import { CacheManager } from './core/CacheManager.js'
import { ErrorHandler } from './core/ErrorHandler.js'
import { QualityValidator } from './core/QualityValidator.js'
import { MetricsCollector } from './core/MetricsCollector.js'
import { FileProcessor } from './core/FileProcessor.js'
import { SidebarGenerator } from './processors/SidebarGenerator.js'
import { ConsoleLogger } from './utils/ConsoleLogger.js'

export class TypeDocVitePressSync {
  private config: Required<SyncConfig>
  private cache: CacheManager
  private errorHandler: ErrorHandler
  private validator: QualityValidator
  private metrics: MetricsCollector
  private processor: FileProcessor
  private sidebarGenerator: SidebarGenerator
  private logger: Logger
  private events: Partial<SyncEvents> = {}

  constructor(config: SyncConfig, logger?: Logger) {
    this.logger = logger || new ConsoleLogger()
    this.config = this.validateAndNormalizeConfig(config)
    
    // Initialize core components
    this.cache = new CacheManager(this.config.cache, this.logger)
    this.errorHandler = new ErrorHandler(this.logger)
    this.validator = new QualityValidator(this.config.quality, this.logger)
    this.metrics = new MetricsCollector(this.config.metrics, this.logger)
    this.sidebarGenerator = new SidebarGenerator(this.logger)
    this.processor = new FileProcessor(
      this.config.parallel,
      this.cache,
      this.validator,
      this.metrics,
      this.errorHandler,
      this.logger
    )
  }

  /**
   * Validate and normalize configuration
   */
  private validateAndNormalizeConfig(config: SyncConfig): Required<SyncConfig> {
    // Validate required fields
    if (!config.sourceDir) {
      throw new Error('sourceDir is required')
    }
    if (!config.targetDir) {
      throw new Error('targetDir is required')
    }

    return {
      sourceDir: config.sourceDir,
      targetDir: config.targetDir,
      sidebarConfigPath: config.sidebarConfigPath || './docs/.vitepress/config/api-spec.ts',
      packageMapping: config.packageMapping || {
        'core': 'core',
        'react': 'react'
      },
      cache: {
        enabled: true,
        dir: './.typedoc-vitepress-cache',
        hashAlgorithm: 'sha256',
        ttl: 24 * 60 * 60 * 1000, // 24 hours
        manifestFile: './.typedoc-vitepress-cache/cache-manifest.json',
        ...config.cache
      },
      parallel: {
        enabled: true,
        maxWorkers: 4,
        batchSize: 10,
        ...config.parallel
      },
      quality: {
        validateLinks: true,
        validateMarkdown: true,
        checkAccessibility: true,
        ...config.quality
      },
      metrics: {
        enabled: true,
        outputFile: './reports/typedoc-vitepress-sync-metrics.json',
        ...config.metrics
      }
    }
  }

  /**
   * Main sync operation
   */
  async sync(): Promise<SyncResult> {
    this.logger.info('🚀 TypeDoc VitePress Sync starting...')
    this.events.start?.(this.config)

    try {
      // Initialize cache system
      await this.cache.initialize()

      // Ensure target directory exists
      if (!fs.existsSync(this.config.targetDir)) {
        fs.mkdirSync(this.config.targetDir, { recursive: true })
      }

      const allProcessedFiles: string[] = []

      // Process each package
      for (const [packageName, targetName] of Object.entries(this.config.packageMapping)) {
        const sourcePackagePath = path.join(this.config.sourceDir, 'packages', packageName)
        const targetPackagePath = path.join(this.config.targetDir, targetName)

        if (!fs.existsSync(sourcePackagePath)) {
          this.errorHandler.addWarning(
            `Package source path does not exist: ${sourcePackagePath}`,
            'sync'
          )
          continue
        }

        this.logger.info(`📦 Processing package: ${packageName}`)
        const packageFiles = await this.processor.processDirectory(
          sourcePackagePath,
          targetPackagePath
        )

        allProcessedFiles.push(...packageFiles.filter(f => f.success).map(f => f.toString()))
      }

      // Process root README if exists
      const sourceReadme = path.join(this.config.sourceDir, 'README.md')
      const targetReadme = path.join(this.config.targetDir, 'README.md')

      if (fs.existsSync(sourceReadme)) {
        const result = await this.processor.processFile(sourceReadme, targetReadme)
        if (result.success) {
          allProcessedFiles.push(targetReadme)
        }
      }

      // Generate sidebar configuration
      this.logger.info('🔍 Generating sidebar configuration...')
      const apiStructure = this.sidebarGenerator.parseApiStructure(
        this.config.targetDir,
        this.config.packageMapping
      )
      
      if (this.config.sidebarConfigPath) {
        this.sidebarGenerator.generateSidebarConfig(apiStructure, this.config.sidebarConfigPath)
      }

      // Save cache manifest
      await this.cache.saveManifest()

      // Finalize metrics
      const result = this.metrics.finalize(
        this.cache.getStats(),
        this.validator.getSummary(),
        this.errorHandler.getSummary()
      )

      // Log summary
      this.logger.info('\n' + this.metrics.createConsoleSummary(result))
      
      this.events.complete?.(result)
      return result

    } catch (error) {
      this.events.error?.(error as Error, 'sync')
      this.errorHandler.handleError(error as Error, 'sync')
      throw error
    }
  }

  /**
   * Clean cache and generated files
   */
  async clean(): Promise<void> {
    this.logger.info('🧹 Cleaning cache and generated files...')

    try {
      // Clear cache
      await this.cache.clear()

      // Remove target directory
      if (fs.existsSync(this.config.targetDir)) {
        fs.rmSync(this.config.targetDir, { recursive: true, force: true })
        this.logger.info(`Removed target directory: ${this.config.targetDir}`)
      }

      // Remove sidebar config if it was generated
      if (this.config.sidebarConfigPath && fs.existsSync(this.config.sidebarConfigPath)) {
        fs.unlinkSync(this.config.sidebarConfigPath)
        this.logger.info(`Removed sidebar config: ${this.config.sidebarConfigPath}`)
      }

      this.logger.info('✅ Cleanup completed')
    } catch (error) {
      this.errorHandler.handleError(error as Error, 'clean')
      throw error
    }
  }

  /**
   * Get current metrics without finalizing
   */
  getMetrics(): Partial<SyncResult> {
    return this.metrics.getCurrentMetrics()
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.cache.getStats()
  }

  /**
   * Get quality validation summary
   */
  getQualityStats() {
    return this.validator.getSummary()
  }

  /**
   * Get error summary
   */
  getErrorSummary() {
    return this.errorHandler.getSummary()
  }

  /**
   * Register event listeners
   */
  on<K extends keyof SyncEvents>(event: K, listener: SyncEvents[K]): void {
    this.events[event] = listener
  }

  /**
   * Configure auto-optimization based on system resources
   */
  autoOptimize(): void {
    this.processor.autoConfigureParallel()
    this.logger.info('🔧 Auto-optimization configured')
  }

  /**
   * Validate configuration
   */
  validateConfig(): Array<{ type: string; message: string }> {
    const issues: Array<{ type: string; message: string }> = []

    // Check if source directory exists
    if (!fs.existsSync(this.config.sourceDir)) {
      issues.push({
        type: 'missing-source',
        message: `Source directory does not exist: ${this.config.sourceDir}`
      })
    }

    // Check package mappings
    for (const [packageName, targetName] of Object.entries(this.config.packageMapping)) {
      const packagePath = path.join(this.config.sourceDir, 'packages', packageName)
      if (!fs.existsSync(packagePath)) {
        issues.push({
          type: 'missing-package',
          message: `Package directory does not exist: ${packagePath}`
        })
      }
    }

    // Check cache directory permissions
    if (this.config.cache.enabled && this.config.cache.dir) {
      try {
        const cacheDir = this.config.cache.dir
        if (!fs.existsSync(cacheDir)) {
          fs.mkdirSync(cacheDir, { recursive: true })
          fs.rmSync(cacheDir, { recursive: true })
        }
      } catch (error) {
        issues.push({
          type: 'cache-permission',
          message: `Cannot create cache directory: ${this.config.cache.dir}`
        })
      }
    }

    return issues
  }

  /**
   * Get configuration
   */
  getConfig(): Readonly<Required<SyncConfig>> {
    return this.config
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<SyncConfig>): void {
    this.config = this.validateAndNormalizeConfig({ ...this.config, ...updates })
    
    // Reinitialize components with new config
    this.cache = new CacheManager(this.config.cache, this.logger)
    this.validator = new QualityValidator(this.config.quality, this.logger)
    this.metrics = new MetricsCollector(this.config.metrics, this.logger)
    this.processor = new FileProcessor(
      this.config.parallel,
      this.cache,
      this.validator,
      this.metrics,
      this.errorHandler,
      this.logger
    )
  }
}

// Export types and utilities
export * from './types/index.js'
export { CacheManager } from './core/CacheManager.js'
export { ErrorHandler } from './core/ErrorHandler.js'
export { QualityValidator } from './core/QualityValidator.js'
export { MetricsCollector } from './core/MetricsCollector.js'
export { FileProcessor } from './core/FileProcessor.js'
export { MarkdownProcessor } from './processors/MarkdownProcessor.js'
export { SidebarGenerator } from './processors/SidebarGenerator.js'
export { ConsoleLogger } from './utils/ConsoleLogger.js'

// Default export
export default TypeDocVitePressSync