import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import * as ts from 'typescript';

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
);

const DEFAULT_SCAN_ROOTS = [
  'example/src',
  'packages/template-react/src',
];

const DEFAULT_ALLOWLIST_REL =
  'tools/context-action-lint/transitional-handler-registrations.json';
const DEFAULT_CLASSIFICATION_REL =
  'tools/context-action-lint/layered-surface-classification.json';
const DEFAULT_EXCEPTIONS_REL =
  'tools/context-action-lint/rule-exceptions.json';

export const PROMOTED_AST_RULES = new Set([
  'no-deprecated-effect-handler',
  'no-store-access-in-actions',
  'no-store-subscription-in-handlers',
]);

const providerLayerRank = {
  action: 0,
  store: 1,
  ref: 2,
  registry: 3,
};

const layerFileNamePatterns = {
  contexts: /(?:Context|Contexts)\.(?:ts|tsx)$/,
  business: /^[a-z][A-Za-z0-9-]*\.(?:ts|tsx)$/,
  runtime: /^(?:index|[a-z][A-Za-z0-9-]*(?:\.(?:test|spec))?)\.ts$/,
  handlers:
    /^(?:index|handler-registry|[A-Za-z][A-Za-z0-9]*(?:HandlerRegistry|Handlers|HandlerSupport|HandlerDefinitions))\.(?:ts|tsx)$/,
  actions:
    /^(?:index\.(?:ts|tsx)|[A-Za-z][A-Za-z0-9]*(?:Actions|actions)\.(?:ts|tsx))$/,
  hooks: /^(?:index|types|use[A-Z][A-Za-z0-9]*)\.(?:ts|tsx)$/,
  views: /^(?:index|[A-Za-z][A-Za-z0-9]*(?:Views?|Grid))\.tsx$/,
};

const layerBoundaryRules = {
  business: [
    {
      pattern: /^(?:react|@context-action(?:\/|$))/,
      description: 'framework imports from business modules',
    },
  ],
  runtime: [
    {
      pattern: /^react(?:-dom)?(?:\/|$)/,
      description: 'React runtime imports from headless runtime modules',
    },
    {
      pattern: /^(?:\.\.?\/)+(?:contexts|handlers|actions|hooks|views)(?:\/|$)/,
      description: 'UI/React layer imports from headless runtime modules',
    },
  ],
  contexts: [
    {
      pattern: /^(?:\.\.?\/)(?:handlers|actions|hooks|views)(?:\/|$)/,
      description: 'downstream layer imports from context modules',
    },
  ],
  views: [
    {
      pattern: /^(?:@context-action(?:\/|$))/,
      description: 'direct framework imports from view modules',
      runtimeOnly: true,
    },
    {
      pattern: /(?:^|\/)(?:business|handlers|runtime)(?:\/|$)/,
      description: 'domain, runtime, or handler imports from view modules',
      runtimeOnly: true,
    },
  ],
};

const STORE_ACCESS_IMPORT_PATTERN =
  /^(?:use[A-Za-z0-9_]*Store(?:Value|Selector|Path|Manager|Registry)?|useStore(?:Value|Selector|Path|Manager)?|createStore|createStoreContext|createStateStore|createTimeTravelStore|createTimeTravelStoreContext)$/;

const STORE_ACCESS_CALL_PATTERN =
  /^(?:use[A-Za-z0-9_]*Store(?:Value|Selector|Path|Manager|Registry)?|useStore(?:Value|Selector|Path|Manager)?|getStore|setValue|update)$/;

const STORE_SUBSCRIPTION_CALL_PATTERN =
  /^(?:use[A-Za-z0-9_]*Store(?:Value|Selector|Path)|useStore(?:Value|Selector|Path))$/;

const DEPRECATED_EFFECT_HANDLER_CALL_PATTERN =
  /^(?:use[A-Za-z0-9_]*ActionEffectHandler|registerEffect)$/;

const HANDLER_REGISTRATION_CALL_PATTERN =
  /^use[A-Za-z0-9_]*(?:ActionHandler|ActionGuard|ActionCommandHandler|ActionObserver|ActionResultHandler|ActionEffectHandler)$/;

