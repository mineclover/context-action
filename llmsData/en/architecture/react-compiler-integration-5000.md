---
document_id: en_architecture_react-compiler-integration
category: architecture
source_path: en/architecture/react-compiler-integration.md
character_limit: 5000
last_update: '2025-10-15T12:30:16.208Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
React Compiler Integration Guide

React Compiler Integration Guide A comprehensive guide for integrating and utilizing React Compiler with the Context-Action Framework to achieve automatic memoization and performance optimization. > For architectural principles and philosophy, see Context-Driven Architecture 📋 Table of Contents 1. Overview 2. React Compiler Setup 3. "use memo" Directive Usage 4. Real-World Example: Infinite Loop Prevention 5. Automatic Compilation Options 6. Performance Optimization Patterns 7. Best Practices 8. Migration Guide 9. Troubleshooting --- Overview React Compiler provides automatic memoization for React components and hooks, eliminating the need for manual useCallback, useMemo, and React.memo optimizations. When integrated with the Context-Action Framework, it provides significant performance benefits for action dispatching, state management, and component rendering. ✅ Key Benefits - Automatic Memoization - No need for manual useCallback or useMemo - Reduced Bundle Size - Eliminates manual optimization code - Better Performance - Compile-time optimizations - Simplified Code - Cleaner, more readable component code - Framework Integration - Seamless integration with Context-Action patterns 🎯 Integration Points - Action Context Components - Automatic memoization of action handlers - Store Components - Optimized state subscription patterns - Hook Functions - Automatic memoization of custom hooks - Event Handlers - Optimized callback functions --- React Compiler Setup 1. Package Installation 2. Babel Configuration Create or update babel.config.js: 3. Package Configuration Update package.json for library packages: 4. Build Tool Integration For tsdown (Library Build) For Vite (Example/App Build) --- "use memo" Directive Usage The "use memo" directive is the primary way to control React Compiler's automatic memoization behavior. ✅ Correct Usage Component-Level Memoization Hook-Level Memoization ❌ Incorrect Usage 🎯 Context-Action Framework Patterns Action Context Components Store Components --- Real-World Example: Infinite Loop Prevention The Problem: Without React Compiler The following example demonstrates a common infinite loop issue that occurs without proper memoization: Result: Maximum update depth exceeded error due to infinite re-renders. The Solution: With React Compiler (Infer Mode) Result: No infinite loops, optimal performance with automatic memoization - no "use memo" needed! Manual Solution (Before React Compiler) --- Automatic Compilation Options Compilation Modes React Compiler supports different compilation modes that affect how automatic memoization is applied: 1. Annotation Mode (Recommended) Behavior: Only components with "use memo" directive are compiled. 2. Infer Mode (Automatic) - Recommended for Applications Behavior: All 

Key points:
• **Automatic Memoization** - No need for manual `useCallback` or `useMemo`
• **Reduced Bundle Size** - Eliminates manual optimization code
• **Better Performance** - Compile-time optimizations
• **Simplified Code** - Cleaner, more readable component code
• **Framework Integration** - Seamless integration with Context-Action patterns
• **Action Context Components** - Automatic memoization of action handlers
• **Store Components** - Optimized state subscription patterns
• **Hook Functions** - Automatic memoization of custom hooks
• **Event Handlers** - Optimized callback functions
• **Zero Configuration** - No need to add `"use memo"` directives
• **Automatic Optimization** - All components are optimized by default
• **Cleaner Code** - No optimization boilerplate needed
• **Maximum Convenience** - Just write normal React code
• You want explicit control over which components are optimized
• You're migrating existing codebase gradually
• You want to avoid potential compilation issues
• You prefer explicit optimization declarations
• You want automatic optimization for all components
• You're starting a new project
• You trust the compiler to make good decisions
• You want maximum convenience
• **Zero Configuration** - No `"use memo"` directives needed
• **Automatic Optimization** - All functions and values are memoized automatically
• **Cleaner Code** - Write normal React code without optimization boilerplate
• **Maximum Performance** - Compiler makes optimal decisions automatically
• [Overview](#overview)
• [React Compiler Setup](#react-compiler-setup)
• ["use memo" Directive Usage](#use-memo-directive-usage)
• [Real-World Example: Infinite Loop Prevention](#real-world-example-infinite-loop-prevention)
• [Automatic Compilation Options](#automatic-compilation-options)
•...