#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = path.join(repositoryRoot, 'docs/releases/v1.0.0/release-manifest.json');

function requiredEnvironment(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required to verify the independent audit review`);
  return value;
}

async function githubJson(url, token) {
  const response = await fetch(url, {
    headers: {
      accept: 'application/vnd.github+json',
      authorization: `Bearer ${token}`,
      'x-github-api-version': '2022-11-28',
    },
  });
  if (!response.ok) throw new Error(`GitHub review lookup failed: HTTP ${response.status}`);
  return response.json();
}

async function main() {
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const review = manifest.audit?.review;
  if (manifest.audit?.status !== 'accepted' || !review || typeof review !== 'object') {
    throw new Error('Accepted independent audit review is required');
  }
  const [repository, token] = [requiredEnvironment('GITHUB_REPOSITORY'), requiredEnvironment('GITHUB_TOKEN')];
  if (!/^[^/]+\/[^/]+$/u.test(repository)) throw new Error('GITHUB_REPOSITORY must be an owner/name value');
  if (!Number.isInteger(review.pullRequest) || review.pullRequest <= 0 || !Number.isInteger(review.reviewId) || review.reviewId <= 0) {
    throw new Error('Audit review must contain positive pullRequest and reviewId values');
  }
  const apiBase = process.env.GITHUB_API_URL ?? 'https://api.github.com';
  const remote = await githubJson(
    `${apiBase}/repos/${repository}/pulls/${review.pullRequest}/reviews/${review.reviewId}`,
    token,
  );
  const errors = [];
  if (remote.user?.login !== review.login) errors.push('GitHub review login does not match the manifest');
  if (remote.state !== 'APPROVED' || review.decision !== 'APPROVED') errors.push('GitHub review is not approved');
  if (remote.commit_id !== review.reviewCommit) errors.push('GitHub review commit does not match the manifest');
  if (remote.user?.login === manifest.releaseApproval?.owner) {
    errors.push('Independent auditor cannot also be the recorded G0/G1 release owner');
  }
  if (errors.length > 0) throw new Error(errors.join('\n'));
  console.log(JSON.stringify({
    status: 'verified', pullRequest: review.pullRequest, reviewId: review.reviewId, reviewer: review.login,
  }));
}

main().catch(error => {
  console.error(error.stack ?? error.message);
  process.exitCode = 1;
});
