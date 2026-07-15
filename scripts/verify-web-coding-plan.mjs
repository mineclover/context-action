import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';

const rootDirectory = path.resolve(import.meta.dirname, '..');
const plannerPath = path.join(
  rootDirectory,
  'demos/bolt-style-editor/src/local-agent-plan.ts'
);
const require = createRequire(import.meta.url);
const typescript = require('typescript');
const source = await readFile(plannerPath, 'utf8');
const { outputText } = typescript.transpileModule(source, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
  fileName: plannerPath,
});
const planner = await import(
  'data:text/javascript;base64,' + Buffer.from(outputText).toString('base64')
);

function expectEqual(actual, expected, label) {
  const actualText = JSON.stringify(actual);
  const expectedText = JSON.stringify(expected);
  if (actualText !== expectedText) {
    throw new Error(
      label + '\nexpected: ' + expectedText + '\nactual: ' + actualText
    );
  }
}

expectEqual(
  planner.promptToToolCalls(
    'Update the hero title to "Ship from context" with subtitle "Typed tools keep the preview honest."'
  ),
  [
    {
      name: 'preview.updateHero',
      arguments: {
        title: 'Ship from context',
        subtitle: 'Typed tools keep the preview honest.',
      },
    },
  ],
  'Quoted hero copy must become a typed preview.updateHero call.'
);

expectEqual(
  planner.promptToToolCalls(
    'Add a feature card "Inspectable tools" "Every call leaves a trace."'
  ),
  [
    {
      name: 'preview.addFeature',
      arguments: {
        title: 'Inspectable tools',
        description: 'Every call leaves a trace.',
      },
    },
  ],
  'Quoted card copy must become a typed preview.addFeature call.'
);

expectEqual(
  planner.promptToToolCalls(
    'Replace "old copy" with "new copy" in index.html'
  ),
  [
    {
      name: 'workspace.applyPatch',
      arguments: {
        path: 'index.html',
        search: 'old copy',
        replace: 'new copy',
        occurrence: 'first',
      },
    },
  ],
  'Explicit workspace paths must preserve exact source patch semantics.'
);

expectEqual(
  planner.buildLocalAgentPlan('Make it emerald'),
  [
    { name: 'workspace.getStatus', arguments: {} },
    { name: 'preview.setTheme', arguments: { theme: 'emerald' } },
  ],
  'Visual mutations must include a workspace status preflight.'
);

expectEqual(
  planner.buildLocalAgentPlan('Save the changes', true),
  [
    { name: 'workspace.getStatus', arguments: {} },
    { name: 'workspace.saveCheckpoint', arguments: {} },
  ],
  'Browser-only save must map to workspace.saveCheckpoint.'
);

expectEqual(
  planner.promptToToolCalls('Delete the file'),
  [{ name: 'workspace.listFiles', arguments: {} }],
  'Ambiguous deletion must request a file listing instead of guessing.'
);

expectEqual(
  planner.readResultRevision({ structuredContent: { revision: 7 } }, 2),
  7,
  'Structured tool revisions must advance the local plan.'
);
expectEqual(
  planner.readResultRevision({ structuredContent: {} }, 2),
  2,
  'Missing tool revisions must preserve the fallback revision.'
);

console.log('Verified standalone local-agent planning contracts.');
