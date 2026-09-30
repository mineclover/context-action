# TimeTravelStore read-mode migration

`TimeTravelStore` has two read contracts:

| Mode | Use | Contract |
|---|---|---|
| `reference` | legacy internal action handlers | preserves structural sharing; caller must never mutate the returned value |
| `safe` | component boundaries, integrations, manager-created stores | returns a defensive copy and prevents external mutation from bypassing history |

Direct `createTimeTravelStore()` calls keep `reference` for compatibility. The
declarative `TimeTravelStoreManager` defaults to `safe`, so new application
stores do not expose the timeline's mutable references.

Use this migration sequence:

```ts
const store = createTimeTravelStore('session', initialState, {
  readMode: 'safe',
});

// Existing action code can use getValue during the compatibility period.
// Adapter, devtools, and external integration code should use:
const value = store.getSafeValue();
```

Do not mutate the result of `getValue()`. Use `update(draft => ...)` for state
changes so patches, notifications, and history stay aligned. A future major
release can make `safe` the direct factory default after downstream consumers
have migrated.
