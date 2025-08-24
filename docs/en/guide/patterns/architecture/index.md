# Architecture Patterns

System architecture and design patterns for building scalable applications with the Context-Action framework.

## Available Architecture Patterns

### MVVM Architecture
- **[MVVM Pattern](./mvvm.md)** - Model-View-ViewModel architecture with perfect layer separation
  - Model Layer: Type-safe state management with Store Only Pattern
  - ViewModel Layer: Business logic with Action Only Pattern  
  - Performance Layer: Direct DOM manipulation with RefContext Pattern
  - View Layer: Pure React components for presentation

### Domain Context Architecture  
- **[Domain Context Pattern](./domain-context.md)** - Document-centric domain separation for multi-domain apps
  - Business Context: Core business logic and domain rules
  - UI Context: Screen state and user interactions
  - Validation Context: Data validation and error handling
  - Design Context: Theme management and visual states
  - Architecture Context: System configuration and technical decisions

### Pattern Composition
- **[Composition Strategies](./composition.md)** - Advanced pattern composition for complex applications
  - Single Domain Composition: Action + Store + Ref patterns
  - Multi-Domain Composition: Domain contexts with pattern layers
  - Enterprise Scale: Combined architecture approaches

### Context Management
- **[Context Splitting Patterns](./context-splitting.md)** - Strategies for managing and splitting large contexts
  - Domain-based, layer-based, and feature-based splitting strategies
  - Gradual migration patterns and cross-context communication
  - Performance optimization and best practices for context management

## Architecture Decision Guide

### When to Use MVVM Architecture
- ✅ Complex single-domain applications
- ✅ Clear architectural layer separation needed
- ✅ Team specialization by technical layers (frontend, backend, performance)
- ✅ Applications with complex business logic

### When to Use Domain Context Architecture  
- ✅ Multi-domain business applications
- ✅ Team boundaries aligned with business domains
- ✅ Microservice architecture alignment
- ✅ Document-centric workflow management

### When to Use Combined Approach
- ✅ Enterprise-scale applications
- ✅ Multiple business domains with complex technical requirements
- ✅ Large teams with both domain and technical specialization
- ✅ Applications requiring both business and technical separation

## Quick Comparison

| Architecture | Structure | Best For | Team Organization |
|--------------|-----------|----------|-------------------|
| **MVVM** | Technical Layers | Single domain apps | Technical specialization |
| **Domain Context** | Business Domains | Multi-domain apps | Domain specialization |  
| **Combined** | Domains + Layers | Enterprise apps | Hybrid specialization |

## Getting Started

1. **Assess Your Application**
   - Single domain → Start with MVVM
   - Multiple domains → Consider Domain Context
   - Enterprise scale → Plan Combined approach

2. **Consider Your Team**
   - Technical specialists → MVVM works well
   - Domain experts → Domain Context aligns better
   - Large mixed team → Combined approach provides flexibility

3. **Plan for Growth**
   - Start simple and evolve architecture as needs grow
   - All patterns are composable and can be refactored
   - Document architectural decisions for team alignment