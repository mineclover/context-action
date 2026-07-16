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
    throw new Error(`Missing required live usecase file: ${relativeFile}`);
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
    'example/src/pages/integrations/live-code-editor/usecase/LiveUsecaseContexts.tsx',
  rules:
    'example/src/pages/integrations/live-code-editor/usecase/business/live-usecase-rules.ts',
  domain:
    'example/src/pages/integrations/live-code-editor/usecase/business/live-usecase-domain.ts',
  activity:
    'example/src/pages/integrations/live-code-editor/usecase/business/live-usecase-activity.ts',
  handlers:
    'example/src/pages/integrations/live-code-editor/usecase/LiveUsecaseHandlerRegistry.tsx',
  facade:
    'example/src/pages/integrations/live-code-editor/usecase/useLiveUsecaseFacade.ts',
  recipe:
    'example/src/pages/integrations/live-code-editor/usecase/LiveUsecaseRecipe.tsx',
  page: 'example/src/pages/integrations/live-code-editor/LiveCodeEditorPage.tsx',
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
assertContains('rules', sources.rules, /validateUsecaseReason\(/, 'pure request validation');
assertContains('rules', sources.rules, /createReviewPacket\(/, 'pure packet construction');
assertContains('domain', sources.domain, /UsecaseWorkflowState/, 'workflow domain state');
assertContains('domain', sources.domain, /UsecasePacket/, 'workflow result type');
assertContains('activity', sources.activity, /appendUsecaseActivity\(/, 'pure activity append');
assertContains('handlers', sources.handlers, /useLiveUsecaseActionHandler\(/, 'handler registry');
assertContains('handlers', sources.handlers, /validateUsecaseReason\(/, 'business validation delegation');
assertContains('handlers', sources.handlers, /createReviewPacket\(/, 'business result delegation');
assertContains('handlers', sources.handlers, /appendUsecaseActivity\(/, 'activity business delegation');
assertContains('facade', sources.facade, /useStoreValue\(/, 'reactive store subscriptions');
assertContains('facade', sources.facade, /commands:/, 'stable command facade');
assertContains('recipe', sources.recipe, /useLiveUsecaseFacade\(/, 'facade consumption');
assertContains('page', sources.page, /<LiveUsecaseProviders>/, 'provider composition');

for (const key of ['domain', 'rules', 'activity']) {
  assertNotContains(
    key,
    sources[key],
    /from ['"](?:react|@context-action\/)/,
    'framework and view runtime'
  );
}

assertNotContains(
  'facade',
  sources.facade,
  /useLiveUsecaseActionHandler|useLiveUsecaseStoreManager/,
  'handler registration or store manager exposure'
);
assertNotContains(
  'recipe',
  sources.recipe,
  /from ['"]@context-action\//,
  'direct framework access from the recipe'
);
assertNotContains(
  'recipe',
  sources.recipe,
  /validateUsecaseReason|createReviewPacket|dispatch\(/,
  'business or raw dispatch logic'
);
assertNotContains(
  'handlers',
  sources.handlers,
  /reason\.trim\(\)\.length\s*</,
  'inline validation rule'
);
assertNotContains(
  'handlers',
  sources.handlers,
  /priority:\s*workflow\.resourceId\s*===/,
  'inline packet calculation'
);

console.log('Live Code Editor usecase convention check');
console.log('- contexts: action + store providers');
console.log('- business: pure validation, packet, and activity functions');
console.log('- handlers: registry orchestration only');
console.log('- facade: reactive view model + stable commands');
console.log('- recipe: facade-driven presentation only');
