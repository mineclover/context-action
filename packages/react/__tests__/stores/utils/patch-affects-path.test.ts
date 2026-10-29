import { patchesAffectPath, type StorePathPatch } from '../../../src/stores/utils/patch-affects-path';

describe('engine-neutral patch path matching', () => {
  it.each<{
    name: string;
    patch: StorePathPatch;
    target: readonly (string | number)[];
    affected: boolean;
  }>([
    { name: 'readonly array path', patch: { op: 'replace', path: ['user', 'name'] }, target: ['user', 'name'], affected: true },
    { name: 'unrelated replacement', patch: { op: 'replace', path: ['user', 'name'] }, target: ['settings'], affected: false },
    { name: 'JSON Pointer escaping', patch: { op: 'replace', path: '/a~1b/~0key' }, target: ['a/b', '~key'], affected: true },
    { name: 'empty property', patch: { op: 'replace', path: '/' }, target: [''], affected: true },
    { name: 'single-pass escape decoding', patch: { op: 'replace', path: '/~01' }, target: ['~1'], affected: true },
    { name: 'numeric pointer index', patch: { op: 'replace', path: '/items/1/name' }, target: ['items', 1, 'name'], affected: true },
    { name: 'numeric array segment and string property', patch: { op: 'replace', path: ['items', 1] }, target: ['items', '1'], affected: true },
    { name: 'distinct numeric-looking property', patch: { op: 'replace', path: '/items/01' }, target: ['items', 1], affected: false },
    { name: 'pointer root', patch: { op: 'replace', path: '' }, target: ['any'], affected: true },
    { name: 'array root', patch: { op: 'replace', path: [] }, target: ['any'], affected: true },
    { name: 'pointer truncation', patch: { op: 'replace', path: '/items/length' }, target: ['items', 4], affected: true },
    { name: 'remove shifts later index', patch: { op: 'remove', path: '/items/0' }, target: ['items', 2], affected: true },
    { name: 'copy inserts and shifts destination', patch: { op: 'copy', from: '/source', path: '/items/0' }, target: ['items', 2], affected: true },
    { name: 'copy does not mutate source', patch: { op: 'copy', from: '/source/name', path: '/dest/name' }, target: ['source', 'name'], affected: false },
    { name: 'move invalidates source', patch: { op: 'move', from: '/source/name', path: '/dest/name' }, target: ['source', 'name'], affected: true },
    { name: 'move shifts source array', patch: { op: 'move', from: ['source', 0], path: ['dest', 0] }, target: ['source', 2], affected: true },
    { name: 'move does not invalidate unrelated subtree', patch: { op: 'move', from: '/source/0', path: '/dest/0' }, target: ['other'], affected: false },
    { name: 'malformed pointer falls back', patch: { op: 'replace', path: 'user.name' }, target: ['other'], affected: true },
    { name: 'invalid pointer escape falls back', patch: { op: 'replace', path: '/user/~2' }, target: ['other'], affected: true },
    { name: 'incomplete pointer escape falls back', patch: { op: 'replace', path: '/user/~' }, target: ['other'], affected: true },
    { name: 'opaque collection key falls back', patch: { op: 'replace', path: ['map', {}] }, target: ['other'], affected: true },
    { name: 'symbol key falls back', patch: { op: 'replace', path: [Symbol('key')] }, target: ['other'], affected: true },
    { name: 'unknown operation falls back', patch: { op: 'custom', path: ['unrelated'] }, target: ['other'], affected: true },
    { name: 'missing move source falls back', patch: { op: 'move', path: ['dest'] }, target: ['other'], affected: true },
  ])('$name', ({ patch, target, affected }) => {
    const patches: readonly StorePathPatch[] = Object.freeze([Object.freeze(patch)]);
    expect(patchesAffectPath(patches, target)).toBe(affected);
  });

  it.each([null, []])('keeps unknown/empty patch notifications conservative: %j', patches => {
    expect(patchesAffectPath(patches, ['any'])).toBe(true);
  });
});
