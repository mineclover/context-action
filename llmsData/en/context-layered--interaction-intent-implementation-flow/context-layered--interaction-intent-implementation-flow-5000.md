---
document_id: context-layered--interaction-intent-implementation-flow
category: context-layered
source_path: en/context-layered/interaction-intent-implementation-flow.md
character_limit: 5000
last_update: '2026-11-01T11:30:49.464Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Interaction Intent Contract to Implementation Flow

Interaction Intent Contract to Implementation Flow This guide connects the Interaction Intent Contract (IIC) to the Context-Action implementation-playbook. It keeps a design shortcut, its state ownership, its implementation layers, and its verification evidence in one traceable flow. The flow Do not begin implementation with a button or component when the interaction removes an affordance, changes a trigger, or relies on a user inference. Start with an IIC record and make the design shortcut explicit first. Position in the existing convention hierarchy IIC is not an additional runtime layer in Context-Action and does not replace any of the six implementation layers. It is an upstream design contract that fixes why the interaction was chosen before the implementation-playbook decides where and how to implement it. | Position | Question answered | Owning artifact | | --- | --- | --- | | IIC | What was reduced, and what should the user be able to predict? | feature spec, decision record, PR | | Context-Action six layers | Where and how are that intent and state implemented? | contexts / business / handlers / actions / hooks / views | | Evidence | Does the implementation still preserve the same intent? | tests, docs, runnable scenario, gates | IIC therefore extends the existing convention upward as a design source of truth; it does not add a new runtime boundary. Even a small example records the IIC first and maps only the Context-Action layers it actually needs. The default IIC lifecycle is draft → accepted → implemented → superseded/deprecated. If implementation differs from the contract, update the IIC and its evidence before accepting the code. Stage responsibilities | Stage | Context-Action location | IIC question | Required output | | --- | --- | --- | --- | | Intent | feature spec, decision record, or PR | What is easier for the user, and what was removed? | IIC ID, trigger, replacement signal, discoverability risk, recovery | | Contract | contexts/ | Which state and semantic intents are owned by this feature? | typed Action/Store/Ref contracts and baseline state | | Rule | business/ | What does the shortcut mean independent of rendering? | pure validation, result, and state-transition functions | | Orchestration | handlers/ | Which effects, persistence, logging, or reset operations follow? | registry-backed handlers with explicit dependencies | | Command | actions/ | What semantic intent does the view send? | stable dispatch helpers; no DOM or business rules | | View model | hooks/ | Which state is visible, and which status is authoritative? | subscriptions and derived labels/models | | Surface | views/ | How does the user trigger, observe, and recover? | labelled controls, visible result, keyboard path, reset |

Key points:
• **Intent:** compare fallback and native state without an extra execute step.
• **Trigger:** typing a form value or changing a rejection checkbox.
• **Source of truth:** the experiment result card and its raw JSON report.
• **Replacement signal:** the control description and immediate result update replace the removed execute button.
• **Recovery:** reset restores the rejected-write baseline.
• **Context-Action mapping:** the example probe owns the scenario state, `run()` is the orchestration seam, the view controls are semantic inputs, and the component test proves an accepted-native rerun.
• [ ] An IIC ID is linked before implementation begins.
• [ ] Removed or condensed affordances and replacement signals are written down.
• [ ] State ownership and semantic intent are mapped to Context-Action layers.
• [ ] Default and changed behavior are pure-rule or component tested.
• [ ] The view explains implicit triggers and exposes reset/cancel recovery.
• [ ] One status owner is chosen; detailed diagnostics are separated.
• [ ] Technical accessibility checks are linked when the surface requires them.
• [ ] The IIC links to docs, tests, runnable evidence, and the focused gates.