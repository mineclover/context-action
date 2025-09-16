# Context-Driven Architecture

Architectural principles and philosophy for document-centric state management based on the **Context-Action Framework**.

> **For implementation details, folder structures, and coding guidelines, see [Context-Action Complete Guide](context-action-complete-guide.md)**

## Core Philosophy

> **"The document is the architecture."** - Each context exists as a unit for managing the documents and deliverables of its domain.

Context-Driven Architecture is an innovative architectural approach that overcomes the fundamental limitations of complex state management through **document-centric context separation** and **effective artifact management**.

### Fundamental Problems Addressed

#### Problems with Existing Libraries
- **High React Coupling**: Tight integration makes component modularization and props handling difficult
- **Binary State Approach**: Simple global/local state dichotomy fails to handle specific scope-based separation
- **Inadequate Handler/Trigger Management**: Poor support for complex interactions and business logic processing

#### Context-Action's Solution
- **Document-Artifact Centered Design**: Context separation based on document themes and deliverable management
- **Perfect Separation of Concerns**: Each context manages its own domain documentation and implementation
- **Effective Document-Artifact Management**: State management library that actively supports the relationship between documentation and deliverables

## Context Definition and Separation Principles

### Unit of Context Definition

A context signifies a **unit for defining concepts**. Based on this standard, the visual UI is composed of components, and business logic is structured as an Action Pipeline.

#### Atomic Context Types

**1. Domain Context** - Business Domain Entities
- **Purpose**: Core business domain entities and their essential logic
- **Characteristics**: Contains fundamental business rules, reusable across multiple pages
- **Examples**: User, Product, Order, Payment, Authentication, Search

**2. Page Context** - Page-specific State
- **Purpose**: UI state and logic specific to a particular page
- **Characteristics**: Used only within specific pages, isolated from other pages
- **Examples**: User Dashboard Page, Product List Page, Checkout Flow Page

> **Note**: For detailed folder structures and implementation patterns, see [Context-Action Complete Guide](context-action-complete-guide.md)

#### Context Evolution Philosophy

**Domain Evolution**: When business logic becomes complex enough to warrant its own domain, it evolves from a sub-feature to an independent domain context.

**Page Isolation**: Page contexts remain isolated and their sub-features never become independent domains.

**Atomic Independence**: Each context operates as a completely independent unit, following the principle that each context is responsible for managing its own documents and deliverables.

> **Implementation Details**: See [Context-Action Complete Guide](context-action-complete-guide.md) for folder structures and evolution patterns.

### Context Separation Principles

#### 1. Separation of Concerns
- A parent context does not perform the functions of a child context
- A child context does not directly use the data of a parent context
- Each context has a clear, single responsibility

#### 2. Dependency Direction

**Domain to Domain Dependencies:**
```
Domain (Child) → Domain (Parent) (Allowed)
Domain (Parent) → Domain (Child) (Forbidden)
```

**Page to Domain Dependencies:**
```
Page → Domain (Allowed)
Domain → Page (Forbidden)
```

**Page to Page Dependencies:**
```
Page ↔ Page (Forbidden - Complete Isolation)
```

- **Allowed**: Child domain using parent domain data, pages using any domain data
- **Forbidden**: Parent domain accessing child domain data, domains accessing page data, pages accessing other pages
- **Evolution**: When domain features become complex, they evolve into independent child domains that depend on their parent

#### 3. Event-Based Delegation Pattern

```typescript
// Parent Context: Defines the event
const {
  Provider: ParentActionProvider,
  useActionDispatch: useParentAction
} = createActionContext<ParentActions>('ParentContext');

// Child Context: Executes the parent event
function ChildComponent() {
  const parentDispatch = useParentAction();

  const handleChildAction = () => {
    // After performing child tasks, trigger the parent event
    parentDispatch('parentEvent', childData);
  };
}
```

## Implementation with Context-Action Framework

### 1. Action Pipeline System (ActionRegister)

The core of Context-Action, `ActionRegister`, provides priority-based handler execution.

#### Key Features
- **Priority-Based Execution**: Handlers are sorted and executed by `priority`
- **Multiple Execution Modes**: Supports `sequential`, `parallel`, and `race` modes
- **Advanced Control**: Supports `throttle`, `debounce`, and `abort`
- **Memory Safety**: Automatic cleanup and management of `unregister` functions

#### Core Concept Example

```typescript
// 1. Define Action Types (Business Logic)
interface UserActions {
  updateProfile: { name: string; email: string };
  deleteUser: { userId: string };
  logout: void;
}

// 2. Create Action Context (Business Logic Layer)
const {
  Provider: UserActionProvider,
  useActionDispatch: useUserAction,
  useActionHandler: useUserActionHandler
} = createActionContext<UserActions>('UserActions');

// 3. Implement Business Logic (Handler Layer)
function UserBusinessLogic({ children }) {
  const userStore = useUserStore('profile');

  // High-priority handler (Security validation)
  useUserActionHandler('updateProfile', useCallback(async (payload) => {
    // Step 1: Read current state
    const currentProfile = userStore.getValue();

    // Step 2: Execute business logic
    if (!validateProfile(payload)) {
      throw new Error('Invalid profile data');
    }

    // Step 3: Update state
    userStore.setValue({
      ...currentProfile,
      ...payload,
      lastUpdated: Date.now()
    });

    // API call
    await saveProfile(payload);
  }, [userStore]), { priority: 100 });

  return children;
}
```

