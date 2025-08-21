# Advanced Action Patterns

Overview of advanced action patterns in the Context-Action framework. For detailed implementations, see the specialized pattern guides below.

## Pattern Categories

The Context-Action framework provides three main categories of action patterns:

### 🚀 Dispatch Patterns
Basic action dispatching with execution modes, filtering, and performance optimization.

- **Execution Modes**: Sequential, parallel, and race execution
- **Handler Filtering**: Tag-based, category-based, and custom filtering
- **Performance**: Timeout control and priority-based execution

**[View Dispatch Patterns →](./dispatch-patterns.md)**

### 📊 Result Collection Patterns
Advanced result handling for complex business logic and data processing.

- **Collection Strategies**: Merge, array, and custom result processing
- **Execution Metadata**: Timing, handler counts, and performance monitoring
- **Business Logic**: Validation pipelines, data processing, and aggregation

**[View Dispatch with Result Patterns →](./dispatch-with-result.md)**

### ⚙️ Registration Patterns
Handler registration with advanced configuration and lifecycle management.

- **Configuration Options**: Priority, tags, conditions, and environment controls
- **Performance Features**: Debouncing, throttling, and one-time handlers
- **Error Handling**: Circuit breakers, graceful recovery, and validation patterns

**[View Register Patterns →](./register-patterns.md)**

### 🔌 Dispatch Access Patterns
Two main approaches for accessing dispatch functionality: hook-based and register-based.

- **Hook-Based**: React-optimized dispatch using `useActionDispatch()` hook
- **Register-Based**: Direct ActionRegister access for advanced scenarios
- **Hybrid Approaches**: Combining both methods for complex applications

**[View Dispatch Access Patterns →](./dispatch-access.md)**

## Real-World Examples

- [Priority Performance Demo](https://github.com/mineclover/context-action/tree/main/example/src/pages/actionguard/priority-performance) - Priority-based handler execution
- [Search Page](https://github.com/mineclover/context-action/blob/main/example/src/pages/actionguard/SearchPage.tsx) - Debounced search implementation
- [Scroll Page](https://github.com/mineclover/context-action/blob/main/example/src/pages/actionguard/ScrollPage.tsx) - Throttled scroll handling

## Related Patterns

- [Action Basic Usage](./basic-usage.md) - Fundamental action patterns
- [Type System](./type-system.md) - TypeScript integration
- [Register Delegation](./register-delegation.md) - Modular handler organization