---
document_id: guide--context-splitting
category: guide
source_path: en/guide/patterns/architecture/context-splitting.md
character_limit: 5000
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

Split contexts based on architectural layers or technical concerns. Prerequisites: This pattern uses setup patterns from Multi-Context Setup Guide. Strategy 3: Feature-Based Split

Split contexts based on application features or modules. Strategy 4: Resource-Based Split (RefContext Pattern)

Split contexts based on external resources and singleton objects that need lazy evaluation and lifecycle management. Migration Patterns

Gradual Migration Strategy

Context Composition Patterns

Manual Provider Composition (Verbose)

Provider Composition Utilities (Recommended)

The Context-Action framework provides the composeProviders utility to eliminate Provider nesting hell. Instead of manually nesting multiple providers, you can compose them into a single JSX-compatible component. For detailed implementation examples and advanced patterns, see the composeProviders documentation. Advanced Provider Composition Patterns

The composeProviders utility supports advanced composition patterns including:

- Domain-grouped composition: Group providers by business domain or technical layer
- Conditional composition: Include providers based on feature flags or configuration  
- Environment-specific composition: Different provider sets for development/production
- Nested composition: Compose multiple composed providers together

For complete examples of these advanced patterns, see the composeProviders source code. Provider Tree Visualization Utility

Selective Provider Pattern

Cross-Context Communication

Event-Driven Communication

Direct Context Bridge Pattern

Performance Considerations

Context-Specific Optimization

Best Practices for Context Splitting

✅ Do's

1. Follow Setup Specifications
   - Use type definitions from Multi-Context Setup Guide for consistency
   - Follow established patterns for domain and layer separation
   - Reuse setup specifications for 90%+ pattern compliance

2. Plan Domain Boundaries
   - Identify clear business or technical boundaries
   - Consider team ownership and responsibilities  
   - Plan for future growth and changes

3. Provider Composition
   - Use patterns from Multi-Context Setup Guide
   - Create reusable provider composition with JSX-compatible components  
   - Group providers by domain or functionality for maintainability
   - Use conditional composition for feature flags and environment differences

4. Gradual Migration
   - Split contexts incrementally
   - Maintain backward compatibility during transition
   - Test thoroughly at each migration step

5. Clear Communication Patterns
   - Use explicit event systems for cross-context communication
   - Document context relationships and dependencies
   - Create clear bridges between related contexts

6. Optimize Per Context
   - Use appropriate comparison strategies for each context
   - Implement context-specific performance optimizations
   - Monitor context-specific performance metrics

❌ Don'ts

1. Over-Splitting
   - Don't create too many tiny contexts
   - Avoid splitting contexts that have tight coupling
   - Don't split prematurely before complexity justifies it

2. Tight Coupling
   - Don't create direct dependencies between split contexts
   - Avoid sharing store instances across contexts
   - Don't bypass the communication patterns

3.
