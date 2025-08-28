# Context-Action Example Application

Comprehensive demonstration and testing environment for the Context-Action framework, showcasing practical implementations through a **catalog-based architecture**.

## 🎯 Purpose

This example application serves as:
- **Learning Catalog**: Organized by expertise level and use case
- **Live Documentation**: Interactive examples of Context-Action patterns
- **Development Environment**: Testing playground during framework development  
- **Implementation Reference**: Production-ready code examples and best practices

## 📚 5-Catalog Architecture

The application is organized into **5 specialized catalogs**, each designed for specific learning paths and use cases:

### 🏗️ **Foundations** (`/foundations/`)
**Target**: New users, developers learning Context-Action basics
- **Core** - ActionRegister, pipeline fundamentals
- **Store** - State management, declarative patterns  
- **React** - Context integration, hooks, providers

### ⚡ **Performance** (`/performance/`) 
**Target**: Developers solving performance problems
- **Action Guard** - Debouncing, throttling, advanced filtering
- **Priority** - Handler execution order, performance metrics
- **Mouse Events** - High-frequency event optimization
- **Memoization** - Performance comparison with/without memoization

### 🎛️ **Patterns** (`/patterns/`)
**Target**: Experienced developers implementing complex workflows  
- **Conditional** - Permission-based execution, form validation
- **Pipeline** - Flow control, workflow orchestration
- **Refs** - Advanced reference patterns, performance optimization

### 🧩 **Integrations** (`/integrations/`)
**Target**: Developers building real applications
- **Business** - Todo lists, shopping carts, chat systems
- **Advanced** - Canvas drawing, concurrent actions, form builders

### 🛠️ **Utilities** (`/utilities/`)
**Target**: Developers improving development workflow
- **Dev Tools** - Logging, debugging, toast systems
- **Testing** - Test patterns, validation utilities

## 🚀 Getting Started

### Quick Start

From the monorepo root:
```bash
pnpm install && pnpm dev
```

### Development Commands

```bash
# Development server
pnpm dev                 # Start development server
pnpm example:dev         # Alternative command

# Build commands  
pnpm build              # TypeScript strict + production build (default)
pnpm build:fast         # Fast build without TypeScript checking
pnpm example:build      # Build with TypeScript strict checking
pnpm example:build:fast # Fast build without TypeScript checking

# Quality assurance
pnpm lint               # Biome linting 
pnpm type-check         # TypeScript checking
```

### Navigation

Visit the application and explore catalogs based on your needs:
- **New to Context-Action?** → Start with Foundations
- **Performance issues?** → Jump to Performance catalog
- **Complex workflows?** → Explore Patterns catalog
- **Building real apps?** → Check Integrations catalog
- **Development tools?** → Browse Utilities catalog

## 🏛️ Architecture Patterns Demonstrated

### Primary Patterns

#### **Action Only Pattern**
Pure action dispatching without state management
```typescript
const { Provider, useActionDispatch, useActionHandler } = createActionContext<EventActions>('Events')
```

#### **Store Only Pattern** (Recommended)
Type-safe state management with excellent inference
```typescript  
const { Provider, useStore, useStoreManager } = createStoreContext('App', {
  user: { name: '', email: '' },
  settings: { theme: 'light' }
})
```

#### **MVVM Integration**
Complete separation of concerns:
- **View**: React components (presentation)
- **ViewModel**: Action handlers (business logic)  
- **Model**: Stores (data management)

### Advanced Patterns

#### **Store Integration 3-Step Process**
Standard pattern for action handlers:
```typescript
useActionHandler('updateUser', async (payload) => {
  // 1. Read current state
  const currentUser = userStore.getValue()
  
  // 2. Execute business logic
  const updatedUser = { ...currentUser, ...payload }
  
  // 3. Update stores
  userStore.setValue(updatedUser)
})
```

#### **Pattern Composition**
Combine Action Only + Store Only patterns for complex applications with independent context management per pattern.

## 📂 Catalog Structure

