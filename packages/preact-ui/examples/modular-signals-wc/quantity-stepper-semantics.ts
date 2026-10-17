/**
 * @module quantity-stepper-semantics
 *
 * Purpose:
 *   Encapsulates host-level ARIA spinbutton attributes, `<label>` association,
 *   `ElementInternals.ariaDescribedByElements` wiring, bounds parsing, and
 *   FACE validity calculation for `<quantity-stepper>`.
 *
 * Invariants:
 *   - Host attributes (`role="spinbutton"`, `tabindex`, `aria-*`) are mutated
 *     only after connection (`applyConnectSemantics`), never during Custom
 *     Element construction.
 *   - `restoreHostSemantics()` deterministically restores all host attributes
 *     and any generated `<label id>` back to their pre-connection state on
 *     permanent `dispose()`.
 */

export interface QuantityStepperBounds {
  readonly min: number;
  readonly max: number;
}

export interface QuantityStepperValidity {
  readonly flags: ValidityStateFlags;
  readonly message: string;
}

export const QUANTITY_STEPPER_HELP_TEXT =
  '수량을 선택하세요. 위쪽 또는 아래쪽 화살표 키로 변경할 수 있습니다.';

export const QUANTITY_STEPPER_STYLE = `
  :host {
    display: inline-flex;
    align-items: center;
    font-family: system-ui, -apple-system, sans-serif;
  }
  .stepper {
    display: inline-flex;
    align-items: center;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    background: #ffffff;
    overflow: hidden;
  }
  button {
    background: #f8fafc;
    border: none;
    padding: 8px 14px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    color: #334155;
    transition: background 0.15s ease;
  }
  button:hover:not(:disabled) {
    background: #e2e8f0;
  }
  button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .value-display {
    min-width: 40px;
    text-align: center;
    font-size: 15px;
    font-weight: 700;
    color: #0f172a;
    padding: 0 8px;
  }
  .error-hint {
    color: #ef4444;
    font-size: 12px;
    margin-left: 8px;
  }
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
`;

const HOST_SEMANTIC_ATTRIBUTES = [
  'role',
  'tabindex',
  'aria-labelledby',
  'aria-description',
  'aria-valuenow',
  'aria-valuemin',
  'aria-valuemax',
  'aria-valuetext',
  'aria-invalid',
  'aria-disabled',
] as const;

export function parseStepperBounds(element: HTMLElement): QuantityStepperBounds {
  const parsedMin = Number.parseInt(element.getAttribute('min') ?? '', 10);
  const parsedMax = Number.parseInt(element.getAttribute('max') ?? '', 10);
  const min = Number.isFinite(parsedMin) ? parsedMin : 1;
  const max = Math.max(min, Number.isFinite(parsedMax) ? parsedMax : 99);
  return { min, max };
}

export function evaluateStepperValidity(
  value: number,
  bounds: QuantityStepperBounds,
): QuantityStepperValidity {
  if (value < bounds.min) {
    return {
      flags: { rangeUnderflow: true },
      message: `최소 수량은 ${bounds.min}개입니다.`,
    };
  }
  if (value > bounds.max) {
    return {
      flags: { rangeOverflow: true },
      message: `최대 수량은 ${bounds.max}개입니다.`,
    };
  }
  return { flags: {}, message: '' };
}

export interface QuantityStepperHostSemantics {
  readonly descriptionId: string;
  readonly errorId: string;
  applyConnectSemantics(): void;
  syncHostAria(value: number, bounds: QuantityStepperBounds, validationMessage: string, disabled: boolean): void;
  connectDescriptionElements(): void;
  restoreHostSemantics(): void;
}

