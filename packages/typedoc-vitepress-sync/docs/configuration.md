# Configuration Guide

Comprehensive configuration options for TypeDoc VitePress Sync.

## Configuration File

Create `typedoc-vitepress-sync.config.js` in your project root:

```javascript
export default {
  // Core settings
  sourceDir: './docs/api/generated',
  targetDir: './docs/en/api',
  sidebarConfigPath: './docs/.vitepress/config/api-spec.ts',
  packageMapping: {
    'core': 'core',
    'react': 'react'
  },
  
  // Advanced features
  cache: { /* cache options */ },
  parallel: { /* parallel processing */ },
  quality: { /* validation options */ },
  metrics: { /* metrics collection */ }
}
```

## Core Configuration

### sourceDir
**Type:** `string` (required)  
**Description:** Directory containing TypeDoc JSON output

```javascript
sourceDir: './docs/api/generated'
```

### targetDir  
**Type:** `string` (required)  
**Description:** Target directory for VitePress markdown files

```javascript
targetDir: './docs/en/api'
```

### sidebarConfigPath
**Type:** `string`  
**Default:** `'./docs/.vitepress/config/api-spec.ts'`  
**Description:** Output path for VitePress sidebar configuration

```javascript
sidebarConfigPath: './docs/.vitepress/config/sidebar-api.ts'
```

### packageMapping
**Type:** `Record<string, string>`  
**Default:** `{}`  
**Description:** Maps source package names to target directory names

```javascript
packageMapping: {
  '@scope/core-package': 'core',
  '@scope/react-package': 'react', 
  'utilities': 'utils'
}
```

## Cache Configuration

Control the intelligent caching system:

```javascript
cache: {
  enabled: true,
  dir: './.typedoc-vitepress-cache',
  hashAlgorithm: 'sha256',
  ttl: 24 * 60 * 60 * 1000, // 24 hours
  manifestFile: 'manifest.json'
}
```

### cache.enabled
**Type:** `boolean`  
**Default:** `true`  
**Description:** Enable/disable caching system

### cache.dir
**Type:** `string`  
**Default:** `'./.typedoc-vitepress-cache'`  
**Description:** Cache directory path

### cache.hashAlgorithm
**Type:** `'sha256' | 'sha1' | 'md5'`  
**Default:** `'sha256'`  
**Description:** Hash algorithm for change detection

### cache.ttl
**Type:** `number`  
**Default:** `86400000` (24 hours)  
**Description:** Cache time-to-live in milliseconds

## Parallel Processing

Configure parallel file processing:

```javascript
parallel: {
  enabled: true,
  maxWorkers: 4,
  batchSize: 10
}
```

### parallel.enabled
**Type:** `boolean`  
**Default:** `true`  
**Description:** Enable parallel processing

### parallel.maxWorkers
**Type:** `number`  
**Default:** `4`  
**Description:** Maximum number of worker threads

### parallel.batchSize
**Type:** `number`  
**Default:** `10`  
**Description:** Files processed per batch

## Quality Validation

Configure quality validation rules:

```javascript
quality: {
  validateLinks: true,
  validateMarkdown: true, 
  checkAccessibility: true,
  customRules: []
}
```

### quality.validateLinks
**Type:** `boolean`  
**Default:** `true`  
**Description:** Validate internal links

### quality.validateMarkdown
**Type:** `boolean`  
**Default:** `true`  
**Description:** Validate markdown syntax

### quality.checkAccessibility
**Type:** `boolean`  
**Default:** `true`  
**Description:** Check accessibility compliance

## Metrics Collection

Configure performance metrics:

```javascript
metrics: {
  enabled: true,
  outputFile: './reports/sync-metrics.json',
  includeSystemInfo: true
}
```

### metrics.enabled
**Type:** `boolean`  
**Default:** `true`  
**Description:** Enable metrics collection

### metrics.outputFile
**Type:** `string`  
**Default:** `'./reports/metrics.json'`  
**Description:** Metrics output file path

## Environment-Based Configuration

Use different configurations for different environments:

```javascript
// typedoc-vitepress-sync.config.js
const isDevelopment = process.env.NODE_ENV === 'development'
const isCI = process.env.CI === 'true'

export default {
  sourceDir: './docs/api/generated',
  targetDir: './docs/en/api',
  
  // Development: faster but less thorough
  cache: {
    enabled: !isDevelopment, // Disable cache in dev for immediate updates
    ttl: isDevelopment ? 0 : 24 * 60 * 60 * 1000
  },
  
  parallel: {
    enabled: !isDevelopment, // Single-threaded in dev for easier debugging
    maxWorkers: isDevelopment ? 1 : 4
  },
  
  quality: {
    validateLinks: !isDevelopment, // Skip in dev for speed
    validateMarkdown: true,
    checkAccessibility: isCI // Only in CI
  },
  
  metrics: {
    enabled: isCI, // Only collect metrics in CI
    outputFile: isCI ? './reports/sync-metrics.json' : null
  }
}
```

## CLI Override

Override configuration via CLI flags:

```bash
# Override source and target directories  
npx typedoc-vitepress-sync sync \
  --source ./custom/api/generated \
  --target ./custom/docs/api

# Disable features
npx typedoc-vitepress-sync sync \
  --no-cache \
  --no-parallel \
  --no-quality

# Force processing (ignore cache)
npx typedoc-vitepress-sync sync --force

# Dry run (show what would be done)
npx typedoc-vitepress-sync sync --dry-run
```

## Advanced Configuration Examples

### Large Project Configuration

For projects with 100+ API files:

```javascript
export default {
  sourceDir: './docs/api/generated',
  targetDir: './docs/en/api',
  
  cache: {
    enabled: true,
    ttl: 48 * 60 * 60 * 1000, // 48 hours for stable APIs
    dir: './.cache/typedoc-sync' // Separate from other caches
  },
  
  parallel: {
    enabled: true,
    maxWorkers: 8, // More workers for large projects
    batchSize: 20  // Larger batches for efficiency
  },
  
  quality: {
    validateLinks: true,
    validateMarkdown: true,
    checkAccessibility: false // Skip for performance
  }
}
```

### CI/CD Optimized Configuration

For continuous integration environments:

```javascript
export default {
  sourceDir: './docs/api/generated',
  targetDir: './docs/en/api',
  
  cache: {
    enabled: true,
    dir: '/tmp/typedoc-cache', // Use temp directory
    ttl: 6 * 60 * 60 * 1000 // 6 hours (multiple builds per day)
  },
  
  parallel: {
    enabled: true,
    maxWorkers: process.env.CI_WORKERS || 4,
    batchSize: 15
  },
  
  quality: {
    validateLinks: true,
    validateMarkdown: true,
    checkAccessibility: true // Full validation in CI
  },
  
  metrics: {
    enabled: true,
    outputFile: './build-reports/sync-metrics.json'
  }
}
```

### Memory-Constrained Configuration

For environments with limited memory:

```javascript
export default {
  sourceDir: './docs/api/generated',
  targetDir: './docs/en/api',
  
  parallel: {
    enabled: true,
    maxWorkers: 2, // Fewer workers
    batchSize: 5   // Smaller batches
  },
  
  cache: {
    enabled: true,
    // Use more aggressive cache to avoid processing
    ttl: 7 * 24 * 60 * 60 * 1000 // 7 days
  },
  
  quality: {
    validateLinks: false,    // Skip to save memory
    validateMarkdown: true,  // Keep essential validation
    checkAccessibility: false
  }
}
```