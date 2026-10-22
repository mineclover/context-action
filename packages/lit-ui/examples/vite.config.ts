import path from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import { renderLitElement } from '../src/ssr.js';
import { HydrationProbeElement } from './hydration/probe-element.js';

const packageRoot = path.resolve(import.meta.dirname, '..');

function litSsrFixture(): Plugin {
  return {
    name: 'lit-ui-ssr-fixture',
    transformIndexHtml(html) {
      if (!html.includes('<!--LIT_SSR_MARKUP-->')) return html;

      const element = new HydrationProbeElement();
      element.label = 'server';
      element.input = { from: 'server' };
      element.innerHTML =
        '<span slot="suffix" data-slot="suffix">Server suffix</span>';

      return html.replace('<!--LIT_SSR_MARKUP-->', renderLitElement(element));
    },
  };
}

export default defineConfig({
  root: import.meta.dirname,
  plugins: [litSsrFixture()],
  server: {
    fs: {
      allow: [packageRoot],
    },
  },
});
