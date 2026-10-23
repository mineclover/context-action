/**
 * @fileoverview Client-only hydration entry (`@context-action/lit-ui/hydrate`).
 *
 * This module intentionally imports only `@lit-labs/ssr-client` and the Lit
 * runtime, never the server renderer. Client bundles that only need
 * `hydrateLit()` can avoid pulling `@lit-labs/ssr` into the browser graph.
 *
 * @implements view-layer
 * @implements web-component-primitive
 * @memberof core-concepts
 */

import '@lit-labs/ssr-client/lit-element-hydrate-support.js';
import { hydrate } from '@lit-labs/ssr-client';
import { LitElement } from 'lit';

const COMMENT_NODE = 8;
const DOCUMENT_FRAGMENT_NODE = 11;
const SHOW_COMMENT_NODE = 128;

function hasLitPartMarker(root: Element | ShadowRoot): boolean {
  const document = root.ownerDocument
    ?? (root as ShadowRoot).host?.ownerDocument
    ?? null;
  if (document && typeof document.createTreeWalker === 'function') {
    // Static styles are emitted before Lit's root marker. Walk every comment
    // below the root instead of assuming the marker is its first child.
    const walker = document.createTreeWalker(root, SHOW_COMMENT_NODE);
    while (walker.nextNode()) {
      if ((walker.currentNode as Comment).data.startsWith('lit-part')) {
        return true;
      }
    }
    return false;
  }

  // Defensive fallback for environments without TreeWalker. Keep the same
  // descendant-wide semantics; a first-child check would regress when styles
  // or other server-owned nodes precede the Lit marker.
  const pending: Node[] = [root];
  while (pending.length > 0) {
    const current = pending.pop()!;
    for (let node = current.firstChild; node; node = node.nextSibling) {
      if (
        node.nodeType === COMMENT_NODE &&
        (node as Comment).data.startsWith('lit-part')
      ) {
        return true;
      }
      if (node.firstChild) pending.push(node);
    }
  }
  return false;
}

function findServerHost(
  root: Element | ShadowRoot,
  element: LitElement,
): Element | null {
  const tagName = element.localName;
  if (!tagName) return null;

  // A ShadowRoot owned by the element is a render target, not a host container.
  if (
    root.nodeType === DOCUMENT_FRAGMENT_NODE &&
    'host' in root &&
    root.host === element
  ) {
    return null;
  }

  if (root.nodeType === 1 && (root as Element).localName === tagName) {
    return root as Element;
  }

  return root.querySelector?.(tagName) ?? null;
}

function isHydrationSupportInstalled(): boolean {
  const shadow = {};
  const probe = { shadowRoot: shadow } as unknown as LitElement;
  const createRenderRoot = (
    LitElement.prototype as unknown as {
      createRenderRoot(this: LitElement): unknown;
    }
  ).createRenderRoot;
  try {
    return createRenderRoot.call(probe) === shadow;
  } catch {
    return false;
  }
}

interface LitPartLike {
  _$startNode?: Node | null;
  _$endNode?: Node | null;
  _$AA?: Node | null;
  _$AB?: Node | null;
}

function partStartNode(part: LitPartLike | undefined): Node | null {
  return part?._$startNode ?? part?._$AA ?? null;
}

function renderOptionsFor(
  element: LitElement,
): Parameters<typeof hydrate>[2] {
  return (element as unknown as {
    renderOptions?: Parameters<typeof hydrate>[2];
  }).renderOptions;
}

function isServerRootPart(part: LitPartLike | undefined): boolean {
  const start = partStartNode(part);
  return (
    start?.nodeType === COMMENT_NODE &&
    (start as Comment).data.startsWith('lit-part')
  );
}

/**
 * When a client render appended a separate tree beside the server DSD tree,
 * keep only the server root part (plus preceding static style tags), remove the
 * client anchors/children, and re-adopt the surviving server tree.
 */