export function createQuantityStepperHostSemantics(options: {
  element: HTMLElement;
  tagName: string;
  sequence: number;
  root: HTMLElement;
  internals?: ElementInternals | undefined;
}): QuantityStepperHostSemantics {
  const { element, tagName, sequence, root, internals } = options;
  const descriptionId = `${tagName}-${sequence}-description`;
  const errorId = `${tagName}-${sequence}-error`;

  let generatedLabelId: string | undefined;
  let generatedLabelElement: HTMLLabelElement | undefined;
  let generatedLabelOriginalId: string | null | undefined;

  const initialSemanticAttributes = new Map(
    HOST_SEMANTIC_ATTRIBUTES.map((attribute) => [attribute, element.getAttribute(attribute)]),
  );

  function connectDescriptionElements(): void {
    const description = root.querySelector(`#${descriptionId}`);
    const error = root.querySelector(`#${errorId}`);
    const ariaInternals = internals as
      | (ElementInternals & { ariaDescribedByElements?: Element[] })
      | undefined;
    if (!ariaInternals || !('ariaDescribedByElements' in ariaInternals)) return;
    try {
      ariaInternals.ariaDescribedByElements = [description, error].filter(
        (node): node is Element => node instanceof Element,
      );
    } catch {
      // Older ElementInternals implementations may expose no setter.
    }
  }

  function connectHostLabel(): void {
    const id = element.id;
    const docRoot = element.getRootNode() as Document | ShadowRoot;
    const label = id
      ? Array.from(docRoot.querySelectorAll('label[for]')).find(
          (candidate) => candidate.getAttribute('for') === id,
        )
      : element.closest('label');
    if (!label) {
      if (generatedLabelId && element.getAttribute('aria-labelledby') === generatedLabelId) {
        element.removeAttribute('aria-labelledby');
      }
      return;
    }
    if (!label.id) {
      let candidate = `${tagName}-${sequence}-label`;
      while (Array.from(docRoot.querySelectorAll('[id]')).some((node) => node.id === candidate)) {
        candidate = `${candidate}-next`;
      }
      generatedLabelElement = label as HTMLLabelElement;
      generatedLabelOriginalId = null;
      label.id = candidate;
      generatedLabelId = label.id;
    }
    element.setAttribute('aria-labelledby', label.id);
  }

  return {
    descriptionId,
    errorId,
    applyConnectSemantics() {
      // FACE elements are labelable hosts. Apply host semantics after the
      // constructor has returned; browsers reject attribute mutations made
      // while a form-associated custom element is being constructed.
      element.setAttribute('role', 'spinbutton');
      if (!element.hasAttribute('tabindex')) element.tabIndex = 0;
      connectHostLabel();
    },
    syncHostAria(value, bounds, validationMessage, disabled) {
      element.setAttribute('aria-valuenow', String(value));
      element.setAttribute('aria-valuemin', String(bounds.min));
      element.setAttribute('aria-valuemax', String(bounds.max));
      element.setAttribute('aria-valuetext', `${value}개`);
      element.setAttribute('aria-invalid', validationMessage ? 'true' : 'false');
      element.setAttribute('aria-disabled', disabled ? 'true' : 'false');
      // ID references into a shadow root are not resolved as the host's
      // AX description in Chromium. Use the direct ARIA description for
      // assistive technology, while the live alert inside Shadow DOM announces errors.
      element.setAttribute('aria-description', validationMessage || QUANTITY_STEPPER_HELP_TEXT);
      queueMicrotask(connectDescriptionElements);
    },
    connectDescriptionElements,
    restoreHostSemantics() {
      for (const attribute of HOST_SEMANTIC_ATTRIBUTES) {
        const initialValue = initialSemanticAttributes.get(attribute);
        if (initialValue === null || initialValue === undefined) {
          element.removeAttribute(attribute);
        } else {
          element.setAttribute(attribute, initialValue);
        }
      }
      if (generatedLabelElement && generatedLabelElement.id === generatedLabelId) {
        if (generatedLabelOriginalId) {
          generatedLabelElement.id = generatedLabelOriginalId;
        } else {
          generatedLabelElement.removeAttribute('id');
        }
      }
    },
  };
}
