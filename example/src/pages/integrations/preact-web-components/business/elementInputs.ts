/** @evidenceExclude Tier 3 Web Component input normalization; not a persisted DTO. */
export function normalizeIntegerInput(
  value: number | undefined,
  fallback: number,
  name: string
): number {
  const next = value === undefined ? fallback : value;
  if (!Number.isSafeInteger(next) || next < 0) {
    throw new RangeError(`${name} must be a non-negative safe integer`);
  }
  return next;
}
