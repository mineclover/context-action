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
    throw new Error(`Missing required conditional permission file: ${relativeFile}`);
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
    'example/src/pages/patterns/conditional/contexts/ConditionalPatternsContexts.tsx',
  business:
    'example/src/pages/patterns/conditional/business/permission-rules.ts',
  actions:
    'example/src/pages/patterns/conditional/actions/usePermissionActions.ts',
  handlers:
    'example/src/pages/patterns/conditional/handlers/PermissionHandlerRegistry.tsx',
  page: 'example/src/pages/patterns/conditional/PermissionBasedExecution.tsx',
  legacy: 'example/src/pages/patterns/conditional/stores/index.tsx',
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
  /<ConditionalActionProvider>[\s\S]*<ConditionalStoreProvider>/,
  'Action → Store provider composition'
);
assertContains(
  'business',
  sources.business,
  /export function evaluatePermission\(/,
  'pure permission evaluation'
);
assertNotContains(
  'business',
  sources.business,
  /from ['"](?:react|@context-action\/)/,
  'framework runtime'
);
assertContains(
  'actions',
  sources.actions,
  /useConditionalAction\(/,
  'semantic action dispatch facade'
);
assertContains(
  'actions',
  sources.actions,
  /checkPermission: useCallback/,
  'permission command'
);
assertContains(
  'actions',
  sources.actions,
  /executeSecureAction: useCallback/,
  'secure action command'
);
assertNotContains(
  'actions',
  sources.actions,
  /useConditionalActionHandler|useConditionalStoreManager/,
  'handler registration or store manager exposure'
);
assertContains(
  'handlers',
  sources.handlers,
  /useConditionalActionHandler\(/,
  'handler registration through the Registry'
);
assertContains(
  'handlers',
  sources.handlers,
  /evaluatePermission\(/,
  'business permission delegation'
);
assertContains(
  'handlers',
  sources.handlers,
  /if \(!permissionCheck\.allowed\)/,
  'fail-secure service permission guard'
);
assertContains(
  'handlers',
  sources.handlers,
  /executeSecureOperation\(\s*payload\.action,\s*payload\.userId,\s*payload\.payload/s,
  'complete secure-operation argument forwarding'
);
assertContains(
  'page',
  sources.page,
  /usePermissionActions\(/,
  'semantic action facade consumption'
);
assertNotContains(
  'page',
  sources.page,
  /useConditionalAction|dispatch\(/,
  'raw action dispatch'
);
assertContains(
  'legacy',
  sources.legacy,
  /export \* from ['"]\.\.\/contexts\/ConditionalPatternsContexts['"];/,
  'legacy stores compatibility re-export'
);

console.log('Conditional permission usecase convention check');
console.log('- contexts: Action → Store provider boundary');
console.log('- business: pure role/action permission evaluation');
console.log('- actions: semantic check and secure-operation commands');
console.log('- handlers: Registry orchestration with fail-secure guard');
console.log('- page: facade-driven presentation and store subscriptions');
