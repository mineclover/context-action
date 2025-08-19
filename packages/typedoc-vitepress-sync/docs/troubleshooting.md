# Troubleshooting Guide

Common issues and solutions for TypeDoc VitePress Sync.

## Table of Contents

- [Installation Issues](#installation-issues)
- [Configuration Problems](#configuration-problems)
- [Cache Issues](#cache-issues)
- [Performance Problems](#performance-problems)
- [Quality Validation Errors](#quality-validation-errors)
- [File Processing Errors](#file-processing-errors)
- [Integration Issues](#integration-issues)
- [Debugging Techniques](#debugging-techniques)

---

## Installation Issues

### Problem: Package installation fails

**Symptoms:**
```
npm ERR! peer dep missing: typedoc@>=0.25.0
npm ERR! peer dep missing: vitepress@>=1.0.0
```

**Solution:**
Install peer dependencies explicitly:
```bash
npm install typedoc vitepress @context-action/typedoc-vitepress-sync
```

### Problem: Binary not found after global installation

**Symptoms:**
```bash
$ typedoc-vitepress-sync
command not found: typedoc-vitepress-sync
```

**Solutions:**

1. Check npm global bin path:
```bash
npm config get prefix
# Add to PATH: $(npm config get prefix)/bin
```

2. Use npx instead:
```bash
npx @context-action/typedoc-vitepress-sync sync
```

3. Reinstall globally:
```bash
npm uninstall -g @context-action/typedoc-vitepress-sync
npm install -g @context-action/typedoc-vitepress-sync
```

---

## Configuration Problems

### Problem: Configuration file not found

**Symptoms:**
```
Error: Configuration file not found: typedoc-vitepress-sync.config.js
```

**Solutions:**

1. Initialize configuration:
```bash
npx typedoc-vitepress-sync init
```

2. Specify custom config path:
```bash
npx typedoc-vitepress-sync sync --config ./custom-config.js
```

3. Use inline configuration:
```bash
npx typedoc-vitepress-sync sync \
  --source ./docs/api/generated \
  --target ./docs/en/api
```

### Problem: Invalid configuration

**Symptoms:**
```
Configuration validation failed:
  - Error: sourceDir does not exist
  - Warning: packageMapping is empty
```

**Solution:**
Validate your configuration:

```javascript
// typedoc-vitepress-sync.config.js
import fs from 'fs'
import path from 'path'

// Validate paths exist
const sourceDir = './docs/api/generated'
const targetDir = './docs/en/api'

if (!fs.existsSync(sourceDir)) {
  console.error(`Source directory does not exist: ${sourceDir}`)
  console.log('Run TypeDoc first: npm run docs:api')
  process.exit(1)
}

export default {
  sourceDir: path.resolve(sourceDir),
  targetDir: path.resolve(targetDir),
  packageMapping: {
    'core': 'core',
    'react': 'react'
  }
}
```

### Problem: Package mapping not working

**Symptoms:**
- Files processed but sidebar shows incorrect structure
- Package directories not created as expected

**Solution:**
Ensure package names match TypeDoc output:

```javascript
// Check actual TypeDoc output structure
const fs = require('fs')
const sourceDir = './docs/api/generated'

console.log('TypeDoc packages found:')
fs.readdirSync(sourceDir).forEach(dir => {
  console.log(`  - ${dir}`)
})

// Update config to match
export default {
  packageMapping: {
    '@scope/package-name': 'package-name',  // Map scoped packages
    'core-lib': 'core',                     // Rename packages
    'react-lib': 'react'
  }
}
```

---

## Cache Issues

### Problem: Cache not updating

**Symptoms:**
- Changes not reflected after sync
- Files showing as cached when they shouldn't be

**Solutions:**

1. Clear cache manually:
```bash
npx typedoc-vitepress-sync cache clear
```

2. Force sync (ignore cache):
```bash
npx typedoc-vitepress-sync sync --force
```

3. Delete cache directory:
```bash
rm -rf .typedoc-vitepress-cache
```

4. Adjust cache TTL:
```javascript
export default {
  cache: {
    ttl: 60 * 60 * 1000 // 1 hour instead of 24 hours
  }
}
```

### Problem: Cache performance degradation

**Symptoms:**
- Slow cache operations
- High memory usage
- Cache manifest corruption

**Solution:**
Implement cache maintenance:

```javascript
// maintenance.js
import { TypeDocVitePressSync } from '@context-action/typedoc-vitepress-sync'

async function maintainCache() {
  const sync = new TypeDocVitePressSync(config)
  
  // Get cache stats
  const stats = sync.getCacheStats()
  console.log('Cache stats:', stats)
  
  // Clear if cache is too large or old
  if (stats.total > 10000 || stats.expired > 1000) {
    console.log('Clearing cache due to size/age...')
    await sync.clean()
  }
}

// Run weekly via cron
maintainCache()
```

---

## Performance Problems

### Problem: Sync takes too long

**Symptoms:**
- Processing time > 30 seconds for < 100 files
- High CPU usage
- Memory exhaustion

**Solutions:**

1. Enable parallel processing:
```javascript
export default {
  parallel: {
    enabled: true,
    maxWorkers: 4,
    batchSize: 10
  }
}
```

2. Auto-optimize configuration:
```javascript
const sync = new TypeDocVitePressSync(config)
sync.autoOptimize() // Automatically tune based on system
```

3. Profile performance:
```javascript
const sync = new TypeDocVitePressSync(config)

// Enable detailed timing
sync.on('fileComplete', (file, result) => {
  console.log(`${file}: ${result.processingTime}ms`)
})

const result = await sync.sync()
console.log('Slowest files:', result.performance.slowestFiles)
```

4. Reduce validation overhead:
```javascript
export default {
  quality: {
    validateLinks: false,      // Disable for speed
    validateMarkdown: true,    // Keep essential validation
    checkAccessibility: false  // Disable for speed
  }
}
```

### Problem: Out of memory errors

**Symptoms:**
```
FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory
```

**Solutions:**

1. Increase Node.js memory:
```bash
NODE_OPTIONS="--max-old-space-size=4096" npx typedoc-vitepress-sync sync
```

2. Reduce batch size:
```javascript
export default {
  parallel: {
    batchSize: 5 // Smaller batches use less memory
  }
}
```

3. Process in chunks:
```javascript
// chunk-sync.js
import glob from 'glob'

async function chunkSync() {
  const files = glob.sync('./docs/api/generated/**/*.json')
  const chunkSize = 50
  
  for (let i = 0; i < files.length; i += chunkSize) {
    const chunk = files.slice(i, i + chunkSize)
    console.log(`Processing chunk ${i / chunkSize + 1}...`)
    
    await sync.syncFiles(chunk)
    
    // Give garbage collector time to clean up
    if (global.gc) {
      global.gc()
    }
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
}
```

---

## Quality Validation Errors

### Problem: Markdown validation failures

**Symptoms:**
```
Quality validation failed:
  - undefined-template: Template variable {{variable}} not defined
  - unclosed-code-block: Code block not closed properly
```

**Solutions:**

1. Fix template variables:
```markdown
<!-- Before -->
{{unknownVariable}}

<!-- After - Remove or define -->
<!-- {{unknownVariable}} -->
```

2. Fix code blocks:
```markdown
<!-- Before -->
\`\`\`javascript
const code = 'example'
<!-- Missing closing \`\`\` -->

<!-- After -->
\`\`\`javascript
const code = 'example'
\`\`\`
```

3. Disable strict validation temporarily:
```javascript
export default {
  quality: {
    validateMarkdown: false // Disable while fixing issues
  }
}
```

### Problem: Link validation failures

**Symptoms:**
```
Link validation failed:
  - broken-link: ./missing-file.md not found
  - empty-link-text: Link has no text
```

**Solutions:**

1. Fix broken links:
```javascript
// link-fixer.js
const brokenLinks = result.quality.linkIssues

for (const issue of brokenLinks) {
  console.log(`Fix ${issue.file}:${issue.line}`)
  console.log(`  Broken: ${issue.link}`)
  console.log(`  Suggestion: Check if file moved or renamed`)
}
```

2. Ignore external links:
```javascript
class CustomValidator extends QualityValidator {
  validateLinks(content, filePath) {
    // Skip external URLs
    const links = super.validateLinks(content, filePath)
    return links.filter(link => !link.href.startsWith('http'))
  }
}
```

### Problem: Accessibility validation failures

**Symptoms:**
```
Accessibility issues:
  - missing-alt-text: Image without alt text
  - invalid-heading-order: H3 follows H1 (skipped H2)
```

**Solutions:**

1. Add alt text to images:
```markdown
<!-- Before -->
![](./image.png)

<!-- After -->
![Description of image content](./image.png)
```

2. Fix heading hierarchy:
```markdown
<!-- Before -->
# H1 Title
### H3 Subtitle (wrong)

<!-- After -->
# H1 Title
## H2 Subtitle (correct)
```

---

## File Processing Errors

### Problem: File access denied

**Symptoms:**
```
Error: EACCES: permission denied, open './docs/api/file.json'
```

**Solutions:**

1. Fix file permissions:
```bash
chmod -R 755 ./docs
```

2. Run with proper user:
```bash
sudo chown -R $(whoami) ./docs
```

### Problem: File encoding issues

**Symptoms:**
- Strange characters in output
- "Invalid UTF-8" errors

**Solution:**
Ensure UTF-8 encoding:

```javascript
// Custom file processor
import iconv from 'iconv-lite'

class Utf8FileProcessor extends FileProcessor {
  async readFile(path) {
    const buffer = await fs.readFile(path)
    
    // Detect and convert encoding
    const encoding = detect(buffer)
    if (encoding !== 'UTF-8') {
      const content = iconv.decode(buffer, encoding)
      return iconv.encode(content, 'UTF-8').toString()
    }
    
    return buffer.toString('utf-8')
  }
}
```

---

## Integration Issues

### Problem: VitePress sidebar not updating

**Symptoms:**
- Sidebar configuration generated but not reflected in docs
- Import errors in VitePress config

**Solutions:**

1. Verify import path:
```javascript
// .vitepress/config.ts
import { defineConfig } from 'vitepress'

// Check the actual generated file path
import { sidebarApiEn } from './config/api-spec'
// OR
const { sidebarApiEn } = require('./config/api-spec')

export default defineConfig({
  themeConfig: {
    sidebar: {
      '/en/api/': sidebarApiEn()
    }
  }
})
```

2. Restart VitePress dev server:
```bash
# Stop and restart to pick up config changes
npm run docs:dev
```

### Problem: CI/CD pipeline failures

**Symptoms:**
- Works locally but fails in CI
- "File not found" errors in GitHub Actions

**Solutions:**

1. Ensure TypeDoc runs first:
```yaml
- name: Generate TypeDoc
  run: npm run docs:api
  
- name: Wait for TypeDoc
  run: |
    while [ ! -d "./docs/api/generated" ]; do
      echo "Waiting for TypeDoc output..."
      sleep 1
    done

- name: Sync to VitePress
  run: npx typedoc-vitepress-sync sync
```

2. Cache dependencies properly:
```yaml
- name: Cache node modules
  uses: actions/cache@v3
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
```

---

## Debugging Techniques

### Enable verbose logging

```bash
# CLI
npx typedoc-vitepress-sync sync --verbose

# Programmatic
const sync = new TypeDocVitePressSync(config, new ConsoleLogger('debug'))
```

### Use debug mode

```javascript
// Enable Node.js debugging
process.env.DEBUG = 'typedoc-vitepress-sync:*'

// Custom debug logger
class DebugLogger implements Logger {
  debug(message, meta) {
    console.log(`[DEBUG] ${message}`, meta)
    console.trace() // Show stack trace
  }
}
```

### Profile performance

```javascript
import { performance } from 'perf_hooks'

const marks = new Map()

sync.on('fileStart', (file) => {
  marks.set(file, performance.now())
})

sync.on('fileComplete', (file) => {
  const duration = performance.now() - marks.get(file)
  if (duration > 100) {
    console.warn(`Slow file: ${file} took ${duration}ms`)
  }
})
```

### Inspect cache state

```javascript
// cache-inspector.js
import fs from 'fs'
import path from 'path'

const cacheDir = './.typedoc-vitepress-cache'
const manifest = JSON.parse(
  fs.readFileSync(path.join(cacheDir, 'manifest.json'), 'utf-8')
)

console.log('Cache entries:', Object.keys(manifest.entries).length)
console.log('Oldest entry:', new Date(Math.min(
  ...Object.values(manifest.entries).map(e => e.timestamp)
)))

// Find large cache entries
const large = Object.entries(manifest.entries)
  .filter(([_, entry]) => entry.size > 100000)
  .map(([path, entry]) => ({ path, size: entry.size }))

console.log('Large cache entries:', large)
```

### Monitor resource usage

```javascript
import os from 'os'

setInterval(() => {
  const usage = process.memoryUsage()
  console.log('Memory:', {
    rss: `${(usage.rss / 1024 / 1024).toFixed(2)} MB`,
    heap: `${(usage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
    cpu: os.loadavg()[0]
  })
}, 5000)
```

## Getting Help

If you're still experiencing issues:

1. **Check existing issues**: [GitHub Issues](https://github.com/mineclover/context-action/issues)
2. **Enable debug logging**: Set `DEBUG=typedoc-vitepress-sync:*`
3. **Collect diagnostics**: Run with `--verbose` flag
4. **Create minimal reproduction**: Isolate the problem
5. **File an issue**: Include all diagnostic information

### Diagnostic Information to Include

```bash
# System info
node --version
npm --version
npx typedoc-vitepress-sync --version

# Config file
cat typedoc-vitepress-sync.config.js

# Directory structure
ls -la docs/api/generated
ls -la docs/en/api

# Run with verbose logging
DEBUG=* npx typedoc-vitepress-sync sync --verbose 2> debug.log

# Include debug.log in issue report
```