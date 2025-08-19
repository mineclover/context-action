/**
 * @fileoverview Performance monitoring and benchmarking tests
 */

import fs from 'fs'
import path from 'path'
import { performance } from 'perf_hooks'
import { TypeDocVitePressSync } from '../src/index.js'
import { CacheManager } from '../src/core/CacheManager.js'
import type { SyncConfig, SyncResult } from '../src/types/index.js'

describe('Performance Monitoring', () => {
  const testDir = './.test-performance'
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
      enabled: true,
      maxWorkers: 4,
      batchSize: 10
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

  const createTestFiles = (count: number, contentSize = 1000) => {
    const packageDir = path.join(sourceDir, 'packages', 'test-package')
    
    for (let i = 0; i < count; i++) {
      const content = `# Test File ${i}\n\n${'Test content '.repeat(contentSize / 13)}`
      fs.writeFileSync(path.join(packageDir, `test-${i}.md`), content)
    }
  }

  describe('baseline performance metrics', () => {
    it('should meet processing time targets for small projects', async () => {
      createTestFiles(10, 500) // 10 small files
      
      const sync = new TypeDocVitePressSync(config)
      const startTime = performance.now()
      
      const result = await sync.sync()
      const endTime = performance.now()
      const processingTime = endTime - startTime
      
      expect(result.filesProcessed).toBe(10)
      expect(processingTime).toBeLessThan(5000) // Should complete within 5 seconds
      
      // Files per second calculation
      const filesPerSecond = result.filesProcessed / (processingTime / 1000)
      expect(filesPerSecond).toBeGreaterThan(5) // At least 5 files/second
    })

    it('should meet processing time targets for medium projects', async () => {
      createTestFiles(50, 1000) // 50 medium files
      
      const sync = new TypeDocVitePressSync(config)
      const startTime = performance.now()
      
      const result = await sync.sync()
      const endTime = performance.now()
      const processingTime = endTime - startTime
      
      expect(result.filesProcessed).toBe(50)
      expect(processingTime).toBeLessThan(15000) // Should complete within 15 seconds
      
      const filesPerSecond = result.filesProcessed / (processingTime / 1000)
      expect(filesPerSecond).toBeGreaterThan(10) // At least 10 files/second
    })

    it('should demonstrate cache performance improvement', async () => {
      createTestFiles(20, 1000)
      
      const sync = new TypeDocVitePressSync(config)
      
      // First run (no cache)
      const startTime1 = performance.now()
      const result1 = await sync.sync()
      const endTime1 = performance.now()
      const firstRunTime = endTime1 - startTime1
      
      expect(result1.cache.hits).toBe(0)
      expect(result1.cache.misses).toBeGreaterThan(0)
      
      // Second run (with cache)
      const startTime2 = performance.now()
      const result2 = await sync.sync()
      const endTime2 = performance.now()
      const secondRunTime = endTime2 - startTime2
      
      expect(result2.cache.hits).toBeGreaterThan(0)
      
      // Cache should provide significant improvement
      const improvement = (firstRunTime - secondRunTime) / firstRunTime
      expect(improvement).toBeGreaterThan(0.3) // At least 30% improvement
      
      console.log(`Cache performance improvement: ${(improvement * 100).toFixed(1)}%`)
    })
  })

  describe('cache performance analysis', () => {
    it('should achieve target cache hit rates', async () => {
      createTestFiles(30, 800)
      
      const sync = new TypeDocVitePressSync(config)
      
      // First run to populate cache
      await sync.sync()
      
      // Second run to test cache hits
      const result = await sync.sync()
      
      const hitRate = parseFloat(result.cache.hitRate.replace('%', ''))
      expect(hitRate).toBeGreaterThan(90) // Should achieve >90% hit rate
      
      console.log(`Cache hit rate: ${result.cache.hitRate}`)
    })

    it('should measure cache lookup performance', async () => {
      const cacheManager = new CacheManager(config.cache!)
      await cacheManager.initialize()
      
      // Prepare cache with entries
      for (let i = 0; i < 100; i++) {
        cacheManager.shouldProcess(`source-${i}`, `target-${i}`)
        cacheManager.updateCache(`source-${i}`, `target-${i}`)
      }
      
      // Measure cache lookup performance
      const lookups = 1000
      const startTime = performance.now()
      
      for (let i = 0; i < lookups; i++) {
        cacheManager.shouldProcess(`source-${i % 100}`, `target-${i % 100}`)
      }
      
      const endTime = performance.now()
      const avgLookupTime = (endTime - startTime) / lookups
      
      expect(avgLookupTime).toBeLessThan(1) // Should be less than 1ms per lookup
      console.log(`Average cache lookup time: ${avgLookupTime.toFixed(3)}ms`)
    })

    it('should handle cache size efficiently', () => {
      const cacheManager = new CacheManager(config.cache!)
      
      // Add many cache entries
      const entries = 1000
      for (let i = 0; i < entries; i++) {
        cacheManager.shouldProcess(`source-${i}`, `target-${i}`)
        cacheManager.updateCache(`source-${i}`, `target-${i}`)
      }
      
      const stats = cacheManager.getStats()
      expect(stats.total).toBe(entries)
      
      // Memory usage should be reasonable
      const sizeInMB = cacheManager.getSize() / (1024 * 1024)
      expect(sizeInMB).toBeLessThan(10) // Should use less than 10MB for 1000 entries
    })
  })

  describe('parallel processing performance', () => {
    it('should demonstrate parallel processing benefits', async () => {
      createTestFiles(40, 1500)
      
      // Sequential processing
      const sequentialConfig = {
        ...config,
        parallel: {
          enabled: false,
          maxWorkers: 1,
          batchSize: 1
        }
      }
      
      const seqSync = new TypeDocVitePressSync(sequentialConfig)
      const seqStart = performance.now()
      await seqSync.sync()
      const seqEnd = performance.now()
      const sequentialTime = seqEnd - seqStart
      
      // Clean up for parallel test
      fs.rmSync(targetDir, { recursive: true, force: true })
      fs.rmSync(cacheDir, { recursive: true, force: true })
      fs.mkdirSync(targetDir, { recursive: true })
      
      // Parallel processing
      const parallelSync = new TypeDocVitePressSync(config)
      const parStart = performance.now()
      await parallelSync.sync()
      const parEnd = performance.now()
      const parallelTime = parEnd - parStart
      
      // Parallel should be faster (though benefit may vary)
      const improvement = (sequentialTime - parallelTime) / sequentialTime
      console.log(`Parallel processing improvement: ${(improvement * 100).toFixed(1)}%`)
      
      // At minimum, parallel shouldn't be significantly slower
      expect(parallelTime).toBeLessThan(sequentialTime * 1.2)
    })

    it('should scale with worker count appropriately', async () => {
      createTestFiles(50, 1000)
      
      const workerCounts = [1, 2, 4]
      const results: { workers: number; time: number }[] = []
      
      for (const workers of workerCounts) {
        // Clean up between tests
        fs.rmSync(targetDir, { recursive: true, force: true })
        fs.rmSync(cacheDir, { recursive: true, force: true })
        fs.mkdirSync(targetDir, { recursive: true })
        
        const testConfig = {
          ...config,
          parallel: {
            enabled: true,
            maxWorkers: workers,
            batchSize: 10
          }
        }
        
        const sync = new TypeDocVitePressSync(testConfig)
        const startTime = performance.now()
        await sync.sync()
        const endTime = performance.now()
        
        results.push({
          workers,
          time: endTime - startTime
        })
      }
      
      // More workers should generally be faster (up to a point)
      expect(results[2].time).toBeLessThanOrEqual(results[0].time)
      
      console.log('Worker scaling results:', results.map(r => 
        `${r.workers} workers: ${r.time.toFixed(0)}ms`
      ))
    })
  })

  describe('memory usage monitoring', () => {
    it('should maintain reasonable memory usage', async () => {
      createTestFiles(100, 2000) // Large files to test memory
      
      const initialMemory = process.memoryUsage()
      
      const sync = new TypeDocVitePressSync(config)
      const result = await sync.sync()
      
      const finalMemory = process.memoryUsage()
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed
      
      expect(result.filesProcessed).toBe(100)
      
      // Memory increase should be reasonable (less than 100MB for 100 files)
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024)
      
      console.log(`Memory usage increase: ${(memoryIncrease / 1024 / 1024).toFixed(1)}MB`)
    })

    it('should not have significant memory leaks', async () => {
      createTestFiles(20, 1000)
      
      const initialMemory = process.memoryUsage().heapUsed
      
      // Run sync multiple times
      for (let i = 0; i < 5; i++) {
        const sync = new TypeDocVitePressSync(config)
        await sync.sync()
        
        // Force garbage collection if available
        if (global.gc) {
          global.gc()
        }
      }
      
      const finalMemory = process.memoryUsage().heapUsed
      const memoryIncrease = finalMemory - initialMemory
      
      // Memory shouldn't grow significantly with repeated operations
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024) // Less than 50MB growth
    })
  })

  describe('quality validation performance', () => {
    it('should validate files efficiently', async () => {
      // Create files with various content to test validation
      const packageDir = path.join(sourceDir, 'packages', 'test-package')
      
      for (let i = 0; i < 30; i++) {
        const content = `
# Test File ${i}

This is test content with [internal link](./test-${i + 1}.md) and 
[external link](https://example.com).

![Alt text](image-${i}.png)

## Section ${i}

More content here.
`
        fs.writeFileSync(path.join(packageDir, `validation-test-${i}.md`), content)
      }
      
      const sync = new TypeDocVitePressSync(config)
      const startTime = performance.now()
      
      const result = await sync.sync()
      const endTime = performance.now()
      const processingTime = endTime - startTime
      
      // Quality validation shouldn't significantly slow down processing
      expect(processingTime).toBeLessThan(10000) // Within 10 seconds
      
      const qualityStats = sync.getQualityStats()
      console.log(`Quality validation processed ${result.filesProcessed} files in ${processingTime.toFixed(0)}ms`)
      console.log(`Quality issues found: ${qualityStats.totalIssues}`)
    })
  })

  describe('metrics collection performance', () => {
    it('should collect metrics without significant overhead', async () => {
      createTestFiles(50, 1000)
      
      // Test with metrics enabled
      const syncWithMetrics = new TypeDocVitePressSync(config)
      const startTimeWithMetrics = performance.now()
      const resultWithMetrics = await syncWithMetrics.sync()
      const endTimeWithMetrics = performance.now()
      const timeWithMetrics = endTimeWithMetrics - startTimeWithMetrics
      
      // Clean up for next test
      fs.rmSync(targetDir, { recursive: true, force: true })
      fs.rmSync(cacheDir, { recursive: true, force: true })
      fs.mkdirSync(targetDir, { recursive: true })
      
      // Test with metrics disabled
      const configNoMetrics = {
        ...config,
        metrics: {
          enabled: false
        }
      }
      
      const syncNoMetrics = new TypeDocVitePressSync(configNoMetrics)
      const startTimeNoMetrics = performance.now()
      const resultNoMetrics = await syncNoMetrics.sync()
      const endTimeNoMetrics = performance.now()
      const timeNoMetrics = endTimeNoMetrics - startTimeNoMetrics
      
      expect(resultWithMetrics.filesProcessed).toBe(resultNoMetrics.filesProcessed)
      
      // Metrics collection should add minimal overhead (less than 20%)
      const overhead = (timeWithMetrics - timeNoMetrics) / timeNoMetrics
      expect(overhead).toBeLessThan(0.2)
      
      console.log(`Metrics collection overhead: ${(overhead * 100).toFixed(1)}%`)
    })

    it('should generate comprehensive metrics', async () => {
      createTestFiles(25, 800)
      
      const sync = new TypeDocVitePressSync(config)
      const result = await sync.sync()
      
      // Verify metrics file was created and contains expected data
      const metricsFile = config.metrics!.outputFile!
      expect(fs.existsSync(metricsFile)).toBe(true)
      
      const metricsContent = fs.readFileSync(metricsFile, 'utf8')
      const metrics = JSON.parse(metricsContent)
      
      // Verify metrics structure
      expect(metrics).toHaveProperty('filesProcessed')
      expect(metrics).toHaveProperty('processingTime')
      expect(metrics).toHaveProperty('cache')
      expect(metrics).toHaveProperty('quality')
      expect(metrics).toHaveProperty('performance')
      expect(metrics).toHaveProperty('timestamp')
      
      // Verify performance metrics
      expect(metrics.performance).toHaveProperty('filesPerSecond')
      expect(metrics.performance).toHaveProperty('averageTimePerFile')
      
      const filesPerSecond = parseFloat(metrics.performance.filesPerSecond)
      const avgTimePerFile = parseFloat(metrics.performance.averageTimePerFile.replace('ms', ''))
      
      expect(filesPerSecond).toBeGreaterThan(0)
      expect(avgTimePerFile).toBeGreaterThan(0)
      expect(avgTimePerFile).toBeLessThan(1000) // Should be less than 1 second per file
      
      console.log(`Performance metrics: ${filesPerSecond.toFixed(1)} files/sec, ${avgTimePerFile.toFixed(1)}ms/file`)
    })
  })

  describe('performance regression detection', () => {
    it('should meet documented performance targets', async () => {
      // Test against documented benchmarks
      const testCases = [
        { files: 20, maxTime: 3000, minFilesPerSec: 15 },    // Small project
        { files: 76, maxTime: 8000, minFilesPerSec: 25 },    // Medium project (like documentation example)
        { files: 100, maxTime: 12000, minFilesPerSec: 20 }   // Large project
      ]
      
      for (const testCase of testCases) {
        // Clean up between tests
        fs.rmSync(testDir, { recursive: true, force: true })
        fs.mkdirSync(testDir, { recursive: true })
        fs.mkdirSync(path.join(sourceDir, 'packages', 'test-package'), { recursive: true })
        fs.mkdirSync(targetDir, { recursive: true })
        
        createTestFiles(testCase.files, 1000)
        
        const sync = new TypeDocVitePressSync(config)
        const startTime = performance.now()
        const result = await sync.sync()
        const endTime = performance.now()
        const processingTime = endTime - startTime
        
        const filesPerSecond = result.filesProcessed / (processingTime / 1000)
        
        expect(processingTime).toBeLessThan(testCase.maxTime)
        expect(filesPerSecond).toBeGreaterThan(testCase.minFilesPerSec)
        
        console.log(`${testCase.files} files: ${processingTime.toFixed(0)}ms (${filesPerSecond.toFixed(1)} files/sec)`)
      }
    })

    it('should maintain consistent performance across runs', async () => {
      createTestFiles(30, 1000)
      
      const times: number[] = []
      const runs = 3
      
      for (let i = 0; i < runs; i++) {
        // Clean cache between runs for consistent comparison
        if (fs.existsSync(cacheDir)) {
          fs.rmSync(cacheDir, { recursive: true, force: true })
        }
        if (fs.existsSync(targetDir)) {
          fs.rmSync(targetDir, { recursive: true, force: true })
        }
        fs.mkdirSync(targetDir, { recursive: true })
        
        const sync = new TypeDocVitePressSync(config)
        const startTime = performance.now()
        await sync.sync()
        const endTime = performance.now()
        
        times.push(endTime - startTime)
      }
      
      // Calculate variance
      const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length
      const variance = times.reduce((sum, time) => sum + Math.pow(time - avgTime, 2), 0) / times.length
      const stdDev = Math.sqrt(variance)
      const coefficientOfVariation = stdDev / avgTime
      
      // Performance should be consistent (CV < 20%)
      expect(coefficientOfVariation).toBeLessThan(0.2)
      
      console.log(`Performance consistency: avg=${avgTime.toFixed(0)}ms, CV=${(coefficientOfVariation * 100).toFixed(1)}%`)
    })
  })
})