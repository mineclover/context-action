import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
);

function readSource(relativeFile) {
  const filePath = path.join(repositoryRoot, relativeFile);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing required context-store pattern file: ${relativeFile}`);
  }
  return fs.readFileSync(filePath, 'utf8');
}

function assertContains(relativeFile, source, pattern, description) {
  if (!pattern.test(source)) {
    throw new Error(`${relativeFile} does not expose ${description}`);
  }
}

function assertNotContains(relativeFile, source, pattern, description) {
  if (pattern.test(source)) {
    throw new Error(`${relativeFile} crosses the ${description} boundary`);
  }
}

const files = {
  contexts:
    'example/src/pages/performance/mouse-events/context-store-pattern/contexts/MouseEventsContexts.tsx',
  provider:
    'example/src/pages/performance/mouse-events/context-store-pattern/providers/MouseEventsProvider.tsx',
  registry:
    'example/src/pages/performance/mouse-events/context-store-pattern/handlers/MouseEventsHandlerRegistry.tsx',
  container:
    'example/src/pages/performance/mouse-events/context-store-pattern/containers/ContextStoreMouseEventsContainer.tsx',
  view:
    'example/src/pages/performance/mouse-events/context-store-pattern/components/ContextStoreMouseEventsView.tsx',
  enhancedView:
    'example/src/pages/performance/mouse-events/context-store-pattern/components/EnhancedContextStoreView.tsx',
  readme:
    'example/src/pages/performance/mouse-events/context-store-pattern/README.md',
};

const sources = Object.fromEntries(
  Object.entries(files).map(([key, relativeFile]) => [
    key,
    readSource(relativeFile),
  ])
);

assertContains(
  'contexts',
  sources.contexts,
  /export \* from ['"]\.\.\/context\/MouseEventsContext['"];/,
  'canonical Context-Action boundary export'
);
assertContains(
  'provider',
  sources.provider,
  /from ['"]\.\.\/contexts\/MouseEventsContexts['"];/,
  'canonical context import'
);
assertContains(
  'registry',
  sources.registry,
  /useMouseEventsActionHandler\(/,
  'Registry handler registration'
);
if ([...sources.registry.matchAll(/useMouseEventsActionHandler\(/g)].length !== 6) {
  throw new Error('registry must register all six mouse actions');
}
assertContains(
  'container',
  sources.container,
  /from ['"]\.\.\/contexts\/MouseEventsContexts['"];/,
  'canonical context import'
);
for (const key of ['provider', 'registry', 'container', 'view', 'enhancedView']) {
  assertNotContains(
    key,
    sources[key],
    /\.\.\/context\/MouseEventsContext/,
    'legacy context implementation import'
  );
}
assertContains(
  'readme',
  sources.readme,
  /contexts\/MouseEventsContexts\.tsx/,
  'canonical context documentation'
);

console.log('Context-store pattern convention check');
console.log('- contexts: canonical boundary with legacy bridge isolated');
console.log('- provider: Action → Store → Registry composition');
console.log('- handlers: six mouse action registrations');
console.log('- consumers: no direct legacy context imports');
