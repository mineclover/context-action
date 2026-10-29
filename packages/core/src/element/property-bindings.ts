/** Only attempted bridge writes are owned. Omission releases ownership even if reset is rejected. */
export function createPropertyBindings<Props extends object>(
  element: HTMLElement,
  properties: readonly (keyof Props)[],
  active: () => boolean,
  assignmentErrors: 'ignore' | 'throw',
) {
  const applied = new Set<keyof Props>();
  const host = element as unknown as Record<keyof Props, unknown>;
  return (input: Props): void => {
    for (const key of properties) {
      if (!active()) return;
      if (key in input) {
        const value = input[key];
        if (!active()) return;
        applied.add(key);
        try { host[key] = value; }
        catch (error) { if (assignmentErrors === 'throw') throw error; }
      } else if (applied.delete(key)) {
        try { host[key] = undefined; } catch { /* Omission cleanup is always best-effort. */ }
      }
    }
  };
}
