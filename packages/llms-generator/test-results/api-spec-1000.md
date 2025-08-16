---
title: "useActionDispatch Hook API"
category: "api"
complexity: "intermediate"
character_limit: 1000
strategy: "api-first"
priority_score: 90
priority_tier: "critical"
language: "en"
document_id: "api--hooks--useactiondispatch"
generated_at: "2025-08-16T02:48:28.778Z"
utilization_rate: 36.0%
source: "api/hooks/useActionDispatch.md"
---

# API Specification for useActionDispatch

The `useActionDispatch` hook provides a typed way to dispatch actions within the Context-Action framework. ## Syntax

```typescript
const dispatch = useActionDispatch<TActions>();
```

## Parameters

- **TActions**: Generic type extending `ActionPayloadMap` that defines the available actions and their payload types.