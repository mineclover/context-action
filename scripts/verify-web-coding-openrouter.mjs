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
expectEqual(
  protocol.OPENROUTER_MAX_TRANSIENT_RETRIES,
  2,
  'Transient provider retry count must remain bounded.'
);
expect(
  standaloneSettingsSource.includes('OPENROUTER_REQUEST_TIMEOUT_MS = 20_000') &&
    standaloneSettingsSource.includes("code: 'OPENROUTER_TIMEOUT'") &&
    standaloneSettingsSource.includes("reason: 'timeout'"),
  'Standalone OpenRouter requests must preserve a bounded timeout retry path.'
);
expectEqual(
  protocol.openRouterRetryDelayMs(0, '2'),
  2_000,
  'Retry-After seconds must be respected within the bounded delay.'
);
expectEqual(
  protocol.openRouterRetryDelayMs(1),
  700,
  'Transient retry backoff must grow deterministically.'
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

const normalizedToolResponse = await protocol.readOpenRouterResponse(
  new Response(
    JSON.stringify({
      choices: [
        {
          message: {
            role: 'assistant',
            tool_calls: [
              {
                id: ' call_1 ',
                type: 'function',
                function: {
                  name: ' workspace.getStatus ',
                  arguments: '{}',
                },
              },
            ],
          },
        },
      ],
    }),
    { status: 200, headers: { 'content-type': 'application/json' } }
  )
);
expectEqual(
  normalizedToolResponse.choices?.[0]?.message?.tool_calls?.[0],
  {
    id: 'call_1',
    type: 'function',
    function: { name: 'workspace.getStatus', arguments: '{}' },
  },
  'Provider tool calls must be normalized into the canonical function shape.'
);

async function expectInvalidProviderResponse(body, expectedMessage, label) {
  let invalidShapeError;
  try {
    await protocol.readOpenRouterResponse(
      new Response(JSON.stringify(body), { status: 200 })
    );
  } catch (error) {
    invalidShapeError = error;
  }
  expect(
    invalidShapeError instanceof protocol.OpenRouterRequestError,
    `${label} must become a typed provider response error.`
  );
  expectEqual(
    {
      code: invalidShapeError?.code,
      retryable: invalidShapeError?.retryable,
    },
    {
      code: 'OPENROUTER_INVALID_RESPONSE',
      retryable: false,
    },
    `${label} must be classified as non-retryable invalid provider data.`
  );
  expect(
    invalidShapeError?.message.includes(expectedMessage),
    `${label} must preserve an actionable diagnostic.`
  );
}

await expectInvalidProviderResponse(
  {
    choices: [
      {
        message: {
          role: 'assistant',
          tool_calls: [
            {
              type: 'function',
              function: { name: 'workspace.getStatus', arguments: '{}' },
            },
          ],
        },
      },
    ],
  },
  'without a valid id',
  'Missing tool call ids'
);
await expectInvalidProviderResponse(
  {
    choices: [
      {
        message: {
          role: 'assistant',
          tool_calls: [
            {
              id: 'duplicate',
              type: 'function',
              function: { name: 'workspace.getStatus', arguments: '{}' },
            },
            {
              id: 'duplicate',
              type: 'function',
              function: { name: 'workspace.listFiles', arguments: '{}' },
            },
          ],
        },
      },
    ],
  },
  'duplicate tool call id',
  'Duplicate tool call ids'
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
    code: 'OPENROUTER_PROVIDER_ERROR',
    retryable: true,
    status: 502,
  },
  'Non-JSON 5xx provider responses must preserve retryable classification and status.'
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
