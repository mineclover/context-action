# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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