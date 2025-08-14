# Documentation Guidelines

This document provides comprehensive guidelines for documenting the Context-Action framework. It covers documentation standards, patterns, and best practices for maintaining high-quality technical documentation.

## Framework Overview

The Context-Action framework is a revolutionary TypeScript state management system built on document-centric context separation and effective artifact management. Documentation should reflect the framework's core philosophy of domain isolation and MVVM architecture.

## Documentation Philosophy

### Core Principles
- **Document-Centric Approach**: Documentation should mirror the framework's document-artifact centered design
- **Domain Isolation**: Each documentation section should clearly define its domain boundaries
- **Type Safety First**: All code examples must include proper TypeScript types
- **Evidence-Based**: Claims must be supported with working code examples
- **MVVM Clarity**: Clearly separate View (components), ViewModel (actions), and Model (stores) concerns

### Target Audiences
1. **Framework Users**: Developers implementing Context-Action in their projects
2. **Contributors**: Developers contributing to the framework codebase
3. **Evaluators**: Decision-makers comparing state management solutions

## Documentation Structure

### Core Documentation Categories

#### 1. Concept Documentation (`docs/en/concept/`)
- **pattern-guide.md**: Complete pattern guide with two main approaches (Action Only, Store Only)
- **architecture-guide.md**: MVVM architecture guide with Context Store Pattern
- **conventions.md**: Coding conventions and best practices
- **hooks-reference.md**: Complete hooks reference documentation

#### 2. API Documentation (`docs/en/api/`)
- Auto-generated from TypeScript source using TypeDoc
- Synchronized with `pnpm docs:api` command
- Covers all public APIs with examples

#### 3. Tutorial Documentation (`docs/en/tutorial/`)
- Step-by-step guides for common use cases
- Progressive complexity from basic to advanced patterns
- Real-world implementation examples

#### 4. Example Documentation (`example/`)
- Comprehensive working examples
- Demonstrates all major patterns and features
- Serves as reference implementation

## Writing Standards

### Content Structure

#### Document Headers
Every documentation file must include:
```markdown
# Document Title

Brief description of what this document covers and its target audience.

## Overview
High-level summary of key concepts covered.
```

#### Code Examples
All code examples must:
1. **Include TypeScript types**: Never show untyped JavaScript
2. **Be complete and runnable**: Avoid partial snippets that won't compile
3. **Follow framework conventions**: Use established patterns consistently
4. **Include imports**: Show where functions/types come from

```typescript
// ✅ Good: Complete, typed example
import { createActionContext, ActionPayloadMap } from '@context-action/react';

interface UserActions extends ActionPayloadMap {
  updateUser: { id: string; name: string };
  deleteUser: { id: string };
}

const { Provider, useActionDispatch, useActionHandler } = 
  createActionContext<UserActions>('User');
```

```typescript
// ❌ Bad: Incomplete, untyped example
const dispatch = useActionDispatch();
dispatch('updateUser', data);
```

#### Pattern Documentation
When documenting patterns, follow this structure:

1. **Use Case**: When to use this pattern
2. **Implementation**: Complete code example
3. **Key Features**: What this pattern provides
4. **Best Practices**: How to use it effectively
5. **Common Pitfalls**: What to avoid

### Language and Tone

#### Technical Writing Standards
- **Clarity**: Use simple, direct language
- **Precision**: Technical terms must be accurate and consistent
- **Conciseness**: Avoid unnecessary verbosity
- **Active Voice**: Prefer active over passive constructions

#### Framework-Specific Language
- **Context-Action framework** (not "Context Action" or "context-action")
- **Action Pipeline System** (capitalized when referring to the architectural pattern)
- **Store Integration Pattern** (capitalized as architectural pattern)
- **Declarative Store Pattern** (specific pattern name)

## Code Documentation Standards

### TypeScript Documentation
All public APIs must include TSDoc comments:

```typescript
/**
 * Creates an action context for type-safe action dispatching.
 * 
 * @template TActionMap - Action payload map extending ActionPayloadMap
 * @param contextName - Unique identifier for the action context
 * @returns Context provider and hooks for action management
 * 
 * @example
 * ```typescript
 * interface UserActions extends ActionPayloadMap {
 *   updateUser: { id: string; name: string };
 * }
 * 
 * const { Provider, useActionDispatch } = 
 *   createActionContext<UserActions>('User');
 * ```
 */
export function createActionContext<TActionMap extends ActionPayloadMap>(
  contextName: string
): ActionContextResult<TActionMap>
```

### Code Comments
- **Focus on WHY, not WHAT**: Explain reasoning, not obvious behavior
- **Document complex logic**: Multi-step processes need explanation
- **Highlight framework patterns**: Point out when code follows specific patterns

## Documentation Maintenance

### Build and Deployment

#### Development Workflow
```bash
# Documentation development
pnpm docs:dev          # VitePress dev server at localhost:5173
pnpm docs:build        # Build static documentation
pnpm docs:api          # Generate API docs with TypeDoc
pnpm docs:sync         # Sync API docs to documentation
pnpm docs:full         # Full documentation build pipeline
```

