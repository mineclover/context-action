#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseDocument } from 'yaml';

const defaultRepositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const defaultOutput = 'reports/release/v1.0.0/security-report.json';
const githubSuccessCondition = '$' + '{{ success() }}';
const githubFailureOrCancelledCondition = '$' + '{{ failure() || cancelled() }}';
const prereleaseDistTagExpression = '$' + '{{ inputs.dist_tag }}';
const releaseCommitExpression = '$' + '{{ inputs.release_commit }}';
const regularPackageCohort = '@context-action/typedoc-vitepress-sync,@context-action/ai-sdk,@context-action/tool-durable-operations,@context-action/llms-generator';
const prereleasePackageCohort = '@context-action/core,@context-action/react,@context-action/tool-durable-operations,@context-action/tool-protocol,@context-action/webmcp';
const stableCandidatePackageCohort = '@context-action/core,@context-action/react,@context-action/tool-protocol';
const coordinatedStablePackageCohort = '@context-action/core,@context-action/react';
const mutativePackageCohort = '@context-action/mutative-core,@context-action/mutative';
const maintenanceJournalMarkerStatements = [
  'journal_previous_tag="maintenance-previous-$PACKAGE_VERSION"',
  'journal_absent_tag="maintenance-previous-absent-$PACKAGE_VERSION"',
  'journal_ready_tag="maintenance-journal-ready-$PACKAGE_VERSION"',
  'journal_completed_tag="maintenance-journal-completed-$PACKAGE_VERSION"',
  'journal_rolled_back_tag="maintenance-journal-rolled-back-$PACKAGE_VERSION"',
];
const maintenanceStepNames = {
  prepare: 'Prepare registry rollback journal',
  promote: 'Promote verified candidate to latest',
  verify: 'Verify latest closure and capture evidence',
  journalEvidence: 'Capture maintenance journal evidence',
  finalize: 'Finalize successful promotion journal',
  rollback: 'Roll back latest after post-promotion failure',
};
const eventSourceStatements = [
  'test "$(git rev-parse HEAD)" = "$GITHUB_SHA"',
  'git diff --exit-code',
  'git diff --cached --exit-code',
];
const prereleaseSourceStatements = [
  'git fetch origin main --no-tags',
  'test "$GITHUB_REF" = "refs/heads/main"',
  'test "$(git rev-parse HEAD)" = "$(git rev-parse origin/main)"',
  '[[ "$PRERELEASE_DIST_TAG" =~ ^(rc|next)$ ]]',
  ...eventSourceStatements,
];
const approvedSourceStatements = [
  'test "$(git rev-parse HEAD)" = "$RELEASE_COMMIT"',
  'git diff --exit-code',
  'git diff --cached --exit-code',
];
const reactCompatibilityMatrixCommand = 'node scripts/verify-react-compatibility.mjs --react-version 18.3.1 --react-types 18.3.12 --react-dom-types 18.3.1 && node scripts/verify-react-compatibility.mjs --react-version 19.2.8 --react-types 19.2.17 --react-dom-types 19.2.3';
const verifyAllCommand = 'pnpm build:live-code-editor && pnpm build && pnpm verify:react-compatibility && pnpm test:ai-sdk-integration && pnpm verify:ai-sdk-tool-protocol-contract && pnpm verify:react-aria-reference-hydration && pnpm verify:doc-snippets && pnpm verify:core-artifact-parity && pnpm verify:react-artifact-boundary && pnpm verify:package-exports && pnpm verify:package-tarballs && pnpm verify:tool-protocol-changelog && pnpm verify:webmcp-changelog && pnpm package-boundary:check && pnpm package-boundary:test && pnpm verify:local-tool-consumers && pnpm verify:v1-lifecycle && pnpm verify:v1-release-manifest && pnpm verify:v1-release-state-alignment && pnpm verify:coordinated-stable-release-plan && pnpm test:release-safety && pnpm verify:v1-release-workflows && pnpm verify:v1-supply-chain && pnpm tool-durable:test:evidence && pnpm lint && pnpm convention:check && pnpm docs:management && pnpm llms:check && pnpm type-check && pnpm test && pnpm --filter example check && pnpm --filter example test && pnpm --filter example build && pnpm docs:build && pnpm verify:private-tools';
const requiredRootScripts = {
  'build:live-code-editor': 'pnpm --filter @context-action/live-code-editor build',
  build: 'lerna run build',
  'publish:packages': 'node scripts/publish-packages.cjs',
  'verify:published-tool-consumers': 'node scripts/verify-published-tool-consumers.cjs',
  'verify:local-tool-consumers': 'node scripts/verify-published-tool-consumers.cjs --local',
  'verify:react-compatibility': reactCompatibilityMatrixCommand,
  'test:ai-sdk-integration': 'pnpm --filter @context-action/tool-protocol build && pnpm --filter @context-action/ai-sdk build && node scripts/verify-ai-sdk-runtime.mjs',
  'verify:ai-sdk-tool-protocol-contract': 'pnpm --filter @context-action/tool-protocol build && pnpm --filter @context-action/ai-sdk build && node scripts/verify-ai-sdk-tool-protocol-contract.mjs',
  'verify:react-aria-reference-hydration': 'node scripts/verify-react-aria-reference-hydration.mjs',
  'verify:doc-snippets': 'node scripts/verify-doc-snippets.mjs',
  'verify:core-artifact-parity': 'node scripts/verify-core-artifact-parity.mjs',
  'verify:react-artifact-boundary': 'node scripts/verify-react-artifact-boundary.mjs',
  'verify:package-exports': 'node scripts/verify-package-exports.mjs',
  'verify:package-tarballs': 'node scripts/verify-package-tarballs.mjs',
  'verify:tool-protocol-changelog': 'node scripts/verify-tool-protocol-changelog.mjs',
  'verify:webmcp-changelog': 'node scripts/verify-tool-protocol-changelog.mjs --package webmcp',
  'package-boundary:check': 'node scripts/verify-package-boundaries.mjs',
  'package-boundary:test': 'node --test scripts/verify-package-boundaries.test.mjs',
  'verify:v1-lifecycle': 'node scripts/verify-v1-lifecycle-contract.mjs',
  'verify:v1-release-manifest': 'node scripts/verify-v1-release-manifest.mjs',
  'verify:v1-release-state-alignment': 'node scripts/verify-v1-release-state-alignment.mjs',
  'verify:coordinated-stable-release-plan': 'node scripts/verify-coordinated-stable-release-plan.mjs',
  'test:release-safety': 'node --test --test-concurrency=1 scripts/maintenance-release-safety.test.mjs scripts/publish-packages.test.mjs scripts/verify-published-tool-consumers.test.cjs scripts/coordinated-stable-release.test.mjs scripts/verify-v1-release-workflows.test.mjs scripts/verify-v1-supply-chain.test.mjs',
  'verify:v1-release-workflows': 'node scripts/verify-v1-release-workflows.mjs',
  'verify:v1-supply-chain': 'node scripts/verify-v1-supply-chain.mjs',
  'tool-durable:test:evidence': 'node --test scripts/verify-durable-operation-evidence-schema.test.mjs',
  lint: 'biome lint packages/core/src packages/tool-protocol/src packages/ai-sdk/src packages/webmcp/src packages/tool-durable-operations/src packages/react/src packages/mutative-core/src packages/mutative/src packages/llms-generator/src packages/typedoc-vitepress-sync/src scripts/security-audit.mjs scripts/verify-private-tools.mjs scripts/verify-package-boundaries.mjs scripts/verify-package-boundaries.test.mjs scripts/verify-durable-operation-evidence-schema.mjs scripts/verify-durable-operation-evidence-schema.test.mjs scripts/verify-ai-sdk-runtime.mjs scripts/verify-ai-sdk-tool-protocol-contract.mjs scripts/verify-react-aria-reference-hydration.mjs scripts/verify-doc-snippets.mjs scripts/verify-react-compatibility.mjs scripts/verify-core-artifact-parity.mjs scripts/verify-tool-protocol-changelog.mjs scripts/verify-maintenance-patch-version.mjs scripts/verify-maintenance-patch-provenance.mjs scripts/refuse-direct-release.mjs scripts/publish-packages.cjs scripts/publish-packages.test.mjs scripts/verify-published-tool-consumers.cjs scripts/verify-published-tool-consumers.test.cjs scripts/maintenance-release-safety.test.mjs scripts/coordinated-stable-release.test.mjs scripts/verify-coordinated-stable-release-plan.mjs scripts/verify-coordinated-stable-provenance.mjs scripts/promote-coordinated-stable.mjs scripts/write-release-evidence.mjs scripts/verify-release-evidence.mjs scripts/release-evidence.test.mjs scripts/generate-release-inventory.mjs scripts/verify-v1-release-roadmap-alignment.mjs scripts/verify-v1-release-state-alignment.mjs scripts/verify-react-webmcp-isolation.mjs scripts/verify-v1-core-migration-fixture.mjs scripts/verify-v1-lifecycle-contract.mjs scripts/verify-v1-release-manifest.mjs scripts/verify-v1-release-workflows.mjs scripts/verify-v1-release-workflows.test.mjs scripts/verify-stable-publish-authorization.mjs scripts/verify-v1-published-provenance.mjs scripts/verify-v1-promotion-authorization.mjs scripts/verify-v1-promotion-governance.mjs scripts/verify-v1-supply-chain.mjs scripts/verify-v1-supply-chain.test.mjs scripts/capture-published-release.mjs scripts/verify-prerelease-dist-tags.cjs',
  'convention:check': 'node scripts/check-context-layered-conventions.mjs',
  'docs:management': 'node scripts/verify-documentation-management.mjs',
  'llms:check': 'node packages/llms-generator/dist/cli/index.js detect-mismatches --check-only --fail-on-mismatch',
  'type-check': 'lerna run type-check',
  test: 'lerna run test',
  'docs:build': 'vitepress build docs',
  'verify:private-tools': 'node scripts/verify-private-tools.mjs',
  'verify:all': verifyAllCommand,
  'capture:published-release': 'node scripts/capture-published-release.mjs',
  'verify:prerelease-dist-tags': 'node scripts/verify-prerelease-dist-tags.cjs',
  'verify:stable-publish-authorization': 'node scripts/verify-stable-publish-authorization.mjs',
  'tool-durable:verify:env': 'pnpm --filter @context-action/tool-durable-operations verify:env',
  'tool-durable:verify:redis': 'pnpm --filter @context-action/tool-durable-operations verify:redis',
  'tool-durable:verify:postgres': 'pnpm --filter @context-action/tool-durable-operations verify:postgres',
  'tool-durable:verify:http': 'pnpm --filter @context-action/tool-durable-operations verify:http',
  'tool-durable:verify:queue': 'pnpm --filter @context-action/tool-durable-operations verify:queue',
  'release:roadmap:check': 'node scripts/verify-v1-release-roadmap-alignment.mjs && node scripts/verify-coordinated-stable-release-plan.mjs',
  'docs:api': 'typedoc --options ./typedoc.json',
  'docs:sync': 'pnpm --filter @context-action/typedoc-vitepress-sync build && node packages/typedoc-vitepress-sync/bin/cli.js sync --config ./typedoc-vitepress-sync.config.js',
  'test:canonical-example': 'pnpm --dir packages/react test:canonical-example',
  'release:check': 'pnpm verify:all && pnpm release:roadmap:check && pnpm docs:api && pnpm docs:sync && pnpm docs:build && pnpm test:canonical-example && git diff --exit-code -- docs/en/api docs/.vitepress/config/api-spec.ts',
};
const requiredExampleScripts = {
  check: 'biome check src && pnpm run verify:catalog && pnpm run verify:approval && pnpm run verify:trace && pnpm run verify:usecase && pnpm run verify:conditional && pnpm run verify:mouse-action && pnpm run verify:mouse-pattern && pnpm run verify:mouse-enhanced',
  test: 'vitest run',
  build: 'tsc && vite build',
};
const requiredDurablePackageScripts = {
  'verify:env': 'node scripts/verify-durable-operation-env.mjs',
  'verify:redis': 'pnpm run build && node scripts/verify-redis.mjs',
  'verify:postgres': 'pnpm run build && node scripts/verify-postgres.mjs',
  'verify:http': 'pnpm run build && node scripts/verify-http-side-effect.mjs',
  'verify:queue': 'pnpm run build && node scripts/verify-queue-side-effect.mjs',
};
const requiredPublicationBuildScripts = new Map([
  ['@context-action/typedoc-vitepress-sync', 'pnpm build'],
  ['@context-action/ai-sdk', 'pnpm run build'],
  ['@context-action/tool-durable-operations', 'pnpm run build'],
  ['@context-action/llms-generator', 'pnpm run build'],
  ['@context-action/mutative-core', 'pnpm run build:prod'],
  ['@context-action/mutative', 'pnpm run build:prod'],
  ['@context-action/core', 'pnpm run build'],
  ['@context-action/react', 'pnpm run build:prod'],
  ['@context-action/tool-protocol', 'pnpm run build'],
  ['@context-action/webmcp', 'pnpm run build'],
]);
const reviewedInlineInterpreterSteps = new Map([
  ['publish-packages.yml:Verify scoped package identities', 'fc14508e70f9fdda14bbdb78f5da6a9d3246a7287f2b0766f0cf1ce977843252'],
  ['publish-prerelease.yml:Validate prerelease package versions', 'f19eedde7b3a48caac8fc4673928b27186eb6a715b9fdb580207c8f1f7e24b56'],
  ['publish-v1-stable-candidate.yml:Validate stable candidate cohort', 'a2a512f62ed4d2262f153ac6cec87e23cc5d19d742af434710519e1f2aff51b0'],
  ['publish-maintenance-patch.yml:Resolve the patch package and version', 'c30dfc4b3b75de8bb8c39e24eb3abf44b665b1738b87a1e39354ad0c5cb081ed'],
  ['publish-maintenance-patch.yml:Prepare registry rollback journal', 'c7e55995e4409d3ff234a0ca6d98e150c9e26e98973abe066554773bf18b2709'],
  ['publish-maintenance-patch.yml:Promote verified candidate to latest', 'a9e472f6b9b5b2d9c797d7a01e33159dd8f1c92003fb2e0c37734c27107f1ea5'],
  ['publish-maintenance-patch.yml:Capture maintenance journal evidence', 'fc01757add5ff489ecc6e904c753345addb142b01bb7fa7b1215ad5de4a04248'],
  ['publish-maintenance-patch.yml:Finalize successful promotion journal', '63836b88ba7b83ce75b92c3e29d9e97839208016938cd41b9c827897da28a118'],
  ['publish-maintenance-patch.yml:Roll back latest after post-promotion failure', 'cf55cf7addde0523f06d9842dc0cd141cda2de5e5ae5477fe6dd51e02bae7eb1'],
]);
const reviewedDynamicLauncherSteps = new Map([
  ['ci.yml:Check bundle sizes', '95f01383dbae107eeb64e222fe6bbdb977def33301e9ae2cc57242d394dd1075'],
  ['ci.yml:Generate CI Report', 'cde66a1b4b244d52588118c07392ef0b1a848466249eba4ff12a267188952549'],
  ['ci.yml:Update LLMS status', '80b1eb52ea2702b085ae57579947ff64e02e469abc73c593aa64543bd170a460'],
]);

