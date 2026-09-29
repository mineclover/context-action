import { mountPreact } from './mount.js';
import type { MountInstance, OwnedView } from './mount.js';
import { assertUnmanagedAncestors } from './ownership.js';
import type { MountRoot } from './ownership.js';

/** Clone a trusted template with exactly one empty [data-preact-root] element. */
export function mountTemplate<Input>(
  host: MountRoot,
  template: HTMLTemplateElement,
  View: OwnedView<Input>,
  input: Input,
): MountInstance<Input> {
  assertUnmanagedAncestors(host);
  const fragment = host.ownerDocument.importNode(template.content, true);
  const roots = fragment.querySelectorAll('[data-preact-root]');
  const root = roots.item(0);
  if (roots.length !== 1 || !root || root.hasChildNodes()) {
    throw new Error('Template requires exactly one empty [data-preact-root]');
  }
  const nodes = Array.from(fragment.childNodes);
  const removeShell = () => {
    for (const node of nodes) node.parentNode?.removeChild(node);
  };
  let instance: MountInstance<Input>;
  try {
    host.appendChild(fragment);
    instance = mountPreact(root, View, input);
  } catch (error) {
    removeShell();
    throw error;
  }
  return {
    get destroyed() { return instance.destroyed; },
    update(next) { instance.update(next); },
    destroy() {
      try { instance.destroy(); } finally { removeShell(); }
    },
  };
}
