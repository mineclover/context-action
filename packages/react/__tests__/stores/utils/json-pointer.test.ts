/**
 * @fileoverview Unit tests for JSON Pointer (RFC 6901) utilities
 *
 * Tests cover:
 * - Basic path conversion
 * - Special character escaping (~, /)
 * - Edge cases (empty paths, empty keys, unicode)
 * - Prefix matching with boundary handling
 *
 * @see https://datatracker.ietf.org/doc/html/rfc6901
 */

import {
  escapeSegment,
  unescapeSegment,
  pathToPointer,
  pointerToPath,
  isPointerPrefix,
  arePointersRelated,
} from '../../../src/stores/utils/json-pointer';

describe('escapeSegment', () => {
  it('should return string unchanged if no special characters', () => {
    expect(escapeSegment('user')).toBe('user');
    expect(escapeSegment('name')).toBe('name');
    expect(escapeSegment('camelCase')).toBe('camelCase');
    expect(escapeSegment('with-dash')).toBe('with-dash');
    expect(escapeSegment('with_underscore')).toBe('with_underscore');
  });

  it('should convert numbers to strings', () => {
    expect(escapeSegment(0)).toBe('0');
    expect(escapeSegment(42)).toBe('42');
    expect(escapeSegment(123)).toBe('123');
  });

  it('should escape tilde (~) as ~0', () => {
    expect(escapeSegment('a~b')).toBe('a~0b');
    expect(escapeSegment('~')).toBe('~0');
    expect(escapeSegment('~~')).toBe('~0~0');
    expect(escapeSegment('a~b~c')).toBe('a~0b~0c');
  });

  it('should escape forward slash (/) as ~1', () => {
    expect(escapeSegment('a/b')).toBe('a~1b');
    expect(escapeSegment('/')).toBe('~1');
    expect(escapeSegment('//')).toBe('~1~1');
    expect(escapeSegment('a/b/c')).toBe('a~1b~1c');
  });

  it('should escape tilde before slash (order matters)', () => {
    // This is critical: if we escape / first, then ~, we'd get wrong results
    // '~1' in input should become '~01' not '~1'
    expect(escapeSegment('~1')).toBe('~01');
    expect(escapeSegment('~0')).toBe('~00');
    expect(escapeSegment('a~1b')).toBe('a~01b');
  });

  it('should handle mixed special characters', () => {
    expect(escapeSegment('a/b~c')).toBe('a~1b~0c');
    expect(escapeSegment('~/~')).toBe('~0~1~0');
    expect(escapeSegment('/~/')).toBe('~1~0~1');
  });

  it('should handle empty string', () => {
    expect(escapeSegment('')).toBe('');
  });

  it('should handle unicode characters', () => {
    expect(escapeSegment('한글')).toBe('한글');
    expect(escapeSegment('日本語')).toBe('日本語');
    expect(escapeSegment('émoji🎉')).toBe('émoji🎉');
    expect(escapeSegment('한/글')).toBe('한~1글');
  });

  it('should handle whitespace', () => {
    expect(escapeSegment('with space')).toBe('with space');
    expect(escapeSegment('with\ttab')).toBe('with\ttab');
    expect(escapeSegment('with\nnewline')).toBe('with\nnewline');
  });
});

describe('unescapeSegment', () => {
  it('should return string unchanged if no escape sequences', () => {
    expect(unescapeSegment('user')).toBe('user');
    expect(unescapeSegment('name')).toBe('name');
  });

  it('should unescape ~0 to tilde (~)', () => {
    expect(unescapeSegment('a~0b')).toBe('a~b');
    expect(unescapeSegment('~0')).toBe('~');
    expect(unescapeSegment('~0~0')).toBe('~~');
  });

  it('should unescape ~1 to forward slash (/)', () => {
    expect(unescapeSegment('a~1b')).toBe('a/b');
    expect(unescapeSegment('~1')).toBe('/');
    expect(unescapeSegment('~1~1')).toBe('//');
  });

  it('should unescape ~1 before ~0 (order matters)', () => {
    // '~01' should become '~1' (first ~0 → ~, so ~01 → ~1)
    expect(unescapeSegment('~01')).toBe('~1');
    expect(unescapeSegment('~00')).toBe('~0');
  });

  it('should be inverse of escapeSegment', () => {
    const testCases = [
      'normal',
      'a/b',
      'c~d',
      'a/b~c',
      '~1',
      '~0',
      '~/~',
      '',
      '한글/테스트',
    ];

    for (const input of testCases) {
      expect(unescapeSegment(escapeSegment(input))).toBe(input);
    }
  });
});

