# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.2.1](https://github.com/mineclover/context-action/compare/v0.1.1...v0.2.1) (2025-08-15)


### Features

* add @context-action/llms-generator package ([3331b37](https://github.com/mineclover/context-action/commit/3331b371a3820454e023df24f30b4e709b0951a9))
* **llms-generator:** add work status management for -100 character summaries ([ad9c1b2](https://github.com/mineclover/context-action/commit/ad9c1b232a57e52b53b01ddca99f91653dc0115b))
* **llms-generator:** implement user-configurable character limits system ([1f8e7fc](https://github.com/mineclover/context-action/commit/1f8e7fc5383e1e5e609ba5eb20de1b42c4cf2cc6))
* **llms-generator:** integrate priority generation and schema management ([5b01ee9](https://github.com/mineclover/context-action/commit/5b01ee9af563ae2ff226156117185016bc57c9ee))
* **llms-generator:** major usability improvements for manual summary workflow ([3ea4f94](https://github.com/mineclover/context-action/commit/3ea4f947c620c47089799030c790d33537f3abd6))
* **llms-generator:** simplify configuration system and enhance testing ([c67f5a9](https://github.com/mineclover/context-action/commit/c67f5a9d5e3af4ed2e4bc3d654fce8c38193a34f))
* optimize codebase and remove legacy code ([19c042f](https://github.com/mineclover/context-action/commit/19c042f4a2915c0bd1bd9b76cb7750a061af6675))





# [0.2.0](https://github.com/mineclover/context-action/compare/v0.1.1...v0.2.0) (2025-08-15)


### Features

* add @context-action/llms-generator package ([3331b37](https://github.com/mineclover/context-action/commit/3331b371a3820454e023df24f30b4e709b0951a9))
* **llms-generator:** add work status management for -100 character summaries ([ad9c1b2](https://github.com/mineclover/context-action/commit/ad9c1b232a57e52b53b01ddca99f91653dc0115b))
* **llms-generator:** implement user-configurable character limits system ([1f8e7fc](https://github.com/mineclover/context-action/commit/1f8e7fc5383e1e5e609ba5eb20de1b42c4cf2cc6))
* **llms-generator:** integrate priority generation and schema management ([5b01ee9](https://github.com/mineclover/context-action/commit/5b01ee9af563ae2ff226156117185016bc57c9ee))
* **llms-generator:** major usability improvements for manual summary workflow ([3ea4f94](https://github.com/mineclover/context-action/commit/3ea4f947c620c47089799030c790d33537f3abd6))
* **llms-generator:** simplify configuration system and enhance testing ([c67f5a9](https://github.com/mineclover/context-action/commit/c67f5a9d5e3af4ed2e4bc3d654fce8c38193a34f))





# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **User Configuration System**: Complete user-customizable configuration system with project root discovery
- **New CLI Commands**:
  - `config-init [preset]`: Initialize configuration with presets (minimal|standard|extended|blog|documentation)
  - `config-show`: Show current resolved configuration
  - `config-validate`: Validate current configuration 
  - `config-limits [--all]`: Show configured character limits
- **Configuration Discovery**: Multi-format config file support (.json, .js, package.json field, RC files)
- **Character Limit Presets**: Pre-configured character limit sets for different use cases
- **Config-Driven CLI**: All CLI commands now use configuration defaults (languages, character limits, composition settings)
- **Configuration Examples**: Comprehensive CONFIG_EXAMPLES.md with real-world configuration scenarios

### Changed
- **CLI Commands**: All commands now load user configuration and use config defaults instead of hardcoded values
- **Character Limits**: Now fully user-configurable through config system instead of hardcoded arrays
- **Help Text**: Updated to reflect config-driven approach with new examples

### Technical Details
- Added `ConfigManager` class for configuration discovery, loading, validation, and management
- Added comprehensive `UserConfig` and `ResolvedConfig` TypeScript interfaces
- Project root discovery by searching for package.json in parent directories
- Configuration validation with detailed error messages
- Support for enabled/disabled character limits
- Workflow presets system for future automation features

## [1.1.0] - 2025-08-14

### Added
- **Work Status Management System**: Track editing status and modification times for document summaries
- **New CLI Commands**:
  - `work-status`: Check work status for documents or update all documents  
  - `work-context`: Get complete editing context for a specific document
  - `work-list`: List documents that need work with filtering options
- **Enhanced Schema**: Extended priority.json with `work_status` field for tracking generated files
- **Standalone Scripts**: Independent work-status.js script for simple status checks
- **Usage Examples**: Comprehensive guide for -100 character summary workflow
- **Integration Tests**: Complete workflow testing with scenario validation

### Changed
- **Priority Schema**: Extended with work status tracking fields while maintaining backward compatibility
- **CLI Help**: Updated help text to include new work management commands

### Technical Details
- Added `WorkStatusManager` class for comprehensive work status tracking
- Schema validation for work_status metadata  
- File modification time comparison for update detection
- Support for character-limited summary management (100, 300, 1000, 2000 chars)

## [1.0.0] - 2025-08-14

### Added
- Initial release with core LLMsTXT generation functionality
- Priority-based document summarization system
- Adaptive content composition with optimal character utilization  
- CLI interface with comprehensive commands
- Support for multiple languages (en, ko)
- Character-limited content extraction (100-4000 characters)
- Batch processing capabilities
- Schema-driven priority management
- Markdown generation for VitePress integration

### Features
- Document discovery and priority generation
- Content extraction with configurable character limits
- Adaptive composition achieving 95%+ space utilization
- Multiple output formats (minimum, origin, character-limited)
- TypeScript support with strict type checking
- Comprehensive configuration system