> **Complete Implementation Guide**: See [Context-Action Complete Guide](context-action-complete-guide.md) for detailed action pipeline implementation, store patterns, and handler registration.

### 2. Store Pattern System

#### Declarative Store Pattern
Context-Action's `createStoreContext` provides type-safe and declarative store management with immutable state updates using Immer internally.

**Core Principles:**
- **Store Integration 3-Step Process**: Read current state → Execute business logic → Update stores
- **Immutability**: All state updates are immutable using Immer
- **Type Safety**: Full TypeScript support with strict type checking

> **Detailed Store Patterns**: See [Context-Action Complete Guide](context-action-complete-guide.md) for complete store implementation patterns, update conventions, and performance optimization.

### 3. Context-Layered Architecture Philosophy

Context-Driven Architecture integrates with the Context-Action Framework's layered approach to maintain clear separation of concerns:

**Core Layers**:
- **Context Definitions**: Pure atomic context declarations
- **Action Dispatch**: Business action triggering interface
- **Store Subscriptions**: State observation and computed values
- **Business Logic**: Domain rules, workflows, and handler registration
- **View Interfaces**: Presentation layer contracts and composition
- **UI Components**: Visual presentation and user interaction

**Layer Responsibilities**:
- Each layer has a single, clear responsibility
- Dependencies flow in one direction (views → viewmodels → hooks/actions → handlers → contexts)
- Business logic stays in handlers, presentation logic in components

> **Complete Implementation Guide**: See [Context-Action Complete Guide](context-action-complete-guide.md) for detailed 5-layer architecture implementation, atomic folder structures, and coding patterns.

## Design System Integration

### CVA-Based Component Styling

Context-Driven Architecture integrates with design systems through **Class Variance Authority (CVA)** for consistent, maintainable styling.

#### Implementation Principles

**Separation of Style and Interaction:**
- Style parameters are controlled through component props
- Interaction logic remains in the business logic layer
- Style changes are triggered by business state changes

```typescript
// Style parameters are controlled by business logic
const [variant, setVariant] = useState<'primary' | 'secondary'>('primary');

const handleBusinessLogic = () => {
  // Business logic determines style change
  setVariant(prev => prev === 'primary' ? 'secondary' : 'primary');
};
```

> **Design System Implementation**: See [Context-Action Complete Guide](context-action-complete-guide.md) for CVA integration patterns and design token systems.

## Architectural Advantages

### 1. Design Component Observability
- **Clear State Flow**: All state changes flow through action pipeline
- **Predictable Updates**: Handler priority system ensures consistent execution order
- **Debugging Support**: Action pipeline provides clear audit trail

### 2. Clear Event-Driven Architecture
- **Action-Centric Design**: All business logic triggered through actions
- **Decoupled Components**: UI components only dispatch actions and observe state
- **Testable Logic**: Business logic in handlers can be tested independently

### 3. Update Isolation and Control
- **Context Boundaries**: Changes within one context don't affect others
- **Controlled Dependencies**: Explicit dependency declarations prevent unintended coupling
- **Atomic Updates**: Each context manages its own state atomically

### 4. Logic Transparency
- **Handler Registration**: All business logic explicitly registered and visible
- **Priority System**: Clear execution order for complex workflows
- **State Management**: Transparent state updates through action pipeline

### 5. Implementation Simplification
- **Pattern Consistency**: Same patterns apply across all contexts
- **Type Safety**: Full TypeScript support reduces runtime errors
- **Boilerplate Reduction**: Framework handles common patterns automatically

### 6. Potential for Incremental Development
- **Context Evolution**: Start simple, grow complex features into independent contexts
- **Independent Development**: Different contexts can be developed independently
- **Gradual Migration**: Existing code can be migrated context by context

## Implementation Guidelines

### 1. Context Design
- Start with clear context boundaries based on business domains
- Define atomic contexts that are completely independent
- Use page contexts for UI-specific state, domain contexts for business logic
- Document context specifications and dependencies

### 2. Handler Registration Pattern
- Register all business logic through action handlers
- Use priority system for complex workflows
- Implement 3-step store integration pattern (read → logic → update)
- Handle errors appropriately and provide meaningful feedback

### 3. Store Usage Pattern
- Use store subscriptions for reactive UI updates
- Implement proper comparison strategies (reference/shallow/deep)
- Follow immutability rules for state updates
- Optimize store structure for performance

### 4. Error Handling Pattern
- Implement proper error boundaries for each context
- Use action pipeline controller for error handling
- Provide meaningful error messages and recovery options
- Log errors appropriately for debugging

> **Complete Implementation Examples**: See [Context-Action Complete Guide](context-action-complete-guide.md) for detailed implementation patterns, code examples, and best practices.

## Conclusion

Context-Driven Architecture provides a comprehensive approach to building maintainable, scalable applications through:

1. **Document-Centric Design**: Architecture follows documentation structure
2. **Atomic Context Isolation**: Each context is completely independent
3. **Clear Separation of Concerns**: Layered architecture with single responsibilities
4. **Type-Safe Implementation**: Full TypeScript support throughout
5. **Incremental Development**: Start simple, evolve complexity naturally

This architectural approach enables teams to build applications that remain maintainable as they scale, with clear boundaries, predictable behavior, and excellent developer experience.

**Next Steps**: Explore the [Context-Action Complete Guide](context-action-complete-guide.md) for hands-on implementation patterns, detailed folder structures, and comprehensive coding examples.