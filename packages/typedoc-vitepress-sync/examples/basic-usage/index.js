#!/usr/bin/env node

/**
 * @fileoverview Basic usage example for TypeDoc VitePress Sync
 */

import { TypeDocVitePressSync } from '../../dist/index.js'

async function basicExample() {
  console.log('🚀 Basic TypeDoc VitePress Sync Example\n')

  // Basic configuration
  const config = {
    sourceDir: './docs/api/generated',
    targetDir: './docs/en/api',
    packageMapping: {
      'core': 'core',
      'react': 'react'
    }
  }

  console.log('📋 Configuration:')
  console.log(JSON.stringify(config, null, 2))
  console.log()

  // Create sync instance
  const sync = new TypeDocVitePressSync(config)

  // Enable auto-optimization
  console.log('🔧 Auto-optimizing configuration...')
  sync.autoOptimize()

  // Validate configuration
  console.log('✅ Validating configuration...')
  const issues = sync.validateConfig()
  
  if (issues.length > 0) {
    console.log('⚠️ Configuration issues found:')
    for (const issue of issues) {
      console.log(`  - ${issue.type}: ${issue.message}`)
    }
    console.log()
  }

  // Add event listeners for progress tracking
  sync.on('start', (config) => {
    console.log('🎯 Sync started')
  })

  let filesProcessed = 0
  sync.on('fileComplete', (filePath, result) => {
    filesProcessed++
    const status = result.cached ? '💾 cached' : '🔄 processed'
    console.log(`  ${status}: ${filePath.split('/').pop()}`)
  })

  sync.on('complete', (result) => {
    console.log('✨ Sync completed!')
  })

  try {
    // Perform sync
    console.log('🔄 Starting sync operation...')
    const result = await sync.sync()

    // Display results
    console.log('\n' + '='.repeat(50))
    console.log('📊 Sync Results:')
    console.log('='.repeat(50))
    console.log(`Files processed: ${result.filesProcessed}`)
    console.log(`Files skipped: ${result.filesSkipped} (cache hits)`)
    console.log(`Processing time: ${(result.processingTime / 1000).toFixed(2)}s`)
    console.log(`Cache hit rate: ${result.cache.hitRate}`)
    
    if (result.quality.totalIssues > 0) {
      console.log(`Quality issues: ${result.quality.totalIssues} files`)
    }
    
    if (result.errors.errors > 0 || result.errors.warnings > 0) {
      console.log(`Errors: ${result.errors.errors}, Warnings: ${result.errors.warnings}`)
    }

    // Performance assessment
    const totalFiles = result.filesProcessed + result.filesSkipped
    const avgTime = totalFiles > 0 ? result.processingTime / totalFiles : 0
    
    let performance = 'Unknown'
    if (avgTime < 5) performance = 'Excellent'
    else if (avgTime < 20) performance = 'Good'  
    else if (avgTime < 50) performance = 'Fair'
    else performance = 'Slow'
    
    console.log(`Performance: ${performance} (${avgTime.toFixed(2)}ms/file)`)

  } catch (error) {
    console.error('❌ Sync failed:', error.message)
    process.exit(1)
  }
}

// Run example if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  basicExample().catch(error => {
    console.error('Example failed:', error)
    process.exit(1)
  })
}

export { basicExample }