function toPosix(filePath) {
  return filePath.split(path.sep).join('/');
}

function formatDisplayPath(targetPath, baseDir) {
  const rel = path.relative(baseDir, targetPath);
  if (rel && !rel.startsWith('..') && !path.isAbsolute(rel)) {
    return toPosix(rel);
  }
  return toPosix(targetPath);
}

function parseSourceFile(filePath, source) {
  const scriptKind = filePath.endsWith('.tsx')
    ? ts.ScriptKind.TSX
    : ts.ScriptKind.TS;
  return ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    scriptKind
  );
}

function collectSourceFiles(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist') continue;
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

function collectDirectories(directory) {
  const directories = [directory];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist') continue;
    if (!entry.isDirectory()) continue;
    directories.push(...collectDirectories(path.join(directory, entry.name)));
  }
  return directories;
}

function getLineNumber(node, sourceFile) {
  return (
    sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1
  );
}

function getImportIsTypeOnly(node) {
  if (ts.isImportDeclaration(node)) {
    const clause = node.importClause;
    if (!clause) return false;
    if (clause.isTypeOnly) return true;
    if (
      clause.namedBindings &&
      ts.isNamedImports(clause.namedBindings) &&
      clause.namedBindings.elements.length > 0
    ) {
      return clause.namedBindings.elements.every((element) => element.isTypeOnly);
    }
    return false;
  }
  if (ts.isExportDeclaration(node)) return node.isTypeOnly;
  return false;
}

function collectModuleImports(sourceFile) {
  const imports = [];

  function addImport(moduleSpecifier, node, isTypeOnly = false) {
    if (!moduleSpecifier || !ts.isStringLiteral(moduleSpecifier)) return;
    imports.push({
      moduleName: moduleSpecifier.text,
      line: getLineNumber(node, sourceFile),
      isTypeOnly,
    });
  }

  function visit(node) {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
      addImport(node.moduleSpecifier, node, getImportIsTypeOnly(node));
    }
    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword
    ) {
      addImport(node.arguments[0], node);
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return imports;
}

function getCalleeName(node) {
  if (ts.isIdentifier(node.expression)) {
    return node.expression.text;
  }
  if (ts.isPropertyAccessExpression(node.expression)) {
    return node.expression.name.text;
  }
  return null;
}

function getJsxTagName(tagName) {
  if (ts.isIdentifier(tagName)) return tagName.text;
  if (ts.isPropertyAccessExpression(tagName)) {
    const parent = getJsxTagName(tagName.expression);
    return parent ? `${parent}.${tagName.name.text}` : null;
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
  return {
    tagName,
    layer,
    line: getLineNumber(node, sourceFile),
  };
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
        providers.push({
          node: child,
          provider: {
            tagName,
            layer,
            line: getLineNumber(child, sourceFile),
          },
        });
        return;
      }
    }
    ts.forEachChild(child, visitChild);
  }

  ts.forEachChild(node, visitChild);
  return providers;
}

