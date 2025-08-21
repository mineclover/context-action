# Ref Patterns

Direct DOM manipulation patterns with zero React re-renders for high-performance UI.

## Overview

Ref patterns provide hardware-accelerated DOM manipulation without triggering React re-renders, perfect for animations and real-time interactions.

### Available Ref Patterns
- **[Basic Usage](./basic-usage.md)** - Fundamental RefContext pattern with type-safe ref management
- **[Multi-Context](./multi-context.md)** - Multiple RefContext composition for complex applications
- **[Performance](./performance.md)** - Hardware acceleration and performance optimization techniques

## Quick Reference

| Pattern | Purpose | Best For |
|---------|---------|----------|
| **Basic Usage** | Type-safe ref management | Mouse tracking, simple animations |
| **Multi-Context** | Multiple ref domains | Complex UI, separation of concerns |
| **Performance** | Hardware acceleration | 60fps animations, real-time interactions |

## When to Use Ref Patterns

- **High-Performance UI**: 60fps animations, real-time interactions
- **Direct DOM Manipulation**: Bypass React rendering for performance
- **Hardware Acceleration**: GPU-accelerated transforms and animations
- **Real-time Interactions**: Mouse tracking, gesture recognition
- **Canvas/SVG Operations**: Direct manipulation of graphics elements

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