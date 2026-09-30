# @context-action/lit-ui

Web Component primitives, Form-Associated Custom Elements (FACE), W3C Context Protocol (`@lit/context`) dependency injection, and React 18/19 custom element bridge for the Context-Action state management framework.

## Responsibilities

- **`FormAssociatedLitElement`**: Abstract base class extending `LitElement` with full Form-Associated Custom Elements (FACE) support (`ElementInternals`, standard validation constraints, `setFormValue()`, and leak-free `formResetCallback()` coordination).
- **W3C Context Protocol Integration**: Global context tokens (`actionRegisterContext`, `actionDispatcherContext`, `createStoreContext`), imperative providers (`provideStore`, `provideActionRegister`, `provideActionDispatcher`), and reactive context controllers (`ContextStoreController`, `ContextActionController`) crossing Shadow DOM boundaries.
- **`createLitElementBridge`**: React 18/19 custom element bridge with direct property assignment (bypassing attribute stringification), custom event mapping with automatic cleanup, and bidirectional ref forwarding.

## Architecture

```text
┌────────────────────────────────────────────────────────┐
│ React 18/19 Host Application                           │
│   └── createLitElementBridge(CustomElement)            │
└───────────────────────────┬────────────────────────────┘
                            │ (Direct Properties & Custom Events)
┌───────────────────────────▼────────────────────────────┐
│ Custom Element (LitElement / FormAssociatedLitElement)  │
│   ├── #shadow-root (Encapsulated CSS & DOM)            │
│   ├── ElementInternals (Native Form Participation)     │
│   ├── ContextStoreController / ContextActionController │
│   │     ▲                                              │
│   │     │ (W3C Context Protocol: context-request)       │
│   └─────┴──────────────────────────────────────────────┘
```

## Documentation

- [01. DOM Ownership & Shadow DOM Isolation](docs/01-dom-ownership.md)
- [02. ReactiveController vs React Hooks & 3-Layer Architecture](docs/02-reactive-controller-vs-hooks.md)
- [03. Form-Associated Custom Elements (FACE) & ElementInternals](docs/03-form-associated-elements.md)
- [04. W3C Context Protocol & Micro-Frontend Communication](docs/04-micro-frontend-communication.md)
- [05. Interface Design & Baseline State Management Standards](docs/05-interface-and-state-management-standards.md)

## Status

`private: true`, version `0.0.0` (workspace development template).
