/**
 * @fileoverview Comprehensive metrics collection and reporting
 */

import fs from 'fs'
import path from 'path'
import type { 
  MetricsConfig,
  SyncResult,
  CacheStats,
  QualityStats,
  ErrorSummary,
  Logger 
} from '../types/index.js'

export class MetricsCollector {
  private config: Required<MetricsConfig>
  private startTime: number
  private metrics: Partial<SyncResult>
  private logger?: Logger

  constructor(config: MetricsConfig, logger?: Logger) {
    this.config = {
      enabled: true,
      outputFile: './reports/typedoc-vitepress-sync-metrics.json',
      ...config
    }
    this.logger = logger
    this.startTime = Date.now()
    this.metrics = {
      filesProcessed: 0,
      filesSkipped: 0,
      processingTime: 0
    }
  }

  /**
   * Record a processed file
   */
  recordFile(filePath: string, skipped: boolean = false): void {
    if (skipped) {
      this.metrics.filesSkipped = (this.metrics.filesSkipped || 0) + 1
    } else {
      this.metrics.filesProcessed = (this.metrics.filesProcessed || 0) + 1
      
      // Record file size for statistics
      try {
        const stats = fs.statSync(filePath)
        // Store additional file metrics if needed
      } catch (error) {
        this.logger?.debug(`Could not get stats for ${filePath}:`, error)
      }
    }
  }

  /**
   * Record multiple files at once
   */
  recordFiles(filePaths: string[], skipped: boolean = false): void {
    for (const filePath of filePaths) {
      this.recordFile(filePath, skipped)
    }
  }

  /**
   * Finalize metrics collection
   */
  finalize(
    cacheStats: CacheStats,
    qualityStats: QualityStats,
    errorStats: ErrorSummary
  ): SyncResult {
    this.metrics.processingTime = Date.now() - this.startTime
    this.metrics.cache = cacheStats
    this.metrics.quality = qualityStats
    this.metrics.errors = errorStats

    const result: SyncResult = {
      filesProcessed: this.metrics.filesProcessed || 0,
      filesSkipped: this.metrics.filesSkipped || 0,
      processingTime: this.metrics.processingTime || 0,
      cache: cacheStats,
      quality: qualityStats,
      errors: errorStats
    }

    if (this.config.enabled) {
      this.saveMetrics(result)
    }

    return result
  }

