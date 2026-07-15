import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';

const rootDirectory = path.resolve(import.meta.dirname, '..');
const protocolPath = path.join(
  rootDirectory,
  'demos/bolt-style-editor/src/openrouter-protocol.ts'
);
const standaloneSettingsPath = path.join(
  rootDirectory,
  'demos/bolt-style-editor/src/openrouter.ts'
);
const exampleSettingsPath = path.join(
  rootDirectory,
  'example/src/lib/openrouter-api-key.ts'
);
const require = createRequire(import.meta.url);
const typescript = require('typescript');
const source = await readFile(protocolPath, 'utf8');
const { outputText } = typescript.transpileModule(source, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
  fileName: protocolPath,
});
const protocol = await import(
  'data:text/javascript;base64,' + Buffer.from(outputText).toString('base64')
);

const sharedStorageKey = 'context-action.openrouter.api-key';
const standaloneSettingsSource = await readFile(standaloneSettingsPath, 'utf8');
const exampleSettingsSource = await readFile(exampleSettingsPath, 'utf8');
expect(
  standaloneSettingsSource.includes(sharedStorageKey) &&
    exampleSettingsSource.includes(sharedStorageKey),
  'Standalone and example OpenRouter settings must use the same storage key.'
);

function expect(condition, message) {
  if (!condition) throw new Error(message);
}

function expectEqual(actual, expected, message) {
  const actualText = JSON.stringify(actual);
  const expectedText = JSON.stringify(expected);
  if (actualText !== expectedText) {
    throw new Error(
      message + '\nexpected: ' + expectedText + '\nactual: ' + actualText
    );
  }
}

expectEqual(
  protocol.responseErrorCode(401),
  { code: 'OPENROUTER_AUTHENTICATION_FAILED', retryable: false },
  'HTTP 401 must be classified as a non-retryable authentication failure.'
);
expectEqual(
  protocol.responseErrorCode(403),
  { code: 'OPENROUTER_ACCESS_DENIED', retryable: false },
  'HTTP 403 must be classified as a non-retryable access failure.'
);
expectEqual(
  protocol.responseErrorCode(429),
  { code: 'OPENROUTER_RATE_LIMITED', retryable: true },
  'HTTP 429 must remain retryable.'
);
expectEqual(
  protocol.responseErrorCode(503),
  { code: 'OPENROUTER_PROVIDER_ERROR', retryable: true },
  'HTTP 5xx must remain retryable provider failures.'
);

const validResponse = await protocol.readOpenRouterResponse(
  new Response(JSON.stringify({ choices: [{ message: { role: 'assistant', content: 'ok' } }] }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
);
expectEqual(
  validResponse.choices?.[0]?.message?.content,
  'ok',
  'Valid provider JSON must be decoded into the canonical response shape.'
);

let invalidResponseError;
try {
  await protocol.readOpenRouterResponse(
    new Response('upstream unavailable', { status: 502 })
  );
} catch (error) {
  invalidResponseError = error;
}
expect(
  invalidResponseError instanceof protocol.OpenRouterRequestError,
  'Non-JSON provider responses must become typed OpenRouterRequestError values.'
);
expectEqual(
  {
    code: invalidResponseError?.code,
    retryable: invalidResponseError?.retryable,
    status: invalidResponseError?.status,
  },
  {
    code: 'OPENROUTER_INVALID_RESPONSE',
    retryable: false,
    status: 502,
  },
  'Invalid provider responses must preserve code, retryability, and status.'
);

expectEqual(
  JSON.parse(
    protocol.toolResultContent({
      isError: true,
      error: {
        code: 'TOOL_VALIDATION_FAILED',
        message: 'Theme is invalid.',
        retryable: false,
      },
    })
  ),
  {
    status: 'error',
    code: 'TOOL_VALIDATION_FAILED',
    message: 'Theme is invalid.',
    retryable: false,
  },
  'Tool errors sent back to the provider must retain structured error metadata.'
);

const controller = new AbortController();
controller.abort(new Error('cancelled by test'));
let abortError;
try {
  protocol.throwIfAborted(controller.signal);
} catch (error) {
  abortError = error;
}
expectEqual(
  abortError?.message,
  'cancelled by test',
  'Provider cancellation must preserve the caller abort reason.'
);

console.log('Verified standalone OpenRouter transport contracts.');
