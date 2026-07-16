import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import * as ts from 'typescript';

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
);
const exampleSourceRoot = path.join(repositoryRoot, 'example', 'src');
const allowlistPath = path.join(
  repositoryRoot,
  'tools',
  'context-action-lint',
  'transitional-handler-registrations.json'
);
const relativePath = (filePath) =>
  path.relative(repositoryRoot, filePath).split(path.sep).join('/');

const transitionalFiles = new Set(
  JSON.parse(fs.readFileSync(allowlistPath, 'utf8'))
);

function collectSourceFiles(directory) {
  const files = [];

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectSourceFiles(entryPath));
      continue;
    }

    if (/\.(?:ts|tsx)$/.test(entry.name)) {
      files.push(entryPath);
    }
  }

  return files;
}

const directRegistrations = [];
const transitionalRegistrations = [];
const seenTransitionalFiles = new Set();
const providerOrderViolations = [];

const providerLayerRank = {
  action: 0,
  store: 1,
  ref: 2,
  registry: 3,
};

function getJsxTagName(tagName) {
  if (ts.isIdentifier(tagName)) return tagName.text;
  if (ts.isPropertyAccessExpression(tagName)) {
    return `${getJsxTagName(tagName.expression)}.${tagName.name.text}`;
  }
  return null;
}

function getProviderLayer(tagName) {
  if (!tagName) return null;
  if (
    /ActionProvider$/.test(tagName) ||
    /ActionContext\.Provider$/.test(tagName)
  ) {
    return 'action';
  }
  if (
    /(?:Store|Manager)Provider$/.test(tagName) ||
    /Stores\.Provider$/.test(tagName) ||
    /StoreContext\.Provider$/.test(tagName)
  ) {
    return 'store';
  }
  if (/RefProvider$/.test(tagName) || /Refs\.Provider$/.test(tagName)) {
    return 'ref';
  }
  if (/HandlerRegistry$/.test(tagName)) return 'registry';
  return null;
}

function getProviderNodeInfo(node, sourceFile) {
  const tagName = getJsxTagName(node.openingElement.tagName);
  const layer = getProviderLayer(tagName);
  if (!layer) return null;
  const line = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile))
    .line + 1;
  return { tagName, layer, line };
}

function collectNearestProviderNodes(node, sourceFile) {
  const providers = [];

  function visitChild(child) {
    if (ts.isJsxElement(child)) {
      const provider = getProviderNodeInfo(child, sourceFile);
      if (provider) {
        providers.push({ node: child, provider });
        return;
      }
    }
    if (ts.isJsxSelfClosingElement(child)) {
      const tagName = getJsxTagName(child.tagName);
      const layer = getProviderLayer(tagName);
      if (layer) {
        const line = sourceFile.getLineAndCharacterOfPosition(
          child.getStart(sourceFile)
        ).line + 1;
        providers.push({
          node: child,
          provider: { tagName, layer, line },
        });
        return;
      }
    }
    ts.forEachChild(child, visitChild);
  }

  ts.forEachChild(node, visitChild);
  return providers;
}

function findProviderOrderViolations(filePath, source) {
  const scriptKind = filePath.endsWith('.tsx')
    ? ts.ScriptKind.TSX
    : ts.ScriptKind.TS;
  const sourceFile = ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    scriptKind
  );
  const violations = [];

  function visit(node) {
    if (ts.isJsxElement(node)) {
      const outer = getProviderNodeInfo(node, sourceFile);
      if (outer) {
        for (const { provider: inner } of collectNearestProviderNodes(
          node,
          sourceFile
        )) {
          if (
            providerLayerRank[inner.layer] < providerLayerRank[outer.layer]
          ) {
            violations.push({ outer, inner });
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return violations;
}

function countHandlerRegistrations(filePath, source) {
  const scriptKind = filePath.endsWith('.tsx')
    ? ts.ScriptKind.TSX
    : ts.ScriptKind.TS;
  const sourceFile = ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    scriptKind
  );
  let count = 0;

  function visit(node) {
    if (!ts.isCallExpression(node)) {
      ts.forEachChild(node, visit);
      return;
    }

    const expressionName = ts.isIdentifier(node.expression)
      ? node.expression.text
      : ts.isPropertyAccessExpression(node.expression)
        ? node.expression.name.text
        : null;
    if (expressionName && /^use[A-Za-z0-9_]*ActionHandler$/.test(expressionName)) {
      count += 1;
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return count;
}

for (const filePath of collectSourceFiles(exampleSourceRoot)) {
  const repoPath = relativePath(filePath);
  const source = fs.readFileSync(filePath, 'utf8');
  const registrationCount = countHandlerRegistrations(filePath, source);
  const providerViolations = findProviderOrderViolations(filePath, source);
  for (const violation of providerViolations) {
    providerOrderViolations.push({ file: repoPath, ...violation });
  }

  if (registrationCount === 0) continue;

  const isHandlerModule =
    repoPath.includes('/handlers/') || /HandlerRegistry\.(?:ts|tsx)$/.test(repoPath);
  if (isHandlerModule) continue;

  if (transitionalFiles.has(repoPath.replace(/^example\//, ''))) {
    seenTransitionalFiles.add(repoPath.replace(/^example\//, ''));
    transitionalRegistrations.push({ file: repoPath, count: registrationCount });
    continue;
  }

  directRegistrations.push({ file: repoPath, count: registrationCount });
}

console.log('Context-Layered convention check');
console.log(
  `- transitional direct registrations: ${transitionalRegistrations.length} file(s)`
);
for (const entry of transitionalRegistrations) {
  console.log(`  · ${entry.file} (${entry.count} registration(s))`);
}

const staleTransitionalFiles = [...transitionalFiles].filter(
  (file) => !seenTransitionalFiles.has(file)
);
if (staleTransitionalFiles.length > 0) {
  console.error(
    `- stale transitional allowlist entries: ${staleTransitionalFiles.length} file(s)`
  );
  for (const file of staleTransitionalFiles) {
    console.error(`  ✖ example/${file}`);
  }
  process.exitCode = 1;
} else {
  console.log('- stale transitional allowlist entries: 0 file(s)');
}

if (directRegistrations.length > 0) {
  console.error(
    `- invalid direct registrations: ${directRegistrations.length} file(s)`
  );
  for (const entry of directRegistrations) {
    console.error(`  ✖ ${entry.file} (${entry.count} registration(s))`);
  }
  console.error(
    'Move these calls into a domain Handler Registry or a handler module.'
  );
  process.exitCode = 1;
} else {
  console.log('- invalid direct registrations: 0 file(s)');
}

if (providerOrderViolations.length > 0) {
  console.error(
    `- provider-order violations: ${providerOrderViolations.length} occurrence(s)`
  );
  for (const { file, outer, inner } of providerOrderViolations) {
    console.error(
      `  ✖ ${file}:${outer.line} ${outer.tagName} contains ${inner.tagName} at line ${inner.line}`
    );
  }
  console.error(
    'Use Action → Store → Ref → Handler Registry nesting for provider composition.'
  );
  process.exitCode = 1;
} else {
  console.log('- provider-order violations: 0 occurrence(s)');
}