describe('pathToPointer', () => {
  it('should return empty string for empty path (root reference)', () => {
    expect(pathToPointer([])).toBe('');
  });

  it('should convert single segment path', () => {
    expect(pathToPointer(['user'])).toBe('/user');
    expect(pathToPointer(['settings'])).toBe('/settings');
  });

  it('should convert multi-segment path', () => {
    expect(pathToPointer(['user', 'name'])).toBe('/user/name');
    expect(pathToPointer(['user', 'profile', 'address', 'city'])).toBe('/user/profile/address/city');
  });

  it('should handle array indices (numbers)', () => {
    expect(pathToPointer(['items', 0])).toBe('/items/0');
    expect(pathToPointer(['items', 1, 'name'])).toBe('/items/1/name');
    expect(pathToPointer(['matrix', 0, 1])).toBe('/matrix/0/1');
  });

  it('should escape special characters', () => {
    expect(pathToPointer(['a/b'])).toBe('/a~1b');
    expect(pathToPointer(['c~d'])).toBe('/c~0d');
    expect(pathToPointer(['data', 'key/with/slash'])).toBe('/data/key~1with~1slash');
  });

  it('should handle empty string key', () => {
    // RFC 6901: "/" references the key "" (empty string)
    expect(pathToPointer([''])).toBe('/');
    expect(pathToPointer(['a', '', 'b'])).toBe('/a//b');
  });

  it('should handle keys that look like escape sequences', () => {
    expect(pathToPointer(['~0'])).toBe('/~00');
    expect(pathToPointer(['~1'])).toBe('/~01');
  });

  // RFC 6901 examples
  it('should match RFC 6901 examples', () => {
    // From RFC 6901 Section 5
    // Given {"m~n": 8, "a/b": 1}
    // "/m~0n" evaluates to 8
    // "/a~1b" evaluates to 1
    expect(pathToPointer(['m~n'])).toBe('/m~0n');
    expect(pathToPointer(['a/b'])).toBe('/a~1b');
  });
});

describe('pointerToPath', () => {
  it('should return empty array for empty string (root reference)', () => {
    expect(pointerToPath('')).toEqual([]);
  });

  it('should parse single segment pointer', () => {
    expect(pointerToPath('/user')).toEqual(['user']);
    expect(pointerToPath('/settings')).toEqual(['settings']);
  });

  it('should parse multi-segment pointer', () => {
    expect(pointerToPath('/user/name')).toEqual(['user', 'name']);
    expect(pointerToPath('/user/profile/address')).toEqual(['user', 'profile', 'address']);
  });

  it('should unescape special characters', () => {
    expect(pointerToPath('/a~1b')).toEqual(['a/b']);
    expect(pointerToPath('/c~0d')).toEqual(['c~d']);
    expect(pointerToPath('/data/key~1with~1slash')).toEqual(['data', 'key/with/slash']);
  });

  it('should handle empty string key', () => {
    expect(pointerToPath('/')).toEqual(['']);
    expect(pointerToPath('/a//b')).toEqual(['a', '', 'b']);
  });

  it('should throw error for invalid pointer (not starting with /)', () => {
    expect(() => pointerToPath('user')).toThrow();
    expect(() => pointerToPath('user/name')).toThrow();
  });

  it('should be inverse of pathToPointer', () => {
    const testCases = [
      [],
      ['user'],
      ['user', 'name'],
      ['items', '0'],
      ['a/b'],
      ['c~d'],
      [''],
      ['a', '', 'b'],
    ];

    for (const path of testCases) {
      expect(pointerToPath(pathToPointer(path))).toEqual(path.map(String));
    }
  });
});

describe('isPointerPrefix', () => {
  it('should return true for exact match', () => {
    expect(isPointerPrefix('/user', '/user')).toBe(true);
    expect(isPointerPrefix('/user/name', '/user/name')).toBe(true);
    expect(isPointerPrefix('', '')).toBe(true);
  });

  it('should return true when root is prefix', () => {
    expect(isPointerPrefix('', '/user')).toBe(true);
    expect(isPointerPrefix('', '/user/name')).toBe(true);
    expect(isPointerPrefix('', '/anything')).toBe(true);
  });

  it('should return true for valid parent-child relationship', () => {
    expect(isPointerPrefix('/user', '/user/name')).toBe(true);
    expect(isPointerPrefix('/user', '/user/profile/address')).toBe(true);
    expect(isPointerPrefix('/items', '/items/0')).toBe(true);
    expect(isPointerPrefix('/items/0', '/items/0/name')).toBe(true);
  });

  it('should return false for similar but different paths (boundary check)', () => {
    // This is the critical test - '/user' should NOT match '/users'
    expect(isPointerPrefix('/user', '/users')).toBe(false);
    expect(isPointerPrefix('/user', '/userName')).toBe(false);
    expect(isPointerPrefix('/item', '/items')).toBe(false);
    expect(isPointerPrefix('/foo', '/foobar')).toBe(false);
  });

  it('should return false for unrelated paths', () => {
    expect(isPointerPrefix('/user', '/settings')).toBe(false);
    expect(isPointerPrefix('/user/name', '/user/age')).toBe(false);
    expect(isPointerPrefix('/items/0', '/items/1')).toBe(false);
  });

  it('should return false when prefix is longer than path', () => {
    expect(isPointerPrefix('/user/name', '/user')).toBe(false);
    expect(isPointerPrefix('/user/profile/address', '/user')).toBe(false);
  });

  it('should handle paths with escaped characters', () => {
    expect(isPointerPrefix('/a~1b', '/a~1b/c')).toBe(true);
    expect(isPointerPrefix('/a~1b', '/a~1bc')).toBe(false); // boundary check
  });
});