function option(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index < 0) return fallback;
  const value = process.argv[index + 1];
  if (!value || value.startsWith('--')) throw new Error(`${name} requires a value`);
  return value;
}

const repositoryRoot = path.resolve(option('--root', defaultRepositoryRoot));

const publishingCommandPatterns = [
  /^npm\s+publish\b/u,
  /^pnpm\s+(?:run\s+)?publish:packages\b/u,
  /^pnpm\s+publish(?!:)\b/u,
  /^(?:pnpm|npm)\s+exec\s+(?:--\s+)?npm\s+publish\b/u,
  /^npx\s+(?:--yes\s+)?npm\s+publish\b/u,
  /^(?:npx|pnpm\s+exec|npm\s+exec)\s+lerna\s+publish\b/u,
  /^npm\s+dist-tag\s+(?:add|rm)\b/u,
  /^yarn\s+npm\s+publish\b/u,
];

export function parseGitHubWorkflow(source) {
  const workflow = parseDocument(source, { merge: false, uniqueKeys: true });
  if (workflow.errors.length > 0) {
    throw new Error(`Invalid GitHub workflow YAML: ${workflow.errors.map(error => error.message).join('; ')}`);
  }
  const document = workflow.toJS({ maxAliasCount: 0 });
  if (!document || typeof document !== 'object' || Array.isArray(document)) {
    throw new Error('GitHub workflow must be a YAML mapping');
  }
  return document;
}

function shellHeredocDeclaration(line) {
  let quote;
  let escaped = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (quote === "'") {
      if (character === quote) quote = undefined;
      continue;
    }
    if (quote === '"') {
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === quote) quote = undefined;
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
      continue;
    }
    if (character === '#' && (index === 0 || /\s/u.test(line[index - 1]))) break;
    if (character !== '<' || line[index + 1] !== '<' || line[index + 2] === '<') continue;
    let cursor = index + 2;
    const stripTabs = line[cursor] === '-';
    if (stripTabs) cursor += 1;
    while (/[ \t]/u.test(line[cursor] ?? '')) cursor += 1;
    const delimiterQuote = line[cursor] === '"' || line[cursor] === "'" ? line[cursor++] : undefined;
    const start = cursor;
    if (delimiterQuote) {
      while (cursor < line.length && line[cursor] !== delimiterQuote) cursor += 1;
    } else {
      while (/[A-Za-z0-9_]/u.test(line[cursor] ?? '')) cursor += 1;
    }
    const delimiter = line.slice(start, cursor);
    if (delimiter.length > 0) return { delimiter, stripTabs };
  }
  return undefined;
}

function removeShellHeredocBodies(script) {
  const lines = script.split('\n');
  const output = [];
  let delimiter;
  let stripTabs = false;
  for (const line of lines) {
    if (delimiter) {
      const candidate = stripTabs ? line.replace(/^\t+/u, '') : line;
      if (candidate.trimEnd() === delimiter) delimiter = undefined;
      continue;
    }
    output.push(line);
    const declaration = shellHeredocDeclaration(line);
    if (declaration) {
      stripTabs = declaration.stripTabs;
      delimiter = declaration.delimiter;
    }
  }
  return output.join('\n');
}

function stripShellComments(script) {
  let output = '';
  let quote;
  let escaped = false;
  for (let index = 0; index < script.length; index += 1) {
    const character = script[index];
    if (quote === "'") {
      output += character;
      if (character === quote) quote = undefined;
      continue;
    }
    if (quote === '"') {
      output += character;
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === quote) quote = undefined;
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
      output += character;
      continue;
    }
    if (character === '#' && (index === 0 || /\s/u.test(script[index - 1]))) {
      while (index < script.length && script[index] !== '\n') index += 1;
      if (index < script.length) output += '\n';
      continue;
    }
    output += character;
  }
  return output;
}

const canonicalExecutables = new Set([
  'bash', 'bun', 'command', 'corepack', 'dash', 'env', 'exec', 'ksh', 'nice',
  'node', 'nodejs', 'npm', 'npx', 'pnpm', 'sh', 'tsx', 'yarn', 'zsh',
]);

