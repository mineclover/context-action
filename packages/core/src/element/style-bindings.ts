/** Only attempted style writes are owned. Omission releases ownership once via removeProperty. */
export function createStyleBindings<Props extends object>(
  element: HTMLElement,
  styles: readonly (readonly [keyof Props, string])[],
  active: () => boolean,
) {
  const applied = new Set<keyof Props>();
  return (input: Props): void => {
    for (const [key, cssProperty] of styles) {
      if (!active()) return;
      if (key in input) {
        const value = input[key];
        if (!active()) return;
        applied.add(key);
        if (value === null || value === undefined || value === '') {
          element.style.removeProperty(cssProperty);
        } else {
          element.style.setProperty(cssProperty, String(value));
        }
      } else if (applied.delete(key)) {
        element.style.removeProperty(cssProperty);
      }
    }
  };
}
