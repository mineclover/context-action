#!/usr/bin/env node

/**
 * @fileoverview Advanced configuration example for TypeDoc VitePress Sync
 */

import { TypeDocVitePressSync, ConsoleLogger } from '../../dist/index.js'

async function advancedExample() {
  console.log('🚀 Advanced TypeDoc VitePress Sync Example\n')

  // Advanced configuration with all options
  const config = {
    sourceDir: './docs/api/generated',
    targetDir: './docs/en/api',
    sidebarConfigPath: './docs/.vitepress/config/api-spec.ts',
    packageMapping: {
      'core': 'core',
      'react': 'react',
      'utils': 'utilities',
      'types': 'type-definitions'
    },
    cache: {
      enabled: true,
      dir: './.typedoc-vitepress-cache',
      hashAlgorithm: 'sha256',
      ttl: 2 * 60 * 60 * 1000, // 2 hours
      manifestFile: './.typedoc-vitepress-cache/advanced-manifest.json'
    },
    parallel: {
      enabled: true,
      maxWorkers: 6,
      batchSize: 15
    },
    quality: {
      validateLinks: true,
      validateMarkdown: true,
      checkAccessibility: true
    },
    metrics: {
      enabled: true,
      outputFile: './reports/advanced-sync-metrics.json'
    }
  }

  console.log('📋 Advanced Configuration:')
  console.log(JSON.stringify(config, null, 2))
  console.log()

  // Create custom logger with debug level
  const logger = new ConsoleLogger('debug', true)

  // Create sync instance with custom logger
  const sync = new TypeDocVitePressSync(config, logger)

  // Validate configuration
  console.log('🔍 Validating configuration...')
  const issues = sync.validateConfig()
  
  if (issues.length > 0) {
    console.log('⚠️ Configuration issues:')
    for (const issue of issues) {
      console.log(`  - ${issue.type}: ${issue.message}`)
    }
  } else {
    console.log('✅ Configuration is valid')
  }
  console.log()

  // Display current configuration details
  const currentConfig = sync.getConfig()
  console.log('⚙️ Active Configuration:')
  console.log(`  Cache: ${currentConfig.cache.enabled ? 'enabled' : 'disabled'} (${currentConfig.cache.dir})`)
  console.log(`  Parallel: ${currentConfig.parallel.enabled ? 'enabled' : 'disabled'} (${currentConfig.parallel.maxWorkers} workers)`)
  console.log(`  Quality checks: ${Object.values(currentConfig.quality).filter(Boolean).length}/3 enabled`)
  console.log(`  Metrics: ${currentConfig.metrics.enabled ? 'enabled' : 'disabled'}`)
  console.log()

  // Set up comprehensive event monitoring
  const events = {
    start: 0,
    fileStart: 0,
    fileComplete: 0,
    complete: 0,
    errors: 0,
    warnings: 0
  }

  sync.on('start', (config) => {
    events.start++
    console.log('🎯 Sync operation started')
    console.log(`  Source: ${config.sourceDir}`)
    console.log(`  Target: ${config.targetDir}`)
    console.log(`  Packages: ${Object.keys(config.packageMapping).join(', ')}`)
  })

  sync.on('fileComplete', (filePath, result) => {
    events.fileComplete++
    const fileName = filePath.split('/').pop()
    
    if (result.cached) {
      console.log(`  💾 Cache hit: ${fileName}`)
    } else {
      console.log(`  🔄 Processed: ${fileName}`)
    }
  })

  sync.on('error', (error, context) => {
    events.errors++
    console.error(`  ❌ Error in ${context}: ${error.message}`)
  })

  sync.on('warning', (message, context) => {
    events.warnings++
    console.warn(`  ⚠️ Warning in ${context}: ${message}`)
  })

  sync.on('complete', (result) => {
    events.complete++
    console.log('✨ Sync operation completed')
  })

  try {
    // Get initial metrics
    console.log('📊 Initial state:')
    const initialStats = sync.getCacheStats()
    console.log(`  Cache size: ${initialStats.total} entries`)
    console.log()

    // Perform sync
    console.log('🔄 Starting advanced sync operation...')
    const result = await sync.sync()

    // Detailed results analysis
    console.log('\n' + '='.repeat(60))
    console.log('📊 Detailed Sync Results:')
    console.log('='.repeat(60))
    
    // File processing stats
    console.log('\n📄 File Processing:')
    console.log(`  Total files: ${result.filesProcessed + result.filesSkipped}`)
    console.log(`  Processed: ${result.filesProcessed}`)
    console.log(`  Cached: ${result.filesSkipped}`)
    console.log(`  Processing time: ${(result.processingTime / 1000).toFixed(3)}s`)
    
    // Cache performance
    console.log('\n💾 Cache Performance:')
    console.log(`  Hit rate: ${result.cache.hitRate}`)
    console.log(`  Cache hits: ${result.cache.hits}`)
    console.log(`  Cache misses: ${result.cache.misses}`)
    console.log(`  Expired entries: ${result.cache.expired}`)
    
    // Quality analysis
    console.log('\n✨ Quality Analysis:')
    if (result.quality.totalIssues === 0) {
      console.log('  ✅ No quality issues found')
    } else {
      console.log(`  ⚠️ Issues found in ${result.quality.totalIssues} files`)
      for (const file of result.quality.files.slice(0, 3)) {
        console.log(`    - ${file.file}: ${file.issues.length} issues`)
      }
      if (result.quality.files.length > 3) {
        console.log(`    ... and ${result.quality.files.length - 3} more files`)
      }
    }
    
    // Error summary
    console.log('\n🚨 Error Summary:')
    if (result.errors.errors === 0 && result.errors.warnings === 0) {
      console.log('  ✅ No errors or warnings')
    } else {
      console.log(`  Errors: ${result.errors.errors}`)
      console.log(`  Warnings: ${result.errors.warnings}`)
    }
    
    // Performance metrics
    console.log('\n⚡ Performance Metrics:')
    const totalFiles = result.filesProcessed + result.filesSkipped
    const avgTime = totalFiles > 0 ? result.processingTime / totalFiles : 0
    const throughput = result.processingTime > 0 ? (totalFiles / (result.processingTime / 1000)).toFixed(1) : '0'
    
    console.log(`  Average time per file: ${avgTime.toFixed(2)}ms`)
    console.log(`  Throughput: ${throughput} files/second`)
    
    let performanceGrade = 'F'
    if (avgTime < 5) performanceGrade = 'A+'
    else if (avgTime < 10) performanceGrade = 'A'
    else if (avgTime < 20) performanceGrade = 'B'
    else if (avgTime < 50) performanceGrade = 'C'
    else if (avgTime < 100) performanceGrade = 'D'
    
    console.log(`  Performance grade: ${performanceGrade}`)
    
    // Event summary
    console.log('\n📡 Event Summary:')
    console.log(`  Events triggered: ${Object.values(events).reduce((a, b) => a + b, 0)}`)
    console.log(`  Files processed: ${events.fileComplete}`)
    console.log(`  Errors: ${events.errors}`)
    console.log(`  Warnings: ${events.warnings}`)

    // Recommendations
    console.log('\n💡 Recommendations:')
    if (result.cache.hitRate === '0.00%') {
      console.log('  - This appears to be the first run. Subsequent runs will be much faster.')
    }
    if (parseFloat(result.cache.hitRate) > 80) {
      console.log('  - Excellent cache performance! Consider increasing TTL for better efficiency.')
    }
    if (avgTime > 50) {
      console.log('  - Consider enabling parallel processing or increasing batch size.')
    }
    if (result.quality.totalIssues > 0) {
      console.log('  - Review quality issues to improve documentation quality.')
    }

  } catch (error) {
    console.error('❌ Advanced sync failed:', error.message)
    console.error('Stack trace:', error.stack)
    process.exit(1)
  }
}

// Run example if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  advancedExample().catch(error => {
    console.error('Advanced example failed:', error)
    process.exit(1)
  })
}

export { advancedExample }