# WebMCP Browser Tools

`@context-action/webmcp` exposes an explicit subset of a canonical
Context-Action tool registry through Chrome's experimental WebMCP imperative
API. It is a browser adapter, not another registry: validation, authorization,
approval, idempotency, provenance, and durable execution still run through
`ToolManagementInterface`.

> WebMCP is experimental browser functionality. Treat it as a progressive
> enhancement and keep a non-WebMCP UI or server path for unsupported clients.

## Register a capability scope

Use a stable session identifier and name every tool that the page may expose.
An omitted tool is never published implicitly.

```ts
import { createWebMCPToolScope } from '@context-action/webmcp';

const scope = await createWebMCPToolScope(registry, {
  sessionId: 'shopping-page:42',
  toolNames: ['searchCatalog', 'addToCart'],
  exposedTo: ['https://agent.example'],
});

// Call this when the page or feature scope is torn down.
scope.dispose();
```

Each registered WebMCP invocation receives a scope-unique generated tool-call
ID and is executed through `registry.executeModelToolCall()`. The adapter labels the
canonical context with `source: 'model'`, `mode: 'agent'`, and
`metadata.transport: 'webmcp'`. WebMCP does not provide a stable native retry
identity, so idempotency is disabled by default. Supply `getIdempotencyKey`
only when the surrounding workflow has a domain-owned stable retry key.

The adapter follows the 2026-07-21 Community Group Draft callback shape:
`execute(input)`. It does not expose the older experimental
`ModelContextClient` parameter. Use `interaction` for a policy `ask` decision:
it runs after validation and policy evaluation, receives the dispatch signal,
and returns `approved` or `denied`. Use detached `afterExecute` for a
post-execution notification; it is never an approval boundary. Browser API variation
is isolated through `currentWebMCPProfile` or
`@context-action/webmcp/profiles/chrome-legacy`.

Tool names and non-empty descriptions are preflight-validated before anything
is registered. The adapter maps `title`, `readOnlyHint`, and
`untrustedContentHint` to the current Draft; other canonical hints remain
internal. Canonical tool errors resolve to Context-Action's `{ isError: true,
content, error }` envelope by default. Set `errorMode: 'throw'` to reject the
callback instead.

The returned scope reports whether the current document supports WebMCP. In
SSR or unsupported browsers it is inert (`supported: false`) rather than
throwing, so feature detection belongs at the UI boundary.

## React lifecycle integration

`@context-action/react/webmcp` provides an **experimental** hook that owns registration for a
component lifetime. It accepts any `ToolManagementInterface` registry, including
an application-owned manager; the repository's ToolContext is only one
source-track implementation and is not an installable React 3 subpath.
Memoize the registration fields (`sessionId`, `toolNames`, `exposedTo`) so
unrelated renders do not unregister and register the tools again. Execution
metadata and callbacks are read from the latest render without JSON serialization.

```tsx
import { useMemo } from 'react';
import { useWebMCPToolScope } from '@context-action/react/webmcp';

function ShoppingPageTools() {
  const registry = useShoppingToolsRegistry();
  const options = useMemo(() => ({
    sessionId: 'shopping-page:42',
    toolNames: ['searchCatalog', 'addToCart'],
    exposedTo: ['https://agent.example'],
  }), []);

  const { supported, activeTools, error } = useWebMCPToolScope(registry, options);

  if (error) throw error;
  return supported ? <p>Agent tools: {activeTools.join(', ')}</p> : null;
}
```

The hook disposes the scope on unmount, including an asynchronous registration
that resolves after the component has already unmounted.

## Browser and origin requirements

WebMCP registration requires a visible browser or webview context with
`document.modelContext`; `navigator.modelContext` is not the supported API.
Production pages need cross-origin isolation and the `tools` Permissions Policy.

For cross-origin consumers, configure all of the following:

- Register the exact consumer origin with `exposedTo` (HTTPS only; local HTTP
  is accepted only for `localhost`, `127.0.0.1`, and `[::1]`).
- Set the embedding iframe's `allow="tools"` permission when an iframe is
  involved.
- Let the consumer discover tools with its matching `fromOrigins` request.

WebMCP's visibility is not an authorization grant. Keep destructive-action
confirmation and policy rules in the canonical tool registry, and expose the
smallest tool list necessary for the current page.

See Chrome's [WebMCP overview](https://developer.chrome.com/docs/ai/webmcp) and
[imperative API guide](https://developer.chrome.com/docs/ai/webmcp/imperative-api)
for current browser availability and deployment requirements.
