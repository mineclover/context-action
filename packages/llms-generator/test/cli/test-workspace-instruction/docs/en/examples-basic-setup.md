---
title: Basic Setup Examples
category: examples
tags: [examples, setup]
---

# Basic Setup Examples

Collection of basic setup examples.

## Example 1: Simple App

```typescript
import { Framework } from 'framework';

const app = new Framework({
  port: 3000,
  debug: true
});

app.start();
```

## Example 2: With Configuration

```typescript
import { Framework, FrameworkConfig } from 'framework';

const config: FrameworkConfig = {
  port: process.env.PORT || 3000,
  debug: process.env.NODE_ENV === 'development'
};

const app = new Framework(config);
app.start();
```