/** Runs only in the isolated consumer containing the pinned compilers. */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { compile } from 'svelte/compiler';
import { parse, compileScript, compileTemplate } from '@vue/compiler-sfc';
import ts from 'typescript';

const svelteSource = readFileSync('patterns/svelte/Host.svelte', 'utf8');
const vueSource = readFileSync('patterns/vue/Host.vue', 'utf8');
mkdirSync('compiled/svelte', { recursive: true });
mkdirSync('compiled/vue', { recursive: true });
for (const server of [false, true]) {
  const name = server ? 'Host.server.js' : 'Host.js';
  writeFileSync(`compiled/svelte/${name}`, compile(svelteSource, { filename: 'Host.svelte', generate: server ? 'server' : 'client' }).js.code);
  const { descriptor } = parse(vueSource);
  const script = compileScript(descriptor, { id: 'element-host-pattern' });
  const template = compileTemplate({
    source: descriptor.template.content, filename: 'Host.vue', id: 'element-host-pattern', ssr: server,
    ssrCssVars: descriptor.cssVars,
    compilerOptions: { bindingMetadata: script.bindings, isCustomElement: tag => tag === 'host-binding-probe' },
  });
  if (template.errors.length) throw new Error(JSON.stringify(template.errors));
  const code = `${script.content.replace('export default', 'const component =')}\n${template.code}
component.${server ? 'ssrRender = ssrRender' : 'render = render'}; export default component;`;
  writeFileSync(`compiled/vue/${name}`, ts.transpileModule(code, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
  }).outputText);
}
