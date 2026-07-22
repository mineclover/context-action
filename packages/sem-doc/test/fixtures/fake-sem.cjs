#!/usr/bin/env node

const command = process.argv[2];

if (command === '--version') {
  process.stdout.write('sem 0.21.0\n');
  process.exit(0);
}

const baseEntity = {
  id: 'src/auth.ts::function::authenticateUser',
  name: 'authenticateUser',
  type: 'function',
  file: 'src/auth.ts',
  lines: [1, 5],
};
const entity = process.argv[3] === 'secondary'
  ? {
      id: 'src/secondary.ts::function::secondary',
      name: 'secondary',
      type: 'function',
      file: 'src/secondary.ts',
      lines: [1, 5],
    }
  : baseEntity;
const repository = {
  id: 'src/repository.ts::class::UserRepository',
  name: 'UserRepository',
  type: 'class',
  file: 'src/repository.ts',
  lines: [1, 8],
};
const testEntity = {
  id: 'test/auth.test.ts::function::authenticateUserTest',
  name: 'authenticateUserTest',
  type: 'function',
  file: 'test/auth.test.ts',
  lines: [1, 6],
};
const controller = {
  id: 'src/controller.ts::class::AuthController',
  name: 'AuthController',
  type: 'class',
  file: 'src/controller.ts',
  lines: [1, 8],
};
const externalSurface = {
  id: 'node_modules/pkg/index.ts::function::publicApi',
  name: 'publicApi',
  type: 'function',
  file: 'node_modules/pkg/index.ts',
  lines: [1, 4],
};
const externalInternal = {
  id: 'node_modules/pkg/internal.ts::function::privateApi',
  name: 'privateApi',
  type: 'function',
  file: 'node_modules/pkg/internal.ts',
  lines: [1, 4],
};
const includeNodeModulesSurface = process.argv.includes('--no-default-excludes');
const forceNodeModulesSurface = process.argv[3] === 'forcedNodeModules';
const emitNodeModulesSurface = includeNodeModulesSurface || forceNodeModulesSurface;

function numberOption(name, fallback) {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : Number(process.argv[index + 1]);
}

if (command === 'impact') {
  const depth = numberOption('--depth', 2);
  const impactEntities = [
    { ...repository, depth: 1 },
    { ...controller, depth: 2 },
    ...(emitNodeModulesSurface
      ? [{ ...externalSurface, depth: 1 }, { ...externalInternal, depth: 2 }]
      : []),
    ...(process.argv[3] === 'testInImpact' ? [{ ...testEntity, depth: 2 }] : []),
  ].filter((candidate) => candidate.depth <= depth);
  process.stdout.write(
    `${JSON.stringify({
      entity,
      dependencies: [repository, ...(emitNodeModulesSurface ? [externalSurface] : [])],
      dependents: [repository],
      impact: { depth, total: impactEntities.length, entities: impactEntities },
      tests: [testEntity],
      tests_truncated: process.argv[3] === 'truncatedTests',
    })}\n`
  );
  process.exit(0);
}

if (command === 'context') {
  const budget = numberOption('--budget', 8000);
  const truncated = budget < 24;
  const entries = truncated
    ? []
    : [
        {
          ...entity,
          role: 'target',
          tokens: 12,
          content: 'function authenticateUser() { return true; }',
        },
        {
          ...repository,
          role: 'direct_dependency',
          tokens: 12,
          content: 'class UserRepository {}',
        },
        ...(emitNodeModulesSurface
          ? [
              {
                ...externalSurface,
                role: 'direct_dependency',
                tokens: 4,
                content: 'function publicApi() {}',
              },
              {
                ...externalInternal,
                role: 'transitive_dependency',
                tokens: 4,
                content: 'function privateApi() {}',
              },
            ]
          : []),
      ];
  process.stdout.write(
    `${JSON.stringify({
      entity: entity.name,
      entityId: entity.id,
      budget,
      total_tokens: truncated ? 0 : entries.reduce((total, entry) => total + entry.tokens, 0),
      truncated,
      target_omitted: truncated,
      entries,
    })}\n`
  );
  process.exit(0);
}

if (command === 'diff') {
  process.stdout.write(
    `${JSON.stringify({
      summary: { fileCount: 1, added: 0, modified: 1, deleted: 0, total: 1 },
      changes: [
        {
          ...entity,
          changeType: 'modified',
          startLine: 1,
          endLine: 5,
          structuralChange: true,
        },
      ],
    })}\n`
  );
  process.exit(0);
}

if (command === 'entities') {
  process.stdout.write(`${JSON.stringify([entity, repository, testEntity])}\n`);
  process.exit(0);
}

process.stderr.write(`unsupported fake sem command: ${command ?? '<missing>'}\n`);
process.exit(2);
