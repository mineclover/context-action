/**
 * @fileoverview CacheManager tests
 */

import fs from 'fs'
import path from 'path'
import { CacheManager } from '../src/core/CacheManager.js'
import type { CacheConfig } from '../src/types/index.js'

describe('CacheManager', () => {
  const testCacheDir = './.test-cache'
  const testConfig: CacheConfig = {
    enabled: true,
    dir: testCacheDir,
    hashAlgorithm: 'sha256',
    ttl: 1000, // 1 second for testing
    manifestFile: path.join(testCacheDir, 'manifest.json')
  }

  let cacheManager: CacheManager

  beforeEach(async () => {
    // Clean up test cache directory
    if (fs.existsSync(testCacheDir)) {
      fs.rmSync(testCacheDir, { recursive: true, force: true })
    }
    
    cacheManager = new CacheManager(testConfig)
    await cacheManager.initialize()
  })

  afterEach(() => {
    // Clean up test cache directory
    if (fs.existsSync(testCacheDir)) {
      fs.rmSync(testCacheDir, { recursive: true, force: true })
    }
  })

  describe('initialization', () => {
    it('should create cache directory', () => {
      expect(fs.existsSync(testCacheDir)).toBe(true)
    })

    it('should handle missing manifest file', async () => {
      expect(() => cacheManager.getSize()).not.toThrow()
      expect(cacheManager.getSize()).toBe(0)
    })
  })

  describe('file processing', () => {
    const testSourceFile = path.join(testCacheDir, 'source.txt')
    const testTargetFile = path.join(testCacheDir, 'target.txt')

    beforeEach(() => {
      fs.writeFileSync(testSourceFile, 'test content')
      fs.writeFileSync(testTargetFile, 'test content')
    })

    it('should indicate file needs processing on first check', () => {
      const shouldProcess = cacheManager.shouldProcess(testSourceFile, testTargetFile)
      expect(shouldProcess).toBe(true)
    })

    it('should update cache after processing', () => {
      cacheManager.shouldProcess(testSourceFile, testTargetFile)
      cacheManager.updateCache(testSourceFile, testTargetFile)
      
      expect(cacheManager.getSize()).toBe(1)
    })

    it('should indicate cache hit after update', () => {
      // First check - should process
      cacheManager.shouldProcess(testSourceFile, testTargetFile)
      cacheManager.updateCache(testSourceFile, testTargetFile)
      
      // Second check - should use cache
      const shouldProcess = cacheManager.shouldProcess(testSourceFile, testTargetFile)
      expect(shouldProcess).toBe(false)
    })

    it('should detect file changes', () => {
      // Cache the file
      cacheManager.shouldProcess(testSourceFile, testTargetFile)
      cacheManager.updateCache(testSourceFile, testTargetFile)
      
      // Modify source file
      fs.writeFileSync(testSourceFile, 'modified content')
      
      // Should need processing again
      const shouldProcess = cacheManager.shouldProcess(testSourceFile, testTargetFile)
      expect(shouldProcess).toBe(true)
    })
  })

  describe('TTL expiration', () => {
    const testSourceFile = path.join(testCacheDir, 'source.txt')
    const testTargetFile = path.join(testCacheDir, 'target.txt')

    beforeEach(() => {
      fs.writeFileSync(testSourceFile, 'test content')
      fs.writeFileSync(testTargetFile, 'test content')
    })

    it('should expire cache entries after TTL', async () => {
      // Cache the file
      cacheManager.shouldProcess(testSourceFile, testTargetFile)
      cacheManager.updateCache(testSourceFile, testTargetFile)
      
      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 1100))
      
      // Should need processing again due to expiration
      const shouldProcess = cacheManager.shouldProcess(testSourceFile, testTargetFile)
      expect(shouldProcess).toBe(true)
    })
  })

  describe('cache statistics', () => {
    const testSourceFile = path.join(testCacheDir, 'source.txt')
    const testTargetFile = path.join(testCacheDir, 'target.txt')

    beforeEach(() => {
      fs.writeFileSync(testSourceFile, 'test content')
      fs.writeFileSync(testTargetFile, 'test content')
    })

    it('should track cache misses', () => {
      cacheManager.shouldProcess(testSourceFile, testTargetFile)
      
      const stats = cacheManager.getStats()
      expect(stats.misses).toBe(1)
      expect(stats.hits).toBe(0)
      expect(stats.total).toBe(1)
    })

    it('should track cache hits', () => {
      // First access - miss
      cacheManager.shouldProcess(testSourceFile, testTargetFile)
      cacheManager.updateCache(testSourceFile, testTargetFile)
      
      // Second access - hit
      cacheManager.shouldProcess(testSourceFile, testTargetFile)
      
      const stats = cacheManager.getStats()
      expect(stats.hits).toBe(1)
      expect(stats.misses).toBe(1)
      expect(stats.total).toBe(2)
      expect(stats.hitRate).toBe('50.00%')
    })
  })

  describe('manifest persistence', () => {
    const testSourceFile = path.join(testCacheDir, 'source.txt')
    const testTargetFile = path.join(testCacheDir, 'target.txt')

    beforeEach(() => {
      fs.writeFileSync(testSourceFile, 'test content')
      fs.writeFileSync(testTargetFile, 'test content')
    })

    it('should save and load manifest', async () => {
      // Cache a file
      cacheManager.shouldProcess(testSourceFile, testTargetFile)
      cacheManager.updateCache(testSourceFile, testTargetFile)
      
      // Save manifest
      await cacheManager.saveManifest()
      
      // Create new cache manager
      const newCacheManager = new CacheManager(testConfig)
      await newCacheManager.initialize()
      
      // Should load cached entry
      const shouldProcess = newCacheManager.shouldProcess(testSourceFile, testTargetFile)
      expect(shouldProcess).toBe(false)
    })
  })

  describe('disabled cache', () => {
    it('should always indicate processing needed when disabled', async () => {
      const disabledConfig = { ...testConfig, enabled: false }
      const disabledCache = new CacheManager(disabledConfig)
      await disabledCache.initialize()
      
      const shouldProcess = disabledCache.shouldProcess('any', 'files')
      expect(shouldProcess).toBe(true)
    })
  })

  describe('cache clearing', () => {
    it('should clear all cache data', async () => {
      const testSourceFile = path.join(testCacheDir, 'source.txt')
      const testTargetFile = path.join(testCacheDir, 'target.txt')
      
      fs.writeFileSync(testSourceFile, 'test content')
      fs.writeFileSync(testTargetFile, 'test content')
      
      // Cache a file
      cacheManager.shouldProcess(testSourceFile, testTargetFile)
      cacheManager.updateCache(testSourceFile, testTargetFile)
      
      expect(cacheManager.getSize()).toBe(1)
      
      // Clear cache
      await cacheManager.clear()
      
      expect(cacheManager.getSize()).toBe(0)
      expect(fs.existsSync(testCacheDir)).toBe(false)
    })
  })
})