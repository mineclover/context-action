# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.8.8](https://github.com/mineclover/context-action/compare/v0.8.7...v0.8.8) (2026-07-13)

**Note:** Version bump only for package @context-action/react





## [0.8.7](https://github.com/mineclover/context-action/compare/v0.8.6...v0.8.7) (2026-07-12)


### Features

* expand implementation playbook scenarios ([67ae17e](https://github.com/mineclover/context-action/commit/67ae17e4c7242f933835a5b2672b9397cb50b603))
* **react:** align store APIs with modern runtime ([1364eb9](https://github.com/mineclover/context-action/commit/1364eb91368b830b70ee804566dd3ddb69ea0e68))
* **react:** stabilize tool handler results and lifecycle ([52b5c44](https://github.com/mineclover/context-action/commit/52b5c44d0734b54626d7407fea8d27d88323f6d9))





## [0.8.6](https://github.com/mineclover/context-action/compare/v0.8.5...v0.8.6) (2026-03-27)

**Note:** Version bump only for package @context-action/react





## [0.8.5](https://github.com/mineclover/context-action/compare/v0.8.4...v0.8.5) (2026-03-27)


### Features

* add canonical implementation playbook ([34aeebf](https://github.com/mineclover/context-action/commit/34aeebf86ba1b0d153973e6fe86e0829e733cd3c))
* Add path-based subscription and TimeTravelStore with major docs cleanup ([9b7d8d2](https://github.com/mineclover/context-action/commit/9b7d8d2f84a65751e477202960e649ad6aa45b01))
* Add Zod schema integration and createToolContext for LLM tool registry ([1baf4b8](https://github.com/mineclover/context-action/commit/1baf4b80fe236ee9b5ae6b3d11ca66d745185c7a))
* **stores:** Add notificationMode support to TimeTravelStore ([8bc40c3](https://github.com/mineclover/context-action/commit/8bc40c30b8b08bae00547e15bcd5563c23e2553c))
* **stores:** Add notifyPath/notifyPaths API for external async operations ([0d080b8](https://github.com/mineclover/context-action/commit/0d080b839947b652375057262360ea95854299c9))
* **stores:** Add RFC 6901 JSON Pointer support and stability improvements ([c0b6665](https://github.com/mineclover/context-action/commit/c0b6665d9014dc4b759b5e6fb0070a41af07b9f5))


### Performance Improvements

* Optimize path matching with string-based prefix comparison ([a03da65](https://github.com/mineclover/context-action/commit/a03da6539244257185f6286127dda533d26e7a32))
* **TimeTravelStore:** Enable structural sharing by default ([2eaa812](https://github.com/mineclover/context-action/commit/2eaa812b0a32fd9e887a2c4d5e25279f9cb8120f))


### BREAKING CHANGES

* **TimeTravelStore:** TimeTravelStore now defaults to mutable=true and cloningEnabled=false

- mutable=true: Enables structural sharing where unchanged parts keep same reference
- cloningEnabled=false: Preserves structural sharing in getValue() and snapshots
- Enables selective re-rendering with path-based subscriptions
- Updated tests to use draft mutation pattern (mutable mode requirement)

Migration: If you relied on defensive copying, call store.setCloningEnabled(true)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>





## [0.7.8](https://github.com/mineclover/context-action/compare/v0.7.7...v0.7.8) (2025-11-30)


### Bug Fixes

* Change @context-action/core dependency from workspace:* to latest ([595508e](https://github.com/mineclover/context-action/commit/595508ea99e4c920b6d6646980f1acc5cf001dd1))
* replace workspace dependency with actual version in react package ([b2187af](https://github.com/mineclover/context-action/commit/b2187afd9ecebf7f342c6cd36578512b1d9aaf63))
* Resolve TypeScript type errors in ActionContext.tsx ([4581305](https://github.com/mineclover/context-action/commit/4581305cf402768d5cb142e3c9c80a57fad8227d))


### Features

* Add comprehensive TypeScript type inference system and documentation ([debde90](https://github.com/mineclover/context-action/commit/debde9069f6e4aa1d87ba2652f510c7fcf552707))
* Add optimization analysis report and enhance performance monitoring ([9aad8ac](https://github.com/mineclover/context-action/commit/9aad8ac0515c289ca8195f348e6f68b521af9046))
* clean release with unified version 0.7.8/0.7.9 ([f0b54a6](https://github.com/mineclover/context-action/commit/f0b54a6ecfa378a42e924492ac2cefaaf90dbb88))
* Complete @context-action/test-driven-docs integration with enhanced features ([2954a19](https://github.com/mineclover/context-action/commit/2954a19d897eb95a8497d3d39ac4fdd4db769580))
* **react:** v0.8.1 - React Compiler integration with backwards compatibility ([f3adbcf](https://github.com/mineclover/context-action/commit/f3adbcf2060a89261f01703b3e69ed31852d36a3))
* Update @context-action/react to use latest dependencies ([c349442](https://github.com/mineclover/context-action/commit/c34944222d73799f4a1f0272de689e67fe63920d))


### Performance Improvements

* Optimize core and react package implementations ([88fab30](https://github.com/mineclover/context-action/commit/88fab30709c03537a97b3ba8e1cfe058e80a1107))


### Reverts

* Revert "refactor: Update store methods to use updateValue for safer state management" ([d158c93](https://github.com/mineclover/context-action/commit/d158c936f6045f0fa6affdd1af34403cb281f868))





## [0.8.1](https://github.com/mineclover/context-action/compare/v0.8.0...v0.8.1) (2025-01-15)

### Bug Fixes

* **Backwards Compatibility:** Fixed React Compiler runtime dependency resolution
* **Peer Dependencies:** Updated React peer dependency to support React 17+ properly
* **Example Project:** Added missing `react-compiler-runtime` dependency to example project

### Improvements

* **Dependency Management:** Improved React Compiler runtime integration
* **Vite Compatibility:** Fixed Vite development server dependency resolution issues

## [0.8.0](https://github.com/mineclover/context-action/compare/v0.7.9...v0.8.0) (2025-01-15)

### Features

* **React Compiler Integration:** Add React Compiler support with automatic memoization optimization
* **Performance:** Enhanced performance with "use memo" directives for hooks
* **Build System:** Updated to use rolldown for faster bundling
* **TypeScript:** Improved type definitions and exports

### Breaking Changes

* **Dependencies:** Added `react-compiler-runtime` as a peer dependency
* **Build:** Updated build system to use tsdown with rolldown

## [0.7.7](https://github.com/mineclover/context-action/compare/v0.6.0...v0.7.7) (2025-09-17)


### Bug Fixes

* **ActionRegister:** enhance error handling and execution context management ([d32a1f6](https://github.com/mineclover/context-action/commit/d32a1f60858141db6dc7ff9bc72fa3056638c97f))
* convert Immer from dynamic to static imports for improved stability ([dde606f](https://github.com/mineclover/context-action/commit/dde606feee79f942d953a60b32164f11fc10b374))
* improve Store update method with Immer integration ([c9754d7](https://github.com/mineclover/context-action/commit/c9754d7c750c1abf70a3eef99504033ce089b439))
* improve Store update method with Immer integration ([0bce495](https://github.com/mineclover/context-action/commit/0bce49562ed323e52985917306e87385e9b64205))
* **react:** adjust test expectations after refactoring ([78a4808](https://github.com/mineclover/context-action/commit/78a48084b254f59688e71f90419783cb30ecad1d))
* **react:** Enable Immer MapSet plugin for Set and Map support ([18d98e6](https://github.com/mineclover/context-action/commit/18d98e6e1cf9b7b9eeb3a1778c4a5ba61270c89d))
* **react:** export StoreManager for proper type inference in createStoreContext ([3433632](https://github.com/mineclover/context-action/commit/343363292beb920d13beda336cc5fade8d7684df))
* resolve core and react package linting warnings ([fc0df76](https://github.com/mineclover/context-action/commit/fc0df76116c6f3de6acc9fc0845743e9e24f2aa2))
* Resolve failing test suites and improve test stability ([926510c](https://github.com/mineclover/context-action/commit/926510cad2fc5562a8c4d81156035282d44252fe))
* resolve Node.js protocol browser compatibility issues ([854a2fa](https://github.com/mineclover/context-action/commit/854a2fa0c8bf87addb0e555f8555def584a04a33))
* Resolve test error handling and update dependencies ([54bca84](https://github.com/mineclover/context-action/commit/54bca847b5a6f4e08b95266a9839ae4483fd2cd0))
* simplify tsdown configuration for reliable DTS generation ([590b702](https://github.com/mineclover/context-action/commit/590b7022e53c6d6f8e36a1e8356ab431abeaf92f))
* update TypeScript configuration and enhance LogMonitor component ([c280d4f](https://github.com/mineclover/context-action/commit/c280d4ff4cedf44f28b91e612159bdca7c3a014e))


### Features

* Context-Action 라이브러리 핵심 성능 및 안정성 개선 ([f13fe47](https://github.com/mineclover/context-action/commit/f13fe4756c7f1e39872aca7a45fec09f37da3c2c))
* modernize TypeScript configuration and fix dynamic imports ([725eef5](https://github.com/mineclover/context-action/commit/725eef5e02388e67103d94814935965e066f3e85))
* **react:** consolidate test structure and fix TypeScript errors ([618ec8c](https://github.com/mineclover/context-action/commit/618ec8cbb2474964b249c0320cff69be373246f1))


### Performance Improvements

* Optimize useComputedStore with useSyncExternalStore ([bbef3c6](https://github.com/mineclover/context-action/commit/bbef3c6b960ba9637cf7afb5cbdcda9f47dc7ae9))





## [0.7.6](https://github.com/mineclover/context-action/compare/v0.6.0...v0.7.6) (2025-09-17)


### Bug Fixes

* **ActionRegister:** enhance error handling and execution context management ([d32a1f6](https://github.com/mineclover/context-action/commit/d32a1f60858141db6dc7ff9bc72fa3056638c97f))
* convert Immer from dynamic to static imports for improved stability ([dde606f](https://github.com/mineclover/context-action/commit/dde606feee79f942d953a60b32164f11fc10b374))
* improve Store update method with Immer integration ([c9754d7](https://github.com/mineclover/context-action/commit/c9754d7c750c1abf70a3eef99504033ce089b439))
* improve Store update method with Immer integration ([0bce495](https://github.com/mineclover/context-action/commit/0bce49562ed323e52985917306e87385e9b64205))
* **react:** adjust test expectations after refactoring ([78a4808](https://github.com/mineclover/context-action/commit/78a48084b254f59688e71f90419783cb30ecad1d))
* **react:** Enable Immer MapSet plugin for Set and Map support ([18d98e6](https://github.com/mineclover/context-action/commit/18d98e6e1cf9b7b9eeb3a1778c4a5ba61270c89d))
* **react:** export StoreManager for proper type inference in createStoreContext ([3433632](https://github.com/mineclover/context-action/commit/343363292beb920d13beda336cc5fade8d7684df))
* resolve core and react package linting warnings ([fc0df76](https://github.com/mineclover/context-action/commit/fc0df76116c6f3de6acc9fc0845743e9e24f2aa2))
* Resolve failing test suites and improve test stability ([926510c](https://github.com/mineclover/context-action/commit/926510cad2fc5562a8c4d81156035282d44252fe))
* resolve Node.js protocol browser compatibility issues ([854a2fa](https://github.com/mineclover/context-action/commit/854a2fa0c8bf87addb0e555f8555def584a04a33))
* Resolve test error handling and update dependencies ([54bca84](https://github.com/mineclover/context-action/commit/54bca847b5a6f4e08b95266a9839ae4483fd2cd0))
* update TypeScript configuration and enhance LogMonitor component ([c280d4f](https://github.com/mineclover/context-action/commit/c280d4ff4cedf44f28b91e612159bdca7c3a014e))


### Features

* Context-Action 라이브러리 핵심 성능 및 안정성 개선 ([f13fe47](https://github.com/mineclover/context-action/commit/f13fe4756c7f1e39872aca7a45fec09f37da3c2c))
* modernize TypeScript configuration and fix dynamic imports ([725eef5](https://github.com/mineclover/context-action/commit/725eef5e02388e67103d94814935965e066f3e85))
* **react:** consolidate test structure and fix TypeScript errors ([618ec8c](https://github.com/mineclover/context-action/commit/618ec8cbb2474964b249c0320cff69be373246f1))


### Performance Improvements

* Optimize useComputedStore with useSyncExternalStore ([bbef3c6](https://github.com/mineclover/context-action/commit/bbef3c6b960ba9637cf7afb5cbdcda9f47dc7ae9))





## [0.7.5](https://github.com/mineclover/context-action/compare/v0.6.0...v0.7.5) (2025-09-17)


### Bug Fixes

* **ActionRegister:** enhance error handling and execution context management ([d32a1f6](https://github.com/mineclover/context-action/commit/d32a1f60858141db6dc7ff9bc72fa3056638c97f))
* convert Immer from dynamic to static imports for improved stability ([dde606f](https://github.com/mineclover/context-action/commit/dde606feee79f942d953a60b32164f11fc10b374))
* improve Store update method with Immer integration ([c9754d7](https://github.com/mineclover/context-action/commit/c9754d7c750c1abf70a3eef99504033ce089b439))
* improve Store update method with Immer integration ([0bce495](https://github.com/mineclover/context-action/commit/0bce49562ed323e52985917306e87385e9b64205))
* **react:** adjust test expectations after refactoring ([78a4808](https://github.com/mineclover/context-action/commit/78a48084b254f59688e71f90419783cb30ecad1d))
* **react:** Enable Immer MapSet plugin for Set and Map support ([18d98e6](https://github.com/mineclover/context-action/commit/18d98e6e1cf9b7b9eeb3a1778c4a5ba61270c89d))
* **react:** export StoreManager for proper type inference in createStoreContext ([3433632](https://github.com/mineclover/context-action/commit/343363292beb920d13beda336cc5fade8d7684df))
* resolve core and react package linting warnings ([fc0df76](https://github.com/mineclover/context-action/commit/fc0df76116c6f3de6acc9fc0845743e9e24f2aa2))
* Resolve failing test suites and improve test stability ([926510c](https://github.com/mineclover/context-action/commit/926510cad2fc5562a8c4d81156035282d44252fe))
* Resolve test error handling and update dependencies ([54bca84](https://github.com/mineclover/context-action/commit/54bca847b5a6f4e08b95266a9839ae4483fd2cd0))
* update TypeScript configuration and enhance LogMonitor component ([c280d4f](https://github.com/mineclover/context-action/commit/c280d4ff4cedf44f28b91e612159bdca7c3a014e))


### Features

* Context-Action 라이브러리 핵심 성능 및 안정성 개선 ([f13fe47](https://github.com/mineclover/context-action/commit/f13fe4756c7f1e39872aca7a45fec09f37da3c2c))
* modernize TypeScript configuration and fix dynamic imports ([725eef5](https://github.com/mineclover/context-action/commit/725eef5e02388e67103d94814935965e066f3e85))
* **react:** consolidate test structure and fix TypeScript errors ([618ec8c](https://github.com/mineclover/context-action/commit/618ec8cbb2474964b249c0320cff69be373246f1))


### Performance Improvements

* Optimize useComputedStore with useSyncExternalStore ([bbef3c6](https://github.com/mineclover/context-action/commit/bbef3c6b960ba9637cf7afb5cbdcda9f47dc7ae9))





## [0.7.4](https://github.com/mineclover/context-action/compare/v0.6.0...v0.7.4) (2025-09-17)


### Bug Fixes

* **ActionRegister:** enhance error handling and execution context management ([d32a1f6](https://github.com/mineclover/context-action/commit/d32a1f60858141db6dc7ff9bc72fa3056638c97f))
* convert Immer from dynamic to static imports for improved stability ([dde606f](https://github.com/mineclover/context-action/commit/dde606feee79f942d953a60b32164f11fc10b374))
* improve Store update method with Immer integration ([c9754d7](https://github.com/mineclover/context-action/commit/c9754d7c750c1abf70a3eef99504033ce089b439))
* improve Store update method with Immer integration ([0bce495](https://github.com/mineclover/context-action/commit/0bce49562ed323e52985917306e87385e9b64205))
* **react:** adjust test expectations after refactoring ([78a4808](https://github.com/mineclover/context-action/commit/78a48084b254f59688e71f90419783cb30ecad1d))
* **react:** Enable Immer MapSet plugin for Set and Map support ([18d98e6](https://github.com/mineclover/context-action/commit/18d98e6e1cf9b7b9eeb3a1778c4a5ba61270c89d))
* **react:** export StoreManager for proper type inference in createStoreContext ([3433632](https://github.com/mineclover/context-action/commit/343363292beb920d13beda336cc5fade8d7684df))
* resolve core and react package linting warnings ([fc0df76](https://github.com/mineclover/context-action/commit/fc0df76116c6f3de6acc9fc0845743e9e24f2aa2))
* Resolve failing test suites and improve test stability ([926510c](https://github.com/mineclover/context-action/commit/926510cad2fc5562a8c4d81156035282d44252fe))
* update TypeScript configuration and enhance LogMonitor component ([c280d4f](https://github.com/mineclover/context-action/commit/c280d4ff4cedf44f28b91e612159bdca7c3a014e))


### Features

* Context-Action 라이브러리 핵심 성능 및 안정성 개선 ([f13fe47](https://github.com/mineclover/context-action/commit/f13fe4756c7f1e39872aca7a45fec09f37da3c2c))
* modernize TypeScript configuration and fix dynamic imports ([725eef5](https://github.com/mineclover/context-action/commit/725eef5e02388e67103d94814935965e066f3e85))
* **react:** consolidate test structure and fix TypeScript errors ([618ec8c](https://github.com/mineclover/context-action/commit/618ec8cbb2474964b249c0320cff69be373246f1))


### Performance Improvements

* Optimize useComputedStore with useSyncExternalStore ([bbef3c6](https://github.com/mineclover/context-action/commit/bbef3c6b960ba9637cf7afb5cbdcda9f47dc7ae9))





## [0.7.3](https://github.com/mineclover/context-action/compare/v0.6.0...v0.7.3) (2025-09-16)


### Bug Fixes

* **ActionRegister:** enhance error handling and execution context management ([d32a1f6](https://github.com/mineclover/context-action/commit/d32a1f60858141db6dc7ff9bc72fa3056638c97f))
* convert Immer from dynamic to static imports for improved stability ([dde606f](https://github.com/mineclover/context-action/commit/dde606feee79f942d953a60b32164f11fc10b374))
* improve Store update method with Immer integration ([c9754d7](https://github.com/mineclover/context-action/commit/c9754d7c750c1abf70a3eef99504033ce089b439))
* improve Store update method with Immer integration ([0bce495](https://github.com/mineclover/context-action/commit/0bce49562ed323e52985917306e87385e9b64205))
* **react:** adjust test expectations after refactoring ([78a4808](https://github.com/mineclover/context-action/commit/78a48084b254f59688e71f90419783cb30ecad1d))
* **react:** export StoreManager for proper type inference in createStoreContext ([3433632](https://github.com/mineclover/context-action/commit/343363292beb920d13beda336cc5fade8d7684df))
* resolve core and react package linting warnings ([fc0df76](https://github.com/mineclover/context-action/commit/fc0df76116c6f3de6acc9fc0845743e9e24f2aa2))
* update TypeScript configuration and enhance LogMonitor component ([c280d4f](https://github.com/mineclover/context-action/commit/c280d4ff4cedf44f28b91e612159bdca7c3a014e))


### Features

* Context-Action 라이브러리 핵심 성능 및 안정성 개선 ([f13fe47](https://github.com/mineclover/context-action/commit/f13fe4756c7f1e39872aca7a45fec09f37da3c2c))
* modernize TypeScript configuration and fix dynamic imports ([725eef5](https://github.com/mineclover/context-action/commit/725eef5e02388e67103d94814935965e066f3e85))
* **react:** consolidate test structure and fix TypeScript errors ([618ec8c](https://github.com/mineclover/context-action/commit/618ec8cbb2474964b249c0320cff69be373246f1))





## [0.7.2](https://github.com/mineclover/context-action/compare/v0.6.0...v0.7.2) (2025-08-31)


### Bug Fixes

* **ActionRegister:** enhance error handling and execution context management ([d32a1f6](https://github.com/mineclover/context-action/commit/d32a1f60858141db6dc7ff9bc72fa3056638c97f))
* convert Immer from dynamic to static imports for improved stability ([dde606f](https://github.com/mineclover/context-action/commit/dde606feee79f942d953a60b32164f11fc10b374))
* improve Store update method with Immer integration ([c9754d7](https://github.com/mineclover/context-action/commit/c9754d7c750c1abf70a3eef99504033ce089b439))
* improve Store update method with Immer integration ([0bce495](https://github.com/mineclover/context-action/commit/0bce49562ed323e52985917306e87385e9b64205))
* **react:** adjust test expectations after refactoring ([78a4808](https://github.com/mineclover/context-action/commit/78a48084b254f59688e71f90419783cb30ecad1d))
* **react:** export StoreManager for proper type inference in createStoreContext ([3433632](https://github.com/mineclover/context-action/commit/343363292beb920d13beda336cc5fade8d7684df))
* resolve core and react package linting warnings ([fc0df76](https://github.com/mineclover/context-action/commit/fc0df76116c6f3de6acc9fc0845743e9e24f2aa2))
* update TypeScript configuration and enhance LogMonitor component ([c280d4f](https://github.com/mineclover/context-action/commit/c280d4ff4cedf44f28b91e612159bdca7c3a014e))


### Features

* Context-Action 라이브러리 핵심 성능 및 안정성 개선 ([f13fe47](https://github.com/mineclover/context-action/commit/f13fe4756c7f1e39872aca7a45fec09f37da3c2c))
* modernize TypeScript configuration and fix dynamic imports ([725eef5](https://github.com/mineclover/context-action/commit/725eef5e02388e67103d94814935965e066f3e85))
* **react:** consolidate test structure and fix TypeScript errors ([618ec8c](https://github.com/mineclover/context-action/commit/618ec8cbb2474964b249c0320cff69be373246f1))





## [0.7.1](https://github.com/mineclover/context-action/compare/v0.6.0...v0.7.1) (2025-08-31)


### Bug Fixes

* **ActionRegister:** enhance error handling and execution context management ([d32a1f6](https://github.com/mineclover/context-action/commit/d32a1f60858141db6dc7ff9bc72fa3056638c97f))
* convert Immer from dynamic to static imports for improved stability ([dde606f](https://github.com/mineclover/context-action/commit/dde606feee79f942d953a60b32164f11fc10b374))
* improve Store update method with Immer integration ([c9754d7](https://github.com/mineclover/context-action/commit/c9754d7c750c1abf70a3eef99504033ce089b439))
* improve Store update method with Immer integration ([0bce495](https://github.com/mineclover/context-action/commit/0bce49562ed323e52985917306e87385e9b64205))
* **react:** adjust test expectations after refactoring ([78a4808](https://github.com/mineclover/context-action/commit/78a48084b254f59688e71f90419783cb30ecad1d))
* **react:** export StoreManager for proper type inference in createStoreContext ([3433632](https://github.com/mineclover/context-action/commit/343363292beb920d13beda336cc5fade8d7684df))
* update TypeScript configuration and enhance LogMonitor component ([c280d4f](https://github.com/mineclover/context-action/commit/c280d4ff4cedf44f28b91e612159bdca7c3a014e))


### Features

* Context-Action 라이브러리 핵심 성능 및 안정성 개선 ([f13fe47](https://github.com/mineclover/context-action/commit/f13fe4756c7f1e39872aca7a45fec09f37da3c2c))
* modernize TypeScript configuration and fix dynamic imports ([725eef5](https://github.com/mineclover/context-action/commit/725eef5e02388e67103d94814935965e066f3e85))
* **react:** consolidate test structure and fix TypeScript errors ([618ec8c](https://github.com/mineclover/context-action/commit/618ec8cbb2474964b249c0320cff69be373246f1))





# [0.7.0](https://github.com/mineclover/context-action/compare/v0.6.0...v0.7.0) (2025-08-31)


### Bug Fixes

* **ActionRegister:** enhance error handling and execution context management ([d32a1f6](https://github.com/mineclover/context-action/commit/d32a1f60858141db6dc7ff9bc72fa3056638c97f))
* convert Immer from dynamic to static imports for improved stability ([dde606f](https://github.com/mineclover/context-action/commit/dde606feee79f942d953a60b32164f11fc10b374))
* improve Store update method with Immer integration ([c9754d7](https://github.com/mineclover/context-action/commit/c9754d7c750c1abf70a3eef99504033ce089b439))
* improve Store update method with Immer integration ([0bce495](https://github.com/mineclover/context-action/commit/0bce49562ed323e52985917306e87385e9b64205))
* **react:** export StoreManager for proper type inference in createStoreContext ([3433632](https://github.com/mineclover/context-action/commit/343363292beb920d13beda336cc5fade8d7684df))
* update TypeScript configuration and enhance LogMonitor component ([c280d4f](https://github.com/mineclover/context-action/commit/c280d4ff4cedf44f28b91e612159bdca7c3a014e))


### Features

* Context-Action 라이브러리 핵심 성능 및 안정성 개선 ([f13fe47](https://github.com/mineclover/context-action/commit/f13fe4756c7f1e39872aca7a45fec09f37da3c2c))
* modernize TypeScript configuration and fix dynamic imports ([725eef5](https://github.com/mineclover/context-action/commit/725eef5e02388e67103d94814935965e066f3e85))
* **react:** consolidate test structure and fix TypeScript errors ([618ec8c](https://github.com/mineclover/context-action/commit/618ec8cbb2474964b249c0320cff69be373246f1))





# [0.6.0](https://github.com/mineclover/context-action/compare/v0.5.1...v0.6.0) (2025-08-29)


### Bug Fixes

* resolve React 18 infinite loop in store subscriptions and ref mount state ([fa652e3](https://github.com/mineclover/context-action/commit/fa652e3018a3e63bf3c1fd2b9564a1cf17f59e6a))


### Features

* **core:** enhance RefContext and Store for selective subscription patterns ([01a4491](https://github.com/mineclover/context-action/commit/01a4491d4c1e52b744162c299206b71c6a0532e3))
* **refs:** add RefContext mount state subscription capabilities ([695a456](https://github.com/mineclover/context-action/commit/695a456911b308a4bb696b61b9236d665912f595))





## [0.5.1](https://github.com/mineclover/context-action/compare/v0.5.0...v0.5.1) (2025-08-28)


### Bug Fixes

* **build:** resolve HTML template and dynamic import issues ([5e73d73](https://github.com/mineclover/context-action/commit/5e73d733dfe1e4d7d6ec25727e9056ff4de2ec3c))





# [0.5.0](https://github.com/mineclover/context-action/compare/v0.4.0...v0.5.0) (2025-08-28)


### Bug Fixes

* correct error handling test expectations for non-blocking handlers ([85a2538](https://github.com/mineclover/context-action/commit/85a2538eb8ccb9ec33c19ca6330d3d47592fa6f4))
* **react:** export error handling and DevTools modules ([c7443ad](https://github.com/mineclover/context-action/commit/c7443ad2a8d598770f29df1e53af18e8fb08331b))
* resolve type inconsistencies and improve code quality in packages/react ([303829f](https://github.com/mineclover/context-action/commit/303829faedbfe276d88512236612e8e49daeb916))
* update React and React-DOM versions to 18.3.1 and adjust pnpm setup ([d988403](https://github.com/mineclover/context-action/commit/d9884033a5e13384bc9f1ad40cdb64c66fb1a250))


### Features

* **canvas:** optimize store subscriptions and add selector tracking ([2cba895](https://github.com/mineclover/context-action/commit/2cba89585b7ef9c674cd964fe156ad3cdb93781f))
* comprehensive React library improvements and LLMS code documentation ([7c96735](https://github.com/mineclover/context-action/commit/7c967357c3571c435a66bdae174c7ca29678842b))
* enhance UI components and improve data handling ([9a91959](https://github.com/mineclover/context-action/commit/9a9195976012629d6eec3ec75ffd616a8821a66b))
* implement RefContext onMount and executeIfMounted patterns ([f00b99f](https://github.com/mineclover/context-action/commit/f00b99f66a42b41362d7fd44adab9c744d7e73ba))
* **react:** comprehensive package enhancements with zero lint warnings ([a71af3c](https://github.com/mineclover/context-action/commit/a71af3c4dd781136f912f91bae90d1279b6f5096))
* **react:** comprehensive testing utilities, DevTools, and error handling systems ([9560c75](https://github.com/mineclover/context-action/commit/9560c752ab46962a16fdd3ff2284e383494c4e5a))
* **react:** enhance ActionContext with optimized dispatch and handler patterns ([49c94dc](https://github.com/mineclover/context-action/commit/49c94dc28237d572670b3b4855acceeee295f47c))
* **react:** enhance ref patterns and store components with new hook utilities ([42486a5](https://github.com/mineclover/context-action/commit/42486a55d5f2bb2cb01f937f2c3c3cce89b69c1c))
* **react:** optimize bundle size with selective loading and tree-shaking ([af6f7b4](https://github.com/mineclover/context-action/commit/af6f7b43e3575c9006e6118c13dd183c3be325e1))
* replace complex immutability system with Immer for enhanced performance ([059e0c9](https://github.com/mineclover/context-action/commit/059e0c942a2bd8900ce94778179452eed041e22f))





# [0.4.1](https://github.com/mineclover/context-action/compare/v0.4.0...v0.4.1) (2025-08-27)

### Bug Fixes

* **Store**: Fix timeout ID type compatibility for browser/Node.js environments ([Store.ts:46](packages/react/src/stores/core/Store.ts))
  - Changed `batchTimeoutId` type to `ReturnType<typeof requestAnimationFrame>` for cross-platform compatibility
* **comparison**: Fix circular reference detection bug in comparison utilities ([comparison.ts:131-140](packages/react/src/stores/utils/comparison.ts))
  - Improved circular reference checking to validate each value individually
* **EventBus**: Prevent memory leaks in event history storage ([EventBus.ts:156-200](packages/react/src/stores/core/EventBus.ts))
  - Added safe data reference handling for DOM elements and React components
  - Only stores essential metadata for memory-heavy objects
* **error-handling**: Standardize error handling across all modules
  - Replaced direct `console.error` calls with centralized `ErrorHandlers` system
  - Improved error context and consistency throughout the framework
* **Store**: Complete event object detection and prevention ([Store.ts:129-143, 195-209](packages/react/src/stores/core/Store.ts))
  - Enhanced event object detection to prevent memory leaks
  - Added early return to prevent storing potentially problematic event objects
  - Improved error reporting with detailed context information

### Performance Improvements

* **EventBus**: Reduced memory usage by preventing storage of large DOM/React objects
* **Store**: Enhanced event object detection prevents memory retention issues
* **comparison**: Improved circular reference detection algorithm efficiency

# [0.4.0](https://github.com/mineclover/context-action/compare/v0.3.1...v0.4.0) (2025-08-26)


### Bug Fixes

* resolve existing TypeScript compilation errors ([a92b76d](https://github.com/mineclover/context-action/commit/a92b76d52a394dfb0982b7d0c461d8e940201b45))


### Features

* add comprehensive documentation for Context-Action framework ([2ee3948](https://github.com/mineclover/context-action/commit/2ee3948118721cd0b633bc71f6d5884808970306))
* add comprehensive pattern examples with async, action, and store implementations ([6820a26](https://github.com/mineclover/context-action/commit/6820a266d0ca298f5172c15a80a73e1fcb82f38f))
* add mount timeout options to createRefContext ([0266f02](https://github.com/mineclover/context-action/commit/0266f024abe0b3265cb86411cf2118cb0749ce2a))
* cleanup core pages and fix selector infinite loops ([641b03d](https://github.com/mineclover/context-action/commit/641b03d2b06c806bd062f546ea4f4dd0e38c340f))
* consolidate ActionContext implementations and reorganize documentation ([b621f50](https://github.com/mineclover/context-action/commit/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65))
* enhance type inference system for createRefContext ([63e2521](https://github.com/mineclover/context-action/commit/63e2521ce0eaf531ba2602b8416661d9993558c4))





## [0.3.1](https://github.com/mineclover/context-action/compare/v0.2.1...v0.3.1) (2025-08-21)


### Bug Fixes

* **ci:** resolve CI/CD dependency installation errors ([675641f](https://github.com/mineclover/context-action/commit/675641f814d63d639cfa375f5e8debe134828762))
* **ci:** standardize tsdown version across all packages ([714ab1d](https://github.com/mineclover/context-action/commit/714ab1d7f8005096f7abe2f09d8067f500168a3a))
* comprehensive RefStore DOM element handling improvements ([23844d7](https://github.com/mineclover/context-action/commit/23844d700dcbc737e3c0961c662be72220d4df05))
* **core,react:** improve code quality and security across packages ([e7baf2f](https://github.com/mineclover/context-action/commit/e7baf2fb8bf49bc5ae0b3f92efbf567fb5d2da09))
* enhance non-cloneable object detection in immutable utils ([0bd7f55](https://github.com/mineclover/context-action/commit/0bd7f5511d8a588970196b000ab33e2dbaa0ff50))
* improve code quality and resolve TypeScript/lint issues ([0afcba8](https://github.com/mineclover/context-action/commit/0afcba8a8723d45770c7bdb7cc13060d7e80dd62))
* resolve event object detection warnings for RefStore ([de9a3c2](https://github.com/mineclover/context-action/commit/de9a3c2aec135ce0bb562ee9c7d367cbe201b4e4))
* resolve RefStore circular reference issues with HTML elements ([42af794](https://github.com/mineclover/context-action/commit/42af79466439f52414e2e0500704026e61af04e1))
* update remaining useRef references to useRefHandler in tests and docs ([39f8e21](https://github.com/mineclover/context-action/commit/39f8e218023c0e8d3be91929cf362ffb5414e313))


### Features

* enhance createRefContext with declarative ref management ([58a56e2](https://github.com/mineclover/context-action/commit/58a56e25ab48fc85f59135042c1975bef1bbbc10))
* enhance type safety and fix test implementations ([ad374a7](https://github.com/mineclover/context-action/commit/ad374a71ff98b78e4ed14d524d6c4ecc8f6ab99e))
* implement RefContext mouse events with zero-render architecture ([274c510](https://github.com/mineclover/context-action/commit/274c5109ccdae1883a016cd17adeda55cb5ac537))
* remove deprecated action handler utilities ([2861d61](https://github.com/mineclover/context-action/commit/2861d61b4b5d930e9e7f5277983455dc296dc859))
* **security:** major security and tooling updates ([f0d794e](https://github.com/mineclover/context-action/commit/f0d794eb007d58a301c01d0b4b36f07865da2434))





# [0.3.0](https://github.com/mineclover/context-action/compare/v0.2.1...v0.3.0) (2025-08-20)


### Bug Fixes

* **ci:** resolve CI/CD dependency installation errors ([675641f](https://github.com/mineclover/context-action/commit/675641f814d63d639cfa375f5e8debe134828762))
* **ci:** standardize tsdown version across all packages ([714ab1d](https://github.com/mineclover/context-action/commit/714ab1d7f8005096f7abe2f09d8067f500168a3a))
* comprehensive RefStore DOM element handling improvements ([23844d7](https://github.com/mineclover/context-action/commit/23844d700dcbc737e3c0961c662be72220d4df05))
* **core,react:** improve code quality and security across packages ([e7baf2f](https://github.com/mineclover/context-action/commit/e7baf2fb8bf49bc5ae0b3f92efbf567fb5d2da09))
* enhance non-cloneable object detection in immutable utils ([0bd7f55](https://github.com/mineclover/context-action/commit/0bd7f5511d8a588970196b000ab33e2dbaa0ff50))
* improve code quality and resolve TypeScript/lint issues ([0afcba8](https://github.com/mineclover/context-action/commit/0afcba8a8723d45770c7bdb7cc13060d7e80dd62))
* resolve event object detection warnings for RefStore ([de9a3c2](https://github.com/mineclover/context-action/commit/de9a3c2aec135ce0bb562ee9c7d367cbe201b4e4))
* resolve RefStore circular reference issues with HTML elements ([42af794](https://github.com/mineclover/context-action/commit/42af79466439f52414e2e0500704026e61af04e1))
* update remaining useRef references to useRefHandler in tests and docs ([39f8e21](https://github.com/mineclover/context-action/commit/39f8e218023c0e8d3be91929cf362ffb5414e313))


### Features

* enhance createRefContext with declarative ref management ([58a56e2](https://github.com/mineclover/context-action/commit/58a56e25ab48fc85f59135042c1975bef1bbbc10))
* enhance type safety and fix test implementations ([ad374a7](https://github.com/mineclover/context-action/commit/ad374a71ff98b78e4ed14d524d6c4ecc8f6ab99e))
* implement RefContext mouse events with zero-render architecture ([274c510](https://github.com/mineclover/context-action/commit/274c5109ccdae1883a016cd17adeda55cb5ac537))
* remove deprecated action handler utilities ([2861d61](https://github.com/mineclover/context-action/commit/2861d61b4b5d930e9e7f5277983455dc296dc859))
* **security:** major security and tooling updates ([f0d794e](https://github.com/mineclover/context-action/commit/f0d794eb007d58a301c01d0b4b36f07865da2434))





## [0.2.3](https://github.com/mineclover/context-action/compare/v0.2.1...v0.2.3) (2025-08-19)


### Bug Fixes

* **ci:** resolve CI/CD dependency installation errors ([675641f](https://github.com/mineclover/context-action/commit/675641f814d63d639cfa375f5e8debe134828762))
* **ci:** standardize tsdown version across all packages ([714ab1d](https://github.com/mineclover/context-action/commit/714ab1d7f8005096f7abe2f09d8067f500168a3a))
* **core,react:** improve code quality and security across packages ([e7baf2f](https://github.com/mineclover/context-action/commit/e7baf2fb8bf49bc5ae0b3f92efbf567fb5d2da09))


### Features

* enhance createRefContext with declarative ref management ([58a56e2](https://github.com/mineclover/context-action/commit/58a56e25ab48fc85f59135042c1975bef1bbbc10))
* remove deprecated action handler utilities ([2861d61](https://github.com/mineclover/context-action/commit/2861d61b4b5d930e9e7f5277983455dc296dc859))
* **security:** major security and tooling updates ([f0d794e](https://github.com/mineclover/context-action/commit/f0d794eb007d58a301c01d0b4b36f07865da2434))





## [0.2.2](https://github.com/mineclover/context-action/compare/v0.2.1...v0.2.2) (2025-08-15)


### Bug Fixes

* **ci:** resolve CI/CD dependency installation errors ([675641f](https://github.com/mineclover/context-action/commit/675641f814d63d639cfa375f5e8debe134828762))
* **ci:** standardize tsdown version across all packages ([714ab1d](https://github.com/mineclover/context-action/commit/714ab1d7f8005096f7abe2f09d8067f500168a3a))
* **core,react:** improve code quality and security across packages ([e7baf2f](https://github.com/mineclover/context-action/commit/e7baf2fb8bf49bc5ae0b3f92efbf567fb5d2da09))


### Features

* remove deprecated action handler utilities ([2861d61](https://github.com/mineclover/context-action/commit/2861d61b4b5d930e9e7f5277983455dc296dc859))
* **security:** major security and tooling updates ([f0d794e](https://github.com/mineclover/context-action/commit/f0d794eb007d58a301c01d0b4b36f07865da2434))





## [0.2.1](https://github.com/mineclover/context-action/compare/v0.1.1...v0.2.1) (2025-08-15)


### Bug Fixes

* resolve Store concurrency issues with hybrid notification system ([171cb40](https://github.com/mineclover/context-action/commit/171cb40cd71e2373bc2cb09ca3772ccce40b21ec))


### Features

* **llms-generator:** major usability improvements for manual summary workflow ([3ea4f94](https://github.com/mineclover/context-action/commit/3ea4f947c620c47089799030c790d33537f3abd6))
* optimize codebase and remove legacy code ([19c042f](https://github.com/mineclover/context-action/commit/19c042f4a2915c0bd1bd9b76cb7750a061af6675))





# [0.2.0](https://github.com/mineclover/context-action/compare/v0.1.1...v0.2.0) (2025-08-15)


### Features

* **llms-generator:** major usability improvements for manual summary workflow ([3ea4f94](https://github.com/mineclover/context-action/commit/3ea4f947c620c47089799030c790d33537f3abd6))





# 0.1.0 (2025-08-14)


### Bug Fixes

* Apply JSDoc template syntax fix across all TypeScript files ([f5d649f](https://github.com/mineclover/context-action/commit/f5d649f8193f8da6f5b3814fef5ef36eeafb64a5))
* ESLint 설정 파일 ES 모듈 호환성 문제 해결 ([1a92051](https://github.com/mineclover/context-action/commit/1a92051a2a3b48fbb502c7c65ee896c600661ce5))
* Fix TypeScript project references for workspace dependencies ([85e72b7](https://github.com/mineclover/context-action/commit/85e72b701e743e39eaf7b72dad338e5fd95109d6))
* **monorepo:** resolve TS2742 errors by centralizing @types/react management ([9bae636](https://github.com/mineclover/context-action/commit/9bae636f4a14e2ca7e3c26136f8d98f57040c79c))
* **react:** add React types to tsconfig to resolve TS2742 errors ([c916f49](https://github.com/mineclover/context-action/commit/c916f494c1bc1387f7f841b68624dc34ad1ba6e2))
* **react:** remove unused StoreConfig import ([19c58ab](https://github.com/mineclover/context-action/commit/19c58ab23f3e3c7f1d7b550fbc7eecdf9a5a6d46))
* **react:** resolve Jest TypeScript errors and improve type safety ([eda7645](https://github.com/mineclover/context-action/commit/eda7645584339e00f5b7b3fcf76030cb5f02ef9e))
* resolve store initialization warning for falsy values ([9fabce8](https://github.com/mineclover/context-action/commit/9fabce846c2b927fd7a753144f50bd4f891e046a))
* resolve TypeScript type safety issues across packages ([9fe20b9](https://github.com/mineclover/context-action/commit/9fe20b9c5a249c262119fde5d35b3a094991963f))
* resolve useStoreSync type conflicts and complete example migrations ([5a2e638](https://github.com/mineclover/context-action/commit/5a2e638f037e03aab616eeba148f7136729006b0))
* Resolve Vue build error caused by TypeScript generic syntax in API documentation ([7cdc285](https://github.com/mineclover/context-action/commit/7cdc285ec9e9ba0adc68ddc83661b5fb6fe5b278))
* Store 불변성 보장을 위한 깊은 복사 구현 및 테스트 추가 ([453dd1e](https://github.com/mineclover/context-action/commit/453dd1efe261821028c91cc674241bc2e39274e5))
* test-app tsconfig.json 참조 경로 수정 ([4d1ec3e](https://github.com/mineclover/context-action/commit/4d1ec3e5641b3cabac7d827fb113ccad8b10189b))
* Update test scripts to pass with no tests ([59a08d4](https://github.com/mineclover/context-action/commit/59a08d435ad52698497b220277569a521f89f5d7))
* **workflows:** resolve YAML schema errors in GitHub workflows ([f73b52e](https://github.com/mineclover/context-action/commit/f73b52edb87024e4731af4458070a7993f2b6e02))
* 개발용 패키지 빌드 및 린팅 오류 수정 ([1ebb9e2](https://github.com/mineclover/context-action/commit/1ebb9e20ee8d8e3a791ec9fd99d2908dad200d40))
* 사용되지 않는 import 및 변수 제거 ([d40dc0e](https://github.com/mineclover/context-action/commit/d40dc0e2dfd9f277f334ec156a0218f56570ae10))


### Code Refactoring

* Remove legacy store patterns and simplify to Declarative Store Pattern only ([3ae23eb](https://github.com/mineclover/context-action/commit/3ae23eb3db0ec868dfd9cec0717f43e91b288901))


### Features

* Add comprehensive store management system with Context API and sync utilities ([1b49f3b](https://github.com/mineclover/context-action/commit/1b49f3b2291a38877668864f1cd53eccaae5fa90))
* add comprehensive type tests and improve error handling ([091e221](https://github.com/mineclover/context-action/commit/091e22159a5809a6a5152aad8b5679cb2b135de3))
* Add Context Store Pattern for Provider-level Registry isolation ([100b8a3](https://github.com/mineclover/context-action/commit/100b8a31c667bcda003d2fcc6e3e3c398892bb3a))
* Add logging system to jotai and react packages ([44d5363](https://github.com/mineclover/context-action/commit/44d536324bcc1a78da5d990279f01fd1352d1d25))
* add react-router v7.8.0 and refactor App component structure ([ced1394](https://github.com/mineclover/context-action/commit/ced139413394ddae1890ea72b18bc84a26007688))
* Complete comprehensive test suite implementation ([c8ab6fe](https://github.com/mineclover/context-action/commit/c8ab6fe9119687fa04d1ec1e22ef64023512bd25))
* Complete React pages modularization and improve error handling ([19bc5a6](https://github.com/mineclover/context-action/commit/19bc5a6fd565688e90bc7f3069b1afd91cbb9cf1))
* createActionContext를 주요 방식으로 재정립 ([85b69e5](https://github.com/mineclover/context-action/commit/85b69e5ffdbb6470b587c6f7c96a0cabaf04c68a))
* dispatch 옵션 업그레이드 - debounce, throttle, executionMode 지원 ([1b84388](https://github.com/mineclover/context-action/commit/1b8438857e97decaff02070d4a51e638d2b8a9ce))
* **docs:** enhance project philosophy and apply renaming conventions ([ef69207](https://github.com/mineclover/context-action/commit/ef69207ef1e0bd5dcc84ec76c3069914c9bf61b1))
* enhance action registration with auto-abort functionality ([d80aa5b](https://github.com/mineclover/context-action/commit/d80aa5bb6cc9a6eea293288789aeb91005261796))
* Enhance core package documentation and type definitions ([17a84e0](https://github.com/mineclover/context-action/commit/17a84e0e1465d0ebcddfc92ae3c6b767f8f20401))
* Enhance documentation and improve ActionRegister functionality ([bde754b](https://github.com/mineclover/context-action/commit/bde754b82f079cc378b9e414dc7d66ec062ae71d))
* extend StoreConfig to match PATTERN_GUIDE.md requirements ([a964c38](https://github.com/mineclover/context-action/commit/a964c3872b495e1fbddaa8a1b9602e41690d92b3))
* **glossary:** Extract architecture patterns from example code ([513faac](https://github.com/mineclover/context-action/commit/513faacd543208e26abbfbe1ea997206f28d7699))
* **glossary:** 스캐너 개선으로 ActionRegister 클래스 인식 및 구현 커버리지 35%로 향상 ([55d0a39](https://github.com/mineclover/context-action/commit/55d0a397ff33c90f6da3c4d28b09a76f60a14f55))
* HMR 시스템 완성 및 Core Store 비교 최적화 ([ccc5029](https://github.com/mineclover/context-action/commit/ccc50299f49d7d6fa115ef389a7eabdb52e4b0c5))
* implement complete pipeline control system with execution modes and action guards ([7f27112](https://github.com/mineclover/context-action/commit/7f2711279c6dd28e8a468b4313baeb0d61180e90))
* Implement Declarative Store Pattern with Action Registry-style design ([36702e3](https://github.com/mineclover/context-action/commit/36702e37fd5ce7ad0263931a26e24712d8dd2a35))
* Implement enhanced Store value comparison system for render optimization ([2c374d4](https://github.com/mineclover/context-action/commit/2c374d4488b42f4687eb268cacc4b9fb3967cba6))
* implement generic pattern support for createStoreContext and createActionContext ([c0da9e1](https://github.com/mineclover/context-action/commit/c0da9e1c13effb9750e52c9fd9f3722e808d3a9b))
* Implement HOC patterns for Context Store Pattern ([bb8940e](https://github.com/mineclover/context-action/commit/bb8940e77772377cffe221af83908b594fdbf41e))
* implement unified createStoreContext with simplified API ([ff88e6f](https://github.com/mineclover/context-action/commit/ff88e6f5db86e13b4afd3f16e451d273d7c693cb))
* improve hook naming clarity with backwards compatibility ([485297e](https://github.com/mineclover/context-action/commit/485297ef164c69a4fc5b3607c493c0a949616ab9))
* Improve useAction hook with better error handling ([5f2b3cb](https://github.com/mineclover/context-action/commit/5f2b3cbc5a8432218f531cd3408c671acd51468f))
* integrate comprehensive logging system across all packages ([515ba5d](https://github.com/mineclover/context-action/commit/515ba5daf64e4ef1a1acb52c9d7d778884287419))
* Major architecture refactoring and documentation update ([aadb45d](https://github.com/mineclover/context-action/commit/aadb45d0bc86502243b2390a1c6da7d4736e0208))
* React 18.3.1 버전 통일로 타입 호환성 개선 ([eba7a49](https://github.com/mineclover/context-action/commit/eba7a490fc53fa694d497e3d5202f56d04db3f39))
* React 패키지 Bundle Re-export Pattern 모듈화 완료 ([2075020](https://github.com/mineclover/context-action/commit/2075020960c1a9501a2c8393bab97f50c9bc1ad2))
* **react:** comprehensive hook testing and examples system ([d33ed62](https://github.com/mineclover/context-action/commit/d33ed62db7a95c247a85f7cae575b716dd4e38aa))
* **react:** Implement MVVM architecture patterns with store integration ([9f3afce](https://github.com/mineclover/context-action/commit/9f3afce1fc5f4173d0387dbf5444f3b78fdd07bc))
* **react:** Store 시스템 개선 및 withStore HOC 추가 ([828f764](https://github.com/mineclover/context-action/commit/828f764ec0b67eb5217d39c4bb9f6ef9b268ae3e))
* remove ActionProvider and standardize on createActionContext with automatic abort ([75f0908](https://github.com/mineclover/context-action/commit/75f090854020b7866aeef240b914138f3a490cad))
* separate logger into independent package ([6cb727c](https://github.com/mineclover/context-action/commit/6cb727cfe03230d03e9f928fb92d86c2d3ae7360))
* Update glossary implementation dashboard and add translation checker tool ([e031ae3](https://github.com/mineclover/context-action/commit/e031ae3ed863cb41cee5d8712a20db5b551912c4))
* Update logging configuration and enhance JSON settings ([8b15e76](https://github.com/mineclover/context-action/commit/8b15e76ff48c03aca2c876bf5f13eed36e26766b))
* Upgrade Action Context Pattern to Declarative Store spec and remove version tags ([9be2589](https://github.com/mineclover/context-action/commit/9be25895724fb57f97de6ea0c98db3e8b586bda6))
* 번들 사이즈 대폭 최적화 및 코드 품질 개선 ([98a522e](https://github.com/mineclover/context-action/commit/98a522ed0ee1c92014c11f9b6377e60c399cd227))
* 액션 실행 결과 반환 및 수집 시스템 구현 ([071131e](https://github.com/mineclover/context-action/commit/071131e286c392feef97d57ed3c08497c9add395))
* 주요 example 파일들을 Context Store 패턴으로 완전 전환 ([5d7de93](https://github.com/mineclover/context-action/commit/5d7de93cc252492ddae88c406e8a209779eec298))


### Performance Improvements

* Remove unnecessary useCallback wrappers around dispatch calls ([5820762](https://github.com/mineclover/context-action/commit/5820762ad38c03eafca77de0eb1e51ccff12194c))


### BREAKING CHANGES

* None - fully backwards compatible with deprecation warnings

The old naming (useActionRegister/useRegistry) was confusing as both returned
different things but had similar names. New naming clearly indicates:
- useActionHandler returns a function to add handlers
- useStores returns access to the store registry
* ActionProvider removed in favor of createActionContext factory pattern

- Remove ActionProvider.tsx completely
- Standardize on createActionContext factory for all action contexts
- Add automatic abort functionality when React components unmount
- Add AbortSignal support to core DispatchOptions
- Update ActionRegister to handle abort signals in dispatch methods
- Add abort checks in sequential execution mode
- Update exports to reflect unified ActionContext system
- Fix TypeScript type issues and export mappings
- Update examples and tests to use factory pattern

Migration Guide:
// Before (ActionProvider)
<ActionProvider>
  const dispatch = useActionDispatch<AppActions>();
</ActionProvider>

// After (createActionContext factory)
const { Provider, useActionDispatch } = createActionContext<AppActions>();
<Provider>
  const dispatch = useActionDispatch(); // No manual type annotation needed\!
</Provider>

Benefits:
- Type inference eliminates manual <T> annotations
- Automatic action abortion on component unmount prevents memory leaks
- abortAll() and resetAbortScope() for manual abort control
- Unified architecture with single pattern
- Built-in abort support in all dispatch methods

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
* Remove deprecated store patterns and complex ID generation logic

- Remove legacy Context Store Pattern files (context-store-pattern.tsx)
- Remove complex isolation hooks and utilities (isolation-hooks.ts, isolation-utils.ts)
- Remove unnecessary unique ID generation logic with useId
- Simplify Provider creation to use simple registryId parameter
- Clean up all exports and references to removed legacy patterns
- Consolidate to single Declarative Store Pattern approach

Benefits:
- Reduced bundle size: react package 107KB → 83KB (22% reduction)
- Simplified API surface with single pattern approach
- Removed complex useId-based unique identifier generation
- Cleaner and more maintainable codebase
- Action Registry-style consistency maintained

Migration:
- All store patterns now use createDeclarativeStores()
- Legacy useIsolatedStore and context patterns removed
- Simple registryId prop replaces complex ID generation

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>





## 0.0.5 (2025-08-13)


### Bug Fixes

* Apply JSDoc template syntax fix across all TypeScript files ([f5d649f](https://github.com/mineclover/context-action/commit/f5d649f8193f8da6f5b3814fef5ef36eeafb64a5))
* ESLint 설정 파일 ES 모듈 호환성 문제 해결 ([1a92051](https://github.com/mineclover/context-action/commit/1a92051a2a3b48fbb502c7c65ee896c600661ce5))
* Fix TypeScript project references for workspace dependencies ([85e72b7](https://github.com/mineclover/context-action/commit/85e72b701e743e39eaf7b72dad338e5fd95109d6))
* resolve store initialization warning for falsy values ([9fabce8](https://github.com/mineclover/context-action/commit/9fabce846c2b927fd7a753144f50bd4f891e046a))
* resolve TypeScript type safety issues across packages ([9fe20b9](https://github.com/mineclover/context-action/commit/9fe20b9c5a249c262119fde5d35b3a094991963f))
* resolve useStoreSync type conflicts and complete example migrations ([5a2e638](https://github.com/mineclover/context-action/commit/5a2e638f037e03aab616eeba148f7136729006b0))
* Resolve Vue build error caused by TypeScript generic syntax in API documentation ([7cdc285](https://github.com/mineclover/context-action/commit/7cdc285ec9e9ba0adc68ddc83661b5fb6fe5b278))
* Store 불변성 보장을 위한 깊은 복사 구현 및 테스트 추가 ([453dd1e](https://github.com/mineclover/context-action/commit/453dd1efe261821028c91cc674241bc2e39274e5))
* test-app tsconfig.json 참조 경로 수정 ([4d1ec3e](https://github.com/mineclover/context-action/commit/4d1ec3e5641b3cabac7d827fb113ccad8b10189b))
* Update test scripts to pass with no tests ([59a08d4](https://github.com/mineclover/context-action/commit/59a08d435ad52698497b220277569a521f89f5d7))
* 개발용 패키지 빌드 및 린팅 오류 수정 ([1ebb9e2](https://github.com/mineclover/context-action/commit/1ebb9e20ee8d8e3a791ec9fd99d2908dad200d40))
* 사용되지 않는 import 및 변수 제거 ([d40dc0e](https://github.com/mineclover/context-action/commit/d40dc0e2dfd9f277f334ec156a0218f56570ae10))


### Code Refactoring

* Remove legacy store patterns and simplify to Declarative Store Pattern only ([3ae23eb](https://github.com/mineclover/context-action/commit/3ae23eb3db0ec868dfd9cec0717f43e91b288901))


### Features

* Add comprehensive store management system with Context API and sync utilities ([1b49f3b](https://github.com/mineclover/context-action/commit/1b49f3b2291a38877668864f1cd53eccaae5fa90))
* Add Context Store Pattern for Provider-level Registry isolation ([100b8a3](https://github.com/mineclover/context-action/commit/100b8a31c667bcda003d2fcc6e3e3c398892bb3a))
* Add logging system to jotai and react packages ([44d5363](https://github.com/mineclover/context-action/commit/44d536324bcc1a78da5d990279f01fd1352d1d25))
* add react-router v7.8.0 and refactor App component structure ([ced1394](https://github.com/mineclover/context-action/commit/ced139413394ddae1890ea72b18bc84a26007688))
* Complete comprehensive test suite implementation ([c8ab6fe](https://github.com/mineclover/context-action/commit/c8ab6fe9119687fa04d1ec1e22ef64023512bd25))
* Complete React pages modularization and improve error handling ([19bc5a6](https://github.com/mineclover/context-action/commit/19bc5a6fd565688e90bc7f3069b1afd91cbb9cf1))
* createActionContext를 주요 방식으로 재정립 ([85b69e5](https://github.com/mineclover/context-action/commit/85b69e5ffdbb6470b587c6f7c96a0cabaf04c68a))
* dispatch 옵션 업그레이드 - debounce, throttle, executionMode 지원 ([1b84388](https://github.com/mineclover/context-action/commit/1b8438857e97decaff02070d4a51e638d2b8a9ce))
* enhance action registration with auto-abort functionality ([d80aa5b](https://github.com/mineclover/context-action/commit/d80aa5bb6cc9a6eea293288789aeb91005261796))
* Enhance core package documentation and type definitions ([17a84e0](https://github.com/mineclover/context-action/commit/17a84e0e1465d0ebcddfc92ae3c6b767f8f20401))
* Enhance documentation and improve ActionRegister functionality ([bde754b](https://github.com/mineclover/context-action/commit/bde754b82f079cc378b9e414dc7d66ec062ae71d))
* extend StoreConfig to match PATTERN_GUIDE.md requirements ([a964c38](https://github.com/mineclover/context-action/commit/a964c3872b495e1fbddaa8a1b9602e41690d92b3))
* **glossary:** Extract architecture patterns from example code ([513faac](https://github.com/mineclover/context-action/commit/513faacd543208e26abbfbe1ea997206f28d7699))
* **glossary:** 스캐너 개선으로 ActionRegister 클래스 인식 및 구현 커버리지 35%로 향상 ([55d0a39](https://github.com/mineclover/context-action/commit/55d0a397ff33c90f6da3c4d28b09a76f60a14f55))
* HMR 시스템 완성 및 Core Store 비교 최적화 ([ccc5029](https://github.com/mineclover/context-action/commit/ccc50299f49d7d6fa115ef389a7eabdb52e4b0c5))
* implement complete pipeline control system with execution modes and action guards ([7f27112](https://github.com/mineclover/context-action/commit/7f2711279c6dd28e8a468b4313baeb0d61180e90))
* Implement Declarative Store Pattern with Action Registry-style design ([36702e3](https://github.com/mineclover/context-action/commit/36702e37fd5ce7ad0263931a26e24712d8dd2a35))
* Implement enhanced Store value comparison system for render optimization ([2c374d4](https://github.com/mineclover/context-action/commit/2c374d4488b42f4687eb268cacc4b9fb3967cba6))
* Implement HOC patterns for Context Store Pattern ([bb8940e](https://github.com/mineclover/context-action/commit/bb8940e77772377cffe221af83908b594fdbf41e))
* implement unified createStoreContext with simplified API ([ff88e6f](https://github.com/mineclover/context-action/commit/ff88e6f5db86e13b4afd3f16e451d273d7c693cb))
* improve hook naming clarity with backwards compatibility ([485297e](https://github.com/mineclover/context-action/commit/485297ef164c69a4fc5b3607c493c0a949616ab9))
* Improve useAction hook with better error handling ([5f2b3cb](https://github.com/mineclover/context-action/commit/5f2b3cbc5a8432218f531cd3408c671acd51468f))
* integrate comprehensive logging system across all packages ([515ba5d](https://github.com/mineclover/context-action/commit/515ba5daf64e4ef1a1acb52c9d7d778884287419))
* Major architecture refactoring and documentation update ([aadb45d](https://github.com/mineclover/context-action/commit/aadb45d0bc86502243b2390a1c6da7d4736e0208))
* React 18.3.1 버전 통일로 타입 호환성 개선 ([eba7a49](https://github.com/mineclover/context-action/commit/eba7a490fc53fa694d497e3d5202f56d04db3f39))
* React 패키지 Bundle Re-export Pattern 모듈화 완료 ([2075020](https://github.com/mineclover/context-action/commit/2075020960c1a9501a2c8393bab97f50c9bc1ad2))
* **react:** Implement MVVM architecture patterns with store integration ([9f3afce](https://github.com/mineclover/context-action/commit/9f3afce1fc5f4173d0387dbf5444f3b78fdd07bc))
* **react:** Store 시스템 개선 및 withStore HOC 추가 ([828f764](https://github.com/mineclover/context-action/commit/828f764ec0b67eb5217d39c4bb9f6ef9b268ae3e))
* remove ActionProvider and standardize on createActionContext with automatic abort ([75f0908](https://github.com/mineclover/context-action/commit/75f090854020b7866aeef240b914138f3a490cad))
* separate logger into independent package ([6cb727c](https://github.com/mineclover/context-action/commit/6cb727cfe03230d03e9f928fb92d86c2d3ae7360))
* Update glossary implementation dashboard and add translation checker tool ([e031ae3](https://github.com/mineclover/context-action/commit/e031ae3ed863cb41cee5d8712a20db5b551912c4))
* Update logging configuration and enhance JSON settings ([8b15e76](https://github.com/mineclover/context-action/commit/8b15e76ff48c03aca2c876bf5f13eed36e26766b))
* Upgrade Action Context Pattern to Declarative Store spec and remove version tags ([9be2589](https://github.com/mineclover/context-action/commit/9be25895724fb57f97de6ea0c98db3e8b586bda6))
* 번들 사이즈 대폭 최적화 및 코드 품질 개선 ([98a522e](https://github.com/mineclover/context-action/commit/98a522ed0ee1c92014c11f9b6377e60c399cd227))
* 액션 실행 결과 반환 및 수집 시스템 구현 ([071131e](https://github.com/mineclover/context-action/commit/071131e286c392feef97d57ed3c08497c9add395))
* 주요 example 파일들을 Context Store 패턴으로 완전 전환 ([5d7de93](https://github.com/mineclover/context-action/commit/5d7de93cc252492ddae88c406e8a209779eec298))


### Performance Improvements

* Remove unnecessary useCallback wrappers around dispatch calls ([5820762](https://github.com/mineclover/context-action/commit/5820762ad38c03eafca77de0eb1e51ccff12194c))


### BREAKING CHANGES

* None - fully backwards compatible with deprecation warnings

The old naming (useActionRegister/useRegistry) was confusing as both returned
different things but had similar names. New naming clearly indicates:
- useActionHandler returns a function to add handlers
- useStores returns access to the store registry
* ActionProvider removed in favor of createActionContext factory pattern

- Remove ActionProvider.tsx completely
- Standardize on createActionContext factory for all action contexts
- Add automatic abort functionality when React components unmount
- Add AbortSignal support to core DispatchOptions
- Update ActionRegister to handle abort signals in dispatch methods
- Add abort checks in sequential execution mode
- Update exports to reflect unified ActionContext system
- Fix TypeScript type issues and export mappings
- Update examples and tests to use factory pattern

Migration Guide:
// Before (ActionProvider)
<ActionProvider>
  const dispatch = useActionDispatch<AppActions>();
</ActionProvider>

// After (createActionContext factory)
const { Provider, useActionDispatch } = createActionContext<AppActions>();
<Provider>
  const dispatch = useActionDispatch(); // No manual type annotation needed\!
</Provider>

Benefits:
- Type inference eliminates manual <T> annotations
- Automatic action abortion on component unmount prevents memory leaks
- abortAll() and resetAbortScope() for manual abort control
- Unified architecture with single pattern
- Built-in abort support in all dispatch methods

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
* Remove deprecated store patterns and complex ID generation logic

- Remove legacy Context Store Pattern files (context-store-pattern.tsx)
- Remove complex isolation hooks and utilities (isolation-hooks.ts, isolation-utils.ts)
- Remove unnecessary unique ID generation logic with useId
- Simplify Provider creation to use simple registryId parameter
- Clean up all exports and references to removed legacy patterns
- Consolidate to single Declarative Store Pattern approach

Benefits:
- Reduced bundle size: react package 107KB → 83KB (22% reduction)
- Simplified API surface with single pattern approach
- Removed complex useId-based unique identifier generation
- Cleaner and more maintainable codebase
- Action Registry-style consistency maintained

Migration:
- All store patterns now use createDeclarativeStores()
- Legacy useIsolatedStore and context patterns removed
- Simple registryId prop replaces complex ID generation

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>





## 0.0.4 (2025-08-03)


### Bug Fixes

* ESLint 설정 파일 ES 모듈 호환성 문제 해결 ([1a92051](https://github.com/mineclover/context-action/commit/1a92051a2a3b48fbb502c7c65ee896c600661ce5))
* Fix TypeScript project references for workspace dependencies ([85e72b7](https://github.com/mineclover/context-action/commit/85e72b701e743e39eaf7b72dad338e5fd95109d6))
* resolve TypeScript type safety issues across packages ([9fe20b9](https://github.com/mineclover/context-action/commit/9fe20b9c5a249c262119fde5d35b3a094991963f))
* resolve useStoreSync type conflicts and complete example migrations ([5a2e638](https://github.com/mineclover/context-action/commit/5a2e638f037e03aab616eeba148f7136729006b0))
* test-app tsconfig.json 참조 경로 수정 ([4d1ec3e](https://github.com/mineclover/context-action/commit/4d1ec3e5641b3cabac7d827fb113ccad8b10189b))
* Update test scripts to pass with no tests ([59a08d4](https://github.com/mineclover/context-action/commit/59a08d435ad52698497b220277569a521f89f5d7))


### Features

* 주요 example 파일들을 Context Store 패턴으로 완전 전환 ([5d7de93](https://github.com/mineclover/context-action/commit/5d7de93cc252492ddae88c406e8a209779eec298))
* Add comprehensive store management system with Context API and sync utilities ([1b49f3b](https://github.com/mineclover/context-action/commit/1b49f3b2291a38877668864f1cd53eccaae5fa90))
* Add Context Store Pattern for Provider-level Registry isolation ([100b8a3](https://github.com/mineclover/context-action/commit/100b8a31c667bcda003d2fcc6e3e3c398892bb3a))
* Add logging system to jotai and react packages ([44d5363](https://github.com/mineclover/context-action/commit/44d536324bcc1a78da5d990279f01fd1352d1d25))
* Complete comprehensive test suite implementation ([c8ab6fe](https://github.com/mineclover/context-action/commit/c8ab6fe9119687fa04d1ec1e22ef64023512bd25))
* Complete React pages modularization and improve error handling ([19bc5a6](https://github.com/mineclover/context-action/commit/19bc5a6fd565688e90bc7f3069b1afd91cbb9cf1))
* Enhance core package documentation and type definitions ([17a84e0](https://github.com/mineclover/context-action/commit/17a84e0e1465d0ebcddfc92ae3c6b767f8f20401))
* **glossary:** 스캐너 개선으로 ActionRegister 클래스 인식 및 구현 커버리지 35%로 향상 ([55d0a39](https://github.com/mineclover/context-action/commit/55d0a397ff33c90f6da3c4d28b09a76f60a14f55))
* **glossary:** Extract architecture patterns from example code ([513faac](https://github.com/mineclover/context-action/commit/513faacd543208e26abbfbe1ea997206f28d7699))
* implement complete pipeline control system with execution modes and action guards ([7f27112](https://github.com/mineclover/context-action/commit/7f2711279c6dd28e8a468b4313baeb0d61180e90))
* Implement enhanced Store value comparison system for render optimization ([2c374d4](https://github.com/mineclover/context-action/commit/2c374d4488b42f4687eb268cacc4b9fb3967cba6))
* Implement HOC patterns for Context Store Pattern ([bb8940e](https://github.com/mineclover/context-action/commit/bb8940e77772377cffe221af83908b594fdbf41e))
* Improve useAction hook with better error handling ([5f2b3cb](https://github.com/mineclover/context-action/commit/5f2b3cbc5a8432218f531cd3408c671acd51468f))
* integrate comprehensive logging system across all packages ([515ba5d](https://github.com/mineclover/context-action/commit/515ba5daf64e4ef1a1acb52c9d7d778884287419))
* Major architecture refactoring and documentation update ([aadb45d](https://github.com/mineclover/context-action/commit/aadb45d0bc86502243b2390a1c6da7d4736e0208))
* **react:** Implement MVVM architecture patterns with store integration ([9f3afce](https://github.com/mineclover/context-action/commit/9f3afce1fc5f4173d0387dbf5444f3b78fdd07bc))
* **react:** Store 시스템 개선 및 withStore HOC 추가 ([828f764](https://github.com/mineclover/context-action/commit/828f764ec0b67eb5217d39c4bb9f6ef9b268ae3e))
* separate logger into independent package ([6cb727c](https://github.com/mineclover/context-action/commit/6cb727cfe03230d03e9f928fb92d86c2d3ae7360))
* Update glossary implementation dashboard and add translation checker tool ([e031ae3](https://github.com/mineclover/context-action/commit/e031ae3ed863cb41cee5d8712a20db5b551912c4))
* Update logging configuration and enhance JSON settings ([8b15e76](https://github.com/mineclover/context-action/commit/8b15e76ff48c03aca2c876bf5f13eed36e26766b))


### Performance Improvements

* Remove unnecessary useCallback wrappers around dispatch calls ([5820762](https://github.com/mineclover/context-action/commit/5820762ad38c03eafca77de0eb1e51ccff12194c))
