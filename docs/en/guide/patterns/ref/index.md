# Ref Patterns

Direct DOM manipulation patterns with zero React re-renders for high-performance UI.

## Overview

Ref patterns provide hardware-accelerated DOM manipulation without triggering React re-renders, perfect for animations and real-time interactions.

### Available Ref Patterns
- **[Basic Usage](./basic-usage.md)** - Fundamental RefContext pattern with type-safe ref management
- **[Context Singleton Handling](./singleton-handling.md)** - Managing context singletons and external resources with lazy evaluation
- **[Multi-Context](./multi-context.md)** - Multiple RefContext composition for complex applications
- **[Performance](./performance.md)** - Comprehensive performance optimization overview

### Performance Optimization Guides
- **[Canvas Optimization](./canvas-optimization.md)** - Real-world Canvas performance case study
- **[Hardware Acceleration](./hardware-acceleration.md)** - GPU-accelerated DOM manipulation
- **[Memory Optimization](./memory-optimization.md)** - Memory-efficient patterns and leak prevention

## Quick Reference

| Pattern | Purpose | Best For |
|---------|---------|----------|
| **Basic Usage** | Type-safe ref management | Mouse tracking, simple animations |
| **Context Singleton Handling** | Context-scoped resource management | User databases, context-specific services, testing mocks |
| **Multi-Context** | Multiple ref domains | Complex UI, separation of concerns |
| **Performance** | Overview & best practices | Understanding performance concepts |
| **Canvas Optimization** | Canvas interaction performance | Drawing apps, real-time graphics |
| **Hardware Acceleration** | GPU-accelerated operations | Smooth animations, high-frequency updates |
| **Memory Optimization** | Memory-efficient patterns | Large apps, leak prevention |

## When to Use Ref Patterns

- **High-Performance UI**: 60fps animations, real-time interactions
- **Direct DOM Manipulation**: Bypass React rendering for performance
- **Hardware Acceleration**: GPU-accelerated transforms and animations
- **Real-time Interactions**: Mouse tracking, gesture recognition
- **Canvas/SVG Operations**: Direct manipulation of graphics elements
- **Context Singleton Management**: Context-scoped services, user-specific connections, testing isolation

## Key Features

- ✅ Zero React re-renders for DOM manipulation
- ✅ Hardware-accelerated transforms
- ✅ Type-safe ref management
- ✅ Automatic lifecycle management
- ✅ Perfect separation of concerns
- ✅ Memory efficient with automatic cleanup

## Performance Comparison

| Approach | React Re-renders | Performance | Memory | Complexity |
|----------|------------------|-------------|---------|------------|
| **useState** | Every update | ~30fps | High GC | Simple |
| **useRef** | Manual checks | ~45fps | Medium | Medium |
| **RefContext** | Zero | 60fps+ | Low | Optimized |

## Integration

Ref patterns work best when combined with:
- **[Store Patterns](../store/)** for state management
- **[Action Patterns](../action/)** for business logic
- **[Async Patterns](../async/)** for safe async operations