  /**
   * Save metrics to file
   */
  private saveMetrics(result: SyncResult): void {
    try {
      // Ensure directory exists
      const reportDir = path.dirname(this.config.outputFile)
      if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true })
      }

      // Prepare detailed metrics
      const detailedMetrics = {
        ...result,
        timestamp: new Date().toISOString(),
        performance: this.getPerformanceMetrics(result),
        summary: this.generateSummary(result),
        environment: this.getEnvironmentInfo()
      }

      fs.writeFileSync(
        this.config.outputFile,
        JSON.stringify(detailedMetrics, null, 2)
      )
      
      this.logger?.info(`📊 Metrics saved: ${this.config.outputFile}`)
    } catch (error) {
      this.logger?.error('Failed to save metrics:', error)
    }
  }

  /**
   * Calculate performance metrics
   */
  private getPerformanceMetrics(result: SyncResult): any {
    const totalFiles = result.filesProcessed + result.filesSkipped
    const processingTimeSeconds = result.processingTime / 1000
    
    return {
      totalFiles,
      filesPerSecond: processingTimeSeconds > 0 ? (totalFiles / processingTimeSeconds).toFixed(2) : '0',
      averageTimePerFile: totalFiles > 0 ? (result.processingTime / totalFiles).toFixed(2) + 'ms' : '0ms',
      cacheEfficiency: {
        hitRate: result.cache.hitRate,
        timesSaved: result.cache.hits,
        estimatedTimeSaved: this.estimateTimeSaved(result.cache.hits)
      },
      qualityScore: this.calculateQualityScore(result.quality, totalFiles)
    }
  }

  /**
   * Estimate time saved by caching
   */
  private estimateTimeSaved(cacheHits: number): string {
    // Assume each cache hit saves approximately 10ms of processing time
    const savedMs = cacheHits * 10
    if (savedMs < 1000) {
      return `${savedMs}ms`
    } else {
      return `${(savedMs / 1000).toFixed(2)}s`
    }
  }

  /**
   * Calculate quality score (0-100)
   */
  private calculateQualityScore(qualityStats: QualityStats, totalFiles: number): number {
    if (totalFiles === 0) return 100
    
    const filesWithIssues = qualityStats.totalIssues
    const qualityPercentage = ((totalFiles - filesWithIssues) / totalFiles) * 100
    
    return Math.round(qualityPercentage)
  }

  /**
   * Generate human-readable summary
   */
  private generateSummary(result: SyncResult): any {
    const totalFiles = result.filesProcessed + result.filesSkipped
    const processingTimeSeconds = (result.processingTime / 1000).toFixed(2)
    
    return {
      overview: `Processed ${totalFiles} files in ${processingTimeSeconds}s`,
      cache: `${result.cache.hitRate} cache hit rate (${result.cache.hits} hits, ${result.cache.misses} misses)`,
      quality: result.quality.totalIssues === 0 
        ? 'No quality issues found' 
        : `${result.quality.totalIssues} files with quality issues`,
      errors: result.errors.errors === 0 && result.errors.warnings === 0
        ? 'No errors or warnings'
        : `${result.errors.errors} errors, ${result.errors.warnings} warnings`,
      performance: this.getPerformanceCategory(result.processingTime, totalFiles)
    }
  }

  /**
   * Categorize performance
   */
  private getPerformanceCategory(processingTime: number, totalFiles: number): string {
    if (totalFiles === 0) return 'No files processed'
    
    const avgTimePerFile = processingTime / totalFiles
    
    if (avgTimePerFile < 5) return 'Excellent'
    if (avgTimePerFile < 20) return 'Good'
    if (avgTimePerFile < 50) return 'Fair'
    return 'Slow'
  }

  /**
   * Get environment information
   */
  private getEnvironmentInfo(): any {
    return {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB'
      },
      uptime: Math.round(process.uptime()) + 's'
    }
  }

  /**
   * Get current metrics (before finalization)
   */
  getCurrentMetrics(): Partial<SyncResult> {
    return {
      ...this.metrics,
      processingTime: Date.now() - this.startTime
    }
  }

  /**
   * Reset metrics
   */
  reset(): void {
    this.startTime = Date.now()
    this.metrics = {
      filesProcessed: 0,
      filesSkipped: 0,
      processingTime: 0
    }
  }

  /**
   * Get configuration
   */
  getConfig(): Readonly<Required<MetricsConfig>> {
    return this.config
  }

  /**
   * Check if metrics collection is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled
  }

  /**
   * Create a metrics summary for console output
   */
  createConsoleSummary(result: SyncResult): string {
    const lines = [
      '='.repeat(60),
      '✅ TypeDoc VitePress Sync Complete!',
      '='.repeat(60),
      `📄 Files processed: ${result.filesProcessed}`,
      `⏭️  Files skipped: ${result.filesSkipped}`,
      `⏱️  Processing time: ${(result.processingTime / 1000).toFixed(2)}s`,
      '',
      '📊 Cache Statistics:',
      `  - Hit rate: ${result.cache.hitRate}`,
      `  - Hits: ${result.cache.hits}`,
      `  - Misses: ${result.cache.misses}`,
      `  - Expired: ${result.cache.expired}`
    ]

    if (result.quality.totalIssues > 0) {
      lines.push(
        '',
        '⚠️ Quality Issues:',
        `  - Files with issues: ${result.quality.totalIssues}`
      )
    }

    if (result.errors.errors > 0 || result.errors.warnings > 0) {
      lines.push(
        '',
        '🚨 Errors & Warnings:',
        `  - Errors: ${result.errors.errors}`,
        `  - Warnings: ${result.errors.warnings}`
      )
    }

    if (this.config.enabled) {
      lines.push(
        '',
        '📋 Reports:',
        `  - Metrics: ${this.config.outputFile}`
      )
    }

    return lines.join('\n')
  }
}