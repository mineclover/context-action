# Architecture Patterns

System architecture and design patterns for organizing complex Context-Action applications.

## Overview

Architecture patterns provide structural guidance for organizing Context-Action patterns into scalable, maintainable applications.

### Available Architecture Patterns
- **[MVVM](./mvvm.md)** - Model-View-ViewModel architecture with layer separation
- **[Domain Context](./domain-context.md)** - Document-centric domain separation for multi-domain apps
- **[Composition](./composition.md)** - Pattern composition strategies for complex applications

## Quick Reference

| Pattern | Purpose | Best For |
|---------|---------|----------|
| **MVVM** | Architectural layers | Single-domain apps, clear layer separation |
| **Domain Context** | Business domain separation | Multi-domain apps, large teams, microservices |
| **Composition** | Pattern integration | Complex apps requiring multiple patterns |

## When to Use Architecture Patterns

- **Large Applications**: Applications with multiple domains or complex business logic
- **Team Collaboration**: Different teams working on different domains
- **Scalability Requirements**: Applications that need to scale in size and complexity
- **Clear Separation**: When you need well-defined boundaries between concerns
- **Documentation Alignment**: When your documentation structure needs to match your code structure

## Architecture Decision Framework

### Single Domain Applications
**Recommended**: [MVVM Architecture](./mvvm.md)
- Clear layer separation (Model → ViewModel → Performance → View)
- Perfect for applications with one primary business domain
- Optimal for teams focusing on architectural clarity

### Multi-Domain Applications  
**Recommended**: [Domain Context Architecture](./domain-context.md)
- Document-centric context separation
- Perfect for applications with multiple business domains
- Optimal for larger teams with domain ownership

### Hybrid Applications
**Recommended**: [Composition Patterns](./composition.md)
- Combine MVVM layers within each business domain
- Use Domain Context for business separation
- Apply composition strategies for pattern integration

## Key Benefits

- **🏗️ Structural Clarity**: Clear organization and boundaries
- **📚 Documentation Alignment**: Code structure matches documentation structure
- **👥 Team Collaboration**: Well-defined ownership boundaries
- **🔧 Maintainability**: Easier to modify and extend over time
- **⚡ Performance**: Architecture patterns support optimal performance characteristics
- **🔒 Type Safety**: Full TypeScript support with clear interfaces

## Integration

Architecture patterns work seamlessly with:
- **[Store Patterns](../store/)** for state management
- **[Action Patterns](../action/)** for business logic
- **[Ref Patterns](../ref/)** for performance optimization
- **[Async Patterns](../async/)** for safe async operations