# @context-action/lit

Lightweight, headless Lit `ReactiveController` integration for the Context-Action state management framework.

Bridges `@context-action/core` stores and action registers to Lit element lifecycles without touching the DOM directly.

## Responsibilities

- **`StoreController`**: Subscribes to a Context-Action `ReadableStore`, triggers `host.requestUpdate()` on state changes, and cleanly unsubscribes on `hostDisconnected()`.
- **`ActionController`**: Dispatches typed actions through the Context-Action `ActionRegister`.
- **Selectors & Projections**: Supports fine-grained store selectors and custom equality functions to eliminate redundant element rerenders.

## Architecture

```text
ActionRegister  ──▶ ActionController ──▶ host.requestUpdate() ──▶ LitElement (View)
ReadableStore   ──▶ StoreController  ──▶ host.requestUpdate() ──▶ LitElement (View)
```

DOM root ownership, Shadow DOM encapsulation, Form-Associated Custom Elements (FACE), and `@lit/context` tokens are provided by [`@context-action/lit-ui`](../lit-ui/README.md).

## Status

`private: true`, version `0.0.0` (workspace development template).
