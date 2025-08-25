# Setup & Configuration

Shared setup patterns and configurations for the Context-Action framework.

## Overview

This section provides reusable setup patterns that can be referenced across all pattern documentation. Instead of duplicating setup code in every document, these shared configurations serve as the foundation for all Context-Action implementations.

## Available Setup Guides

### Core Setup Patterns

- **[Basic Action Setup](./basic-action-setup.md)** - Action context setup patterns and type definitions
- **[Basic Store Setup](./basic-store-setup.md)** - Store context setup patterns and configurations  
- **[Multi-Context Setup](./multi-context-setup.md)** - Complex architecture setup for large applications

### Setup Guide Usage

Each setup guide provides:

1. **Type Definitions** - Reusable interface definitions for common patterns
2. **Context Creation** - Standard context creation patterns with naming conventions
3. **Provider Setup** - Provider composition and organization patterns
4. **Export Patterns** - Best practices for exporting contexts and hooks
5. **Configuration Options** - Advanced configuration for different scenarios

## How to Use Setup Guides

### 1. Reference in Pattern Documents
Pattern documents reference these setup guides instead of duplicating configuration code:

```markdown
## Prerequisites
See [Basic Action Setup](../setup/basic-action-setup.md) for action context configuration.
```

### 2. Copy and Customize
Use the provided patterns as starting points and customize for your specific domain:

```typescript
// From Basic Action Setup - customize for your domain
interface MyDomainActions {
  // Copy base pattern and modify
  createItem: { data: MyDomainData };
  updateItem: { id: string; data: Partial<MyDomainData> };
  deleteItem: { id: string };
}
```

### 3. Import Shared Types
Import and extend shared type definitions:

```typescript
import { CRUDActions, UserActions } from '../setup/basic-action-setup';

interface MyAppActions extends CRUDActions, UserActions {
  customAction: { payload: any };
}
```

## Setup Pattern Categories

### Single Context Patterns
For applications using one context type:
- Simple action dispatching → **[Basic Action Setup](./basic-action-setup.md)**
- Basic state management → **[Basic Store Setup](./basic-store-setup.md)**

### Multi-Context Patterns  
For applications using multiple contexts:
- MVVM architecture → **[Multi-Context Setup](./multi-context-setup.md#mvvm-architecture-setup)**
- Domain-driven design → **[Multi-Context Setup](./multi-context-setup.md#domain-context-architecture-setup)**
- Enterprise applications → **[Multi-Context Setup](./multi-context-setup.md#conditional-multi-context-setup)**

### Advanced Patterns
For complex applications:
- Cross-context communication → **[Multi-Context Setup](./multi-context-setup.md#cross-context-communication-setup)**
- Performance optimization → **[Multi-Context Setup](./multi-context-setup.md#mvvm-architecture-setup)** (RefContext)
- Provider composition → All setup guides include composition patterns

## Configuration Best Practices

### Type Organization
1. **Domain-Driven**: Organize types by business domain
2. **Reusability**: Create reusable type patterns for common operations
3. **Consistency**: Use consistent naming conventions across domains
4. **Extensibility**: Design types for future extension and modification

### Context Management
1. **Clear Naming**: Use descriptive names for contexts and hooks
2. **Domain Separation**: Separate contexts by business or technical domains  
3. **Provider Composition**: Use utilities for clean provider organization
4. **Performance**: Consider re-render implications of context structure

### Setup Documentation
1. **Reference First**: Always reference setup guides before duplicating code
2. **Customize Appropriately**: Modify patterns to fit your specific needs
3. **Maintain Consistency**: Follow established patterns across your application
4. **Update Centrally**: Update setup guides when patterns evolve

## Quick Reference Matrix

| Use Case | Action Context | Store Context | Ref Context | Setup Guide |
|----------|----------------|---------------|-------------|-------------|
| Simple UI events | ✅ | ❌ | ❌ | [Basic Action](./basic-action-setup.md) |
| Basic state management | ❌ | ✅ | ❌ | [Basic Store](./basic-store-setup.md) |
| Form handling | ✅ | ✅ | ❌ | Both Basic guides |
| Performance optimization | ✅ | ✅ | ✅ | [Multi-Context](./multi-context-setup.md) |
| MVVM architecture | ✅ | ✅ | ✅ | [Multi-Context MVVM](./multi-context-setup.md#mvvm-architecture-setup) |
| Domain separation | ✅ | ✅ | Optional | [Multi-Context Domain](./multi-context-setup.md#domain-context-architecture-setup) |
| Enterprise applications | ✅ | ✅ | ✅ | [Multi-Context Enterprise](./multi-context-setup.md#conditional-multi-context-setup) |

## Integration with Pattern Documentation

These setup guides integrate with pattern documentation as follows:

### Action Patterns
- **[Action Basic Usage](../action/basic-usage.md)** → Uses [Basic Action Setup](./basic-action-setup.md)
- **[Dispatch Access Patterns](../action/dispatch-access.md)** → Uses [Basic Action Setup](./basic-action-setup.md)
- **[Advanced Action Patterns](../action/advanced-patterns.md)** → Uses [Multi-Context Setup](./multi-context-setup.md)

### Store Patterns
- **[Store Basic Usage](../store/basic-usage.md)** → Uses [Basic Store Setup](./basic-store-setup.md)
- **[Store Performance Patterns](../store/performance-patterns.md)** → Uses [Basic Store Setup](./basic-store-setup.md)
- **[Store Manager API](../store/useStoreManager-api.md)** → Uses [Basic Store Setup](./basic-store-setup.md)

### Architecture Patterns
- **[MVVM Architecture](../architecture/mvvm.md)** → Uses [Multi-Context Setup](./multi-context-setup.md#mvvm-architecture-setup)
- **[Domain Context Architecture](../architecture/domain-context.md)** → Uses [Multi-Context Setup](./multi-context-setup.md#domain-context-architecture-setup)
- **[Context Splitting Patterns](../architecture/context-splitting.md)** → Uses [Multi-Context Setup](./multi-context-setup.md)

### Ref Patterns
- **[Ref Basic Usage](../ref/basic-usage.md)** → Uses [RefContext Setup](./ref-context-setup.md)
- **[Canvas Optimization](../ref/canvas-optimization.md)** → Uses [RefContext Setup](./ref-context-setup.md)
- **[Memory Optimization](../ref/memory-optimization.md)** → Uses [RefContext Setup](./ref-context-setup.md)

### Performance Patterns
- **[Optimization Techniques](../performance/optimization-techniques.md)** → Uses all setup guides

### Provider Management
- **[withProvider Pattern](../store/withProvider-pattern.md)** → Uses [Provider Composition Setup](./provider-composition-setup.md)

## Related Guides

- **[Pattern Selection Guide](../index.md)** - Choose the right patterns for your use case
- **[Best Practices](../../conventions.md)** - General framework best practices
- **[Architecture Guide](../../concept/architecture-guide.md)** - Overall architecture concepts