---
document_id: context-layered--integration-profiles
category: context-layered
source_path: en/context-layered/integration-profiles.md
character_limit: 2000
last_update: '2026-08-23T04:57:44.427Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Integration Profiles

Integration Profiles Integration profiles are versioned Context-Action conventions for an external domain. They do not add that domain's types or business rules to @context-action/core; they supply a catalog of lifecycle, ownership, compatibility, and evidence requirements. Lifecycle draft → registered → verified → supported → deprecated - draft: proposal only; not a consumer contract. - registered: an action/state ownership manifest and consumer are named. - verified: required consumer lifecycle evidence has passed. - supported: the profile is included in compatibility and release evidence. - deprecated: a replacement profile and migration guidance are recorded. Interface Intent runtime profile interface-intent-runtime is currently registered. It supplies four typed actions (scope.select, scene.select, compile.run, evaluate.run) and requires document refs, revision cancellation, and a pure compiler/evaluator boundary. The canonical Interface Intent documents remain extern

Key points:
• **draft**: proposal only; not a consumer contract.
• **registered**: an action/state ownership manifest and consumer are named.
• **verified**: required consumer lifecycle evidence has passed.
• **supported**: the profile is included in compatibility and release evidence.
• **deprecated**: a replacement profile and migration guidance are recorded.