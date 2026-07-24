# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.8.8] (Unreleased)

### Fixed

- `sync-docs --force` now regenerates existing LLMS templates and refreshes their
  priority metadata instead of only creating missing or placeholder files.
- Canonical documentation cleanup removed the retired test-driven generator
  from the active documentation workflow.

### Changed

- Removed the unsupported `legacy:*` package scripts and the non-functional
  `detect-mismatches --auto-fix` flag.
- Added `detect-mismatches --fail-on-mismatch` and the repository-level
  `pnpm llms:check` consistency gate for CI.

## [0.8.7](https://github.com/mineclover/context-action/compare/v0.8.6...v0.8.7) (2026-07-12)

**Note:** Version bump only for package @context-action/llms-generator





## [0.8.6](https://github.com/mineclover/context-action/compare/v0.8.5...v0.8.6) (2026-03-27)

**Note:** Version bump only for package @context-action/llms-generator





## [0.8.5](https://github.com/mineclover/context-action/compare/v0.8.4...v0.8.5) (2026-03-27)


### Features

* Add path-based subscription and TimeTravelStore with major docs cleanup ([9b7d8d2](https://github.com/mineclover/context-action/commit/9b7d8d2f84a65751e477202960e649ad6aa45b01))
* Add Zod schema integration and createToolContext for LLM tool registry ([1baf4b8](https://github.com/mineclover/context-action/commit/1baf4b80fe236ee9b5ae6b3d11ca66d745185c7a))





## [0.7.8](https://github.com/mineclover/context-action/compare/v0.7.7...v0.7.8) (2025-11-30)


### Features

* clean release with unified version 0.7.8/0.7.9 ([f0b54a6](https://github.com/mineclover/context-action/commit/f0b54a6ecfa378a42e924492ac2cefaaf90dbb88))
* **react:** v0.8.1 - React Compiler integration with backwards compatibility ([f3adbcf](https://github.com/mineclover/context-action/commit/f3adbcf2060a89261f01703b3e69ed31852d36a3))





## [0.7.7](https://github.com/mineclover/context-action/compare/v0.6.0...v0.7.7) (2025-09-17)


### Bug Fixes

* **llms-generator:** resolve TypeScript compilation errors ([6414ff3](https://github.com/mineclover/context-action/commit/6414ff3fec2a57b25ff9897fb8c7f4cdd23e78b4))
* resolve memory leaks in test files by replacing clearAll() with destroy() ([097a010](https://github.com/mineclover/context-action/commit/097a010ae0572c64643e744c4a529a44f7cbbcb5))
* simplify tsdown configuration for reliable DTS generation ([590b702](https://github.com/mineclover/context-action/commit/590b7022e53c6d6f8e36a1e8356ab431abeaf92f))
* update TypeScript configuration and enhance LogMonitor component ([c280d4f](https://github.com/mineclover/context-action/commit/c280d4ff4cedf44f28b91e612159bdca7c3a014e))


### Features

* Context-Action 라이브러리 핵심 성능 및 안정성 개선 ([f13fe47](https://github.com/mineclover/context-action/commit/f13fe4756c7f1e39872aca7a45fec09f37da3c2c))
* implement advanced unregister function management system ([1086a8a](https://github.com/mineclover/context-action/commit/1086a8abb3a8887df58fe80c1bb02854f0eed7b7))
* modernize TypeScript configuration and fix dynamic imports ([725eef5](https://github.com/mineclover/context-action/commit/725eef5e02388e67103d94814935965e066f3e85))
* **react:** consolidate test structure and fix TypeScript errors ([618ec8c](https://github.com/mineclover/context-action/commit/618ec8cbb2474964b249c0320cff69be373246f1))





## [0.7.6](https://github.com/mineclover/context-action/compare/v0.6.0...v0.7.6) (2025-09-17)


### Bug Fixes

* **llms-generator:** resolve TypeScript compilation errors ([6414ff3](https://github.com/mineclover/context-action/commit/6414ff3fec2a57b25ff9897fb8c7f4cdd23e78b4))
* resolve memory leaks in test files by replacing clearAll() with destroy() ([097a010](https://github.com/mineclover/context-action/commit/097a010ae0572c64643e744c4a529a44f7cbbcb5))
* update TypeScript configuration and enhance LogMonitor component ([c280d4f](https://github.com/mineclover/context-action/commit/c280d4ff4cedf44f28b91e612159bdca7c3a014e))


### Features

* Context-Action 라이브러리 핵심 성능 및 안정성 개선 ([f13fe47](https://github.com/mineclover/context-action/commit/f13fe4756c7f1e39872aca7a45fec09f37da3c2c))
* implement advanced unregister function management system ([1086a8a](https://github.com/mineclover/context-action/commit/1086a8abb3a8887df58fe80c1bb02854f0eed7b7))
* modernize TypeScript configuration and fix dynamic imports ([725eef5](https://github.com/mineclover/context-action/commit/725eef5e02388e67103d94814935965e066f3e85))
* **react:** consolidate test structure and fix TypeScript errors ([618ec8c](https://github.com/mineclover/context-action/commit/618ec8cbb2474964b249c0320cff69be373246f1))





## [0.7.5](https://github.com/mineclover/context-action/compare/v0.6.0...v0.7.5) (2025-09-17)


### Bug Fixes

* **llms-generator:** resolve TypeScript compilation errors ([6414ff3](https://github.com/mineclover/context-action/commit/6414ff3fec2a57b25ff9897fb8c7f4cdd23e78b4))
* resolve memory leaks in test files by replacing clearAll() with destroy() ([097a010](https://github.com/mineclover/context-action/commit/097a010ae0572c64643e744c4a529a44f7cbbcb5))
* update TypeScript configuration and enhance LogMonitor component ([c280d4f](https://github.com/mineclover/context-action/commit/c280d4ff4cedf44f28b91e612159bdca7c3a014e))


### Features

* Context-Action 라이브러리 핵심 성능 및 안정성 개선 ([f13fe47](https://github.com/mineclover/context-action/commit/f13fe4756c7f1e39872aca7a45fec09f37da3c2c))
* implement advanced unregister function management system ([1086a8a](https://github.com/mineclover/context-action/commit/1086a8abb3a8887df58fe80c1bb02854f0eed7b7))
* modernize TypeScript configuration and fix dynamic imports ([725eef5](https://github.com/mineclover/context-action/commit/725eef5e02388e67103d94814935965e066f3e85))
* **react:** consolidate test structure and fix TypeScript errors ([618ec8c](https://github.com/mineclover/context-action/commit/618ec8cbb2474964b249c0320cff69be373246f1))





## [0.7.4](https://github.com/mineclover/context-action/compare/v0.6.0...v0.7.4) (2025-09-17)


### Bug Fixes

* **llms-generator:** resolve TypeScript compilation errors ([6414ff3](https://github.com/mineclover/context-action/commit/6414ff3fec2a57b25ff9897fb8c7f4cdd23e78b4))
* resolve memory leaks in test files by replacing clearAll() with destroy() ([097a010](https://github.com/mineclover/context-action/commit/097a010ae0572c64643e744c4a529a44f7cbbcb5))
* update TypeScript configuration and enhance LogMonitor component ([c280d4f](https://github.com/mineclover/context-action/commit/c280d4ff4cedf44f28b91e612159bdca7c3a014e))


### Features

* Context-Action 라이브러리 핵심 성능 및 안정성 개선 ([f13fe47](https://github.com/mineclover/context-action/commit/f13fe4756c7f1e39872aca7a45fec09f37da3c2c))
* implement advanced unregister function management system ([1086a8a](https://github.com/mineclover/context-action/commit/1086a8abb3a8887df58fe80c1bb02854f0eed7b7))
* modernize TypeScript configuration and fix dynamic imports ([725eef5](https://github.com/mineclover/context-action/commit/725eef5e02388e67103d94814935965e066f3e85))
* **react:** consolidate test structure and fix TypeScript errors ([618ec8c](https://github.com/mineclover/context-action/commit/618ec8cbb2474964b249c0320cff69be373246f1))





## [0.7.3](https://github.com/mineclover/context-action/compare/v0.6.0...v0.7.3) (2025-09-16)


### Bug Fixes

* **llms-generator:** resolve TypeScript compilation errors ([6414ff3](https://github.com/mineclover/context-action/commit/6414ff3fec2a57b25ff9897fb8c7f4cdd23e78b4))
* update TypeScript configuration and enhance LogMonitor component ([c280d4f](https://github.com/mineclover/context-action/commit/c280d4ff4cedf44f28b91e612159bdca7c3a014e))


### Features

* Context-Action 라이브러리 핵심 성능 및 안정성 개선 ([f13fe47](https://github.com/mineclover/context-action/commit/f13fe4756c7f1e39872aca7a45fec09f37da3c2c))
* implement advanced unregister function management system ([1086a8a](https://github.com/mineclover/context-action/commit/1086a8abb3a8887df58fe80c1bb02854f0eed7b7))
* modernize TypeScript configuration and fix dynamic imports ([725eef5](https://github.com/mineclover/context-action/commit/725eef5e02388e67103d94814935965e066f3e85))
* **react:** consolidate test structure and fix TypeScript errors ([618ec8c](https://github.com/mineclover/context-action/commit/618ec8cbb2474964b249c0320cff69be373246f1))





## [0.7.3] - 2025-09-01

### Major Achievements

#### 🛡️ Complete Type Safety Implementation
* **MILESTONE**: Achieved complete TypeScript type safety with zero warnings
* **feat(types)**: Comprehensive type system implementation
  - Resolved all 33 TypeScript compilation errors
  - Eliminated all 24 ESLint `any` type warnings
  - Added complete `LLMSFrontmatter`, `PriorityData`, and `CleanedPriorityData` interfaces
  - Enhanced development experience with full IntelliSense support

#### 📚 Comprehensive Documentation Overhaul
* **docs**: Complete README.md rewrite for v0.7.3
  - Highlighted type safety achievements and zero warnings status
  - Added enterprise-grade positioning and feature overview
  - Updated all version references and status indicators
  - Enhanced quick start guide and usage examples

#### 🔧 Package Maintenance
* **fix(package)**: Corrected package.json files field
  - Removed non-existent documentation files
  - Added actual documentation files for proper npm packaging
* **test**: Fixed GenerateTemplatesCommand test suite
  - Updated test expectations for proper frontmatter validation
  - Ensured all 208 tests pass with new type system

### Technical Improvements

* **refactor(cli)**: Enhanced CLI command type safety
  - All command classes now fully type-safe
  - Proper error handling with typed exceptions
  - Improved configuration management with typed interfaces
* **improve(architecture)**: Modernized codebase architecture  
  - Brought entire codebase to modern TypeScript standards
  - Consistent interface usage across all modules
  - Enhanced maintainability and development experience

### Quality Assurance

* **build**: All packages building successfully (181.52 kB CLI bundle)
* **lint**: Zero ESLint warnings across entire codebase
* **test**: 100% test suite pass rate (12/12 suites, 208/208 tests)
* **types**: Complete TypeScript strict mode compliance

## [0.7.2](https://github.com/mineclover/context-action/compare/v0.6.0...v0.7.2) (2025-08-31)

### Major Improvements

#### 🛡️ Complete Type Safety Achievement
* **BREAKING**: Achieved zero `any` warnings across entire codebase
* **feat(types)**: Add comprehensive type definitions in `src/types/frontmatter.ts`
  - `LLMSFrontmatter` interface for document metadata
  - `PriorityData` interface with nested document and priority structures  
  - `CleanedPriorityData` interface for processed priority data
  - `ConfigCategories` interface for configuration management
* **fix(cli)**: Eliminate all 24 ESLint `any` type warnings across CLI commands
  - `LLMSGenerateCommand.ts`: Fixed 12 type warnings with proper interfaces
  - `PriorityTasksCommand.ts`: Fixed 3 type warnings with TaskType definitions
  - `SimpleLLMSCommand.ts`: Fixed 1 type warning with proper type casting
  - `EnhancedConfigManager.ts`: Fixed 8 type warnings with configuration interfaces

#### 🏗️ Enhanced Development Experience  
* **feat(intellisense)**: Complete IDE support with full type coverage
* **feat(validation)**: Compile-time validation prevents runtime type errors
* **feat(maintenance)**: Type-safe error handling throughout CLI commands
* **perf(bundle)**: Optimized build output (181.52 kB CLI bundle)

#### 📊 Build & Quality Improvements
* **build**: All TypeScript compilation errors resolved (33 → 0)
* **lint**: All ESLint warnings eliminated (24 → 0)  
* **test**: Comprehensive type checking in test suite
* **docs**: Updated README.md to reflect v0.7.2 capabilities and type safety

### Bug Fixes

* **fix(types)**: Replace all `any` type assertions with proper interfaces
* **fix(config)**: Use proper type casting for configuration objects
* **fix(cli)**: Handle optional chaining and fallback values correctly
* update TypeScript configuration and enhance LogMonitor component ([c280d4f](https://github.com/mineclover/context-action/commit/c280d4ff4cedf44f28b91e612159bdca7c3a014e))

### Features

* **feat(enterprise)**: Enterprise-grade type safety for production use
* **feat(documentation)**: Comprehensive README.md rewrite highlighting type safety
* Context-Action 라이브러리 핵심 성능 및 안정성 개선 ([f13fe47](https://github.com/mineclover/context-action/commit/f13fe4756c7f1e39872aca7a45fec09f37da3c2c))
* implement advanced unregister function management system ([1086a8a](https://github.com/mineclover/context-action/commit/1086a8abb3a8887df58fe80c1bb02854f0eed7b7))
* modernize TypeScript configuration and fix dynamic imports ([725eef5](https://github.com/mineclover/context-action/commit/725eef5e02388e67103d94814935965e066f3e85))
* **react:** consolidate test structure and fix TypeScript errors ([618ec8c](https://github.com/mineclover/context-action/commit/618ec8cbb2474964b249c0320cff69be373246f1))

### Technical Debt Reduction

* **refactor(types)**: Systematic replacement of `any` with proper interfaces
* **improve(architecture)**: Enhanced CLI command structure with type safety
* **modernize(codebase)**: Brought entire codebase to modern TypeScript standards
* **standardize(interfaces)**: Consistent interface usage across all commands





## [0.7.1](https://github.com/mineclover/context-action/compare/v0.6.0...v0.7.1) (2025-08-31)


### Bug Fixes

* update TypeScript configuration and enhance LogMonitor component ([c280d4f](https://github.com/mineclover/context-action/commit/c280d4ff4cedf44f28b91e612159bdca7c3a014e))


### Features

* Context-Action 라이브러리 핵심 성능 및 안정성 개선 ([f13fe47](https://github.com/mineclover/context-action/commit/f13fe4756c7f1e39872aca7a45fec09f37da3c2c))
* implement advanced unregister function management system ([1086a8a](https://github.com/mineclover/context-action/commit/1086a8abb3a8887df58fe80c1bb02854f0eed7b7))
* modernize TypeScript configuration and fix dynamic imports ([725eef5](https://github.com/mineclover/context-action/commit/725eef5e02388e67103d94814935965e066f3e85))
* **react:** consolidate test structure and fix TypeScript errors ([618ec8c](https://github.com/mineclover/context-action/commit/618ec8cbb2474964b249c0320cff69be373246f1))





# [0.7.0](https://github.com/mineclover/context-action/compare/v0.6.0...v0.7.0) (2025-08-31)


### Bug Fixes

* update TypeScript configuration and enhance LogMonitor component ([c280d4f](https://github.com/mineclover/context-action/commit/c280d4ff4cedf44f28b91e612159bdca7c3a014e))


### Features

* Context-Action 라이브러리 핵심 성능 및 안정성 개선 ([f13fe47](https://github.com/mineclover/context-action/commit/f13fe4756c7f1e39872aca7a45fec09f37da3c2c))
* implement advanced unregister function management system ([1086a8a](https://github.com/mineclover/context-action/commit/1086a8abb3a8887df58fe80c1bb02854f0eed7b7))
* modernize TypeScript configuration and fix dynamic imports ([725eef5](https://github.com/mineclover/context-action/commit/725eef5e02388e67103d94814935965e066f3e85))
* **react:** consolidate test structure and fix TypeScript errors ([618ec8c](https://github.com/mineclover/context-action/commit/618ec8cbb2474964b249c0320cff69be373246f1))





# [0.6.0](https://github.com/mineclover/context-action/compare/v0.5.1...v0.6.0) (2025-08-29)


### Bug Fixes

* **llms-generator:** complete test path updates for language-specific directory structure ([29ffcd8](https://github.com/mineclover/context-action/commit/29ffcd8a50b310ddf3ad787c81bdbaf6f0b0f442))
* **llms-generator:** restore language-specific directory structure ([276058e](https://github.com/mineclover/context-action/commit/276058e2aec6518fb88df307ae94d74a4b5a7d7d))
* **llms-generator:** update test file paths to match new output structure ([43da9f1](https://github.com/mineclover/context-action/commit/43da9f181e1e94f06041b2b4f9a7a357ae955ac3))
* **llms-generator:** update test paths to match language-specific directory structure ([6f5c482](https://github.com/mineclover/context-action/commit/6f5c482d67ab32dc971c3b2ac61382b03521be51))
* resolve React 18 infinite loop in store subscriptions and ref mount state ([fa652e3](https://github.com/mineclover/context-action/commit/fa652e3018a3e63bf3c1fd2b9564a1cf17f59e6a))


### Features

* **example:** add Non-Reactive Context Store page and update navigation ([f82217b](https://github.com/mineclover/context-action/commit/f82217b188f9c314b7133e91c13f5580d63bc7e9))
* **llms-generator:** add comprehensive multiple category support with tests ([e24c3b8](https://github.com/mineclover/context-action/commit/e24c3b8531a7dd59d8a8dacbc93780b6585be576))





## [0.5.1](https://github.com/mineclover/context-action/compare/v0.5.0...v0.5.1) (2025-08-28)


### Bug Fixes

* **build:** resolve HTML template and dynamic import issues ([5e73d73](https://github.com/mineclover/context-action/commit/5e73d733dfe1e4d7d6ec25727e9056ff4de2ec3c))





# [0.5.0](https://github.com/mineclover/context-action/compare/v0.4.0...v0.5.0) (2025-08-28)


### Bug Fixes

* correct error handling test expectations for non-blocking handlers ([85a2538](https://github.com/mineclover/context-action/commit/85a2538eb8ccb9ec33c19ca6330d3d47592fa6f4))
* improve lint configuration without eslint-disable comments ([e74a160](https://github.com/mineclover/context-action/commit/e74a160cb64aac3875d74bf466a0a1c3328621bc))
* resolve all 16 FillTemplatesCommand test failures ([ccb69bd](https://github.com/mineclover/context-action/commit/ccb69bdbd7168222c7f433a15db994de1bb4645e))
* resolve all 24 SimpleLLMSCommand test failures ([8e05f99](https://github.com/mineclover/context-action/commit/8e05f993a00a4a08151eb938ef73fe10a9033296))
* resolve lint errors for CI/CD ([a5dd247](https://github.com/mineclover/context-action/commit/a5dd247a5f80168f0681da025f8dfdb1be345336))
* resolve type inconsistencies and improve code quality in packages/react ([303829f](https://github.com/mineclover/context-action/commit/303829faedbfe276d88512236612e8e49daeb916))
* update PriorityManagerCommand tests for new type interfaces ([5207865](https://github.com/mineclover/context-action/commit/52078650bdc50569d8f0a4ea35c98eb13ba1cbe9))


### Features

* comprehensive React library improvements and LLMS code documentation ([7c96735](https://github.com/mineclover/context-action/commit/7c967357c3571c435a66bdae174c7ca29678842b))
* enhance UI components and improve data handling ([9a91959](https://github.com/mineclover/context-action/commit/9a9195976012629d6eec3ec75ffd616a8821a66b))
* **react:** comprehensive testing utilities, DevTools, and error handling systems ([9560c75](https://github.com/mineclover/context-action/commit/9560c752ab46962a16fdd3ff2284e383494c4e5a))
* **react:** enhance ActionContext with optimized dispatch and handler patterns ([49c94dc](https://github.com/mineclover/context-action/commit/49c94dc28237d572670b3b4855acceeee295f47c))
* **react:** enhance ref patterns and store components with new hook utilities ([42486a5](https://github.com/mineclover/context-action/commit/42486a55d5f2bb2cb01f937f2c3c3cce89b69c1c))





# [0.4.0](https://github.com/mineclover/context-action/compare/v0.3.1...v0.4.0) (2025-08-26)


### Bug Fixes

* remove unused deprecated code and fix LLMS generator test ([315b163](https://github.com/mineclover/context-action/commit/315b163fa452ae86c8859166687f6d33d4f5c6d3))
* resolve existing TypeScript compilation errors ([a92b76d](https://github.com/mineclover/context-action/commit/a92b76d52a394dfb0982b7d0c461d8e940201b45))
* resolve LLMS documentation system mismatches and restore data integrity ([949298c](https://github.com/mineclover/context-action/commit/949298c90d2801f4d7033ab2c32b6ebeaf1fdae4))
* update llms-generator mismatch report ([205b40c](https://github.com/mineclover/context-action/commit/205b40cf5268716e50c9b76ae1e7303cff1f10d0))


### Features

* Add comprehensive CLI test suites for LLMS Generator ([a774b0f](https://github.com/mineclover/context-action/commit/a774b0fd36c78bf58def91bc678bd9d1be332314))
* add mismatch detection system and enhance post-commit hook ([a157dbc](https://github.com/mineclover/context-action/commit/a157dbcd9087a3295f0add9937de91e4adf8bf4b))





## [0.3.2] - 2025-08-26

### Added

- **🔍 Mismatch Detection System**: New `detect-mismatches` command for comprehensive integrity checking
  - Identifies orphaned LLMS files when source documents are deleted
  - Detects missing LLMS data for existing source documents  
  - Finds structural inconsistencies in LLMS directories
- **📄 Automated Mismatch Reporting**: Generates detailed Markdown reports with severity classification and batch fix commands
- **🔧 Enhanced Post-Commit Hook**: Automatic mismatch detection when documentation changes occur
- **⚡ Shell Script Integration**: Smart exit codes and `--check-only` mode for CI/CD integration
- **📊 New Package Scripts**: `llms:detect-mismatches` and `llms:detect-mismatches:verbose`

### Enhanced

- **MismatchDetectionCommand**: Comprehensive integrity checking between `docs/` and `llmsData/`
- **CLI Help System**: Updated to include new mismatch detection commands
- **Post-Commit Hook**: Enhanced with deleted file detection and automatic report generation
- **Package Description**: Updated to reflect enterprise-grade capabilities with integrity management

### Security

- **Safe File Operations**: Never automatically deletes files - always requires manual review
- **Manual Confirmation Required**: All suggested deletion commands include safety warnings

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
