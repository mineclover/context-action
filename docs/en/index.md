---
layout: home
title: Context Action
titleTemplate: Type-Safe Action Pipeline Management System

hero:
  name: Context Action
  text: Type-Safe Action Pipeline Management System
  tagline: TypeScript monorepo for React integration, implementation playbooks, and reusable scenario demos
  image:
    src: /logo.svg
    alt: Context Action
  actions:
    - theme: brand
      text: Implementation Convention
      link: /en/context-layered/implementation-convention
    - theme: alt
      text: Scenario Library
      link: /en/examples/implementation-playbook-scenarios

features:
  - icon: 📐
    title: Standard Convention
    details: Start with the implementation convention that fixes folder structure, state transitions, testing, and docs linkage
  - icon: 🧠
    title: Repo-Local Skill
    details: Reuse the checked-in skill to scaffold and iteratively strengthen new playbook scenarios
  - icon: 🧪
    title: Canonical Order Demo
    details: The base implementation-playbook example for Action, Store, Ref, and explicit workflow transitions
  - icon: 🔐
    title: Access Request Demo
    details: Approval-oriented scenario showing review packets, policy checks, and result invalidation after draft edits
  - icon: 🚨
    title: Incident Escalation Demo
    details: Incident workflow showing severity rules, escalation packets, and operational state transitions
  - icon: 📈
    title: Renewal Risk Demo
    details: Customer-success workflow showing scoring, sponsor rules, and follow-up packet generation
---

## Recommended First Path

1. Read [Implementation Convention](/en/context-layered/implementation-convention)
2. Open [Canonical Order Form](/en/examples/canonical-order-form)
3. Browse [Playbook Scenario Library](/en/examples/implementation-playbook-scenarios)
4. Try the live demos:
   - [Canonical Order](https://mineclover.github.io/context-action/example/patterns/implementation-playbook)
   - [Access Request](https://mineclover.github.io/context-action/example/patterns/implementation-playbook/access-request)
   - [Incident Escalation](https://mineclover.github.io/context-action/example/patterns/implementation-playbook/incident-escalation)
   - [Renewal Risk Review](https://mineclover.github.io/context-action/example/patterns/implementation-playbook/renewal-risk-review)

Repo-local skill path: `skills/context-action-implementation-playbook/SKILL.md`

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
