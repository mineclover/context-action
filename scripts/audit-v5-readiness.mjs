#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import * as ts from 'typescript';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const defaultRepositoryRoot = path.resolve(scriptDirectory, '..');

const sourceExtensions = new Set(['.ts', '.tsx', '.mts', '.cts']);
const ignoredDirectoryNames = new Set(['node_modules', 'dist', 'build', '.git', '.vitepress']);

const ROOT_SUBPATH_EXPORT_TO_TARGET = new Map([
  // @context-action/react/refs
  ['createRefContext', '@context-action/react/refs'],
  ['CreateRefContextOptions', '@context-action/react/refs'],
  ['RefContextReturn', '@context-action/react/refs'],
  ['RefController', '@context-action/react/refs'],
  ['InferRefTypes', '@context-action/react/refs'],
  ['RefDefinitions', '@context-action/react/refs'],
  ['RefOperation', '@context-action/react/refs'],
  ['RefOperationOptions', '@context-action/react/refs'],
  ['RefOperationResult', '@context-action/react/refs'],
  ['RefTarget', '@context-action/react/refs'],
  // @context-action/react/time-travel
  ['createTimeTravelStore', '@context-action/react/time-travel'],
  ['isTimeTravelStore', '@context-action/react/time-travel'],
  ['TimeTravelStore', '@context-action/react/time-travel'],
  ['TimeTravelStoreOptions', '@context-action/react/time-travel'],
  ['useTimeTravelControls', '@context-action/react/time-travel'],
  ['TimeTravelControlsState', '@context-action/react/time-travel'],
  ['TimeTravelControlsStore', '@context-action/react/time-travel'],
  ['useTimeTravelPath', '@context-action/react/time-travel'],
  ['useTimeTravelSelector', '@context-action/react/time-travel'],
  ['TimeTravelPathStore', '@context-action/react/time-travel'],
  ['UseTimeTravelPathOptions', '@context-action/react/time-travel'],
  ['UseTimeTravelSelectorOptions', '@context-action/react/time-travel'],
  ['createTimeTravelStoreContext', '@context-action/react/time-travel'],
  ['TimeTravelStoreManager', '@context-action/react/time-travel'],
  ['ExternalTimeTravelStoreInput', '@context-action/react/time-travel'],
  ['ExternalTimeTravelStoresMap', '@context-action/react/time-travel'],
  ['InferTimeTravelStoreTypes', '@context-action/react/time-travel'],
  ['TimeTravelContextControlsState', '@context-action/react/time-travel'],
  ['TimeTravelInitialStores', '@context-action/react/time-travel'],
  ['TimeTravelStoreConfig', '@context-action/react/time-travel'],
  ['TimeTravelStoreManagerOptions', '@context-action/react/time-travel'],
  ['TimeTravelStoreProviderProps', '@context-action/react/time-travel'],
  ['TimelineReader', '@context-action/react/time-travel'],
  ['TimelineWriter', '@context-action/react/time-travel'],
  ['TimelineBackend', '@context-action/react/time-travel'],
  // @context-action/react/transactions
  ['StoreTransactionCoordinator', '@context-action/react/transactions'],
  ['StoreTransactionEvent', '@context-action/react/transactions'],
  ['StoreTransactionEventPhase', '@context-action/react/transactions'],
  ['StoreTransactionHandle', '@context-action/react/transactions'],
  ['StoreTransactionInspectorSink', '@context-action/react/transactions'],
  ['StoreTransactionInspectorSnapshot', '@context-action/react/transactions'],
  ['StoreTransactionListener', '@context-action/react/transactions'],
  ['StoreTransactionMeta', '@context-action/react/transactions'],
  ['StoreTransactionOptions', '@context-action/react/transactions'],
  ['StoreTransactionParticipant', '@context-action/react/transactions'],
  ['StoreTransactionRecord', '@context-action/react/transactions'],
  ['bindActionTransactions', '@context-action/react/transactions'],
  ['ActionTransactionBridgeOptions', '@context-action/react/transactions'],
  ['DispatchTraceSource', '@context-action/react/transactions'],
  ['useStoreTransactionInspector', '@context-action/react/transactions'],
  ['TransactionBackend', '@context-action/react/transactions'],
  ['TransactionBatchControl', '@context-action/react/transactions'],
  ['TransactionCoordinatorPort', '@context-action/react/transactions'],
  ['TransactionHandle', '@context-action/react/transactions'],
  ['TransactionMeta', '@context-action/react/transactions'],
  ['TransactionOptions', '@context-action/react/transactions'],
  ['TransactionParticipant', '@context-action/react/transactions'],
  ['TransactionParticipantBackend', '@context-action/react/transactions'],
  // @context-action/react/backend
  ['BackendStore', '@context-action/react/backend'],
  ['createBackendStore', '@context-action/react/backend'],
  ['BackendPatchListener', '@context-action/react/backend'],
  ['BackendStoreOptions', '@context-action/react/backend'],
  ['BackendStoreSetValueOptions', '@context-action/react/backend'],
]);

