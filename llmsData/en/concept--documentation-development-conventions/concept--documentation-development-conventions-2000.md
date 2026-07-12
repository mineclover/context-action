---
document_id: concept--documentation-development-conventions
category: concept
source_path: en/concept/documentation-development-conventions.md
character_limit: 2000
last_update: '2026-07-12T08:40:00.523Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Documentation and Development Management Conventions

Documentation and Development Management Conventions This document is the source of truth for keeping implementation, public documentation, generated references, and LLM-oriented artifacts aligned. It complements the coding rules in Conventions; it does not replace package-specific ownership or release rules. 1. Documentation Ownership | Surface | Owner and editing rule | Verification | | --- | --- | --- | | docs/en/, docs/ko/ guides and concepts | Hand-authored source. Keep the English and Korean pages aligned when the content is public. | pnpm docs:build | | docs/api/generated/ | Generated API reference. Change TypeScript exports and JSDoc first; regenerate rather than hand-editing output. | pnpm docs:api, pnpm docs:sync | | llmsData/ and generated LLMS files | Derived learning/context artifacts. Do not treat them as the canonical explanation. | pnpm llms:sync-docs --changed-files <paths> when supported by the generator | | README and package READMEs | Discovery an

Key points:
• the authoritative document changed and any generated artifact it affects;
• the implementation, example, and test that prove the claim;
• commands run and their result;
• any untranslated page, unavailable external credential, or manual proof
• **Public API** — update exported types/JSDoc, API reference inputs, a usage
• **Behavior or pattern** — update the canonical guide, a runnable example,
• **Internal maintenance** — update developer-facing documentation only when
• **Generated-only refresh** — identify the source change and generator
• Define the source-of-truth...