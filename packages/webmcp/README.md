# @context-action/webmcp

Browser adapter for exposing an explicit Context-Action tool scope through the
experimental WebMCP imperative API. It does not create a second registry:
`ToolManagementInterface` remains the authorization, validation, approval, and
durable-execution boundary.

```ts
import { createWebMCPToolScope } from '@context-action/webmcp';

const scope = await createWebMCPToolScope(registry, {
  sessionId: 'shopping-page:42',
  toolNames: ['searchCatalog', 'addToCart'],
  exposedTo: ['https://agent.example'],
});

// Call on page teardown. WebMCP unregisters the scoped tools via AbortSignal.
scope.dispose();
```

For React, import `useWebMCPToolScope` from `@context-action/react/tools` and
pass a memoized options object; the hook unregisters the scope on unmount.

Each scope creates unique correlation IDs for canonical calls. WebMCP does not
provide a stable native retry identity, so idempotency is disabled by default;
pass `getIdempotencyKey` only with a domain-owned retry key. Use
`beforeExecute(invocation)` for application-owned, abortable UI preparation.
The package follows the current `execute(input)` Draft callback and does not
claim support for the older `ModelContextClient` experiment.

The adapter is safe to import during SSR and in unsupported browsers: it
returns `{ supported: false, activeTools: [] }` when `document.modelContext`
is unavailable. It only exposes the requested `toolNames`; omitting the list
does not publish the entire registry.

WebMCP itself requires a visible browsing context, origin isolation, and the
browser `tools` Permissions Policy. Cross-origin exposure must be explicitly
listed through `exposedTo`; this adapter accepts HTTPS origins and local HTTP
origins only for local development.
