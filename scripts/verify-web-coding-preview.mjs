import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';

const rootDirectory = path.resolve(import.meta.dirname, '..');
const compilerPath = path.join(
  rootDirectory,
  'packages/live-code-editor/src/preview-document.ts'
);
const require = createRequire(import.meta.url);
const typescript = require('typescript');
const source = await readFile(compilerPath, 'utf8');
const { outputText } = typescript.transpileModule(source, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
  fileName: compilerPath,
});
const preview = await import(
  'data:text/javascript;base64,' + Buffer.from(outputText).toString('base64')
);

function expect(condition, message) {
  if (!condition) throw new Error(message);
}

function expectEqual(actual, expected, message) {
  const actualText = JSON.stringify(actual);
  const expectedText = JSON.stringify(expected);
  expect(
    actualText === expectedText,
    `${message}\nexpected: ${expectedText}\nactual: ${actualText}`
  );
}

function expectIncludes(sourceText, expected, message) {
  expect(
    sourceText.includes(expected),
    message + '\nexpected to find: ' + expected
  );
}

const files = [
  {
    path: 'index.html',
    language: 'html',
    source:
      '<!doctype html><html><head><link rel="stylesheet" href="styles.css"></head><body><img src="assets/bg.png"><script src="app.js"></script></body></html>',
    kind: 'text',
  },
  {
    path: 'styles.css',
    language: 'css',
    source: 'body { background: url("assets/bg.png"); }',
    kind: 'text',
  },
  {
    path: 'app.js',
    language: 'javascript',
    source: "document.body.dataset.preview = 'ok';",
    kind: 'text',
  },
  {
    path: 'assets/bg.png',
    language: 'asset',
    source: '',
    kind: 'asset',
  },
];

const document = preview.buildPreviewDocument(
  files,
  { 'assets/bg.png': 'blob:asset-proof' },
  9
);

expect(
  preview.findPreviewHtmlFile(files)?.path === 'index.html',
  'index.html must be preferred as the preview entry file.'
);
expectIncludes(
  document,
  'data-workspace-source="styles.css"',
  'Referenced CSS must be inlined with its workspace source marker.'
);
expectIncludes(
  document,
  'url("blob:asset-proof")',
  'Asset URLs inside inlined CSS must resolve to Blob URLs.'
);
expectIncludes(
  document,
  "document.body.dataset.preview = 'ok';",
  'Referenced JavaScript must be inlined into the preview document.'
);
expectIncludes(
  document,
  '<img src="blob:asset-proof">',
  'Asset URLs in HTML elements must resolve to Blob URLs.'
);
expectIncludes(
  document,
  'const revision=9',
  'The preview bridge must carry the workspace revision.'
);
expectIncludes(
  document,
  'context-action.preview.ready',
  'The preview bridge must report its ready message type.'
);

const nestedCssDocument = preview.buildPreviewDocument(
  [
    {
      path: 'index.html',
      language: 'html',
      source:
        '<!doctype html><html><head><link rel="stylesheet" href="css/main.css"></head><body></body></html>',
      kind: 'text',
    },
    {
      path: 'css/main.css',
      language: 'css',
      source:
        '@import "theme/base.css" screen; .hero { background: url("../assets/bg.png"); }',
      kind: 'text',
    },
    {
      path: 'css/theme/base.css',
      language: 'css',
      source: '.hero { background-image: url("../../assets/icon.svg"); }',
      kind: 'text',
    },
    {
      path: 'assets/bg.png',
      language: 'asset',
      source: '',
      kind: 'asset',
    },
    {
      path: 'assets/icon.svg',
      language: 'asset',
      source: '',
      kind: 'asset',
    },
  ],
  {
    'assets/bg.png': 'blob:nested-background',
    'assets/icon.svg': 'blob:nested-icon',
  },
  12
);
expect(
  !nestedCssDocument.includes('@import'),
  'Local CSS @import rules must be inlined into the sandbox document.'
);
expectIncludes(
  nestedCssDocument,
  '@media screen',
  'CSS @import media conditions must be preserved when inlining.'
);
expectIncludes(
  nestedCssDocument,
  'url("blob:nested-background")',
  'Root CSS asset URLs must resolve relative to the importing stylesheet.'
);
expectIncludes(
  nestedCssDocument,
  'url("blob:nested-icon")',
  'Nested CSS asset URLs must resolve relative to their own stylesheet.'
);

