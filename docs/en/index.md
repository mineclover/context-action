---
layout: home
title: Context Action
titleTemplate: Type-Safe Action Pipeline Management System

hero:
  name: Context Action
  text: Type-Safe Action Pipeline Management System
  tagline: Framework-neutral Action & Interaction Pipelines (@context-action/core v2), React 18/19 MVVM bindings (@context-action/react v5), and W3C Web Components (Lit & Preact)
  image:
    src: /logo.svg
    alt: Context Action
  actions:
    - theme: brand
      text: Convention Index
      link: /en/context-layered/convention-index
    - theme: alt
      text: Getting Started
      link: /en/guide/getting-started
    - theme: alt
      text: Scenario Library
      link: /en/examples/implementation-playbook-scenarios

features:
  - icon: 📐
    title: Context-Layered Architecture
    details: Six-layer separation (contexts / business / handlers / actions / hooks / views) with strict Action, Store, and Ref boundaries
  - icon: 🎯
    title: Headless Action & Interaction Pipelines
    details: Zero-dependency @context-action/core v2 and @context-action/interactions for priority execution, guards, dismiss layers, roving focus, and pointer gestures
  - icon: ⚡
    title: High-Performance Reactive Stores
    details: Lazy handler evaluation (getValue), selective projection hooks, Equality Guards, and StoreTransactionCoordinator atomic batching
  - icon: 🧩
    title: W3C Web Components (Lit & Preact)
    details: Zero-VDOM Lit ReactiveControllers and Preact Signals adapters with FACE form participation and React 18/19 host bridges
  - icon: 🛡️
    title: Machine-Verifiable Surface & Boundary Contracts
    details: Strict Attribute vs Property separation, 19-package ownership rules, and CA-SURFACE-CATALOG-001 governance
  - icon: 🧪
    title: Standardized Testing Convention
    details: T1–T4 test tiers and S1–S6 scenario contracts (CA-TESTING-CONVENTION-001) verified end-to-end across packages and examples
---

## 🏛️ Context-Action 4 Core Development Standards

Context-Action defines **4 Core Development Standards**—State Management, Interface Design, Design System Integration, and Web Component Conventions—alongside a six-layer React architecture and standardized testing contract:

1. **📊 3-Tier State Hierarchy & Selective Projection**
   - **Tier 1 (Local UI Transient State):** `@state()` in Lit / local signals or component state
   - **Tier 2 (Controlled Value & FACE):** `@property()` + `ElementInternals.setFormValue()`
   - **Tier 3 (Domain Business State SSOT):** `@context-action/store-core` / `@context-action/react` Store subscribed via selective projection + Equality Guard (`Object.is` default)
2. **🔌 Interface Design Standards**
   - Strict separation between primitive HTML attributes and complex JS properties (`attribute: false` for Stores, `ActionRegister`, objects, and callbacks)
   - Semantic `CustomEvent` dispatching (`{ bubbles: true, composed: true }`) and React 18/19 host bridges (`createLitElementBridge`, `createCustomElementBridge`)
3. **🎨 Design System Integration**
   - CSS Custom Properties theme tokens with fallbacks, `::part()` styling hooks, Constructable Stylesheets, and Adobe React Aria compatibility
4. **🧩 Multi-Runtime Web & Headless Interop**
   - Shared headless contracts across React 18/19 (`@context-action/react`), Lit (`@context-action/lit`), Preact Signals (`@context-action/preact`), and Vanilla JS (`@context-action/core`, `@context-action/interactions`)

---

## 🧭 Recommended First Path

1. [Convention Index](/en/context-layered/convention-index) — Central index of architecture conventions, ADRs, and verification gates
2. [Implementation Convention](/en/context-layered/implementation-convention) — Six-layer folder structure, state transitions, and docs linkage
3. [Testing Convention & Scenarios](/en/context-layered/testing-convention) — `T1`–`T4` tiers, `S1`–`S6` scenarios, and hygiene gate (`CA-TESTING-CONVENTION-001`)
4. [Canonical Order Form](/en/examples/canonical-order-form) & [Playbook Scenario Library](/en/examples/implementation-playbook-scenarios)

### 🎮 Interactive Live Showcases

- [Headless Interactions Showcase (React / Lit / Preact)](https://mineclover.github.io/context-action/example/integrations/headless-interactions)
- [Lit Web Components & React 19 Showcase](https://mineclover.github.io/context-action/example/integrations/lit-web-components)
- [Preact Web Components & Signals Showcase](https://mineclover.github.io/context-action/example/integrations/preact-web-components)
- [Canonical Order](https://mineclover.github.io/context-action/example/patterns/implementation-playbook)
- [Access Request](https://mineclover.github.io/context-action/example/patterns/implementation-playbook/access-request)
- [Incident Escalation](https://mineclover.github.io/context-action/example/patterns/implementation-playbook/incident-escalation)
- [Renewal Risk Review](https://mineclover.github.io/context-action/example/patterns/implementation-playbook/renewal-risk-review)
- [Standalone Web Coding Studio](https://mineclover.github.io/context-action/web-coding/)

Repo-local authoring skill: `skills/context-action-implementation-playbook/SKILL.md`

<style>
.VPFeature .icon {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.VPFeatures .VPFeature {
  transition: transform 0.2s, box-shadow 0.2s;
}

.VPFeatures .VPFeature:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}
</style>
