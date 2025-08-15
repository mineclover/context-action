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

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true })
    }
  })

  describe('initialization', () => {
    it('should create sync instance with valid config', () => {
      const sync = new TypeDocVitePressSync(config)
      expect(sync).toBeInstanceOf(TypeDocVitePressSync)
    })

    it('should throw error for invalid config', () => {
      expect(() => {
        new TypeDocVitePressSync({} as SyncConfig)
      }).toThrow('sourceDir is required')
    })

    it('should validate configuration', () => {
      const sync = new TypeDocVitePressSync(config)
      const issues = sync.validateConfig()
      
      // Should have issue for missing package directory
      expect(issues.length).toBeGreaterThan(0)
      expect(issues.some(issue => issue.type === 'missing-package')).toBe(true)
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
      const sync = new TypeDocVitePressSync(config)
      const result = await sync.sync()
      
      expect(result.filesProcessed).toBeGreaterThan(0)
      expect(result.processingTime).toBeGreaterThan(0)
      
      // Check that files were created
      expect(fs.existsSync(path.join(targetDir, 'test', 'README.md'))).toBe(true)
      expect(fs.existsSync(path.join(targetDir, 'test', 'TestClass.md'))).toBe(true)
      expect(fs.existsSync(path.join(targetDir, 'README.md'))).toBe(true)
    })

    it('should utilize cache on second run', async () => {
      const sync = new TypeDocVitePressSync(config)
      
      // First run
      const result1 = await sync.sync()
      expect(result1.cache.hits).toBe(0)
      expect(result1.cache.misses).toBeGreaterThan(0)
      
      // Second run
      const result2 = await sync.sync()
      expect(result2.cache.hits).toBeGreaterThan(0)
    })

    it('should track events', async () => {
      const sync = new TypeDocVitePressSync(config)
      const events: string[] = []
      
      sync.on('start', () => events.push('start'))
      sync.on('complete', () => events.push('complete'))
      
      await sync.sync()
      
      expect(events).toEqual(['start', 'complete'])
    })
  })

  describe('cache management', () => {
    beforeEach(() => {
      const packageDir = path.join(sourceDir, 'packages', 'test-package')
      fs.writeFileSync(path.join(packageDir, 'test.md'), '# Test')
    })

    it('should provide cache statistics', async () => {
      const sync = new TypeDocVitePressSync(config)
      
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
      const sync = new TypeDocVitePressSync(config)
      
      await sync.sync()
      const qualityStats = sync.getQualityStats()
      
      expect(qualityStats.totalIssues).toBeGreaterThan(0)
    })
  })

  describe('error handling', () => {
    it('should handle missing source directory gracefully', async () => {
      const badConfig = { ...config, sourceDir: './nonexistent' }
      const sync = new TypeDocVitePressSync(badConfig)
      
      const errors = sync.getErrorSummary()
      expect(errors.warnings).toBe(0) // Should start with no errors
    })
  })

  describe('cleanup', () => {
    beforeEach(async () => {
      const packageDir = path.join(sourceDir, 'packages', 'test-package')
      fs.writeFileSync(path.join(packageDir, 'test.md'), '# Test')
      
      const sync = new TypeDocVitePressSync(config)
      await sync.sync()
    })

    it('should clean cache and generated files', async () => {
      const sync = new TypeDocVitePressSync(config)
      
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
      const sync = new TypeDocVitePressSync(config)
      
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
      const sync = new TypeDocVitePressSync(config)
      
      expect(() => sync.autoOptimize()).not.toThrow()
    })
  })

  describe('metrics', () => {
    beforeEach(() => {
      const packageDir = path.join(sourceDir, 'packages', 'test-package')
      fs.writeFileSync(path.join(packageDir, 'test.md'), '# Test')
    })

    it('should collect metrics during sync', async () => {
      const sync = new TypeDocVitePressSync(config)
      
      const result = await sync.sync()
      
      expect(result).toHaveProperty('filesProcessed')
      expect(result).toHaveProperty('processingTime')
      expect(result).toHaveProperty('cache')
      expect(result).toHaveProperty('quality')
      expect(result).toHaveProperty('errors')
    })

    it('should save metrics to file', async () => {
      const sync = new TypeDocVitePressSync(config)
      
      await sync.sync()
      
      expect(fs.existsSync(config.metrics!.outputFile!)).toBe(true)
      
      const metricsContent = fs.readFileSync(config.metrics!.outputFile!, 'utf8')
      const metrics = JSON.parse(metricsContent)
      
      expect(metrics).toHaveProperty('filesProcessed')
      expect(metrics).toHaveProperty('timestamp')
    })
  })
})