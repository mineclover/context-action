import { describe, expect, it } from 'vitest';
import { FaceExceptionProbeElement } from '../examples/face-exception/face-exception-element.js';
import { FormAssociatedLitElement, type FormInternalsErrorDetail } from '../src/form-associated-element.js';

const attachDiagnostics = new WeakMap<object, string[]>();

class AttachFailureProbeElement extends FormAssociatedLitElement {
  override attachInternals(): ElementInternals {
    throw new TypeError('simulated attachInternals rejection');
  }

  protected override onFormInternalsError(detail: FormInternalsErrorDetail): void {
    const operations = attachDiagnostics.get(this) ?? [];
    operations.push(detail.operation);
    attachDiagnostics.set(this, operations);
  }
}

class RerunFaceExceptionProbeElement extends FaceExceptionProbeElement {}

describe('FACE exception reproduction demo', () => {
  it('shows fallback/native divergence when ElementInternals rejects writes', async () => {
    const tagName = 'lit-face-exception-probe-test';
    if (!customElements.get(tagName)) customElements.define(tagName, FaceExceptionProbeElement);
    const element = document.createElement(tagName) as FaceExceptionProbeElement;
    const diagnostics: string[] = [];
    element.addEventListener('form-internals-error', (event) => {
      diagnostics.push((event as CustomEvent<{ operation: string }>).detail.operation);
    });
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
    expect(diagnostics).toEqual(['setFormValue', 'setValidity']);

    element.remove();
  });

  it('reruns with accepted native writes so the playground can compare states', async () => {
    const tagName = 'lit-face-exception-probe-rerun-test';
    if (!customElements.get(tagName)) customElements.define(tagName, RerunFaceExceptionProbeElement);
    const element = document.createElement(tagName) as RerunFaceExceptionProbeElement;
    const diagnostics: string[] = [];
    element.addEventListener('form-internals-error', (event) => {
      diagnostics.push((event as CustomEvent<{ operation: string }>).detail.operation);
    });
    document.body.appendChild(element);
    await element.updateComplete;
    diagnostics.length = 0;

    element.run({
      formValue: 'accepted-value',
      requestInvalid: true,
      rejectFormValue: false,
      rejectValidity: false,
    });
    await element.updateComplete;

    expect(element.report).toEqual({
      fallbackFormValue: 'accepted-value',
      requestedValid: false,
      reportedValid: false,
      nativeFormValue: 'accepted-value',
      nativeValid: false,
      formValueRejected: false,
      validityRejected: false,
    });
    expect(diagnostics).toEqual([]);

    element.remove();
  });

  it('diagnoses attachInternals rejection without preventing construction', () => {
    const tagName = 'lit-face-attach-failure-test';
    if (!customElements.get(tagName)) customElements.define(tagName, AttachFailureProbeElement);
    const element = document.createElement(tagName);

    expect(attachDiagnostics.get(element)).toEqual(['attachInternals']);
    expect(element).toBeInstanceOf(AttachFailureProbeElement);
  });
});
