/**
 * @fileoverview TypeDoc VitePress Sync Configuration
 * Enhanced configuration for the Context-Action framework documentation sync
 */

export default {
  // Source and target directories
  sourceDir: './docs/api/generated',
  targetDir: './docs/en/api',
  sidebarConfigPath: './docs/.vitepress/config/api-spec.ts',
  
  // Package mapping for proper organization
  packageMapping: {
    'core': 'core',
    'react': 'react'
  },
  
  // Smart caching configuration
  cache: {
    enabled: true,
    dir: './.typedoc-vitepress-cache',
    ttl: 24 * 60 * 60 * 1000, // 24 hours
    hashAlgorithm: 'sha256'
  },
  
  // Parallel processing for performance
  parallel: {
    enabled: true,
    maxWorkers: 4,
    batchSize: 10
  },
  
  // Quality validation
  quality: {
    validateLinks: true,
    validateMarkdown: true,
    checkAccessibility: true
  },
  
  // Metrics collection
  metrics: {
    enabled: true,
    outputFile: './reports/api-sync-metrics.json'
  }
}