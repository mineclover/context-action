# Troubleshooting Guide

Comprehensive troubleshooting resources for the Context-Action framework.

## 🚨 Critical Issues

### [Infinite Loop Issues](./infinite-loop-issues.md) 🆕
- ActionLogger + onDataChanged infinite loops
- Toast system infinite loops
- Action handler re-registration loops
- Timer cascade loops
- Store update loops

### [Performance Issues](./performance-issues.md)
- Memory management and optimization
- Excessive re-renders prevention
- Bundle size optimization
- Selective subscription patterns

### [Action System Issues](./action-issues.md)  
- Handler state access problems
- Stale closures in handlers
- Action registration patterns

### [Store & State Issues](./store-issues.md)
- Memory leak prevention
- Event object storage
- Circular reference detection
- Store comparison strategies

### [Ref System Issues](./ref-issues.md)
- Unresolved refs
- Mount timeout problems
- RefContext debugging

## 🔧 Quick Fixes

### Most Common Issues

#### App Freezing After Consecutive Actions
**Symptoms**: App becomes unresponsive after 4-5 rapid actions, continuous HMR updates
**Quick Fix**: Check [infinite-loop-issues.md](./infinite-loop-issues.md) for all infinite loop patterns

#### Circular Logging Dependencies 🆕
**Symptoms**: Infinite loop when using `actionLogger` in data change handlers
**Quick Fix**: See [ActionLogger + onDataChanged section](./infinite-loop-issues.md#actionlogger--ondatachanged-infinite-loops) for detailed solution

#### Handlers Using Stale State
**Symptoms**: Action handlers using outdated component state
**Quick Fix**: Use `store.getValue()` instead of component scope variables

#### Memory Leaks in Development
**Symptoms**: Browser memory usage continuously increasing
**Quick Fix**: Check timer cleanup and event object storage prevention

## 🛠️ Debugging Tools

### Built-in Diagnostics
- `getErrorStatistics()` - Comprehensive error information
- Store debug mode - Real-time store operation monitoring
- EventBus debugging - Event flow and handler tracking

### Development Guidelines
1. Always use `useCallback` for action handlers
2. Never store event objects in stores
3. Access fresh state with `store.getValue()` in handlers
4. Clean up resources in useEffect cleanup functions
5. **Prevent infinite loops** - see [infinite-loop-issues.md](./infinite-loop-issues.md) for complete patterns
6. Use direct LogMonitor integration over generic `onDataChanged` patterns

## 📞 Getting Help

For issues not covered in these guides:

1. **Check Error System**: Review `getErrorStatistics()` for detailed context
2. **Enable Debug Mode**: Set stores to `immediate` notification mode
3. **Create Minimal Reproduction**: Isolate the problem in a simple example
4. **Review Recent Changes**: Check if issues started after updates

---

*Last updated: August 30, 2025*