# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.8.8](https://github.com/mineclover/context-action/compare/v0.8.7...v0.8.8) (2026-07-13)


### Bug Fixes

* **core:** evaluate timing guards before dispatch queue ([4302139](https://github.com/mineclover/context-action/commit/4302139cfa8137d07db1c1c490832041be679018))





## [0.8.7](https://github.com/mineclover/context-action/compare/v0.8.6...v0.8.7) (2026-07-12)


### Features

* **core:** harden action execution lifecycle ([2348ec6](https://github.com/mineclover/context-action/commit/2348ec65247ab1b234607a03cdf2feef79736553))
* **example:** add action lifecycle workbench ([63cf81a](https://github.com/mineclover/context-action/commit/63cf81a49af6a8a69b858750a54088f349f41e51))
* **example:** add AI SDK v7 ToolContext runner ([7f6fa2b](https://github.com/mineclover/context-action/commit/7f6fa2b87f0bd243b2f5bba8bf1df39b684e429f))
* expand implementation playbook scenarios ([67ae17e](https://github.com/mineclover/context-action/commit/67ae17e4c7242f933835a5b2672b9397cb50b603))
* **react:** align store APIs with modern runtime ([1364eb9](https://github.com/mineclover/context-action/commit/1364eb91368b830b70ee804566dd3ddb69ea0e68))
* **react:** stabilize tool handler results and lifecycle ([52b5c44](https://github.com/mineclover/context-action/commit/52b5c44d0734b54626d7407fea8d27d88323f6d9))





## [0.8.6](https://github.com/mineclover/context-action/compare/v0.8.5...v0.8.6) (2026-03-27)

**Note:** Version bump only for package context-action-monorepo





## [0.8.5](https://github.com/mineclover/context-action/compare/v0.8.4...v0.8.5) (2026-03-27)


### Bug Fixes

* Add React dedupe to prevent multiple instances ([82422fa](https://github.com/mineclover/context-action/commit/82422fa80cb26b70089da52eb721cd67b444da8e))
* **example:** Add Panda CSS codegen to build pipeline for CI/CD ([00e3aef](https://github.com/mineclover/context-action/commit/00e3aefba74ee5b0f3d08c6d4e85f30648cdfd6b))
* **example:** Complete Panda CSS migration and fix TypeScript errors ([686bb16](https://github.com/mineclover/context-action/commit/686bb165d0689305540b26f60857d7c6f9827ff5))
* **example:** Fix React duplication in build chunks ([7a95320](https://github.com/mineclover/context-action/commit/7a9532055f9c2f9ae91004a895635c4d0f399f94))
* **example:** Fix sidebar layout using pure Panda CSS ([6e11710](https://github.com/mineclover/context-action/commit/6e117107d61de57de758064dc6fa4820736d9a83))
* **example:** Fix sidebar layout with Tailwind classes ([3f96d91](https://github.com/mineclover/context-action/commit/3f96d91c3ca752f0c37ad01ca4107d8c438b837b))
* **example:** Fix SPA routing for VitePress redirect integration ([e8df598](https://github.com/mineclover/context-action/commit/e8df59881ddb234453171a502281dc7c6504c182))
* **example:** Fix useActionWithResult page initial state and add validation history ([c4f2931](https://github.com/mineclover/context-action/commit/c4f2931fd2dae09aab5d986230c4f5aec9e9518c))
* **example:** Integrate Panda CSS with PostCSS pipeline ([7a95dbe](https://github.com/mineclover/context-action/commit/7a95dbe8a7bdad8d0aa7eded4759f270543bc593))
* Re-enable Tailwind CSS for globals.css processing ([1376509](https://github.com/mineclover/context-action/commit/137650909ff8dbce8ca459f6c16661833e899ddd))
* Remove vite.svg favicon causing 404 error ([e7c5f7b](https://github.com/mineclover/context-action/commit/e7c5f7b7b9a417182801d143dd859a8a408b1302))
* restore deterministic deploy build ([ffe94a7](https://github.com/mineclover/context-action/commit/ffe94a77e5a80b9d01d71daa3b5929a852578574))
* Update React Compiler target to 19 to match React version ([a699eaa](https://github.com/mineclover/context-action/commit/a699eaac51eed1993bcbbce67ee69a609ff4c44b))
* Use .length instead of .size for array type ([2698da7](https://github.com/mineclover/context-action/commit/2698da737764d9b905370b9f47b01320d57dd5c3))


### Features

* add canonical implementation playbook ([34aeebf](https://github.com/mineclover/context-action/commit/34aeebf86ba1b0d153973e6fe86e0829e733cd3c))
* Add path-based subscription and TimeTravelStore with major docs cleanup ([9b7d8d2](https://github.com/mineclover/context-action/commit/9b7d8d2f84a65751e477202960e649ad6aa45b01))
* Add ToolContext + AI SDK demo with OpenRouter integration ([129ad13](https://github.com/mineclover/context-action/commit/129ad131cbe82962745031e7a980551b1cb35edb))
* Add Zod schema integration and createToolContext for LLM tool registry ([1baf4b8](https://github.com/mineclover/context-action/commit/1baf4b80fe236ee9b5ae6b3d11ca66d745185c7a))
* Complete Panda CSS migration to variants-based design system ([2136399](https://github.com/mineclover/context-action/commit/213639954a26486371c77464e86b2b5d9a190149))
* **example:** Add deep structure test for structural sharing ([d8ba5bb](https://github.com/mineclover/context-action/commit/d8ba5bba5f7c34cf779c4c3afa0ca2ae7883bd59))
* **example:** Add validation history display to ValidationView component ([4a7261a](https://github.com/mineclover/context-action/commit/4a7261aac1228282333e227a83868aa0f41d5c11))
* expand variants system and add Alert component ([4ca450f](https://github.com/mineclover/context-action/commit/4ca450f4f4b86b2f7cffbedcdd63f9f5759c9579))
* **stores:** Add notificationMode support to TimeTravelStore ([8bc40c3](https://github.com/mineclover/context-action/commit/8bc40c30b8b08bae00547e15bcd5563c23e2553c))
* **stores:** Add notifyPath/notifyPaths API for external async operations ([0d080b8](https://github.com/mineclover/context-action/commit/0d080b839947b652375057262360ea95854299c9))
* **stores:** Add RFC 6901 JSON Pointer support and stability improvements ([c0b6665](https://github.com/mineclover/context-action/commit/c0b6665d9014dc4b759b5e6fb0070a41af07b9f5))
* **style-testing:** Add automated style testing package ([c599499](https://github.com/mineclover/context-action/commit/c5994999c22f0f04c60f390a2e3bd7fe90adfb66))
* **style-testing:** Fix style extractor and add workspace config ([b995016](https://github.com/mineclover/context-action/commit/b9950161e730e9852f97497f1bbb455981bf6b6d))
* **style-testing:** Improve DiffEngine to reduce false positives ([fe55fda](https://github.com/mineclover/context-action/commit/fe55fdac947a91775b05d19364c62dfa31c6b45c))
* Update to React 19.2.3 ([d0a652f](https://github.com/mineclover/context-action/commit/d0a652fc9c3fc6376c32e5a5a1045f8a980f51bb))
* **vanilla-js:** Add comprehensive vanilla JavaScript support ([db7e0c4](https://github.com/mineclover/context-action/commit/db7e0c435675d97542956ae595f8f5db700f36ab))


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

* CartItemView local state sync causing Total Items vs Shopping Cart inconsistency ([e2fd16a](https://github.com/mineclover/context-action/commit/e2fd16ad5a18e4aece738e7b4c03d3e73d0a6c13))
* Change @context-action/core dependency from workspace:* to latest ([595508e](https://github.com/mineclover/context-action/commit/595508ea99e4c920b6d6646980f1acc5cf001dd1))
* Improve cart state updates in useActionWithResult demo page ([2f5fdc8](https://github.com/mineclover/context-action/commit/2f5fdc868a3ef5afce702532a2a01028696e2e16))
* Remove unnecessary [@ts-expect-error](https://github.com/ts-expect-error) comments from test files ([27c98e0](https://github.com/mineclover/context-action/commit/27c98e0c2acb876c25ecd89e70c1a4afd0196a99))
* replace workspace dependency with actual version in react package ([b2187af](https://github.com/mineclover/context-action/commit/b2187afd9ecebf7f342c6cd36578512b1d9aaf63))
* Resolve TypeScript type errors in ActionContext.tsx ([4581305](https://github.com/mineclover/context-action/commit/4581305cf402768d5cb142e3c9c80a57fad8227d))


### Features

* Add actions-based dispatching with improved type safety ([6bc36e6](https://github.com/mineclover/context-action/commit/6bc36e6d751218d09621fc7ae9bed780154cc70e))
* Add actionsWithResult for result collection in actions-based dispatching ([a9131a4](https://github.com/mineclover/context-action/commit/a9131a439b0143b17813ec668166fee5264efbfa))
* Add code examples and source directory integration to ImperativeRef demo ([be1f348](https://github.com/mineclover/context-action/commit/be1f3482d8c339cba2038eebe924b73dbdbf8440))
* Add comprehensive TypeScript type inference system and documentation ([debde90](https://github.com/mineclover/context-action/commit/debde9069f6e4aa1d87ba2652f510c7fcf552707))
* Add comprehensive useImperativeHandle + Ref Context demo page ([48bccd2](https://github.com/mineclover/context-action/commit/48bccd27e9f608df019e250d06c6005a621d99a9))
* Add optimization analysis report and enhance performance monitoring ([9aad8ac](https://github.com/mineclover/context-action/commit/9aad8ac0515c289ca8195f348e6f68b521af9046))
* Add Warning Demo Page to showcase unregistered action warnings ([0293aaa](https://github.com/mineclover/context-action/commit/0293aaaddff89656b3453867e16a2bc98264f542))
* Add warning messages for unregistered action handlers ([93fb16c](https://github.com/mineclover/context-action/commit/93fb16ccddb1d4458305b626fb3c9ff037e45956))
* clean release with unified version 0.7.8/0.7.9 ([f0b54a6](https://github.com/mineclover/context-action/commit/f0b54a6ecfa378a42e924492ac2cefaaf90dbb88))
* Complete @context-action/test-driven-docs integration with enhanced features ([2954a19](https://github.com/mineclover/context-action/commit/2954a19d897eb95a8497d3d39ac4fdd4db769580))
* Complete 6-layer architecture implementation with Source Directory integration ([83e7de1](https://github.com/mineclover/context-action/commit/83e7de175e5febf1d9014fb677292f5154ff6b13))
* Create @context-action/test-driven-docs standalone library ([c687149](https://github.com/mineclover/context-action/commit/c687149174f065da6615b6078b16e209a20dfeef))
* Enhance performance with React Compiler integration in examples ([d503162](https://github.com/mineclover/context-action/commit/d503162b637bf3e63452a65bf9739959de9b0e13))
* Implement 6-Layer Architecture refactoring and enhance development tools ([9fc44e3](https://github.com/mineclover/context-action/commit/9fc44e3a9cffc6984fc3b57dc78c819bc7792217))
* Implement Phase 2 enhanced test-based documentation system ([51fade3](https://github.com/mineclover/context-action/commit/51fade3067e0691836c6c002c505e07e8f96bac6))
* Implement test-based API documentation system ([0b46838](https://github.com/mineclover/context-action/commit/0b46838e9d0ef1644e1f204e25433b61ea2154dd))
* Introduce Demos Index Page for interactive demonstrations ([3b14daa](https://github.com/mineclover/context-action/commit/3b14daa8f4482724d32ea663ea662ea4be90c2d3))
* Introduce User Management Example and refactor createObjectContextHooks ([8a0fb05](https://github.com/mineclover/context-action/commit/8a0fb05ae6612c0b19da8bd83294a7c155f88679))
* **react:** v0.8.1 - React Compiler integration with backwards compatibility ([f3adbcf](https://github.com/mineclover/context-action/commit/f3adbcf2060a89261f01703b3e69ed31852d36a3))
* Reorganize layered architecture demo layout and make statistics overview compact ([4d9b544](https://github.com/mineclover/context-action/commit/4d9b544a37c165e07846bb3ce5fe9a9b456ec249))
* Update @context-action/react to use latest dependencies ([c349442](https://github.com/mineclover/context-action/commit/c34944222d73799f4a1f0272de689e67fe63920d))
* Update README files for better internationalization ([9f8438f](https://github.com/mineclover/context-action/commit/9f8438f53053d0c019f62664ee8e07c9e7fb8d19))
* Upgrade React and related dependencies, add React Compiler demo ([50e0c0a](https://github.com/mineclover/context-action/commit/50e0c0acb7f9aa4bf26c87e2bfcf0deb19019f78))


### Performance Improvements

* Optimize core and react package implementations ([88fab30](https://github.com/mineclover/context-action/commit/88fab30709c03537a97b3ba8e1cfe058e80a1107))


### Reverts

* Revert "refactor: Update store methods to use updateValue for safer state management" ([d158c93](https://github.com/mineclover/context-action/commit/d158c936f6045f0fa6affdd1af34403cb281f868))





## [0.7.7](https://github.com/mineclover/context-action/compare/v0.6.0...v0.7.7) (2025-09-17)


### Bug Fixes

* **ActionRegister:** enhance error handling and execution context management ([d32a1f6](https://github.com/mineclover/context-action/commit/d32a1f60858141db6dc7ff9bc72fa3056638c97f))
* convert Immer from dynamic to static imports for improved stability ([dde606f](https://github.com/mineclover/context-action/commit/dde606feee79f942d953a60b32164f11fc10b374))
* **core:** resolve test failures and improve ActionRegister reliability ([82925b9](https://github.com/mineclover/context-action/commit/82925b92f15f2f737d12885512521bc9cc41dff4))
* correct CodeBlock component usage in AdvancedCodeExamples ([ecfdc35](https://github.com/mineclover/context-action/commit/ecfdc352c8d076f32fcffcdde926587a2a24ad64))
* improve Store update method with Immer integration ([c9754d7](https://github.com/mineclover/context-action/commit/c9754d7c750c1abf70a3eef99504033ce089b439))
* improve Store update method with Immer integration ([0bce495](https://github.com/mineclover/context-action/commit/0bce49562ed323e52985917306e87385e9b64205))
* improve TypeDoc configuration clarity and prevent wrong location generation ([3afca1c](https://github.com/mineclover/context-action/commit/3afca1ce25511e29636e1448f061acc822a59e67))
* lint 경고 수정 - 사용하지 않는 cacheKey 변수 제거 ([a507727](https://github.com/mineclover/context-action/commit/a507727ec177f49d58106779953283723013929a))
* **llms-generator:** resolve TypeScript compilation errors ([6414ff3](https://github.com/mineclover/context-action/commit/6414ff3fec2a57b25ff9897fb8c7f4cdd23e78b4))
* React hooks 규칙 준수를 위한 PriorityTestHandlers 수정 ([12a9038](https://github.com/mineclover/context-action/commit/12a90388ba6a0d49a88d9cd9759bcb7939ad688a))
* **react:** adjust test expectations after refactoring ([78a4808](https://github.com/mineclover/context-action/commit/78a48084b254f59688e71f90419783cb30ecad1d))
* **react:** Enable Immer MapSet plugin for Set and Map support ([18d98e6](https://github.com/mineclover/context-action/commit/18d98e6e1cf9b7b9eeb3a1778c4a5ba61270c89d))
* **react:** export StoreManager for proper type inference in createStoreContext ([3433632](https://github.com/mineclover/context-action/commit/343363292beb920d13beda336cc5fade8d7684df))
* Remove dependabot and fix docs build issues ([eb9a285](https://github.com/mineclover/context-action/commit/eb9a285d21a04decd7fbc68673df4cd889d42b6b))
* Resolve ActionRegister execution modes and improve error handling ([71d06bd](https://github.com/mineclover/context-action/commit/71d06bded76cd3ee197002e97d7bb5cc3ccb96ee))
* resolve all TypeScript errors and improve LogMonitor dependency handling ([06b3a6e](https://github.com/mineclover/context-action/commit/06b3a6e3bf3050b408a01dbfdaf63eae39cbac7f))
* resolve core and react package linting warnings ([fc0df76](https://github.com/mineclover/context-action/commit/fc0df76116c6f3de6acc9fc0845743e9e24f2aa2))
* Resolve failing test suites and improve test stability ([926510c](https://github.com/mineclover/context-action/commit/926510cad2fc5562a8c4d81156035282d44252fe))
* resolve memory leaks in test files by replacing clearAll() with destroy() ([097a010](https://github.com/mineclover/context-action/commit/097a010ae0572c64643e744c4a529a44f7cbbcb5))
* resolve Node.js protocol browser compatibility issues ([854a2fa](https://github.com/mineclover/context-action/commit/854a2fa0c8bf87addb0e555f8555def584a04a33))
* Resolve test error handling and update dependencies ([54bca84](https://github.com/mineclover/context-action/commit/54bca847b5a6f4e08b95266a9839ae4483fd2cd0))
* Resolve test memory issues and finalize async handler support ([b4a1666](https://github.com/mineclover/context-action/commit/b4a1666990e2e653e8791b960addff20b8fc3abe))
* resolve TypeScript strict mode compliance issues ([e4ef015](https://github.com/mineclover/context-action/commit/e4ef015c4c63835c790c8f181448197f8e595bab))
* simplify tsdown configuration for reliable DTS generation ([590b702](https://github.com/mineclover/context-action/commit/590b7022e53c6d6f8e36a1e8356ab431abeaf92f))
* TypeScript 타입 안전성 개선 - targetHandler undefined 체크 추가 ([5aa2691](https://github.com/mineclover/context-action/commit/5aa26916647c0ba659b3e432191e1b590b2ef3f4))
* update TypeScript configuration and enhance LogMonitor component ([c280d4f](https://github.com/mineclover/context-action/commit/c280d4ff4cedf44f28b91e612159bdca7c3a014e))


### Features

* 성능 테스트 중 버튼 비활성화 시각적 피드백 개선 ([b05002d](https://github.com/mineclover/context-action/commit/b05002d230e0ed18eb442ee129226cceedb848c0))
* Add backward jump support with infinite loop protection ([a0d133f](https://github.com/mineclover/context-action/commit/a0d133f28cf75c69ed70f92fdfbb48654e5b091b))
* Add comprehensive concurrency test coverage for concurrency.md ([79344e5](https://github.com/mineclover/context-action/commit/79344e57b15ee9e0a882cb65395bf419ecce2b0f))
* add Context-Layered Architecture section to documentation and navigation ([d655322](https://github.com/mineclover/context-action/commit/d655322b4fd8ff7c6a0f6d9642c4b879f85e319c))
* add SourceLink integration to core example pages ([7cc16b6](https://github.com/mineclover/context-action/commit/7cc16b6ee23a498e8ccd9f5b867b6529f3fb875d))
* Complete ActionRegister comprehensive test suite improvements ([fda402f](https://github.com/mineclover/context-action/commit/fda402fcc1f611ceed011363df2d1c26c20d8478))
* Context-Action 라이브러리 핵심 성능 및 안정성 개선 ([f13fe47](https://github.com/mineclover/context-action/commit/f13fe4756c7f1e39872aca7a45fec09f37da3c2c))
* **core:** enhance ActionRegister performance with optimized caching and pooling ([96fb72a](https://github.com/mineclover/context-action/commit/96fb72a61230cfd38963dc28b853d9ec6323175a))
* enhance Core Advanced page with comprehensive usage examples ([0878151](https://github.com/mineclover/context-action/commit/0878151730af4768907857a0fdec6116534080f1))
* Enhanced priority test interface with manual controls and Set support ([61957de](https://github.com/mineclover/context-action/commit/61957ded7320d737aca30e16dbeb722d5a0d2846))
* implement advanced unregister function management system ([1086a8a](https://github.com/mineclover/context-action/commit/1086a8abb3a8887df58fe80c1bb02854f0eed7b7))
* implement comprehensive SourceLink Registry system ([3d0dc69](https://github.com/mineclover/context-action/commit/3d0dc6983dfb778dd599e0e5c04df4b8a0fd83a7))
* implement Context-Layered Architecture with complete refactoring ([801fcfd](https://github.com/mineclover/context-action/commit/801fcfdd65f36cda7c3537d7cc49a9385c0c41bf))
* integrate LogMonitor with Flow Control and enhance Store conventions ([3086fef](https://github.com/mineclover/context-action/commit/3086fef8a74a9d92d5fdc89b50f98df628eb0a9e))
* integrate SourceLink Registry into app navigation ([ed1d283](https://github.com/mineclover/context-action/commit/ed1d2837e8378b4a35510f07c5416f37b05d5796))
* **LogMonitor:** implement MVVM architecture and enhance context management ([8e81732](https://github.com/mineclover/context-action/commit/8e817328cbdb1ec8741e0f50432c0e4d7421306d))
* major test improvements and ActionRegister enhancements ([670e426](https://github.com/mineclover/context-action/commit/670e4267d6509b1cd9c6dd048960245251af844f))
* modernize TypeScript configuration and fix dynamic imports ([725eef5](https://github.com/mineclover/context-action/commit/725eef5e02388e67103d94814935965e066f3e85))
* **performance-optimization:** add comprehensive performance optimization guides with varying character limits ([950dee2](https://github.com/mineclover/context-action/commit/950dee2d6d88b362898b803222ab5a7786d0ad00))
* **react:** consolidate test structure and fix TypeScript errors ([618ec8c](https://github.com/mineclover/context-action/commit/618ec8cbb2474964b249c0320cff69be373246f1))


### Performance Improvements

* 메모리 효율성을 위한 필터 캐시 시스템 비활성화 ([1c16221](https://github.com/mineclover/context-action/commit/1c1622100be5f52b37a6f8dfb45bb88766528f80))
* Optimize useComputedStore with useSyncExternalStore ([bbef3c6](https://github.com/mineclover/context-action/commit/bbef3c6b960ba9637cf7afb5cbdcda9f47dc7ae9))





## [0.7.6](https://github.com/mineclover/context-action/compare/v0.6.0...v0.7.6) (2025-09-17)


### Bug Fixes

* **ActionRegister:** enhance error handling and execution context management ([d32a1f6](https://github.com/mineclover/context-action/commit/d32a1f60858141db6dc7ff9bc72fa3056638c97f))
* convert Immer from dynamic to static imports for improved stability ([dde606f](https://github.com/mineclover/context-action/commit/dde606feee79f942d953a60b32164f11fc10b374))
* **core:** resolve test failures and improve ActionRegister reliability ([82925b9](https://github.com/mineclover/context-action/commit/82925b92f15f2f737d12885512521bc9cc41dff4))
* correct CodeBlock component usage in AdvancedCodeExamples ([ecfdc35](https://github.com/mineclover/context-action/commit/ecfdc352c8d076f32fcffcdde926587a2a24ad64))
* improve Store update method with Immer integration ([c9754d7](https://github.com/mineclover/context-action/commit/c9754d7c750c1abf70a3eef99504033ce089b439))
* improve Store update method with Immer integration ([0bce495](https://github.com/mineclover/context-action/commit/0bce49562ed323e52985917306e87385e9b64205))
* improve TypeDoc configuration clarity and prevent wrong location generation ([3afca1c](https://github.com/mineclover/context-action/commit/3afca1ce25511e29636e1448f061acc822a59e67))
* lint 경고 수정 - 사용하지 않는 cacheKey 변수 제거 ([a507727](https://github.com/mineclover/context-action/commit/a507727ec177f49d58106779953283723013929a))
* **llms-generator:** resolve TypeScript compilation errors ([6414ff3](https://github.com/mineclover/context-action/commit/6414ff3fec2a57b25ff9897fb8c7f4cdd23e78b4))
* React hooks 규칙 준수를 위한 PriorityTestHandlers 수정 ([12a9038](https://github.com/mineclover/context-action/commit/12a90388ba6a0d49a88d9cd9759bcb7939ad688a))
* **react:** adjust test expectations after refactoring ([78a4808](https://github.com/mineclover/context-action/commit/78a48084b254f59688e71f90419783cb30ecad1d))
* **react:** Enable Immer MapSet plugin for Set and Map support ([18d98e6](https://github.com/mineclover/context-action/commit/18d98e6e1cf9b7b9eeb3a1778c4a5ba61270c89d))
* **react:** export StoreManager for proper type inference in createStoreContext ([3433632](https://github.com/mineclover/context-action/commit/343363292beb920d13beda336cc5fade8d7684df))
* Resolve ActionRegister execution modes and improve error handling ([71d06bd](https://github.com/mineclover/context-action/commit/71d06bded76cd3ee197002e97d7bb5cc3ccb96ee))
* resolve all TypeScript errors and improve LogMonitor dependency handling ([06b3a6e](https://github.com/mineclover/context-action/commit/06b3a6e3bf3050b408a01dbfdaf63eae39cbac7f))
* resolve core and react package linting warnings ([fc0df76](https://github.com/mineclover/context-action/commit/fc0df76116c6f3de6acc9fc0845743e9e24f2aa2))
* Resolve failing test suites and improve test stability ([926510c](https://github.com/mineclover/context-action/commit/926510cad2fc5562a8c4d81156035282d44252fe))
* resolve memory leaks in test files by replacing clearAll() with destroy() ([097a010](https://github.com/mineclover/context-action/commit/097a010ae0572c64643e744c4a529a44f7cbbcb5))
* resolve Node.js protocol browser compatibility issues ([854a2fa](https://github.com/mineclover/context-action/commit/854a2fa0c8bf87addb0e555f8555def584a04a33))
* Resolve test error handling and update dependencies ([54bca84](https://github.com/mineclover/context-action/commit/54bca847b5a6f4e08b95266a9839ae4483fd2cd0))
* Resolve test memory issues and finalize async handler support ([b4a1666](https://github.com/mineclover/context-action/commit/b4a1666990e2e653e8791b960addff20b8fc3abe))
* resolve TypeScript strict mode compliance issues ([e4ef015](https://github.com/mineclover/context-action/commit/e4ef015c4c63835c790c8f181448197f8e595bab))
* TypeScript 타입 안전성 개선 - targetHandler undefined 체크 추가 ([5aa2691](https://github.com/mineclover/context-action/commit/5aa26916647c0ba659b3e432191e1b590b2ef3f4))
* update TypeScript configuration and enhance LogMonitor component ([c280d4f](https://github.com/mineclover/context-action/commit/c280d4ff4cedf44f28b91e612159bdca7c3a014e))


### Features

* 성능 테스트 중 버튼 비활성화 시각적 피드백 개선 ([b05002d](https://github.com/mineclover/context-action/commit/b05002d230e0ed18eb442ee129226cceedb848c0))
* Add backward jump support with infinite loop protection ([a0d133f](https://github.com/mineclover/context-action/commit/a0d133f28cf75c69ed70f92fdfbb48654e5b091b))
* Add comprehensive concurrency test coverage for concurrency.md ([79344e5](https://github.com/mineclover/context-action/commit/79344e57b15ee9e0a882cb65395bf419ecce2b0f))
* add Context-Layered Architecture section to documentation and navigation ([d655322](https://github.com/mineclover/context-action/commit/d655322b4fd8ff7c6a0f6d9642c4b879f85e319c))
* add SourceLink integration to core example pages ([7cc16b6](https://github.com/mineclover/context-action/commit/7cc16b6ee23a498e8ccd9f5b867b6529f3fb875d))
* Complete ActionRegister comprehensive test suite improvements ([fda402f](https://github.com/mineclover/context-action/commit/fda402fcc1f611ceed011363df2d1c26c20d8478))
* Context-Action 라이브러리 핵심 성능 및 안정성 개선 ([f13fe47](https://github.com/mineclover/context-action/commit/f13fe4756c7f1e39872aca7a45fec09f37da3c2c))
* **core:** enhance ActionRegister performance with optimized caching and pooling ([96fb72a](https://github.com/mineclover/context-action/commit/96fb72a61230cfd38963dc28b853d9ec6323175a))
* enhance Core Advanced page with comprehensive usage examples ([0878151](https://github.com/mineclover/context-action/commit/0878151730af4768907857a0fdec6116534080f1))
* Enhanced priority test interface with manual controls and Set support ([61957de](https://github.com/mineclover/context-action/commit/61957ded7320d737aca30e16dbeb722d5a0d2846))
* implement advanced unregister function management system ([1086a8a](https://github.com/mineclover/context-action/commit/1086a8abb3a8887df58fe80c1bb02854f0eed7b7))
* implement comprehensive SourceLink Registry system ([3d0dc69](https://github.com/mineclover/context-action/commit/3d0dc6983dfb778dd599e0e5c04df4b8a0fd83a7))
* implement Context-Layered Architecture with complete refactoring ([801fcfd](https://github.com/mineclover/context-action/commit/801fcfdd65f36cda7c3537d7cc49a9385c0c41bf))
* integrate LogMonitor with Flow Control and enhance Store conventions ([3086fef](https://github.com/mineclover/context-action/commit/3086fef8a74a9d92d5fdc89b50f98df628eb0a9e))
* integrate SourceLink Registry into app navigation ([ed1d283](https://github.com/mineclover/context-action/commit/ed1d2837e8378b4a35510f07c5416f37b05d5796))
* **LogMonitor:** implement MVVM architecture and enhance context management ([8e81732](https://github.com/mineclover/context-action/commit/8e817328cbdb1ec8741e0f50432c0e4d7421306d))
* major test improvements and ActionRegister enhancements ([670e426](https://github.com/mineclover/context-action/commit/670e4267d6509b1cd9c6dd048960245251af844f))
* modernize TypeScript configuration and fix dynamic imports ([725eef5](https://github.com/mineclover/context-action/commit/725eef5e02388e67103d94814935965e066f3e85))
* **performance-optimization:** add comprehensive performance optimization guides with varying character limits ([950dee2](https://github.com/mineclover/context-action/commit/950dee2d6d88b362898b803222ab5a7786d0ad00))
* **react:** consolidate test structure and fix TypeScript errors ([618ec8c](https://github.com/mineclover/context-action/commit/618ec8cbb2474964b249c0320cff69be373246f1))


### Performance Improvements

* 메모리 효율성을 위한 필터 캐시 시스템 비활성화 ([1c16221](https://github.com/mineclover/context-action/commit/1c1622100be5f52b37a6f8dfb45bb88766528f80))
* Optimize useComputedStore with useSyncExternalStore ([bbef3c6](https://github.com/mineclover/context-action/commit/bbef3c6b960ba9637cf7afb5cbdcda9f47dc7ae9))





## [0.7.5](https://github.com/mineclover/context-action/compare/v0.6.0...v0.7.5) (2025-09-17)


### Bug Fixes

* **ActionRegister:** enhance error handling and execution context management ([d32a1f6](https://github.com/mineclover/context-action/commit/d32a1f60858141db6dc7ff9bc72fa3056638c97f))
* convert Immer from dynamic to static imports for improved stability ([dde606f](https://github.com/mineclover/context-action/commit/dde606feee79f942d953a60b32164f11fc10b374))
* **core:** resolve test failures and improve ActionRegister reliability ([82925b9](https://github.com/mineclover/context-action/commit/82925b92f15f2f737d12885512521bc9cc41dff4))
* correct CodeBlock component usage in AdvancedCodeExamples ([ecfdc35](https://github.com/mineclover/context-action/commit/ecfdc352c8d076f32fcffcdde926587a2a24ad64))
* improve Store update method with Immer integration ([c9754d7](https://github.com/mineclover/context-action/commit/c9754d7c750c1abf70a3eef99504033ce089b439))
* improve Store update method with Immer integration ([0bce495](https://github.com/mineclover/context-action/commit/0bce49562ed323e52985917306e87385e9b64205))
* improve TypeDoc configuration clarity and prevent wrong location generation ([3afca1c](https://github.com/mineclover/context-action/commit/3afca1ce25511e29636e1448f061acc822a59e67))
* lint 경고 수정 - 사용하지 않는 cacheKey 변수 제거 ([a507727](https://github.com/mineclover/context-action/commit/a507727ec177f49d58106779953283723013929a))
* **llms-generator:** resolve TypeScript compilation errors ([6414ff3](https://github.com/mineclover/context-action/commit/6414ff3fec2a57b25ff9897fb8c7f4cdd23e78b4))
* React hooks 규칙 준수를 위한 PriorityTestHandlers 수정 ([12a9038](https://github.com/mineclover/context-action/commit/12a90388ba6a0d49a88d9cd9759bcb7939ad688a))
* **react:** adjust test expectations after refactoring ([78a4808](https://github.com/mineclover/context-action/commit/78a48084b254f59688e71f90419783cb30ecad1d))
* **react:** Enable Immer MapSet plugin for Set and Map support ([18d98e6](https://github.com/mineclover/context-action/commit/18d98e6e1cf9b7b9eeb3a1778c4a5ba61270c89d))
* **react:** export StoreManager for proper type inference in createStoreContext ([3433632](https://github.com/mineclover/context-action/commit/343363292beb920d13beda336cc5fade8d7684df))
* Resolve ActionRegister execution modes and improve error handling ([71d06bd](https://github.com/mineclover/context-action/commit/71d06bded76cd3ee197002e97d7bb5cc3ccb96ee))
* resolve all TypeScript errors and improve LogMonitor dependency handling ([06b3a6e](https://github.com/mineclover/context-action/commit/06b3a6e3bf3050b408a01dbfdaf63eae39cbac7f))
* resolve core and react package linting warnings ([fc0df76](https://github.com/mineclover/context-action/commit/fc0df76116c6f3de6acc9fc0845743e9e24f2aa2))
* Resolve failing test suites and improve test stability ([926510c](https://github.com/mineclover/context-action/commit/926510cad2fc5562a8c4d81156035282d44252fe))
* resolve memory leaks in test files by replacing clearAll() with destroy() ([097a010](https://github.com/mineclover/context-action/commit/097a010ae0572c64643e744c4a529a44f7cbbcb5))
* Resolve test error handling and update dependencies ([54bca84](https://github.com/mineclover/context-action/commit/54bca847b5a6f4e08b95266a9839ae4483fd2cd0))
* Resolve test memory issues and finalize async handler support ([b4a1666](https://github.com/mineclover/context-action/commit/b4a1666990e2e653e8791b960addff20b8fc3abe))
* resolve TypeScript strict mode compliance issues ([e4ef015](https://github.com/mineclover/context-action/commit/e4ef015c4c63835c790c8f181448197f8e595bab))
* TypeScript 타입 안전성 개선 - targetHandler undefined 체크 추가 ([5aa2691](https://github.com/mineclover/context-action/commit/5aa26916647c0ba659b3e432191e1b590b2ef3f4))
* update TypeScript configuration and enhance LogMonitor component ([c280d4f](https://github.com/mineclover/context-action/commit/c280d4ff4cedf44f28b91e612159bdca7c3a014e))


### Features

* 성능 테스트 중 버튼 비활성화 시각적 피드백 개선 ([b05002d](https://github.com/mineclover/context-action/commit/b05002d230e0ed18eb442ee129226cceedb848c0))
* Add backward jump support with infinite loop protection ([a0d133f](https://github.com/mineclover/context-action/commit/a0d133f28cf75c69ed70f92fdfbb48654e5b091b))
* Add comprehensive concurrency test coverage for concurrency.md ([79344e5](https://github.com/mineclover/context-action/commit/79344e57b15ee9e0a882cb65395bf419ecce2b0f))
* add Context-Layered Architecture section to documentation and navigation ([d655322](https://github.com/mineclover/context-action/commit/d655322b4fd8ff7c6a0f6d9642c4b879f85e319c))
* add SourceLink integration to core example pages ([7cc16b6](https://github.com/mineclover/context-action/commit/7cc16b6ee23a498e8ccd9f5b867b6529f3fb875d))
* Complete ActionRegister comprehensive test suite improvements ([fda402f](https://github.com/mineclover/context-action/commit/fda402fcc1f611ceed011363df2d1c26c20d8478))
* Context-Action 라이브러리 핵심 성능 및 안정성 개선 ([f13fe47](https://github.com/mineclover/context-action/commit/f13fe4756c7f1e39872aca7a45fec09f37da3c2c))
* **core:** enhance ActionRegister performance with optimized caching and pooling ([96fb72a](https://github.com/mineclover/context-action/commit/96fb72a61230cfd38963dc28b853d9ec6323175a))
* enhance Core Advanced page with comprehensive usage examples ([0878151](https://github.com/mineclover/context-action/commit/0878151730af4768907857a0fdec6116534080f1))
* Enhanced priority test interface with manual controls and Set support ([61957de](https://github.com/mineclover/context-action/commit/61957ded7320d737aca30e16dbeb722d5a0d2846))
* implement advanced unregister function management system ([1086a8a](https://github.com/mineclover/context-action/commit/1086a8abb3a8887df58fe80c1bb02854f0eed7b7))
* implement comprehensive SourceLink Registry system ([3d0dc69](https://github.com/mineclover/context-action/commit/3d0dc6983dfb778dd599e0e5c04df4b8a0fd83a7))
* implement Context-Layered Architecture with complete refactoring ([801fcfd](https://github.com/mineclover/context-action/commit/801fcfdd65f36cda7c3537d7cc49a9385c0c41bf))
* integrate LogMonitor with Flow Control and enhance Store conventions ([3086fef](https://github.com/mineclover/context-action/commit/3086fef8a74a9d92d5fdc89b50f98df628eb0a9e))
* integrate SourceLink Registry into app navigation ([ed1d283](https://github.com/mineclover/context-action/commit/ed1d2837e8378b4a35510f07c5416f37b05d5796))
* **LogMonitor:** implement MVVM architecture and enhance context management ([8e81732](https://github.com/mineclover/context-action/commit/8e817328cbdb1ec8741e0f50432c0e4d7421306d))
* major test improvements and ActionRegister enhancements ([670e426](https://github.com/mineclover/context-action/commit/670e4267d6509b1cd9c6dd048960245251af844f))
* modernize TypeScript configuration and fix dynamic imports ([725eef5](https://github.com/mineclover/context-action/commit/725eef5e02388e67103d94814935965e066f3e85))
* **performance-optimization:** add comprehensive performance optimization guides with varying character limits ([950dee2](https://github.com/mineclover/context-action/commit/950dee2d6d88b362898b803222ab5a7786d0ad00))
* **react:** consolidate test structure and fix TypeScript errors ([618ec8c](https://github.com/mineclover/context-action/commit/618ec8cbb2474964b249c0320cff69be373246f1))


### Performance Improvements

* 메모리 효율성을 위한 필터 캐시 시스템 비활성화 ([1c16221](https://github.com/mineclover/context-action/commit/1c1622100be5f52b37a6f8dfb45bb88766528f80))
* Optimize useComputedStore with useSyncExternalStore ([bbef3c6](https://github.com/mineclover/context-action/commit/bbef3c6b960ba9637cf7afb5cbdcda9f47dc7ae9))





## [0.7.4](https://github.com/mineclover/context-action/compare/v0.6.0...v0.7.4) (2025-09-17)


### Bug Fixes

* **ActionRegister:** enhance error handling and execution context management ([d32a1f6](https://github.com/mineclover/context-action/commit/d32a1f60858141db6dc7ff9bc72fa3056638c97f))
* convert Immer from dynamic to static imports for improved stability ([dde606f](https://github.com/mineclover/context-action/commit/dde606feee79f942d953a60b32164f11fc10b374))
* **core:** resolve test failures and improve ActionRegister reliability ([82925b9](https://github.com/mineclover/context-action/commit/82925b92f15f2f737d12885512521bc9cc41dff4))
* correct CodeBlock component usage in AdvancedCodeExamples ([ecfdc35](https://github.com/mineclover/context-action/commit/ecfdc352c8d076f32fcffcdde926587a2a24ad64))
* improve Store update method with Immer integration ([c9754d7](https://github.com/mineclover/context-action/commit/c9754d7c750c1abf70a3eef99504033ce089b439))
* improve Store update method with Immer integration ([0bce495](https://github.com/mineclover/context-action/commit/0bce49562ed323e52985917306e87385e9b64205))
* improve TypeDoc configuration clarity and prevent wrong location generation ([3afca1c](https://github.com/mineclover/context-action/commit/3afca1ce25511e29636e1448f061acc822a59e67))
* lint 경고 수정 - 사용하지 않는 cacheKey 변수 제거 ([a507727](https://github.com/mineclover/context-action/commit/a507727ec177f49d58106779953283723013929a))
* **llms-generator:** resolve TypeScript compilation errors ([6414ff3](https://github.com/mineclover/context-action/commit/6414ff3fec2a57b25ff9897fb8c7f4cdd23e78b4))
* React hooks 규칙 준수를 위한 PriorityTestHandlers 수정 ([12a9038](https://github.com/mineclover/context-action/commit/12a90388ba6a0d49a88d9cd9759bcb7939ad688a))
* **react:** adjust test expectations after refactoring ([78a4808](https://github.com/mineclover/context-action/commit/78a48084b254f59688e71f90419783cb30ecad1d))
* **react:** Enable Immer MapSet plugin for Set and Map support ([18d98e6](https://github.com/mineclover/context-action/commit/18d98e6e1cf9b7b9eeb3a1778c4a5ba61270c89d))
* **react:** export StoreManager for proper type inference in createStoreContext ([3433632](https://github.com/mineclover/context-action/commit/343363292beb920d13beda336cc5fade8d7684df))
* Resolve ActionRegister execution modes and improve error handling ([71d06bd](https://github.com/mineclover/context-action/commit/71d06bded76cd3ee197002e97d7bb5cc3ccb96ee))
* resolve all TypeScript errors and improve LogMonitor dependency handling ([06b3a6e](https://github.com/mineclover/context-action/commit/06b3a6e3bf3050b408a01dbfdaf63eae39cbac7f))
* resolve core and react package linting warnings ([fc0df76](https://github.com/mineclover/context-action/commit/fc0df76116c6f3de6acc9fc0845743e9e24f2aa2))
* Resolve failing test suites and improve test stability ([926510c](https://github.com/mineclover/context-action/commit/926510cad2fc5562a8c4d81156035282d44252fe))
* resolve memory leaks in test files by replacing clearAll() with destroy() ([097a010](https://github.com/mineclover/context-action/commit/097a010ae0572c64643e744c4a529a44f7cbbcb5))
* Resolve test memory issues and finalize async handler support ([b4a1666](https://github.com/mineclover/context-action/commit/b4a1666990e2e653e8791b960addff20b8fc3abe))
* resolve TypeScript strict mode compliance issues ([e4ef015](https://github.com/mineclover/context-action/commit/e4ef015c4c63835c790c8f181448197f8e595bab))
* TypeScript 타입 안전성 개선 - targetHandler undefined 체크 추가 ([5aa2691](https://github.com/mineclover/context-action/commit/5aa26916647c0ba659b3e432191e1b590b2ef3f4))
* update TypeScript configuration and enhance LogMonitor component ([c280d4f](https://github.com/mineclover/context-action/commit/c280d4ff4cedf44f28b91e612159bdca7c3a014e))


### Features

* 성능 테스트 중 버튼 비활성화 시각적 피드백 개선 ([b05002d](https://github.com/mineclover/context-action/commit/b05002d230e0ed18eb442ee129226cceedb848c0))
* Add backward jump support with infinite loop protection ([a0d133f](https://github.com/mineclover/context-action/commit/a0d133f28cf75c69ed70f92fdfbb48654e5b091b))
* Add comprehensive concurrency test coverage for concurrency.md ([79344e5](https://github.com/mineclover/context-action/commit/79344e57b15ee9e0a882cb65395bf419ecce2b0f))
* add Context-Layered Architecture section to documentation and navigation ([d655322](https://github.com/mineclover/context-action/commit/d655322b4fd8ff7c6a0f6d9642c4b879f85e319c))
* add SourceLink integration to core example pages ([7cc16b6](https://github.com/mineclover/context-action/commit/7cc16b6ee23a498e8ccd9f5b867b6529f3fb875d))
* Complete ActionRegister comprehensive test suite improvements ([fda402f](https://github.com/mineclover/context-action/commit/fda402fcc1f611ceed011363df2d1c26c20d8478))
* Context-Action 라이브러리 핵심 성능 및 안정성 개선 ([f13fe47](https://github.com/mineclover/context-action/commit/f13fe4756c7f1e39872aca7a45fec09f37da3c2c))
* **core:** enhance ActionRegister performance with optimized caching and pooling ([96fb72a](https://github.com/mineclover/context-action/commit/96fb72a61230cfd38963dc28b853d9ec6323175a))
* enhance Core Advanced page with comprehensive usage examples ([0878151](https://github.com/mineclover/context-action/commit/0878151730af4768907857a0fdec6116534080f1))
* Enhanced priority test interface with manual controls and Set support ([61957de](https://github.com/mineclover/context-action/commit/61957ded7320d737aca30e16dbeb722d5a0d2846))
* implement advanced unregister function management system ([1086a8a](https://github.com/mineclover/context-action/commit/1086a8abb3a8887df58fe80c1bb02854f0eed7b7))
* implement comprehensive SourceLink Registry system ([3d0dc69](https://github.com/mineclover/context-action/commit/3d0dc6983dfb778dd599e0e5c04df4b8a0fd83a7))
* implement Context-Layered Architecture with complete refactoring ([801fcfd](https://github.com/mineclover/context-action/commit/801fcfdd65f36cda7c3537d7cc49a9385c0c41bf))
* integrate LogMonitor with Flow Control and enhance Store conventions ([3086fef](https://github.com/mineclover/context-action/commit/3086fef8a74a9d92d5fdc89b50f98df628eb0a9e))
* integrate SourceLink Registry into app navigation ([ed1d283](https://github.com/mineclover/context-action/commit/ed1d2837e8378b4a35510f07c5416f37b05d5796))
* **LogMonitor:** implement MVVM architecture and enhance context management ([8e81732](https://github.com/mineclover/context-action/commit/8e817328cbdb1ec8741e0f50432c0e4d7421306d))
* major test improvements and ActionRegister enhancements ([670e426](https://github.com/mineclover/context-action/commit/670e4267d6509b1cd9c6dd048960245251af844f))
* modernize TypeScript configuration and fix dynamic imports ([725eef5](https://github.com/mineclover/context-action/commit/725eef5e02388e67103d94814935965e066f3e85))
* **performance-optimization:** add comprehensive performance optimization guides with varying character limits ([950dee2](https://github.com/mineclover/context-action/commit/950dee2d6d88b362898b803222ab5a7786d0ad00))
* **react:** consolidate test structure and fix TypeScript errors ([618ec8c](https://github.com/mineclover/context-action/commit/618ec8cbb2474964b249c0320cff69be373246f1))


### Performance Improvements

* 메모리 효율성을 위한 필터 캐시 시스템 비활성화 ([1c16221](https://github.com/mineclover/context-action/commit/1c1622100be5f52b37a6f8dfb45bb88766528f80))
* Optimize useComputedStore with useSyncExternalStore ([bbef3c6](https://github.com/mineclover/context-action/commit/bbef3c6b960ba9637cf7afb5cbdcda9f47dc7ae9))





## [0.7.3](https://github.com/mineclover/context-action/compare/v0.6.0...v0.7.3) (2025-09-16)


### Bug Fixes

* **ActionRegister:** enhance error handling and execution context management ([d32a1f6](https://github.com/mineclover/context-action/commit/d32a1f60858141db6dc7ff9bc72fa3056638c97f))
* convert Immer from dynamic to static imports for improved stability ([dde606f](https://github.com/mineclover/context-action/commit/dde606feee79f942d953a60b32164f11fc10b374))
* **core:** resolve test failures and improve ActionRegister reliability ([82925b9](https://github.com/mineclover/context-action/commit/82925b92f15f2f737d12885512521bc9cc41dff4))
* correct CodeBlock component usage in AdvancedCodeExamples ([ecfdc35](https://github.com/mineclover/context-action/commit/ecfdc352c8d076f32fcffcdde926587a2a24ad64))
* improve Store update method with Immer integration ([c9754d7](https://github.com/mineclover/context-action/commit/c9754d7c750c1abf70a3eef99504033ce089b439))
* improve Store update method with Immer integration ([0bce495](https://github.com/mineclover/context-action/commit/0bce49562ed323e52985917306e87385e9b64205))
* improve TypeDoc configuration clarity and prevent wrong location generation ([3afca1c](https://github.com/mineclover/context-action/commit/3afca1ce25511e29636e1448f061acc822a59e67))
* **llms-generator:** resolve TypeScript compilation errors ([6414ff3](https://github.com/mineclover/context-action/commit/6414ff3fec2a57b25ff9897fb8c7f4cdd23e78b4))
* **react:** adjust test expectations after refactoring ([78a4808](https://github.com/mineclover/context-action/commit/78a48084b254f59688e71f90419783cb30ecad1d))
* **react:** export StoreManager for proper type inference in createStoreContext ([3433632](https://github.com/mineclover/context-action/commit/343363292beb920d13beda336cc5fade8d7684df))
* resolve all TypeScript errors and improve LogMonitor dependency handling ([06b3a6e](https://github.com/mineclover/context-action/commit/06b3a6e3bf3050b408a01dbfdaf63eae39cbac7f))
* resolve core and react package linting warnings ([fc0df76](https://github.com/mineclover/context-action/commit/fc0df76116c6f3de6acc9fc0845743e9e24f2aa2))
* Resolve test memory issues and finalize async handler support ([b4a1666](https://github.com/mineclover/context-action/commit/b4a1666990e2e653e8791b960addff20b8fc3abe))
* resolve TypeScript strict mode compliance issues ([e4ef015](https://github.com/mineclover/context-action/commit/e4ef015c4c63835c790c8f181448197f8e595bab))
* update TypeScript configuration and enhance LogMonitor component ([c280d4f](https://github.com/mineclover/context-action/commit/c280d4ff4cedf44f28b91e612159bdca7c3a014e))


### Features

* Add comprehensive concurrency test coverage for concurrency.md ([79344e5](https://github.com/mineclover/context-action/commit/79344e57b15ee9e0a882cb65395bf419ecce2b0f))
* add Context-Layered Architecture section to documentation and navigation ([d655322](https://github.com/mineclover/context-action/commit/d655322b4fd8ff7c6a0f6d9642c4b879f85e319c))
* add SourceLink integration to core example pages ([7cc16b6](https://github.com/mineclover/context-action/commit/7cc16b6ee23a498e8ccd9f5b867b6529f3fb875d))
* Complete ActionRegister comprehensive test suite improvements ([fda402f](https://github.com/mineclover/context-action/commit/fda402fcc1f611ceed011363df2d1c26c20d8478))
* Context-Action 라이브러리 핵심 성능 및 안정성 개선 ([f13fe47](https://github.com/mineclover/context-action/commit/f13fe4756c7f1e39872aca7a45fec09f37da3c2c))
* **core:** enhance ActionRegister performance with optimized caching and pooling ([96fb72a](https://github.com/mineclover/context-action/commit/96fb72a61230cfd38963dc28b853d9ec6323175a))
* enhance Core Advanced page with comprehensive usage examples ([0878151](https://github.com/mineclover/context-action/commit/0878151730af4768907857a0fdec6116534080f1))
* implement advanced unregister function management system ([1086a8a](https://github.com/mineclover/context-action/commit/1086a8abb3a8887df58fe80c1bb02854f0eed7b7))
* implement comprehensive SourceLink Registry system ([3d0dc69](https://github.com/mineclover/context-action/commit/3d0dc6983dfb778dd599e0e5c04df4b8a0fd83a7))
* implement Context-Layered Architecture with complete refactoring ([801fcfd](https://github.com/mineclover/context-action/commit/801fcfdd65f36cda7c3537d7cc49a9385c0c41bf))
* integrate LogMonitor with Flow Control and enhance Store conventions ([3086fef](https://github.com/mineclover/context-action/commit/3086fef8a74a9d92d5fdc89b50f98df628eb0a9e))
* integrate SourceLink Registry into app navigation ([ed1d283](https://github.com/mineclover/context-action/commit/ed1d2837e8378b4a35510f07c5416f37b05d5796))
* **LogMonitor:** implement MVVM architecture and enhance context management ([8e81732](https://github.com/mineclover/context-action/commit/8e817328cbdb1ec8741e0f50432c0e4d7421306d))
* major test improvements and ActionRegister enhancements ([670e426](https://github.com/mineclover/context-action/commit/670e4267d6509b1cd9c6dd048960245251af844f))
* modernize TypeScript configuration and fix dynamic imports ([725eef5](https://github.com/mineclover/context-action/commit/725eef5e02388e67103d94814935965e066f3e85))
* **performance-optimization:** add comprehensive performance optimization guides with varying character limits ([950dee2](https://github.com/mineclover/context-action/commit/950dee2d6d88b362898b803222ab5a7786d0ad00))
* **react:** consolidate test structure and fix TypeScript errors ([618ec8c](https://github.com/mineclover/context-action/commit/618ec8cbb2474964b249c0320cff69be373246f1))


### Performance Improvements

* 메모리 효율성을 위한 필터 캐시 시스템 비활성화 ([1c16221](https://github.com/mineclover/context-action/commit/1c1622100be5f52b37a6f8dfb45bb88766528f80))





## [0.7.2](https://github.com/mineclover/context-action/compare/v0.6.0...v0.7.2) (2025-08-31)


### Bug Fixes

* **ActionRegister:** enhance error handling and execution context management ([d32a1f6](https://github.com/mineclover/context-action/commit/d32a1f60858141db6dc7ff9bc72fa3056638c97f))
* convert Immer from dynamic to static imports for improved stability ([dde606f](https://github.com/mineclover/context-action/commit/dde606feee79f942d953a60b32164f11fc10b374))
* **core:** resolve test failures and improve ActionRegister reliability ([82925b9](https://github.com/mineclover/context-action/commit/82925b92f15f2f737d12885512521bc9cc41dff4))
* correct CodeBlock component usage in AdvancedCodeExamples ([ecfdc35](https://github.com/mineclover/context-action/commit/ecfdc352c8d076f32fcffcdde926587a2a24ad64))
* improve Store update method with Immer integration ([c9754d7](https://github.com/mineclover/context-action/commit/c9754d7c750c1abf70a3eef99504033ce089b439))
* improve Store update method with Immer integration ([0bce495](https://github.com/mineclover/context-action/commit/0bce49562ed323e52985917306e87385e9b64205))
* improve TypeDoc configuration clarity and prevent wrong location generation ([3afca1c](https://github.com/mineclover/context-action/commit/3afca1ce25511e29636e1448f061acc822a59e67))
* **react:** adjust test expectations after refactoring ([78a4808](https://github.com/mineclover/context-action/commit/78a48084b254f59688e71f90419783cb30ecad1d))
* **react:** export StoreManager for proper type inference in createStoreContext ([3433632](https://github.com/mineclover/context-action/commit/343363292beb920d13beda336cc5fade8d7684df))
* resolve all TypeScript errors and improve LogMonitor dependency handling ([06b3a6e](https://github.com/mineclover/context-action/commit/06b3a6e3bf3050b408a01dbfdaf63eae39cbac7f))
* resolve core and react package linting warnings ([fc0df76](https://github.com/mineclover/context-action/commit/fc0df76116c6f3de6acc9fc0845743e9e24f2aa2))
* resolve TypeScript strict mode compliance issues ([e4ef015](https://github.com/mineclover/context-action/commit/e4ef015c4c63835c790c8f181448197f8e595bab))
* update TypeScript configuration and enhance LogMonitor component ([c280d4f](https://github.com/mineclover/context-action/commit/c280d4ff4cedf44f28b91e612159bdca7c3a014e))


### Features

* add Context-Layered Architecture section to documentation and navigation ([d655322](https://github.com/mineclover/context-action/commit/d655322b4fd8ff7c6a0f6d9642c4b879f85e319c))
* add SourceLink integration to core example pages ([7cc16b6](https://github.com/mineclover/context-action/commit/7cc16b6ee23a498e8ccd9f5b867b6529f3fb875d))
* Complete ActionRegister comprehensive test suite improvements ([fda402f](https://github.com/mineclover/context-action/commit/fda402fcc1f611ceed011363df2d1c26c20d8478))
* Context-Action 라이브러리 핵심 성능 및 안정성 개선 ([f13fe47](https://github.com/mineclover/context-action/commit/f13fe4756c7f1e39872aca7a45fec09f37da3c2c))
* **core:** enhance ActionRegister performance with optimized caching and pooling ([96fb72a](https://github.com/mineclover/context-action/commit/96fb72a61230cfd38963dc28b853d9ec6323175a))
* enhance Core Advanced page with comprehensive usage examples ([0878151](https://github.com/mineclover/context-action/commit/0878151730af4768907857a0fdec6116534080f1))
* implement advanced unregister function management system ([1086a8a](https://github.com/mineclover/context-action/commit/1086a8abb3a8887df58fe80c1bb02854f0eed7b7))
* implement comprehensive SourceLink Registry system ([3d0dc69](https://github.com/mineclover/context-action/commit/3d0dc6983dfb778dd599e0e5c04df4b8a0fd83a7))
* implement Context-Layered Architecture with complete refactoring ([801fcfd](https://github.com/mineclover/context-action/commit/801fcfdd65f36cda7c3537d7cc49a9385c0c41bf))
* integrate LogMonitor with Flow Control and enhance Store conventions ([3086fef](https://github.com/mineclover/context-action/commit/3086fef8a74a9d92d5fdc89b50f98df628eb0a9e))
* integrate SourceLink Registry into app navigation ([ed1d283](https://github.com/mineclover/context-action/commit/ed1d2837e8378b4a35510f07c5416f37b05d5796))
* **LogMonitor:** implement MVVM architecture and enhance context management ([8e81732](https://github.com/mineclover/context-action/commit/8e817328cbdb1ec8741e0f50432c0e4d7421306d))
* major test improvements and ActionRegister enhancements ([670e426](https://github.com/mineclover/context-action/commit/670e4267d6509b1cd9c6dd048960245251af844f))
* modernize TypeScript configuration and fix dynamic imports ([725eef5](https://github.com/mineclover/context-action/commit/725eef5e02388e67103d94814935965e066f3e85))
* **performance-optimization:** add comprehensive performance optimization guides with varying character limits ([950dee2](https://github.com/mineclover/context-action/commit/950dee2d6d88b362898b803222ab5a7786d0ad00))
* **react:** consolidate test structure and fix TypeScript errors ([618ec8c](https://github.com/mineclover/context-action/commit/618ec8cbb2474964b249c0320cff69be373246f1))





## [0.7.1](https://github.com/mineclover/context-action/compare/v0.6.0...v0.7.1) (2025-08-31)


### Bug Fixes

* **ActionRegister:** enhance error handling and execution context management ([d32a1f6](https://github.com/mineclover/context-action/commit/d32a1f60858141db6dc7ff9bc72fa3056638c97f))
* convert Immer from dynamic to static imports for improved stability ([dde606f](https://github.com/mineclover/context-action/commit/dde606feee79f942d953a60b32164f11fc10b374))
* **core:** resolve test failures and improve ActionRegister reliability ([82925b9](https://github.com/mineclover/context-action/commit/82925b92f15f2f737d12885512521bc9cc41dff4))
* correct CodeBlock component usage in AdvancedCodeExamples ([ecfdc35](https://github.com/mineclover/context-action/commit/ecfdc352c8d076f32fcffcdde926587a2a24ad64))
* improve Store update method with Immer integration ([c9754d7](https://github.com/mineclover/context-action/commit/c9754d7c750c1abf70a3eef99504033ce089b439))
* improve Store update method with Immer integration ([0bce495](https://github.com/mineclover/context-action/commit/0bce49562ed323e52985917306e87385e9b64205))
* improve TypeDoc configuration clarity and prevent wrong location generation ([3afca1c](https://github.com/mineclover/context-action/commit/3afca1ce25511e29636e1448f061acc822a59e67))
* **react:** adjust test expectations after refactoring ([78a4808](https://github.com/mineclover/context-action/commit/78a48084b254f59688e71f90419783cb30ecad1d))
* **react:** export StoreManager for proper type inference in createStoreContext ([3433632](https://github.com/mineclover/context-action/commit/343363292beb920d13beda336cc5fade8d7684df))
* resolve all TypeScript errors and improve LogMonitor dependency handling ([06b3a6e](https://github.com/mineclover/context-action/commit/06b3a6e3bf3050b408a01dbfdaf63eae39cbac7f))
* resolve TypeScript strict mode compliance issues ([e4ef015](https://github.com/mineclover/context-action/commit/e4ef015c4c63835c790c8f181448197f8e595bab))
* update TypeScript configuration and enhance LogMonitor component ([c280d4f](https://github.com/mineclover/context-action/commit/c280d4ff4cedf44f28b91e612159bdca7c3a014e))


### Features

* add Context-Layered Architecture section to documentation and navigation ([d655322](https://github.com/mineclover/context-action/commit/d655322b4fd8ff7c6a0f6d9642c4b879f85e319c))
* add SourceLink integration to core example pages ([7cc16b6](https://github.com/mineclover/context-action/commit/7cc16b6ee23a498e8ccd9f5b867b6529f3fb875d))
* Complete ActionRegister comprehensive test suite improvements ([fda402f](https://github.com/mineclover/context-action/commit/fda402fcc1f611ceed011363df2d1c26c20d8478))
* Context-Action 라이브러리 핵심 성능 및 안정성 개선 ([f13fe47](https://github.com/mineclover/context-action/commit/f13fe4756c7f1e39872aca7a45fec09f37da3c2c))
* **core:** enhance ActionRegister performance with optimized caching and pooling ([96fb72a](https://github.com/mineclover/context-action/commit/96fb72a61230cfd38963dc28b853d9ec6323175a))
* enhance Core Advanced page with comprehensive usage examples ([0878151](https://github.com/mineclover/context-action/commit/0878151730af4768907857a0fdec6116534080f1))
* implement advanced unregister function management system ([1086a8a](https://github.com/mineclover/context-action/commit/1086a8abb3a8887df58fe80c1bb02854f0eed7b7))
* implement comprehensive SourceLink Registry system ([3d0dc69](https://github.com/mineclover/context-action/commit/3d0dc6983dfb778dd599e0e5c04df4b8a0fd83a7))
* implement Context-Layered Architecture with complete refactoring ([801fcfd](https://github.com/mineclover/context-action/commit/801fcfdd65f36cda7c3537d7cc49a9385c0c41bf))
* integrate SourceLink Registry into app navigation ([ed1d283](https://github.com/mineclover/context-action/commit/ed1d2837e8378b4a35510f07c5416f37b05d5796))
* **LogMonitor:** implement MVVM architecture and enhance context management ([8e81732](https://github.com/mineclover/context-action/commit/8e817328cbdb1ec8741e0f50432c0e4d7421306d))
* major test improvements and ActionRegister enhancements ([670e426](https://github.com/mineclover/context-action/commit/670e4267d6509b1cd9c6dd048960245251af844f))
* modernize TypeScript configuration and fix dynamic imports ([725eef5](https://github.com/mineclover/context-action/commit/725eef5e02388e67103d94814935965e066f3e85))
* **performance-optimization:** add comprehensive performance optimization guides with varying character limits ([950dee2](https://github.com/mineclover/context-action/commit/950dee2d6d88b362898b803222ab5a7786d0ad00))
* **react:** consolidate test structure and fix TypeScript errors ([618ec8c](https://github.com/mineclover/context-action/commit/618ec8cbb2474964b249c0320cff69be373246f1))





# [0.7.0](https://github.com/mineclover/context-action/compare/v0.6.0...v0.7.0) (2025-08-31)


### Bug Fixes

* **ActionRegister:** enhance error handling and execution context management ([d32a1f6](https://github.com/mineclover/context-action/commit/d32a1f60858141db6dc7ff9bc72fa3056638c97f))
* convert Immer from dynamic to static imports for improved stability ([dde606f](https://github.com/mineclover/context-action/commit/dde606feee79f942d953a60b32164f11fc10b374))
* **core:** resolve test failures and improve ActionRegister reliability ([82925b9](https://github.com/mineclover/context-action/commit/82925b92f15f2f737d12885512521bc9cc41dff4))
* correct CodeBlock component usage in AdvancedCodeExamples ([ecfdc35](https://github.com/mineclover/context-action/commit/ecfdc352c8d076f32fcffcdde926587a2a24ad64))
* improve Store update method with Immer integration ([c9754d7](https://github.com/mineclover/context-action/commit/c9754d7c750c1abf70a3eef99504033ce089b439))
* improve Store update method with Immer integration ([0bce495](https://github.com/mineclover/context-action/commit/0bce49562ed323e52985917306e87385e9b64205))
* **react:** export StoreManager for proper type inference in createStoreContext ([3433632](https://github.com/mineclover/context-action/commit/343363292beb920d13beda336cc5fade8d7684df))
* resolve all TypeScript errors and improve LogMonitor dependency handling ([06b3a6e](https://github.com/mineclover/context-action/commit/06b3a6e3bf3050b408a01dbfdaf63eae39cbac7f))
* resolve TypeScript strict mode compliance issues ([e4ef015](https://github.com/mineclover/context-action/commit/e4ef015c4c63835c790c8f181448197f8e595bab))
* update TypeScript configuration and enhance LogMonitor component ([c280d4f](https://github.com/mineclover/context-action/commit/c280d4ff4cedf44f28b91e612159bdca7c3a014e))


### Features

* add Context-Layered Architecture section to documentation and navigation ([d655322](https://github.com/mineclover/context-action/commit/d655322b4fd8ff7c6a0f6d9642c4b879f85e319c))
* add SourceLink integration to core example pages ([7cc16b6](https://github.com/mineclover/context-action/commit/7cc16b6ee23a498e8ccd9f5b867b6529f3fb875d))
* Complete ActionRegister comprehensive test suite improvements ([fda402f](https://github.com/mineclover/context-action/commit/fda402fcc1f611ceed011363df2d1c26c20d8478))
* Context-Action 라이브러리 핵심 성능 및 안정성 개선 ([f13fe47](https://github.com/mineclover/context-action/commit/f13fe4756c7f1e39872aca7a45fec09f37da3c2c))
* **core:** enhance ActionRegister performance with optimized caching and pooling ([96fb72a](https://github.com/mineclover/context-action/commit/96fb72a61230cfd38963dc28b853d9ec6323175a))
* enhance Core Advanced page with comprehensive usage examples ([0878151](https://github.com/mineclover/context-action/commit/0878151730af4768907857a0fdec6116534080f1))
* implement advanced unregister function management system ([1086a8a](https://github.com/mineclover/context-action/commit/1086a8abb3a8887df58fe80c1bb02854f0eed7b7))
* implement comprehensive SourceLink Registry system ([3d0dc69](https://github.com/mineclover/context-action/commit/3d0dc6983dfb778dd599e0e5c04df4b8a0fd83a7))
* implement Context-Layered Architecture with complete refactoring ([801fcfd](https://github.com/mineclover/context-action/commit/801fcfdd65f36cda7c3537d7cc49a9385c0c41bf))
* integrate SourceLink Registry into app navigation ([ed1d283](https://github.com/mineclover/context-action/commit/ed1d2837e8378b4a35510f07c5416f37b05d5796))
* **LogMonitor:** implement MVVM architecture and enhance context management ([8e81732](https://github.com/mineclover/context-action/commit/8e817328cbdb1ec8741e0f50432c0e4d7421306d))
* major test improvements and ActionRegister enhancements ([670e426](https://github.com/mineclover/context-action/commit/670e4267d6509b1cd9c6dd048960245251af844f))
* modernize TypeScript configuration and fix dynamic imports ([725eef5](https://github.com/mineclover/context-action/commit/725eef5e02388e67103d94814935965e066f3e85))
* **performance-optimization:** add comprehensive performance optimization guides with varying character limits ([950dee2](https://github.com/mineclover/context-action/commit/950dee2d6d88b362898b803222ab5a7786d0ad00))
* **react:** consolidate test structure and fix TypeScript errors ([618ec8c](https://github.com/mineclover/context-action/commit/618ec8cbb2474964b249c0320cff69be373246f1))





# [0.6.0](https://github.com/mineclover/context-action/compare/v0.5.1...v0.6.0) (2025-08-29)


### Bug Fixes

* **docs:** enhance redirection script for improved user experience ([ef4f401](https://github.com/mineclover/context-action/commit/ef4f4016e6dc0ef52dedde5c6c2ce60b3d6f165a))
* **example:** resolve TypeScript type errors and improve mouse events demo ([717194f](https://github.com/mineclover/context-action/commit/717194f9c624d767bfcd89cc51916453b7fd8a7d))
* **llms-generator:** complete test path updates for language-specific directory structure ([29ffcd8](https://github.com/mineclover/context-action/commit/29ffcd8a50b310ddf3ad787c81bdbaf6f0b0f442))
* **llms-generator:** restore language-specific directory structure ([276058e](https://github.com/mineclover/context-action/commit/276058e2aec6518fb88df307ae94d74a4b5a7d7d))
* **llms-generator:** update test file paths to match new output structure ([43da9f1](https://github.com/mineclover/context-action/commit/43da9f181e1e94f06041b2b4f9a7a357ae955ac3))
* **llms-generator:** update test paths to match language-specific directory structure ([6f5c482](https://github.com/mineclover/context-action/commit/6f5c482d67ab32dc971c3b2ac61382b03521be51))
* replace lucide-react with emojis in ActionGuard refactored pages ([393adf5](https://github.com/mineclover/context-action/commit/393adf5a0f87c86a7ecbff0c310eb412d8354c75))
* resolve ActionGuard handler visualization and fix SearchPageRefactored TypeScript errors ([80ea9fb](https://github.com/mineclover/context-action/commit/80ea9fbfa22f4c39ea8182dddb155eb8b337c9b9))
* resolve React 18 infinite loop in store subscriptions and ref mount state ([fa652e3](https://github.com/mineclover/context-action/commit/fa652e3018a3e63bf3c1fd2b9564a1cf17f59e6a))


### Features

* **actionguard:** refactor pages with sophisticated template convention ([a0d5556](https://github.com/mineclover/context-action/commit/a0d555626f3659d3b267e627c9895be9fa2cc467))
* **ci:** add check-changes job to optimize deployment process ([f72f44f](https://github.com/mineclover/context-action/commit/f72f44f56d1c37f7e7f918f597631c698b8543b1))
* **core:** enhance RefContext and Store for selective subscription patterns ([01a4491](https://github.com/mineclover/context-action/commit/01a4491d4c1e52b744162c299206b71c6a0532e3))
* **docs:** add Selective Subscription Patterns concept guide ([3c34e42](https://github.com/mineclover/context-action/commit/3c34e4261d3add250cf05ccf3ae2b042057ad73d))
* **docs:** integrate selective subscription patterns across documentation ([0691430](https://github.com/mineclover/context-action/commit/0691430d6c7512b1aa4b0ae5156417c67e49daa4))
* **example:** add non-reactive components for selective subscription demo ([2197842](https://github.com/mineclover/context-action/commit/21978421156dccda166403bdb9e2678feccf048b))
* **example:** add Non-Reactive Context Store page and update navigation ([f82217b](https://github.com/mineclover/context-action/commit/f82217b188f9c314b7133e91c13f5580d63bc7e9))
* **example:** enhance Enhanced Context Store with selective subscription patterns ([fcf1b11](https://github.com/mineclover/context-action/commit/fcf1b117e91e39fa6cf23bbb968c1f897b96e9db))
* **example:** implement non-reactive hooks for selective subscription patterns ([ae2862d](https://github.com/mineclover/context-action/commit/ae2862dd98def67077679bb9c90b6c0c71cefd07))
* **example:** update app navigation for selective subscription patterns ([e213050](https://github.com/mineclover/context-action/commit/e213050ade37ee93cd04d48276a8203347efee53))
* **example:** update MouseEvents context for selective subscription support ([f385653](https://github.com/mineclover/context-action/commit/f3856539b86dabbdbba96cf4e07889a44d49a02e))
* **llms-generator:** add comprehensive multiple category support with tests ([e24c3b8](https://github.com/mineclover/context-action/commit/e24c3b8531a7dd59d8a8dacbc93780b6585be576))
* **memoization:** add performance comparison section with new pages and components ([926eb82](https://github.com/mineclover/context-action/commit/926eb8238521237289b5f12493ddd44778b3f8f6))
* **mouse-events:** refactor ActionGuard page with sophisticated visualization ([5c28e43](https://github.com/mineclover/context-action/commit/5c28e43a958761cb66ff1c4f1af484fdb171832f))
* **performance:** enhance performance section with new pages and components ([b37481e](https://github.com/mineclover/context-action/commit/b37481ec09e24693859e65e254880bb1f70faa0d))
* **refs:** add RefContext mount state subscription capabilities ([695a456](https://github.com/mineclover/context-action/commit/695a456911b308a4bb696b61b9236d665912f595))
* VitePress에서 /example/* 경로 리디렉션 개선 ([7a9bcf0](https://github.com/mineclover/context-action/commit/7a9bcf0ef994bce905fb73269c549a9f98c5c323))





## [0.5.1](https://github.com/mineclover/context-action/compare/v0.5.0...v0.5.1) (2025-08-28)


### Bug Fixes

* **build:** resolve HTML template and dynamic import issues ([5e73d73](https://github.com/mineclover/context-action/commit/5e73d733dfe1e4d7d6ec25727e9056ff4de2ec3c))





# [0.5.0](https://github.com/mineclover/context-action/compare/v0.4.0...v0.5.0) (2025-08-28)


### Bug Fixes

* apply Dependabot updates and resolve pnpm/React compatibility issues ([f494532](https://github.com/mineclover/context-action/commit/f49453287c9aa2f1df5fe54fb38a42727f831f67)), closes [#17](https://github.com/mineclover/context-action/issues/17)
* correct error handling test expectations for non-blocking handlers ([85a2538](https://github.com/mineclover/context-action/commit/85a2538eb8ccb9ec33c19ca6330d3d47592fa6f4))
* **demo:** resolve memoization counter closure issue with useRef ([ab879dc](https://github.com/mineclover/context-action/commit/ab879dc041f303e0c9976bad99ab0f2e8b33d6be))
* **docs:** clarify per-store Immer and comparison scope ([89b71b7](https://github.com/mineclover/context-action/commit/89b71b7c461bfb1ef37ed92748e1d0c19067070f))
* improve lint configuration without eslint-disable comments ([e74a160](https://github.com/mineclover/context-action/commit/e74a160cb64aac3875d74bf466a0a1c3328621bc))
* maintain React 18.3 compatibility across all packages ([388a53a](https://github.com/mineclover/context-action/commit/388a53aefdffb4141e5d658c7aa5a79f76a40abd))
* maintain React 18.3 compatibility and consolidate Dependabot updates ([9cbef8f](https://github.com/mineclover/context-action/commit/9cbef8fd99bdb880bc4f1fc67e1a7a2a771d7963))
* pnpm ci build error ([cd29610](https://github.com/mineclover/context-action/commit/cd29610863c18ec5a372f0f633e3a4dbc5a0354b))
* **react:** export error handling and DevTools modules ([c7443ad](https://github.com/mineclover/context-action/commit/c7443ad2a8d598770f29df1e53af18e8fb08331b))
* remove non-existent routing links from CoreConceptsOverview ([1ecccce](https://github.com/mineclover/context-action/commit/1ecccce18c60ed6e045d8e03789ed0235dfeec29))
* resolve all 16 FillTemplatesCommand test failures ([ccb69bd](https://github.com/mineclover/context-action/commit/ccb69bdbd7168222c7f433a15db994de1bb4645e))
* resolve all 24 SimpleLLMSCommand test failures ([8e05f99](https://github.com/mineclover/context-action/commit/8e05f993a00a4a08151eb938ef73fe10a9033296))
* resolve infinite toast loops and chat demo performance issues ([f85bf65](https://github.com/mineclover/context-action/commit/f85bf65abe319e84177835269f99744f767bea29))
* resolve lint errors for CI/CD ([a5dd247](https://github.com/mineclover/context-action/commit/a5dd247a5f80168f0681da025f8dfdb1be345336))
* resolve pnpm setup error in GitHub Actions ([e2811be](https://github.com/mineclover/context-action/commit/e2811be579de97a60b7bd51dc81f4f1b9e4ea3f4))
* resolve TailwindCSS v4 errors by downgrading to stable v3.4.15 ([b9fdbc6](https://github.com/mineclover/context-action/commit/b9fdbc636ce55219be83814854d428929aad3664))
* resolve type inconsistencies and improve code quality in packages/react ([303829f](https://github.com/mineclover/context-action/commit/303829faedbfe276d88512236612e8e49daeb916))
* update pnpm-lock.yaml and GitHub Actions workflow for TailwindCSS compatibility ([3b3ddf8](https://github.com/mineclover/context-action/commit/3b3ddf84d09455c392f665363b7ced2c9eddf202))
* update PriorityManagerCommand tests for new type interfaces ([5207865](https://github.com/mineclover/context-action/commit/52078650bdc50569d8f0a4ea35c98eb13ba1cbe9))
* update React and React-DOM versions to 18.3.1 and adjust pnpm setup ([d988403](https://github.com/mineclover/context-action/commit/d9884033a5e13384bc9f1ad40cdb64c66fb1a250))


### Features

* **actionguard:** enhance performance tracking with Context-Action framework ([106b548](https://github.com/mineclover/context-action/commit/106b548befcd0d62dbc9a1716619b40833ba090c))
* **canvas:** optimize store subscriptions and add selector tracking ([2cba895](https://github.com/mineclover/context-action/commit/2cba89585b7ef9c674cd964fe156ad3cdb93781f))
* comprehensive React library improvements and LLMS code documentation ([7c96735](https://github.com/mineclover/context-action/commit/7c967357c3571c435a66bdae174c7ca29678842b))
* **core:** implement v0.4.1 performance and architecture improvements ([e86e22b](https://github.com/mineclover/context-action/commit/e86e22b1649388d64762a22bb59d7b03c77bfd6b))
* **demo:** add blocking vs non-blocking waitForRefs comparison ([bc63015](https://github.com/mineclover/context-action/commit/bc6301549cb49110d3cab5672e7dc71d9bb5a6fd))
* **demo:** enhance RefContext pattern demos with comprehensive mount/unmount controls ([8baf3e3](https://github.com/mineclover/context-action/commit/8baf3e3663eca4e841b26c913a33c608f2d28c3f))
* **docs:** comprehensive immer and comparison integration documentation ([a5f271d](https://github.com/mineclover/context-action/commit/a5f271d199d3145d0164a221271def342d9183a7))
* **docs:** split store performance patterns into focused single-concept documents ([cbce6b6](https://github.com/mineclover/context-action/commit/cbce6b62d0ba181ca2f97380da7b5a75a337079f))
* enhance UI components and improve data handling ([9a91959](https://github.com/mineclover/context-action/commit/9a9195976012629d6eec3ec75ffd616a8821a66b))
* **example:** comprehensive error handling system demonstrations ([518aeba](https://github.com/mineclover/context-action/commit/518aeba2e73745906f7c08bb6bc94e5ef86e4662))
* implement RefContext onMount and executeIfMounted patterns ([f00b99f](https://github.com/mineclover/context-action/commit/f00b99f66a42b41362d7fd44adab9c744d7e73ba))
* **llms:** enhance pattern documentation priority.json files with code-focused structure ([1a9b384](https://github.com/mineclover/context-action/commit/1a9b384598ad5ab3d8e47864cff73c3f5fe01a63))
* migrate React context patterns to Context-Action framework ([300c0e4](https://github.com/mineclover/context-action/commit/300c0e4ed62bbf3e11dd54755c221b9394e7053c))
* **react:** add memoization test demo for RefContext lazy evaluation ([c9d712c](https://github.com/mineclover/context-action/commit/c9d712c2f1068c20b09dc232ce374c9b66ba4ba7))
* **react:** comprehensive package enhancements with zero lint warnings ([a71af3c](https://github.com/mineclover/context-action/commit/a71af3c4dd781136f912f91bae90d1279b6f5096))
* **react:** comprehensive testing utilities, DevTools, and error handling systems ([9560c75](https://github.com/mineclover/context-action/commit/9560c752ab46962a16fdd3ff2284e383494c4e5a))
* **react:** enhance ActionContext with optimized dispatch and handler patterns ([49c94dc](https://github.com/mineclover/context-action/commit/49c94dc28237d572670b3b4855acceeee295f47c))
* **react:** enhance ref patterns and store components with new hook utilities ([42486a5](https://github.com/mineclover/context-action/commit/42486a55d5f2bb2cb01f937f2c3c3cce89b69c1c))
* **react:** optimize bundle size with selective loading and tree-shaking ([af6f7b4](https://github.com/mineclover/context-action/commit/af6f7b43e3575c9006e6118c13dd183c3be325e1))
* replace complex immutability system with Immer for enhanced performance ([059e0c9](https://github.com/mineclover/context-action/commit/059e0c942a2bd8900ce94778179452eed041e22f))
* **tests:** add comprehensive test management system ([70ec8bb](https://github.com/mineclover/context-action/commit/70ec8bbef6e6bbe301d3d0e1aede745f08a39da9))





# [0.4.0](https://github.com/mineclover/context-action/compare/v0.3.1...v0.4.0) (2025-08-26)


### Bug Fixes

* add LogMonitorProvider to FlowControlPlaygroundPage ([5dd0c25](https://github.com/mineclover/context-action/commit/5dd0c25dc0445c3be14a4756179557f664a2f06e))
* prevent infinite handler re-registration in useFlowControlDemo ([85107e2](https://github.com/mineclover/context-action/commit/85107e2a34f2e45c262868e3cd29648bf436bb7e))
* remove unused deprecated code and fix LLMS generator test ([315b163](https://github.com/mineclover/context-action/commit/315b163fa452ae86c8859166687f6d33d4f5c6d3))
* resolve action-guard page rendering issues and add missing UI components ([98700d1](https://github.com/mineclover/context-action/commit/98700d1f5525d7a3b52c91df31d55a3ea7c6e41f))
* resolve critical documentation issues identified in verification ([f30e7b4](https://github.com/mineclover/context-action/commit/f30e7b4be08f50fa0e562ad19ea2ff8b4ad9d426))
* resolve existing TypeScript compilation errors ([a92b76d](https://github.com/mineclover/context-action/commit/a92b76d52a394dfb0982b7d0c461d8e940201b45))
* resolve infinite loop in priority jump and add comprehensive security scenarios ([f1bc268](https://github.com/mineclover/context-action/commit/f1bc268ea2431a0200e49934a36b1bb280a0d13b))
* resolve LLMS documentation system mismatches and restore data integrity ([949298c](https://github.com/mineclover/context-action/commit/949298c90d2801f4d7033ab2c32b6ebeaf1fdae4))
* resolve major lint errors ([c36751a](https://github.com/mineclover/context-action/commit/c36751a439f8f3f1bf5e3570f4ef46624dd2ce96))
* resolve VitePress Vue compiler error with TSX code blocks ([ea34107](https://github.com/mineclover/context-action/commit/ea34107d7177222f52e3a6895e7760bb40336f87))
* update llms-generator mismatch report ([205b40c](https://github.com/mineclover/context-action/commit/205b40cf5268716e50c9b76ae1e7303cff1f10d0))


### Features

* **actionguard:** add conditional patterns to navigation ([398acee](https://github.com/mineclover/context-action/commit/398aceec17d9c1ff1081251fd9a60fcfaf301e04))
* Add comprehensive CLI test suites for LLMS Generator ([a774b0f](https://github.com/mineclover/context-action/commit/a774b0fd36c78bf58def91bc678bd9d1be332314))
* add comprehensive documentation for Context-Action framework ([2ee3948](https://github.com/mineclover/context-action/commit/2ee3948118721cd0b633bc71f6d5884808970306))
* add comprehensive pattern examples with async, action, and store implementations ([6820a26](https://github.com/mineclover/context-action/commit/6820a266d0ca298f5172c15a80a73e1fcb82f38f))
* add comprehensive refactoring execution plan and automation scripts ([ed55982](https://github.com/mineclover/context-action/commit/ed55982d599bfacc76f03b4af24455ec0cb70299))
* add Flow Control Playground to sidebar navigation ([eadfd29](https://github.com/mineclover/context-action/commit/eadfd293022d5838deaa230c60cc086f56e334cb))
* add mismatch detection system and enhance post-commit hook ([a157dbc](https://github.com/mineclover/context-action/commit/a157dbcd9087a3295f0add9937de91e4adf8bf4b))
* add mount timeout options to createRefContext ([0266f02](https://github.com/mineclover/context-action/commit/0266f024abe0b3265cb86411cf2118cb0749ce2a))
* **architecture:** implement feature-based directory structure ([55a612a](https://github.com/mineclover/context-action/commit/55a612ab8a8608305537e2a04757aa6001673aec))
* cleanup core pages and fix selector infinite loops ([641b03d](https://github.com/mineclover/context-action/commit/641b03d2b06c806bd062f546ea4f4dd0e38c340f))
* cleanup legacy interfaces and fix lint errors ([ba7b2ed](https://github.com/mineclover/context-action/commit/ba7b2edd6d913e924fcd0dcd24399977042f9f5c))
* complete Korean translation of patterns documentation ([3b47308](https://github.com/mineclover/context-action/commit/3b4730813ad308c5c8397baeb08a2aa368ef6801))
* comprehensive dead code cleanup via parallel sub-agents ([5277475](https://github.com/mineclover/context-action/commit/527747507cee630c7b9530906f10e2587d0d9dc7))
* **conditional-patterns:** implement comprehensive conditional execution patterns ([b560cfa](https://github.com/mineclover/context-action/commit/b560cfa46b76347d706caa40b38927b4237330bc))
* consolidate ActionContext implementations and reorganize documentation ([b621f50](https://github.com/mineclover/context-action/commit/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65))
* enhance task prompt documentation and introduce Context-Action comparison ([9af7bdd](https://github.com/mineclover/context-action/commit/9af7bddeba385bba2191275f9cc62b75ea284ee5))
* enhance type inference system for createRefContext ([63e2521](https://github.com/mineclover/context-action/commit/63e2521ce0eaf531ba2602b8416661d9993558c4))
* implement conditional execution demo and migrate to static imports ([3680e5a](https://github.com/mineclover/context-action/commit/3680e5ac4bbaf53a747c86c583155283af7629cb))
* implement modular domain-driven architecture with MVVM patterns ([6a77791](https://github.com/mineclover/context-action/commit/6a77791cab77500b0696f4ef53c0e2a24ea64b00))
* modularize FlowControlPlaygroundPage for better maintainability ([31ee447](https://github.com/mineclover/context-action/commit/31ee447ef52c339cdefee58c74a28bfef38069c5))
* modularize Priority Management Demo with comprehensive architecture ([cca0c13](https://github.com/mineclover/context-action/commit/cca0c13ec5b4c71c0a354924aba4bb5a011fe0a8))
* **navigation:** implement comprehensive overview page system ([7522298](https://github.com/mineclover/context-action/commit/75222981984fb8c6194cf0b1b5e1053874788138))
* remove legacy pages and improve ActionHandler types ([b5f4732](https://github.com/mineclover/context-action/commit/b5f473252d647a2769fc220c12e5e3ab0cd9288e))
* **routing:** update imports to use feature-based structure ([a8366c5](https://github.com/mineclover/context-action/commit/a8366c565e0f507a9731a74fb6bff258aac9fd09))
* **ui:** add conditional patterns category support ([c9b82dd](https://github.com/mineclover/context-action/commit/c9b82dd6765767ff95785721feaae91c7a9c13a2))





## [0.3.1](https://github.com/mineclover/context-action/compare/v0.2.1...v0.3.1) (2025-08-21)


### Bug Fixes

* add error parameter to catch blocks in llms-generator commands ([18cff4b](https://github.com/mineclover/context-action/commit/18cff4bd8e2c64a5a9a38dc2f2876714bbd883ed))
* **build:** resolve llms-generator build issues and dependencies ([44ca184](https://github.com/mineclover/context-action/commit/44ca1847bd9942c7fe13b02d961cc6f8eb0e8509))
* **ci:** resolve CI/CD dependency installation errors ([675641f](https://github.com/mineclover/context-action/commit/675641f814d63d639cfa375f5e8debe134828762))
* **ci:** standardize tsdown version across all packages ([714ab1d](https://github.com/mineclover/context-action/commit/714ab1d7f8005096f7abe2f09d8067f500168a3a))
* comprehensive RefStore DOM element handling improvements ([23844d7](https://github.com/mineclover/context-action/commit/23844d700dcbc737e3c0961c662be72220d4df05))
* **core,react:** improve code quality and security across packages ([e7baf2f](https://github.com/mineclover/context-action/commit/e7baf2fb8bf49bc5ae0b3f92efbf567fb5d2da09))
* correct priority.json file naming ([d617125](https://github.com/mineclover/context-action/commit/d617125fc7a1ef05286ad34fd37ff21bf68b1371))
* **dependabot:** resolve schema validation errors and improve configuration ([07e15d5](https://github.com/mineclover/context-action/commit/07e15d5dfa6fec9f503c02a35480faca8bf69dd3))
* **deps:** update tsdown and resolve build dependency issues ([100008a](https://github.com/mineclover/context-action/commit/100008ae67794750ab4839d3476c300275e464ca))
* enhance non-cloneable object detection in immutable utils ([0bd7f55](https://github.com/mineclover/context-action/commit/0bd7f5511d8a588970196b000ab33e2dbaa0ff50))
* **example:** resolve TypeScript and lint errors in example application ([732498d](https://github.com/mineclover/context-action/commit/732498db704403d0f38e55656bb91b8717a8cb6c))
* improve code quality and resolve TypeScript/lint issues ([0afcba8](https://github.com/mineclover/context-action/commit/0afcba8a8723d45770c7bdb7cc13060d7e80dd62))
* improve GitHub Actions workflow and disable auto-trigger ([15b0aa6](https://github.com/mineclover/context-action/commit/15b0aa6a7456c268c94cfe864394d0aeefe3e1ea))
* **llms-generator:** resolve linting issues by adding eslint config and temporarily disabling problematic checks ([1d6cead](https://github.com/mineclover/context-action/commit/1d6cead48821f6cc26a8e1cd119b4924dab978c4))
* **llms-generator:** resolve major TypeScript type compatibility issues ([2fb88dd](https://github.com/mineclover/context-action/commit/2fb88ddb5013c51b66c592a25a3ffe934970d12a))
* **llms-generator:** update legacy script paths after reorganization ([774e9ef](https://github.com/mineclover/context-action/commit/774e9ef15c55502911ddd4812ef3c9479d55746b))
* **mouse-events:** complete real-time activity status updates in Context Store Pattern ([bb4f3fa](https://github.com/mineclover/context-action/commit/bb4f3fae8b21c049d774abcc5544b9b5110f268c))
* remove unused _error parameters in LLMS generator catch blocks ([bb7c1f3](https://github.com/mineclover/context-action/commit/bb7c1f3589512acf8f9a41d8a7d3f1a454dd3aea))
* resolve all ESLint warnings in typedoc-vitepress-sync ([5a61e08](https://github.com/mineclover/context-action/commit/5a61e08b9adf5f60ed81abf2e1f98a604a1089c3))
* resolve all TypeScript type compatibility issues in LLMS generator ([d523329](https://github.com/mineclover/context-action/commit/d523329ee0e6f3e5599252a63b960996f9e5f061))
* resolve ESLint configuration issues in typedoc-vitepress-sync ([b245f26](https://github.com/mineclover/context-action/commit/b245f2639473c763b54e4d00cd3f4694fea5a00e))
* resolve event object detection warnings for RefStore ([de9a3c2](https://github.com/mineclover/context-action/commit/de9a3c2aec135ce0bb562ee9c7d367cbe201b4e4))
* resolve Jest hanging issue through comprehensive resource cleanup ([1734278](https://github.com/mineclover/context-action/commit/1734278063fdfb7bf4993bd78d3232d8814477cd))
* resolve lint errors and improve ActionRegister test reliability ([c0c0904](https://github.com/mineclover/context-action/commit/c0c09041e0c8398c681e01f6eb9a4c1772013c26))
* resolve lint errors and test failures ([01521a7](https://github.com/mineclover/context-action/commit/01521a7531832ce653dc1d52bc4c4bf3f09b9975))
* resolve RefStore circular reference issues with HTML elements ([42af794](https://github.com/mineclover/context-action/commit/42af79466439f52414e2e0500704026e61af04e1))
* resolve remaining ESLint errors in LLMS generator ([1a63d29](https://github.com/mineclover/context-action/commit/1a63d299923c83361eab6834cdbd80540ed17d40))
* resolve TypeScript type checking issues in CI ([b287784](https://github.com/mineclover/context-action/commit/b287784b4679b974c3ad331d6849c2af9da82c0a))
* **scripts:** remove non-existent jotai package from bundle size check ([aee42b9](https://github.com/mineclover/context-action/commit/aee42b959b34311c87ad17ed674f0eaacd1ebc1f))
* sync-docs 명령 경로 해결 로직 개선 ([5e7aab3](https://github.com/mineclover/context-action/commit/5e7aab3f4d438683e5582948e2bf84c37f0dfa4c))
* **ts:** resolve TypeScript compilation errors across packages ([6f583d1](https://github.com/mineclover/context-action/commit/6f583d1b4d4c2bc9f077c68b3db432d0399fb846))
* **typedoc-vitepress-sync:** add missing ESLint config and TypeScript setup ([66b7f6a](https://github.com/mineclover/context-action/commit/66b7f6a2329635c1a87a0f441fe0aac09659d06d))
* **typedoc-vitepress-sync:** add publishConfig for public npm publication ([97c3d3e](https://github.com/mineclover/context-action/commit/97c3d3efb558a8d8811d9d48ebe7bcaba3d27f5c))
* **typedoc-vitepress-sync:** temporarily skip tests in prepublishOnly for package publication ([0db4406](https://github.com/mineclover/context-action/commit/0db4406b9dc47ad25bd88e7a163958a013f2e049))
* update remaining useRef reference to useRefHandler in ChatDemo.tsx ([ee9ab59](https://github.com/mineclover/context-action/commit/ee9ab59ec1e80715ad1fc5cf061ba8b743bbd610))
* update remaining useRef references to useRefHandler in tests and docs ([39f8e21](https://github.com/mineclover/context-action/commit/39f8e218023c0e8d3be91929cf362ffb5414e313))


### Features

* Action Only API 문서 업데이트 ([254d046](https://github.com/mineclover/context-action/commit/254d046f9a4551104794f0700cf215f9eb8085ca))
* Add 200-char summary for action handlers guide ([ca85836](https://github.com/mineclover/context-action/commit/ca85836e97bfdf1c2e0646041ef9918de345c5ab))
* add centralized configuration for typedoc-vitepress-sync ([417b20f](https://github.com/mineclover/context-action/commit/417b20f689e884dd917f12563c1c243fd7cb21ef))
* add enhanced API documentation sync script with smart caching ([0a5b368](https://github.com/mineclover/context-action/commit/0a5b3684ae41c6057d5b9f638d81b989785d8e07))
* add learning time info to getting started guide ([bbce03c](https://github.com/mineclover/context-action/commit/bbce03cbf2ed4862f454cfafae05913a228ede67))
* complete bidirectional document synchronization with YAML frontmatter ([21e080d](https://github.com/mineclover/context-action/commit/21e080dd20808b3116015a1077cfbccf6e9b9913))
* complete core LLMS generation scenario test ([2fedf3d](https://github.com/mineclover/context-action/commit/2fedf3d252b195e8eeab75365016c51a50fb7b01))
* complete sync-docs implementation with full synchronization ([fd4d231](https://github.com/mineclover/context-action/commit/fd4d23159dda6854c6112620192371f595ad22ae))
* completely remove orphaned test files and legacy code ([00f0806](https://github.com/mineclover/context-action/commit/00f080652dcb8298c0615d50e5b2e364e5474b73))
* enhance createRefContext with declarative ref management ([58a56e2](https://github.com/mineclover/context-action/commit/58a56e25ab48fc85f59135042c1975bef1bbbc10))
* enhance llms-generator testing and remove legacy scripts ([ed33d84](https://github.com/mineclover/context-action/commit/ed33d84280b18d6774f8303dc112235d9ba75ae6))
* enhance type safety and fix test implementations ([ad374a7](https://github.com/mineclover/context-action/commit/ad374a71ff98b78e4ed14d524d6c4ecc8f6ab99e))
* implement comprehensive clean LLMS generation with multi-pattern support ([f84d81d](https://github.com/mineclover/context-action/commit/f84d81dfef856515e24f38d820ff7e63345093f4))
* implement comprehensive YAML frontmatter management system with Husky integration ([95acbaa](https://github.com/mineclover/context-action/commit/95acbaa409e900ecd5f5b8ac12c42a35b859d672))
* implement RefContext mouse events with zero-render architecture ([274c510](https://github.com/mineclover/context-action/commit/274c5109ccdae1883a016cd17adeda55cb5ac537))
* implement unified init command for llms-generator project initialization ([de1a962](https://github.com/mineclover/context-action/commit/de1a962f4342c8926f055dad0948937a0b3144e5))
* implement YAML frontmatter system and fix sync-docs workflow ([c244c99](https://github.com/mineclover/context-action/commit/c244c99a097b508fd7e4a3e1fd8bace8698a3172))
* initialize LLMS data structure and create action handlers templates ([24c905f](https://github.com/mineclover/context-action/commit/24c905faa673b5064e23de5380ebedb157e2da2c))
* **llms-generator:** add CategoryMinimumGenerator library with enhanced features ([0a8e2c3](https://github.com/mineclover/context-action/commit/0a8e2c35abd358eb2470cf0219fcf8ce396d4258))
* **llms-generator:** Complete LLMS Generator CLI system with init and sync-docs commands ([d021b66](https://github.com/mineclover/context-action/commit/d021b6625995d4acf23367df57b3d5ab223d3160))
* **llms-generator:** Git 커밋 트리거 기반 양방향 문서 동기화 시스템 구현 ([0a5f270](https://github.com/mineclover/context-action/commit/0a5f2706dd0c124d48bbefb5cfe5ef2550abbc25))
* **llms-generator:** implement sync-docs command for automatic documentation synchronization ([3463dcc](https://github.com/mineclover/context-action/commit/3463dcc4ca1dfa2879bb7ddc6a0a8799c01a286f))
* **llms-generator:** implement YAML frontmatter summary generation with clean architecture ([5f9e38e](https://github.com/mineclover/context-action/commit/5f9e38eca2b0e8c78a3c66130f22244bce0e768a))
* **llms-generator:** 테스트 완성도 및 타입 안정성 향상 ([bd09e41](https://github.com/mineclover/context-action/commit/bd09e41a1b483483daa43929a046a51aaf74aee8))
* **llms-generator:** 포괄적 시스템 개선 및 아키텍처 고도화 ([2d4070f](https://github.com/mineclover/context-action/commit/2d4070f43c95e5cf4304ed01f2db9629168282d4))
* **llms:** add comprehensive multilingual document processing options ([f5a5c32](https://github.com/mineclover/context-action/commit/f5a5c32fd8090cfc1bd3008578d4fbc2e183550b))
* **llms:** implement comprehensive Priority management system ([b5612fe](https://github.com/mineclover/context-action/commit/b5612fef3198ee6bbdf5a4943da8e2a4a977256f))
* **llms:** implement optional LLMS integration with selective activation ([4938b0c](https://github.com/mineclover/context-action/commit/4938b0c0cd946de09884f90efded35d01b453844))
* **llms:** implement separate commit system for LLMS updates ([e921d28](https://github.com/mineclover/context-action/commit/e921d28a74e203ff50c1f8b1631573d9926a3134))
* massive cleanup - remove 95% of unused code while preserving functionality ([f151a46](https://github.com/mineclover/context-action/commit/f151a46641ae9cc64ea568efd9d74869fc1f850d))
* optimize CLI from 2000 lines to 200 lines with core functionality ([dd0f1c8](https://github.com/mineclover/context-action/commit/dd0f1c88236628c8010e2df1aa0ed65981192b45))
* optimize LLMS generator by removing legacy code and improving architecture ([08dc3cd](https://github.com/mineclover/context-action/commit/08dc3cd057112ec42167183e1d9b949e54f7bb3a))
* remove deprecated action handler utilities ([2861d61](https://github.com/mineclover/context-action/commit/2861d61b4b5d930e9e7f5277983455dc296dc859))
* **security:** major security and tooling updates ([f0d794e](https://github.com/mineclover/context-action/commit/f0d794eb007d58a301c01d0b4b36f07865da2434))
* **typedoc-vitepress-sync:** implement enhanced TypeDoc to VitePress sync library ([17bdac7](https://github.com/mineclover/context-action/commit/17bdac7e035fdc073a092d83442c9a290b1640f0))





# [0.3.0](https://github.com/mineclover/context-action/compare/v0.2.1...v0.3.0) (2025-08-20)


### Bug Fixes

* add error parameter to catch blocks in llms-generator commands ([18cff4b](https://github.com/mineclover/context-action/commit/18cff4bd8e2c64a5a9a38dc2f2876714bbd883ed))
* **build:** resolve llms-generator build issues and dependencies ([44ca184](https://github.com/mineclover/context-action/commit/44ca1847bd9942c7fe13b02d961cc6f8eb0e8509))
* **ci:** resolve CI/CD dependency installation errors ([675641f](https://github.com/mineclover/context-action/commit/675641f814d63d639cfa375f5e8debe134828762))
* **ci:** standardize tsdown version across all packages ([714ab1d](https://github.com/mineclover/context-action/commit/714ab1d7f8005096f7abe2f09d8067f500168a3a))
* comprehensive RefStore DOM element handling improvements ([23844d7](https://github.com/mineclover/context-action/commit/23844d700dcbc737e3c0961c662be72220d4df05))
* **core,react:** improve code quality and security across packages ([e7baf2f](https://github.com/mineclover/context-action/commit/e7baf2fb8bf49bc5ae0b3f92efbf567fb5d2da09))
* **dependabot:** resolve schema validation errors and improve configuration ([07e15d5](https://github.com/mineclover/context-action/commit/07e15d5dfa6fec9f503c02a35480faca8bf69dd3))
* **deps:** update tsdown and resolve build dependency issues ([100008a](https://github.com/mineclover/context-action/commit/100008ae67794750ab4839d3476c300275e464ca))
* enhance non-cloneable object detection in immutable utils ([0bd7f55](https://github.com/mineclover/context-action/commit/0bd7f5511d8a588970196b000ab33e2dbaa0ff50))
* **example:** resolve TypeScript and lint errors in example application ([732498d](https://github.com/mineclover/context-action/commit/732498db704403d0f38e55656bb91b8717a8cb6c))
* improve code quality and resolve TypeScript/lint issues ([0afcba8](https://github.com/mineclover/context-action/commit/0afcba8a8723d45770c7bdb7cc13060d7e80dd62))
* improve GitHub Actions workflow and disable auto-trigger ([15b0aa6](https://github.com/mineclover/context-action/commit/15b0aa6a7456c268c94cfe864394d0aeefe3e1ea))
* **llms-generator:** resolve linting issues by adding eslint config and temporarily disabling problematic checks ([1d6cead](https://github.com/mineclover/context-action/commit/1d6cead48821f6cc26a8e1cd119b4924dab978c4))
* **llms-generator:** resolve major TypeScript type compatibility issues ([2fb88dd](https://github.com/mineclover/context-action/commit/2fb88ddb5013c51b66c592a25a3ffe934970d12a))
* **llms-generator:** update legacy script paths after reorganization ([774e9ef](https://github.com/mineclover/context-action/commit/774e9ef15c55502911ddd4812ef3c9479d55746b))
* **mouse-events:** complete real-time activity status updates in Context Store Pattern ([bb4f3fa](https://github.com/mineclover/context-action/commit/bb4f3fae8b21c049d774abcc5544b9b5110f268c))
* remove unused _error parameters in LLMS generator catch blocks ([bb7c1f3](https://github.com/mineclover/context-action/commit/bb7c1f3589512acf8f9a41d8a7d3f1a454dd3aea))
* resolve all ESLint warnings in typedoc-vitepress-sync ([5a61e08](https://github.com/mineclover/context-action/commit/5a61e08b9adf5f60ed81abf2e1f98a604a1089c3))
* resolve all TypeScript type compatibility issues in LLMS generator ([d523329](https://github.com/mineclover/context-action/commit/d523329ee0e6f3e5599252a63b960996f9e5f061))
* resolve ESLint configuration issues in typedoc-vitepress-sync ([b245f26](https://github.com/mineclover/context-action/commit/b245f2639473c763b54e4d00cd3f4694fea5a00e))
* resolve event object detection warnings for RefStore ([de9a3c2](https://github.com/mineclover/context-action/commit/de9a3c2aec135ce0bb562ee9c7d367cbe201b4e4))
* resolve Jest hanging issue through comprehensive resource cleanup ([1734278](https://github.com/mineclover/context-action/commit/1734278063fdfb7bf4993bd78d3232d8814477cd))
* resolve lint errors and improve ActionRegister test reliability ([c0c0904](https://github.com/mineclover/context-action/commit/c0c09041e0c8398c681e01f6eb9a4c1772013c26))
* resolve lint errors and test failures ([01521a7](https://github.com/mineclover/context-action/commit/01521a7531832ce653dc1d52bc4c4bf3f09b9975))
* resolve RefStore circular reference issues with HTML elements ([42af794](https://github.com/mineclover/context-action/commit/42af79466439f52414e2e0500704026e61af04e1))
* resolve remaining ESLint errors in LLMS generator ([1a63d29](https://github.com/mineclover/context-action/commit/1a63d299923c83361eab6834cdbd80540ed17d40))
* resolve TypeScript type checking issues in CI ([b287784](https://github.com/mineclover/context-action/commit/b287784b4679b974c3ad331d6849c2af9da82c0a))
* **scripts:** remove non-existent jotai package from bundle size check ([aee42b9](https://github.com/mineclover/context-action/commit/aee42b959b34311c87ad17ed674f0eaacd1ebc1f))
* sync-docs 명령 경로 해결 로직 개선 ([5e7aab3](https://github.com/mineclover/context-action/commit/5e7aab3f4d438683e5582948e2bf84c37f0dfa4c))
* **ts:** resolve TypeScript compilation errors across packages ([6f583d1](https://github.com/mineclover/context-action/commit/6f583d1b4d4c2bc9f077c68b3db432d0399fb846))
* **typedoc-vitepress-sync:** add missing ESLint config and TypeScript setup ([66b7f6a](https://github.com/mineclover/context-action/commit/66b7f6a2329635c1a87a0f441fe0aac09659d06d))
* **typedoc-vitepress-sync:** add publishConfig for public npm publication ([97c3d3e](https://github.com/mineclover/context-action/commit/97c3d3efb558a8d8811d9d48ebe7bcaba3d27f5c))
* **typedoc-vitepress-sync:** temporarily skip tests in prepublishOnly for package publication ([0db4406](https://github.com/mineclover/context-action/commit/0db4406b9dc47ad25bd88e7a163958a013f2e049))
* update remaining useRef reference to useRefHandler in ChatDemo.tsx ([ee9ab59](https://github.com/mineclover/context-action/commit/ee9ab59ec1e80715ad1fc5cf061ba8b743bbd610))
* update remaining useRef references to useRefHandler in tests and docs ([39f8e21](https://github.com/mineclover/context-action/commit/39f8e218023c0e8d3be91929cf362ffb5414e313))


### Features

* Action Only API 문서 업데이트 ([254d046](https://github.com/mineclover/context-action/commit/254d046f9a4551104794f0700cf215f9eb8085ca))
* Add 200-char summary for action handlers guide ([ca85836](https://github.com/mineclover/context-action/commit/ca85836e97bfdf1c2e0646041ef9918de345c5ab))
* add centralized configuration for typedoc-vitepress-sync ([417b20f](https://github.com/mineclover/context-action/commit/417b20f689e884dd917f12563c1c243fd7cb21ef))
* add enhanced API documentation sync script with smart caching ([0a5b368](https://github.com/mineclover/context-action/commit/0a5b3684ae41c6057d5b9f638d81b989785d8e07))
* add learning time info to getting started guide ([bbce03c](https://github.com/mineclover/context-action/commit/bbce03cbf2ed4862f454cfafae05913a228ede67))
* complete bidirectional document synchronization with YAML frontmatter ([21e080d](https://github.com/mineclover/context-action/commit/21e080dd20808b3116015a1077cfbccf6e9b9913))
* complete core LLMS generation scenario test ([2fedf3d](https://github.com/mineclover/context-action/commit/2fedf3d252b195e8eeab75365016c51a50fb7b01))
* completely remove orphaned test files and legacy code ([00f0806](https://github.com/mineclover/context-action/commit/00f080652dcb8298c0615d50e5b2e364e5474b73))
* enhance createRefContext with declarative ref management ([58a56e2](https://github.com/mineclover/context-action/commit/58a56e25ab48fc85f59135042c1975bef1bbbc10))
* enhance llms-generator testing and remove legacy scripts ([ed33d84](https://github.com/mineclover/context-action/commit/ed33d84280b18d6774f8303dc112235d9ba75ae6))
* enhance type safety and fix test implementations ([ad374a7](https://github.com/mineclover/context-action/commit/ad374a71ff98b78e4ed14d524d6c4ecc8f6ab99e))
* implement comprehensive clean LLMS generation with multi-pattern support ([f84d81d](https://github.com/mineclover/context-action/commit/f84d81dfef856515e24f38d820ff7e63345093f4))
* implement comprehensive YAML frontmatter management system with Husky integration ([95acbaa](https://github.com/mineclover/context-action/commit/95acbaa409e900ecd5f5b8ac12c42a35b859d672))
* implement RefContext mouse events with zero-render architecture ([274c510](https://github.com/mineclover/context-action/commit/274c5109ccdae1883a016cd17adeda55cb5ac537))
* implement unified init command for llms-generator project initialization ([de1a962](https://github.com/mineclover/context-action/commit/de1a962f4342c8926f055dad0948937a0b3144e5))
* implement YAML frontmatter system and fix sync-docs workflow ([c244c99](https://github.com/mineclover/context-action/commit/c244c99a097b508fd7e4a3e1fd8bace8698a3172))
* initialize LLMS data structure and create action handlers templates ([24c905f](https://github.com/mineclover/context-action/commit/24c905faa673b5064e23de5380ebedb157e2da2c))
* **llms-generator:** add CategoryMinimumGenerator library with enhanced features ([0a8e2c3](https://github.com/mineclover/context-action/commit/0a8e2c35abd358eb2470cf0219fcf8ce396d4258))
* **llms-generator:** Git 커밋 트리거 기반 양방향 문서 동기화 시스템 구현 ([0a5f270](https://github.com/mineclover/context-action/commit/0a5f2706dd0c124d48bbefb5cfe5ef2550abbc25))
* **llms-generator:** implement YAML frontmatter summary generation with clean architecture ([5f9e38e](https://github.com/mineclover/context-action/commit/5f9e38eca2b0e8c78a3c66130f22244bce0e768a))
* **llms-generator:** 테스트 완성도 및 타입 안정성 향상 ([bd09e41](https://github.com/mineclover/context-action/commit/bd09e41a1b483483daa43929a046a51aaf74aee8))
* **llms-generator:** 포괄적 시스템 개선 및 아키텍처 고도화 ([2d4070f](https://github.com/mineclover/context-action/commit/2d4070f43c95e5cf4304ed01f2db9629168282d4))
* massive cleanup - remove 95% of unused code while preserving functionality ([f151a46](https://github.com/mineclover/context-action/commit/f151a46641ae9cc64ea568efd9d74869fc1f850d))
* optimize CLI from 2000 lines to 200 lines with core functionality ([dd0f1c8](https://github.com/mineclover/context-action/commit/dd0f1c88236628c8010e2df1aa0ed65981192b45))
* optimize LLMS generator by removing legacy code and improving architecture ([08dc3cd](https://github.com/mineclover/context-action/commit/08dc3cd057112ec42167183e1d9b949e54f7bb3a))
* remove deprecated action handler utilities ([2861d61](https://github.com/mineclover/context-action/commit/2861d61b4b5d930e9e7f5277983455dc296dc859))
* **security:** major security and tooling updates ([f0d794e](https://github.com/mineclover/context-action/commit/f0d794eb007d58a301c01d0b4b36f07865da2434))
* **typedoc-vitepress-sync:** implement enhanced TypeDoc to VitePress sync library ([17bdac7](https://github.com/mineclover/context-action/commit/17bdac7e035fdc073a092d83442c9a290b1640f0))





## [0.2.3](https://github.com/mineclover/context-action/compare/v0.2.1...v0.2.3) (2025-08-19)


### Bug Fixes

* **build:** resolve llms-generator build issues and dependencies ([44ca184](https://github.com/mineclover/context-action/commit/44ca1847bd9942c7fe13b02d961cc6f8eb0e8509))
* **ci:** resolve CI/CD dependency installation errors ([675641f](https://github.com/mineclover/context-action/commit/675641f814d63d639cfa375f5e8debe134828762))
* **ci:** standardize tsdown version across all packages ([714ab1d](https://github.com/mineclover/context-action/commit/714ab1d7f8005096f7abe2f09d8067f500168a3a))
* **core,react:** improve code quality and security across packages ([e7baf2f](https://github.com/mineclover/context-action/commit/e7baf2fb8bf49bc5ae0b3f92efbf567fb5d2da09))
* **dependabot:** resolve schema validation errors and improve configuration ([07e15d5](https://github.com/mineclover/context-action/commit/07e15d5dfa6fec9f503c02a35480faca8bf69dd3))
* **deps:** update tsdown and resolve build dependency issues ([100008a](https://github.com/mineclover/context-action/commit/100008ae67794750ab4839d3476c300275e464ca))
* **example:** resolve TypeScript and lint errors in example application ([732498d](https://github.com/mineclover/context-action/commit/732498db704403d0f38e55656bb91b8717a8cb6c))
* **llms-generator:** resolve linting issues by adding eslint config and temporarily disabling problematic checks ([1d6cead](https://github.com/mineclover/context-action/commit/1d6cead48821f6cc26a8e1cd119b4924dab978c4))
* **llms-generator:** resolve major TypeScript type compatibility issues ([2fb88dd](https://github.com/mineclover/context-action/commit/2fb88ddb5013c51b66c592a25a3ffe934970d12a))
* **llms-generator:** update legacy script paths after reorganization ([774e9ef](https://github.com/mineclover/context-action/commit/774e9ef15c55502911ddd4812ef3c9479d55746b))
* **mouse-events:** complete real-time activity status updates in Context Store Pattern ([bb4f3fa](https://github.com/mineclover/context-action/commit/bb4f3fae8b21c049d774abcc5544b9b5110f268c))
* resolve lint errors and improve ActionRegister test reliability ([c0c0904](https://github.com/mineclover/context-action/commit/c0c09041e0c8398c681e01f6eb9a4c1772013c26))
* **scripts:** remove non-existent jotai package from bundle size check ([aee42b9](https://github.com/mineclover/context-action/commit/aee42b959b34311c87ad17ed674f0eaacd1ebc1f))
* sync-docs 명령 경로 해결 로직 개선 ([5e7aab3](https://github.com/mineclover/context-action/commit/5e7aab3f4d438683e5582948e2bf84c37f0dfa4c))
* **ts:** resolve TypeScript compilation errors across packages ([6f583d1](https://github.com/mineclover/context-action/commit/6f583d1b4d4c2bc9f077c68b3db432d0399fb846))
* **typedoc-vitepress-sync:** add missing ESLint config and TypeScript setup ([66b7f6a](https://github.com/mineclover/context-action/commit/66b7f6a2329635c1a87a0f441fe0aac09659d06d))
* **typedoc-vitepress-sync:** add publishConfig for public npm publication ([97c3d3e](https://github.com/mineclover/context-action/commit/97c3d3efb558a8d8811d9d48ebe7bcaba3d27f5c))
* **typedoc-vitepress-sync:** temporarily skip tests in prepublishOnly for package publication ([0db4406](https://github.com/mineclover/context-action/commit/0db4406b9dc47ad25bd88e7a163958a013f2e049))


### Features

* Action Only API 문서 업데이트 ([254d046](https://github.com/mineclover/context-action/commit/254d046f9a4551104794f0700cf215f9eb8085ca))
* Add 200-char summary for action handlers guide ([ca85836](https://github.com/mineclover/context-action/commit/ca85836e97bfdf1c2e0646041ef9918de345c5ab))
* add centralized configuration for typedoc-vitepress-sync ([417b20f](https://github.com/mineclover/context-action/commit/417b20f689e884dd917f12563c1c243fd7cb21ef))
* add enhanced API documentation sync script with smart caching ([0a5b368](https://github.com/mineclover/context-action/commit/0a5b3684ae41c6057d5b9f638d81b989785d8e07))
* add learning time info to getting started guide ([bbce03c](https://github.com/mineclover/context-action/commit/bbce03cbf2ed4862f454cfafae05913a228ede67))
* complete bidirectional document synchronization with YAML frontmatter ([21e080d](https://github.com/mineclover/context-action/commit/21e080dd20808b3116015a1077cfbccf6e9b9913))
* complete core LLMS generation scenario test ([2fedf3d](https://github.com/mineclover/context-action/commit/2fedf3d252b195e8eeab75365016c51a50fb7b01))
* completely remove orphaned test files and legacy code ([00f0806](https://github.com/mineclover/context-action/commit/00f080652dcb8298c0615d50e5b2e364e5474b73))
* enhance createRefContext with declarative ref management ([58a56e2](https://github.com/mineclover/context-action/commit/58a56e25ab48fc85f59135042c1975bef1bbbc10))
* enhance llms-generator testing and remove legacy scripts ([ed33d84](https://github.com/mineclover/context-action/commit/ed33d84280b18d6774f8303dc112235d9ba75ae6))
* implement comprehensive clean LLMS generation with multi-pattern support ([f84d81d](https://github.com/mineclover/context-action/commit/f84d81dfef856515e24f38d820ff7e63345093f4))
* implement comprehensive YAML frontmatter management system with Husky integration ([95acbaa](https://github.com/mineclover/context-action/commit/95acbaa409e900ecd5f5b8ac12c42a35b859d672))
* implement unified init command for llms-generator project initialization ([de1a962](https://github.com/mineclover/context-action/commit/de1a962f4342c8926f055dad0948937a0b3144e5))
* implement YAML frontmatter system and fix sync-docs workflow ([c244c99](https://github.com/mineclover/context-action/commit/c244c99a097b508fd7e4a3e1fd8bace8698a3172))
* initialize LLMS data structure and create action handlers templates ([24c905f](https://github.com/mineclover/context-action/commit/24c905faa673b5064e23de5380ebedb157e2da2c))
* **llms-generator:** 테스트 완성도 및 타입 안정성 향상 ([bd09e41](https://github.com/mineclover/context-action/commit/bd09e41a1b483483daa43929a046a51aaf74aee8))
* **llms-generator:** 포괄적 시스템 개선 및 아키텍처 고도화 ([2d4070f](https://github.com/mineclover/context-action/commit/2d4070f43c95e5cf4304ed01f2db9629168282d4))
* **llms-generator:** add CategoryMinimumGenerator library with enhanced features ([0a8e2c3](https://github.com/mineclover/context-action/commit/0a8e2c35abd358eb2470cf0219fcf8ce396d4258))
* **llms-generator:** Git 커밋 트리거 기반 양방향 문서 동기화 시스템 구현 ([0a5f270](https://github.com/mineclover/context-action/commit/0a5f2706dd0c124d48bbefb5cfe5ef2550abbc25))
* **llms-generator:** implement YAML frontmatter summary generation with clean architecture ([5f9e38e](https://github.com/mineclover/context-action/commit/5f9e38eca2b0e8c78a3c66130f22244bce0e768a))
* massive cleanup - remove 95% of unused code while preserving functionality ([f151a46](https://github.com/mineclover/context-action/commit/f151a46641ae9cc64ea568efd9d74869fc1f850d))
* optimize CLI from 2000 lines to 200 lines with core functionality ([dd0f1c8](https://github.com/mineclover/context-action/commit/dd0f1c88236628c8010e2df1aa0ed65981192b45))
* optimize LLMS generator by removing legacy code and improving architecture ([08dc3cd](https://github.com/mineclover/context-action/commit/08dc3cd057112ec42167183e1d9b949e54f7bb3a))
* remove deprecated action handler utilities ([2861d61](https://github.com/mineclover/context-action/commit/2861d61b4b5d930e9e7f5277983455dc296dc859))
* **security:** major security and tooling updates ([f0d794e](https://github.com/mineclover/context-action/commit/f0d794eb007d58a301c01d0b4b36f07865da2434))
* **typedoc-vitepress-sync:** implement enhanced TypeDoc to VitePress sync library ([17bdac7](https://github.com/mineclover/context-action/commit/17bdac7e035fdc073a092d83442c9a290b1640f0))





## [0.2.2](https://github.com/mineclover/context-action/compare/v0.2.1...v0.2.2) (2025-08-15)


### Bug Fixes

* **build:** resolve llms-generator build issues and dependencies ([44ca184](https://github.com/mineclover/context-action/commit/44ca1847bd9942c7fe13b02d961cc6f8eb0e8509))
* **ci:** resolve CI/CD dependency installation errors ([675641f](https://github.com/mineclover/context-action/commit/675641f814d63d639cfa375f5e8debe134828762))
* **ci:** standardize tsdown version across all packages ([714ab1d](https://github.com/mineclover/context-action/commit/714ab1d7f8005096f7abe2f09d8067f500168a3a))
* **core,react:** improve code quality and security across packages ([e7baf2f](https://github.com/mineclover/context-action/commit/e7baf2fb8bf49bc5ae0b3f92efbf567fb5d2da09))
* **dependabot:** resolve schema validation errors and improve configuration ([07e15d5](https://github.com/mineclover/context-action/commit/07e15d5dfa6fec9f503c02a35480faca8bf69dd3))
* **deps:** update tsdown and resolve build dependency issues ([100008a](https://github.com/mineclover/context-action/commit/100008ae67794750ab4839d3476c300275e464ca))
* **llms-generator:** resolve linting issues by adding eslint config and temporarily disabling problematic checks ([1d6cead](https://github.com/mineclover/context-action/commit/1d6cead48821f6cc26a8e1cd119b4924dab978c4))
* **mouse-events:** complete real-time activity status updates in Context Store Pattern ([bb4f3fa](https://github.com/mineclover/context-action/commit/bb4f3fae8b21c049d774abcc5544b9b5110f268c))
* **scripts:** remove non-existent jotai package from bundle size check ([aee42b9](https://github.com/mineclover/context-action/commit/aee42b959b34311c87ad17ed674f0eaacd1ebc1f))
* **ts:** resolve TypeScript compilation errors across packages ([6f583d1](https://github.com/mineclover/context-action/commit/6f583d1b4d4c2bc9f077c68b3db432d0399fb846))
* **typedoc-vitepress-sync:** add missing ESLint config and TypeScript setup ([66b7f6a](https://github.com/mineclover/context-action/commit/66b7f6a2329635c1a87a0f441fe0aac09659d06d))
* **typedoc-vitepress-sync:** add publishConfig for public npm publication ([97c3d3e](https://github.com/mineclover/context-action/commit/97c3d3efb558a8d8811d9d48ebe7bcaba3d27f5c))
* **typedoc-vitepress-sync:** temporarily skip tests in prepublishOnly for package publication ([0db4406](https://github.com/mineclover/context-action/commit/0db4406b9dc47ad25bd88e7a163958a013f2e049))


### Features

* add centralized configuration for typedoc-vitepress-sync ([417b20f](https://github.com/mineclover/context-action/commit/417b20f689e884dd917f12563c1c243fd7cb21ef))
* add enhanced API documentation sync script with smart caching ([0a5b368](https://github.com/mineclover/context-action/commit/0a5b3684ae41c6057d5b9f638d81b989785d8e07))
* **llms-generator:** implement YAML frontmatter summary generation with clean architecture ([5f9e38e](https://github.com/mineclover/context-action/commit/5f9e38eca2b0e8c78a3c66130f22244bce0e768a))
* remove deprecated action handler utilities ([2861d61](https://github.com/mineclover/context-action/commit/2861d61b4b5d930e9e7f5277983455dc296dc859))
* **security:** major security and tooling updates ([f0d794e](https://github.com/mineclover/context-action/commit/f0d794eb007d58a301c01d0b4b36f07865da2434))
* **typedoc-vitepress-sync:** implement enhanced TypeDoc to VitePress sync library ([17bdac7](https://github.com/mineclover/context-action/commit/17bdac7e035fdc073a092d83442c9a290b1640f0))





## [Unreleased]

### Features

* **refs:** simplify ref management system to createRefContext only
  - Simplify to declarative ref management with createRefContext
  - Support both simple type usage and RefDefinitions for management strategies
  - Remove deprecated createDeclarativeRefPattern and related complexity
  - Clean up orphaned test files and update all examples
  - Improve TypeScript support for test environments
  - Add comprehensive RefDefinitions management strategy documentation

### Bug Fixes

* **tests:** resolve Jest TypeScript integration issues
  - Add dedicated tsconfig.test.json for test environment
  - Fix Jest global type declarations (describe, it, expect, jest)
  - Update Jest configuration to use proper TypeScript settings

* remove deprecated action handler utilities ([2861d61](https://github.com/mineclover/context-action/commit/2861d61))
  - Remove unused deprecated functions: createMultiStoreHandler, createTransactionHandler, createValidatedHandler
  - Remove ActionHandlerUtils class and related interfaces (StoreSnapshot, MultiStoreContext, TransactionContext)
  - Delete empty utils directory: packages/react/src/actions/utils/
  - Reduce bundle size: React package from 89.14 kB to 81.90 kB (8% reduction)

## [0.2.1](https://github.com/mineclover/context-action/compare/v0.1.1...v0.2.1) (2025-08-15)


### Bug Fixes

* resolve Store concurrency issues with hybrid notification system ([171cb40](https://github.com/mineclover/context-action/commit/171cb40cd71e2373bc2cb09ca3772ccce40b21ec))


### Documentation

* major restructure - simplify guides based on concept documents ([457a216](https://github.com/mineclover/context-action/commit/457a216009ec4d176c4f1dfcd9c5ed5836192f08))


### Features

* add @context-action/llms-generator package ([3331b37](https://github.com/mineclover/context-action/commit/3331b371a3820454e023df24f30b4e709b0951a9))
* consolidate package.json scripts with CLI interfaces ([1bf18cb](https://github.com/mineclover/context-action/commit/1bf18cb4e4f9e98f7cf1de3ae661c0e78bd71586))
* **core:** resolve concurrency issues with OperationQueue system ([e42339f](https://github.com/mineclover/context-action/commit/e42339ffd4d0983ee6787fadebae1d17d3d95f29))
* **docs:** implement document-based priority system with JSON schema validation ([d532c99](https://github.com/mineclover/context-action/commit/d532c99081f0106ee8c884b2bd09dab12b3c9f6c))
* **docs:** implement optimized document structure system for LLM integration ([18bf4dc](https://github.com/mineclover/context-action/commit/18bf4dc08ed91d6e2d0e2f25862e6a7786541775))
* **docs:** restructure Korean guides to match English version ([6d6e9e9](https://github.com/mineclover/context-action/commit/6d6e9e986a896291d617ba76fa4af6b0111efec2))
* **docs:** restructure VitePress docs with examples, api, and llms sections ([262ebfc](https://github.com/mineclover/context-action/commit/262ebfcf711e8f09c396b86048a8722eb9ed3898))
* **llms-generator:** add work status management for -100 character summaries ([ad9c1b2](https://github.com/mineclover/context-action/commit/ad9c1b232a57e52b53b01ddca99f91653dc0115b))
* **llms-generator:** implement user-configurable character limits system ([1f8e7fc](https://github.com/mineclover/context-action/commit/1f8e7fc5383e1e5e609ba5eb20de1b42c4cf2cc6))
* **llms-generator:** integrate priority generation and schema management ([5b01ee9](https://github.com/mineclover/context-action/commit/5b01ee9af563ae2ff226156117185016bc57c9ee))
* **llms-generator:** major usability improvements for manual summary workflow ([3ea4f94](https://github.com/mineclover/context-action/commit/3ea4f947c620c47089799030c790d33537f3abd6))
* **llms-generator:** simplify configuration system and enhance testing ([c67f5a9](https://github.com/mineclover/context-action/commit/c67f5a9d5e3af4ed2e4bc3d654fce8c38193a34f))
* **llms:** implement adaptive LLM content generator with minimum and origin types ([9e1e78c](https://github.com/mineclover/context-action/commit/9e1e78c26082dcb14c8c6bb97991394317330c72))
* optimize codebase and remove legacy code ([19c042f](https://github.com/mineclover/context-action/commit/19c042f4a2915c0bd1bd9b76cb7750a061af6675))


### BREAKING CHANGES

* Remove legacy guide structure and consolidate documentation

- Remove 15 redundant and outdated guide files
- Simplify from 21 files to 6 essential guides
- Restructure sidebar: Legacy Guides → Essential Guides + Additional Guides
- Base all guides on concept documents for consistency:
  * getting-started.md (pattern-guide based)
  * architecture.md (architecture-guide based)
  * action-pipeline.md (action-pipeline-guide based)
  * hooks.md (hooks-reference based)
  * best-practices.md (conventions based)
  * action-handlers.md (remaining useful content)

Benefits:
- 71% reduction in documentation files (21 → 6)
- Eliminates content duplication and confusion
- Provides clear learning path for new users
- Ensures concept-guide consistency
- Focuses each file on single, clear topics

Migration:
- Legacy guides removed: overview, concepts, quick-start, setup-usage, philosophy
- Advanced topics consolidated into essential guides
- Sidebar structure simplified to Essential + Additional sections

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>





# [0.2.0](https://github.com/mineclover/context-action/compare/v0.1.1...v0.2.0) (2025-08-15)


### Documentation

* major restructure - simplify guides based on concept documents ([457a216](https://github.com/mineclover/context-action/commit/457a216009ec4d176c4f1dfcd9c5ed5836192f08))


### Features

* add @context-action/llms-generator package ([3331b37](https://github.com/mineclover/context-action/commit/3331b371a3820454e023df24f30b4e709b0951a9))
* consolidate package.json scripts with CLI interfaces ([1bf18cb](https://github.com/mineclover/context-action/commit/1bf18cb4e4f9e98f7cf1de3ae661c0e78bd71586))
* **core:** resolve concurrency issues with OperationQueue system ([e42339f](https://github.com/mineclover/context-action/commit/e42339ffd4d0983ee6787fadebae1d17d3d95f29))
* **docs:** implement document-based priority system with JSON schema validation ([d532c99](https://github.com/mineclover/context-action/commit/d532c99081f0106ee8c884b2bd09dab12b3c9f6c))
* **docs:** implement optimized document structure system for LLM integration ([18bf4dc](https://github.com/mineclover/context-action/commit/18bf4dc08ed91d6e2d0e2f25862e6a7786541775))
* **docs:** restructure Korean guides to match English version ([6d6e9e9](https://github.com/mineclover/context-action/commit/6d6e9e986a896291d617ba76fa4af6b0111efec2))
* **docs:** restructure VitePress docs with examples, api, and llms sections ([262ebfc](https://github.com/mineclover/context-action/commit/262ebfcf711e8f09c396b86048a8722eb9ed3898))
* **llms-generator:** add work status management for -100 character summaries ([ad9c1b2](https://github.com/mineclover/context-action/commit/ad9c1b232a57e52b53b01ddca99f91653dc0115b))
* **llms-generator:** implement user-configurable character limits system ([1f8e7fc](https://github.com/mineclover/context-action/commit/1f8e7fc5383e1e5e609ba5eb20de1b42c4cf2cc6))
* **llms-generator:** integrate priority generation and schema management ([5b01ee9](https://github.com/mineclover/context-action/commit/5b01ee9af563ae2ff226156117185016bc57c9ee))
* **llms-generator:** major usability improvements for manual summary workflow ([3ea4f94](https://github.com/mineclover/context-action/commit/3ea4f947c620c47089799030c790d33537f3abd6))
* **llms-generator:** simplify configuration system and enhance testing ([c67f5a9](https://github.com/mineclover/context-action/commit/c67f5a9d5e3af4ed2e4bc3d654fce8c38193a34f))
* **llms:** implement adaptive LLM content generator with minimum and origin types ([9e1e78c](https://github.com/mineclover/context-action/commit/9e1e78c26082dcb14c8c6bb97991394317330c72))


### BREAKING CHANGES

* Remove legacy guide structure and consolidate documentation

- Remove 15 redundant and outdated guide files
- Simplify from 21 files to 6 essential guides
- Restructure sidebar: Legacy Guides → Essential Guides + Additional Guides
- Base all guides on concept documents for consistency:
  * getting-started.md (pattern-guide based)
  * architecture.md (architecture-guide based)
  * action-pipeline.md (action-pipeline-guide based)
  * hooks.md (hooks-reference based)
  * best-practices.md (conventions based)
  * action-handlers.md (remaining useful content)

Benefits:
- 71% reduction in documentation files (21 → 6)
- Eliminates content duplication and confusion
- Provides clear learning path for new users
- Ensures concept-guide consistency
- Focuses each file on single, clear topics

Migration:
- Legacy guides removed: overview, concepts, quick-start, setup-usage, philosophy
- Advanced topics consolidated into essential guides
- Sidebar structure simplified to Essential + Additional sections

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>





# 0.1.0 (2025-08-14)


### Bug Fixes

* Apply JSDoc template syntax fix across all TypeScript files ([f5d649f](https://github.com/mineclover/context-action/commit/f5d649f8193f8da6f5b3814fef5ef36eeafb64a5))
* completely prevent 0,0 position artifacts in mouse tracking ([2f07f24](https://github.com/mineclover/context-action/commit/2f07f247afdcab4ad383fd02dc03a3ba77dfb8a3))
* **context-store:** improve Context Store pattern with type safety and reset functionality ([b908345](https://github.com/mineclover/context-action/commit/b90834575285deae50b68b3f71b1b2b06c81ee10))
* Disable logo in documentation ([00d2c18](https://github.com/mineclover/context-action/commit/00d2c18026688cf9039dfaf9d004ad7cbab24738))
* **docs:** resolve GitHub Pages deployment conflict and update README ([948841c](https://github.com/mineclover/context-action/commit/948841c35807eeec88c3757ee4defb0bcf64560e))
* **docs:** resolve Korean index.html build error ([aa935ec](https://github.com/mineclover/context-action/commit/aa935ec20c5c51df5076dbbcf3f77fd14dcc9de2))
* ESLint 설정 파일 ES 모듈 호환성 문제 해결 ([1a92051](https://github.com/mineclover/context-action/commit/1a92051a2a3b48fbb502c7c65ee896c600661ce5))
* example directory 빌드 오류 및 import 이슈 해결 ([4528adc](https://github.com/mineclover/context-action/commit/4528adc4109ac1756784aea09240dece045472ca))
* **example:** refactor mouse-events clean-architecture to use Context-Action framework ([324b54a](https://github.com/mineclover/context-action/commit/324b54a4736bde68abfb61eb4aa5b0aff31e82c0))
* Fix TypeScript project references for workspace dependencies ([85e72b7](https://github.com/mineclover/context-action/commit/85e72b701e743e39eaf7b72dad338e5fd95109d6))
* GitHub Pages 자동 활성화를 위한 enablement 옵션 추가 ([267c236](https://github.com/mineclover/context-action/commit/267c23667e784e390ce792041923a2fd09b9712c))
* Implement lightweight secure handler ID generation to prevent prediction attacks ([2b9cde5](https://github.com/mineclover/context-action/commit/2b9cde5e0dd1a8efbcef796e3e44bb14f9faf480))
* implement proper abort functionality using dispatchWithResult ([7659ffc](https://github.com/mineclover/context-action/commit/7659ffc9322ff49cd9c7911feed25a0722d6d5df))
* Improve GitHub Actions CI/CD reliability ([3e7681b](https://github.com/mineclover/context-action/commit/3e7681bed9ec4196bec0ca57a36f653ddabb4450))
* improve performance test page layout and text wrapping ([4bb2075](https://github.com/mineclover/context-action/commit/4bb2075df6bf4b759d6c3d53cff97c23bf28c99b))
* **monorepo:** resolve TS2742 errors by centralizing @types/react management ([9bae636](https://github.com/mineclover/context-action/commit/9bae636f4a14e2ca7e3c26136f8d98f57040c79c))
* **mouse-events:** ensure continuous path drawing during mouse movement ([5d0a489](https://github.com/mineclover/context-action/commit/5d0a489d4cb8b4ec05061a4830e88af9fa8e1f22))
* pnpm 버전 호환성 문제 해결 ([c294980](https://github.com/mineclover/context-action/commit/c294980912fec9493ba00250de5ba8b314ce0973))
* pnpm-lock.yaml 파일 추가로 GitHub Actions CI/CD 수정 ([4c35d7a](https://github.com/mineclover/context-action/commit/4c35d7a10323cf4ed5b3ddb310136f5783577f1f))
* prevent 0,0 positions in mouse tracking ([548cb7b](https://github.com/mineclover/context-action/commit/548cb7bd0bcda0c8925f86fe6ca540f1262de136))
* Provider 순서 문제 해결 ([e87978f](https://github.com/mineclover/context-action/commit/e87978f59307ac0fb1339589c36471847b093823))
* react-dev, core-dev 패키지 빌드 에러 해결 ([4a3314d](https://github.com/mineclover/context-action/commit/4a3314dfd46fbaf15748c38e38dc1e19796b834d))
* **react:** add React types to tsconfig to resolve TS2742 errors ([c916f49](https://github.com/mineclover/context-action/commit/c916f494c1bc1387f7f841b68624dc34ad1ba6e2))
* **react:** remove unused StoreConfig import ([19c58ab](https://github.com/mineclover/context-action/commit/19c58ab23f3e3c7f1d7b550fbc7eecdf9a5a6d46))
* **react:** resolve Jest TypeScript errors and improve type safety ([eda7645](https://github.com/mineclover/context-action/commit/eda7645584339e00f5b7b3fcf76030cb5f02ef9e))
* repair docs:api script and complete logger package integration ([edc440e](https://github.com/mineclover/context-action/commit/edc440e440450994217e4dc94582d4fa91b6988d))
* resolve Context Provider re-rendering during mouse events ([f5c796c](https://github.com/mineclover/context-action/commit/f5c796cf035a6874f5c50eaeb7b6cfe3ef6a0362))
* Resolve infinite loop in Core Advanced page and fix LogMonitor Store types ([a043409](https://github.com/mineclover/context-action/commit/a0434096bc1eef777cc0a444d5670eb4e5c77405))
* Resolve infinite loop in Store Basics page ([43a7649](https://github.com/mineclover/context-action/commit/43a7649ac330a08b4ca04f8d762863e4abea18c0))
* resolve infinite re-rendering in ReactContextPage ([d502571](https://github.com/mineclover/context-action/commit/d502571420a0fb9c7818dde17b9e910dfcf634e6))
* resolve Isolated Renderer cursor and path tracking issues ([ee6315e](https://github.com/mineclover/context-action/commit/ee6315e7df6a9c86902fa19041485ba273ea3a84))
* resolve mouse tracker 0,0 initialization issue ([23074ef](https://github.com/mineclover/context-action/commit/23074ef8b00f277df5a992eb6c32d558e4b3b86b))
* resolve store initialization warning for falsy values ([9fabce8](https://github.com/mineclover/context-action/commit/9fabce846c2b927fd7a753144f50bd4f891e046a))
* resolve tracker moving to 0,0 by fixing context initial values ([521d81c](https://github.com/mineclover/context-action/commit/521d81ca531aebcce7a1c1026282a12110033933))
* resolve TypeScript type safety issues across packages ([9fe20b9](https://github.com/mineclover/context-action/commit/9fe20b9c5a249c262119fde5d35b3a094991963f))
* resolve useStoreSync type conflicts and complete example migrations ([5a2e638](https://github.com/mineclover/context-action/commit/5a2e638f037e03aab616eeba148f7136729006b0))
* Resolve Vue build error caused by TypeScript generic syntax in API documentation ([7cdc285](https://github.com/mineclover/context-action/commit/7cdc285ec9e9ba0adc68ddc83661b5fb6fe5b278))
* resolve zero re-rendering and 0,0 tracker position issues ([99247c8](https://github.com/mineclover/context-action/commit/99247c8cbe8eb6feb9c77ddbfe3a0cbd8b4b774e))
* Store 불변성 보장을 위한 깊은 복사 구현 및 테스트 추가 ([453dd1e](https://github.com/mineclover/context-action/commit/453dd1efe261821028c91cc674241bc2e39274e5))
* test-app tsconfig.json 참조 경로 수정 ([4d1ec3e](https://github.com/mineclover/context-action/commit/4d1ec3e5641b3cabac7d827fb113ccad8b10189b))
* Toast 시스템 및 LogMonitor 타입 호환성 문제 해결 ([e7f7a20](https://github.com/mineclover/context-action/commit/e7f7a20a07d6b594a4cc3ffbcd9ee1ecf15166a4))
* TypeScript 타입 오류 수정 및 GitHub Actions workflow 개선 ([06edbd0](https://github.com/mineclover/context-action/commit/06edbd01542ace77d8a481529c7a85dbbf001604))
* Update CI/CD workflows to use pnpm 9 for lockfile compatibility ([4aae6fa](https://github.com/mineclover/context-action/commit/4aae6fa55b96fa1397b0b86d89f09c2fc18c09b4))
* Update GitHub Actions workflow for new glossary structure ([404a5a8](https://github.com/mineclover/context-action/commit/404a5a8343c5c5311f3b0681040250186964fd2a))
* Update test scripts to pass with no tests ([59a08d4](https://github.com/mineclover/context-action/commit/59a08d435ad52698497b220277569a521f89f5d7))
* **workflows:** resolve YAML schema errors in GitHub workflows ([f73b52e](https://github.com/mineclover/context-action/commit/f73b52edb87024e4731af4458070a7993f2b6e02))
* 개발용 패키지 빌드 및 린팅 오류 수정 ([1ebb9e2](https://github.com/mineclover/context-action/commit/1ebb9e20ee8d8e3a791ec9fd99d2908dad200d40))
* 사용되지 않는 import 및 변수 제거 ([d40dc0e](https://github.com/mineclover/context-action/commit/d40dc0e2dfd9f277f334ec156a0218f56570ae10))


### Code Refactoring

* Remove legacy store patterns and simplify to Declarative Store Pattern only ([3ae23eb](https://github.com/mineclover/context-action/commit/3ae23eb3db0ec868dfd9cec0717f43e91b288901))


### Features

* Action Register 연동 토스트 시스템 구현 🍞 ([c3e7c15](https://github.com/mineclover/context-action/commit/c3e7c1514a8bce9d83e65a0e9d3284c3011a29d0))
* Add @context-action/jotai package for Jotai integration ([be199b8](https://github.com/mineclover/context-action/commit/be199b8c5a35a20bce03a5abc93ba282cdb8ef8d))
* add AbortableSearchExample demonstrating automatic action abortion ([7eb03b7](https://github.com/mineclover/context-action/commit/7eb03b7668d436d77d7e7b76b870cd425899f474))
* add AbortSignal support to core ActionRegister dispatch methods ([315cae7](https://github.com/mineclover/context-action/commit/315cae7509cc834b2cca183ff0025c10bb22ea6e))
* Add ActionGuard demo routes and navigation ([345e7db](https://github.com/mineclover/context-action/commit/345e7dba29619f6efbb3de7f7cfdc6c7da99bffa))
* Add ActionGuard presets and patterns system ([c45b032](https://github.com/mineclover/context-action/commit/c45b0329a1fefb386cf3d54a8549600aecadd3fa))
* Add bundle size analysis automation ([40db3ec](https://github.com/mineclover/context-action/commit/40db3ec60304f3775f2e3f0c508d26615264cd41))
* Add comprehensive ActionGuard demonstration pages ([a626119](https://github.com/mineclover/context-action/commit/a62611924599e837268d4af51df3722437958d0f))
* Add comprehensive Korean documentation and enhanced CI/CD ([9381c58](https://github.com/mineclover/context-action/commit/9381c58c2383b7f0b63445f7bdb4f0cc394e8642))
* Add comprehensive logging system with OpenTelemetry support ([0a46cdd](https://github.com/mineclover/context-action/commit/0a46cdd265dee54c41a28751dfcb3db939dc6fb6))
* Add comprehensive store management system with Context API and sync utilities ([1b49f3b](https://github.com/mineclover/context-action/commit/1b49f3b2291a38877668864f1cd53eccaae5fa90))
* Add comprehensive test suite with React Router ([3bc89ff](https://github.com/mineclover/context-action/commit/3bc89ffc832e9eb900f0c3ca41e182c2f4426c25))
* add comprehensive type tests and improve error handling ([091e221](https://github.com/mineclover/context-action/commit/091e22159a5809a6a5152aad8b5679cb2b135de3))
* Add Context Action logo ([4c32c93](https://github.com/mineclover/context-action/commit/4c32c9386b014de4efbe2bc211377d158a508a08))
* add Context Store Mouse Events page and enhance mouse event handling ([7c185da](https://github.com/mineclover/context-action/commit/7c185da9973c9ad8f639cc1cbd14b3625db9241e))
* Add Context Store Pattern for Provider-level Registry isolation ([100b8a3](https://github.com/mineclover/context-action/commit/100b8a31c667bcda003d2fcc6e3e3c398892bb3a))
* Add environment-based ActionGuard configuration system ([19a505e](https://github.com/mineclover/context-action/commit/19a505e7252709f1344fe8b91a6602b459148227))
* Add Lerna and pnpm configuration for monorepo management ([92dad4d](https://github.com/mineclover/context-action/commit/92dad4d7f468d75da354a8f6c298be5996edf1b7))
* Add logging system to jotai and react packages ([44d5363](https://github.com/mineclover/context-action/commit/44d536324bcc1a78da5d990279f01fd1352d1d25))
* add new action guard demo pages and optimize routing ([32dfd77](https://github.com/mineclover/context-action/commit/32dfd779b6847dc88116e8b3eb75397ad27cd494))
* add new hook exports to ActionGuard Context files ([4e49a48](https://github.com/mineclover/context-action/commit/4e49a483927dd9ab183ef60f8a3051a474527b01))
* add react-router v7.8.0 and refactor App component structure ([ced1394](https://github.com/mineclover/context-action/commit/ced139413394ddae1890ea72b18bc84a26007688))
* add visual animation effects for priority count updates ([9a91122](https://github.com/mineclover/context-action/commit/9a911226b0ddd9a2ae828c1a388cf42f5ebdd8e4))
* Change default log level to TRACE in environment variables ([d2a95d0](https://github.com/mineclover/context-action/commit/d2a95d02531a29943296e28ff40b3833c6858b4d))
* class-variance-authority와 cn 함수 타입 안전성 개선 ([8156c07](https://github.com/mineclover/context-action/commit/8156c070b2530622ae41ee78e2925b572d24802d))
* complete ActionProvider migration and remove [@ts-nocheck](https://github.com/ts-nocheck) ([b173444](https://github.com/mineclover/context-action/commit/b1734441dade5eec8268d3870c85a5538aadcecf))
* Complete comprehensive test suite implementation ([c8ab6fe](https://github.com/mineclover/context-action/commit/c8ab6fe9119687fa04d1ec1e22ef64023512bd25))
* Complete glossary system with comprehensive guidelines and conventions ([93db290](https://github.com/mineclover/context-action/commit/93db290ecd26384ab7c5b05a938900440cd35c40))
* Complete jq-based glossary query system with enhanced search ([49dec90](https://github.com/mineclover/context-action/commit/49dec9091245a20645e69711af128e7e395395f8))
* Complete React pages modularization and improve error handling ([19bc5a6](https://github.com/mineclover/context-action/commit/19bc5a6fd565688e90bc7f3069b1afd91cbb9cf1))
* **core:** Fix execution abort functionality and improve handler management ([88e3dd4](https://github.com/mineclover/context-action/commit/88e3dd407a039585a35467935d66261f668cf3ea))
* createActionContext를 주요 방식으로 재정립 ([85b69e5](https://github.com/mineclover/context-action/commit/85b69e5ffdbb6470b587c6f7c96a0cabaf04c68a))
* **deploy:** separate example app to independent GitHub Pages deployment ([28e6408](https://github.com/mineclover/context-action/commit/28e64085b194af546c73881b917608d0598dffad))
* deprecate logger and jotai packages ([c863970](https://github.com/mineclover/context-action/commit/c8639708f489612acd5f08b0391cc7c86d859cd8))
* dispatch 옵션 업그레이드 - debounce, throttle, executionMode 지원 ([1b84388](https://github.com/mineclover/context-action/commit/1b8438857e97decaff02070d4a51e638d2b8a9ce))
* **docs:** Add API documentation generation guide and update sidebar ([6d65f50](https://github.com/mineclover/context-action/commit/6d65f5034c50f3d85612f004263eb734e63b1b14))
* **docs:** Enhance API documentation structure and synchronization ([65cc7f6](https://github.com/mineclover/context-action/commit/65cc7f6a7cb36d226c3709b7027dde61ece43050))
* **docs:** enhance project philosophy and apply renaming conventions ([ef69207](https://github.com/mineclover/context-action/commit/ef69207ef1e0bd5dcc84ec76c3069914c9bf61b1))
* **docs:** Update .gitignore and enhance CI/CD API documentation ([f5709fd](https://github.com/mineclover/context-action/commit/f5709fd73f88dcd1e64ed39b79ca38a528084dc6))
* enable all ActionGuard page routes and complete navigation ([c6d3698](https://github.com/mineclover/context-action/commit/c6d36981b63dc9879b7fe637bf161feea9955573))
* enable React provider pages and fix ActionProvider migrations ([f0062ed](https://github.com/mineclover/context-action/commit/f0062ed393a8550e7e96484a37850dbedc11b805))
* Enhance action handler priority system and documentation ([6a5bca8](https://github.com/mineclover/context-action/commit/6a5bca8876331bb97ff8a6cebc90886620de5b88))
* enhance action registration with auto-abort functionality ([d80aa5b](https://github.com/mineclover/context-action/commit/d80aa5bb6cc9a6eea293288789aeb91005261796))
* Enhance core package documentation and type definitions ([17a84e0](https://github.com/mineclover/context-action/commit/17a84e0e1465d0ebcddfc92ae3c6b767f8f20401))
* Enhance documentation and improve ActionRegister functionality ([bde754b](https://github.com/mineclover/context-action/commit/bde754b82f079cc378b9e414dc7d66ec062ae71d))
* enhance performance metrics tracking in AdvancedMetricsPanel ([0efded9](https://github.com/mineclover/context-action/commit/0efded9703083d1b541b439c5aae419b2fd165ad))
* enhance priority test execution with configurable delays and improved state management ([b95702e](https://github.com/mineclover/context-action/commit/b95702e628653e6262d9465013218b3dff42c2d8))
* enhance priority test management with execution state tracking ([69593af](https://github.com/mineclover/context-action/commit/69593af01f15eb09f3c26e25b966d05fbfbc46ec))
* enhance PriorityTestPage with handler management controls ([6651727](https://github.com/mineclover/context-action/commit/6651727c53e3a8612dac1561dd27072f69c80a06))
* enhance Toast container with better overflow management ([80d8661](https://github.com/mineclover/context-action/commit/80d8661f3d6a32c9ebd2ca27ee9cb4372fd9ddb0))
* **example:** Add comprehensive store management demo pages ([e1f0162](https://github.com/mineclover/context-action/commit/e1f0162ec6f71d7098f5289b4463bd7cf0353d8b))
* **example:** Add store system navigation and improve code formatting ([fa1b785](https://github.com/mineclover/context-action/commit/fa1b785a369b9b25e04096a0544b52f7e11d5b17))
* **example:** Add store system pages and update React index page ([d39e848](https://github.com/mineclover/context-action/commit/d39e8486534eef5b5175cba14690a6377a664e04))
* **example:** Complete Priority Test Page with modular hooks and abort functionality ([190335d](https://github.com/mineclover/context-action/commit/190335dc761fb33ef23bd293a0ba386aa6baad28))
* **example:** HOC 패턴 페이지 추가 및 라우터 업데이트 ([20ec485](https://github.com/mineclover/context-action/commit/20ec4851460f4589004a12114fea14acf7a67636))
* **example:** optimize progress bar and fix abort functionality ([ffc1b21](https://github.com/mineclover/context-action/commit/ffc1b21a2364c84ca15bbc20c9adfbc5386e1ca2))
* extend StoreConfig to match PATTERN_GUIDE.md requirements ([a964c38](https://github.com/mineclover/context-action/commit/a964c3872b495e1fbddaa8a1b9602e41690d92b3))
* GitHub Pages 자동 배포 설정 ([44d6378](https://github.com/mineclover/context-action/commit/44d6378b44f14c1464066495c2bb5e17c847a741))
* **glossary:** Extract architecture patterns from example code ([513faac](https://github.com/mineclover/context-action/commit/513faacd543208e26abbfbe1ea997206f28d7699))
* **glossary:** 스캐너 개선으로 ActionRegister 클래스 인식 및 구현 커버리지 35%로 향상 ([55d0a39](https://github.com/mineclover/context-action/commit/55d0a397ff33c90f6da3c4d28b09a76f60a14f55))
* HMR 시스템 완성 및 Core Store 비교 최적화 ([ccc5029](https://github.com/mineclover/context-action/commit/ccc50299f49d7d6fa115ef389a7eabdb52e4b0c5))
* implement Canvas-style isolated mouse renderer ([a46193b](https://github.com/mineclover/context-action/commit/a46193b2424931524737a251196b636bf59fc1e5))
* implement complete pipeline control system with execution modes and action guards ([7f27112](https://github.com/mineclover/context-action/commit/7f2711279c6dd28e8a468b4313baeb0d61180e90))
* Implement comprehensive ActionGuard hook system ([8077ab3](https://github.com/mineclover/context-action/commit/8077ab36c3593bae6f15b4d3d2d0d7e3b2b9de75))
* Implement comprehensive glossary system for Context-Action framework ([34ad6eb](https://github.com/mineclover/context-action/commit/34ad6eb6ab1ad5a1c23ef3d3b2a2bc6628541e73))
* implement Context Store Mouse Events architecture ([677a319](https://github.com/mineclover/context-action/commit/677a319323748b37c88dd56c59e5fa8a8de11f3f))
* Implement Declarative Store Pattern with Action Registry-style design ([36702e3](https://github.com/mineclover/context-action/commit/36702e37fd5ce7ad0263931a26e24712d8dd2a35))
* Implement enhanced Store value comparison system for render optimization ([2c374d4](https://github.com/mineclover/context-action/commit/2c374d4488b42f4687eb268cacc4b9fb3967cba6))
* Implement fundamental Stable API pattern to eliminate infinite loops at root cause ([3d74268](https://github.com/mineclover/context-action/commit/3d74268c50719c4588c638a9c94bcd90c7e7accb))
* implement generic pattern support for createStoreContext and createActionContext ([c0da9e1](https://github.com/mineclover/context-action/commit/c0da9e1c13effb9750e52c9fd9f3722e808d3a9b))
* Implement HOC patterns for Context Store Pattern ([bb8940e](https://github.com/mineclover/context-action/commit/bb8940e77772377cffe221af83908b594fdbf41e))
* Implement internal ActionRegister routing while preserving external API ([f2ff8a8](https://github.com/mineclover/context-action/commit/f2ff8a8c762d52f1a0663a2bc895c103bca1dbed))
* Implement Log Monitor component with logging context and UI ([95da93a](https://github.com/mineclover/context-action/commit/95da93a993270a8afbc0a3ed65419a8a936de263))
* implement smart event logging throttling to reduce Toast spam ([7e4094c](https://github.com/mineclover/context-action/commit/7e4094cc3cb53db25f98c70731cce45966714ce9))
* implement unified createStoreContext with simplified API ([ff88e6f](https://github.com/mineclover/context-action/commit/ff88e6f5db86e13b4afd3f16e451d273d7c693cb))
* improve ActionGuard index page UX and navigation ([46c63a7](https://github.com/mineclover/context-action/commit/46c63a7f8c8091b615eae57add78f6886965409f))
* improve hook naming clarity with backwards compatibility ([485297e](https://github.com/mineclover/context-action/commit/485297ef164c69a4fc5b3607c493c0a949616ab9))
* Improve LogMonitor display with ID visibility and reverse chronological order ([8d6dde7](https://github.com/mineclover/context-action/commit/8d6dde7d9a811c91d541de88c3dab3f51f1996e6)), closes [#f3f4f6](https://github.com/mineclover/context-action/issues/f3f4f6)
* improve performance test page layout and remove unnecessary progress tracking ([7bf0660](https://github.com/mineclover/context-action/commit/7bf0660351e203b638d678b74dfdc888ce91bb43))
* Improve useAction hook with better error handling ([5f2b3cb](https://github.com/mineclover/context-action/commit/5f2b3cbc5a8432218f531cd3408c671acd51468f))
* integrate ActionTestProvider for action management in PriorityTestPage ([478aaf4](https://github.com/mineclover/context-action/commit/478aaf49f0e3a92919e99dbdfe0b86a40f1c3721))
* integrate comprehensive logging system across all packages ([515ba5d](https://github.com/mineclover/context-action/commit/515ba5daf64e4ef1a1acb52c9d7d778884287419))
* introduce Store-Based Mouse Events architecture ([ffbf1e7](https://github.com/mineclover/context-action/commit/ffbf1e71374f17232b1f0fd9169651c3e7e377af))
* Major architecture refactoring and documentation update ([aadb45d](https://github.com/mineclover/context-action/commit/aadb45d0bc86502243b2390a1c6da7d4736e0208))
* **mouse-events:** enhance context-store demo with advanced UI and features ([e188077](https://github.com/mineclover/context-action/commit/e18807732ea6b2e1365ab4ff4448c7b3a7028cdb))
* **mouse-events:** implement fully functional context-store demo page ([2b266ba](https://github.com/mineclover/context-action/commit/2b266bace15e8c029911a7061983488582af73ff))
* **mouse-events:** improve click point connections with clear visual separation ([bbaca4b](https://github.com/mineclover/context-action/commit/bbaca4b45c8fc2022d360b93934e139bf6e28b9b))
* optimize mouse events system with high-performance real-time tracking ([07d6369](https://github.com/mineclover/context-action/commit/07d636984ae2949c7520b99d9c21f41f9c770a1f))
* optimize usePriorityTestManager for improved handler management ([20c125c](https://github.com/mineclover/context-action/commit/20c125c87791de38179eec73d3eb665e275f11bd))
* React 18.3.1 버전 통일로 타입 호환성 개선 ([eba7a49](https://github.com/mineclover/context-action/commit/eba7a490fc53fa694d497e3d5202f56d04db3f39))
* React Context 양방향 통신 패턴 구현 및 예제 정리 ([a445d7d](https://github.com/mineclover/context-action/commit/a445d7d9d19059eff54e0a15df876daf15c65baf))
* React Context 페이지 종합 개선 및 예제 애플리케이션 확장 ([d059371](https://github.com/mineclover/context-action/commit/d059371688e6aa6902378432214bc63351636582))
* React 패키지 Bundle Re-export Pattern 모듈화 완료 ([2075020](https://github.com/mineclover/context-action/commit/2075020960c1a9501a2c8393bab97f50c9bc1ad2))
* **react:** comprehensive hook testing and examples system ([d33ed62](https://github.com/mineclover/context-action/commit/d33ed62db7a95c247a85f7cae575b716dd4e38aa))
* **react:** Implement MVVM architecture patterns with store integration ([9f3afce](https://github.com/mineclover/context-action/commit/9f3afce1fc5f4173d0387dbf5444f3b78fdd07bc))
* **react:** Store 시스템 개선 및 withStore HOC 추가 ([828f764](https://github.com/mineclover/context-action/commit/828f764ec0b67eb5217d39c4bb9f6ef9b268ae3e))
* remove ActionProvider and standardize on createActionContext with automatic abort ([75f0908](https://github.com/mineclover/context-action/commit/75f090854020b7866aeef240b914138f3a490cad))
* Remove deprecated example files and documentation ([fde7a78](https://github.com/mineclover/context-action/commit/fde7a782ccaa480683d83241b9f1c0946647eb6e))
* restructure VitePress config with top-down architecture ([e2ded98](https://github.com/mineclover/context-action/commit/e2ded9845c60395a1fa6e5fac6c62197368881a4))
* Search page Update ([b698955](https://github.com/mineclover/context-action/commit/b698955ae31e3b2da05d0f640acf49607a92b5ae))
* separate logger into independent package ([6cb727c](https://github.com/mineclover/context-action/commit/6cb727cfe03230d03e9f928fb92d86c2d3ae7360))
* Settings Management에 구체적인 테스트 시나리오 추가 ([5273fbe](https://github.com/mineclover/context-action/commit/5273fbeb801252487377b15a9b0c4fa599028b17))
* step2 refactor usePriorityTestManager with MVVM architecture ([a29e15c](https://github.com/mineclover/context-action/commit/a29e15c9115f702fc2c194cf3e92bf83859bf881))
* Store Full Demo UX 흐름 개선 - 탭 기반 내비게이션 추가 ([f3bf5bd](https://github.com/mineclover/context-action/commit/f3bf5bdd3b944e2fe25aaf097da8b71b8a71e3de))
* Store 시나리오 완전 모듈화 - 관심사 분리 구조 구현 ([928fa05](https://github.com/mineclover/context-action/commit/928fa056739eb3690207edf423a79d6ef379aaef))
* Tailwind CSS + CVA 기반 UI 시스템 리팩토링 ([2920b84](https://github.com/mineclover/context-action/commit/2920b848aa0d47363ed83087a8a12f9f470e2a94))
* Tailwind CSS + CVA 리팩토링 완료 ([cd08e66](https://github.com/mineclover/context-action/commit/cd08e660008a074495bdbd477a669c281883cdab))
* Tailwind CSS v3 + CVA 스타일 시스템 완전 적용 ([284726d](https://github.com/mineclover/context-action/commit/284726dd8ad01cabe0b10ec691fcc2d84c165bc0))
* Temporarily disable glossary sync workflow ([ea01c73](https://github.com/mineclover/context-action/commit/ea01c73b5a38d71d111c30da2a0d2fdefecae9e9))
* Toast Config Example 페이지 추가 및 Toast 시스템 개선 ([8d39f12](https://github.com/mineclover/context-action/commit/8d39f12ec4c1796fe56714089b34c8fe9b1f126d))
* Todo & Chat 데모 완전 구현 - 디테일 향상 ([fa0a3f6](https://github.com/mineclover/context-action/commit/fa0a3f60cc4a74b7b1e5a8073074f35c53d7521a))
* UI 개선 및 사용자 경험 향상 ([59fc867](https://github.com/mineclover/context-action/commit/59fc86760dbe4e22986407c163604ee8e04759f5))
* Universal Trace Logger 시스템 구현 ([643f81b](https://github.com/mineclover/context-action/commit/643f81bebb785fe4a30d349902d9c99ed8d93edf))
* Update glossary implementation dashboard and add translation checker tool ([e031ae3](https://github.com/mineclover/context-action/commit/e031ae3ed863cb41cee5d8712a20db5b551912c4))
* Update logging configuration and enhance JSON settings ([8b15e76](https://github.com/mineclover/context-action/commit/8b15e76ff48c03aca2c876bf5f13eed36e26766b))
* Upgrade Action Context Pattern to Declarative Store spec and remove version tags ([9be2589](https://github.com/mineclover/context-action/commit/9be25895724fb57f97de6ea0c98db3e8b586bda6))
* useActionWithResult 종합 예시 페이지 추가 ([4d3579c](https://github.com/mineclover/context-action/commit/4d3579c52f96d7eb3aff598382b75e0a43e9d9ef))
* 개발용 패키지와 모니터링 툴 추가 ([c7f29ee](https://github.com/mineclover/context-action/commit/c7f29eeb991732e8c445a5b77138e17f795dac24))
* 개별 핸들러 시스템으로 Priority Test 페이지 개선 ([b76d154](https://github.com/mineclover/context-action/commit/b76d154b3b2409519e62a1d21c1b69773841eb6d))
* 대용량 JSON 환경용 신뢰도 검증 시스템 구축 ([c50f048](https://github.com/mineclover/context-action/commit/c50f048f2f6dc9ee0f6618e04ad430ac9ff726c7))
* 레거시 코드 제거 및 외부 abort 기능 개선 ([f4a0d18](https://github.com/mineclover/context-action/commit/f4a0d18d316656ba74182c376ffd65ed039ab747))
* 로깅-토스트 컨벤션 일괄 적용 완료 ([25eaa2b](https://github.com/mineclover/context-action/commit/25eaa2b99cc2e475b9c862a23e7f155116f1f21e))
* 모든 logger 요소를 TRACE 레벨로 변경하고 createAtomContext에서 config 매개변수 제거 ([130eee6](https://github.com/mineclover/context-action/commit/130eee6f98c3fafaa13dc237a4f08e9f1ee1fbd8))
* 모든 페이지에 LogMonitor 통합 및 타입 에러 해결 ([d3300ca](https://github.com/mineclover/context-action/commit/d3300ca9998d6a807e33fbd08c8700fba476a8f7))
* 번들 사이즈 대폭 최적화 및 코드 품질 개선 ([98a522e](https://github.com/mineclover/context-action/commit/98a522ed0ee1c92014c11f9b6377e60c399cd227))
* 실시간 모니터링 툴 추가 ([e08420c](https://github.com/mineclover/context-action/commit/e08420cec6549071af678a1a596c056e48cb0a4a))
* 액션 실행 결과 반환 및 수집 시스템 구현 ([071131e](https://github.com/mineclover/context-action/commit/071131e286c392feef97d57ed3c08497c9add395))
* 종합 example 앱 구현 완료 - 8가지 데모 페이지 추가 ([9fa7e80](https://github.com/mineclover/context-action/commit/9fa7e804a400fd795f9eff4f62d5681959295b24))
* 주요 example 파일들을 Context Store 패턴으로 완전 전환 ([5d7de93](https://github.com/mineclover/context-action/commit/5d7de93cc252492ddae88c406e8a209779eec298))
* 파이프라인 결과 처리 시스템과 핸들러 메타데이터 확장 ([554dd29](https://github.com/mineclover/context-action/commit/554dd29a06f04371b1e84ad6458fbfee7f205ed0))
* 핵심 용어 JSDoc 태그 구현으로 용어집 매칭률 67% 달성 ([64b19e1](https://github.com/mineclover/context-action/commit/64b19e1be9da70106a26313c50f49da8eed8bfbb))


### Performance Improvements

* **mouse-events:** optimize cursor tracking for smooth 60fps performance ([952b449](https://github.com/mineclover/context-action/commit/952b449598cace3fe820dd99d303eaee3d901608))
* **mouse-events:** optimize path rendering for smooth real-time drawing ([9fc4a21](https://github.com/mineclover/context-action/commit/9fc4a21d66ca54bc2436cc632900f455c11c85fd))
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

* Apply JSDoc template syntax fix across all TypeScript files ([f5d649f](https://github.com/mineclover/context-action/commit/f5d649f8193f8da6f5b3814fef5ef36eeafb64a5))
* completely prevent 0,0 position artifacts in mouse tracking ([2f07f24](https://github.com/mineclover/context-action/commit/2f07f247afdcab4ad383fd02dc03a3ba77dfb8a3))
* **context-store:** improve Context Store pattern with type safety and reset functionality ([b908345](https://github.com/mineclover/context-action/commit/b90834575285deae50b68b3f71b1b2b06c81ee10))
* Disable logo in documentation ([00d2c18](https://github.com/mineclover/context-action/commit/00d2c18026688cf9039dfaf9d004ad7cbab24738))
* ESLint 설정 파일 ES 모듈 호환성 문제 해결 ([1a92051](https://github.com/mineclover/context-action/commit/1a92051a2a3b48fbb502c7c65ee896c600661ce5))
* example directory 빌드 오류 및 import 이슈 해결 ([4528adc](https://github.com/mineclover/context-action/commit/4528adc4109ac1756784aea09240dece045472ca))
* Fix TypeScript project references for workspace dependencies ([85e72b7](https://github.com/mineclover/context-action/commit/85e72b701e743e39eaf7b72dad338e5fd95109d6))
* GitHub Pages 자동 활성화를 위한 enablement 옵션 추가 ([267c236](https://github.com/mineclover/context-action/commit/267c23667e784e390ce792041923a2fd09b9712c))
* Implement lightweight secure handler ID generation to prevent prediction attacks ([2b9cde5](https://github.com/mineclover/context-action/commit/2b9cde5e0dd1a8efbcef796e3e44bb14f9faf480))
* implement proper abort functionality using dispatchWithResult ([7659ffc](https://github.com/mineclover/context-action/commit/7659ffc9322ff49cd9c7911feed25a0722d6d5df))
* Improve GitHub Actions CI/CD reliability ([3e7681b](https://github.com/mineclover/context-action/commit/3e7681bed9ec4196bec0ca57a36f653ddabb4450))
* improve performance test page layout and text wrapping ([4bb2075](https://github.com/mineclover/context-action/commit/4bb2075df6bf4b759d6c3d53cff97c23bf28c99b))
* pnpm 버전 호환성 문제 해결 ([c294980](https://github.com/mineclover/context-action/commit/c294980912fec9493ba00250de5ba8b314ce0973))
* pnpm-lock.yaml 파일 추가로 GitHub Actions CI/CD 수정 ([4c35d7a](https://github.com/mineclover/context-action/commit/4c35d7a10323cf4ed5b3ddb310136f5783577f1f))
* prevent 0,0 positions in mouse tracking ([548cb7b](https://github.com/mineclover/context-action/commit/548cb7bd0bcda0c8925f86fe6ca540f1262de136))
* Provider 순서 문제 해결 ([e87978f](https://github.com/mineclover/context-action/commit/e87978f59307ac0fb1339589c36471847b093823))
* react-dev, core-dev 패키지 빌드 에러 해결 ([4a3314d](https://github.com/mineclover/context-action/commit/4a3314dfd46fbaf15748c38e38dc1e19796b834d))
* repair docs:api script and complete logger package integration ([edc440e](https://github.com/mineclover/context-action/commit/edc440e440450994217e4dc94582d4fa91b6988d))
* resolve Context Provider re-rendering during mouse events ([f5c796c](https://github.com/mineclover/context-action/commit/f5c796cf035a6874f5c50eaeb7b6cfe3ef6a0362))
* Resolve infinite loop in Core Advanced page and fix LogMonitor Store types ([a043409](https://github.com/mineclover/context-action/commit/a0434096bc1eef777cc0a444d5670eb4e5c77405))
* Resolve infinite loop in Store Basics page ([43a7649](https://github.com/mineclover/context-action/commit/43a7649ac330a08b4ca04f8d762863e4abea18c0))
* resolve Isolated Renderer cursor and path tracking issues ([ee6315e](https://github.com/mineclover/context-action/commit/ee6315e7df6a9c86902fa19041485ba273ea3a84))
* resolve mouse tracker 0,0 initialization issue ([23074ef](https://github.com/mineclover/context-action/commit/23074ef8b00f277df5a992eb6c32d558e4b3b86b))
* resolve store initialization warning for falsy values ([9fabce8](https://github.com/mineclover/context-action/commit/9fabce846c2b927fd7a753144f50bd4f891e046a))
* resolve tracker moving to 0,0 by fixing context initial values ([521d81c](https://github.com/mineclover/context-action/commit/521d81ca531aebcce7a1c1026282a12110033933))
* resolve TypeScript type safety issues across packages ([9fe20b9](https://github.com/mineclover/context-action/commit/9fe20b9c5a249c262119fde5d35b3a094991963f))
* resolve useStoreSync type conflicts and complete example migrations ([5a2e638](https://github.com/mineclover/context-action/commit/5a2e638f037e03aab616eeba148f7136729006b0))
* Resolve Vue build error caused by TypeScript generic syntax in API documentation ([7cdc285](https://github.com/mineclover/context-action/commit/7cdc285ec9e9ba0adc68ddc83661b5fb6fe5b278))
* resolve zero re-rendering and 0,0 tracker position issues ([99247c8](https://github.com/mineclover/context-action/commit/99247c8cbe8eb6feb9c77ddbfe3a0cbd8b4b774e))
* Store 불변성 보장을 위한 깊은 복사 구현 및 테스트 추가 ([453dd1e](https://github.com/mineclover/context-action/commit/453dd1efe261821028c91cc674241bc2e39274e5))
* test-app tsconfig.json 참조 경로 수정 ([4d1ec3e](https://github.com/mineclover/context-action/commit/4d1ec3e5641b3cabac7d827fb113ccad8b10189b))
* Toast 시스템 및 LogMonitor 타입 호환성 문제 해결 ([e7f7a20](https://github.com/mineclover/context-action/commit/e7f7a20a07d6b594a4cc3ffbcd9ee1ecf15166a4))
* TypeScript 타입 오류 수정 및 GitHub Actions workflow 개선 ([06edbd0](https://github.com/mineclover/context-action/commit/06edbd01542ace77d8a481529c7a85dbbf001604))
* Update CI/CD workflows to use pnpm 9 for lockfile compatibility ([4aae6fa](https://github.com/mineclover/context-action/commit/4aae6fa55b96fa1397b0b86d89f09c2fc18c09b4))
* Update GitHub Actions workflow for new glossary structure ([404a5a8](https://github.com/mineclover/context-action/commit/404a5a8343c5c5311f3b0681040250186964fd2a))
* Update test scripts to pass with no tests ([59a08d4](https://github.com/mineclover/context-action/commit/59a08d435ad52698497b220277569a521f89f5d7))
* 개발용 패키지 빌드 및 린팅 오류 수정 ([1ebb9e2](https://github.com/mineclover/context-action/commit/1ebb9e20ee8d8e3a791ec9fd99d2908dad200d40))
* 사용되지 않는 import 및 변수 제거 ([d40dc0e](https://github.com/mineclover/context-action/commit/d40dc0e2dfd9f277f334ec156a0218f56570ae10))


### Code Refactoring

* Remove legacy store patterns and simplify to Declarative Store Pattern only ([3ae23eb](https://github.com/mineclover/context-action/commit/3ae23eb3db0ec868dfd9cec0717f43e91b288901))


### Features

* Action Register 연동 토스트 시스템 구현 🍞 ([c3e7c15](https://github.com/mineclover/context-action/commit/c3e7c1514a8bce9d83e65a0e9d3284c3011a29d0))
* Add @context-action/jotai package for Jotai integration ([be199b8](https://github.com/mineclover/context-action/commit/be199b8c5a35a20bce03a5abc93ba282cdb8ef8d))
* add AbortableSearchExample demonstrating automatic action abortion ([7eb03b7](https://github.com/mineclover/context-action/commit/7eb03b7668d436d77d7e7b76b870cd425899f474))
* add AbortSignal support to core ActionRegister dispatch methods ([315cae7](https://github.com/mineclover/context-action/commit/315cae7509cc834b2cca183ff0025c10bb22ea6e))
* Add ActionGuard demo routes and navigation ([345e7db](https://github.com/mineclover/context-action/commit/345e7dba29619f6efbb3de7f7cfdc6c7da99bffa))
* Add ActionGuard presets and patterns system ([c45b032](https://github.com/mineclover/context-action/commit/c45b0329a1fefb386cf3d54a8549600aecadd3fa))
* Add bundle size analysis automation ([40db3ec](https://github.com/mineclover/context-action/commit/40db3ec60304f3775f2e3f0c508d26615264cd41))
* Add comprehensive ActionGuard demonstration pages ([a626119](https://github.com/mineclover/context-action/commit/a62611924599e837268d4af51df3722437958d0f))
* Add comprehensive Korean documentation and enhanced CI/CD ([9381c58](https://github.com/mineclover/context-action/commit/9381c58c2383b7f0b63445f7bdb4f0cc394e8642))
* Add comprehensive logging system with OpenTelemetry support ([0a46cdd](https://github.com/mineclover/context-action/commit/0a46cdd265dee54c41a28751dfcb3db939dc6fb6))
* Add comprehensive store management system with Context API and sync utilities ([1b49f3b](https://github.com/mineclover/context-action/commit/1b49f3b2291a38877668864f1cd53eccaae5fa90))
* Add comprehensive test suite with React Router ([3bc89ff](https://github.com/mineclover/context-action/commit/3bc89ffc832e9eb900f0c3ca41e182c2f4426c25))
* Add Context Action logo ([4c32c93](https://github.com/mineclover/context-action/commit/4c32c9386b014de4efbe2bc211377d158a508a08))
* add Context Store Mouse Events page and enhance mouse event handling ([7c185da](https://github.com/mineclover/context-action/commit/7c185da9973c9ad8f639cc1cbd14b3625db9241e))
* Add Context Store Pattern for Provider-level Registry isolation ([100b8a3](https://github.com/mineclover/context-action/commit/100b8a31c667bcda003d2fcc6e3e3c398892bb3a))
* Add environment-based ActionGuard configuration system ([19a505e](https://github.com/mineclover/context-action/commit/19a505e7252709f1344fe8b91a6602b459148227))
* Add Lerna and pnpm configuration for monorepo management ([92dad4d](https://github.com/mineclover/context-action/commit/92dad4d7f468d75da354a8f6c298be5996edf1b7))
* Add logging system to jotai and react packages ([44d5363](https://github.com/mineclover/context-action/commit/44d536324bcc1a78da5d990279f01fd1352d1d25))
* add new action guard demo pages and optimize routing ([32dfd77](https://github.com/mineclover/context-action/commit/32dfd779b6847dc88116e8b3eb75397ad27cd494))
* add new hook exports to ActionGuard Context files ([4e49a48](https://github.com/mineclover/context-action/commit/4e49a483927dd9ab183ef60f8a3051a474527b01))
* add react-router v7.8.0 and refactor App component structure ([ced1394](https://github.com/mineclover/context-action/commit/ced139413394ddae1890ea72b18bc84a26007688))
* add visual animation effects for priority count updates ([9a91122](https://github.com/mineclover/context-action/commit/9a911226b0ddd9a2ae828c1a388cf42f5ebdd8e4))
* Change default log level to TRACE in environment variables ([d2a95d0](https://github.com/mineclover/context-action/commit/d2a95d02531a29943296e28ff40b3833c6858b4d))
* class-variance-authority와 cn 함수 타입 안전성 개선 ([8156c07](https://github.com/mineclover/context-action/commit/8156c070b2530622ae41ee78e2925b572d24802d))
* complete ActionProvider migration and remove [@ts-nocheck](https://github.com/ts-nocheck) ([b173444](https://github.com/mineclover/context-action/commit/b1734441dade5eec8268d3870c85a5538aadcecf))
* Complete comprehensive test suite implementation ([c8ab6fe](https://github.com/mineclover/context-action/commit/c8ab6fe9119687fa04d1ec1e22ef64023512bd25))
* Complete glossary system with comprehensive guidelines and conventions ([93db290](https://github.com/mineclover/context-action/commit/93db290ecd26384ab7c5b05a938900440cd35c40))
* Complete jq-based glossary query system with enhanced search ([49dec90](https://github.com/mineclover/context-action/commit/49dec9091245a20645e69711af128e7e395395f8))
* Complete React pages modularization and improve error handling ([19bc5a6](https://github.com/mineclover/context-action/commit/19bc5a6fd565688e90bc7f3069b1afd91cbb9cf1))
* **core:** Fix execution abort functionality and improve handler management ([88e3dd4](https://github.com/mineclover/context-action/commit/88e3dd407a039585a35467935d66261f668cf3ea))
* createActionContext를 주요 방식으로 재정립 ([85b69e5](https://github.com/mineclover/context-action/commit/85b69e5ffdbb6470b587c6f7c96a0cabaf04c68a))
* dispatch 옵션 업그레이드 - debounce, throttle, executionMode 지원 ([1b84388](https://github.com/mineclover/context-action/commit/1b8438857e97decaff02070d4a51e638d2b8a9ce))
* **docs:** Add API documentation generation guide and update sidebar ([6d65f50](https://github.com/mineclover/context-action/commit/6d65f5034c50f3d85612f004263eb734e63b1b14))
* **docs:** Enhance API documentation structure and synchronization ([65cc7f6](https://github.com/mineclover/context-action/commit/65cc7f6a7cb36d226c3709b7027dde61ece43050))
* **docs:** Update .gitignore and enhance CI/CD API documentation ([f5709fd](https://github.com/mineclover/context-action/commit/f5709fd73f88dcd1e64ed39b79ca38a528084dc6))
* enable all ActionGuard page routes and complete navigation ([c6d3698](https://github.com/mineclover/context-action/commit/c6d36981b63dc9879b7fe637bf161feea9955573))
* enable React provider pages and fix ActionProvider migrations ([f0062ed](https://github.com/mineclover/context-action/commit/f0062ed393a8550e7e96484a37850dbedc11b805))
* Enhance action handler priority system and documentation ([6a5bca8](https://github.com/mineclover/context-action/commit/6a5bca8876331bb97ff8a6cebc90886620de5b88))
* enhance action registration with auto-abort functionality ([d80aa5b](https://github.com/mineclover/context-action/commit/d80aa5bb6cc9a6eea293288789aeb91005261796))
* Enhance core package documentation and type definitions ([17a84e0](https://github.com/mineclover/context-action/commit/17a84e0e1465d0ebcddfc92ae3c6b767f8f20401))
* Enhance documentation and improve ActionRegister functionality ([bde754b](https://github.com/mineclover/context-action/commit/bde754b82f079cc378b9e414dc7d66ec062ae71d))
* enhance performance metrics tracking in AdvancedMetricsPanel ([0efded9](https://github.com/mineclover/context-action/commit/0efded9703083d1b541b439c5aae419b2fd165ad))
* enhance priority test execution with configurable delays and improved state management ([b95702e](https://github.com/mineclover/context-action/commit/b95702e628653e6262d9465013218b3dff42c2d8))
* enhance priority test management with execution state tracking ([69593af](https://github.com/mineclover/context-action/commit/69593af01f15eb09f3c26e25b966d05fbfbc46ec))
* enhance PriorityTestPage with handler management controls ([6651727](https://github.com/mineclover/context-action/commit/6651727c53e3a8612dac1561dd27072f69c80a06))
* enhance Toast container with better overflow management ([80d8661](https://github.com/mineclover/context-action/commit/80d8661f3d6a32c9ebd2ca27ee9cb4372fd9ddb0))
* **example:** Add comprehensive store management demo pages ([e1f0162](https://github.com/mineclover/context-action/commit/e1f0162ec6f71d7098f5289b4463bd7cf0353d8b))
* **example:** Add store system navigation and improve code formatting ([fa1b785](https://github.com/mineclover/context-action/commit/fa1b785a369b9b25e04096a0544b52f7e11d5b17))
* **example:** Add store system pages and update React index page ([d39e848](https://github.com/mineclover/context-action/commit/d39e8486534eef5b5175cba14690a6377a664e04))
* **example:** Complete Priority Test Page with modular hooks and abort functionality ([190335d](https://github.com/mineclover/context-action/commit/190335dc761fb33ef23bd293a0ba386aa6baad28))
* **example:** HOC 패턴 페이지 추가 및 라우터 업데이트 ([20ec485](https://github.com/mineclover/context-action/commit/20ec4851460f4589004a12114fea14acf7a67636))
* extend StoreConfig to match PATTERN_GUIDE.md requirements ([a964c38](https://github.com/mineclover/context-action/commit/a964c3872b495e1fbddaa8a1b9602e41690d92b3))
* GitHub Pages 자동 배포 설정 ([44d6378](https://github.com/mineclover/context-action/commit/44d6378b44f14c1464066495c2bb5e17c847a741))
* **glossary:** Extract architecture patterns from example code ([513faac](https://github.com/mineclover/context-action/commit/513faacd543208e26abbfbe1ea997206f28d7699))
* **glossary:** 스캐너 개선으로 ActionRegister 클래스 인식 및 구현 커버리지 35%로 향상 ([55d0a39](https://github.com/mineclover/context-action/commit/55d0a397ff33c90f6da3c4d28b09a76f60a14f55))
* HMR 시스템 완성 및 Core Store 비교 최적화 ([ccc5029](https://github.com/mineclover/context-action/commit/ccc50299f49d7d6fa115ef389a7eabdb52e4b0c5))
* implement Canvas-style isolated mouse renderer ([a46193b](https://github.com/mineclover/context-action/commit/a46193b2424931524737a251196b636bf59fc1e5))
* implement complete pipeline control system with execution modes and action guards ([7f27112](https://github.com/mineclover/context-action/commit/7f2711279c6dd28e8a468b4313baeb0d61180e90))
* Implement comprehensive ActionGuard hook system ([8077ab3](https://github.com/mineclover/context-action/commit/8077ab36c3593bae6f15b4d3d2d0d7e3b2b9de75))
* Implement comprehensive glossary system for Context-Action framework ([34ad6eb](https://github.com/mineclover/context-action/commit/34ad6eb6ab1ad5a1c23ef3d3b2a2bc6628541e73))
* implement Context Store Mouse Events architecture ([677a319](https://github.com/mineclover/context-action/commit/677a319323748b37c88dd56c59e5fa8a8de11f3f))
* Implement Declarative Store Pattern with Action Registry-style design ([36702e3](https://github.com/mineclover/context-action/commit/36702e37fd5ce7ad0263931a26e24712d8dd2a35))
* Implement enhanced Store value comparison system for render optimization ([2c374d4](https://github.com/mineclover/context-action/commit/2c374d4488b42f4687eb268cacc4b9fb3967cba6))
* Implement fundamental Stable API pattern to eliminate infinite loops at root cause ([3d74268](https://github.com/mineclover/context-action/commit/3d74268c50719c4588c638a9c94bcd90c7e7accb))
* Implement HOC patterns for Context Store Pattern ([bb8940e](https://github.com/mineclover/context-action/commit/bb8940e77772377cffe221af83908b594fdbf41e))
* Implement internal ActionRegister routing while preserving external API ([f2ff8a8](https://github.com/mineclover/context-action/commit/f2ff8a8c762d52f1a0663a2bc895c103bca1dbed))
* Implement Log Monitor component with logging context and UI ([95da93a](https://github.com/mineclover/context-action/commit/95da93a993270a8afbc0a3ed65419a8a936de263))
* implement smart event logging throttling to reduce Toast spam ([7e4094c](https://github.com/mineclover/context-action/commit/7e4094cc3cb53db25f98c70731cce45966714ce9))
* implement unified createStoreContext with simplified API ([ff88e6f](https://github.com/mineclover/context-action/commit/ff88e6f5db86e13b4afd3f16e451d273d7c693cb))
* improve ActionGuard index page UX and navigation ([46c63a7](https://github.com/mineclover/context-action/commit/46c63a7f8c8091b615eae57add78f6886965409f))
* improve hook naming clarity with backwards compatibility ([485297e](https://github.com/mineclover/context-action/commit/485297ef164c69a4fc5b3607c493c0a949616ab9))
* Improve LogMonitor display with ID visibility and reverse chronological order ([8d6dde7](https://github.com/mineclover/context-action/commit/8d6dde7d9a811c91d541de88c3dab3f51f1996e6)), closes [#f3f4f6](https://github.com/mineclover/context-action/issues/f3f4f6)
* improve performance test page layout and remove unnecessary progress tracking ([7bf0660](https://github.com/mineclover/context-action/commit/7bf0660351e203b638d678b74dfdc888ce91bb43))
* Improve useAction hook with better error handling ([5f2b3cb](https://github.com/mineclover/context-action/commit/5f2b3cbc5a8432218f531cd3408c671acd51468f))
* integrate ActionTestProvider for action management in PriorityTestPage ([478aaf4](https://github.com/mineclover/context-action/commit/478aaf49f0e3a92919e99dbdfe0b86a40f1c3721))
* integrate comprehensive logging system across all packages ([515ba5d](https://github.com/mineclover/context-action/commit/515ba5daf64e4ef1a1acb52c9d7d778884287419))
* introduce Store-Based Mouse Events architecture ([ffbf1e7](https://github.com/mineclover/context-action/commit/ffbf1e71374f17232b1f0fd9169651c3e7e377af))
* Major architecture refactoring and documentation update ([aadb45d](https://github.com/mineclover/context-action/commit/aadb45d0bc86502243b2390a1c6da7d4736e0208))
* optimize mouse events system with high-performance real-time tracking ([07d6369](https://github.com/mineclover/context-action/commit/07d636984ae2949c7520b99d9c21f41f9c770a1f))
* optimize usePriorityTestManager for improved handler management ([20c125c](https://github.com/mineclover/context-action/commit/20c125c87791de38179eec73d3eb665e275f11bd))
* React 18.3.1 버전 통일로 타입 호환성 개선 ([eba7a49](https://github.com/mineclover/context-action/commit/eba7a490fc53fa694d497e3d5202f56d04db3f39))
* React Context 양방향 통신 패턴 구현 및 예제 정리 ([a445d7d](https://github.com/mineclover/context-action/commit/a445d7d9d19059eff54e0a15df876daf15c65baf))
* React Context 페이지 종합 개선 및 예제 애플리케이션 확장 ([d059371](https://github.com/mineclover/context-action/commit/d059371688e6aa6902378432214bc63351636582))
* React 패키지 Bundle Re-export Pattern 모듈화 완료 ([2075020](https://github.com/mineclover/context-action/commit/2075020960c1a9501a2c8393bab97f50c9bc1ad2))
* **react:** Implement MVVM architecture patterns with store integration ([9f3afce](https://github.com/mineclover/context-action/commit/9f3afce1fc5f4173d0387dbf5444f3b78fdd07bc))
* **react:** Store 시스템 개선 및 withStore HOC 추가 ([828f764](https://github.com/mineclover/context-action/commit/828f764ec0b67eb5217d39c4bb9f6ef9b268ae3e))
* remove ActionProvider and standardize on createActionContext with automatic abort ([75f0908](https://github.com/mineclover/context-action/commit/75f090854020b7866aeef240b914138f3a490cad))
* Remove deprecated example files and documentation ([fde7a78](https://github.com/mineclover/context-action/commit/fde7a782ccaa480683d83241b9f1c0946647eb6e))
* restructure VitePress config with top-down architecture ([e2ded98](https://github.com/mineclover/context-action/commit/e2ded9845c60395a1fa6e5fac6c62197368881a4))
* Search page Update ([b698955](https://github.com/mineclover/context-action/commit/b698955ae31e3b2da05d0f640acf49607a92b5ae))
* separate logger into independent package ([6cb727c](https://github.com/mineclover/context-action/commit/6cb727cfe03230d03e9f928fb92d86c2d3ae7360))
* Settings Management에 구체적인 테스트 시나리오 추가 ([5273fbe](https://github.com/mineclover/context-action/commit/5273fbeb801252487377b15a9b0c4fa599028b17))
* step2 refactor usePriorityTestManager with MVVM architecture ([a29e15c](https://github.com/mineclover/context-action/commit/a29e15c9115f702fc2c194cf3e92bf83859bf881))
* Store Full Demo UX 흐름 개선 - 탭 기반 내비게이션 추가 ([f3bf5bd](https://github.com/mineclover/context-action/commit/f3bf5bdd3b944e2fe25aaf097da8b71b8a71e3de))
* Store 시나리오 완전 모듈화 - 관심사 분리 구조 구현 ([928fa05](https://github.com/mineclover/context-action/commit/928fa056739eb3690207edf423a79d6ef379aaef))
* Tailwind CSS + CVA 기반 UI 시스템 리팩토링 ([2920b84](https://github.com/mineclover/context-action/commit/2920b848aa0d47363ed83087a8a12f9f470e2a94))
* Tailwind CSS + CVA 리팩토링 완료 ([cd08e66](https://github.com/mineclover/context-action/commit/cd08e660008a074495bdbd477a669c281883cdab))
* Tailwind CSS v3 + CVA 스타일 시스템 완전 적용 ([284726d](https://github.com/mineclover/context-action/commit/284726dd8ad01cabe0b10ec691fcc2d84c165bc0))
* Temporarily disable glossary sync workflow ([ea01c73](https://github.com/mineclover/context-action/commit/ea01c73b5a38d71d111c30da2a0d2fdefecae9e9))
* Toast Config Example 페이지 추가 및 Toast 시스템 개선 ([8d39f12](https://github.com/mineclover/context-action/commit/8d39f12ec4c1796fe56714089b34c8fe9b1f126d))
* Todo & Chat 데모 완전 구현 - 디테일 향상 ([fa0a3f6](https://github.com/mineclover/context-action/commit/fa0a3f60cc4a74b7b1e5a8073074f35c53d7521a))
* UI 개선 및 사용자 경험 향상 ([59fc867](https://github.com/mineclover/context-action/commit/59fc86760dbe4e22986407c163604ee8e04759f5))
* Universal Trace Logger 시스템 구현 ([643f81b](https://github.com/mineclover/context-action/commit/643f81bebb785fe4a30d349902d9c99ed8d93edf))
* Update glossary implementation dashboard and add translation checker tool ([e031ae3](https://github.com/mineclover/context-action/commit/e031ae3ed863cb41cee5d8712a20db5b551912c4))
* Update logging configuration and enhance JSON settings ([8b15e76](https://github.com/mineclover/context-action/commit/8b15e76ff48c03aca2c876bf5f13eed36e26766b))
* Upgrade Action Context Pattern to Declarative Store spec and remove version tags ([9be2589](https://github.com/mineclover/context-action/commit/9be25895724fb57f97de6ea0c98db3e8b586bda6))
* useActionWithResult 종합 예시 페이지 추가 ([4d3579c](https://github.com/mineclover/context-action/commit/4d3579c52f96d7eb3aff598382b75e0a43e9d9ef))
* 개발용 패키지와 모니터링 툴 추가 ([c7f29ee](https://github.com/mineclover/context-action/commit/c7f29eeb991732e8c445a5b77138e17f795dac24))
* 개별 핸들러 시스템으로 Priority Test 페이지 개선 ([b76d154](https://github.com/mineclover/context-action/commit/b76d154b3b2409519e62a1d21c1b69773841eb6d))
* 대용량 JSON 환경용 신뢰도 검증 시스템 구축 ([c50f048](https://github.com/mineclover/context-action/commit/c50f048f2f6dc9ee0f6618e04ad430ac9ff726c7))
* 레거시 코드 제거 및 외부 abort 기능 개선 ([f4a0d18](https://github.com/mineclover/context-action/commit/f4a0d18d316656ba74182c376ffd65ed039ab747))
* 로깅-토스트 컨벤션 일괄 적용 완료 ([25eaa2b](https://github.com/mineclover/context-action/commit/25eaa2b99cc2e475b9c862a23e7f155116f1f21e))
* 모든 logger 요소를 TRACE 레벨로 변경하고 createAtomContext에서 config 매개변수 제거 ([130eee6](https://github.com/mineclover/context-action/commit/130eee6f98c3fafaa13dc237a4f08e9f1ee1fbd8))
* 모든 페이지에 LogMonitor 통합 및 타입 에러 해결 ([d3300ca](https://github.com/mineclover/context-action/commit/d3300ca9998d6a807e33fbd08c8700fba476a8f7))
* 번들 사이즈 대폭 최적화 및 코드 품질 개선 ([98a522e](https://github.com/mineclover/context-action/commit/98a522ed0ee1c92014c11f9b6377e60c399cd227))
* 실시간 모니터링 툴 추가 ([e08420c](https://github.com/mineclover/context-action/commit/e08420cec6549071af678a1a596c056e48cb0a4a))
* 액션 실행 결과 반환 및 수집 시스템 구현 ([071131e](https://github.com/mineclover/context-action/commit/071131e286c392feef97d57ed3c08497c9add395))
* 종합 example 앱 구현 완료 - 8가지 데모 페이지 추가 ([9fa7e80](https://github.com/mineclover/context-action/commit/9fa7e804a400fd795f9eff4f62d5681959295b24))
* 주요 example 파일들을 Context Store 패턴으로 완전 전환 ([5d7de93](https://github.com/mineclover/context-action/commit/5d7de93cc252492ddae88c406e8a209779eec298))
* 파이프라인 결과 처리 시스템과 핸들러 메타데이터 확장 ([554dd29](https://github.com/mineclover/context-action/commit/554dd29a06f04371b1e84ad6458fbfee7f205ed0))
* 핵심 용어 JSDoc 태그 구현으로 용어집 매칭률 67% 달성 ([64b19e1](https://github.com/mineclover/context-action/commit/64b19e1be9da70106a26313c50f49da8eed8bfbb))


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

* Disable logo in documentation ([00d2c18](https://github.com/mineclover/context-action/commit/00d2c18026688cf9039dfaf9d004ad7cbab24738))
* ESLint 설정 파일 ES 모듈 호환성 문제 해결 ([1a92051](https://github.com/mineclover/context-action/commit/1a92051a2a3b48fbb502c7c65ee896c600661ce5))
* Fix TypeScript project references for workspace dependencies ([85e72b7](https://github.com/mineclover/context-action/commit/85e72b701e743e39eaf7b72dad338e5fd95109d6))
* GitHub Pages 자동 활성화를 위한 enablement 옵션 추가 ([267c236](https://github.com/mineclover/context-action/commit/267c23667e784e390ce792041923a2fd09b9712c))
* Improve GitHub Actions CI/CD reliability ([3e7681b](https://github.com/mineclover/context-action/commit/3e7681bed9ec4196bec0ca57a36f653ddabb4450))
* pnpm 버전 호환성 문제 해결 ([c294980](https://github.com/mineclover/context-action/commit/c294980912fec9493ba00250de5ba8b314ce0973))
* pnpm-lock.yaml 파일 추가로 GitHub Actions CI/CD 수정 ([4c35d7a](https://github.com/mineclover/context-action/commit/4c35d7a10323cf4ed5b3ddb310136f5783577f1f))
* Provider 순서 문제 해결 ([e87978f](https://github.com/mineclover/context-action/commit/e87978f59307ac0fb1339589c36471847b093823))
* repair docs:api script and complete logger package integration ([edc440e](https://github.com/mineclover/context-action/commit/edc440e440450994217e4dc94582d4fa91b6988d))
* Resolve infinite loop in Core Advanced page and fix LogMonitor Store types ([a043409](https://github.com/mineclover/context-action/commit/a0434096bc1eef777cc0a444d5670eb4e5c77405))
* Resolve infinite loop in Store Basics page ([43a7649](https://github.com/mineclover/context-action/commit/43a7649ac330a08b4ca04f8d762863e4abea18c0))
* resolve TypeScript type safety issues across packages ([9fe20b9](https://github.com/mineclover/context-action/commit/9fe20b9c5a249c262119fde5d35b3a094991963f))
* resolve useStoreSync type conflicts and complete example migrations ([5a2e638](https://github.com/mineclover/context-action/commit/5a2e638f037e03aab616eeba148f7136729006b0))
* test-app tsconfig.json 참조 경로 수정 ([4d1ec3e](https://github.com/mineclover/context-action/commit/4d1ec3e5641b3cabac7d827fb113ccad8b10189b))
* Update CI/CD workflows to use pnpm 9 for lockfile compatibility ([4aae6fa](https://github.com/mineclover/context-action/commit/4aae6fa55b96fa1397b0b86d89f09c2fc18c09b4))
* Update GitHub Actions workflow for new glossary structure ([404a5a8](https://github.com/mineclover/context-action/commit/404a5a8343c5c5311f3b0681040250186964fd2a))
* Update test scripts to pass with no tests ([59a08d4](https://github.com/mineclover/context-action/commit/59a08d435ad52698497b220277569a521f89f5d7))


### Features

* 대용량 JSON 환경용 신뢰도 검증 시스템 구축 ([c50f048](https://github.com/mineclover/context-action/commit/c50f048f2f6dc9ee0f6618e04ad430ac9ff726c7))
* 로깅-토스트 컨벤션 일괄 적용 완료 ([25eaa2b](https://github.com/mineclover/context-action/commit/25eaa2b99cc2e475b9c862a23e7f155116f1f21e))
* 모든 페이지에 LogMonitor 통합 및 타입 에러 해결 ([d3300ca](https://github.com/mineclover/context-action/commit/d3300ca9998d6a807e33fbd08c8700fba476a8f7))
* 모든 logger 요소를 TRACE 레벨로 변경하고 createAtomContext에서 config 매개변수 제거 ([130eee6](https://github.com/mineclover/context-action/commit/130eee6f98c3fafaa13dc237a4f08e9f1ee1fbd8))
* 종합 example 앱 구현 완료 - 8가지 데모 페이지 추가 ([9fa7e80](https://github.com/mineclover/context-action/commit/9fa7e804a400fd795f9eff4f62d5681959295b24))
* 주요 example 파일들을 Context Store 패턴으로 완전 전환 ([5d7de93](https://github.com/mineclover/context-action/commit/5d7de93cc252492ddae88c406e8a209779eec298))
* Action Register 연동 토스트 시스템 구현 🍞 ([c3e7c15](https://github.com/mineclover/context-action/commit/c3e7c1514a8bce9d83e65a0e9d3284c3011a29d0))
* Add @context-action/jotai package for Jotai integration ([be199b8](https://github.com/mineclover/context-action/commit/be199b8c5a35a20bce03a5abc93ba282cdb8ef8d))
* Add ActionGuard demo routes and navigation ([345e7db](https://github.com/mineclover/context-action/commit/345e7dba29619f6efbb3de7f7cfdc6c7da99bffa))
* Add ActionGuard presets and patterns system ([c45b032](https://github.com/mineclover/context-action/commit/c45b0329a1fefb386cf3d54a8549600aecadd3fa))
* Add bundle size analysis automation ([40db3ec](https://github.com/mineclover/context-action/commit/40db3ec60304f3775f2e3f0c508d26615264cd41))
* Add comprehensive ActionGuard demonstration pages ([a626119](https://github.com/mineclover/context-action/commit/a62611924599e837268d4af51df3722437958d0f))
* Add comprehensive Korean documentation and enhanced CI/CD ([9381c58](https://github.com/mineclover/context-action/commit/9381c58c2383b7f0b63445f7bdb4f0cc394e8642))
* Add comprehensive logging system with OpenTelemetry support ([0a46cdd](https://github.com/mineclover/context-action/commit/0a46cdd265dee54c41a28751dfcb3db939dc6fb6))
* Add comprehensive store management system with Context API and sync utilities ([1b49f3b](https://github.com/mineclover/context-action/commit/1b49f3b2291a38877668864f1cd53eccaae5fa90))
* Add comprehensive test suite with React Router ([3bc89ff](https://github.com/mineclover/context-action/commit/3bc89ffc832e9eb900f0c3ca41e182c2f4426c25))
* Add Context Action logo ([4c32c93](https://github.com/mineclover/context-action/commit/4c32c9386b014de4efbe2bc211377d158a508a08))
* Add Context Store Pattern for Provider-level Registry isolation ([100b8a3](https://github.com/mineclover/context-action/commit/100b8a31c667bcda003d2fcc6e3e3c398892bb3a))
* Add environment-based ActionGuard configuration system ([19a505e](https://github.com/mineclover/context-action/commit/19a505e7252709f1344fe8b91a6602b459148227))
* Add Lerna and pnpm configuration for monorepo management ([92dad4d](https://github.com/mineclover/context-action/commit/92dad4d7f468d75da354a8f6c298be5996edf1b7))
* Add logging system to jotai and react packages ([44d5363](https://github.com/mineclover/context-action/commit/44d536324bcc1a78da5d990279f01fd1352d1d25))
* Change default log level to TRACE in environment variables ([d2a95d0](https://github.com/mineclover/context-action/commit/d2a95d02531a29943296e28ff40b3833c6858b4d))
* Complete comprehensive test suite implementation ([c8ab6fe](https://github.com/mineclover/context-action/commit/c8ab6fe9119687fa04d1ec1e22ef64023512bd25))
* Complete glossary system with comprehensive guidelines and conventions ([93db290](https://github.com/mineclover/context-action/commit/93db290ecd26384ab7c5b05a938900440cd35c40))
* Complete jq-based glossary query system with enhanced search ([49dec90](https://github.com/mineclover/context-action/commit/49dec9091245a20645e69711af128e7e395395f8))
* Complete React pages modularization and improve error handling ([19bc5a6](https://github.com/mineclover/context-action/commit/19bc5a6fd565688e90bc7f3069b1afd91cbb9cf1))
* **docs:** Add API documentation generation guide and update sidebar ([6d65f50](https://github.com/mineclover/context-action/commit/6d65f5034c50f3d85612f004263eb734e63b1b14))
* **docs:** Enhance API documentation structure and synchronization ([65cc7f6](https://github.com/mineclover/context-action/commit/65cc7f6a7cb36d226c3709b7027dde61ece43050))
* **docs:** Update .gitignore and enhance CI/CD API documentation ([f5709fd](https://github.com/mineclover/context-action/commit/f5709fd73f88dcd1e64ed39b79ca38a528084dc6))
* Enhance core package documentation and type definitions ([17a84e0](https://github.com/mineclover/context-action/commit/17a84e0e1465d0ebcddfc92ae3c6b767f8f20401))
* **example:** Add comprehensive store management demo pages ([e1f0162](https://github.com/mineclover/context-action/commit/e1f0162ec6f71d7098f5289b4463bd7cf0353d8b))
* **example:** Add store system navigation and improve code formatting ([fa1b785](https://github.com/mineclover/context-action/commit/fa1b785a369b9b25e04096a0544b52f7e11d5b17))
* **example:** Add store system pages and update React index page ([d39e848](https://github.com/mineclover/context-action/commit/d39e8486534eef5b5175cba14690a6377a664e04))
* **example:** HOC 패턴 페이지 추가 및 라우터 업데이트 ([20ec485](https://github.com/mineclover/context-action/commit/20ec4851460f4589004a12114fea14acf7a67636))
* GitHub Pages 자동 배포 설정 ([44d6378](https://github.com/mineclover/context-action/commit/44d6378b44f14c1464066495c2bb5e17c847a741))
* **glossary:** 스캐너 개선으로 ActionRegister 클래스 인식 및 구현 커버리지 35%로 향상 ([55d0a39](https://github.com/mineclover/context-action/commit/55d0a397ff33c90f6da3c4d28b09a76f60a14f55))
* **glossary:** Extract architecture patterns from example code ([513faac](https://github.com/mineclover/context-action/commit/513faacd543208e26abbfbe1ea997206f28d7699))
* implement complete pipeline control system with execution modes and action guards ([7f27112](https://github.com/mineclover/context-action/commit/7f2711279c6dd28e8a468b4313baeb0d61180e90))
* Implement comprehensive ActionGuard hook system ([8077ab3](https://github.com/mineclover/context-action/commit/8077ab36c3593bae6f15b4d3d2d0d7e3b2b9de75))
* Implement comprehensive glossary system for Context-Action framework ([34ad6eb](https://github.com/mineclover/context-action/commit/34ad6eb6ab1ad5a1c23ef3d3b2a2bc6628541e73))
* Implement enhanced Store value comparison system for render optimization ([2c374d4](https://github.com/mineclover/context-action/commit/2c374d4488b42f4687eb268cacc4b9fb3967cba6))
* Implement fundamental Stable API pattern to eliminate infinite loops at root cause ([3d74268](https://github.com/mineclover/context-action/commit/3d74268c50719c4588c638a9c94bcd90c7e7accb))
* Implement HOC patterns for Context Store Pattern ([bb8940e](https://github.com/mineclover/context-action/commit/bb8940e77772377cffe221af83908b594fdbf41e))
* Implement internal ActionRegister routing while preserving external API ([f2ff8a8](https://github.com/mineclover/context-action/commit/f2ff8a8c762d52f1a0663a2bc895c103bca1dbed))
* Implement Log Monitor component with logging context and UI ([95da93a](https://github.com/mineclover/context-action/commit/95da93a993270a8afbc0a3ed65419a8a936de263))
* Improve LogMonitor display with ID visibility and reverse chronological order ([8d6dde7](https://github.com/mineclover/context-action/commit/8d6dde7d9a811c91d541de88c3dab3f51f1996e6)), closes [#f3f4f6](https://github.com/mineclover/context-action/issues/f3f4f6)
* Improve useAction hook with better error handling ([5f2b3cb](https://github.com/mineclover/context-action/commit/5f2b3cbc5a8432218f531cd3408c671acd51468f))
* integrate comprehensive logging system across all packages ([515ba5d](https://github.com/mineclover/context-action/commit/515ba5daf64e4ef1a1acb52c9d7d778884287419))
* Major architecture refactoring and documentation update ([aadb45d](https://github.com/mineclover/context-action/commit/aadb45d0bc86502243b2390a1c6da7d4736e0208))
* **react:** Implement MVVM architecture patterns with store integration ([9f3afce](https://github.com/mineclover/context-action/commit/9f3afce1fc5f4173d0387dbf5444f3b78fdd07bc))
* **react:** Store 시스템 개선 및 withStore HOC 추가 ([828f764](https://github.com/mineclover/context-action/commit/828f764ec0b67eb5217d39c4bb9f6ef9b268ae3e))
* Remove deprecated example files and documentation ([fde7a78](https://github.com/mineclover/context-action/commit/fde7a782ccaa480683d83241b9f1c0946647eb6e))
* separate logger into independent package ([6cb727c](https://github.com/mineclover/context-action/commit/6cb727cfe03230d03e9f928fb92d86c2d3ae7360))
* Settings Management에 구체적인 테스트 시나리오 추가 ([5273fbe](https://github.com/mineclover/context-action/commit/5273fbeb801252487377b15a9b0c4fa599028b17))
* Store 시나리오 완전 모듈화 - 관심사 분리 구조 구현 ([928fa05](https://github.com/mineclover/context-action/commit/928fa056739eb3690207edf423a79d6ef379aaef))
* Store Full Demo UX 흐름 개선 - 탭 기반 내비게이션 추가 ([f3bf5bd](https://github.com/mineclover/context-action/commit/f3bf5bdd3b944e2fe25aaf097da8b71b8a71e3de))
* Tailwind CSS + CVA 기반 UI 시스템 리팩토링 ([2920b84](https://github.com/mineclover/context-action/commit/2920b848aa0d47363ed83087a8a12f9f470e2a94))
* Tailwind CSS + CVA 리팩토링 완료 ([cd08e66](https://github.com/mineclover/context-action/commit/cd08e660008a074495bdbd477a669c281883cdab))
* Tailwind CSS v3 + CVA 스타일 시스템 완전 적용 ([284726d](https://github.com/mineclover/context-action/commit/284726dd8ad01cabe0b10ec691fcc2d84c165bc0))
* Temporarily disable glossary sync workflow ([ea01c73](https://github.com/mineclover/context-action/commit/ea01c73b5a38d71d111c30da2a0d2fdefecae9e9))
* Toast Config Example 페이지 추가 및 Toast 시스템 개선 ([8d39f12](https://github.com/mineclover/context-action/commit/8d39f12ec4c1796fe56714089b34c8fe9b1f126d))
* Todo & Chat 데모 완전 구현 - 디테일 향상 ([fa0a3f6](https://github.com/mineclover/context-action/commit/fa0a3f60cc4a74b7b1e5a8073074f35c53d7521a))
* UI 개선 및 사용자 경험 향상 ([59fc867](https://github.com/mineclover/context-action/commit/59fc86760dbe4e22986407c163604ee8e04759f5))
* Update glossary implementation dashboard and add translation checker tool ([e031ae3](https://github.com/mineclover/context-action/commit/e031ae3ed863cb41cee5d8712a20db5b551912c4))
* Update logging configuration and enhance JSON settings ([8b15e76](https://github.com/mineclover/context-action/commit/8b15e76ff48c03aca2c876bf5f13eed36e26766b))


### Performance Improvements

* Remove unnecessary useCallback wrappers around dispatch calls ([5820762](https://github.com/mineclover/context-action/commit/5820762ad38c03eafca77de0eb1e51ccff12194c))
