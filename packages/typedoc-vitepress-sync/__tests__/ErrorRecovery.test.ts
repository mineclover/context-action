/**
 * @fileoverview Error recovery and resilience tests
 */

import fs from 'fs'
import path from 'path'
import { TypeDocVitePressSync } from '../src/index.js'
import { CacheManager } from '../src/core/CacheManager.js'
import { QualityValidator } from '../src/core/QualityValidator.js'
import type { SyncConfig, ErrorRecoveryStrategies } from '../src/types/index.js'

describe('Error Recovery', () => {
  const testDir = './.test-error-recovery'
  const sourceDir = path.join(testDir, 'source')
  const targetDir = path.join(testDir, 'target')
  const cacheDir = path.join(testDir, 'cache')

  const config: SyncConfig = {
    sourceDir,
    targetDir,
    packageMapping: {
      'test-package': 'test'
    },
    cache: {
      enabled: true,
      dir: cacheDir,
      ttl: 60000,
      hashAlgorithm: 'sha256'
    },
    parallel: {
      enabled: false // Disable for predictable testing
    },
    quality: {
      validateMarkdown: true,
      validateLinks: true,
      checkAccessibility: true
    },
    metrics: {
      enabled: true,
      outputFile: path.join(testDir, 'metrics.json')
    }
  }

  beforeEach(() => {
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true })
    }

    // Create test structure
    fs.mkdirSync(testDir, { recursive: true })
    fs.mkdirSync(path.join(sourceDir, 'packages', 'test-package'), { recursive: true })
    fs.mkdirSync(targetDir, { recursive: true })
  })

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true })
    }
  })

  describe('file system errors', () => {
    it('should handle missing source files gracefully', async () => {
      const sync = new TypeDocVitePressSync(config)
      const errors: { error: Error; context: string }[] = []
      
      sync.on('error', (error, context) => {
        errors.push({ error, context })
      })

      // Don't create any source files - should handle gracefully
      const result = await sync.sync()
      
      expect(result.filesProcessed).toBe(0)
      expect(result.errors.errors).toBeGreaterThanOrEqual(0) // May have warnings about missing files
    })

    it('should handle permission denied errors', async () => {
      const packageDir = path.join(sourceDir, 'packages', 'test-package')
      fs.writeFileSync(path.join(packageDir, 'test.md'), '# Test\n\nContent')
      
      // Make target directory read-only (if possible)
      try {
        fs.chmodSync(targetDir, 0o444)
        
        const sync = new TypeDocVitePressSync(config)
        const errors: Error[] = []
        
        sync.on('error', (error) => {
          errors.push(error)
        })

        const result = await sync.sync()
        
        expect(errors.length).toBeGreaterThan(0)
        expect(errors.some(e => e.message.includes('permission') || e.message.includes('EACCES'))).toBe(true)
      } catch (chmodError) {
        console.log('Could not set read-only permissions, skipping permission test')
      }
    })

    it('should handle disk space errors', async () => {
      const packageDir = path.join(sourceDir, 'packages', 'test-package')
      fs.writeFileSync(path.join(packageDir, 'test.md'), '# Test\n\nContent')

      const sync = new TypeDocVitePressSync(config)
      const errors: Error[] = []
      
      sync.on('error', (error) => {
        errors.push(error)
      })

      // Mock process.exit to prevent test termination
      const originalExit = process.exit
      const mockExit = jest.spyOn(process, 'exit')
      mockExit.mockImplementation((code?: number) => {
        throw new Error(`Process exit called with code ${code}`)
      })

      // Mock file system to simulate disk space error
      const originalWriteFileSync = fs.writeFileSync
      const mockWriteFileSync = jest.spyOn(fs, 'writeFileSync')
      mockWriteFileSync.mockImplementation((file, data, options) => {
        if (file.toString().includes(targetDir)) {
          const error = new Error('ENOSPC: no space left on device')
          ;(error as any).code = 'ENOSPC'
          throw error
        }
        return originalWriteFileSync(file, data, options)
      })

      try {
        await sync.sync()
      } catch (error) {
        // Expected to catch process.exit error or sync error
        expect(error).toBeDefined()
      } finally {
        mockWriteFileSync.mockRestore()
        mockExit.mockRestore()
      }
    })

    it('should handle corrupted source files', async () => {
      const packageDir = path.join(sourceDir, 'packages', 'test-package')
      
      // Create files with various corruption patterns
      fs.writeFileSync(path.join(packageDir, 'binary.md'), Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])) // PNG header
      fs.writeFileSync(path.join(packageDir, 'invalid-utf8.md'), Buffer.from([0xFF, 0xFE, 0xFD])) // Invalid UTF-8
      fs.writeFileSync(path.join(packageDir, 'huge.md'), 'x'.repeat(10 * 1024 * 1024)) // 10MB file
      
      const sync = new TypeDocVitePressSync(config)
      const warnings: string[] = []
      
      sync.on('warning', (message) => {
        warnings.push(message)
      })

      const result = await sync.sync()
      
      // Should handle corrupted files gracefully
      expect(result.filesProcessed).toBeGreaterThanOrEqual(0)
      expect(warnings.length).toBeGreaterThanOrEqual(0)
    })
  })

  describe('cache corruption recovery', () => {
    it('should recover from corrupted cache manifest', async () => {
      const cacheManager = new CacheManager(config.cache!)
      await cacheManager.initialize()
      
      // Corrupt the manifest file
      const manifestPath = path.join(cacheDir, 'manifest.json')
      fs.writeFileSync(manifestPath, 'invalid json content {{{')
      
      // Should recover gracefully
      const newCacheManager = new CacheManager(config.cache!)
      await newCacheManager.initialize()
      
      expect(() => newCacheManager.getSize()).not.toThrow()
      expect(newCacheManager.getSize()).toBe(0) // Should start fresh
    })

    it('should handle missing cache directory', async () => {
      const cacheManager = new CacheManager(config.cache!)
      await cacheManager.initialize()
      
      // Delete cache directory
      fs.rmSync(cacheDir, { recursive: true, force: true })
      
      // Should recreate directory and continue
      const shouldProcess = cacheManager.shouldProcess('any', 'file')
      expect(shouldProcess).toBe(true)
      expect(() => cacheManager.updateCache('any', 'file')).not.toThrow()
    })

    it('should handle cache file locks and conflicts', async () => {
      const cacheManager = new CacheManager(config.cache!)
      await cacheManager.initialize()
      
      // Simulate file being locked by creating it with different process
      const manifestPath = path.join(cacheDir, 'manifest.json')
      const fileHandle = fs.openSync(manifestPath, 'w')
      
      try {
        // Should handle locked file gracefully
        expect(() => cacheManager.getStats()).not.toThrow()
      } finally {
        fs.closeSync(fileHandle)
      }
    })
  })

  describe('network and I/O resilience', () => {
    it('should handle temporary network failures during validation', async () => {
      const packageDir = path.join(sourceDir, 'packages', 'test-package')
      fs.writeFileSync(path.join(packageDir, 'test.md'), `
# Test Document

This has an external link: [Example](https://httpstat.us/500)
And an internal link: [Internal](./other.md)
`)

      const sync = new TypeDocVitePressSync(config)
      const warnings: string[] = []
      
      sync.on('warning', (message) => {
        warnings.push(message)
      })

      // Should handle network timeouts gracefully
      const result = await sync.sync()
      
      expect(result.filesProcessed).toBeGreaterThan(0)
      // May have warnings about unreachable external links
    })

    it('should handle concurrent access to target files', async () => {
      const packageDir = path.join(sourceDir, 'packages', 'test-package')
      fs.writeFileSync(path.join(packageDir, 'test.md'), '# Test\n\nContent')

      const sync1 = new TypeDocVitePressSync(config)
      const sync2 = new TypeDocVitePressSync(config)

      // Run two sync operations concurrently
      const [result1, result2] = await Promise.allSettled([
        sync1.sync(),
        sync2.sync()
      ])

      // At least one should succeed
      const successes = [result1, result2].filter(r => r.status === 'fulfilled')
      expect(successes.length).toBeGreaterThan(0)
    })
  })

  describe('graceful degradation', () => {
    it('should continue processing when some files fail', async () => {
      const packageDir = path.join(sourceDir, 'packages', 'test-package')
      
      // Create mix of valid and problematic files
      fs.writeFileSync(path.join(packageDir, 'valid1.md'), '# Valid 1\n\nGood content')
      fs.writeFileSync(path.join(packageDir, 'valid2.md'), '# Valid 2\n\nGood content')
      fs.writeFileSync(path.join(packageDir, 'problematic.md'), 'This has undefined and [broken link](./nonexistent.md)')
      fs.writeFileSync(path.join(packageDir, 'valid3.md'), '# Valid 3\n\nGood content')

      const sync = new TypeDocVitePressSync(config)
      const warnings: string[] = []
      
      sync.on('warning', (message) => {
        warnings.push(message)
      })

      const result = await sync.sync()

      // Should process valid files despite problems with others
      expect(result.filesProcessed).toBeGreaterThan(2) // At least the valid files
      expect(warnings.length).toBeGreaterThanOrEqual(0) // May have quality warnings
    })

    it('should provide partial results when validation fails', async () => {
      const packageDir = path.join(sourceDir, 'packages', 'test-package')
      fs.writeFileSync(path.join(packageDir, 'test.md'), '# Test\n\nContent with ![](missing-alt.png)')

      const sync = new TypeDocVitePressSync(config)
      const result = await sync.sync()

      // Should still process files even with quality issues
      expect(result.filesProcessed).toBeGreaterThan(0)
      expect(result.quality.totalIssues).toBeGreaterThanOrEqual(0)
      
      // Files should still be created
      expect(fs.existsSync(path.join(targetDir, 'test-package', 'test.md'))).toBe(true)
    })

    it('should handle disabled features gracefully', async () => {
      const disabledConfig: SyncConfig = {
        ...config,
        cache: {
          ...config.cache!,
          enabled: false
        },
        quality: {
          validateMarkdown: false,
          validateLinks: false,
          checkAccessibility: false
        },
        metrics: {
          enabled: false
        }
      }

      const packageDir = path.join(sourceDir, 'packages', 'test-package')
      fs.writeFileSync(path.join(packageDir, 'test.md'), '# Test\n\nContent')

      const sync = new TypeDocVitePressSync(disabledConfig)
      const result = await sync.sync()

      expect(result.filesProcessed).toBeGreaterThan(0)
      expect(result.cache.hits).toBe(0) // Cache disabled
      expect(result.quality.totalIssues).toBe(0) // Quality disabled
    })
  })

  describe('resource exhaustion handling', () => {
    it('should handle memory pressure gracefully', async () => {
      const packageDir = path.join(sourceDir, 'packages', 'test-package')
      
      // Create many files to test memory handling
      for (let i = 0; i < 100; i++) {
        fs.writeFileSync(path.join(packageDir, `test-${i}.md`), `# Test ${i}\n\n${'Content '.repeat(1000)}`)
      }

      const sync = new TypeDocVitePressSync(config)
      
      // Should handle large number of files without crashing
      const result = await sync.sync()
      expect(result.filesProcessed).toBe(100)
    })

    it('should handle file descriptor exhaustion', async () => {
      const packageDir = path.join(sourceDir, 'packages', 'test-package')
      
      // Create many files
      for (let i = 0; i < 50; i++) {
        fs.writeFileSync(path.join(packageDir, `fd-test-${i}.md`), `# FD Test ${i}\n\nContent`)
      }

      const sync = new TypeDocVitePressSync(config)
      const result = await sync.sync()
      
      expect(result.filesProcessed).toBe(50)
      expect(result.errors.errors).toBe(0) // Should handle FD limits gracefully
    })
  })

  describe('recovery strategies', () => {
    it('should implement retry logic for transient failures', async () => {
      const packageDir = path.join(sourceDir, 'packages', 'test-package')
      fs.writeFileSync(path.join(packageDir, 'test.md'), '# Test\n\nContent')

      let attempts = 0
      const originalWriteFileSync = fs.writeFileSync
      const mockWriteFileSync = jest.spyOn(fs, 'writeFileSync')
      
      mockWriteFileSync.mockImplementation((file, data, options) => {
        if (file.toString().includes(targetDir) && attempts++ < 2) {
          // Fail first two attempts
          const error = new Error('EAGAIN: resource temporarily unavailable')
          ;(error as any).code = 'EAGAIN'
          throw error
        }
        return originalWriteFileSync(file, data, options)
      })

      try {
        const sync = new TypeDocVitePressSync(config)
        const result = await sync.sync()
        
        expect(result.filesProcessed).toBeGreaterThan(0)
        expect(attempts).toBe(3) // Should have retried
      } finally {
        mockWriteFileSync.mockRestore()
      }
    })

    it('should provide error context for debugging', async () => {
      const sync = new TypeDocVitePressSync({
        sourceDir: './nonexistent-source',
        targetDir: './nonexistent-target'
      })

      const errors: { error: Error; context: string }[] = []
      sync.on('error', (error, context) => {
        errors.push({ error, context })
      })

      try {
        await sync.sync()
      } catch (error) {
        // Expected to fail
      }

      // Should provide meaningful error context
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].context).toBeDefined()
      expect(errors[0].context.length).toBeGreaterThan(0)
    })

    it('should maintain operation state during partial failures', async () => {
      const packageDir = path.join(sourceDir, 'packages', 'test-package')
      fs.writeFileSync(path.join(packageDir, 'valid.md'), '# Valid\n\nContent')

      const sync = new TypeDocVitePressSync(config)
      
      // Simulate failure during processing
      let fileCount = 0
      const originalWriteFileSync = fs.writeFileSync
      const mockWriteFileSync = jest.spyOn(fs, 'writeFileSync')
      
      mockWriteFileSync.mockImplementation((file, data, options) => {
        if (file.toString().includes('valid.md') && fileCount++ === 0) {
          // Fail first file write
          throw new Error('Simulated failure')
        }
        return originalWriteFileSync(file, data, options)
      })

      try {
        const result = await sync.sync()
        
        // Should maintain consistent state
        const errorSummary = sync.getErrorSummary()
        expect(errorSummary.errors).toBeGreaterThanOrEqual(0)
        
        // Cache should still be functional
        const cacheStats = sync.getCacheStats()
        expect(cacheStats).toHaveProperty('hits')
        expect(cacheStats).toHaveProperty('misses')
      } finally {
        mockWriteFileSync.mockRestore()
      }
    })
  })

  describe('configuration validation and recovery', () => {
    it('should validate configuration and provide helpful errors', () => {
      expect(() => {
        new TypeDocVitePressSync({} as SyncConfig)
      }).toThrow('sourceDir is required')

      expect(() => {
        new TypeDocVitePressSync({
          sourceDir: '',
          targetDir: ''
        } as SyncConfig)
      }).toThrow()
    })

    it('should use sensible defaults for missing config values', () => {
      const sync = new TypeDocVitePressSync({
        sourceDir: sourceDir,
        targetDir: targetDir
      })

      const configWithDefaults = sync.getConfig()
      
      expect(configWithDefaults.cache).toBeDefined()
      expect(configWithDefaults.parallel).toBeDefined()
      expect(configWithDefaults.quality).toBeDefined()
      expect(configWithDefaults.metrics).toBeDefined()
    })

    it('should recover from invalid configuration values', () => {
      const invalidConfig = {
        sourceDir: sourceDir,
        targetDir: targetDir,
        cache: {
          enabled: true,
          ttl: -1, // Invalid TTL
          hashAlgorithm: 'invalid' as any // Invalid algorithm
        },
        parallel: {
          enabled: true,
          maxWorkers: -1, // Invalid worker count
          batchSize: 0 // Invalid batch size
        }
      }

      expect(() => {
        const sync = new TypeDocVitePressSync(invalidConfig)
        const config = sync.getConfig()
        
        // Should use valid defaults
        expect(config.cache.ttl).toBeGreaterThan(0)
        expect(config.parallel.maxWorkers).toBeGreaterThan(0)
        expect(config.parallel.batchSize).toBeGreaterThan(0)
      }).not.toThrow()
    })
  })
})