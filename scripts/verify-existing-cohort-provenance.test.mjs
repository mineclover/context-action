import assert from 'node:assert/strict';
import test from 'node:test';
import {
  attestedCommit,
  EXPECTED_REPOSITORY,
  EXPECTED_WORKFLOW_PATH,
  EXPECTED_WORKFLOW_REF,
  validateProvenanceStatement,
} from './verify-existing-cohort-provenance.mjs';

const approvedCommit = 'a'.repeat(40);

function statement(commit = approvedCommit, workflow = {}) {
  return {
    predicate: {
      buildDefinition: {
        resolvedDependencies: [{ digest: { gitCommit: commit } }],
        externalParameters: {
          workflow: {
            repository: EXPECTED_REPOSITORY,
            path: EXPECTED_WORKFLOW_PATH,
            ref: EXPECTED_WORKFLOW_REF,
            ...workflow,
          },
        },
      },
    },
  };
}

test('accepts an existing artifact bound to the approved source and workflow', () => {
  assert.equal(attestedCommit(statement()), approvedCommit);
  assert.deepEqual(validateProvenanceStatement(statement(), { commit: approvedCommit }), {
    repository: EXPECTED_REPOSITORY,
    path: EXPECTED_WORKFLOW_PATH,
    ref: EXPECTED_WORKFLOW_REF,
  });
});

test('rejects a byte-identical existing artifact built from an older commit', () => {
  assert.throws(
    () => validateProvenanceStatement(statement('b'.repeat(40)), { commit: approvedCommit }),
    /does not match approved/u,
  );
});

test('rejects existing artifacts from another workflow or ref', () => {
  assert.throws(
    () => validateProvenanceStatement(statement(approvedCommit, { path: '.github/workflows/other.yml' }), { commit: approvedCommit }),
    /workflow path/u,
  );
  assert.throws(
    () => validateProvenanceStatement(statement(approvedCommit, { ref: 'refs/heads/release' }), { commit: approvedCommit }),
    /workflow ref/u,
  );
});

test('fails closed when the attestation has no source commit', () => {
  const missingCommit = statement();
  missingCommit.predicate.buildDefinition.resolvedDependencies = [];
  assert.throws(
    () => validateProvenanceStatement(missingCommit, { commit: approvedCommit }),
    /does not match approved/u,
  );
});