const moduleDocument = preview.buildPreviewDocument(
  [
    {
      path: 'index.html',
      language: 'html',
      source:
        '<!doctype html><html><body><script type="module" src="app.js"></script></body></html>',
      kind: 'text',
    },
    {
      path: 'app.js',
      language: 'javascript',
      source:
        "import { message } from './utils.js'; document.body.dataset.module = message;",
      kind: 'text',
    },
    {
      path: 'utils.js',
      language: 'javascript',
      source: "export const message = 'module proof';",
      kind: 'text',
    },
  ],
  {},
  15
);
expectIncludes(
  moduleDocument,
  'https://context-action.local/workspace-module/utils.js',
  'Local JavaScript module imports must be rewritten to workspace module specifiers.'
);
expectIncludes(
  moduleDocument,
  'new Blob([sources[key]]',
  'The preview must create module Blob URLs inside the sandbox runtime.'
);
expect(
  !moduleDocument.includes("from './utils.js'"),
  'The entry module must not retain a relative local import URL.'
);

const cyclicModuleDocument = preview.buildPreviewDocument(
  [
    {
      path: 'index.html',
      language: 'html',
      source:
        '<!doctype html><html><body><script type="module" src="app.js"></script></body></html>',
      kind: 'text',
    },
    {
      path: 'app.js',
      language: 'javascript',
      source: "import './cycle-a.js'; document.body.dataset.cycle = 'ok';",
      kind: 'text',
    },
    {
      path: 'cycle-a.js',
      language: 'javascript',
      source: "import './cycle-b.js'; export const cycle = 'a';",
      kind: 'text',
    },
    {
      path: 'cycle-b.js',
      language: 'javascript',
      source: "import './cycle-a.js'; export const cycle = 'b';",
      kind: 'text',
    },
  ],
  {},
  18
);
expectIncludes(
  cyclicModuleDocument,
  'https://context-action.local/workspace-module/cycle-a.js',
  'Cyclic module graphs must use stable workspace module specifiers.'
);
expectIncludes(
  cyclicModuleDocument,
  'https://context-action.local/workspace-module/cycle-b.js',
  'Cyclic module graphs must include every reachable module source.'
);
expectIncludes(
  cyclicModuleDocument,
  'URL.revokeObjectURL(urls[key])',
  'Module Blob URLs must be released when the sandbox document unloads.'
);
expect(
  !cyclicModuleDocument.includes("from './cycle-a.js'") &&
    !cyclicModuleDocument.includes("from './cycle-b.js'"),
  'Cyclic module imports must not fall back to data-relative URLs.'
);

const dynamicModuleDocument = preview.buildPreviewDocument(
  [
    {
      path: 'index.html',
      language: 'html',
      source:
        '<!doctype html><html><body><script type="module" src="app.js"></script></body></html>',
      kind: 'text',
    },
    {
      path: 'app.js',
      language: 'javascript',
      source: "const load = () => import('./dynamic.js');",
      kind: 'text',
    },
    {
      path: 'dynamic.js',
      language: 'javascript',
      source: 'export const dynamic = "dynamic proof";',
      kind: 'text',
    },
  ],
  {},
  19
);
expectIncludes(
  dynamicModuleDocument,
  'https://context-action.local/workspace-module/dynamic.js',
  'Dynamic local module imports must be included in the bootstrap graph.'
);
expect(
  !dynamicModuleDocument.includes("import('./dynamic.js')"),
  'Dynamic local module imports must not retain relative URLs.'
);

const encodedPathDocument = preview.buildPreviewDocument(
  [
    {
      path: 'index.html',
      language: 'html',
      source:
        '<!doctype html><html><body><script type="module" src="app.js"></script></body></html>',
      kind: 'text',
    },
    {
      path: 'app.js',
      language: 'javascript',
      source: "import { card } from './src/card%20file.js';",
      kind: 'text',
    },
    {
      path: 'src/card file.js',
      language: 'javascript',
      source: 'export const card = "encoded path proof";',
      kind: 'text',
    },
  ],
  {},
  20
);
expectIncludes(
  encodedPathDocument,
  'https://context-action.local/workspace-module/src/card%20file.js',
  'URL-encoded local module paths must resolve to workspace files.'
);

