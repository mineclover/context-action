# Scaffolding

Use this when creating a new scenario from scratch.

## Minimal scaffold

```text
ScenarioExample.tsx
ScenarioExamplePage.tsx
contexts/ScenarioContexts.tsx
business/
  scenarioDraft.ts
  scenarioValidation.ts
  scenarioResult.ts
  scenarioActivity.ts
  scenarioStateMachine.ts
  scenarioBusiness.ts
handlers/
  ScenarioHandlers.tsx
  scenarioHandlerSupport.ts
  useScenarioDraftHandlers.tsx
  useScenarioSubmissionHandlers.tsx
actions/useScenarioActions.ts
hooks/useScenarioData.ts
views/ScenarioView.tsx
```

## Required outputs by layer

- `contexts`
  - action payload map
  - store map
  - ref map if imperative focus or scroll exists
- `business`
  - draft defaults
  - validation issues
  - final result or packet
  - activity event union
  - explicit state machine
- `handlers`
  - draft flow
  - submission/review flow
  - mapping helpers
- `hooks`
  - store subscriptions
  - derived labels/messages for the view
- `views`
  - render
  - emit action helpers

## Scaffold decision

- If the scenario has no async workflow, you may skip `*StateMachine.ts`
- If there is no imperative focus or scroll, you may skip RefContext
- If there is no user-facing log or analytics story, `*Activity.ts` can stay small but should still exist when the scenario is meant to teach the pattern
