/**
 * @fileoverview JSON Pointer (RFC 6901) utilities
 *
 * Implements JSON Pointer specification for path-based store subscriptions.
 * Used to convert path arrays to standardized string format for efficient
 * prefix matching in patch-based change detection.
 *
 * @see https://datatracker.ietf.org/doc/html/rfc6901
 */

/**
 * Path type for JSON Pointer operations
 * - string: Object property keys
 * - number: Array indices
 */
export type JsonPointerPath = (string | number)[];

/**
 * Escape a path segment according to JSON Pointer (RFC 6901)
 *
 * The order of replacement is critical:
 * 1. First escape '~' to '~0' (prevents double-escaping)
 * 2. Then escape '/' to '~1'
 *
 * @example
 * escapeSegment('normal')     → 'normal'
 * escapeSegment('a/b')        → 'a~1b'
 * escapeSegment('c~d')        → 'c~0d'
 * escapeSegment('a~1b')       → 'a~01b' (tilde escaped, 1 preserved)
 * escapeSegment(42)           → '42'
 */
export function escapeSegment(segment: string | number): string {
  if (typeof segment === 'number') {
    return String(segment);
  }
  // Order matters: escape '~' first, then '/'
  return segment.replace(/~/g, '~0').replace(/\//g, '~1');
}

/**
 * Unescape a JSON Pointer segment back to original value
 *
 * The order of replacement is critical (reverse of escape):
 * 1. First unescape '~1' to '/'
 * 2. Then unescape '~0' to '~'
 *
 * @example
 * unescapeSegment('normal')   → 'normal'
 * unescapeSegment('a~1b')     → 'a/b'
 * unescapeSegment('c~0d')     → 'c~d'
 * unescapeSegment('a~01b')    → 'a~1b'
 */
export function unescapeSegment(segment: string): string {
  // Order matters: unescape '~1' first, then '~0'
  return segment.replace(/~1/g, '/').replace(/~0/g, '~');
}

/**
 * Convert path array to JSON Pointer string (RFC 6901)
 *
 * Rules:
 * - Empty array → '' (empty string = whole document)
 * - Non-empty array → '/' + segments joined by '/'
 * - Special characters are escaped
 *
 * @example
 * pathToPointer([])                      → ''
 * pathToPointer(['user'])                → '/user'
 * pathToPointer(['user', 'name'])        → '/user/name'
 * pathToPointer(['items', 0])            → '/items/0'
 * pathToPointer(['data', 'a/b'])         → '/data/a~1b'
 * pathToPointer(['config', 'key~val'])   → '/config/key~0val'
 * pathToPointer([''])                    → '/' (empty string key)
 * pathToPointer(['a', '', 'b'])          → '/a//b'
 */
export function pathToPointer(path: JsonPointerPath): string {
  if (path.length === 0) return '';
  return '/' + path.map(escapeSegment).join('/');
}

/**
 * Parse JSON Pointer string back to path array
 *
 * @example
 * pointerToPath('')              → []
 * pointerToPath('/user/name')    → ['user', 'name']
 * pointerToPath('/items/0')      → ['items', '0'] (note: string, not number)
 * pointerToPath('/data/a~1b')    → ['data', 'a/b']
 * pointerToPath('/')             → [''] (empty string key)
 */
export function pointerToPath(pointer: string): string[] {
  if (pointer === '') return [];
  if (!pointer.startsWith('/')) {
    throw new Error(`Invalid JSON Pointer: must start with '/' or be empty string`);
  }
  return pointer.slice(1).split('/').map(unescapeSegment);
}

/**
 * Check if one JSON Pointer is a prefix of another (including exact match)
 *
 * Handles path boundaries correctly:
 * - '/user' is a prefix of '/user/name'
 * - '/user' is NOT a prefix of '/users' (different path)
 * - '' (root) is a prefix of everything
 *
 * @example
 * isPointerPrefix('', '/user')           → true (root is prefix of all)
 * isPointerPrefix('/user', '/user')      → true (exact match)
 * isPointerPrefix('/user', '/user/name') → true (valid prefix)
 * isPointerPrefix('/user', '/users')     → false (boundary mismatch)
 * isPointerPrefix('/user', '/use')       → false
 */
export function isPointerPrefix(prefix: string, pointer: string): boolean {
  if (prefix === pointer) return true;
  if (prefix === '') return true; // Root is prefix of everything
  // prefix must be followed by '/' to be a valid prefix
  return pointer.startsWith(prefix + '/');
}

/**
 * Check if two paths are related (one is prefix of other, or equal)
 *
 * @example
 * arePointersRelated('/user', '/user/name')     → true (parent-child)
 * arePointersRelated('/user/name', '/user')     → true (child-parent)
 * arePointersRelated('/user', '/user')          → true (equal)
 * arePointersRelated('/user', '/settings')      → false (unrelated)
 */
export function arePointersRelated(pointer1: string, pointer2: string): boolean {
  return isPointerPrefix(pointer1, pointer2) || isPointerPrefix(pointer2, pointer1);
}

// Alias for backward compatibility
export const pathToKey = pathToPointer;
export const isPathPrefix = isPointerPrefix;
