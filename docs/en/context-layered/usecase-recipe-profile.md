# Context-Layered Usecase and Recipe Profile

The existing six-layer structure remains the internal runtime architecture. This profile adds the public boundary needed to connect that runtime to a design-system-based product UI.

## Positioning

```text
Product Scope
  └─ Provider + Handler Registry
       └─ Recipe
            ├─ Astryx primitives
            └─ Usecase Facade
                 └─ Context-Layered Runtime
                      ├─ contexts
                      ├─ business
                      ├─ handlers
                      ├─ actions
                      └─ hooks
```

`Context-Layered Architecture` is the umbrella name. `Usecase Boundary`, `Facade`, and `Recipe` are boundaries within that architecture, not a replacement architecture.

## Why the profile exists

The original six layers explain how Context-Action executes a workflow, but they do not define the public UI boundary clearly enough:

- `actions` and `hooks` can accidentally become an undocumented public API
- `views` can mix pure rendering with product-level composition
- an Astryx primitive can become coupled to domain state or `context-action`

This profile makes the ownership explicit:

| Boundary | Owns | Must not own |
| --- | --- | --- |
| Domain business | Pure validation, calculation, state transitions | React, stores, UI wording |
| Runtime | Contexts, handlers, dispatch, subscriptions | Astryx components |
| Facade | Stable commands and view model | Layout and visual policy |
| Recipe | Astryx composition and prop mapping | Domain rules and raw dispatch |
| Product scope | Provider, registry, route, external data | Individual handler details |

## Canonical feature structure

Existing features can keep the six-layer folders and add the two public boundaries:

```text
access-request/
├── contexts/
├── business/
├── handlers/
├── actions/
├── hooks/
├── facade/
│   └── useAccessRequestFacade.ts
├── recipes/
│   └── AccessRequestRecipe.tsx
├── views/
└── AccessRequestPage.tsx
```

For new features, grouping runtime implementation is also valid:

```text
feature/
├── contract/
├── domain/
├── runtime/
│   ├── contexts/
│   ├── handlers/
│   ├── actions/
│   └── hooks/
├── facade/
├── recipe/
└── scope/
```

Use the first form when preserving an existing feature. Use the second form for a new feature with a clear package boundary.

## Facade convention

The facade is the only public React-facing API for a feature runtime.

```tsx
const vm = useAccessRequestFacade();

vm.workflow.phase;
vm.canSubmit;
vm.commands.changeReason(value);
vm.commands.submit();
```

Rules:

- expose nouns for state and verbs for commands
- do not expose handler IDs, store managers, or raw `dispatch`
- derive values such as `isOpen`, `isBusy`, and `canSubmit` in the facade
- keep async result, abort, retry, and error normalization inside the facade

Recommended names:

```text
AccessRequestProvider
AccessRequestHandlerRegistry
useAccessRequestFacade
AccessRequestRecipe
```

## Recipe convention

Recipes compose Astryx-style primitives and map the facade view model to controlled props.

```tsx
function AccessRequestRecipe() {
  const vm = useAccessRequestFacade();

  return (
    <Drawer
      isOpen={vm.workflow.resourceId != null}
      onClose={vm.commands.close}
    >
      <Textarea
        value={vm.workflow.reason}
        onChange={vm.commands.changeReason}
      />
      <Button
        isLoading={vm.isBusy}
        isDisabled={!vm.canSubmit}
        onClick={vm.commands.submit}
      />
    </Drawer>
  );
}
```

Recipe rules:

- import the design-system primitives and the feature facade
- preserve controlled props such as `isOpen`, `value`, `isLoading`, and `status`
- keep focus, ARIA, keyboard, and intrinsic interaction behavior in primitives
- never import `context-action` directly in a primitive
- never implement validation or business transitions in JSX

## Action and handler naming

Usecase actions describe intent, not storage mutation:

```text
selectResource
changeReason
submitRequest
cancelRequest
retryRequest
resetRequest
```

Handler IDs describe the feature, action, and stage:

```text
access-request.submit.validation
access-request.submit.policy
access-request.submit.request
access-request.submit.audit
```

Suggested priority bands:

| Priority | Stage | Blocking |
| ---: | --- | --- |
| 100 | Contract and input validation | yes |
| 80 | Policy and permission checks | yes |
| 50 | Business operation or request | yes |
| 20 | View synchronization | normally no |
| 10 | Audit and telemetry | no |

## Design-system boundary

The recipe is the integration point for Astryx-like conventions:

- neutral canvas and surface roles
- semantic accent and muted selected state
- subtle elevation rather than decorative gradients
- visible focus ring and keyboard-safe controls
- status text paired with a semantic state, never color alone
- controlled/uncontrolled behavior only for intrinsic component interaction

The Live Code Editor's **Usecase boundary** example is the reference implementation for this profile. It demonstrates the complete path in one browser surface:

```text
Contract → Runtime → Facade → Recipe → Activity / Result
```

## Verification gates

Every profile implementation should verify:

1. domain functions independently
2. handler ordering, blocking, abort, and result collection
3. facade derivation and command stability
4. recipe controlled props, focus, and status states
5. browser happy path and invalid path
6. no direct runtime import from design-system primitives

Start with:

- [Live Code Editor](/example/integrations/live-code-editor)
- [Action Lifecycle Workbench](/example/integrations/action-lifecycle)
- [Access Request Playbook](../examples/access-request-playbook)
