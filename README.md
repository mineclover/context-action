# Context Action Monorepo

A TypeScript library for type-safe action pipeline management with React integration, organized as a pnpm monorepo.

## 📦 Packages

### [@context-action/core](./packages/context-action)

The main library package providing type-safe action pipeline management with React integration.

```bash
npm install @context-action/core
```

**Features:**
- 🔒 **Type-safe**: Full TypeScript support with strict type checking
- ⚡ **Pipeline System**: Chain multiple handlers with priority control
- 🎯 **Context Integration**: Seamless React Context integration
- 🔄 **Async Support**: Handle both sync and async operations
- 🛡️ **Error Handling**: Built-in error handling and abort mechanisms
- 📦 **Lightweight**: Minimal bundle size with zero dependencies

### [test-app](./packages/test-app)

Development and testing environment for the library using Vite + React.

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

1. **Install the library:**
   ```bash
   npm install @context-action/core
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

3. **Create action context:**
   ```typescript
   import { createActionContext } from '@context-action/core';

   const { Provider, useAction, useActionHandler } = createActionContext<AppActions>();
   ```

4. **Use in your components:**
   ```typescript
   function Counter() {
     const [count, setCount] = useState(0);
     const action = useAction();

     useActionHandler('increment', () => setCount(prev => prev + 1));
     useActionHandler('setCount', (value) => setCount(value));

     return (
       <div>
         <p>Count: {count}</p>
         <button onClick={() => action.dispatch('increment')}>+1</button>
         <button onClick={() => action.dispatch('setCount', 10)}>Set to 10</button>
       </div>
     );
   }
   ```

## 📁 Project Structure

```
context-action/
├── packages/
│   ├── context-action/          # Main library package
│   │   ├── src/
│   │   │   ├── core/           # Core ActionRegister logic
│   │   │   ├── react/          # React integration
│   │   │   └── index.ts        # Main entry point
│   │   ├── dist/               # Built files
│   │   ├── README.md           # Library documentation
│   │   ├── package.json
│   │   └── tsdown.config.ts    # Build configuration
│   └── test-app/               # Development test environment
│       ├── src/
│       │   ├── App.tsx         # Test application
│       │   └── main.tsx
│       ├── package.json
│       └── vite.config.ts
├── pnpm-workspace.yaml         # pnpm workspace configuration
├── package.json                # Root package.json
└── tsconfig.json              # TypeScript configuration
```

## 🛠️ Technology Stack

- **Package Manager**: pnpm with workspaces
- **Language**: TypeScript 5.3+
- **Bundler**: tsdown (powered by rolldown)
- **Test Environment**: Vite + React 18
- **Code Quality**: ESLint + TypeScript strict mode

## 📝 Contributing

1. Clone the repository
2. Install dependencies: `pnpm install`
3. Start development: `pnpm dev`
4. Make your changes
5. Test your changes in the test app
6. Build the library: `pnpm build`
7. Submit a pull request

## 📄 License

Apache-2.0 © [mineclover](https://github.com/mineclover)

## 🔗 Links

- [Core Package](./packages/core) - @context-action/core (Pure TypeScript)
- [React Package](./packages/react) - @context-action/react (React integration)
- [Test App](./packages/test-app) - Development environment
- [Release Guide](./RELEASE.md) - Publishing documentation
- [Issues](https://github.com/mineclover/context-action/issues) - Bug reports and feature requests
- [한국어 README](./README.ko.md) - Korean version