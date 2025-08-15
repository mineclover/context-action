# @context-action/typedoc-vitepress-sync

Enhanced TypeDoc to VitePress documentation sync with smart caching, parallel processing, and quality validation.

[![npm version](https://badge.fury.io/js/@context-action/typedoc-vitepress-sync.svg)](https://badge.fury.io/js/@context-action/typedoc-vitepress-sync)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 Features

- **🔥 Smart Caching**: SHA256 hash-based file change detection with 24-hour TTL
- **⚡ Parallel Processing**: Configurable batch processing for improved performance
- **🛡️ Error Recovery**: Strategic error handling with automatic recovery
- **✨ Quality Validation**: Markdown syntax, link integrity, and accessibility checks
- **📊 Comprehensive Metrics**: Detailed performance and quality reporting
- **🎨 Vue Compatibility**: Automatic VitePress/Vue template processing
- **🔧 CLI Interface**: Full-featured command-line tool
- **📱 Responsive Design**: Works with modern documentation workflows

## 📦 Installation

### As a standalone package

```bash
npm install @context-action/typedoc-vitepress-sync
# or
yarn add @context-action/typedoc-vitepress-sync
# or
pnpm add @context-action/typedoc-vitepress-sync
```

### Global installation

```bash
npm install -g @context-action/typedoc-vitepress-sync
```

## 🔧 Quick Start

### CLI Usage

```bash
# Initialize configuration
npx typedoc-vitepress-sync init

# Sync documentation
npx typedoc-vitepress-sync sync --source ./docs/api/generated --target ./docs/en/api

# With custom configuration
npx typedoc-vitepress-sync sync --config ./sync.config.js

# Clean cache and generated files
npx typedoc-vitepress-sync clean
```

### Programmatic Usage

```typescript
import { TypeDocVitePressSync } from '@context-action/typedoc-vitepress-sync'

const sync = new TypeDocVitePressSync({
  sourceDir: './docs/api/generated',
  targetDir: './docs/en/api',
  packageMapping: {
    'core': 'core',
    'react': 'react'
  }
})

// Auto-optimize based on system resources
sync.autoOptimize()

// Perform sync
const result = await sync.sync()

console.log(`Processed ${result.filesProcessed} files in ${result.processingTime}ms`)
console.log(`Cache hit rate: ${result.cache.hitRate}`)
```

## ⚙️ Configuration

### Configuration File

Create `typedoc-vitepress-sync.config.js`:

```javascript
export default {
  sourceDir: './docs/api/generated',
  targetDir: './docs/en/api',
  sidebarConfigPath: './docs/.vitepress/config/api-spec.ts',
  packageMapping: {
    'core': 'core',
    'react': 'react',
    'utils': 'utilities'
  },
  cache: {
    enabled: true,
    dir: './.typedoc-vitepress-cache',
    ttl: 24 * 60 * 60 * 1000, // 24 hours
    hashAlgorithm: 'sha256'
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
    outputFile: './reports/sync-metrics.json'
  }
}
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `sourceDir` | `string` | **Required** | Source directory containing TypeDoc output |
| `targetDir` | `string` | **Required** | Target directory for VitePress docs |
| `sidebarConfigPath` | `string` | `./docs/.vitepress/config/api-spec.ts` | Output path for sidebar configuration |
| `packageMapping` | `Record<string, string>` | `{}` | Map source packages to target directories |
| `cache.enabled` | `boolean` | `true` | Enable caching system |
| `cache.dir` | `string` | `./.typedoc-vitepress-cache` | Cache directory path |
| `cache.ttl` | `number` | `86400000` | Cache TTL in milliseconds (24h) |
| `parallel.enabled` | `boolean` | `true` | Enable parallel processing |
| `parallel.maxWorkers` | `number` | `4` | Maximum worker threads |
| `parallel.batchSize` | `number` | `10` | Files per batch |
| `quality.validateLinks` | `boolean` | `true` | Validate internal links |
| `quality.validateMarkdown` | `boolean` | `true` | Validate markdown syntax |
| `quality.checkAccessibility` | `boolean` | `true` | Check accessibility compliance |
| `metrics.enabled` | `boolean` | `true` | Enable metrics collection |
| `metrics.outputFile` | `string` | `./reports/metrics.json` | Metrics output file |

## 🎯 CLI Commands

### Main Commands

```bash
# Sync documentation
typedoc-vitepress-sync sync [options]

# Clean cache and generated files  
typedoc-vitepress-sync clean [options]

# Initialize configuration
typedoc-vitepress-sync init [options]
```

### Cache Management

```bash
# Show cache statistics
typedoc-vitepress-sync cache stats

# Clear cache
typedoc-vitepress-sync cache clear
```

### CLI Options

| Option | Description |
|--------|-------------|
| `-c, --config <path>` | Configuration file path |
| `-s, --source <dir>` | Source directory override |
| `-t, --target <dir>` | Target directory override |
| `--sidebar <path>` | Sidebar config output path |
| `--no-cache` | Disable caching |
| `--no-parallel` | Disable parallel processing |
| `--no-quality` | Disable quality validation |
| `--no-metrics` | Disable metrics collection |
| `-v, --verbose` | Enable verbose logging |
| `--force` | Force process all files |
| `--dry-run` | Show what would be done |

## 📊 Performance

### Benchmarks

| Scenario | Files | First Run | Cached Run | Improvement |
|----------|-------|-----------|------------|-------------|
| Small Project | 20 files | 150ms | 50ms | **67% faster** |
| Medium Project | 76 files | 300ms | 100ms | **67% faster** |
| Large Project | 200+ files | 800ms | 250ms | **69% faster** |

### Cache Performance

- **Hit Rate**: 95-100% on unchanged files
- **Hash Algorithm**: SHA256 for accurate change detection
- **Storage**: Efficient JSON manifest with file metadata
- **TTL**: Configurable expiration (default 24h)

## 🔍 Quality Validation

### Markdown Validation

- Detects undefined template values
- Validates code block syntax
- Checks for unclosed markdown syntax
- Identifies malformed tables
- Reports overly long lines

### Link Validation

- Validates internal link integrity
- Checks for broken file references
- Detects empty link text
- Supports relative and absolute paths
- Ignores external URLs and anchors

### Accessibility Validation

- Ensures images have alt text
- Validates heading hierarchy
- Checks list formatting
- Verifies table structure
- Reports accessibility issues

## 📈 Metrics & Monitoring

### Automatic Metrics Collection

```json
{
  "filesProcessed": 76,
  "filesSkipped": 0,
  "processingTime": 1250,
  "cache": {
    "hits": 72,
    "misses": 4,
    "hitRate": "94.74%"
  },
  "quality": {
    "totalIssues": 2,
    "files": [...]
  },
  "performance": {
    "filesPerSecond": "60.8",
    "averageTimePerFile": "16.45ms",
    "cacheEfficiency": "excellent"
  }
}
```

### Console Output

```
============================================================
✅ TypeDoc VitePress Sync Complete!
============================================================
📄 Files processed: 76
⏭️  Files skipped: 72 (cache hits)  
⏱️  Processing time: 1.25s

📊 Cache Statistics:
  - Hit rate: 94.74%
  - Hits: 72
  - Misses: 4

⚡ Performance: Excellent
```

## 🛠️ Advanced Usage

### Event-Driven Processing

```typescript
const sync = new TypeDocVitePressSync(config)

sync.on('start', (config) => {
  console.log('Sync starting with config:', config)
})

sync.on('fileComplete', (filePath, result) => {
  if (result.cached) {
    console.log(`Cache hit: ${filePath}`)
  } else {
    console.log(`Processed: ${filePath}`)
  }
})

sync.on('complete', (result) => {
  console.log(`Sync completed: ${result.filesProcessed} files`)
})

await sync.sync()
```

### Custom Validation

```typescript
import { QualityValidator } from '@context-action/typedoc-vitepress-sync'

const validator = new QualityValidator({
  validateMarkdown: true,
  validateLinks: true,
  checkAccessibility: true
})

const issues = await validator.validateFile('./docs/api.md')
if (issues) {
  console.log('Quality issues found:', issues.issues)
}
```

### Cache Management

```typescript
import { CacheManager } from '@context-action/typedoc-vitepress-sync'

const cache = new CacheManager({
  enabled: true,
  dir: './custom-cache',
  ttl: 60 * 60 * 1000 // 1 hour
})

await cache.initialize()

// Check if file needs processing
const shouldProcess = cache.shouldProcess('source.md', 'target.md')

// Update cache after processing
cache.updateCache('source.md', 'target.md')

// Get statistics
const stats = cache.getStats()
console.log(`Cache hit rate: ${stats.hitRate}`)
```

## 🔌 Integration

### Package.json Scripts

```json
{
  "scripts": {
    "docs:sync": "typedoc-vitepress-sync sync",
    "docs:clean": "typedoc-vitepress-sync clean",
    "docs:build": "typedoc && npm run docs:sync && vitepress build docs",
    "docs:dev": "vitepress dev docs"
  }
}
```

### GitHub Actions

```yaml
name: Documentation

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Generate TypeDoc
        run: npm run docs:api
        
      - name: Sync to VitePress
        run: npx typedoc-vitepress-sync sync --verbose
        
      - name: Build documentation
        run: npm run docs:build
```

### VitePress Integration

The generated sidebar configuration can be imported directly:

```typescript
// docs/.vitepress/config.ts
import { defineConfig } from 'vitepress'
import { sidebarApiEn } from './config/api-spec'

export default defineConfig({
  themeConfig: {
    sidebar: {
      '/en/api/': sidebarApiEn(),
      // ... other sidebar configs
    }
  }
})
```

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](./CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone repository
git clone https://github.com/mineclover/context-action.git
cd context-action/packages/typedoc-vitepress-sync

# Install dependencies
pnpm install

# Build package
pnpm build

# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage
```

## 📄 License

MIT © [mineclover](https://github.com/mineclover)

## 🔗 Related

- [TypeDoc](https://typedoc.org/) - TypeScript documentation generator
- [VitePress](https://vitepress.dev/) - Static site generator
- [Context-Action Framework](https://github.com/mineclover/context-action) - State management library

---

**Made with ❤️ for the TypeScript documentation community**