# Changelog

All notable changes to the @context-action/llms-generator package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2025-08-16

### Added
- **CategoryMinimumGenerator**: New TypeScript library interface for category-based LLMS generation
- **Category-based filtering**: Support for `api-spec` and `guide` document categories
- **Multi-language support**: Enhanced support for Korean, English, Japanese, Chinese
- **Statistics and analytics**: Comprehensive document statistics and category breakdown
- **Batch processing**: Generate multiple categories and languages in single operation
- **AdaptiveDocumentSelector**: Added missing selection strategies (`greedy`, `hybrid`, `adaptive`)
- **Configuration improvements**: Added `defaultCharacterLimits` structure and merge methods
- **Enhanced error handling**: Comprehensive validation and error recovery

### Improved
- **Test infrastructure**: Consolidated test directories into unified structure
- **Import paths**: Fixed import resolution issues across test files
- **Documentation**: Simplified and updated README, API Reference, and Architecture guides
- **TypeScript support**: Enhanced type safety and IntelliSense support
- **Performance**: Optimized for large document sets (100+ files)

### Fixed
- **Test failures**: Resolved 222 failing tests by fixing missing implementations
- **Configuration structure**: Fixed undefined configuration properties
- **Selection strategies**: Implemented missing selection algorithm strategies
- **Import resolution**: Fixed grouped imports to individual file imports
- **Build process**: Resolved TypeScript compilation and dependency issues

### Removed
- **Duplicate .cjs files**: Eliminated 10+ duplicate CommonJS files (4,122 lines removed)
- **Obsolete documentation**: Moved 22 outdated documentation files to archive
- **Redundant test directories**: Consolidated 6+ test directories into single structure

### Technical Improvements
- **Code organization**: Improved project structure and file organization
- **Type definitions**: Enhanced TypeScript interfaces and type safety
- **Error handling**: Better error messages and graceful degradation
- **Performance optimization**: Faster processing and reduced memory usage

## [0.2.2] - 2025-08-15

### Bug Fixes
- **build**: resolve llms-generator build issues and dependencies
- **ci**: standardize tsdown version across all packages
- **llms-generator**: resolve linting issues by adding eslint config
- **ts**: resolve TypeScript compilation errors across packages
- **typedoc-vitepress-sync**: add missing ESLint config and TypeScript setup

### Features
- **llms-generator**: implement YAML frontmatter summary generation with clean architecture

## [0.2.1] - 2025-08-15

### Features
- Add @context-action/llms-generator package
- **llms-generator**: add work status management for -100 character summaries
- **llms-generator**: implement user-configurable character limits system
- **llms-generator**: integrate priority generation and schema management
- **llms-generator**: major usability improvements for manual summary workflow
- **llms-generator**: simplify configuration system and enhance testing
- Optimize codebase and remove legacy code

## [0.2.0] - 2025-08-15

### Initial Features
- Document discovery and priority generation
- Content extraction with configurable character limits
- Adaptive composition achieving 95%+ space utilization
- Multiple output formats (minimum, origin, character-limited)
- TypeScript support with strict type checking
- Comprehensive configuration system
- CLI interface with comprehensive commands
- Support for multiple languages (en, ko)
- Character-limited content extraction (100-4000 characters)
- Batch processing capabilities
- Schema-driven priority management
- Markdown generation for VitePress integration

---

For detailed API documentation, see [API_REFERENCE.md](./API_REFERENCE.md).
For architecture overview, see [ENHANCED_ARCHITECTURE.md](./ENHANCED_ARCHITECTURE.md).