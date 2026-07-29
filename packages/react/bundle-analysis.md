# Bundle Size Analysis Report

## Entry-point boundaries

Bundle sizes are build- and minifier-dependent, so this document does not keep
fixed byte claims. Generate a current report with `pnpm --filter
@context-action/react bundle-report`.

- `@context-action/react` is the default action, store, ref, and React helper
  entry point. It does not load tool-protocol or durable-operation runtimes.
- `@context-action/react/advanced` exposes optional store features.
- `@context-action/react/react18` exposes React 18/19 compatibility helpers.
- `@context-action/react/tools` is the explicit ToolContext entry point. It
  requires `@context-action/tool-protocol` and may use the optional durable
  operations peer.

## Optimization Achievements

### 1. Immer Selective Loading
- ✅ Dynamic import: `await import('immer')` only when needed
- ✅ Fallback to structuredClone (native API, 0KB overhead)
- ✅ Custom clone fallback for complex objects
- **Benefit**: Applications not using deep cloning avoid 15-20KB Immer bundle

### 2. Tree-shaking Optimization
- ✅ Converted wildcard exports (`export *`) to explicit named exports
- ✅ Separate entry points: default, advanced, react18, and tools
- ✅ Package.json exports field configuration
- ✅ `sideEffects: false` for aggressive tree-shaking
- **Benefit**: Apps using only core features get 12KB instead of 30KB+

## Usage Examples

### Basic Usage
```typescript
import { createActionContext, createStoreContext, useStoreValue } from '@context-action/react';
// Loads the default React runtime without tool-protocol or durable-operation code.
```

### Advanced Usage
```typescript
import { StoreRegistry, useComputedStore, deepCloneWithImmer } from '@context-action/react/advanced';
// Includes all advanced features, loads Immer dynamically only when deepCloneWithImmer is called
```

### Tool calling (explicit opt-in)
```typescript
import { createToolContext } from '@context-action/react/tools';
// Install @context-action/tool-protocol and zod when this entry is used.
```

## Verification

`pnpm verify:react-artifact-boundary` runs after production builds in the
release gate. It proves that the default ESM/CJS entries do not import tool
runtimes or retain TimeTravelStore development logging, while the explicit
`/tools` entry retains the tool protocol dependency.