const DEPRECATED_API_REPLACEMENTS = new Map([
  ['useActionDispatchWithResult', 'useActionResultDispatch() or useActionScope()'],
  ['useActionEffectHandler', 'useActionCommandHandler() or useActionObserver()'],
  ['registerEffect', 'register() or action observer callbacks'],
  ['StoreSchema', 'createStoreContext() with typed InitialStores / StoreRegistry'],
  ['defineStoreSchema', 'createStoreContext() with typed InitialStores'],
  ['compareStrategy', 'strategy (or comparisonOptions.strategy)'],
]);

export const BLOCKING_CATEGORIES = [
  'deprecatedApis',
  'rootSubpathImports',
  'manualImmediateDispatches',
];

export const ALL_CATEGORIES = [
  ...BLOCKING_CATEGORIES,
  'implicitStoreNotificationMode',
];

function collectSourceFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  const files = [];
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  entries.sort((a, b) => a.name.localeCompare(b.name));

  for (const entry of entries) {
    if (ignoredDirectoryNames.has(entry.name)) continue;
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectSourceFiles(entryPath));
      continue;
    }
    if (entry.name.endsWith('.d.ts') || entry.name.endsWith('.d.mts') || entry.name.endsWith('.d.cts')) {
      continue;
    }
    if (sourceExtensions.has(path.extname(entry.name))) {
      files.push(entryPath);
    }
  }

  return files;
}

function getPropertyNameText(nameNode) {
  if (!nameNode) return null;
  if (ts.isIdentifier(nameNode) || ts.isStringLiteral(nameNode) || ts.isNumericLiteral(nameNode)) {
    return nameNode.text;
  }
  return null;
}

function getCalleeLabel(expression) {
  if (ts.isIdentifier(expression)) {
    return expression.text;
  }
  if (ts.isPropertyAccessExpression(expression)) {
    return expression.name.text;
  }
  return null;
}

function isDispatchCallExpression(node) {
  const expr = node.expression;
  if (ts.isIdentifier(expr)) {
    return /(?:^dispatch|Dispatch)(?:WithResult)?$/.test(expr.text);
  }
  if (ts.isPropertyAccessExpression(expr)) {
    if (/(?:dispatch|Dispatch)(?:WithResult)?$/.test(expr.name.text)) {
      return true;
    }
    // Also detect `actions.resetDraft(payload, { immediate: true })`
    const targetText = expr.expression.getText();
    if (targetText === 'actions' || targetText.endsWith('.actions')) {
      return true;
    }
  }
  return false;
}

function hasObjectProperty(objectLiteral, propertyName, valuePredicate, options = {}) {
  const treatSpreadAsMatch = Boolean(options.treatSpreadAsMatch);
  for (const prop of objectLiteral.properties) {
    if (ts.isSpreadAssignment(prop)) {
      if (treatSpreadAsMatch) return true;
      continue;
    }
    if (ts.isShorthandPropertyAssignment(prop)) {
      if (prop.name.text === propertyName) {
        return valuePredicate ? valuePredicate(prop.name) : true;
      }
      continue;
    }
    if (ts.isPropertyAssignment(prop)) {
      const nameText = getPropertyNameText(prop.name);
      if (nameText === propertyName) {
        return valuePredicate ? valuePredicate(prop.initializer) : true;
      }
    }
  }
  return false;
}

