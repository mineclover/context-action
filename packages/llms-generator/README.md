# @context-action/llms-generator

**Priority-based document summarization and content generation system for LLM consumption**

A sophisticated document processing system that automatically generates multi-length summaries from documentation, with intelligent priority management and seamless Git workflow integration.

[![npm version](https://badge.fury.io/js/@context-action%2Fllms-generator.svg)](https://www.npmjs.com/package/@context-action/llms-generator)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🎯 Key Features

### Intelligent Document Processing
- **Adaptive Composition**: Automatically selects optimal content combinations based on character limits
- **Priority-Based Selection**: Smart document selection using configurable priority scores
- **Multi-Length Support**: Generate summaries at multiple character limits (100, 300, 1000, 2000+ chars)
- **Strategy-Based Extraction**: Different extraction strategies (concept-first, api-first, tutorial-first)

### Git Workflow Integration
- **Automatic Update Detection**: Husky pre-commit hooks detect document changes
- **Status Tracking**: Comprehensive work status management with `needs_update` flags
- **Protected Edits**: Manual edits are protected from automatic regeneration
- **Seamless Commits**: Updated metadata files are automatically staged

### Advanced CLI Tooling
- **Configuration Management**: Simple config initialization with multiple presets
- **Work Status Monitoring**: Track which documents need updates or manual editing
- **Batch Operations**: Process multiple languages and character limits simultaneously
- **Dry Run Support**: Preview operations before execution

## 🚀 Quick Start

### 1. Installation

```bash
npm install @context-action/llms-generator
# or
pnpm add @context-action/llms-generator
```

### 2. Initialize Configuration

```bash
# Standard configuration [100, 300, 1000, 2000]
npx llms-generator config-init standard

# Other presets available
npx llms-generator config-init minimal    # [100, 500]
npx llms-generator config-init extended   # [50, 100, 300, 500, 1000, 2000, 4000]
npx llms-generator config-init blog       # [200, 500, 1500]
```

### 3. Set Up Git Integration (Optional)

The package works seamlessly with Husky pre-commit hooks for automatic document update detection:

```bash
# Install Husky (if not already installed)
npx husky install

# The pre-commit hook will automatically:
# - Detect modified documentation files
# - Update corresponding priority.json files with needs_update flags
# - Stage updated metadata files for commit
```

## 📋 Configuration File

Create `llms-generator.config.json` in your project root:

```json
{
  "characterLimits": [100, 300, 1000, 2000],
  "languages": ["ko", "en", "ja"],
  "paths": {
    "docsDir": "./docs",
    "dataDir": "./packages/llms-generator/data",
    "outputDir": "./docs/llms"
  }
}
```

## 🛠️ Core Workflows

### Document Discovery & Priority Generation

```bash
# Discover documents and generate priority metadata
npx llms-generator priority-generate ko --dry-run  # Preview
npx llms-generator priority-generate ko --overwrite  # Execute

# Check what was generated
npx llms-generator priority-stats ko
npx llms-generator discover ko
```

### Content Extraction & Summarization

```bash
# Extract content at specific character limits
npx llms-generator extract ko --chars=100,300,1000

# Batch extract for all languages
npx llms-generator extract-all --lang=en,ko --overwrite

# Check extraction results
npx llms-generator compose-stats ko
```

### Work Status Management

```bash
# Check which documents need updates
npx llms-generator work-check ko

# Show detailed status including manually edited files
npx llms-generator work-check ko --show-edited --show-all

# Check specific character limits
npx llms-generator work-status ko --chars=100,300 --need-update
```

### Adaptive Content Composition

```bash
# Generate composed content with automatic optimization
npx llms-generator compose ko 5000  # 5000 characters with TOC

# High-priority documents only
npx llms-generator compose ko 3000 --priority=85

# No table of contents
npx llms-generator compose ko 10000 --no-toc

# Batch composition
npx llms-generator compose-batch ko --chars=1000,3000,5000,10000
```

## 🏗️ Architecture

### Directory Structure

```
packages/llms-generator/
├── src/
│   ├── core/
│   │   ├── AdaptiveComposer.ts      # Smart content composition
│   │   ├── ContentExtractor.ts      # Document extraction
│   │   ├── PriorityGenerator.ts     # Priority metadata generation
│   │   ├── PriorityManager.ts       # Priority management
│   │   └── PrioritySchemaManager.ts # Schema validation
│   ├── cli/
│   │   ├── commands/                # CLI command implementations
│   │   └── index.ts                 # CLI entry point
│   └── types/                       # TypeScript definitions
├── data/
│   ├── priority-schema-enhanced.json # Enhanced validation schema
│   ├── ko/                         # Korean content
│   │   └── {doc-id}/
│   │       ├── priority.json       # Document metadata + work status
│   │       ├── {doc-id}-100.txt    # 100-char summary
│   │       ├── {doc-id}-300.txt    # 300-char summary
│   │       └── {doc-id}-1000.txt   # 1000-char summary
│   └── en/                         # English content
└── scripts/                       # Utility scripts
```

### Priority Metadata Structure

Each document has a `priority.json` file with comprehensive metadata:

```json
{
  "document": {
    "id": "guide-getting-started",
    "title": "Getting Started Guide",
    "source_path": "guide/getting-started.md",
    "category": "guide"
  },
  "priority": {
    "score": 90,
    "tier": "essential",
    "rationale": "Critical for new users"
  },
  "purpose": {
    "primary_goal": "Onboard new framework users",
    "target_audience": ["beginners", "framework-users"],
    "use_cases": ["Quick start", "Initial setup", "First implementation"]
  },
  "keywords": {
    "primary": ["Context-Action", "getting started", "setup"],
    "technical": ["installation", "configuration", "initialization"]
  },
  "extraction": {
    "strategy": "tutorial-first",
    "character_limits": {
      "100": { "focus": "Installation command and first step" },
      "300": { "focus": "Complete setup process with key concepts" },
      "1000": { "focus": "Full tutorial with examples and next steps" }
    }
  },
  "work_status": {
    "source_modified": "2025-08-15T17:01:38.519Z",
    "generated_files": {
      "100": { "edited": false, "needs_update": true },
      "300": { "edited": true, "needs_update": false },
      "1000": { "edited": false, "needs_update": false }
    }
  }
}
```

### Adaptive Composition Algorithm

1. **Table of Contents Generation**: Uses 100-char summaries ordered by priority
2. **Space Calculation**: Target characters minus TOC characters = content space
3. **Optimal Selection**: Selects highest priority documents with best-fit character limits
4. **Space Utilization**: Targets 95%+ space utilization for optimal content density

## 🔧 Advanced Features

### Work Status Tracking

The system tracks the lifecycle of each generated file:

- **`needs_update`**: Source document was modified, regeneration needed
- **`edited`**: File was manually edited, protected from auto-regeneration
- **`up_to_date`**: File is current and matches source content

### Git Integration

Automatic workflow integration with Husky:

```bash
# .husky/pre-commit
MODIFIED_DOCS=$(git diff --cached --name-only --diff-filter=ACM | grep -E '^docs/(en|ko)/.*\.md' | grep -v llms/ || true)
if [ -n "$MODIFIED_DOCS" ]; then
  node scripts/update-llms-status.js $MODIFIED_DOCS
  git add packages/llms-generator/data/**/priority.json 2>/dev/null || true
fi
```

### Configuration-Based Character Limits

The system automatically adapts to your configuration:

- **Config-driven processing**: Only generates files for configured character limits
- **Obsolete detection**: Identifies files for limits no longer in config
- **Dynamic validation**: Updates work status based on current configuration

### Schema Validation

Comprehensive JSON Schema validation ensures data integrity:

- **Document metadata validation**: Ensures required fields and proper structure
- **Priority scoring validation**: Validates score ranges (1-100) and tier alignment
- **Extraction strategy validation**: Ensures valid extraction strategies and guidelines

## 📊 CLI Commands Reference

### Configuration Commands

| Command | Description | Options |
|---------|-------------|---------|
| `config-init <preset>` | Initialize configuration with preset | `--path` |
| `config-show` | Display current configuration | |
| `config-validate` | Validate configuration file | |
| `config-limits` | Show configured character limits | |

### Priority Management Commands

| Command | Description | Options |
|---------|-------------|---------|
| `priority-generate <lang>` | Generate priority metadata files | `--overwrite`, `--dry-run` |
| `priority-stats <lang>` | Show priority statistics | |
| `discover <lang>` | List discovered documents | |

### Content Processing Commands

| Command | Description | Options |
|---------|-------------|---------|
| `extract <lang>` | Extract content summaries | `--chars`, `--overwrite` |
| `extract-all` | Batch extract all languages | `--lang`, `--overwrite` |
| `compose <lang> <chars>` | Generate composed content | `--priority`, `--no-toc` |
| `compose-batch <lang>` | Batch compose multiple sizes | `--chars` |

### Work Status Commands

| Command | Description | Options |
|---------|-------------|---------|
| `work-check <lang>` | Check document work status | `--show-edited`, `--show-all` |
| `work-status <lang>` | Detailed work status by file | `--need-update`, `--chars` |

### Common Options

- `--overwrite`: Allow overwriting existing files
- `--dry-run`: Preview operations without executing
- `--chars=100,300,1000`: Specify character limits to process
- `--lang=ko,en`: Specify languages for batch operations
- `--priority=80`: Filter by minimum priority score

## 🎯 Best Practices

### 1. Priority Score Guidelines
- **90-100**: Critical documentation (getting started, core concepts)
- **80-89**: Essential guides and API references
- **70-79**: Important implementation guides
- **60-69**: Reference materials and examples
- **<60**: Supplementary content

### 2. Character Limit Strategy
- **100 chars**: Navigation and quick reference (TOC generation)
- **300 chars**: Core concept summaries for overview
- **1000 chars**: Detailed explanations with context
- **2000+ chars**: Comprehensive coverage for complex topics

### 3. Manual Edit Protection
- Mark files as manually edited to protect from auto-regeneration
- Use high-quality manually crafted summaries for critical content
- The system preserves `edited: true` flags across updates

### 4. Git Workflow Integration
- Enable Husky pre-commit hooks for automatic update detection
- Review `needs_update` flags before regenerating content
- Commit both source changes and updated metadata together

## 🚨 Important Notes

### File Management
- The `data/` directory contains generated content and should be in `.gitignore`
- Only `priority.json` metadata files should be committed to version control
- Generated `.txt` files are excluded but metadata is preserved

### Character Encoding
- All files use UTF-8 encoding
- Supports Unicode content for international documentation
- Proper handling of multi-byte characters in length calculations

### Performance Considerations
- Large document sets (100+ files) process in under 1 second
- Memory usage scales linearly with document count
- Parallel processing for multi-language batch operations

## 🤝 Development & Contributing

### Development Commands

```bash
# Build the package
pnpm build

# Run tests
pnpm test
pnpm test:watch

# Type checking
pnpm type-check

# Development with watch mode
pnpm dev
```

### Contributing Guidelines

1. **New Extraction Strategies**: Add to `PrioritySchemaManager.ts`
2. **Composition Algorithm Improvements**: Modify `AdaptiveComposer.ts`
3. **CLI Commands**: Add to `src/cli/commands/`
4. **Language Support**: Update configuration schemas and validation

### Architecture Decisions

- **TypeScript-first**: Full type safety throughout
- **Schema-driven**: JSON Schema validation for all metadata
- **CLI-focused**: Comprehensive command-line interface
- **Git-integrated**: Seamless version control workflow

---

The @context-action/llms-generator package is designed to transform your documentation into LLM-optimized content while maintaining quality, traceability, and developer workflow integration. It bridges the gap between human-readable documentation and machine-consumable content summaries.

For detailed API documentation and advanced usage examples, see the [API documentation](./API.md) and [Usage Examples](./USAGE_EXAMPLES.md).