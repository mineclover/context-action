# Typed Element host patterns

Copyable Vue directive, Svelte action and Angular standalone directive examples
over `@context-action/core/element`. These are repository examples, **not new
package exports or released framework adapters**. Copy the chosen adapter and
`shared/connect-binding.ts` together; the counter contract/templates are an
executable reference, not a required component API.

- [English integration guide](../../docs/element-host-patterns.en.md)
- [한국어 통합 가이드](../../docs/element-host-patterns.ko.md)
- [Shared ownership/lifecycle contract](../../docs/element-interop.md)

```sh
pnpm verify:element-hosts
pnpm verify:element-host-browser # requires a connected ego-browser runtime
```

This focused gate compiles the actual sources/templates, requires invalid
payloads to fail template checking, runs their client lifecycle in JSDOM, and
renders inert server shells in fresh processes without browser globals.
The opt-in browser gate also bundles those compiled client sources, uses real
framework applications (no Angular TestBed), and verifies one trusted Shadow DOM
click plus 17 lifecycle checks per framework through ego-browser. It starts only
a temporary loopback fixture server and closes its owned browser space/server.
Neither gate certifies hydration, FACE, or a Preact/Lit renderer cross-product.