function canonicalizeExecutablePrefix(command) {
  const separator = command.search(/\s/u);
  const executable = separator < 0 ? command : command.slice(0, separator);
  if (!executable.includes('/') || /[$`'"(){}]/u.test(executable)) return command;
  const basename = path.posix.basename(executable.replaceAll('\\', '/'));
  if (!canonicalExecutables.has(basename)) return command;
  return `${basename}${separator < 0 ? '' : command.slice(separator)}`;
}

function normalizeCommandPrefix(command) {
  let normalized = command.trim().replace(/\s+/gu, ' ');
  let previous;
  do {
    previous = normalized;
    normalized = canonicalizeExecutablePrefix(normalized);
    normalized = normalized.replace(/^(?:\(\s*|\{\s*)+/u, '');
    normalized = normalized.replace(/^(?:if|then|elif|while|until|do|!)\s+/u, '');
    normalized = normalized.replace(/^(?:command(?:\s+(?:--|-[pVv]))?|exec)\s+/u, '');
    normalized = normalized.replace(/^(?:\S*\/)?corepack\s+/u, '');
    normalized = normalized.replace(
      /^nice(?:\s+(?:--adjustment(?:=|\s+)\d+|-n\s+\d+|-\d+))*\s+/u,
      '',
    );
    normalized = normalized.replace(
      /^(?:\/usr\/bin\/)?env\s+(?:(?:--|-[^\s]+|[A-Za-z_][A-Za-z0-9_]*=(?:"[^"]*"|'[^']*'|[^\s'"]+))\s+)*/u,
      '',
    );
    normalized = normalized.replace(
      /^(?:(?:[A-Za-z_][A-Za-z0-9_]*=(?:"[^"]*"|'[^']*'|[^\s'"]+))\s+)+/u,
      '',
    );
  } while (normalized !== previous);
  return normalized.replace(/\s*\)+$/u, '');
}

function executableShellText(script) {
  return stripShellComments(removeShellHeredocBodies(script)).replace(/\\[ \t]*\n/gu, ' ');
}

function splitExecutableShell(executable, { splitOperators, normalizePrefix }) {
  const commands = [];
  let quote;
  let escaped = false;
  let start = 0;
  const push = end => {
    const source = executable.slice(start, end);
    const command = normalizePrefix
      ? normalizeCommandPrefix(source)
      : source.trim().replace(/\s+/gu, ' ');
    if (command.length > 0) commands.push(command);
  };
  for (let index = 0; index < executable.length; index += 1) {
    const character = executable[index];
    if (quote === "'") {
      if (character === quote) quote = undefined;
      continue;
    }
    if (quote === '"') {
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === quote) quote = undefined;
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
      continue;
    }
    const doubleSeparator = executable.slice(index, index + 2);
    if (character === '\n' || character === ';'
      || (splitOperators && (character === '|' || character === '&'))) {
      push(index);
      if (doubleSeparator === '&&' || doubleSeparator === '||') index += 1;
      start = index + 1;
    }
  }
  push(executable.length);
  return commands;
}

export function executableShellCommands(script) {
  return splitExecutableShell(executableShellText(script), {
    splitOperators: true,
    normalizePrefix: true,
  });
}

export function executableShellStatements(script) {
  return splitExecutableShell(executableShellText(script), {
    splitOperators: false,
    normalizePrefix: false,
  });
}

export function inspectGitHubWorkflow(source) {
  const document = parseGitHubWorkflow(source);
  const jobs = [];
  const steps = [];
  const commands = [];
  const statements = [];
  let commandOrder = 0;
  for (const [jobId, definition] of Object.entries(document.jobs ?? {})) {
    if (!definition || typeof definition !== 'object' || Array.isArray(definition)) continue;
    const job = { id: jobId, definition, document, steps: [] };
    jobs.push(job);
    for (const [stepIndex, stepDefinition] of (definition.steps ?? []).entries()) {
      if (!stepDefinition || typeof stepDefinition !== 'object' || Array.isArray(stepDefinition)) continue;
      const step = {
        job,
        index: stepIndex,
        definition: stepDefinition,
        commands: [],
        statements: [],
      };
      job.steps.push(step);
      steps.push(step);
      if (typeof stepDefinition.run !== 'string') continue;
      for (const statement of executableShellStatements(stepDefinition.run)) {
        const entry = { statement, step, job };
        step.statements.push(entry);
        statements.push(entry);
      }
      for (const command of executableShellCommands(stepDefinition.run)) {
        const entry = { command, order: commandOrder, step, job };
        commandOrder += 1;
        step.commands.push(entry);
        commands.push(entry);
      }
    }
  }
  return { document, jobs, steps, commands, statements };
}

const publishWorkflowPolicies = new Map([
  ['publish-packages.yml', {
    protected: false,
    allowLatest: false,
    publishDistTag: 'next',
    requireAllUnpublished: true,
    requireMatchingResume: true,
    uploadPath: 'reports/npm-publish-*.json',
    uploadMissingPolicy: 'error',
    publishScopes: [
      '@context-action/typedoc-vitepress-sync',
      '@context-action/ai-sdk',
      '@context-action/tool-durable-operations',
      '@context-action/llms-generator',
    ],
    allowedPublicationCommandPatterns: [
      /^pnpm\s+(?:run\s+)?publish:packages\b/u,
    ],
    consumerArguments: ['next', regularPackageCohort],
    captureArguments: [
      'next',
      regularPackageCohort,
      'reports/npm-publish-registry-evidence.json',
    ],
    publicationLeadingStatements: ['mkdir -p reports'],
    requiredPrepublicationSteps: [
      [
        ['pnpm release:check'],
        'must run the root release gate as a straight-line fail-closed step',
      ],
      [
        [
          'pnpm tool-durable:verify:env',
          'pnpm tool-durable:verify:redis',
          'pnpm tool-durable:verify:postgres',
          'pnpm tool-durable:verify:http',
          'pnpm tool-durable:verify:queue',
        ],
        'must run the durable release gates as one straight-line fail-closed step',
      ],
      [
        [
          'node scripts/verify-tool-protocol-changelog.mjs --package typedoc-vitepress-sync --forbid-unreleased --require-release-date',
          'node scripts/verify-tool-protocol-changelog.mjs --package ai-sdk --forbid-unreleased --require-release-date',
          'node scripts/verify-tool-protocol-changelog.mjs --package tool-durable-operations --forbid-unreleased --require-release-date',
          'node scripts/verify-tool-protocol-changelog.mjs --package llms-generator --forbid-unreleased --require-release-date',
        ],
        'must run every regular changelog gate as one straight-line fail-closed step',
      ],
    ],
    requiredJobEnvironment: [
      ['REDIS_URL', 'redis://127.0.0.1:6379', 'must bind the release Redis endpoint'],
      ['DATABASE_URL', 'postgres://context_action:context_action@127.0.0.1:5432/context_action', 'must bind the release Postgres endpoint'],
      ['DURABLE_OPERATION_ENVIRONMENT', 'release', 'must select fail-closed durable release configuration'],
    ],
    requiredServiceImages: [
      ['redis', 'redis:7-alpine', 'must provision the release Redis service'],
      ['postgres', 'postgres:16-alpine', 'must provision the release Postgres service'],
    ],
    requiredCommandPatterns: [
      [/^pnpm\s+(?:run\s+)?publish:packages\b.*--dist-tag next(?:\s|$)/u, 'must pass the approved regular dist-tag to the publish helper'],
      [/^pnpm\s+(?:run\s+)?publish:packages\b.*--require-all-unpublished(?:\s|$)/u, 'must require every regular candidate version to be unpublished before mutation'],
      [/^pnpm\s+(?:run\s+)?publish:packages\b.*--resume-matching-existing(?:\s|$)/u, 'must bind strict recovery to matching registry artifacts'],
      [/^pnpm\s+(?:run\s+)?publish:packages\b.*--scope @context-action\/typedoc-vitepress-sync(?:\s|$)/u, 'must publish typedoc-vitepress-sync through the regular publisher'],
      [/^pnpm\s+(?:run\s+)?publish:packages\b.*--scope @context-action\/ai-sdk(?:\s|$)/u, 'must publish ai-sdk through the regular publisher'],
      [/^pnpm\s+(?:run\s+)?publish:packages\b.*--scope @context-action\/tool-durable-operations(?:\s|$)/u, 'must publish durable operations through the regular publisher'],
      [/^pnpm\s+(?:run\s+)?publish:packages\b.*--scope @context-action\/llms-generator(?:\s|$)/u, 'must publish llms-generator through the regular publisher'],
    ],
    forbiddenCommandPatterns: [
      [/^pnpm\s+(?:run\s+)?publish:packages\b.*--scope @context-action\/mutative-core(?:\s|$)/u, 'must leave mutative-core exclusively to the protected Mutative publisher'],
      [/^pnpm\s+(?:run\s+)?publish:packages\b.*--scope @context-action\/mutative(?:\s|$)/u, 'must leave mutative exclusively to the protected Mutative publisher'],
    ],
    requiredBeforePublicationCommandPatterns: [
      [/^pnpm\s+release:check$/u, 'must run the root release gate before publication'],
      [/^pnpm\s+tool-durable:verify:env$/u, 'must verify durable environment configuration before publication'],
      [/^pnpm\s+tool-durable:verify:redis$/u, 'must run the Redis integration smoke test before publication'],
      [/^pnpm\s+tool-durable:verify:postgres$/u, 'must run the Postgres integration smoke test before publication'],
      [/^pnpm\s+tool-durable:verify:http$/u, 'must run the HTTP bridge smoke test before publication'],
      [/^pnpm\s+tool-durable:verify:queue$/u, 'must run the queue bridge smoke test before publication'],
      [/^node\s+scripts\/verify-tool-protocol-changelog\.mjs\s+--package typedoc-vitepress-sync\s+--forbid-unreleased\s+--require-release-date$/u, 'must verify the typedoc-vitepress-sync source and packed changelog before publication'],
      [/^node\s+scripts\/verify-tool-protocol-changelog\.mjs\s+--package ai-sdk\s+--forbid-unreleased\s+--require-release-date$/u, 'must verify the ai-sdk source and packed changelog before publication'],
      [/^node\s+scripts\/verify-tool-protocol-changelog\.mjs\s+--package tool-durable-operations\s+--forbid-unreleased\s+--require-release-date$/u, 'must verify the durable-operations source and packed changelog before publication'],
      [/^node\s+scripts\/verify-tool-protocol-changelog\.mjs\s+--package llms-generator\s+--forbid-unreleased\s+--require-release-date$/u, 'must verify the llms-generator source and packed changelog before publication'],
    ],
    requiredConditionalPrepublicationSteps: [
      [
        "startsWith(github.ref, 'refs/tags/')",
        [
          'git fetch origin main --no-tags',
          'git merge-base --is-ancestor "$GITHUB_SHA" origin/main',
        ],
        'must bind a release tag to a commit reachable from origin/main',
      ],
      [
        "github.event_name == 'workflow_dispatch'",
        [
          'git fetch origin main --no-tags',
          'test "$GITHUB_REF" = "refs/heads/main"',
          'test "$(git rev-parse HEAD)" = "$(git rev-parse origin/main)"',
        ],
        'must bind a manual publication to the current origin/main commit',
      ],
    ],
    requiredAdjacentPrepublicationStep: [
      eventSourceStatements,
      {},
      'must re-verify the clean event source immediately before publication',
    ],
  }],
  ['publish-prerelease.yml', {
    protected: false,
    allowLatest: false,
    publishDistTag: prereleaseDistTagExpression,
    requireAllUnpublished: true,
    requireMatchingResume: true,
    uploadPath: 'reports/npm-prerelease-*.json',
    uploadMissingPolicy: 'error',
    publishScopes: [
      '@context-action/core',
      '@context-action/tool-durable-operations',
      '@context-action/tool-protocol',
      '@context-action/webmcp',
      '@context-action/react',
    ],
    allowedPublicationCommandPatterns: [
      /^pnpm\s+(?:run\s+)?publish:packages\b/u,
    ],
    consumerArguments: [prereleaseDistTagExpression, prereleasePackageCohort],
    captureArguments: [
      prereleaseDistTagExpression,
      prereleasePackageCohort,
      'reports/npm-prerelease-registry-evidence.json',
    ],
    postPublicationGateArguments: [
      prereleaseDistTagExpression,
      prereleasePackageCohort,
      'reports/npm-prerelease-dist-tags.json',
    ],
    requiredCommandPatterns: [
      [/^pnpm\s+(?:run\s+)?publish:packages\b.*--dist-tag "\$\{\{ inputs\.dist_tag \}\}"(?:\s|$)/u, 'must pass the reviewed prerelease dist-tag input'],
      [/^pnpm\s+(?:run\s+)?publish:packages\b.*--require-all-unpublished(?:\s|$)/u, 'must require every prerelease candidate version to be unpublished before mutation'],
      [/^pnpm\s+(?:run\s+)?publish:packages\b.*--resume-matching-existing(?:\s|$)/u, 'must bind strict recovery to matching registry artifacts'],
      [/^pnpm\s+verify:prerelease-dist-tags\b/u, 'must verify that prerelease publication does not advance latest'],
    ],
    requiredInputOptionSets: [
      ['dist_tag', ['rc', 'next'], 'rc', 'must allow exactly the reviewed rc and next prerelease dist-tags'],
    ],
    requiredBoundPrepublicationSteps: [
      [
        prereleaseSourceStatements,
        { PRERELEASE_DIST_TAG: prereleaseDistTagExpression },
        'must bind the prerelease to current main and enforce the dist-tag allow-list immediately before publication',
      ],
    ],
    requiredPrepublicationSteps: [
      [
        ["node - <<'NODE'"],
        'must validate every exact prerelease package version in the reviewed inline validator before publication',
      ],
      [
        ['pnpm release:check'],
        'must run the root release gate as a straight-line fail-closed step',
      ],
      [
        [
          'node scripts/verify-tool-protocol-changelog.mjs --package core',
          'node scripts/verify-tool-protocol-changelog.mjs --package react',
          'node scripts/verify-tool-protocol-changelog.mjs --package tool-durable-operations',
          'node scripts/verify-tool-protocol-changelog.mjs --package tool-protocol',
          'node scripts/verify-tool-protocol-changelog.mjs --package webmcp',
        ],
        'must verify every prerelease source and packed changelog as one straight-line fail-closed step',
      ],
      [
        [
          'node scripts/verify-published-tool-consumers.cjs --local --cohort-only --packages "@context-action/core,@context-action/react,@context-action/tool-durable-operations,@context-action/tool-protocol,@context-action/webmcp"',
        ],
        'must verify the exact packed prerelease cohort dependency closure before publication',
      ],
    ],
    requiredAdjacentPrepublicationStep: [
      prereleaseSourceStatements,
      { PRERELEASE_DIST_TAG: prereleaseDistTagExpression },
      'must re-verify current main, the prerelease tag, and the clean event source immediately before publication',
    ],
  }],
  ['publish-v1-stable-candidate.yml', {
    protected: true,
    allowLatest: false,
    publishDistTag: 'next',
    requireAllUnpublished: true,
    requireMatchingResume: true,
    uploadPath: 'reports/npm-stable-candidate-*.json',
    uploadMissingPolicy: 'error',
    publishScopes: [
      '@context-action/tool-protocol',
      '@context-action/core',
      '@context-action/react',
    ],
    allowedPublicationCommandPatterns: [
      /^pnpm\s+(?:run\s+)?publish:packages\b/u,
    ],
    consumerArguments: ['next', stableCandidatePackageCohort],
    captureArguments: [
      'next',
      stableCandidatePackageCohort,
      'reports/npm-stable-candidate-registry-evidence.json',
    ],
    requiredCommandPatterns: [
      [/^pnpm\s+(?:run\s+)?publish:packages\b.*--dist-tag next(?:\s|$)/u, 'must publish the stable candidate to next'],
      [/^pnpm\s+(?:run\s+)?publish:packages\b.*--require-all-unpublished(?:\s|$)/u, 'must require every stable candidate version to be unpublished before mutation'],
      [/^pnpm\s+(?:run\s+)?publish:packages\b.*--resume-matching-existing(?:\s|$)/u, 'must bind strict recovery to matching registry artifacts'],
    ],
    requiredPrepublicationSteps: [
      [
        ['pnpm release:check'],
        'must run the root release gate as a straight-line fail-closed step',
      ],
    ],
    requiredAdjacentPrepublicationStep: [
      approvedSourceStatements,
      { RELEASE_COMMIT: releaseCommitExpression },
      'must re-verify the approved clean source immediately before publication',
    ],
  }],
  ['publish-coordinated-stable-candidate.yml', {
    protected: true,
    allowLatest: false,
    publishDistTag: 'next',
    requireAllUnpublished: true,
    requireMatchingResume: true,
    uploadPath: 'reports/npm-coordinated-stable-candidate-*.json',
    uploadMissingPolicy: 'error',
    publishScopes: [
      '@context-action/core',
      '@context-action/react',
    ],
    allowedPublicationCommandPatterns: [
      /^pnpm\s+(?:run\s+)?publish:packages\b/u,
    ],
    consumerArguments: ['next', coordinatedStablePackageCohort],
    captureArguments: [
      'next',
      coordinatedStablePackageCohort,
      'reports/npm-coordinated-stable-candidate-registry-evidence.json',
    ],
    requiredCommandPatterns: [
      [/^pnpm\s+(?:run\s+)?publish:packages\b.*--dist-tag next(?:\s|$)/u, 'must publish the coordinated stable candidate to next'],
      [/^pnpm\s+(?:run\s+)?publish:packages\b.*--require-all-unpublished(?:\s|$)/u, 'must require every coordinated candidate version to be unpublished before mutation'],
      [/^pnpm\s+(?:run\s+)?publish:packages\b.*--resume-matching-existing(?:\s|$)/u, 'must bind coordinated candidate recovery to matching registry artifacts'],
      [/^node\s+scripts\/verify-coordinated-stable-provenance\.mjs\s+--tag next\s+--commit "\$RELEASE_COMMIT"\s+--output reports\/npm-coordinated-stable-candidate-provenance\.json$/u, 'must verify next provenance before candidate evidence'],
    ],
    requiredPrepublicationSteps: [
      [
        ['pnpm verify:coordinated-stable-release-plan'],
        'must validate the exact coordinated stable plan before publication',
      ],
      [
        ['pnpm release:check'],
        'must run the root release gate as a straight-line fail-closed step',
      ],
      [
        ['node scripts/verify-published-tool-consumers.cjs --local --cohort-only --packages "@context-action/core,@context-action/react"'],
        'must verify the exact packed coordinated cohort dependency closure before publication',
      ],
    ],
    requiredAdjacentPrepublicationStep: [
      approvedSourceStatements,
      { RELEASE_COMMIT: releaseCommitExpression },
      'must re-verify the approved clean source immediately before publication',
    ],
  }],
  ['publish-maintenance-patch.yml', {
    protected: true,
    allowLatest: true,
    publishDistTag: 'maintenance',
    requireAllUnpublished: false,
    requireMatchingResume: false,
    uploadPath: 'reports/maintenance-patch-*.json',
    uploadMissingPolicy: 'ignore',
    publishScopes: ['$PACKAGE_NAME'],
    captureArguments: [
      'latest',
      '$PACKAGE_NAME',
      'reports/maintenance-patch-registry-evidence.json',
    ],
    captureLeadingStatements: [
      'pnpm verify:published-tool-consumers -- --tag latest --packages "$PATCH_CONSUMER_CLOSURE"',
    ],
    allowedPublicationCommandPatterns: [
      /^pnpm\s+(?:run\s+)?publish:packages\b/u,
      /^npm\s+dist-tag\s+add\s+"\$PACKAGE_NAME@\$current_latest"\s+"\$journal_previous_tag"\s+--registry=https:\/\/registry\.npmjs\.org$/u,
      /^npm\s+dist-tag\s+add\s+"\$PACKAGE_NAME@\$PACKAGE_VERSION"\s+"\$journal_(?:absent|ready|completed|rolled_back)_tag"\s+--registry=https:\/\/registry\.npmjs\.org$/u,
      /^npm\s+dist-tag\s+add\s+"\$PACKAGE_NAME@\$PACKAGE_VERSION"\s+latest\s+--registry=https:\/\/registry\.npmjs\.org$/u,
      /^npm\s+dist-tag\s+add\s+"\$PACKAGE_NAME@\$rollback_target"\s+latest\s+--registry=https:\/\/registry\.npmjs\.org$/u,
      /^npm\s+dist-tag\s+rm\s+"\$PACKAGE_NAME"\s+latest(?:\s|$)/u,
    ],
    requiredCommandPatterns: [
      [/^pnpm\s+(?:run\s+)?publish:packages\b.*--dist-tag maintenance(?:\s|$)/u, 'must publish a maintenance candidate before promotion'],
      [/^npm\s+dist-tag\s+add\s+"\$PACKAGE_NAME@\$PACKAGE_VERSION"\s+latest(?:\s|$)/u, 'must make latest an explicit promotion'],
    ],
    requiredStepNames: [
      [maintenanceStepNames.prepare, 'must retain rollback journal preparation'],
      [maintenanceStepNames.promote, 'must retain the explicit latest promotion'],
      [maintenanceStepNames.verify, 'must verify latest before finalizing the journal'],
      [maintenanceStepNames.journalEvidence, 'must capture the verified journal state before artifact upload'],
      [maintenanceStepNames.finalize, 'must finalize successful promotion state'],
      [maintenanceStepNames.rollback, 'must retain the latest rollback path'],
    ],
    requiredPrepublicationSteps: [
      [
        [
          'pnpm build',
          'pnpm --filter "$PACKAGE_NAME" type-check',
          'pnpm --filter "$PACKAGE_NAME" test',
        ],
        'must build the complete workspace dependency graph before maintenance target type-check and test',
      ],
    ],
    requiredAdjacentPrepublicationStep: [
      approvedSourceStatements,
      { RELEASE_COMMIT: releaseCommitExpression },
      'must re-verify the approved clean source immediately before publication',
    ],
    maintenanceStateMachine: true,
  }],
  ['publish-mutative.yml', {
    protected: true,
    allowLatest: false,
    publishDistTag: 'next',
    requireAllUnpublished: true,
    requireMatchingResume: true,
    uploadPath: 'reports/npm-mutative-*.json',
    uploadMissingPolicy: 'error',
    publishScopes: ['@context-action/mutative-core', '@context-action/mutative'],
    allowedPublicationCommandPatterns: [
      /^pnpm\s+(?:run\s+)?publish:packages\b/u,
    ],
    consumerArguments: ['next', mutativePackageCohort],
    captureArguments: [
      'next',
      mutativePackageCohort,
      'reports/npm-mutative-registry-evidence.json',
    ],
    requiredPrepublicationSteps: [
      [
        ['pnpm build'],
        'must build the complete Mutative cohort before publication',
      ],
      [
        [
          'node scripts/verify-tool-protocol-changelog.mjs --package mutative-core --forbid-unreleased --require-release-date',
          'node scripts/verify-tool-protocol-changelog.mjs --package mutative --forbid-unreleased --require-release-date',
        ],
        'must run both Mutative changelog gates as one straight-line fail-closed step',
      ],
    ],
    requiredCommandPatterns: [
      [/^pnpm\s+(?:run\s+)?publish:packages\b.*--dist-tag next(?:\s|$)/u, 'must pass the approved Mutative dist-tag to the publish helper'],
      [/^pnpm\s+(?:run\s+)?publish:packages\b.*--require-all-unpublished(?:\s|$)/u, 'must require every approved Mutative version to be unpublished before mutation'],
      [/^pnpm\s+(?:run\s+)?publish:packages\b.*--resume-matching-existing(?:\s|$)/u, 'must bind strict recovery to matching registry artifacts'],
      [/^pnpm\s+(?:run\s+)?publish:packages\b.*--scope @context-action\/mutative-core(?:\s|$)/u, 'must publish mutative-core through the reviewed helper'],
      [/^pnpm\s+(?:run\s+)?publish:packages\b.*--scope @context-action\/mutative(?:\s|$)/u, 'must publish mutative through the reviewed helper'],
    ],
    requiredBeforePublicationCommandPatterns: [
      [/^node\s+scripts\/verify-tool-protocol-changelog\.mjs\s+--package mutative-core\s+--forbid-unreleased\s+--require-release-date$/u, 'must verify the mutative-core source and packed changelog before publication'],
      [/^node\s+scripts\/verify-tool-protocol-changelog\.mjs\s+--package mutative\s+--forbid-unreleased\s+--require-release-date$/u, 'must verify the mutative source and packed changelog before publication'],
    ],
    requiredAdjacentPrepublicationStep: [
      approvedSourceStatements,
      { RELEASE_COMMIT: releaseCommitExpression },
      'must re-verify the approved clean source immediately before publication',
    ],
  }],
]);

function workflowEnvironment(document) {
  return document.env && typeof document.env === 'object' && !Array.isArray(document.env)
    ? document.env
    : {};
}

function jobEnvironment(job) {
  return job.definition.env && typeof job.definition.env === 'object' && !Array.isArray(job.definition.env)
    ? job.definition.env
    : {};
}

function stepEnvironment(step) {
  return step.definition.env && typeof step.definition.env === 'object'
    && !Array.isArray(step.definition.env)
    ? step.definition.env
    : {};
}

export function workflowPublicationCommands(inspection) {
  return inspection.commands.filter(({ command }) =>
    isPublishHelperCommand(command)
      || isIndirectPublicationCommand(command)
      || isDynamicPublicationCommand(command)
      || isWrappedPublicationCommand(command)
      || publishingCommandPatterns.some(pattern => pattern.test(command)));
}

function directNpmPublishCommands(inspection) {
  return inspection.commands.filter(({ command }) => /^npm\s+publish\b/u.test(command));
}

function publishHelperCommands(inspection) {
  return inspection.commands.filter(({ command }) => isPublishHelperCommand(command));
}

export function shellWords(command) {
  const words = [];
  let current = '';
  let quote;
  let escaped = false;
  let tokenStarted = false;
  const push = () => {
    if (tokenStarted) words.push(current);
    current = '';
    tokenStarted = false;
  };
  for (const character of command) {
    if (escaped) {
      current += character;
      escaped = false;
      tokenStarted = true;
      continue;
    }
    if (quote === "'") {
      if (character === quote) quote = undefined;
      else current += character;
      tokenStarted = true;
      continue;
    }
    if (quote === '"') {
      if (character === quote) quote = undefined;
      else if (character === '\\') escaped = true;
      else current += character;
      tokenStarted = true;
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
      tokenStarted = true;
    } else if (character === '\\') {
      escaped = true;
      tokenStarted = true;
    } else if (/\s/u.test(character)) {
      push();
    } else {
      current += character;
      tokenStarted = true;
    }
  }
  if (quote || escaped) throw new Error(`Unsupported unterminated shell token in: ${command}`);
  push();
  return words;
}

function isShellStringInvocation(words) {
  for (let index = 0; index < words.length; index += 1) {
    const executable = path.posix.basename((words[index] ?? '').replaceAll('\\', '/'));
    if (executable === 'eval') return true;
    if ((['bash', 'dash', 'ksh', 'sh', 'zsh'].includes(executable)
      || executable.startsWith('$')
      || executable.startsWith('`'))
      && words.slice(index + 1).some(word => /^-[^-]*c/u.test(word))) return true;
  }
  return false;
}

