/** Only attempted attribute writes are owned. Omission releases ownership once via removeAttribute. */
export function createAttributeBindings<Props extends object>(
  element: HTMLElement,
  attributes: readonly (readonly [keyof Props, string])[],
  active: () => boolean,
) {
  const applied = new Set<keyof Props>();
  return (input: Props): void => {
    for (const [key, attrName] of attributes) {
      if (!active()) return;
      if (key in input) {
        const value = input[key];
        if (!active()) return;
        applied.add(key);
        if (value === null || value === undefined || value === false) {
          element.removeAttribute(attrName);
        } else if (value === true) {
          element.setAttribute(attrName, '');
        } else {
          element.setAttribute(attrName, String(value));
        }
      } else if (applied.delete(key)) {
        element.removeAttribute(attrName);
      }
    }
  };
}
