---
title: "API Spec - useActionDispatch"
category: "api"
character_limit: 1000
strategy: "api-first"
---

The `useActionDispatch` hook provides a typed way to dispatch actions within the Context-Action framework.
## Syntax
```typescript
```
## Parameters
- **TActions**: Generic type extending `ActionPayloadMap` that defines the available actions and their payload types.
## Returns
Returns a dispatch function with the following signature:
```typescript
type DispatchFunction<TActions> = <K extends keyof TActions>(
```
## Usage Example
```typescript
interface MyActions extends ActionPayloadMap {
function UserComponent() {
```
## Error Handling
The dispatch function returns a Promise that resolves to an `ActionResult` object containing:
## Best Practices
2. Use proper TypeScript typing for actions to ensure type safety