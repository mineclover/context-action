/** Compile and exercise copyable host patterns against pinned, isolated frameworks. */
import { execFileSync } from 'node:child_process';
import { copyFileSync, cpSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyElementHostBrowser } from './verify-element-host-browser.mjs';

const args = process.argv.slice(2).filter(argument => argument !== '--');
if (args.some(argument => argument !== '--browser')) throw new Error('Only --browser is supported');
const browser = args.includes('--browser');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const consumer = mkdtempSync(join(tmpdir(), 'context-action-element-hosts-'));
const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !/^(npm_config|pnpm_config)_/iu.test(key) && key !== 'NODE_PATH'));
const run = (command, args, cwd = root) => execFileSync(command, args, { cwd, env, stdio: 'inherit' });

function expectTemplateFailure(compiler, args, file, source) {
  const target = join(consumer, file);
  writeFileSync(target, source);
  let rejected = false;
  try {
    execFileSync(process.execPath, [join(consumer, compiler), ...args], { cwd: consumer, env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (error) {
    const output = `${error.stdout ?? ''}${error.stderr ?? ''}`;
    if (![1, 2].includes(error.status) || !output.includes(file.split('/').at(-1)) || !/not assignable/.test(output)) throw error;
    rejected = true;
  } finally { rmSync(target); }
  if (!rejected) throw new Error(`${file}: invalid template input was accepted`);
  console.log(`${file}: invalid numeric payload rejected by template compiler`);
}

try {
  if (browser) run(process.execPath, ['--test', join(root, 'scripts/verify-element-host-browser.test.mjs')]);
  run('pnpm', ['--filter', '@context-action/core', 'build']);
  const tarball = join(consumer, 'core.tgz');
  run('pnpm', ['--dir', join(root, 'packages/core'), 'pack', '--out', tarball]);
  writeFileSync(join(consumer, 'package.json'), JSON.stringify({ private: true, type: 'module' }));
  run('npm', ['install', '--ignore-scripts', '--no-save', tarball, 'jsdom@26.1.0',
    'vue@3.5.44', 'svelte@5.57.2', '@angular/core@20.3.34', '@angular/common@20.3.34',
    '@angular/compiler@20.3.34', '@angular/compiler-cli@20.3.34', '@angular/platform-browser@20.3.34',
    '@angular/platform-browser-dynamic@20.3.34', '@angular/platform-server@20.3.34', 'rxjs@7.8.2', 'typescript@5.9.3',
    'vue-tsc@3.3.13', 'svelte-check@4.7.7', '@vue/compiler-sfc@3.5.44', '@vue/server-renderer@3.5.44',
    ...(browser ? ['esbuild@0.28.2'] : [])], consumer);
  cpSync(join(root, 'packages/core/examples/element-hosts'), join(consumer, 'patterns'), { recursive: true });
  for (const file of ['vue.mjs', 'svelte.mjs', 'angular.mjs', 'contract.mjs', 'adapter-contract.mjs', 'server-contract.mjs', 'compile-hosts.mjs',
    ...(browser ? ['browser-main.mjs', 'browser-mounts.mjs'] : [])]) {
    copyFileSync(join(root, 'scripts/fixtures/element-hosts', file), join(consumer, file));
  }
  const compilerOptions = {
    target: 'ES2022', module: 'ES2022', moduleResolution: 'Bundler', lib: ['ES2022', 'DOM', 'DOM.Iterable'],
    strict: true, skipLibCheck: false, noUncheckedIndexedAccess: true, exactOptionalPropertyTypes: true,
    experimentalDecorators: true, useDefineForClassFields: false, rootDir: 'patterns', outDir: 'compiled', types: [],
  };
  writeFileSync(join(consumer, 'tsconfig.json'), JSON.stringify({ compilerOptions, include: ['patterns/**/*.ts', 'patterns/**/*.vue', 'patterns/**/*.svelte'] }));
  run(process.execPath, [join(consumer, 'node_modules/vue-tsc/bin/vue-tsc.js'), '--noEmit', '-p', 'tsconfig.json'], consumer);
  run(process.execPath, [join(consumer, 'node_modules/svelte-check/bin/svelte-check'), '--tsconfig', './tsconfig.json', '--fail-on-warnings'], consumer);
  writeFileSync(join(consumer, 'tsconfig.angular.json'), JSON.stringify({
    compilerOptions, angularCompilerOptions: { strictTemplates: true, strictInjectionParameters: true, compilationMode: 'full' },
    include: ['patterns/**/*.ts'],
  }));
  run(process.execPath, [join(consumer, 'node_modules/@angular/compiler-cli/bundles/src/bin/ngc.js'), '-p', 'tsconfig.angular.json'], consumer);
  expectTemplateFailure('node_modules/vue-tsc/bin/vue-tsc.js', ['--noEmit', '-p', 'tsconfig.json'], 'patterns/vue/Invalid.vue', `
<script setup lang="ts">import Host from './Host.vue';</script>
<template><Host :snapshot="{ input: { count: 'wrong' } }" /></template>
`);
  expectTemplateFailure('node_modules/svelte-check/bin/svelte-check', ['--tsconfig', './tsconfig.json'], 'patterns/svelte/Invalid.svelte', `
<script lang="ts">import Host from './Host.svelte'; import { readable } from 'svelte/store';</script>
<Host source={readable({ input: { count: 'wrong' } })} />
`);
  expectTemplateFailure('node_modules/@angular/compiler-cli/bundles/src/bin/ngc.js', ['--noEmit', '-p', 'tsconfig.angular.json'], 'patterns/angular/invalid-host.component.ts', `
import { Component } from '@angular/core';
import { HostComponent } from './host.component.js';
@Component({ selector: 'invalid-binding-host', standalone: true, imports: [HostComponent],
  template: '<binding-host-example [snapshot]="{ input: { count: wrong } }" />' })
export class InvalidHostComponent { readonly wrong = 'not a number'; }
`);
  run(process.execPath, ['compile-hosts.mjs'], consumer);
  run(process.execPath, ['--conditions=browser', 'adapter-contract.mjs'], consumer);
  for (const framework of ['vue', 'svelte', 'angular']) {
    run(process.execPath, ['--conditions=browser', 'contract.mjs', framework], consumer);
    run(process.execPath, ['server-contract.mjs', framework], consumer);
  }
  console.log('Pinned Vue 3.5.44 / Svelte 5.57.2 / Angular 20.3.34 typed templates and lifecycle evidence passed (JSDOM).');
  if (browser) await verifyElementHostBrowser(consumer, env);
} finally { rmSync(consumer, { recursive: true, force: true }); }
