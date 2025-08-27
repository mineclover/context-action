# Action Patterns

Pure action dispatching patterns without state management overhead.

## Overview

Action patterns are perfect for event systems, command patterns, and side effects handling. All Action patterns are built on the standardized setup specifications from the **[Basic Action Setup](../setup/basic-action-setup.md)** guide.

## Prerequisites

Before implementing any Action pattern, complete the setup process:

1. **Type Definitions** → [Common Action Patterns](../setup/basic-action-setup.md#common-action-patterns)
2. **Context Creation** → [Context Creation Patterns](../setup/basic-action-setup.md#context-creation-patterns)  
3. **Provider Setup** → [Provider Setup Patterns](../setup/basic-action-setup.md#provider-setup-patterns)

All examples in Action pattern documents use the standardized setup patterns, particularly:
- **EventActions** type pattern for basic examples
- **Single Domain Context** creation pattern
- **Single Provider Setup** for component integration

## Available Action Patterns

### Core Patterns
- **[Basic Usage](./basic-usage.md)** - Fundamental Action Only pattern with type-safe dispatching
  - *Uses EventActions setup pattern from Basic Action Setup*
- **[Type System](./type-system.md)** - TypeScript integration and type safety
  - *Built on ActionPayloadMap extension pattern from setup guide*
- **[Register Delegation](./register-delegation.md)** - Modular handler organization for large applications
  - *Uses Multi-Domain Context Setup pattern*

### Advanced Patterns
- **[Advanced Patterns](./advanced-patterns.md)** - Overview of all advanced action patterns
  - *Showcases multiple setup patterns for complex architectures*
- **[Dispatch Patterns](./dispatch-patterns.md)** - Execution modes, filtering, and performance
  - *Uses AppActions extended interface pattern from setup*
- **[Advanced Filtering](./advanced-filtering.md)** - Sophisticated handler filtering strategies
  - *Handler ID, priority ranges, custom logic, and combined filtering patterns*
- **[Dispatch with Result](./dispatch-with-result.md)** - Result collection and processing
  - *Built on setup patterns with result handling extensions*
- **[Register Patterns](./register-patterns.md)** - Advanced handler registration and memory management
  - *Uses conditional provider setup patterns for complex scenarios*
  - *Includes memory management and handler limit configuration*
- **[Dispatch Access](./dispatch-access.md)** - Hook-based vs register-based access
  - *Demonstrates setup pattern variations for different access strategies*
- **[Handler State Access](./handler-state-access.md)** - ⚠️ **Critical**: Avoiding closure traps in handlers
  - *Essential patterns for proper setup and handler lifecycle management*

## Quick Reference

All examples use the standardized **[Basic Action Setup](../setup/basic-action-setup.md)** specifications.

### Setup-Based Quick Start

```typescript
// 1. Use EventActions type pattern (from setup guide)
interface EventActions {
  userClick: { x: number; y: number };
  analytics: { event: string; data: any };
}

// 2. Use Single Domain Context pattern (from setup guide)
const {
  Provider: EventActionProvider,
  useActionDispatch: useEventDispatch,
  useActionHandler: useEventHandler
} = createActionContext<EventActions>('Events');

// 3. Use Single Provider Setup pattern (from setup guide)
function App() {
  return (
    <EventActionProvider>
      <InteractiveComponent />
    </EventActionProvider>
  );
}

// 4. Component implementation using setup patterns
function InteractiveComponent() {
  const dispatch = useEventDispatch();
  
  const clickHandler = useCallback((payload) => {
    console.log('Click at:', payload.x, payload.y);
  }, []);
  
  useEventHandler('userClick', clickHandler);
  
  return <button onClick={(e) => 
    dispatch('userClick', { x: e.clientX, y: e.clientY })
  }>
    Click Me
  </button>;
}
```

### Pattern Reference

| Pattern | Setup Foundation | Best For |
|---------|------------------|----------|
| **Basic Usage** | EventActions + Single Domain | Event systems, analytics, API calls |
| **Advanced Patterns** | Multi-Domain Setup | Complex applications, domain separation |
| **Advanced Filtering** | ProcessActions + Handler Registry | Conditional execution, workflow control, performance optimization |
| **Register Delegation** | Multi-Context Setup | Large apps, team separation, modular architecture |

## When to Use Action Patterns

Choose Action patterns (built on standardized setup) for:

- **Pure Side Effects**: Analytics, logging, notifications
- **Command Patterns**: User actions, system commands  
- **Event Systems**: Cross-component communication
- **API Integration**: External service calls
- **Modular Architecture**: Team-based handler separation

All implementations follow the setup specifications for consistency and maintainability.

## Key Features

Action patterns provide these capabilities through standardized setup:

- ✅ Type-safe action dispatching (via ActionPayloadMap extension)
- ✅ Priority-based handler execution (through proper context creation)
- ✅ Abort support and error handling (built into setup patterns)
- ✅ Result handling with async support (via useActionDispatchWithResult)
- ✅ Memory management and handler limits (configurable limits and monitoring)
- ✅ Lightweight (no store overhead, setup-optimized)
- ✅ Modular handler organization (through multi-domain setup patterns)

## Setup-Based Architecture Integration

Action patterns integrate seamlessly with other patterns through shared setup foundations:

- **[Store Patterns](../store/)** - Combine with Store setup for state management
- **[Setup Patterns](../setup/)** - Foundation for all Action implementations
- **[Architecture Patterns](../architecture/)** - MVVM and Domain Context integration
- **Multi-Context Setup** - Complex application architectures

### Setup Integration Flow

1. **Start with Setup** → [Basic Action Setup](../setup/basic-action-setup.md)
2. **Choose Pattern** → Select appropriate Action pattern from this guide
3. **Implement Components** → Use setup-based examples in each pattern
4. **Scale Architecture** → Extend with Multi-Context Setup for complex apps

## Next Steps

1. **Complete Setup**: Follow [Basic Action Setup](../setup/basic-action-setup.md) first
2. **Start with Basics**: Begin with [Basic Usage](./basic-usage.md) 
3. **Explore Advanced**: Move to [Advanced Patterns](./advanced-patterns.md) when ready
4. **Scale Up**: Use [Register Delegation](./register-delegation.md) for complex applications