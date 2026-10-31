# FACE exception reproduction

This fixture simulates an `ElementInternals` implementation that rejects both
`setFormValue()` and `setValidity()`.

The page reports the requested state beside the state exposed by the native
internals object. It demonstrates the current defensive fallback behavior:
form value fallback is retained, while native validity remains unchanged after
the rejected write.

Run the examples Vite server with:

```bash
pnpm --filter @context-action/lit-ui exec vite --config examples/vite.config.ts
```

Open `/face-exception.html` and inspect the observed report.
