# Context Action Monorepo

A TypeScript library ecosystem for type-safe action pipeline management with React integration and enhanced state management capabilities.

## 📦 Packages

### [@context-action/core](./packages/core)

The foundational library providing type-safe action pipeline management.

```bash
npm install @context-action/core
```

**Features:**
- 🔒 **Type-safe**: Full TypeScript support with strict type checking
- ⚡ **Pipeline System**: Chain multiple handlers with priority control
- 🔄 **Async Support**: Handle both sync and async operations
- 🛡️ **Error Handling**: Built-in error handling and abort mechanisms
- 📊 **Trace Logging**: Advanced debugging with configurable trace logging

### [@context-action/react](./packages/react)

React integration with Context API and hooks for seamless state management.

```bash
npm install @context-action/react
```

**Features:**
- 🎯 **Context Integration**: Seamless React Context integration
- 🪝 **Advanced Hooks**: Comprehensive hook collection for state management
- 🏪 **Store System**: Flexible store architecture with MVVM pattern support
- 🔄 **State Synchronization**: Multi-store synchronization capabilities
- 💾 **Persistence**: Built-in state persistence with customizable strategies

### [@context-action/logger](./packages/logger)

Lightweight logging utility with trace capabilities for debugging.

### [@context-action/jotai](./packages/jotai)

Jotai integration for atom-based state management with action pipelines.

### [@context-action/glossary](./packages/glossary)

TypeScript glossary tool for documentation generation and term management.

## 🏗️ Development Setup

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### Installation

```bash
# Install pnpm globally if you haven't
npm install -g pnpm

# Install dependencies
pnpm install
```

### Development Commands

```bash
# Start development server (test app)
pnpm dev

# Build the library
pnpm build

# Build all packages
pnpm build:all

# Run tests
pnpm test

# Run linting
pnpm lint

# Type checking
pnpm type-check

# Clean build artifacts
pnpm clean
```

## 🚀 Quick Start

1. **Install the packages:**
   ```bash
   # Core package only
   npm install @context-action/core
   
   # With React integration
   npm install @context-action/core @context-action/react
   ```

2. **Define your action types:**
   ```typescript
   import { ActionPayloadMap } from '@context-action/core';

   interface AppActions extends ActionPayloadMap {
     increment: void;
     setCount: number;
     reset: void;
   }
   ```

3. **Create action context with React:**
   ```typescript
   import { createActionContext } from '@context-action/react';

   const { Provider, useAction, useActionHandler } = createActionContext<AppActions>();
   ```

4. **Use in your components:**
   ```typescript
   function Counter() {
     const [count, setCount] = useState(0);
     const dispatch = useAction();

     useActionHandler('increment', () => setCount(prev => prev + 1));
     useActionHandler('setCount', (value) => setCount(value));

     return (
       <div>
         <p>Count: {count}</p>
         <button onClick={() => dispatch('increment')}>+1</button>
         <button onClick={() => dispatch('setCount', 10)}>Set to 10</button>
       </div>
     );
   }
   ```

5. **Advanced: Use with Store System:**
   ```typescript
   import { createStore, StoreProvider, useStore } from '@context-action/react/store';

   const counterStore = createStore({
     state: { count: 0 },
     actions: {
       increment: (state) => ({ count: state.count + 1 }),
       setCount: (state, payload: number) => ({ count: payload })
     }
   });

   function App() {
     return (
       <StoreProvider stores={{ counter: counterStore }}>
         <Counter />
       </StoreProvider>
     );
   }
   ```

## 📁 Project Structure

```
context-action/
├── packages/
│   ├── core/                   # Core action pipeline management
│   │   ├── src/
│   │   │   ├── ActionRegister.ts
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   └── tsdown.config.ts
│   ├── react/                  # React integration and store system
│   │   ├── src/
│   │   │   ├── ActionContext.tsx
│   │   │   ├── ActionProvider.tsx
│   │   │   ├── store/          # Advanced store management
│   │   │   │   ├── Store.ts
│   │   │   │   ├── hooks/
│   │   │   │   └── utils.ts
│   │   │   └── index.ts
│   │   └── tsdown.config.ts
│   ├── logger/                 # Logging utilities
│   ├── jotai/                  # Jotai integration
│   └── glossary/               # Documentation tools
├── docs/                       # Documentation site (Docusaurus)
├── pnpm-workspace.yaml         # pnpm workspace configuration
├── package.json                # Root package.json
└── tsconfig.json              # TypeScript configuration
```

## 🛠️ Technology Stack

- **Package Manager**: pnpm with workspaces
- **Language**: TypeScript 5.3+
- **Bundler**: tsdown (powered by rolldown)
- **Documentation**: VitePress
- **Code Quality**: ESLint + TypeScript strict mode
- **Testing**: Jest + TypeScript

## 📝 Contributing

1. Clone the repository
2. Install dependencies: `pnpm install`
3. Make your changes
4. Build all packages: `pnpm build:all`
5. Run tests: `pnpm test`
6. Lint your code: `pnpm lint`
7. Submit a pull request

## 📄 License

Apache-2.0 © [mineclover](https://github.com/mineclover)

## 🔗 Links

- [📚 Documentation](https://mineclover.github.io/context-action/) - Complete documentation and API reference
- [Core Package](./packages/core) - @context-action/core (Pure TypeScript)
- [React Package](./packages/react) - @context-action/react (React integration)
- [Logger Package](./packages/logger) - @context-action/logger (Logging utilities)
- [Jotai Package](./packages/jotai) - @context-action/jotai (Jotai integration)
- [Glossary Package](./packages/glossary) - @context-action/glossary (Documentation tools)
- [Release Guide](./RELEASE.md) - Publishing documentation
- [Issues](https://github.com/mineclover/context-action/issues) - Bug reports and feature requests
- [한국어 README](./README.ko.md) - Korean version