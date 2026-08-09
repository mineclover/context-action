import type { WebMCPErrorMode, WebMCPToolScopeOptions } from '../src/index';

describe('WebMCP error mode type contract', () => {
  it('excludes the removed result compatibility alias', () => {
    const structured: WebMCPErrorMode = 'structured';
    const throwing: WebMCPErrorMode = 'throw';
    expect([structured, throwing]).toEqual(['structured', 'throw']);

    // @ts-expect-error v1 candidates remove the ambiguous result alias.
    const removed: WebMCPErrorMode = 'result';
    expect(removed).toBe('result');

    // @ts-expect-error scope options must reject the removed alias too.
    const options: WebMCPToolScopeOptions = { sessionId: 'test', toolNames: [], errorMode: 'result' };
    expect(options).toBeDefined();

    // @ts-expect-error the removed notification cannot be supplied at the scope boundary.
    const removedNotification: WebMCPToolScopeOptions = { sessionId: 'test', toolNames: [], beforeExecute: () => {} };
    expect(removedNotification).toBeDefined();
  });
});
