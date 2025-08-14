# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

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
* implement generic pattern support for createDeclarativeStorePattern and createActionContext ([c0da9e1](https://github.com/mineclover/context-action/commit/c0da9e1c13effb9750e52c9fd9f3722e808d3a9b))
* Implement HOC patterns for Context Store Pattern ([bb8940e](https://github.com/mineclover/context-action/commit/bb8940e77772377cffe221af83908b594fdbf41e))
* implement unified createDeclarativeStorePattern with simplified API ([ff88e6f](https://github.com/mineclover/context-action/commit/ff88e6f5db86e13b4afd3f16e451d273d7c693cb))
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
* implement unified createDeclarativeStorePattern with simplified API ([ff88e6f](https://github.com/mineclover/context-action/commit/ff88e6f5db86e13b4afd3f16e451d273d7c693cb))
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
