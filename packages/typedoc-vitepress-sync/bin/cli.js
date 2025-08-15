#!/usr/bin/env node

/**
 * @fileoverview CLI interface for TypeDoc VitePress Sync
 */

import { program } from 'commander'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import chalk from 'chalk'
import ora from 'ora'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Import the main library
const { TypeDocVitePressSync, ConsoleLogger } = await import('../dist/index.js')

// Package info
const packageJsonPath = path.join(__dirname, '..', 'package.json')
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))

// Configure CLI
program
  .name('typedoc-vitepress-sync')
  .description('Enhanced TypeDoc to VitePress documentation sync with smart caching')
  .version(packageJson.version)

// Main sync command
program
  .command('sync')
  .description('Sync TypeDoc generated docs to VitePress format')
  .option('-c, --config <path>', 'Configuration file path')
  .option('-s, --source <dir>', 'Source directory containing TypeDoc output')
  .option('-t, --target <dir>', 'Target directory for VitePress docs')
  .option('--sidebar <path>', 'Sidebar configuration output path')
  .option('--no-cache', 'Disable caching system')
  .option('--no-parallel', 'Disable parallel processing')
  .option('--no-quality', 'Disable quality validation')
  .option('--no-metrics', 'Disable metrics collection')
  .option('-v, --verbose', 'Enable verbose logging')
  .option('--force', 'Force processing all files (ignore cache)')
  .option('--dry-run', 'Show what would be done without making changes')
  .action(async (options) => {
    try {
      const config = await loadConfig(options)
      const logger = new ConsoleLogger(options.verbose ? 'debug' : 'info')
      
      if (options.dryRun) {
        logger.info('🔍 Dry run mode - no changes will be made')
        await showDryRun(config, logger)
        return
      }

      const spinner = ora('Initializing sync...').start()
      
      const sync = new TypeDocVitePressSync(config, logger)
      
      // Auto-optimize if not explicitly configured
      if (!options.config) {
        sync.autoOptimize()
      }

      // Validate configuration
      const issues = sync.validateConfig()
      if (issues.length > 0) {
        spinner.fail('Configuration validation failed')
        for (const issue of issues) {
          logger.error(`${issue.type}: ${issue.message}`)
        }
        process.exit(1)
      }

      spinner.text = 'Syncing documentation...'
      
      // Setup progress tracking
      let filesProcessed = 0
      sync.on('fileComplete', (filePath, result) => {
        filesProcessed++
        if (result.cached) {
          spinner.text = `Processing... ${filesProcessed} files (cache hit: ${path.basename(filePath)})`
        } else {
          spinner.text = `Processing... ${filesProcessed} files (processed: ${path.basename(filePath)})`
        }
      })

      const result = await sync.sync()
      
      spinner.succeed('Documentation sync completed!')
      
      // Display results
      displayResults(result, logger)

    } catch (error) {
      console.error(chalk.red('❌ Sync failed:'), error.message)
      if (options.verbose) {
        console.error(error.stack)
      }
      process.exit(1)
    }
  })

// Clean command
program
  .command('clean')
  .description('Clean cache and generated files')
  .option('-c, --config <path>', 'Configuration file path')
  .option('-v, --verbose', 'Enable verbose logging')
  .action(async (options) => {
    try {
      const config = await loadConfig(options)
      const logger = new ConsoleLogger(options.verbose ? 'debug' : 'info')
      
      const spinner = ora('Cleaning cache and generated files...').start()
      
      const sync = new TypeDocVitePressSync(config, logger)
      await sync.clean()
      
      spinner.succeed('Cleanup completed!')
      
    } catch (error) {
      console.error(chalk.red('❌ Clean failed:'), error.message)
      if (options.verbose) {
        console.error(error.stack)
      }
      process.exit(1)
    }
  })

// Cache command
program
  .command('cache')
  .description('Cache management operations')
  .addCommand(
    program.createCommand('stats')
      .description('Show cache statistics')
      .option('-c, --config <path>', 'Configuration file path')
      .action(async (options) => {
        const config = await loadConfig(options)
        const logger = new ConsoleLogger('info')
        const sync = new TypeDocVitePressSync(config, logger)
        
        const stats = sync.getCacheStats()
        
        console.log(chalk.blue('\n📊 Cache Statistics:'))
        console.log(`  Hit Rate: ${chalk.green(stats.hitRate)}`)
        console.log(`  Cache Hits: ${chalk.cyan(stats.hits)}`)
        console.log(`  Cache Misses: ${chalk.yellow(stats.misses)}`)
        console.log(`  Expired Entries: ${chalk.red(stats.expired)}`)
        console.log(`  Total Operations: ${stats.total}`)
      })
  )
  .addCommand(
    program.createCommand('clear')
      .description('Clear cache')
      .option('-c, --config <path>', 'Configuration file path')
      .action(async (options) => {
        const config = await loadConfig(options)
        const logger = new ConsoleLogger('info')
        const sync = new TypeDocVitePressSync(config, logger)
        
        const spinner = ora('Clearing cache...').start()
        await sync.clean()
        spinner.succeed('Cache cleared!')
      })
  )

