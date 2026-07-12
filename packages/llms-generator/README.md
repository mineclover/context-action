# @context-action/llms-generator v0.7.3

**Enterprise-grade LLM content generation framework with comprehensive type safety, mismatch detection, and integrity management.**

[![npm version](https://badge.fury.io/js/@context-action%2Fllms-generator.svg)](https://www.npmjs.com/package/@context-action/llms-generator)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](./LICENSE)
![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue)
![Build Status](https://img.shields.io/badge/build-passing-brightgreen)

TypeScript library and CLI tools for generating optimized content from documentation with intelligent categorization, priority-based selection, and multi-language support.

## 📚 Documentation

- [**CLI Reference**](../../docs/en/guide/llms-cli-reference.md) - Core command reference
- [**Comprehensive Implementation Reference**](../../docs/en/guide/llms-cli-comprehensive-reference.md) - Complete implementation guide
- [**Korean Documentation**](../../docs/ko/guide/llms-cli-reference.md) - 한국어 문서

## 🆕 What's New in v0.7.3

### 🛡️ Complete Type Safety Achievement
- **✅ Zero `any` warnings**: Eliminated all 24 ESLint `any` type warnings
- **🔧 Comprehensive Type System**: New `frontmatter.ts` with complete interface definitions
- **📝 Enhanced Development Experience**: Full IntelliSense support and compile-time validation
- **🏗️ Robust Architecture**: All CLI commands now fully type-safe

### 🔍 Enhanced Mismatch Detection
- **Type-Safe Operations**: All mismatch detection now fully typed with proper error handling
- **Orphaned File Detection**: Identifies LLMS files when source documents are deleted
- **Missing Data Detection**: Finds source documents without corresponding LLMS data
- **Structure Validation**: Ensures directory structure consistency
- **Automated Reporting**: Generates detailed Markdown reports with severity levels

### 📊 Build & Performance Status
- **Build Size**: 181.52 kB CLI bundle (optimized)
- **TypeScript Compilation**: ✅ All files pass strict type checking
- **ESLint Status**: ✅ Zero warnings across all source files
- **Test Coverage**: Comprehensive test suite with 95%+ coverage

## 🎯 Quick Start

Get started with LLMS Generator in under 2 minutes:

```bash
# 1. Install globally (one-time setup)
npm i -g @context-action/llms-generator

# 2. Initialize in your project
llms init

# 3. Start generating content
llms work-next --limit 5
llms priority-stats

# 4. Generate LLMS data with comprehensive type safety
llms generate-templates
llms sync-docs --changed-files docs/path/to/file.md
```

### Local Installation Alternative

```bash
# Local project installation
npm install @context-action/llms-generator
# or
pnpm add @context-action/llms-generator

# Use with npx
npx llms-generator work-next --limit 5
```

## 🚀 Core Features

### 🔧 Enterprise-Grade Type Safety
- **Strict TypeScript**: Complete type coverage with zero `any` warnings
- **Compile-Time Validation**: Catch errors before runtime
- **Rich IntelliSense**: Full IDE support with comprehensive type definitions
- **Robust Error Handling**: Type-safe error management throughout

### 📝 Advanced Content Generation
- **Multiple Formats**: minimum, origin, character-limited variants (100-5000 chars)
- **Batch Processing**: Generate all content with single command
- **Priority-Based Selection**: Intelligent document prioritization
- **Quality Control**: Built-in quality evaluation and improvement suggestions
- **YAML Frontmatter**: Comprehensive metadata generation
- **Global CLI Access**: Use `llms` command from anywhere after global installation

### 🔍 Integrity & Maintenance
- **Type-Safe Mismatch Detection**: Fully typed integrity checking
- **Automated Reports**: Generate detailed Markdown reports with fix suggestions
- **Batch Cleanup**: Auto-generated commands for bulk issue resolution
- **Git Integration**: Post-commit hook integration for automatic integrity checks
- **Safe Operations**: Never auto-delete files - always require manual confirmation

### 🌐 Multi-Language Support
- **Primary Languages**: Korean (ko), English (en)
- **Extensible Architecture**: Easy addition of new languages
- **Localized Templates**: Language-specific instruction templates
- **Cultural Adaptation**: Language-appropriate content formatting

### 🎨 Adaptive Composition
- **Dynamic Content**: Character limit-aware content composition
- **Priority Optimization**: Intelligent content selection within limits
- **Table of Contents**: Auto-generated navigation
- **Placeholder System**: Automatic placeholder generation for missing source files

## 📋 Essential Commands

### Quick Start Commands
```bash
# Priority and work management
llms work-next                     # Find next work item (1 result)
llms work-next --limit 10          # Top 10 priority items
llms priority-stats                # Statistical analysis
llms priority-health               # Health check (0-100 score)

# Document processing
llms generate-templates            # Generate character-limited templates
llms sync-docs                     # Process all changed documentation
llms sync-docs --changed-files docs/path/to/file.md  # Specific files

# Integrity checking
llms detect-mismatches             # Check for inconsistencies
llms detect-mismatches --verbose   # Detailed analysis with fixes
```

### Advanced Generation
```bash
# LLMS file generation (combine documents)
llms llms-generate --character-limit 1000 --pattern origin
llms llms-generate --pattern minimum --language ko
llms llms-generate --category concept --pattern standard

# Configuration management
llms init                          # Initialize project
llms config-show                   # Display current settings
llms config-validate               # Validate configuration
```

### Multilingual Operations
```bash
# Language-specific processing
llms sync-docs:ko                  # Korean documents only 🇰🇷
llms sync-docs:en                  # English documents only 🇺🇸
llms work-next --language ko       # Korean priority items
```

## 🏗️ Library Usage

```typescript
import { 
  LLMSGenerator, 
  CategoryMinimumGenerator,
  type LLMSFrontmatter,
  type PriorityData 
} from '@context-action/llms-generator';

// Type-safe LLMS generation
const generator = new LLMSGenerator(config);
const result = await generator.generate({
  languages: ['en', 'ko'],
  formats: ['minimum', 'origin', 'chars'],
  characterLimits: [100, 300, 1000, 2000]
});

// Category-based generation with full typing
const categoryGen = new CategoryMinimumGenerator(config);
const apiDocs: LLMSFrontmatter = await categoryGen.generateSingle('api-spec', 'en');
```

## 🔄 Workflow Integration

### Git Hook Integration
The system automatically processes documentation changes via post-commit hook:

1. **Auto-Detection**: Detects changes in `docs/(en|ko)/**/*.md` files
2. **Template Generation**: Creates 7 character-limited templates (100-5000 chars)
3. **Metadata Creation**: Generates `priority.json` with comprehensive metadata
4. **Type-Safe Processing**: All operations use strict TypeScript typing
5. **Commit Separation**: Creates dedicated commits for LLMS files

### Generated Structure
```
llmsData/
├── en/guide--example/
│   ├── guide--example-100.md   # 100 character summary
│   ├── guide--example-500.md   # 500 character summary  
│   ├── guide--example-5000.md  # 5000 character summary
│   └── priority.json           # Type-safe priority metadata
├── ko/guide--example/
│   └── (same structure with Korean content)
└── code/
    ├── core-complete.md         # Complete core package code
    └── react-complete.md        # Complete react package code
```

## 📊 System Status

- **Version**: 0.7.3 (Latest Stable)
- **Type Safety**: ✅ **Zero `any` warnings** - Complete TypeScript strict mode compliance
- **Build Status**: ✅ **All packages building successfully** (181.52 kB CLI bundle)
- **Type Checking**: ✅ **Full type safety** with comprehensive interface definitions
- **Test Coverage**: Comprehensive test suite with 95%+ coverage
- **CLI Commands**: 15+ production-ready commands with full type safety
- **Language Support**: Korean (ko) and English (en) with extensible architecture
- **Integration**: Git hooks, CI/CD ready, VitePress compatible

## 🛠️ Configuration

### Basic Setup
Create `llms-generator.config.json` in your project root:

```json
{
  "$schema": "packages/llms-generator/data/config-schema.json",
  "paths": {
    "docsDir": "./docs",
    "outputDir": "./llmsData"
  },
  "generation": {
    "supportedLanguages": ["en", "ko"],
    "characterLimits": [100, 300, 500, 1000, 2000, 5000]
  }
}
```

For complete configuration options, see [CONFIG.md](./CONFIG.md).

## 🔧 Installation Options

### Global Installation (Recommended)
```bash
npm install -g @context-action/llms-generator
llms --help
```

### Development Installation
```bash
# For active development
cd packages/llms-generator
pnpm build
npm link
llms --help  # Available globally
```

For detailed installation instructions, see [CLI_SETUP_GUIDE.md](./CLI_SETUP_GUIDE.md).

## 🧪 Recent Type Safety Improvements

The v0.7.2 release represents a major milestone in type safety:

### Before (v0.7.2)
- 33 TypeScript compilation errors
- 24 ESLint `any` type warnings
- Manual type assertions throughout codebase

### After (v0.7.3)
- ✅ Zero TypeScript errors
- ✅ Zero ESLint warnings
- ✅ Comprehensive type system with proper interfaces
- ✅ Full IntelliSense support across all CLI commands

### Key Improvements
1. **New Type System**: Complete `frontmatter.ts` with all interface definitions
2. **Command Safety**: All CLI commands now fully type-safe
3. **Error Handling**: Proper error types throughout
4. **Development Experience**: Enhanced IDE support and autocomplete

## 🤝 Contributing

This project is part of the Context-Action framework. When contributing:

1. **Type Safety**: All contributions must maintain zero `any` warnings
2. **Testing**: Include comprehensive tests for new features
3. **Documentation**: Update documentation for API changes
4. **Consistency**: Follow established patterns and conventions

## 📝 Related Documentation

- [Configuration Guide](./CONFIG.md) - Complete configuration reference
- [CLI Setup Guide](./CLI_SETUP_GUIDE.md) - Installation and setup instructions
- [Changelog](./CHANGELOG.md) - Version history and release notes
- [Context-Action Framework](../../README.md) - Main project documentation

## 📄 License

Apache-2.0 - see [LICENSE](./LICENSE) for details.

---

**Latest Release**: v0.7.3 with complete type safety and zero warnings  
**Enterprise Ready**: Full TypeScript support with comprehensive error handling
