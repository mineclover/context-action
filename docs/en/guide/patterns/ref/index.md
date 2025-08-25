# Ref Patterns

Direct DOM manipulation patterns with zero React re-renders for high-performance UI.

## Overview

Ref patterns provide hardware-accelerated DOM manipulation without triggering React re-renders, perfect for animations, real-time interactions, and singleton object management.

**🚀 Quick Start**: Begin with **[RefContext Setup](../setup/ref-context-setup.md)** for complete setup patterns and type definitions.

### Prerequisites

**Essential Setup Guide**: **[RefContext Setup](../setup/ref-context-setup.md)** provides:
- **Type Definitions**: DOM elements, services, workers, and WASM modules
- **Context Creation**: Basic and advanced RefContext patterns
- **Provider Setup**: Single, multiple, and conditional provider patterns
- **Initialization**: Lazy loading and service initialization strategies

### Available Ref Patterns

All patterns use types and setups from **[RefContext Setup](../setup/ref-context-setup.md)**:

- **[Basic Usage](./basic-usage.md)** - Fundamental RefContext pattern with **UIRefs** setup
- **[Context Singleton Handling](./singleton-handling.md)** - **ServiceRefs** and **DatabaseRefs** management
- **[Multi-Context](./multi-context.md)** - **Multi-Domain RefContext** composition patterns
- **[Performance](./performance.md)** - **WorkerRefs** and **WASMRefs** optimization overview

### Performance Optimization Guides

Advanced patterns building on **[RefContext Setup](../setup/ref-context-setup.md)**:

- **[Canvas Optimization](./canvas-optimization.md)** - **CanvasRefs** performance with **WorkerRefs** integration
- **[Hardware Acceleration](./hardware-acceleration.md)** - GPU-accelerated **DOM Element Refs**
- **[Memory Optimization](./memory-optimization.md)** - **Service and Library Refs** cleanup patterns

## Setup-Based Quick Reference

| Pattern | Setup Types Used | Provider Pattern | Best For |
|---------|------------------|-----------------|----------|
| **[Basic Usage](./basic-usage.md)** | `UIRefs`, `FormRefs` | [Single RefContext Provider](../setup/ref-context-setup.md#single-refcontext-provider) | Mouse tracking, simple animations |
| **[Context Singleton Handling](./singleton-handling.md)** | `ServiceRefs`, `DatabaseRefs`, `AnalyticsRefs` | [Service Initialization](../setup/ref-context-setup.md#service-initialization) | User databases, external services, testing mocks |
| **[Multi-Context](./multi-context.md)** | `PerformanceRefs`, `MediaRefs`, `ExternalRefs` | [Multi-Domain RefContext Setup](../setup/ref-context-setup.md#multi-domain-refcontext-setup) | Complex UI, separation of concerns |
| **[Canvas Optimization](./canvas-optimization.md)** | `CanvasRefs`, `WorkerRefs` | [Worker Initialization](../setup/ref-context-setup.md#worker-initialization) | Drawing apps, real-time graphics |
| **[Hardware Acceleration](./hardware-acceleration.md)** | `UIRefs`, `MediaRefs` | [DOM Element Refs](../setup/ref-context-setup.md#dom-element-refs) | Smooth animations, high-frequency updates |
| **[Memory Optimization](./memory-optimization.md)** | `ServiceRefs`, `WASMRefs` | [Lazy Initialization](../setup/ref-context-setup.md#lazy-initialization) | Large apps, leak prevention |

## When to Use Ref Patterns

Ref patterns are ideal for scenarios defined in **[RefContext Setup](../setup/ref-context-setup.md)**:

- **High-Performance UI**: 60fps animations using **[DOM Element Refs](../setup/ref-context-setup.md#dom-element-refs)**
- **Direct DOM Manipulation**: **CanvasRefs**, **MediaRefs** bypass React rendering
- **Hardware Acceleration**: GPU-accelerated transforms with **UIRefs** patterns
- **Real-time Interactions**: Mouse tracking, gesture recognition via **FormRefs**
- **Canvas/SVG Operations**: Direct manipulation using **[Canvas and Graphics Refs](../setup/ref-context-setup.md#dom-element-refs)**
- **Context Singleton Management**: **[Service and Library Refs](../setup/ref-context-setup.md#service-and-library-refs)** for user-specific connections, testing isolation
- **Heavy Computation**: **[Web Workers](../setup/ref-context-setup.md#heavy-computation-refs)** and **WebAssembly** integration

## Key Features

RefContext provides all features through **[RefContext Setup](../setup/ref-context-setup.md)** patterns:

- ✅ **Zero React re-renders** for DOM manipulation via direct ref access
- ✅ **Hardware-accelerated transforms** using GPU-optimized **DOM Element Refs**
- ✅ **Type-safe ref management** with comprehensive type definitions
- ✅ **Automatic lifecycle management** through **[Provider Setup Patterns](../setup/ref-context-setup.md#provider-setup-patterns)**
- ✅ **Perfect separation of concerns** via **[Multi-Domain RefContext](../setup/ref-context-setup.md#multi-domain-refcontext-setup)**
- ✅ **Memory efficient** with **[Lazy Initialization](../setup/ref-context-setup.md#lazy-initialization)** and automatic cleanup

## Performance Comparison

| Approach | React Re-renders | Performance | Memory | Setup Complexity |
|----------|------------------|-------------|---------|------------------|
| **useState** | Every update | ~30fps | High GC | Simple |
| **useRef** | Manual checks | ~45fps | Medium | Medium |
| **RefContext** | Zero | 60fps+ | Low | **[Setup Guide](../setup/ref-context-setup.md)** |

## Integration with Other Patterns

Ref patterns integrate seamlessly using **[RefContext Setup](../setup/ref-context-setup.md)** provider composition:

- **[Store Patterns](../store/)** for state management via **[Integrated MVVM Setup](../setup/ref-context-setup.md#integrated-with-store-and-action-contexts)**
- **[Action Patterns](../action/)** for business logic through **[Provider Composition](../setup/ref-context-setup.md#multiple-refcontext-providers)**
- **[Async Patterns](../async/)** for safe async operations with **[Service Initialization](../setup/ref-context-setup.md#service-initialization)**

## Setup Integration Examples

All integration patterns are detailed in **[RefContext Setup](../setup/ref-context-setup.md)**:

- **[Single Provider Setup](../setup/ref-context-setup.md#single-refcontext-provider)** - Basic integration
- **[Multiple Providers](../setup/ref-context-setup.md#multiple-refcontext-providers)** - Complex applications
- **[Conditional Setup](../setup/ref-context-setup.md#conditional-refcontext-setup)** - Feature-based loading
- **[MVVM Integration](../setup/ref-context-setup.md#integrated-with-store-and-action-contexts)** - Full architecture