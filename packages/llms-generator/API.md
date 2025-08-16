# @context-action/llms-generator API Documentation

Complete API reference for the llms-generator package, including both programmatic API and CLI interfaces.

## Table of Contents

- [Programmatic API](#programmatic-api)
  - [Core Classes](#core-classes)
  - [Type Definitions](#type-definitions)
  - [Configuration](#configuration)
- [CLI API](#cli-api)
  - [Command Categories](#command-categories)
  - [Global Options](#global-options)
  - [Exit Codes](#exit-codes)
- [Schema Reference](#schema-reference)
- [Examples](#examples)

## Programmatic API

### Core Classes

#### AdaptiveComposer

Smart content composition engine that selects optimal document combinations based on character limits and priority scores.

```typescript
import { AdaptiveComposer } from '@context-action/llms-generator';

class AdaptiveComposer {
  constructor(
    language: string,
    dataDir: string,
    characterLimits: number[]
  );

  // Compose content for target character count
  async compose(
    targetChars: number,
    options?: CompositionOptions
  ): Promise<CompositionResult>;

  // Get composition statistics
  async getCompositionStats(): Promise<CompositionStats>;
}

interface CompositionOptions {
  minPriority?: number;        // Minimum priority score (default: 0)
  includeToc?: boolean;        // Include table of contents (default: true)
  maxDocuments?: number;       // Maximum documents to include
  strategy?: 'greedy' | 'balanced' | 'quality';  // Selection strategy
}

interface CompositionResult {
  content: string;             // Final composed content
  metadata: {
    totalChars: number;        // Actual character count
    utilization: number;       // Space utilization percentage
    documents: DocumentSelection[];
    tocChars?: number;         // TOC character count
    contentChars: number;      // Content character count
  };
}

interface DocumentSelection {
  documentId: string;
  characterLimit: number;      // Selected character limit
  priority: number;
  chars: number;              // Actual content characters
  title: string;
}
```

#### ContentExtractor

Document content extraction with configurable strategies and character limits.

```typescript
import { ContentExtractor } from '@context-action/llms-generator';

class ContentExtractor {
  constructor(
    sourcePath: string,
    outputDir: string,
    characterLimits: number[]
  );

  // Extract content at specified character limits
  async extractContent(
    priority: PrioritySchema,
    options?: ExtractionOptions
  ): Promise<ExtractionResult>;

  // Extract content for all configured limits
  async extractAllLimits(
    priority: PrioritySchema,
    options?: ExtractionOptions
  ): Promise<ExtractionResult[]>;
}

interface ExtractionOptions {
  overwrite?: boolean;         // Allow overwriting existing files
  dryRun?: boolean;           // Preview without writing files
  strategy?: ExtractStrategy;  // Override priority strategy
  maxLength?: number;         // Hard limit for content length
}

interface ExtractionResult {
  documentId: string;
  characterLimit: number;
  filePath: string;
  success: boolean;
  contentLength: number;
  strategy: string;
  extractedAt: string;        // ISO timestamp
  error?: string;             // Error message if failed
}
```

#### PriorityManager

Priority metadata management and document discovery.

```typescript
import { PriorityManager } from '@context-action/llms-generator';

class PriorityManager {
  constructor(
    language: string,
    docsDir: string,
    dataDir: string
  );

  // Discover documents in source directory
  async discoverDocuments(): Promise<DocumentInfo[]>;

  // Load priority metadata
  async loadPriorities(): Promise<Map<string, PrioritySchema>>;

  // Get priority statistics
  async getPriorityStats(): Promise<PriorityStats>;

  // Update work status
  async updateWorkStatus(
    documentId: string,
    updates: WorkStatusUpdate
  ): Promise<void>;
}

interface DocumentInfo {
  id: string;
  title: string;
  path: string;
  category: string;
  size: number;
  modified: string;          // ISO timestamp
  priority?: PrioritySchema;
}

interface PriorityStats {
  totalDocuments: number;
  byCategory: Record<string, number>;
  byTier: Record<string, number>;
  averageScore: number;
  scoreDistribution: {
    '90-100': number;
    '80-89': number;
    '70-79': number;
    '60-69': number;
    '<60': number;
  };
}

interface WorkStatusUpdate {
  characterLimit: string;
  edited?: boolean;
  needsUpdate?: boolean;
  lastModified?: string;
}
```

#### PrioritySchemaManager

Schema validation and priority template generation.

```typescript
import { PrioritySchemaManager } from '@context-action/llms-generator';

class PrioritySchemaManager {
  constructor(llmContentDir: string);

  // Load and validate schema
  async loadSchema(): Promise<any>;

  // Validate priority object
  validatePriority(priority: PrioritySchema): ValidationResult;

  // Generate priority template
  generatePriorityTemplate(
    options: PriorityGenerationOptions
  ): PrioritySchema;

  // Get schema information
  getSchemaInfo(): SchemaInfo;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

interface SchemaInfo {
  version: string;
  description: string;
  categories: string[];
  tiers: string[];
  strategies: string[];
}
```

### Type Definitions

#### PrioritySchema

Core priority metadata structure:

```typescript
interface PrioritySchema {
  document: {
    id: string;                // kebab-case identifier
    title: string;             // Human-readable title
    source_path: string;       // Relative path from docs root
    category: DocumentCategory;
    subcategory?: string;      // Optional subcategory
  };

  priority: {
    score: number;             // 1-100 priority score
    tier: PriorityTier;       // Tier classification
    rationale?: string;        // Priority reasoning
  };

  purpose: {
    primary_goal: string;      // Main purpose of document
    target_audience: TargetAudience[];
    use_cases?: string[];      // Common use cases
    dependencies?: string[];   // Document dependencies
  };

  keywords: {
    primary: string[];         // Max 5 primary keywords
    technical: string[];       // Technical terms
    patterns?: string[];       // Framework patterns
    avoid?: string[];          // Terms to avoid
  };

  extraction: {
    strategy: ExtractStrategy;
    character_limits: CharacterLimitMap;
    emphasis?: {
      must_include?: string[];
      nice_to_have?: string[];
    };
  };

  quality?: {
    completeness_threshold?: number;     // 0.5-1.0
    code_examples_required?: boolean;
    consistency_checks?: ConsistencyCheck[];
  };

  metadata?: {
    created?: string;          // ISO date
    updated?: string;          // ISO date
    version?: string;
    original_size?: number;    // Original file size
    estimated_extraction_time?: Record<string, string>;
  };

  work_status?: {
    source_modified?: string;  // Last source modification
    generated_files: Record<string, GeneratedFileStatus>;
    last_checked?: string;     // Last status check
  };
}

type DocumentCategory = 'guide' | 'api' | 'concept' | 'example' | 'reference' | 'llms';
type PriorityTier = 'critical' | 'essential' | 'important' | 'reference' | 'supplementary';
type ExtractStrategy = 'concept-first' | 'example-first' | 'api-first' | 'tutorial-first' | 'reference-first';
type TargetAudience = 'beginners' | 'intermediate' | 'advanced' | 'framework-users' | 'contributors' | 'llms';
type ConsistencyCheck = 'terminology' | 'code_style' | 'naming_conventions' | 'pattern_usage' | 'api_signatures';

interface CharacterLimitMap {
  minimum?: CharacterLimitGuideline;
  origin?: CharacterLimitGuideline;
  '100'?: CharacterLimitGuideline;
  '300'?: CharacterLimitGuideline;
  '500'?: CharacterLimitGuideline;
  '1000'?: CharacterLimitGuideline;
  '2000'?: CharacterLimitGuideline;
  '3000'?: CharacterLimitGuideline;
  '4000'?: CharacterLimitGuideline;
}

interface CharacterLimitGuideline {
  focus?: string;              // What to focus on
  structure?: string;          // How to structure content
  must_include?: string[];     // Required elements
  avoid?: string[];           // Elements to avoid
  example_structure?: string;  // Structure example
}

interface GeneratedFileStatus {
  path?: string;              // File path
  created?: string;           // ISO timestamp
  modified?: string;          // ISO timestamp
  edited: boolean;            // Manually edited flag
  needs_update: boolean;      // Requires regeneration
}
```

### Configuration

#### Configuration File Schema

```typescript
interface LLMSGeneratorConfig {
  characterLimits: number[];   // Character limits to generate
  languages: string[];         // Supported languages
  paths: {
    docsDir: string;          // Source documentation directory
    dataDir: string;          // Generated data directory
    outputDir: string;        // Final output directory
  };
  extraction?: {
    defaultStrategy?: ExtractStrategy;
    qualityThreshold?: number;
    maxConcurrency?: number;
  };
  composition?: {
    defaultTocEnabled?: boolean;
    minSpaceUtilization?: number;
    maxDocuments?: number;
  };
}
```

#### Configuration Presets

Available configuration presets:

```typescript
const CONFIG_PRESETS: Record<string, ConfigPreset> = {
  minimal: {
    characterLimits: [100, 500],
    description: 'Basic setup for small projects'
  },
  standard: {
    characterLimits: [100, 300, 1000, 2000],
    description: 'Standard configuration for most projects'
  },
  extended: {
    characterLimits: [50, 100, 300, 500, 1000, 2000, 4000],
    description: 'Comprehensive setup for large documentation'
  },
  blog: {
    characterLimits: [200, 500, 1500],
    description: 'Blog-focused content lengths'
  }
};
```

## CLI API

### Command Categories

#### Configuration Management

```bash
# Initialize configuration
llms-generator config-init <preset> [options]
  --path=<file>          # Custom config file path (default: llms-generator.config.json)

# Show current configuration
llms-generator config-show [options]
  --path=<file>          # Custom config file path

# Validate configuration
llms-generator config-validate [options]
  --path=<file>          # Custom config file path

# Show character limits
llms-generator config-limits [options]
  --path=<file>          # Custom config file path
```

#### Document Discovery & Priority Management

```bash
# Generate priority metadata files
llms-generator priority-generate <language> [options]
  --overwrite            # Overwrite existing files
  --dry-run             # Preview without writing
  --category=<cat>      # Filter by category
  --priority=<score>    # Default priority score

# Show priority statistics
llms-generator priority-stats <language> [options]
  --category=<cat>      # Filter by category
  --tier=<tier>         # Filter by tier

# Discover source documents
llms-generator discover <language> [options]
  --category=<cat>      # Filter by category
  --format=json|table   # Output format
```

#### Content Processing

```bash
# Extract content summaries
llms-generator extract <language> [options]
  --chars=<limits>      # Comma-separated character limits
  --overwrite           # Overwrite existing files
  --dry-run             # Preview without writing
  --strategy=<strategy> # Override extraction strategy

# Batch extract all languages
llms-generator extract-all [options]
  --lang=<languages>    # Comma-separated languages (default: all)
  --chars=<limits>      # Character limits to process
  --overwrite           # Overwrite existing files
  --parallel=<n>        # Parallel processing count

# Generate composed content
llms-generator compose <language> <target-chars> [options]
  --priority=<min>      # Minimum priority score
  --no-toc              # Disable table of contents
  --output=<file>       # Output file path
  --format=txt|md       # Output format

# Batch composition
llms-generator compose-batch <language> [options]
  --chars=<limits>      # Target character counts
  --priority=<min>      # Minimum priority score
  --output-dir=<dir>    # Output directory
```

#### Work Status Management

```bash
# Check document work status
llms-generator work-check [language] [options]
  --show-all            # Show all documents including up-to-date
  --show-edited         # Show manually edited files
  --show-missing-config # Show files with obsolete character limits
  --format=json|table   # Output format

# Detailed work status by file
llms-generator work-status <language> [options]
  --need-update         # Show only files needing updates
  --edited              # Show only manually edited files
  --chars=<limits>      # Filter by character limits
  --doc-id=<id>         # Show specific document

# List work files
llms-generator work-list <language> [options]
  --chars=<limits>      # Filter by character limits
  --missing             # Show only missing files
  --outdated            # Show only outdated files
  --status=<status>     # Filter by status (need-update|edited|current)
```

#### Schema & Validation

```bash
# Generate or update schema files
llms-generator schema-generate [options]
  --overwrite           # Overwrite existing schema
  --output=<file>       # Schema output file
  --no-types            # Skip TypeScript type generation
  --no-validators       # Skip validator generation

# Validate priority files
llms-generator schema-validate <language> [options]
  --fix-errors          # Attempt to fix validation errors
  --report=<file>       # Generate validation report
```

#### Statistics & Analysis

```bash
# Show composition statistics
llms-generator compose-stats <language> [options]
  --chars=<limit>       # Specific character limit analysis
  --priority=<min>      # Minimum priority threshold

# Generate usage statistics
llms-generator stats [options]
  --lang=<languages>    # Languages to analyze
  --format=json|table   # Output format
  --detailed            # Include detailed breakdown
```

### Global Options

Options available for all commands:

```bash
--help, -h              # Show command help
--version, -v           # Show version information
--verbose               # Enable verbose logging
--quiet, -q             # Suppress non-error output
--config=<file>         # Custom configuration file path
--no-color              # Disable colored output
--json                  # Output in JSON format (where applicable)
```

### Exit Codes

The CLI uses standard exit codes:

- `0` - Success
- `1` - General error
- `2` - Configuration error
- `3` - Validation error
- `4` - File system error
- `5` - Network/external dependency error
- `130` - Interrupted by user (Ctrl+C)

## Schema Reference

### Priority Schema JSON Schema

The priority schema defines the structure and validation rules for priority metadata files:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "LLMs Generator Priority Schema",
  "type": "object",
  "required": ["document", "priority", "purpose", "keywords", "extraction"],
  "properties": {
    "document": {
      "type": "object",
      "required": ["id", "title", "source_path", "category"],
      "properties": {
        "id": {
          "type": "string",
          "pattern": "^[a-z0-9]+(-[a-z0-9]+)*$",
          "description": "Kebab-case document identifier"
        },
        "title": {
          "type": "string",
          "minLength": 1,
          "maxLength": 200
        },
        "source_path": {
          "type": "string",
          "pattern": "^[a-zA-Z0-9_/-]+\\.md$"
        },
        "category": {
          "enum": ["guide", "api", "concept", "example", "reference", "llms"]
        }
      }
    },
    "priority": {
      "type": "object",
      "required": ["score", "tier"],
      "properties": {
        "score": {
          "type": "integer",
          "minimum": 1,
          "maximum": 100
        },
        "tier": {
          "enum": ["critical", "essential", "important", "reference", "supplementary"]
        }
      }
    }
    // ... additional schema properties
  }
}
```

### Work Status Schema

Work status tracking schema:

```json
{
  "work_status": {
    "type": "object",
    "properties": {
      "source_modified": {
        "type": "string",
        "format": "date-time"
      },
      "generated_files": {
        "type": "object",
        "patternProperties": {
          "^[0-9]+$": {
            "type": "object",
            "properties": {
              "path": { "type": "string" },
              "created": { "type": "string", "format": "date-time" },
              "modified": { "type": "string", "format": "date-time" },
              "edited": { "type": "boolean" },
              "needs_update": { "type": "boolean" }
            },
            "required": ["edited", "needs_update"]
          }
        }
      },
      "last_checked": {
        "type": "string",
        "format": "date-time"
      }
    }
  }
}
```

## Examples

### Programmatic Usage

```typescript
import {
  AdaptiveComposer,
  PriorityManager,
  ContentExtractor,
  type PrioritySchema
} from '@context-action/llms-generator';

// Initialize components
const priorityManager = new PriorityManager('ko', './docs', './data');
const composer = new AdaptiveComposer('ko', './data', [100, 300, 1000, 2000]);

// Discover and process documents
async function processDocuments() {
  // Discover documents
  const documents = await priorityManager.discoverDocuments();
  console.log(`Found ${documents.length} documents`);

  // Generate composed content
  const result = await composer.compose(5000, {
    minPriority: 80,
    includeToc: true,
    strategy: 'balanced'
  });

  console.log(`Generated ${result.metadata.totalChars} characters`);
  console.log(`Space utilization: ${result.metadata.utilization}%`);

  return result.content;
}

// Custom priority template generation
import { PrioritySchemaManager } from '@context-action/llms-generator';

const schemaManager = new PrioritySchemaManager('./data');
await schemaManager.loadSchema();

const customPriority = schemaManager.generatePriorityTemplate({
  documentId: 'guide-advanced-patterns',
  language: 'ko',
  category: 'guide',
  priorityScore: 85,
  priorityTier: 'essential',
  strategy: 'concept-first'
});

const validation = schemaManager.validatePriority(customPriority);
if (!validation.valid) {
  console.error('Validation errors:', validation.errors);
}
```

### CLI Usage Examples

```bash
# Complete workflow example
# 1. Initialize configuration
npx llms-generator config-init standard

# 2. Discover and generate priorities
npx llms-generator discover ko
npx llms-generator priority-generate ko --dry-run
npx llms-generator priority-generate ko --overwrite

# 3. Extract content summaries
npx llms-generator extract ko --chars=100,300,1000 --overwrite

# 4. Check work status
npx llms-generator work-check ko --show-all

# 5. Generate composed content
npx llms-generator compose ko 5000 --priority=80 --output=./output/ko-5000.txt

# Batch processing example
npx llms-generator extract-all --lang=ko,en --chars=100,300,1000,2000
npx llms-generator compose-batch ko --chars=1000,3000,5000,10000 --priority=75

# Status monitoring example
npx llms-generator work-status ko --need-update --chars=100,300
npx llms-generator work-list ko --missing --chars=1000

# Validation example
npx llms-generator schema-validate ko --fix-errors --report=validation-report.json
```

### Integration Examples

#### Git Hook Integration

`.husky/pre-commit`:
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Check for modified documentation
MODIFIED_DOCS=$(git diff --cached --name-only --diff-filter=ACM | grep -E '^docs/(en|ko)/.*\.md' | grep -v llms/ || true)

if [ -n "$MODIFIED_DOCS" ]; then
  echo "📝 Updating document status for modified files..."
  node scripts/update-llms-status.js $MODIFIED_DOCS
  
  # Add updated priority files
  git add packages/llms-generator/data/**/priority.json 2>/dev/null || true
  
  echo "✅ Document status updated"
fi
```

#### CI/CD Integration

```yaml
# .github/workflows/docs-update.yml
name: Update Document Status

on:
  push:
    paths:
      - 'docs/**/*.md'

jobs:
  update-status:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: pnpm install
        
      - name: Check document status
        run: |
          npx llms-generator work-check --show-all
          npx llms-generator work-status en ko --need-update
          
      - name: Regenerate outdated content
        run: |
          npx llms-generator extract-all --overwrite
          
      - name: Commit updated metadata
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add packages/llms-generator/data/**/priority.json
          git commit -m "docs: update document metadata" || exit 0
          git push
```

---

This API documentation provides comprehensive coverage of both programmatic and CLI interfaces for the @context-action/llms-generator package. For additional examples and usage patterns, see the [Usage Examples](./USAGE_EXAMPLES.md) documentation.