# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.3.1](https://github.com/mineclover/context-action/compare/v0.2.1...v0.3.1) (2025-08-21)


### Bug Fixes

* add error parameter to catch blocks in llms-generator commands ([18cff4b](https://github.com/mineclover/context-action/commit/18cff4bd8e2c64a5a9a38dc2f2876714bbd883ed))
* **build:** resolve llms-generator build issues and dependencies ([44ca184](https://github.com/mineclover/context-action/commit/44ca1847bd9942c7fe13b02d961cc6f8eb0e8509))
* **ci:** standardize tsdown version across all packages ([714ab1d](https://github.com/mineclover/context-action/commit/714ab1d7f8005096f7abe2f09d8067f500168a3a))
* **llms-generator:** resolve linting issues by adding eslint config and temporarily disabling problematic checks ([1d6cead](https://github.com/mineclover/context-action/commit/1d6cead48821f6cc26a8e1cd119b4924dab978c4))
* **llms-generator:** resolve major TypeScript type compatibility issues ([2fb88dd](https://github.com/mineclover/context-action/commit/2fb88ddb5013c51b66c592a25a3ffe934970d12a))
* **llms-generator:** update legacy script paths after reorganization ([774e9ef](https://github.com/mineclover/context-action/commit/774e9ef15c55502911ddd4812ef3c9479d55746b))
* remove unused _error parameters in LLMS generator catch blocks ([bb7c1f3](https://github.com/mineclover/context-action/commit/bb7c1f3589512acf8f9a41d8a7d3f1a454dd3aea))
* resolve all TypeScript type compatibility issues in LLMS generator ([d523329](https://github.com/mineclover/context-action/commit/d523329ee0e6f3e5599252a63b960996f9e5f061))
* resolve lint errors and improve ActionRegister test reliability ([c0c0904](https://github.com/mineclover/context-action/commit/c0c09041e0c8398c681e01f6eb9a4c1772013c26))
* resolve lint errors and test failures ([01521a7](https://github.com/mineclover/context-action/commit/01521a7531832ce653dc1d52bc4c4bf3f09b9975))
* resolve remaining ESLint errors in LLMS generator ([1a63d29](https://github.com/mineclover/context-action/commit/1a63d299923c83361eab6834cdbd80540ed17d40))
* resolve TypeScript type checking issues in CI ([b287784](https://github.com/mineclover/context-action/commit/b287784b4679b974c3ad331d6849c2af9da82c0a))
* sync-docs 명령 경로 해결 로직 개선 ([5e7aab3](https://github.com/mineclover/context-action/commit/5e7aab3f4d438683e5582948e2bf84c37f0dfa4c))
* **ts:** resolve TypeScript compilation errors across packages ([6f583d1](https://github.com/mineclover/context-action/commit/6f583d1b4d4c2bc9f077c68b3db432d0399fb846))
* **typedoc-vitepress-sync:** add missing ESLint config and TypeScript setup ([66b7f6a](https://github.com/mineclover/context-action/commit/66b7f6a2329635c1a87a0f441fe0aac09659d06d))


### Features

* add learning time info to getting started guide ([bbce03c](https://github.com/mineclover/context-action/commit/bbce03cbf2ed4862f454cfafae05913a228ede67))
* complete bidirectional document synchronization with YAML frontmatter ([21e080d](https://github.com/mineclover/context-action/commit/21e080dd20808b3116015a1077cfbccf6e9b9913))
* complete sync-docs implementation with full synchronization ([fd4d231](https://github.com/mineclover/context-action/commit/fd4d23159dda6854c6112620192371f595ad22ae))
* completely remove orphaned test files and legacy code ([00f0806](https://github.com/mineclover/context-action/commit/00f080652dcb8298c0615d50e5b2e364e5474b73))
* enhance llms-generator testing and remove legacy scripts ([ed33d84](https://github.com/mineclover/context-action/commit/ed33d84280b18d6774f8303dc112235d9ba75ae6))
* implement comprehensive clean LLMS generation with multi-pattern support ([f84d81d](https://github.com/mineclover/context-action/commit/f84d81dfef856515e24f38d820ff7e63345093f4))
* implement comprehensive YAML frontmatter management system with Husky integration ([95acbaa](https://github.com/mineclover/context-action/commit/95acbaa409e900ecd5f5b8ac12c42a35b859d672))
* implement unified init command for llms-generator project initialization ([de1a962](https://github.com/mineclover/context-action/commit/de1a962f4342c8926f055dad0948937a0b3144e5))
* implement YAML frontmatter system and fix sync-docs workflow ([c244c99](https://github.com/mineclover/context-action/commit/c244c99a097b508fd7e4a3e1fd8bace8698a3172))
* **llms-generator:** add CategoryMinimumGenerator library with enhanced features ([0a8e2c3](https://github.com/mineclover/context-action/commit/0a8e2c35abd358eb2470cf0219fcf8ce396d4258))
* **llms-generator:** Complete LLMS Generator CLI system with init and sync-docs commands ([d021b66](https://github.com/mineclover/context-action/commit/d021b6625995d4acf23367df57b3d5ab223d3160))
* **llms-generator:** Git 커밋 트리거 기반 양방향 문서 동기화 시스템 구현 ([0a5f270](https://github.com/mineclover/context-action/commit/0a5f2706dd0c124d48bbefb5cfe5ef2550abbc25))
* **llms-generator:** implement sync-docs command for automatic documentation synchronization ([3463dcc](https://github.com/mineclover/context-action/commit/3463dcc4ca1dfa2879bb7ddc6a0a8799c01a286f))
* **llms-generator:** implement YAML frontmatter summary generation with clean architecture ([5f9e38e](https://github.com/mineclover/context-action/commit/5f9e38eca2b0e8c78a3c66130f22244bce0e768a))
* **llms-generator:** 테스트 완성도 및 타입 안정성 향상 ([bd09e41](https://github.com/mineclover/context-action/commit/bd09e41a1b483483daa43929a046a51aaf74aee8))
* **llms-generator:** 포괄적 시스템 개선 및 아키텍처 고도화 ([2d4070f](https://github.com/mineclover/context-action/commit/2d4070f43c95e5cf4304ed01f2db9629168282d4))
* **llms:** add comprehensive multilingual document processing options ([f5a5c32](https://github.com/mineclover/context-action/commit/f5a5c32fd8090cfc1bd3008578d4fbc2e183550b))
* **llms:** implement comprehensive Priority management system ([b5612fe](https://github.com/mineclover/context-action/commit/b5612fef3198ee6bbdf5a4943da8e2a4a977256f))
* **llms:** implement separate commit system for LLMS updates ([e921d28](https://github.com/mineclover/context-action/commit/e921d28a74e203ff50c1f8b1631573d9926a3134))
* massive cleanup - remove 95% of unused code while preserving functionality ([f151a46](https://github.com/mineclover/context-action/commit/f151a46641ae9cc64ea568efd9d74869fc1f850d))
* optimize CLI from 2000 lines to 200 lines with core functionality ([dd0f1c8](https://github.com/mineclover/context-action/commit/dd0f1c88236628c8010e2df1aa0ed65981192b45))
* optimize LLMS generator by removing legacy code and improving architecture ([08dc3cd](https://github.com/mineclover/context-action/commit/08dc3cd057112ec42167183e1d9b949e54f7bb3a))





# [0.3.0](https://github.com/mineclover/context-action/compare/v0.2.1...v0.3.0) (2025-08-20)


### Bug Fixes

* add error parameter to catch blocks in llms-generator commands ([18cff4b](https://github.com/mineclover/context-action/commit/18cff4bd8e2c64a5a9a38dc2f2876714bbd883ed))
* **build:** resolve llms-generator build issues and dependencies ([44ca184](https://github.com/mineclover/context-action/commit/44ca1847bd9942c7fe13b02d961cc6f8eb0e8509))
* **ci:** standardize tsdown version across all packages ([714ab1d](https://github.com/mineclover/context-action/commit/714ab1d7f8005096f7abe2f09d8067f500168a3a))
* **llms-generator:** resolve linting issues by adding eslint config and temporarily disabling problematic checks ([1d6cead](https://github.com/mineclover/context-action/commit/1d6cead48821f6cc26a8e1cd119b4924dab978c4))
* **llms-generator:** resolve major TypeScript type compatibility issues ([2fb88dd](https://github.com/mineclover/context-action/commit/2fb88ddb5013c51b66c592a25a3ffe934970d12a))
* **llms-generator:** update legacy script paths after reorganization ([774e9ef](https://github.com/mineclover/context-action/commit/774e9ef15c55502911ddd4812ef3c9479d55746b))
* remove unused _error parameters in LLMS generator catch blocks ([bb7c1f3](https://github.com/mineclover/context-action/commit/bb7c1f3589512acf8f9a41d8a7d3f1a454dd3aea))
* resolve all TypeScript type compatibility issues in LLMS generator ([d523329](https://github.com/mineclover/context-action/commit/d523329ee0e6f3e5599252a63b960996f9e5f061))
* resolve lint errors and improve ActionRegister test reliability ([c0c0904](https://github.com/mineclover/context-action/commit/c0c09041e0c8398c681e01f6eb9a4c1772013c26))
* resolve lint errors and test failures ([01521a7](https://github.com/mineclover/context-action/commit/01521a7531832ce653dc1d52bc4c4bf3f09b9975))
* resolve remaining ESLint errors in LLMS generator ([1a63d29](https://github.com/mineclover/context-action/commit/1a63d299923c83361eab6834cdbd80540ed17d40))
* resolve TypeScript type checking issues in CI ([b287784](https://github.com/mineclover/context-action/commit/b287784b4679b974c3ad331d6849c2af9da82c0a))
* sync-docs 명령 경로 해결 로직 개선 ([5e7aab3](https://github.com/mineclover/context-action/commit/5e7aab3f4d438683e5582948e2bf84c37f0dfa4c))
* **ts:** resolve TypeScript compilation errors across packages ([6f583d1](https://github.com/mineclover/context-action/commit/6f583d1b4d4c2bc9f077c68b3db432d0399fb846))
* **typedoc-vitepress-sync:** add missing ESLint config and TypeScript setup ([66b7f6a](https://github.com/mineclover/context-action/commit/66b7f6a2329635c1a87a0f441fe0aac09659d06d))


### Features

* add learning time info to getting started guide ([bbce03c](https://github.com/mineclover/context-action/commit/bbce03cbf2ed4862f454cfafae05913a228ede67))
* complete bidirectional document synchronization with YAML frontmatter ([21e080d](https://github.com/mineclover/context-action/commit/21e080dd20808b3116015a1077cfbccf6e9b9913))
* completely remove orphaned test files and legacy code ([00f0806](https://github.com/mineclover/context-action/commit/00f080652dcb8298c0615d50e5b2e364e5474b73))
* enhance llms-generator testing and remove legacy scripts ([ed33d84](https://github.com/mineclover/context-action/commit/ed33d84280b18d6774f8303dc112235d9ba75ae6))
* implement comprehensive clean LLMS generation with multi-pattern support ([f84d81d](https://github.com/mineclover/context-action/commit/f84d81dfef856515e24f38d820ff7e63345093f4))
* implement comprehensive YAML frontmatter management system with Husky integration ([95acbaa](https://github.com/mineclover/context-action/commit/95acbaa409e900ecd5f5b8ac12c42a35b859d672))
* implement unified init command for llms-generator project initialization ([de1a962](https://github.com/mineclover/context-action/commit/de1a962f4342c8926f055dad0948937a0b3144e5))
* implement YAML frontmatter system and fix sync-docs workflow ([c244c99](https://github.com/mineclover/context-action/commit/c244c99a097b508fd7e4a3e1fd8bace8698a3172))
* **llms-generator:** add CategoryMinimumGenerator library with enhanced features ([0a8e2c3](https://github.com/mineclover/context-action/commit/0a8e2c35abd358eb2470cf0219fcf8ce396d4258))
* **llms-generator:** Git 커밋 트리거 기반 양방향 문서 동기화 시스템 구현 ([0a5f270](https://github.com/mineclover/context-action/commit/0a5f2706dd0c124d48bbefb5cfe5ef2550abbc25))
* **llms-generator:** implement YAML frontmatter summary generation with clean architecture ([5f9e38e](https://github.com/mineclover/context-action/commit/5f9e38eca2b0e8c78a3c66130f22244bce0e768a))
* **llms-generator:** 테스트 완성도 및 타입 안정성 향상 ([bd09e41](https://github.com/mineclover/context-action/commit/bd09e41a1b483483daa43929a046a51aaf74aee8))
* **llms-generator:** 포괄적 시스템 개선 및 아키텍처 고도화 ([2d4070f](https://github.com/mineclover/context-action/commit/2d4070f43c95e5cf4304ed01f2db9629168282d4))
* massive cleanup - remove 95% of unused code while preserving functionality ([f151a46](https://github.com/mineclover/context-action/commit/f151a46641ae9cc64ea568efd9d74869fc1f850d))
* optimize CLI from 2000 lines to 200 lines with core functionality ([dd0f1c8](https://github.com/mineclover/context-action/commit/dd0f1c88236628c8010e2df1aa0ed65981192b45))
* optimize LLMS generator by removing legacy code and improving architecture ([08dc3cd](https://github.com/mineclover/context-action/commit/08dc3cd057112ec42167183e1d9b949e54f7bb3a))





## [0.2.3](https://github.com/mineclover/context-action/compare/v0.2.1...v0.2.3) (2025-08-19)


### Bug Fixes

* **build:** resolve llms-generator build issues and dependencies ([44ca184](https://github.com/mineclover/context-action/commit/44ca1847bd9942c7fe13b02d961cc6f8eb0e8509))
* **ci:** standardize tsdown version across all packages ([714ab1d](https://github.com/mineclover/context-action/commit/714ab1d7f8005096f7abe2f09d8067f500168a3a))
* **llms-generator:** resolve linting issues by adding eslint config and temporarily disabling problematic checks ([1d6cead](https://github.com/mineclover/context-action/commit/1d6cead48821f6cc26a8e1cd119b4924dab978c4))
* **llms-generator:** resolve major TypeScript type compatibility issues ([2fb88dd](https://github.com/mineclover/context-action/commit/2fb88ddb5013c51b66c592a25a3ffe934970d12a))
* **llms-generator:** update legacy script paths after reorganization ([774e9ef](https://github.com/mineclover/context-action/commit/774e9ef15c55502911ddd4812ef3c9479d55746b))
* resolve lint errors and improve ActionRegister test reliability ([c0c0904](https://github.com/mineclover/context-action/commit/c0c09041e0c8398c681e01f6eb9a4c1772013c26))
* sync-docs 명령 경로 해결 로직 개선 ([5e7aab3](https://github.com/mineclover/context-action/commit/5e7aab3f4d438683e5582948e2bf84c37f0dfa4c))
* **ts:** resolve TypeScript compilation errors across packages ([6f583d1](https://github.com/mineclover/context-action/commit/6f583d1b4d4c2bc9f077c68b3db432d0399fb846))
* **typedoc-vitepress-sync:** add missing ESLint config and TypeScript setup ([66b7f6a](https://github.com/mineclover/context-action/commit/66b7f6a2329635c1a87a0f441fe0aac09659d06d))


### Features

* add learning time info to getting started guide ([bbce03c](https://github.com/mineclover/context-action/commit/bbce03cbf2ed4862f454cfafae05913a228ede67))
* complete bidirectional document synchronization with YAML frontmatter ([21e080d](https://github.com/mineclover/context-action/commit/21e080dd20808b3116015a1077cfbccf6e9b9913))
* completely remove orphaned test files and legacy code ([00f0806](https://github.com/mineclover/context-action/commit/00f080652dcb8298c0615d50e5b2e364e5474b73))
* enhance llms-generator testing and remove legacy scripts ([ed33d84](https://github.com/mineclover/context-action/commit/ed33d84280b18d6774f8303dc112235d9ba75ae6))
* implement comprehensive clean LLMS generation with multi-pattern support ([f84d81d](https://github.com/mineclover/context-action/commit/f84d81dfef856515e24f38d820ff7e63345093f4))
* implement comprehensive YAML frontmatter management system with Husky integration ([95acbaa](https://github.com/mineclover/context-action/commit/95acbaa409e900ecd5f5b8ac12c42a35b859d672))
* implement unified init command for llms-generator project initialization ([de1a962](https://github.com/mineclover/context-action/commit/de1a962f4342c8926f055dad0948937a0b3144e5))
* implement YAML frontmatter system and fix sync-docs workflow ([c244c99](https://github.com/mineclover/context-action/commit/c244c99a097b508fd7e4a3e1fd8bace8698a3172))
* **llms-generator:** 테스트 완성도 및 타입 안정성 향상 ([bd09e41](https://github.com/mineclover/context-action/commit/bd09e41a1b483483daa43929a046a51aaf74aee8))
* **llms-generator:** 포괄적 시스템 개선 및 아키텍처 고도화 ([2d4070f](https://github.com/mineclover/context-action/commit/2d4070f43c95e5cf4304ed01f2db9629168282d4))
* **llms-generator:** add CategoryMinimumGenerator library with enhanced features ([0a8e2c3](https://github.com/mineclover/context-action/commit/0a8e2c35abd358eb2470cf0219fcf8ce396d4258))
* **llms-generator:** Git 커밋 트리거 기반 양방향 문서 동기화 시스템 구현 ([0a5f270](https://github.com/mineclover/context-action/commit/0a5f2706dd0c124d48bbefb5cfe5ef2550abbc25))
* **llms-generator:** implement YAML frontmatter summary generation with clean architecture ([5f9e38e](https://github.com/mineclover/context-action/commit/5f9e38eca2b0e8c78a3c66130f22244bce0e768a))
* massive cleanup - remove 95% of unused code while preserving functionality ([f151a46](https://github.com/mineclover/context-action/commit/f151a46641ae9cc64ea568efd9d74869fc1f850d))
* optimize CLI from 2000 lines to 200 lines with core functionality ([dd0f1c8](https://github.com/mineclover/context-action/commit/dd0f1c88236628c8010e2df1aa0ed65981192b45))
* optimize LLMS generator by removing legacy code and improving architecture ([08dc3cd](https://github.com/mineclover/context-action/commit/08dc3cd057112ec42167183e1d9b949e54f7bb3a))





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
