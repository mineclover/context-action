'use strict';

/**
 * npm can briefly return ETARGET while a just-published package or dist-tag is
 * propagating between registry replicas. Keep this policy deliberately
 * narrow: only the npm messages that mean "the requested version is not
 * visible yet" are retryable. Authentication, network, integrity, and
 * malformed metadata failures remain terminal.
 *
 * npm's public registry can take several minutes to expose a newly published
 * version and its attestations on every replica. The default budget is
 * intentionally bounded at 425 seconds (5s + 10s + 20s + 30s + 60s + 120s
 * + 180s) so release verification can absorb normal propagation without
 * masking a real failure indefinitely. Callers may provide a shorter budget
 * for local checks and tests.
 */
const DEFAULT_RETRY_DELAYS = [5000, 10000, 20000, 30000, 60000, 120000, 180000];

function errorText(error) {
  if (error == null) return '';
  if (typeof error === 'string') return error;
  return [error.code, error.message, error.stdout, error.stderr]
    .filter(value => value != null)
    .map(String)
    .join('\n');
}

function isTransientRegistryVisibilityError(error) {
  if (error?.retryableRegistryVisibility === true) return true;
  const text = errorText(error);
  return /\bETARGET\b|No matching version found|\bE404\b|404\s+Not Found/iu.test(text);
}

function retryTransientRegistryVisibilitySync(operation, options = {}) {
  const delays = Array.isArray(options.delays) ? options.delays : DEFAULT_RETRY_DELAYS;
  const sleep = options.sleep ?? (delay => {
    if (delay > 0) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, delay);
  });
  const onRetry = options.onRetry ?? (() => {});

  for (let attempt = 0; ; attempt += 1) {
    try {
      return operation(attempt);
    } catch (error) {
      if (!isTransientRegistryVisibilityError(error) || attempt >= delays.length) throw error;
      const delay = delays[attempt];
      onRetry({ attempt: attempt + 1, nextAttempt: attempt + 2, delay, error });
      sleep(delay);
    }
  }
}

async function retryTransientRegistryVisibility(operation, options = {}) {
  const delays = Array.isArray(options.delays) ? options.delays : DEFAULT_RETRY_DELAYS;
  const sleep = options.sleep ?? (delay => new Promise(resolve => setTimeout(resolve, delay)));
  const onRetry = options.onRetry ?? (() => {});

  for (let attempt = 0; ; attempt += 1) {
    try {
      return await operation(attempt);
    } catch (error) {
      if (!isTransientRegistryVisibilityError(error) || attempt >= delays.length) throw error;
      const delay = delays[attempt];
      await onRetry({ attempt: attempt + 1, nextAttempt: attempt + 2, delay, error });
      await sleep(delay);
    }
  }
}

module.exports = {
  errorText,
  isTransientRegistryVisibilityError,
  retryTransientRegistryVisibility,
  retryTransientRegistryVisibilitySync,
};
