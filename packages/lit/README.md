# @context-action/lit

Lightweight, headless Lit `ReactiveController` integration for the Context-Action state management framework.

Bridges `@context-action/core` stores and action registers to Lit element lifecycles without touching the DOM directly.

## Responsibilities

- **`StoreController`**: Subscribes to a Context-Action `ReadableStore`, triggers `host.requestUpdate()` on state changes, and cleanly unsubscribes on `hostDisconnected()`.
- **`ActionController`**: Dispatches typed actions through the Context-Action `ActionRegister`.
- **`ControllerScope`**: Owns ReactiveControllers and cleanup callbacks for one connection session, disposing them in LIFO order with `AggregateError` aggregation.
- **Selectors & Projections**: Supports fine-grained store selectors and custom equality functions to eliminate redundant element rerenders.

## ControllerScope

```ts
import { ControllerScope, StoreController } from '@context-action/lit';

class TimelineElement extends LitElement {
  #scope = new ControllerScope(this, { autoDisposeOnDisconnect: true });

  constructor() {
    super();
    this.#scope.add(new StoreController(this, timelineStore));
    this.#scope.addCleanup(() => this.#detachPlayhead());
  }
}
```

- Entries are disposed in reverse registration order, so child parts release before providers.
- A failing cleanup does not stop the remaining cleanups; failures are collected into one `AggregateError`.
- A disposed scope is terminal. Create a fresh scope on reconnect instead of reusing the old one.
- `add()`/`addCleanup()` on a disposed scope run immediately, so late registrations cannot leak.

## Architecture

```text
ActionRegister  ──▶ ActionController ──▶ host.requestUpdate() ──▶ LitElement (View)
ReadableStore   ──▶ StoreController  ──▶ host.requestUpdate() ──▶ LitElement (View)
```

DOM root ownership, Shadow DOM encapsulation, Form-Associated Custom Elements (FACE), and `@lit/context` tokens are provided by [`@context-action/lit-ui`](../lit-ui/README.md).

## Documentation

- [01. ControllerScope and Lifecycle](docs/01-controller-scope.md)

## Install

```bash
pnpm add @context-action/lit lit
```

`lit` is a peer dependency (`^3.2.0`); the host application supplies one Lit
runtime copy.

## Status

Public package. `0.1.1` is a cohort-alignment patch for the Lit UI 0.1.1
static-styles hydration fix; runtime and public API are unchanged.

- https://www.npmjs.com/package/@context-action/lit
- Release plan: [`releases/LIT_PUBLIC_0.1.1.md`](../../releases/LIT_PUBLIC_0.1.1.md)

Requires Node.js `>=24.11.0`.
