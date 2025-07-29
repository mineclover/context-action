---
layout: home

hero:
  name: "Context Action"
  text: "Type-safe action pipeline management"
  tagline: "Build powerful React applications with predictable action handling"
  image:
    src: /logo.svg
    alt: Context Action
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/mineclover/context-action

features:
  - icon: 🔒
    title: Type-safe
    details: Full TypeScript support with strict type checking for actions and payloads
  - icon: ⚡
    title: Pipeline System
    details: Chain multiple handlers with priority control and async support
  - icon: 🎯
    title: React Integration
    details: Seamless React Context integration with hooks for easy state management
  - icon: 🔄
    title: Async Support
    details: Handle both synchronous and asynchronous operations with built-in error handling
  - icon: 🛡️
    title: Error Handling
    details: Built-in error handling and abort mechanisms for robust applications
  - icon: 📦
    title: Lightweight
    details: Minimal bundle size with zero dependencies for optimal performance
---

## Quick Example

```typescript
import { createActionContext } from '@context-action/react';

// Define your action types
interface AppActions {
  increment: void;
  setCount: number;
  reset: void;
}

// Create action context
const { Provider, useAction, useActionHandler } = createActionContext<AppActions>();

function Counter() {
  const [count, setCount] = useState(0);
  const action = useAction();

  // Register action handlers
  useActionHandler('increment', () => setCount(prev => prev + 1));
  useActionHandler('setCount', (value) => setCount(value));
  useActionHandler('reset', () => setCount(0));

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => action.dispatch('increment')}>+1</button>
      <button onClick={() => action.dispatch('setCount', 10)}>Set to 10</button>
      <button onClick={() => action.dispatch('reset')}>Reset</button>
    </div>
  );
}
```

## Installation

::: code-group

```bash [npm]
npm install @context-action/core @context-action/react
```

```bash [pnpm]
pnpm add @context-action/core @context-action/react
```

```bash [yarn]
yarn add @context-action/core @context-action/react
```

:::

## Why Context Action?

- **🎯 Predictable**: Actions flow through a predictable pipeline with clear ordering
- **🔧 Flexible**: Priority-based handler system adapts to your application needs  
- **⚡ Performance**: Optimized for minimal overhead and maximum throughput
- **🧪 Testable**: Clean separation of concerns makes testing straightforward
- **📚 Developer-friendly**: Excellent TypeScript support and comprehensive documentation

[Get Started →](/guide/getting-started)