describe('arePointersRelated', () => {
  it('should return true for exact match', () => {
    expect(arePointersRelated('/user', '/user')).toBe(true);
  });

  it('should return true for parent-child relationship (either direction)', () => {
    expect(arePointersRelated('/user', '/user/name')).toBe(true);
    expect(arePointersRelated('/user/name', '/user')).toBe(true);
  });

  it('should return true when one is root', () => {
    expect(arePointersRelated('', '/user')).toBe(true);
    expect(arePointersRelated('/user', '')).toBe(true);
  });

  it('should return false for unrelated paths', () => {
    expect(arePointersRelated('/user', '/settings')).toBe(false);
    expect(arePointersRelated('/items/0', '/items/1')).toBe(false);
  });

  it('should return false for similar but different paths', () => {
    expect(arePointersRelated('/user', '/users')).toBe(false);
    expect(arePointersRelated('/users', '/user')).toBe(false);
  });
});

describe('RFC 6901 Compliance', () => {
  /**
   * RFC 6901 Section 5 Examples
   *
   * Given the JSON document:
   * {
   *   "foo": ["bar", "baz"],
   *   "": 0,
   *   "a/b": 1,
   *   "c%d": 2,
   *   "e^f": 3,
   *   "g|h": 4,
   *   "i\\j": 5,
   *   "k\"l": 6,
   *   " ": 7,
   *   "m~n": 8
   * }
   */
  it('should handle RFC 6901 Section 5 examples', () => {
    // "" → whole document
    expect(pathToPointer([])).toBe('');

    // "/foo" → ["bar", "baz"]
    expect(pathToPointer(['foo'])).toBe('/foo');

    // "/foo/0" → "bar"
    expect(pathToPointer(['foo', 0])).toBe('/foo/0');

    // "/" → 0 (empty string key)
    expect(pathToPointer([''])).toBe('/');

    // "/a~1b" → 1
    expect(pathToPointer(['a/b'])).toBe('/a~1b');

    // "/c%d" → 2 (% is not escaped in JSON Pointer, only in URI fragment)
    expect(pathToPointer(['c%d'])).toBe('/c%d');

    // "/e^f" → 3
    expect(pathToPointer(['e^f'])).toBe('/e^f');

    // "/g|h" → 4
    expect(pathToPointer(['g|h'])).toBe('/g|h');

    // "/i\\j" → 5
    expect(pathToPointer(['i\\j'])).toBe('/i\\j');

    // "/k\"l" → 6
    expect(pathToPointer(['k"l'])).toBe('/k"l');

    // "/ " → 7 (space)
    expect(pathToPointer([' '])).toBe('/ ');

    // "/m~0n" → 8
    expect(pathToPointer(['m~n'])).toBe('/m~0n');
  });

  it('should handle roundtrip for RFC 6901 examples', () => {
    const examples = [
      '',
      '/foo',
      '/foo/0',
      '/',
      '/a~1b',
      '/c%d',
      '/e^f',
      '/g|h',
      '/i\\j',
      '/k"l',
      '/ ',
      '/m~0n',
    ];

    for (const pointer of examples) {
      const path = pointerToPath(pointer);
      const back = pathToPointer(path);
      expect(back).toBe(pointer);
    }
  });
});

describe('Edge cases', () => {
  it('should handle very long paths', () => {
    const longPath = Array(100).fill('segment');
    const pointer = pathToPointer(longPath);
    expect(pointer.startsWith('/')).toBe(true);
    expect(pointer.split('/').length).toBe(101); // 100 segments + empty first split
  });

  it('should handle numeric string keys (not array indices)', () => {
    // In JSON, object keys are always strings, so "0" as a key is valid
    expect(pathToPointer(['0'])).toBe('/0');
    expect(pathToPointer(['123'])).toBe('/123');
    // This is the same as numeric index in pointer format
    // Disambiguation happens at the application level, not pointer level
  });

  it('should handle consecutive slashes in key', () => {
    expect(pathToPointer(['a//b'])).toBe('/a~1~1b');
    expect(unescapeSegment('a~1~1b')).toBe('a//b');
  });

  it('should handle consecutive tildes in key', () => {
    expect(pathToPointer(['a~~b'])).toBe('/a~0~0b');
    expect(unescapeSegment('a~0~0b')).toBe('a~~b');
  });

  it('should handle keys with only special characters', () => {
    expect(pathToPointer(['~'])).toBe('/~0');
    expect(pathToPointer(['/'])).toBe('/~1');
    expect(pathToPointer(['~/'])).toBe('/~0~1');
    expect(pathToPointer(['/~'])).toBe('/~1~0');
  });
});
