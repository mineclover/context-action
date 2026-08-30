# ToolContext development track

This directory is repository source for the ToolContext work stream. It is not
an installable `@context-action/react/tools` entry in the React 3 artifact.
Keep it out of public package examples until the ToolContext, protocol, and
Durable Operations release decision is approved.

## Boundary

- `@context-action/tool-protocol` owns schemas, canonical `tools/list` and
  `tools/call` contracts, provider conversion, idempotency keys, provenance,
  and observability projection.
- This source track binds those contracts to a React Provider and an
  `ActionRegister`.
- `@context-action/tool-durable-operations` owns durable record storage,
  fencing, and domain-confirmed recovery. The application owns external
  provider status checks and compensation decisions.

## Invocation contract

- Use `useToolCall()` for new UI-originated calls. It always crosses the
  canonical registry path, including policy, lifecycle events, output budgets,
  idempotency, and durable-operation handling. It accepts `InferActionInputMap`
  input, so optional/defaulted Zod fields can be omitted by the caller; strict
  handlers receive the parsed `InferActionPayloadMap` value instead. Its
  `ToolCallResult.structuredContent` is typed from `InferActionResultMap`.
- Use `useToolResultHandler()` for new handlers that only produce a tool
  result. It registers through core's explicit result phase. Keep
  `useToolHandler()` only when a handler needs the legacy full
  `PipelineController` control-flow surface. When an action declares an
  `outputSchema`, the result hook derives its return and result-controller type
  from `InferActionResultMap`.
- `useToolDispatch()` and `useToolDispatchWithResult()` are raw ActionRegister
  compatibility APIs. They intentionally bypass those canonical boundaries.
- Use `useToolRegistry()` with `listTools()`, `getToolDefinition()`, and
  `callTool()` for provider-neutral integrations. The `toMCP()`, `toOpenAI()`,
  and `toAnthropic()` helpers remain compatibility exporters.

The factory snapshots schema-map membership and the allowlist. Create a new
context when the catalog changes; mutating the caller-owned configuration after
factory creation must not change discovery, validation, or execution.

With strict validation, handlers receive Zod-parsed input, including defaults
and transforms. The durable idempotency fingerprint remains tied to the raw
canonical request so previously stored records keep their compatibility key.
ToolContext accepts timeout only as a safe integer from 0 through
2,147,483,647 ms, matching lifecycle provenance and JavaScript timer behavior.

## Verification

```bash
pnpm --filter @context-action/react test -- ToolContext.test.tsx
pnpm --filter @context-action/react test -- useWebMCPToolScope.test.tsx
pnpm verify:react-webmcp-isolation
```
