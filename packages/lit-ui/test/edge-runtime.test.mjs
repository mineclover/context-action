import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const packageRoot = path.resolve(import.meta.dirname, '..');

test('SSR entry renders without process, window, or document globals', () => {
  const script = `
delete globalThis.process;
const { LitElement, html, css } = await import('lit');
class EdgeProbeElement extends LitElement {
  static styles = css\`[part='data'] { color: red; }\`;
  static properties = { label: { type: String }, input: { attribute: false } };
  label = 'edge';
  input = { ok: true };
  render() {
    return html\`<span part="data" data-testid="data">\${this.label}:\${JSON.stringify(this.input)}</span>\`;
  }
}
if (!customElements.get('edge-probe-element')) {
  customElements.define('edge-probe-element', EdgeProbeElement);
}
const { renderLitElement, renderLitTemplate } = await import('@context-action/lit-ui/ssr');
const templateOutput = renderLitTemplate(html\`<div part="ruler" data-x="1">ok</div>\`);
const elementOutput = renderLitElement(new EdgeProbeElement());
if (!templateOutput.includes('part="ruler"') || !templateOutput.includes('data-x="1"')) {
  throw new Error('template SSR lost part/data contract');
}
if (!elementOutput.includes('part="data"') || !elementOutput.includes('{&quot;ok&quot;:true}')) {
  throw new Error('element SSR lost part/data/complex value contract');
}
console.log('edge-ok');
`;

  const output = execFileSync(
    process.execPath,
    ['--input-type=module', '--eval', script],
    { cwd: packageRoot, encoding: 'utf8' },
  );

  assert.match(output, /edge-ok/u);
});

test('the hydrate entry does not import the server SSR renderer', () => {
  const esm = readFileSync(path.join(packageRoot, 'dist/hydrate.js'), 'utf8');
  const cjs = readFileSync(path.join(packageRoot, 'dist/hydrate.cjs'), 'utf8');

  assert.doesNotMatch(esm, /from\s+["']@lit-labs\/ssr(?:\/|["'])/u);
  assert.doesNotMatch(cjs, /require\(["']@lit-labs\/ssr(?:\/|["'])/u);
  assert.match(esm, /@lit-labs\/ssr-client/u);
});