const inlineModuleDocument = preview.buildPreviewDocument(
  [
    {
      path: 'index.html',
      language: 'html',
      source:
        '<!doctype html><html><body><script type="module">import { message } from "./utils.js"; document.body.dataset.inlineModule = message;</script></body></html>',
      kind: 'text',
    },
    {
      path: 'utils.js',
      language: 'javascript',
      source: 'export const message = "inline module proof";',
      kind: 'text',
    },
  ],
  {},
  16
);
expect(
  !inlineModuleDocument.includes('from "./utils.js"'),
  'Inline module imports must use the same local data module boundary.'
);

const blockedModuleDocument = preview.buildPreviewDocument(
  [
    {
      path: 'index.html',
      language: 'html',
      source:
        '<!doctype html><html><body><script type="module" src="app.js"></script></body></html>',
      kind: 'text',
    },
    {
      path: 'app.js',
      language: 'javascript',
      source:
        "import './missing.js'; import 'https://example.com/module.js';",
      kind: 'text',
    },
  ],
  {},
  17
);
expect(
  !blockedModuleDocument.includes("from './missing.js'") &&
    !blockedModuleDocument.includes('https://example.com/module.js'),
  'Missing and external module imports must not remain executable network specifiers.'
);
expectIncludes(
  blockedModuleDocument,
  'Missing%20local%20module%20import',
  'Missing module imports must fail through a bounded data module.'
);
expectIncludes(
  blockedModuleDocument,
  'External%20module%20import%20blocked',
  'External module imports must fail through a bounded data module.'
);

const diagnosticsFiles = [
  {
    path: 'index.html',
    language: 'html',
    source:
      '<!doctype html><html><head><link rel="stylesheet" href="missing.css"><link rel="stylesheet" href="styles.css"></head><body><img src="assets/missing.png"><img src="https://example.com/remote.png"><script src="missing.js"></script><script type="module" src="module.js"></script></body></html>',
    kind: 'text',
  },
  {
    path: 'module.js',
    language: 'javascript',
    source:
      "import './missing-module.js'; import 'react'; import 'https://example.com/module.js';",
    kind: 'text',
  },
  {
    path: 'styles.css',
    language: 'css',
    source:
      '@import "missing-theme.css"; @import url("https://example.com/theme.css"); body { background: url("missing-bg.png"); }',
    kind: 'text',
  },
];
const previewDiagnostics = preview.collectPreviewDiagnostics(diagnosticsFiles);
expectEqual(
  previewDiagnostics.map(({ kind, sourcePath, requestedPath }) => ({
    kind,
    sourcePath,
    requestedPath,
  })),
  [
    {
      kind: 'missing-reference',
      sourcePath: 'index.html',
      requestedPath: 'missing.css',
    },
    {
      kind: 'missing-reference',
      sourcePath: 'index.html',
      requestedPath: 'missing.js',
    },
    {
      kind: 'missing-reference',
      sourcePath: 'module.js',
      requestedPath: './missing-module.js',
    },
    {
      kind: 'unsupported-module-reference',
      sourcePath: 'module.js',
      requestedPath: 'react',
    },
    {
      kind: 'blocked-external-reference',
      sourcePath: 'module.js',
      requestedPath: 'https://example.com/module.js',
    },
    {
      kind: 'missing-reference',
      sourcePath: 'index.html',
      requestedPath: 'assets/missing.png',
    },
    {
      kind: 'missing-reference',
      sourcePath: 'styles.css',
      requestedPath: 'missing-theme.css',
    },
    {
      kind: 'blocked-external-reference',
      sourcePath: 'styles.css',
      requestedPath: 'https://example.com/theme.css',
    },
    {
      kind: 'missing-reference',
      sourcePath: 'styles.css',
      requestedPath: 'missing-bg.png',
    },
  ],
  'Preview diagnostics must report missing local references and blocked CSS imports.'
);
const diagnosticsDocument = preview.buildPreviewDocument(
  diagnosticsFiles,
  {},
  14
);
expect(
  !diagnosticsDocument.includes('@import "missing-theme.css"') &&
    !diagnosticsDocument.includes('@import url("https://example.com/theme.css")'),
  'Unresolved or external CSS imports must not execute inside the preview.'
);