#### Automatic API Documentation
- TypeDoc automatically generates API documentation from TypeScript source
- Run `pnpm docs:api` after any public API changes
- API docs are synced to `docs/en/api/` directory

### Content Review Process

#### Before Publishing
1. **Technical Accuracy**: Verify all code examples compile and run
2. **Framework Alignment**: Ensure content follows framework principles
3. **Cross-References**: Check that links and references are accurate
4. **Examples Validation**: Test examples against current codebase

#### Regular Maintenance
- **API Sync**: Keep API documentation synchronized with code changes
- **Example Updates**: Update examples when patterns evolve
- **Link Validation**: Ensure internal and external links remain valid
- **Version Compatibility**: Update version-specific information

## Framework-Specific Guidelines

### Architecture Documentation

#### MVVM Pattern Documentation
When documenting MVVM patterns:
- **View Layer**: React components, UI rendering, user interactions
- **ViewModel Layer**: Action pipeline, business logic, state coordination
- **Model Layer**: Store system, data management, persistence

#### Context Separation Documentation
Document the five core contexts:
1. **Business Context**: Domain logic, workflows, business rules
2. **UI Context**: User interactions, screen state, component behavior
3. **Validation Context**: Data validation, form processing, error handling
4. **Design Context**: Themes, styling, layout, visual states
5. **Architecture Context**: System configuration, technical decisions

### Pattern Documentation Standards

#### Action Only Pattern
Document when to use for:
- Event systems and command patterns
- Pure action dispatching without state
- Lightweight operations with minimal overhead

#### Store Only Pattern (Declarative Store Pattern)
Document when to use for:
- Data layers and simple state management
- Type-safe state without action dispatching
- Clean state management with excellent type inference

#### Pattern Composition
Show how to combine patterns:
- Action Only + Store Only for complex applications
- Provider isolation strategies
- Cross-pattern communication

### Common Documentation Patterns

#### Implementation Examples
Always show the complete implementation pattern:

```typescript
// 1. Define types
interface AppActions extends ActionPayloadMap {
  updateUser: { id: string; name: string };
}

// 2. Create context
const { Provider, useActionDispatch, useActionHandler } = 
  createActionContext<AppActions>('App');

// 3. Provider setup
function App() {
  return (
    <Provider>
      <UserComponent />
    </Provider>
  );
}

// 4. Handler registration
function UserComponent() {
  const dispatch = useActionDispatch();
  
  useActionHandler('updateUser', async (payload, controller) => {
    // Business logic here
    console.log('Updating user:', payload);
  });
  
  return <button onClick={() => dispatch('updateUser', { id: '1', name: 'John' })}>
    Update User
  </button>;
}
```

#### Error Handling Documentation
Show proper error handling patterns:

```typescript
useActionHandler('riskyAction', async (payload, controller) => {
  try {
    // Business logic that might fail
    await api.updateUser(payload);
  } catch (error) {
    // Use controller for proper error handling
    controller.abort('User update failed', error);
  }
});
```

## Quality Assurance

### Documentation Testing
- All code examples must compile with TypeScript strict mode
- Examples should run against the current framework version
- Links and references must be validated regularly

### Review Checklist
- [ ] Technical accuracy verified
- [ ] Code examples compile and run
- [ ] Framework patterns followed correctly
- [ ] Language is clear and concise
- [ ] Cross-references are accurate
- [ ] Follows documentation structure guidelines
- [ ] Includes proper TypeScript types
- [ ] Shows complete, working examples

## Tools and Infrastructure

### Documentation Stack
- **VitePress**: Static site generator for main documentation
- **TypeDoc**: Automatic API documentation generation
- **TypeScript**: Type checking for all code examples
- **ESLint**: Code quality enforcement in examples

### File Organization
```
docs/
├── en/
│   ├── concept/           # Conceptual guides
│   ├── api/              # Auto-generated API docs
│   ├── tutorial/         # Step-by-step tutorials
│   └── .vitepress/       # VitePress configuration
└── DOCUMENTATION_GUIDELINES.md  # This file
```

### Development Integration
Documentation is integrated with the development workflow:
- Changes to public APIs trigger documentation updates
- Examples are validated against current codebase
- Documentation builds are part of CI/CD pipeline

## Contribution Guidelines

### For Contributors
1. **Read Existing Documentation**: Understand current patterns and style
2. **Follow TypeScript Standards**: All examples must be properly typed
3. **Test Examples**: Verify code examples work with current framework
4. **Update Cross-References**: Maintain links and references
5. **Follow Review Process**: Submit documentation changes for review

### For Maintainers
1. **Enforce Standards**: Ensure contributions follow these guidelines
2. **Maintain Consistency**: Keep documentation style consistent
3. **Regular Updates**: Schedule regular documentation maintenance
4. **API Synchronization**: Keep API docs synchronized with code changes

---

This documentation standard ensures that the Context-Action framework documentation remains high-quality, accurate, and useful for all stakeholders while reflecting the framework's innovative approach to state management through document-centric context separation.