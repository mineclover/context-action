---
document_id: concept--documentation-development-conventions
category: concept
source_path: en/concept/documentation-development-conventions.md
character_limit: 5000
last_update: '2026-07-12T08:40:00.523Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Documentation and Development Management Conventions

Documentation and Development Management Conventions This document is the source of truth for keeping implementation, public documentation, generated references, and LLM-oriented artifacts aligned. It complements the coding rules in Conventions; it does not replace package-specific ownership or release rules. 1. Documentation Ownership | Surface | Owner and editing rule | Verification | | --- | --- | --- | | docs/en/, docs/ko/ guides and concepts | Hand-authored source. Keep the English and Korean pages aligned when the content is public. | pnpm docs:build | | docs/api/generated/ | Generated API reference. Change TypeScript exports and JSDoc first; regenerate rather than hand-editing output. | pnpm docs:api, pnpm docs:sync | | llmsData/ and generated LLMS files | Derived learning/context artifacts. Do not treat them as the canonical explanation. | pnpm llms:sync-docs --changed-files <paths> when supported by the generator | | README and package READMEs | Discovery and package entry points. They must route readers to the authoritative guide or API page rather than duplicate it. | Relevant build and link check | Generated files may be reviewed, but a behavioral correction belongs in their source document, generator, or exported API—not only in generated output. 2. Change Classification Before implementation, record the change in one of these classes: 1. Public API — update exported types/JSDoc, API reference inputs, a usage    example, and migration notes when behavior is not backward compatible. 2. Behavior or pattern — update the canonical guide, a runnable example,    and the test that proves the documented behavior. 3. Internal maintenance — update developer-facing documentation only when    commands, ownership, failure modes, or a contributor decision changes. 4. Generated-only refresh — identify the source change and generator    command in the commit; do not present generated output as an independent    feature. Do not combine an unrelated documentation rewrite with a behavior change in the same commit. Use a docs(<area>): commit when documentation can be reviewed independently. 3. Required Development Loop Use this order for feature and maintenance work: 1. Define the source-of-truth contract: public type, state transition, tool    schema, or documented invariant. 2. Implement the smallest code change that satisfies the contract. 3. Add or update the focused test and runnable example when users can observe    the behavior. 4. Update the authoritative guide and its discovery link. Keep translated    public pages equivalent in meaning; temporary gaps must be called out in the    PR or handoff. 5. Run the proportional verification gate below before committing. Document current behavior, not an intended future design. If an imple

Key points:
• the authoritative document changed and any generated artifact it affects;
• the implementation, example, and test that prove the claim;
• commands run and their result;
• any untranslated page, unavailable external credential, or manual proof
• **Public API** — update exported types/JSDoc, API reference inputs, a usage
• **Behavior or pattern** — update the canonical guide, a runnable example,
• **Internal maintenance** — update developer-facing documentation only when
• **Generated-only refresh** — identify the source change and generator
• Define the source-of-truth contract: public type, state transition, tool
• Implement the smallest code change that satisfies the contract.
• Add or update the focused test and runnable example when users can observe
• Update the authoritative guide and its discovery link. Keep translated
• Run the proportional verification gate below before committing.