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
    throw new Error(`Missing enhanced context-store file: ${relativeFile}`);
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

const root = 'example/src/pages/performance/mouse-events/enhanced-context-store';
const files = {
  contexts: `${root}/contexts/EnhancedContextStoreContexts.tsx`,
  provider: `${root}/providers/EnhancedContextStoreProvider.tsx`,
  actions: `${root}/actions/useEnhancedMouseActions.ts`,
  business: `${root}/business/enhanced-mouse-event-rules.ts`,
  handlers: `${root}/handlers/EnhancedContextStoreHandlerRegistry.tsx`,
  compatibility: `${root}/context/MouseEventsModel.tsx`,
  view: `${root}/components/EnhancedContextStoreView.tsx`,
};

const sources = Object.fromEntries(
  Object.entries(files).map(([key, relativeFile]) => [
    key,
    readSource(relativeFile),
  ])
);

for (const factory of [
  'createStoreContext',
  'createActionContext',
  'createRefContext',
]) {
  assertContains('contexts', sources.contexts, new RegExp(factory), factory);
}
assertContains(
  'provider',
  sources.provider,
  /MouseActionProvider[\s\S]*MouseStoreProvider[\s\S]*MouseRefProvider[\s\S]*EnhancedContextStoreHandlerRegistry/,
  'Action → Store → Ref → Registry provider composition'
);
assertContains(
  'actions',
  sources.actions,
  /useMouseAction/,
  'typed action dispatch bridge'
);
for (const command of [
  'updatePosition',
  'recordClick',
  'enterArea',
  'leaveArea',
  'reset',
]) {
  assertContains(
    'actions',
    sources.actions,
    new RegExp(`const ${command} =`),
    `${command} semantic command`
  );
}
for (const rule of [
  'calculateMovement',
  'activityAfterMovement',
  'clicksAfterClick',
  'computedMetricsFromState',
]) {
  assertContains(
    'business',
    sources.business,
    new RegExp(`function ${rule}`),
    `${rule} pure business rule`
  );
}
assertNotContains(
  'business',
  sources.business,
  /from ['"](?:react|@context-action)/,
  'framework dependency from business rules'
);
assertContains(
  'handlers',
  sources.handlers,
  /from ['"]\.\.\/contexts\/EnhancedContextStoreContexts['"];/,
  'canonical Context-Action import'
);
if (
  [...sources.handlers.matchAll(/useMouseActionHandler\(/g)].length !== 5
) {
  throw new Error('handlers must register all five enhanced mouse actions');
}
assertContains(
  'compatibility',
  sources.compatibility,
  /export \* from ['"]\.\.\/contexts\/EnhancedContextStoreContexts['"];/,
  'legacy context compatibility export'
);
assertContains(
  'compatibility',
  sources.compatibility,
  /EnhancedContextStoreProvider as MouseEventsModelProvider/,
  'legacy provider compatibility export'
);
assertNotContains(
  'view',
  sources.view,
  /EnhancedContextStoreHandlerRegistry/,
  'handler registration from the View'
);

const consumerFiles = [
  `${root}/handlers/EnhancedContextStoreHandlerRegistry.tsx`,
  `${root}/hooks/useAdvancedCanvasControl.ts`,
  `${root}/hooks/useCanvasDirectControl.ts`,
  `${root}/hooks/useMouseEventsLogic.ts`,
  `${root}/hooks/useMouseEventsTriggers.ts`,
  `${root}/hooks/useMouseEventsViewState.ts`,
  `${root}/hooks/useMetricsOnly.ts`,
  `${root}/hooks/useReactiveMountState.ts`,
  `${root}/hooks/useStoreDataAccess.ts`,
];
for (const relativeFile of consumerFiles) {
  assertNotContains(
    relativeFile,
    readSource(relativeFile),
    /\.\.\/context\/MouseEventsModel/,
    'legacy context implementation import'
  );
}

for (const page of [
  'EnhancedContextStorePage.tsx',
  'EnhancedContextStorePageRefactored.tsx',
  'NonReactiveContextStorePage.tsx',
  'NonReactiveContextStorePageRefactored.tsx',
]) {
  const relativeFile = `${root}/${page}`;
  assertContains(
    relativeFile,
    readSource(relativeFile),
    /EnhancedContextStoreProvider/,
    'canonical provider composition'
  );
}

console.log('Enhanced context-store convention check');
console.log('- contexts: typed Store, Action, and Ref contracts');
console.log('- business: pure movement, click, activity, and metric rules');
console.log('- actions: semantic mouse command facade');
console.log('- provider: Action → Store → Ref → Registry composition');
console.log('- handlers: five action registrations outside the View');
console.log('- compatibility: legacy model path re-export retained');
