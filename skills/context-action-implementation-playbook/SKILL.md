---
name: context-action-implementation-playbook
description: >-
  Use when adding or refactoring repository examples, decomposing bloated single-file codebases,
  or modularizing large UI components and stylesheets according to the Context-Action standard.
  Triggers on requests for "구현 모듈화", "단일 파일 비대화", "모듈화 기준", "컴포넌트 분리", "스타일 분리",
  standard conventions, implementation playbooks, scenario examples, explicit state machine flows,
  aspect decomposition (Visual Param widgets), or reusable Context-Layered structures.
---

# Context-Action Implementation Playbook

Use this skill when a repository example or scenario should follow the standard implementation-playbook structure.

Do not default every request to a full demo. Start with the smallest shape that still proves the architecture, then iterate upward only if the scenario keeps paying for itself.

## What this skill produces

- a `contexts / business / handlers / actions / hooks / views` split
- pure business modules for draft, validation, result, activity, and state machine
- handlers split by concern such as draft vs submission
- explicit state transitions for async workflow phases
- source registration, docs linkage, and integration tests

## Read these references first

- `references/checklist.md`
- `references/scenario-recipes.md`
- `references/scaffolding.md`
- `references/test-and-doc-linking.md`
- `references/maturity-levels.md`
- `../../docs/ko/context-layered/implementation-convention.md`

If the user is working in English, also read:

- `../../docs/en/context-layered/implementation-convention.md`

## Pick the right target shape first

- Use a **scenario blueprint** when the user wants breadth, pattern transfer, or planning examples across multiple domains
- Use a **discoverable page** when the team needs a visible scenario catalog without full interactivity
- Use a **full interactive example** when the scenario needs real UI behavior, explicit workflow transitions, and integration tests

## Workflow

1. Define the scenario contract
   - What is the draft?
   - What is being validated?
   - What result is produced?
   - Which async phases need an explicit state machine?

2. Create context boundaries
   - Action context for intent
   - Store context for draft, validation, submission/review, activity
   - Ref context only when imperative focus or scrolling is needed

3. Split `business/`
   - `*Draft.ts`
   - `*Validation.ts`
   - `*Result.ts` or domain-specific result module
   - `*Activity.ts`
   - `*StateMachine.ts`
   - optional barrel `*Business.ts`

4. Split `handlers/`
   - draft/edit/reset handlers
   - submission/review/approval handlers
   - support file for mapping domain outputs into view text

5. Keep the view thin
   - render subscribed state
   - emit action helpers
   - no embedded business rules

6. Add verification
   - invalid flow
   - valid flow
   - post-success draft change invalidates old result
   - reset restores baseline

7. Add discoverability
   - source registration
   - example docs
   - scenario library or overview entry

8. Run the iteration loop
   - check whether transitions are explicit enough
   - check whether activity entries derive from domain events
   - check whether the view still contains business logic
   - decide whether the scenario should remain a blueprint or be promoted

## Guardrails

- Do not return UI wording directly from validation functions
- Do not mutate workflow state ad hoc in handlers when a state machine should exist
- Do not log final UI strings directly if domain events can be logged first
- Do not put pricing, scoring, approval, or validation rules into `views/`

## Exit criteria

- the scenario follows the standard layer split
- the async workflow has explicit transitions when needed
- the example is visible from docs or the example app
- tests and builds pass

## Large-Scale Component & Stylesheet Modularization Protocol (대형 컴포넌트 및 스타일 모듈화 규약)

When existing files become bloated during feature additions or studio tool authoring:

### 1. Diagnostic Thresholds (진단 기준)
- **Code Files (> 500 ~ 800 lines)**:
  - If a component (`InspectorPanel.tsx`, `Canvas.tsx`) accumulates multiple aspect controls (alignment, radius, constraints, rotation, shadow, gradient, box model), sub-trees (layers, multi-select), or direct event dragging, it **MUST** be decomposed.
- **Stylesheets (> 1,000 ~ 2,000 lines)**:
  - If a single `styles.css` exceeds 1,500 lines, it **MUST** be split into domain-scoped stylesheets with an automated build assembly pipeline.

### 2. 5-Tier Modularization Units (5계층 모듈화 단위)
1. **Tier 1: Read-Only Projection vs Intent Dispatch**:
   - Keep views/panels purely projection-based (`useSyncExternalStore`).
   - Mutations dispatch typed JSON-safe actions via `ActionRuntime.dispatch({ type, payload })`.
2. **Tier 2: Aspect Decomposition (Visual Param Modular Widgets)**:
   - Extract independent visual parameter widgets into isolated sub-components (`inspector/visual-param/`):
     `AlignmentControl`, `CornerRadiusControl`, `ConstraintsControl`, `RotationPivotControl`, `BoxShadowControl`, `GradientControl`, `BoxModelControl`.
   - Internalize self-contained interaction math (e.g. SVG dial dragging, `Math.atan2`) inside the widget so the parent remains thin.
3. **Tier 3: Sub-Tree, Hook & Direct Manipulation Decoupling**:
   - Extract tree structures and batch controls into dedicated folders (`inspector/layers/`, `inspector/multi-select/`).
   - Extract reactive form states, debounced commits, and domain handlers into custom hooks (e.g., `useInspectorNodeActions.ts`).
   - Extract canvas gestures, 5px magnet snapping, 4-corner resizing, rotation dial trigonometry, and rubber-band marquee selection into dedicated hooks (e.g., `useCanvasDirectManipulation.ts`).
   - Keep panels and canvases as lightweight (< 250~300 lines) pure declarative presentation layouts.
4. **Tier 4: Transparent View Structure & Visual Minimap**:
   - When separating studio modes/submodes (Layout vs Structure & Flow), prevent visual context loss by embedding an interactive proportional 16:9 minimap (`ssf-preview-box`) with bidirectional node selection highlights.
   - Apply semi-translucent glassmorphism (`backdrop-filter: blur(12px)`, `rgba(15, 23, 42, 0.85)`) to floating HUDs and toolbars to maintain continuous canvas visibility.
5. **Tier 5: Hierarchical Group Deletion Safety**:
   - Use topological sorting (`resolveSafeDeleteCommands`) to delete child nodes first, unbind or delete connected transition actions, and finally delete the parent container to prevent orphaned references.
6. **Tier 6: Domain-Scoped Stylesheet Architecture & Automated Build Pipeline**:
   - Split monolithic CSS into domain files: `src/ui/styles/{base-legacy,layout,inspector-base,modals-and-views,design-system,layers,visual-param,artboard}.css`.
   - Build automated concatenation script (`scripts/build-styles.mjs`) integrated into `scripts/build.mjs` to preserve single-bundle distribution and release verification (`verify-release.mjs`) with zero drift.
7. **Tier 7: Fail-Closed Dual-Gate Verification**:
   - Typecheck with `readonly` arrays (`readonly string[]`) and widened index signatures (`[key: string]: unknown`).
   - Unit tests + React shell tests + Playwright E2E browser tests must pass 100%.
   - Manifest update (`make-manifest.mjs`) and release verification (`verify-release.mjs`) gate check (0 errors).

## Iterative enhancement rule

When this skill is used repeatedly, improve the weakest layer first instead of expanding surface area at random.

Recommended order:

1. split business logic more cleanly
2. add or refine explicit state transitions
3. convert log strings into domain events
4. improve docs and source discoverability
5. only then promote blueprint scenarios into full demos
