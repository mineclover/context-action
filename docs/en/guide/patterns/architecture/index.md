# Architecture Patterns

Comprehensive architecture and design patterns for building scalable applications with the Context-Action framework, centered on **Setup-First Architecture** that prioritizes proper configuration and initialization.

## Prerequisites

Before implementing any architecture pattern, ensure proper setup configuration:

- **[Multi-Context Setup Guide](../setup/multi-context-setup.md)** - Complete setup patterns for complex architectures including MVVM, Domain Context, and Enterprise configurations
- **[Basic Action Setup](../setup/basic-action-setup.md)** - Foundation action context setup for all patterns
- **[Basic Store Setup](../setup/basic-store-setup.md)** - Foundation store context setup for all patterns
- **[Provider Composition Setup](../setup/provider-composition-setup.md)** - Advanced provider organization patterns

## Available Architecture Patterns

### MVVM Architecture
- **[MVVM Pattern](./mvvm.md)** - Model-View-ViewModel architecture with perfect layer separation
  - **Setup Guide**: [MVVM Architecture Setup](../setup/multi-context-setup.md#mvvm-architecture-setup)
  - Model Layer: Type-safe state management with Store Only Pattern
  - ViewModel Layer: Business logic with Action Only Pattern  
  - Performance Layer: Direct DOM manipulation with RefContext Pattern
  - View Layer: Pure React components for presentation

### Domain Context Architecture  
- **[Domain Context Pattern](./domain-context.md)** - Document-centric domain separation for multi-domain apps
  - **Setup Guide**: [Domain Context Architecture Setup](../setup/multi-context-setup.md#domain-context-architecture-setup)
  - Business Context: Core business logic and domain rules
  - UI Context: Screen state and user interactions
  - Validation Context: Data validation and error handling
  - Design Context: Theme management and visual states
  - Architecture Context: System configuration and technical decisions

### Pattern Composition
- **[Composition Strategies](./composition.md)** - Advanced pattern composition for complex applications
  - **Setup Guide**: [Provider Composition Patterns](../setup/multi-context-setup.md#provider-composition-patterns)
  - Single Domain Composition: Action + Store + Ref patterns
  - Multi-Domain Composition: Domain contexts with pattern layers
  - Enterprise Scale: Combined architecture approaches

### Context Management
- **[Context Splitting Patterns](./context-splitting.md)** - Strategies for managing and splitting large contexts
  - **Setup Guide**: [Cross-Context Communication Setup](../setup/multi-context-setup.md#cross-context-communication-setup)
  - Domain-based, layer-based, and feature-based splitting strategies
  - Gradual migration patterns and cross-context communication
  - Performance optimization and best practices for context management

## Architecture Decision Matrix

### Setup-Based Decision Framework

Choose architecture based on **Setup Complexity** and **Application Scale**:

| Setup Requirements | Single Domain | Multi-Domain | Enterprise Scale |
|-------------------|---------------|--------------|------------------|
| **Basic Setup** | [Action](../setup/basic-action-setup.md) or [Store](../setup/basic-store-setup.md) Only | Not Recommended | Not Recommended |
| **Multi-Context Setup** | [MVVM Architecture Setup](../setup/multi-context-setup.md#mvvm-architecture-setup) | [Domain Context Setup](../setup/multi-context-setup.md#domain-context-architecture-setup) | [Enterprise Setup](../setup/multi-context-setup.md#conditional-multi-context-setup) |
| **Advanced Setup** | [Nested MVVM](../setup/multi-context-setup.md#nested-domain-composition) | [Event Bus Integration](../setup/multi-context-setup.md#event-bus-pattern) | [Context Bridge](../setup/multi-context-setup.md#context-bridge-setup) |

### When to Use MVVM Architecture
- ✅ Complex single-domain applications requiring clear layer separation
- ✅ Team specialization by technical layers (Model, ViewModel, View)
- ✅ Applications with complex business logic requiring structured approach
- ✅ Performance-critical applications needing RefContext optimization
- **Setup Required**: [MVVM Architecture Setup](../setup/multi-context-setup.md#mvvm-architecture-setup)

### When to Use Domain Context Architecture  
- ✅ Multi-domain business applications with distinct business areas
- ✅ Team boundaries aligned with business domains (User, Product, Order domains)
- ✅ Microservice architecture alignment requiring domain separation
- ✅ Document-centric workflow management with domain-specific contexts
- **Setup Required**: [Domain Context Architecture Setup](../setup/multi-context-setup.md#domain-context-architecture-setup)

### When to Use Combined Approach
- ✅ Enterprise-scale applications requiring both domain and technical separation
- ✅ Multiple business domains with complex technical requirements
- ✅ Large teams with both domain and technical specialization
- ✅ Applications requiring graduated complexity and incremental architecture evolution
- **Setup Required**: [Enterprise Multi-Context Setup](../setup/multi-context-setup.md#conditional-multi-context-setup)

## Setup-First Quick Start Guide

### 1. Complete Setup Configuration
**Before implementing patterns**, establish proper setup:

```typescript
// Choose your primary setup approach
import { 
  // For MVVM: Layer-based setup
  createDeclarativeStorePattern,    // Model layer
  createActionContext,              // ViewModel layer
  createRefContext,                 // Performance layer

  // For Domain Context: Domain-based setup
  composeProviders,                 // Provider composition
  
  // For Enterprise: Advanced setup
  // See Multi-Context Setup Guide
} from '@context-action/react';
```

### 2. Architecture Implementation Path

#### Path A: MVVM Architecture (Technical Layer Separation)
1. **Setup**: Follow [MVVM Architecture Setup](../setup/multi-context-setup.md#mvvm-architecture-setup)
2. **Implementation**: Apply [MVVM Pattern](./mvvm.md) guidelines
3. **Optimization**: Use [Context Splitting](./context-splitting.md) for performance
4. **Advanced**: Implement [Composition Strategies](./composition.md) for complex scenarios

#### Path B: Domain Context Architecture (Business Domain Separation)
1. **Setup**: Follow [Domain Context Architecture Setup](../setup/multi-context-setup.md#domain-context-architecture-setup)
2. **Implementation**: Apply [Domain Context Pattern](./domain-context.md) guidelines
3. **Communication**: Implement [Cross-Context Communication](../setup/multi-context-setup.md#cross-context-communication-setup)
4. **Scaling**: Use [Enterprise Setup Patterns](../setup/multi-context-setup.md#conditional-multi-context-setup)

#### Path C: Combined Enterprise Architecture
1. **Setup**: Follow [Enterprise Multi-Context Setup](../setup/multi-context-setup.md#conditional-multi-context-setup)
2. **Foundation**: Establish [Context Bridge](../setup/multi-context-setup.md#context-bridge-setup) patterns
3. **Implementation**: Combine both MVVM and Domain patterns as needed
4. **Management**: Use [Nested Domain Composition](../setup/multi-context-setup.md#nested-domain-composition)

### 3. Setup Validation Checklist

✅ **Prerequisites Met**: All required setup guides have been followed  
✅ **Type Safety**: All contexts have proper TypeScript configurations  
✅ **Provider Composition**: Providers are organized using `composeProviders`  
✅ **Performance Optimization**: RefContext is configured for performance-critical paths  
✅ **Cross-Context Communication**: Event bus or context bridge is configured if needed  
✅ **Export Strategy**: Proper barrel exports and domain bundles are established  

## Quick Architecture Comparison

| Architecture | Setup Complexity | Best For | Setup Guide |
|--------------|------------------|----------|-------------|
| **MVVM** | Moderate | Single domain, technical teams | [MVVM Setup](../setup/multi-context-setup.md#mvvm-architecture-setup) |
| **Domain Context** | Moderate to High | Multi-domain, business teams | [Domain Setup](../setup/multi-context-setup.md#domain-context-architecture-setup) |  
| **Combined Enterprise** | High | Large scale, complex requirements | [Enterprise Setup](../setup/multi-context-setup.md#conditional-multi-context-setup) |

## Integration with Framework Patterns

All architecture patterns integrate seamlessly with the Context-Action framework's core patterns:

### Action Integration
- **Action Patterns**: Reference [Action Pattern Documentation](../action/index.md)
- **Setup Foundation**: Use [Basic Action Setup](../setup/basic-action-setup.md) as foundation

### Store Integration  
- **Store Patterns**: Reference [Store Pattern Documentation](../store/index.md)
- **Setup Foundation**: Use [Basic Store Setup](../setup/basic-store-setup.md) as foundation

### Ref Integration
- **Ref Patterns**: Reference [Ref Pattern Documentation](../ref/index.md)
- **Setup Foundation**: Use [Ref Context Setup](../setup/ref-context-setup.md) for performance optimization