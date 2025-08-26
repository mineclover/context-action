---
document_id: guide--context-splitting
category: guide
source_path: en/guide/patterns/architecture/context-splitting.md
character_limit: 1000
last_update: '2025-08-26T00:34:27.292Z'
update_status: auto_generated
priority_score: 95
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Context Splitting Patterns

Strategies for splitting and managing large contexts when applications grow complex and context providers become unwieldy. When to Split Contexts

Signs You Need Context Splitting

1. Provider Hierarchy Depth - More than 5-7 nested providers
2. Store Complexity - Single context managing 10+ different store types
3. Action Overload - 15+ different action types in one context
4. Team Boundaries - Different teams working on the same context
5. Performance Issues - Unnecessary re-renders due to large context scope
6. Maintenance Overhead - Difficulty finding and managing related code

Context Growth Example

Splitting Strategies

Strategy 1: Domain-Based Split

Split contexts based on business domains or logical boundaries. Prerequisites: This pattern uses type definitions and setup patterns from Multi-Context Setup Guide. Strategy 2: Layer-Based Split

Split contexts based on architectural layers or technical concerns.