// Config command
program
  .command('init')
  .description('Initialize configuration file')
  .option('-f, --force', 'Overwrite existing configuration')
  .action((options) => {
    const configPath = 'typedoc-vitepress-sync.config.js'
    
    if (fs.existsSync(configPath) && !options.force) {
      console.error(chalk.red('❌ Configuration file already exists. Use --force to overwrite.'))
      process.exit(1)
    }
    
    const configTemplate = `export default {
  sourceDir: './docs/api/generated',
  targetDir: './docs/en/api',
  sidebarConfigPath: './docs/.vitepress/config/api-spec.ts',
  packageMapping: {
    'core': 'core',
    'react': 'react'
  },
  cache: {
    enabled: true,
    dir: './.typedoc-vitepress-cache',
    ttl: 24 * 60 * 60 * 1000 // 24 hours
  },
  parallel: {
    enabled: true,
    maxWorkers: 4,
    batchSize: 10
  },
  quality: {
    validateLinks: true,
    validateMarkdown: true,
    checkAccessibility: true
  },
  metrics: {
    enabled: true,
    outputFile: './reports/typedoc-vitepress-sync-metrics.json'
  }
}
`
    
    fs.writeFileSync(configPath, configTemplate)
    console.log(chalk.green(`✅ Configuration file created: ${configPath}`))
  })

// Utility functions
async function loadConfig(options) {
  let config = {
    sourceDir: './docs/api/generated',
    targetDir: './docs/en/api',
    sidebarConfigPath: './docs/.vitepress/config/api-spec.ts',
    packageMapping: {
      'core': 'core',
      'react': 'react'
    }
  }

  // Load from config file if specified
  if (options.config) {
    if (!fs.existsSync(options.config)) {
      throw new Error(`Configuration file not found: ${options.config}`)
    }
    
    const configModule = await import(path.resolve(options.config))
    config = { ...config, ...configModule.default }
  }

  // Override with CLI options
  if (options.source) config.sourceDir = options.source
  if (options.target) config.targetDir = options.target
  if (options.sidebar) config.sidebarConfigPath = options.sidebar

  // Handle disable flags
  if (options.noCache) {
    config.cache = { enabled: false }
  }
  if (options.noParallel) {
    config.parallel = { enabled: false }
  }
  if (options.noQuality) {
    config.quality = { 
      validateLinks: false,
      validateMarkdown: false,
      checkAccessibility: false
    }
  }
  if (options.noMetrics) {
    config.metrics = { enabled: false }
  }

  // Force mode
  if (options.force && config.cache) {
    config.cache.ttl = 0 // Force cache expiration
  }

  return config
}

async function showDryRun(config, logger) {
  logger.info('🔍 Configuration:')
  logger.info(`  Source: ${config.sourceDir}`)
  logger.info(`  Target: ${config.targetDir}`)
  logger.info(`  Sidebar: ${config.sidebarConfigPath || 'none'}`)
  logger.info(`  Packages: ${Object.keys(config.packageMapping || {}).join(', ')}`)
  
  if (config.cache?.enabled) {
    logger.info(`  Cache: enabled (${config.cache.dir})`)
  } else {
    logger.info('  Cache: disabled')
  }
  
  if (config.parallel?.enabled) {
    logger.info(`  Parallel: enabled (${config.parallel.maxWorkers} workers, batch size ${config.parallel.batchSize})`)
  } else {
    logger.info('  Parallel: disabled')
  }

  // Show what files would be processed
  const sync = new TypeDocVitePressSync(config, logger)
  const issues = sync.validateConfig()
  
  if (issues.length > 0) {
    logger.warn('\n⚠️ Configuration issues:')
    for (const issue of issues) {
      logger.warn(`  ${issue.type}: ${issue.message}`)
    }
  } else {
    logger.info('\n✅ Configuration valid')
  }
}

function displayResults(result, logger) {
  console.log(chalk.blue('\n📊 Sync Results:'))
  console.log(`  Files Processed: ${chalk.green(result.filesProcessed)}`)
  console.log(`  Files Skipped: ${chalk.cyan(result.filesSkipped)} (cache hits)`)
  console.log(`  Processing Time: ${chalk.yellow((result.processingTime / 1000).toFixed(2))}s`)
  
  console.log(chalk.blue('\n💾 Cache Performance:'))
  console.log(`  Hit Rate: ${chalk.green(result.cache.hitRate)}`)
  console.log(`  Cache Hits: ${result.cache.hits}`)
  console.log(`  Cache Misses: ${result.cache.misses}`)
  
  if (result.quality.totalIssues > 0) {
    console.log(chalk.yellow(`\n⚠️ Quality Issues: ${result.quality.totalIssues} files with issues`))
  }
  
  if (result.errors.errors > 0 || result.errors.warnings > 0) {
    console.log(chalk.red(`\n🚨 Issues: ${result.errors.errors} errors, ${result.errors.warnings} warnings`))
  }

  // Performance category
  const totalFiles = result.filesProcessed + result.filesSkipped
  const avgTime = totalFiles > 0 ? result.processingTime / totalFiles : 0
  let perfCategory = 'Unknown'
  let perfColor = chalk.gray
  
  if (avgTime < 5) {
    perfCategory = 'Excellent'
    perfColor = chalk.green
  } else if (avgTime < 20) {
    perfCategory = 'Good'
    perfColor = chalk.blue
  } else if (avgTime < 50) {
    perfCategory = 'Fair'
    perfColor = chalk.yellow
  } else {
    perfCategory = 'Slow'
    perfColor = chalk.red
  }
  
  console.log(chalk.blue('\n⚡ Performance:'), perfColor(perfCategory))
  
  if (avgTime > 0) {
    console.log(`  Average time per file: ${avgTime.toFixed(2)}ms`)
  }
}

// Parse arguments and execute
program.parse()