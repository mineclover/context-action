# @context-action/llms-generator Usage Examples

Comprehensive usage examples and real-world scenarios for the llms-generator package.

## Table of Contents

- [Getting Started Examples](#getting-started-examples)
- [Configuration Scenarios](#configuration-scenarios)
- [Document Processing Workflows](#document-processing-workflows)
- [Git Integration Examples](#git-integration-examples)
- [Troubleshooting Examples](#troubleshooting-examples)

## Getting Started Examples

### Example 1: New Project Setup

Setting up llms-generator for a new documentation project:

```bash
# 1. Navigate to your project root
cd my-documentation-project

# 2. Install the package
pnpm add @context-action/llms-generator

# 3. Initialize with standard configuration
npx llms-generator config-init standard

# 4. Verify configuration
npx llms-generator config-show
```

Output:
```json
{
  "characterLimits": [100, 300, 1000, 2000],
  "languages": ["ko", "en"],
  "paths": {
    "docsDir": "./docs",
    "dataDir": "./packages/llms-generator/data",
    "outputDir": "./docs/llms"
  }
}
```

```bash
# 5. Discover your documentation
npx llms-generator discover ko

# 6. Generate priority metadata (preview first)
npx llms-generator priority-generate ko --dry-run
npx llms-generator priority-generate ko --overwrite

# 7. Check what was generated
npx llms-generator priority-stats ko
```

### Example 2: Blog Documentation Setup

Setting up for blog-style content with different character limits:

```bash
# Initialize with blog preset
npx llms-generator config-init blog --path=blog-llms.config.json

# Customize for blog content
cat blog-llms.config.json
```

```json
{
  "characterLimits": [200, 500, 1500],
  "languages": ["en"],
  "paths": {
    "docsDir": "./content",
    "dataDir": "./llms-data",
    "outputDir": "./public/llms"
  }
}
```

```bash
# Process blog content
npx llms-generator --config=blog-llms.config.json priority-generate en --overwrite
npx llms-generator --config=blog-llms.config.json extract en --chars=200,500,1500
```

## Configuration Scenarios

### Scenario 1: Multi-Language Documentation

Configuration for international documentation:

```json
{
  "characterLimits": [100, 300, 1000, 2000],
  "languages": ["en", "ko", "ja", "zh", "es"],
  "paths": {
    "docsDir": "./docs",
    "dataDir": "./data/llms",
    "outputDir": "./dist/llms"
  },
  "extraction": {
    "defaultStrategy": "concept-first",
    "qualityThreshold": 0.85,
    "maxConcurrency": 3
  }
}
```

Processing workflow:
```bash
# Process all languages with different strategies
npx llms-generator priority-generate en --overwrite
npx llms-generator priority-generate ko --overwrite
npx llms-generator priority-generate ja --overwrite

# Extract content for all languages
npx llms-generator extract-all --lang=en,ko,ja --chars=100,300,1000 --overwrite

# Generate compositions for different audiences
npx llms-generator compose en 5000 --priority=80 --output=en-technical.txt
npx llms-generator compose en 2000 --priority=90 --output=en-essentials.txt
```

### Scenario 2: API Documentation Focus

Configuration optimized for API documentation:

```json
{
  "characterLimits": [50, 150, 500, 1500],
  "languages": ["en"],
  "paths": {
    "docsDir": "./api-docs",
    "dataDir": "./api-llms-data",
    "outputDir": "./public/api-llms"
  },
  "extraction": {
    "defaultStrategy": "api-first",
    "qualityThreshold": 0.9
  },
  "composition": {
    "defaultTocEnabled": false,
    "maxDocuments": 50
  }
}
```

API-specific workflow:
```bash
# Generate priorities with API-first strategy
npx llms-generator priority-generate en --category=api --priority=85

# Extract with API focus
npx llms-generator extract en --chars=50,150,500 --strategy=api-first

# Create API reference compositions
npx llms-generator compose en 3000 --no-toc --priority=80 --output=api-reference.txt
npx llms-generator compose en 1000 --no-toc --priority=90 --output=api-quick-ref.txt
```

## Document Processing Workflows

### Workflow 1: Complete Documentation Processing

End-to-end processing of a documentation project:

```bash
# Phase 1: Discovery and Setup
echo "📋 Phase 1: Discovery and Setup"
npx llms-generator config-validate
npx llms-generator discover ko --format=table

# Phase 2: Priority Generation
echo "🎯 Phase 2: Priority Generation"
npx llms-generator priority-generate ko --dry-run  # Preview
npx llms-generator priority-generate ko --overwrite
npx llms-generator priority-stats ko

# Phase 3: Content Extraction
echo "✂️ Phase 3: Content Extraction"
npx llms-generator extract ko --chars=100,300,1000,2000 --overwrite
npx llms-generator work-check ko --show-all

# Phase 4: Quality Check
echo "🔍 Phase 4: Quality Check"
npx llms-generator schema-validate ko --report=validation-report.json
npx llms-generator compose-stats ko

# Phase 5: Content Composition
echo "🎼 Phase 5: Content Composition"
npx llms-generator compose ko 5000 --priority=80 --output=ko-comprehensive.txt
npx llms-generator compose ko 3000 --priority=85 --output=ko-essential.txt
npx llms-generator compose ko 1000 --priority=90 --no-toc --output=ko-quick.txt
```

### Workflow 2: Incremental Updates

Handling updates to existing documentation:

```bash
# Check what needs updating
npx llms-generator work-check ko

# Example output:
# ⚠️  Needs Update (3 documents):
#   - guide-getting-started [100, 300 chars]
#   - api-action-handlers [1000, 2000 chars]
#   - concept-store-pattern [300 chars]
#
# 🔒 Manually Edited (2 documents):
#   - guide-quick-start [100 chars]
#   - api-core-methods [300, 1000 chars]

# Process only outdated content
npx llms-generator work-status ko --need-update --chars=100,300
npx llms-generator extract ko --chars=100,300,1000,2000 --overwrite

# Regenerate compositions
npx llms-generator compose ko 5000 --priority=75 --output=updated-content.txt
```

### Workflow 3: Batch Processing Multiple Languages

Processing documentation in multiple languages efficiently:

```bash
# Process all languages in parallel
npx llms-generator extract-all --lang=en,ko,ja --parallel=3 --overwrite

# Check status across languages
for lang in en ko ja; do
  echo "=== $lang ==="
  npx llms-generator work-check $lang --show-edited
done

# Generate compositions for each language
npx llms-generator compose-batch en --chars=1000,3000,5000 --priority=80
npx llms-generator compose-batch ko --chars=1000,3000,5000 --priority=80
npx llms-generator compose-batch ja --chars=1000,3000,5000 --priority=80
```

## Git Integration Examples

### Example 1: Husky Pre-commit Hook Setup

`.husky/pre-commit`:
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🔍 Checking for documentation changes..."

# Detect modified markdown files (excluding llms directory)
MODIFIED_DOCS=$(git diff --cached --name-only --diff-filter=ACM | grep -E '^docs/(en|ko)/.*\.md' | grep -v llms/ || true)

if [ -n "$MODIFIED_DOCS" ]; then
  echo "📝 Found modified documentation files:"
  echo "$MODIFIED_DOCS" | sed 's/^/  - /'
  
  # Update document status
  echo "🔄 Updating document status..."
  node scripts/update-llms-status.js $MODIFIED_DOCS
  
  # Stage updated metadata files
  git add packages/llms-generator/data/**/priority.json 2>/dev/null || true
  
  echo "✅ Document status updated and staged"
else
  echo "ℹ️ No documentation changes detected"
fi

# Run other pre-commit checks
npm run lint-staged
```

### Example 2: Status Update Script

`scripts/update-llms-status.js`:
```javascript
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Load configuration
function loadConfig() {
  const configPath = path.join(process.cwd(), 'llms-generator.config.json');
  if (!fs.existsSync(configPath)) {
    console.warn('⚠️ No configuration file found, using defaults');
    return { characterLimits: [100, 300, 1000, 2000], languages: ['en', 'ko'] };
  }
  
  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  } catch (error) {
    console.error('❌ Error loading config:', error.message);
    process.exit(1);
  }
}

// Update document status
function updateDocumentStatus(docPath, config) {
  // Extract language and document info
  const pathParts = docPath.split('/');
  const lang = pathParts[1]; // docs/ko/guide/getting-started.md -> ko
  const category = pathParts[2]; // -> guide
  const fileName = path.basename(docPath, '.md'); // -> getting-started
  
  const docId = `${category}-${fileName}`;
  const priorityPath = path.join(
    process.cwd(),
    'packages/llms-generator/data',
    lang,
    docId,
    'priority.json'
  );
  
  if (!fs.existsSync(priorityPath)) {
    console.log(`ℹ️ Priority file not found: ${docId} (${lang})`);
    return;
  }
  
  try {
    const priority = JSON.parse(fs.readFileSync(priorityPath, 'utf-8'));
    const now = new Date().toISOString();
    
    // Initialize work_status if not exists
    if (!priority.work_status) {
      priority.work_status = { generated_files: {} };
    }
    
    // Update source modification time
    priority.work_status.source_modified = now;
    
    // Mark files as needing update (except manually edited ones)
    for (const charLimit of config.characterLimits) {
      const limitStr = charLimit.toString();
      
      if (!priority.work_status.generated_files[limitStr]) {
        priority.work_status.generated_files[limitStr] = {
          edited: false,
          needs_update: true
        };
      } else if (!priority.work_status.generated_files[limitStr].edited) {
        priority.work_status.generated_files[limitStr].needs_update = true;
        priority.work_status.generated_files[limitStr].modified = now;
      }
    }
    
    // Write updated priority file
    fs.writeFileSync(priorityPath, JSON.stringify(priority, null, 2));
    
    const protectedCount = Object.values(priority.work_status.generated_files)
      .filter(file => file.edited).length;
    
    if (protectedCount > 0) {
      console.log(`🔒 Protected (manually edited): ${lang}/${docId} (${protectedCount} files)`);
    } else {
      console.log(`✅ Updated: ${lang}/${docId} (${config.characterLimits.length} files marked for update)`);
    }
    
  } catch (error) {
    console.error(`❌ Error updating ${docId}:`, error.message);
  }
}

// Main execution
function main() {
  const modifiedFiles = process.argv.slice(2);
  
  if (modifiedFiles.length === 0) {
    console.log('ℹ️ No files to process');
    return;
  }
  
  const config = loadConfig();
  
  console.log(`🔄 Processing ${modifiedFiles.length} modified files...`);
  console.log(`📊 Character limits: [${config.characterLimits.join(', ')}]`);
  
  modifiedFiles.forEach(filePath => {
    if (filePath.endsWith('.md')) {
      updateDocumentStatus(filePath, config);
    }
  });
  
  console.log('✅ Status update completed');
}

if (require.main === module) {
  main();
}
```

### Example 3: CI/CD Integration

`.github/workflows/llms-update.yml`:
```yaml
name: LLMs Content Update

on:
  push:
    paths:
      - 'docs/**/*.md'
      - 'llms-generator.config.json'
  pull_request:
    paths:
      - 'docs/**/*.md'

jobs:
  check-status:
    name: Check Document Status
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout repository
        uses: actions/checkout@v3
        
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: pnpm install
        
      - name: Check configuration
        run: |
          npx llms-generator config-validate
          npx llms-generator config-show
          
      - name: Check document status
        run: |
          echo "📊 Checking work status..."
          npx llms-generator work-check --show-all --format=json > status-report.json
          
          # Show summary
          echo "📈 Status Summary:"
          npx llms-generator work-check
          
      - name: Upload status report
        uses: actions/upload-artifact@v3
        with:
          name: status-report
          path: status-report.json
```

## Troubleshooting Examples

### Common Issue 1: Configuration Validation Errors

Problem:
```bash
npx llms-generator config-validate
```

Output:
```
❌ Configuration validation failed:
  - characterLimits must be an array of positive integers
  - languages must be a non-empty array
  - paths.docsDir must be a valid directory path
```

Solution:
```bash
# Check current configuration
npx llms-generator config-show

# Fix configuration
cat > llms-generator.config.json << EOF
{
  "characterLimits": [100, 300, 1000, 2000],
  "languages": ["en", "ko"],
  "paths": {
    "docsDir": "./docs",
    "dataDir": "./packages/llms-generator/data",
    "outputDir": "./docs/llms"
  }
}
EOF

# Validate again
npx llms-generator config-validate
```

### Common Issue 2: Work Status Synchronization Issues

Problem:
```bash
npx llms-generator work-check ko
```

Output:
```
🔍 Checking work status...

⚠️ Inconsistent work status detected:
  - guide-getting-started: Source modified but no needs_update flags
  - api-core-methods: Missing generated files for configured limits [100, 300]
```

Solution:
```bash
# Reset work status for problematic documents
npx llms-generator work-status ko --doc-id=guide-getting-started --reset

# Regenerate missing files
npx llms-generator extract ko --chars=100,300 --doc-id=api-core-methods --overwrite

# Verify fix
npx llms-generator work-check ko --show-all
```

### Common Issue 3: Character Limit Configuration Changes

Problem: Changed character limits in config but getting obsolete files warning.

```bash
npx llms-generator work-check ko --show-missing-config
```

Output:
```
🗑️  Obsolete Limits (5 documents):
  - guide-getting-started [500 chars] (not in config)
  - api-actions [500, 1500 chars] (not in config)
```

Solution:
```bash
# Option 1: Clean up obsolete files
find packages/llms-generator/data -name "*-500.txt" -delete
find packages/llms-generator/data -name "*-1500.txt" -delete

# Option 2: Update config to include old limits temporarily
jq '.characterLimits += [500, 1500]' llms-generator.config.json > temp.json
mv temp.json llms-generator.config.json

# Option 3: Migrate content to new limits
npx llms-generator extract ko --chars=300,1000 --overwrite  # Replace 500 with 300, 1500 with 1000
```

---

This comprehensive usage guide provides practical examples for all major use cases of the @context-action/llms-generator package. For additional technical details, refer to the [API documentation](./API.md).