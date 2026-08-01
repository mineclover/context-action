#!/usr/bin/env node

import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, '..');
const coreDistDirectory = path.join(repositoryRoot, 'packages/core/dist');
const require = createRequire(import.meta.url);

async function verifyRuntime(label, runtime) {
  const warnings = [];
  const originalWarn = console.warn;
  const originalError = console.error;
  const originalLog = console.log;

  console.warn = (...args) => warnings.push(['warn', args]);
  console.error = (...args) => warnings.push(['error', args]);
  console.log = (...args) => warnings.push(['log', args]);

  try {
    const silent = new runtime.ActionRegister();
    await silent.dispatch('missing');

    const unlimited = new runtime.ActionRegister();
    for (let index = 0; index < 1001; index += 1) {
      unlimited.register('many', () => undefined, { id: `handler-${index}` });
    }

    const limited = new runtime.ActionRegister({
      registry: { maxHandlersPerAction: 1 },
    });
    limited.register('limited', () => undefined, { id: 'stable' });
    limited.register('limited', () => undefined, {
      id: 'stable',
      replaceExisting: true,
    });
    let limitErrorName;
    try {
      limited.register('limited', () => undefined, { id: 'overflow' });
    } catch (error) {
      limitErrorName = error?.constructor?.name;
    }

    const conditional = new runtime.ActionRegister();
    conditional.register('conditional', () => undefined, {
      condition: () => {
        throw new Error('condition failure');
      },
    });
    let conditionError;
    try {
      await conditional.dispatch('conditional');
    } catch (error) {
      conditionError = error?.message;
    }

    assert.equal(warnings.length, 0, `${label}: default runtime must not emit diagnostics`);
    assert.equal(unlimited.getHandlerCount('many'), 1001, `${label}: default handler limit must be unbounded`);
    assert.equal(limited.getHandlerCount('limited'), 1, `${label}: replacement must not consume another slot`);
    assert.equal(limitErrorName, 'RangeError', `${label}: finite handler overflow must be explicit`);
    assert.equal(conditionError, 'condition failure', `${label}: condition failures must reject dispatch`);

    let invalidTimeoutErrorName;
    try {
      silent.dispatch('missing', undefined, { timeout: -1 });
    } catch (error) {
      invalidTimeoutErrorName = error?.constructor?.name;
    }
    assert.equal(invalidTimeoutErrorName, 'RangeError', `${label}: invalid timeouts must fail explicitly`);

    const result = {
      defaultDiagnostics: warnings.length,
      unlimitedHandlerCount: unlimited.getHandlerCount('many'),
      limitedHandlerCount: limited.getHandlerCount('limited'),
      limitErrorName,
      conditionError,
      invalidTimeoutErrorName,
    };

    silent.destroy();
    unlimited.destroy();
    limited.destroy();
    conditional.destroy();

    return result;
  } finally {
    console.warn = originalWarn;
    console.error = originalError;
    console.log = originalLog;
  }
}

const esm = await import(pathToFileURL(path.join(coreDistDirectory, 'index.js')).href);
const cjs = require(path.join(coreDistDirectory, 'index.cjs'));
const esmResult = await verifyRuntime('ESM', esm);
const cjsResult = await verifyRuntime('CJS', cjs);

assert.deepEqual(esmResult, cjsResult, 'ESM and CJS core artifacts diverged');
console.log('Verified core ESM/CJS runtime parity for diagnostics, limits, conditions, and timeout validation.');
