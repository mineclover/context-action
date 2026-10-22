/**
 * @fileoverview Minimal server-side rendering and client hydration entry for
 * Lit Elements and Lit templates (`@context-action/lit-ui/ssr`).
 *
 * The module is safe to import in Node, Edge, and Worker environments: it does
 * not read `window` or `document` at module evaluation time. Rendering uses
 * Lit's own SSR renderer, so `part`, `data-*`, declarative shadow roots, and
 * imported styles are preserved in the produced markup.
 *
 * @implements view-layer
 * @implements web-component-primitive
 * @memberof core-concepts
 */

import type { LitElement, TemplateResult } from 'lit';
import { render } from '@lit-labs/ssr';
import { collectResult, collectResultSync } from '@lit-labs/ssr/lib/render-result.js';

export { hydrateLit } from './hydrate.js';

/**
 * Options for {@link renderLitElement}.
 */
export interface RenderLitElementOptions {
  /**
   * Explicit reactive property names to serialize as Lit property bindings.
   * Defaults to the element's `static elementProperties` map.
   */
  properties?: readonly string[];

  /**
   * Copy the element's current HTML attributes into the server markup.
   * Defaults to `true`.
   */
  includeAttributes?: boolean;

  /**
   * Serialize the element's current light DOM children inside the host tag so
   * `<slot>` projection survives SSR. Defaults to `true`.
   *
   * The light DOM is treated as trusted server input; complex properties on
   * nested custom elements must still be supplied through their own SSR path.
   */
  includeLightDom?: boolean;
}

const PROPERTY_NAME_PATTERN = /^[A-Za-z_$][\w$-]*$/;

interface ReflectivePropertyDeclaration {
  readonly attribute?: string | boolean;
  readonly reflect?: boolean;
  readonly type?: unknown;
  readonly converter?: {
    toAttribute?(value: unknown, type?: unknown): string | null;
  };
}

function reflectedAttribute(
  element: LitElement,
  propertyName: string,
  declaration: ReflectivePropertyDeclaration | undefined,
): { name: string; value: string } | null {
  if (!declaration?.reflect || declaration.attribute === false) return null;

  const attributeName =
    typeof declaration.attribute === 'string'
      ? declaration.attribute
      : propertyName.toLowerCase();
  if (attributeName.length === 0) return null;

  const value = (element as unknown as Record<string, unknown>)[propertyName];
  if (value === undefined || value === null) return null;

  let attributeValue: string | null;
  if (declaration.converter?.toAttribute) {
    attributeValue = declaration.converter.toAttribute(value, declaration.type);
  } else if (declaration.type === Boolean) {
    attributeValue = value ? '' : null;
  } else {
    attributeValue = String(value);
  }

  return attributeValue === null
    ? null
    : { name: attributeName, value: attributeValue };
}

function isTemplateResult(value: unknown): value is TemplateResult {
  return (
    typeof value === 'object' &&
    value !== null &&
    '_$litType$' in (value as Record<PropertyKey, unknown>)
  );
}

/**
 * Collects a Lit SSR render result synchronously.
 *
 * @throws When the template contains a value that resolves asynchronously
 * (for example an asynchronous element renderer). Use
 * {@link renderLitTemplateAsync} instead.
 */
export function renderLitTemplate(template: TemplateResult): string {
  if (!isTemplateResult(template)) {
    throw new TypeError('renderLitTemplate() expects a Lit TemplateResult.');
  }
  return collectResultSync(render(template));
}

/**
 * Collects a Lit SSR render result, awaiting asynchronous renderer chunks.
 */
export async function renderLitTemplateAsync(template: TemplateResult): Promise<string> {
  if (!isTemplateResult(template)) {
    throw new TypeError('renderLitTemplateAsync() expects a Lit TemplateResult.');
  }
  return collectResult(render(template));
}

function escapeAttributeValue(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

/**
 * Creates a `TemplateResult` that reproduces an element instance's public
 * attributes and reactive properties.
 *
 * Lit does not accept a raw `LitElement` instance in `render()` (it would be
 * stringified). Constructing a template with `.property=${value}` bindings lets
 * Lit's ElementRenderer create its own server-side instance with the same input.
 */
function createElementTemplate(
  element: LitElement,
  options?: RenderLitElementOptions,
): TemplateResult {
  const tagName = element.localName;
  if (!tagName) {
    throw new Error(
      'renderLitElement() requires a registered custom element. Call customElements.define() before rendering.',
    );
  }

  const registry = globalThis.customElements;
  if (!registry?.get(tagName)) {
    throw new Error(
      `renderLitElement(): custom element "${tagName}" is not registered. Call customElements.define() before rendering.`,
    );
  }

  const strings: string[] = [`<${tagName}`];
  const values: unknown[] = [];

  if (options?.includeAttributes !== false) {
    for (const attribute of Array.from(element.attributes)) {
      strings[strings.length - 1] += ` ${attribute.name}="${escapeAttributeValue(attribute.value)}"`;
    }
  }

  const elementConstructor = element.constructor as unknown as {
    elementProperties?: Map<PropertyKey, ReflectivePropertyDeclaration>;
  };
  const elementProperties = elementConstructor.elementProperties;
  const propertyNames =
    options?.properties ??
    (elementProperties ? Array.from(elementProperties.keys(), String) : []);

  const emittedAttributeNames = new Set(
    Array.from(element.attributes, attribute => attribute.name),
  );
  const seen = new Set<string>();
  for (const propertyName of propertyNames) {
    if (seen.has(propertyName) || !PROPERTY_NAME_PATTERN.test(propertyName)) continue;
    seen.add(propertyName);

    const reflected = reflectedAttribute(
      element,
      propertyName,
      elementProperties?.get(propertyName),
    );
    if (reflected && !emittedAttributeNames.has(reflected.name)) {
      emittedAttributeNames.add(reflected.name);
      strings[strings.length - 1] +=
        ` ${reflected.name}="${escapeAttributeValue(reflected.value)}"`;
    }

    strings[strings.length - 1] += ` .${propertyName}="`;
    values.push((element as unknown as Record<string, unknown>)[propertyName]);
    strings.push('"');
  }

  strings[strings.length - 1] += `>`;
  if (options?.includeLightDom !== false) {
    strings[strings.length - 1] += element.innerHTML;
  }
  strings[strings.length - 1] += `</${tagName}>`;

  const templateStrings = strings as unknown as TemplateStringsArray;
  Object.defineProperty(templateStrings, 'raw', {
    configurable: false,
    enumerable: false,
    value: [...strings],
  });

  // Lit has no public API for constructing a template with dynamically named
  // property bindings. This shape is covered by the SSR unit and browser
  // hydration contracts so a Lit major upgrade fails loudly.
  return {
    '_$litType$': 1,
    strings: templateStrings,
    values,
  } as unknown as TemplateResult;
}

/**
 * Renders a Lit Element instance to server markup, including its declarative
 * shadow root and adopted styles.
 *
 * The element must already be registered with `customElements.define()`.
 * Reactive properties are serialized as Lit property bindings so complex
 * values survive SSR without attribute stringification.
 */
export function renderLitElement(
  element: LitElement,
  options?: RenderLitElementOptions,
): string {
  return renderLitTemplate(createElementTemplate(element, options));
}

/**
 * Asynchronous variant of {@link renderLitElement} for custom element
 * renderers that yield asynchronous chunks.
 */
export async function renderLitElementAsync(
  element: LitElement,
  options?: RenderLitElementOptions,
): Promise<string> {
  return renderLitTemplateAsync(createElementTemplate(element, options));
}
