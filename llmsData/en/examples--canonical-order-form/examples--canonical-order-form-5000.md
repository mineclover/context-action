---
document_id: examples--canonical-order-form
category: examples
source_path: en/examples/canonical-order-form.md
character_limit: 5000
last_update: '2026-07-24T05:15:02.363Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Canonical Order Form Example

Canonical Order Form Example This example is the recommended implementation-first walkthrough for the repository. It is intentionally small, but complete enough to demonstrate why Context-Layered Architecture improves reliability. If you only read one example to understand the architecture, start with this one. What It Demonstrates - Store Context for persistent draft, validation, submission, and activity state - Action Context for user intent and orchestration - Ref Context for imperative focus management after validation failure - pure business functions for deterministic validation and quote calculation - reactive hooks and views for rendering without hidden local business logic Route The live example is exposed in the example application at: File Structure Runtime Flow Explicit State Machine The submission flow in this example is no longer just a mutable status string. It is modeled as state + event + transition function. Relevant files: - business/submissionStateMachine.ts - handlers/useCanonicalOrderSubmissionHandlers.tsx - handlers/orderHandlerSupport.ts See Explicit State Machine for the general concept behind this pattern. Specification Example If you want to move from architecture explanation to execution planning, define the example as a compact specification first and then implement against that contract. This approach keeps documentation, implementation, and test expectations aligned before the code grows. Why This Example Is Canonical It is designed to answer five practical questions quickly. Where does state live State lives in stores, not in view-local business state. - draft values - validation result - submission status - activity timeline Where does business logic live Pure decision logic lives in focused modules under business/. - orderDraft.ts: draft defaults and example data - orderValidation.ts: validation issue calculation - orderQuote.ts: quote calculation - submissionStateMachine.ts: explicit workflow transitions Where do side effects live Orchestration and imperative work live in handlers. - reading the latest store values - calling explicit submission transitions - focusing the first invalid field - appending activity events and mapping them for the view What do views do Views render state and emit user intent. - they subscribe through hooks - they call action dispatch helpers - they do not embed pricing rules or validation rules How is it tested The example is verified by an integration test that imports the real example component and checks: - validation errors render for invalid input - focus moves to the invalid field through refs - valid submission produces a quote and success state - reset restores baseline state Recommended Reading Order 1. contexts/CanonicalOrderContexts.tsx 2. business/orderDraft.ts 3. business/or

Key points:
• `Store Context` for persistent draft, validation, submission, and activity state
• `Action Context` for user intent and orchestration
• `Ref Context` for imperative focus management after validation failure
• pure `business` functions for deterministic validation and quote calculation
• reactive `hooks` and `views` for rendering without hidden local business logic
• `business/submissionStateMachine.ts`
• `handlers/useCanonicalOrderSubmissionHandlers.tsx`
• `handlers/orderHandlerSupport.ts`
• Provide one realistic example where Action, Store, and Ref work together.
• Keep the example implementation-first, with a clear file reading order.
• Verify invalid submission, focus movement, valid quote generation, and reset behavior.
• Connect the docs, implementation files, and the integration test.
• `pnpm test:canonical-example`
• `pnpm docs:build`
• `pnpm --dir example build:fast`
• [ ] Customer name, email, quantity, plan, onboarding option, and notes are stored in the draft store.
• [ ] The view sends changes through action helpers instead of local business state.
• [ ] Hooks expose draft, validation, and submission state in a view-friendly form.
• [ ] Invalid email or missing required fields render validation errors.
• [ ] Focus moves to the first invalid field.
• [ ] Submission state does not transition to success.
• [ ] A valid draft submission calculates a quote in the business layer.
• [ ] The submission store saves success state and quote data.
• [ ] The activity timeline records validation and submission steps.
• [ ] Reset restores the draft, validation, and submission stores to their initial state.
• [ ] Focus can return to the customer name field after reset.
• [ ] The integration test validates post-reset behavior.
• FR-1: The system must provide an example that uses Action,...