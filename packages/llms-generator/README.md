# @context-action/llms-generator

> ⚠️ **개발 중 (Under Development)** - 이 패키지는 현재 적극적으로 개발 중입니다. API가 변경될 수 있습니다.  
> This package is under active development. APIs may change.

**Enterprise-grade LLM content generation framework for Context-Action documentation**

TypeScript library and CLI tools for generating optimized content from documentation with intelligent categorization, priority-based selection, and multi-language support.

[![npm version](https://badge.fury.io/js/@context-action%2Fllms-generator.svg)](https://www.npmjs.com/package/@context-action/llms-generator)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
![Development Status](https://img.shields.io/badge/status-under%20development-orange)

## 🚀 Quick Start

### Installation

```bash
npm install @context-action/llms-generator
# or
pnpm add @context-action/llms-generator
```

### Basic CLI Usage

```bash
# Initialize configuration
npx llms-generator config-init standard

# Generate all content
npx llms-generator batch

# Generate specific character limit
npx llms-generator chars 1000 en

# Generate markdown files with YAML frontmatter
npx llms-generator generate-md en
npx llms-generator generate-all

# LLMS-TXT generation with advanced filtering
npx llms-generator llms-generate --chars=100 --category=api
npx llms-generator llms-generate --pattern=minimum --lang=ko

# Work status management
npx llms-generator work-next
npx llms-generator work-status ko
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
- **Markdown Generation**: Generate individual .md files with YAML frontmatter
- **Bulk Generation**: `generate-all` command for all languages at once

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
npx llms-generator config-init [preset]     # Initialize with preset
npx llms-generator config-show              # Show current config
npx llms-generator config-validate          # Validate configuration
npx llms-generator config-limits            # Show character limits
```

### Content Generation
```bash
npx llms-generator minimum                  # Generate minimum format
npx llms-generator origin                   # Generate origin format
npx llms-generator chars <limit> [lang]     # Generate specific limit
npx llms-generator batch [options]          # Generate all formats

# Template Management (NEW!)
npx llms-generator fill-templates [lang]    # Auto-fill template files with content
npx llms-generator fill-templates en        # Fill English templates
npx llms-generator fill-templates ko        # Fill Korean templates

# Advanced LLMS-TXT Generation (NEW!)
npx llms-generator llms-generate [options]  # Generate with filtering & patterns
npx llms-generator llms-generate --chars=100 --category=api  # Filter by char limit & category
npx llms-generator llms-generate --pattern=minimum --lang=ko # Use specific pattern
```

### Priority & Discovery
```bash
npx llms-generator priority-generate [lang] # Generate priority files
npx llms-generator priority-stats [lang]    # Show statistics
npx llms-generator discover [lang]          # Discover documents
```

### Work Management
```bash
npx llms-generator work-next [options]      # Identify next work item (NEW!)
npx llms-generator work-status [lang]       # Check work status
npx llms-generator work-context <lang> <id> # Get work context
npx llms-generator work-list [lang]         # List work needed
npx llms-generator work-check [lang]        # Enhanced work check
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
npx llms-generator generate-md [lang]       # Generate .md files for specific language
npx llms-generator generate-all             # Generate .md files for all languages
npx llms-generator generate-all --chars=100,500,1000  # Custom character limits
```

### Advanced Features
```bash
npx llms-generator extract [lang]           # Extract summaries
npx llms-generator markdown-generate [lang] # Generate markdown (VitePress)
npx llms-generator instruction-generate     # Generate instructions
npx llms-generator generate-summaries       # YAML frontmatter summaries
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

# Utilities
pnpm cli                                 # Direct CLI access
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

## 🔧 Template Management

### Fill Templates Command

The `fill-templates` command automatically populates template files with content extracted from source documentation. This is essential for preparing templates before LLMS generation.

#### What it does:
- **Content Extraction**: Extracts relevant content from source documents
- **Template Population**: Fills template placeholders with actual content
- **Character Limiting**: Respects character limits specified in template files
- **Quality Control**: Ensures generated content meets quality standards
- **Status Updates**: Updates template workflow status to `content_filled`

#### Usage Examples:

```bash
# Fill all English templates
npx llms-generator fill-templates en

# Fill all Korean templates  
npx llms-generator fill-templates ko

# Preview changes without writing files
npx llms-generator fill-templates en --dry-run

# Fill templates with verbose output
npx llms-generator fill-templates en --verbose
```

#### Template File Format (Standard):

The system supports a simplified template format where content follows directly after the YAML frontmatter:

```yaml
---
document_id: api--action-only
category: api
source_path: en/api/action-only.md
character_limit: 100
last_update: '2025-08-18T02:35:00.000Z'
update_status: content_only
priority_score: 90
priority_tier: critical
completion_status: completed
workflow_stage: content_finalized
---

Action Only Pattern: Type-safe action dispatching without state management via createActionContext.
```

This simplified format is now the **standard template format**, replacing the previous structured format with "## 템플릿 내용" sections.

#### Benefits:
- **Automation**: Eliminates manual template population
- **Consistency**: Ensures uniform content quality across templates
- **Efficiency**: Processes multiple templates in batch operations
- **Validation**: Automatically validates template completeness

---

**Built with ❤️ for the Context-Action framework**