---
document_id: guide--best-practices
category: guide
source_path: en/guide/best-practices.md
character_limit: 2000
last_update: '2025-08-21T02:13:42.363Z'
update_status: auto_generated
priority_score: 95
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Best Practices

Follow these conventions and best practices when using the Context-Action framework. <!-- Updated for sync-docs testing -->

Naming Conventions

Domain-Based Renaming Pattern

The core convention is domain-specific renaming for clear context separation. Store Pattern Renaming

Action Pattern Renaming

Context Naming Rules

Domain-Based Naming

Action vs Store Distinction

File Structure

Recommended Directory Structure

Context File Organization

Pattern Usage

Action Pattern Best Practices

Handler Registration

Error Handling

Store Pattern Best Practices

Store Access

Store Updates

Type Definitions

Action Types

Store Types

Performance Guidelines

Handler Optimization

Store Subscription Optimization

Pattern Composition

Provider Hierarchy

Cross-Pattern Communication

Common Pitfalls

Avoid These Patterns

Advanced Best Practices

Action Handler State Access

⚠️ Critical: Avoid Closure Traps with Store Values

When accessing store values inside action handlers, never use values from component scope as they create closure traps:

Real-time State Access Patterns

useEffect Dependencies Best Practices

Store and Dispatch References are Stable

Context-Action framework ensures that store instances and dispatch functions have stable references:

Dependency Array Guidelines

Debugging State Issues

State Monitoring Techniques

Common Debugging Scenarios

Production Debugging & Component Lifecycle Management

Critical Issue: Duplicate Action Handler Registration

Problem: Accidentally registering the same action handler multiple times causes unpredictable behavior. Debug tip: grep -n "useActionHandler.'actionName'" src//.tsx

Preventing Race Conditions with Processing State

Problem: Rapid button clicks cause race conditions and state inconsistencies. Safe Component Unmounting with RefContext

Problem: Component unmounting conflicts with manual ref cleanup.
