---
document_id: en_guide_immer-integration
category: guide
source_path: en/guide/patterns/store/immer-integration.md
character_limit: 2000
last_update: '2025-08-30T10:41:58.502Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Immer Integration Guide

Immer Integration Guide Enhanced immutability system using Immer for superior performance and developer experience. 🎯 Overview Context-Action v0.4.1+ replaces the complex internal immutability system with Immer for enhanced performance, better debugging experience, and more reliable state management. 🚀 Key Benefits - 🔥 Performance: Structural sharing for large objects - 🐛 Debugging: Better error messages and stack traces   - 📝 Syntax: Natural mutable syntax that produces immutable results - 🎯 Precision: Only changed parts are cloned - 🧠 Memory: Automatic memory optimization 🔧 Core Functions deepCloneWithImmer Advanced deep cloning using Immer's structural sharing: produceWithImmer Produce new state with natural mutable syntax: 🏪 Store Integration Patterns Direct Store Integration Store Update Helper ⚡ Performance Optimization Conditional Immer Usage Batch Operations with Immer 🔍 Debugging with Immer Development Debugging Performance Monitoring 🛡️ Error Handling Immer Error 

Key points:
• **🔥 Performance**: Structural sharing for large objects
• **🐛 Debugging**: Better error messages and stack traces
• **📝 Syntax**: Natural mutable syntax that produces immutable results
• **🎯 Precision**: Only changed parts are cloned
• **🧠 Memory**: Automatic memory optimization
• **Complex Objects Only**: Use Immer for nested objects and arrays
• **Primitive Bypass**: Direct assignment for primitives and simple objects
• **Batch Operations**: Combine multiple updates in single Immer call
• **Error Handling**: Always wrap Immer operations in try-catch
• **Performance Monitoring**: Monitor operation duration...