function isPublishHelperCommand(command) {
  const words = shellWords(command);
  if (isShellStringInvocation(words)) {
    return words.slice(1).some(word =>
      /(?:^|[\s'";])(scripts\/publish-packages\.cjs|(?:pnpm|npm|yarn)(?:\s+run)?\s+publish:packages)(?:[\s'";]|$)/u
        .test(word));
  }
  const packageManagerIndex = words.findIndex(word =>
    ['pnpm', 'npm', 'yarn'].includes(path.posix.basename(word.replaceAll('\\', '/'))));
  if (packageManagerIndex >= 0
    && words.slice(packageManagerIndex + 1).includes('publish:packages')) return true;
  const helperIndex = words.findIndex(word =>
    word.replace(/^\.\//u, '') === 'scripts/publish-packages.cjs');
  if (helperIndex === 0) return true;
  const helperRunnerIndex = words.slice(0, helperIndex).findLastIndex(word =>
    ['node', 'nodejs', 'pnpm', 'npm', 'npx', 'yarn', 'bun', 'tsx']
      .includes(path.posix.basename(word.replaceAll('\\', '/'))));
  return helperIndex > 0 && helperRunnerIndex >= 0
    && !words.slice(helperRunnerIndex, helperIndex)
      .some(word => word === '--check' || word === '-c');
}

function isIndirectPublicationCommand(command) {
  const words = shellWords(command);
  if (!isShellStringInvocation(words)) return false;
  return words.slice(1).some(word =>
    /(?:^|[\s'";])(?:npm\s+publish|pnpm\s+publish|lerna\s+publish|npm\s+dist-tag\s+(?:add|rm))(?:[\s'";]|$)/u
      .test(word));
}

function isDynamicPublicationCommand(command) {
  const words = shellWords(command);
  const executable = words[0] ?? '';
  return (executable.startsWith('$') || executable.startsWith('`'))
    && words.slice(1).some(word =>
      word === 'publish' || word === 'publish:packages' || word === 'dist-tag');
}

function isWrappedPublicationCommand(command) {
  const words = shellWords(command);
  for (let index = 0; index < words.length; index += 1) {
    const executable = path.posix.basename(words[index].replaceAll('\\', '/'));
    if (['npm', 'pnpm', 'yarn'].includes(executable)
      && words.slice(index + 1).some(word => word === 'publish' || word === 'dist-tag')) {
      return true;
    }
    if (executable === 'lerna' && words.slice(index + 1).includes('publish')) return true;
  }
  return false;
}

function hasShellInterpreterHeredoc(step) {
  if (typeof step.definition.run !== 'string') return false;
  const executable = stripShellComments(step.definition.run);
  return executable.split('\n').some(line =>
    /(?:^|\s)(?:(?:\/[^\s/]+)+\/)?(?:bash|dash|ksh|sh|zsh)\b[^\n]*<</u.test(line));
}

function hasInlineInterpreter(step) {
  if (typeof step.definition.run !== 'string') return false;
  const source = stripShellComments(step.definition.run);
  const interpreter = String.raw`(?:(?:\/[A-Za-z0-9_.-]+)+\/)?(?:bun|node(?:js)?|perl|python\d*(?:\.\d+)?|ruby|tsx)`;
  return new RegExp(String.raw`(?:^|[\s;&|\x28\x29\x60])${interpreter}\b[^\n;]*<<`, 'mu').test(source)
    || new RegExp(String.raw`(?:^|[\s;&|\x28\x29\x60])${interpreter}\s+(?:[^\n;]*?\s)?(?:-[A-Za-z]*[epc][A-Za-z]*\b|--(?:eval|print)(?:=|\s))`, 'mu')
      .test(source);
}

function reviewedInlineInterpreterStep(workflowName, step) {
  const name = step.definition.name;
  if (typeof name !== 'string' || typeof step.definition.run !== 'string') return false;
  const expectedHash = reviewedInlineInterpreterSteps.get(`${workflowName}:${name}`);
  return expectedHash !== undefined
    && createHash('sha256').update(step.definition.run).digest('hex') === expectedHash;
}

function reviewedDynamicLauncherStep(workflowName, step) {
  const name = step.definition.name;
  if (typeof name !== 'string' || typeof step.definition.run !== 'string') return false;
  const expectedHash = reviewedDynamicLauncherSteps.get(`${workflowName}:${name}`);
  return expectedHash !== undefined
    && createHash('sha256').update(step.definition.run).digest('hex') === expectedHash;
}

function canAccessPublicationCredentials(inspection) {
  const documentSource = JSON.stringify(inspection.document);
  return documentSource.includes('secrets.NPM_TOKEN')
    || documentSource.includes('NODE_AUTH_TOKEN')
    || documentSource.includes('"id-token":"write"');
}

function dynamicToken(word) {
  return typeof word === 'string' && (word.startsWith('$') || word.startsWith('`'));
}

const forbiddenExecutionWrappers = new Set([
  'chrt', 'ionice', 'nohup', 'parallel', 'script', 'setsid', 'stdbuf', 'sudo',
  'taskset', 'timeout', 'watch', 'xargs',
]);

function hasDynamicSensitiveLauncher(command) {
  const words = shellWords(command);
  if (dynamicToken(words[0])) return true;
  let executable = path.posix.basename((words[0] ?? '').replaceAll('\\', '/'));
  if (forbiddenExecutionWrappers.has(executable)) return true;
  let index = 1;
  if (executable === 'corepack') {
    if (dynamicToken(words[index])) return true;
    executable = path.posix.basename((words[index] ?? '').replaceAll('\\', '/'));
    index += 1;
  }
  if (['node', 'nodejs', 'bun', 'tsx'].includes(executable)) {
    const optionsWithValues = new Set(['--conditions', '--import', '--loader', '--require', '-r']);
    while (words[index]?.startsWith('-')) {
      const option = words[index];
      index += 1;
      if (optionsWithValues.has(option)) index += 1;
    }
    return dynamicToken(words[index]);
  }
  if (!['npm', 'pnpm', 'yarn'].includes(executable)) return false;
  const optionsWithValues = new Set([
    '--config-dir', '--dir', '--filter', '--global-dir', '--prefix', '--store-dir',
    '--userconfig', '--workspace', '-C', '-F',
  ]);
  while (words[index]?.startsWith('-')) {
    const option = words[index];
    index += 1;
    if (optionsWithValues.has(option)) index += 1;
  }
  return dynamicToken(words[index]);
}

function isShellStringExecution(command) {
  return isShellStringInvocation(shellWords(command));
}

function shellOptionValues(words, optionName) {
  const values = [];
  for (let index = 0; index < words.length; index += 1) {
    if (words[index] !== optionName) continue;
    values.push(words[index + 1]);
    index += 1;
  }
  return values;
}

function publishScopes(command) {
  return shellOptionValues(shellWords(command), '--scope');
}

function configuredStepShell(step) {
  return step.definition.shell
    ?? step.job.definition.defaults?.run?.shell
    ?? step.job.document.defaults?.run?.shell;
}

export function isUnconditionalFailClosedStep(step) {
  const continueOnError = step.definition['continue-on-error'];
  const condition = step.definition.if;
  return (continueOnError === undefined || continueOnError === false)
    && (condition === undefined || condition === 'success()' || condition === githubSuccessCondition)
    && configuredStepShell(step) === undefined;
}

function isFailClosedStepWithCondition(step, expectedCondition) {
  const continueOnError = step.definition['continue-on-error'];
  return (continueOnError === undefined || continueOnError === false)
    && step.definition.if === expectedCondition
    && configuredStepShell(step) === undefined;
}

function workflowInput(document, name) {
  const workflowDispatch = document.on?.workflow_dispatch;
  if (!workflowDispatch || typeof workflowDispatch !== 'object' || Array.isArray(workflowDispatch)) return undefined;
  const inputs = workflowDispatch.inputs;
  return inputs && typeof inputs === 'object' && !Array.isArray(inputs) ? inputs[name] : undefined;
}

function advancesLatest(inspection) {
  if (directNpmPublishCommands(inspection)
    .some(({ command }) => !/--tag(?:=|\s+)/u.test(command))) return true;
  if (inspection.commands.some(({ command }) =>
    /^(?:npm\s+publish|pnpm\s+(?:run\s+)?publish:packages|pnpm\s+publish)\b.*(?:--dist-tag|--tag)(?:=|\s+)["']?latest["']?(?:\s|$)/u.test(command)
      || /^npm\s+dist-tag\s+add\s+.+\s+latest(?:\s|$)/u.test(command))) return true;
  const environments = [
    workflowEnvironment(inspection.document),
    ...inspection.jobs.map(jobEnvironment),
    ...inspection.steps.map(stepEnvironment),
  ];
  if (environments.some(environment => Object.entries(environment)
    .some(([name, value]) => /DIST_TAG$/u.test(name) && value === 'latest'))) return true;
  const inputs = inspection.document.on?.workflow_dispatch?.inputs ?? {};
  return Object.values(inputs).some(input =>
    input && typeof input === 'object' && Array.isArray(input.options) && input.options.includes('latest'));
}

function environmentName(job) {
  const environment = job.definition.environment;
  if (typeof environment === 'string') return environment;
  return environment && typeof environment === 'object' && !Array.isArray(environment)
    ? environment.name
    : undefined;
}

function stepHasStatementsInOrder(step, expectedStatements) {
  const statements = step.statements.map(({ statement }) => statement);
  let cursor = -1;
  for (const expected of expectedStatements) {
    cursor = statements.findIndex((statement, index) => index > cursor && statement === expected);
    if (cursor < 0) return false;
  }
  return true;
}

function maintenanceStateMachineFailures(inspection) {
  const workflowName = 'publish-maintenance-patch.yml';
  const failures = [];
  const fail = detail => failures.push(`${workflowName} ${detail}`);
  const stateSteps = {};
  for (const [state, name] of Object.entries(maintenanceStepNames)) {
    const matches = inspection.steps.filter(step => step.definition.name === name);
    if (matches.length !== 1) {
      fail(`must contain exactly one ${name} step`);
    } else {
      stateSteps[state] = matches[0];
    }
  }
  if (Object.keys(stateSteps).length !== Object.keys(maintenanceStepNames).length) {
    return failures;
  }

  const { prepare, promote, verify, journalEvidence, finalize, rollback } = stateSteps;
  const evidenceUploads = inspection.steps.filter(step =>
    typeof step.definition.uses === 'string'
    && step.definition.uses.startsWith('actions/upload-artifact@')
    && step.definition.with?.path === 'reports/maintenance-patch-*.json');
  const evidenceUpload = evidenceUploads.length === 1 ? evidenceUploads[0] : undefined;
  const orderedSteps = [
    prepare,
    promote,
    verify,
    journalEvidence,
    evidenceUpload,
    finalize,
    rollback,
  ];
  if (!evidenceUpload
    || !orderedSteps.every(step => step?.job === prepare.job)
    || !orderedSteps.every((step, index) => index === 0 || step.index > orderedSteps[index - 1].index)) {
    fail('must prepare the rollback journal before latest promotion, verify latest before finalization, and keep rollback last');
  }
  if (evidenceUpload?.definition.if !== 'always()'
    || evidenceUpload?.definition['continue-on-error'] === true
    || evidenceUpload.index <= journalEvidence.index
    || evidenceUpload.index >= finalize.index) {
    fail('must upload maintenance evidence successfully before writing the completed journal marker');
  }
  if (!isUnconditionalFailClosedStep(prepare)
    || !isUnconditionalFailClosedStep(verify)
    || !isUnconditionalFailClosedStep(journalEvidence)
    || !isUnconditionalFailClosedStep(finalize)) {
    fail('must run journal preparation, latest verification, evidence capture, and successful finalization as fail-closed steps');
  }
  if (!isFailClosedStepWithCondition(
    promote,
    "env.JOURNAL_COMPLETED != 'true' && env.LATEST_ALREADY_PROMOTED != 'true'",
  )) {
    fail('must promote latest only from a prepared, incomplete journal');
  }
  if (!isFailClosedStepWithCondition(rollback, githubFailureOrCancelledCondition)) {
    fail('must run rollback on both failure() and cancelled()');
  }

  for (const step of [prepare, promote, journalEvidence, finalize, rollback]) {
    const statements = step.statements.map(({ statement }) => statement);
    if (maintenanceJournalMarkerStatements.some(expected =>
      statements.filter(statement => statement === expected).length !== 1)) {
      fail(`must bind every rollback journal marker to PACKAGE_VERSION in ${step.definition.name}`);
    }
  }

  const prepareRun = prepare.definition.run;
  if (typeof prepareRun !== 'string'
    || !prepareRun.includes('CURRENT_CANDIDATE="$PACKAGE_VERSION" node -e')
    || !prepareRun.includes('candidate !== process.env.CURRENT_CANDIDATE')
    || !prepareRun.includes(`foreign maintenance journal \${candidate} is unresolved`)
    || !prepareRun.includes(`foreign maintenance rollback \${candidate} is unfinished`)) {
    fail('must reject unresolved or unfinished foreign candidate journals before promotion');
  }

  const journalEvidenceEnvironment = stepEnvironment(journalEvidence);
  if (journalEvidenceEnvironment.JOURNAL_EVIDENCE_PATH
      !== 'reports/maintenance-patch-journal-evidence.json'
    || journalEvidenceEnvironment.RELEASE_COMMIT !== releaseCommitExpression
    || JSON.stringify(Object.keys(journalEvidenceEnvironment).sort())
      !== JSON.stringify(['JOURNAL_EVIDENCE_PATH', 'RELEASE_COMMIT'])) {
    fail('must bind journal evidence to the reviewed report path and immutable release_commit source');
  }
  const journalEvidenceRun = journalEvidence.definition.run;
  const journalEvidenceValidationSnippets = [
    'const candidate = process.env.PACKAGE_VERSION;',
    'if (process.env.RELEASE_COMMIT !== process.env.GITHUB_SHA) {',
    'if (tags.maintenance !== candidate || tags.latest !== candidate || ready !== candidate) {',
    'if (completed !== undefined && completed !== candidate) {',
    'if (rolledBack !== undefined) {',
    'if (previous !== undefined && absent === undefined) {',
    '} else if (previous === undefined && absent === candidate) {',
    'throw new Error("journal evidence requires exactly one predecessor representation");',
  ];
  if (typeof journalEvidenceRun !== 'string'
    || journalEvidenceValidationSnippets.some(snippet => !journalEvidenceRun.includes(snippet))) {
    fail('must validate candidate, latest, predecessor, ready, and terminal journal values before evidence capture');
  }
  const journalEvidenceReportSnippets = [
    'schemaVersion: 1,',
    'phase: completed === candidate ? "completed-rerun" : "verified-before-completion",',
    'package: process.env.PACKAGE_NAME,',
    'candidateVersion: candidate,',
    'releaseCommit: process.env.RELEASE_COMMIT,',
    'workflowEventSha: process.env.GITHUB_SHA,',
    'registry: "https://registry.npmjs.org",',
    'latest: tags.latest,',
    'maintenance: tags.maintenance,',
    'predecessor,',
    'ready,',
    'completed: completed ?? null,',
    'rolledBack: null,',
    'observedAt: new Date().toISOString(),',
    'writeFileSync(process.env.JOURNAL_EVIDENCE_PATH,',
  ];
  if (typeof journalEvidenceRun !== 'string'
    || journalEvidenceReportSnippets.some(snippet => !journalEvidenceRun.includes(snippet))) {
    fail('must write every reviewed maintenance journal evidence field to JOURNAL_EVIDENCE_PATH');
  }

  const previousJournalCommand = 'npm dist-tag add "$PACKAGE_NAME@$current_latest" "$journal_previous_tag" --registry=https://registry.npmjs.org';
  const absentJournalCommand = 'npm dist-tag add "$PACKAGE_NAME@$PACKAGE_VERSION" "$journal_absent_tag" --registry=https://registry.npmjs.org';
  const readyJournalCommand = 'npm dist-tag add "$PACKAGE_NAME@$PACKAGE_VERSION" "$journal_ready_tag" --registry=https://registry.npmjs.org';
  const promoteLatestCommand = 'npm dist-tag add "$PACKAGE_NAME@$PACKAGE_VERSION" latest --registry=https://registry.npmjs.org';
  const completedJournalCommand = 'npm dist-tag add "$PACKAGE_NAME@$PACKAGE_VERSION" "$journal_completed_tag" --registry=https://registry.npmjs.org';
  const rolledBackJournalCommand = 'npm dist-tag add "$PACKAGE_NAME@$PACKAGE_VERSION" "$journal_rolled_back_tag" --registry=https://registry.npmjs.org';
  const restoreLatestCommand = 'npm dist-tag add "$PACKAGE_NAME@$rollback_target" latest --registry=https://registry.npmjs.org';
  const removeLatestCommand = 'npm dist-tag rm "$PACKAGE_NAME" latest --registry=https://registry.npmjs.org';

  const candidatePublication = publishHelperCommands(inspection)[0];
  if (!candidatePublication || candidatePublication.step.index >= prepare.index
    || !stepHasStatementsInOrder(prepare, [
      previousJournalCommand,
      absentJournalCommand,
      readyJournalCommand,
      'dist_tags="$(read_dist_tags)"',
      'test "$(tag_value maintenance)" = "$PACKAGE_VERSION"',
      'test "$ready_marker" = "$PACKAGE_VERSION"',
      'test -z "$completed_marker"',
      'test -z "$rolled_back_marker"',
    ])) {
    fail('must persist and read back a candidate-specific predecessor and ready journal before latest promotion');
  }

  if (!stepHasStatementsInOrder(promote, [
    'current_latest="$(tag_value latest)"',
    'previous_latest="$(tag_value "$journal_previous_tag")"',
    'absent_marker="$(tag_value "$journal_absent_tag")"',
    'ready_marker="$(tag_value "$journal_ready_tag")"',
    'completed_marker="$(tag_value "$journal_completed_tag")"',
    'rolled_back_marker="$(tag_value "$journal_rolled_back_tag")"',
    'test "$(tag_value maintenance)" = "$PACKAGE_VERSION"',
    'test "$ready_marker" = "$PACKAGE_VERSION"',
    'test -z "$completed_marker"',
    'test -z "$rolled_back_marker"',
    'test "$current_latest" = "$previous_latest"',
    'test -z "$current_latest"',
    promoteLatestCommand,
  ])) {
    fail('must compare latest with the recorded predecessor immediately before promotion');
  }
  if (!stepHasStatementsInOrder(promote, [
    promoteLatestCommand,
    'dist_tags="$(read_dist_tags)"',
    'test "$(tag_value maintenance)" = "$PACKAGE_VERSION"',
    'test "$(tag_value latest)" = "$PACKAGE_VERSION"',
    'test "$(tag_value "$journal_ready_tag")" = "$PACKAGE_VERSION"',
    'test -z "$(tag_value "$journal_completed_tag")"',
    'test -z "$(tag_value "$journal_rolled_back_tag")"',
    'test "$(tag_value "$journal_previous_tag")" = "$previous_latest"',
    'test -z "$(tag_value "$journal_absent_tag")"',
    'test -z "$(tag_value "$journal_previous_tag")"',
    'test "$(tag_value "$journal_absent_tag")" = "$PACKAGE_VERSION"',
  ])) {
    fail('must verify the candidate and complete prepared journal immediately after latest promotion');
  }

  if (!stepHasStatementsInOrder(finalize, [
    'current_latest="$(tag_value latest)"',
    'test "$(tag_value maintenance)" = "$PACKAGE_VERSION"',
    'test "$current_latest" = "$PACKAGE_VERSION"',
    'test "$ready_marker" = "$PACKAGE_VERSION"',
    'test -z "$rolled_back_marker"',
    completedJournalCommand,
    'dist_tags="$(read_dist_tags)"',
    'test "$(tag_value maintenance)" = "$PACKAGE_VERSION"',
    'test "$(tag_value latest)" = "$PACKAGE_VERSION"',
    'test "$(tag_value "$journal_ready_tag")" = "$PACKAGE_VERSION"',
    'test "$(tag_value "$journal_completed_tag")" = "$PACKAGE_VERSION"',
    'test -z "$(tag_value "$journal_rolled_back_tag")"',
    'test "$(tag_value "$journal_previous_tag")" = "$previous_latest"',
    'test -z "$(tag_value "$journal_absent_tag")"',
    'test -z "$(tag_value "$journal_previous_tag")"',
    'test "$(tag_value "$journal_absent_tag")" = "$PACKAGE_VERSION"',
  ])) {
    fail('must persist and terminally verify a completed journal only while latest is the candidate');
  }

  if (!stepHasStatementsInOrder(rollback, [
    'maintenance_candidate="$(tag_value maintenance)"',
    'test "$maintenance_candidate" = "$PACKAGE_VERSION"',
    'test "$ready_marker" = "$PACKAGE_VERSION"',
    'if [ "$current_latest" != "$PACKAGE_VERSION" ]',
    `echo "Refusing rollback because latest changed to \${current_latest:-absent}." >&2`,
    rolledBackJournalCommand,
    'dist_tags="$(read_dist_tags)"',
    'test "$(tag_value maintenance)" = "$PACKAGE_VERSION"',
    'test "$(tag_value latest)" = "$PACKAGE_VERSION"',
    'test "$(tag_value "$journal_ready_tag")" = "$PACKAGE_VERSION"',
    'test "$(tag_value "$journal_rolled_back_tag")" = "$PACKAGE_VERSION"',
    'test -z "$(tag_value "$journal_completed_tag")"',
    restoreLatestCommand,
    removeLatestCommand,
  ])) {
    fail('must CAS-check latest and persist the rolled-back marker before restoring or removing latest');
  }
  const rollbackStatements = rollback.statements.map(({ statement }) => statement);
  const rolledBackMutationIndex = rollbackStatements.indexOf(rolledBackJournalCommand);
  const restoreMutationIndex = rollbackStatements.indexOf(restoreLatestCommand);
  const removeMutationIndex = rollbackStatements.indexOf(removeLatestCommand);
  const firstLatestMutationIndex = Math.min(
    restoreMutationIndex < 0 ? Number.POSITIVE_INFINITY : restoreMutationIndex,
    removeMutationIndex < 0 ? Number.POSITIVE_INFINITY : removeMutationIndex,
  );
  const preRestoreReadbacks = rollbackStatements.slice(
    rolledBackMutationIndex + 1,
    Number.isFinite(firstLatestMutationIndex) ? firstLatestMutationIndex : undefined,
  );
  const fullPreRestoreCasStatements = [
    'dist_tags="$(read_dist_tags)"',
    'test "$(tag_value maintenance)" = "$PACKAGE_VERSION"',
    'test "$(tag_value latest)" = "$PACKAGE_VERSION"',
    'test "$(tag_value "$journal_ready_tag")" = "$PACKAGE_VERSION"',
    'test "$(tag_value "$journal_rolled_back_tag")" = "$PACKAGE_VERSION"',
    'test -z "$(tag_value "$journal_completed_tag")"',
  ];
  if (rolledBackMutationIndex < 0 || !Number.isFinite(firstLatestMutationIndex)
    || fullPreRestoreCasStatements.some(expected =>
      preRestoreReadbacks.filter(statement => statement === expected).length < 2)) {
    fail('must CAS-check latest and persist the rolled-back marker before restoring or removing latest');
  }
  if (!stepHasStatementsInOrder(rollback, [
    restoreLatestCommand,
    removeLatestCommand,
    'dist_tags="$(read_dist_tags)"',
    'test "$(tag_value maintenance)" = "$PACKAGE_VERSION"',
    'test "$(tag_value latest)" = "$rollback_target"',
    'test "$(tag_value "$journal_ready_tag")" = "$PACKAGE_VERSION"',
    'test -z "$(tag_value "$journal_completed_tag")"',
    'test "$(tag_value "$journal_rolled_back_tag")" = "$PACKAGE_VERSION"',
    'test "$(tag_value "$journal_previous_tag")" = "$rollback_target"',
    'test -z "$(tag_value "$journal_absent_tag")"',
    'test -z "$(tag_value "$journal_previous_tag")"',
    'test "$(tag_value "$journal_absent_tag")" = "$PACKAGE_VERSION"',
  ])) {
    fail('must terminally verify latest and every journal marker after rollback');
  }
  return [...new Set(failures)];
}

export function protectedPublicationFailures(workflowName, inspection, publications) {
  const failures = [];
  const requiredGuardStatements = [
    ['[[ "$RELEASE_COMMIT" =~ ^[0-9a-f]{40}$ ]]', '40-character commit validation'],
    ['test "$GITHUB_REF" = "refs/heads/main"', 'a main dispatch-ref guard'],
    ['test "$RELEASE_COMMIT" = "$GITHUB_SHA"', 'release_commit equality with the immutable workflow event SHA'],
    ['test "$(git rev-parse HEAD)" = "$RELEASE_COMMIT"', 'checked-out commit equality'],
    ['git merge-base --is-ancestor "$RELEASE_COMMIT" origin/main', 'main ancestry validation'],
  ];
  const allowedAdditionalGuardStatements = workflowName.includes('Maintenance')
    || workflowName === 'publish-maintenance-patch.yml'
    ? ['test "$CONFIRMATION" = publish-maintenance-patch']
    : [];
  const releaseInput = workflowInput(inspection.document, 'release_commit');
  if (!releaseInput || typeof releaseInput !== 'object' || releaseInput.required !== true) {
    failures.push(`${workflowName} must include a required immutable release_commit input`);
  }
  for (const publication of publications) {
    const { job, step: publicationStep } = publication;
    if (environmentName(job) !== 'npm-stable') {
      failures.push(`${workflowName} must include the protected npm-stable environment`);
    }
    const checkout = job.steps.find(step =>
      typeof step.definition.uses === 'string'
      && step.definition.uses.startsWith('actions/checkout@')
      && step.definition.with?.ref === releaseCommitExpression
      && isUnconditionalFailClosedStep(step)
      && step.index < publicationStep.index);
    if (!checkout) failures.push(`${workflowName} must include checkout of the approved release_commit`);
    const guardStep = job.steps.find(step => {
      if (step.index >= publicationStep.index || !isUnconditionalFailClosedStep(step)) return false;
      const actual = step.statements.map(({ statement }) => statement);
      const expected = [
        ...requiredGuardStatements.map(([statement]) => statement),
        ...allowedAdditionalGuardStatements,
      ];
      return JSON.stringify(actual) === JSON.stringify(expected);
    });
    for (const [, description] of requiredGuardStatements) {
      if (!guardStep) failures.push(`${workflowName} must include ${description}`);
    }
  }
  return [...new Set(failures)];
}

async function main() {
  const output = path.resolve(repositoryRoot, option('--output', defaultOutput));
  const failures = [];
  const checks = [];
  const check = (name, passed, detail) => {
    checks.push({ name, passed, detail });
    if (!passed) failures.push(`${name}: ${detail}`);
  };

  const [
    securityPolicy,
    lockfile,
    workflowEntries,
    packageEntries,
    packageSource,
    examplePackageSource,
    durablePackageSource,
    publishHelper,
  ] = await Promise.all([
    readFile(path.join(repositoryRoot, 'SECURITY.md'), 'utf8').catch(() => ''),
    readFile(path.join(repositoryRoot, 'pnpm-lock.yaml'), 'utf8').catch(() => ''),
    readdir(path.join(repositoryRoot, '.github/workflows'), { withFileTypes: true }),
    readdir(path.join(repositoryRoot, 'packages'), { withFileTypes: true }),
    readFile(path.join(repositoryRoot, 'package.json'), 'utf8').catch(() => '{}'),
    readFile(path.join(repositoryRoot, 'example/package.json'), 'utf8').catch(() => '{}'),
    readFile(path.join(repositoryRoot, 'packages/tool-durable-operations/package.json'), 'utf8')
      .catch(() => '{}'),
    readFile(path.join(repositoryRoot, 'scripts/publish-packages.cjs'), 'utf8').catch(() => ''),
  ]);
  check('security policy', /## Supported versions/u.test(securityPolicy) && /## Reporting a vulnerability/u.test(securityPolicy), 'SECURITY.md must define supported versions and private reporting');
  check('lockfile', lockfile.length > 0, 'pnpm-lock.yaml must be present');

  const workflows = await Promise.all(workflowEntries
    .filter(entry => entry.isFile() && /\.ya?ml$/u.test(entry.name))
    .map(async entry => {
      const source = await readFile(path.join(repositoryRoot, '.github/workflows', entry.name), 'utf8');
      return { name: entry.name, source, inspection: inspectGitHubWorkflow(source) };
    }));
  const actionRefs = workflows.flatMap(({ name, inspection }) => [
    ...inspection.steps.map(step => step.definition.uses),
    ...inspection.jobs.map(job => job.definition.uses),
  ]
    .filter(value => typeof value === 'string')
    .map(value => {
      const separator = value.lastIndexOf('@');
      return {
        workflow: name,
        action: separator < 0 ? value : value.slice(0, separator),
        reference: separator < 0 ? '' : value.slice(separator + 1),
      };
    }));
  const mutableActions = actionRefs.filter(({ action, reference }) => !action.startsWith('./') && !/^[a-f0-9]{40}$/u.test(reference));
  check('pinned GitHub Actions', mutableActions.length === 0, mutableActions.length === 0
    ? `${actionRefs.length} external action references use full commit SHAs`
      : mutableActions.map(({ workflow, action, reference }) => `${workflow}: ${action}@${reference}`).join(', '));
  const shellStringExecutions = workflows.flatMap(({ name, inspection }) =>
    inspection.commands
      .filter(({ command }) => isShellStringExecution(command))
      .map(({ command }) => `${name}: ${command}`));
  check(
    'workflow shell command strings',
    shellStringExecutions.length === 0,
    shellStringExecutions.length === 0
      ? 'workflows do not execute dynamically interpreted shell command strings'
      : `bash/sh/zsh -c and eval are forbidden in workflows: ${shellStringExecutions.join(', ')}`,
  );
  const shellHeredocs = workflows.flatMap(({ name, inspection }) => inspection.steps
    .filter(hasShellInterpreterHeredoc)
    .map(step => `${name}: ${step.definition.name ?? `step ${step.index + 1}`}`));
  check(
    'workflow shell heredocs',
    shellHeredocs.length === 0,
    shellHeredocs.length === 0
      ? 'workflows do not execute shell interpreter heredocs'
      : `shell interpreter heredocs are forbidden: ${shellHeredocs.join(', ')}`,
  );
  const dynamicLaunchers = workflows
    .filter(({ name, inspection }) => publishWorkflowPolicies.has(name)
      || canAccessPublicationCredentials(inspection))
    .flatMap(({ name, inspection }) => inspection.steps
      .filter(step => step.commands.some(({ command }) => hasDynamicSensitiveLauncher(command))
        && !reviewedDynamicLauncherStep(name, step))
      .map(step => `${name}: ${step.definition.name ?? `step ${step.index + 1}`}`));
  check(
    'workflow dynamic launchers',
    dynamicLaunchers.length === 0,
    dynamicLaunchers.length === 0
      ? 'workflow command and reviewed script positions are literal'
      : `dynamic command and script positions are forbidden: ${dynamicLaunchers.join(', ')}`,
  );
  const unreviewedInlineInterpreters = workflows
    .filter(({ name }) => publishWorkflowPolicies.has(name))
    .flatMap(({ name, inspection }) => inspection.steps
      .filter(step => hasInlineInterpreter(step)
        && !reviewedInlineInterpreterStep(name, step))
      .map(step => `${name}: ${step.definition.name ?? `step ${step.index + 1}`}`));
  check(
    'workflow inline interpreters',
    unreviewedInlineInterpreters.length === 0,
    unreviewedInlineInterpreters.length === 0
      ? 'publishing workflows use only exact reviewed inline interpreter steps'
      : `unreviewed inline interpreter execution is forbidden in publishing workflows: ${unreviewedInlineInterpreters.join(', ')}`,
  );

  const publishWorkflows = workflows
    .filter(workflow => /^publish-.*\.ya?ml$/u.test(workflow.name)
      || workflowPublicationCommands(workflow.inspection).length > 0)
    .sort((left, right) => left.name.localeCompare(right.name));
  const unreviewedPublishWorkflows = publishWorkflows
    .filter(workflow => !publishWorkflowPolicies.has(workflow.name))
    .map(workflow => workflow.name);
  check(
    'publishing workflow inventory',
    publishWorkflows.length > 0 && unreviewedPublishWorkflows.length === 0,
    unreviewedPublishWorkflows.length === 0
      ? `${publishWorkflows.length} active publishing workflows have explicit supply-chain policies`
      : `unreviewed publishing workflows are forbidden: ${unreviewedPublishWorkflows.join(', ')}`,
  );

  const rootPackage = JSON.parse(packageSource);
  const examplePackage = JSON.parse(examplePackageSource);
  const durablePackage = JSON.parse(durablePackageSource);
  const scriptContractFailures = Object.entries(requiredRootScripts)
    .filter(([name, command]) => rootPackage.scripts?.[name] !== command)
    .map(([name]) => name);
  check(
    'release script bindings',
    scriptContractFailures.length === 0,
    scriptContractFailures.length === 0
      ? 'all workflow release commands are bound to reviewed root script implementations'
      : `root release scripts must not be rebound: ${scriptContractFailures.join(', ')}`,
  );
  const exampleScriptContractFailures = Object.entries(requiredExampleScripts)
    .filter(([name, command]) => examplePackage.scripts?.[name] !== command)
    .map(([name]) => name);
  check(
    'example release script bindings',
    exampleScriptContractFailures.length === 0,
    exampleScriptContractFailures.length === 0
      ? 'example check, test, and build commands are bound to reviewed implementations'
      : `example release scripts must not be rebound: ${exampleScriptContractFailures.join(', ')}`,
  );
  const durableScriptContractFailures = Object.entries(requiredDurablePackageScripts)
    .filter(([name, command]) => durablePackage.scripts?.[name] !== command)
    .map(([name]) => name);
  check(
    'durable release script bindings',
    durableScriptContractFailures.length === 0,
    durableScriptContractFailures.length === 0
      ? 'durable backend release gates are bound to reviewed package scripts'
      : `durable package release scripts must not be rebound: ${durableScriptContractFailures.join(', ')}`,
  );
  const helperContractPassed = rootPackage.scripts?.['publish:packages'] === requiredRootScripts['publish:packages']
    && publishHelper.includes("process.env.GITHUB_ACTIONS !== 'true'")
    && publishHelper.includes("if (!distTag) throw new Error('Scoped publishing requires --dist-tag')")
    && publishHelper.includes("throw new Error('Publication requires at least one explicit --scope package')")
    && publishHelper.includes("'--provenance'")
    && publishHelper.includes("'dist.integrity'")
    && publishHelper.includes("'--resume-matching-existing'")
    && publishHelper.includes("['run', 'prepublishOnly', '--if-present']");
  check(
    'provenance publish helper',
    helperContractPassed,
    'publish:packages must remain GitHub-only and require an explicit dist-tag plus npm --provenance',
  );

  const provenanceFailures = [];
  const tagPolicyFailures = [];
  const evidenceFailures = [];
  const protectedReleaseFailures = [];
  for (const workflow of publishWorkflows) {
    const { name, inspection } = workflow;
    const policy = publishWorkflowPolicies.get(name);
    if (inspection.document.permissions?.['id-token'] !== 'write') {
      provenanceFailures.push(`${name} does not grant workflow-level id-token: write`);
    }
    for (const { command } of directNpmPublishCommands(inspection)) {
      if (!/--provenance(?:\s|$)/u.test(command) || !/--tag(?:=|\s+)/u.test(command)) {
        provenanceFailures.push(`${name} has a direct npm publish without an explicit tag and --provenance`);
      }
    }
    if (publishHelperCommands(inspection).length > 0 && !helperContractPassed) {
      provenanceFailures.push(`${name} relies on a publish helper that does not enforce provenance`);
    }

    const publications = workflowPublicationCommands(inspection);
    const capture = inspection.commands.find(({ command }) => /^pnpm\s+capture:published-release\b/u.test(command));
    const upload = inspection.steps.find(step =>
      typeof step.definition.uses === 'string'
      && step.definition.uses.startsWith('actions/upload-artifact@')
      && step.definition.if === 'always()');
    if (!capture || !upload) {
      evidenceFailures.push(`${name} must capture registry evidence and always upload the evidence artifact`);
    } else if (!publications[0]
      || publications[0].job !== capture.job
      || publications[0].step.index >= capture.step.index
      || !isUnconditionalFailClosedStep(capture.step)
      || upload.job !== capture.job
      || upload.index <= capture.step.index) {
      evidenceFailures.push(`${name} must capture evidence after publication and upload it afterward`);
    }

    if (!policy) continue;
    for (const [environmentName, expected, description] of policy.requiredWorkflowEnvironment ?? []) {
      if (workflowEnvironment(inspection.document)[environmentName] !== expected) {
        tagPolicyFailures.push(`${name} ${description}`);
      }
      if (inspection.jobs.some(job => Object.hasOwn(jobEnvironment(job), environmentName))
        || inspection.steps.some(step => Object.hasOwn(stepEnvironment(step), environmentName))) {
        tagPolicyFailures.push(`${name} must not override protected workflow variable ${environmentName}`);
      }
    }
    for (const [environmentName, expected, description] of policy.requiredJobEnvironment ?? []) {
      const publicationJob = publications[0]?.job;
      if (!publicationJob || jobEnvironment(publicationJob)[environmentName] !== expected) {
        tagPolicyFailures.push(`${name} ${description}`);
      }
      if (publicationJob?.steps.some(step => Object.hasOwn(stepEnvironment(step), environmentName))) {
        tagPolicyFailures.push(`${name} must not override protected job variable ${environmentName}`);
      }
      if (publicationJob?.steps.some(step => step.statements.some(({ statement }) =>
        statement.includes('GITHUB_ENV')
        && new RegExp(`${environmentName}\\s*=`, 'u').test(statement)))) {
        tagPolicyFailures.push(`${name} must not rebind protected job variable ${environmentName} through GITHUB_ENV`);
      }
    }
    for (const [serviceName, image, description] of policy.requiredServiceImages ?? []) {
      if (!inspection.jobs.some(job => job.definition.services?.[serviceName]?.image === image)) {
        tagPolicyFailures.push(`${name} ${description}`);
      }
    }
    const helperCommands = publishHelperCommands(inspection);
    if (helperCommands.length !== 1) {
      tagPolicyFailures.push(`${name} must contain exactly one scoped publish helper invocation`);
    } else {
      const helperWords = shellWords(helperCommands[0].command);
      if (policy.publishScopes
        && JSON.stringify(publishScopes(helperCommands[0].command)) !== JSON.stringify(policy.publishScopes)) {
        tagPolicyFailures.push(`${name} must publish exactly its approved package scope cohort`);
      }
      if (JSON.stringify(shellOptionValues(helperWords, '--dist-tag'))
        !== JSON.stringify([policy.publishDistTag])) {
        tagPolicyFailures.push(`${name} must pass exactly its approved dist-tag to the publish helper`);
      }
      const strictCount = helperWords.filter(word => word === '--require-all-unpublished').length;
      if (strictCount !== (policy.requireAllUnpublished ? 1 : 0)) {
        tagPolicyFailures.push(`${name} must use its approved unpublished-cohort preflight policy`);
      }
      const resumeCount = helperWords.filter(word => word === '--resume-matching-existing').length;
      if (resumeCount !== (policy.requireMatchingResume ? 1 : 0)) {
        tagPolicyFailures.push(`${name} must use its approved integrity-bound strict recovery policy`);
      }
      if (policy.requireAllUnpublished) {
        const expectedPublicationStatements = [
          ...(policy.publicationLeadingStatements ?? []),
          helperCommands[0].command,
        ];
        const actualPublicationStatements = helperCommands[0].step.statements
          .map(({ statement }) => statement);
        if (!isUnconditionalFailClosedStep(helperCommands[0].step)
          || JSON.stringify(actualPublicationStatements)
            !== JSON.stringify(expectedPublicationStatements)) {
          tagPolicyFailures.push(`${name} must execute its strict publisher as a straight-line fail-closed step`);
        }
      }
    }
    const unexpectedPublication = publications.find(({ command }) =>
      !(policy.allowedPublicationCommandPatterns ?? []).some(pattern => pattern.test(command)));
    if (unexpectedPublication) {
      tagPolicyFailures.push(`${name} contains an unapproved publication command: ${unexpectedPublication.command}`);
    }
    for (const [pattern, description] of policy.requiredCommandPatterns ?? []) {
      if (!inspection.commands.some(({ command }) => pattern.test(command))) {
        tagPolicyFailures.push(`${name} ${description}`);
      }
    }
    for (const [pattern, description] of policy.forbiddenCommandPatterns ?? []) {
      if (inspection.commands.some(({ command }) => pattern.test(command))) {
        tagPolicyFailures.push(`${name} ${description}`);
      }
    }
    for (const [pattern, description] of policy.requiredBeforePublicationCommandPatterns ?? []) {
      const statement = inspection.statements.find(entry =>
        pattern.test(entry.statement)
        && publications[0]
        && entry.job === publications[0].job
        && entry.step.index < publications[0].step.index
        && isUnconditionalFailClosedStep(entry.step));
      if (!statement) {
        tagPolicyFailures.push(`${name} ${description}`);
      }
    }
    for (const [expectedStatements, description] of policy.requiredPrepublicationSteps ?? []) {
      const gateStep = inspection.steps.find(step =>
        publications[0]
        && step.job === publications[0].job
        && step.index < publications[0].step.index
        && isUnconditionalFailClosedStep(step)
        && JSON.stringify(step.statements.map(({ statement }) => statement))
          === JSON.stringify(expectedStatements));
      if (!gateStep) tagPolicyFailures.push(`${name} ${description}`);
    }
    for (const [condition, expectedStatements, description]
      of policy.requiredConditionalPrepublicationSteps ?? []) {
      const gateStep = inspection.steps.find(step =>
        publications[0]
        && step.job === publications[0].job
        && step.index < publications[0].step.index
        && isFailClosedStepWithCondition(step, condition)
        && JSON.stringify(step.statements.map(({ statement }) => statement))
          === JSON.stringify(expectedStatements));
      if (!gateStep) tagPolicyFailures.push(`${name} ${description}`);
    }
    for (const [expectedStatements, expectedEnvironment, description]
      of policy.requiredBoundPrepublicationSteps ?? []) {
      const gateStep = inspection.steps.find(step =>
        publications[0]
        && step.job === publications[0].job
        && step.index < publications[0].step.index
        && isUnconditionalFailClosedStep(step)
        && JSON.stringify(step.statements.map(({ statement }) => statement))
          === JSON.stringify(expectedStatements)
        && JSON.stringify(stepEnvironment(step)) === JSON.stringify(expectedEnvironment));
      if (!gateStep) tagPolicyFailures.push(`${name} ${description}`);
    }
    if (policy.requiredAdjacentPrepublicationStep && publications[0]) {
      const [expectedStatements, expectedEnvironment, description]
        = policy.requiredAdjacentPrepublicationStep;
      const gateStep = publications[0].job.steps[publications[0].step.index - 1];
      if (!gateStep
        || !isUnconditionalFailClosedStep(gateStep)
        || JSON.stringify(gateStep.statements.map(({ statement }) => statement))
          !== JSON.stringify(expectedStatements)
        || JSON.stringify(stepEnvironment(gateStep)) !== JSON.stringify(expectedEnvironment)) {
        tagPolicyFailures.push(`${name} ${description}`);
      }
    }
    const captureCommands = inspection.commands.filter(({ command }) => {
      const words = shellWords(command);
      return words[0] === 'pnpm' && words[1] === 'capture:published-release';
    });
    const expectedCaptureWords = policy.captureArguments
      ? [
        'pnpm',
        'capture:published-release',
        '--',
        '--tag',
        policy.captureArguments[0],
        '--packages',
        policy.captureArguments[1],
        '--consumer-status',
        'passed',
        '--output',
        policy.captureArguments[2],
      ]
      : undefined;
    const policyCapture = expectedCaptureWords
      ? captureCommands.find(({ command }) =>
        JSON.stringify(shellWords(command)) === JSON.stringify(expectedCaptureWords))
      : capture;
    const expectedCaptureStatements = policyCapture
      ? [...(policy.captureLeadingStatements ?? []), policyCapture.command]
      : [];
    if (!policyCapture || captureCommands.length !== 1
      || !isUnconditionalFailClosedStep(policyCapture.step)
      || JSON.stringify(policyCapture.step.statements.map(({ statement }) => statement))
        !== JSON.stringify(expectedCaptureStatements)) {
      tagPolicyFailures.push(`${name} must capture passing evidence for exactly its approved tag and package cohort`);
    }
    const evidenceUploads = inspection.steps.filter(step =>
      typeof step.definition.uses === 'string'
      && step.definition.uses.startsWith('actions/upload-artifact@'));
    const policyUpload = evidenceUploads.find(step =>
      policyCapture
      && step.job === policyCapture.job
      && step.index > policyCapture.step.index
      && step.definition.if === 'always()'
      && (step.definition['continue-on-error'] === undefined
        || step.definition['continue-on-error'] === false)
      && step.definition.with?.path === policy.uploadPath
      && step.definition.with?.['if-no-files-found'] === policy.uploadMissingPolicy);
    if (!policyUpload) {
      evidenceFailures.push(`${name} must fail closed while uploading the exact captured evidence path`);
    }
    let policyConsumer;
    if (policy.consumerArguments) {
      const consumerCommands = inspection.commands.filter(({ command }) => {
        const words = shellWords(command);
        return words[0] === 'pnpm' && words[1] === 'verify:published-tool-consumers';
      });
      const expectedConsumerWords = [
        'pnpm',
        'verify:published-tool-consumers',
        '--',
        '--tag',
        policy.consumerArguments[0],
        '--packages',
        policy.consumerArguments[1],
      ];
      policyConsumer = consumerCommands.find(({ command }) =>
        JSON.stringify(shellWords(command)) === JSON.stringify(expectedConsumerWords));
      if (!policyConsumer || !policyCapture || !publications[0]
        || consumerCommands.length !== 1
        || policyConsumer.job !== publications[0].job
        || policyCapture.job !== publications[0].job
        || policyConsumer.order <= publications[0].order
        || policyConsumer.order >= policyCapture.order
        || !isUnconditionalFailClosedStep(policyConsumer.step)
        || JSON.stringify(policyConsumer.step.statements.map(({ statement }) => statement))
          !== JSON.stringify([policyConsumer.command])) {
        tagPolicyFailures.push(`${name} must fail closed on the complete consumer cohort before recording passing evidence`);
      }
    }
    if (policy.postPublicationGateArguments) {
      const gateCommands = inspection.commands.filter(({ command }) => {
        const words = shellWords(command);
        return words[0] === 'pnpm' && words[1] === 'verify:prerelease-dist-tags';
      });
      const expectedGateWords = [
        'pnpm',
        'verify:prerelease-dist-tags',
        '--',
        '--tag',
        policy.postPublicationGateArguments[0],
        '--packages',
        policy.postPublicationGateArguments[1],
        '--output',
        policy.postPublicationGateArguments[2],
      ];
      const policyGate = gateCommands.find(({ command }) =>
        JSON.stringify(shellWords(command)) === JSON.stringify(expectedGateWords));
      if (!policyGate || gateCommands.length !== 1 || !publications[0] || !policyCapture
        || policyGate.job !== publications[0].job
        || policyGate.order <= (policyConsumer?.order ?? publications[0].order)
        || policyGate.order >= policyCapture.order
        || !isUnconditionalFailClosedStep(policyGate.step)
        || JSON.stringify(policyGate.step.statements.map(({ statement }) => statement))
          !== JSON.stringify([policyGate.command])) {
        tagPolicyFailures.push(`${name} must verify the exact prerelease tag and cohort before evidence capture`);
      }
    }
    for (const [stepName, description] of policy.requiredStepNames ?? []) {
      if (!inspection.steps.some(step => step.definition.name === stepName)) {
        tagPolicyFailures.push(`${name} ${description}`);
      }
    }
    if (policy.maintenanceStateMachine) {
      tagPolicyFailures.push(...maintenanceStateMachineFailures(inspection));
    }
    for (const [inputName, optionName, description] of policy.requiredInputOptions ?? []) {
      const input = workflowInput(inspection.document, inputName);
      if (!input || typeof input !== 'object' || !Array.isArray(input.options)
        || !input.options.includes(optionName)) {
        tagPolicyFailures.push(`${name} ${description}`);
      }
    }
    for (const [inputName, expectedOptions, expectedDefault, description]
      of policy.requiredInputOptionSets ?? []) {
      const input = workflowInput(inspection.document, inputName);
      if (!input || typeof input !== 'object'
        || input.required !== true
        || input.type !== 'choice'
        || input.default !== expectedDefault
        || JSON.stringify(input.options) !== JSON.stringify(expectedOptions)) {
        tagPolicyFailures.push(`${name} ${description}`);
      }
    }
    const latest = advancesLatest(inspection);
    if (latest && !policy.allowLatest) {
      tagPolicyFailures.push(`${name} must not publish or promote the latest dist-tag`);
    }
    if (latest && !policy.protected) {
      protectedReleaseFailures.push(`${name} cannot mutate latest without the protected stable-release contract`);
    }

    if (policy.protected) protectedReleaseFailures.push(
      ...protectedPublicationFailures(name, inspection, publications),
    );
  }
  check(
    'npm provenance permission',
    provenanceFailures.length === 0,
    provenanceFailures.length === 0
      ? `all ${publishWorkflows.length} publishing workflows grant OIDC and use provenance-capable publication`
      : provenanceFailures.join('; '),
  );
  check(
    'approved npm dist-tags',
    tagPolicyFailures.length === 0,
    tagPolicyFailures.length === 0
      ? 'all publishing workflows use their approved candidate or promotion dist-tags'
      : tagPolicyFailures.join('; '),
  );
  check(
    'protected stable publication',
    protectedReleaseFailures.length === 0,
    protectedReleaseFailures.length === 0
      ? 'protected publishers bind an immutable main commit to the npm-stable environment'
      : protectedReleaseFailures.join('; '),
  );
  check(
    'npm publication evidence',
    evidenceFailures.length === 0,
    evidenceFailures.length === 0
      ? 'all publishing workflows capture registry evidence and upload it'
      : evidenceFailures.join('; '),
  );

  const publicPackages = [];
  for (const entry of packageEntries.filter(item => item.isDirectory())) {
    const packageDirectory = path.join(repositoryRoot, 'packages', entry.name);
    const [manifestSource, license] = await Promise.all([
      readFile(path.join(packageDirectory, 'package.json'), 'utf8').catch(() => ''),
      readFile(path.join(packageDirectory, 'LICENSE'), 'utf8').catch(() => ''),
    ]);
    if (!manifestSource) continue;
    const manifest = JSON.parse(manifestSource);
    if (manifest.private === true) continue;
    publicPackages.push(manifest.name ?? entry.name);
    const expectedPrepublish = requiredPublicationBuildScripts.get(manifest.name);
    if (expectedPrepublish) {
      check(
        `publication build ${manifest.name}`,
        manifest.scripts?.prepublishOnly === expectedPrepublish,
        `public candidate package must bind prepublishOnly to ${expectedPrepublish}`,
      );
    }
    check(
      `license ${manifest.name ?? entry.name}`,
      ['Apache-2.0', 'MIT'].includes(manifest.license) && license.length > 0,
      'public package must declare an approved SPDX license and include LICENSE',
    );
  }

  const report = {
    schemaVersion: 'context-action-v1-security-report.v1',
    release: 'context-action-v1.0.0',
    generatedAt: new Date().toISOString(),
    status: failures.length === 0 ? 'passed' : 'failed',
    scope: {
      publicPackages: publicPackages.sort(),
      workflows: workflows.map(workflow => workflow.name).sort(),
      publishingWorkflows: publishWorkflows.map(workflow => workflow.name),
      limits: [
        'This local verifier checks release configuration, not a registry provenance attestation.',
        'Run pnpm security:audit and verify the post-publish npm provenance record for certification.',
      ],
    },
    checks,
  };
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${report.status} supply-chain report to ${path.relative(repositoryRoot, output)}`);
  if (failures.length > 0) {
    for (const failure of failures) console.error(failure);
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    console.error(error.stack ?? error.message);
    process.exitCode = 1;
  });
}