function auditSourceFile(repositoryRoot, scope, filePath) {
  const sourceText = fs.readFileSync(filePath, 'utf8');
  const scriptKind = filePath.endsWith('.tsx')
    ? ts.ScriptKind.TSX
    : ts.ScriptKind.TS;
  const sourceFile = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true, scriptKind);
  const relativeFile = path.relative(repositoryRoot, filePath).split(path.sep).join('/');

  const findings = [];
  const seenKeys = new Set();

  function record(category, node, symbol, detail) {
    const pos = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
    const line = pos.line + 1;
    const column = pos.character + 1;
    const key = `${category}:${line}:${column}:${symbol}`;
    if (seenKeys.has(key)) return;
    seenKeys.add(key);

    findings.push({
      scope,
      file: relativeFile,
      line,
      column,
      category,
      blocking: category !== 'implicitStoreNotificationMode',
      symbol,
      detail,
    });
  }

  function visit(node) {
    // 1. Subpath symbols imported/re-exported from '@context-action/react'
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier) &&
      node.moduleSpecifier.text === '@context-action/react'
    ) {
      const named = ts.isImportDeclaration(node)
        ? node.importClause?.namedBindings && ts.isNamedImports(node.importClause.namedBindings)
          ? node.importClause.namedBindings.elements
          : []
        : node.exportClause && ts.isNamedExports(node.exportClause)
          ? node.exportClause.elements
          : [];

      for (const spec of named) {
        const exportedName = (spec.propertyName ?? spec.name).text;
        const targetSubpath = ROOT_SUBPATH_EXPORT_TO_TARGET.get(exportedName);
        if (targetSubpath) {
          record(
            'rootSubpathImports',
            spec,
            exportedName,
            `Import '${exportedName}' from '${targetSubpath}' instead of '@context-action/react'`
          );
        }
        if (DEPRECATED_API_REPLACEMENTS.has(exportedName)) {
          record(
            'deprecatedApis',
            spec,
            exportedName,
            `Deprecated API '${exportedName}': migrate to ${DEPRECATED_API_REPLACEMENTS.get(exportedName)}`
          );
        }
      }
    }

    // 2. Deprecated API destructuring from createActionContext(...) or hooks
    if (ts.isBindingElement(node)) {
      const propName = (node.propertyName ?? node.name);
      if (ts.isIdentifier(propName) && DEPRECATED_API_REPLACEMENTS.has(propName.text)) {
        record(
          'deprecatedApis',
          propName,
          propName.text,
          `Deprecated API '${propName.text}': migrate to ${DEPRECATED_API_REPLACEMENTS.get(propName.text)}`
        );
      }
    }

    // 3. Deprecated option key `compareStrategy`
    if (
      ts.isPropertyAssignment(node) ||
      ts.isPropertySignature(node) ||
      ts.isShorthandPropertyAssignment(node)
    ) {
      const propName = getPropertyNameText(node.name);
      if (propName === 'compareStrategy') {
        record(
          'deprecatedApis',
          node.name,
          'compareStrategy',
          `Deprecated config alias 'compareStrategy': migrate to ${DEPRECATED_API_REPLACEMENTS.get('compareStrategy')}`
        );
      }
    }

    // 4. Deprecated type references (StoreSchema)
    if (ts.isTypeReferenceNode(node) && ts.isIdentifier(node.typeName)) {
      const typeName = node.typeName.text;
      if (DEPRECATED_API_REPLACEMENTS.has(typeName)) {
        record(
          'deprecatedApis',
          node.typeName,
          typeName,
          `Deprecated type '${typeName}': migrate to ${DEPRECATED_API_REPLACEMENTS.get(typeName)}`
        );
      }
    }

    // 5. Call-expression inspections (deprecated hooks/methods, { immediate: true }, implicit notificationMode)
    if (ts.isCallExpression(node)) {
      const calleeLabel = getCalleeLabel(node.expression);

      if (calleeLabel && DEPRECATED_API_REPLACEMENTS.has(calleeLabel)) {
        record(
          'deprecatedApis',
          node.expression,
          calleeLabel,
          `Deprecated API '${calleeLabel}': migrate to ${DEPRECATED_API_REPLACEMENTS.get(calleeLabel)}`
        );
      }

      if (isDispatchCallExpression(node)) {
        for (const arg of node.arguments) {
          if (
            ts.isObjectLiteralExpression(arg) &&
            hasObjectProperty(
              arg,
              'immediate',
              (initializer) => initializer.kind === ts.SyntaxKind.TrueKeyword
            )
          ) {
            record(
              'manualImmediateDispatches',
              arg,
              calleeLabel ?? 'dispatch',
              "Call-site '{ immediate: true }': move to contract-level 'actions: { <action>: { queue: \"immediate\" } }' in v5 preparation"
            );
          }
        }
      }

      if (calleeLabel === 'createStore' || calleeLabel === 'createTimeTravelStore') {
        const optionsArg = node.arguments[2];
        const hasExplicitMode =
          optionsArg &&
          ts.isObjectLiteralExpression(optionsArg) &&
          hasObjectProperty(optionsArg, 'notificationMode', undefined, {
            treatSpreadAsMatch: true,
          });
        if (!hasExplicitMode) {
          record(
            'implicitStoreNotificationMode',
            node,
            calleeLabel,
            `Implicit notificationMode on ${calleeLabel}(): specify explicit 'notificationMode' ('batched' | 'immediate') if preparing for v5 defaults`
          );
        }
      }

      if (calleeLabel === 'createStoreContext' || calleeLabel === 'createTimeTravelStoreContext') {
        const initialStoresArg = node.arguments[1];
        if (!initialStoresArg) {
          // ignore malformed calls
        } else if (ts.isObjectLiteralExpression(initialStoresArg)) {
          for (const prop of initialStoresArg.properties) {
            if (!ts.isPropertyAssignment(prop)) {
              if (ts.isShorthandPropertyAssignment(prop)) {
                record(
                  'implicitStoreNotificationMode',
                  prop,
                  `${calleeLabel}(${prop.name.text})`,
                  `Store '${prop.name.text}' relies on default notificationMode; set explicit 'notificationMode' if targeting v5 defaults`
                );
              }
              continue;
            }
            const storeKey = getPropertyNameText(prop.name) ?? '<computed>';
            const init = prop.initializer;
            const isExplicitConfigWithMode =
              ts.isObjectLiteralExpression(init) &&
              hasObjectProperty(init, 'initialValue', undefined, {
                treatSpreadAsMatch: true,
              }) &&
              hasObjectProperty(init, 'notificationMode', undefined, {
                treatSpreadAsMatch: true,
              });

            if (!isExplicitConfigWithMode) {
              record(
                'implicitStoreNotificationMode',
                prop,
                `${calleeLabel}(${storeKey})`,
                `Store '${storeKey}' relies on default notificationMode; set explicit 'notificationMode' if targeting v5 defaults`
              );
            }
          }
        } else {
          record(
            'implicitStoreNotificationMode',
            initialStoresArg,
            calleeLabel,
            `Dynamic initialStores passed to ${calleeLabel}(): verify explicit 'notificationMode' entries`
          );
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return findings;
}

function emptyCategoryCounts() {
  return {
    deprecatedApis: 0,
    rootSubpathImports: 0,
    manualImmediateDispatches: 0,
    implicitStoreNotificationMode: 0,
  };
}

function resolveScanScopes(repositoryRoot) {
  const defaultTemplateDir = path.join(repositoryRoot, 'packages/template-react/src');
  const defaultExampleDir = path.join(repositoryRoot, 'example/src');

  const scopes = [];
  if (fs.existsSync(defaultTemplateDir)) {
    scopes.push({ name: 'template', directory: defaultTemplateDir });
  }
  if (fs.existsSync(defaultExampleDir)) {
    scopes.push({ name: 'example', directory: defaultExampleDir });
  }
  if (scopes.length === 0) {
    scopes.push({ name: 'custom', directory: repositoryRoot });
  }
  return scopes;
}

export function auditV5Readiness(options = {}) {
  const repositoryRoot = path.resolve(options.root ?? defaultRepositoryRoot);
  const strictTemplate = Boolean(options.strictTemplate);
  const strictAll = Boolean(options.strictAll);
  const scopesToScan = resolveScanScopes(repositoryRoot);

  const findings = [];
  const scopeSummaries = {};

  for (const scope of scopesToScan) {
    const files = collectSourceFiles(scope.directory);
    const counts = emptyCategoryCounts();
    let scopeFilesWithFindings = 0;

    for (const filePath of files) {
      const fileFindings = auditSourceFile(repositoryRoot, scope.name, filePath);
      if (fileFindings.length > 0) {
        scopeFilesWithFindings += 1;
        findings.push(...fileFindings);
        for (const item of fileFindings) {
          counts[item.category] += 1;
        }
      }
    }

    const blockingTotal =
      counts.deprecatedApis + counts.rootSubpathImports + counts.manualImmediateDispatches;

    scopeSummaries[scope.name] = {
      directory: path.relative(repositoryRoot, scope.directory).split(path.sep).join('/') || '.',
      scannedFiles: files.length,
      filesWithFindings: scopeFilesWithFindings,
      blockingTotal,
      informationalTotal: counts.implicitStoreNotificationMode,
      counts,
    };
  }

  const totals = emptyCategoryCounts();
  for (const item of findings) {
    totals[item.category] += 1;
  }

  const blockingTotal =
    totals.deprecatedApis + totals.rootSubpathImports + totals.manualImmediateDispatches;
  const informationalTotal = totals.implicitStoreNotificationMode;

  const strictScopeKey = scopeSummaries.template ? 'template' : 'custom';
  const strictScopeSummary = scopeSummaries[strictScopeKey];
  const strictPassed =
    (!strictTemplate || (strictScopeSummary?.blockingTotal ?? 0) === 0) &&
    (!strictAll || blockingTotal === 0);

  return {
    repositoryRoot,
    strictTemplate,
    strictAll,
    strictScope: strictScopeKey,
    strictPassed,
    blockingTotal,
    informationalTotal,
    totals,
    scopes: scopeSummaries,
    findings,
  };
}

function parseArguments(argv) {
  let root = defaultRepositoryRoot;
  let json = false;
  let strictTemplate = false;
  let strictAll = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--root') {
      const next = argv[i + 1];
      if (!next) throw new Error('--root requires a directory path');
      root = path.resolve(next);
      i += 1;
    } else if (arg === '--json') {
      json = true;
    } else if (arg === '--strict-template') {
      strictTemplate = true;
    } else if (arg === '--strict-all') {
      strictAll = true;
    } else if (arg === '--') {
      // ignore pnpm pass-through separator
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return { root, json, strictTemplate, strictAll };
}

function formatTextReport(result) {
  const lines = [];
  lines.push('Context-Action v5 Migration Readiness Audit');
  lines.push(`- repository root: ${result.repositoryRoot}`);
  lines.push(`- strict template gate: ${result.strictTemplate ? 'enabled' : 'disabled'}`);
  lines.push(`- strict all gate: ${result.strictAll ? 'enabled' : 'disabled'}`);

  for (const [scopeName, summary] of Object.entries(result.scopes)) {
    lines.push(
      `- scope [${scopeName}] (${summary.directory}, ${summary.scannedFiles} file(s)): ` +
        `blocking=${summary.blockingTotal} (` +
        `deprecatedApis=${summary.counts.deprecatedApis}, ` +
        `rootSubpathImports=${summary.counts.rootSubpathImports}, ` +
        `manualImmediateDispatches=${summary.counts.manualImmediateDispatches}` +
        `), advisory(implicitStoreNotificationMode=${summary.counts.implicitStoreNotificationMode})`
    );
  }

  lines.push(
    `- totals: blocking=${result.blockingTotal}, advisory=${result.informationalTotal}`
  );

  const blockingFindings = result.findings.filter((item) => item.blocking);
  if (blockingFindings.length > 0) {
    lines.push('');
    lines.push('Blocking readiness items:');
    for (const item of blockingFindings) {
      lines.push(
        `  · [${item.scope}:${item.category}] ${item.file}:${item.line}:${item.column} (${item.symbol}) — ${item.detail}`
      );
    }
  }

  return lines.join('\n');
}

const isEntrypoint =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isEntrypoint) {
  process.stdout.on('error', (error) => {
    if (error?.code === 'EPIPE') {
      process.exit(0);
    }
    throw error;
  });

  const args = parseArguments(process.argv.slice(2));
  const report = auditV5Readiness(args);

  if (args.json) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    process.stdout.write(`${formatTextReport(report)}\n`);
  }

  if (!report.strictPassed) {
    if (report.strictAll && report.blockingTotal > 0) {
      process.stderr.write(
        `v5 readiness strict all check failed (${report.blockingTotal} blocking finding(s)).\n`
      );
    } else {
      process.stderr.write(
        `v5 readiness strict template check failed in '${report.strictScope}' scope ` +
          `(${report.scopes[report.strictScope].blockingTotal} blocking finding(s)).\n`
      );
    }
    process.exit(1);
  }
}
