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
    throw new Error(`Missing required Core Advanced file: ${relativeFile}`);
  }
  return fs.readFileSync(filePath, 'utf8');
}

function assertContains(name, source, pattern, description) {
  if (!pattern.test(source)) {
    throw new Error(`${name} must expose ${description}`);
  }
}

function assertNotContains(name, source, pattern, description) {
  if (pattern.test(source)) {
    throw new Error(`${name} crosses the ${description} boundary`);
  }
}

const files = {
  contexts:
    'example/src/pages/foundations/core/contexts/CoreAdvancedContexts.tsx',
  business:
    'example/src/pages/foundations/core/business/core-advanced-rules.ts',
  handlers:
    'example/src/pages/foundations/core/handlers/CoreAdvancedHandlerRegistry.tsx',
  actions:
    'example/src/pages/foundations/core/actions/useCoreAdvancedActions.ts',
  viewModel:
    'example/src/pages/foundations/core/hooks/useCoreAdvancedViewModel.ts',
  page: 'example/src/pages/foundations/core/AdvancedPage.tsx',
  basicView:
    'example/src/pages/foundations/core/components/BasicActionsDemo.tsx',
  priorityView:
    'example/src/pages/foundations/core/components/PriorityDemo.tsx',
  asyncView: 'example/src/pages/foundations/core/components/AsyncDemo.tsx',
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
  'the page-scoped action context'
);
assertContains(
  'contexts',
  sources.contexts,
  /createStoreContext(?:<|\()/,
  'the page-scoped store context'
);
assertContains(
  'contexts',
  sources.contexts,
  /useConcurrencyQueue:\s*false/,
  'concurrent async action semantics'
);
assertNotContains(
  'business',
  sources.business,
  /from ['"](?:react|@context-action\/)/,
  'framework runtime'
);
assertContains(
  'handlers',
  sources.handlers,
  /useCoreAdvancedActionHandler\(/,
  'handler registration'
);
assertContains(
  'handlers',
  sources.handlers,
  /core-advanced-priority-reset/,
  'registry-owned priority reset'
);
assertContains(
  'actions',
  sources.actions,
  /useCoreAdvancedDispatch\(/,
  'semantic action dispatch facade'
);
assertNotContains(
  'actions',
  sources.actions,
  /useCoreAdvancedStore|useCoreAdvancedStoreManager/,
  'store access from action facade'
);
assertContains(
  'viewModel',
  sources.viewModel,
  /useStoreValue\(/,
  'selective store subscriptions'
);
assertContains(
  'page',
  sources.page,
  /<CoreAdvancedProviders>/,
  'provider and handler composition'
);
assertContains(
  'page',
  sources.page,
  /useCoreAdvancedViewModel\(/,
  'view-model composition'
);

for (const key of ['basicView', 'priorityView', 'asyncView']) {
  assertNotContains(key, sources[key], /new\s+ActionRegister\(/, 'direct register ownership');
  assertNotContains(key, sources[key], /useEffect\(|useState\(/, 'handler or state ownership');
}

console.log('Core Advanced context convention check');
console.log('- contexts: page-scoped Action + Store with concurrent async calls');
console.log('- business: pure count, priority, and async-result rules');
console.log('- handlers: registry-owned mutation, reset, logging, and priority');
console.log('- facade: semantic dispatch + selective subscriptions');
console.log('- views: props-only rendering without direct ActionRegister ownership');