const falsePositiveModuleFiles = [
  {
    path: 'index.html',
    language: 'html',
    source:
      '<!doctype html><html><body><script type="module" src="app.js"></script></body></html>',
    kind: 'text',
  },
  {
    path: 'app.js',
    language: 'javascript',
    source:
      'const example = "import \'./not-a-module.js\'"; const pattern = /import \'not-a-module.js\'/; const template = `import \'./not-a-template.js\' ${import(\'./template-module.js\')}`; // export { value } from "./not-a-module.js"',
    kind: 'text',
  },
  {
    path: 'template-module.js',
    language: 'javascript',
    source: 'export const value = "template expression proof";',
    kind: 'text',
  },
];
expectEqual(
  preview.collectPreviewDiagnostics(falsePositiveModuleFiles),
  [],
  'Strings and comments must not become JavaScript module diagnostics.'
);
const falsePositiveModuleDocument = preview.buildPreviewDocument(
  falsePositiveModuleFiles,
  {},
  21
);
expect(
  !falsePositiveModuleDocument.includes('Missing%20local%20module%20import'),
  'Strings and comments must not be rewritten as missing module imports.'
);
expectIncludes(
  falsePositiveModuleDocument,
  'https://context-action.local/workspace-module/template-module.js',
  'Dynamic imports inside template expressions must remain executable.'
);

const boundedModuleFiles = [
  {
    path: 'index.html',
    language: 'html',
    source:
      '<!doctype html><html><body><script type="module" src="app.js"></script></body></html>',
    kind: 'text',
  },
  {
    path: 'app.js',
    language: 'javascript',
    source: Array.from(
      { length: 33 },
      (_, index) => `import './module-${index}.js';`
    ).join(' '),
    kind: 'text',
  },
  ...Array.from({ length: 33 }, (_, index) => ({
    path: `module-${index}.js`,
    language: 'javascript',
    source: `export const module${index} = ${index};`,
    kind: 'text',
  })),
];
const boundedModuleDiagnostics = preview.collectPreviewDiagnostics(
  boundedModuleFiles
);
expectEqual(
  boundedModuleDiagnostics.filter(({ kind }) => kind === 'module-graph-limit')
    .length,
  1,
  'JavaScript module graph limits must produce one bounded diagnostic.'
);

const cyclicCssDocument = preview.buildPreviewDocument(
  [
    {
      path: 'index.html',
      language: 'html',
      source:
        '<!doctype html><html><head><link rel="stylesheet" href="a.css"></head><body></body></html>',
      kind: 'text',
    },
    {
      path: 'a.css',
      language: 'css',
      source: '@import "b.css"; body { color: red; }',
      kind: 'text',
    },
    {
      path: 'b.css',
      language: 'css',
      source: '@import "a.css"; body { color: blue; }',
      kind: 'text',
    },
  ],
  {},
  13
);
expectIncludes(
  cyclicCssDocument,
  'Skipped cyclic workspace @import: a.css',
  'Cyclic CSS imports must terminate with a bounded diagnostic.'
);

const missingHtmlDocument = preview.buildPreviewDocument(
  [
    {
      path: 'README.md',
      language: 'markdown',
      source: '# no preview',
      kind: 'text',
    },
  ],
  {},
  4
);
expectIncludes(
  missingHtmlDocument,
  'Add an HTML entry file',
  'Missing HTML must produce an actionable preview diagnostic.'
);
expectIncludes(
  missingHtmlDocument,
  'const revision=4',
  'Missing HTML diagnostics must still acknowledge the current revision.'
);
expectIncludes(
  missingHtmlDocument,
  'context-action.preview.ready',
  'Missing HTML diagnostics must use the same preview bridge.'
);

console.log('Verified standalone preview document contracts.');
