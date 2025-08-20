---
layout: home
title: Context Action
titleTemplate: Type-Safe Action Pipeline Management System

hero:
  name: Context Action
  text: Type-Safe Action Pipeline Management System
  tagline: TypeScript monorepo for React integration and enhanced state management
  image:
    src: /logo.svg
    alt: Context Action
  actions:
    - theme: brand
      text: Get Started
      link: /en/guide/overview
    - theme: alt
      text: View on GitHub
      link: https://github.com/mineclover/context-action

features:
  - icon: 🚀
    title: Action Context Pattern
    details: Unified Action + Store management, type-safe action handlers, Provider-based isolation
  - icon: 🎯
    title: Action Only Pattern
    details: Pure action dispatching without stores, perfect for event systems and command patterns
  - icon: 🏪
    title: Store Only Pattern
    details: Pure state management without actions, excellent type inference with simplified API
  - icon: ⚡
    title: RefContext Pattern
    details: High-performance DOM manipulation with zero React re-renders, hardware acceleration
  - icon: 🧩
    title: MVVM Architecture
    details: Clear separation of View (components), ViewModel (action pipeline), Model (store system) layers
  - icon: 🛡️
    title: Type Safety
    details: Complete TypeScript support with strict type checking and domain-specific hooks
---

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