import { InputContractError } from './errors.js';
import { compactText, toWellFormedText } from './text.js';

export const MAX_UNKNOWN_FIELD_DIAGNOSTIC_ITEMS = 8;
export const MAX_UNKNOWN_FIELD_NAME_CHARS = 128;
export const MAX_KNOWN_FIELD_ALLOW_ITEMS = 4096;
export const MAX_KNOWN_FIELD_SCAN_ITEMS = 8192;
export const MAX_DIAGNOSTIC_LIST_ITEMS = 8;
export const MAX_DIAGNOSTIC_LIST_VALUE_CHARS = 128;
export const MAX_ERROR_DIAGNOSTIC_CHARS = 4096;

function diagnosticValue(value: string, maxChars: number): string {
  const wasTruncated = value.length > maxChars;
  const sourceLimit = wasTruncated
    ? maxChars - 1
    : maxChars;
  const source = toWellFormedText(value.slice(0, sourceLimit));
  const compacted = compactText(source);
  const visible = compacted.length > 0 ? compacted : '<non-visible>';
  return wasTruncated ? `${visible}…` : visible;
}

export function boundedDiagnosticList(values: Iterable<string>): string {
  try {
    const rendered: string[] = [];
    let omitted = false;
    for (const value of values) {
      if (rendered.length === MAX_DIAGNOSTIC_LIST_ITEMS) {
        omitted = true;
        break;
      }
      if (typeof value !== 'string') {
        throw new InputContractError('Diagnostic list values must be strings');
      }
      rendered.push(diagnosticValue(value, MAX_DIAGNOSTIC_LIST_VALUE_CHARS));
    }
    const omission = omitted ? ', … (additional values omitted)' : '';
    return `${rendered.join(', ')}${omission}`;
  } catch (error) {
    throw toInputContractError(error, 'Diagnostic list rendering failed');
  }
}

export function diagnosticErrorMessage(error: unknown): string {
  let message: string;
  try {
    if (typeof error === 'string') {
      message = error;
    } else if (
      typeof error === 'number'
      || typeof error === 'bigint'
      || typeof error === 'boolean'
      || typeof error === 'symbol'
    ) {
      message = String(error);
    } else if (error === undefined) {
      message = 'Unknown error';
    } else if (error === null) {
      message = 'Null error value';
    } else if (error instanceof Error) {
      const candidate = error.message as unknown;
      message = typeof candidate === 'string'
        ? candidate
        : 'Error message is not a string';
    } else {
      message = 'Non-Error value thrown';
    }
  } catch {
    message = 'Error value could not be inspected';
  }
  return diagnosticValue(message, MAX_ERROR_DIAGNOSTIC_CHARS);
}

export function diagnosticSystemErrorCode(error: unknown): string | undefined {
  try {
    if (error === null || typeof error !== 'object') return undefined;
    const code = Reflect.get(error, 'code') as unknown;
    return typeof code === 'string' ? code : undefined;
  } catch {
    return undefined;
  }
}

export function toInputContractError(
  error: unknown,
  label: string,
): InputContractError {
  let isContractError = false;
  try {
    isContractError = error instanceof InputContractError;
  } catch {
    // A hostile proxy can throw while its prototype chain is inspected.
  }
  if (isContractError) return error as InputContractError;
  const normalizedLabel = typeof label === 'string'
    ? diagnosticValue(label, MAX_DIAGNOSTIC_LIST_VALUE_CHARS)
    : '<non-visible>';
  const safeLabel = normalizedLabel === '<non-visible>'
    ? 'Input validation failed'
    : normalizedLabel;
  return new InputContractError(
    `${safeLabel}: ${diagnosticErrorMessage(error)}`,
  );
}

export function assertKnownFields(
  value: Record<string, unknown>,
  allowed: Iterable<string>,
  label: string,
  verb: 'contain' | 'contains' = 'contains',
): void {
  const safeLabel = typeof label === 'string'
    ? diagnosticValue(label, MAX_UNKNOWN_FIELD_NAME_CHARS)
    : 'Known-field value';
  try {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
      throw new InputContractError('Known-field value must be an object');
    }
    if (typeof label !== 'string' || label.length === 0) {
      throw new InputContractError('Known-field label must be a non-empty string');
    }
    if (verb !== 'contain' && verb !== 'contains') {
      throw new InputContractError('Known-field verb must be contain or contains');
    }
    const allowedKeys = new Set<string>();
    let allowedItems = 0;
    for (const key of allowed) {
      allowedItems += 1;
      if (allowedItems > MAX_KNOWN_FIELD_ALLOW_ITEMS) {
        throw new InputContractError(
          `Known-field allow list exceeds ${MAX_KNOWN_FIELD_ALLOW_ITEMS} item limit`,
        );
      }
      if (typeof key !== 'string') {
        throw new InputContractError('Known-field allow list values must be strings');
      }
      allowedKeys.add(key);
    }
    const unknown: string[] = [];
    let omitted = false;
    let scannedItems = 0;
    for (const key in value) {
      scannedItems += 1;
      if (scannedItems > MAX_KNOWN_FIELD_SCAN_ITEMS) {
        throw new InputContractError(
          `Known-field scan exceeds ${MAX_KNOWN_FIELD_SCAN_ITEMS} item limit`,
        );
      }
      if (Object.getOwnPropertyDescriptor(value, key) === undefined || allowedKeys.has(key)) continue;
      if (unknown.length === MAX_UNKNOWN_FIELD_DIAGNOSTIC_ITEMS) {
        omitted = true;
        break;
      }
      unknown.push(diagnosticValue(key, MAX_UNKNOWN_FIELD_NAME_CHARS));
    }
    if (unknown.length === 0) return;
    const plural = unknown.length > 1 || omitted ? 's' : '';
    const omission = omitted ? ', … (additional fields omitted)' : '';
    throw new InputContractError(
      `${safeLabel} ${verb} unknown field${plural}: ${unknown.join(', ')}${omission}`,
    );
  } catch (error) {
    throw toInputContractError(error, `${safeLabel} field inspection failed`);
  }
}
