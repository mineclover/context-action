# @context-action/llms-generator

> ⚠️ **개발 중 (Under Development)** - 이 패키지는 현재 적극적으로 개발 중입니다. API가 변경될 수 있습니다.  
> This package is under active development. APIs may change.

**Enterprise-grade LLM content generation framework for Context-Action documentation**

TypeScript library and CLI tools for generating optimized content from documentation with intelligent categorization, priority-based selection, and multi-language support.

## 📚 Documentation

- [**CLI Reference**](../../docs/en/guide/llms-cli-reference.md) - Core command reference
- [**Comprehensive Implementation Reference**](../../docs/en/guide/llms-cli-comprehensive-reference.md) - Complete implementation guide
- [**Korean Documentation**](../../docs/ko/guide/llms-cli-reference.md) - 한국어 문서

[![npm version](https://badge.fury.io/js/@context-action%2Fllms-generator.svg)](https://www.npmjs.com/package/@context-action/llms-generator)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
![Development Status](https://img.shields.io/badge/status-under%20development-orange)

## 🆕 What's New in v0.3.1

- **🌍 Global CLI Installation**: Install globally with `npm install -g @context-action/llms-generator` and use `llms` command anywhere
- **📋 Enhanced YAML Frontmatter**: Comprehensive metadata generation for all template files with `sync-docs` command
- **🔧 Git Hook Integration**: Automatic post-commit document synchronization with status updates
- **📁 Consistent File Naming**: Standardized `priority.json` naming convention across all documents
- **🔄 Document Synchronization**: New `sync-docs` and `simple-sync` commands for automated workflow management
- **✅ Improved Path Resolution**: Fixed LLMS document links to show original document paths instead of template paths

## 🚀 Quick Start

### Global Installation (Recommended)

```bash
# Global installation for CLI access anywhere
npm install -g @context-action/llms-generator

# Use the llms command globally
llms config-init standard
llms batch
```

### Local Installation

```bash
# Local project installation
npm install @context-action/llms-generator
# or
pnpm add @context-action/llms-generator
```

### Basic CLI Usage

```bash
# Global CLI (after global installation)
llms config-init standard          # Initialize with standard preset
llms batch                          # Generate all content formats
llms chars 1000 en                  # Generate specific character limit
llms generate-md en                 # Generate markdown with YAML frontmatter
llms generate-all                   # Generate all languages at once

# Local CLI (npx)
npx llms-generator config-init standard
npx llms-generator batch
npx llms-generator chars 1000 en

# Advanced LLMS-TXT generation with filtering
llms llms-generate --chars=100 --category=api
llms llms-generate --pattern=minimum --lang=ko

# Work status and document management
llms work-next                      # Find next work item
llms work-status ko                 # Check Korean document status
llms sync-docs                      # Sync and generate summaries with YAML frontmatter
```

### Library Usage

```typescript
import { LLMSGenerator, CategoryMinimumGenerator } from '@context-action/llms-generator';

// Main LLMS generation
const generator = new LLMSGenerator(config);
await generator.generate({
  languages: ['en', 'ko'],
  formats: ['minimum', 'origin', 'chars'],
  characterLimits: [100, 300, 1000, 2000]
});

// Category-based generation
const categoryGen = new CategoryMinimumGenerator(config);
const result = await categoryGen.generateSingle('api-spec', 'en');
```

## 🎯 Key Features

### 🔧 Configuration Management
- **Multiple Presets**: minimal, standard, extended presets available
- **Validation**: Built-in config validation with detailed error reporting  
- **Auto-discovery**: Automatic path resolution and project structure detection
- **📖 [Configuration Guide](./CONFIG.md)**: Complete configuration documentation

### 📝 Content Generation
- **Multiple Formats**: minimum, origin, character-limited variants
- **Batch Processing**: Generate all content with single command
- **Priority-Based**: Intelligent document prioritization and selection
- **Quality Control**: Built-in quality evaluation and improvement suggestions
- **Template Auto-Fill**: Automatically populate template files with source content
- **Markdown Generation**: Generate individual .md files with comprehensive YAML frontmatter
- **Bulk Generation**: `generate-all` command for all languages at once
- **Document Synchronization**: Auto-sync with git hooks, YAML frontmatter generation
- **Global CLI Access**: Use `llms` command from anywhere after global installation

### 🌐 Multi-Language Support
- **Primary Languages**: Korean (ko), English (en)
- **Extensible**: Easy addition of new languages
- **Localized Templates**: Language-specific instruction templates

### 🔄 Work Status Management
- **Smart Tracking**: Automatic detection of outdated content
- **Context Provision**: Complete work context for editing
- **Progress Monitoring**: Real-time work status and completion tracking

### 🎨 Adaptive Composition
- **Dynamic Content**: Character limit-aware content composition
- **Priority Optimization**: Intelligent content selection within limits
- **Table of Contents**: Auto-generated navigation
- **Placeholder System**: Automatic placeholder generation for missing source files
- **Work Status Tracking**: Track document status with `generated` or `placeholder` markers

## 📋 Available Commands

### Configuration
```bash
llms config-init [preset]           # Initialize with preset (minimal|standard|extended)
llms config-show                    # Show current configuration
llms config-validate                # Validate configuration
llms config-limits                  # Show character limits and settings

# With npx (local installation)
npx llms-generator config-init standard
```

### Content Generation
```bash
llms minimum                        # Generate minimum format
llms origin                         # Generate origin format  
llms chars <limit> [lang]           # Generate specific limit
llms batch [options]                # Generate all formats

# Template Management
llms fill-templates [lang]          # Auto-fill template files with content
llms fill-templates en              # Fill English templates
llms fill-templates ko              # Fill Korean templates

# Advanced LLMS-TXT Generation
llms llms-generate [options]        # Generate with filtering & patterns
llms llms-generate --chars=100 --category=api    # Filter by char limit & category
llms llms-generate --pattern=minimum --lang=ko   # Use specific pattern

# Document Synchronization (NEW!)
llms sync-docs                      # Sync docs and generate YAML frontmatter summaries
llms generate-summaries             # Generate YAML frontmatter for all documents
```

### Priority & Discovery
```bash
npx llms-generator priority-generate [lang] # Generate priority files
npx llms-generator priority-stats [lang]    # Show statistics
npx llms-generator discover [lang]          # Discover documents
```

### Work Management
```bash
llms work-next [options]            # Identify next work item
llms work-status [lang]             # Check work status
llms work-context <lang> <id>       # Get work context
llms work-list [lang]               # List work needed
llms work-check [lang]              # Enhanced work check
```

### Adaptive Composition
```bash
npx llms-generator compose [lang] [chars]   # Compose content
npx llms-generator compose-batch [lang]     # Batch composition
npx llms-generator compose-stats [lang]     # Show statistics
```

### Template Management
```bash
npx llms-generator fill-templates [lang]    # Auto-fill template files with content
npx llms-generator fill-templates en        # Fill English templates only  
npx llms-generator fill-templates ko        # Fill Korean templates only
npx llms-generator fill-templates --dry-run # Preview changes without writing files
```

### Markdown Generation
```bash
llms generate-md [lang]             # Generate .md files for specific language
llms generate-all                   # Generate .md files for all languages
llms generate-all --chars=100,500,1000     # Custom character limits

# Document Synchronization (v0.3.1)
llms sync-docs                      # Sync docs with comprehensive YAML frontmatter
llms simple-sync [lang]             # Simple sync for specific language
```

### Advanced Features
```bash
llms extract [lang]                 # Extract summaries
llms markdown-generate [lang]       # Generate markdown (VitePress)
llms instruction-generate           # Generate instructions
llms generate-summaries             # YAML frontmatter summaries

# Document Synchronization (v0.3.1)
llms sync-docs                      # Full document sync with YAML frontmatter
llms simple-sync [lang]             # Simple language-specific sync
```

## ⚙️ Configuration

Create `llms-generator.config.json`:

```json
{
  "characterLimits": [100, 300, 1000, 2000, 5000],
  "languages": ["ko", "en"],
  "paths": {
    "docsDir": "./docs",
    "dataDir": "./data",
    "outputDir": "./data",
    "templatesDir": "./templates",
    "instructionsDir": "./instructions"
  },
  "generation": {
    "defaultLanguage": "ko",
    "formats": ["minimum", "origin", "chars"],
    "qualityThreshold": 70
  },
  "optimization": {
    "enableCaching": true,
    "parallelProcessing": true,
    "maxConcurrency": 4
  }
}
```

### Configuration Presets

- **minimal**: Basic setup with 2 character limits
- **standard**: Balanced setup with 4 character limits (default)
- **extended**: Comprehensive setup with 6 character limits
- **blog**: Blog-optimized with SEO focus
- **documentation**: Technical documentation focus

## 📁 Project Structure

```
packages/llms-generator/
├── src/
│   ├── cli/                              # Command-line interface
│   │   ├── index.ts                      # Main CLI entry point
│   │   └── commands/                     # Individual commands
│   ├── core/                             # Core functionality
│   │   ├── LLMSGenerator.ts              # Main generator
│   │   ├── CategoryMinimumGenerator.ts   # Category-based generation
│   │   ├── AdaptiveComposer.ts           # Content composition
│   │   ├── ConfigManager.ts              # Configuration management
│   │   └── WorkStatusManager.ts          # Work tracking
│   ├── domain/                           # Domain objects
│   │   ├── entities/                     # Business entities
│   │   ├── value-objects/                # Value objects
│   │   └── repositories/                 # Repository interfaces
│   ├── infrastructure/                   # Infrastructure layer
│   │   ├── repositories/                 # Repository implementations
│   │   ├── services/                     # External services
│   │   └── di/                           # Dependency injection
│   └── types/                            # TypeScript definitions
├── test/                                 # Test suites
│   ├── unit/                             # Unit tests
│   ├── integration/                      # Integration tests
│   ├── e2e/                              # End-to-end tests
│   └── scripts/                          # Test scripts
├── examples/                             # Usage examples
│   ├── demo.ts                           # Demo script
│   └── library-usage.js                 # Library usage example
└── scripts/                              # Utility scripts
```

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run specific test suites
pnpm test -- scenarios.test.ts

# Run migrated test scripts
pnpm test:llms
pnpm test:category
pnpm test:save-results

# Run demo
pnpm demo
pnpm demo:verbose
```

## 🔧 Development Scripts

```bash
# Build and development
pnpm build                               # Build the package
pnpm dev                                 # Watch mode
pnpm type-check                          # TypeScript checking

# Testing
pnpm test                                # Run all tests
pnpm test:watch                          # Watch mode testing

# Quality
pnpm lint                                # (temporarily disabled)
pnpm clean                               # Clean build artifacts

# Global CLI utilities (v0.3.1)
pnpm cli                                 # Direct CLI access (local)
npm install -g .                         # Install globally for development
llms --version                           # Check global installation
```

## 🏗️ Architecture

### Clean Architecture Implementation
- **Domain Layer**: Business logic and entities
- **Application Layer**: Use cases and application services
- **Infrastructure Layer**: External concerns and implementations
- **Interface Layer**: CLI and API interfaces

### Key Patterns
- **Repository Pattern**: Data access abstraction
- **Dependency Injection**: Loose coupling and testability
- **Result Pattern**: Explicit error handling
- **Value Objects**: Domain modeling and type safety

### Quality Features
- **Type Safety**: Full TypeScript implementation
- **Error Handling**: Comprehensive error management
- **Validation**: Input validation and sanitization
- **Performance**: Optimized for large document sets
- **Extensibility**: Plugin-based architecture support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Run tests: `pnpm test`
5. Commit changes: `git commit -m 'Add amazing feature'`
6. Push to branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🔗 Related Packages

- [@context-action/core](../core) - Core action pipeline management
- [@context-action/react](../react) - React integration with hooks and context

## 🚀 Performance & Scale

- **Large Document Sets**: Handles 1000+ documents efficiently
- **Parallel Processing**: Multi-threaded generation support
- **Memory Efficient**: Streaming processing for large files
- **Caching**: Intelligent caching for repeated operations
- **Incremental Updates**: Only regenerate changed content

## 📊 Metrics & Analytics

- **Generation Statistics**: Detailed metrics on content generation
- **Quality Scoring**: Automatic quality assessment
- **Performance Tracking**: Generation time and resource usage
- **Work Analytics**: Progress tracking and completion rates

## 🔧 Template Management & Document Synchronization

### Fill Templates Command

The `fill-templates` command automatically populates template files with content extracted from source documentation. This is essential for preparing templates before LLMS generation.

#### What it does:
- **Content Extraction**: Extracts relevant content from source documents
- **Template Population**: Fills template placeholders with actual content
- **Character Limiting**: Respects character limits specified in template files
- **Quality Control**: Ensures generated content meets quality standards
- **Status Updates**: Updates template workflow status to `content_filled`

### Document Synchronization (v0.3.1)

The new `sync-docs` command provides comprehensive document synchronization with git integration:

#### Features:
- **Git Hook Integration**: Automatic post-commit synchronization
- **YAML Frontmatter Generation**: Complete metadata for all template files
- **Priority JSON Management**: Consistent `priority.json` file naming
- **Status Tracking**: Document completion and workflow stage tracking
- **Batch Processing**: Process multiple documents efficiently

#### Usage Examples:

```bash
# Global CLI commands
llms fill-templates en              # Fill all English templates
llms fill-templates ko              # Fill all Korean templates
llms sync-docs                      # Sync all documents with YAML frontmatter
llms simple-sync en                 # Simple sync for English documents

# Local CLI commands
npx llms-generator fill-templates en --dry-run    # Preview changes
npx llms-generator sync-docs --verbose            # Verbose synchronization
```

#### Enhanced Template Format (v0.3.1):

The v0.3.1 update provides comprehensive YAML frontmatter with complete document metadata:

```yaml
---
document_id: api--action-only
category: api
source_path: en/api/action-only.md
character_limit: 100
last_update: '2025-08-21T10:30:00.000Z'
update_status: auto_generated
priority_score: 90
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---

Action Only Pattern: Type-safe action dispatching without state management via createActionContext.
```

#### Key Improvements in v0.3.1:
- **Comprehensive Metadata**: Complete YAML frontmatter for all generated files
- **Consistent Naming**: Standardized `priority.json` file naming
- **Auto-Generation**: Automatic YAML frontmatter creation via `sync-docs`
- **Git Integration**: Seamless post-commit synchronization
- **Global CLI**: Enhanced accessibility with global `llms` command

#### Benefits:
- **Automation**: Eliminates manual template population and synchronization
- **Consistency**: Ensures uniform content quality and metadata across all templates
- **Efficiency**: Processes multiple templates and documents in batch operations
- **Validation**: Automatically validates template completeness and metadata accuracy
- **Git Integration**: Seamless workflow with automatic post-commit synchronization
- **Global Accessibility**: Use `llms` command from anywhere after global installation

---

**Built with ❤️ for the Context-Action framework**