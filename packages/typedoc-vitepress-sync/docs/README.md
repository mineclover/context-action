# TypeDoc VitePress Sync Documentation

Welcome to the comprehensive documentation for `@context-action/typedoc-vitepress-sync`.

Supported development baseline: Node.js 24.11.0 or newer and TypeScript 6.0.3.

## 📚 Documentation Structure

- **[Getting Started](./getting-started.md)** - Quick start guide and basic setup
- **[API Reference](./api-reference.md)** - Complete API documentation
- **[Configuration Guide](./configuration.md)** - Detailed configuration options
- **[Advanced Usage](./advanced-usage.md)** - Advanced features and patterns
- **[Architecture](./architecture.md)** - System design and internals
- **[Troubleshooting](./troubleshooting.md)** - Common issues and solutions
- **[Contributing](./contributing.md)** - Development guide for contributors

## 🎯 What is TypeDoc VitePress Sync?

TypeDoc VitePress Sync is a high-performance tool that bridges TypeDoc and VitePress, enabling seamless conversion of TypeScript API documentation into VitePress-compatible format with advanced features:

- **Smart Caching**: 67-69% performance improvement through intelligent caching
- **Parallel Processing**: Multi-threaded file processing for optimal speed
- **Quality Validation**: Comprehensive markdown and link validation
- **Auto-optimization**: Automatic configuration tuning based on system resources

## 🚀 Quick Example

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

// Auto-optimize for best performance
sync.autoOptimize()

// Perform sync
const result = await sync.sync()
console.log(`Processed ${result.filesProcessed} files in ${result.processingTime}ms`)
```

## 📊 Key Features

| Feature | Description | Benefit |
|---------|-------------|---------|
| **Smart Caching** | SHA256 hash-based change detection | 67-69% faster subsequent runs |
| **Parallel Processing** | Multi-threaded batch processing | Process 60+ files/second |
| **Quality Validation** | Markdown, link, and accessibility checks | Ensure documentation quality |
| **Event-Driven** | Progress tracking and monitoring | Real-time sync feedback |
| **Auto-Optimization** | Automatic resource-based tuning | Optimal performance out-of-box |

## 🔗 Resources

- [GitHub Repository](https://github.com/mineclover/context-action/tree/main/packages/typedoc-vitepress-sync)
- [NPM Package](https://www.npmjs.com/package/@context-action/typedoc-vitepress-sync)
- [Issue Tracker](https://github.com/mineclover/context-action/issues)

## 📄 License

Apache-2.0 © [mineclover](https://github.com/mineclover)
