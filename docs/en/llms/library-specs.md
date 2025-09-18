# Library Specifications

## Context-Action Framework Technical Specifications

### Core Packages

#### @context-action/core
- **Purpose**: Core action pipeline management without React dependencies
- **Key Components**: ActionRegister, PipelineController
- **Target Environment**: Any JavaScript environment

#### @context-action/react
- **Purpose**: React integration with Context API and hooks
- **Dependencies**: React 18+, @context-action/core
- **Key Features**: Store management, action contexts, hooks

### API Surface

#### Primary Patterns

1. **Action Only Pattern**: `createActionContext()`
2. **Store Only Pattern**: `createStoreContext()`

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

- **React**: 18.0.0+
- **TypeScript**: 4.9.0+
- **Node.js**: 16.0.0+
- **Bundlers**: Vite, Webpack, Rollup