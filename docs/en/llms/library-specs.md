# Library Specifications

Technical specifications and implementation details for the Context-Action framework.

## Package Architecture

### @context-action/core
- **Purpose**: Core action pipeline management without React dependencies
- **Size**: ~15KB minified
- **Dependencies**: Zero dependencies
- **Target**: ES2018+
- **Exports**: ESM and CommonJS

### @context-action/react  
- **Purpose**: React integration with Context API and hooks
- **Size**: ~25KB minified
- **Dependencies**: React 16.8+, @context-action/core
- **Target**: ES2018+
- **Exports**: ESM and CommonJS

## Core Type Definitions

### ActionPayloadMap
Base interface that all action interfaces must extend:

```typescript
interface ActionPayloadMap {
  [action: string]: any;
}
```

### Store<T>
Generic store interface with reactive capabilities:

```typescript
interface Store<T> {
  getValue(): T;
  setValue(value: T): void;
  update(updater: (current: T) => T): void;
  subscribe(callback: (newValue: T, previousValue?: T) => void): () => void;
  reset(): void;
}
```

### ActionHandler<TPayload>
Function signature for action handlers:

```typescript
type ActionHandler<TPayload> = (
  payload: TPayload,
  controller: PipelineController
) => Promise<any> | any;
```

### PipelineController
Interface for pipeline control within handlers:

```typescript
interface PipelineController {
  abort(reason?: string, error?: Error): void;
  modifyPayload(modifier: (current: any) => any): void;
  getPayload(): any;
  setResult(result: any): void;
  getResults(): any[];
  setPipelineState(key: string, value: any): void;
  getPipelineState(key: string): any;
  getAllPipelineState(): Record<string, any>;
}
```

## Implementation Details

### Action Execution Model
- **Sequential Execution**: Handlers execute in priority order
- **Priority Range**: 0-1000 (higher numbers execute first)
- **Error Handling**: Pipeline can be aborted or continue with errors
- **Result Sharing**: Handlers can share data through controller

### Store Reactivity Model
- **Subscription-Based**: Components subscribe to store changes
- **Automatic Updates**: React components re-render on store changes
- **Selective Subscriptions**: Support for selector-based subscriptions
- **Memory Management**: Automatic cleanup of subscriptions

### Type Inference Engine
- **Automatic Inference**: Store types inferred from configuration
- **Validation Integration**: Runtime validation with TypeScript types
- **Generic Constraints**: Type-safe operations throughout the system

## Performance Characteristics

### Action Pipeline Performance
- **Registration Overhead**: ~0.1ms per handler
- **Dispatch Overhead**: ~0.5ms + handler execution time
- **Memory Usage**: ~2KB per 100 handlers
- **Concurrent Execution**: Single-threaded with async support

### Store System Performance
- **Subscription Overhead**: ~0.05ms per subscription
- **Update Overhead**: ~0.1ms + React re-render time
- **Memory Usage**: ~1KB per 100 stores
- **Change Detection**: Reference equality by default

### Bundle Analysis
- **Tree Shaking**: Full ES module support
- **Side Effects**: Marked as side-effect free
- **Code Splitting**: Supports dynamic imports
- **Compression**: Optimized for gzip/brotli

## Browser Compatibility

### Supported Environments
- **Modern Browsers**: Chrome 71+, Firefox 65+, Safari 12+, Edge 79+
- **Node.js**: 16.0+ (for SSR)
- **React**: 16.8+ (hooks required)
- **TypeScript**: 4.5+ (for proper type inference)

### Polyfills Required
- None for modern environments
- `Map` and `Set` for IE11 (if needed)
- Promise polyfill for older environments

## Build Configuration

### Core Package Build
```typescript
// tsdown.config.ts for core
import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: 'src/index.ts',
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  external: [],
  treeshake: true
});
```

### React Package Build
```typescript
// tsdown.config.ts for react
import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: 'src/index.ts',
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  external: ['react', '@context-action/core'],
  treeshake: true
});
```

## Framework Integration

### React Integration Points
- **Context API**: Uses React Context for state management
- **Hooks**: Built on React hooks for lifecycle management
- **Concurrent Mode**: Compatible with React 18 concurrent features
- **SSR Support**: Server-side rendering compatible

### TypeScript Integration
- **Strict Mode**: Works with TypeScript strict mode
- **Type Inference**: Advanced type inference for developer experience
- **Declaration Files**: Complete .d.ts files for all APIs
- **Generic Constraints**: Proper generic type constraints

### Testing Integration
- **Jest**: Compatible with Jest testing framework
- **React Testing Library**: First-class support for RTL
- **Vitest**: Modern testing with Vitest
- **Type Testing**: Supports TypeScript type testing

## API Stability

### Semantic Versioning
- **Major**: Breaking changes to public APIs
- **Minor**: New features, backward compatible
- **Patch**: Bug fixes, no API changes

### Public API Surface
- All exports from main entry points are considered public
- Internal APIs (not exported) may change without notice
- TypeScript interfaces follow semantic versioning

### Deprecation Policy
- Deprecated APIs maintained for one major version
- Clear migration paths provided for deprecated features
- Runtime warnings for deprecated usage in development

## Security Considerations

### Input Validation
- Payload validation in action handlers
- Store value validation with validators
- Type safety prevents many injection attacks

### Memory Safety
- Automatic cleanup of subscriptions
- No memory leaks in handler registration
- Proper cleanup on component unmount

### Error Boundaries
- Action pipeline errors are contained
- Store validation errors are handled gracefully
- No uncaught exceptions in normal operation

This specification provides the technical foundation for understanding the Context-Action framework's implementation and integration requirements.