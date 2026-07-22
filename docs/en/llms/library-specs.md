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

#### @context-action/react
- **Purpose**: React integration with Context API and hooks
- **Dependencies**: React 18 or 19, @context-action/core, @context-action/tool-protocol, and the direct @context-action/tool-durable-operations type dependency; durable execution remains opt-in at runtime
- **Key Features**: Store management, action contexts, hooks

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
- **Bundle Size**: ~15KB gzipped for React package

### TypeScript Integration

- Full type safety with strict mode
- Generic type inference for stores and actions
- Compile-time payload validation

### Compatibility

- **React**: 18.0.0 or 19.0.0
- **TypeScript**: 6.0.3
- **Node.js**: 24.11.0+
- **Bundlers**: Vite, Webpack, Rollup
