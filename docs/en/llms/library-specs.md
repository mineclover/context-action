# Library Specifications

## Context-Action Framework Technical Specifications

### Core Packages

#### @context-action/core
- **Purpose**: Core action pipeline management without React dependencies
- **Key Components**: ActionRegister, PipelineController
- **Target Environment**: Any JavaScript environment

#### @context-action/tool-protocol
- **Purpose**: Framework-neutral action schemas and MCP/provider tool contracts
- **Dependencies**: Zod runtime dependency for the root action-schema API
- **Key Components**: `defineAction`, canonical tool calls, provider adapters, approval queue, idempotency/provenance/observability contracts
- **Target Environment**: Browser, Node.js, and other JavaScript environments

#### @context-action/tool-durable-operations
- **Purpose**: Optional durable mutation records and external side-effect adapters
- **Dependencies**: Driver-neutral core; optional host-owned Redis/PostgreSQL clients for integration verification
- **Key Components**: durable operation store, side-effect runner, HTTP/queue adapters, IndexedDB/Redis/PostgreSQL reference backends
- **Target Environment**: Browser, Node.js, and server workers

#### @context-action/ai-sdk
- **Purpose**: Optional AI SDK v7 adapter from canonical tool managers to scoped model ToolSets
- **Dependencies**: `@context-action/tool-protocol` runtime dependency and required `ai` peer; no React, core, provider, or credential dependency
- **Key Components**: `createAISDKToolScope`, native approval mapping, tool-call idempotency correlation, structured error mode
- **Target Environment**: Browser or server applications that own an AI SDK model client

#### @context-action/webmcp
- **Purpose**: Optional browser adapter that exposes an explicit canonical tool scope through the experimental WebMCP imperative API
- **Dependencies**: `@context-action/tool-protocol`; no React or model-provider dependency
- **Key Components**: `createWebMCPToolScope`, explicit tool-name allowlist, WebMCP call ID/idempotency correlation, model/agent provenance, abort-based unregistration
- **Target Environment**: Visible, cross-origin-isolated browser or webview documents that provide `document.modelContext`

#### @context-action/react
- **Purpose**: React integration with Context API and hooks
- **Dependencies**: React 18 or 19 (peer), `@context-action/core`, `@context-action/mutative`, `@context-action/tool-protocol`, and `@context-action/webmcp`; it does not depend on Durable Operations in the published React 2 artifact
- **Key Features**: Store management, action contexts, hooks, and React 18/19 SSR support. Import these APIs from `@context-action/react`; the `react18` subpath is a type-compatibility entry point, not a second runtime.

### Release and Security Baseline

- **Package baseline**: `@context-action/core` 0.9.2, `@context-action/react` 0.9.2, `@context-action/tool-protocol` 0.8.9, `@context-action/tool-durable-operations` 0.1.1, `@context-action/ai-sdk` 0.1.0, and `@context-action/webmcp` 0.1.0.
- **Runtime baseline**: Node.js `>=24.11.0`, pnpm `>=10.30.0`, and TypeScript `6.0.3`.
- **Dependency security**: `pnpm security:audit` is the required OSV check and currently reports no actionable vulnerability matches. Fixed dependency floors are enforced by the root `pnpm.overrides` configuration.
- **Temporary exception**: `react-router@7.18.1` remains a time-bounded exception for `GHSA-qwww-vcr4-c8h2`; the example uses browser routing only, and `react-router-dom` 8.3.0 is not published. Re-evaluate before 2026-09-30.
- **Verification baseline**: dependency changes must pass `pnpm security:audit`, `pnpm type-check`, `pnpm test`, `pnpm docs:build`, and the example `check`/`build` gates.

### API Surface

#### Primary Patterns

1. **Action Only Pattern**: `createActionContext(contextName, config?)`
2. **Store Only Pattern**: `createStoreContext(contextName, initialStores)`

#### Core Hooks

- `useActionDispatch()`: Dispatch actions
- `useActionHandler()`: Register action handlers
- `useStoreValue()`: Subscribe to store values
- `useStoreSelector()`: Select specific store fields

### Performance Characteristics

- **Handler Registration**: O(1) lookup via Map
- **Store Updates**: Batched React state updates
- **Memory Usage**: Automatic cleanup on unmount
- **Bundle Size**: Build-dependent; the current default React ESM entry is 13.46 kB gzip in `pnpm --filter @context-action/react bundle-report`

### TypeScript Integration

- Full type safety with strict mode
- Generic type inference for stores and actions
- Compile-time payload validation
- Payload-bearing actions require a payload; `void` actions may omit it
- `DispatchOptions` is the optional second argument for dispatch and result dispatch
- `ExecutionResult` reports executed, skipped, and failed handler counts from the actual pipeline run

### Compatibility

- **React**: 18.0.0 or 19.0.0
- **TypeScript**: 6.0.3
- **Node.js**: 24.11.0+
- **Bundlers**: Vite, Webpack, Rollup
