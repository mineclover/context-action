import assert from 'node:assert/strict';

for (const global of ['window', 'document', 'HTMLElement', 'customElements']) {
  assert.equal(typeof globalThis[global], 'undefined', `server process must not inject ${global}`);
}
const framework = process.argv[2];
const snapshot = { input: { count: 4 }, changed() { throw new Error('Server must not dispatch client requests'); } };
let markup;
if (framework === 'vue') {
  const { createSSRApp, h } = await import('vue');
  const { renderToString } = await import('@vue/server-renderer');
  const { default: Host } = await import('./compiled/vue/Host.server.js');
  markup = await renderToString(createSSRApp({ render: () => h(Host, { snapshot }) }));
} else if (framework === 'svelte') {
  const { render } = await import('svelte/server');
  const { readable } = await import('svelte/store');
  const { default: Host } = await import('./compiled/svelte/Host.server.js');
  markup = render(Host, { props: { source: readable(snapshot) } }).body;
} else {
  await import('@angular/compiler');
  const { renderApplication } = await import('@angular/platform-server');
  const { bootstrapApplication } = await import('@angular/platform-browser');
  const { provideZonelessChangeDetection } = await import('@angular/core');
  const { HostComponent } = await import('./compiled/angular/host.component.js');
  markup = await renderApplication(context => bootstrapApplication(HostComponent, { providers: [provideZonelessChangeDetection()] }, context), {
    document: '<binding-host-example></binding-host-example>', url: 'https://example.test', allowedHosts: ['example.test'],
  });
}
assert.match(markup, /<host-binding-probe/);
assert.doesNotMatch(markup, /\s(?:input|changed)=/);
console.log(`${framework} server shell rendered without browser globals (no hydration claim)`);