function findProviderOrderViolations(sourceFile) {
  const violations = [];

  function visit(node) {
    if (ts.isJsxElement(node)) {
      const outer = getProviderNodeInfo(node, sourceFile);
      if (outer) {
        for (const { provider: inner } of collectNearestProviderNodes(
          node,
          sourceFile
        )) {
          if (providerLayerRank[inner.layer] < providerLayerRank[outer.layer]) {
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

function countHandlerRegistrations(sourceFile) {
  let count = 0;

  function visit(node) {
    if (ts.isCallExpression(node)) {
      const calleeName = getCalleeName(node);
      if (calleeName && HANDLER_REGISTRATION_CALL_PATTERN.test(calleeName)) {
        count += 1;
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return count;
}

function collectDeprecatedEffectHandlerCalls(sourceFile) {
  const hits = [];

  function visit(node) {
    if (ts.isCallExpression(node)) {
      const calleeName = getCalleeName(node);
      if (
        calleeName &&
        DEPRECATED_EFFECT_HANDLER_CALL_PATTERN.test(calleeName)
      ) {
        hits.push({
          line: getLineNumber(node, sourceFile),
          symbol: calleeName,
        });
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return hits;
}

function collectStoreAccessViolationsInActionFile(sourceFile) {
  const hits = [];

  function visit(node) {
    if (
      ts.isImportDeclaration(node) &&
      node.importClause &&
      !node.importClause.isTypeOnly
    ) {
      const clause = node.importClause;
      if (clause.name && STORE_ACCESS_IMPORT_PATTERN.test(clause.name.text)) {
        hits.push({
          line: getLineNumber(node, sourceFile),
          symbol: clause.name.text,
          kind: 'import',
        });
      }
      if (clause.namedBindings && ts.isNamedImports(clause.namedBindings)) {
        for (const element of clause.namedBindings.elements) {
          if (element.isTypeOnly) continue;
          const importedName = (element.propertyName ?? element.name).text;
          if (STORE_ACCESS_IMPORT_PATTERN.test(importedName)) {
            hits.push({
              line: getLineNumber(element, sourceFile),
              symbol: importedName,
              kind: 'import',
            });
          }
        }
      }
    }

    if (ts.isCallExpression(node)) {
      const calleeName = getCalleeName(node);
      if (calleeName && STORE_ACCESS_CALL_PATTERN.test(calleeName)) {
        hits.push({
          line: getLineNumber(node, sourceFile),
          symbol: calleeName,
          kind: 'call',
        });
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return hits;
}

function collectStoreSubscriptionsInHandlerFile(sourceFile) {
  const hits = [];

  function visit(node) {
    if (ts.isCallExpression(node)) {
      const calleeName = getCalleeName(node);
      if (calleeName && STORE_SUBSCRIPTION_CALL_PATTERN.test(calleeName)) {
        hits.push({
          line: getLineNumber(node, sourceFile),
          symbol: calleeName,
        });
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return hits;
}

function loadTransitionalAllowlist(allowlistPath, baseDir) {
  const entries = new Map();
  if (!allowlistPath) return entries;

  const list = JSON.parse(fs.readFileSync(allowlistPath, 'utf8'));
  if (!Array.isArray(list)) {
    throw new Error(`Transitional allowlist must be an array: ${allowlistPath}`);
  }

  for (const rawEntry of list) {
    if (typeof rawEntry !== 'string' || rawEntry.trim().length === 0) {
      throw new Error(
        `Invalid transitional allowlist entry in ${allowlistPath}`
      );
    }
    const directCandidate = path.resolve(baseDir, rawEntry);
    const legacyCandidate = path.resolve(baseDir, 'example', rawEntry);
    const resolved = fs.existsSync(directCandidate)
      ? directCandidate
      : legacyCandidate;
    entries.set(resolved, rawEntry);
  }

  return entries;
}

function loadSurfaceClassification(classificationPath, baseDir, violations) {
  const classified = new Map();
  if (!classificationPath) return classified;

  const surfaceClassification = JSON.parse(
    fs.readFileSync(classificationPath, 'utf8')
  );
  const classificationBase =
    typeof surfaceClassification.base === 'string' &&
    surfaceClassification.base.length > 0
      ? path.resolve(baseDir, surfaceClassification.base)
      : baseDir;

  for (const category of ['advanced', 'compatibility']) {
    for (const entry of surfaceClassification[category] ?? []) {
      const surfacePath = entry?.path;
      if (typeof surfacePath !== 'string' || surfacePath.length === 0) {
        violations.push({
          category,
          description: 'classification entry must define a non-empty path',
        });
        continue;
      }
      if (
        typeof entry.reason !== 'string' ||
        entry.reason.trim().length === 0
      ) {
        violations.push({
          category,
          path: surfacePath,
          description: 'classification entry must include a non-empty reason',
        });
      }

      const absolutePath = path.resolve(classificationBase, surfacePath);
      if (classified.has(absolutePath)) {
        violations.push({
          category,
          path: surfacePath,
          description: `surface is already classified as ${classified.get(absolutePath).category}`,
        });
        continue;
      }

      if (
        !fs.existsSync(absolutePath) ||
        !fs.statSync(absolutePath).isDirectory() ||
        path.basename(absolutePath) !== 'handlers'
      ) {
        violations.push({
          category,
          path: surfacePath,
          description: 'classified surface must be an existing handlers directory',
        });
        continue;
      }

      classified.set(absolutePath, { category, surfacePath });
    }
  }

  return classified;
}

function loadRuleExceptions(exceptionsPath, baseDir, manifestErrors) {
  const exceptionsByKey = new Map();
  if (!exceptionsPath) return exceptionsByKey;

  if (!fs.existsSync(exceptionsPath)) {
    manifestErrors.push({
      rule: 'manifest',
      file: formatDisplayPath(exceptionsPath, baseDir),
      description: 'rule exception manifest does not exist',
    });
    return exceptionsByKey;
  }

  const parsed = JSON.parse(fs.readFileSync(exceptionsPath, 'utf8'));
  if (!parsed || !Array.isArray(parsed.exceptions)) {
    manifestErrors.push({
      rule: 'manifest',
      file: formatDisplayPath(exceptionsPath, baseDir),
      description: 'rule exception manifest must contain an exceptions array',
    });
    return exceptionsByKey;
  }

  for (const entry of parsed.exceptions) {
    const rule = entry?.rule;
    const file = entry?.file;
    const reason = entry?.reason;

    if (typeof rule !== 'string' || !PROMOTED_AST_RULES.has(rule)) {
      manifestErrors.push({
        rule: String(rule ?? 'unknown'),
        file: String(file ?? ''),
        description: `unknown promoted rule "${String(rule)}" in rule-exceptions manifest`,
      });
      continue;
    }

    if (typeof file !== 'string' || file.trim().length === 0) {
      manifestErrors.push({
        rule,
        file: '',
        description: 'rule exception entry must include a non-empty file path',
      });
      continue;
    }

    if (typeof reason !== 'string' || reason.trim().length === 0) {
      manifestErrors.push({
        rule,
        file,
        description: 'rule exception entry must include a non-empty reason',
      });
      continue;
    }

    const absFile = path.resolve(baseDir, file);
    if (!fs.existsSync(absFile) || !fs.statSync(absFile).isFile()) {
      manifestErrors.push({
        rule,
        file,
        description: 'rule exception target file does not exist on disk',
      });
      continue;
    }

    const key = `${rule}::${absFile}`;
    if (exceptionsByKey.has(key)) {
      manifestErrors.push({
        rule,
        file,
        description: 'duplicate (rule, file) entry in rule-exceptions manifest',
      });
      continue;
    }

    exceptionsByKey.set(key, {
      rule,
      file,
      absFile,
      reason: reason.trim(),
      seen: false,
    });
  }

  return exceptionsByKey;
}

function isHandlerModulePath(filePath) {
  return (
    toPosix(filePath).includes('/handlers/') ||
    /HandlerRegistry\.(?:ts|tsx)$/.test(filePath)
  );
}

export function runContextLayeredConventionCheck(options = {}) {
  const baseDir = path.resolve(options.baseDir ?? repositoryRoot);
  const customRootsProvided =
    Array.isArray(options.roots) && options.roots.length > 0;
  const rawRoots = customRootsProvided ? options.roots : DEFAULT_SCAN_ROOTS;

  const scanRoots = rawRoots.map((root) => path.resolve(baseDir, root));

  const allowlistPath = customRootsProvided
    ? options.allowlistPath
      ? path.resolve(baseDir, options.allowlistPath)
      : null
    : path.resolve(
        baseDir,
        options.allowlistPath ?? DEFAULT_ALLOWLIST_REL
      );

  const classificationPath = customRootsProvided
    ? options.classificationPath
      ? path.resolve(baseDir, options.classificationPath)
      : null
    : path.resolve(
        baseDir,
        options.classificationPath ?? DEFAULT_CLASSIFICATION_REL
      );

  const exceptionsPath = customRootsProvided
    ? options.exceptionsPath
      ? path.resolve(baseDir, options.exceptionsPath)
      : null
    : path.resolve(
        baseDir,
        options.exceptionsPath ?? DEFAULT_EXCEPTIONS_REL
      );

  const directRegistrations = [];
  const transitionalRegistrations = [];
  const staleTransitionalFiles = [];
  const providerOrderViolations = [];
  const layerConventionViolations = [];
  const classificationViolations = [];
  const ruleExceptionErrors = [];
  const activeRuleExceptions = [];
  const astRuleViolations = {
    'no-deprecated-effect-handler': [],
    'no-store-access-in-actions': [],
    'no-store-subscription-in-handlers': [],
  };
  const missingRoots = [];

  for (const scanRoot of scanRoots) {
    if (!fs.existsSync(scanRoot) || !fs.statSync(scanRoot).isDirectory()) {
      missingRoots.push(formatDisplayPath(scanRoot, baseDir));
    }
  }

  if (missingRoots.length > 0) {
    return {
      ok: false,
      scanRoots: scanRoots.map((root) => formatDisplayPath(root, baseDir)),
      missingRoots,
      directRegistrations,
      transitionalRegistrations,
      staleTransitionalFiles,
      providerOrderViolations,
      layeredRoots: [],
      layerConventionViolations,
      classifiedNonCanonicalRoots: [],
      classificationViolations,
      astRuleViolations,
      activeRuleExceptions,
      ruleExceptionErrors,
    };
  }

  const transitionalFiles = loadTransitionalAllowlist(allowlistPath, baseDir);
  const seenTransitionalAbsPaths = new Set();
  const classifiedSurfaces = loadSurfaceClassification(
    classificationPath,
    baseDir,
    classificationViolations
  );
  const ruleExceptionsByKey = loadRuleExceptions(
    exceptionsPath,
    baseDir,
    ruleExceptionErrors
  );

  // Collect canonical layered roots across all scanned roots
  const layeredRoots = [];
  const allDirectories = [];
  for (const scanRoot of scanRoots) {
    for (const directory of collectDirectories(scanRoot)) {
      allDirectories.push(directory);
      if (path.basename(directory) !== 'contexts') continue;
      const root = path.dirname(directory);
      if (fs.existsSync(path.join(root, 'handlers'))) {
        layeredRoots.push(root);
      }
    }
  }

  const canonicalActionsFileSet = new Set();
  const canonicalHandlersFileSet = new Set();
  const parsedFileCache = new Map();

  function getParsedSourceFile(filePath) {
    const resolved = path.resolve(filePath);
    let cached = parsedFileCache.get(resolved);
    if (!cached) {
      const source = fs.readFileSync(resolved, 'utf8');
      const sourceFile = parseSourceFile(resolved, source);
      cached = { source, sourceFile };
      parsedFileCache.set(resolved, cached);
    }
    return cached;
  }

  // Layer file-naming, boundary checks, and canonical layer file collection
  for (const root of layeredRoots) {
    for (const [layer, fileNamePattern] of Object.entries(
      layerFileNamePatterns
    )) {
      const layerDirectory = path.join(root, layer);
      if (!fs.existsSync(layerDirectory)) continue;

      const entries = fs.readdirSync(layerDirectory, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isFile() || !/\.(?:ts|tsx)$/.test(entry.name)) {
          continue;
        }
        const filePath = path.join(layerDirectory, entry.name);
        if (layer === 'actions') canonicalActionsFileSet.add(filePath);
        if (layer === 'handlers') canonicalHandlersFileSet.add(filePath);

        if (!fileNamePattern.test(entry.name)) {
          layerConventionViolations.push({
            kind: 'file-name',
            file: formatDisplayPath(filePath, baseDir),
            layer,
            line: 1,
            description: `file name does not match the ${layer}/ convention`,
          });
        }

        const boundaryRules = layerBoundaryRules[layer] ?? [];
        if (boundaryRules.length === 0) continue;

        const { sourceFile } = getParsedSourceFile(filePath);
        for (const imported of collectModuleImports(sourceFile)) {
          for (const rule of boundaryRules) {
            if (
              (rule.runtimeOnly && imported.isTypeOnly) ||
              !rule.pattern.test(imported.moduleName)
            ) {
              continue;
            }
            layerConventionViolations.push({
              kind: 'boundary',
              file: formatDisplayPath(filePath, baseDir),
              layer,
              line: imported.line,
              description: rule.description,
              moduleName: imported.moduleName,
            });
          }
        }
      }
    }
  }

  // Non-canonical handlers/ classification gate
  const canonicalHandlerRoots = new Set(
    layeredRoots.map((root) => path.join(root, 'handlers'))
  );
  for (const [absoluteDir, info] of [...classifiedSurfaces.entries()]) {
    if (!canonicalHandlerRoots.has(absoluteDir)) continue;
    classificationViolations.push({
      category: info.category,
      path: info.surfacePath,
      description:
        'classified handlers directory is now canonical; remove it from the migration manifest',
    });
    classifiedSurfaces.delete(absoluteDir);
  }

  const handlerDirectories = allDirectories.filter(
    (directory) => path.basename(directory) === 'handlers'
  );
  for (const directory of handlerDirectories) {
    if (canonicalHandlerRoots.has(directory)) continue;
    if (classifiedSurfaces.has(directory)) continue;
    classificationViolations.push({
      path: formatDisplayPath(directory, baseDir),
      description:
        'non-canonical handlers directory is missing an advanced or compatibility classification',
    });
  }

  function recordAstRuleViolation(rule, absFile, line, symbol, description) {
    const key = `${rule}::${absFile}`;
    const exception = ruleExceptionsByKey.get(key);
    const displayFile = formatDisplayPath(absFile, baseDir);
    if (exception) {
      if (!exception.seen) {
        exception.seen = true;
        activeRuleExceptions.push({
          rule,
          file: displayFile,
          reason: exception.reason,
        });
      }
      return;
    }

    astRuleViolations[rule].push({
      file: displayFile,
      line,
      symbol,
      description,
    });
  }

  // Full file scan across all scan roots
  const seenFiles = new Set();
  for (const scanRoot of scanRoots) {
    for (const rawFilePath of collectSourceFiles(scanRoot)) {
      const filePath = path.resolve(rawFilePath);
      if (seenFiles.has(filePath)) continue;
      seenFiles.add(filePath);

      const displayFile = formatDisplayPath(filePath, baseDir);
      const { sourceFile } = getParsedSourceFile(filePath);

      for (const violation of findProviderOrderViolations(sourceFile)) {
        providerOrderViolations.push({ file: displayFile, ...violation });
      }

      const registrationCount = countHandlerRegistrations(sourceFile);
      if (registrationCount > 0 && !isHandlerModulePath(filePath)) {
        if (transitionalFiles.has(filePath)) {
          seenTransitionalAbsPaths.add(filePath);
          transitionalRegistrations.push({
            file: displayFile,
            count: registrationCount,
          });
        } else {
          directRegistrations.push({
            file: displayFile,
            count: registrationCount,
          });
        }
      }

      // Promoted Rule 1: no-deprecated-effect-handler (all files)
      for (const hit of collectDeprecatedEffectHandlerCalls(sourceFile)) {
        recordAstRuleViolation(
          'no-deprecated-effect-handler',
          filePath,
          hit.line,
          hit.symbol,
          `deprecated ${hit.symbol}() call; migrate to useActionGuard() or useActionObserver()`
        );
      }

      // Promoted Rule 2: no-store-access-in-actions (canonical actions/ files)
      if (canonicalActionsFileSet.has(filePath)) {
        for (const hit of collectStoreAccessViolationsInActionFile(sourceFile)) {
          const detail =
            hit.kind === 'import'
              ? `runtime store import "${hit.symbol}" is forbidden inside actions/; expose dispatch helpers only`
              : `store access call "${hit.symbol}()" is forbidden inside actions/; perform Store reads/writes in handlers/`;
          recordAstRuleViolation(
            'no-store-access-in-actions',
            filePath,
            hit.line,
            hit.symbol,
            detail
          );
        }
      }

      // Promoted Rule 3: no-store-subscription-in-handlers (canonical handlers/ and *HandlerRegistry files)
      if (
        canonicalHandlersFileSet.has(filePath) ||
        isHandlerModulePath(filePath)
      ) {
        for (const hit of collectStoreSubscriptionsInHandlerFile(sourceFile)) {
          recordAstRuleViolation(
            'no-store-subscription-in-handlers',
            filePath,
            hit.line,
            hit.symbol,
            `reactive subscription "${hit.symbol}()" is forbidden inside handlers/; read state lazily with store.getValue()`
          );
        }
      }
    }
  }

  for (const [absFile, rawEntry] of transitionalFiles.entries()) {
    if (!seenTransitionalAbsPaths.has(absFile)) {
      staleTransitionalFiles.push(rawEntry);
    }
  }

  for (const exception of ruleExceptionsByKey.values()) {
    if (!exception.seen) {
      ruleExceptionErrors.push({
        rule: exception.rule,
        file: exception.file,
        description:
          'stale rule exception (rule no longer triggered in this file; remove it from rule-exceptions.json)',
      });
    }
  }

  const totalAstRuleViolations =
    astRuleViolations['no-deprecated-effect-handler'].length +
    astRuleViolations['no-store-access-in-actions'].length +
    astRuleViolations['no-store-subscription-in-handlers'].length;

  const ok =
    missingRoots.length === 0 &&
    staleTransitionalFiles.length === 0 &&
    directRegistrations.length === 0 &&
    providerOrderViolations.length === 0 &&
    layerConventionViolations.length === 0 &&
    classificationViolations.length === 0 &&
    totalAstRuleViolations === 0 &&
    ruleExceptionErrors.length === 0;

  return {
    ok,
    scanRoots: scanRoots.map((root) => formatDisplayPath(root, baseDir)),
    missingRoots,
    directRegistrations,
    transitionalRegistrations,
    staleTransitionalFiles,
    providerOrderViolations,
    layeredRoots: layeredRoots.map((root) => formatDisplayPath(root, baseDir)),
    layerConventionViolations,
    classifiedNonCanonicalRoots: [...classifiedSurfaces.values()],
    classificationViolations,
    astRuleViolations,
    activeRuleExceptions,
    ruleExceptionErrors,
  };
}

function parseCliArgs(argv) {
  const roots = [];
  let classificationPath;
  let exceptionsPath;
  let allowlistPath;
  let quiet = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--quiet') {
      quiet = true;
      continue;
    }
    if (
      arg === '--root' ||
      arg === '--classification' ||
      arg === '--exceptions' ||
      arg === '--allowlist'
    ) {
      const value = argv[i + 1];
      if (!value || value.startsWith('--')) {
        throw new Error(`Missing path argument after ${arg}`);
      }
      i += 1;
      if (arg === '--root') {
        roots.push(path.resolve(process.cwd(), value));
      } else if (arg === '--classification') {
        classificationPath = path.resolve(process.cwd(), value);
      } else if (arg === '--exceptions') {
        exceptionsPath = path.resolve(process.cwd(), value);
      } else {
        allowlistPath = path.resolve(process.cwd(), value);
      }
      continue;
    }
    throw new Error(`Unknown CLI argument: ${arg}`);
  }

  return {
    roots,
    classificationPath,
    exceptionsPath,
    allowlistPath,
    quiet,
    baseDir: roots.length > 0 ? process.cwd() : repositoryRoot,
  };
}

function printReport(result) {
  console.log('Context-Layered convention check');
  console.log(`- scanned source roots: ${result.scanRoots.join(', ')}`);

  if (result.missingRoots.length > 0) {
    console.error(
      `- missing source roots: ${result.missingRoots.length} path(s)`
    );
    for (const root of result.missingRoots) {
      console.error(`  ✖ ${root}`);
    }
    return;
  }

  console.log(
    `- transitional direct registrations: ${result.transitionalRegistrations.length} file(s)`
  );
  for (const entry of result.transitionalRegistrations) {
    console.log(`  · ${entry.file} (${entry.count} registration(s))`);
  }

  if (result.staleTransitionalFiles.length > 0) {
    console.error(
      `- stale transitional allowlist entries: ${result.staleTransitionalFiles.length} file(s)`
    );
    for (const file of result.staleTransitionalFiles) {
      console.error(`  ✖ example/${file}`);
    }
  } else {
    console.log('- stale transitional allowlist entries: 0 file(s)');
  }

  if (result.directRegistrations.length > 0) {
    console.error(
      `- invalid direct registrations: ${result.directRegistrations.length} file(s)`
    );
    for (const entry of result.directRegistrations) {
      console.error(`  ✖ ${entry.file} (${entry.count} registration(s))`);
    }
    console.error(
      'Move these calls into a domain Handler Registry or a handler module.'
    );
  } else {
    console.log('- invalid direct registrations: 0 file(s)');
  }

  if (result.providerOrderViolations.length > 0) {
    console.error(
      `- provider-order violations: ${result.providerOrderViolations.length} occurrence(s)`
    );
    for (const { file, outer, inner } of result.providerOrderViolations) {
      console.error(
        `  ✖ ${file}:${outer.line} ${outer.tagName} contains ${inner.tagName} at line ${inner.line}`
      );
    }
    console.error(
      'Use Action → Store → Ref → Handler Registry nesting for provider composition.'
    );
  } else {
    console.log('- provider-order violations: 0 occurrence(s)');
  }

  console.log(`- canonical layered roots: ${result.layeredRoots.length}`);
  if (result.layerConventionViolations.length > 0) {
    console.error(
      `- layer-path/name violations: ${result.layerConventionViolations.length} occurrence(s)`
    );
    for (const violation of result.layerConventionViolations) {
      const moduleSuffix = violation.moduleName
        ? ` (${violation.moduleName})`
        : '';
      console.error(
        `  ✖ ${violation.file}:${violation.line} ${violation.layer}/ ${violation.description}${moduleSuffix}`
      );
    }
    console.error(
      'Keep canonical layer files in their named folders and preserve the documented import boundaries.'
    );
  } else {
    console.log('- layer-path/name violations: 0 occurrence(s)');
  }

  const advancedSurfaceCount = result.classifiedNonCanonicalRoots.filter(
    (entry) => entry.category === 'advanced'
  ).length;
  const compatibilitySurfaceCount = result.classifiedNonCanonicalRoots.filter(
    (entry) => entry.category === 'compatibility'
  ).length;
  console.log(
    `- classified non-canonical handler roots: ${result.classifiedNonCanonicalRoots.length} (advanced ${advancedSurfaceCount}, compatibility ${compatibilitySurfaceCount})`
  );
  if (result.classificationViolations.length > 0) {
    console.error(
      `- migration classification violations: ${result.classificationViolations.length} occurrence(s)`
    );
    for (const violation of result.classificationViolations) {
      const pathSuffix = violation.path ? ` ${violation.path}` : '';
      const categorySuffix = violation.category
        ? ` [${violation.category}]`
        : '';
      console.error(
        `  ✖${categorySuffix}${pathSuffix}: ${violation.description}`
      );
    }
    console.error(
      'Classify every non-canonical handlers directory as advanced or compatibility before adding new exceptions.'
    );
  } else {
    console.log('- migration classification violations: 0 occurrence(s)');
  }

  for (const rule of PROMOTED_AST_RULES) {
    const list = result.astRuleViolations[rule];
    if (list.length > 0) {
      console.error(`- ${rule} violations: ${list.length} occurrence(s)`);
      for (const violation of list) {
        console.error(
          `  ✖ ${violation.file}:${violation.line} ${violation.description}`
        );
      }
    } else {
      console.log(`- ${rule} violations: 0 occurrence(s)`);
    }
  }

  console.log(
    `- active rule exceptions: ${result.activeRuleExceptions.length} file(s)`
  );
  for (const exception of result.activeRuleExceptions) {
    console.log(`  · [${exception.rule}] ${exception.file}`);
  }

  if (result.ruleExceptionErrors.length > 0) {
    console.error(
      `- stale / invalid rule exceptions: ${result.ruleExceptionErrors.length} entry(s)`
    );
    for (const err of result.ruleExceptionErrors) {
      console.error(
        `  ✖ [${err.rule}] ${err.file}: ${err.description}`
      );
    }
  } else {
    console.log('- stale / invalid rule exceptions: 0 entry(s)');
  }
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const cliOptions = parseCliArgs(process.argv.slice(2));
  const result = runContextLayeredConventionCheck({
    baseDir: cliOptions.baseDir,
    roots: cliOptions.roots,
    classificationPath: cliOptions.classificationPath,
    exceptionsPath: cliOptions.exceptionsPath,
    allowlistPath: cliOptions.allowlistPath,
  });
  if (!cliOptions.quiet) {
    printReport(result);
  }
  if (!result.ok) {
    process.exitCode = 1;
  }
}
