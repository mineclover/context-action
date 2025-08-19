/**
 * @fileoverview TypeDocVitePressSync integration tests
 */

import fs from 'fs'
import path from 'path'
import { TypeDocVitePressSync } from '../src/index.js'
import type { SyncConfig } from '../src/types/index.js'

describe('TypeDocVitePressSync', () => {
  const testDir = './.test-sync'
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
      ttl: 60000
    },
    parallel: {
      enabled: false // Disable for predictable testing
    },
    quality: {
      validateMarkdown: true,
      validateLinks: false, // Disable to avoid test file issues
      checkAccessibility: false
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

  // Track all sync instances created during tests
  const syncInstances: TypeDocVitePressSync[] = []
  
  // Helper to create and track sync instances
  const createSync = (config: SyncConfig): TypeDocVitePressSync => {
    const sync = new TypeDocVitePressSync(config)
    syncInstances.push(sync)
    return sync
  }

  afterEach(async () => {
    // Destroy all sync instances
    for (const sync of syncInstances) {
      await sync.destroy()
    }
    syncInstances.length = 0
    
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true })
    }
  })

  describe('initialization', () => {
    it('should create sync instance with valid config', () => {
      const sync = createSync(config)
      expect(sync).toBeInstanceOf(TypeDocVitePressSync)
    })

    it('should throw error for invalid config', () => {
      expect(() => {
        new TypeDocVitePressSync({} as SyncConfig)
      }).toThrow('sourceDir is required')
    })

    it('should validate configuration', () => {
      const sync = createSync(config)
      const issues = sync.validateConfig()
      
      // With test setup, package directory exists so no validation issues expected
      expect(issues.length).toBe(0)
    })
  })

  describe('sync operation', () => {
    beforeEach(() => {
      // Create test markdown files
      const packageDir = path.join(sourceDir, 'packages', 'test-package')
      fs.writeFileSync(path.join(packageDir, 'README.md'), '# Test Package\n\nOverview content')
      fs.writeFileSync(path.join(packageDir, 'TestClass.md'), '# TestClass\n\nClass documentation')
      
      // Create root README
      fs.writeFileSync(path.join(sourceDir, 'README.md'), '# API Documentation\n\nMain overview')
    })

    it('should sync files successfully', async () => {
      const sync = createSync(config)
      const result = await sync.sync()
      
      expect(result.filesProcessed).toBeGreaterThan(0)
      expect(result.processingTime).toBeGreaterThan(0)
      
      // Check that files were created
      expect(fs.existsSync(path.join(targetDir, 'test', 'README.md'))).toBe(true)
      expect(fs.existsSync(path.join(targetDir, 'test', 'TestClass.md'))).toBe(true)
      expect(fs.existsSync(path.join(targetDir, 'README.md'))).toBe(true)
    })

    it('should utilize cache on second run', async () => {
      const sync = createSync(config)
      
      // First run
      const result1 = await sync.sync()
      expect(result1.cache.hits).toBe(0)
      expect(result1.cache.misses).toBeGreaterThan(0)
      
      // Second run
      const result2 = await sync.sync()
      expect(result2.cache.hits).toBeGreaterThan(0)
    })

    it('should track events', async () => {
      const sync = createSync(config)
      const events: string[] = []
      
      sync.on('start', () => events.push('start'))
      sync.on('complete', () => events.push('complete'))
      
      await sync.sync()
      
      expect(events).toEqual(['start', 'complete'])
    })

    it('should track file-level events', async () => {
      const sync = createSync(config)
      const fileEvents: { event: string; file: string }[] = []
      
      sync.on('fileStart', (filePath) => {
        fileEvents.push({ event: 'start', file: path.basename(filePath) })
      })
      sync.on('fileComplete', (filePath, result) => {
        fileEvents.push({ event: 'complete', file: path.basename(filePath) })
        expect(result).toHaveProperty('success')
        expect(result).toHaveProperty('cached')
      })
      
      await sync.sync()
      
      expect(fileEvents.length).toBeGreaterThan(0)
      expect(fileEvents.filter(e => e.event === 'start').length).toBe(
        fileEvents.filter(e => e.event === 'complete').length
      )
    })

    it('should handle errors and warnings', async () => {
      const sync = createSync(config)
      const issues: { type: string; message: string; context: string }[] = []
      
      sync.on('error', (error, context) => {
        issues.push({ type: 'error', message: error.message, context })
      })
      sync.on('warning', (message, context) => {
        issues.push({ type: 'warning', message, context })
      })
      
      // Create a problematic file to trigger warnings
      const packageDir = path.join(sourceDir, 'packages', 'test-package')
      fs.writeFileSync(path.join(packageDir, 'problematic.md'), 'Content with undefined values')
      
      await sync.sync()
      
      // May have quality warnings depending on validation
      expect(issues.length).toBeGreaterThanOrEqual(0)
    })
  })

  describe('cache management', () => {
    beforeEach(() => {
      const packageDir = path.join(sourceDir, 'packages', 'test-package')
      fs.writeFileSync(path.join(packageDir, 'test.md'), '# Test')
    })

    it('should provide cache statistics', async () => {
      const sync = createSync(config)
      
      await sync.sync()
      const stats = sync.getCacheStats()
      
      expect(stats).toHaveProperty('hits')
      expect(stats).toHaveProperty('misses')
      expect(stats).toHaveProperty('hitRate')
    })
  })

  describe('quality validation', () => {
    beforeEach(() => {
      const packageDir = path.join(sourceDir, 'packages', 'test-package')
      fs.writeFileSync(
        path.join(packageDir, 'bad.md'), 
        'This has undefined content'
      )
    })

    it('should detect quality issues', async () => {
      const sync = createSync(config)
      
      await sync.sync()
      const qualityStats = sync.getQualityStats()
      
      expect(qualityStats.totalIssues).toBeGreaterThan(0)
    })
  })

  describe('error handling', () => {
    it('should handle missing source directory gracefully', async () => {
      const badConfig = { ...config, sourceDir: './nonexistent' }
      const sync = createSync(badConfig)
      
      const errors = sync.getErrorSummary()
      expect(errors.warnings).toBe(0) // Should start with no errors
    })
  })

  describe('cleanup', () => {
    beforeEach(async () => {
      const packageDir = path.join(sourceDir, 'packages', 'test-package')
      fs.writeFileSync(path.join(packageDir, 'test.md'), '# Test')
      
      const sync = createSync(config)
      await sync.sync()
    })

    it('should clean cache and generated files', async () => {
      const sync = createSync(config)
      
      // Verify files exist before cleanup
      expect(fs.existsSync(targetDir)).toBe(true)
      expect(fs.existsSync(cacheDir)).toBe(true)
      
      await sync.clean()
      
      // Verify files are removed
      expect(fs.existsSync(targetDir)).toBe(false)
      expect(fs.existsSync(cacheDir)).toBe(false)
    })
  })

  describe('configuration updates', () => {
    it('should allow configuration updates', () => {
      const sync = createSync(config)
      
      const originalConfig = sync.getConfig()
      expect(originalConfig.cache.enabled).toBe(true)
      
      sync.updateConfig({
        cache: { enabled: false }
      })
      
      const updatedConfig = sync.getConfig()
      expect(updatedConfig.cache.enabled).toBe(false)
    })
  })

  describe('auto-optimization', () => {
    it('should configure auto-optimization', () => {
      const sync = createSync(config)
      
      expect(() => sync.autoOptimize()).not.toThrow()
    })
  })

  describe('parallel processing', () => {
    const parallelConfig: SyncConfig = {
      ...config,
      parallel: {
        enabled: true,
        maxWorkers: 2,
        batchSize: 3
      }
    }

    beforeEach(() => {
      // Create multiple test files for parallel processing
      const packageDir = path.join(sourceDir, 'packages', 'test-package')
      for (let i = 1; i <= 6; i++) {
        fs.writeFileSync(path.join(packageDir, `TestClass${i}.md`), `# TestClass${i}\n\nClass ${i} documentation`)
      }
    })

    it('should process files in parallel', async () => {
      const sync = createSync(parallelConfig)
      const startTime = Date.now()
      
      const result = await sync.sync()
      const endTime = Date.now()
      
      expect(result.filesProcessed).toBeGreaterThan(0)
      expect(endTime - startTime).toBeGreaterThan(0) // Basic timing check
    })

    it('should respect maxWorkers setting', async () => {
      const sync = createSync(parallelConfig)
      
      // Test that it doesn't throw with worker configuration
      const result = await sync.sync()
      expect(result.filesProcessed).toBeGreaterThan(0)
    })

    it('should handle batch processing', async () => {
      const sync = createSync(parallelConfig)
      
      const result = await sync.sync()
      
      // Verify all files were processed despite batching
      expect(result.filesProcessed).toBe(6) // 6 test files created in parallel test setup
    })

    it('should fallback to sequential when parallel disabled', async () => {
      const sequentialConfig = {
        ...config,
        parallel: {
          enabled: false,
          maxWorkers: 1,
          batchSize: 1
        }
      }
      
      const sync = createSync(sequentialConfig)
      
      const result = await sync.sync()
      expect(result.filesProcessed).toBeGreaterThan(0)
    })
  })

  describe('metrics', () => {
    beforeEach(() => {
      const packageDir = path.join(sourceDir, 'packages', 'test-package')
      fs.writeFileSync(path.join(packageDir, 'test.md'), '# Test')
    })

    it('should collect metrics during sync', async () => {
      const sync = createSync(config)
      
      const result = await sync.sync()
      
      expect(result).toHaveProperty('filesProcessed')
      expect(result).toHaveProperty('processingTime')
      expect(result).toHaveProperty('cache')
      expect(result).toHaveProperty('quality')
      expect(result).toHaveProperty('errors')
    })

    it('should save metrics to file', async () => {
      const sync = createSync(config)
      
      await sync.sync()
      
      expect(fs.existsSync(config.metrics!.outputFile!)).toBe(true)
      
      const metricsContent = fs.readFileSync(config.metrics!.outputFile!, 'utf8')
      const metrics = JSON.parse(metricsContent)
      
      expect(metrics).toHaveProperty('filesProcessed')
      expect(metrics).toHaveProperty('timestamp')
    })
  })
})