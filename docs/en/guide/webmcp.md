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

Each registered WebMCP invocation receives a generated tool-call ID and is
executed through `registry.executeModelToolCall()`. The adapter labels the
canonical context with `source: 'model'`, `mode: 'agent'`, and
`metadata.transport: 'webmcp'`. By default, that call ID is also the
idempotency key; supply `getIdempotencyKey` when the surrounding workflow has a
stable retry key.

The returned scope reports whether the current document supports WebMCP. In
SSR or unsupported browsers it is inert (`supported: false`) rather than
throwing, so feature detection belongs at the UI boundary.

## React lifecycle integration

`@context-action/react/tools` provides a hook that owns registration for a
component lifetime. Obtain the canonical registry from your `ToolContext`, and
memoize the options object so unrelated renders do not unregister and register
the tools again.

```tsx
import { useMemo } from 'react';
import { useWebMCPToolScope } from '@context-action/react/tools';

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
