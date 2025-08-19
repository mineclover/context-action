# Getting Started

Quick start guide for TypeDoc VitePress Sync.

## Installation

### Prerequisites

- Node.js 18+ 
- TypeDoc 0.25+
- VitePress 1.0+
- TypeScript project with documentation

### Install Package

```bash
# As project dependency
npm install @context-action/typedoc-vitepress-sync

# Or globally for CLI access
npm install -g @context-action/typedoc-vitepress-sync
```

## Basic Setup

### 1. Generate TypeDoc Output

First, ensure TypeDoc generates JSON output:

```bash
# Install TypeDoc if not already installed
npm install --save-dev typedoc

# Generate API documentation as JSON
npx typedoc --json docs/api/generated/api.json src/
```

### 2. Initialize Configuration

```bash
# Create default configuration
npx typedoc-vitepress-sync init

# This creates: typedoc-vitepress-sync.config.js
```

### 3. Configure for Your Project

Edit the generated configuration:

```javascript
// typedoc-vitepress-sync.config.js
export default {
  sourceDir: './docs/api/generated',
  targetDir: './docs/en/api',
  sidebarConfigPath: './docs/.vitepress/config/api-spec.ts',
  packageMapping: {
    'my-core-package': 'core',
    'my-react-package': 'react'
  }
}
```

### 4. Run Sync

```bash
# Perform sync operation
npx typedoc-vitepress-sync sync

# With verbose output
npx typedoc-vitepress-sync sync --verbose
```

## VitePress Integration

### Update VitePress Config

```typescript
// docs/.vitepress/config.ts
import { defineConfig } from 'vitepress'
import { sidebarApiEn } from './config/api-spec'

export default defineConfig({
  title: 'My Project Docs',
  themeConfig: {
    sidebar: {
      '/en/api/': sidebarApiEn(),
      // ... other sidebar configs
    }
  }
})
```

### Package.json Scripts

Add convenient npm scripts:

```json
{
  "scripts": {
    "docs:api": "typedoc --json docs/api/generated/api.json src/",
    "docs:sync": "typedoc-vitepress-sync sync",
    "docs:build": "npm run docs:api && npm run docs:sync && vitepress build docs",
    "docs:dev": "vitepress dev docs"
  }
}
```

## First Run

```bash
# Generate API docs, sync, and start dev server
npm run docs:build
npm run docs:dev
```

You should now see your API documentation integrated into VitePress!

## Next Steps

- [Configuration Guide](./configuration.md) - Detailed configuration options
- [Advanced Usage](./advanced-usage.md) - Performance optimization and custom features
- [API Reference](./api-reference.md) - Complete API documentation