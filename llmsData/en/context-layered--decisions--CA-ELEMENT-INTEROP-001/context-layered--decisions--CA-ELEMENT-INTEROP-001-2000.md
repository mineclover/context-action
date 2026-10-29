---
document_id: context-layered--decisions--CA-ELEMENT-INTEROP-001
category: context-layered
source_path: en/context-layered/decisions/CA-ELEMENT-INTEROP-001.md
character_limit: 2000
last_update: '2026-10-25T07:23:14.352Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
CA-ELEMENT-INTEROP-001: Core subpaths and host-neutral Element bindings

CA-ELEMENT-INTEROP-001: Core subpaths and host-neutral Element bindings Status: accepted for implementation; release cohort unapproved Owner: Framework Core & UI Integration Related issue/spec: CA-ELEMENT-INTEROP-001 (user-approved local boundary design) Context Preact/Lit public handles and React bridges duplicated property/event mechanics. A private shared-package prototype proved renderer replacement, but added a new publication unit without an independent lifecycle requirement. React-only extraction would not serve Vue, Svelte or Angular hosts. Options considered - Keep an independent shared package: reconsider if it needs independent releases. - Put the bridge in @context-action/react: rejected because its React 19 and Store/Mutative dependencies are unnecessary for React 18/19 Element interop. - Merge all exports into default Core: rejected because it leaks DOM/React declarations. Decision Keep the default Action entry isolated. Add /element for framew

Key points:
• Keep an independent shared package: reconsider if it needs independent releases.
• Put the bridge in `@context-action/react`: rejected because its React 19 and
• Merge all exports into default Core: rejected because it leaks DOM/React declarations.
• Shared npm distribution does not imply a shared reachable runtime/declaration graph.
• Core adds no framework runtime or peer constraint. The React factory is injected;
• DOM binding owns listeners and attempted-property ownership, not renderer teardown.
• Terminal disposal differs from replayable...