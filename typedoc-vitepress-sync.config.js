/**
 * @fileoverview TypeDoc VitePress Sync Configuration
 * Enhanced configuration for the Context-Action framework documentation sync
 */

import { cpus } from 'os'

// Dynamic configuration based on project size
const projectSize = 'large' // small (<50 files), medium (50-200), large (>200)

const sizeConfigs = {
  small: {
    cache: { ttl: 12 * 60 * 60 * 1000 }, // 12 hours
    parallel: { maxWorkers: 2, batchSize: 5 }
  },
  medium: {
    cache: { ttl: 24 * 60 * 60 * 1000 }, // 24 hours 
    parallel: { maxWorkers: 4, batchSize: 10 }
  },
  large: {
    cache: { ttl: 48 * 60 * 60 * 1000 }, // 48 hours
    parallel: { maxWorkers: Math.min(6, cpus().length), batchSize: 15 }
  }
}

const config = sizeConfigs[projectSize]

export default {
  // Source and target directories
  sourceDir: './docs/api/generated',
  targetDir: './docs/en/api',
  sidebarConfigPath: './docs/.vitepress/config/api-spec.ts',
  
  // Package mapping for proper organization
  packageMapping: {
    'core': 'core',
    'store-core': 'store-core',
    'mutative-core': 'mutative-core',
    'mutative': 'mutative',
    'xstate': 'xstate',
    'tool-protocol': 'tool-protocol',
    'ai-sdk': 'ai-sdk',
    'webmcp': 'webmcp',
    'tool-durable-operations': 'tool-durable-operations',
    'react': 'react',
    'lit': 'lit',
    'lit-ui': 'lit-ui',
    'preact': 'preact',
    'preact-ui': 'preact-ui'
  },
  
  // Smart caching configuration - optimized for performance
  cache: {
    enabled: true,
    dir: './.typedoc-vitepress-cache',
    ttl: config.cache.ttl,
    hashAlgorithm: 'sha256',
    manifestFile: './.typedoc-vitepress-cache/manifest.json'
  },
  
  // Parallel processing for performance - CPU optimized
  parallel: {
    enabled: true,
    maxWorkers: config.parallel.maxWorkers,
    batchSize: config.parallel.batchSize
  },
  
  // Quality validation - comprehensive checks
  quality: {
    validateLinks: true,        // Internal link integrity
    validateMarkdown: true,     // Markdown syntax validation
    checkAccessibility: true    // Accessibility compliance
  },
  
  // Metrics collection - performance monitoring
  metrics: {
    enabled: true,
    outputFile: './reports/api-sync-metrics.json'
  }
}
