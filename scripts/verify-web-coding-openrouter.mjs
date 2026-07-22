import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const rootDirectory = path.resolve(import.meta.dirname, '..');
const protocolPath = path.join(
  rootDirectory,
  'demos/bolt-style-editor/src/openrouter-protocol.ts'
);
const toolProtocolPath = path.join(
  rootDirectory,
  'packages/tool-protocol/dist/index.js'
);
const standaloneSettingsPath = path.join(
  rootDirectory,
  'demos/bolt-style-editor/src/openrouter.ts'
);
const modelCatalogPath = path.join(
  rootDirectory,
  'demos/bolt-style-editor/src/openrouter-models.ts'
);
const exampleSettingsPath = path.join(
  rootDirectory,
  'example/src/lib/openrouter-api-key.ts'
);
const sharedStoragePath = path.join(
  rootDirectory,
  'packages/openrouter-browser-storage/src/index.ts'
);
const require = createRequire(import.meta.url);
const typescript = require('typescript');
const transpileToDataUrl = (source, fileName) => {
  const { outputText } = typescript.transpileModule(source, {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
    fileName,
  });
  return 'data:text/javascript;base64,' + Buffer.from(outputText).toString('base64');
};
const toolProtocolModuleUrl = pathToFileURL(toolProtocolPath).href;
const source = await readFile(protocolPath, 'utf8');
const sourceWithCanonicalProtocol = source.replace(
  "from '@context-action/tool-protocol';",
  `from ${JSON.stringify(toolProtocolModuleUrl)};`
);
expect(
  sourceWithCanonicalProtocol !== source,
  'OpenRouter protocol must import the canonical tool protocol contract.'
);
const protocolModuleUrl = transpileToDataUrl(
  sourceWithCanonicalProtocol,
  protocolPath
);
const protocol = await import(
  protocolModuleUrl
);

const sharedStorageKey = 'context-action.openrouter.api-key';
const standaloneSettingsSource = await readFile(standaloneSettingsPath, 'utf8');
const modelCatalogSource = await readFile(modelCatalogPath, 'utf8');
const exampleSettingsSource = await readFile(exampleSettingsPath, 'utf8');
const sharedStorageSource = await readFile(sharedStoragePath, 'utf8');
const toolSchemaPath = path.join(
  rootDirectory,
  'demos/bolt-style-editor/src/tool-schema.ts'
);
const toolSchemaSource = await readFile(toolSchemaPath, 'utf8');
expect(
  sharedStorageSource.includes(`'${sharedStorageKey}'`) &&
    standaloneSettingsSource.includes(
      "@context-action/openrouter-browser-storage"
    ) &&
    exampleSettingsSource.includes("@context-action/openrouter-browser-storage"),
  'Standalone and example OpenRouter settings must consume the shared browser storage package.'
);
expect(
  toolSchemaSource.includes('MAX_TEXT_SOURCE_LENGTH.toLocaleString') &&
    toolSchemaSource.includes('Source is limited to') &&
    toolSchemaSource.includes('resulting source is limited to'),
  'Workspace text limits must be exposed in model-facing tool descriptions as well as schemas.'
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
expectEqual(
  protocol.OPENROUTER_MAX_TOOL_TURNS,
  5,
  'Provider tool turns must remain bounded.'
);
expectEqual(
  protocol.OPENROUTER_MAX_TOOL_CALLS,
  12,
  'Provider tool calls must remain bounded across a run.'
);
protocol.assertOpenRouterToolCallBudget(10, 2);
let toolCallBudgetError;
try {
  protocol.assertOpenRouterToolCallBudget(10, 3);
} catch (error) {
  toolCallBudgetError = error;
}
expect(
  toolCallBudgetError instanceof protocol.OpenRouterRequestError &&
    toolCallBudgetError.code === 'OPENROUTER_TOOL_CALL_LIMIT',
  'A provider response that would exceed the total tool-call budget must be rejected before execution.'
);
expect(
  standaloneSettingsSource.includes('OPENROUTER_REQUEST_TIMEOUT_MS = 20_000') &&
    standaloneSettingsSource.includes("code: 'OPENROUTER_TIMEOUT'") &&
    standaloneSettingsSource.includes("reason: 'timeout'"),
  'Standalone OpenRouter requests must preserve a bounded timeout retry path.'
);
expect(
  modelCatalogSource.includes('supported_parameters') &&
    modelCatalogSource.includes("zdr', 'true'") &&
    modelCatalogSource.includes('isFreeOpenRouterModel') &&
    modelCatalogSource.includes('supportsOpenRouterTools'),
  'The standalone model catalog must expose tool-capable, free, and ZDR filters.'
);
expect(
  standaloneSettingsSource.includes("data_collection: 'deny'") &&
    standaloneSettingsSource.includes('provider: { zdr: true }'),
  'OpenRouter provider data policy settings must reach the chat-completions request.'
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
await expectInvalidProviderResponse(
  {
    choices: [
      {
        message: {
          role: 'user',
          content: 'unexpected role',
        },
      },
    ],
  },
  'non-assistant message role',
  'Non-assistant provider messages'
);
await expectInvalidProviderResponse(
  {
    choices: [
      {
        message: {
          role: 'assistant',
          content: { unexpected: true },
        },
      },
    ],
  },
  'non-string assistant message content',
  'Non-string assistant content'
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
      content: [{ type: 'text', text: 'Theme is invalid.' }],
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
expectEqual(
  JSON.parse(
    protocol.toolResultContent({
      content: [{ type: 'text', text: 'fallback' }],
      structuredContent: { unsupported: 1n },
    })
  ),
  {
    status: 'error',
    code: 'TOOL_RESULT_SERIALIZATION_FAILED',
    message: 'Tool result could not be serialized for the provider.',
  },
  'Non-JSON tool results must become a structured provider error instead of aborting the model loop.'
);
const circularDetails = {};
circularDetails.self = circularDetails;
expectEqual(
  JSON.parse(
    protocol.toolResultContent({
      isError: true,
      content: [{ type: 'text', text: 'The handler failed.' }],
      error: {
        code: 'TOOL_EXECUTION_FAILED',
        message: 'The handler failed.',
        retryable: true,
        details: circularDetails,
      },
    })
  ),
  {
    status: 'error',
    code: 'TOOL_EXECUTION_FAILED',
    message: 'The handler failed.',
    retryable: true,
  },
  'Non-JSON error details must not hide the canonical tool error metadata.'
);
expectEqual(
  JSON.parse(
    protocol.toolResultContent({
      content: [{ type: 'json' }],
      isError: false,
    })
  ),
  {
    status: 'error',
    code: 'TOOL_RESULT_VALIDATION_FAILED',
    message: 'Tool result did not match the canonical result contract.',
  },
  'Malformed tool results must be rejected before provider serialization.'
);
expectEqual(
  JSON.parse(
    protocol.toolResultContent({
      content: [{ type: 'json', json: { ok: true } }],
      isError: false,
    })
  ),
  {
    status: 'completed',
    content: '{"ok":true}',
  },
  'Valid JSON content blocks must remain available to the provider serializer.'
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
