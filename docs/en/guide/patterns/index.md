# Code Patterns

Collection of essential patterns for the Context-Action framework, focusing on RefContext and useWaitForRefs functionality.

## Core Patterns

### [RefContext Setup](./ref-context-setup.md)
Basic setup pattern for RefContext with proper TypeScript types and provider integration.

### [Conditional Await](./conditional-await.md)
Core behavior of useWaitForRefs that conditionally waits or returns immediately based on element mount state.

### [Wait-Then-Execute](./wait-then-execute.md)
Pattern for safely executing DOM operations after ensuring element availability.

### [Real-time State Access](./real-time-state-access.md)
Pattern for avoiding closure traps by accessing current state in real-time using `store.getValue()`.

### [Timeout Protection](./timeout-protection.md)
Pattern for protecting against infinite waits with timeout mechanisms and retry logic.

## Usage Guidelines

Each pattern includes:
- ✅ **Best practices** with working examples
- ❌ **Common pitfalls** to avoid
- 🎯 **Use cases** for when to apply the pattern
- ⚡ **Performance considerations** and optimization tips

## Pattern Composition

These patterns can be combined for complex scenarios:
- **RefContext Setup** + **Conditional Await** for basic element waiting
- **Real-time State Access** + **Wait-Then-Execute** for race condition prevention
- **Timeout Protection** + any pattern for robust error handling