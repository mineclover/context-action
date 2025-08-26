---
document_id: guide--handler-state-access
category: guide
source_path: en/guide/patterns/action/handler-state-access.md
character_limit: 5000
last_update: '2025-08-26T00:34:27.301Z'
update_status: auto_generated
priority_score: 95
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Action Handler State Access Patterns

Advanced patterns for accessing and managing state within action handlers, including critical best practices to avoid common pitfalls. Import

Prerequisites

🎯 스펙 재사용: For complete action handler setup patterns, see Basic Action Setup. 📖 이 문서의 모든 예제는 아래 setup 스펙을 재사용합니다:
- 🎯 Action types → EventActions, UserActions
- 🎯 Hook naming → useEventAction Pattern
- 🎯 Handler patterns → Action Handler Setup

💡 일관된 학습: Setup 가이드를 먼저 읽으면 이 문서의 모든 예제를 즉시 이해할 수 있습니다. 📋 Table of Contents

1. Critical: Avoid Closure Traps
2. Real-time State Access Patterns
3. useEffect Dependencies Best Practices

---

Critical: Avoid Closure Traps

⚠️ The Closure Trap Problem

When accessing store values inside action handlers, never use values from component scope as they create closure traps with stale data. 🔍 Why Closure Traps Happen

1. Handler Registration Time: Handlers capture variables from their lexical scope at registration time
2. Stale References: Component state values don't update inside the handler closure
3. Re-registration Issues: Without useCallback, handlers re-register on every render

---

Real-time State Access Patterns

Pattern 1: Direct Store getValue()

Use for simple state checks and single store access:

Pattern 2: Multiple Store Coordination

Use for complex logic requiring multiple store states:

Pattern 3: State Validation and Updates

Use for validating current state before updates:

---

useEffect Dependencies Best Practices

Store and Dispatch References are Stable

Context-Action framework ensures that store instances and dispatch functions have stable references:

Dependency Array Guidelines

---

🔧 Handler Registration Best Practices

Correct Handler Registration Pattern

Common Mistakes to Avoid

---

📚 Related Patterns

- Basic Action Setup - Complete action context setup patterns
- Action Basic Usage - Fundamental action dispatching patterns
- Dispatch Access Patterns - Advanced dispatch usage patterns

---

💡 Key Takeaways

1. Never use component scope values in handlers - they create closure traps
2. Always use store.getValue() for current state in handlers
3. Store and dispatch references are stable - safe to omit from deps
4. Use useCallback for handler stability and proper dependency management
5. Include only changing values in dependency arrays for optimal performance.
