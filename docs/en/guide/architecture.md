# Architecture

Context-Action implements a clean separation of concerns through an MVVM-inspired pattern.

## Core Architecture

The framework separates concerns into three clear layers:

```
[Component] → dispatch → [Action Pipeline] → handlers → [Store] → subscribe → [Component]
```

### Layers

1. **View Layer**: React components that render UI and dispatch actions
2. **ViewModel Layer**: Action pipeline with priority-based handler execution  
3. **Model Layer**: Store system with reactive state management

## Context Separation

Context-Action organizes code into domain-specific contexts:

### Domain-Based Contexts
- **Business Context**: Business logic, data processing, and domain rules
- **UI Context**: Screen state, user interactions, and component behavior  
- **Validation Context**: Data validation, form processing, and error handling
- **Design Context**: Theme management, styling, layout, and visual states
- **Architecture Context**: System configuration, infrastructure, and technical decisions

### Context Benefits
- **Domain Isolation**: Each context maintains complete independence
- **Clear Boundaries**: Implementation results maintain distinct, well-defined domain boundaries
- **Type Safety**: Full TypeScript support with domain-specific hooks
- **Scalability**: Easy to add new domains without affecting existing ones

## Handler Management

Context-Action provides sophisticated handler and trigger management:

### Priority-Based Execution
- **Sequential Processing**: Handlers execute in priority order with proper async handling
- **Domain Isolation**: Each context maintains its own handler registry
- **Cross-Context Coordination**: Controlled communication between domain contexts
- **Result Collection**: Aggregate results from multiple handlers for complex workflows

### Trigger System
- **State-Change Triggers**: Automatic triggers based on store value changes
- **Cross-Context Triggers**: Domain boundaries can trigger actions in other contexts
- **Conditional Triggers**: Smart triggers based on business rules and conditions
- **Trigger Cleanup**: Automatic cleanup prevents memory leaks and stale references

## Package Structure

Context-Action is organized as a TypeScript monorepo:

- **@context-action/core** - Core action pipeline management (no React dependency)
- **@context-action/react** - React integration with Context API and hooks

## Key Benefits

1. **Document-Artifact Management**: Direct relationship between documentation and implementation
2. **Perfect Separation of Concerns**: Clear boundaries between different domain contexts
3. **Advanced Handler Management**: Priority-based handler execution with sophisticated trigger system
4. **Type Safety**: Full TypeScript support throughout the framework
5. **Performance**: Only affected components re-render
6. **Team Collaboration**: Different teams can work on different domains