function isolateServerTree(shadow: ShadowRoot): boolean {
  const children = Array.from(shadow.childNodes);
  const rootIndex = children.findIndex(
    node => node.nodeType === COMMENT_NODE && (node as Comment).data.startsWith('lit-part'),
  );
  if (rootIndex < 0) return false;

  let beginIndex = rootIndex;
  while (beginIndex > 0) {
    const previous = children[beginIndex - 1]!;
    if (
      (previous.nodeType === 1 && (previous as Element).localName === 'style') ||
      (previous.nodeType === 3 && previous.textContent?.trim() === '')
    ) {
      beginIndex -= 1;
      continue;
    }
    break;
  }

  let depth = 0;
  let endIndex = -1;
  for (let index = rootIndex; index < children.length; index += 1) {
    const node = children[index]!;
    if (node.nodeType !== COMMENT_NODE) continue;
    const data = (node as Comment).data;
    if (data.startsWith('lit-part')) {
      depth += 1;
    } else if (data.startsWith('/lit-part')) {
      depth -= 1;
      if (depth === 0) {
        endIndex = index;
        break;
      }
    }
  }
  if (endIndex < 0) return false;

  for (let index = children.length - 1; index > endIndex; index -= 1) {
    children[index]!.parentNode?.removeChild(children[index]!);
  }
  for (let index = 0; index < beginIndex; index += 1) {
    children[index]!.parentNode?.removeChild(children[index]!);
  }
  return true;
}

function adoptServerShadow(host: LitElement, shadow: ShadowRoot): void {
  // Clear Lit hydration support flags so the following requestUpdate does not
  // adopt the same tree a second time.
  (host as unknown as { _$needsHydration?: boolean })._$needsHydration = false;
  (host as unknown as { _$AG?: boolean })._$AG = false;

  if (isolateServerTree(shadow)) {
    delete (shadow as ShadowRoot & { _$litPart$?: unknown })._$litPart$;
    try {
      const rendered = (host as unknown as { render(): unknown }).render();
      hydrate(rendered, shadow, renderOptionsFor(host));
      host.requestUpdate();
      return;
    } catch {
      // Fall through to a clean client render when the server tree cannot be
      // adopted (for example after an incompatible template change).
    }
  }

  shadow.replaceChildren();
  delete (shadow as ShadowRoot & { _$litPart$?: unknown })._$litPart$;
  host.requestUpdate();
}

function hydrateHost(host: LitElement): void {
  const shadow = host.shadowRoot;
  if (!shadow) {
    host.requestUpdate();
    return;
  }

  const hydrationSupportInstalled = isHydrationSupportInstalled();
  if (!hydrationSupportInstalled) {
    Object.defineProperty(host, 'createRenderRoot', {
      configurable: true,
      value: () => shadow,
    });
  }

  const livePart = (shadow as ShadowRoot & { _$litPart$?: LitPartLike })._$litPart$;
  if (livePart !== undefined) {
    if (hasLitPartMarker(shadow) && !isServerRootPart(livePart)) {
      adoptServerShadow(host, shadow);
      return;
    }
    host.requestUpdate();
    return;
  }

  if (!hasLitPartMarker(shadow)) {
    // Server markup without lit-html markers cannot be hydrated. Clear it and
    // force the first client render into this shadow root without asking Lit's
    // hydration support to adopt a non-lit tree.
    shadow.replaceChildren();
    host.requestUpdate();
    return;
  }

  // Lit's official hydration support patches createRenderRoot/update and
  // adopts the declarative shadow root on the first update. Running hydrate()
  // ourselves would make support hydrate the same container twice.
  if (hydrationSupportInstalled) {
    host.requestUpdate();
    return;
  }

  const rendered = (host as unknown as { render(): unknown }).render();
  hydrate(rendered, shadow);
  host.requestUpdate();
}

