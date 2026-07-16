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
    throw new Error(`Missing required mouse usecase file: ${relativeFile}`);
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
    'example/src/pages/performance/mouse-events/context-store-action-based/contexts/MouseActionContexts.tsx',
  business:
    'example/src/pages/performance/mouse-events/context-store-action-based/business/mouse-rules.ts',
  actionHandlers:
    'example/src/pages/performance/mouse-events/context-store-action-based/actions/MouseActionHandlers.ts',
  registry:
    'example/src/pages/performance/mouse-events/context-store-action-based/handlers/MouseActionHandlerRegistry.tsx',
  container:
    'example/src/pages/performance/mouse-events/context-store-action-based/containers/ContextStoreMouseEventsContainer.tsx',
  view:
    'example/src/pages/performance/mouse-events/context-store-action-based/components/ContextStoreMouseEventsView.tsx',
  wrapper:
    'example/src/pages/performance/mouse-events/context-store-action-based/ContextStoreMouseEventsWrapper.tsx',
  legacy:
    'example/src/pages/performance/mouse-events/context-store-action-based/stores/MouseStoreSchema.tsx',
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
  /createActionContext(?:<|\()/,
  'the action context'
);
assertContains(
  'contexts',
  sources.contexts,
  /createStoreContext(?:<|\()/,
  'the store context'
);
assertContains(
  'contexts',
  sources.contexts,
  /<MouseActionProvider>/,
  'Action provider composition'
);
assertContains(
  'contexts',
  sources.contexts,
  /<MouseStoreProvider\b/,
  'Store provider composition'
);
assertContains(
  'business',
  sources.business,
  /computeValidPath|computeAverageVelocity|computeActivityStatus/,
  'pure mouse calculations'
);
assertNotContains(
  'business',
  sources.business,
  /from ['"](?:react|@context-action\/)/,
  'framework runtime'
);
assertContains(
  'actionHandlers',
  sources.actionHandlers,
  /from ['"]\.\.\/business\/mouse-rules['"];/,
  'business rule delegation'
);
assertNotContains(
  'actionHandlers',
  sources.actionHandlers,
  /\.\.\/stores\/MouseStoreSchema/,
  'legacy store import'
);
assertContains(
  'registry',
  sources.registry,
  /useMouseActionHandler\(/,
  'Registry handler registration'
);
if ([...sources.registry.matchAll(/useMouseActionHandler\(/g)].length !== 6) {
  throw new Error('registry must register all six mouse actions');
}
assertContains(
  'container',
  sources.container,
  /MouseActionHandlerRegistry/,
  'handler Registry composition'
);
assertContains(
  'wrapper',
  sources.wrapper,
  /from ['"]\.\/contexts\/MouseActionContexts['"];/,
  'canonical Context provider import'
);
for (const key of ['container', 'view', 'wrapper']) {
  assertNotContains(
    key,
    sources[key],
    /stores\/MouseStoreSchema/,
    'legacy store import'
  );
}
assertContains(
  'legacy',
  sources.legacy,
  /export \* from ['"]\.\.\/contexts\/MouseActionContexts['"];/,
  'legacy store compatibility re-export'
);

console.log('Context-store action-based mouse convention check');
console.log('- contexts: Action + Store contracts and Provider boundary');
console.log('- business: pure path, velocity, and activity calculations');
console.log('- actions: typed handler factories using business rules');
console.log('- handlers: six action registrations in one Registry');
console.log('- compatibility: legacy store path re-export retained');
