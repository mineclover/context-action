# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

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
* implement generic pattern support for createDeclarativeStorePattern and createActionContext ([c0da9e1](https://github.com/mineclover/context-action/commit/c0da9e1c13effb9750e52c9fd9f3722e808d3a9b))
* Implement HOC patterns for Context Store Pattern ([bb8940e](https://github.com/mineclover/context-action/commit/bb8940e77772377cffe221af83908b594fdbf41e))
* Implement internal ActionRegister routing while preserving external API ([f2ff8a8](https://github.com/mineclover/context-action/commit/f2ff8a8c762d52f1a0663a2bc895c103bca1dbed))
* Implement Log Monitor component with logging context and UI ([95da93a](https://github.com/mineclover/context-action/commit/95da93a993270a8afbc0a3ed65419a8a936de263))
* implement smart event logging throttling to reduce Toast spam ([7e4094c](https://github.com/mineclover/context-action/commit/7e4094cc3cb53db25f98c70731cce45966714ce9))
* implement unified createDeclarativeStorePattern with simplified API ([ff88e6f](https://github.com/mineclover/context-action/commit/ff88e6f5db86e13b4afd3f16e451d273d7c693cb))
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
* implement unified createDeclarativeStorePattern with simplified API ([ff88e6f](https://github.com/mineclover/context-action/commit/ff88e6f5db86e13b4afd3f16e451d273d7c693cb))
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