function upgradeServerHost(host: Element, element: LitElement): void {
  const tagName = element.localName;
  const registry = globalThis.customElements;
  if (!registry) {
    throw new Error('hydrateLit() requires a DOM environment with customElements.');
  }

  if (!registry.get(tagName)) {
    registry.define(tagName, element.constructor as CustomElementConstructor);
  }

  // A declarative shadow root already contains the server template. When Lit's
  // hydration support is not installed, prevent the first update from calling
  // attachShadow() on the same host. When support is installed, its patched
  // createRenderRoot already does this and must remain in control.
  const existingShadow = host.shadowRoot;
  if (existingShadow && !isHydrationSupportInstalled()) {
    Object.defineProperty(host, 'createRenderRoot', {
      configurable: true,
      value: () => existingShadow,
    });
  }

  const elementConstructor = element.constructor as unknown as { new (): LitElement };
  if (host instanceof elementConstructor) {
    hydrateHost(host);
    return;
  }

  registry.upgrade(host);
  if (host instanceof elementConstructor) {
    hydrateHost(host);
  }
}

/**
 * Hydrates server-produced markup on the client.
 *
 * Supported modes:
 * 1. `root` is an element's own shadow root (or contains the Lit template
 *    markers produced by `renderLitTemplate`): the element's current template is
 *    hydrated into that root, preserving existing DOM and attaching event parts.
 * 2. `root` contains a server-rendered custom element host for the same tag:
 *    the host is upgraded so its controllers and attributes connect.
 * 3. `root` is empty: the element is mounted and rendered normally.
 *
 * The function never reads a global `document`; it operates only on the supplied
 * root and element.
 */
export function hydrateLit(root: Element | ShadowRoot, element: LitElement): void {
  if (!root || typeof root !== 'object') {
    throw new TypeError('hydrateLit() requires an Element or ShadowRoot.');
  }
  if (!element || typeof element !== 'object') {
    throw new TypeError('hydrateLit() requires a LitElement instance.');
  }

  const serverHost = findServerHost(root, element);
  if (serverHost && serverHost !== element) {
    upgradeServerHost(serverHost, element);
    return;
  }

  // The element's own shadow root is managed by its Lit update lifecycle.
  // Hydrate it explicitly and bypass the support flag so the first update does
  // not adopt the same container a second time.
  if (
    root.nodeType === DOCUMENT_FRAGMENT_NODE &&
    'host' in root &&
    root.host === element
  ) {
    const shadow = root as ShadowRoot;
    const livePart = (shadow as ShadowRoot & { _$litPart$?: LitPartLike })._$litPart$;
    if (livePart === undefined) {
      Object.defineProperty(element, 'createRenderRoot', {
        configurable: true,
        value: () => shadow,
      });
      if (hasLitPartMarker(shadow)) {
        const rendered = (element as unknown as { render(): unknown }).render();
        hydrate(rendered, shadow, renderOptionsFor(element));
      } else {
        shadow.replaceChildren();
      }
    } else if (hasLitPartMarker(shadow) && !isServerRootPart(livePart)) {
      adoptServerShadow(element, shadow);
      return;
    }
    // Support uses `_$needsHydration` in development and a minified field in
    // production. Clearing both is harmless when support is absent.
    (element as unknown as { _$needsHydration?: boolean })._$needsHydration = false;
    (element as unknown as { _$AG?: boolean })._$AG = false;
    element.requestUpdate();
    return;
  }

  if (hasLitPartMarker(root)) {
    const livePart = (root as ShadowRoot & { _$litPart$?: unknown })._$litPart$;
    if (livePart !== undefined) {
      element.requestUpdate();
      return;
    }
    const rendered = (element as unknown as { render(): unknown }).render();
    hydrate(rendered, root, renderOptionsFor(element));
    return;
  }

  if (root !== element && !element.isConnected) {
    root.append(element);
  }
  element.requestUpdate();
}
