# Integration Profiles

Integration profiles are versioned Context-Action conventions for an external
domain. They do not add that domain's types or business rules to
`@context-action/core`; they supply a catalog of lifecycle, ownership,
compatibility, and evidence requirements.

## Lifecycle

`draft → registered → verified → supported → deprecated`

- **draft**: proposal only; not a consumer contract.
- **registered**: an action/state ownership manifest and consumer are named.
- **verified**: required consumer lifecycle evidence has passed.
- **supported**: the profile is included in compatibility and release evidence.
- **deprecated**: a replacement profile and migration guidance are recorded.

## Interface Intent runtime profile

[`interface-intent-runtime`](../../../catalog/integration-profiles/interface-intent-runtime.v1.json)
is currently **supported**. It supplies four typed actions (`scope.select`,
`scene.select`, `compile.run`, `evaluate.run`) and requires document refs,
revision cancellation, and a pure compiler/evaluator boundary. The canonical
Interface Intent documents remain external authorities; runtime state may hold
only refs, selection, execution status, and derived evidence.

`CapabilityDocument.publicPorts` must use explicit typed bindings. A catalog
string must never become a public TypeScript command automatically.

## Verification

```bash
pnpm integration-profile:check
node scripts/verify-context-action-conventions.mjs
```

External consumers declare the profile they consume and run their own focused
adapter, lifecycle, and route gates. A profile moves to `verified` only when
that evidence is recorded in both the profile and the consumer. It moves to
`supported` only after the compatibility/release evidence is also recorded.
