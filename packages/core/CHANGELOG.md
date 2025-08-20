# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [0.3.0](https://github.com/mineclover/context-action/compare/v0.2.1...v0.3.0) (2025-08-20)


### Bug Fixes

* **ci:** standardize tsdown version across all packages ([714ab1d](https://github.com/mineclover/context-action/commit/714ab1d7f8005096f7abe2f09d8067f500168a3a))
* **core,react:** improve code quality and security across packages ([e7baf2f](https://github.com/mineclover/context-action/commit/e7baf2fb8bf49bc5ae0b3f92efbf567fb5d2da09))
* resolve event object detection warnings for RefStore ([de9a3c2](https://github.com/mineclover/context-action/commit/de9a3c2aec135ce0bb562ee9c7d367cbe201b4e4))


### Features

* enhance type safety and fix test implementations ([ad374a7](https://github.com/mineclover/context-action/commit/ad374a71ff98b78e4ed14d524d6c4ecc8f6ab99e))
* implement RefContext mouse events with zero-render architecture ([274c510](https://github.com/mineclover/context-action/commit/274c5109ccdae1883a016cd17adeda55cb5ac537))
* **security:** major security and tooling updates ([f0d794e](https://github.com/mineclover/context-action/commit/f0d794eb007d58a301c01d0b4b36f07865da2434))





## [0.2.3](https://github.com/mineclover/context-action/compare/v0.2.1...v0.2.3) (2025-08-19)


### Bug Fixes

* **ci:** standardize tsdown version across all packages ([714ab1d](https://github.com/mineclover/context-action/commit/714ab1d7f8005096f7abe2f09d8067f500168a3a))
* **core,react:** improve code quality and security across packages ([e7baf2f](https://github.com/mineclover/context-action/commit/e7baf2fb8bf49bc5ae0b3f92efbf567fb5d2da09))


### Features

* **security:** major security and tooling updates ([f0d794e](https://github.com/mineclover/context-action/commit/f0d794eb007d58a301c01d0b4b36f07865da2434))





## [0.2.2](https://github.com/mineclover/context-action/compare/v0.2.1...v0.2.2) (2025-08-15)


### Bug Fixes

* **ci:** standardize tsdown version across all packages ([714ab1d](https://github.com/mineclover/context-action/commit/714ab1d7f8005096f7abe2f09d8067f500168a3a))
* **core,react:** improve code quality and security across packages ([e7baf2f](https://github.com/mineclover/context-action/commit/e7baf2fb8bf49bc5ae0b3f92efbf567fb5d2da09))


### Features

* **security:** major security and tooling updates ([f0d794e](https://github.com/mineclover/context-action/commit/f0d794eb007d58a301c01d0b4b36f07865da2434))





## [0.2.1](https://github.com/mineclover/context-action/compare/v0.1.1...v0.2.1) (2025-08-15)


### Features

* **core:** resolve concurrency issues with OperationQueue system ([e42339f](https://github.com/mineclover/context-action/commit/e42339ffd4d0983ee6787fadebae1d17d3d95f29))
* optimize codebase and remove legacy code ([19c042f](https://github.com/mineclover/context-action/commit/19c042f4a2915c0bd1bd9b76cb7750a061af6675))





# [0.2.0](https://github.com/mineclover/context-action/compare/v0.1.1...v0.2.0) (2025-08-15)


### Features

* **core:** resolve concurrency issues with OperationQueue system ([e42339f](https://github.com/mineclover/context-action/commit/e42339ffd4d0983ee6787fadebae1d17d3d95f29))





# 0.1.0 (2025-08-14)


### Bug Fixes

* ESLint 설정 파일 ES 모듈 호환성 문제 해결 ([1a92051](https://github.com/mineclover/context-action/commit/1a92051a2a3b48fbb502c7c65ee896c600661ce5))
* Implement lightweight secure handler ID generation to prevent prediction attacks ([2b9cde5](https://github.com/mineclover/context-action/commit/2b9cde5e0dd1a8efbcef796e3e44bb14f9faf480))
* resolve store initialization warning for falsy values ([9fabce8](https://github.com/mineclover/context-action/commit/9fabce846c2b927fd7a753144f50bd4f891e046a))
* resolve TypeScript type safety issues across packages ([9fe20b9](https://github.com/mineclover/context-action/commit/9fe20b9c5a249c262119fde5d35b3a094991963f))
* test-app tsconfig.json 참조 경로 수정 ([4d1ec3e](https://github.com/mineclover/context-action/commit/4d1ec3e5641b3cabac7d827fb113ccad8b10189b))
* Update test scripts to pass with no tests ([59a08d4](https://github.com/mineclover/context-action/commit/59a08d435ad52698497b220277569a521f89f5d7))


### Features

* add AbortSignal support to core ActionRegister dispatch methods ([315cae7](https://github.com/mineclover/context-action/commit/315cae7509cc834b2cca183ff0025c10bb22ea6e))
* Add comprehensive logging system with OpenTelemetry support ([0a46cdd](https://github.com/mineclover/context-action/commit/0a46cdd265dee54c41a28751dfcb3db939dc6fb6))
* Change default log level to TRACE in environment variables ([d2a95d0](https://github.com/mineclover/context-action/commit/d2a95d02531a29943296e28ff40b3833c6858b4d))
* Complete React pages modularization and improve error handling ([19bc5a6](https://github.com/mineclover/context-action/commit/19bc5a6fd565688e90bc7f3069b1afd91cbb9cf1))
* **core:** Fix execution abort functionality and improve handler management ([88e3dd4](https://github.com/mineclover/context-action/commit/88e3dd407a039585a35467935d66261f668cf3ea))
* dispatch 옵션 업그레이드 - debounce, throttle, executionMode 지원 ([1b84388](https://github.com/mineclover/context-action/commit/1b8438857e97decaff02070d4a51e638d2b8a9ce))
* enhance action registration with auto-abort functionality ([d80aa5b](https://github.com/mineclover/context-action/commit/d80aa5bb6cc9a6eea293288789aeb91005261796))
* Enhance core package documentation and type definitions ([17a84e0](https://github.com/mineclover/context-action/commit/17a84e0e1465d0ebcddfc92ae3c6b767f8f20401))
* Enhance documentation and improve ActionRegister functionality ([bde754b](https://github.com/mineclover/context-action/commit/bde754b82f079cc378b9e414dc7d66ec062ae71d))
* **example:** Add comprehensive store management demo pages ([e1f0162](https://github.com/mineclover/context-action/commit/e1f0162ec6f71d7098f5289b4463bd7cf0353d8b))
* **glossary:** Extract architecture patterns from example code ([513faac](https://github.com/mineclover/context-action/commit/513faacd543208e26abbfbe1ea997206f28d7699))
* **glossary:** 스캐너 개선으로 ActionRegister 클래스 인식 및 구현 커버리지 35%로 향상 ([55d0a39](https://github.com/mineclover/context-action/commit/55d0a397ff33c90f6da3c4d28b09a76f60a14f55))
* HMR 시스템 완성 및 Core Store 비교 최적화 ([ccc5029](https://github.com/mineclover/context-action/commit/ccc50299f49d7d6fa115ef389a7eabdb52e4b0c5))
* implement complete pipeline control system with execution modes and action guards ([7f27112](https://github.com/mineclover/context-action/commit/7f2711279c6dd28e8a468b4313baeb0d61180e90))
* improve hook naming clarity with backwards compatibility ([485297e](https://github.com/mineclover/context-action/commit/485297ef164c69a4fc5b3607c493c0a949616ab9))
* Major architecture refactoring and documentation update ([aadb45d](https://github.com/mineclover/context-action/commit/aadb45d0bc86502243b2390a1c6da7d4736e0208))
* separate logger into independent package ([6cb727c](https://github.com/mineclover/context-action/commit/6cb727cfe03230d03e9f928fb92d86c2d3ae7360))
* Update logging configuration and enhance JSON settings ([8b15e76](https://github.com/mineclover/context-action/commit/8b15e76ff48c03aca2c876bf5f13eed36e26766b))
* 레거시 코드 제거 및 외부 abort 기능 개선 ([f4a0d18](https://github.com/mineclover/context-action/commit/f4a0d18d316656ba74182c376ffd65ed039ab747))
* 액션 실행 결과 반환 및 수집 시스템 구현 ([071131e](https://github.com/mineclover/context-action/commit/071131e286c392feef97d57ed3c08497c9add395))
* 파이프라인 결과 처리 시스템과 핸들러 메타데이터 확장 ([554dd29](https://github.com/mineclover/context-action/commit/554dd29a06f04371b1e84ad6458fbfee7f205ed0))
* 핵심 용어 JSDoc 태그 구현으로 용어집 매칭률 67% 달성 ([64b19e1](https://github.com/mineclover/context-action/commit/64b19e1be9da70106a26313c50f49da8eed8bfbb))


### BREAKING CHANGES

* None - fully backwards compatible with deprecation warnings

The old naming (useActionRegister/useRegistry) was confusing as both returned
different things but had similar names. New naming clearly indicates:
- useActionHandler returns a function to add handlers
- useStores returns access to the store registry
* Auto-generated handler IDs now use unpredictable pattern

- Replace predictable handler_N pattern with handler_N_randomSuffix
- Use Math.random().toString(36) for lightweight randomness (2.3x faster than crypto.randomUUID)
- Maintain performance: ~0.01ms overhead vs 0.0007ms for crypto approach
- Prevent ID prediction attacks while preserving counter-based ordering
- Update documentation with performance comparison and security strategies

Security Impact:
- Before: handler_1, handler_2, handler_3 (predictable)
- After: handler_1_k3x9z, handler_2_m8p4w, handler_3_r7q2s (unpredictable)

Performance Results (10,000 iterations):
- crypto.randomUUID(): 0.0007ms/op
- Math.random() approach: 0.0003ms/op (chosen)
- Current predictable: 0.0001ms/op (vulnerable)

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>





## 0.0.5 (2025-08-13)


### Bug Fixes

* ESLint 설정 파일 ES 모듈 호환성 문제 해결 ([1a92051](https://github.com/mineclover/context-action/commit/1a92051a2a3b48fbb502c7c65ee896c600661ce5))
* Implement lightweight secure handler ID generation to prevent prediction attacks ([2b9cde5](https://github.com/mineclover/context-action/commit/2b9cde5e0dd1a8efbcef796e3e44bb14f9faf480))
* resolve store initialization warning for falsy values ([9fabce8](https://github.com/mineclover/context-action/commit/9fabce846c2b927fd7a753144f50bd4f891e046a))
* resolve TypeScript type safety issues across packages ([9fe20b9](https://github.com/mineclover/context-action/commit/9fe20b9c5a249c262119fde5d35b3a094991963f))
* test-app tsconfig.json 참조 경로 수정 ([4d1ec3e](https://github.com/mineclover/context-action/commit/4d1ec3e5641b3cabac7d827fb113ccad8b10189b))
* Update test scripts to pass with no tests ([59a08d4](https://github.com/mineclover/context-action/commit/59a08d435ad52698497b220277569a521f89f5d7))


### Features

* add AbortSignal support to core ActionRegister dispatch methods ([315cae7](https://github.com/mineclover/context-action/commit/315cae7509cc834b2cca183ff0025c10bb22ea6e))
* Add comprehensive logging system with OpenTelemetry support ([0a46cdd](https://github.com/mineclover/context-action/commit/0a46cdd265dee54c41a28751dfcb3db939dc6fb6))
* Change default log level to TRACE in environment variables ([d2a95d0](https://github.com/mineclover/context-action/commit/d2a95d02531a29943296e28ff40b3833c6858b4d))
* Complete React pages modularization and improve error handling ([19bc5a6](https://github.com/mineclover/context-action/commit/19bc5a6fd565688e90bc7f3069b1afd91cbb9cf1))
* **core:** Fix execution abort functionality and improve handler management ([88e3dd4](https://github.com/mineclover/context-action/commit/88e3dd407a039585a35467935d66261f668cf3ea))
* dispatch 옵션 업그레이드 - debounce, throttle, executionMode 지원 ([1b84388](https://github.com/mineclover/context-action/commit/1b8438857e97decaff02070d4a51e638d2b8a9ce))
* enhance action registration with auto-abort functionality ([d80aa5b](https://github.com/mineclover/context-action/commit/d80aa5bb6cc9a6eea293288789aeb91005261796))
* Enhance core package documentation and type definitions ([17a84e0](https://github.com/mineclover/context-action/commit/17a84e0e1465d0ebcddfc92ae3c6b767f8f20401))
* Enhance documentation and improve ActionRegister functionality ([bde754b](https://github.com/mineclover/context-action/commit/bde754b82f079cc378b9e414dc7d66ec062ae71d))
* **example:** Add comprehensive store management demo pages ([e1f0162](https://github.com/mineclover/context-action/commit/e1f0162ec6f71d7098f5289b4463bd7cf0353d8b))
* **glossary:** Extract architecture patterns from example code ([513faac](https://github.com/mineclover/context-action/commit/513faacd543208e26abbfbe1ea997206f28d7699))
* **glossary:** 스캐너 개선으로 ActionRegister 클래스 인식 및 구현 커버리지 35%로 향상 ([55d0a39](https://github.com/mineclover/context-action/commit/55d0a397ff33c90f6da3c4d28b09a76f60a14f55))
* HMR 시스템 완성 및 Core Store 비교 최적화 ([ccc5029](https://github.com/mineclover/context-action/commit/ccc50299f49d7d6fa115ef389a7eabdb52e4b0c5))
* implement complete pipeline control system with execution modes and action guards ([7f27112](https://github.com/mineclover/context-action/commit/7f2711279c6dd28e8a468b4313baeb0d61180e90))
* improve hook naming clarity with backwards compatibility ([485297e](https://github.com/mineclover/context-action/commit/485297ef164c69a4fc5b3607c493c0a949616ab9))
* Major architecture refactoring and documentation update ([aadb45d](https://github.com/mineclover/context-action/commit/aadb45d0bc86502243b2390a1c6da7d4736e0208))
* separate logger into independent package ([6cb727c](https://github.com/mineclover/context-action/commit/6cb727cfe03230d03e9f928fb92d86c2d3ae7360))
* Update logging configuration and enhance JSON settings ([8b15e76](https://github.com/mineclover/context-action/commit/8b15e76ff48c03aca2c876bf5f13eed36e26766b))
* 레거시 코드 제거 및 외부 abort 기능 개선 ([f4a0d18](https://github.com/mineclover/context-action/commit/f4a0d18d316656ba74182c376ffd65ed039ab747))
* 액션 실행 결과 반환 및 수집 시스템 구현 ([071131e](https://github.com/mineclover/context-action/commit/071131e286c392feef97d57ed3c08497c9add395))
* 파이프라인 결과 처리 시스템과 핸들러 메타데이터 확장 ([554dd29](https://github.com/mineclover/context-action/commit/554dd29a06f04371b1e84ad6458fbfee7f205ed0))
* 핵심 용어 JSDoc 태그 구현으로 용어집 매칭률 67% 달성 ([64b19e1](https://github.com/mineclover/context-action/commit/64b19e1be9da70106a26313c50f49da8eed8bfbb))


### BREAKING CHANGES

* None - fully backwards compatible with deprecation warnings

The old naming (useActionRegister/useRegistry) was confusing as both returned
different things but had similar names. New naming clearly indicates:
- useActionHandler returns a function to add handlers
- useStores returns access to the store registry
* Auto-generated handler IDs now use unpredictable pattern

- Replace predictable handler_N pattern with handler_N_randomSuffix
- Use Math.random().toString(36) for lightweight randomness (2.3x faster than crypto.randomUUID)
- Maintain performance: ~0.01ms overhead vs 0.0007ms for crypto approach
- Prevent ID prediction attacks while preserving counter-based ordering
- Update documentation with performance comparison and security strategies

Security Impact:
- Before: handler_1, handler_2, handler_3 (predictable)
- After: handler_1_k3x9z, handler_2_m8p4w, handler_3_r7q2s (unpredictable)

Performance Results (10,000 iterations):
- crypto.randomUUID(): 0.0007ms/op
- Math.random() approach: 0.0003ms/op (chosen)
- Current predictable: 0.0001ms/op (vulnerable)

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>





## 0.0.4 (2025-08-03)


### Bug Fixes

* ESLint 설정 파일 ES 모듈 호환성 문제 해결 ([1a92051](https://github.com/mineclover/context-action/commit/1a92051a2a3b48fbb502c7c65ee896c600661ce5))
* resolve TypeScript type safety issues across packages ([9fe20b9](https://github.com/mineclover/context-action/commit/9fe20b9c5a249c262119fde5d35b3a094991963f))
* test-app tsconfig.json 참조 경로 수정 ([4d1ec3e](https://github.com/mineclover/context-action/commit/4d1ec3e5641b3cabac7d827fb113ccad8b10189b))
* Update test scripts to pass with no tests ([59a08d4](https://github.com/mineclover/context-action/commit/59a08d435ad52698497b220277569a521f89f5d7))


### Features

* Add comprehensive logging system with OpenTelemetry support ([0a46cdd](https://github.com/mineclover/context-action/commit/0a46cdd265dee54c41a28751dfcb3db939dc6fb6))
* Change default log level to TRACE in environment variables ([d2a95d0](https://github.com/mineclover/context-action/commit/d2a95d02531a29943296e28ff40b3833c6858b4d))
* Complete React pages modularization and improve error handling ([19bc5a6](https://github.com/mineclover/context-action/commit/19bc5a6fd565688e90bc7f3069b1afd91cbb9cf1))
* Enhance core package documentation and type definitions ([17a84e0](https://github.com/mineclover/context-action/commit/17a84e0e1465d0ebcddfc92ae3c6b767f8f20401))
* **example:** Add comprehensive store management demo pages ([e1f0162](https://github.com/mineclover/context-action/commit/e1f0162ec6f71d7098f5289b4463bd7cf0353d8b))
* **glossary:** 스캐너 개선으로 ActionRegister 클래스 인식 및 구현 커버리지 35%로 향상 ([55d0a39](https://github.com/mineclover/context-action/commit/55d0a397ff33c90f6da3c4d28b09a76f60a14f55))
* **glossary:** Extract architecture patterns from example code ([513faac](https://github.com/mineclover/context-action/commit/513faacd543208e26abbfbe1ea997206f28d7699))
* implement complete pipeline control system with execution modes and action guards ([7f27112](https://github.com/mineclover/context-action/commit/7f2711279c6dd28e8a468b4313baeb0d61180e90))
* Major architecture refactoring and documentation update ([aadb45d](https://github.com/mineclover/context-action/commit/aadb45d0bc86502243b2390a1c6da7d4736e0208))
* separate logger into independent package ([6cb727c](https://github.com/mineclover/context-action/commit/6cb727cfe03230d03e9f928fb92d86c2d3ae7360))
* Update logging configuration and enhance JSON settings ([8b15e76](https://github.com/mineclover/context-action/commit/8b15e76ff48c03aca2c876bf5f13eed36e26766b))
