/**
 * @fileoverview Smart caching system with SHA256 hash-based file change detection
 */

import fs from 'fs'
import crypto from 'crypto'
import type { 
  CacheConfig, 
  CacheEntry, 
  CacheManifest, 
  CacheStats,
  Logger 
} from '../types/index.js'

export class CacheManager {
  private config: Required<CacheConfig>
  private manifest: CacheManifest = {}
  private stats: Omit<CacheStats, 'hitRate'> = {
    hits: 0,
    misses: 0,
    expired: 0,
    total: 0
  }
  private logger?: Logger

  constructor(config: CacheConfig, logger?: Logger) {
    this.config = {
      enabled: true,
      dir: './.typedoc-vitepress-cache',
      hashAlgorithm: 'sha256',
      ttl: 24 * 60 * 60 * 1000, // 24 hours
      manifestFile: './.typedoc-vitepress-cache/cache-manifest.json',
      ...config
    }
    this.logger = logger
  }

  /**
   * Initialize cache system
   */
  async initialize(): Promise<void> {
    if (!this.config.enabled) {
      this.logger?.debug('Cache system disabled')
      return
    }
    
    // Create cache directory
    if (!fs.existsSync(this.config.dir)) {
      fs.mkdirSync(this.config.dir, { recursive: true })
      this.logger?.info(`Cache directory created: ${this.config.dir}`)
    }

    // Load existing manifest
    await this.loadManifest()
    
    // Clean expired entries
    this.cleanExpiredCache()
  }

  /**
   * Load cache manifest from disk
   */
  private async loadManifest(): Promise<void> {
    if (!fs.existsSync(this.config.manifestFile)) {
      this.logger?.debug('No existing cache manifest found')
      return
    }

    try {
      const data = fs.readFileSync(this.config.manifestFile, 'utf8')
      this.manifest = JSON.parse(data)
      this.logger?.info(`Cache manifest loaded: ${Object.keys(this.manifest).length} entries`)
    } catch (error) {
      this.logger?.warn('Failed to load cache manifest, starting fresh')
      this.manifest = {}
    }
  }

  /**
   * Generate hash for file content
   */
  private getFileHash(filePath: string): string | null {
    if (!fs.existsSync(filePath)) {
      return null
    }
    
    try {
      const content = fs.readFileSync(filePath)
      return crypto
        .createHash(this.config.hashAlgorithm)
        .update(content)
        .digest('hex')
    } catch (error) {
      this.logger?.error(`Failed to generate hash for ${filePath}:`, error)
      return null
    }
  }

  /**
   * Generate cache key for source-target pair
   */
  private getCacheKey(sourcePath: string, targetPath: string): string {
    return `${sourcePath}:${targetPath}`
  }

  /**
   * Check if file should be processed (cache miss) or skipped (cache hit)
   */
  shouldProcess(sourcePath: string, targetPath: string): boolean {
    if (!this.config.enabled) {
      this.stats.misses++
      this.stats.total++
      return true
    }

    const cacheKey = this.getCacheKey(sourcePath, targetPath)
    const sourceHash = this.getFileHash(sourcePath)
    
    if (!sourceHash) {
      this.stats.misses++
      this.stats.total++
      return true
    }

    const cacheEntry = this.manifest[cacheKey]
    
    // No cache entry exists
    if (!cacheEntry) {
      this.logger?.debug(`Cache miss: no entry for ${sourcePath}`)
      this.stats.misses++
      this.stats.total++
      return true
    }

    // Check TTL expiration
    const now = Date.now()
    if (now - cacheEntry.timestamp > this.config.ttl) {
      this.logger?.debug(`Cache expired for ${sourcePath}`)
      this.stats.expired++
      this.stats.total++
      delete this.manifest[cacheKey]
      return true
    }

    // Check source file hash
    if (cacheEntry.sourceHash !== sourceHash) {
      this.logger?.debug(`Cache miss: source file changed ${sourcePath}`)
      this.stats.misses++
      this.stats.total++
      return true
    }

    // Check target file exists and hash matches
    if (fs.existsSync(targetPath)) {
      const targetHash = this.getFileHash(targetPath)
      if (targetHash === cacheEntry.targetHash) {
        this.logger?.debug(`Cache hit: ${sourcePath}`)
        this.stats.hits++
        this.stats.total++
        return false // Skip processing
      }
    }

    this.logger?.debug(`Cache miss: target file missing or changed ${targetPath}`)
    this.stats.misses++
    this.stats.total++
    return true
  }

  /**
   * Update cache entry after successful processing
   */
  updateCache(sourcePath: string, targetPath: string): void {
    if (!this.config.enabled) {
      return
    }

    const cacheKey = this.getCacheKey(sourcePath, targetPath)
    const sourceHash = this.getFileHash(sourcePath)
    const targetHash = this.getFileHash(targetPath)

    if (!sourceHash || !targetHash) {
      this.logger?.warn(`Failed to update cache for ${sourcePath}: could not generate hashes`)
      return
    }

    this.manifest[cacheKey] = {
      sourceHash,
      targetHash,
      timestamp: Date.now(),
      sourcePath,
      targetPath
    }

    this.logger?.debug(`Cache updated: ${sourcePath}`)
  }

  /**
   * Clean expired cache entries
   */
  private cleanExpiredCache(): void {
    const now = Date.now()
    let cleaned = 0

    for (const [key, entry] of Object.entries(this.manifest)) {
      if (now - entry.timestamp > this.config.ttl) {
        delete this.manifest[key]
        cleaned++
      }
    }

    if (cleaned > 0) {
      this.logger?.info(`Cleaned ${cleaned} expired cache entries`)
    }
  }

  /**
   * Save cache manifest to disk
   */
  async saveManifest(): Promise<void> {
    if (!this.config.enabled) {
      return
    }

    try {
      // Ensure directory exists
      const manifestDir = require('path').dirname(this.config.manifestFile)
      if (!fs.existsSync(manifestDir)) {
        fs.mkdirSync(manifestDir, { recursive: true })
      }

      fs.writeFileSync(
        this.config.manifestFile,
        JSON.stringify(this.manifest, null, 2)
      )
      this.logger?.info(`Cache manifest saved: ${Object.keys(this.manifest).length} entries`)
    } catch (error) {
      this.logger?.error('Failed to save cache manifest:', error)
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const total = this.stats.total
    const hitRate = total > 0 ? (this.stats.hits / total * 100).toFixed(2) : '0.00'
    
    return {
      ...this.stats,
      hitRate: `${hitRate}%`
    }
  }

  /**
   * Clear all cache data
   */
  async clear(): Promise<void> {
    this.manifest = {}
    this.stats = {
      hits: 0,
      misses: 0,
      expired: 0,
      total: 0
    }

    if (fs.existsSync(this.config.manifestFile)) {
      fs.unlinkSync(this.config.manifestFile)
    }

    if (fs.existsSync(this.config.dir)) {
      fs.rmSync(this.config.dir, { recursive: true, force: true })
    }

    this.logger?.info('Cache cleared')
  }

  /**
   * Get cache configuration
   */
  getConfig(): Readonly<Required<CacheConfig>> {
    return this.config
  }

  /**
   * Get cache manifest size
   */
  getSize(): number {
    return Object.keys(this.manifest).length
  }

  /**
   * Check if cache is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled
  }
}