```
src/pages/
├── foundations/          🏗️ Core concepts & basic usage
│   ├── core/            ActionRegister, pipeline fundamentals
│   ├── store/           Store management, declarative patterns
│   └── react/           Context integration, hooks
│
├── performance/          ⚡ Optimization & action guards
│   ├── action-guard/    Debouncing, throttling, filtering
│   ├── priority/        Handler execution order  
│   ├── mouse-events/    High-frequency event handling
│   └── memoization/     Performance comparison with/without memoization
│
├── patterns/             🎛️ Advanced patterns & workflows
│   ├── conditional/     Permission-based execution
│   ├── pipeline/        Flow control, orchestration
│   └── refs/            Advanced reference patterns
│
├── integrations/         🧩 Real-world applications
│   ├── business/        Todo, shopping, chat examples
│   └── advanced/        Canvas, concurrent actions
│
├── utilities/            🛠️ Development tools
│   ├── dev-tools/       Logging, debugging, toasts
│   └── testing/         Test patterns, validation
│
└── shared/               Common components & utilities
    ├── components/      Reusable UI components
    ├── lib/             Library code & patterns
    ├── hooks/           Shared hooks
    └── utils/           Utility functions
```

## 🎯 Key Features Demonstrated

### Type Safety & Developer Experience
- **Strict TypeScript Integration**: Full type checking across all patterns
- **IntelliSense Support**: Complete autocompletion for actions and stores
- **Action Payload Validation**: Compile-time payload type checking
- **Store Type Inference**: Automatic type inference without manual annotations

### Performance Optimization  
- **Action Guards**: Prevent excessive handler execution
- **Priority System**: Control handler execution order
- **Event Optimization**: Handle high-frequency events efficiently
- **Memoization**: Performance comparison with/without memoization
- **Memory Management**: Proper cleanup and lifecycle handling

### Business Logic Patterns
- **Handler Registration**: `useActionHandler` + `useCallback` pattern
- **Store Updates**: Reactive state management with `useStoreValue`
- **Error Handling**: Pipeline controller abort and error management  
- **Async Operations**: Async handler support with proper error boundaries

### Development Tools
- **Live Logging**: Real-time action pipeline monitoring
- **Toast System**: User feedback and debugging utilities
- **Performance Metrics**: Handler execution timing and statistics
- **Debug Components**: Development workflow optimization tools

## 🔧 Development Workflow

### For Framework Development
1. **Edit Core**: Make changes in `packages/core/src/` or `packages/react/src/`
2. **Hot Reload**: Vite automatically reloads with your changes
3. **Test Examples**: Navigate to relevant catalog pages to test functionality
4. **Monitor Console**: Watch action pipeline execution and performance metrics
5. **Iterate**: Refine and test across multiple catalog examples

### For Learning Context-Action
1. **Start with Foundations**: Learn core concepts systematically
2. **Explore by Use Case**: Jump to specific catalogs based on your needs
3. **Copy Patterns**: Use catalog examples as templates for your projects
4. **Experiment**: Modify examples to understand behavior
5. **Build Applications**: Apply learned patterns to real projects

## 🧪 Testing & Quality

### Built-in Testing Features
- **Type Safety Validation**: Comprehensive TypeScript strict mode
- **Hot Module Replacement**: Fast development feedback
- **Live Error Monitoring**: Real-time error detection and reporting
- **Performance Profiling**: Handler execution timing and metrics

### Quality Assurance
- **Biome Linting**: Modern, fast linting with auto-fixes
- **TypeScript Checking**: Strict type validation
- **Build Verification**: Production build testing
- **Pattern Validation**: Verify patterns work across all catalogs

## 📖 Learning Path Recommendations

### Beginner Path
1. **Foundations/Core** - Understand ActionRegister basics
2. **Foundations/Store** - Learn state management patterns  
3. **Foundations/React** - Master React integration
4. **Utilities/Dev-Tools** - Set up debugging workflow

### Intermediate Path
1. **Performance/Action-Guard** - Optimize user interactions
2. **Patterns/Conditional** - Implement business rules
3. **Integrations/Business** - Build complete features
4. **Performance/Priority** - Fine-tune execution order

### Advanced Path  
1. **Patterns/Pipeline** - Orchestrate complex workflows
2. **Integrations/Advanced** - Handle sophisticated use cases
3. **Performance/Mouse-Events** - Optimize high-frequency events
4. **Patterns/Refs** - Master advanced reference patterns

## 🔗 Related Documentation

- [Framework Documentation](../docs/) - Complete Context-Action documentation
- [Core Package](../packages/core/) - @context-action/core source code
- [React Package](../packages/react/) - @context-action/react source code
- [Monorepo Root](../README.md) - Project overview and development setup

## 🔗 Related

- [Main Library](../context-action) - @context-action/core package
- [Monorepo Root](../../README.md) - Project overview
- [Vite Documentation](https://vitejs.dev/) - Build tool documentation