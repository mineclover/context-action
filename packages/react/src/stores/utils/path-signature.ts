export type PathSegment = string | number;

function serializeNumber(value: number): string {
  if (Number.isNaN(value)) return 'NaN';
  if (value === Infinity) return 'Infinity';
  if (value === -Infinity) return '-Infinity';
  if (Object.is(value, -0)) return '-0';
  return String(value);
}

/**
 * Create an unambiguous signature for a store path.
 *
 * Segment types are preserved, and JSON encoding prevents separators or other
 * special characters in string keys from colliding with path boundaries.
 */
export function createPathSignature(path: readonly PathSegment[]): string {
  return JSON.stringify(
    path.map((segment) =>
      typeof segment === 'number'
        ? ['number', serializeNumber(segment)]
        : ['string', segment]
    )
  );
}

/**
 * Create an order-independent signature for a set of dependency paths.
 */
export function createPathsSignature(
  paths: readonly (readonly PathSegment[])[] | undefined
): string | null {
  if (!paths) return null;
  return JSON.stringify(paths.map(createPathSignature).sort());
}
