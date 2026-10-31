import { describe, expect, it } from 'vitest';
import { FaceExceptionProbeElement } from '../examples/face-exception/face-exception-element.js';

describe('FACE exception reproduction demo', () => {
  it('shows fallback/native divergence when ElementInternals rejects writes', async () => {
    const tagName = 'lit-face-exception-probe-test';
    if (!customElements.get(tagName)) customElements.define(tagName, FaceExceptionProbeElement);
    const element = document.createElement(tagName) as FaceExceptionProbeElement;
    document.body.appendChild(element);
    await element.updateComplete;

    expect(element.report).toEqual({
      fallbackFormValue: 'demo-value',
      requestedValid: false,
      reportedValid: true,
      nativeFormValue: null,
      nativeValid: true,
      formValueRejected: true,
      validityRejected: true,
    });

    element.remove();
  });
});
