# Context Singleton Handling

## Definition

**Context Singleton**: An object that exists as a single instance within a specific React context boundary, managed through RefContext for lazy evaluation and proper lifecycle control.

## Core Concepts

### Context Singleton vs Code Singleton

**Context Singleton**
- **Scope**: React context boundary (Provider → Provider)
- **Lifecycle**: Tied to context mounting/unmounting  
- **Configuration**: Can vary per context instance
- **Purpose**: Context-specific, user-specific, or environment-specific instances

**Code Singleton** 
- **Scope**: Module/global scope across entire application
- **Lifecycle**: Application lifetime (static)
- **Configuration**: Fixed at module load time
- **Purpose**: Truly global, stateless utilities

### Lazy Evaluation

**Definition**: Object creation and initialization deferred until first access, not at context creation time.

**Mechanism**: RefContext provides reference holders that remain empty until explicitly populated through `setRef()` calls.

**Benefits**:
- **Performance**: Expensive objects created only when needed
- **Resource Efficiency**: Unused singletons consume no resources
- **Conditional Logic**: Different singletons can be created based on runtime conditions

### Lightweight Ref Wrapper

**Definition**: RefContext acts as a minimal container that holds references to external objects without coupling them to React's lifecycle.

**Characteristics**:
- **Zero React Coupling**: External objects remain independent
- **Reference Management**: Provides `target` property for object access
- **Type Safety**: Full TypeScript support for referenced objects
- **Lifecycle Independence**: Objects can exist beyond React component lifecycles

## Architectural Principles

### Scope Isolation

**Principle**: Each context boundary maintains its own singleton instances, preventing global state interference.

**Implementation**: Multiple Provider instances create separate singleton scopes:
- Provider A → Singleton Instance A  
- Provider B → Singleton Instance B
- No shared state between contexts

### Context-Driven Lifecycle

**Principle**: Singleton lifecycle is tied to context mounting/unmounting, not component lifecycles.

**Lifecycle Events**:
- **Context Mount**: Singleton creation opportunity
- **Context Active**: Singleton access and usage
- **Context Unmount**: Singleton cleanup and disposal

### Configuration Flexibility

**Principle**: Each context can configure its singletons differently based on context-specific needs.

**Configuration Sources**:
- User-specific settings
- Environment variables  
- Feature flags
- A/B test variants
- Multi-tenant configurations

## Decision Framework

### Use Code Singletons When:
- Object is stateless and immutable
- Configuration never changes at runtime
- No context-specific behavior required
- No cleanup or disposal needed
- Truly global application utilities

### Use Context Singletons When:
- User-specific or tenant-specific instances needed
- Environment-dependent configurations required
- Testing requires isolated instances
- Lifecycle tied to specific contexts
- Resource cleanup necessary on context unmount

## Implementation Patterns

### Reference Management Pattern

**Pattern**: RefContext provides reference holders with `target` property for accessing singleton objects.

**Structure**:
- `ref.target`: Current singleton instance (null if uninitialized)
- `ref.setRef()`: Method to assign singleton instance
- `ref.current`: Direct access to wrapped object (discouraged)

### Initialization Patterns

**On-Demand Initialization**: Create singleton when first accessed in business logic
- Most common pattern
- Triggered by user actions or system events

**Context Mount Initialization**: Create singleton when context mounts  
- For singletons that must exist throughout context lifetime
- Triggered by useEffect in context setup

**Conditional Initialization**: Create different singletons based on runtime conditions
- Feature flags determine singleton type
- User permissions determine singleton configuration

### Lifecycle Patterns  

**Cleanup on Unmount**: Essential pattern for resource management
- Dispose of connections, files, timers
- Prevent memory leaks
- Release external resources

**Lazy Disposal**: Defer cleanup until necessary
- Keep singletons alive across component re-renders
- Clean up only on context unmount or replacement

## Conceptual Boundaries

### What Context Singletons ARE:
- **Scoped Objects**: Exist within specific context boundaries
- **External Resources**: Database connections, API clients, third-party SDKs
- **Stateful Services**: Objects that maintain internal state
- **Context-Configurable**: Can be configured differently per context

### What Context Singletons are NOT:
- **React State**: Not for managing reactive UI state
- **Global Objects**: Not for application-wide singletons
- **Component Data**: Not for component-local data
- **State Replacement**: Not a substitute for store patterns

## Relationship to Other Patterns

### vs Store Patterns
- **Stores**: Reactive state management with subscriptions
- **Context Singletons**: External object management without reactivity

### vs React Context
- **React Context**: Direct value sharing across components  
- **RefContext**: Reference management for external objects

### vs Dependency Injection
- **DI**: Provides dependencies through constructor injection
- **Context Singletons**: Provides context-scoped dependencies through hooks

## Key Takeaways

### Core Understanding
1. **Context Singletons** exist once per context boundary, not globally
2. **Lazy Evaluation** defers object creation until first access  
3. **Lightweight Wrapper** provides reference management without React coupling
4. **Scope Isolation** prevents interference between different contexts

### Design Decisions
- Choose **Code Singletons** for stateless, global utilities
- Choose **Context Singletons** for configurable, context-specific objects
- Use **RefContext** for external object management, not reactive state
- Implement proper **cleanup patterns** to prevent resource leaks

### Architectural Benefits  
- **Testability**: Isolated instances per context enable better testing
- **Flexibility**: Different configurations per context support multi-tenancy  
- **Performance**: Lazy evaluation reduces unnecessary resource consumption
- **Maintainability**: Clear separation between singleton types and responsibilities

## Related Patterns

- **[Context Splitting](../architecture/context-splitting.md)** - Managing singleton objects across split contexts
- **[RefContext Basic Usage](./basic-usage.md)** - Foundation RefContext patterns