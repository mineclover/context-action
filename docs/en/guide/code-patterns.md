# Code Patterns

Core patterns for Context-Action framework's RefContext and useWaitForRefs functionality.

For detailed examples and implementation guidelines, see the organized pattern collection:

## 📁 [Pattern Collection](./patterns/)

### Core Patterns
- **[RefContext Setup](./patterns/ref-context-setup.md)** - Basic setup with TypeScript types
- **[Conditional Await](./patterns/conditional-await.md)** - Core useWaitForRefs behavior
- **[Wait-Then-Execute](./patterns/wait-then-execute.md)** - Safe DOM manipulation
- **[Real-time State Access](./patterns/real-time-state-access.md)** - Avoiding closure traps
- **[Timeout Protection](./patterns/timeout-protection.md)** - Preventing infinite waits

## Quick Reference

### Essential Rules

#### ✅ Do
- Use `useCallback` for handlers with useWaitForRefs
- Access real-time state with `store.getValue()`
- Handle errors with try-catch
- Test both mounted/unmounted scenarios

#### ❌ Don't
- Use direct DOM queries (`document.getElementById`)
- Rely on component scope values in handlers
- Ignore error handling
- Skip timeout protection for critical paths