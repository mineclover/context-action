---
document_id: concept--conventions
category: concept
source_path: en/concept/conventions.md
character_limit: 5000
last_update: '2025-08-21T02:13:42.348Z'
update_status: auto_generated
priority_score: 85
priority_tier: medium
completion_status: completed
workflow_stage: content_generated
---
Context-Action Framework Conventions

This document defines coding conventions and best practices when using the Context-Action framework with its three core patterns: Actions, Stores, and RefContext. 📋 Table of Contents

1. Naming Conventions
2. File Structure
3. Pattern Usage
4. Type Definitions
5. Code Style
6. Performance Guidelines
7. Error Handling
8. RefContext Conventions

---

Naming Conventions

🏷️ Renaming Pattern

The core convention of the Context-Action framework is domain-based renaming pattern for all three patterns. ✅ Store Pattern Renaming

✅ Action Pattern Renaming

✅ RefContext Pattern Renaming

🎯 Context Naming Rules

Domain-Based Naming

Action vs Store vs RefContext Distinction

🔤 Hook Naming Patterns

Store Hook Naming

Action Hook Naming

RefContext Hook Naming

---

File Structure

📁 Recommended Directory Structure

📄 File Naming Conventions

Context File Names

Provider File Names

---

Pattern Usage

🎯 Pattern Selection Guide

Store Only Pattern

Action Only Pattern

RefContext Only Pattern

Pattern Composition

🔄 Provider Composition Patterns

HOC Pattern (Recommended)

Manual Provider Composition

---

Type Definitions

🏷️ Interface Naming

Action Payload Map

Store Data Interface

RefContext Type Interface

🎯 Generic Type Usage

---

Code Style

✨ Component Patterns

Store Usage Pattern

Action Handler Pattern

RefContext Usage Pattern

🎨 Import Organization

---

Performance Guidelines

⚡ Store Optimization

Comparison Strategy Selection

Memoization Patterns

🔄 Action Optimization

Debounce/Throttle Configuration

⚡ RefContext Performance Optimization

Zero Re-render DOM Manipulation

Animation Performance

---

RefContext Conventions

🔧 RefContext-Specific Guidelines

Ref Type Definitions

Performance-Critical Patterns

RefContext Error Handling

---

Error Handling

🚨 Error Boundary Pattern

🛡️ Action Error Handling

🛡️ RefContext Error Handling

---

📚 Additional Resources

Related Documentation
- Pattern Guide - Detailed pattern usage guide
- Full Architecture Guide - Complete architecture guide
- Hooks Reference - Hooks reference documentation
- API Reference - API documentation

Example Projects
- Basic Example - Basic usage examples
- Advanced Patterns - Advanced pattern examples

Migration Guide
- Legacy Pattern Migration - Migration from legacy patterns

---

❓ FAQ

Q: When should I use Store Only vs Action Only vs RefContext vs Composition. - Store Only: Pure state management (forms, settings, cache)
- Action Only: Pure event handling (logging, tracking, notifications)
- RefContext Only: High-performance DOM manipulation (animations, real-time interactions)
- Composition: Complex business logic requiring multiple patterns (user management, interactive shopping cart)

Q: Is the renaming pattern mandatory. Yes, the renaming pattern is a core convention of the Context-Action framework. It significantly improves type safety and developer experience. Q: How should I approach performance optimization. 1. Choose appropriate comparison strategy for stores
2. Memoize handlers with useCallback
3. Use reference strategy for large data
4. Apply debounce/throttle when needed
5. Use RefContext for performance-critical DOM operations

Q: How should I handle errors. 1. Use Pipeline Controller's abort() method for actions
2. Set up domain-specific Error Boundaries
3. Handle different error types appropriately
4. Provide user-friendly error messages
5. Always check ref.target existence before DOM manipulation

Q: Should I use explicit generics or type inference. - Type inference (recommended): For most cases, code is concise and type safety is guaranteed
- Explicit generics: For complex type structures or strict type constraints

Q: When should I use comparisonOptions. 1. ignoreKeys: When you want to ignore specific field changes like timestamps
2. customComparator: When special comparison logic is needed for business requirements
3. maxDepth: To limit deep comparison depth for performance optimization
4. enableCircularCheck: When dealing with objects that might have circular references

Q: How should I write type tests. 1. Test both explicit generics and type inference
2. Verify type safety at compile time
3. Document error cases with comments
4. Write test components that reflect actual usage patterns
5. Include RefContext type validation in component tests

Q: When should I use RefContext over regular state. - Use RefContext when: Direct DOM manipulation needed, 60fps performance required, zero re-renders critical
- Use regular state when: Data needs to be displayed in UI, component re-rendering is acceptable
- Combine both when: Performance-critical operations alongside data display (e.g., real-time charts)

Q: How do I ensure RefContext safety. 1. Always check ref.target existence before DOM operations


2. Use useWaitForRefs for operations requiring multiple refs


3. Implement proper cleanup for animations and event listeners


4.
