---
document_id: en_troubleshooting_performance-issues
category: troubleshooting
source_path: en/troubleshooting/performance-issues.md
character_limit: 5000
last_update: '2025-08-30T10:42:13.661Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Performance Issues

Performance Issues Performance optimization and troubleshooting for the Context-Action framework. 🚨 Important Note For infinite loop issues, see the dedicated guide: → Infinite Loop Issues - Comprehensive coverage of all infinite loop patterns and solutions ⚡ Performance Optimization Memory Management Event Object Storage Prevention Issue: DOM event objects being stored in stores causing memory leaks. Solution: The framework automatically detects and prevents storing event objects: EventBus Memory Optimization Issue: Large objects (DOM elements, React components) stored in event history causing memory leaks. Solution: EventBus automatically stores only essential metadata for memory-heavy objects: Excessive Re-renders Issue: Components re-rendering too frequently. Diagnostics: Solutions: 1. Check store comparison strategy: 2. Optimize selectors: Selective Subscription Patterns High-Frequency Update Performance Issues The Problem: - Components subscribing to stores with high-frequency updates - UI becomes unresponsive during rapid state changes - Performance degradation with large component trees Solution: Use selective subscription with debouncing: Rate Limiting and Toast Management Toast Spam Prevention Issue: Rapid consecutive actions creating too many toasts. Configuration: Rate limiting is disabled by default to avoid blocking legitimate user interactions: Prevention Strategy: Instead of aggressive rate limiting, use action filtering: 🔍 Monitoring & Debugging Performance Monitoring Monitor store operations and subscription patterns: Toast System Debugging Timer Leak Detection 🛡️ Prevention Strategies Development Guidelines 1. Timer Management: Always pair timer creation with cleanup 2. Action Filtering: Exclude internal/removal actions from tracking 3. Direct Store Access: Use store operations for internal state management 4. Rate Limiting: Enable only when needed, not by default 5. Handler Stability: Use ref patterns for stable handler references 6. Memory Management: Never store event objects or large DOM elements 7. Selective Subscriptions: Subscribe only to data you actually need Code Review Checklist - [ ] All setTimeout calls have corresponding cleanup - [ ] Action handlers use fresh state from stores - [ ] Internal actions excluded from tracking systems - [ ] Handler registration happens only once - [ ] Event objects not stored in stores - [ ] Store subscriptions use appropriate comparison strategies - [ ] High-frequency updates use debouncing or selective subscriptions Testing Strategies - Stress Testing: Rapid consecutive actions (10+ in 1 second) - Memory Monitoring: Watch for memory growth over time - Timer Auditing: Check for timer accumulation - HMR Stability: Ensure no continuous updates in development - Subscription E

Key points:
• Components subscribing to stores with high-frequency updates
• UI becomes unresponsive during rapid state changes
• Performance degradation with large component trees
• [ ] All `setTimeout` calls have corresponding cleanup
• [ ] Action handlers use fresh state from stores
• [ ] Internal actions excluded from tracking systems
• [ ] Handler registration happens only once
• [ ] Event objects not stored in stores
• [ ] Store subscriptions use appropriate comparison strategies
• [ ] High-frequency updates use debouncing or selective subscriptions
• **Stress Testing**: Rapid consecutive actions (10+ in 1 second)
• **Memory Monitoring**: Watch for memory growth over time
• **Timer Auditing**: Check for timer accumulation
• **HMR Stability**: Ensure no continuous updates in development
• **Subscription Efficiency**: Monitor component re-render frequency
• **Store Performance**: Test with realistic data sizes
• [Infinite Loop Issues](./infinite-loop-issues.md) - Dedicated infinite loop troubleshooting
• [Action System Issues](./action-issues.md) - Action handler best practices
• [Store Issues](./store-issues.md) - Store subscription patterns
• [Ref Issues](./ref-issues.md) - Ref system optimization
• Check store comparison strategy:
• Optimize selectors:
• **Timer Management**: Always pair timer creation with cleanup
• **Action Filtering**: Exclude internal/removal actions from tracking
• **Direct Store Access**: Use store operations for internal state management
• **Rate Limiting**: Enable only when needed, not by default
• **Handler Stability**: Use ref patterns for stable handler references
• **Memory Management**: Never store event objects or large DOM elements
• **Selective Subscriptions**: Subscribe only to data you actually need
• **Timer Cleanup**: Always clean up timers
• **Action...